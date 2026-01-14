import { useState } from "react";
import { HelpCircle, Loader2, BookOpen, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { QUICK_EXPLANATIONS, useEducation, EducationContext, SkillLevel } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface EducationTooltipProps {
  topic: string;
  context?: EducationContext;
  children?: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function EducationTooltip({
  topic,
  context,
  children,
  className,
  showIcon = true,
  side = "top",
}: EducationTooltipProps) {
  const quickExplanation = QUICK_EXPLANATIONS[topic];

  if (!quickExplanation) {
    return <>{children}</>;
  }

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span className={cn("inline-flex items-center gap-1 cursor-help", className)}>
          {children}
          {showIcon && (
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-primary transition-colors" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        <p className="font-semibold text-sm mb-1">{quickExplanation.title}</p>
        <p className="text-xs text-muted-foreground">{quickExplanation.brief}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface EducationPopoverProps {
  topic: string;
  context?: EducationContext;
  level?: SkillLevel;
  children?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
}

export function EducationPopover({
  topic,
  context,
  level = "beginner",
  children,
  className,
  triggerClassName,
}: EducationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fullContent, setFullContent] = useState<string | null>(null);
  const { fetchExplanation, isLoading } = useEducation();
  const quickExplanation = QUICK_EXPLANATIONS[topic];

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !fullContent) {
      const result = await fetchExplanation(topic, context, level);
      if (result) {
        setFullContent(result.content);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
            triggerClassName
          )}
        >
          {children || (
            <>
              <BookOpen className="w-4 h-4" />
              <span>Learn more</span>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-96 max-h-[400px] overflow-y-auto", className)}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">{quickExplanation?.title || topic}</h4>
              {context?.symbol && (
                <p className="text-xs text-muted-foreground">
                  Context: {context.symbol}
                </p>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : fullContent ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                  h2: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-2">{children}</h4>,
                  h3: ({ children }) => <h5 className="text-sm font-medium mt-2 mb-1">{children}</h5>,
                  p: ({ children }) => <p className="text-sm text-muted-foreground mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="text-sm space-y-1 mb-2 list-disc pl-4">{children}</ul>,
                  ol: ({ children }) => <ol className="text-sm space-y-1 mb-2 list-decimal pl-4">{children}</ol>,
                  li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                  strong: ({ children }) => <strong className="text-foreground font-medium">{children}</strong>,
                  em: ({ children }) => <em className="text-primary">{children}</em>,
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                  ),
                }}
              >
                {fullContent}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {quickExplanation?.brief || "Loading explanation..."}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
