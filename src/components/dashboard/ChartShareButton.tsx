import { useState, useRef, useCallback } from "react";
import { Share2, Download, Copy, Check, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

interface ChartShareButtonProps {
  chartRef: React.RefObject<HTMLDivElement>;
  symbol: string;
  price: number;
  changePercent: number;
}

export function ChartShareButton({ chartRef, symbol, price, changePercent }: ChartShareButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { canUseFeature, tier } = useSubscription();

  const canShare = canUseFeature("chartSharing");

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!chartRef.current) return null;

    try {
      // Dynamic import html2canvas only when needed
      const html2canvas = (await import("html2canvas")).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#0a0a0f",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      // Add watermark
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Add gradient overlay at bottom
        const gradient = ctx.createLinearGradient(0, canvas.height - 60, 0, canvas.height);
        gradient.addColorStop(0, "rgba(10, 10, 15, 0)");
        gradient.addColorStop(1, "rgba(10, 10, 15, 0.9)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

        // Add watermark text
        ctx.font = "bold 20px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
        ctx.textAlign = "left";
        ctx.fillText("📈 Keystone Analytics", 20, canvas.height - 20);

        // Add timestamp
        ctx.font = "14px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.textAlign = "right";
        ctx.fillText(new Date().toLocaleString(), canvas.width - 20, canvas.height - 20);

        // Add symbol info
        ctx.font = "bold 16px JetBrains Mono, monospace";
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.textAlign = "right";
        const priceText = `${symbol} $${price.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`;
        ctx.fillText(priceText, canvas.width - 20, canvas.height - 40);
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });
    } catch (error) {
      console.error("Failed to generate image:", error);
      return null;
    }
  }, [chartRef, symbol, price, changePercent]);

  const handleDownload = async () => {
    if (!canShare) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Pro to share charts.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${symbol}-chart-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Chart Downloaded",
          description: "Your chart has been saved as an image.",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canShare) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Pro to share charts.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        
        toast({
          title: "Copied to Clipboard",
          description: "Chart image copied. Paste it anywhere!",
        });
      }
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Please try downloading instead.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!canShare) {
      toast({
        title: "Premium Feature",
        description: "Upgrade to Pro to share charts.",
        variant: "destructive",
      });
      return;
    }

    if (!navigator.share) {
      handleDownload();
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (blob) {
        const file = new File([blob], `${symbol}-chart.png`, { type: "image/png" });
        await navigator.share({
          title: `${symbol} Chart - Keystone Analytics`,
          text: `Check out ${symbol} at $${price.toFixed(2)} (${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%)`,
          files: [file],
        });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            !canShare && "opacity-60"
          )}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : !canShare ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleShare} disabled={!canShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share Chart
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyToClipboard} disabled={!canShare}>
          {copied ? (
            <Check className="w-4 h-4 mr-2 text-gain" />
          ) : (
            <Copy className="w-4 h-4 mr-2" />
          )}
          Copy to Clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownload} disabled={!canShare}>
          <Download className="w-4 h-4 mr-2" />
          Download PNG
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
