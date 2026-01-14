import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useStockCoach, Message } from "@/hooks/useStockCoach";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface StockChatWidgetProps {
  symbol: string;
  price?: number;
  changePercent?: number;
}

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full mb-2", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[90%] rounded-lg px-3 py-2",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-secondary/50 border border-border/50 rounded-bl-sm"
        )}
      >
        {isUser ? (
          <p className="text-xs whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-1.5 last:mb-0 text-xs leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-xs font-bold mt-1.5 mb-1 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xs font-bold mt-1 mb-0.5 text-foreground">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-1.5 text-xs">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-1.5 text-xs">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground text-xs">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1 py-0.5 rounded text-[10px] font-mono text-primary">
                    {children}
                  </code>
                ),
              }}
            >
              {message.content || "Thinking..."}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-primary/70 animate-pulse ml-0.5" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export function StockChatWidget({ symbol, price, changePercent }: StockChatWidgetProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages,
  } = useStockCoach({
    onError: (error) => toast.error(error),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Add context about the current symbol to the message
    const contextMessage = `[Analyzing ${symbol}${price ? ` at $${price.toFixed(2)}` : ''}${changePercent ? ` (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)` : ''}] ${input}`;
    sendMessage(contextMessage, [symbol]);
    setInput("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const quickPrompts = [
    "Quick analysis",
    "Key levels",
    "Entry points",
    "Risk assessment",
  ];

  return (
    <div className={cn(
      "glass-panel rounded-xl overflow-hidden flex flex-col transition-all duration-300",
      isExpanded ? "h-[500px]" : "h-[280px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Coach</h3>
            <p className="text-[10px] text-muted-foreground">Ask about {symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6"
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-4">
            <p className="text-xs text-muted-foreground mb-3">
              Ask anything about {symbol}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    sendMessage(`${prompt} for ${symbol}`, [symbol]);
                  }}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-2 border-t border-border/50 bg-background/50">
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${symbol}...`}
            className="min-h-[32px] max-h-[60px] resize-none text-xs py-1.5 px-2.5 bg-secondary/30 border-border/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
