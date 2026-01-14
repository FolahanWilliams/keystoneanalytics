import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { EnrichedCandle } from "@/hooks/useChartData";

interface VolumeChartProps {
  data: EnrichedCandle[];
  height?: number;
}

export function VolumeChart({ data, height = 60 }: VolumeChartProps) {
  const volumeData = useMemo(() => {
    return data.map(d => ({
      date: d.date,
      volume: d.volume,
      isUp: d.isUp,
    }));
  }, [data]);

  const maxVolume = useMemo(() => {
    return Math.max(...data.map(d => d.volume || 0));
  }, [data]);

  return (
    <div className="border-t border-border/50 pt-1">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-xs font-medium text-muted-foreground">Volume</span>
        <span className="text-xs font-mono text-muted-foreground">
          {((data[data.length - 1]?.volume || 0) / 1000000).toFixed(2)}M
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={volumeData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis 
            domain={[0, maxVolume * 1.1]}
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number) => [(value / 1000000).toFixed(2) + 'M', 'Volume']}
          />
          <Bar dataKey="volume" radius={[1, 1, 0, 0]}>
            {volumeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isUp ? 'hsl(142, 71%, 45%)' : 'hsl(0, 72%, 51%)'} 
                opacity={0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
