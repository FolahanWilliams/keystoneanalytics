import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Candle, TimeframeType } from "@/types/market";
import { timeframeConfig } from "@/config/timeframes";

/**
 * Optimized candles hook using React Query for better caching.
 * Benefits:
 * - Longer cache duration for historical data (doesn't change frequently)
 * - Request deduplication when multiple components need same data
 * - Automatic retry with exponential backoff
 */
export function useOptimizedCandles(symbol: string, timeframe: TimeframeType = "1D") {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["candles", symbol, timeframe],
    queryFn: async (): Promise<Candle[]> => {
      if (!symbol) return [];

      const config = timeframeConfig[timeframe];

      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: {
          symbols: [symbol],
          type: "candles",
          resolution: config.resolution,
          days: config.days,
        },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const rawCandles: Candle[] = data?.candles || [];
      // Sort oldest -> newest for consistent indicators/charts
      return [...rawCandles].sort((a, b) => a.timestamp - b.timestamp);
    },
    enabled: !!symbol,
    staleTime: 60 * 1000, // Consider fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    candles: data || [],
    loading: isLoading,
    isFetching, // True when background refetching
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}
