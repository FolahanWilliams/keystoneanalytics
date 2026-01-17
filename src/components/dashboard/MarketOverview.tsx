import { TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const MARKET_SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "NVDA", "TSLA", "META", "SPY"];

interface MarketOverviewProps {
  onSymbolClick?: (symbol: string) => void;
}

const MarketOverview = ({ onSymbolClick }: MarketOverviewProps) => {
  const { quotes, loading, refetch } = useQuotes(MARKET_SYMBOLS);
  const [displayTime, setDisplayTime] = useState(() => new Date());
  const navigate = useNavigate();
  const lastMinuteRef = useRef(displayTime.getMinutes());

  // Only update display when minute changes (debounced clock)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() !== lastMinuteRef.current) {
        lastMinuteRef.current = now.getMinutes();
        setDisplayTime(now);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine market status
  const hours = displayTime.getUTCHours() - 5; // EST
  const day = displayTime.getUTCDay();
  const isWeekend = day === 0 || day === 6;
  const isMarketHours = !isWeekend && hours >= 9.5 && hours < 16;

  const handleSymbolClick = (symbol: string) => {
    if (onSymbolClick) {
      onSymbolClick(symbol);
    } else {
      navigate(`/dashboard?symbol=${symbol}`);
    }
  };

  return (
    <div data-onboarding="market-bar" className="w-full border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-terminal flex-1">
          {quotes.length > 0 ? (
            quotes.map((quote) => {
              const isPositive = quote.change >= 0;
              
              return (
                <button 
                  key={quote.symbol} 
                  onClick={() => handleSymbolClick(quote.symbol)}
                  className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-md hover:bg-secondary/50 active:bg-secondary/70 transition-colors whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <span className="text-xs font-medium text-muted-foreground">{quote.symbol}</span>
                  <span className="font-mono text-xs font-semibold hidden sm:inline">
                    ${quote.price.toFixed(2)}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-0.5 font-mono text-xs",
                      isPositive ? "text-gain" : "text-loss"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {isPositive ? "+" : ""}
                    {quote.changePercent.toFixed(2)}%
                  </span>
                </button>
              );
            })
          ) : (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1">
                <div className="w-10 h-3 bg-secondary/50 rounded animate-pulse" />
                <div className="w-14 h-3 bg-secondary/50 rounded animate-pulse hidden sm:block" />
                <div className="w-12 h-3 bg-secondary/50 rounded animate-pulse" />
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground whitespace-nowrap pl-2 md:pl-4 border-l border-border/50">
          <button 
            onClick={refetch}
            disabled={loading}
            className={cn(
              "p-1.5 rounded-md hover:bg-secondary/50 active:bg-secondary/70 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
              loading && "animate-spin"
            )}
            title="Refresh data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <div className="hidden sm:flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isMarketHours ? "bg-gain animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-xs">{isMarketHours ? "Market Open" : "Market Closed"}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">
              {displayTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
            <span className="text-muted-foreground/70 hidden sm:inline">EST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
