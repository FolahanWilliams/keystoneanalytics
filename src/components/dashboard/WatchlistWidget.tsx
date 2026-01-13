import { Star, TrendingUp, TrendingDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const mockWatchlist: WatchlistItem[] = [
  { symbol: "BTC", name: "Bitcoin", price: 45230.50, change: 1250.30, changePercent: 2.84 },
  { symbol: "ETH", name: "Ethereum", price: 2890.75, change: -45.20, changePercent: -1.54 },
  { symbol: "AAPL", name: "Apple Inc.", price: 182.63, change: 3.42, changePercent: 1.91 },
  { symbol: "TSLA", name: "Tesla", price: 248.50, change: -8.75, changePercent: -3.40 },
  { symbol: "NVDA", name: "NVIDIA", price: 875.28, change: 22.15, changePercent: 2.60 },
  { symbol: "SPY", name: "S&P 500 ETF", price: 478.92, change: 2.34, changePercent: 0.49 },
];

const WatchlistWidget = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Watchlist</h3>
        </div>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto scrollbar-terminal">
        {mockWatchlist.map((item) => {
          const isPositive = item.change >= 0;
          
          return (
            <button
              key={item.symbol}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold font-mono">{item.symbol.slice(0, 2)}</span>
                </div>
                <div className="text-left">
                  <div className="font-medium font-mono text-sm">{item.symbol}</div>
                  <div className="text-xs text-muted-foreground">{item.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono text-sm">${item.price.toLocaleString()}</div>
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 text-xs font-mono",
                    isPositive ? "text-gain" : "text-loss"
                  )}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WatchlistWidget;
