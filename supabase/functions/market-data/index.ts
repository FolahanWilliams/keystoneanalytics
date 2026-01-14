import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, type } = await req.json();
    const FINNHUB_API_KEY = Deno.env.get("FINHUB_API_KEY");
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINHUB_API_KEY is not configured");
    }

    // Fetch quotes for multiple symbols
    if (type === "quotes") {
      const quotes = await Promise.all(
        symbols.map(async (symbol: string) => {
          try {
            const response = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
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
      const resolution = "D"; // Daily
      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 60 * 60; // 30 days

      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
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
      const response = await fetch(
        `https://finnhub.io/api/v1/search?q=${query}&token=${FINNHUB_API_KEY}`
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
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
