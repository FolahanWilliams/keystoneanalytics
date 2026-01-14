import { useState, useEffect } from "react";
import { Search, Plus, Loader2, TrendingUp, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSymbolSearch, SearchResult } from "@/hooks/useMarketData";
import { cn } from "@/lib/utils";

// Popular stocks for quick access
const POPULAR_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", type: "Common Stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Common Stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Common Stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "Common Stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Common Stock" },
  { symbol: "TSLA", name: "Tesla Inc.", type: "Common Stock" },
  { symbol: "META", name: "Meta Platforms Inc.", type: "Common Stock" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "ETF" },
];

interface AddAssetDialogProps {
  onAdd: (symbol: string, name: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function AddAssetDialog({ onAdd, trigger }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const { results, loading, search } = useSymbolSearch();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 1) {
        search(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  const handleAdd = async (symbol: string, name: string) => {
    setAdding(true);
    const success = await onAdd(symbol, name);
    setAdding(false);
    if (success) {
      setOpen(false);
      setQuery("");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "common stock":
        return <TrendingUp className="w-4 h-4 text-primary" />;
      case "etf":
        return <Building2 className="w-4 h-4 text-info" />;
      default:
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Show search results if searching, otherwise show popular stocks
  const displayResults = query.length >= 1 ? results : POPULAR_STOCKS;
  const showingPopular = query.length < 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add to Watchlist</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search any stock, ETF, or index..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {showingPopular && (
            <p className="text-xs text-muted-foreground">
              Popular stocks — or search for any ticker
            </p>
          )}

          <div className="max-h-[300px] overflow-y-auto space-y-1 scrollbar-terminal">
            {displayResults.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handleAdd(item.symbol, item.name)}
                disabled={adding}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono">{item.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/70 text-muted-foreground">
                        {item.type || "Stock"}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {item.name}
                    </div>
                  </div>
                </div>
                <Plus className={cn(
                  "w-4 h-4 text-muted-foreground transition-colors",
                  "group-hover:text-primary"
                )} />
              </button>
            ))}

            {query.length >= 1 && !loading && results.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No results found for "{query}"
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
