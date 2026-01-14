import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high24h?: number;
  low24h?: number;
  volume?: string;
}

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWatchlist = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("watchlist")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      // Fetch real prices from our market-data edge function
      const symbols = data.map(item => item.symbol);
      
      try {
        const { data: priceData, error: priceError } = await supabase.functions.invoke("market-data", {
          body: { symbols, type: "quotes" },
        });

        if (priceError) throw priceError;

        const quotes = priceData?.quotes || [];
        const priceMap: Record<string, any> = {};
        quotes.forEach((q: any) => {
          priceMap[q.symbol] = q;
        });

        const itemsWithPrices: WatchlistItem[] = data.map((item) => {
          const quote = priceMap[item.symbol] || {};
          return {
            id: item.id,
            symbol: item.symbol,
            name: item.name,
            price: quote.price || 0,
            change: quote.change || 0,
            changePercent: quote.changePercent || 0,
            high24h: quote.high,
            low24h: quote.low,
          };
        });

        setWatchlist(itemsWithPrices);
      } catch (priceErr) {
        // If price fetch fails, still show watchlist with zero prices
        console.error("Error fetching prices:", priceErr);
        const itemsWithoutPrices: WatchlistItem[] = data.map((item) => ({
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          price: 0,
          change: 0,
          changePercent: 0,
        }));
        setWatchlist(itemsWithoutPrices);
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();

    // Refresh prices every 30 seconds
    const interval = setInterval(() => {
      if (watchlist.length > 0) {
        fetchWatchlist();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchWatchlist]);

  const addToWatchlist = async (symbol: string, name: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("watchlist")
        .insert({ user_id: user.id, symbol: symbol.toUpperCase(), name });

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
