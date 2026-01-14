import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type TimeframeType = "1H" | "4H" | "1D" | "1W" | "1M";

// Map timeframes to API parameters
const timeframeConfig: Record<TimeframeType, { resolution: string; days: number; label: string }> = {
  "1H": { resolution: "60", days: 2, label: "1 Hour" },
  "4H": { resolution: "240", days: 10, label: "4 Hours" },
  "1D": { resolution: "D", days: 90, label: "Daily" },
  "1W": { resolution: "W", days: 365, label: "Weekly" },
  "1M": { resolution: "M", days: 730, label: "Monthly" },
};

// --- lightweight client-side cache to make timeframe switching snappy
// We still refetch in the background, but we immediately show the last known dataset.
const CANDLE_CACHE_TTL_MS = 60_000;
const candleCache = new Map<string, { candles: Candle[]; ts: number }>();

function cacheKey(symbol: string, timeframe: TimeframeType) {
  return `${symbol}::${timeframe}`;
}

// Technical indicator calculations
export function calculateSMA(data: number[], period: number): (number | null)[] {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const slice = data.slice(i - period + 1, i + 1);
    return slice.reduce((sum, val) => sum + val, 0) / period;
  });
}

export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First EMA is SMA
      const sma = data.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      result.push(sma);
    } else {
      const prevEma = result[i - 1] as number;
      const ema = (data[i] - prevEma) * multiplier + prevEma;
      result.push(ema);
    }
  }
  return result;
}

export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const sma = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1 || sma[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i] as number;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(mean + stdDev * std);
      lower.push(mean - stdDev * std);
    }
  }

  return { upper, middle: sma, lower };
}

export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(null);
      continue;
    }

    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);

    if (i < period) {
      result.push(null);
    } else if (i === period) {
      const avgGain = gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      const avgLoss = losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    } else {
      const prevRsi = result[i - 1];
      if (prevRsi === null) {
        result.push(null);
        continue;
      }

      const prevAvgGain = gains.slice(-period - 1, -1).reduce((sum, val) => sum + val, 0) / period;
      const prevAvgLoss = losses.slice(-period - 1, -1).reduce((sum, val) => sum + val, 0) / period;

      const avgGain = (prevAvgGain * (period - 1) + gains[gains.length - 1]) / period;
      const avgLoss = (prevAvgLoss * (period - 1) + losses[losses.length - 1]) / period;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
} {
  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);

  const macd = fastEma.map((fast, i) => {
    const slow = slowEma[i];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });

  // Calculate signal line (EMA of MACD)
  const macdValues = macd.filter((v) => v !== null) as number[];
  const signalEma = calculateEMA(macdValues, signalPeriod);

  // Map signal back to original indices
  let signalIdx = 0;
  const signal = macd.map((m) => {
    if (m === null) return null;
    return signalEma[signalIdx++] ?? null;
  });

  const histogram = macd.map((m, i) => {
    const s = signal[i];
    if (m === null || s === null) return null;
    return m - s;
  });

  return { macd, signal, histogram };
}

export function calculateVWAP(candles: Candle[]): (number | null)[] {
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  return candles.map((candle) => {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;

    return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : null;
  });
}

export interface ChartIndicator {
  id: string;
  name: string;
  shortName: string;
  type: "overlay" | "oscillator";
  enabled: boolean;
  color: string;
  params: Record<string, number>;
}

export const defaultIndicators: ChartIndicator[] = [
  {
    id: "sma20",
    name: "Simple Moving Average (20)",
    shortName: "SMA 20",
    type: "overlay",
    enabled: true,
    color: "hsl(217, 91%, 60%)",
    params: { period: 20 },
  },
  {
    id: "sma50",
    name: "Simple Moving Average (50)",
    shortName: "SMA 50",
    type: "overlay",
    enabled: false,
    color: "hsl(38, 92%, 50%)",
    params: { period: 50 },
  },
  {
    id: "ema12",
    name: "Exponential Moving Average (12)",
    shortName: "EMA 12",
    type: "overlay",
    enabled: false,
    color: "hsl(262, 83%, 58%)",
    params: { period: 12 },
  },
  {
    id: "ema26",
    name: "Exponential Moving Average (26)",
    shortName: "EMA 26",
    type: "overlay",
    enabled: false,
    color: "hsl(160, 84%, 45%)",
    params: { period: 26 },
  },
  {
    id: "bb",
    name: "Bollinger Bands",
    shortName: "BB",
    type: "overlay",
    enabled: false,
    color: "hsl(180, 100%, 50%)",
    params: { period: 20, stdDev: 2 },
  },
  {
    id: "vwap",
    name: "Volume Weighted Avg Price",
    shortName: "VWAP",
    type: "overlay",
    enabled: false,
    color: "hsl(45, 93%, 47%)",
    params: {},
  },
  {
    id: "rsi",
    name: "Relative Strength Index",
    shortName: "RSI",
    type: "oscillator",
    enabled: false,
    color: "hsl(262, 83%, 58%)",
    params: { period: 14 },
  },
  {
    id: "macd",
    name: "MACD",
    shortName: "MACD",
    type: "oscillator",
    enabled: false,
    color: "hsl(217, 91%, 60%)",
    params: { fast: 12, slow: 26, signal: 9 },
  },
];

export interface EnrichedCandle extends Candle {
  isUp: boolean;
  body: [number, number];
  sma20?: number | null;
  sma50?: number | null;
  ema12?: number | null;
  ema26?: number | null;
  bbUpper?: number | null;
  bbMiddle?: number | null;
  bbLower?: number | null;
  vwap?: number | null;
  rsi?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  macdHistogram?: number | null;
}

export function useChartData(symbol: string, timeframe: TimeframeType) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against out-of-order responses when users click timeframes quickly.
  const requestSeq = useRef(0);

  // Track whether we currently have something to render, without creating re-render loops.
  const hasRenderedDataRef = useRef(false);

  // Prevent showing the *previous* timeframe's candles while a new timeframe is loading.
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
    const key = cacheKey(symbol, timeframe);

    // If the requested key changed and we don't have a fresh cache entry, clear the chart
    // to avoid briefly showing the wrong timeframe.
    const cached = candleCache.get(key);
    const cacheFresh = !!cached && Date.now() - cached.ts < CANDLE_CACHE_TTL_MS;

    if (lastKeyRef.current !== key && !cacheFresh) {
      setCandles([]);
      hasRenderedDataRef.current = false;
    }
    lastKeyRef.current = key;

    // Instant paint from cache (if fresh) to avoid "blank"/stale chart feeling.
    if (cacheFresh) {
      setCandles(cached.candles);
      hasRenderedDataRef.current = cached.candles.length > 0;
    }

    // Only show the big loading state when we truly have no data to render yet.
    setLoading(!cacheFresh && !hasRenderedDataRef.current);
    setError(null);

    try {
      console.log(
        `[ChartData] Fetching ${symbol} with timeframe ${timeframe}: resolution=${config.resolution}, days=${config.days}`
      );

      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: {
          symbols: [symbol],
          type: "candles",
          resolution: config.resolution,
          days: config.days,
        },
      });

      // If another request started after this one, ignore this response.
      if (requestSeq.current !== mySeq) return;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const nextCandles: Candle[] = data?.candles || [];
      console.log(`[ChartData] Received ${nextCandles.length} candles for ${symbol}`);

      setCandles(nextCandles);
      hasRenderedDataRef.current = nextCandles.length > 0;
      candleCache.set(key, { candles: nextCandles, ts: Date.now() });
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
  return useMemo(() => {
    if (candles.length === 0) return [];

    const closes = candles.map((c) => c.close);

    // Calculate all indicators
    const sma20 = indicators.find((i) => i.id === "sma20")?.enabled ? calculateSMA(closes, 20) : [];
    const sma50 = indicators.find((i) => i.id === "sma50")?.enabled ? calculateSMA(closes, 50) : [];
    const ema12 = indicators.find((i) => i.id === "ema12")?.enabled ? calculateEMA(closes, 12) : [];
    const ema26 = indicators.find((i) => i.id === "ema26")?.enabled ? calculateEMA(closes, 26) : [];
    const bb = indicators.find((i) => i.id === "bb")?.enabled ? calculateBollingerBands(closes, 20, 2) : null;
    const vwap = indicators.find((i) => i.id === "vwap")?.enabled ? calculateVWAP(candles) : [];
    const rsi = indicators.find((i) => i.id === "rsi")?.enabled ? calculateRSI(closes, 14) : [];
    const macdData = indicators.find((i) => i.id === "macd")?.enabled ? calculateMACD(closes, 12, 26, 9) : null;

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
  }, [candles, indicators]);
}

