import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ChartDrawing, DrawingType, DrawingData } from "@/types/market";
import { useToast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

export function useChartDrawings(symbol: string, timeframe: string) {
  const [drawings, setDrawings] = useState<ChartDrawing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrawings = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        setDrawings([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("chart_drawings")
        .select("*")
        .eq("symbol", symbol)
        .eq("timeframe", timeframe)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Transform data to match our types
      const transformed: ChartDrawing[] = (data || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        symbol: row.symbol,
        timeframe: row.timeframe,
        type: row.type as DrawingType,
        data: row.data as unknown as DrawingData,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
      setDrawings(transformed);
    } catch (err) {
      console.error("Error fetching drawings:", err);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  const addDrawing = useCallback(async (
    type: DrawingType,
    data: DrawingData
  ): Promise<ChartDrawing | null> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        toast({
          title: "Login required",
          description: "Please sign in to save chart drawings",
          variant: "destructive",
        });
        return null;
      }

      const { data: newDrawing, error } = await supabase
        .from("chart_drawings")
        .insert({
          user_id: session.session.user.id,
          symbol,
          timeframe,
          type,
          data: data as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      const drawing: ChartDrawing = {
        id: newDrawing.id,
        user_id: newDrawing.user_id,
        symbol: newDrawing.symbol,
        timeframe: newDrawing.timeframe,
        type: newDrawing.type as DrawingType,
        data: newDrawing.data as unknown as DrawingData,
        created_at: newDrawing.created_at,
        updated_at: newDrawing.updated_at,
      };
      
      setDrawings((prev) => [...prev, drawing]);
      return drawing;
    } catch (err) {
      console.error("Error adding drawing:", err);
      toast({
        title: "Failed to save drawing",
        description: "Please try again",
        variant: "destructive",
      });
      return null;
    }
  }, [symbol, timeframe, toast]);

  const updateDrawing = useCallback(async (
    id: string,
    data: DrawingData
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chart_drawings")
        .update({ data: data as unknown as Json })
        .eq("id", id);

      if (error) throw error;

      setDrawings((prev) =>
        prev.map((d) => (d.id === id ? { ...d, data, updated_at: new Date().toISOString() } : d))
      );
      return true;
    } catch (err) {
      console.error("Error updating drawing:", err);
      return false;
    }
  }, []);

  const deleteDrawing = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("chart_drawings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDrawings((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: "Drawing removed",
        description: "The drawing has been deleted",
      });
      return true;
    } catch (err) {
      console.error("Error deleting drawing:", err);
      return false;
    }
  }, [toast]);

  const clearAllDrawings = useCallback(async (): Promise<boolean> => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) return false;

      const { error } = await supabase
        .from("chart_drawings")
        .delete()
        .eq("symbol", symbol)
        .eq("timeframe", timeframe)
        .eq("user_id", session.session.user.id);

      if (error) throw error;

      setDrawings([]);
      toast({
        title: "Drawings cleared",
        description: "All drawings have been removed",
      });
      return true;
    } catch (err) {
      console.error("Error clearing drawings:", err);
      return false;
    }
  }, [symbol, timeframe, toast]);

  return {
    drawings,
    loading,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    clearAllDrawings,
    refetch: fetchDrawings,
  };
}
