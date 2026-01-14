import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Settings2, 
  Crosshair, 
  TrendingUp,
  Maximize2
} from "lucide-react";
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

const timeframes: TimeframeType[] = ["1H", "4H", "1D", "1W", "1M"];

export function ChartToolbar({
  timeframe,
  onTimeframeChange,
  indicators,
  onToggleIndicator,
  loading,
  onRefresh,
  showCrosshair,
  onToggleCrosshair,
  onFullscreen,
}: ChartToolbarProps) {
  const [indicatorMenuOpen, setIndicatorMenuOpen] = useState(false);

  const overlayIndicators = indicators.filter(i => i.type === "overlay");
  const oscillatorIndicators = indicators.filter(i => i.type === "oscillator");
  const activeCount = indicators.filter(i => i.enabled).length;

  return (
    <div className="flex items-center justify-between gap-2 px-1">
      {/* Left: Timeframe buttons */}
      <div className="flex items-center gap-1">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono rounded-md transition-all font-medium",
              timeframe === tf
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-1">
        {/* Crosshair toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCrosshair}
          className={cn("h-8 w-8", showCrosshair && "bg-primary/10 text-primary")}
          title="Toggle crosshair"
        >
          <Crosshair className="w-4 h-4" />
        </Button>

        {/* Indicators menu */}
        <Popover open={indicatorMenuOpen} onOpenChange={setIndicatorMenuOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn(
                "h-8 gap-1.5 px-2",
                activeCount > 0 && "bg-primary/10 text-primary"
              )}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Indicators</span>
              {activeCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground font-bold">
                  {activeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0">
            <div className="p-3 border-b border-border">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Technical Indicators
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Toggle indicators to display on the chart
              </p>
            </div>
            
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Overlays
              </div>
              {overlayIndicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2" 
                      style={{ borderColor: indicator.color, backgroundColor: indicator.enabled ? indicator.color : 'transparent' }}
                    />
                    <Label 
                      htmlFor={indicator.id} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {indicator.shortName}
                    </Label>
                  </div>
                  <Switch
                    id={indicator.id}
                    checked={indicator.enabled}
                    onCheckedChange={() => onToggleIndicator(indicator.id)}
                  />
                </div>
              ))}
              
              <Separator className="my-2" />
              
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                Oscillators
              </div>
              {oscillatorIndicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border-2" 
                      style={{ borderColor: indicator.color, backgroundColor: indicator.enabled ? indicator.color : 'transparent' }}
                    />
                    <Label 
                      htmlFor={indicator.id} 
                      className="text-sm font-medium cursor-pointer"
                    >
                      {indicator.shortName}
                    </Label>
                  </div>
                  <Switch
                    id={indicator.id}
                    checked={indicator.enabled}
                    onCheckedChange={() => onToggleIndicator(indicator.id)}
                  />
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 w-8"
          title="Refresh data"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>

        {/* Fullscreen */}
        {onFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreen}
            className="h-8 w-8"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
