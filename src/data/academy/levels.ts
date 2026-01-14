import React from "react";
import {
  BookOpen,
  Layers,
  Target,
  PieChart,
  BarChart3,
  LineChart,
  Gauge,
  TrendingUp,
  Activity,
  Percent,
  Wallet,
  AlertTriangle,
  Scale,
  Brain,
  Heart,
  Users,
  Lightbulb,
} from "lucide-react";

export interface AcademyModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  content: string[];
  hasLab?: boolean;
  labType?: "rsi";
}

export interface AcademyLevel {
  level: number;
  title: string;
  subtitle: string;
  modules: AcademyModule[];
}

export const LEVELS: AcademyLevel[] = [
  {
    level: 1,
    title: "The Foundation",
    subtitle: "Master the fundamentals every investor needs",
    modules: [
      {
        id: "what-is-stock",
        title: "What is a Stock?",
        description: "Understand ownership, equity, and why companies go public.",
        duration: "5 min",
        icon: React.createElement(BookOpen, { className: "w-5 h-5" }),
        content: [
          "A stock represents a fractional ownership stake in a publicly traded company. When you buy a share, you become a part-owner — entitled to a slice of profits (dividends) and voting rights on major corporate decisions.",
          "Companies 'go public' through an Initial Public Offering (IPO) to raise capital for growth, pay off debt, or allow early investors to cash out. In exchange, they submit to regulatory scrutiny and share financial results quarterly.",
          "Stock prices fluctuate based on supply and demand, which is influenced by earnings reports, economic conditions, and investor sentiment. Understanding this dynamic is the first step to thinking like an analyst.",
        ],
      },
      {
        id: "market-mechanics",
        title: "Market Mechanics",
        description: "How exchanges work, order types, and market hours.",
        duration: "8 min",
        icon: React.createElement(Layers, { className: "w-5 h-5" }),
        content: [
          "Stock exchanges like the NYSE and NASDAQ are venues where buyers and sellers meet. Modern exchanges are electronic — orders flow through brokers to market makers who provide liquidity.",
          "Order types matter: Market orders execute immediately at the best available price. Limit orders only execute at your specified price or better. Stop-loss orders trigger when a price threshold is breached.",
          "US markets operate 9:30 AM – 4:00 PM Eastern. Pre-market (4 AM – 9:30 AM) and after-hours (4 PM – 8 PM) sessions exist but have lower liquidity and wider spreads.",
        ],
      },
      {
        id: "risk-management",
        title: "Risk Management 101",
        description: "Position sizing, stop losses, and protecting capital.",
        duration: "10 min",
        icon: React.createElement(Target, { className: "w-5 h-5" }),
        content: [
          "Rule #1: Never risk more than 1-2% of your portfolio on a single trade. This ensures that even a string of losses won't devastate your capital.",
          "Stop-loss orders are your safety net. Place them below support levels or at a fixed percentage (e.g., 7-10% below entry). Trailing stops lock in profits as prices rise.",
          "Position sizing formula: (Account Risk %) × (Account Size) ÷ (Entry Price − Stop Price) = Number of Shares. This math keeps emotion out of sizing decisions.",
        ],
      },
      {
        id: "reading-financials",
        title: "Reading Financial Statements",
        description: "Income statements, balance sheets, and cash flow basics.",
        duration: "12 min",
        icon: React.createElement(PieChart, { className: "w-5 h-5" }),
        content: [
          "The Income Statement shows revenue, expenses, and profit over a period. Key metrics: Gross Margin, Operating Income, and Net Income. Look for consistent revenue growth and expanding margins.",
          "The Balance Sheet is a snapshot of assets, liabilities, and equity at a point in time. A strong balance sheet has more assets than liabilities and manageable debt levels.",
          "The Cash Flow Statement reveals how cash moves: Operating (core business), Investing (buying/selling assets), and Financing (debt/equity changes). Free Cash Flow = Operating Cash Flow − CapEx. Positive FCF means the company generates real cash.",
        ],
      },
    ],
  },
  {
    level: 2,
    title: "Technical Analysis",
    subtitle: "Chart patterns and indicators that reveal market psychology",
    modules: [
      {
        id: "candlestick-basics",
        title: "Candlestick Basics",
        description: "Reading OHLC data and common reversal patterns.",
        duration: "7 min",
        icon: React.createElement(BarChart3, { className: "w-5 h-5" }),
        content: [
          "Each candlestick shows four prices: Open, High, Low, Close (OHLC). The 'body' spans open to close; 'wicks' show the high and low extremes.",
          "Green/white candles are bullish (close > open); red/black are bearish (close < open). Long bodies signal conviction; short bodies suggest indecision.",
          "Key patterns: Doji (indecision), Hammer (potential reversal after downtrend), Engulfing (strong reversal signal when one candle fully engulfs the prior one).",
        ],
      },
      {
        id: "support-resistance",
        title: "Support & Resistance",
        description: "Identifying key price levels where trends pause or reverse.",
        duration: "8 min",
        icon: React.createElement(LineChart, { className: "w-5 h-5" }),
        content: [
          "Support is a price level where buying interest is strong enough to halt a decline. Resistance is where selling pressure stops an advance.",
          "These levels form from prior price memory — traders remember where they bought or sold before. Round numbers ($50, $100) often act as psychological barriers.",
          "When support breaks, it often becomes resistance (and vice versa). This 'polarity flip' is one of the most reliable setups in technical analysis.",
        ],
      },
      {
        id: "rsi-indicator",
        title: "RSI: Relative Strength Index",
        description: "Measure momentum and spot overbought/oversold conditions.",
        duration: "10 min",
        icon: React.createElement(Gauge, { className: "w-5 h-5" }),
        hasLab: true,
        labType: "rsi" as const,
        content: [
          "RSI oscillates between 0 and 100. Values above 70 suggest overbought conditions (potential pullback); below 30 suggests oversold (potential bounce).",
          "RSI divergence is powerful: if price makes a new high but RSI doesn't, momentum is weakening — a warning sign. The inverse applies to lows.",
          "Don't use RSI alone. Combine with trend analysis: in strong uptrends, RSI can stay overbought for extended periods. Context matters.",
        ],
      },
      {
        id: "moving-averages",
        title: "Moving Averages",
        description: "SMA vs EMA and the golden/death cross signals.",
        duration: "9 min",
        icon: React.createElement(TrendingUp, { className: "w-5 h-5" }),
        content: [
          "A Simple Moving Average (SMA) calculates the mean of closing prices over N periods. The Exponential Moving Average (EMA) gives more weight to recent prices, reacting faster to changes.",
          "Common periods: 20 (short-term), 50 (medium), 200 (long-term). Price above the 200-day SMA is generally considered bullish.",
          "Golden Cross: 50-day crosses above 200-day — bullish signal. Death Cross: 50-day crosses below 200-day — bearish signal. These are lagging indicators, so confirmation matters.",
        ],
      },
      {
        id: "macd-indicator",
        title: "MACD Explained",
        description: "Trend direction, momentum, and signal line crossovers.",
        duration: "8 min",
        icon: React.createElement(Activity, { className: "w-5 h-5" }),
        content: [
          "MACD = 12-day EMA − 26-day EMA. The Signal Line is a 9-day EMA of MACD. The Histogram shows the difference between MACD and Signal.",
          "Bullish signal: MACD crosses above Signal Line. Bearish signal: MACD crosses below. The histogram shrinking can foreshadow a crossover.",
          "MACD divergences (price vs. MACD direction) often precede reversals. Like RSI, MACD works best when combined with price action and other confirmation.",
        ],
      },
    ],
  },
  {
    level: 3,
    title: "Quantitative Logic",
    subtitle: "Valuation models and the math behind smart investing",
    modules: [
      {
        id: "pe-ratio",
        title: "The P/E Ratio Decoded",
        description: "What price-to-earnings really tells you (and its limits).",
        duration: "7 min",
        icon: React.createElement(Percent, { className: "w-5 h-5" }),
        content: [
          "P/E = Share Price ÷ Earnings Per Share. It tells you how much investors pay for each dollar of earnings. A P/E of 20 means $20 for every $1 of profit.",
          "Compare P/E to industry peers and historical averages. A 'low' P/E might signal undervaluation — or a company in decline. Context is everything.",
          "Limitations: P/E ignores debt, cash, and growth rates. Use it alongside PEG (P/E ÷ Growth Rate), EV/EBITDA, and free cash flow metrics for a fuller picture.",
        ],
      },
      {
        id: "dcf-model",
        title: "DCF: Discounted Cash Flow",
        description: "Valuing a business by its future cash generation.",
        duration: "15 min",
        icon: React.createElement(Wallet, { className: "w-5 h-5" }),
        content: [
          "DCF answers: 'What is the present value of all future cash flows?' You project free cash flows forward, then discount them back using a required rate of return.",
          "Key inputs: Revenue growth rate, profit margins, capital expenditures, discount rate (often WACC). Small changes in assumptions can dramatically shift the valuation.",
          "DCF is powerful but sensitive. Always run multiple scenarios (bull, base, bear case) and compare your intrinsic value estimate to the current market price.",
        ],
      },
      {
        id: "value-traps",
        title: "Spotting Value Traps",
        description: "When 'cheap' stocks are cheap for a reason.",
        duration: "8 min",
        icon: React.createElement(AlertTriangle, { className: "w-5 h-5" }),
        content: [
          "A value trap looks cheap on traditional metrics (low P/E, high yield) but the business is fundamentally deteriorating. Secular decline, debt overload, or management issues are common causes.",
          "Warning signs: Shrinking revenue for multiple quarters, rising debt-to-equity, negative free cash flow, and insider selling. Don't let low multiples blind you to red flags.",
          "Defense: Investigate why a stock is cheap. Read earnings transcripts, analyze competitive positioning, and stress-test assumptions before concluding it's undervalued.",
        ],
      },
      {
        id: "margin-of-safety",
        title: "Margin of Safety",
        description: "The value investing principle that protects your downside.",
        duration: "6 min",
        icon: React.createElement(Scale, { className: "w-5 h-5" }),
        content: [
          "Benjamin Graham's core principle: Only buy when the price is significantly below your intrinsic value estimate. This buffer protects against errors and bad luck.",
          "A 20-30% margin of safety is a common target. If your DCF says $100, only buy at $70-80. The wider the margin, the more room for mistakes.",
          "Margin of safety isn't just about price — it's about quality. Strong balance sheets, durable competitive advantages, and proven management add 'safety' beyond the numbers.",
        ],
      },
    ],
  },
  {
    level: 4,
    title: "Behavioral Finance",
    subtitle: "Master your psychology to avoid costly mistakes",
    modules: [
      {
        id: "cognitive-biases",
        title: "Cognitive Biases in Trading",
        description: "Confirmation bias, anchoring, and recency bias explained.",
        duration: "10 min",
        icon: React.createElement(Brain, { className: "w-5 h-5" }),
        content: [
          "Confirmation Bias: We seek information that confirms our existing beliefs and dismiss contradictory evidence. This leads to overconfidence in bad positions.",
          "Anchoring: We fixate on initial reference points (like purchase price) and make decisions relative to that anchor, even when it's irrelevant to current value.",
          "Recency Bias: We overweight recent events. After a bull run, we expect gains to continue. After a crash, we expect more losses. Markets are more random than we admit.",
        ],
      },
      {
        id: "loss-aversion",
        title: "Loss Aversion & FOMO",
        description: "Why losses hurt more and how fear drives poor decisions.",
        duration: "8 min",
        icon: React.createElement(Heart, { className: "w-5 h-5" }),
        content: [
          "Losses feel roughly twice as painful as equivalent gains feel good. This asymmetry causes us to hold losers too long (hoping to break even) and sell winners too early (locking in gains).",
          "FOMO (Fear Of Missing Out) leads to chasing rallies and buying tops. The antidote: have a plan before you trade. Know your entry, exit, and position size in advance.",
          "Practical tip: Journal your trades. Record the rationale, emotions, and outcome. Over time, patterns emerge that reveal your behavioral blind spots.",
        ],
      },
      {
        id: "herd-mentality",
        title: "Herd Mentality",
        description: "Understanding crowd behavior and contrarian thinking.",
        duration: "7 min",
        icon: React.createElement(Users, { className: "w-5 h-5" }),
        content: [
          "Humans are social creatures. When 'everyone' is buying, it feels safe to buy. But markets are a voting machine in the short term and a weighing machine in the long term.",
          "Bubbles form when herding overwhelms fundamentals. The dot-com bubble, housing bubble, and meme stock mania all shared this pattern: euphoria detached from value.",
          "Contrarian thinking doesn't mean always opposing the crowd. It means having an independent thesis and being willing to act on it when the crowd is clearly wrong.",
        ],
      },
      {
        id: "building-discipline",
        title: "Building Trading Discipline",
        description: "Systems, checklists, and routines that remove emotion.",
        duration: "9 min",
        icon: React.createElement(Lightbulb, { className: "w-5 h-5" }),
        content: [
          "A trading system is a set of rules: entry criteria, exit criteria, position sizing, and risk limits. Following a system removes ad-hoc emotional decisions.",
          "Pre-trade checklist example: (1) Does this fit my strategy? (2) What's my stop loss? (3) What's the risk/reward ratio? (4) Is my position size within limits?",
          "Routine matters: Set specific times for research, review, and trading. Avoid screen-staring. Take breaks. The goal is to be process-focused, not outcome-obsessed.",
        ],
      },
    ],
  },
];

export const ALL_MODULES = LEVELS.flatMap((level) =>
  level.modules.map((m) => ({ ...m, levelNum: level.level }))
);

export const TOTAL_MODULES = ALL_MODULES.length;
