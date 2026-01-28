import { useState, useMemo, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, Search, AlertCircle, RefreshCw, Crosshair, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { ChartToolbar } from "./ChartToolbar";
import { PriceChart } from "./PriceChart";
import { VolumeChart } from "./VolumeChart";
import { RSIChart, MACDChart } from "./OscillatorChart";
import { 
  useChartData, 
  useEnrichedChartData, 
  TimeframeType, 
  ChartIndicator,
  defaultIndicators 
} from "@/hooks/useChartData";
import { useQuotes } from "@/hooks/useMarketData";
import { motion } from "framer-motion";

interface AdvancedChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export function AdvancedChart({ symbol = "AAPL", onSymbolChange }: AdvancedChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>("1D");
  const [indicators, setIndicators] = useState<ChartIndicator[]>(defaultIndicators);
  const [showSearch, setShowSearch] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);

  const { candles, loading, error, refetch, timeframeConfig } = useChartData(symbol, timeframe);
  const { quotes } = useQuotes([symbol]);
  
  const quote = quotes[0];
  const currentPrice = quote?.price || candles[candles.length - 1]?.close || 0;
  const priceChange = quote?.change || 0;
  const priceChangePercent = quote?.changePercent || 0;
  const isPositive = priceChange >= 0;

  const enrichedData = useEnrichedChartData(candles, indicators);

  // Calculate minimum data required for enabled indicators
  const minDataRequired = useMemo(() => {
    let min = 1;
    if (indicators.find(i => i.id === "sma20")?.enabled) min = Math.max(min, 20);
    if (indicators.find(i => i.id === "sma50")?.enabled) min = Math.max(min, 50);
    if (indicators.find(i => i.id === "rsi")?.enabled) min = Math.max(min, 14);
    if (indicators.find(i => i.id === "macd")?.enabled) min = Math.max(min, 26);
    if (indicators.find(i => i.id === "bb")?.enabled) min = Math.max(min, 20);
    if (indicators.find(i => i.id === "ema12")?.enabled) min = Math.max(min, 12);
    if (indicators.find(i => i.id === "ema26")?.enabled) min = Math.max(min, 26);
    return min;
  }, [indicators]);

  const hasInsufficientData = candles.length > 0 && candles.length < minDataRequired;

  const toggleIndicator = useCallback((id: string) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
  }, []);

  const handleSymbolSelect = useCallback((newSymbol: string) => {
    onSymbolChange?.(newSymbol);
    setShowSearch(false);
  }, [onSymbolChange]);

  const showRSI = indicators.find(i => i.id === "rsi")?.enabled;
  const showMACD = indicators.find(i => i.id === "macd")?.enabled;

  const priceChartHeight = useMemo(() => {
    let height = 320;
    if (showRSI) height -= 45;
    if (showMACD) height -= 55;
    return Math.max(height, 180);
  }, [showRSI, showMACD]);

  const errorMessage = useMemo(() => {
    if (error === "no_data") {
      if (timeframe === "4H") {
        return "Intraday data requires a premium subscription. Try Daily, Weekly, or Monthly timeframes.";
      }
      return "Market data temporarily unavailable. Try again shortly.";
    }
    return `Failed to load chart: ${error}`;
  }, [error, timeframe]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 p-8">
        <AlertCircle className="w-10 h-10 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          {errorMessage}
        </p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5 h-8 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header - Floating Symbol Chip */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {showSearch ? (
            <div className="w-56">
              <StockSearch onSelect={handleSymbolSelect} placeholder="Search..." showInline />
            </div>
          ) : (
            <motion.button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-accent/50 hover:bg-accent transition-colors group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="font-mono text-base font-bold text-foreground">{symbol}</span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
              <Search className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          )}
          
          {!showSearch && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold tabular-nums">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className={cn(
                "flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-lg tabular-nums",
                isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
              )}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Mini Toolbar */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowCrosshair(!showCrosshair)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showCrosshair ? "bg-primary/10 text-primary" : "hover:bg-accent text-muted-foreground"
            )}
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Timeframe Pills */}
      <div className="flex items-center gap-1 mb-3">
        {(["4H", "1D", "1W", "1M", "3M", "1Y"] as TimeframeType[]).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-mono font-medium rounded-lg transition-all",
              timeframe === tf
                ? "bg-primary text-primary-foreground"
                : "bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground"
            )}
          >
            {tf}
          </button>
        ))}
        
        <div className="flex-1" />
        
        {/* Indicators button */}
        <ChartToolbar
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          indicators={indicators}
          onToggleIndicator={toggleIndicator}
          loading={loading}
          onRefresh={refetch}
          showCrosshair={showCrosshair}
          onToggleCrosshair={() => setShowCrosshair(!showCrosshair)}
        />
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {hasInsufficientData && (
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-warning/10 text-warning text-xs px-2.5 py-1.5 rounded-lg border border-warning/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Insufficient data for indicators ({candles.length}/{minDataRequired} bars)</span>
          </div>
        )}
        {enrichedData.length > 0 ? (
          <div className="h-full flex flex-col gap-0">
            <div className="flex-1 min-h-0">
              <PriceChart
                data={enrichedData}
                currentPrice={currentPrice}
                indicators={indicators}
                showCrosshair={showCrosshair}
                height={priceChartHeight}
              />
            </div>
            <VolumeChart data={enrichedData} height={44} />
            {showRSI && <RSIChart data={enrichedData} height={70} />}
            {showMACD && <MACDChart data={enrichedData} height={85} />}
          </div>
        ) : (
          !loading && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              No data available for this timeframe
            </div>
          )
        )}
      </div>

      {/* Footer Stats */}
      {quote && (
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">H</span>
            <span className="text-gain tabular-nums">${quote.high.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">L</span>
            <span className="text-loss tabular-nums">${quote.low.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">O</span>
            <span className="tabular-nums">${quote.open.toFixed(2)}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-muted-foreground">{timeframeConfig.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedChart;
