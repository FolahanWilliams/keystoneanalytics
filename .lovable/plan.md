

# Timeframe Switching & Chart Architecture Cleanup

## Executive Summary

This plan addresses five key issues in the charting system:
1. Insufficient data windows for intraday indicators
2. Inconsistent API key naming causing authentication failures
3. Date formatting inconsistencies
4. Missing data sufficiency checks for indicators
5. Cache TTL mismatches causing stale data

---

## Current Issues Analysis

### Issue 1: Insufficient Data Windows

**Current State (in `src/config/timeframes.ts`):**
| Timeframe | Days | Problem |
|-----------|------|---------|
| 1H | 2 | Only 48 bars - SMA(20) needs warm-up |
| 4H | 10 | Only 60 bars - borderline for indicators |

**FMP Intraday Limitation:** Testing revealed FMP intraday endpoints return "Restricted" for free tier keys, so 1H charts cannot be reliably fetched.

### Issue 2: API Key Naming Inconsistency

The Supabase secrets have BOTH keys configured:
- `FINNHUB_API_KEY` (two Ns) ✓
- `FINHUB_API_KEY` (one N) ✓

But edge functions reference them inconsistently:
- `market-data/index.ts` → uses `FINNHUB_API_KEY` (correct)
- `market-news/index.ts` → uses `FINHUB_API_KEY` (legacy)
- `stock-coach/index.ts` → uses `FINHUB_API_KEY` (legacy)

### Issue 3: Cache TTL Mismatch

| Location | Current TTL | Purpose |
|----------|-------------|---------|
| Edge Function | 30 seconds | Server-side cache |
| `useChartData.ts` | 30 seconds | Client-side cache |
| `cache.ts` singleton | 5 minutes | Global cache class |

The singleton in `cache.ts` defaults to 5 minutes but isn't used by the chart hook.

### Issue 4: No Indicator Sufficiency Checks

Charts attempt to render SMA20/SMA50 even when there aren't enough data points, leading to incomplete or misleading indicators.

---

## Implementation Plan

### Task 1: Update Timeframe Configuration

**File: `src/config/timeframes.ts`**

Changes:
- Remove 1H timeframe (FMP intraday not available on free tier)
- Increase 4H to 30 days for proper SMA warm-up
- Add 3M (3 months) and 1Y (1 year) timeframes
- Update TypeScript type definition

```text
Before:
  "1H": { resolution: "60", days: 2 },
  "4H": { resolution: "240", days: 10 },
  "1D": { resolution: "D", days: 120 },
  "1W": { resolution: "W", days: 365 },
  "1M": { resolution: "M", days: 730 },

After:
  "4H": { resolution: "240", days: 30 },      // 30 days = 180 bars
  "1D": { resolution: "D", days: 120 },       // unchanged
  "1W": { resolution: "W", days: 365 },       // unchanged  
  "1M": { resolution: "M", days: 730 },       // unchanged
  "3M": { resolution: "D", days: 90 },        // NEW: 90 daily bars
  "1Y": { resolution: "D", days: 365 },       // NEW: 365 daily bars
```

**File: `src/types/market.ts`**

Update the type:
```typescript
export type TimeframeType = "4H" | "1D" | "1W" | "1M" | "3M" | "1Y";
```

---

### Task 2: Standardize API Key References

**Files to update:**
1. `supabase/functions/market-data/index.ts` - Check BOTH keys
2. `supabase/functions/market-news/index.ts` - Check BOTH keys
3. `supabase/functions/stock-coach/index.ts` - Check BOTH keys

**Pattern to implement in each file:**
```typescript
// Support both secret names for backward compatibility
const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY") || Deno.env.get("FINHUB_API_KEY");
```

This ensures functions work regardless of which secret name is configured.

---

### Task 3: Synchronize Cache TTL to 60 Seconds

**File: `supabase/functions/market-data/index.ts`**

Change line 40:
```typescript
// Before
const CACHE_TTL_MS = 30 * 1000;

// After
const CACHE_TTL_MS = 60 * 1000; // 60 seconds - synchronized with client cache
```

**File: `src/hooks/useChartData.ts`**

Change line 21:
```typescript
// Before
const candleCache = new DataCache<Candle[]>(30_000);

// After
const candleCache = new DataCache<Candle[]>(60_000); // 60 seconds - synchronized with server cache
```

---

### Task 4: Add Indicator Sufficiency Checks

**File: `src/components/charts/AdvancedChart.tsx`**

Add data sufficiency calculation and UI overlay:

```typescript
// Calculate minimum data required for enabled indicators
const minDataRequired = useMemo(() => {
  let min = 1;
  if (indicators.find(i => i.id === "sma20")?.enabled) min = Math.max(min, 20);
  if (indicators.find(i => i.id === "sma50")?.enabled) min = Math.max(min, 50);
  if (indicators.find(i => i.id === "rsi")?.enabled) min = Math.max(min, 14);
  if (indicators.find(i => i.id === "macd")?.enabled) min = Math.max(min, 26);
  if (indicators.find(i => i.id === "bb")?.enabled) min = Math.max(min, 20);
  return min;
}, [indicators]);

const hasInsufficientData = candles.length > 0 && candles.length < minDataRequired;
```

Add visual indicator when data is insufficient:
```tsx
{hasInsufficientData && (
  <div className="absolute top-2 left-2 z-20 bg-warning/10 text-warning text-xs px-2 py-1 rounded">
    Insufficient data for selected indicators ({candles.length}/{minDataRequired} bars)
  </div>
)}
```

---

### Task 5: Update Timeframe UI Components

**File: `src/components/charts/AdvancedChart.tsx`**

Update the timeframe pills array (line 146):
```typescript
// Before
{(["1H", "4H", "1D", "1W", "1M"] as TimeframeType[]).map((tf) => (

// After
{(["4H", "1D", "3M", "1Y", "1W", "1M"] as TimeframeType[]).map((tf) => (
```

**File: `src/components/charts/ChartToolbar.tsx`** (if it has timeframe options)

Update to match the new timeframe options.

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `src/config/timeframes.ts` | Remove 1H, add 3M/1Y, increase 4H days |
| `src/types/market.ts` | Update TimeframeType union |
| `supabase/functions/market-data/index.ts` | Check both FINNHUB keys, set TTL=60s |
| `supabase/functions/market-news/index.ts` | Check both FINNHUB keys |
| `supabase/functions/stock-coach/index.ts` | Check both FINNHUB keys |
| `src/hooks/useChartData.ts` | Set cache TTL=60s |
| `src/components/charts/AdvancedChart.tsx` | Update timeframes, add sufficiency check |

---

## Technical Notes

### Date Formatting

All date handling already uses ISO YYYY-MM-DD format correctly:
- Edge function: `new Date().toISOString().split('T')[0]`
- Chart components: Parse dates as `Time` type for lightweight-charts

No changes needed - the current implementation is correct.

### Synthetic Data

The edge function already returns `{ candles: [], error: "no_data" }` when real data is unavailable (lines 588-598). No synthetic data is generated.

---

## Expected Outcomes

After implementation:
1. **4H charts** will have 180 bars (30 days × 6 bars/day) - sufficient for all indicators
2. **New 3M/1Y timeframes** give users longer-term perspectives
3. **API keys** will work regardless of secret naming convention
4. **Cache behavior** will be consistent across client and server (60s)
5. **Users see warnings** when data is insufficient for their selected indicators

