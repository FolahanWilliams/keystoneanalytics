import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Quote, Candle, SearchResult, TimeframeType } from "@/types/market";
import { timeframeConfig } from "@/config/timeframes";
import { marketDataCache, cacheKey } from "@/utils/cache";

// Re-export types for backward compatibility
export type { Quote, Candle, SearchResult, TimeframeType };

export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    const mySeq = ++requestSeq.current;
    const key = cacheKey('quotes', ...symbols);

    // Check unified cache first
    const cached = marketDataCache.getQuotes(key);
    if (marketDataCache.isQuotesFresh(key) && cached) {
      setQuotes(cached);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols, type: "quotes" },
      });

      if (requestSeq.current !== mySeq) return;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const nextQuotes = data?.quotes || [];
      setQuotes(nextQuotes);
      marketDataCache.setQuotes(key, nextQuotes);
    } catch (err) {
      if (requestSeq.current !== mySeq) return;
      console.error("Error fetching quotes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch quotes");
    } finally {
      if (requestSeq.current === mySeq) setLoading(false);
    }
  }, [symbols.join(",")]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
}

export function useCandles(symbol: string, timeframe: TimeframeType = "1D") {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const hasRenderedDataRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);

  const fetchCandles = useCallback(async () => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      setError(null);
      hasRenderedDataRef.current = false;
      lastKeyRef.current = null;
      return;
    }

    const mySeq = ++requestSeq.current;
    const config = timeframeConfig[timeframe];
    const key = cacheKey('candles', symbol, timeframe);

    const cached = marketDataCache.getCandles(key);
    const cacheFresh = marketDataCache.isCandlesFresh(key);

    if (lastKeyRef.current !== key && !cacheFresh) {
      setCandles([]);
      hasRenderedDataRef.current = false;
    }
    lastKeyRef.current = key;

    if (cacheFresh && cached) {
      setCandles(cached);
      hasRenderedDataRef.current = cached.length > 0;
    }

    setLoading(!cacheFresh && !hasRenderedDataRef.current);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: {
          symbols: [symbol],
          type: "candles",
          resolution: config.resolution,
          days: config.days,
        },
      });

      if (requestSeq.current !== mySeq) return;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const rawCandles: Candle[] = data?.candles || [];
      // Normalize ordering: ensure candles are sorted oldest -> newest for consistent indicators/charts
      const nextCandles = [...rawCandles].sort((a, b) => a.timestamp - b.timestamp);

      setCandles(nextCandles);
      hasRenderedDataRef.current = nextCandles.length > 0;
      marketDataCache.setCandles(key, nextCandles);
    } catch (err) {
      if (requestSeq.current !== mySeq) return;
      console.error("Error fetching candles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch candles");
    } finally {
      if (requestSeq.current === mySeq) setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return { candles, loading, error, refetch: fetchCandles };
}

export function useSymbolSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols: [query], type: "search" },
      });

      if (fnError) throw fnError;
      setResults(data.results || []);
    } catch (err) {
      console.error("Error searching symbols:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}
