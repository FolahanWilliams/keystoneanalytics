import { cn } from "@/lib/utils";

interface LearningPathLevelProps {
  level: number;
  title: string;
  subtitle: string;
  isActive?: boolean;
  completedCount: number;
  totalCount: number;
  children: React.ReactNode;
}

export function LearningPathLevel({
  level,
  title,
  subtitle,
  isActive,
  completedCount,
  totalCount,
  children,
}: LearningPathLevelProps) {
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-primary/50 to-transparent" />

      {/* Level Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Level Number */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2 transition-all",
            progressPercent === 100
              ? "bg-emerald-500 border-emerald-500 text-white"
              : isActive
              ? "bg-primary border-primary text-primary-foreground"
              : "bg-secondary border-border text-muted-foreground"
          )}
        >
          {level}
        </div>

        {/* Title & Progress */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{title}</h3>
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
                progressPercent === 100 ? "bg-emerald-500" : "bg-primary"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="ml-16 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
