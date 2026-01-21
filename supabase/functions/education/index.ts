import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EducationRequest {
  topic: string;
  context?: {
    symbol?: string;
    price?: number;
    change?: number;
    indicator?: string;
    indicatorValue?: number;
    rsi?: number;
    macd?: number;
  };
  level?: "beginner" | "intermediate" | "advanced";
}

const TOPIC_PROMPTS: Record<string, string> = {
  rsi: `Explain the Relative Strength Index (RSI) indicator in trading. Cover what it measures (momentum), how to interpret overbought (>70) and oversold (<30) conditions, and common trading strategies. Make it practical and actionable.`,
  
  macd: `Explain the MACD (Moving Average Convergence Divergence) indicator. Cover the signal line, histogram, and how traders use crossovers and divergences to identify trends and potential reversals.`,
  
  moving_average: `Explain moving averages in trading (SMA and EMA). Cover how they smooth price data, identify trends, and act as dynamic support/resistance. Mention the significance of common periods like 20, 50, and 200-day averages.`,
  
  volume: `Explain volume analysis in trading. Cover how volume confirms price movements, what volume spikes indicate, and how to use volume to validate breakouts and identify potential reversals.`,
  
  bollinger_bands: `Explain Bollinger Bands indicator. Cover how the bands measure volatility, what price touching the bands means, and strategies like the squeeze and mean reversion.`,
  
  divergence: `Explain divergences in technical analysis. Cover bullish and bearish divergences, hidden divergences, and how they signal potential trend reversals. Use practical examples.`,
  
  support_resistance: `Explain support and resistance levels in trading. Cover how to identify them, why they form (supply/demand), and how traders use them for entries, exits, and stop-losses.`,
  
  risk_management: `Explain position sizing and risk management. Cover the 1-2% rule, risk-reward ratios, stop-loss placement, and how proper risk management protects capital.`,
  
  pe_ratio: `Explain the P/E (Price-to-Earnings) ratio. Cover what it measures, how to compare it to industry averages, forward vs trailing P/E, and limitations of this metric.`,
  
  market_cap: `Explain market capitalization. Cover how it's calculated, what different cap sizes mean (small/mid/large), and how it relates to risk and growth potential.`,
  
  volatility: `Explain volatility in trading. Cover what causes it, how to measure it (ATR, VIX), and strategies for trading in high vs low volatility environments.`,
  
  candlestick_patterns: `Explain key candlestick patterns. Cover bullish patterns (hammer, engulfing) and bearish patterns (shooting star, dark cloud cover), and what they signal about market psychology.`,
  
  trend_analysis: `Explain trend identification and analysis. Cover uptrends, downtrends, sideways markets, trendlines, and how to trade with the trend for higher probability setups.`,
  
  sector_rotation: `Explain sector rotation in investing. Cover economic cycles, which sectors perform in different phases, and how to position portfolios accordingly.`,
  
  earnings: `Explain earnings reports and their impact on stocks. Cover EPS, revenue beats/misses, guidance, and how to trade around earnings announcements.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { topic, context, level = "beginner" }: EducationRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the prompt
    let basePrompt = TOPIC_PROMPTS[topic] || `Explain the concept of "${topic}" in trading and investing. Make it clear and practical.`;
    
    // Customize for skill level
    const levelInstructions = {
      beginner: "Explain this for someone new to trading. Use simple language, avoid jargon, and include relatable analogies. Focus on the 'what' and 'why' before the 'how'.",
      intermediate: "Explain this for someone with basic trading knowledge. Include more technical details and practical application strategies.",
      advanced: "Explain this for an experienced trader. Include nuanced details, edge cases, and professional-level insights."
    };

    // Add context if available
    let contextualInfo = "";
    if (context?.symbol) {
      contextualInfo += `\n\nThe user is currently viewing ${context.symbol}`;
      if (context.price) contextualInfo += ` trading at $${context.price.toFixed(2)}`;
      if (context.change !== undefined) contextualInfo += ` (${context.change >= 0 ? '+' : ''}${context.change.toFixed(2)}%)`;
      if (context.rsi !== undefined) contextualInfo += `. Current RSI: ${context.rsi.toFixed(1)}`;
      if (context.macd !== undefined) contextualInfo += `. MACD: ${context.macd.toFixed(2)}`;
      contextualInfo += `. Relate your explanation specifically to this stock's current situation when relevant.`;
    }

    const systemPrompt = `You are an expert trading educator who makes complex concepts accessible. Your explanations are clear, practical, and actionable. You use real examples and analogies to help concepts stick.

${levelInstructions[level]}

Format your response in markdown with:
- A brief overview (2-3 sentences)
- Key points as bullet points
- A practical example or tip
- Keep total response under 300 words for beginners, 400 for intermediate, 500 for advanced`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: basePrompt + contextualInfo }
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate explanation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Unable to generate explanation.";

    return new Response(
      JSON.stringify({ 
        content,
        topic,
        level,
        symbol: context?.symbol 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Education function error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred generating the explanation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
