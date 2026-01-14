import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Clock, BookOpen } from "lucide-react";
import { InteractiveRSILab } from "./InteractiveRSILab";
import { Link } from "react-router-dom";

interface ModuleContent {
  id: string;
  title: string;
  description: string;
  duration: string;
  content: string[];
  hasLab?: boolean;
  labType?: "rsi" | "dcf" | "macd";
}

interface ModuleDetailSheetProps {
  module: ModuleContent | null;
  isOpen: boolean;
  onClose: () => void;
  isCompleted: boolean;
  onMarkComplete: () => void;
}

export function ModuleDetailSheet({
  module,
  isOpen,
  onClose,
  isCompleted,
  onMarkComplete,
}: ModuleDetailSheetProps) {
  if (!module) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center gap-2">
            {isCompleted && (
              <Badge className="bg-emerald-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Mastered
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {module.duration}
            </Badge>
          </div>
          <SheetTitle className="text-2xl">{module.title}</SheetTitle>
          <SheetDescription>{module.description}</SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="space-y-6">
          {module.content.map((paragraph, i) => (
            <p key={i} className="text-muted-foreground leading-relaxed">
              {paragraph}
            </p>
          ))}

          {/* Interactive Lab */}
          {module.hasLab && module.labType === "rsi" && (
            <div className="my-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  Interactive Lab
                </span>
              </div>
              <InteractiveRSILab />
            </div>
          )}

          {/* Mark Complete & CTA */}
          <div className="pt-6 border-t border-border space-y-4">
            {!isCompleted && (
              <Button onClick={onMarkComplete} className="w-full gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mark as Completed
              </Button>
            )}

            <Link to="/dashboard/analysis" className="block">
              <Button
                variant="outline"
                className="w-full gap-2 hover:border-primary hover:text-primary"
              >
                Now, apply this logic in the Terminal
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
