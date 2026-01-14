import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  GraduationCap,
  Sparkles,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_ASKS = [
  "Explain RSI like I'm 5",
  "How do I spot a Value Trap?",
  "What is a DCF model?",
  "What's the difference between EMA and SMA?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pulse-tutor`;

export function PulseTutorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = useCallback(
    async (userMessage: string) => {
      const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
      setMessages(newMessages);
      setIsLoading(true);
      setInput("");

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: newMessages }),
        });

        if (resp.status === 429) {
          toast.error("Rate limit exceeded. Please wait a moment and try again.");
          setIsLoading(false);
          return;
        }

        if (resp.status === 402) {
          toast.error("AI credits exhausted. Please add funds to continue.");
          setIsLoading(false);
          return;
        }

        if (!resp.ok || !resp.body) {
          toast.error("Failed to connect to Pulse Tutor.");
          setIsLoading(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantContent = "";

        const updateAssistant = (chunk: string) => {
          assistantContent += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantContent } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantContent }];
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) updateAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) updateAssistant(content);
            } catch {
              /* ignore */
            }
          }
        }
      } catch (error) {
        console.error("Pulse Tutor error:", error);
        toast.error("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [messages]
  );

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    streamChat(input.trim());
  };

  const handleQuickAsk = (question: string) => {
    if (isLoading) return;
    streamChat(question);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90 z-50"
      >
        <GraduationCap className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 bg-card border border-border/50 rounded-xl shadow-2xl shadow-primary/10 flex flex-col transition-all duration-300",
        isExpanded
          ? "bottom-4 right-4 left-4 top-4 sm:left-auto sm:w-[500px] sm:h-[700px]"
          : "bottom-6 right-6 w-[380px] h-[500px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-sm">Pulse Tutor</span>
            <Badge variant="outline" className="ml-2 text-[10px] py-0">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              AI
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 mx-auto text-primary/50 mb-4" />
            <h4 className="font-semibold mb-2">Welcome to Pulse Tutor</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Your personal financial mentor. Ask me anything about investing, technical analysis,
              or market concepts.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-foreground prose prose-sm prose-invert max-w-none"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-secondary/50 rounded-lg px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Quick Ask Chips */}
      {messages.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ASKS.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickAsk(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pulse Tutor anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
