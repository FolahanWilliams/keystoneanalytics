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
  const { analysis } = useFredData();
  const { data: fundamentals, loading: fundamentalsLoading } = useFundamentals(symbol);
  const { indicators, loading: indicatorsLoading } = useTechnicalIndicators(symbol);

  const verdict = useMemo(() => {
    // Validate market data - log warnings for missing critical indicators
    const hasMA200 = indicators.ma200 !== undefined;
    const hasMA50 = indicators.ma50 !== undefined;
    const hasRSI = indicators.rsi !== undefined;
    
    if (!hasMA200 && indicators.dataQuality !== 'insufficient') {
      console.warn(`[Verdict] Missing 200-day MA for ${symbol} - insufficient historical data`);
    }
    
    // Build market data input with validated indicators
    const marketData = {
      price: indicators.price,
      ma200: indicators.ma200,
      ma50: indicators.ma50,
      rsi: indicators.rsi,
      macdSignal: indicators.macdSignal,
      volume: indicators.volume,
      avgVolume: indicators.avgVolume,
      priceChange: indicators.priceChange,
    };

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
        vix: 18, // Default VIX - could be fetched from API
        interestRateTrend: analysis?.rateEnvironment?.includes('rising') ? 'rising' 
          : analysis?.rateEnvironment?.includes('falling') ? 'falling' : 'stable',
        yieldCurve: analysis?.recessionSignal ? 'inverted' : 'normal',
        sectorRotation: analysis?.riskSentiment?.includes('risk-on') ? 'risk_on'
          : analysis?.riskSentiment?.includes('risk-off') ? 'risk_off' : 'neutral',
      },
      // Pass data quality for confidence adjustment
      dataQuality: indicators.dataQuality,
    };

    return calculateVerdictScore(input);
  }, [symbol, indicators, fundamentals, sentimentData, analysis]);

  return {
    verdict,
    loading: indicatorsLoading,
    fundamentalsLoading,
    indicatorsLoading,
    dataQuality: indicators.dataQuality,
  };
}
