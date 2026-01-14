import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function validateType(type: unknown): type is "quotes" | "candles" | "search" {
  return type === "quotes" || type === "candles" || type === "search";
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
    // Authentication is optional for market data - allow public access for viewing
    // This enables charts to work on landing pages and for non-logged-in users
    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;
    
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
      isAuthenticated = !claimsError && !!claimsData?.claims;
    }
    
    // Log access for monitoring (authenticated vs anonymous)
    console.log(`Market data request - authenticated: ${isAuthenticated}`);

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

    const FINNHUB_API_KEY = Deno.env.get("FINHUB_API_KEY");
    
    if (!FINNHUB_API_KEY) {
      console.error("FINHUB_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch quotes for multiple symbols
    if (type === "quotes") {
      const quotes = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const encodedSymbol = encodeURIComponent(symbol.toUpperCase());
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
          } catch (error) {
            console.error(`Error fetching ${symbol}:`, error);
            return { symbol, error: true };
          }
        })
      );

      return new Response(JSON.stringify({ quotes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch candlestick data for a single symbol
    if (type === "candles") {
      const symbol = symbols[0];
      const encodedSymbol = encodeURIComponent(symbol.toUpperCase());
      
      // Use resolution and days from request, with defaults
      const candleResolution = resolution || "D";
      const candleDays = days || 30;
      
      // Calculate time range
      const to = Math.floor(Date.now() / 1000);
      const from = to - candleDays * 24 * 60 * 60;
      
      console.log(`Fetching ${symbol} candles: resolution=${candleResolution}, days=${candleDays}`);

      const finnhubResponse = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodedSymbol}&resolution=${candleResolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      const finnhubData = await finnhubResponse.json();
      
      console.log(`Finnhub candle response for ${symbol}:`, finnhubData.s);

      // If Finnhub has data, use it
      if (finnhubData.s === "ok" && finnhubData.t?.length > 0) {
        const dateFormat = getDateFormat(candleResolution);
        const candles = finnhubData.t.map((timestamp: number, i: number) => ({
          date: formatDate(timestamp * 1000, dateFormat),
          timestamp,
          open: finnhubData.o[i],
          high: finnhubData.h[i],
          low: finnhubData.l[i],
          close: finnhubData.c[i],
          volume: finnhubData.v[i],
        }));

        return new Response(JSON.stringify({ candles, resolution: candleResolution }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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
            return new Response(JSON.stringify({ candles }), {
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

      // Final fallback: Generate synthetic chart data based on current quote
      console.log(`Generating synthetic candles for ${symbol}`);
      try {
        const quoteResponse = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${encodedSymbol}&token=${FINNHUB_API_KEY}`
        );
        const quote = await quoteResponse.json();
        
        if (quote.c && quote.c > 0) {
          const currentPrice = quote.c;
          const volatility = 0.02; // 2% daily volatility
          const candles = [];
          
          let price = currentPrice * (1 - volatility * 15); // Start lower for uptrend effect
          
          for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            const change = (Math.random() - 0.45) * volatility * price; // Slight upward bias
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5);
            const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5);
            
            candles.push({
              date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              timestamp: date.getTime() / 1000,
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

          return new Response(JSON.stringify({ candles, synthetic: true }), {
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
