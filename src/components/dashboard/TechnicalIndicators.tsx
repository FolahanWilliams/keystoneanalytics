import { Activity, TrendingUp, TrendingDown, Lightbulb, GraduationCap } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { EducationTooltip } from "@/components/education/EducationTooltip";
import { EducationPopover } from "@/components/education/EducationTooltip";
import { Link } from "react-router-dom";

interface Indicator {
  id: string;
  name: string;
  shortName: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  enabled: boolean;
  educationKey: string;
}

const initialIndicators: Indicator[] = [
  { id: "rsi", name: "Relative Strength Index", shortName: "RSI", value: 58.4, signal: "neutral", enabled: true, educationKey: "rsi" },
  { id: "macd", name: "MACD", shortName: "MACD", value: 125.5, signal: "buy", enabled: true, educationKey: "macd" },
  { id: "sma20", name: "SMA (20)", shortName: "SMA 20", value: 44850, signal: "buy", enabled: true, educationKey: "sma" },
  { id: "sma50", name: "SMA (50)", shortName: "SMA 50", value: 43200, signal: "buy", enabled: false, educationKey: "sma" },
  { id: "ema12", name: "EMA (12)", shortName: "EMA 12", value: 45100, signal: "buy", enabled: false, educationKey: "ema" },
  { id: "bb", name: "Bollinger Bands", shortName: "BB", value: 44500, signal: "neutral", enabled: false, educationKey: "bollinger" },
];

const getSignalConfig = (signal: Indicator["signal"]) => {
  switch (signal) {
    case "buy":
      return { icon: TrendingUp, label: "Buy", className: "text-gain" };
    case "sell":
      return { icon: TrendingDown, label: "Sell", className: "text-loss" };
    default:
      return { icon: Activity, label: "Neutral", className: "text-muted-foreground" };
  }
};

const getSignalExplanation = (indicator: Indicator): string => {
  const { signal, shortName, value } = indicator;
  
  if (indicator.id === "rsi") {
    if (value >= 70) return `${shortName} at ${value.toFixed(1)} indicates overbought conditions - potential pullback ahead`;
    if (value <= 30) return `${shortName} at ${value.toFixed(1)} indicates oversold conditions - potential bounce opportunity`;
    if (value > 50) return `${shortName} at ${value.toFixed(1)} shows bullish momentum`;
    return `${shortName} at ${value.toFixed(1)} shows bearish momentum`;
  }
  
  if (indicator.id === "macd") {
    if (value > 0) return `${shortName} positive at ${value.toFixed(1)} - bullish momentum`;
    return `${shortName} negative at ${value.toFixed(1)} - bearish momentum`;
  }
  
  return `${shortName} generating ${signal} signal`;
};

interface TechnicalIndicatorsProps {
  symbol?: string;
  price?: number;
  change?: number;
}

const TechnicalIndicators = ({ symbol = "AAPL", price, change }: TechnicalIndicatorsProps) => {
  const [indicators, setIndicators] = useState(initialIndicators);

  const toggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  const enabledCount = indicators.filter((i) => i.enabled).length;
  const buySignals = indicators.filter((i) => i.enabled && i.signal === "buy").length;
  const sellSignals = indicators.filter((i) => i.enabled && i.signal === "sell").length;

  const educationContext = { symbol, price, change };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Technical Indicators</h3>
          <EducationTooltip topic="rsi" context={educationContext} showIcon={false}>
            <Lightbulb className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary transition-colors cursor-help" />
          </EducationTooltip>
        </div>
        <span className="text-xs text-muted-foreground">{enabledCount} active</span>
      </div>

      {/* Summary with education tooltips */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30 mb-4">
        <EducationTooltip topic="bullish" context={educationContext} showIcon={false}>
          <div className="text-center cursor-help">
            <div className="text-lg font-bold text-gain">{buySignals}</div>
            <div className="text-xs text-muted-foreground">Buy</div>
          </div>
        </EducationTooltip>
        <div className="text-center border-x border-border">
          <div className="text-lg font-bold text-muted-foreground">
            {enabledCount - buySignals - sellSignals}
          </div>
          <div className="text-xs text-muted-foreground">Neutral</div>
        </div>
        <EducationTooltip topic="bearish" context={educationContext} showIcon={false}>
          <div className="text-center cursor-help">
            <div className="text-lg font-bold text-loss">{sellSignals}</div>
            <div className="text-xs text-muted-foreground">Sell</div>
          </div>
        </EducationTooltip>
      </div>

      {/* Indicators List with education */}
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-terminal">
        {indicators.map((indicator) => {
          const signalConfig = getSignalConfig(indicator.signal);
          const SignalIcon = signalConfig.icon;

          return (
            <div
              key={indicator.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all group",
                indicator.enabled
                  ? "bg-card/50 border-border/50"
                  : "bg-secondary/20 border-transparent opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <Switch
                  id={indicator.id}
                  checked={indicator.enabled}
                  onCheckedChange={() => toggleIndicator(indicator.id)}
                />
                <Label
                  htmlFor={indicator.id}
                  className="cursor-pointer flex items-center gap-1.5"
                >
                  <span className="font-medium text-sm">{indicator.shortName}</span>
                  <EducationPopover 
                    topic={indicator.educationKey} 
                    context={{ ...educationContext, indicator: indicator.id, indicatorValue: indicator.value }}
                  >
                    <Lightbulb className="w-3 h-3 text-muted-foreground/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  </EducationPopover>
                  <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                    {indicator.name}
                  </span>
                </Label>
              </div>

              {indicator.enabled && (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {indicator.id === "rsi"
                      ? indicator.value.toFixed(1)
                      : indicator.id === "macd"
                      ? indicator.value.toFixed(1)
                      : `$${indicator.value.toLocaleString()}`}
                  </span>
                  <EducationTooltip topic={indicator.signal === "buy" ? "bullish" : indicator.signal === "sell" ? "bearish" : "support"}>
                    <span className={cn("flex items-center gap-1 text-xs cursor-help", signalConfig.className)}>
                      <SignalIcon className="w-3 h-3" />
                      {signalConfig.label}
                    </span>
                  </EducationTooltip>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Learn More Link */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <Link to="/dashboard/learn?topic=rsi">
          <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:text-foreground">
            <GraduationCap className="w-4 h-4" />
            Learn about indicators
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default TechnicalIndicators;
