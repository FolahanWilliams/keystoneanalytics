import { memo } from "react";
import { 
  TrendingUp, 
  Minus, 
  GitBranch, 
  Type, 
  Trash2,
  MousePointer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DrawingType } from "@/types/market";

export type DrawingMode = DrawingType | "select" | null;

interface DrawingToolbarProps {
  activeMode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onClearAll: () => void;
  drawingCount: number;
  disabled?: boolean;
}

const tools = [
  { id: "select" as const, icon: MousePointer, label: "Select / Move", shortcut: "V" },
  { id: "trendline" as const, icon: TrendingUp, label: "Trend Line", shortcut: "T" },
  { id: "horizontal" as const, icon: Minus, label: "Horizontal Line", shortcut: "H" },
  { id: "fibonacci" as const, icon: GitBranch, label: "Fibonacci Retracement", shortcut: "F" },
  { id: "annotation" as const, icon: Type, label: "Text Annotation", shortcut: "A" },
];

function DrawingToolbarComponent({
  activeMode,
  onModeChange,
  onClearAll,
  drawingCount,
  disabled = false,
}: DrawingToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 p-1 bg-accent/40 rounded-lg">
      {tools.map((tool) => (
        <Tooltip key={tool.id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={disabled}
              className={cn(
                "h-7 w-7 rounded-md",
                activeMode === tool.id && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              onClick={() => onModeChange(activeMode === tool.id ? null : tool.id)}
            >
              <tool.icon className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <div className="flex items-center gap-2">
              <span>{tool.label}</span>
              <kbd className="px-1 py-0.5 text-[10px] bg-muted rounded">{tool.shortcut}</kbd>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}

      {drawingCount > 0 && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-7 w-7 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onClearAll}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Clear All ({drawingCount})
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
}

export const DrawingToolbar = memo(DrawingToolbarComponent);
