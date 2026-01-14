import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const LOCAL_STORAGE_KEY = "pulse_decision_engine_usage";
const MAX_FREE_USES = 5;

interface UsageData {
  count: number;
  symbols: string[];
  lastReset?: string;
}

// Get usage from localStorage for guests
function getLocalUsage(): UsageData {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as UsageData;
      // Reset if it's been more than 30 days
      if (data.lastReset) {
        const lastReset = new Date(data.lastReset);
        const daysSinceReset = (Date.now() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceReset > 30) {
          return { count: 0, symbols: [], lastReset: new Date().toISOString() };
        }
      }
      return data;
    }
  } catch (e) {
    console.error("Error reading decision engine usage:", e);
  }
  return { count: 0, symbols: [], lastReset: new Date().toISOString() };
}

function setLocalUsage(data: UsageData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving decision engine usage:", e);
  }
}

export function useDecisionEngineUsage(symbol: string) {
  const [usageCount, setUsageCount] = useState(0);
  const [hasUsedForSymbol, setHasUsedForSymbol] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth and load usage
  useEffect(() => {
    async function loadUsage() {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // For now, use localStorage for both guests and authenticated users
      // In production, you'd want to store this in Supabase for authenticated users
      const usage = getLocalUsage();
      setUsageCount(usage.count);
      setHasUsedForSymbol(usage.symbols.includes(symbol));
      
      setIsLoading(false);
    }
    
    loadUsage();
  }, [symbol]);

  // Record a use of the decision engine
  const recordUsage = useCallback(() => {
    const usage = getLocalUsage();
    
    // Only count if this symbol hasn't been analyzed before
    if (!usage.symbols.includes(symbol)) {
      const newUsage: UsageData = {
        count: usage.count + 1,
        symbols: [...usage.symbols, symbol],
        lastReset: usage.lastReset || new Date().toISOString(),
      };
      setLocalUsage(newUsage);
      setUsageCount(newUsage.count);
      setHasUsedForSymbol(true);
    }
  }, [symbol]);

  const remainingUses = Math.max(0, MAX_FREE_USES - usageCount);
  const hasReachedLimit = usageCount >= MAX_FREE_USES;
  const canUseForSymbol = !hasReachedLimit || hasUsedForSymbol;

  return {
    usageCount,
    remainingUses,
    hasReachedLimit,
    hasUsedForSymbol,
    canUseForSymbol,
    recordUsage,
    isLoading,
    isAuthenticated,
    maxFreeUses: MAX_FREE_USES,
  };
}
