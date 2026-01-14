import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, TrendingUp, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useSymbolSearch, SearchResult } from "@/hooks/useMarketData";

interface StockSearchProps {
  onSelect: (symbol: string, name: string) => void;
  placeholder?: string;
  className?: string;
  showInline?: boolean;
}

export function StockSearch({ 
  onSelect, 
  placeholder = "Search any stock...", 
  className,
  showInline = false 
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, search } = useSymbolSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 1) {
        search(query);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onSelect(result.symbol, result.name);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
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

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 1 && setIsOpen(true)}
          className={cn(
            "pl-9 pr-9 bg-secondary/50 border-border",
            showInline && "h-8 text-sm"
          )}
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-[300px] overflow-y-auto scrollbar-terminal">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-1">
              {results.map((result) => (
                <button
                  key={result.symbol}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold font-mono text-sm">{result.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                        {result.type || "Stock"}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {result.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 1 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              No results found for "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
