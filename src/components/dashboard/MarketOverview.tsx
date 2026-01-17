import { memo, useState, useEffect, useRef, useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, RefreshCw, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const MARKET_SYMBOLS = ["SPY", "QQQ", "AAPL", "MSFT", "NVDA", "TSLA"];

interface MarketOverviewProps {
  onSymbolClick?: (symbol: string) => void;
}

const MarketOverviewComponent = ({ onSymbolClick }: MarketOverviewProps) => {
  const { quotes, loading, refetch } = useQuotes(MARKET_SYMBOLS);
  const [displayTime, setDisplayTime] = useState(() => new Date());
  const navigate = useNavigate();
  const lastMinuteRef = useRef(displayTime.getMinutes());

  // Optimized: Check every 10 seconds instead of every second
  // Only update state when minute changes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastMinuteRef.current) {
        lastMinuteRef.current = now.getMinutes();
        setDisplayTime(now);
      }
    }, 10000); // Check every 10 seconds instead of 1 second
    return () => clearInterval(interval);
  }, []);

  // Memoize market status calculation
  const { isMarketHours, isWeekend } = useMemo(() => {
    const hours = displayTime.getUTCHours() - 5;
    const day = displayTime.getUTCDay();
    const weekend = day === 0 || day === 6;
    const marketHours = !weekend && hours >= 9.5 && hours < 16;
    return { isMarketHours: marketHours, isWeekend: weekend };
  }, [displayTime]);

  const handleSymbolClick = (symbol: string) => {
    if (onSymbolClick) {
      onSymbolClick(symbol);
    } else {
      navigate(`/dashboard?symbol=${symbol}`);
    }
  };

  return (
    <div 
      data-onboarding="market-bar" 
      className="h-12 flex items-center justify-between px-4 md:px-6 bg-background border-b border-border shrink-0"
    >
      {/* Market Status */}
      <div className="flex items-center gap-2 pr-4 border-r border-border shrink-0">
        <div className="relative w-2 h-2">
          <span className={cn(
            "absolute inset-0 rounded-full",
            isMarketHours ? "bg-gain animate-ping opacity-75" : "bg-muted-foreground/50"
          )} />
          <span className={cn(
            "absolute inset-0 rounded-full",
            isMarketHours ? "bg-gain" : "bg-muted-foreground"
          )} />
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium hidden sm:inline">
          {isMarketHours ? "Live" : "Closed"}
        </span>
      </div>

      {/* Ticker Strip */}
      <div className="flex-1 flex items-center gap-4 md:gap-6 overflow-x-auto scrollbar-hide px-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 animate-pulse">
              <div className="w-8 h-3 bg-muted rounded" />
              <div className="w-12 h-3 bg-muted rounded" />
            </div>
          ))
        ) : (
          quotes.map((quote, i) => {
            const isPositive = quote.change > 0;
            const isNeutral = quote.change === 0;
            
            return (
              <motion.button
                key={quote.symbol}
                onClick={() => handleSymbolClick(quote.symbol)}
                className="flex items-center gap-2 shrink-0 hover:bg-accent/50 px-2 py-1 -mx-2 -my-1 rounded-lg transition-colors"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <span className="font-mono text-[11px] font-medium text-muted-foreground">
                  {quote.symbol}
                </span>
                <div className="flex items-center gap-1">
                  {isNeutral ? (
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  ) : isPositive ? (
                    <TrendingUp className="w-3 h-3 text-gain" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-loss" />
                  )}
                  <span className={cn(
                    "font-mono text-[11px] font-semibold tabular-nums",
                    isNeutral ? "text-muted-foreground" : isPositive ? "text-gain" : "text-loss"
                  )}>
                    {isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%
                  </span>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 pl-4 border-l border-border shrink-0">
        <button
          onClick={refetch}
          disabled={loading}
          className={cn(
            "p-1.5 rounded-lg hover:bg-accent transition-colors",
            loading && "animate-spin"
          )}
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
            {displayTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// Memoize the entire component
const MarketOverview = memo(MarketOverviewComponent);

export default MarketOverview;
