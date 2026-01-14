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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { symbols, type } = await req.json();
    
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
      const resolution = "D"; // Daily
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 60 * 60; // 30 days

      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodedSymbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
      );
      const data = await response.json();

      if (data.s === "no_data") {
        return new Response(JSON.stringify({ candles: [], error: "No data available" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const candles = data.t?.map((timestamp: number, i: number) => ({
        date: new Date(timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp,
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      })) || [];

      return new Response(JSON.stringify({ candles }), {
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
