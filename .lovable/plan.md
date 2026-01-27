
# Full Chart Integration: Timeframe Switcher and Feature Completion

## Problem Summary

The timeframe switcher doesn't work for intraday timeframes (1H, 4H) because:
1. **FMP only handles D/W/M resolutions** - Intraday requests skip FMP entirely
2. **Finnhub fails for intraday** - Returns `status: undefined` (likely rate-limited or free tier restriction)
3. **Alpha Vantage is rate-limited** - Daily limit of 25 requests exceeded

Daily, Weekly, and Monthly work correctly via FMP's stable API endpoint.

## Solution Overview

### Phase 1: Fix Intraday Data Fetching

Add FMP's intraday chart endpoint for 1H and 4H resolutions:

| Timeframe | Resolution | FMP Endpoint | Interval |
|-----------|------------|--------------|----------|
| 1H | "60" | `/stable/historical-price-full/AAPL/1hour` | 1hour |
| 4H | "240" | `/stable/historical-price-full/AAPL/4hour` | 4hour |

**File: `supabase/functions/market-data/index.ts`**

Add intraday handling before the daily FMP block (around line 380):

```typescript
// PRIMARY: FMP intraday for 1H and 4H
if (FMP_API_KEY && (candleResolution === "60" || candleResolution === "240")) {
  try {
    const fmpInterval = candleResolution === "60" ? "1hour" : "4hour";
    const fmpIntradayRes = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval}/${encodedSymbol}?apikey=${FMP_API_KEY}`
    );
    const fmpIntradayData = await fmpIntradayRes.json();
    
    console.log(`FMP intraday ${fmpInterval} response for ${symbol}:`, 
      JSON.stringify(fmpIntradayData).substring(0, 300));
    
    if (Array.isArray(fmpIntradayData) && fmpIntradayData.length > 0) {
      // Slice to requested number of candles based on days config
      const maxCandles = candleResolution === "60" ? 48 : 60; // 2 days * 24 or 10 days * 6
      const slicedData = fmpIntradayData.slice(0, maxCandles).reverse();
      
      const candles = slicedData.map((d: any) => ({
        date: d.date.split(' ')[0], // Keep YYYY-MM-DD
        timestamp: new Date(d.date).getTime() / 1000,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));
      
      const payload = { candles, resolution: candleResolution, source: "fmp" };
      setCache(cacheKey, payload);
      console.log(`FMP ${fmpInterval} candles for ${symbol}: ${candles.length}`);
      
      return new Response(JSON.stringify(payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (fmpError) {
    console.error(`FMP intraday error for ${symbol}:`, fmpError);
  }
}
```

### Phase 2: Add Missing Overlay Indicators to PriceChart

Currently `PriceChart.tsx` only renders SMA20 and SMA50. Add support for:

- EMA 12 (blue)
- EMA 26 (purple)
- Bollinger Bands (upper, middle, lower - cyan)
- VWAP (amber)

**File: `src/components/charts/PriceChart.tsx`**

Add new series refs and rendering:

```typescript
// Add refs for new indicators
const ema12SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
const ema26SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
const bbMiddleSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

// Add indicator enable checks
const showEma12 = indicators.find((i) => i.id === "ema12")?.enabled ?? false;
const showEma26 = indicators.find((i) => i.id === "ema26")?.enabled ?? false;
const showBB = indicators.find((i) => i.id === "bb")?.enabled ?? false;
const showVwap = indicators.find((i) => i.id === "vwap")?.enabled ?? false;

// Extract data in useMemo
const { candleData, sma20Data, sma50Data, ema12Data, ema26Data, bbData, vwapData } = useMemo(() => {
  // ... existing logic
  const ema12: LineData<Time>[] = [];
  const ema26: LineData<Time>[] = [];
  const bbUpper: LineData<Time>[] = [];
  const bbMiddle: LineData<Time>[] = [];
  const bbLower: LineData<Time>[] = [];
  const vwap: LineData<Time>[] = [];
  
  for (const c of chartData) {
    // ... existing
    if (c.ema12 !== null && c.ema12 !== undefined) ema12.push({ time, value: c.ema12 });
    if (c.ema26 !== null && c.ema26 !== undefined) ema26.push({ time, value: c.ema26 });
    if (c.bbUpper !== null && c.bbUpper !== undefined) bbUpper.push({ time, value: c.bbUpper });
    if (c.bbMiddle !== null && c.bbMiddle !== undefined) bbMiddle.push({ time, value: c.bbMiddle });
    if (c.bbLower !== null && c.bbLower !== undefined) bbLower.push({ time, value: c.bbLower });
    if (c.vwap !== null && c.vwap !== undefined) vwap.push({ time, value: c.vwap });
  }
  
  return { candleData, sma20Data, sma50Data, ema12Data: ema12, ema26Data: ema26, 
           bbData: { upper: bbUpper, middle: bbMiddle, lower: bbLower }, vwapData: vwap };
}, [chartData]);
```

### Phase 3: Improve Timeframe Switch UX

**File: `src/components/charts/AdvancedChart.tsx`**

Show a spinner overlay during data loading instead of clearing the chart:

```typescript
// In the chart area, show loading overlay instead of replacing content
<div className="flex-1 min-h-0 relative">
  {loading && (
    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  )}
  {enrichedData.length > 0 ? (
    <div className="h-full flex flex-col gap-0">
      <PriceChart ... />
      <VolumeChart ... />
      {showRSI && <RSIChart ... />}
      {showMACD && <MACDChart ... />}
    </div>
  ) : (
    !loading && (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        No data available for this timeframe
      </div>
    )
  )}
</div>
```

### Phase 4: Better Error Messages

**File: `src/components/charts/AdvancedChart.tsx`**

Add specific messaging for intraday failures:

```typescript
const errorMessage = useMemo(() => {
  if (error === "no_data") {
    if (timeframe === "1H" || timeframe === "4H") {
      return "Intraday data temporarily unavailable. Try Daily or Weekly.";
    }
    return "Market data temporarily unavailable. Try again shortly.";
  }
  return `Failed to load chart: ${error}`;
}, [error, timeframe]);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/market-data/index.ts` | Add FMP intraday endpoint for 1H/4H resolutions |
| `src/components/charts/PriceChart.tsx` | Add EMA, Bollinger Bands, VWAP overlay rendering |
| `src/components/charts/AdvancedChart.tsx` | Improve loading state and error messages |

## Expected Results

After implementation:

| Timeframe | Expected Behavior |
|-----------|-------------------|
| 1H | Shows hourly candles from FMP intraday API (48 candles) |
| 4H | Shows 4-hour candles from FMP intraday API (60 candles) |
| 1D | Works as before - daily candles from FMP |
| 1W | Works as before - weekly aggregated from FMP daily |
| 1M | Works as before - monthly aggregated from FMP daily |

All overlay indicators (SMA, EMA, BB, VWAP) will render correctly when toggled on.

---

## Technical Notes

- FMP intraday endpoint: `https://financialmodelingprep.com/api/v3/historical-chart/{interval}/{symbol}`
- Supported intervals: 1min, 5min, 15min, 30min, 1hour, 4hour
- Returns most recent data first (needs `.reverse()` for chart)
- Date format is `"2024-01-15 09:30:00"` - needs parsing to YYYY-MM-DD
