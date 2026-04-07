import { useCallback, useRef, useState } from "react";
import { useAuth } from "./use-auth";
import { useChatContext } from "@/context/ChatContext";
import { useStreaming } from "./use-streaming";
import { getInitialDelay } from "@/lib/pacing";
import type { UserSignal } from "@shared/types";

interface UseChatReturn {
  sendMessage: (text: string) => Promise<void>;
  startSession: (faithTradition?: string, onboardingConcern?: string, userName?: string) => Promise<void>;
  endSession: () => Promise<void>;
  isWaitingForResponse: boolean;
  isTyping: boolean;
  streamingText: string;
  isStreaming: boolean;
  creditsExpired: boolean;
}

export function useChat(): UseChatReturn {
  const { token } = useAuth();
  const chat = useChatContext();
  const streaming = useStreaming();
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [creditsExpired, setCreditsExpired] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const startSession = useCallback(
    async (faithTradition?: string, onboardingConcern?: string, userName?: string) => {
      const res = await fetch("/api/v1/chat/start", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ faithTradition, onboardingConcern, userName }),
      });

      if (!res.ok) throw new Error("Failed to start session");

      const data = await res.json();
      chat.setSessionId(data.sessionId);

      // Store session info in sessionStorage for recovery
      sessionStorage.setItem("chatSessionId", data.sessionId);
    },
    [getHeaders, chat],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!chat.sessionId || isWaitingForResponse) return;

      // Add user message immediately
      chat.addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      });

      setIsWaitingForResponse(true);

      // Show typing indicator with pacing delay
      const delay = getInitialDelay(text.length);
      setIsTyping(true);

      await new Promise((resolve) => setTimeout(resolve, delay));

      // Start SSE request
      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/v1/chat/message", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            sessionId: chat.sessionId,
            message: text,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json();
          // If server says insufficient credits, trigger TopUp instead of error
          if (res.status === 402) {
            throw new Error("__CREDITS_EXPIRED__");
          }
          throw new Error(err.message || "Failed to send message");
        }

        setIsTyping(false);
        streaming.startStreaming();

        // Read SSE stream
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let fullText = "";
        let detectedSignal: UserSignal = "CONTINUE";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "signal") {
                detectedSignal = event.signal;
                if (event.signal === "CRISIS") {
                  chat.setIsCrisis(true);
                }
              } else if (event.type === "token") {
                streaming.pushToken(event.token);
                fullText += event.token;
              } else if (event.type === "done") {
                // Don't finishStreaming here — we'll reset after the reader loop
                // to avoid the duplicate bubble (streaming + final message overlap)
              } else if (event.type === "error") {
                streaming.reset();
                setIsTyping(false);
                setIsWaitingForResponse(false);

                // Show the error as a Donna message so the user knows
                chat.addMessage({
                  id: `error-${Date.now()}`,
                  role: "assistant",
                  content: event.message || "I'm sorry, sweetheart — something went wrong on my end. Try sending that again?",
                  timestamp: new Date(),
                });
                console.error("Stream error:", event.message);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Stop streaming immediately, then add the final message in the same
        // React batch so the StreamingMessage disappears and the permanent
        // bubble appears without any duplicate flash.
        streaming.reset();

        // Add the complete assistant message
        chat.addMessage({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: fullText,
          timestamp: new Date(),
          signal: detectedSignal,
        });

      } catch (err) {
        if ((err as Error).message === "__CREDITS_EXPIRED__") {
          // Credits ran out — signal to show TopUp, no error message
          setIsTyping(false);
          streaming.reset();
          setCreditsExpired(true);
        } else if ((err as Error).name !== "AbortError") {
          console.error("Chat error:", err);
          setIsTyping(false);
          streaming.reset();

          chat.addMessage({
            id: `error-${Date.now()}`,
            role: "assistant",
            content: "I'm sorry, sweetheart — something went wrong on my end. Try sending that again?",
            timestamp: new Date(),
          });
        }
      } finally {
        setIsWaitingForResponse(false);
        abortRef.current = null;
      }
    },
    [chat, getHeaders, isWaitingForResponse, streaming],
  );

  const endSession = useCallback(async () => {
    if (!chat.sessionId) return;

    abortRef.current?.abort();

    try {
      await fetch("/api/v1/chat/end", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ sessionId: chat.sessionId }),
      });
    } catch (err) {
      console.error("Failed to end session:", err);
    }

    chat.endChat();
    sessionStorage.removeItem("chatSessionId");
    sessionStorage.removeItem("chatTranscript");
  }, [chat, getHeaders]);

  return {
    sendMessage,
    startSession,
    endSession,
    isWaitingForResponse,
    isTyping,
    streamingText: streaming.streamingText,
    isStreaming: streaming.isStreaming,
    creditsExpired,
  };
}
