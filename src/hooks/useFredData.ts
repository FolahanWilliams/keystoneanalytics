import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FredIndicator {
  id: string;
  name: string;
  category: string;
  value: number;
  date: string;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
  historical: { date: string; value: number }[];
}

export interface MarketAnalysis {
  rateEnvironment: string;
  rateTrend?: 'rising' | 'falling' | 'stable';
  inflationOutlook: string;
  laborMarket: string;
  riskSentiment: string;
  yieldCurve?: string;
  recessionSignal?: boolean;
  summary: string;
}

export function useFredData(category?: string) {
  const [indicators, setIndicators] = useState<FredIndicator[]>([]);
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("fred-data", {
        body: { category },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setIndicators(data.indicators || []);
      setAnalysis(data.analysis || null);
    } catch (err) {
      console.error("Error fetching FRED data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch economic data");
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
    // Refresh every 30 minutes (economic data doesn't change frequently)
    const interval = setInterval(fetchData, 1800000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Extract VIX level from indicators for direct consumption
  const vixLevel = useMemo(() => {
    const vixIndicator = indicators.find(i => i.id === 'VIXCLS');
    return vixIndicator?.value;
  }, [indicators]);

  return { indicators, analysis, vixLevel, loading, error, refetch: fetchData };
}
