import { memo, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import type { EnrichedCandle } from "@/types/market";

interface VolumeChartProps {
  data: EnrichedCandle[];
  height?: number;
}

function VolumeChartComponent({ data, height = 50 }: VolumeChartProps) {
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

  const avgVolume = useMemo(() => {
    const total = data.reduce((sum, d) => sum + (d.volume || 0), 0);
    return total / data.length;
  }, [data]);

  const currentVolume = data[data.length - 1]?.volume || 0;
  const isAboveAvg = currentVolume > avgVolume;

  return (
    <div className="border-t border-border/30">
      <div className="flex items-center justify-between px-3 py-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Vol</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-medium tabular-nums text-foreground">
            {(currentVolume / 1000000).toFixed(2)}M
          </span>
          {isAboveAvg && (
            <span className="text-[9px] text-primary font-medium">+Avg</span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={volumeData} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" hide />
          <YAxis 
            domain={[0, maxVolume * 1.1]}
            hide
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '10px',
              padding: '6px 10px',
            }}
            formatter={(value: number) => [(value / 1000000).toFixed(2) + 'M', 'Volume']}
          />
          <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
            {volumeData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isUp ? 'hsl(var(--gain))' : 'hsl(var(--loss))'} 
                opacity={0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const VolumeChart = memo(VolumeChartComponent);
