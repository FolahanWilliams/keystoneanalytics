import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Activity, ArrowLeft, BookOpen, Trophy, Medal } from "lucide-react";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { LearningPathLevel } from "@/components/academy/LearningPathLevel";
import { ModuleCard } from "@/components/academy/ModuleCard";
import { ModuleDetailSheet } from "@/components/academy/ModuleDetailSheet";
import { PulseTutorChat } from "@/components/academy/PulseTutorChat";
import { LevelQuiz } from "@/components/academy/LevelQuiz";
import { AchievementBadges, type AchievementStats } from "@/components/academy/AchievementBadges";
import { LEVELS, ALL_MODULES, TOTAL_MODULES } from "@/data/academy/levels";

export default function Academy() {
  const {
    isCompleted,
    markCompleted,
    getCompletedCount,
    isQuizPassed,
    markQuizCompleted,
    isLevelUnlocked,
    getPassedQuizzesCount,
    getPerfectQuizzesCount,
    getUnlockedLevelsCount,
  } = useAcademyProgress();
  
  const [selectedModule, setSelectedModule] = useState<(typeof ALL_MODULES)[0] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quizLevel, setQuizLevel] = useState<number | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);

  const completedCount = getCompletedCount();
  const overallProgress = (completedCount / TOTAL_MODULES) * 100;

  const achievementStats: AchievementStats = useMemo(
    () => ({
      completedModules: completedCount,
      completedQuizzes: getPassedQuizzesCount(),
      perfectQuizzes: getPerfectQuizzesCount(),
      totalModules: TOTAL_MODULES,
      levelsUnlocked: getUnlockedLevelsCount(),
    }),
    [completedCount, getPassedQuizzesCount, getPerfectQuizzesCount, getUnlockedLevelsCount]
  );

  const openModule = (mod: (typeof ALL_MODULES)[0]) => {
    if (!isLevelUnlocked(mod.levelNum)) return;
    setSelectedModule(mod);
    setSheetOpen(true);
  };

  const handleMarkComplete = () => {
    if (selectedModule) {
      markCompleted(selectedModule.id);
    }
  };

  const handleQuizComplete = (passed: boolean, score: number) => {
    if (quizLevel !== null) {
      markQuizCompleted(quizLevel, passed, score);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute inset-0 hero-gradient" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Activity className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">Pulse Terminal</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowAchievements(true)}
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            Achievements
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Terminal
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative z-10 text-center px-6 py-12 lg:py-16">
        <Badge variant="outline" className="mb-4">
          <BookOpen className="w-3 h-3 mr-1" />
          Educational Hub
        </Badge>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          The <span className="gradient-text">Pulse Academy</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Think Like an Analyst, Not a Gambler. Master the mechanics of value through structured,
          evidence-based learning.
        </p>

        {/* Overall Progress */}
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your Progress</span>
            <span className="font-mono text-primary">
              {completedCount}/{TOTAL_MODULES} modules
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <Medal className="w-4 h-4 text-emerald-500" />
            <span className="text-muted-foreground">
              {getPassedQuizzesCount()}/4 Quizzes Passed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-muted-foreground">
              {achievementStats.completedModules >= 1 ? "1+" : "0"} Achievements
            </span>
          </div>
        </div>
      </header>

      {/* Learning Levels */}
      <main className="relative z-10 px-6 pb-24 lg:px-12 max-w-6xl mx-auto space-y-16">
        {LEVELS.map((level) => {
          const levelCompletedCount = level.modules.filter((m) => isCompleted(m.id)).length;
          const locked = !isLevelUnlocked(level.level);
          const quizPassed = isQuizPassed(level.level);

          return (
            <LearningPathLevel
              key={level.level}
              level={level.level}
              title={level.title}
              subtitle={level.subtitle}
              isActive={!locked && levelCompletedCount > 0}
              isLocked={locked}
              isQuizPassed={quizPassed}
              completedCount={levelCompletedCount}
              totalCount={level.modules.length}
              onTakeQuiz={() => setQuizLevel(level.level)}
            >
              {level.modules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  id={mod.id}
                  title={mod.title}
                  description={mod.description}
                  duration={mod.duration}
                  icon={mod.icon}
                  isCompleted={isCompleted(mod.id)}
                  onClick={() => openModule({ ...mod, levelNum: level.level })}
                />
              ))}
            </LearningPathLevel>
          );
        })}
      </main>

      {/* Module Detail Sheet */}
      <ModuleDetailSheet
        module={selectedModule}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        isCompleted={selectedModule ? isCompleted(selectedModule.id) : false}
        onMarkComplete={handleMarkComplete}
      />

      {/* Quiz Dialog */}
      <Dialog open={quizLevel !== null} onOpenChange={(open) => !open && setQuizLevel(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Level {quizLevel} Quiz
            </DialogTitle>
          </DialogHeader>
          {quizLevel !== null && (
            <LevelQuiz
              level={quizLevel}
              onComplete={handleQuizComplete}
              onClose={() => setQuizLevel(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Achievements Dialog */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Your Achievements
            </DialogTitle>
          </DialogHeader>
          <AchievementBadges stats={achievementStats} showAll />
        </DialogContent>
      </Dialog>

      {/* Floating AI Tutor */}
      <PulseTutorChat />
    </div>
  );
}
