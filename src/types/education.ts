// Education system types and constants

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export interface EducationContext {
  symbol?: string;
  price?: number;
  change?: number;
  indicator?: string;
  indicatorValue?: number;
}

export interface EducationResponse {
  content: string;
  topic: string;
  level: SkillLevel;
  context?: EducationContext;
}

export interface EducationalTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
}

export const QUICK_EXPLANATIONS: Record<string, { title: string; brief: string }> = {
  // Technical Indicators
  rsi: {
    title: "RSI (Relative Strength Index)",
    brief: "Measures momentum on a 0-100 scale. Above 70 = overbought, below 30 = oversold."
  },
  macd: {
    title: "MACD (Moving Average Convergence Divergence)",
    brief: "Shows relationship between two moving averages. Crossovers signal potential trend changes."
  },
  sma: {
    title: "SMA (Simple Moving Average)",
    brief: "Average price over a period. Price above SMA = bullish, below = bearish."
  },
  ema: {
    title: "EMA (Exponential Moving Average)",
    brief: "Like SMA but gives more weight to recent prices. Reacts faster to price changes."
  },
  bollinger: {
    title: "Bollinger Bands",
    brief: "Shows volatility with upper/lower bands. Price touching bands may signal reversals."
  },
  volume: {
    title: "Volume",
    brief: "Number of shares traded. High volume confirms price moves, low volume suggests weak moves."
  },
  
  // Market Terms
  bullish: {
    title: "Bullish Signal",
    brief: "Indicates upward price momentum. Suggests buying pressure exceeds selling pressure."
  },
  bearish: {
    title: "Bearish Signal",
    brief: "Indicates downward price momentum. Suggests selling pressure exceeds buying pressure."
  },
  support: {
    title: "Support Level",
    brief: "Price level where buying interest is strong enough to prevent further decline."
  },
  resistance: {
    title: "Resistance Level",
    brief: "Price level where selling pressure is strong enough to prevent further advance."
  },
  
  // Risk Concepts
  volatility: {
    title: "Volatility",
    brief: "Measure of price fluctuation. High volatility = larger price swings, higher risk/reward."
  },
  risk_reward: {
    title: "Risk/Reward Ratio",
    brief: "Compares potential profit to potential loss. 1:3 means risking $1 to make $3."
  },
  stop_loss: {
    title: "Stop Loss",
    brief: "Order to sell when price falls to a set level. Limits potential losses."
  },
  position_sizing: {
    title: "Position Sizing",
    brief: "Determining how much to invest in a trade. Key to risk management."
  },
  
  // Valuation
  pe_ratio: {
    title: "P/E Ratio (Price-to-Earnings)",
    brief: "Stock price divided by earnings per share. High P/E may mean overvalued or high growth expected."
  },
  market_cap: {
    title: "Market Capitalization",
    brief: "Total value of company's shares. Large cap = stable, small cap = higher risk/reward."
  },
  eps: {
    title: "EPS (Earnings Per Share)",
    brief: "Company's profit divided by shares outstanding. Higher EPS = more profitable."
  },
  dividend_yield: {
    title: "Dividend Yield",
    brief: "Annual dividends as percentage of stock price. Higher yield = more income from holding."
  },
  
  // Patterns
  divergence: {
    title: "Divergence",
    brief: "When price and indicator move in opposite directions. May signal upcoming reversal."
  },
  breakout: {
    title: "Breakout",
    brief: "Price moving outside a defined support/resistance level with increased volume."
  },
  trend: {
    title: "Trend",
    brief: "Overall direction of price movement. Uptrend = higher highs, downtrend = lower lows."
  }
};

export const EDUCATIONAL_TOPICS: EducationalTopic[] = [
  // Indicators
  { id: "rsi", title: "RSI", category: "Indicators", icon: "📊" },
  { id: "macd", title: "MACD", category: "Indicators", icon: "📈" },
  { id: "sma", title: "Simple Moving Average", category: "Indicators", icon: "📉" },
  { id: "ema", title: "Exponential Moving Average", category: "Indicators", icon: "〰️" },
  { id: "bollinger", title: "Bollinger Bands", category: "Indicators", icon: "🎯" },
  { id: "volume", title: "Volume Analysis", category: "Indicators", icon: "📶" },
  
  // Patterns
  { id: "divergence", title: "Divergences", category: "Patterns", icon: "↔️" },
  { id: "breakout", title: "Breakouts", category: "Patterns", icon: "💥" },
  { id: "trend", title: "Trend Analysis", category: "Patterns", icon: "📐" },
  { id: "support", title: "Support & Resistance", category: "Patterns", icon: "🧱" },
  
  // Valuation
  { id: "pe_ratio", title: "P/E Ratio", category: "Valuation", icon: "💰" },
  { id: "market_cap", title: "Market Cap", category: "Valuation", icon: "🏢" },
  { id: "eps", title: "Earnings Per Share", category: "Valuation", icon: "💵" },
  { id: "dividend_yield", title: "Dividend Yield", category: "Valuation", icon: "🎁" },
  
  // Risk
  { id: "volatility", title: "Volatility", category: "Risk", icon: "⚡" },
  { id: "risk_reward", title: "Risk/Reward", category: "Risk", icon: "⚖️" },
  { id: "stop_loss", title: "Stop Losses", category: "Risk", icon: "🛑" },
  { id: "position_sizing", title: "Position Sizing", category: "Risk", icon: "📏" },
];
