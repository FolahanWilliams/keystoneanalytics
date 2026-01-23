import { memo, useMemo } from "react";
import { LightweightChart } from "./LightweightChart";
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
  // Check which indicators are enabled
  const showSma20 = indicators.find(i => i.id === "sma20")?.enabled ?? true;
  const showSma50 = indicators.find(i => i.id === "sma50")?.enabled ?? true;

  // Transform data to ensure YYYY-MM-DD format for lightweight-charts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(candle => ({
      ...candle,
      // Ensure date is in YYYY-MM-DD format
      date: candle.date.includes('-') 
        ? candle.date 
        : new Date(candle.timestamp * 1000).toISOString().split('T')[0],
    }));
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div 
        className="w-full flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No data available
      </div>
    );
  }

  return (
    <LightweightChart
      data={chartData}
      height={height}
      showCrosshair={showCrosshair}
      showSma20={showSma20}
      showSma50={showSma50}
    />
  );
}

export const PriceChart = memo(PriceChartComponent);
