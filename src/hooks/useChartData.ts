import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Candle, TimeframeType, ChartIndicator, EnrichedCandle } from "@/types/market";
import { timeframeConfig } from "@/config/timeframes";
import { DataCache, cacheKey } from "@/utils/cache";
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVWAP,
} from "@/utils/technicalIndicators";

// Re-export types and config for backward compatibility
export type { Candle, TimeframeType, ChartIndicator, EnrichedCandle };
export { timeframeConfig };
export { defaultIndicators } from "@/config/indicators";

// Client-side cache for candle data - synchronized with server cache TTL
const candleCache = new DataCache<Candle[]>(60_000); // 60 seconds - matches edge function cache

export function useChartData(symbol: string, timeframe: TimeframeType) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestSeq = useRef(0);
  const lastKeyRef = useRef<string | null>(null);

  const fetchCandles = useCallback(async () => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      setError(null);
      lastKeyRef.current = null;
      return;
    }

    const mySeq = ++requestSeq.current;
    const config = timeframeConfig[timeframe];
    const key = cacheKey(symbol, timeframe);

    // If key changed, immediately clear old data to prevent flickering between old/new
    if (lastKeyRef.current !== key) {
      setCandles([]);
      setLoading(true);
      lastKeyRef.current = key;
    }

    // Check client cache
    const cached = candleCache.get(key);
    const cacheFresh = candleCache.isFresh(key);

    if (cacheFresh && cached && cached.length > 0) {
      // Use cached data immediately
      setCandles(cached);
      setLoading(false);
      return; // Skip API call if cache is fresh
    }

    setError(null);

    try {
      console.log(`[ChartData] Fetching ${symbol} with resolution=${config.resolution}, days=${config.days}`);
      
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
      console.log(`[ChartData] Received ${nextCandles.length} candles for ${symbol} ${timeframe}`);
      
      setCandles(nextCandles);
      candleCache.set(key, nextCandles);
    } catch (err) {
      if (requestSeq.current !== mySeq) return;
      console.error("[ChartData] Error fetching candles:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch candles");
    } finally {
      if (requestSeq.current === mySeq) setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchCandles();
  }, [fetchCandles]);

  return {
    candles,
    loading,
    error,
    refetch: fetchCandles,
    timeframeConfig: timeframeConfig[timeframe],
  };
}

export function useEnrichedChartData(candles: Candle[], indicators: ChartIndicator[]): EnrichedCandle[] {
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);

  // Calculate indicators independently for better performance
  const sma20 = useMemo(
    () => (indicators.find((i) => i.id === "sma20")?.enabled ? calculateSMA(closes, 20) : []),
    [closes, indicators.find((i) => i.id === "sma20")?.enabled]
  );

  const sma50 = useMemo(
    () => (indicators.find((i) => i.id === "sma50")?.enabled ? calculateSMA(closes, 50) : []),
    [closes, indicators.find((i) => i.id === "sma50")?.enabled]
  );

  const ema12 = useMemo(
    () => (indicators.find((i) => i.id === "ema12")?.enabled ? calculateEMA(closes, 12) : []),
    [closes, indicators.find((i) => i.id === "ema12")?.enabled]
  );

  const ema26 = useMemo(
    () => (indicators.find((i) => i.id === "ema26")?.enabled ? calculateEMA(closes, 26) : []),
    [closes, indicators.find((i) => i.id === "ema26")?.enabled]
  );

  const bb = useMemo(
    () => (indicators.find((i) => i.id === "bb")?.enabled ? calculateBollingerBands(closes, 20, 2) : null),
    [closes, indicators.find((i) => i.id === "bb")?.enabled]
  );

  const vwap = useMemo(
    () => (indicators.find((i) => i.id === "vwap")?.enabled ? calculateVWAP(candles) : []),
    [candles, indicators.find((i) => i.id === "vwap")?.enabled]
  );

  const rsi = useMemo(
    () => (indicators.find((i) => i.id === "rsi")?.enabled ? calculateRSI(closes, 14) : []),
    [closes, indicators.find((i) => i.id === "rsi")?.enabled]
  );

  const macdData = useMemo(
    () => (indicators.find((i) => i.id === "macd")?.enabled ? calculateMACD(closes, 12, 26, 9) : null),
    [closes, indicators.find((i) => i.id === "macd")?.enabled]
  );

  return useMemo(() => {
    if (candles.length === 0) return [];

    return candles.map((candle, i) => ({
      ...candle,
      isUp: candle.close >= candle.open,
      body: [Math.min(candle.open, candle.close), Math.max(candle.open, candle.close)] as [number, number],
      sma20: sma20[i],
      sma50: sma50[i],
      ema12: ema12[i],
      ema26: ema26[i],
      bbUpper: bb?.upper[i],
      bbMiddle: bb?.middle[i],
      bbLower: bb?.lower[i],
      vwap: vwap[i],
      rsi: rsi[i],
      macd: macdData?.macd[i],
      macdSignal: macdData?.signal[i],
      macdHistogram: macdData?.histogram[i],
    }));
  }, [candles, sma20, sma50, ema12, ema26, bb, vwap, rsi, macdData]);
}
