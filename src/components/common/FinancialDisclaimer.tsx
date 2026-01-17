import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancialDisclaimerProps {
  variant?: "compact" | "full";
  className?: string;
}

export function FinancialDisclaimer({ variant = "compact", className }: FinancialDisclaimerProps) {
  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20",
        className
      )}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
          <strong>Not financial advice.</strong> For educational purposes only. 
          Past performance doesn't guarantee future results. Trade responsibly.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-lg bg-amber-500/10 border border-amber-500/20",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          Important Disclaimer
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        The information provided by Pulse Terminal is for informational and educational purposes only. 
        It does not constitute investment advice, financial advice, or trading advice. 
        Any "verdicts," "signals," or AI-generated insights are algorithmic outputs and should not 
        be interpreted as professional recommendations. Past performance is not indicative of future results. 
        Trading involves substantial risk of loss. Always consult a licensed financial advisor 
        before making investment decisions.
      </p>
    </div>
  );
}
