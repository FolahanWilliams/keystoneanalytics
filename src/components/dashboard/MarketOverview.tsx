import { TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuotes } from "@/hooks/useMarketData";
import { useState, useEffect } from "react";

const MARKET_SYMBOLS = ["AAPL", "GOOGL", "MSFT", "AMZN", "NVDA", "TSLA", "META", "SPY"];

const MarketOverview = () => {
  const { quotes, loading, refetch } = useQuotes(MARKET_SYMBOLS);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine market status
  const now = currentTime;
  const hours = now.getUTCHours() - 5; // EST
  const day = now.getUTCDay();
  const isWeekend = day === 0 || day === 6;
  const isMarketHours = !isWeekend && hours >= 9.5 && hours < 16;

  return (
    <div className="w-full border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-terminal flex-1">
          {quotes.length > 0 ? (
            quotes.map((quote) => {
              const isPositive = quote.change >= 0;
              
              return (
                <div 
                  key={quote.symbol} 
                  className="flex items-center gap-2 px-3 py-1 rounded-md hover:bg-secondary/50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <span className="text-xs font-medium text-muted-foreground">{quote.symbol}</span>
                  <span className="font-mono text-xs font-semibold">
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
                </div>
              );
            })
          ) : (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1">
                <div className="w-10 h-3 bg-secondary/50 rounded animate-pulse" />
                <div className="w-14 h-3 bg-secondary/50 rounded animate-pulse" />
                <div className="w-12 h-3 bg-secondary/50 rounded animate-pulse" />
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground whitespace-nowrap pl-4 border-l border-border/50">
          <button 
            onClick={refetch}
            disabled={loading}
            className={cn(
              "p-1 rounded hover:bg-secondary/50 transition-colors",
              loading && "animate-spin"
            )}
            title="Refresh data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isMarketHours ? "bg-gain animate-pulse" : "bg-muted-foreground"
            )} />
            <span className="text-xs">{isMarketHours ? "Market Open" : "Market Closed"}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-mono">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
            <span className="text-muted-foreground/70">EST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
