import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Key economic indicators from FRED
const INDICATORS = {
  // Interest Rates
  FEDFUNDS: { name: 'Federal Funds Rate', category: 'rates' },
  DGS10: { name: '10-Year Treasury', category: 'rates' },
  DGS2: { name: '2-Year Treasury', category: 'rates' },
  T10Y2Y: { name: '10Y-2Y Spread', category: 'rates' },
  
  // Inflation
  CPIAUCSL: { name: 'CPI (All Urban)', category: 'inflation' },
  PCEPI: { name: 'PCE Price Index', category: 'inflation' },
  
  // Employment
  UNRATE: { name: 'Unemployment Rate', category: 'employment' },
  PAYEMS: { name: 'Nonfarm Payrolls', category: 'employment' },
  ICSA: { name: 'Initial Claims', category: 'employment' },
  
  // GDP & Growth
  GDP: { name: 'GDP', category: 'growth' },
  GDPC1: { name: 'Real GDP', category: 'growth' },
  
  // Market Sentiment
  VIXCLS: { name: 'VIX Index', category: 'sentiment' },
  BAMLH0A0HYM2: { name: 'High Yield Spread', category: 'sentiment' },
  
  // Money Supply
  M2SL: { name: 'M2 Money Supply', category: 'money' },
  WALCL: { name: 'Fed Balance Sheet', category: 'money' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const body = await req.json();
    const apiKey = Deno.env.get('FRED_API_KEY');

    if (!apiKey) {
      throw new Error('FRED API key not configured');
    }

    // Input validation
    const ALLOWED_CATEGORIES = ['rates', 'inflation', 'employment', 'growth', 'sentiment', 'money'];
    const SERIES_ID_REGEX = /^[A-Z0-9_]{1,50}$/;
    const MAX_SERIES_COUNT = 50;

    const { series, category } = body;

    // Validate category if provided
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return new Response(
        JSON.stringify({ error: `Invalid category. Allowed: ${ALLOWED_CATEGORIES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which series to fetch
    let seriesToFetch: string[] = [];
    
    if (series) {
      const seriesArray = Array.isArray(series) ? series : [series];
      
      // Validate array length
      if (seriesArray.length > MAX_SERIES_COUNT) {
        return new Response(
          JSON.stringify({ error: `Too many series requested. Maximum: ${MAX_SERIES_COUNT}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Validate each series ID format
      for (const id of seriesArray) {
        if (typeof id !== 'string' || !SERIES_ID_REGEX.test(id)) {
          return new Response(
            JSON.stringify({ error: `Invalid series ID: ${id}. Must be 1-50 uppercase alphanumeric characters.` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      seriesToFetch = seriesArray;
    } else if (category) {
      seriesToFetch = Object.entries(INDICATORS)
        .filter(([_, info]) => info.category === category)
        .map(([id]) => id);
    } else {
      // Default: fetch key indicators
      seriesToFetch = ['FEDFUNDS', 'DGS10', 'T10Y2Y', 'UNRATE', 'VIXCLS'];
    }

    console.log(`Fetching FRED data for: ${seriesToFetch.join(', ')}`);

    // Fetch all series in parallel
    const results = await Promise.all(
      seriesToFetch.map(async (seriesId) => {
        try {
          const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=30`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data.observations && data.observations.length > 0) {
            const latest = data.observations[0];
            const previous = data.observations[1];
            const historical = data.observations.slice(0, 12).reverse();
            
            const currentValue = parseFloat(latest.value);
            const previousValue = previous ? parseFloat(previous.value) : currentValue;
            const change = currentValue - previousValue;
            const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

            return {
              id: seriesId,
              name: INDICATORS[seriesId as keyof typeof INDICATORS]?.name || seriesId,
              category: INDICATORS[seriesId as keyof typeof INDICATORS]?.category || 'other',
              value: currentValue,
              date: latest.date,
              change,
              changePercent,
              trend: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
              historical: historical.map((obs: any) => ({
                date: obs.date,
                value: parseFloat(obs.value) || 0,
              })),
            };
          }
          return null;
        } catch (err) {
          console.error(`Error fetching ${seriesId}:`, err);
          return null;
        }
      })
    );

    const indicators = results.filter(Boolean);
    
    // Calculate market analysis based on indicators
    const analysis = generateMarketAnalysis(indicators);

    console.log(`Fetched ${indicators.length} FRED indicators`);

    return new Response(JSON.stringify({ indicators, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('FRED API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMarketAnalysis(indicators: any[]) {
  const analysis: any = {
    rateEnvironment: 'neutral',
    rateTrend: 'stable', // Explicit rate trend for verdict engine
    inflationOutlook: 'stable',
    laborMarket: 'healthy',
    riskSentiment: 'neutral',
    summary: '',
  };

  const fedFunds = indicators.find(i => i?.id === 'FEDFUNDS');
  const spread = indicators.find(i => i?.id === 'T10Y2Y');
  const vix = indicators.find(i => i?.id === 'VIXCLS');
  const unemployment = indicators.find(i => i?.id === 'UNRATE');

  // Rate environment and explicit rate trend
  if (fedFunds) {
    // Set rate trend based on recent changes
    if (fedFunds.trend === 'up') {
      analysis.rateTrend = 'rising';
    } else if (fedFunds.trend === 'down') {
      analysis.rateTrend = 'falling';
    } else {
      analysis.rateTrend = 'stable';
    }
    
    // Set rate environment based on level
    if (fedFunds.value > 5) {
      analysis.rateEnvironment = 'restrictive';
    } else if (fedFunds.value < 2) {
      analysis.rateEnvironment = 'accommodative';
    }
  }

  // Yield curve
  if (spread && spread.value < 0) {
    analysis.yieldCurve = 'inverted';
    analysis.recessionSignal = true;
  } else {
    analysis.yieldCurve = 'normal';
    analysis.recessionSignal = false;
  }

  // Risk sentiment based on VIX
  if (vix) {
    if (vix.value > 25) {
      analysis.riskSentiment = 'risk-off'; // Aligned with verdict engine expectations
    } else if (vix.value < 15) {
      analysis.riskSentiment = 'risk-on';
    }
  }

  // Labor market
  if (unemployment) {
    if (unemployment.value < 4) analysis.laborMarket = 'tight';
    else if (unemployment.value > 6) analysis.laborMarket = 'weak';
  }

  // Generate summary
  const summaryParts = [];
  if (analysis.rateEnvironment === 'restrictive') {
    summaryParts.push('Fed maintains restrictive stance');
  }
  if (analysis.rateTrend === 'rising') {
    summaryParts.push('Interest rates trending higher');
  } else if (analysis.rateTrend === 'falling') {
    summaryParts.push('Interest rates trending lower');
  }
  if (analysis.recessionSignal) {
    summaryParts.push('Yield curve inverted (recession indicator)');
  }
  if (analysis.riskSentiment === 'risk-off') {
    summaryParts.push('Elevated market fear (VIX high)');
  }
  if (analysis.laborMarket === 'tight') {
    summaryParts.push('Labor market remains tight');
  }

  analysis.summary = summaryParts.length > 0 
    ? summaryParts.join('. ') + '.'
    : 'Economic conditions appear stable with no immediate red flags.';

  return analysis;
}
