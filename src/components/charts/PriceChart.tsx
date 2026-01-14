import { useMemo, useState, useCallback } from "react";
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
import { EnrichedCandle, ChartIndicator } from "@/hooks/useChartData";

interface PriceChartProps {
  data: EnrichedCandle[];
  currentPrice: number;
  indicators: ChartIndicator[];
  showCrosshair: boolean;
  height?: number;
}

export function PriceChart({
  data,
  currentPrice,
  indicators,
  showCrosshair,
  height = 400,
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
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="bbFillGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0.08} />
            <stop offset="100%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0.02} />
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
          interval="preserveStartEnd"
        />
        
        <YAxis 
          domain={[priceRange.min, priceRange.max]}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `$${value.toFixed(value >= 1000 ? 0 : 2)}`}
          width={60}
          tickMargin={8}
        />
        
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '11px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            padding: '8px 12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: 6 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.[0]?.payload) return null;
            const candle = payload[0].payload as EnrichedCandle;
            
            return (
              <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs font-mono">
                <div className="font-semibold text-foreground mb-2">{label}</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <span className="text-muted-foreground">Open:</span>
                  <span>${candle.open.toFixed(2)}</span>
                  <span className="text-muted-foreground">High:</span>
                  <span className="text-gain">${candle.high.toFixed(2)}</span>
                  <span className="text-muted-foreground">Low:</span>
                  <span className="text-loss">${candle.low.toFixed(2)}</span>
                  <span className="text-muted-foreground">Close:</span>
                  <span className={candle.isUp ? "text-gain" : "text-loss"}>
                    ${candle.close.toFixed(2)}
                  </span>
                  {candle.volume && (
                    <>
                      <span className="text-muted-foreground">Volume:</span>
                      <span>{(candle.volume / 1000000).toFixed(2)}M</span>
                    </>
                  )}
                </div>
                {activeOverlays.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1">
                    {candle.sma20 && <div>SMA 20: <span className="text-info">${candle.sma20.toFixed(2)}</span></div>}
                    {candle.sma50 && <div>SMA 50: <span className="text-warning">${candle.sma50.toFixed(2)}</span></div>}
                    {candle.ema12 && <div>EMA 12: <span className="text-accent">${candle.ema12.toFixed(2)}</span></div>}
                    {candle.ema26 && <div>EMA 26: <span className="text-primary">${candle.ema26.toFixed(2)}</span></div>}
                    {candle.bbUpper && <div>BB Upper: ${candle.bbUpper.toFixed(2)}</div>}
                    {candle.bbLower && <div>BB Lower: ${candle.bbLower.toFixed(2)}</div>}
                    {candle.vwap && <div>VWAP: <span className="text-warning">${candle.vwap.toFixed(2)}</span></div>}
                  </div>
                )}
              </div>
            );
          }}
        />
        
        {/* Current price reference line */}
        <ReferenceLine 
          y={currentPrice} 
          stroke="hsl(var(--primary))" 
          strokeDasharray="5 5" 
          strokeWidth={1}
          label={{
            value: `$${currentPrice.toFixed(2)}`,
            fill: 'hsl(var(--primary))',
            fontSize: 10,
            position: 'right',
          }}
        />
        
        {/* Bollinger Bands fill area */}
        {indicators.find(i => i.id === "bb")?.enabled && (
          <>
            <Area
              type="monotone"
              dataKey="bbUpper"
              stroke="transparent"
              fill="url(#bbFillGradient)"
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bbUpper"
              stroke="hsl(180, 100%, 50%)"
              strokeWidth={1}
              dot={false}
              opacity={0.6}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bbMiddle"
              stroke="hsl(180, 100%, 50%)"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              opacity={0.4}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="bbLower"
              stroke="hsl(180, 100%, 50%)"
              strokeWidth={1}
              dot={false}
              opacity={0.6}
              connectNulls
              isAnimationActive={false}
            />
          </>
        )}

        {/* Area fill under close price */}
        <Area
          type="monotone"
          dataKey="close"
          stroke="transparent"
          fill="url(#priceAreaGradient)"
          isAnimationActive={false}
        />

        {/* Moving averages */}
        {indicators.find(i => i.id === "sma20")?.enabled && (
          <Line
            type="monotone"
            dataKey="sma20"
            stroke="hsl(217, 91%, 60%)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}

        {indicators.find(i => i.id === "sma50")?.enabled && (
          <Line
            type="monotone"
            dataKey="sma50"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}

        {indicators.find(i => i.id === "ema12")?.enabled && (
          <Line
            type="monotone"
            dataKey="ema12"
            stroke="hsl(262, 83%, 58%)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}

        {indicators.find(i => i.id === "ema26")?.enabled && (
          <Line
            type="monotone"
            dataKey="ema26"
            stroke="hsl(160, 84%, 45%)"
            strokeWidth={1.5}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}

        {indicators.find(i => i.id === "vwap")?.enabled && (
          <Line
            type="monotone"
            dataKey="vwap"
            stroke="hsl(45, 93%, 47%)"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        )}

        {/* Candlestick bars */}
        <Bar
          dataKey="body"
          barSize={Math.max(4, Math.min(12, 600 / data.length))}
          isAnimationActive={false}
          shape={(props: any) => {
            const { x, y, width, height, payload } = props;
            if (!payload) return null;

            const fill = payload.isUp ? 'hsl(var(--gain))' : 'hsl(var(--loss))';
            const barHeight = (priceRange.max - priceRange.min);
            const chartHeight = props.background?.height || 300;

            const wickTop = chartHeight * (1 - (payload.high - priceRange.min) / barHeight);
            const wickBottom = chartHeight * (1 - (payload.low - priceRange.min) / barHeight);

            return (
              <g>
                {/* Wick */}
                <line
                  x1={x + width / 2}
                  y1={wickTop}
                  x2={x + width / 2}
                  y2={wickBottom}
                  stroke={fill}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={Math.max(height, 1)}
                  fill={fill}
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
