import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  getUserTier, 
  getUserIdFromAuth,
  maskPremiumFields, 
  PREMIUM_FUNDAMENTAL_FIELDS,
  type SubscriptionTier 
} from "../_shared/tierCheck.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYMBOL_REGEX = /^[A-Za-z0-9.-]{1,10}$/;

function validateSymbol(symbol: string): boolean {
  return typeof symbol === "string" && SYMBOL_REGEX.test(symbol);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    // Get user ID and tier for paywall enforcement
    const userId = await getUserIdFromAuth(authHeader, supabaseUrl, anonKey);
    const tier: SubscriptionTier = userId ? await getUserTier(userId) : 'free';
    
    console.log(`Fundamentals request - userId: ${userId}, tier: ${tier}`);

    const { symbol } = await req.json();

    if (!symbol || !validateSymbol(symbol)) {
      return new Response(
        JSON.stringify({ error: "Invalid symbol format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FMP_API_KEY = Deno.env.get("FMP_API_KEY");

    if (!FMP_API_KEY) {
      console.error("FMP API key not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const encodedSymbol = encodeURIComponent(symbol.toUpperCase());
    console.log(`Fetching comprehensive fundamentals for ${symbol}`);

    // Fetch all required data in parallel
    const [
      profileRes,
      metricsRes,
      ratiosRes,
      growthRes,
      incomeRes,
      balanceRes,
      cashFlowRes,
      ratingRes,
      priceTargetRes,
      sectorPerfRes
    ] = await Promise.all([
      fetch(`https://financialmodelingprep.com/api/v3/profile/${encodedSymbol}?apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/key-metrics-ttm/${encodedSymbol}?apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/ratios-ttm/${encodedSymbol}?apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/financial-growth/${encodedSymbol}?limit=4&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/income-statement/${encodedSymbol}?limit=5&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${encodedSymbol}?limit=1&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${encodedSymbol}?limit=1&apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/rating/${encodedSymbol}?apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v4/price-target-consensus/${encodedSymbol}?apikey=${FMP_API_KEY}`),
      fetch(`https://financialmodelingprep.com/api/v3/sector-performance?apikey=${FMP_API_KEY}`)
    ]);

    const [
      profileData,
      metricsData,
      ratiosData,
      growthData,
      incomeData,
      balanceData,
      cashFlowData,
      ratingData,
      priceTargetData,
      sectorPerfData
    ] = await Promise.all([
      profileRes.json(),
      metricsRes.json(),
      ratiosRes.json(),
      growthRes.json(),
      incomeRes.json(),
      balanceRes.json(),
      cashFlowRes.json(),
      ratingRes.json(),
      priceTargetRes.json(),
      sectorPerfRes.json()
    ]);

    const profile = Array.isArray(profileData) ? profileData[0] : null;
    const metrics = Array.isArray(metricsData) ? metricsData[0] : null;
    const ratios = Array.isArray(ratiosData) ? ratiosData[0] : null;
    const growth = Array.isArray(growthData) ? growthData : [];
    const income = Array.isArray(incomeData) ? incomeData : [];
    const balance = Array.isArray(balanceData) ? balanceData[0] : null;
    const cashFlow = Array.isArray(cashFlowData) ? cashFlowData[0] : null;
    const rating = Array.isArray(ratingData) ? ratingData[0] : null;
    const priceTarget = priceTargetData || null;
    const sectorPerf = Array.isArray(sectorPerfData) ? sectorPerfData : [];

    if (!profile) {
      console.error(`No profile data found for ${symbol}`);
      return new Response(
        JSON.stringify({ error: `No data found for ${symbol}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate EPS growth from last 4 quarters
    let epsGrowth = null;
    if (income.length >= 2) {
      const latestEps = income[0]?.eps;
      const previousEps = income[1]?.eps;
      if (latestEps && previousEps && previousEps !== 0) {
        epsGrowth = ((latestEps - previousEps) / Math.abs(previousEps)) * 100;
      }
    }

    // Calculate revenue growth
    let revenueGrowth = null;
    if (income.length >= 2) {
      const latestRevenue = income[0]?.revenue;
      const previousRevenue = income[1]?.revenue;
      if (latestRevenue && previousRevenue && previousRevenue !== 0) {
        revenueGrowth = ((latestRevenue - previousRevenue) / Math.abs(previousRevenue)) * 100;
      }
    }

    // Get sector P/E for comparison
    const sector = profile.sector;
    let sectorPe = null;
    // Estimate sector P/E based on typical values (FMP doesn't directly provide this)
    const sectorPeEstimates: Record<string, number> = {
      "Technology": 30,
      "Healthcare": 25,
      "Financial Services": 15,
      "Consumer Cyclical": 22,
      "Consumer Defensive": 20,
      "Industrials": 20,
      "Energy": 12,
      "Utilities": 18,
      "Real Estate": 25,
      "Basic Materials": 15,
      "Communication Services": 22,
    };
    sectorPe = sectorPeEstimates[sector] || 20;

    // Calculate free cash flow yield
    let freeCashFlowYield = null;
    if (cashFlow?.freeCashFlow && profile.mktCap && profile.mktCap > 0) {
      freeCashFlowYield = (cashFlow.freeCashFlow / profile.mktCap) * 100;
    }

    // Calculate debt-to-equity
    let debtToEquity = ratios?.debtEquityRatioTTM;
    if (!debtToEquity && balance) {
      const totalDebt = (balance.shortTermDebt || 0) + (balance.longTermDebt || 0);
      const totalEquity = balance.totalStockholdersEquity || 0;
      if (totalEquity > 0) {
        debtToEquity = totalDebt / totalEquity;
      }
    }

    // Convert analyst rating to 1-5 scale
    let analystRating = null;
    if (rating?.ratingScore) {
      analystRating = rating.ratingScore; // FMP uses 1-5 scale
    } else if (priceTarget?.targetConsensus) {
      // Map consensus to rating
      const consensus = priceTarget.targetConsensus.toLowerCase();
      if (consensus.includes("strong buy")) analystRating = 5;
      else if (consensus.includes("buy")) analystRating = 4;
      else if (consensus.includes("hold")) analystRating = 3;
      else if (consensus.includes("sell")) analystRating = 2;
      else if (consensus.includes("strong sell")) analystRating = 1;
    }

    // Calculate price to target upside
    let priceToTarget = null;
    if (priceTarget?.targetHigh && priceTarget?.targetLow && profile.price) {
      const avgTarget = (priceTarget.targetHigh + priceTarget.targetLow) / 2;
      priceToTarget = ((avgTarget - profile.price) / profile.price) * 100;
    }

    // Build comprehensive fundamentals response
    const fundamentals = {
      // Basic Info
      symbol: profile.symbol,
      companyName: profile.companyName,
      sector: profile.sector,
      industry: profile.industry,
      exchange: profile.exchange,
      
      // Valuation
      price: profile.price,
      marketCap: profile.mktCap,
      peRatio: profile.pe || metrics?.peRatioTTM,
      sectorPe: sectorPe,
      priceToBook: metrics?.pbRatioTTM || ratios?.priceToBookRatioTTM,
      priceToSales: metrics?.psRatioTTM || ratios?.priceToSalesRatioTTM,
      evToEbitda: metrics?.evToOperatingCashFlowTTM || ratios?.enterpriseValueMultipleTTM,
      
      // Profitability
      eps: income[0]?.eps || metrics?.netIncomePerShareTTM,
      epsGrowth: epsGrowth || (growth[0]?.epsgrowth * 100),
      revenue: income[0]?.revenue,
      revenueGrowth: revenueGrowth || (growth[0]?.revenueGrowth * 100),
      netIncome: income[0]?.netIncome,
      profitMargin: metrics?.netProfitMarginTTM || ratios?.netProfitMarginTTM,
      operatingMargin: ratios?.operatingProfitMarginTTM,
      grossMargin: ratios?.grossProfitMarginTTM,
      
      // Financial Health
      debtToEquity: debtToEquity,
      currentRatio: ratios?.currentRatioTTM,
      quickRatio: ratios?.quickRatioTTM,
      interestCoverage: ratios?.interestCoverageTTM,
      
      // Cash Flow
      freeCashFlow: cashFlow?.freeCashFlow,
      freeCashFlowYield: freeCashFlowYield,
      operatingCashFlow: cashFlow?.operatingCashFlow,
      
      // Returns
      roe: metrics?.roeTTM || ratios?.returnOnEquityTTM,
      roa: metrics?.roaTTM || ratios?.returnOnAssetsTTM,
      roic: metrics?.roicTTM,
      
      // Dividends
      dividendYield: profile.lastDiv ? (profile.lastDiv / profile.price) * 100 : 0,
      payoutRatio: ratios?.payoutRatioTTM,
      
      // Analyst & Sentiment
      analystRating: analystRating,
      priceTarget: priceTarget?.targetMedian || priceTarget?.targetConsensusPrice,
      priceToTargetUpside: priceToTarget,
      numberOfAnalysts: priceTarget?.numberOfAnalysts,
      
      // Risk
      beta: profile.beta,
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      dataSource: "fmp",
    };

    console.log(`Fundamentals fetched for ${symbol}: PE=${fundamentals.peRatio}, D/E=${fundamentals.debtToEquity}, tier=${tier}`);

    // Apply premium field masking for free tier users
    const maskedFundamentals = maskPremiumFields(
      fundamentals,
      tier,
      PREMIUM_FUNDAMENTAL_FIELDS
    );

    return new Response(JSON.stringify({ fundamentals: maskedFundamentals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Fundamentals error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch fundamentals";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
