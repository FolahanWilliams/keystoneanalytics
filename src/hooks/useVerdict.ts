import { useMemo } from "react";
import { calculateVerdictScore, VerdictResult, VerdictInput } from "@/utils/verdictEngine";
import { useFredData } from "./useFredData";

interface UseVerdictProps {
  symbol: string;
  marketData?: {
    price?: number;
    ma200?: number;
    ma50?: number;
    rsi?: number;
    macdSignal?: 'bullish' | 'bearish' | 'neutral';
    volume?: number;
    avgVolume?: number;
    priceChange?: number;
  };
  fundamentalData?: {
    peRatio?: number;
    sectorPe?: number;
    debtToEquity?: number;
    epsGrowth?: number;
    revenueGrowth?: number;
    freeCashFlowYield?: number;
  };
  sentimentData?: {
    newsScore?: number;
    analystRating?: number;
    insiderActivity?: 'buying' | 'selling' | 'neutral';
    shortInterest?: number;
  };
}

export function useVerdict({ symbol, marketData, fundamentalData, sentimentData }: UseVerdictProps): {
  verdict: VerdictResult;
  loading: boolean;
} {
  const { analysis } = useFredData();

  const verdict = useMemo(() => {
    const input: VerdictInput = {
      market: marketData,
      fundamental: fundamentalData,
      sentiment: sentimentData,
      macro: {
        vix: 18, // Default VIX - could be fetched from API
        interestRateTrend: analysis?.rateEnvironment?.includes('rising') ? 'rising' 
          : analysis?.rateEnvironment?.includes('falling') ? 'falling' : 'stable',
        yieldCurve: analysis?.recessionSignal ? 'inverted' : 'normal',
        sectorRotation: analysis?.riskSentiment?.includes('risk-on') ? 'risk_on'
          : analysis?.riskSentiment?.includes('risk-off') ? 'risk_off' : 'neutral',
      },
    };

    return calculateVerdictScore(input);
  }, [symbol, marketData, fundamentalData, sentimentData, analysis]);

  return {
    verdict,
    loading: false,
  };
}
