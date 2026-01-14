import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, ChevronRight } from "lucide-react";

interface ModuleCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  isCompleted: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}

export function ModuleCard({
  id,
  title,
  description,
  duration,
  isCompleted,
  icon,
  onClick,
}: ModuleCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full text-left p-5 rounded-xl border transition-all duration-300",
        "bg-card/60 hover:bg-card/90 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
        isCompleted ? "border-emerald-500/50" : "border-border/50"
      )}
    >
      {/* Mastered Badge */}
      {isCompleted && (
        <Badge className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 shadow-lg">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Mastered
        </Badge>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
            isCompleted
              ? "bg-emerald-500/20 text-emerald-500"
              : "bg-primary/10 text-primary group-hover:bg-primary/20"
          )}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
      </div>
    </button>
  );
}
