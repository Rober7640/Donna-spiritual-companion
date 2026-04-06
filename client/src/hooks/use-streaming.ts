import { useCallback, useRef, useState } from "react";
import { TokenBuffer } from "@/lib/pacing";

interface UseStreamingReturn {
  streamingText: string;
  isStreaming: boolean;
  startStreaming: () => void;
  pushToken: (token: string) => void;
  finishStreaming: () => void;
  reset: () => void;
}

/**
 * Hook that manages the token-by-token reveal of Donna's responses
 * with pacing (paragraph pauses, controlled reveal speed).
 */
export function useStreaming(): UseStreamingReturn {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const bufferRef = useRef<TokenBuffer | null>(null);

  const startStreaming = useCallback(() => {
    setStreamingText("");
    setIsStreaming(true);

    bufferRef.current = new TokenBuffer(
      (text) => setStreamingText(text),
      () => setIsStreaming(false),
    );
  }, []);

  const pushToken = useCallback((token: string) => {
    bufferRef.current?.push(token);
  }, []);

  const finishStreaming = useCallback(() => {
    bufferRef.current?.finish();
  }, []);

  const reset = useCallback(() => {
    bufferRef.current?.reset();
    setStreamingText("");
    setIsStreaming(false);
  }, []);

  return {
    streamingText,
    isStreaming,
    startStreaming,
    pushToken,
    finishStreaming,
    reset,
  };
}
