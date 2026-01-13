import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Indicator {
  id: string;
  name: string;
  shortName: string;
  value: number;
  signal: "buy" | "sell" | "neutral";
  enabled: boolean;
}

const initialIndicators: Indicator[] = [
  { id: "rsi", name: "Relative Strength Index", shortName: "RSI", value: 58.4, signal: "neutral", enabled: true },
  { id: "macd", name: "MACD", shortName: "MACD", value: 125.5, signal: "buy", enabled: true },
  { id: "sma20", name: "SMA (20)", shortName: "SMA 20", value: 44850, signal: "buy", enabled: true },
  { id: "sma50", name: "SMA (50)", shortName: "SMA 50", value: 43200, signal: "buy", enabled: false },
  { id: "ema12", name: "EMA (12)", shortName: "EMA 12", value: 45100, signal: "buy", enabled: false },
  { id: "bb", name: "Bollinger Bands", shortName: "BB", value: 44500, signal: "neutral", enabled: false },
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

const TechnicalIndicators = () => {
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Technical Indicators</h3>
        </div>
        <span className="text-xs text-muted-foreground">{enabledCount} active</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/30 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gain">{buySignals}</div>
          <div className="text-xs text-muted-foreground">Buy</div>
        </div>
        <div className="text-center border-x border-border">
          <div className="text-lg font-bold text-muted-foreground">
            {enabledCount - buySignals - sellSignals}
          </div>
          <div className="text-xs text-muted-foreground">Neutral</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-loss">{sellSignals}</div>
          <div className="text-xs text-muted-foreground">Sell</div>
        </div>
      </div>

      {/* Indicators List */}
      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-terminal">
        {indicators.map((indicator) => {
          const signalConfig = getSignalConfig(indicator.signal);
          const SignalIcon = signalConfig.icon;

          return (
            <div
              key={indicator.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border transition-all",
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
                  className="cursor-pointer"
                >
                  <span className="font-medium text-sm">{indicator.shortName}</span>
                  <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
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
                  <span className={cn("flex items-center gap-1 text-xs", signalConfig.className)}>
                    <SignalIcon className="w-3 h-3" />
                    {signalConfig.label}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TechnicalIndicators;
