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

// ======================= In-memory candle cache =======================
// TTL in milliseconds – keep cached data for 30 seconds to allow quick timeframe switching
const CACHE_TTL_MS = 30 * 1000;

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

// Get appropriate date format based on resolution
function getDateFormat(resolution: string): Intl.DateTimeFormatOptions {
  switch (resolution) {
    case "1":
    case "5":
    case "15":
    case "30":
    case "60":
      return { hour: "2-digit", minute: "2-digit" };
    case "240":
      return { month: "short", day: "numeric", hour: "2-digit" };
    case "D":
      return { month: "short", day: "numeric" };
    case "W":
      return { month: "short", day: "numeric" };
    case "M":
      return { month: "short", year: "2-digit" };
    default:
      return { month: "short", day: "numeric" };
  }
}

// Format date with given options
function formatDate(timestamp: number, options: Intl.DateTimeFormatOptions): string {
  return new Date(timestamp).toLocaleDateString("en-US", options);
}

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
    const FINNHUB_API_KEY = Deno.env.get("FINHUB_API_KEY");

    if (!FMP_API_KEY && !FINNHUB_API_KEY) {
      console.error("No market data API keys configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

      // Primary: Try FMP for historical candles (daily resolution)
      if (FMP_API_KEY && (candleResolution === "D" || candleResolution === "W" || candleResolution === "M")) {
        try {
          const fmpHistRes = await fetch(
            `https://financialmodelingprep.com/api/v3/historical-price-full/${encodedSymbol}?timeseries=${candleDays * 2}&apikey=${FMP_API_KEY}`
          );
          const fmpHistData = await fmpHistRes.json();
          
          if (fmpHistData.historical && fmpHistData.historical.length > 0) {
            const dateFormat = getDateFormat(candleResolution);
            let rawCandles = fmpHistData.historical.slice(0, candleDays).reverse();
            
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
                date: formatDate(c.timestamp * 1000, dateFormat),
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
              date: formatDate(new Date(d.date).getTime(), dateFormat),
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
        const dateFormat = getDateFormat(candleResolution);

        const candles = finalRaw.map((c) => ({
          date: formatDate(c.timestamp * 1000, dateFormat),
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        }));

        const payload = { candles, resolution: candleResolution };
        setCache(cacheKey, payload);

        return new Response(JSON.stringify(payload), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If the provider doesn't support this resolution, synthesize it from a supported base resolution
      if (["240", "W", "M"].includes(candleResolution)) {
        const baseResolution = candleResolution === "240" ? "60" : "D";
        console.log(`No data for resolution=${candleResolution}; retrying with base=${baseResolution} and aggregating`);

        const baseRes = await fetch(
          `https://finnhub.io/api/v1/stock/candle?symbol=${encodedSymbol}&resolution=${baseResolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        );
        const baseData = await baseRes.json();

        if (baseData.s === "ok" && baseData.t?.length > 0) {
          const raw = mapFinnhubToRaw(baseData);
          const aggregated = aggregateCandles(raw, candleResolution);
          const dateFormat = getDateFormat(candleResolution);

          const candles = aggregated.map((c) => ({
            date: formatDate(c.timestamp * 1000, dateFormat),
            timestamp: c.timestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          }));

          const payload = { candles, resolution: candleResolution, aggregatedFrom: baseResolution };
          setCache(cacheKey, payload);

          return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Fallback to Alpha Vantage for historical data
      const ALPHA_VANTAGE_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY");
      if (ALPHA_VANTAGE_KEY) {
        console.log(`Trying Alpha Vantage for ${symbol}`);
        try {
          const avResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodedSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
          );
          const avData = await avResponse.json();

          if (avData["Time Series (Daily)"]) {
            const timeSeries = avData["Time Series (Daily)"];
            const dates = Object.keys(timeSeries).sort().slice(-30); // Last 30 days

            const candles = dates.map((dateStr) => {
              const d = timeSeries[dateStr];
              return {
                date: new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
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

      // Final fallback: Generate synthetic chart data based on current quote and resolution
      console.log(`Generating synthetic candles for ${symbol} with resolution=${candleResolution}, days=${candleDays}`);
      try {
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodedSymbol}&token=${FINNHUB_API_KEY}`
        );
        const quote = await quoteResponse.json();

        if (quote.c && quote.c > 0) {
          const currentPrice = quote.c;
          const candles = [];

          // Determine number of candles and time step based on resolution
          let numCandles: number;
          let timeStepMs: number;
          let volatility: number;
          let dateFormatOptions: Intl.DateTimeFormatOptions;

          switch (candleResolution) {
            case "1":
              numCandles = Math.min(60, candleDays * 60 * 24);
              timeStepMs = 60 * 1000; // 1 minute
              volatility = 0.001;
              dateFormatOptions = { hour: "2-digit", minute: "2-digit" };
              break;
            case "5":
              numCandles = Math.min(120, candleDays * 12 * 24);
              timeStepMs = 5 * 60 * 1000;
              volatility = 0.002;
              dateFormatOptions = { hour: "2-digit", minute: "2-digit" };
              break;
            case "15":
              numCandles = Math.min(100, candleDays * 4 * 24);
              timeStepMs = 15 * 60 * 1000;
              volatility = 0.003;
              dateFormatOptions = { hour: "2-digit", minute: "2-digit" };
              break;
            case "30":
              numCandles = Math.min(100, candleDays * 2 * 24);
              timeStepMs = 30 * 60 * 1000;
              volatility = 0.004;
              dateFormatOptions = { hour: "2-digit", minute: "2-digit" };
              break;
            case "60":
              numCandles = Math.min(48, candleDays * 24);
              timeStepMs = 60 * 60 * 1000; // 1 hour
              volatility = 0.005;
              dateFormatOptions = { hour: "2-digit", minute: "2-digit" };
              break;
            case "240":
              numCandles = Math.min(60, candleDays * 6);
              timeStepMs = 4 * 60 * 60 * 1000; // 4 hours
              volatility = 0.01;
              dateFormatOptions = { month: "short", day: "numeric", hour: "2-digit" };
              break;
            case "W":
              numCandles = Math.min(52, Math.ceil(candleDays / 7));
              timeStepMs = 7 * 24 * 60 * 60 * 1000; // 1 week
              volatility = 0.04;
              dateFormatOptions = { month: "short", day: "numeric" };
              break;
            case "M":
              numCandles = Math.min(24, Math.ceil(candleDays / 30));
              timeStepMs = 30 * 24 * 60 * 60 * 1000; // 1 month
              volatility = 0.06;
              dateFormatOptions = { month: "short", year: "2-digit" };
              break;
            default: // "D" or daily
              numCandles = Math.min(90, candleDays);
              timeStepMs = 24 * 60 * 60 * 1000; // 1 day
              volatility = 0.02;
              dateFormatOptions = { month: "short", day: "numeric" };
          }

          let price = currentPrice * (1 - volatility * numCandles * 0.3);
          const now = Date.now();

          for (let i = numCandles - 1; i >= 0; i--) {
            const timestamp = now - i * timeStepMs;
            const date = new Date(timestamp);

            // Skip weekends for daily and higher resolutions
            if (
              (candleResolution === "D" || candleResolution === "W") &&
              (date.getDay() === 0 || date.getDay() === 6)
            ) {
              continue;
            }

            const change = (Math.random() - 0.45) * volatility * price;
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
            const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);

            candles.push({
              date: date.toLocaleDateString("en-US", dateFormatOptions),
              timestamp: Math.floor(timestamp / 1000),
              open: parseFloat(open.toFixed(2)),
              high: parseFloat(high.toFixed(2)),
              low: parseFloat(low.toFixed(2)),
              close: parseFloat(close.toFixed(2)),
              volume: Math.floor(Math.random() * 10000000) + 1000000,
            });

            price = close;
          }

          // Adjust last candle to match current price
          if (candles.length > 0) {
            candles[candles.length - 1].close = currentPrice;
            candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, currentPrice);
            candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, currentPrice);
          }

          console.log(`Generated ${candles.length} synthetic candles for ${symbol}`);
          const payload = { candles, synthetic: true, resolution: candleResolution };
          setCache(cacheKey, payload);

          return new Response(JSON.stringify(payload), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (synthError) {
        console.error("Synthetic candle generation error:", synthError);
      }

      return new Response(JSON.stringify({ candles: [], error: "No historical data available" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
