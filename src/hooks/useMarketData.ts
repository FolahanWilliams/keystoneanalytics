import { useState, useEffect, useCallback } from "react";
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

  const fetchQuotes = useCallback(async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols, type: "quotes" },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setQuotes(data.quotes || []);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch quotes");
    } finally {
      setLoading(false);
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

export function useCandles(symbol: string) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = useCallback(async () => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: { symbols: [symbol], type: "candles" },
      });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setCandles(data.candles || []);
    } catch (err) {
      console.error("Error fetching candles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch candles");
    } finally {
      setLoading(false);
    }
  }, [symbol]);

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
