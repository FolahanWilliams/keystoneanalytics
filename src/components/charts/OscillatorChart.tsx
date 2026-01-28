import { memo, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
} from "recharts";
import type { EnrichedCandle, ChartIndicator } from "@/types/market";
import { cn } from "@/lib/utils";

interface OscillatorChartProps {
  data: EnrichedCandle[];
  indicator: ChartIndicator;
  height?: number;
}

function RSIChartComponent({ data, height = 80 }: { data: EnrichedCandle[]; height?: number }) {
  const rsiData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      rsi: d.rsi,
    }));
  }, [data]);

  const currentRSI = data[data.length - 1]?.rsi;
  const rsiStatus = currentRSI !== undefined 
    ? currentRSI >= 70 ? "overbought" : currentRSI <= 30 ? "oversold" : "neutral"
    : "neutral";

  return (
    <div className="border-t border-border/30">
      <div className="flex items-center justify-between px-3 py-1.5 bg-accent/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">RSI</span>
          <span className="text-[9px] text-muted-foreground/60">(14)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs font-mono font-semibold tabular-nums",
            rsiStatus === "overbought" ? "text-loss" : 
            rsiStatus === "oversold" ? "text-gain" : "text-foreground"
          )}>
            {currentRSI?.toFixed(1) ?? "--"}
          </span>
          {rsiStatus !== "neutral" && (
            <span className={cn(
              "text-[9px] font-medium px-1.5 py-0.5 rounded",
              rsiStatus === "overbought" ? "bg-loss/10 text-loss" : "bg-gain/10 text-gain"
            )}>
              {rsiStatus === "overbought" ? "Overbought" : "Oversold"}
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rsiData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--chart-grid))" vertical={false} opacity={0.5} />
          <XAxis dataKey="date" hide />
          <YAxis 
            domain={[0, 100]} 
            ticks={[30, 70]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '10px',
              padding: '6px 10px',
            }}
            formatter={(value: number) => [value?.toFixed(1), 'RSI']}
          />
          
          {/* Overbought/Oversold zones */}
          <ReferenceLine y={70} stroke="hsl(var(--loss))" strokeDasharray="4 2" strokeOpacity={0.4} strokeWidth={1} />
          <ReferenceLine y={30} stroke="hsl(var(--gain))" strokeDasharray="4 2" strokeOpacity={0.4} strokeWidth={1} />
          
          <Area
            type="monotone"
            dataKey="rsi"
            stroke="transparent"
            fill="url(#rsiGradient)"
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function MACDChartComponent({ data, height = 100 }: { data: EnrichedCandle[]; height?: number }) {
  const macdData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      macd: d.macd,
      signal: d.macdSignal,
      histogram: d.macdHistogram,
      histogramPositive: d.macdHistogram && d.macdHistogram >= 0 ? d.macdHistogram : null,
      histogramNegative: d.macdHistogram && d.macdHistogram < 0 ? d.macdHistogram : null,
    }));
  }, [data]);

  const lastMacd = data[data.length - 1];
  const isBullish = (lastMacd?.macd ?? 0) > (lastMacd?.macdSignal ?? 0);

  return (
    <div className="border-t border-border/30">
      <div className="flex items-center justify-between px-3 py-1.5 bg-accent/20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">MACD</span>
          <span className="text-[9px] text-muted-foreground/60">(12, 26, 9)</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-info" />
            <span className="text-muted-foreground">MACD</span>
            <span className="text-info font-medium tabular-nums">{lastMacd?.macd?.toFixed(2) ?? "--"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            <span className="text-muted-foreground">Sig</span>
            <span className="text-warning font-medium tabular-nums">{lastMacd?.macdSignal?.toFixed(2) ?? "--"}</span>
          </div>
          <span className={cn(
            "text-[9px] font-medium px-1.5 py-0.5 rounded",
            isBullish ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
          )}>
            {isBullish ? "Bullish" : "Bearish"}
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={macdData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 2" stroke="hsl(var(--chart-grid))" vertical={false} opacity={0.5} />
          <XAxis dataKey="date" hide />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
            axisLine={false}
            tickLine={false}
            width={28}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '10px',
              padding: '6px 10px',
            }}
            formatter={(value: number, name: string) => [value?.toFixed(2), name.toUpperCase()]}
          />
          
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
          
          {/* Histogram bars */}
          <Bar 
            dataKey="histogramPositive" 
            fill="hsl(var(--gain))" 
            opacity={0.6}
            radius={[1, 1, 0, 0]}
          />
          <Bar 
            dataKey="histogramNegative" 
            fill="hsl(var(--loss))" 
            opacity={0.6}
            radius={[0, 0, 1, 1]}
          />
          
          {/* MACD line */}
          <Line
            type="monotone"
            dataKey="macd"
            stroke="hsl(var(--info))"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
          
          {/* Signal line */}
          <Line
            type="monotone"
            dataKey="signal"
            stroke="hsl(var(--warning))"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export const RSIChart = memo(RSIChartComponent);
export const MACDChart = memo(MACDChartComponent);
