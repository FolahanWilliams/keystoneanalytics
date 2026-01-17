import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Sparkles, TrendingUp, Brain, Target, AlertTriangle, X, StopCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useStockCoach, Message } from "@/hooks/useStockCoach";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

interface StockCoachChatProps {
  initialSymbol?: string;
  onSymbolMentioned?: (symbol: string) => void;
}

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, text: "Analyze AAPL's current trend", symbol: "AAPL" },
  { icon: Brain, text: "Is TSLA overbought right now?", symbol: "TSLA" },
  { icon: Target, text: "Set stop-loss levels for NVDA", symbol: "NVDA" },
  { icon: AlertTriangle, text: "Risks of buying MSFT now?", symbol: "MSFT" },
];

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex w-full mb-3", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-lg"
            : "bg-accent/50 border border-border/50 rounded-bl-lg"
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed text-foreground">{children}</p>,
                h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold mt-2.5 mb-1 text-foreground">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-foreground">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 mb-2 text-sm">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 mb-2 text-sm">{children}</ol>,
                li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-primary">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2 text-sm">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {message.content || "Thinking..."}
            </ReactMarkdown>
            {message.isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}
        <p className="text-[9px] mt-1.5 opacity-40 tabular-nums">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (initialSymbol && messages.length === 0) {
      sendMessage(`Analyze ${initialSymbol} - give me a complete breakdown of current price action, key indicators, and your assessment.`, [initialSymbol]);
    }
  }, [initialSymbol]);

  const extractSymbols = (message: string): string[] => {
    const symbolPattern = /\$?\b([A-Z]{1,5})\b/gi;
    const matches = Array.from(message.matchAll(symbolPattern)).map(m => (m[1] || "").toUpperCase());
    const commonWords = new Set(['I','A','THE','AND','OR','FOR','TO','IN','IS','IT','BE','AS','AT','SO','WE','HE','BY','ON','DO','IF','ME','MY','UP','AN','GO','NO','US','AM','OF','AI','RSI','EMA','SMA','ATR','MACD','PE','EPS','CEO','CFO','IPO','ETF','GDP','CPI','FED','SEC','NYSE','DOW','USD','EUR','GBP','BUY','SELL','HOLD','STOP','LOSS','WHAT','WHEN','WHERE','WHY','HOW','CAN','ARE','WAS','HAS','HAD','WILL','THIS','THAT','ABOUT','YOUR','GIVE','NOW','SET']);
    return matches.filter(s => s.length >= 2 && s.length <= 5).filter(s => !commonWords.has(s));
  };

  const resolveCompanyMention = (message: string): string | null => {
    const m = message.toLowerCase();
    const map: Array<[RegExp, string]> = [[/\bapple\b/, "AAPL"],[/\bmicrosoft\b/, "MSFT"],[/\bgoogle\b|\balphabet\b/, "GOOGL"],[/\bnvidia\b/, "NVDA"],[/\btesla\b/, "TSLA"],[/\bamazon\b/, "AMZN"],[/\bmeta\b|\bfacebook\b/, "META"]];
    for (const [re, sym] of map) { if (re.test(m)) return sym; }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const detectedSymbols = extractSymbols(input);
    const resolved = detectedSymbols[0] || resolveCompanyMention(input) || undefined;
    if (resolved) onSymbolMentioned?.(resolved);
    const symbolsForCoach = detectedSymbols.length > 0 ? detectedSymbols : (resolved ? [resolved] : undefined);
    sendMessage(input, symbolsForCoach);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleSuggestedPrompt = (prompt: string, symbol: string) => {
    sendMessage(prompt, [symbol]);
    onSymbolMentioned?.(symbol);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
  };

  return (
    <div className="flex flex-col h-full bento-module overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">AI Coach</h2>
            <p className="text-[10px] text-muted-foreground">Real-time guidance</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {activeSymbols.length > 0 && (
            <div className="flex gap-1">
              {activeSymbols.slice(0, 2).map(symbol => (
                <span key={symbol} className="px-1.5 py-0.5 text-[10px] font-mono bg-accent rounded-md text-muted-foreground">
                  {symbol}
                </span>
              ))}
            </div>
          )}
          {messages.length > 0 && (
            <button onClick={clearMessages} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-sm font-semibold mb-1">Your Trading Coach</h3>
            <p className="text-xs text-muted-foreground max-w-[280px] mb-5">
              Get real-time analysis and insights for any stock.
            </p>
            
            <div className="grid grid-cols-1 gap-1.5 w-full max-w-xs">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => handleSuggestedPrompt(prompt.text, prompt.symbol)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-accent/30 hover:bg-accent/50 border border-border/50 transition-all text-left group"
                >
                  <prompt.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">
                    {prompt.text}
                  </span>
                </motion.button>
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
      <div className="p-3 border-t border-border/50 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any stock..."
              className="min-h-[40px] max-h-[100px] resize-none pr-8 bg-accent/30 border-border/50 focus:border-primary/50 text-sm rounded-xl"
              disabled={isLoading}
            />
            {input && !isLoading && (
              <button type="button" onClick={() => setInput("")} className="absolute right-2 top-2 p-1 hover:bg-muted rounded-lg transition-colors">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {isLoading ? (
            <Button type="button" variant="destructive" size="icon" onClick={cancelRequest} className="h-10 w-10 rounded-xl shrink-0">
              <StopCircle className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim()} className="h-10 w-10 bg-primary hover:bg-primary/90 rounded-xl shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          )}
        </form>
        <p className="text-[9px] text-muted-foreground text-center mt-2">
          ⚠️ Educational only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
