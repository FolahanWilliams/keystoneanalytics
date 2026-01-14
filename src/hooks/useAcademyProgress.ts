import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "pulse-academy-progress";

export interface ModuleProgress {
  moduleId: string;
  completed: boolean;
  completedAt?: string;
}

export interface QuizProgress {
  level: number;
  passed: boolean;
  score: number;
  completedAt: string;
}

export interface AcademyState {
  modules: Record<string, ModuleProgress>;
  quizzes: Record<number, QuizProgress>;
}

export function useAcademyProgress() {
  const [state, setState] = useState<AcademyState>({ modules: {}, quizzes: {} });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Handle legacy format (just modules object)
        if (!parsed.modules && !parsed.quizzes) {
          setState({ modules: parsed, quizzes: {} });
        } else {
          setState({ modules: parsed.modules || {}, quizzes: parsed.quizzes || {} });
        }
      }
    } catch (e) {
      console.warn("Failed to load academy progress:", e);
    }
  }, []);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    if (Object.keys(state.modules).length > 0 || Object.keys(state.quizzes).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const markCompleted = useCallback((moduleId: string) => {
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          moduleId,
          completed: true,
          completedAt: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const markQuizCompleted = useCallback((level: number, passed: boolean, score: number) => {
    setState((prev) => ({
      ...prev,
      quizzes: {
        ...prev.quizzes,
        [level]: {
          level,
          passed,
          score,
          completedAt: new Date().toISOString(),
        },
      },
    }));
  }, []);

  const isCompleted = useCallback(
    (moduleId: string) => state.modules[moduleId]?.completed ?? false,
    [state.modules]
  );

  const isQuizPassed = useCallback(
    (level: number) => state.quizzes[level]?.passed ?? false,
    [state.quizzes]
  );

  const getQuizScore = useCallback(
    (level: number) => state.quizzes[level]?.score ?? null,
    [state.quizzes]
  );

  const getCompletedCount = useCallback(() => {
    return Object.values(state.modules).filter((p) => p.completed).length;
  }, [state.modules]);

  const getPassedQuizzesCount = useCallback(() => {
    return Object.values(state.quizzes).filter((q) => q.passed).length;
  }, [state.quizzes]);

  const getPerfectQuizzesCount = useCallback(() => {
    return Object.values(state.quizzes).filter((q) => q.score === 1).length;
  }, [state.quizzes]);

  const isLevelUnlocked = useCallback(
    (level: number) => {
      if (level === 1) return true;
      // Level N is unlocked if quiz for level N-1 is passed
      return state.quizzes[level - 1]?.passed ?? false;
    },
    [state.quizzes]
  );

  const getUnlockedLevelsCount = useCallback(() => {
    let count = 1; // Level 1 is always unlocked
    for (let i = 1; i <= 4; i++) {
      if (state.quizzes[i]?.passed) count++;
    }
    return Math.min(count, 4);
  }, [state.quizzes]);

  const resetProgress = useCallback(() => {
    setState({ modules: {}, quizzes: {} });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    progress: state.modules,
    quizzes: state.quizzes,
    markCompleted,
    markQuizCompleted,
    isCompleted,
    isQuizPassed,
    getQuizScore,
    getCompletedCount,
    getPassedQuizzesCount,
    getPerfectQuizzesCount,
    isLevelUnlocked,
    getUnlockedLevelsCount,
    resetProgress,
  };
}
