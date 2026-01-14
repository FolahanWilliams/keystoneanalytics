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
} from "recharts";
import type { EnrichedCandle, ChartIndicator } from "@/types/market";

interface OscillatorChartProps {
  data: EnrichedCandle[];
  indicator: ChartIndicator;
  height?: number;
}

function RSIChartComponent({ data, height = 100 }: { data: EnrichedCandle[]; height?: number }) {
  const rsiData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      rsi: d.rsi,
    }));
  }, [data]);

  return (
    <div className="border-t border-border/50 pt-2">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-medium text-muted-foreground">RSI (14)</span>
        <span className="text-xs font-mono">
          {data[data.length - 1]?.rsi?.toFixed(1) ?? "--"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={rsiData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis 
            domain={[0, 100]} 
            ticks={[30, 50, 70]}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number) => [value?.toFixed(1), 'RSI']}
          />
          
          {/* Overbought/Oversold zones */}
          <ReferenceLine y={70} stroke="hsl(var(--loss))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={30} stroke="hsl(var(--gain))" strokeDasharray="3 3" strokeOpacity={0.5} />
          <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeOpacity={0.3} />
          
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="hsl(var(--accent))"
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function MACDChartComponent({ data, height = 120 }: { data: EnrichedCandle[]; height?: number }) {
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

  return (
    <div className="border-t border-border/50 pt-2">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-medium text-muted-foreground">MACD (12, 26, 9)</span>
        <div className="flex gap-3 text-xs font-mono">
          <span>
            <span className="text-muted-foreground">MACD:</span>{" "}
            <span className="text-info">{lastMacd?.macd?.toFixed(2) ?? "--"}</span>
          </span>
          <span>
            <span className="text-muted-foreground">Signal:</span>{" "}
            <span className="text-warning">{lastMacd?.macdSignal?.toFixed(2) ?? "--"}</span>
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={macdData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--chart-grid))" vertical={false} />
          <XAxis dataKey="date" hide />
          <YAxis 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            width={35}
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number, name: string) => [value?.toFixed(2), name.toUpperCase()]}
          />
          
          <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} />
          
          {/* Histogram bars */}
          <Bar 
            dataKey="histogramPositive" 
            fill="hsl(var(--gain))" 
            opacity={0.7}
            barSize={3}
          />
          <Bar 
            dataKey="histogramNegative" 
            fill="hsl(var(--loss))" 
            opacity={0.7}
            barSize={3}
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
