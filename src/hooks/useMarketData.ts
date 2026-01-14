import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
  error?: boolean;
}

export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export function useQuotes(symbols: string[]) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against out-of-order responses when symbol list changes quickly.
  const requestSeq = useRef(0);

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    const mySeq = ++requestSeq.current;

    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols, type: "quotes" },
      });

      if (requestSeq.current !== mySeq) return;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setQuotes(data?.quotes || []);
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

    // Refresh quotes every 30 seconds
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return { quotes, loading, error, refetch: fetchQuotes };
}

export type TimeframeType = "1H" | "4H" | "1D" | "1W" | "1M";

// Map timeframes to API parameters
const timeframeConfig: Record<TimeframeType, { resolution: string; days: number }> = {
  "1H": { resolution: "60", days: 2 }, // 1-hour candles, 2 days of data
  "4H": { resolution: "240", days: 7 }, // 4-hour candles, 7 days of data
  "1D": { resolution: "D", days: 30 }, // Daily candles, 30 days
  "1W": { resolution: "W", days: 180 }, // Weekly candles, 6 months
  "1M": { resolution: "M", days: 365 }, // Monthly candles, 1 year
};

// --- lightweight cache (same idea as useChartData)
const CANDLE_CACHE_TTL_MS = 60_000;
const candleCache = new Map<string, { candles: Candle[]; ts: number }>();
const cacheKey = (symbol: string, timeframe: TimeframeType) => `${symbol}::${timeframe}`;

export function useCandles(symbol: string, timeframe: TimeframeType = "1D") {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);

  const fetchCandles = useCallback(async () => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      return;
    }

    const mySeq = ++requestSeq.current;
    const config = timeframeConfig[timeframe];
    const key = cacheKey(symbol, timeframe);

    const cached = candleCache.get(key);
    const cacheFresh = cached && Date.now() - cached.ts < CANDLE_CACHE_TTL_MS;
    if (cacheFresh) setCandles(cached.candles);

    setLoading(!cacheFresh && candles.length === 0);
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

      const nextCandles: Candle[] = data?.candles || [];
      setCandles(nextCandles);
      candleCache.set(key, { candles: nextCandles, ts: Date.now() });
    } catch (err) {
      if (requestSeq.current !== mySeq) return;
      console.error("Error fetching candles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch candles");
    } finally {
      if (requestSeq.current === mySeq) setLoading(false);
    }
  }, [symbol, timeframe, candles.length]);

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
