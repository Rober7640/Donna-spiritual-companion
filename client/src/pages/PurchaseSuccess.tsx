import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import marieAvatar from "@/assets/marie-avatar.png";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";

export default function PurchaseSuccess() {
  const [, setLocation] = useLocation();
  const { token, refreshUser } = useAuth();
  const { refreshBalance } = useCredits();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyAndRedirect() {
      try {
        // Get session_id from URL (Stripe redirects here with it)
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        // Verify checkout with server and fulfill credits (works without webhook)
        if (sessionId && token) {
          await api.verifyCheckoutSession(token, sessionId);
        }

        await Promise.all([refreshUser(), refreshBalance()]);

        // Auto-redirect back to chat seamlessly
        setLocation("/chat");
      } catch (err) {
        console.error("Failed to verify purchase:", err);
        setError("Something went wrong verifying your purchase. Please try refreshing.");
      }
    }
    verifyAndRedirect();
  }, [token, refreshUser, refreshBalance, setLocation]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(175deg, #faf8f5 0%, #f5f0ea 50%, #f0ebe4 100%)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm text-center"
      >
        {/* Donna's avatar */}
        <div className="mx-auto mb-6 h-20 w-20 overflow-hidden rounded-full ring-2 ring-white shadow-lg">
          <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
        </div>

        {error ? (
          <>
            <h1 className="font-serif text-2xl font-semibold text-stone-800">
              Oh dear...
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-stone-400">
              {error}
            </p>
            <button
              onClick={() => setLocation("/chat")}
              className="mt-6 text-[14px] text-[#2D6AAF] underline hover:text-[#24578d]"
            >
              Return to chat
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-4 h-5 w-5 animate-spin text-stone-400" />
            <h1 className="font-serif text-2xl font-semibold text-stone-800">
              One moment, sweetheart...
            </h1>
          </>
        )}
      </motion.div>
    </div>
  );
}
