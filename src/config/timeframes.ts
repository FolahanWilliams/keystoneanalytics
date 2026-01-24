import type { TimeframeType } from "@/types/market";

// Map timeframes to API parameters - single source of truth
export const timeframeConfig: Record<TimeframeType, { resolution: string; days: number; label: string }> = {
  "1H": { resolution: "60", days: 2, label: "1 Hour" },
  "4H": { resolution: "240", days: 10, label: "4 Hours" },
  // 120 days ensures chart + overlays can render 50-day SMA and smoothing windows reliably
  "1D": { resolution: "D", days: 120, label: "Daily" },
  "1W": { resolution: "W", days: 365, label: "Weekly" },
  "1M": { resolution: "M", days: 730, label: "Monthly" },
};

// Extended timeframe for technical indicator calculations
// Requires 100+ days for proper 50-day MA and RSI calculations
// 50 days for SMA50 + 50 days warm-up buffer for Wilder's Smoothing (RSI) + 20 buffer
export const indicatorTimeframeConfig = {
  resolution: "D",
  days: 120, // 120 days for short-term strategy: 50-day SMA + RSI warm-up + buffer
  label: "Technical Analysis",
};
