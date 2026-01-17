import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeframeType, ChartIndicator } from "@/hooks/useChartData";

interface ChartToolbarProps {
  timeframe: TimeframeType;
  onTimeframeChange: (tf: TimeframeType) => void;
  indicators: ChartIndicator[];
  onToggleIndicator: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
  showCrosshair: boolean;
  onToggleCrosshair: () => void;
  onFullscreen?: () => void;
}

export function ChartToolbar({
  indicators,
  onToggleIndicator,
}: ChartToolbarProps) {
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);

  const overlayIndicators = indicators.filter(i => i.type === "overlay");
  const oscillatorIndicators = indicators.filter(i => i.type === "oscillator");
  const activeCount = indicators.filter(i => i.enabled).length;

  return (
    <Popover open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
            activeCount > 0 
              ? "bg-primary/10 text-primary" 
              : "bg-accent/50 hover:bg-accent text-muted-foreground"
          )}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Indicators</span>
          {activeCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] rounded-full bg-primary text-primary-foreground font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0 bg-card border-border">
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-semibold">Technical Indicators</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">Toggle chart overlays</p>
        </div>
        
        <div className="p-2">
          <div className="data-label px-2 py-1">Overlays</div>
          {overlayIndicators.map((indicator) => (
            <div
              key={indicator.id}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: indicator.enabled ? indicator.color : 'transparent', border: `2px solid ${indicator.color}` }}
                />
                <Label htmlFor={indicator.id} className="text-xs font-medium cursor-pointer">
                  {indicator.shortName}
                </Label>
              </div>
              <Switch
                id={indicator.id}
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="scale-90"
              />
            </div>
          ))}
          
          <Separator className="my-2" />
          
          <div className="data-label px-2 py-1">Oscillators</div>
          {oscillatorIndicators.map((indicator) => (
            <div
              key={indicator.id}
              className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: indicator.enabled ? indicator.color : 'transparent', border: `2px solid ${indicator.color}` }}
                />
                <Label htmlFor={indicator.id} className="text-xs font-medium cursor-pointer">
                  {indicator.shortName}
                </Label>
              </div>
              <Switch
                id={indicator.id}
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="scale-90"
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
