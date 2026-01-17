/**
 * Master Verdict Engine
 * Calculates a composite score (0-100) from Technical, Fundamental, Sentiment, and Macro layers
 */

export interface VerdictMetric {
  id: string;
  name: string;
  layer: 'technical' | 'fundamental' | 'sentiment' | 'macro';
  score: number; // 0-100
  weight: number; // contribution to layer
  signal: 'bullish' | 'bearish' | 'neutral';
  description: string;
  strength: number; // 0-100 how strong this signal is
}

export interface VerdictResult {
  score: number; // 0-100
  signal: 'extreme_bearish' | 'bearish' | 'neutral' | 'bullish' | 'extreme_bullish';
  metrics: VerdictMetric[];
  topSignals: VerdictMetric[];
  layerScores: {
    technical: number;
    fundamental: number;
    sentiment: number;
    macro: number;
  };
  confidence: number; // 0-100 how confident we are in this verdict
}

// Layer weights as specified
const LAYER_WEIGHTS = {
  technical: 0.40,
  fundamental: 0.30,
  sentiment: 0.20,
  macro: 0.10,
};

interface MarketData {
  price?: number;
  ma200?: number;
  ma50?: number;
  rsi?: number;
  macdSignal?: 'bullish' | 'bearish' | 'neutral';
  volume?: number;
  avgVolume?: number;
  atr?: number;
  priceChange?: number;
}

interface FundamentalData {
  peRatio?: number;
  sectorPe?: number;
  debtToEquity?: number;
  epsGrowth?: number;
  revenueGrowth?: number;
  profitMargin?: number;
  freeCashFlowYield?: number;
  priceToBook?: number;
}

interface SentimentData {
  newsScore?: number; // -1 to 1
  analystRating?: number; // 1-5
  socialTrend?: 'rising' | 'falling' | 'stable';
  insiderActivity?: 'buying' | 'selling' | 'neutral';
  shortInterest?: number; // percentage
}

interface MacroData {
  vix?: number;
  interestRateTrend?: 'rising' | 'falling' | 'stable';
  yieldCurve?: 'normal' | 'flat' | 'inverted';
  dollarStrength?: 'strong' | 'weak' | 'neutral';
  sectorRotation?: 'risk_on' | 'risk_off' | 'neutral';
}

export interface VerdictInput {
  market?: MarketData;
  fundamental?: FundamentalData;
  sentiment?: SentimentData;
  macro?: MacroData;
}

function calculateTechnicalMetrics(data: MarketData): VerdictMetric[] {
  const metrics: VerdictMetric[] = [];

  // Price vs 200-day MA (15 points max contribution)
  if (data.price !== undefined && data.ma200 !== undefined) {
    const ratio = data.price / data.ma200;
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Price at 200-day MA';

    if (ratio > 1.1) {
      score = 85;
      signal = 'bullish';
      description = `Trading ${((ratio - 1) * 100).toFixed(1)}% above 200-day MA`;
    } else if (ratio > 1) {
      score = 65;
      signal = 'bullish';
      description = `Trading ${((ratio - 1) * 100).toFixed(1)}% above 200-day MA`;
    } else if (ratio < 0.9) {
      score = 15;
      signal = 'bearish';
      description = `Trading ${((1 - ratio) * 100).toFixed(1)}% below 200-day MA`;
    } else if (ratio < 1) {
      score = 35;
      signal = 'bearish';
      description = `Trading ${((1 - ratio) * 100).toFixed(1)}% below 200-day MA`;
    }

    metrics.push({
      id: 'price_vs_ma200',
      name: 'Price vs 200-MA',
      layer: 'technical',
      score,
      weight: 0.25,
      signal,
      description,
      strength: Math.abs(ratio - 1) * 200,
    });
  }

  // RSI Analysis
  if (data.rsi !== undefined) {
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'RSI in neutral zone';
    let strength = 30;

    if (data.rsi >= 40 && data.rsi <= 60) {
      score = 55;
      signal = 'neutral';
      description = `RSI at ${data.rsi.toFixed(0)} - Neutral momentum`;
      strength = 20;
    } else if (data.rsi > 70) {
      score = 30;
      signal = 'bearish';
      description = `RSI at ${data.rsi.toFixed(0)} - Overbought`;
      strength = Math.min(100, (data.rsi - 70) * 3);
    } else if (data.rsi < 30) {
      score = 75;
      signal = 'bullish';
      description = `RSI at ${data.rsi.toFixed(0)} - Oversold (potential reversal)`;
      strength = Math.min(100, (30 - data.rsi) * 3);
    } else if (data.rsi > 60) {
      score = 65;
      signal = 'bullish';
      description = `RSI at ${data.rsi.toFixed(0)} - Bullish momentum`;
      strength = 40;
    } else {
      score = 40;
      signal = 'bearish';
      description = `RSI at ${data.rsi.toFixed(0)} - Weak momentum`;
      strength = 40;
    }

    metrics.push({
      id: 'rsi',
      name: 'RSI Momentum',
      layer: 'technical',
      score,
      weight: 0.20,
      signal,
      description,
      strength,
    });
  }

  // MACD Signal
  if (data.macdSignal) {
    const score = data.macdSignal === 'bullish' ? 75 : data.macdSignal === 'bearish' ? 25 : 50;
    metrics.push({
      id: 'macd',
      name: 'MACD Crossover',
      layer: 'technical',
      score,
      weight: 0.20,
      signal: data.macdSignal,
      description: `MACD showing ${data.macdSignal} crossover`,
      strength: data.macdSignal !== 'neutral' ? 60 : 20,
    });
  }

  // Price vs 50-day MA
  if (data.price !== undefined && data.ma50 !== undefined) {
    const ratio = data.price / data.ma50;
    const score = ratio > 1 ? 65 + Math.min(20, (ratio - 1) * 100) : 35 - Math.min(20, (1 - ratio) * 100);
    const signal = ratio > 1 ? 'bullish' : ratio < 1 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'price_vs_ma50',
      name: 'Price vs 50-MA',
      layer: 'technical',
      score: Math.max(0, Math.min(100, score)),
      weight: 0.15,
      signal,
      description: ratio > 1 ? `${((ratio - 1) * 100).toFixed(1)}% above 50-day MA` : `${((1 - ratio) * 100).toFixed(1)}% below 50-day MA`,
      strength: Math.abs(ratio - 1) * 150,
    });
  }

  // Volume Analysis
  if (data.volume !== undefined && data.avgVolume !== undefined && data.avgVolume > 0) {
    const volRatio = data.volume / data.avgVolume;
    const priceUp = (data.priceChange ?? 0) > 0;
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Normal volume';

    if (volRatio > 1.5 && priceUp) {
      score = 80;
      signal = 'bullish';
      description = 'High volume accumulation';
    } else if (volRatio > 1.5 && !priceUp) {
      score = 25;
      signal = 'bearish';
      description = 'High volume distribution';
    } else if (volRatio < 0.5) {
      score = 45;
      signal = 'neutral';
      description = 'Low conviction (thin volume)';
    }

    metrics.push({
      id: 'volume',
      name: 'Volume Pattern',
      layer: 'technical',
      score,
      weight: 0.20,
      signal,
      description,
      strength: volRatio > 1.5 ? 70 : 30,
    });
  }

  return metrics;
}

function calculateFundamentalMetrics(data: FundamentalData): VerdictMetric[] {
  const metrics: VerdictMetric[] = [];

  // P/E vs Sector
  if (data.peRatio !== undefined && data.sectorPe !== undefined && data.sectorPe > 0) {
    const ratio = data.peRatio / data.sectorPe;
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Fairly valued vs peers';

    if (ratio < 0.7) {
      score = 85;
      signal = 'bullish';
      description = `Undervalued vs sector (${((1 - ratio) * 100).toFixed(0)}% discount)`;
    } else if (ratio < 0.9) {
      score = 65;
      signal = 'bullish';
      description = 'Slightly undervalued vs peers';
    } else if (ratio > 1.5) {
      score = 20;
      signal = 'bearish';
      description = `Overvalued vs sector (${((ratio - 1) * 100).toFixed(0)}% premium)`;
    } else if (ratio > 1.1) {
      score = 40;
      signal = 'bearish';
      description = 'Slightly overvalued vs peers';
    }

    metrics.push({
      id: 'pe_vs_sector',
      name: 'P/E vs Sector',
      layer: 'fundamental',
      score,
      weight: 0.25,
      signal,
      description,
      strength: Math.abs(ratio - 1) * 100,
    });
  }

  // Debt-to-Equity
  if (data.debtToEquity !== undefined) {
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Moderate debt levels';

    if (data.debtToEquity < 0.3) {
      score = 80;
      signal = 'bullish';
      description = 'Low debt, strong balance sheet';
    } else if (data.debtToEquity < 0.6) {
      score = 65;
      signal = 'bullish';
      description = 'Healthy debt levels';
    } else if (data.debtToEquity > 1.5) {
      score = 20;
      signal = 'bearish';
      description = 'High leverage risk';
    } else if (data.debtToEquity > 1) {
      score = 35;
      signal = 'bearish';
      description = 'Elevated debt levels';
    }

    metrics.push({
      id: 'debt_equity',
      name: 'Debt-to-Equity',
      layer: 'fundamental',
      score,
      weight: 0.20,
      signal,
      description,
      strength: data.debtToEquity < 0.5 ? 60 : data.debtToEquity > 1 ? 70 : 30,
    });
  }

  // EPS Growth
  if (data.epsGrowth !== undefined) {
    let score = 50 + data.epsGrowth * 2;
    score = Math.max(0, Math.min(100, score));
    const signal = data.epsGrowth > 10 ? 'bullish' : data.epsGrowth < -10 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'eps_growth',
      name: 'EPS Growth',
      layer: 'fundamental',
      score,
      weight: 0.25,
      signal,
      description: `${data.epsGrowth > 0 ? '+' : ''}${data.epsGrowth.toFixed(1)}% EPS growth (TTM)`,
      strength: Math.abs(data.epsGrowth) * 2,
    });
  }

  // Revenue Growth
  if (data.revenueGrowth !== undefined) {
    let score = 50 + data.revenueGrowth * 1.5;
    score = Math.max(0, Math.min(100, score));
    const signal = data.revenueGrowth > 15 ? 'bullish' : data.revenueGrowth < -5 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'revenue_growth',
      name: 'Revenue Growth',
      layer: 'fundamental',
      score,
      weight: 0.15,
      signal,
      description: `${data.revenueGrowth > 0 ? '+' : ''}${data.revenueGrowth.toFixed(1)}% revenue growth`,
      strength: Math.abs(data.revenueGrowth) * 1.5,
    });
  }

  // Free Cash Flow Yield
  if (data.freeCashFlowYield !== undefined) {
    let score = 40 + data.freeCashFlowYield * 5;
    score = Math.max(0, Math.min(100, score));
    const signal = data.freeCashFlowYield > 8 ? 'bullish' : data.freeCashFlowYield < 2 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'fcf_yield',
      name: 'FCF Yield',
      layer: 'fundamental',
      score,
      weight: 0.15,
      signal,
      description: `${data.freeCashFlowYield.toFixed(1)}% free cash flow yield`,
      strength: data.freeCashFlowYield > 8 ? 70 : 40,
    });
  }

  return metrics;
}

function calculateSentimentMetrics(data: SentimentData): VerdictMetric[] {
  const metrics: VerdictMetric[] = [];

  // News Sentiment
  if (data.newsScore !== undefined) {
    const score = 50 + data.newsScore * 50;
    const signal = data.newsScore > 0.3 ? 'bullish' : data.newsScore < -0.3 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'news_sentiment',
      name: 'News Sentiment',
      layer: 'sentiment',
      score,
      weight: 0.35,
      signal,
      description: signal === 'bullish' ? 'Positive news flow' : signal === 'bearish' ? 'Negative news coverage' : 'Mixed news sentiment',
      strength: Math.abs(data.newsScore) * 100,
    });
  }

  // Analyst Rating
  if (data.analystRating !== undefined) {
    const score = (data.analystRating - 1) * 25;
    const signal = data.analystRating >= 4 ? 'bullish' : data.analystRating <= 2 ? 'bearish' : 'neutral';

    metrics.push({
      id: 'analyst_rating',
      name: 'Analyst Consensus',
      layer: 'sentiment',
      score,
      weight: 0.30,
      signal,
      description: data.analystRating >= 4 ? 'Strong Buy consensus' : data.analystRating <= 2 ? 'Sell consensus' : 'Hold/Mixed ratings',
      strength: Math.abs(data.analystRating - 3) * 33,
    });
  }

  // Insider Activity
  if (data.insiderActivity) {
    const scoreMap = { buying: 80, selling: 25, neutral: 50 };
    const signalMap = { buying: 'bullish', selling: 'bearish', neutral: 'neutral' } as const;

    metrics.push({
      id: 'insider_activity',
      name: 'Insider Activity',
      layer: 'sentiment',
      score: scoreMap[data.insiderActivity],
      weight: 0.20,
      signal: signalMap[data.insiderActivity],
      description: data.insiderActivity === 'buying' ? 'Insider accumulation' : data.insiderActivity === 'selling' ? 'Insider distribution' : 'No significant insider activity',
      strength: data.insiderActivity !== 'neutral' ? 75 : 20,
    });
  }

  // Short Interest
  if (data.shortInterest !== undefined) {
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Normal short interest';

    if (data.shortInterest > 20) {
      score = 30; // High short interest = bearish sentiment, but could trigger squeeze
      signal = 'bearish';
      description = `High short interest (${data.shortInterest.toFixed(1)}%) - Squeeze potential`;
    } else if (data.shortInterest < 5) {
      score = 60;
      signal = 'neutral';
      description = 'Low short interest';
    }

    metrics.push({
      id: 'short_interest',
      name: 'Short Interest',
      layer: 'sentiment',
      score,
      weight: 0.15,
      signal,
      description,
      strength: data.shortInterest > 15 ? 65 : 25,
    });
  }

  return metrics;
}

function calculateMacroMetrics(data: MacroData): VerdictMetric[] {
  const metrics: VerdictMetric[] = [];

  // VIX Level
  if (data.vix !== undefined) {
    let score = 50;
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Normal volatility';

    if (data.vix < 15) {
      score = 75;
      signal = 'bullish';
      description = `Low VIX (${data.vix.toFixed(1)}) - Complacency`;
    } else if (data.vix > 30) {
      score = 30;
      signal = 'bearish';
      description = `High VIX (${data.vix.toFixed(1)}) - Fear elevated`;
    } else if (data.vix > 25) {
      score = 40;
      signal = 'bearish';
      description = `Elevated VIX (${data.vix.toFixed(1)})`;
    }

    metrics.push({
      id: 'vix',
      name: 'VIX Level',
      layer: 'macro',
      score,
      weight: 0.35,
      signal,
      description,
      strength: data.vix > 25 || data.vix < 15 ? 70 : 30,
    });
  }

  // Interest Rate Trend
  if (data.interestRateTrend) {
    const scoreMap = { falling: 75, rising: 35, stable: 55 };
    const signalMap = { falling: 'bullish', rising: 'bearish', stable: 'neutral' } as const;

    metrics.push({
      id: 'interest_rates',
      name: 'Rate Environment',
      layer: 'macro',
      score: scoreMap[data.interestRateTrend],
      weight: 0.30,
      signal: signalMap[data.interestRateTrend],
      description: data.interestRateTrend === 'falling' ? 'Dovish rate environment' : data.interestRateTrend === 'rising' ? 'Hawkish rate environment' : 'Stable rates',
      strength: data.interestRateTrend !== 'stable' ? 65 : 25,
    });
  }

  // Yield Curve
  if (data.yieldCurve) {
    const scoreMap = { normal: 70, flat: 45, inverted: 20 };
    const signalMap = { normal: 'bullish', flat: 'neutral', inverted: 'bearish' } as const;

    metrics.push({
      id: 'yield_curve',
      name: 'Yield Curve',
      layer: 'macro',
      score: scoreMap[data.yieldCurve],
      weight: 0.20,
      signal: signalMap[data.yieldCurve],
      description: data.yieldCurve === 'inverted' ? 'Inverted curve - Recession signal' : data.yieldCurve === 'normal' ? 'Normal curve - Growth expected' : 'Flat curve - Uncertainty',
      strength: data.yieldCurve === 'inverted' ? 90 : data.yieldCurve === 'normal' ? 50 : 40,
    });
  }

  // Sector Rotation
  if (data.sectorRotation) {
    const scoreMap = { risk_on: 75, risk_off: 30, neutral: 50 };
    const signalMap = { risk_on: 'bullish', risk_off: 'bearish', neutral: 'neutral' } as const;

    metrics.push({
      id: 'sector_rotation',
      name: 'Risk Appetite',
      layer: 'macro',
      score: scoreMap[data.sectorRotation],
      weight: 0.15,
      signal: signalMap[data.sectorRotation],
      description: data.sectorRotation === 'risk_on' ? 'Risk-on rotation' : data.sectorRotation === 'risk_off' ? 'Defensive positioning' : 'Balanced sector flows',
      strength: data.sectorRotation !== 'neutral' ? 55 : 25,
    });
  }

  return metrics;
}

function getSignalFromScore(score: number): VerdictResult['signal'] {
  if (score >= 75) return 'extreme_bullish';
  if (score >= 60) return 'bullish';
  if (score >= 40) return 'neutral';
  if (score >= 25) return 'bearish';
  return 'extreme_bearish';
}

export function calculateVerdictScore(input: VerdictInput): VerdictResult {
  const allMetrics: VerdictMetric[] = [];

  // Calculate all layer metrics
  if (input.market) {
    allMetrics.push(...calculateTechnicalMetrics(input.market));
  }
  if (input.fundamental) {
    allMetrics.push(...calculateFundamentalMetrics(input.fundamental));
  }
  if (input.sentiment) {
    allMetrics.push(...calculateSentimentMetrics(input.sentiment));
  }
  if (input.macro) {
    allMetrics.push(...calculateMacroMetrics(input.macro));
  }

  // Calculate layer scores
  const layerScores = {
    technical: 50,
    fundamental: 50,
    sentiment: 50,
    macro: 50,
  };

  // Calculate weighted average for each layer
  (['technical', 'fundamental', 'sentiment', 'macro'] as const).forEach(layer => {
    const layerMetrics = allMetrics.filter(m => m.layer === layer);
    if (layerMetrics.length > 0) {
      const totalWeight = layerMetrics.reduce((sum, m) => sum + m.weight, 0);
      const weightedSum = layerMetrics.reduce((sum, m) => sum + m.score * m.weight, 0);
      layerScores[layer] = totalWeight > 0 ? weightedSum / totalWeight : 50;
    }
  });

  // Calculate final composite score
  const compositeScore = 
    layerScores.technical * LAYER_WEIGHTS.technical +
    layerScores.fundamental * LAYER_WEIGHTS.fundamental +
    layerScores.sentiment * LAYER_WEIGHTS.sentiment +
    layerScores.macro * LAYER_WEIGHTS.macro;

  // Get top 3 strongest signals (by strength * weight importance)
  const topSignals = [...allMetrics]
    .sort((a, b) => (b.strength * b.weight) - (a.strength * a.weight))
    .slice(0, 3);

  // Calculate confidence based on data availability
  const expectedMetrics = 15; // Total expected metrics
  const confidence = Math.min(100, (allMetrics.length / expectedMetrics) * 100);

  return {
    score: Math.round(compositeScore),
    signal: getSignalFromScore(compositeScore),
    metrics: allMetrics,
    topSignals,
    layerScores: {
      technical: Math.round(layerScores.technical),
      fundamental: Math.round(layerScores.fundamental),
      sentiment: Math.round(layerScores.sentiment),
      macro: Math.round(layerScores.macro),
    },
    confidence: Math.round(confidence),
  };
}

// Utility to generate mock/demo data for testing
export function generateDemoVerdictInput(): VerdictInput {
  return {
    market: {
      price: 185.50,
      ma200: 172.30,
      ma50: 180.20,
      rsi: 58,
      macdSignal: 'bullish',
      volume: 42000000,
      avgVolume: 35000000,
      priceChange: 2.5,
    },
    fundamental: {
      peRatio: 28.5,
      sectorPe: 32.0,
      debtToEquity: 0.45,
      epsGrowth: 18.5,
      revenueGrowth: 12.3,
      freeCashFlowYield: 4.2,
    },
    sentiment: {
      newsScore: 0.35,
      analystRating: 4.2,
      insiderActivity: 'buying',
      shortInterest: 3.5,
    },
    macro: {
      vix: 16.5,
      interestRateTrend: 'stable',
      yieldCurve: 'normal',
      sectorRotation: 'risk_on',
    },
  };
}
