import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { TranscriptMessage, UserSignal } from "@shared/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  signal?: UserSignal;
}

interface ChatState {
  sessionId: string | null;
  messages: ChatMessage[];
  isActive: boolean;
  isCrisis: boolean;
  setSessionId: (id: string) => void;
  addMessage: (msg: ChatMessage) => void;
  restoreSession: (id: string, msgs: ChatMessage[]) => void;
  setIsCrisis: (v: boolean) => void;
  endChat: () => void;
  getTranscript: () => TranscriptMessage[];
}

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isCrisis, setIsCrisis] = useState(false);

  const handleSetSessionId = useCallback((id: string) => {
    setSessionId(id);
    setIsActive(true);
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const restoreSession = useCallback((id: string, msgs: ChatMessage[]) => {
    setSessionId(id);
    setMessages(msgs);
    setIsActive(true);
  }, []);

  const endChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setIsActive(false);
    setIsCrisis(false);
  }, []);

  const getTranscript = useCallback((): TranscriptMessage[] => {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp.toISOString(),
      signal: m.signal,
    }));
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        sessionId,
        messages,
        isActive,
        isCrisis,
        setSessionId: handleSetSessionId,
        addMessage,
        restoreSession,
        setIsCrisis,
        endChat,
        getTranscript,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}
