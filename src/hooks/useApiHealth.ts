import { useState, useCallback, useEffect, useRef } from 'react';

export type ProviderName = 'market-data' | 'ai-features' | 'news' | 'fundamentals';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

interface ProviderHealth {
  status: HealthStatus;
  lastError: string | null;
  lastErrorTime: number | null;
  errorCount: number;
  lastSuccessTime: number | null;
  rateLimited: boolean;
  rateLimitResetTime: number | null;
}

interface ApiHealthState {
  providers: Record<ProviderName, ProviderHealth>;
  globalStatus: HealthStatus;
}

// Thresholds for health status
const ERROR_THRESHOLD_DEGRADED = 2;
const ERROR_THRESHOLD_UNHEALTHY = 5;
const ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RECOVERY_TIME_MS = 2 * 60 * 1000; // 2 minutes without errors to recover

const createDefaultProviderHealth = (): ProviderHealth => ({
  status: 'healthy',
  lastError: null,
  lastErrorTime: null,
  errorCount: 0,
  lastSuccessTime: null,
  rateLimited: false,
  rateLimitResetTime: null,
});

const initialState: ApiHealthState = {
  providers: {
    'market-data': createDefaultProviderHealth(),
    'ai-features': createDefaultProviderHealth(),
    'news': createDefaultProviderHealth(),
    'fundamentals': createDefaultProviderHealth(),
  },
  globalStatus: 'healthy',
};

// Singleton state for sharing across components
let globalHealthState = { ...initialState };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

function calculateStatus(errorCount: number, lastErrorTime: number | null): HealthStatus {
  const now = Date.now();
  
  // If no recent errors, provider is healthy
  if (!lastErrorTime || now - lastErrorTime > ERROR_WINDOW_MS) {
    return 'healthy';
  }
  
  // Check error count
  if (errorCount >= ERROR_THRESHOLD_UNHEALTHY) {
    return 'unhealthy';
  }
  
  if (errorCount >= ERROR_THRESHOLD_DEGRADED) {
    return 'degraded';
  }
  
  return 'healthy';
}

function calculateGlobalStatus(providers: Record<ProviderName, ProviderHealth>): HealthStatus {
  const statuses = Object.values(providers).map(p => p.status);
  
  if (statuses.some(s => s === 'unhealthy')) {
    return 'unhealthy';
  }
  
  if (statuses.some(s => s === 'degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

export function useApiHealth() {
  const [state, setState] = useState<ApiHealthState>(globalHealthState);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    // Subscribe to global state changes
    const listener = () => setState({ ...globalHealthState });
    listeners.add(listener);
    
    // Periodically clean up old errors and recalculate status
    cleanupTimerRef.current = setInterval(() => {
      const now = Date.now();
      let updated = false;
      
      for (const [name, provider] of Object.entries(globalHealthState.providers)) {
        // Check if we should recover (no errors for RECOVERY_TIME_MS)
        if (provider.lastSuccessTime && provider.lastErrorTime) {
          if (provider.lastSuccessTime > provider.lastErrorTime && 
              now - provider.lastSuccessTime > RECOVERY_TIME_MS) {
            provider.errorCount = 0;
            provider.status = 'healthy';
            updated = true;
          }
        }
        
        // Clear old errors outside the window
        if (provider.lastErrorTime && now - provider.lastErrorTime > ERROR_WINDOW_MS) {
          provider.errorCount = Math.max(0, provider.errorCount - 1);
          provider.status = calculateStatus(provider.errorCount, provider.lastErrorTime);
          updated = true;
        }
        
        // Clear expired rate limits
        if (provider.rateLimitResetTime && now > provider.rateLimitResetTime) {
          provider.rateLimited = false;
          provider.rateLimitResetTime = null;
          updated = true;
        }
      }
      
      if (updated) {
        globalHealthState.globalStatus = calculateGlobalStatus(globalHealthState.providers);
        notifyListeners();
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      listeners.delete(listener);
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, []);
  
  const recordError = useCallback((provider: ProviderName, error: string) => {
    const now = Date.now();
    const providerState = globalHealthState.providers[provider];
    
    providerState.errorCount++;
    providerState.lastError = error;
    providerState.lastErrorTime = now;
    providerState.status = calculateStatus(providerState.errorCount, now);
    
    globalHealthState.globalStatus = calculateGlobalStatus(globalHealthState.providers);
    notifyListeners();
    
    console.warn(`[ApiHealth] ${provider} error recorded: ${error} (count: ${providerState.errorCount})`);
  }, []);
  
  const recordSuccess = useCallback((provider: ProviderName) => {
    const now = Date.now();
    const providerState = globalHealthState.providers[provider];
    
    providerState.lastSuccessTime = now;
    
    // Decrease error count on success (gradual recovery)
    if (providerState.errorCount > 0) {
      providerState.errorCount = Math.max(0, providerState.errorCount - 1);
      providerState.status = calculateStatus(providerState.errorCount, providerState.lastErrorTime);
      globalHealthState.globalStatus = calculateGlobalStatus(globalHealthState.providers);
      notifyListeners();
    }
  }, []);
  
  const recordRateLimit = useCallback((provider: ProviderName, resetTimeMs: number) => {
    const providerState = globalHealthState.providers[provider];
    
    providerState.rateLimited = true;
    providerState.rateLimitResetTime = Date.now() + resetTimeMs;
    providerState.status = 'degraded';
    
    globalHealthState.globalStatus = calculateGlobalStatus(globalHealthState.providers);
    notifyListeners();
    
    console.warn(`[ApiHealth] ${provider} rate limited, resets in ${resetTimeMs}ms`);
  }, []);
  
  const isProviderHealthy = useCallback((provider: ProviderName): boolean => {
    return globalHealthState.providers[provider].status === 'healthy';
  }, []);
  
  const getProviderStatus = useCallback((provider: ProviderName): ProviderHealth => {
    return { ...globalHealthState.providers[provider] };
  }, []);
  
  const getDegradedProviders = useCallback((): ProviderName[] => {
    return (Object.entries(globalHealthState.providers) as [ProviderName, ProviderHealth][])
      .filter(([_, health]) => health.status !== 'healthy')
      .map(([name]) => name);
  }, []);
  
  const getRateLimitedProviders = useCallback((): ProviderName[] => {
    return (Object.entries(globalHealthState.providers) as [ProviderName, ProviderHealth][])
      .filter(([_, health]) => health.rateLimited)
      .map(([name]) => name);
  }, []);
  
  return {
    // State
    providers: state.providers,
    globalStatus: state.globalStatus,
    
    // Actions
    recordError,
    recordSuccess,
    recordRateLimit,
    
    // Queries
    isProviderHealthy,
    getProviderStatus,
    getDegradedProviders,
    getRateLimitedProviders,
  };
}
