import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FundamentalsData {
  // Basic Info
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  exchange: string;
  
  // Valuation
  price: number;
  marketCap: number;
  peRatio: number | null;
  sectorPe: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  
  // Profitability
  eps: number | null;
  epsGrowth: number | null;
  revenue: number | null;
  revenueGrowth: number | null;
  netIncome: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  
  // Financial Health
  debtToEquity: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  interestCoverage: number | null;
  
  // Cash Flow
  freeCashFlow: number | null;
  freeCashFlowYield: number | null;
  operatingCashFlow: number | null;
  
  // Returns
  roe: number | null;
  roa: number | null;
  roic: number | null;
  
  // Dividends
  dividendYield: number | null;
  payoutRatio: number | null;
  
  // Analyst & Sentiment
  analystRating: number | null;
  priceTarget: number | null;
  priceToTargetUpside: number | null;
  numberOfAnalysts: number | null;
  
  // Risk
  beta: number | null;
  
  // Metadata
  lastUpdated: string;
  dataSource: string;
  
  // Premium field locking (added by backend paywall)
  _premiumLocked?: string[];
}

// In-memory cache for fundamentals
const cache = new Map<string, { data: FundamentalsData; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useFundamentals(symbol: string | null) {
  const [data, setData] = useState<FundamentalsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumLocked, setPremiumLocked] = useState<string[]>([]);

  const fetchFundamentals = useCallback(async (sym: string) => {
    const upperSymbol = sym.toUpperCase();
    
    // Check cache first
    const cached = cache.get(upperSymbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("fundamentals", {
        body: { symbol: upperSymbol },
      });

      if (fnError) throw fnError;
      if (result.error) throw new Error(result.error);

      const fundamentals = result.fundamentals as FundamentalsData;
      
      // Track which fields are locked by backend paywall
      if (fundamentals._premiumLocked && fundamentals._premiumLocked.length > 0) {
        setPremiumLocked(fundamentals._premiumLocked);
        console.log(`[Fundamentals] Premium fields locked for ${upperSymbol}:`, fundamentals._premiumLocked);
      } else {
        setPremiumLocked([]);
      }
      
      // Update cache
      cache.set(upperSymbol, { data: fundamentals, timestamp: Date.now() });
      
      setData(fundamentals);
    } catch (err) {
      console.error("Error fetching fundamentals:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch fundamentals");
      setData(null);
      setPremiumLocked([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (symbol) {
      fetchFundamentals(symbol);
    } else {
      setData(null);
      setError(null);
      setPremiumLocked([]);
    }
  }, [symbol, fetchFundamentals]);

  const refetch = useCallback(() => {
    if (symbol) {
      // Clear cache for this symbol
      cache.delete(symbol.toUpperCase());
      fetchFundamentals(symbol);
    }
  }, [symbol, fetchFundamentals]);

  // Helper to check if a specific field is locked
  const isFieldLocked = useCallback((field: string) => {
    return premiumLocked.includes(field);
  }, [premiumLocked]);

  return { data, loading, error, refetch, premiumLocked, isFieldLocked };
}
