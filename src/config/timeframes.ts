import type { TimeframeType } from "@/types/market";

// Map timeframes to API parameters - single source of truth
export const timeframeConfig: Record<TimeframeType, { resolution: string; days: number; label: string }> = {
  "1H": { resolution: "60", days: 2, label: "1 Hour" },
  "4H": { resolution: "240", days: 10, label: "4 Hours" },
  "1D": { resolution: "D", days: 90, label: "Daily" },
  "1W": { resolution: "W", days: 365, label: "Weekly" },
  "1M": { resolution: "M", days: 730, label: "Monthly" },
};
