import { memo } from "react";
import { TrendingUp, TrendingDown, Plus, Loader2, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AddAssetDialog } from "@/components/dashboard/AddAssetDialog";
import { motion } from "framer-motion";

interface WatchlistWidgetProps {
  onSelectSymbol?: (symbol: string) => void;
  selectedSymbol?: string;
}

const WatchlistWidget = memo(function WatchlistWidget({ onSelectSymbol, selectedSymbol }: WatchlistWidgetProps) {
  const { watchlist, loading, error, addToWatchlist, removeFromWatchlist, refetch } = useWatchlist();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4 gap-3">
        <AlertTriangle className="w-6 h-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Failed to load</p>
        <Button variant="outline" size="sm" onClick={refetch} className="h-7 text-xs gap-1.5">
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="data-label">Watchlist</span>
        <AddAssetDialog
          onAdd={addToWatchlist}
          trigger={
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-primary/10">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </Button>
          }
        />
      </div>

      {/* Empty State */}
      {watchlist.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">Add stocks to watch</p>
          <AddAssetDialog onAdd={addToWatchlist} />
        </div>
      ) : (
        <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-terminal -mx-1 px-1">
          {watchlist.slice(0, 8).map((item, i) => {
            const isPositive = item.change >= 0;
            const isSelected = selectedSymbol === item.symbol;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "group flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 cursor-pointer",
                  isSelected 
                    ? "bg-primary/10 border-l-2 border-l-primary" 
                    : "hover:bg-accent/50 border-l-2 border-l-transparent"
                )}
                onClick={() => onSelectSymbol?.(item.symbol)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                      {item.name}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-mono text-sm tabular-nums text-foreground">
                      ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={cn(
                      "flex items-center justify-end gap-0.5 font-mono text-[10px] tabular-nums",
                      isPositive ? "text-gain" : "text-loss"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="w-2.5 h-2.5" />
                      ) : (
                        <TrendingDown className="w-2.5 h-2.5" />
                      )}
                      {isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWatchlist(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default WatchlistWidget;
