import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  // These are mock prices - would come from a real API
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  volume?: string;
}

// Mock price data - in production, fetch from a real API
const mockPrices: Record<string, { price: number; change: number; changePercent: number; high24h: number; low24h: number; volume: string }> = {
  BTC: { price: 45230.50, change: 1250.30, changePercent: 2.84, high24h: 45890, low24h: 43200, volume: "28.5B" },
  ETH: { price: 2890.75, change: -45.20, changePercent: -1.54, high24h: 2950, low24h: 2820, volume: "15.2B" },
  AAPL: { price: 182.63, change: 3.42, changePercent: 1.91, high24h: 184.50, low24h: 180.20, volume: "52.1M" },
  TSLA: { price: 248.50, change: -8.75, changePercent: -3.40, high24h: 258.90, low24h: 245.30, volume: "98.3M" },
  NVDA: { price: 875.28, change: 22.15, changePercent: 2.60, high24h: 882.50, low24h: 850.00, volume: "45.7M" },
  SPY: { price: 478.92, change: 2.34, changePercent: 0.49, high24h: 480.10, low24h: 475.80, volume: "78.2M" },
  AMZN: { price: 178.25, change: 4.50, changePercent: 2.59, high24h: 179.80, low24h: 173.50, volume: "42.8M" },
  GOOGL: { price: 141.80, change: -1.20, changePercent: -0.84, high24h: 144.00, low24h: 140.50, volume: "28.5M" },
};

const defaultPrices = { price: 100, change: 0, changePercent: 0, high24h: 100, low24h: 100, volume: "0" };

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const itemsWithPrices: WatchlistItem[] = (data || []).map((item) => {
        const prices = mockPrices[item.symbol] || defaultPrices;
        return {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          ...prices,
        };
      });

      setWatchlist(itemsWithPrices);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const addToWatchlist = async (symbol: string, name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, symbol, name });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already in watchlist",
            description: `${symbol} is already in your watchlist.`,
            variant: "destructive",
          });
          return false;
        }
        throw error;
      }

      toast({
        title: "Added to watchlist",
        description: `${symbol} has been added to your watchlist.`,
      });

      await fetchWatchlist();
      return true;
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to add to watchlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromWatchlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("watchlist")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setWatchlist((prev) => prev.filter((item) => item.id !== id));
      
      toast({
        title: "Removed from watchlist",
        description: "Asset removed from your watchlist.",
      });
      return true;
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast({
        title: "Error",
        description: "Failed to remove from watchlist.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    refetch: fetchWatchlist,
  };
}
