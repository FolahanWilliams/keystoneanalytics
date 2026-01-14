import { Star, TrendingUp, TrendingDown, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AddAssetDialog } from "@/components/dashboard/AddAssetDialog";

const WatchlistWidget = () => {
  const { watchlist, loading, addToWatchlist } = useWatchlist();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="font-semibold">Watchlist</h3>
        </div>
        <AddAssetDialog
          onAdd={addToWatchlist}
          trigger={
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          }
        />
      </div>

      {watchlist.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Star className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No assets yet</p>
          <AddAssetDialog onAdd={addToWatchlist} />
        </div>
      ) : (
        <div className="flex-1 space-y-1 overflow-y-auto scrollbar-terminal">
          {watchlist.slice(0, 6).map((item) => {
            const isPositive = item.change >= 0;
            
            return (
              <button
                key={item.id}
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
      )}
    </div>
  );
};

export default WatchlistWidget;
