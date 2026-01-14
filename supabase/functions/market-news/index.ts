import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Allowed categories for news
const ALLOWED_CATEGORIES = ["general", "forex", "crypto", "merger"];

function validateCategory(category: unknown): category is string {
  return typeof category === "string" && ALLOWED_CATEGORIES.includes(category);
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

    const body = await req.json();
    const category = body?.category ?? "general";

    // Validate category
    if (!validateCategory(category)) {
      return new Response(
        JSON.stringify({ error: `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(", ")}` }),
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

    const encodedCategory = encodeURIComponent(category);
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=${encodedCategory}&token=${FINNHUB_API_KEY}`
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
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
