import { useState } from "react";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Asset {
  symbol: string;
  name: string;
}

const availableAssets: Asset[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
  { symbol: "SPY", name: "S&P 500 ETF" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "META", name: "Meta Platforms" },
  { symbol: "AMD", name: "AMD" },
  { symbol: "COIN", name: "Coinbase" },
];

interface AddAssetDialogProps {
  onAdd: (symbol: string, name: string) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function AddAssetDialog({ onAdd, trigger }: AddAssetDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredAssets = availableAssets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(search.toLowerCase()) ||
      asset.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (asset: Asset) => {
    setLoading(true);
    const success = await onAdd(asset.symbol, asset.name);
    setLoading(false);
    if (success) {
      setOpen(false);
      setSearch("");
    }
  };

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
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-secondary/50 border-border"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-1 scrollbar-terminal">
            {filteredAssets.map((asset) => (
              <button
                key={asset.symbol}
                onClick={() => handleAdd(asset)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <span className="text-sm font-bold font-mono">
                      {asset.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold font-mono">{asset.symbol}</div>
                    <div className="text-sm text-muted-foreground">{asset.name}</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}

            {filteredAssets.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No assets found
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
