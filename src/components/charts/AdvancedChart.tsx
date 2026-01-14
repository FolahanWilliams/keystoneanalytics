import { useState, useMemo, useCallback } from "react";
import { Loader2, TrendingUp, TrendingDown, Search, AlertCircle } from "lucide-react";
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

interface AdvancedChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

export function AdvancedChart({ symbol = "AAPL", onSymbolChange }: AdvancedChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeType>("1D");
  const [indicators, setIndicators] = useState<ChartIndicator[]>(defaultIndicators);
  const [showSearch, setShowSearch] = useState(false);
  const [showCrosshair, setShowCrosshair] = useState(false);

  // Fetch data
  const { candles, loading, error, refetch, timeframeConfig } = useChartData(symbol, timeframe);
  const { quotes } = useQuotes([symbol]);
  
  // Get current quote
  const quote = quotes[0];
  const currentPrice = quote?.price || candles[candles.length - 1]?.close || 0;
  const priceChange = quote?.change || 0;
  const priceChangePercent = quote?.changePercent || 0;
  const isPositive = priceChange >= 0;

  // Enrich candles with indicator data
  const enrichedData = useEnrichedChartData(candles, indicators);

  // Toggle indicator
  const toggleIndicator = useCallback((id: string) => {
    setIndicators(prev => prev.map(ind => 
      ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
    ));
  }, []);

  // Handle symbol selection
  const handleSymbolSelect = useCallback((newSymbol: string) => {
    onSymbolChange?.(newSymbol);
    setShowSearch(false);
  }, [onSymbolChange]);

  // Check which oscillators are enabled
  const showRSI = indicators.find(i => i.id === "rsi")?.enabled;
  const showMACD = indicators.find(i => i.id === "macd")?.enabled;

  // Calculate chart height dynamically
  const priceChartHeight = useMemo(() => {
    let height = 340;
    if (showRSI) height -= 50;
    if (showMACD) height -= 60;
    return Math.max(height, 200);
  }, [showRSI, showMACD]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-12 h-12 text-destructive/50" />
        <p className="text-muted-foreground text-sm text-center">Failed to load chart data</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <Loader2 className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-4">
          {showSearch ? (
            <div className="w-64">
              <StockSearch 
                onSelect={handleSymbolSelect}
                placeholder="Search stocks..."
                showInline
              />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 hover:bg-secondary/50 px-2 py-1 rounded-lg transition-colors group"
            >
              <h2 className="text-xl font-bold font-mono flex items-center gap-2">
                {symbol}
                {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
              </h2>
              <Search className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}
          
          {!showSearch && (
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-sm font-mono px-2 py-0.5 rounded-md",
                  isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
                )}
              >
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? "+" : ""}
                {priceChangePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
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

      {/* Chart Area */}
      <div className="flex-1 min-h-0 mt-2">
        {loading && enrichedData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="h-full flex flex-col gap-0">
            {/* Main price chart */}
            <div className="flex-1 min-h-0">
              <PriceChart
                data={enrichedData}
                currentPrice={currentPrice}
                indicators={indicators}
                showCrosshair={showCrosshair}
                height={priceChartHeight}
              />
            </div>

            {/* Volume chart - tight coupling with price chart */}
            <VolumeChart data={enrichedData} height={50} />

            {/* RSI */}
            {showRSI && <RSIChart data={enrichedData} height={80} />}

            {/* MACD */}
            {showMACD && <MACDChart data={enrichedData} height={100} />}
          </div>
        )}
      </div>

      {/* Price stats footer */}
      {quote && (
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border/50 text-xs font-mono px-1">
          <div>
            <span className="text-muted-foreground">High</span>
            <span className="ml-2 text-gain">${quote.high.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Low</span>
            <span className="ml-2 text-loss">${quote.low.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Open</span>
            <span className="ml-2">${quote.open.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Prev Close</span>
            <span className="ml-2">${quote.previousClose.toFixed(2)}</span>
          </div>
          <div className="ml-auto">
            <span className="text-muted-foreground">Timeframe:</span>
            <span className="ml-2 text-primary">{timeframeConfig.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdvancedChart;
