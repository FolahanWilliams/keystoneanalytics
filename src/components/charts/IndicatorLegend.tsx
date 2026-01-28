import { memo } from "react";
import { X } from "lucide-react";
import type { ChartIndicator } from "@/types/market";
import { cn } from "@/lib/utils";

interface IndicatorLegendProps {
  indicators: ChartIndicator[];
  onToggle: (id: string) => void;
}

function IndicatorLegendComponent({ indicators, onToggle }: IndicatorLegendProps) {
  if (indicators.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {indicators.map((indicator) => (
        <button
          key={indicator.id}
          onClick={() => onToggle(indicator.id)}
          className={cn(
            "group flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-medium",
            "bg-accent/50 hover:bg-accent transition-all"
          )}
        >
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: indicator.color }}
          />
          <span className="text-foreground/80">{indicator.shortName}</span>
          <X className="w-2.5 h-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      ))}
    </div>
  );
}

export const IndicatorLegend = memo(IndicatorLegendComponent);
