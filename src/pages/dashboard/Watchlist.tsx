import { useState } from "react";
import { Star, Search, TrendingUp, TrendingDown, Trash2, Loader2, BarChart3, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useWatchlist } from "@/hooks/useWatchlist";
import { AddAssetDialog } from "@/components/dashboard/AddAssetDialog";
import { useNavigate } from "react-router-dom";

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
    // Navigate to overview with symbol selected
    navigate(`/dashboard?symbol=${symbol}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Star className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <span className="text-sm text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
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
          <AddAssetDialog onAdd={addToWatchlist} />
        </div>
      </div>

      {/* Empty State */}
      {watchlist.length === 0 && (
        <div className="glass-panel rounded-xl p-12 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Your watchlist is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add assets to track their performance and stay updated.
          </p>
          <AddAssetDialog onAdd={addToWatchlist} />
        </div>
      )}

      {/* Table */}
      {watchlist.length > 0 && (
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
                  <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredWatchlist.map((item) => {
                  const isPositive = item.change >= 0;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-secondary/30 transition-colors cursor-pointer group"
                      onClick={() => handleViewChart(item.symbol)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <span className="text-sm font-bold font-mono text-primary">{item.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <div className="font-semibold font-mono group-hover:text-primary transition-colors">{item.symbol}</div>
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
                          ${item.high24h?.toLocaleString() || "—"}
                        </span>
                      </td>
                      <td className="p-4 text-right hidden md:table-cell">
                        <span className="font-mono text-sm text-muted-foreground">
                          ${item.low24h?.toLocaleString() || "—"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewChart(item.symbol);
                            }}
                            className="text-muted-foreground hover:text-primary h-8 w-8 p-0"
                            title="View chart"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromWatchlist(item.id);
                            }}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            title="Remove from watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No results */}
      {watchlist.length > 0 && filteredWatchlist.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No assets match your search</p>
        </div>
      )}
    </div>
  );
};

export default Watchlist;
