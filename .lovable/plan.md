

# Deep Analysis: Technical Analysis Charts Failing to Load

## Executive Summary

The charts fail because **all three market data API providers (FMP, Finnhub, Alpha Vantage) are returning empty or error responses for historical candle data**. The edge function correctly falls through each provider and ultimately returns `{ candles: [], error: "no_data" }`, which triggers the "Failed to load chart" error in the UI.

---

## Root Cause Analysis

### 1. FMP Historical API - Silent Failure

**Location**: `supabase/functions/market-data/index.ts` lines 382-444

**Problem**: FMP is the primary provider for daily/weekly/monthly candles, but when it fails, there's no logging to understand why.

```text
Line 389: if (fmpHistData.historical && fmpHistData.historical.length > 0)
```

If `fmpHistData.historical` is undefined (API error, rate limit, invalid response), the code silently continues to Finnhub. There's no logging of what FMP actually returned.

**Evidence**: Zero "FMP" entries in recent edge function logs for candle fetches.

---

### 2. Finnhub API - Returns Undefined Status

**Location**: `supabase/functions/market-data/index.ts` lines 447-485

**Problem**: Finnhub returns `s: undefined` instead of `s: "ok"`.

**Log Evidence**:
```text
Finnhub candle response for AAPL: undefined
```

This indicates either:
- The Finnhub API key is invalid or rate-limited
- The symbol encoding is incorrect  
- Finnhub's candle endpoint has changed

---

### 3. Alpha Vantage - Also Failing Silently

**Location**: `supabase/functions/market-data/index.ts` lines 491-535

**Problem**: Alpha Vantage is tried as a final fallback but also returns no data.

**Log Evidence**: "Trying Alpha Vantage for AAPL" appears, but never "Alpha Vantage returned X candles" which would indicate success.

Possible causes:
- API key rate limit (5 calls/minute on free tier)
- Response parsing issue
- `Time Series (Daily)` key not present in response

---

### 4. Secondary Issue: User Subscription Missing

**Location**: `supabase/functions/_shared/tierCheck.ts` lines 42-46

**Error Log**:
```text
Error fetching user tier: Cannot coerce the result to a single JSON object
```

**Cause**: The `.single()` method fails when zero rows are returned. User `00700a86-be80-47fe-aff1-0558f25063cd` has no `user_subscriptions` record.

**Impact**: Not a blocking issue - the function defaults to `tier: 'free'` and continues.

---

## Technical Details

### Data Flow Diagram

```text
+----------------+     +-------------------+     +----------------+
|  AdvancedChart | --> |   useChartData    | --> |  market-data   |
|    Component   |     |      Hook         |     | Edge Function  |
+----------------+     +-------------------+     +----------------+
                                                        |
                          +-----------------------------+
                          |
        +-----------------+-----------------+------------------+
        |                 |                 |                  |
        v                 v                 v                  v
   +--------+       +---------+       +-------------+    +-----------+
   |  FMP   |       | Finnhub |       | Alpha Vantage|   | Return    |
   | (fail) |  -->  | (fail)  |  -->  |   (fail)     |-->| no_data   |
   +--------+       +---------+       +-------------+    +-----------+
```

### Edge Function Response When All Fail

```json
{
  "candles": [],
  "error": "no_data",
  "message": "Historical data unavailable from all providers..."
}
```

### Frontend Error Handling

```text
File: src/hooks/useChartData.ts, Line 78
if (data?.error) throw new Error(data.error);
```

This throws `Error("no_data")` which surfaces as "Failed to load chart".

---

## Recommended Fix

### Phase 1: Add Diagnostic Logging (Required First)

Add detailed logging to understand exactly what each API is returning.

**File**: `supabase/functions/market-data/index.ts`

```typescript
// After line 387 (FMP fetch)
console.log(`FMP historical response for ${symbol}:`, JSON.stringify(fmpHistData).substring(0, 500));

// After line 500 (Alpha Vantage fetch)  
console.log(`Alpha Vantage response for ${symbol}:`, JSON.stringify(avData).substring(0, 500));
```

---

### Phase 2: Fix Tier Check Error

**File**: `supabase/functions/_shared/tierCheck.ts`

Change `.single()` to `.maybeSingle()` to handle missing subscription records gracefully:

```typescript
// Line 42-46
const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();  // Changed from .single()
```

---

### Phase 3: Verify API Keys

Test each API key directly to confirm they work:

| Provider | Secret Name | Test Endpoint |
|----------|-------------|---------------|
| FMP | `FMP_API_KEY` | `/api/v3/historical-price-full/AAPL` |
| Finnhub | `FINNHUB_API_KEY` | `/api/v1/stock/candle?symbol=AAPL` |
| Alpha Vantage | `ALPHA_VANTAGE_API_KEY` | `TIME_SERIES_DAILY&symbol=AAPL` |

---

### Phase 4: Improve Error UX

Show the user a more helpful message when data is unavailable:

**File**: `src/components/charts/AdvancedChart.tsx`, lines 61-70

```typescript
if (error) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3 p-8">
      <AlertCircle className="w-10 h-10 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        {error === "no_data" 
          ? "Market data temporarily unavailable. Try again shortly."
          : "Failed to load chart"}
      </p>
      <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5 h-8 text-xs">
        <RefreshCw className="w-3.5 h-3.5" /> Retry
      </Button>
    </div>
  );
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/market-data/index.ts` | Add diagnostic logging for FMP and Alpha Vantage responses |
| `supabase/functions/_shared/tierCheck.ts` | Change `.single()` to `.maybeSingle()` |
| `src/components/charts/AdvancedChart.tsx` | Improve error message for no_data case |
| `src/hooks/useChartData.ts` | Preserve error code in state for better UX |

---

## Expected Outcome

After implementing these fixes:
1. Edge function logs will show exactly what each API returns
2. Tier check errors will stop appearing in logs
3. Users will see clearer error messages
4. Once the API issue is identified (likely rate limits or key issues), the actual fix can be applied

