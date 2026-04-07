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
  const sessionEnding = useRef(false);
  const { user, token, loading: authLoading } = useAuth();
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
  const [greetingReady, setGreetingReady] = useState(false);
  const [greetingTyping, setGreetingTyping] = useState(false);
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

  // Track latest session info in refs so the unmount cleanup always has current values
  const sessionIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  useEffect(() => { sessionIdRef.current = chat.sessionId; }, [chat.sessionId]);
  useEffect(() => { tokenRef.current = token; }, [token]);

  // Handle browser close/refresh — send end request with keepalive
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (navigatingToCheckout.current || !sessionIdRef.current || !tokenRef.current) return;
      fetch("/api/v1/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // End session on component unmount (navigation away from /chat)
  // Uses refs so this effect has NO dependencies and only runs on unmount
  useEffect(() => {
    return () => {
      if (navigatingToCheckout.current || sessionEnding.current) return;
      if (!sessionIdRef.current || !tokenRef.current) return;
      fetch("/api/v1/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokenRef.current}` },
        body: JSON.stringify({ sessionId: sessionIdRef.current }),
        keepalive: true,
      }).catch(() => {});
      chat.endChat();
      sessionStorage.removeItem("chatSessionId");
      sessionStorage.removeItem("chatTranscript");
      sessionStorage.removeItem("purchase_chat_session");
    };
  }, []);

  // Deliver initial greeting as multi-bubble messages with typing delays
  const greetingDelivered = useRef(false);
  useEffect(() => {
    if (!chat.sessionId || chat.messages.length > 0 || greetingReady || greetingDelivered.current) return;
    greetingDelivered.current = true;

    const deliverGreeting = async () => {
      const concern = sessionStorage.getItem("onboarding_concern");
      const hour = new Date().getHours();
      const timeGreeting =
        hour >= 5 && hour < 12 ? "Good morning" :
        hour >= 12 && hour < 17 ? "Good afternoon" :
        hour >= 17 && hour < 21 ? "Good evening" :
        "I'm glad you're here tonight";

      // Clean up any stale purchase flags
      sessionStorage.removeItem("from_purchase");

      let bubbles: string[];

      if (concern) {
        // First-time user with concern from onboarding
        bubbles = [
          `${timeGreeting}, sweetheart. I'm Donna.`,
          `A mother who has prayed through more midnights than I can count.`,
          `When a woman whispers "${concern}," I listen with both hands open.`,
          `Tell me what carrying this has felt like today.`,
        ];
        // Clear concern so next sessions don't repeat it
        sessionStorage.removeItem("onboarding_concern");
      } else {
        // Random welcome — every session except first onboarding
        const welcomeSets = [
          [
            "I'm glad you're here.",
            "Take a breath. There's no rush.",
            "What's weighing on you today?",
          ],
          [
            "Hello, sweetheart.",
            "I've been thinking of you.",
            "Tell me what's on your heart.",
          ],
          [
            "Welcome back, honey.",
            "This is a safe place. Always has been.",
            "What would you like to talk about?",
          ],
          [
            `${timeGreeting}, sweetheart.`,
            "I'm here, and I'm not going anywhere.",
            "What's been sitting heavy with you lately?",
          ],
          [
            "Pull up a chair, dear.",
            "I've got all the time in the world for you.",
            "What's on your mind?",
          ],
        ];
        bubbles = welcomeSets[Math.floor(Math.random() * welcomeSets.length)];
      }

      // Deliver each bubble with typing indicator between them
      for (let i = 0; i < bubbles.length; i++) {
        // Show typing dots
        setGreetingTyping(true);
        await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));
        setGreetingTyping(false);

        // Add message
        chat.addMessage({
          id: `greeting-${Date.now()}-${i}`,
          role: "assistant",
          content: bubbles[i],
          timestamp: new Date(),
        });

        // Short pause before next typing indicator
        if (i < bubbles.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      setGreetingReady(true);
    };

    deliverGreeting();
  }, [chat.sessionId, chat.messages.length, greetingReady]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, isTyping, isStreaming, streamingText, greetingReady, greetingTyping]);

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

  // Start session on mount — restore only if returning from purchase, otherwise fresh
  // Wait for auth to finish loading so we don't accidentally create anonymous sessions
  useEffect(() => {
    if (chat.sessionId || authLoading || sessionEnding.current) return;

    // Check if returning from purchase (chat session saved before Stripe redirect)
    const purchaseChatSession = sessionStorage.getItem("purchase_chat_session");

    if (purchaseChatSession && token) {
      // Returning from purchase — restore the previous conversation
      sessionStorage.removeItem("purchase_chat_session");

      const tryRestore = async () => {
        try {
          const res = await fetch(`/api/v1/sessions/${purchaseChatSession}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const session = await res.json();
            const transcript = (session.transcript || []) as Array<{
              role: "user" | "assistant"; content: string; timestamp: string; signal?: string;
            }>;

            if (transcript.length > 0) {
              const restoredMessages = transcript.map((m: { role: string; content: string; timestamp: string; signal?: string }, i: number) => ({
                id: `restored-${i}-${Date.now()}`,
                role: m.role as "user" | "assistant",
                content: m.content,
                timestamp: new Date(m.timestamp),
                signal: m.signal as import("@shared/types").UserSignal | undefined,
              }));

              // Start a new session with old transcript so dashboard shows full history
              const faithTradition = sessionStorage.getItem("onboarding_faith") || undefined;
              const onboardingConcern = sessionStorage.getItem("onboarding_concern") || undefined;
              const userName = sessionStorage.getItem("onboarding_name") || undefined;
              const res2 = await fetch("/api/v1/chat/start", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ faithTradition, onboardingConcern, userName, previousTranscript: transcript, replaceSessionId: purchaseChatSession }),
              });
              if (res2.ok) {
                const data = await res2.json();
                sessionStorage.setItem("chatSessionId", data.sessionId);
                chat.restoreSession(data.sessionId, restoredMessages);
                setGreetingReady(true);
                return;
              }
            }
          }
        } catch {
          // Server fetch failed — fall through to fresh session
        }

        // Fallback: start fresh if restore failed
        const faithTradition = sessionStorage.getItem("onboarding_faith") || undefined;
        const onboardingConcern = sessionStorage.getItem("onboarding_concern") || undefined;
        const userName = sessionStorage.getItem("onboarding_name") || undefined;
        startSession(faithTradition, onboardingConcern, userName);
      };
      tryRestore();
      return;
    }

    // Normal visit — clean up ALL stale references and start fresh
    sessionStorage.removeItem("chatSessionId");
    sessionStorage.removeItem("chatTranscript");
    sessionStorage.removeItem("purchase_chat_session");
    sessionStorage.removeItem("from_purchase");

    const faithTradition = sessionStorage.getItem("onboarding_faith") || undefined;
    const onboardingConcern = sessionStorage.getItem("onboarding_concern") || undefined;
    const userName = sessionStorage.getItem("onboarding_name") || undefined;
    startSession(faithTradition, onboardingConcern, userName);
  }, [chat.sessionId, startSession, authLoading]);

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
    // Prevent mount effect from restarting a session after endChat clears sessionId
    sessionEnding.current = true;
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

          {/* Typing Indicator (greeting + regular responses) */}
          {(isTyping || greetingTyping) && <TypingIndicator />}

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
        onClose={() => setShowTopUp(false)}
        chatSessionId={chat.sessionId || undefined}
        onCheckout={() => {
          navigatingToCheckout.current = true;
          // Save current chat session ID so we can restore after purchase
          if (chat.sessionId) {
            sessionStorage.setItem("purchase_chat_session", chat.sessionId);
          }
        }}
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
