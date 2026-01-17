import { useMemo } from "react";
import { useCandles, useQuotes } from "./useMarketData";
import { 
  calculateSMA, 
  calculateEMA, 
  calculateRSI, 
  calculateMACD 
} from "@/utils/technicalIndicators";
import type { Candle } from "@/types/market";

export interface TechnicalIndicators {
  price?: number;
  ma200?: number;
  ma50?: number;
  ma20?: number;
  rsi?: number;
  macdSignal?: 'bullish' | 'bearish' | 'neutral';
  volume?: number;
  avgVolume?: number;
  priceChange?: number;
}

function getLastValidValue(arr: (number | null)[]): number | undefined {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (arr[i] !== null) return arr[i] as number;
  }
  return undefined;
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
} {
  const { candles, loading: candlesLoading, error: candlesError } = useCandles(symbol);
  const { quotes, loading: quotesLoading } = useQuotes([symbol]);
  
  const indicators = useMemo<TechnicalIndicators>(() => {
    if (!candles || candles.length < 20) {
      return {};
    }
    
    const closes = candles.map(c => c.close);
    const quote = quotes[0];
    
    // Calculate moving averages
    const sma20Values = calculateSMA(closes, 20);
    const sma50Values = calculateSMA(closes, 50);
    const sma200Values = calculateSMA(closes, 200);
    
    const ma20 = getLastValidValue(sma20Values);
    const ma50 = getLastValidValue(sma50Values);
    const ma200 = getLastValidValue(sma200Values);
    
    // Calculate RSI
    const rsiValues = calculateRSI(closes, 14);
    const rsi = getLastValidValue(rsiValues);
    
    // Calculate MACD
    const { macd, signal, histogram } = calculateMACD(closes);
    const lastMacd = getLastValidValue(macd);
    const lastSignal = getLastValidValue(signal);
    const lastHistogram = getLastValidValue(histogram);
    
    // Determine MACD signal
    let macdSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (lastMacd !== undefined && lastSignal !== undefined && lastHistogram !== undefined) {
      // Bullish: MACD above signal and histogram positive/increasing
      if (lastMacd > lastSignal && lastHistogram > 0) {
        macdSignal = 'bullish';
      } 
      // Bearish: MACD below signal and histogram negative
      else if (lastMacd < lastSignal && lastHistogram < 0) {
        macdSignal = 'bearish';
      }
    }
    
    // Get current price and volume
    const currentPrice = quote?.price ?? closes[closes.length - 1];
    const currentVolume = candles[candles.length - 1]?.volume;
    const avgVolume = calculateAvgVolume(candles, 20);
    
    // Calculate price change percentage
    const priceChange = quote?.changePercent ?? 
      ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100;
    
    return {
      price: currentPrice,
      ma200,
      ma50,
      ma20,
      rsi,
      macdSignal,
      volume: currentVolume,
      avgVolume,
      priceChange,
    };
  }, [candles, quotes]);
  
  return {
    indicators,
    loading: candlesLoading || quotesLoading,
    error: candlesError,
  };
}
