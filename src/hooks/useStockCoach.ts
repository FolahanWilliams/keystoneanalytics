import { useState, useCallback, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseStockCoachOptions {
  onError?: (error: string) => void;
}

const COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stock-coach`;

export function useStockCoach(options: UseStockCoachOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSymbols, setActiveSymbols] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (input: string, symbols?: string[]) => {
    if (!input.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Update active symbols if provided
    if (symbols && symbols.length > 0) {
      setActiveSymbols(prev => [...new Set([...prev, ...symbols])]);
    }

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    // Add empty assistant message that will be streamed
    setMessages(prev => [
      ...prev,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      },
    ]);

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(COACH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: allMessages,
          symbols: [...activeSymbols, ...(symbols || [])],
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
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
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put it back
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
            if (content) {
              assistantContent += content;
            }
          } catch { /* ignore */ }
        }
      }

      // Mark streaming as complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: assistantContent, isStreaming: false }
            : m
        )
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was cancelled
        return;
      }

      console.error("Stock coach error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      options.onError?.(errorMessage);

      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(m => m.id !== assistantId));
    } finally {
      setIsLoading(false);
    }
  }, [messages, activeSymbols, options]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSymbols([]);
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    isLoading,
    activeSymbols,
    sendMessage,
    clearMessages,
    cancelRequest,
    setActiveSymbols,
  };
}
