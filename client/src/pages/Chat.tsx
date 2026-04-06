import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import marieAvatar from "@/assets/marie-avatar.png";
import TypingIndicator from "@/components/TypingIndicator";
import StreamingMessage from "@/components/StreamingMessage";
import CrisisResources from "@/components/CrisisResources";
import CreditTimer from "@/components/CreditTimer";
import TopUpPopup from "@/components/TopUpPopup";
import { useChatContext } from "@/context/ChatContext";
import { useChat } from "@/hooks/use-chat";
import { useEmailGate } from "@/hooks/use-email-gate";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigatingToCheckout = useRef(false);
  const pendingRestoreMessages = useRef<Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date; signal?: import("@shared/types").UserSignal }> | null>(null);
  const { user, token } = useAuth();
  const chat = useChatContext();
  const {
    sendMessage,
    startSession,
    endSession,
    isWaitingForResponse,
    isTyping,
    streamingText,
    isStreaming,
    creditsExpired,
  } = useChat();

  const credits = useCredits();
  const emailGate = useEmailGate();
  const [showTopUp, setShowTopUp] = useState(false);
  const [isOutOfCredits, setIsOutOfCredits] = useState(false);
  const presenceLine = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Here with you this morning.";
    if (hour < 17) return "Here with you this afternoon.";
    if (hour < 22) return "Here with you tonight.";
    return "Here with you in the quiet hours.";
  })();

  // Show TopUp popup when credits run out (from heartbeat or server refresh)
  useEffect(() => {
    if (user && credits.balanceMinutes !== null && credits.balanceMinutes <= 0) {
      setShowTopUp(true);
      setIsOutOfCredits(true);
    } else if (user && credits.balanceMinutes !== null && credits.balanceMinutes > 0) {
      setIsOutOfCredits(false);
    }
  }, [user, credits.balanceMinutes]);

  // Callback for when the trial countdown hits 0
  const handleTrialExpired = useCallback(() => {
    if (user) {
      setShowTopUp(true);
      setIsOutOfCredits(true);
      credits.refreshBalance(); // sync with server to set balance to 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Show TopUp when server rejects message due to expired credits
  useEffect(() => {
    if (creditsExpired) {
      setShowTopUp(true);
      setIsOutOfCredits(true);
      credits.refreshBalance();
    }
    // Only react to creditsExpired changing, not credits object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditsExpired]);



  // Start heartbeat when session starts (for authenticated users)
  useEffect(() => {
    if (chat.sessionId && user) {
      credits.startHeartbeat(chat.sessionId);
      return () => credits.stopHeartbeat();
    }
  }, [chat.sessionId, user]);

  // Auto-end session on unmount (navigation away) or browser close/refresh
  // Skip if navigating to Stripe checkout (session needs to survive the redirect)
  useEffect(() => {
    if (!chat.sessionId || !user || !token) return;

    const sessionId = chat.sessionId;
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const handleBeforeUnload = () => {
      if (navigatingToCheckout.current) return;
      // Use fetch with keepalive for reliability on page close (supports auth headers)
      fetch("/api/v1/chat/end", {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Component unmount (in-app navigation) — end session unless going to checkout
      if (!navigatingToCheckout.current) {
        fetch("/api/v1/chat/end", {
          method: "POST",
          headers,
          body: JSON.stringify({ sessionId }),
          keepalive: true,
        }).catch(() => {});
        chat.endChat();
        sessionStorage.removeItem("chatSessionId");
        sessionStorage.removeItem("chatTranscript");
      }
    };
  }, [chat.sessionId, user, token]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, isTyping, isStreaming, streamingText]);

  // Handle email from onboarding (old magic link flow — skipped if already authenticated via Option B)
  useEffect(() => {
    if (user) return; // Option B: user already authenticated from onboarding signup
    const onboardingEmail = sessionStorage.getItem("onboarding_email");
    if (onboardingEmail && !emailGate.emailCaptured) {
      emailGate.tryCapture(onboardingEmail).then(() => {
        sessionStorage.removeItem("onboarding_email");
      });
    }
  }, []);

  // Once a new session is created and we have pending messages to restore, inject them
  useEffect(() => {
    if (chat.sessionId && pendingRestoreMessages.current) {
      const msgs = pendingRestoreMessages.current;
      pendingRestoreMessages.current = null;
      chat.restoreSession(chat.sessionId, msgs);
    }
  }, [chat.sessionId]);

  // Start or restore session on mount
  useEffect(() => {
    if (chat.sessionId) return;

    // Try to restore an existing session (e.g. returning from Stripe checkout)
    const savedSessionId = sessionStorage.getItem("chatSessionId");
    const savedTranscript = sessionStorage.getItem("chatTranscript");

    if (savedSessionId) {
      const tryRestore = async () => {
        let restoredMessages: Array<{ id: string; role: "user" | "assistant"; content: string; timestamp: Date; signal?: import("@shared/types").UserSignal }> | null = null;

        // Try fetching from server first
        try {
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`/api/v1/sessions/${savedSessionId}`, { headers });
          if (res.ok) {
            const session = await res.json();
            const transcript = (session.transcript || []) as Array<{
              role: "user" | "assistant"; content: string; timestamp: string; signal?: string;
            }>;

            if (transcript.length > 0) {
              restoredMessages = transcript.map((m, i) => ({
                id: `restored-${i}-${Date.now()}`,
                role: m.role as "user" | "assistant",
                content: m.content,
                timestamp: new Date(m.timestamp),
                signal: m.signal as import("@shared/types").UserSignal | undefined,
              }));

              // If session is still active, restore it directly and we're done
              if (!session.endedAt) {
                chat.restoreSession(savedSessionId, restoredMessages);
                sessionStorage.setItem("chatTranscript", JSON.stringify(transcript));
                return;
              }
            }
          }
        } catch {
          // Server fetch failed
        }

        // If no server messages, try sessionStorage
        if (!restoredMessages && savedTranscript) {
          try {
            const parsed = JSON.parse(savedTranscript) as Array<{
              role: "user" | "assistant"; content: string; timestamp: string; signal?: string;
            }>;
            restoredMessages = parsed.map((m, i) => ({
              id: `restored-${i}-${Date.now()}`,
              role: m.role as "user" | "assistant",
              content: m.content,
              timestamp: new Date(m.timestamp),
              signal: m.signal as import("@shared/types").UserSignal | undefined,
            }));
          } catch {
            // Corrupted data
          }
        }

        // Clean up old session references
        sessionStorage.removeItem("chatSessionId");
        sessionStorage.removeItem("chatTranscript");

        // If we have old messages, store them for injection after new session starts
        if (restoredMessages && restoredMessages.length > 0) {
          pendingRestoreMessages.current = restoredMessages;
        }

        // Start a fresh session
        const faithTradition = sessionStorage.getItem("onboarding_faith") || undefined;
        const onboardingConcern = sessionStorage.getItem("onboarding_concern") || undefined;
        const userName = sessionStorage.getItem("onboarding_name") || undefined;
        startSession(faithTradition, onboardingConcern, userName);
      };
      tryRestore();
      return;
    }

    const faithTradition = sessionStorage.getItem("onboarding_faith") || undefined;
    const onboardingConcern = sessionStorage.getItem("onboarding_concern") || undefined;
    const userName = sessionStorage.getItem("onboarding_name") || undefined;
    startSession(faithTradition, onboardingConcern, userName);
  }, [chat.sessionId, startSession]);

  const handleSend = async () => {
    if (!inputValue.trim() || isWaitingForResponse) return;

    // If out of credits, show popup instead of sending
    if (isOutOfCredits) {
      setShowTopUp(true);
      return;
    }

    const text = inputValue.trim();

    // Try to capture an email from the message
    const captured = await emailGate.tryCapture(text);
    if (captured) {
      chat.addMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      });
      // Short delay so it feels like Donna is reading it
      setTimeout(() => {
        chat.addMessage({
          id: `gate-confirm-${Date.now()}`,
          role: "assistant",
          content: emailGate.confirmMessage,
          timestamp: new Date(),
        });
      }, 1200);
      setInputValue("");
      return;
    }

    // Normal message flow
    sendMessage(text);
    setInputValue("");
  };

  const handleEnd = async () => {
    // endSession calls the API + clears sessionStorage — the unmount cleanup
    // will see chat.sessionId is already cleared and skip the duplicate call
    await endSession();
    if (user) {
      setLocation("/dashboard");
    } else {
      setLocation("/");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50">

      {/* Header */}
      <header className="flex h-16 flex-none items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 overflow-hidden rounded-full border border-slate-100">
              <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold text-slate-900 leading-none">Donna</h1>
            <p className="text-xs text-green-600 font-medium">{presenceLine}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CreditTimer
            balanceMinutes={credits.balanceMinutes}
            isAuthenticated={!!user}
            trialExpiresAt={user?.trialExpiresAt ?? null}
            onTrialExpired={handleTrialExpired}
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-500 text-sm font-medium"
            onClick={handleEnd}
          >
            Step away for now
          </Button>
        </div>
      </header>

      {/* Chat Area */}
      <ScrollArea className="flex-1 bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6 pb-4">

          {/* Initial greeting (before any messages) */}
          {chat.messages.length === 0 && !isTyping && !isStreaming && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex max-w-[85%] gap-2">
                <div className="mt-1 h-8 w-8 flex-none overflow-hidden rounded-full border border-slate-200">
                  <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
                </div>
                <div>
                  <div className="rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 text-[16px] leading-relaxed shadow-sm text-slate-800">
                    {(() => {
                      const concern = sessionStorage.getItem("onboarding_concern");
                      const name = sessionStorage.getItem("onboarding_name") || user?.displayName;
                      const hour = new Date().getHours();
                      const timeGreeting =
                        hour >= 5 && hour < 12 ? "Good morning" :
                        hour >= 12 && hour < 17 ? "Good afternoon" :
                        hour >= 17 && hour < 21 ? "Good evening" :
                        "I'm glad you're here tonight";

                      // Returning user with previous session summary (only on fresh login, not after purchase)
                      const isReturningLogin = !sessionStorage.getItem("onboarding_faith") && !sessionStorage.getItem("chatSessionId");
                      if (user?.lastSessionSummary && isReturningLogin) {
                        const userName = name || "sweetheart";
                        // Convert third-person summary to second-person (e.g. "Lewis shared" → "you shared")
                        let summary = user.lastSessionSummary;
                        if (name) {
                          summary = summary.replace(new RegExp(name, "gi"), "you");
                        }
                        summary = summary.charAt(0).toLowerCase() + summary.slice(1);
                        return `${timeGreeting}, ${userName}. I'm so glad you came back. Last time, ${summary} What's on your heart today?`;
                      }

                      const baseIntro = "I'm Donna - a mother who has prayed through more midnights than I can count.";

                      if (name && concern) {
                        return `${timeGreeting}, ${name}. ${baseIntro} When a woman whispers "${concern}," I listen with both hands open. Tell me what carrying this has felt like today.`;
                      }
                      if (name) {
                        return `${timeGreeting}, ${name}. ${baseIntro} What's resting on your heart right now?`;
                      }
                      if (concern) {
                        return `${timeGreeting}, honey. ${baseIntro} I heard "${concern}" is pressing on you. Tell me your name so I can hold it with you.`;
                      }
                      return `${timeGreeting}, honey. ${baseIntro} Tell me your name so I can pray for you properly.`;
                    })()}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Message Thread */}
          {chat.messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[85%] gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>

                {/* Avatar (Donna only) */}
                {msg.role === "assistant" && (
                  <div className="mt-1 h-8 w-8 flex-none overflow-hidden rounded-full border border-slate-200">
                    <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
                  </div>
                )}

                {/* Bubble */}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-[16px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className={`mt-1 text-[10px] text-slate-400 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}

          {/* Streaming Message */}
          {isStreaming && <StreamingMessage text={streamingText} />}

          {/* Crisis Resources */}
          <AnimatePresence>
            {chat.isCrisis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4"
              >
                <CrisisResources />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spacer for bottom input */}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </ScrollArea>

      {/* TopUp Popup (authenticated users with 0 credits) */}
      <TopUpPopup
        isOpen={showTopUp}
        onClose={() => {
          // Only allow closing if user still has credits (e.g. just purchased)
          // If out of credits, popup stays — they must purchase to continue
          if (!isOutOfCredits) setShowTopUp(false);
        }}
        onCheckout={() => { navigatingToCheckout.current = true; }}
      />

      {/* Input Area */}
      <div className="flex-none bg-white p-4 pb-8 md:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="mx-auto max-w-2xl">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { if (isOutOfCredits) setShowTopUp(true); }}
              placeholder="What's on your heart..."
              className="h-12 rounded-full border-slate-200 bg-slate-50 pr-12 text-base shadow-sm focus-visible:ring-offset-0 focus-visible:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-100"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              className="absolute right-1 top-1 h-10 w-10 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
              disabled={!inputValue.trim() || isWaitingForResponse}
            >
              <Send className="h-5 w-5 ml-0.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
