import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Trophy,
  Star,
  Flame,
  BookOpen,
  Target,
  Brain,
  Zap,
  Award,
  Crown,
  Rocket,
} from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  condition: (stats: AchievementStats) => boolean;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

export interface AchievementStats {
  completedModules: number;
  completedQuizzes: number;
  perfectQuizzes: number;
  totalModules: number;
  levelsUnlocked: number;
}

const TIER_STYLES = {
  bronze: "bg-amber-700/20 text-amber-600 border-amber-600/30",
  silver: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  gold: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  platinum: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-lesson",
    name: "First Steps",
    description: "Complete your first module",
    icon: <BookOpen className="w-5 h-5" />,
    condition: (stats) => stats.completedModules >= 1,
    tier: "bronze",
  },
  {
    id: "foundation-complete",
    name: "Foundation Built",
    description: "Complete all Level 1 modules",
    icon: <Target className="w-5 h-5" />,
    condition: (stats) => stats.completedQuizzes >= 1,
    tier: "bronze",
  },
  {
    id: "quiz-master",
    name: "Quiz Taker",
    description: "Pass your first level quiz",
    icon: <Star className="w-5 h-5" />,
    condition: (stats) => stats.completedQuizzes >= 1,
    tier: "bronze",
  },
  {
    id: "halfway",
    name: "Halfway There",
    description: "Complete 50% of all modules",
    icon: <Flame className="w-5 h-5" />,
    condition: (stats) => stats.completedModules >= Math.floor(stats.totalModules / 2),
    tier: "silver",
  },
  {
    id: "technical-analyst",
    name: "Technical Analyst",
    description: "Unlock Level 3",
    icon: <Zap className="w-5 h-5" />,
    condition: (stats) => stats.levelsUnlocked >= 3,
    tier: "silver",
  },
  {
    id: "perfect-quiz",
    name: "Perfect Score",
    description: "Get 100% on any quiz",
    icon: <Trophy className="w-5 h-5" />,
    condition: (stats) => stats.perfectQuizzes >= 1,
    tier: "gold",
  },
  {
    id: "behavioral-master",
    name: "Mind Over Market",
    description: "Unlock all 4 levels",
    icon: <Brain className="w-5 h-5" />,
    condition: (stats) => stats.levelsUnlocked >= 4,
    tier: "gold",
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Complete all modules",
    icon: <Award className="w-5 h-5" />,
    condition: (stats) => stats.completedModules >= stats.totalModules,
    tier: "gold",
  },
  {
    id: "all-perfect",
    name: "Flawless",
    description: "Get 100% on all quizzes",
    icon: <Crown className="w-5 h-5" />,
    condition: (stats) => stats.perfectQuizzes >= 4,
    tier: "platinum",
  },
  {
    id: "academy-graduate",
    name: "Academy Graduate",
    description: "Complete all modules and quizzes",
    icon: <Rocket className="w-5 h-5" />,
    condition: (stats) =>
      stats.completedModules >= stats.totalModules && stats.completedQuizzes >= 4,
    tier: "platinum",
  },
];

interface AchievementBadgesProps {
  stats: AchievementStats;
  showAll?: boolean;
}

export function AchievementBadges({ stats, showAll = false }: AchievementBadgesProps) {
  const earnedAchievements = ACHIEVEMENTS.filter((a) => a.condition(stats));
  const displayAchievements = showAll ? ACHIEVEMENTS : earnedAchievements;

  if (displayAchievements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Complete modules and quizzes to earn achievements!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {displayAchievements.map((achievement) => {
        const isEarned = achievement.condition(stats);
        return (
          <div
            key={achievement.id}
            className={cn(
              "relative flex flex-col items-center p-3 rounded-lg border transition-all",
              isEarned ? TIER_STYLES[achievement.tier] : "bg-muted/30 border-border/30 opacity-40"
            )}
            title={achievement.description}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                isEarned ? "bg-background/50" : "bg-muted/50"
              )}
            >
              {achievement.icon}
            </div>
            <span className="text-xs font-medium text-center line-clamp-2">
              {achievement.name}
            </span>
            {isEarned && (
              <Badge className="absolute -top-1 -right-1 text-[8px] px-1 py-0 bg-emerald-500 text-white">
                ✓
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
