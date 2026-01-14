// Shared market data types used across the application

export interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

export interface SearchResult {
  symbol: string;
  name: string;
  type: string;
}

export type TimeframeType = "1H" | "4H" | "1D" | "1W" | "1M";

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

export interface ChartIndicator {
  id: string;
  name: string;
  shortName: string;
  type: "overlay" | "oscillator";
  enabled: boolean;
  color: string;
  params: Record<string, number>;
}
