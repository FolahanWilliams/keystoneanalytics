import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Loader2, TrendingUp, TrendingDown, Search, AlertCircle, RefreshCw, Crosshair, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StockSearch } from "@/components/dashboard/StockSearch";
import { ChartToolbar } from "./ChartToolbar";
import { IndicatorLegend } from "./IndicatorLegend";
import { DrawingToolbar, type DrawingMode } from "./DrawingToolbar";
import { ChartDrawingLayer } from "./ChartDrawingLayer";
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
import { useChartDrawings } from "@/hooks/useChartDrawings";
import { useQuotes } from "@/hooks/useMarketData";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { IChartApi, ISeriesApi } from "lightweight-charts";

interface AdvancedChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export function AdvancedChart({ symbol = "AAPL", onSymbolChange }: AdvancedChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>("1D");
  const [indicators, setIndicators] = useState<ChartIndicator[]>(defaultIndicators);
  const [showSearch, setShowSearch] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartApi, setChartApi] = useState<IChartApi | null>(null);
  const [candleSeries, setCandleSeries] = useState<ISeriesApi<"Candlestick"> | null>(null);

  const { candles, loading, error, refetch, timeframeConfig } = useChartData(symbol, timeframe);
  const { quotes } = useQuotes([symbol]);
  const { 
    drawings, 
    addDrawing, 
    deleteDrawing, 
    clearAllDrawings 
  } = useChartDrawings(symbol, timeframe);
  
  const quote = quotes[0];
  const currentPrice = quote?.price || candles[candles.length - 1]?.close || 0;
  const priceChange = quote?.change || 0;
  const priceChangePercent = quote?.changePercent || 0;
  const isPositive = priceChange >= 0;

  const enrichedData = useEnrichedChartData(candles, indicators);

  // Keyboard shortcuts for drawing tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toUpperCase();
      const shortcuts: Record<string, DrawingMode> = {
        'V': 'select',
        'T': 'trendline',
        'H': 'horizontal',
        'F': 'fibonacci',
        'A': 'annotation',
      };
      
      if (key === 'ESCAPE') {
        setDrawingMode(null);
        return;
      }
      
      if (key in shortcuts) {
        setDrawingMode(shortcuts[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle chart ready callback
  const handleChartReady = useCallback((chart: IChartApi, series: ISeriesApi<"Candlestick">) => {
    if (chart && series) {
      setChartApi(chart);
      setCandleSeries(series);
    } else {
      setChartApi(null);
      setCandleSeries(null);
    }
  }, []);
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
  const activeOverlays = indicators.filter(i => i.type === "overlay" && i.enabled);

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
    <TooltipProvider delayDuration={300}>
      {/* Mobile-responsive container */}
      <div className="h-full flex flex-col p-2 sm:p-4">
        {/* Compact Header - Mobile responsive */}
        <div className="flex items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3 flex-wrap">
          {/* Left: Symbol & Price */}
          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {showSearch ? (
                <motion.div
                  key="search"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 200 }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <StockSearch 
                    onSelect={handleSymbolSelect} 
                    placeholder="Search..." 
                    showInline 
                  />
                </motion.div>
              ) : (
                <motion.button
                  key="symbol"
                  onClick={() => setShowSearch(true)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent/60 hover:bg-accent transition-all group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="font-mono text-sm font-bold text-foreground">{symbol}</span>
                  <Search className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              )}
            </AnimatePresence>

            {!showSearch && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-bold tabular-nums">
                  ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className={cn(
                  "flex items-center gap-1 font-mono text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md tabular-nums font-medium",
                  isPositive ? "bg-gain/15 text-gain" : "bg-loss/15 text-loss"
                )}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="hidden sm:inline">{isPositive ? "+" : ""}{priceChangePercent.toFixed(2)}%</span>
                  <span className="sm:hidden">{isPositive ? "+" : ""}{priceChangePercent.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowCrosshair(!showCrosshair)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    showCrosshair ? "bg-primary/15 text-primary" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {showCrosshair ? "Hide" : "Show"} Crosshair
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={refetch}
                  disabled={loading}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Refresh Data
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Timeframe & Indicators Row - Scrollable on mobile */}
        <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3 overflow-x-auto scrollbar-hide">
          {/* Timeframe Pills - Compact on mobile */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-accent/40 shrink-0">
            {(["1H", "4H", "1D", "1W", "1M", "3M", "1Y"] as TimeframeType[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2 py-1 text-[10px] font-mono font-semibold rounded-md transition-all",
                  timeframe === tf
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Drawing Tools */}
          <DrawingToolbar
            activeMode={drawingMode}
            onModeChange={setDrawingMode}
            onClearAll={clearAllDrawings}
            drawingCount={drawings.length}
            disabled={loading}
          />

          {/* Active Indicators Legend + Toolbar */}
          <div className="flex items-center gap-2">
            {activeOverlays.length > 0 && (
              <IndicatorLegend indicators={activeOverlays} onToggle={toggleIndicator} />
            )}
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
        </div>

        {/* Chart Area */}
        <div className="flex-1 min-h-0 relative rounded-lg overflow-hidden bg-[hsl(var(--chart-bg))]">
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-10"
              >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/80 border border-border">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Loading...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {hasInsufficientData && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-warning/10 text-warning text-[10px] px-2 py-1 rounded-md border border-warning/20"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Need {minDataRequired} bars for indicators ({candles.length} available)</span>
            </motion.div>
          )}

          {enrichedData.length > 0 ? (
            <div className="h-full flex flex-col" ref={chartContainerRef}>
              <div className="flex-1 min-h-0 relative">
                <PriceChart
                  data={enrichedData}
                  currentPrice={currentPrice}
                  indicators={indicators}
                  showCrosshair={showCrosshair}
                  height={priceChartHeight}
                  onChartReady={handleChartReady}
                />
                {/* Drawing layer overlay */}
                <ChartDrawingLayer
                  chart={chartApi}
                  candleSeries={candleSeries}
                  drawings={drawings}
                  activeMode={drawingMode}
                  onAddDrawing={addDrawing}
                  onDeleteDrawing={deleteDrawing}
                  containerRef={chartContainerRef}
                />
              </div>
              <VolumeChart data={enrichedData} height={40} />
              {showRSI && <RSIChart data={enrichedData} height={65} />}
              {showMACD && <MACDChart data={enrichedData} height={80} />}
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
          <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-border/40 text-[10px] font-mono">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase tracking-wide">H</span>
              <span className="text-gain font-medium tabular-nums">${quote.high.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase tracking-wide">L</span>
              <span className="text-loss font-medium tabular-nums">${quote.low.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase tracking-wide">O</span>
              <span className="font-medium tabular-nums">${quote.open.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground uppercase tracking-wide">Prev</span>
              <span className="font-medium tabular-nums">${quote.previousClose.toFixed(2)}</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {timeframeConfig.label}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

export default AdvancedChart;
