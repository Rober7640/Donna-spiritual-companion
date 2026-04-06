import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { HEARTBEAT_INTERVAL_MS } from "@shared/constants";
import * as api from "@/lib/api";

interface UseCreditsReturn {
  balanceMinutes: number | null;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
  startHeartbeat: (sessionId: string) => void;
  stopHeartbeat: () => void;
}

export function useCredits(): UseCreditsReturn {
  const { token, user } = useAuth();
  const [balanceMinutes, setBalanceMinutes] = useState<number | null>(
    user?.balanceMinutes ?? null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const refreshBalance = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await api.getCreditBalance(token);
      setBalanceMinutes(data.balanceMinutes);
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch initial balance when authenticated
  useEffect(() => {
    if (token && balanceMinutes === null) {
      refreshBalance();
    }
  }, [token, balanceMinutes, refreshBalance]);

  // Sync from user context when it changes
  useEffect(() => {
    if (user?.balanceMinutes !== undefined) {
      setBalanceMinutes(user.balanceMinutes);
    }
  }, [user?.balanceMinutes]);

  const startHeartbeat = useCallback(
    (sessionId: string) => {
      sessionIdRef.current = sessionId;

      // Refresh balance from server when starting a new session
      refreshBalance();

      // Clear any existing heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }

      heartbeatRef.current = setInterval(async () => {
        if (!token || !sessionIdRef.current) return;

        try {
          const result = await api.chatHeartbeat(token, {
            sessionId: sessionIdRef.current,
          });
          if (result.minutesRemaining !== null) {
            setBalanceMinutes(result.minutesRemaining);
          }
        } catch (err) {
          console.error("Heartbeat failed:", err);
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    [token, refreshBalance],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    sessionIdRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  return {
    balanceMinutes,
    isLoading,
    refreshBalance,
    startHeartbeat,
    stopHeartbeat,
  };
}
