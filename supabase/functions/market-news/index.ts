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
    const { category = "general" } = await req.json();
    const FINNHUB_API_KEY = Deno.env.get("FINHUB_API_KEY");
    
    if (!FINNHUB_API_KEY) {
      throw new Error("FINHUB_API_KEY is not configured");
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=${category}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();

    const news = (data || []).slice(0, 20).map((item: any) => {
      // Simple sentiment analysis based on keywords
      const headline = (item.headline || "").toLowerCase();
      let sentiment: "bullish" | "bearish" | "neutral" = "neutral";
      
      const bullishKeywords = ["surge", "rally", "gain", "rise", "jump", "soar", "boost", "growth", "record", "high"];
      const bearishKeywords = ["fall", "drop", "plunge", "crash", "decline", "loss", "cut", "down", "low", "fear"];
      
      const bullishScore = bullishKeywords.filter(k => headline.includes(k)).length;
      const bearishScore = bearishKeywords.filter(k => headline.includes(k)).length;
      
      if (bullishScore > bearishScore) sentiment = "bullish";
      else if (bearishScore > bullishScore) sentiment = "bearish";

      // Extract tickers from related field or headline
      const tickers = item.related ? item.related.split(",").slice(0, 3) : [];

      // Calculate relative time
      const timestamp = item.datetime * 1000;
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      let relativeTime = "";
      if (diffMins < 60) relativeTime = `${diffMins} min ago`;
      else if (diffHours < 24) relativeTime = `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
      else relativeTime = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

      return {
        id: item.id?.toString() || Math.random().toString(36).slice(2),
        headline: item.headline,
        summary: item.summary,
        source: item.source,
        url: item.url,
        image: item.image,
        timestamp: relativeTime,
        datetime: timestamp,
        sentiment,
        tickers,
        category: item.category,
      };
    });

    return new Response(JSON.stringify({ news }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market news error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
