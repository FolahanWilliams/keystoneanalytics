

# Priority 3: Performance & Reliability Implementation Plan

## Overview

This plan implements four key reliability improvements: rate limiting for edge functions, enhanced error monitoring, a robust API fallback strategy with circuit breaker pattern, and database query optimization through strategic indexes.

---

## Current State Analysis

### Existing Infrastructure
- **Monitoring System**: `src/utils/monitoring.ts` already captures Core Web Vitals and runtime errors
- **Error Boundary**: `src/components/common/ErrorBoundary.tsx` catches React errors and reports to monitoring
- **Caching**: Client-side `DataCache` utility and in-memory edge function caching exist
- **API Fallbacks**: Basic provider chaining in market-data (FMP → Finnhub → Alpha Vantage)

### Gaps Identified
1. **No rate limiting** on any edge functions
2. **No circuit breaker** for failing API providers
3. **No graceful degradation UI** when APIs fail
4. **Missing database indexes** on frequently queried columns
5. **No admin visibility** into collected metrics

---

## Implementation Details

### Task 1: Rate Limiting Middleware for Edge Functions

Create a reusable rate limiting module in `supabase/functions/_shared/`:

**File: `supabase/functions/_shared/rateLimit.ts`**

```text
Rate Limiter Features:
- In-memory token bucket per user/IP
- Configurable limits per function type
- Returns 429 with Retry-After header when exceeded
- Sliding window to prevent burst abuse
```

**Default Rate Limits:**
| Function Type | Limit | Window |
|--------------|-------|--------|
| Market Data | 60 req | 1 min |
| AI Features | 10 req | 1 min |
| Email Sends | 5 req | 1 min |
| Search | 30 req | 1 min |

**Integration:** Add rate limit check at the start of each edge function after auth validation.

**Files to modify:**
- Create: `supabase/functions/_shared/rateLimit.ts`
- Update: `market-data/index.ts`, `stock-coach/index.ts`, `pulse-tutor/index.ts`, `education/index.ts`

---

### Task 2: Enhanced Error Monitoring Integration

**2.1 Extend the monitoring utility with structured error categories:**

**File: `src/utils/monitoring.ts` (updates)**
- Add `reportApiError()` for API-specific errors with provider info
- Add `reportUIEvent()` for user interaction tracking
- Add severity levels (info, warning, error, critical)
- Include retry count and degradation state

**2.2 Create API error hooks for frontend:**

**File: `src/hooks/useApiHealth.ts` (new)**
```text
Features:
- Track API health state per provider
- Expose degradation state to UI components
- Aggregate error rates over rolling window
- Trigger alerts when threshold exceeded
```

**2.3 UI Degradation Banner Component:**

**File: `src/components/common/ApiStatusBanner.tsx` (new)**
```text
Shows when:
- Market data provider is degraded
- AI features are rate limited
- System is in fallback mode
```

---

### Task 3: Circuit Breaker Pattern for API Fallbacks

**3.1 Create circuit breaker utility:**

**File: `supabase/functions/_shared/circuitBreaker.ts` (new)**

```text
Circuit Breaker States:
- CLOSED: Normal operation, requests pass through
- OPEN: Provider failing, skip requests, return fallback
- HALF_OPEN: Testing if provider recovered

Configuration:
- Failure threshold: 5 consecutive failures
- Reset timeout: 60 seconds
- Success threshold: 2 successes to close
```

**3.2 Implement retry with exponential backoff:**

**File: `supabase/functions/_shared/retry.ts` (new)**

```text
Retry Configuration:
- Max retries: 3
- Initial delay: 500ms
- Max delay: 5000ms
- Backoff multiplier: 2
- Jitter: 100ms random
```

**3.3 Update market-data function with circuit breaker:**

The market-data function will use circuit breakers for each provider:
- FMP circuit breaker
- Finnhub circuit breaker
- Alpha Vantage circuit breaker

When a provider is "OPEN", skip it immediately and try next provider.

---

### Task 4: Database Query Optimization

**4.1 Add performance indexes via migration:**

**Analysis of query patterns:**
| Table | Common Query Pattern | Index Needed |
|-------|---------------------|--------------|
| `watchlist` | `WHERE user_id = X` | ✓ Exists (primary key) |
| `academy_progress` | `WHERE user_id = X AND module_id = Y` | Composite index |
| `academy_quizzes` | `WHERE user_id = X ORDER BY completed_at DESC` | Composite index |
| `app_metrics` | `WHERE type = X AND created_at > Y` | Composite index |
| `user_subscriptions` | `WHERE stripe_customer_id = X` | Index on stripe_customer_id |
| `profiles` | `WHERE user_id = X` | ✓ Exists (unique) |

**Migration SQL:**
```sql
-- Optimize academy progress lookups
CREATE INDEX IF NOT EXISTS idx_academy_progress_user_module 
ON public.academy_progress (user_id, module_id);

-- Optimize quiz history queries
CREATE INDEX IF NOT EXISTS idx_academy_quizzes_user_completed 
ON public.academy_quizzes (user_id, completed_at DESC);

-- Optimize metrics analysis
CREATE INDEX IF NOT EXISTS idx_app_metrics_type_created 
ON public.app_metrics (type, created_at DESC);

-- Optimize Stripe webhook lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer 
ON public.user_subscriptions (stripe_customer_id);
```

---

## File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `supabase/functions/_shared/rateLimit.ts` | Token bucket rate limiter |
| `supabase/functions/_shared/circuitBreaker.ts` | Circuit breaker for API providers |
| `supabase/functions/_shared/retry.ts` | Exponential backoff utility |
| `src/hooks/useApiHealth.ts` | Frontend API health tracking |
| `src/components/common/ApiStatusBanner.tsx` | Degradation notification UI |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/market-data/index.ts` | Add rate limiting, circuit breaker |
| `supabase/functions/stock-coach/index.ts` | Add rate limiting |
| `supabase/functions/pulse-tutor/index.ts` | Add rate limiting |
| `supabase/functions/education/index.ts` | Add rate limiting |
| `src/utils/monitoring.ts` | Add API error reporting, severity levels |
| `src/components/charts/AdvancedChart.tsx` | Show degradation state |
| `src/App.tsx` | Add ApiStatusBanner component |

### Database Migration
| Migration | Purpose |
|-----------|---------|
| `20260130_performance_indexes.sql` | Add composite indexes for common queries |

---

## Technical Implementation Notes

### Rate Limiter Design

```text
Token Bucket Algorithm:
- Each user/IP gets a bucket with X tokens
- Tokens replenish at rate of X per window
- Each request consumes 1 token
- If no tokens available, return 429

Storage: In-memory Map with cleanup of expired entries
Memory Limit: Max 10,000 buckets, LRU eviction
```

### Circuit Breaker State Machine

```text
┌─────────┐  failures >= 5  ┌────────┐
│ CLOSED  │────────────────>│  OPEN  │
└─────────┘                 └────────┘
     ▲                           │
     │ successes >= 2            │ timeout (60s)
     │                           ▼
     │                      ┌──────────┐
     └──────────────────────│HALF_OPEN │
                            └──────────┘
```

### API Health Hook Usage

```typescript
// In chart components
const { isProviderHealthy, degradedProviders } = useApiHealth();

if (!isProviderHealthy('market-data')) {
  return <DegradedDataWarning providers={degradedProviders} />;
}
```

---

## Expected Outcomes

After implementation:

1. **Rate Limiting**: Prevents abuse and protects API quotas
   - 429 responses with clear Retry-After headers
   - Per-user limits for authenticated endpoints
   - Per-IP limits for public endpoints

2. **Error Monitoring**: Comprehensive visibility into failures
   - Structured error logs with provider info
   - Rolling window aggregation of error rates
   - Frontend visibility into system health

3. **Circuit Breaker**: Faster failures, automatic recovery
   - Failing providers skipped immediately (no timeout wait)
   - Automatic retry after recovery timeout
   - Graceful degradation with clear UI messaging

4. **Database Optimization**: Faster query execution
   - Index scans instead of sequential scans
   - Reduced query latency for common patterns
   - Better scalability as data grows

---

## Deployment Order

1. **Phase 1**: Database indexes (no code changes needed)
2. **Phase 2**: Create shared utilities (rate limit, circuit breaker, retry)
3. **Phase 3**: Update edge functions with new middleware
4. **Phase 4**: Deploy frontend monitoring enhancements
5. **Phase 5**: Add API status banner to UI

