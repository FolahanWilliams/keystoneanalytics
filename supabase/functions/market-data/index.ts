import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getUserTier, 
  getUserIdFromAuth,
  maskQuoteFields,
  maskPremiumFields,
  PREMIUM_FUNDAMENTAL_FIELDS,
  type SubscriptionTier 
} from "../_shared/tierCheck.ts";
import { 
  rateLimitMiddleware, 
  RATE_LIMITS 
} from "../_shared/rateLimit.ts";
import {
  withCircuitBreaker,
  DEFAULT_CIRCUIT_CONFIG,
  getCircuitInfo,
  CircuitState,
} from "../_shared/circuitBreaker.ts";
import { fetchWithRetry, LIGHT_RETRY_CONFIG } from "../_shared/retry.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation patterns
const SYMBOL_REGEX = /^[A-Za-z0-9.-]{1,10}$/;
const MAX_SYMBOLS = 50;

function validateSymbol(symbol: string): boolean {
  return typeof symbol === "string" && SYMBOL_REGEX.test(symbol);
}

function validateSymbols(symbols: unknown): symbols is string[] {
  return (
    Array.isArray(symbols) &&
    symbols.length > 0 &&
    symbols.length <= MAX_SYMBOLS &&
    symbols.every(validateSymbol)
  );
}

function validateType(type: unknown): type is "quotes" | "candles" | "search" | "fundamentals" {
  return type === "quotes" || type === "candles" || type === "search" || type === "fundamentals";
}

// Circuit breaker configurations for each provider
const FMP_CIRCUIT = { ...DEFAULT_CIRCUIT_CONFIG, name: "fmp-api" };
const FINNHUB_CIRCUIT = { ...DEFAULT_CIRCUIT_CONFIG, name: "finnhub-api" };
const ALPHA_VANTAGE_CIRCUIT = { ...DEFAULT_CIRCUIT_CONFIG, name: "alpha-vantage-api" };

// ======================= In-memory candle cache =======================
// TTL in milliseconds – synchronized with client cache for consistent behavior
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

interface CacheEntry {
  data: unknown;
  createdAt: number;
}

const candleCache = new Map<string, CacheEntry>();

function getCacheKey(symbol: string, resolution: string, days: number): string {
  return `${symbol.toUpperCase()}::${resolution}::${days}`;
}

function getFromCache(key: string): unknown | null {
  const entry = candleCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    candleCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  candleCache.set(key, { data, createdAt: Date.now() });
  // Prevent cache from growing unbounded – evict oldest entries if size > 200
  if (candleCache.size > 200) {
    const oldest = candleCache.keys().next().value;
    if (oldest) candleCache.delete(oldest);
  }
}
// ======================================================================

// ---- Candle aggregation helpers (makes unsupported provider resolutions still work) ----

type RawCandle = {
  timestamp: number; // seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

function bucketStartTs(resolution: string, tsSec: number): number {
  const date = new Date(tsSec * 1000);

  switch (resolution) {
    case "240": {
      const bucket = Math.floor(tsSec / (4 * 60 * 60)) * (4 * 60 * 60);
      return bucket;
    }
    case "W": {
      // Monday 00:00 UTC
      const day = date.getUTCDay(); // 0=Sun
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      monday.setUTCDate(monday.getUTCDate() - diffToMonday);
      return Math.floor(monday.getTime() / 1000);
    }
    case "M": {
      const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
      return Math.floor(monthStart.getTime() / 1000);
    }
    default:
      return tsSec;
  }
}

function aggregateCandles(raw: RawCandle[], targetResolution: string): RawCandle[] {
  if (raw.length === 0) return [];
  if (!["240", "W", "M"].includes(targetResolution)) return raw;

  const byBucket = new Map<number, RawCandle & { _firstTs: number; _lastTs: number }>();

  for (const c of raw) {
    const bucket = bucketStartTs(targetResolution, c.timestamp);
    const existing = byBucket.get(bucket);
    if (!existing) {
      byBucket.set(bucket, {
        timestamp: bucket,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume,
        _firstTs: c.timestamp,
        _lastTs: c.timestamp,
      });
      continue;
    }

    // Update OHLCV
    if (c.timestamp < existing._firstTs) {
      existing._firstTs = c.timestamp;
      existing.open = c.open;
    }
    if (c.timestamp > existing._lastTs) {
      existing._lastTs = c.timestamp;
      existing.close = c.close;
    }

    existing.high = Math.max(existing.high, c.high);
    existing.low = Math.min(existing.low, c.low);
    existing.volume += c.volume;
  }

  return Array.from(byBucket.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ _firstTs: _a, _lastTs: _b, ...rest }) => rest);
}

// NOTE: We intentionally standardize all candle dates for the frontend charting library.
// Every candle returned to the client must include a `date` string in strict YYYY-MM-DD format.

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user auth and tier for paywall enforcement
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const userId = await getUserIdFromAuth(authHeader, supabaseUrl, anonKey);
    const tier: SubscriptionTier = userId ? await getUserTier(userId) : 'free';

    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(
      req,
      RATE_LIMITS.MARKET_DATA,
      corsHeaders,
      userId || undefined
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    console.log(`Market data request - userId: ${userId}, tier: ${tier}`);

    const { symbols, type, resolution, days } = await req.json();

    // Validate request type
    if (!validateType(type)) {
      return new Response(
        JSON.stringify({ error: "Invalid request type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate symbols
    if (!validateSymbols(symbols)) {
      return new Response(
        JSON.stringify({ error: "Invalid symbols format. Expected array of 1-50 valid ticker symbols." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FMP_API_KEY = Deno.env.get("FMP_API_KEY");
    // Support both secret names for backward compatibility
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY") || Deno.env.get("FINHUB_API_KEY");

    if (!FMP_API_KEY && !FINNHUB_API_KEY) {
      console.error("No market data API keys configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log circuit breaker states for monitoring
    console.log(`Circuit states - FMP: ${getCircuitInfo("fmp-api").state}, Finnhub: ${getCircuitInfo("finnhub-api").state}, AV: ${getCircuitInfo("alpha-vantage-api").state}`);

    // Fetch quotes for multiple symbols - FMP primary, Finnhub fallback
    if (type === "quotes") {
      const quotes = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const encodedSymbol = encodeURIComponent(symbol.toUpperCase());
            
            // Primary: Financial Modeling Prep for real-time data
            if (FMP_API_KEY) {
              try {
                const fmpResponse = await fetch(
                  `https://financialmodelingprep.com/api/v3/quote/${encodedSymbol}?apikey=${FMP_API_KEY}`
                );
                const fmpData = await fmpResponse.json();
                
                if (Array.isArray(fmpData) && fmpData.length > 0) {
                  const q = fmpData[0];
                  return {
                    symbol,
                    price: q.price || 0,
                    change: q.change || 0,
                    changePercent: q.changesPercentage || 0,
                    high: q.dayHigh || 0,
                    low: q.dayLow || 0,
                    open: q.open || 0,
                    previousClose: q.previousClose || 0,
                    timestamp: q.timestamp || Date.now() / 1000,
                    marketCap: q.marketCap,
                    pe: q.pe,
                    eps: q.eps,
                    volume: q.volume,
                    avgVolume: q.avgVolume,
                    yearHigh: q.yearHigh,
                    yearLow: q.yearLow,
                  };
                }
              } catch (fmpError) {
                console.error(`FMP error for ${symbol}:`, fmpError);
              }
            }
            
            // Fallback: Finnhub
            if (FINNHUB_API_KEY) {
              const response = await fetch(
                `https://finnhub.io/api/v1/quote?symbol=${encodedSymbol}&token=${FINNHUB_API_KEY}`
              );
              const data = await response.json();

              return {
                symbol,
                price: data.c || 0,
                change: data.d || 0,
                changePercent: data.dp || 0,
                high: data.h || 0,
                low: data.l || 0,
                open: data.o || 0,
                previousClose: data.pc || 0,
                timestamp: data.t || Date.now() / 1000,
              };
            }
            
            return { symbol, error: true };
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return { symbol, error: true };
          }
        })
      );

      // Apply tier-based masking to premium quote fields
      const maskedQuotes = quotes.map(q => maskQuoteFields(q, tier));

      return new Response(JSON.stringify({ quotes: maskedQuotes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company fundamentals from FMP
    if (type === "fundamentals") {
      const symbol = symbols[0];
      const encodedSymbol = encodeURIComponent(symbol.toUpperCase());

      if (!FMP_API_KEY) {
        return new Response(
          JSON.stringify({ error: "Fundamentals data requires FMP API key" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Fetch company profile and key metrics in parallel
        const [profileRes, metricsRes, incomeRes] = await Promise.all([
          fetch(`https://financialmodelingprep.com/api/v3/profile/${encodedSymbol}?apikey=${FMP_API_KEY}`),
          fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${encodedSymbol}?apikey=${FMP_API_KEY}`),
          fetch(`https://financialmodelingprep.com/api/v3/income-statement/${encodedSymbol}?limit=1&apikey=${FMP_API_KEY}`)
        ]);

        const [profileData, metricsData, incomeData] = await Promise.all([
          profileRes.json(),
          metricsRes.json(),
          incomeRes.json()
        ]);

        const profile = Array.isArray(profileData) ? profileData[0] : null;
        const metrics = Array.isArray(metricsData) ? metricsData[0] : null;
        const income = Array.isArray(incomeData) ? incomeData[0] : null;

        if (!profile) {
          return new Response(
            JSON.stringify({ error: `No fundamentals data found for ${symbol}` }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const fundamentals = {
          symbol: profile.symbol,
          companyName: profile.companyName,
          sector: profile.sector,
          industry: profile.industry,
          marketCap: profile.mktCap,
          pe: profile.pe || metrics?.peRatioTTM,
          eps: income?.eps || metrics?.netIncomePerShareTTM,
          revenue: income?.revenue || metrics?.revenuePerShareTTM * (profile.mktCap / profile.price),
          netIncome: income?.netIncome,
          profitMargin: metrics?.netProfitMarginTTM || (income?.netIncome / income?.revenue),
          beta: profile.beta,
          dividendYield: profile.lastDiv ? profile.lastDiv / profile.price : 0,
          employees: profile.fullTimeEmployees,
          exchange: profile.exchange,
          country: profile.country,
          description: profile.description,
          website: profile.website,
        };

        console.log(`FMP fundamentals for ${symbol}: ${profile.companyName}, tier=${tier}`);

        // Apply tier-based masking to premium fundamental fields
        const maskedFundamentals = maskPremiumFields(
          fundamentals,
          tier,
          PREMIUM_FUNDAMENTAL_FIELDS
        );

        return new Response(JSON.stringify({ fundamentals: maskedFundamentals }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error(`Error fetching fundamentals for ${symbol}:`, error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch fundamentals data" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch candlestick data for a single symbol
    if (type === "candles") {
      const symbol = symbols[0];
      const encodedSymbol = encodeURIComponent(symbol.toUpperCase());

      // Use resolution and days from request, with defaults
      const candleResolution = resolution || "D";
      const candleDays = days || 30;

      // ---- Check cache first ----
      const cacheKey = getCacheKey(symbol, candleResolution, candleDays);
      const cached = getFromCache(cacheKey);
      if (cached) {
        console.log(`[CACHE HIT] ${cacheKey}`);
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[CACHE MISS] ${cacheKey}`);

      // Calculate time range
      const to = Math.floor(Date.now() / 1000);
      const from = to - candleDays * 24 * 60 * 60;

      console.log(`Fetching ${symbol} candles: resolution=${candleResolution}, days=${candleDays}`);

      // PRIMARY: FMP intraday for 1H and 4H resolutions using stable API
      if (FMP_API_KEY && (candleResolution === "60" || candleResolution === "240")) {
        try {
          // FMP stable intraday endpoint format: /stable/historical-chart/{interval}?symbol=AAPL
          const fmpInterval = candleResolution === "60" ? "1hour" : "4hour";
          const fmpIntradayRes = await fetch(
            `https://financialmodelingprep.com/stable/historical-chart/${fmpInterval}?symbol=${encodedSymbol}&apikey=${FMP_API_KEY}`
          );
          const fmpIntradayData = await fmpIntradayRes.json();
          
          console.log(`FMP intraday ${fmpInterval} response for ${symbol}:`, 
            JSON.stringify(fmpIntradayData).substring(0, 300));
          
          if (Array.isArray(fmpIntradayData) && fmpIntradayData.length > 0) {
            // Slice to requested number of candles based on days config
            const maxCandles = candleResolution === "60" ? 48 : 60; // 2 days * 24 or 10 days * 6
            const slicedData = fmpIntradayData.slice(0, maxCandles).reverse();
            
            const candles = slicedData.map((d: any) => ({
              date: d.date.split(' ')[0], // Extract YYYY-MM-DD from "2024-01-15 09:30:00"
              timestamp: new Date(d.date).getTime() / 1000,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              volume: d.volume,
            }));
            
            const payload = { candles, resolution: candleResolution, source: "fmp" };
            setCache(cacheKey, payload);
            console.log(`FMP ${fmpInterval} candles for ${symbol}: ${candles.length}`);
            
            return new Response(JSON.stringify(payload), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (fmpError) {
          console.error(`FMP intraday error for ${symbol}:`, fmpError);
        }
      }

      // PRIMARY: FMP for daily/weekly/monthly candles
      if (FMP_API_KEY && (candleResolution === "D" || candleResolution === "W" || candleResolution === "M")) {
        try {
          // Use FMP's stable API endpoint with full OHLC data (not light version)
          const fmpHistRes = await fetch(
            `https://financialmodelingprep.com/stable/historical-price-eod/full?symbol=${encodedSymbol}&apikey=${FMP_API_KEY}`
          );
          const fmpHistData = await fmpHistRes.json();
          
          // Diagnostic logging to identify API failures
          console.log(`FMP historical response for ${symbol}:`, JSON.stringify(fmpHistData).substring(0, 500));
          
          // New API returns array directly, not nested in .historical
          const historicalData = Array.isArray(fmpHistData) ? fmpHistData : fmpHistData.historical;
          
          if (historicalData && historicalData.length > 0) {
            let rawCandles = historicalData.slice(0, candleDays).reverse();
            
            // Aggregate for weekly/monthly if needed
            if (candleResolution === "W" || candleResolution === "M") {
              const raw: RawCandle[] = rawCandles.map((d: any) => ({
                timestamp: new Date(d.date).getTime() / 1000,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close,
                volume: d.volume,
              }));
              const aggregated = aggregateCandles(raw, candleResolution);
              
              const candles = aggregated.map((c) => ({
                date: new Date(c.timestamp * 1000).toISOString().split('T')[0], // YYYY-MM-DD for lightweight-charts
                timestamp: c.timestamp,
                open: c.open,
                high: c.high,
                low: c.low,
                close: c.close,
                volume: c.volume,
              }));
              
              const payload = { candles, resolution: candleResolution, source: "fmp" };
              setCache(cacheKey, payload);
              console.log(`FMP ${candleResolution} candles for ${symbol}: ${candles.length} (aggregated)`);
              
              return new Response(JSON.stringify(payload), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            
            const candles = rawCandles.map((d: any) => ({
              date: d.date, // Keep YYYY-MM-DD format for lightweight-charts
              timestamp: new Date(d.date).getTime() / 1000,
              open: d.open,
              high: d.high,
              low: d.low,
              close: d.close,
              volume: d.volume,
            }));
            
            const payload = { candles, resolution: candleResolution, source: "fmp" };
            setCache(cacheKey, payload);
            console.log(`FMP daily candles for ${symbol}: ${candles.length}`);
            
            return new Response(JSON.stringify(payload), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } catch (fmpError) {
          console.error(`FMP candles error for ${symbol}:`, fmpError);
        }
      }

      // Fallback: Finnhub for intraday resolutions or if FMP fails
      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodedSymbol}&resolution=${candleResolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      const finnhubData = await finnhubResponse.json();

      console.log(`Finnhub candle response for ${symbol}:`, finnhubData.s);

      // If Finnhub has data, use it
      const mapFinnhubToRaw = (fd: any): RawCandle[] => {
        return (fd.t || []).map((timestamp: number, i: number) => ({
          timestamp,
          open: fd.o[i],
          high: fd.h[i],
          low: fd.l[i],
          close: fd.c[i],
          volume: fd.v[i],
        }));
      };

      if (finnhubData.s === "ok" && finnhubData.t?.length > 0) {
        const raw = mapFinnhubToRaw(finnhubData);
        const finalRaw = aggregateCandles(raw, candleResolution);
        const candles = finalRaw.map((c) => ({
          date: new Date(c.timestamp * 1000).toISOString().split('T')[0], // YYYY-MM-DD for lightweight-charts
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        const payload = { candles, resolution: candleResolution, source: "finnhub" };
        setCache(cacheKey, payload);

        return new Response(JSON.stringify(payload), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // IMPORTANT: Do not synthesize/construct candles when the provider doesn't support a resolution.
      // If Finnhub doesn't return data for the requested resolution, we fall through to other providers
      // and ultimately return a structured error object.

      // Fallback to Alpha Vantage for historical data (optimized for short-term strategy)
      const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
      if (ALPHA_VANTAGE_KEY) {
        console.log(`Trying Alpha Vantage for ${symbol}`);
        try {
          // Use outputsize=compact (100 data points) for free tier compatibility
          const avResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodedSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
          );
          const avData = await avResponse.json();
          
          // Diagnostic logging to identify API failures
          console.log(`Alpha Vantage response for ${symbol}:`, JSON.stringify(avData).substring(0, 500));

          if (avData["Time Series (Daily)"]) {
            const timeSeries = avData["Time Series (Daily)"];
            // Slice to requested candleDays (compact returns ~100 days)
            const dates = Object.keys(timeSeries).sort().slice(-candleDays);

            const candles = dates.map((dateStr) => {
              const d = timeSeries[dateStr];
              return {
                date: dateStr, // Keep YYYY-MM-DD format for lightweight-charts
                timestamp: new Date(dateStr).getTime() / 1000,
                open: parseFloat(d["1. open"]),
                high: parseFloat(d["2. high"]),
                low: parseFloat(d["3. low"]),
                close: parseFloat(d["4. close"]),
                volume: parseInt(d["5. volume"]),
              };
            });

            console.log(`Alpha Vantage returned ${candles.length} candles for ${symbol}`);
            const payload = { candles };
            setCache(cacheKey, payload);

            return new Response(JSON.stringify(payload), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          } else if (avData.Note) {
            console.log("Alpha Vantage rate limited:", avData.Note);
          } else if (avData["Error Message"]) {
            console.log("Alpha Vantage error:", avData["Error Message"]);
          }
        } catch (avError) {
          console.error("Alpha Vantage error:", avError);
        }
      }

      // Final fallback: Return clear error - NO synthetic data generation
      // This ensures all signals shown to users are based on real market data
      console.log(`No historical data available for ${symbol} from any provider`);
      return new Response(
        JSON.stringify({ 
          candles: [], 
          error: "no_data",
          message: "Historical data unavailable from all providers. Try a different symbol or check back later." 
        }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search for symbols
    if (type === "search") {
      const query = symbols[0];
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodedQuery}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();

      const results = (data.result || []).slice(0, 10).map((item: any) => ({
        symbol: item.symbol,
        name: item.description,
        type: item.type,
      }));

      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
