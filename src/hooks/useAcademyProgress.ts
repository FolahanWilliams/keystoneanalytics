import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pulse-academy-progress";

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: string;
}

export function useAcademyProgress() {
  const [progress, setProgress] = useState<Record<string, ModuleProgress>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProgress(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load academy progress:", e);
    }
  }, []);

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  const markCompleted = useCallback((moduleId: string) => {
    setProgress((prev) => ({
      ...prev,
      [moduleId]: {
        moduleId,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const isCompleted = useCallback(
    (moduleId: string) => progress[moduleId]?.completed ?? false,
    [progress]
  );

  const getCompletedCount = useCallback(() => {
    return Object.values(progress).filter((p) => p.completed).length;
  }, [progress]);

  const resetProgress = useCallback(() => {
    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress,
    markCompleted,
    isCompleted,
    getCompletedCount,
    resetProgress,
  };
}
