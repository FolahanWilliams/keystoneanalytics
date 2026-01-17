import { useState } from "react";
import { Star, Search, TrendingUp, TrendingDown, Trash2, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AddAssetDialog } from "@/components/dashboard/AddAssetDialog";
import { useNavigate } from "react-router-dom";
import { BentoModule, BentoGrid } from "@/components/ui/bento-module";
import { motion } from "framer-motion";

const Watchlist = () => {
  const { watchlist, loading, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const filteredWatchlist = watchlist.filter(
    (item) =>
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewChart = (symbol: string) => {
    navigate(`/dashboard?symbol=${symbol}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Watchlist</h1>
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
            {watchlist.length} assets
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48 h-9 bg-muted/50 border-border/50 text-sm"
            />
          </div>
          <AddAssetDialog onAdd={addToWatchlist} />
        </div>
      </div>

      <BentoGrid>
        {/* Empty State */}
        {watchlist.length === 0 && (
          <BentoModule size="full" noHeader className="min-h-[400px]">
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-6">
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-2">No assets tracked</h2>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs">
                Add stocks to your watchlist to track performance
              </p>
              <AddAssetDialog onAdd={addToWatchlist} />
            </div>
          </BentoModule>
        )}

        {/* Watchlist Table */}
        {watchlist.length > 0 && (
          <BentoModule size="full" noHeader noPadding>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50">
                  <tr>
                    <th className="text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Asset</th>
                    <th className="text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Price</th>
                    <th className="text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Change</th>
                    <th className="text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">High</th>
                    <th className="text-right text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Low</th>
                    <th className="text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredWatchlist.map((item, index) => {
                    const isPositive = item.change >= 0;
                    
                    return (
                      <motion.tr 
                        key={item.id} 
                        className="hover:bg-muted/30 transition-colors duration-200 cursor-pointer group"
                        onClick={() => handleViewChart(item.symbol)}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <span className="text-[10px] font-bold font-mono text-muted-foreground group-hover:text-primary">
                                {item.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold font-mono group-hover:text-primary transition-colors">
                                {item.symbol}
                              </div>
                              <div className="text-xs text-muted-foreground truncate max-w-[120px]">
                                {item.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-mono font-medium tabular-nums">
                            ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-mono tabular-nums px-2 py-0.5 rounded",
                            isPositive 
                              ? "text-gain bg-gain/10" 
                              : "text-loss bg-loss/10"
                          )}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isPositive ? "+" : ""}{item.changePercent.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-xs font-mono text-muted-foreground tabular-nums">
                            ${item.high24h?.toLocaleString() || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-xs font-mono text-muted-foreground tabular-nums">
                            ${item.low24h?.toLocaleString() || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewChart(item.symbol);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromWatchlist(item.id);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-loss hover:bg-loss/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* No results */}
            {filteredWatchlist.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">No assets match your search</p>
              </div>
            )}
          </BentoModule>
        )}
      </BentoGrid>
    </motion.div>
  );
};

export default Watchlist;
