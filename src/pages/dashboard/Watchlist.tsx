import { useState } from "react";
import { Star, Plus, Search, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: string;
}

const initialWatchlist: WatchlistItem[] = [
  { id: "1", symbol: "BTC", name: "Bitcoin", price: 45230.50, change: 1250.30, changePercent: 2.84, high24h: 45890, low24h: 43200, volume: "28.5B" },
  { id: "2", symbol: "ETH", name: "Ethereum", price: 2890.75, change: -45.20, changePercent: -1.54, high24h: 2950, low24h: 2820, volume: "15.2B" },
  { id: "3", symbol: "AAPL", name: "Apple Inc.", price: 182.63, change: 3.42, changePercent: 1.91, high24h: 184.50, low24h: 180.20, volume: "52.1M" },
  { id: "4", symbol: "TSLA", name: "Tesla", price: 248.50, change: -8.75, changePercent: -3.40, high24h: 258.90, low24h: 245.30, volume: "98.3M" },
  { id: "5", symbol: "NVDA", name: "NVIDIA", price: 875.28, change: 22.15, changePercent: 2.60, high24h: 882.50, low24h: 850.00, volume: "45.7M" },
  { id: "6", symbol: "SPY", name: "S&P 500 ETF", price: 478.92, change: 2.34, changePercent: 0.49, high24h: 480.10, low24h: 475.80, volume: "78.2M" },
  { id: "7", symbol: "AMZN", name: "Amazon", price: 178.25, change: 4.50, changePercent: 2.59, high24h: 179.80, low24h: 173.50, volume: "42.8M" },
  { id: "8", symbol: "GOOGL", name: "Alphabet", price: 141.80, change: -1.20, changePercent: -0.84, high24h: 144.00, low24h: 140.50, volume: "28.5M" },
];

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWatchlist = watchlist.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const removeItem = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <span className="text-sm text-muted-foreground">
            {watchlist.length} assets
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64 bg-secondary/50 border-border"
            />
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary/30">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Asset</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">24h Change</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">24h High</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden md:table-cell">24h Low</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 hidden lg:table-cell">Volume</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWatchlist.map((item) => {
                const isPositive = item.change >= 0;
                
                return (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          <span className="text-sm font-bold font-mono">{item.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <div className="font-semibold font-mono">{item.symbol}</div>
                          <div className="text-sm text-muted-foreground">{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-mono font-semibold">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div
                        className={cn(
                          "inline-flex items-center gap-1 font-mono text-sm px-2 py-1 rounded",
                          isPositive ? "ticker-positive" : "ticker-negative"
                        )}
                      >
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="p-4 text-right hidden md:table-cell">
                      <span className="font-mono text-sm text-muted-foreground">
                        ${item.high24h.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-right hidden md:table-cell">
                      <span className="font-mono text-sm text-muted-foreground">
                        ${item.low24h.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-right hidden lg:table-cell">
                      <span className="font-mono text-sm text-muted-foreground">{item.volume}</span>
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Watchlist;
