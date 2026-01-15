import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Migrate localStorage progress to database
  const migrateLocalStorageToDb = async (uid: string) => {
    try {
      const stored = localStorage.getItem("pulse-academy-progress");
      if (!stored) return false;

      const parsed = JSON.parse(stored);
      const localModules = parsed.modules || (parsed.quizzes ? {} : parsed);
      const localQuizzes = parsed.quizzes || {};

      const hasLocalData = Object.keys(localModules).length > 0 || Object.keys(localQuizzes).length > 0;
      if (!hasLocalData) return false;

      // Check if user already has data in database
      const { data: existingModules } = await supabase
        .from("academy_progress")
        .select("module_id")
        .eq("user_id", uid)
        .limit(1);

      const { data: existingQuizzes } = await supabase
        .from("academy_quizzes")
        .select("level")
        .eq("user_id", uid)
        .limit(1);

      const hasDbData = (existingModules?.length || 0) > 0 || (existingQuizzes?.length || 0) > 0;
      
      // Only migrate if user has no existing database data
      if (hasDbData) return false;

      // Migrate modules
      const moduleInserts = Object.values(localModules).map((mod: any) => ({
        user_id: uid,
        module_id: mod.moduleId,
        completed: mod.completed,
        completed_at: mod.completedAt || null,
      }));

      if (moduleInserts.length > 0) {
        const { error: moduleError } = await supabase
          .from("academy_progress")
          .upsert(moduleInserts, { onConflict: "user_id,module_id" });
        
        if (moduleError) throw moduleError;
      }

      // Migrate quizzes
      const quizInserts = Object.values(localQuizzes).map((quiz: any) => ({
        user_id: uid,
        level: quiz.level,
        passed: quiz.passed,
        score: quiz.score,
        completed_at: quiz.completedAt,
      }));

      if (quizInserts.length > 0) {
        const { error: quizError } = await supabase
          .from("academy_quizzes")
          .upsert(quizInserts, { onConflict: "user_id,level" });
        
        if (quizError) throw quizError;
      }

      // Clear localStorage after successful migration
      localStorage.removeItem("pulse-academy-progress");
      
      return true;
    } catch (error) {
      console.error("Error migrating localStorage to database:", error);
      return false;
    }
  };

  // Get current user and load progress
  useEffect(() => {
    const loadUserAndProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserId(user.id);
          // Try to migrate localStorage data first
          const migrated = await migrateLocalStorageToDb(user.id);
          if (migrated) {
            toast({
              title: "Progress Synced",
              description: "Your learning progress has been saved to your account.",
            });
          }
          await loadProgressFromDb(user.id);
        } else {
          loadFromLocalStorage();
        }
      } catch (error) {
        console.error("Error loading user:", error);
        loadFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserAndProgress();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          // Migrate on sign in/sign up
          if (event === "SIGNED_IN") {
            const migrated = await migrateLocalStorageToDb(session.user.id);
            if (migrated) {
              toast({
                title: "Progress Synced",
                description: "Your learning progress has been saved to your account.",
              });
            }
          }
          await loadProgressFromDb(session.user.id);
        } else {
          setUserId(null);
          loadFromLocalStorage();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("pulse-academy-progress");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.modules && !parsed.quizzes) {
          setState({ modules: parsed, quizzes: {} });
        } else {
          setState({ modules: parsed.modules || {}, quizzes: parsed.quizzes || {} });
        }
      }
    } catch (e) {
      console.warn("Failed to load academy progress from localStorage:", e);
    }
  };

  const loadProgressFromDb = async (uid: string) => {
    try {
      // Load module progress
      const { data: moduleData, error: moduleError } = await supabase
        .from("academy_progress")
        .select("*")
        .eq("user_id", uid);

      if (moduleError) throw moduleError;

      // Load quiz progress
      const { data: quizData, error: quizError } = await supabase
        .from("academy_quizzes")
        .select("*")
        .eq("user_id", uid);

      if (quizError) throw quizError;

      const modules: Record<string, ModuleProgress> = {};
      moduleData?.forEach((item) => {
        modules[item.module_id] = {
          moduleId: item.module_id,
          completed: item.completed,
          completedAt: item.completed_at || undefined,
        };
      });

      const quizzes: Record<number, QuizProgress> = {};
      quizData?.forEach((item) => {
        quizzes[item.level] = {
          level: item.level,
          passed: item.passed,
          score: Number(item.score),
          completedAt: item.completed_at,
        };
      });

      setState({ modules, quizzes });
    } catch (error) {
      console.error("Error loading progress from database:", error);
      loadFromLocalStorage();
    }
  };

  const markCompleted = useCallback(async (moduleId: string) => {
    const completedAt = new Date().toISOString();
    
    setState((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [moduleId]: {
          moduleId,
          completed: true,
          completedAt,
        },
      },
    }));

    if (userId) {
      try {
        const { error } = await supabase
          .from("academy_progress")
          .upsert({
            user_id: userId,
            module_id: moduleId,
            completed: true,
            completed_at: completedAt,
          }, { onConflict: "user_id,module_id" });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving module progress:", error);
        toast({
          title: "Sync Error",
          description: "Progress saved locally but failed to sync to cloud.",
          variant: "destructive",
        });
      }
    } else {
      // Save to localStorage for non-authenticated users
      const stored = localStorage.getItem("pulse-academy-progress");
      const current = stored ? JSON.parse(stored) : { modules: {}, quizzes: {} };
      current.modules[moduleId] = { moduleId, completed: true, completedAt };
      localStorage.setItem("pulse-academy-progress", JSON.stringify(current));
    }
  }, [userId, toast]);

  const markQuizCompleted = useCallback(async (level: number, passed: boolean, score: number) => {
    const completedAt = new Date().toISOString();
    
    setState((prev) => ({
      ...prev,
      quizzes: {
        ...prev.quizzes,
        [level]: {
          level,
          passed,
          score,
          completedAt,
        },
      },
    }));

    if (userId) {
      try {
        const { error } = await supabase
          .from("academy_quizzes")
          .upsert({
            user_id: userId,
            level,
            passed,
            score,
            completed_at: completedAt,
          }, { onConflict: "user_id,level" });

        if (error) throw error;
      } catch (error) {
        console.error("Error saving quiz progress:", error);
        toast({
          title: "Sync Error",
          description: "Quiz result saved locally but failed to sync to cloud.",
          variant: "destructive",
        });
      }
    } else {
      const stored = localStorage.getItem("pulse-academy-progress");
      const current = stored ? JSON.parse(stored) : { modules: {}, quizzes: {} };
      current.quizzes[level] = { level, passed, score, completedAt };
      localStorage.setItem("pulse-academy-progress", JSON.stringify(current));
    }
  }, [userId, toast]);

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
      return state.quizzes[level - 1]?.passed ?? false;
    },
    [state.quizzes]
  );

  const getUnlockedLevelsCount = useCallback(() => {
    let count = 1;
    for (let i = 1; i <= 4; i++) {
      if (state.quizzes[i]?.passed) count++;
    }
    return Math.min(count, 4);
  }, [state.quizzes]);

  const resetProgress = useCallback(async () => {
    setState({ modules: {}, quizzes: {} });
    localStorage.removeItem("pulse-academy-progress");

    if (userId) {
      try {
        await supabase.from("academy_progress").delete().eq("user_id", userId);
        await supabase.from("academy_quizzes").delete().eq("user_id", userId);
      } catch (error) {
        console.error("Error resetting progress in database:", error);
      }
    }
  }, [userId]);

  return {
    progress: state.modules,
    quizzes: state.quizzes,
    isLoading,
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
