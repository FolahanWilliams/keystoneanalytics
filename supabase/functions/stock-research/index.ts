import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getUserTier, hasPremiumAccess } from "../_shared/tierCheck.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check - REQUIRED for research
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Auth validation failed:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PAYWALL: Check subscription tier - research requires Pro+
    const tier = await getUserTier(user.id);
    console.log(`Stock research request - user: ${user.id}, tier: ${tier}`);
    
    if (!hasPremiumAccess(tier)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'premium_required',
          message: 'Stock research is a Pro feature. Upgrade to access web research and analysis.',
          requiredTier: 'pro'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { symbol, companyName } = body;

    // Input validation
    const SYMBOL_REGEX = /^[A-Z0-9.]{1,10}$/;
    const COMPANY_NAME_REGEX = /^[a-zA-Z0-9\s&.,'-]{1,100}$/;

    if (!symbol) {
      return new Response(
        JSON.stringify({ success: false, error: 'Symbol is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate symbol format
    if (typeof symbol !== 'string' || !SYMBOL_REGEX.test(symbol)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid symbol format. Must be 1-10 uppercase alphanumeric characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate companyName if provided
    if (companyName && (typeof companyName !== 'string' || !COMPANY_NAME_REGEX.test(companyName))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid company name. Max 100 characters, alphanumeric and basic punctuation only.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Research feature not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for recent news and analysis about the stock
    const searchQuery = `${symbol} ${companyName || ''} stock analysis news 2025`;
    console.log('Searching for:', searchQuery);

    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        limit: 5,
        tbs: 'qdr:w', // Last week
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Firecrawl search error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process and summarize the results
    const articles = (searchData.data || []).map((item: any) => ({
      title: item.title || 'Untitled',
      url: item.url,
      description: item.description || '',
      content: item.markdown?.slice(0, 1000) || '', // Limit content size
    }));

    console.log(`Found ${articles.length} articles for ${symbol}`);

    return new Response(
      JSON.stringify({
        success: true,
        symbol,
        articles,
        searchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stock-research:', error);
    const errorMessage = error instanceof Error ? error.message : 'Research failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
