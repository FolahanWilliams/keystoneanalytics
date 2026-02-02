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

// Timeframes: 1H and 4H for intraday, D/W/M for swing trading
export type TimeframeType = "1H" | "4H" | "1D" | "1W" | "1M" | "3M" | "1Y";

// Chart drawing types for technical analysis
export type DrawingType = "trendline" | "fibonacci" | "horizontal" | "annotation";

export interface ChartDrawing {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  type: DrawingType;
  data: DrawingData;
  created_at: string;
  updated_at: string;
}

export interface DrawingData {
  // Common fields
  color?: string;
  lineWidth?: number;
  // Trendline: two points
  startPrice?: number;
  startTime?: string;
  endPrice?: number;
  endTime?: string;
  // Horizontal line
  price?: number;
  // Fibonacci
  highPrice?: number;
  lowPrice?: number;
  highTime?: string;
  lowTime?: string;
  levels?: number[];
  // Annotation
  text?: string;
  time?: string;
}

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
