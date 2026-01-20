import { TrendingUp, TrendingDown, Activity, BarChart3, Gauge, Target, AlertTriangle, RefreshCw, Database, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import { useTechnicalIndicators } from "@/hooks/useTechnicalIndicators";
import { marketDataCache } from "@/utils/cache";

interface MarketDataPanelProps {
  symbol: string;
  onSymbolChange?: (symbol: string) => void;
}

export function MarketDataPanel({ symbol, onSymbolChange }: MarketDataPanelProps) {
  const { quotes, loading: quotesLoading, refetch: refetchQuotes } = useQuotes([symbol]);
  const { indicators, loading: indicatorsLoading, error: indicatorsError, refetch: refetchIndicators } = useTechnicalIndicators(symbol);
  
  const quote = quotes[0];
  const isLoading = quotesLoading || indicatorsLoading;
  
  // Data quality assessment
  const dataQuality = indicators.dataQuality ?? 'insufficient';
  const hasValidIndicators = dataQuality !== 'insufficient' && indicators.ma20 !== undefined;

  const handleRefresh = () => {
    // Global cache flush for this symbol - ensures consistency across all app layers
    marketDataCache.invalidateSymbol(symbol);
    refetchQuotes();
    refetchIndicators();
  };

  const isPositive = quote && quote.change >= 0;
  
  // RSI status derived from centralized indicators
  const rsiStatus = indicators.rsi !== undefined ? (
    indicators.rsi > 70 ? "Overbought" :
    indicators.rsi < 30 ? "Oversold" : "Neutral"
  ) : null;

  // Trend analysis from centralized MAs
  const getTrend = () => {
    const { ma20, ma50, price } = indicators;
    if (price === undefined || ma20 === undefined) return "Insufficient Data";
    
    if (ma50 !== undefined) {
      if (price > ma20 && ma20 > ma50) return "Bullish";
      if (price < ma20 && ma20 < ma50) return "Bearish";
      if (price > ma20) return "Mildly Bullish";
      if (price < ma20) return "Mildly Bearish";
    } else {
      if (price > ma20 * 1.02) return "Mildly Bullish";
      if (price < ma20 * 0.98) return "Mildly Bearish";
    }
    return "Neutral";
  };

  const trend = getTrend();

  // Data quality badge component
  const DataQualityBadge = () => {
    if (dataQuality === 'full') {
      return (
        <Badge variant="outline" className="text-[10px] bg-gain/10 text-gain border-gain/30">
          <CheckCircle className="w-2.5 h-2.5 mr-1" />
          Full
        </Badge>
      );
    }
    if (dataQuality === 'partial') {
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
          <Database className="w-2.5 h-2.5 mr-1" />
          Partial
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-loss/10 text-loss border-loss/30">
        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
        Insufficient
      </Badge>
    );
  };

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
          <div className="flex items-center gap-2">
            <DataQualityBadge />
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
        {indicatorsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : hasValidIndicators ? (
          <>
            {/* Trend */}
            <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Trend Analysis
                </span>
                <Badge 
                  variant={trend.includes("Bullish") ? "default" : 
                          trend.includes("Bearish") ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {trend}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">SMA(20)</span>
                  <p className="font-mono font-medium">
                    {indicators.ma20 !== undefined ? `$${indicators.ma20.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">SMA(50)</span>
                  <p className="font-mono font-medium">
                    {indicators.ma50 !== undefined ? `$${indicators.ma50.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">SMA(200)</span>
                  <p className="font-mono font-medium">
                    {indicators.ma200 !== undefined ? `$${indicators.ma200.toFixed(2)}` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* RSI */}
            {indicators.rsi !== undefined && (
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
                      indicators.rsi > 70 ? "bg-loss" :
                      indicators.rsi < 30 ? "bg-gain" : "bg-primary"
                    )}
                    style={{ width: `${indicators.rsi}%` }}
                  />
                  {/* Overbought/Oversold markers */}
                  <div className="absolute top-0 left-[30%] w-0.5 h-full bg-gain/30" />
                  <div className="absolute top-0 left-[70%] w-0.5 h-full bg-loss/30" />
                </div>
                <p className="text-center font-mono font-bold mt-1">{indicators.rsi.toFixed(1)}</p>
              </div>
            )}

            {/* MACD Signal */}
            {indicators.macdSignal && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    MACD Signal
                  </span>
                  <Badge 
                    variant={indicators.macdSignal === "bullish" ? "default" : 
                            indicators.macdSignal === "bearish" ? "destructive" : "secondary"}
                    className="text-xs capitalize"
                  >
                    {indicators.macdSignal}
                  </Badge>
                </div>
                {indicators.macdHistogramTrend && (
                  <p className="text-xs text-muted-foreground">
                    Momentum: <span className="font-medium capitalize">{indicators.macdHistogramTrend}</span>
                  </p>
                )}
              </div>
            )}

            {/* Volume Stats */}
            {indicators.volume !== undefined && indicators.avgVolume !== undefined && (
              <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Volume Analysis
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Current</span>
                    <p className="font-mono font-medium">
                      {(indicators.volume / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Avg (20d)</span>
                    <p className="font-mono font-medium">
                      {(indicators.avgVolume / 1_000_000).toFixed(2)}M
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : indicatorsError ? (
          <div className="p-4 rounded-lg bg-loss/10 border border-loss/20 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-loss" />
            <p className="text-sm text-loss font-medium">Error Loading Data</p>
            <p className="text-xs text-muted-foreground mt-1">{indicatorsError}</p>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Insufficient History
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Need 200+ days of data for reliable analysis.
            </p>
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
