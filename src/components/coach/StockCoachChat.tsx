import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, TrendingUp, Brain, Target, AlertTriangle, Loader2, X, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStockCoach, Message } from "@/hooks/useStockCoach";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface StockCoachChatProps {
  initialSymbol?: string;
  onSymbolMentioned?: (symbol: string) => void;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "Analyze AAPL's current trend and key levels", symbol: "AAPL" },
  { icon: Brain, text: "Is TSLA overbought or oversold right now?", symbol: "TSLA" },
  { icon: Target, text: "Where should I set my stop-loss for NVDA?", symbol: "NVDA" },
  { icon: AlertTriangle, text: "What are the risks of buying MSFT at current price?", symbol: "MSFT" },
];

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary/50 border border-border/50 rounded-bl-md"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                h1: ({ children }) => <h1 className="text-lg font-bold mt-4 mb-2 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-2 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 text-foreground">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content || "Thinking..."}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-primary/70 animate-pulse ml-0.5" />
            )}
          </div>
        )}
        <p className="text-[10px] mt-1.5 opacity-50">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
};

export function StockCoachChat({ initialSymbol, onSymbolMentioned }: StockCoachChatProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    activeSymbols,
    sendMessage, 
    clearMessages,
    cancelRequest,
  } = useStockCoach({
    onError: (error) => toast.error(error),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send initial symbol prompt if provided
  useEffect(() => {
    if (initialSymbol && messages.length === 0) {
      sendMessage(`Analyze ${initialSymbol} stock - give me a complete breakdown of the current price action, key technical indicators, support/resistance levels, and your overall assessment.`, [initialSymbol]);
    }
  }, [initialSymbol]);

  // Extract stock symbols from user message
  const extractSymbols = (message: string): string[] => {
    const symbolPattern = /\b([A-Z]{1,5})\b/g;
    const matches = message.match(symbolPattern) || [];
    const commonWords = new Set(['I', 'A', 'THE', 'AND', 'OR', 'FOR', 'TO', 'IN', 'IS', 'IT', 'BE', 'AS', 'AT', 'SO', 'WE', 'HE', 'BY', 'ON', 'DO', 'IF', 'ME', 'MY', 'UP', 'AN', 'GO', 'NO', 'US', 'AM', 'OF', 'AI', 'RSI', 'EMA', 'SMA', 'ATR', 'MACD', 'PE', 'EPS', 'CEO', 'CFO', 'IPO', 'ETF', 'GDP', 'CPI', 'FED', 'SEC', 'NYSE', 'DOW', 'USD', 'EUR', 'GBP', 'BUY', 'SELL', 'HOLD', 'STOP', 'LOSS', 'WHAT', 'WHEN', 'WHERE', 'WHY', 'HOW', 'CAN', 'ARE', 'WAS', 'HAS', 'HAD', 'WILL', 'THIS', 'THAT', 'ABOUT', 'YOUR', 'GIVE', 'NOW', 'SET']);
    return matches.filter(s => s.length >= 2 && !commonWords.has(s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Extract symbols from the input and update the side panel
    const detectedSymbols = extractSymbols(input);
    if (detectedSymbols.length > 0) {
      onSymbolMentioned?.(detectedSymbols[0]);
      sendMessage(input, detectedSymbols);
    } else {
      sendMessage(input);
    }
    
    setInput("");
    
    // Reset textarea height
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

  const handleSuggestedPrompt = (prompt: string, symbol: string) => {
    sendMessage(prompt, [symbol]);
    onSymbolMentioned?.(symbol);
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">AI Stock Coach</h2>
            <p className="text-xs text-muted-foreground">Real-time analysis & trading guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSymbols.length > 0 && (
            <div className="flex gap-1">
              {activeSymbols.slice(0, 3).map(symbol => (
                <Badge key={symbol} variant="secondary" className="text-xs font-mono">
                  {symbol}
                </Badge>
              ))}
              {activeSymbols.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{activeSymbols.length - 3}
                </Badge>
              )}
            </div>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your Personal Trading Coach</h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              I analyze real market data to help you make informed decisions. Ask me about any stock, 
              and I'll provide technical analysis, risk assessment, and actionable insights.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestedPrompt(prompt.text, prompt.symbol)}
                  className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/50 transition-colors text-left group"
                >
                  <prompt.icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {prompt.text}
                  </span>
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
      <div className="p-4 border-t border-border/50 bg-background/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any stock... (e.g., 'Analyze AAPL' or 'Should I buy TSLA?')"
              className="min-h-[44px] max-h-[120px] resize-none pr-10 bg-secondary/30 border-border/50 focus:border-primary/50"
              disabled={isLoading}
            />
            {input && !isLoading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setInput("")}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={cancelRequest}
              className="h-11 w-11"
            >
              <StopCircle className="w-5 h-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-11 w-11 bg-primary hover:bg-primary/90"
            >
              <Send className="w-5 h-5" />
            </Button>
          )}
        </form>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          ⚠️ Educational guidance only. Not financial advice. Always do your own research.
        </p>
      </div>
    </div>
  );
}
