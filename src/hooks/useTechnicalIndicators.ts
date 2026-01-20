import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  calculateSMA, 
  calculateRSI, 
  calculateMACD 
} from "@/utils/technicalIndicators";
import { indicatorTimeframeConfig } from "@/config/timeframes";
import { marketDataCache, cacheKey } from "@/utils/cache";
import type { Candle } from "@/types/market";

export interface TechnicalIndicators {
  price?: number;
  ma200?: number;
  ma50?: number;
  ma20?: number;
  rsi?: number;
  macdSignal?: 'bullish' | 'bearish' | 'neutral';
  macdHistogramTrend?: 'increasing' | 'decreasing' | 'flat';
  volume?: number;
  avgVolume?: number;
  priceChange?: number;
  dataQuality?: 'full' | 'partial' | 'insufficient';
}

function getLastValidValue(arr: (number | null)[]): number | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null) return arr[i] as number;
  }
  return undefined;
}

function getLastNValues(arr: (number | null)[], n: number): number[] {
  const result: number[] = [];
  for (let i = arr.length - 1; i >= 0 && result.length < n; i--) {
    if (arr[i] !== null) result.unshift(arr[i] as number);
  }
  return result;
}

function calculateAvgVolume(candles: Candle[], period: number = 20): number {
  if (candles.length < period) {
    return candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
  }
  const recentCandles = candles.slice(-period);
  return recentCandles.reduce((sum, c) => sum + c.volume, 0) / period;
}

export function useTechnicalIndicators(symbol: string): {
  indicators: TechnicalIndicators;
  loading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const fetchTechnicalData = useCallback(async () => {
    if (!symbol) {
      setCandles([]);
      setLoading(false);
      setError(null);
      return;
    }

    const mySeq = ++requestSeq.current;
    const key = cacheKey('technical', symbol);
    const cached = marketDataCache.getTechnical(key);

    if (marketDataCache.isTechnicalFresh(key) && cached) {
      setCandles(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("market-data", {
        body: {
          symbols: [symbol],
          type: "candles",
          resolution: indicatorTimeframeConfig.resolution,
          days: indicatorTimeframeConfig.days,
        },
      });

      if (requestSeq.current !== mySeq) return;

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const rawCandles: Candle[] = data?.candles || [];
      const sortedCandles = [...rawCandles].sort((a, b) => a.timestamp - b.timestamp);

      setCandles(sortedCandles);
      marketDataCache.setTechnical(key, sortedCandles);
    } catch (err) {
      if (requestSeq.current !== mySeq) return;
      console.error("Error fetching technical data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch technical data");
    } finally {
      if (requestSeq.current === mySeq) setLoading(false);
    }
  }, [symbol]);

  // Refetch function that clears cache first
  const refetch = useCallback(() => {
    marketDataCache.invalidateSymbol(symbol);
    fetchTechnicalData();
  }, [symbol, fetchTechnicalData]);

  useEffect(() => {
    fetchTechnicalData();
  }, [fetchTechnicalData]);

  const indicators = useMemo<TechnicalIndicators>(() => {
    if (!candles || candles.length < 20) {
      return { dataQuality: 'insufficient' };
    }
    
    const closes = candles.map(c => c.close);
    const candleCount = candles.length;
    
    // Determine data quality based on available candles
    let dataQuality: 'full' | 'partial' | 'insufficient' = 'full';
    if (candleCount < 200) {
      dataQuality = candleCount >= 50 ? 'partial' : 'insufficient';
    }
    
    // Calculate moving averages
    const sma20Values = calculateSMA(closes, 20);
    const sma50Values = candleCount >= 50 ? calculateSMA(closes, 50) : [];
    const sma200Values = candleCount >= 200 ? calculateSMA(closes, 200) : [];
    
    const ma20 = getLastValidValue(sma20Values);
    const ma50 = getLastValidValue(sma50Values);
    const ma200 = getLastValidValue(sma200Values);
    
    // Calculate RSI (needs 14+ periods)
    const rsiValues = candleCount >= 14 ? calculateRSI(closes, 14) : [];
    const rsi = getLastValidValue(rsiValues);
    
    // Calculate MACD (needs 26 for slow EMA + 9 for signal = 35 minimum)
    let macdSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let macdHistogramTrend: 'increasing' | 'decreasing' | 'flat' = 'flat';
    
    if (candleCount >= 35) {
      const { macd, signal, histogram } = calculateMACD(closes);
      const lastMacd = getLastValidValue(macd);
      const lastSignal = getLastValidValue(signal);
      
      // Get last 3 histogram values for trend detection
      const histogramValues = getLastNValues(histogram, 3);
      
      if (lastMacd !== undefined && lastSignal !== undefined) {
        // Determine histogram trend (momentum direction)
        if (histogramValues.length >= 2) {
          const lastHist = histogramValues[histogramValues.length - 1];
          const prevHist = histogramValues[histogramValues.length - 2];
          const diff = lastHist - prevHist;
          
          if (Math.abs(diff) < 0.01) {
            macdHistogramTrend = 'flat';
          } else if (diff > 0) {
            macdHistogramTrend = 'increasing';
          } else {
            macdHistogramTrend = 'decreasing';
          }
        }
        
        // Improved MACD signal detection
        // Bullish: MACD above signal AND (histogram positive OR increasing)
        // Bearish: MACD below signal AND (histogram negative OR decreasing)
        const macdAboveSignal = lastMacd > lastSignal;
        const histogramPositive = histogramValues.length > 0 && histogramValues[histogramValues.length - 1] > 0;
        
        if (macdAboveSignal && (histogramPositive || macdHistogramTrend === 'increasing')) {
          macdSignal = 'bullish';
        } else if (!macdAboveSignal && (!histogramPositive || macdHistogramTrend === 'decreasing')) {
          macdSignal = 'bearish';
        }
        // Check for crossover (stronger signal)
        if (histogramValues.length >= 2) {
          const prevHist = histogramValues[histogramValues.length - 2];
          const currHist = histogramValues[histogramValues.length - 1];
          // Bullish crossover: histogram went from negative to positive
          if (prevHist < 0 && currHist > 0) {
            macdSignal = 'bullish';
          }
          // Bearish crossover: histogram went from positive to negative
          if (prevHist > 0 && currHist < 0) {
            macdSignal = 'bearish';
          }
        }
      }
    }
    
    // Get current price and volume from latest candle
    const currentPrice = closes[closes.length - 1];
    const currentVolume = candles[candles.length - 1]?.volume;
    const avgVolume = calculateAvgVolume(candles, 20);
    
    // Calculate price change percentage from previous close
    const priceChange = closes.length >= 2
      ? ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100
      : undefined;
    
    return {
      price: currentPrice,
      ma200,
      ma50,
      ma20,
      rsi,
      macdSignal,
      macdHistogramTrend,
      volume: currentVolume,
      avgVolume,
      priceChange,
      dataQuality,
    };
  }, [candles]);
  
  return {
    indicators,
    loading,
    error,
    refetch,
  };
}
