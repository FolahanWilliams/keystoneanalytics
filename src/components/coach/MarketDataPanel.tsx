import { useState, useEffect, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3, Gauge, Target, AlertTriangle, RefreshCw, Database, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuotes, useCandles } from "@/hooks/useMarketData";

interface MarketDataPanelProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
}

// Calculate RSI using Wilder's smoothing method (proper RSI calculation)
function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  // Apply Wilder's smoothing for the rest of the data
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Calculate SMA - uses MOST RECENT n days (slice from end)
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data.reduce((a, b) => a + b, 0) / data.length;
  // Use most recent 'period' days from the END of the array
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

// Calculate pivot points (Standard) for support/resistance
function calculatePivotLevels(highs: number[], lows: number[], closes: number[], lookback: number = 60) {
  const recentHighs = highs.slice(-lookback);
  const recentLows = lows.slice(-lookback);
  const recentCloses = closes.slice(-lookback);
  
  // Find swing highs and lows (local peaks/troughs)
  const swingHighs: number[] = [];
  const swingLows: number[] = [];
  
  for (let i = 2; i < recentHighs.length - 2; i++) {
    // Swing high: higher than 2 bars on each side
    if (recentHighs[i] > recentHighs[i - 1] && recentHighs[i] > recentHighs[i - 2] &&
        recentHighs[i] > recentHighs[i + 1] && recentHighs[i] > recentHighs[i + 2]) {
      swingHighs.push(recentHighs[i]);
    }
    // Swing low: lower than 2 bars on each side
    if (recentLows[i] < recentLows[i - 1] && recentLows[i] < recentLows[i - 2] &&
        recentLows[i] < recentLows[i + 1] && recentLows[i] < recentLows[i + 2]) {
      swingLows.push(recentLows[i]);
    }
  }
  
  const currentPrice = recentCloses[recentCloses.length - 1];
  
  // Find nearest resistance (swing high above current price)
  const resistanceLevels = swingHighs.filter(h => h > currentPrice).sort((a, b) => a - b);
  // Find nearest support (swing low below current price)
  const supportLevels = swingLows.filter(l => l < currentPrice).sort((a, b) => b - a);
  
  // Fallback to period high/low if no swing points found
  const resistance = resistanceLevels[0] || Math.max(...recentHighs);
  const support = supportLevels[0] || Math.min(...recentLows);
  
  return { support, resistance };
}

// Calculate 30-day performance using correct date comparison
function calculate30DayPerformance(candles: { close: number; timestamp: number }[]): number | null {
  if (candles.length < 2) return null;
  
  const currentPrice = candles[candles.length - 1].close;
  const currentTimestamp = candles[candles.length - 1].timestamp;
  const thirtyDaysAgo = currentTimestamp - (30 * 24 * 60 * 60);
  
  // Find the candle closest to 30 days ago
  let closestCandle = candles[0];
  let closestDiff = Math.abs(candles[0].timestamp - thirtyDaysAgo);
  
  for (const candle of candles) {
    const diff = Math.abs(candle.timestamp - thirtyDaysAgo);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestCandle = candle;
    }
  }
  
  if (closestCandle.close === 0) return null;
  return ((currentPrice - closestCandle.close) / closestCandle.close) * 100;
}

// Minimum data points required for reliable calculations
const MIN_DATA_POINTS = 50;

export function MarketDataPanel({ symbol, onSymbolChange }: MarketDataPanelProps) {
  const { quotes, loading: quotesLoading, refetch: refetchQuotes } = useQuotes([symbol]);
  const { candles, loading: candlesLoading, refetch: refetchCandles } = useCandles(symbol);
  
  const quote = quotes[0];
  const isLoading = quotesLoading || candlesLoading;
  
  // Check for insufficient data
  const hasInsufficientData = !candlesLoading && candles && candles.length < MIN_DATA_POINTS;

  // Calculate technicals from candles - require at least MIN_DATA_POINTS
  const technicals = candles && candles.length >= MIN_DATA_POINTS ? (() => {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Calculate SMAs using most recent data
    const sma20 = calculateSMA(closes, 20);
    const sma50 = closes.length >= 50 ? calculateSMA(closes, 50) : null;
    const rsi = calculateRSI(closes);
    
    // Calculate proper pivot-based support/resistance
    const { support, resistance } = calculatePivotLevels(highs, lows, closes, Math.min(60, closes.length));
    
    const currentPrice = closes[closes.length - 1];
    
    let trend = "Neutral";
    if (sma50 !== null) {
      if (currentPrice > sma20 && sma20 > sma50) trend = "Bullish";
      else if (currentPrice < sma20 && sma20 < sma50) trend = "Bearish";
      else if (currentPrice > sma20) trend = "Mildly Bullish";
      else if (currentPrice < sma20) trend = "Mildly Bearish";
    } else {
      // Without SMA50, just compare to SMA20
      if (currentPrice > sma20 * 1.02) trend = "Mildly Bullish";
      else if (currentPrice < sma20 * 0.98) trend = "Mildly Bearish";
    }
    
    return { sma20, sma50, rsi, support, resistance, trend };
  })() : null;
  
  // Calculate 30-day performance separately
  const performance30d = candles && candles.length >= 20 
    ? calculate30DayPerformance(candles) 
    : null;

  const handleRefresh = () => {
    refetchQuotes();
    refetchCandles();
  };

  const isPositive = quote && quote.change >= 0;
  const rsiStatus = technicals ? (
    technicals.rsi > 70 ? "Overbought" :
    technicals.rsi < 30 ? "Oversold" : "Neutral"
  ) : null;

  return (
    <Card className="h-full border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-mono">{symbol}</CardTitle>
            {quote && (
              <Badge variant={isPositive ? "default" : "destructive"} className="font-mono text-xs">
                {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Section */}
        {quotesLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : quote ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono">
                ${quote.price.toFixed(2)}
              </span>
              <span className={cn(
                "flex items-center gap-1 text-sm font-medium",
                isPositive ? "text-gain" : "text-loss"
              )}>
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {isPositive ? "+" : ""}{quote.change.toFixed(2)}
              </span>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Open: ${quote.open.toFixed(2)}</span>
              <span>High: ${quote.high.toFixed(2)}</span>
              <span>Low: ${quote.low.toFixed(2)}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No price data available</p>
        )}

        {/* Technical Indicators */}
        {candlesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : technicals ? (
          <>
            {/* Trend */}
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Trend Analysis
                </span>
                <Badge 
                  variant={technicals.trend.includes("Bullish") ? "default" : 
                          technicals.trend.includes("Bearish") ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {technicals.trend}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">SMA(20)</span>
                  <p className="font-mono font-medium">${technicals.sma20.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SMA(50)</span>
                  <p className="font-mono font-medium">
                    {technicals.sma50 !== null ? `$${technicals.sma50.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* RSI */}
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" />
                  RSI (14)
                </span>
                <Badge 
                  variant={rsiStatus === "Overbought" ? "destructive" : 
                          rsiStatus === "Oversold" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {rsiStatus}
                </Badge>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "absolute h-full rounded-full transition-all",
                    technicals.rsi > 70 ? "bg-loss" :
                    technicals.rsi < 30 ? "bg-gain" : "bg-primary"
                  )}
                  style={{ width: `${technicals.rsi}%` }}
                />
                {/* Overbought/Oversold markers */}
                <div className="absolute top-0 left-[30%] w-0.5 h-full bg-gain/30" />
                <div className="absolute top-0 left-[70%] w-0.5 h-full bg-loss/30" />
              </div>
              <p className="text-center font-mono font-bold mt-1">{technicals.rsi.toFixed(1)}</p>
            </div>

            {/* Support & Resistance */}
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                <Target className="w-3.5 h-3.5" />
                Key Levels
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-gain/10 border border-gain/20">
                  <span className="text-muted-foreground">Resistance</span>
                  <p className="font-mono font-medium text-gain">${technicals.resistance.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded bg-loss/10 border border-loss/20">
                  <span className="text-muted-foreground">Support</span>
                  <p className="font-mono font-medium text-loss">${technicals.support.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </>
        ) : hasInsufficientData ? (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Insufficient History
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Need {MIN_DATA_POINTS}+ data points for reliable analysis. 
              Currently have {candles?.length || 0}.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Technical data unavailable
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {candles && candles.length > 0 && performance30d !== null && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">30-Day Performance</p>
            <div className="flex gap-2">
              <Badge 
                variant={performance30d >= 0 ? "default" : "destructive"}
                className="font-mono"
              >
                {performance30d >= 0 ? "+" : ""}{performance30d.toFixed(2)}%
              </Badge>
              <span className="text-xs text-muted-foreground">
                {candles.length} trading days available
              </span>
            </div>
          </div>
        )}

        {/* Data Quality / Debug Row */}
        {candles && candles.length > 0 && (
          <div className="p-2 rounded bg-muted/30 border border-border/30 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1 mb-1">
              <Database className="w-3 h-3" />
              <span className="font-medium">Data Quality</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {new Date(candles[candles.length - 1].timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart3 className="w-2.5 h-2.5" />
                <span>{candles.length} bars</span>
              </div>
              <div className="flex items-center gap-1">
                <Info className="w-2.5 h-2.5" />
                <span>Daily</span>
              </div>
            </div>
          </div>
        )}

        {/* Risk Warning */}
        <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
            Past performance doesn't guarantee future results. Always manage risk.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
