import { useMemo } from "react";
import { calculateVerdictScore, VerdictResult, VerdictInput } from "@/utils/verdictEngine";
import { useFredData } from "./useFredData";
import { useFundamentals } from "./useFundamentals";

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
  sentimentData?: {
    newsScore?: number;
    insiderActivity?: 'buying' | 'selling' | 'neutral';
    shortInterest?: number;
  };
}

export function useVerdict({ symbol, marketData, sentimentData }: UseVerdictProps): {
  verdict: VerdictResult;
  loading: boolean;
  fundamentalsLoading: boolean;
} {
  const { analysis } = useFredData();
  const { data: fundamentals, loading: fundamentalsLoading } = useFundamentals(symbol);

  const verdict = useMemo(() => {
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
    };

    return calculateVerdictScore(input);
  }, [symbol, marketData, fundamentals, sentimentData, analysis]);

  return {
    verdict,
    loading: false,
    fundamentalsLoading,
  };
}
