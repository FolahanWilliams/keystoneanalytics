/**
 * Rate Limiting Middleware for Edge Functions
 * Uses token bucket algorithm with sliding window
 */

interface RateLimitConfig {
  maxRequests: number;    // Max requests per window
  windowMs: number;       // Window size in milliseconds
  keyPrefix?: string;     // Prefix for bucket keys
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory storage for token buckets
// Note: In a distributed environment, use Redis or similar
const buckets = new Map<string, TokenBucket>();

// LRU eviction tracking
const accessOrder: string[] = [];
const MAX_BUCKETS = 10000;

// Default rate limit configurations
export const RATE_LIMITS = {
  MARKET_DATA: { maxRequests: 60, windowMs: 60 * 1000 },     // 60 req/min
  AI_FEATURES: { maxRequests: 10, windowMs: 60 * 1000 },     // 10 req/min
  EMAIL_SENDS: { maxRequests: 5, windowMs: 60 * 1000 },      // 5 req/min
  SEARCH: { maxRequests: 30, windowMs: 60 * 1000 },          // 30 req/min
  GENERAL: { maxRequests: 100, windowMs: 60 * 1000 },        // 100 req/min
} as const;

/**
 * Extract rate limit key from request
 * Uses user ID if authenticated, otherwise IP address
 */
export function getRateLimitKey(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get IP from various headers
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0]?.trim() || 'unknown';
  return `ip:${ip}`;
}

/**
 * Evict oldest buckets when limit is reached
 */
function evictOldBuckets(): void {
  while (buckets.size >= MAX_BUCKETS && accessOrder.length > 0) {
    const oldestKey = accessOrder.shift();
    if (oldestKey) {
      buckets.delete(oldestKey);
    }
  }
}

/**
 * Update access order for LRU tracking
 */
function updateAccessOrder(key: string): void {
  const index = accessOrder.indexOf(key);
  if (index > -1) {
    accessOrder.splice(index, 1);
  }
  accessOrder.push(key);
}

/**
 * Check rate limit for a given key
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
  
  let bucket = buckets.get(fullKey);
  
  if (!bucket) {
    // Create new bucket
    evictOldBuckets();
    bucket = {
      tokens: config.maxRequests,
      lastRefill: now,
    };
    buckets.set(fullKey, bucket);
  }
  
  // Calculate tokens to add based on time elapsed
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((elapsed / config.windowMs) * config.maxRequests);
  
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }
  
  updateAccessOrder(fullKey);
  
  // Calculate reset time
  const resetMs = bucket.tokens > 0 
    ? 0 
    : Math.ceil((config.windowMs / config.maxRequests) - (elapsed % (config.windowMs / config.maxRequests)));
  
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return {
      allowed: true,
      remaining: bucket.tokens,
      resetMs: 0,
    };
  }
  
  return {
    allowed: false,
    remaining: 0,
    resetMs: Math.max(resetMs, 1000), // At least 1 second
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(
  remaining: number,
  limit: number,
  resetMs: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.ceil((Date.now() + resetMs) / 1000)),
  };
}

/**
 * Create 429 Too Many Requests response
 */
export function createRateLimitResponse(
  resetMs: number,
  corsHeaders: Record<string, string>
): Response {
  const retryAfter = Math.ceil(resetMs / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Please retry after ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}

/**
 * Middleware function for rate limiting
 * Returns null if allowed, or a Response if rate limited
 */
export function rateLimitMiddleware(
  req: Request,
  config: RateLimitConfig,
  corsHeaders: Record<string, string>,
  userId?: string
): Response | null {
  const key = getRateLimitKey(req, userId);
  const result = checkRateLimit(key, config);
  
  if (!result.allowed) {
    console.warn(`Rate limit exceeded for ${key}`);
    return createRateLimitResponse(result.resetMs, corsHeaders);
  }
  
  return null;
}

/**
 * Clean up expired buckets (call periodically)
 */
export function cleanupExpiredBuckets(maxAgeMs: number = 5 * 60 * 1000): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.lastRefill > maxAgeMs) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    buckets.delete(key);
    const index = accessOrder.indexOf(key);
    if (index > -1) {
      accessOrder.splice(index, 1);
    }
  }
}
