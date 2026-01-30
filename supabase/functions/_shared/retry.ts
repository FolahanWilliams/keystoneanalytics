/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures gracefully
 */

interface RetryConfig {
  maxRetries: number;        // Maximum number of retry attempts
  initialDelayMs: number;    // Initial delay before first retry
  maxDelayMs: number;        // Maximum delay between retries
  backoffMultiplier: number; // Multiplier for exponential backoff
  jitterMs: number;          // Random jitter to prevent thundering herd
  retryableErrors?: string[]; // Error messages that should trigger retry
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  jitterMs: 100,
};

// Aggressive retry for critical operations
export const AGGRESSIVE_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 200,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitterMs: 200,
};

// Light retry for non-critical operations
export const LIGHT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 300,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
  jitterMs: 50,
};

/**
 * Calculate delay for a given attempt using exponential backoff
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  
  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * config.jitterMs * 2 - config.jitterMs;
  
  return Math.max(0, cappedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  // Network errors are always retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Check for specific retryable error messages
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    
    // Common retryable error patterns
    const retryablePatterns = [
      'timeout',
      'timed out',
      'network',
      'econnreset',
      'econnrefused',
      'socket hang up',
      'temporarily unavailable',
      'service unavailable',
      '503',
      '502',
      '504',
      'rate limit',
      '429',
    ];
    
    if (retryablePatterns.some(pattern => errorMessage.includes(pattern))) {
      return true;
    }
    
    // Check custom retryable errors
    if (config.retryableErrors) {
      return config.retryableErrors.some(msg => 
        errorMessage.includes(msg.toLowerCase())
      );
    }
  }
  
  return false;
}

interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalTime: Date.now() - startTime,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isLastAttempt = attempt === fullConfig.maxRetries;
      const shouldRetry = !isLastAttempt && isRetryableError(error, fullConfig);
      
      if (shouldRetry) {
        const delay = calculateDelay(attempt, fullConfig);
        console.log(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
        await sleep(delay);
      } else {
        if (!isLastAttempt) {
          console.log(`[Retry] Error is not retryable: ${lastError.message}`);
        }
        break;
      }
    }
  }
  
  return {
    success: false,
    error: lastError,
    attempts: fullConfig.maxRetries + 1,
    totalTime: Date.now() - startTime,
  };
}

/**
 * Simple retry wrapper that throws on failure
 */
export async function retry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const result = await withRetry(fn, config);
  
  if (result.success && result.data !== undefined) {
    return result.data;
  }
  
  throw result.error || new Error('Retry failed with unknown error');
}

/**
 * Fetch with automatic retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig: Partial<RetryConfig> = {}
): Promise<Response> {
  return retry(async () => {
    const response = await fetch(url, options);
    
    // Retry on server errors (5xx) and rate limits (429)
    if (response.status >= 500 || response.status === 429) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  }, retryConfig);
}
