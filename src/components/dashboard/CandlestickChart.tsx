import { useState, useMemo, memo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import { useCandles, useQuotes, TimeframeType } from "@/hooks/useMarketData";
import { Loader2, TrendingUp, TrendingDown, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StockSearch } from "./StockSearch";

interface CandlestickChartProps {
  symbol?: string;
  onSymbolChange?: (symbol: string) => void;
}

const timeframes: TimeframeType[] = ["1H", "4H", "1D", "1W", "1M"];

const CandlestickChart = memo(function CandlestickChart({ symbol = "AAPL", onSymbolChange }: CandlestickChartProps) {
  const [selectedTf, setSelectedTf] = useState<TimeframeType>("1D");
  const [showSearch, setShowSearch] = useState(false);
  const { candles, loading, error, refetch } = useCandles(symbol, selectedTf);
  const { quotes } = useQuotes([symbol]);
  
  const quote = quotes[0];
  const currentPrice = quote?.price || candles[candles.length - 1]?.close || 0;
  const priceChange = quote?.change || 0;
  const priceChangePercent = quote?.changePercent || 0;
  const isPositive = priceChange >= 0;

  // Transform data for the chart
  const chartData = useMemo(() => {
    return candles.map((d, i) => ({
      ...d,
      isUp: d.close >= d.open,
      body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
      wick: [d.low, d.high],
      // Add moving average
      ma20: candles.slice(Math.max(0, i - 19), i + 1).reduce((sum, c) => sum + c.close, 0) / Math.min(i + 1, 20),
    }));
  }, [candles]);

  const priceRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 100 };
    const lows = chartData.map(d => d.low);
    const highs = chartData.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding };
  }, [chartData]);

  const handleSymbolSelect = (newSymbol: string) => {
    onSymbolChange?.(newSymbol);
    setShowSearch(false);
  };

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground text-sm">Failed to load chart data</p>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
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
              <div className="flex items-center gap-3 mt-1">
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
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={refetch}
            disabled={loading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          <div className="flex gap-1">
            {timeframes.map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono rounded-md transition-all",
                  selectedTf === tf
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        {loading && chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--chart-grid))" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
                tickMargin={8}
              />
              <YAxis 
                domain={[priceRange.min, priceRange.max]}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                width={55}
                tickMargin={8}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number | number[], name: string) => {
                  if (name === 'body') {
                    return [`O: $${(value as number[])[0]?.toFixed(2)} C: $${(value as number[])[1]?.toFixed(2)}`, 'Price'];
                  }
                  if (name === 'ma20') {
                    return [`$${(value as number).toFixed(2)}`, 'MA(20)'];
                  }
                  return [value, name];
                }}
              />
              <ReferenceLine 
                y={currentPrice} 
                stroke="hsl(var(--primary))" 
                strokeDasharray="5 5" 
                strokeWidth={1}
              />
              
              {/* Area fill under price line */}
              <Area
                type="monotone"
                dataKey="close"
                stroke="transparent"
                fill="url(#areaGradient)"
              />
              
              {/* Moving Average Line */}
              <Line
                type="monotone"
                dataKey="ma20"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                dot={false}
                opacity={0.7}
              />
              
              {/* Candlestick bars */}
              <Bar
                dataKey="body"
                barSize={6}
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props;
                  if (!payload) return null;
                  const fill = payload.isUp ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)';
                  
                  return (
                    <g>
                      {/* Wick */}
                      <line
                        x1={x + width / 2}
                        y1={props.background?.y + props.background?.height * (1 - (payload.high - priceRange.min) / (priceRange.max - priceRange.min))}
                        x2={x + width / 2}
                        y2={props.background?.y + props.background?.height * (1 - (payload.low - priceRange.min) / (priceRange.max - priceRange.min))}
                        stroke={fill}
                        strokeWidth={1}
                      />
                      {/* Body */}
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={Math.max(height, 2)}
                        fill={fill}
                        rx={1}
                      />
                    </g>
                  );
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Price stats */}
      {quote && (
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50 text-xs font-mono">
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
        </div>
      )}
    </div>
  );
});

export default CandlestickChart;
