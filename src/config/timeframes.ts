import type { TimeframeType } from "@/types/market";

// Map timeframes to API parameters - single source of truth
// NOTE: 1H removed - FMP intraday requires premium tier
export const timeframeConfig: Record<TimeframeType, { resolution: string; days: number; label: string }> = {
  "4H": { resolution: "240", days: 30, label: "4 Hours" }, // 30 days = 180 bars for indicator warm-up
  "1D": { resolution: "D", days: 120, label: "Daily" },
  "1W": { resolution: "W", days: 365, label: "Weekly" },
  "1M": { resolution: "M", days: 730, label: "Monthly" },
  "3M": { resolution: "D", days: 90, label: "3 Months" }, // 90 daily bars
  "1Y": { resolution: "D", days: 365, label: "1 Year" }, // 365 daily bars
};

// Extended timeframe for technical indicator calculations
// Requires 100+ days for proper 50-day MA and RSI calculations
// 50 days for SMA50 + 50 days warm-up buffer for Wilder's Smoothing (RSI) + 20 buffer
export const indicatorTimeframeConfig = {
  resolution: "D",
  days: 120, // 120 days for short-term strategy: 50-day SMA + RSI warm-up + buffer
  label: "Technical Analysis",
};
