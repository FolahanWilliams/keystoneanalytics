import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LearningPathLevelProps {
  level: number;
  title: string;
  subtitle: string;
  isActive?: boolean;
  isLocked?: boolean;
  isQuizPassed?: boolean;
  completedCount: number;
  totalCount: number;
  onTakeQuiz?: () => void;
  children: React.ReactNode;
}

export function LearningPathLevel({
  level,
  title,
  subtitle,
  isActive,
  isLocked,
  isQuizPassed,
  completedCount,
  totalCount,
  onTakeQuiz,
  children,
}: LearningPathLevelProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allModulesComplete = completedCount === totalCount;

  return (
    <div className={cn("relative", isLocked && "opacity-60")}>
      {/* Timeline connector */}
      <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent" />

      {/* Level Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Level Number */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2 transition-all",
            isLocked
              ? "bg-muted border-border text-muted-foreground"
              : isQuizPassed
              ? "bg-emerald-500 border-emerald-500 text-white"
              : progressPercent === 100
              ? "bg-primary border-primary text-primary-foreground"
              : isActive
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-secondary border-border text-muted-foreground"
          )}
        >
          {isLocked ? <Lock className="w-5 h-5" /> : isQuizPassed ? <CheckCircle2 className="w-5 h-5" /> : level}
        </div>

        {/* Title & Progress */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{title}</h3>
            {isLocked && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                Pass Level {level - 1} Quiz to Unlock
              </span>
            )}
            {isQuizPassed && (
              <span className="text-xs bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded">
                Completed
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {completedCount}/{totalCount}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>

          {/* Progress Bar */}
          <div className="mt-2 h-1 w-48 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                isQuizPassed ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quiz Button */}
        {!isLocked && allModulesComplete && !isQuizPassed && onTakeQuiz && (
          <Button onClick={onTakeQuiz} className="gap-2" variant="default">
            <ClipboardList className="w-4 h-4" />
            Take Quiz
          </Button>
        )}
        {isQuizPassed && (
          <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Quiz Passed
          </span>
        )}
      </div>

      {/* Module Cards */}
      <div className={cn("ml-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3", isLocked && "pointer-events-none")}>
        {children}
      </div>
    </div>
  );
}
