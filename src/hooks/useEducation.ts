import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface EducationContext {
  symbol?: string;
  price?: number;
  change?: number;
  indicator?: string;
  indicatorValue?: number;
  rsi?: number;
  macd?: number;
}

interface EducationResponse {
  content: string;
  topic: string;
  level: SkillLevel;
  symbol?: string;
}

// Static explanations for quick tooltips (no API call needed)
export const QUICK_EXPLANATIONS: Record<string, { title: string; brief: string }> = {
  rsi: {
    title: "Relative Strength Index",
    brief: "Momentum indicator (0-100). Above 70 = overbought, below 30 = oversold."
  },
  macd: {
    title: "MACD",
    brief: "Trend-following momentum indicator. Bullish when MACD crosses above signal line."
  },
  sma: {
    title: "Simple Moving Average",
    brief: "Average price over a period. Price above SMA suggests uptrend."
  },
  ema: {
    title: "Exponential Moving Average",
    brief: "Weighted average giving more importance to recent prices."
  },
  volume: {
    title: "Volume",
    brief: "Number of shares traded. High volume confirms price movements."
  },
  bollinger: {
    title: "Bollinger Bands",
    brief: "Volatility indicator. Price near bands suggests potential reversal."
  },
  support: {
    title: "Support Level",
    brief: "Price level where buying interest prevents further decline."
  },
  resistance: {
    title: "Resistance Level",
    brief: "Price level where selling pressure prevents further rise."
  },
  divergence: {
    title: "Divergence",
    brief: "When price and indicator move in opposite directions, signaling potential reversal."
  },
  pe_ratio: {
    title: "P/E Ratio",
    brief: "Price-to-Earnings. Lower may indicate undervaluation; compare to industry average."
  },
  market_cap: {
    title: "Market Cap",
    brief: "Total value of shares. Large-cap = stable, small-cap = higher growth/risk."
  },
  volatility: {
    title: "Volatility",
    brief: "Measure of price fluctuation. High volatility = bigger moves, more risk."
  },
  atr: {
    title: "Average True Range",
    brief: "Volatility indicator showing average price range. Used for stop-loss placement."
  },
  bullish: {
    title: "Bullish",
    brief: "Expectation that prices will rise. Characterized by upward price movement."
  },
  bearish: {
    title: "Bearish",
    brief: "Expectation that prices will fall. Characterized by downward price movement."
  },
  stop_loss: {
    title: "Stop Loss",
    brief: "Order to sell when price falls to a level, limiting potential losses."
  },
  take_profit: {
    title: "Take Profit",
    brief: "Order to sell when price reaches target, locking in gains."
  },
  risk_reward: {
    title: "Risk/Reward Ratio",
    brief: "Potential profit vs potential loss. 1:2 means risking $1 to make $2."
  },
};

// Pre-built educational content for common topics
export const EDUCATIONAL_TOPICS = [
  {
    id: "rsi",
    category: "Indicators",
    title: "RSI (Relative Strength Index)",
    icon: "📊",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "macd",
    category: "Indicators",
    title: "MACD Indicator",
    icon: "📈",
    difficulty: "intermediate" as SkillLevel,
  },
  {
    id: "moving_average",
    category: "Indicators",
    title: "Moving Averages",
    icon: "📉",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "bollinger_bands",
    category: "Indicators",
    title: "Bollinger Bands",
    icon: "🎯",
    difficulty: "intermediate" as SkillLevel,
  },
  {
    id: "divergence",
    category: "Patterns",
    title: "Divergences",
    icon: "🔀",
    difficulty: "intermediate" as SkillLevel,
  },
  {
    id: "candlestick_patterns",
    category: "Patterns",
    title: "Candlestick Patterns",
    icon: "🕯️",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "support_resistance",
    category: "Patterns",
    title: "Support & Resistance",
    icon: "⚡",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "trend_analysis",
    category: "Patterns",
    title: "Trend Analysis",
    icon: "📐",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "pe_ratio",
    category: "Valuation",
    title: "P/E Ratio",
    icon: "💰",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "market_cap",
    category: "Valuation",
    title: "Market Capitalization",
    icon: "🏦",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "earnings",
    category: "Valuation",
    title: "Earnings Reports",
    icon: "📋",
    difficulty: "intermediate" as SkillLevel,
  },
  {
    id: "sector_rotation",
    category: "Valuation",
    title: "Sector Rotation",
    icon: "🔄",
    difficulty: "advanced" as SkillLevel,
  },
  {
    id: "risk_management",
    category: "Risk",
    title: "Position Sizing",
    icon: "🛡️",
    difficulty: "beginner" as SkillLevel,
  },
  {
    id: "volatility",
    category: "Risk",
    title: "Volatility Trading",
    icon: "🌊",
    difficulty: "intermediate" as SkillLevel,
  },
  {
    id: "volume",
    category: "Risk",
    title: "Volume Analysis",
    icon: "📊",
    difficulty: "intermediate" as SkillLevel,
  },
];

export function useEducation() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExplanation = useCallback(async (
    topic: string,
    context?: EducationContext,
    level: SkillLevel = "beginner"
  ): Promise<EducationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("education", {
        body: { topic, context, level },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setContent(data.content);
      return data as EducationResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load explanation";
      setError(message);
      toast({
        variant: "destructive",
        title: "Education Error",
        description: message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getQuickExplanation = useCallback((key: string) => {
    return QUICK_EXPLANATIONS[key] || null;
  }, []);

  return {
    fetchExplanation,
    getQuickExplanation,
    isLoading,
    content,
    error,
    topics: EDUCATIONAL_TOPICS,
  };
}
