import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings2, ChevronDown } from "lucide-react";
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
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all",
            activeCount > 0 
              ? "bg-primary/15 text-primary hover:bg-primary/20" 
              : "bg-accent/60 hover:bg-accent text-muted-foreground"
          )}
        >
          <Settings2 className="w-3 h-3" />
          <span className="hidden sm:inline">Indicators</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 flex items-center justify-center text-[9px] rounded-full bg-primary text-primary-foreground font-bold">
              {activeCount}
            </span>
          )}
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform",
            indicatorMenuOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-56 p-0 bg-card/95 backdrop-blur-sm border-border shadow-xl"
        sideOffset={8}
      >
        <div className="px-3 py-2.5 border-b border-border/50">
          <h4 className="text-[11px] font-semibold">Technical Indicators</h4>
          <p className="text-[9px] text-muted-foreground mt-0.5">Toggle overlays & oscillators</p>
        </div>
        
        <div className="p-1.5 max-h-[280px] overflow-y-auto scrollbar-terminal">
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Overlays
          </div>
          {overlayIndicators.map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => onToggleIndicator(indicator.id)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors",
                indicator.enabled ? "bg-accent/60" : "hover:bg-accent/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-all",
                    indicator.enabled ? "scale-100" : "scale-75 opacity-50"
                  )}
                  style={{ backgroundColor: indicator.color }}
                />
                <span className="text-[11px] font-medium">
                  {indicator.shortName}
                </span>
              </div>
              <Switch
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="scale-75"
              />
            </button>
          ))}
          
          <Separator className="my-1.5" />
          
          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
            Oscillators
          </div>
          {oscillatorIndicators.map((indicator) => (
            <button
              key={indicator.id}
              onClick={() => onToggleIndicator(indicator.id)}
              className={cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors",
                indicator.enabled ? "bg-accent/60" : "hover:bg-accent/40"
              )}
            >
              <div className="flex items-center gap-2">
                <span 
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0 transition-all",
                    indicator.enabled ? "scale-100" : "scale-75 opacity-50"
                  )}
                  style={{ backgroundColor: indicator.color }}
                />
                <span className="text-[11px] font-medium">
                  {indicator.shortName}
                </span>
              </div>
              <Switch
                checked={indicator.enabled}
                onCheckedChange={() => onToggleIndicator(indicator.id)}
                className="scale-75"
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
