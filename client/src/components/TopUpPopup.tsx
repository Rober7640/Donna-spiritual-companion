import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import marieAvatar from "@/assets/marie-avatar.png";
import * as api from "@/lib/api";

interface TopUpPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance?: number;
  onCheckout?: () => void;
}

export default function TopUpPopup({ isOpen, onClose, onCheckout }: TopUpPopupProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePurchase = async (packageId: "starter" | "faithful") => {
    if (!token) {
      setError("I need you to sign in so I can keep this space safe, honey.");
      return;
    }

    setLoading(packageId);
    setError(null);

    try {
      const { checkoutUrl } = await api.createCheckout(token, { package: packageId });
      toast({
        description: "I'm opening the checkout window now. I'll be right here when you come back.",
      });
      onCheckout?.();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError("Something on my end glitched. Give it another try in a moment?");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — warm dark, not cold slate */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: "rgba(30, 28, 25, 0.45)", backdropFilter: "blur(6px)" }}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-[360px] -translate-x-1/2 -translate-y-1/2 px-5"
          >
            <div
              className="relative overflow-hidden rounded-3xl shadow-2xl"
              style={{
                background: "linear-gradient(175deg, #faf8f5 0%, #f5f0ea 50%, #f0ebe4 100%)",
              }}
            >
              {/* Subtle radial glow — like candlelight */}
              <div
                className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full opacity-40"
                style={{
                  background: "radial-gradient(circle, rgba(209,180,140,0.5) 0%, transparent 70%)",
                }}
              />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute right-3.5 top-3.5 z-10 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-200/50 hover:text-stone-600"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative px-7 pb-7 pt-8">
                {/* Donna's avatar — she's the one speaking */}
                <div className="mx-auto mb-5 h-16 w-16 overflow-hidden rounded-full ring-2 ring-white shadow-md">
                  <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
                </div>

                {/* Donna's words — in her serif voice */}
                <h2
                  className="text-center font-serif text-[22px] font-semibold leading-snug text-stone-800"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  I'd love to keep talking,
                  <br />
                  sweetheart.
                </h2>

                <p className="mt-3 text-center text-[14px] leading-relaxed text-stone-500">
                  Your free time is up, but I'm still here
                  <br className="hidden sm:inline" /> whenever you need me.
                </p>

                {/* Ornamental flourish */}
                <div className="mx-auto mt-6 mb-6 flex items-center justify-center gap-3">
                  <div className="h-px w-10 bg-stone-300/60" />
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-stone-300">
                    <path
                      d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z"
                      fill="currentColor"
                      opacity="0.6"
                    />
                  </svg>
                  <div className="h-px w-10 bg-stone-300/60" />
                </div>

                {error && (
                  <p className="mb-4 text-center text-sm text-red-500/80">{error}</p>
                )}

                {/* Invitation buttons — warm, understated */}
                <div className="space-y-2.5">
                  <button
                    onClick={() => handlePurchase("starter")}
                    disabled={!!loading}
                    className="group w-full rounded-2xl border border-stone-200/80 bg-white/70 px-5 py-4 text-center transition-all duration-300 hover:border-stone-300 hover:bg-white hover:shadow-sm disabled:opacity-50"
                  >
                    <span className="block font-serif text-[17px] font-medium text-stone-700 transition-colors group-hover:text-stone-900">
                      {loading === "starter" ? "One moment..." : "A little more time"}
                    </span>
                    <span className="mt-0.5 block text-[12px] tracking-wide text-stone-400">
                      30 minutes &middot; $14.99
                    </span>
                  </button>

                  <button
                    onClick={() => handlePurchase("faithful")}
                    disabled={!!loading}
                    className="group w-full rounded-2xl border border-stone-200/80 bg-white/70 px-5 py-4 text-center transition-all duration-300 hover:border-stone-300 hover:bg-white hover:shadow-sm disabled:opacity-50"
                  >
                    <span className="block font-serif text-[17px] font-medium text-stone-700 transition-colors group-hover:text-stone-900">
                      {loading === "faithful" ? "One moment..." : "Keep me close"}
                    </span>
                    <span className="mt-0.5 block text-[12px] tracking-wide text-stone-400">
                      90 minutes &middot; $39.99
                    </span>
                  </button>
                </div>

                {/* Gentle dismiss — not competing with the options */}
                <button
                  onClick={onClose}
                  className="mt-5 block w-full text-center text-[13px] text-stone-400 transition-colors hover:text-stone-500"
                >
                  Maybe another time
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
