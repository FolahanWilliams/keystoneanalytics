import { memo, useMemo, useState, useCallback } from "react";
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
import type { EnrichedCandle, ChartIndicator } from "@/types/market";

interface PriceChartProps {
  data: EnrichedCandle[];
  currentPrice: number;
  indicators: ChartIndicator[];
  showCrosshair: boolean;
  height?: number;
}

function PriceChartComponent({
  data,
  currentPrice,
  indicators,
  showCrosshair,
  height = 350,
}: PriceChartProps) {
  const [crosshairData, setCrosshairData] = useState<{ x: number; y: number } | null>(null);

  const priceRange = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 100 };
    const allPrices: number[] = [];
    data.forEach(d => {
      allPrices.push(d.low, d.high);
      if (d.bbUpper) allPrices.push(d.bbUpper);
      if (d.bbLower) allPrices.push(d.bbLower);
    });
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding };
  }, [data]);

  const handleMouseMove = useCallback((e: any) => {
    if (showCrosshair && e?.activeCoordinate) {
      setCrosshairData({ x: e.activeCoordinate.x, y: e.activeCoordinate.y });
    }
  }, [showCrosshair]);

  const handleMouseLeave = useCallback(() => {
    setCrosshairData(null);
  }, []);

  const activeOverlays = indicators.filter(i => i.type === "overlay" && i.enabled);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart 
        data={data} 
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bbFillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.06} />
            <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.01} />
          </linearGradient>
        </defs>
        
        {/* Minimal Grid */}
        <CartesianGrid 
          strokeDasharray="4 4" 
          stroke="hsl(240, 5%, 10%)" 
          vertical={false}
          horizontalPoints={[]}
        />
        
        <XAxis 
          dataKey="date" 
          tick={{ fill: 'hsl(240, 5%, 46%)', fontSize: 9 }}
          axisLine={{ stroke: 'hsl(240, 5%, 12%)' }}
          tickLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
        />
        
        <YAxis 
          domain={[priceRange.min, priceRange.max]}
          tick={{ fill: 'hsl(240, 5%, 46%)', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${value.toFixed(value >= 1000 ? 0 : 2)}`}
          width={52}
          tickMargin={6}
        />
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(240, 6%, 6%)',
            border: '1px solid hsl(240, 5%, 12%)',
            borderRadius: '12px',
            fontSize: '10px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            padding: '10px 12px',
          }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.[0]?.payload) return null;
            const candle = payload[0].payload as EnrichedCandle;
            
            return (
              <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-[10px] font-mono">
                <div className="font-semibold text-foreground mb-2 text-xs">{label}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">O:</span>
                  <span className="tabular-nums">${candle.open.toFixed(2)}</span>
                  <span className="text-muted-foreground">H:</span>
                  <span className="text-gain tabular-nums">${candle.high.toFixed(2)}</span>
                  <span className="text-muted-foreground">L:</span>
                  <span className="text-loss tabular-nums">${candle.low.toFixed(2)}</span>
                  <span className="text-muted-foreground">C:</span>
                  <span className={cn("tabular-nums", candle.isUp ? "text-gain" : "text-loss")}>
                    ${candle.close.toFixed(2)}
                  </span>
                  {candle.volume && (
                    <>
                      <span className="text-muted-foreground">Vol:</span>
                      <span className="tabular-nums">{(candle.volume / 1000000).toFixed(2)}M</span>
                    </>
                  )}
                </div>
              </div>
            );
          }}
        />
        
        {/* Current price line */}
        <ReferenceLine 
          y={currentPrice} 
          stroke="hsl(160, 84%, 39%)" 
          strokeDasharray="4 4" 
          strokeWidth={1}
          label={{
            value: `$${currentPrice.toFixed(2)}`,
            fill: 'hsl(160, 84%, 39%)',
            fontSize: 9,
            position: 'right',
          }}
        />
        
        {/* Bollinger Bands */}
        {indicators.find(i => i.id === "bb")?.enabled && (
          <>
            <Area type="monotone" dataKey="bbUpper" stroke="transparent" fill="url(#bbFillGradient)" connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="bbUpper" stroke="hsl(217, 91%, 60%)" strokeWidth={1} dot={false} opacity={0.5} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="bbMiddle" stroke="hsl(217, 91%, 60%)" strokeWidth={1} strokeDasharray="4 4" dot={false} opacity={0.3} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="bbLower" stroke="hsl(217, 91%, 60%)" strokeWidth={1} dot={false} opacity={0.5} connectNulls isAnimationActive={false} />
          </>
        )}

        {/* Price area fill */}
        <Area type="monotone" dataKey="close" stroke="transparent" fill="url(#priceAreaGradient)" isAnimationActive={false} />

        {/* Moving averages */}
        {indicators.find(i => i.id === "sma20")?.enabled && (
          <Line type="monotone" dataKey="sma20" stroke="hsl(217, 91%, 60%)" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
        )}
        {indicators.find(i => i.id === "sma50")?.enabled && (
          <Line type="monotone" dataKey="sma50" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
        )}
        {indicators.find(i => i.id === "ema12")?.enabled && (
          <Line type="monotone" dataKey="ema12" stroke="hsl(280, 70%, 60%)" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
        )}
        {indicators.find(i => i.id === "ema26")?.enabled && (
          <Line type="monotone" dataKey="ema26" stroke="hsl(160, 84%, 39%)" strokeWidth={1.5} dot={false} connectNulls isAnimationActive={false} />
        )}
        {indicators.find(i => i.id === "vwap")?.enabled && (
          <Line type="monotone" dataKey="vwap" stroke="hsl(38, 92%, 50%)" strokeWidth={1.5} strokeDasharray="6 3" dot={false} connectNulls isAnimationActive={false} />
        )}

        {/* Candlesticks - Emerald up, Rose down */}
        <Bar
          dataKey="body"
          barSize={Math.max(3, Math.min(10, 500 / data.length))}
          isAnimationActive={false}
          shape={(props: any) => {
            const { x, y, width, height, payload } = props;
            if (!payload) return null;

            // Emerald for up, Rose for down
            const fillUp = 'hsl(160, 84%, 39%)';
            const fillDown = 'hsl(350, 89%, 60%)';
            const fill = payload.isUp ? fillUp : fillDown;
            
            const barHeight = (priceRange.max - priceRange.min);
            const chartHeight = props.background?.height || 280;

            const wickTop = chartHeight * (1 - (payload.high - priceRange.min) / barHeight);
            const wickBottom = chartHeight * (1 - (payload.low - priceRange.min) / barHeight);

            return (
              <g>
                <line
                  x1={x + width / 2}
                  y1={wickTop}
                  x2={x + width / 2}
                  y2={wickBottom}
                  stroke={fill}
                  strokeWidth={1}
                />
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={Math.max(height, 1)}
                  fill={payload.isUp ? 'transparent' : fill}
                  stroke={fill}
                  strokeWidth={1}
                  rx={1}
                />
              </g>
            );
          }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Helper for cn in tooltip
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const PriceChart = memo(PriceChartComponent);
