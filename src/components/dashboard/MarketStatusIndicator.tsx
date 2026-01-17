import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MarketStatus = "pre-market" | "open" | "after-hours" | "closed";

interface MarketTime {
  status: MarketStatus;
  label: string;
  nextEvent: string;
  timeUntil: string;
}

// US Market hours in EST/EDT
const MARKET_HOURS = {
  preMarket: { start: 4, end: 9.5 }, // 4:00 AM - 9:30 AM
  regular: { start: 9.5, end: 16 },   // 9:30 AM - 4:00 PM
  afterHours: { start: 16, end: 20 }, // 4:00 PM - 8:00 PM
};

// US Market holidays 2025 (NYSE/NASDAQ)
const HOLIDAYS_2025 = [
  "2025-01-01", // New Year's Day
  "2025-01-20", // MLK Day
  "2025-02-17", // Presidents Day
  "2025-04-18", // Good Friday
  "2025-05-26", // Memorial Day
  "2025-06-19", // Juneteenth
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-11-27", // Thanksgiving
  "2025-12-25", // Christmas
];

function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split("T")[0];
  return HOLIDAYS_2025.includes(dateStr);
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getESTDate(): Date {
  // Get current time in EST/EDT
  const now = new Date();
  const estOffset = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  return new Date(estOffset);
}

function getHoursDecimal(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

function formatTimeUntil(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getMarketStatus(): MarketTime {
  const estDate = getESTDate();
  const hours = getHoursDecimal(estDate);
  
  // Check if weekend or holiday
  if (isWeekend(estDate) || isHoliday(estDate)) {
    const nextMonday = new Date(estDate);
    while (isWeekend(nextMonday) || isHoliday(nextMonday)) {
      nextMonday.setDate(nextMonday.getDate() + 1);
    }
    const msUntilOpen = nextMonday.setHours(9, 30, 0, 0) - estDate.getTime();
    const minutesUntil = msUntilOpen / 60000;
    
    return {
      status: "closed",
      label: "Markets Closed",
      nextEvent: "Opens Monday",
      timeUntil: formatTimeUntil(minutesUntil),
    };
  }
  
  // Pre-market: 4:00 AM - 9:30 AM
  if (hours >= MARKET_HOURS.preMarket.start && hours < MARKET_HOURS.regular.start) {
    const minutesUntilOpen = (MARKET_HOURS.regular.start - hours) * 60;
    return {
      status: "pre-market",
      label: "Pre-Market",
      nextEvent: "Opens at 9:30 AM",
      timeUntil: formatTimeUntil(minutesUntilOpen),
    };
  }
  
  // Regular hours: 9:30 AM - 4:00 PM
  if (hours >= MARKET_HOURS.regular.start && hours < MARKET_HOURS.regular.end) {
    const minutesUntilClose = (MARKET_HOURS.regular.end - hours) * 60;
    return {
      status: "open",
      label: "Market Open",
      nextEvent: "Closes at 4:00 PM",
      timeUntil: formatTimeUntil(minutesUntilClose),
    };
  }
  
  // After-hours: 4:00 PM - 8:00 PM
  if (hours >= MARKET_HOURS.regular.end && hours < MARKET_HOURS.afterHours.end) {
    const minutesUntilEnd = (MARKET_HOURS.afterHours.end - hours) * 60;
    return {
      status: "after-hours",
      label: "After Hours",
      nextEvent: "Ends at 8:00 PM",
      timeUntil: formatTimeUntil(minutesUntilEnd),
    };
  }
  
  // Closed: 8:00 PM - 4:00 AM
  let minutesUntilPreMarket: number;
  if (hours >= MARKET_HOURS.afterHours.end) {
    minutesUntilPreMarket = ((24 - hours) + MARKET_HOURS.preMarket.start) * 60;
  } else {
    minutesUntilPreMarket = (MARKET_HOURS.preMarket.start - hours) * 60;
  }
  
  return {
    status: "closed",
    label: "Markets Closed",
    nextEvent: "Pre-market at 4:00 AM",
    timeUntil: formatTimeUntil(minutesUntilPreMarket),
  };
}

interface MarketStatusIndicatorProps {
  compact?: boolean;
  className?: string;
}

export function MarketStatusIndicator({ compact = false, className }: MarketStatusIndicatorProps) {
  const [marketTime, setMarketTime] = useState<MarketTime>(getMarketStatus);
  
  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setMarketTime(getMarketStatus());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const statusConfig = useMemo(() => {
    switch (marketTime.status) {
      case "open":
        return {
          color: "bg-gain",
          textColor: "text-gain",
          bgColor: "bg-gain/10",
          pulseColor: "bg-gain",
        };
      case "pre-market":
        return {
          color: "bg-info",
          textColor: "text-info",
          bgColor: "bg-info/10",
          pulseColor: "bg-info",
        };
      case "after-hours":
        return {
          color: "bg-warning",
          textColor: "text-warning",
          bgColor: "bg-warning/10",
          pulseColor: "bg-warning",
        };
      case "closed":
      default:
        return {
          color: "bg-muted-foreground",
          textColor: "text-muted-foreground",
          bgColor: "bg-muted/30",
          pulseColor: "bg-muted-foreground",
        };
    }
  }, [marketTime.status]);
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative flex items-center justify-center w-2 h-2">
          {marketTime.status === "open" && (
            <motion.div
              className={cn("absolute w-full h-full rounded-full", statusConfig.pulseColor)}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
        </div>
        <span className={cn("text-xs font-medium", statusConfig.textColor)}>
          {marketTime.label}
        </span>
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", statusConfig.bgColor)}>
        <div className="relative flex items-center justify-center w-2 h-2">
          {marketTime.status === "open" && (
            <motion.div
              className={cn("absolute w-full h-full rounded-full", statusConfig.pulseColor)}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
          <div className={cn("w-2 h-2 rounded-full", statusConfig.color)} />
        </div>
        <span className={cn("text-xs font-semibold", statusConfig.textColor)}>
          {marketTime.label}
        </span>
      </div>
      <div className="text-[10px] text-muted-foreground">
        <span>{marketTime.nextEvent}</span>
        <span className="mx-1">·</span>
        <span className="font-mono tabular-nums">{marketTime.timeUntil}</span>
      </div>
    </div>
  );
}

export default MarketStatusIndicator;
