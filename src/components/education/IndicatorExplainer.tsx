import { useState } from "react";
import { Lightbulb, ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EducationPopover } from "./EducationTooltip";
import { EducationContext } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";

interface IndicatorExplainerProps {
  indicator: "rsi" | "macd" | "volume" | "bollinger_bands" | "moving_average";
  value: number;
  context: EducationContext;
  className?: string;
  compact?: boolean;
}

interface IndicatorAnalysis {
  status: "bullish" | "bearish" | "neutral";
  label: string;
  description: string;
  actionHint: string;
}

function analyzeIndicator(indicator: string, value: number): IndicatorAnalysis {
  switch (indicator) {
    case "rsi":
      if (value >= 70) {
        return {
          status: "bearish",
          label: "Overbought",
          description: `RSI at ${value.toFixed(1)} indicates overbought conditions`,
          actionHint: "Consider taking profits or waiting for pullback"
        };
      } else if (value <= 30) {
        return {
          status: "bullish",
          label: "Oversold",
          description: `RSI at ${value.toFixed(1)} indicates oversold conditions`,
          actionHint: "Potential buying opportunity, watch for reversal confirmation"
        };
      } else if (value > 50) {
        return {
          status: "bullish",
          label: "Bullish Momentum",
          description: `RSI at ${value.toFixed(1)} shows bullish momentum`,
          actionHint: "Trend favors buyers"
        };
      } else {
        return {
          status: "bearish",
          label: "Bearish Momentum",
          description: `RSI at ${value.toFixed(1)} shows bearish momentum`,
          actionHint: "Trend favors sellers"
        };
      }

    case "macd":
      if (value > 0.5) {
        return {
          status: "bullish",
          label: "Strong Bullish",
          description: `MACD at ${value.toFixed(2)} shows strong upward momentum`,
          actionHint: "Trend is strongly bullish"
        };
      } else if (value > 0) {
        return {
          status: "bullish",
          label: "Bullish",
          description: `MACD at ${value.toFixed(2)} indicates bullish momentum`,
          actionHint: "Buyers in control"
        };
      } else if (value > -0.5) {
        return {
          status: "bearish",
          label: "Bearish",
          description: `MACD at ${value.toFixed(2)} indicates bearish momentum`,
          actionHint: "Sellers in control"
        };
      } else {
        return {
          status: "bearish",
          label: "Strong Bearish",
          description: `MACD at ${value.toFixed(2)} shows strong downward momentum`,
          actionHint: "Trend is strongly bearish"
        };
      }

    case "volume":
      // Assuming value is relative to average (1 = average)
      if (value > 1.5) {
        return {
          status: "neutral",
          label: "High Volume",
          description: `Volume is ${((value - 1) * 100).toFixed(0)}% above average`,
          actionHint: "Significant interest - validates price movement"
        };
      } else if (value < 0.5) {
        return {
          status: "neutral",
          label: "Low Volume",
          description: `Volume is ${((1 - value) * 100).toFixed(0)}% below average`,
          actionHint: "Low conviction - be cautious of false moves"
        };
      } else {
        return {
          status: "neutral",
          label: "Normal Volume",
          description: "Volume is near average",
          actionHint: "Normal market activity"
        };
      }

    default:
      return {
        status: "neutral",
        label: "Neutral",
        description: `Current value: ${value}`,
        actionHint: "Monitor for changes"
      };
  }
}

const statusIcons = {
  bullish: TrendingUp,
  bearish: TrendingDown,
  neutral: Minus,
};

const statusColors = {
  bullish: "text-gain bg-gain/10 border-gain/30",
  bearish: "text-loss bg-loss/10 border-loss/30",
  neutral: "text-muted-foreground bg-muted/30 border-border",
};

export function IndicatorExplainer({
  indicator,
  value,
  context,
  className,
  compact = false,
}: IndicatorExplainerProps) {
  const [expanded, setExpanded] = useState(false);
  const analysis = analyzeIndicator(indicator, value);
  const StatusIcon = statusIcons[analysis.status];

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge variant="outline" className={cn("gap-1", statusColors[analysis.status])}>
          <StatusIcon className="w-3 h-3" />
          {analysis.label}
        </Badge>
        <EducationPopover topic={indicator} context={{ ...context, indicatorValue: value }}>
          <Lightbulb className="w-4 h-4 text-primary hover:text-primary/80 cursor-pointer" />
        </EducationPopover>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-border/50 bg-card/50 overflow-hidden", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            analysis.status === "bullish" ? "bg-gain/10" : 
            analysis.status === "bearish" ? "bg-loss/10" : "bg-muted"
          )}>
            <StatusIcon className={cn(
              "w-4 h-4",
              analysis.status === "bullish" ? "text-gain" : 
              analysis.status === "bearish" ? "text-loss" : "text-muted-foreground"
            )} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{indicator.toUpperCase()}</span>
              <Badge variant="outline" className={cn("text-xs", statusColors[analysis.status])}>
                {analysis.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{analysis.description}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-0 space-y-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Action Hint</span>
            </div>
            <p className="text-sm text-muted-foreground">{analysis.actionHint}</p>
          </div>

          <EducationPopover 
            topic={indicator} 
            context={{ ...context, indicatorValue: value }}
          >
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Lightbulb className="w-4 h-4" />
              Learn more about {indicator.toUpperCase()}
            </Button>
          </EducationPopover>
        </div>
      )}
    </div>
  );
}
