import { useMemo } from "react";
import { calculateVerdictScore, VerdictResult, VerdictInput } from "@/utils/verdictEngine";
import { useFredData } from "./useFredData";
import { useFundamentals } from "./useFundamentals";
import { useTechnicalIndicators } from "./useTechnicalIndicators";

interface UseVerdictProps {
  symbol: string;
  sentimentData?: {
    newsScore?: number;
    insiderActivity?: 'buying' | 'selling' | 'neutral';
    shortInterest?: number;
  };
}

export function useVerdict({ symbol, sentimentData }: UseVerdictProps): {
  verdict: VerdictResult;
  loading: boolean;
  fundamentalsLoading: boolean;
  indicatorsLoading: boolean;
  dataQuality: 'full' | 'partial' | 'insufficient' | undefined;
} {
  const { analysis, vixLevel } = useFredData();
  const { data: fundamentals, loading: fundamentalsLoading, premiumLocked } = useFundamentals(symbol);
  const { indicators, loading: indicatorsLoading } = useTechnicalIndicators(symbol);

  // Check if fundamental data is partially locked by paywall
  const fundamentalsLocked = premiumLocked.length > 0;

  const verdict = useMemo(() => {
    // Validate market data - log warnings for missing critical indicators
    const hasMA50 = indicators.ma50 !== undefined;
    const hasMA20 = indicators.ma20 !== undefined;
    const hasRSI = indicators.rsi !== undefined;
    
    if (!hasMA50 && indicators.dataQuality !== 'insufficient') {
      console.warn(`[Verdict] Missing 50-day MA for ${symbol} - insufficient historical data`);
    }
    
    // Build market data input with validated indicators (short-term strategy)
    const marketData = {
      price: indicators.price,
      ma50: indicators.ma50,     // Primary trend indicator
      ma20: indicators.ma20,     // Short-term trend
      rsi: indicators.rsi,
      macdSignal: indicators.macdSignal,
      emaCrossover: indicators.emaCrossover, // EMA 20/50 crossover signal
      volume: indicators.volume,
      avgVolume: indicators.avgVolume,
      priceChange: indicators.priceChange,
    };

    // Determine rate trend from analysis
    // The edge function now returns rateTrend directly, but fallback to parsing rateEnvironment
    let interestRateTrend: 'rising' | 'falling' | 'stable' = 'stable';
    if (analysis?.rateTrend) {
      interestRateTrend = analysis.rateTrend;
    } else if (analysis?.rateEnvironment) {
      if (analysis.rateEnvironment.includes('rising') || analysis.rateEnvironment === 'restrictive') {
        interestRateTrend = 'rising';
      } else if (analysis.rateEnvironment.includes('falling') || analysis.rateEnvironment === 'accommodative') {
        interestRateTrend = 'falling';
      }
    }

    const input: VerdictInput = {
      market: marketData,
      fundamental: fundamentals ? {
        peRatio: fundamentals.peRatio ?? undefined,
        sectorPe: fundamentals.sectorPe ?? undefined,
        debtToEquity: fundamentals.debtToEquity ?? undefined,
        epsGrowth: fundamentals.epsGrowth ?? undefined,
        revenueGrowth: fundamentals.revenueGrowth ?? undefined,
        freeCashFlowYield: fundamentals.freeCashFlowYield ?? undefined,
        profitMargin: fundamentals.profitMargin ? fundamentals.profitMargin * 100 : undefined,
      } : undefined,
      sentiment: {
        ...sentimentData,
        analystRating: fundamentals?.analystRating ?? undefined,
      },
      macro: {
        // Use live VIX level - if unavailable, the verdict engine handles undefined gracefully
        vix: vixLevel,
        interestRateTrend,
        yieldCurve: analysis?.recessionSignal ? 'inverted' : 'normal',
        sectorRotation: analysis?.riskSentiment?.includes('risk-on') ? 'risk_on'
          : analysis?.riskSentiment?.includes('risk-off') ? 'risk_off' : 'neutral',
      },
      // Pass data quality for confidence adjustment
      // Reduce quality if fundamentals are locked by paywall
      dataQuality: fundamentalsLocked 
        ? (indicators.dataQuality === 'full' ? 'partial' : indicators.dataQuality)
        : indicators.dataQuality,
    };

    return calculateVerdictScore(input);
  }, [symbol, indicators, fundamentals, sentimentData, analysis, vixLevel, fundamentalsLocked]);

  return {
    verdict,
    loading: indicatorsLoading,
    fundamentalsLoading,
    indicatorsLoading,
    dataQuality: indicators.dataQuality,
  };
}
