import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Quote } from "@/types/market";

/**
 * Optimized quotes hook using React Query for better caching and deduplication.
 * Replaces the manual useQuotes hook with React Query benefits:
 * - Automatic request deduplication
 * - Background refetching
 * - Stale-while-revalidate pattern
 * - Shared cache across components
 */
export function useOptimizedQuotes(symbols: string[]) {
  const queryClient = useQueryClient();
  const symbolsKey = symbols.sort().join(",");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["quotes", symbolsKey],
    queryFn: async (): Promise<Quote[]> => {
      if (symbols.length === 0) return [];

      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols, type: "quotes" },
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      return data?.quotes || [];
    },
    enabled: symbols.length > 0,
    staleTime: 15 * 1000, // Consider data fresh for 15 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    refetchIntervalInBackground: false, // Don't refetch when tab is hidden
  });

  // Prefetch function for preloading data
  const prefetch = (additionalSymbols: string[]) => {
    const allSymbols = [...new Set([...symbols, ...additionalSymbols])];
    queryClient.prefetchQuery({
      queryKey: ["quotes", allSymbols.sort().join(",")],
      queryFn: async () => {
        const { data } = await supabase.functions.invoke("market-data", {
          body: { symbols: allSymbols, type: "quotes" },
        });
        return data?.quotes || [];
      },
    });
  };

  return {
    quotes: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
    prefetch,
  };
}
