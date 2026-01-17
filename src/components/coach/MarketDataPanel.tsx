import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Activity, BarChart3, Gauge, Target, AlertTriangle, RefreshCw } from "lucide-react";
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

// Calculate SMA
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data.reduce((a, b) => a + b, 0) / data.length;
  return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

export function MarketDataPanel({ symbol, onSymbolChange }: MarketDataPanelProps) {
  const { quotes, loading: quotesLoading, refetch: refetchQuotes } = useQuotes([symbol]);
  const { candles, loading: candlesLoading, refetch: refetchCandles } = useCandles(symbol);
  
  const quote = quotes[0];
  const isLoading = quotesLoading || candlesLoading;

  // Calculate technicals from candles
  const technicals = candles && candles.length >= 20 ? (() => {
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, Math.min(50, closes.length));
    const rsi = calculateRSI(closes);
    
    const currentPrice = closes[closes.length - 1];
    const support = Math.min(...lows.slice(-10));
    const resistance = Math.max(...highs.slice(-10));
    
    let trend = "Neutral";
    if (currentPrice > sma20 && sma20 > sma50) trend = "Bullish";
    else if (currentPrice < sma20 && sma20 < sma50) trend = "Bearish";
    else if (currentPrice > sma20) trend = "Mildly Bullish";
    else if (currentPrice < sma20) trend = "Mildly Bearish";
    
    return { sma20, sma50, rsi, support, resistance, trend };
  })() : null;

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
                  <p className="font-mono font-medium">${technicals.sma50.toFixed(2)}</p>
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
        ) : (
          <div className="p-4 rounded-lg bg-secondary/20 border border-border/50 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Technical data unavailable
            </p>
          </div>
        )}

        {/* Quick Stats */}
        {candles && candles.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">30-Day Performance</p>
            <div className="flex gap-2">
              {(() => {
                const firstClose = candles[0]?.close || 0;
                const lastClose = candles[candles.length - 1]?.close || 0;
                const change = ((lastClose - firstClose) / firstClose * 100);
                return (
                  <Badge 
                    variant={change >= 0 ? "default" : "destructive"}
                    className="font-mono"
                  >
                    {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                  </Badge>
                );
              })()}
              <span className="text-xs text-muted-foreground">
                {candles.length} trading days
              </span>
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
