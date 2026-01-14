import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { SkillLevel, EducationContext, EducationResponse } from "@/types/education";
import { EDUCATIONAL_TOPICS } from "@/types/education";

export function useEducation() {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExplanation = useCallback(async (
    topic: string,
    context?: EducationContext,
    level: SkillLevel = "beginner"
  ): Promise<EducationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("education", {
        body: { topic, context, level },
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setContent(data.content);
      return data as EducationResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load explanation";
      setError(message);
      toast({
        variant: "destructive",
        title: "Education Error",
        description: message,
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    fetchExplanation,
    isLoading,
    content,
    error,
    topics: EDUCATIONAL_TOPICS,
  };
}

// Re-export types for convenience
export type { SkillLevel, EducationContext, EducationResponse } from "@/types/education";
export { EDUCATIONAL_TOPICS } from "@/types/education";
