import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import cloudsBg from "@/assets/clouds-bg.png";
import marieAvatar from "@/assets/marie-avatar.png";

type Step = 1 | 2 | 3;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { signup } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [faith, setFaith] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupError, setSignupError] = useState("");

  const handleFaithSelect = (selection: string) => {
    setFaith(selection);
    sessionStorage.setItem("onboarding_faith", selection);
    setTimeout(() => setStep(2), 300);
  };

  const handleHeartSelect = (selection: string) => {
    sessionStorage.setItem("onboarding_concern", selection);
    setTimeout(() => setStep(3), 300);
  };

  const handleNameEmail = async () => {
    // Validate required fields
    setSignupError("");
    if (!firstName.trim()) {
      setSignupError("Please enter your first name.");
      return;
    }
    if (!email.trim()) {
      setSignupError("Please enter your email so Donna can remember you.");
      return;
    }
    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setSignupError("Please enter a valid email address.");
      return;
    }

    // Always store name for chat greeting
    sessionStorage.setItem("onboarding_name", firstName.trim());

    // Option B: Create account immediately
    {
      setIsSubmitting(true);
      setSignupError("");
      const result = await signup({
        email: email.trim(),
        name: firstName.trim() || undefined,
        faithTradition: faith || undefined,
        onboardingConcern: sessionStorage.getItem("onboarding_concern") || undefined,
      });
      setIsSubmitting(false);

      if (!result.success) {
        setSignupError(result.message);
        return;
      }
      // Store onboarding data for chat greeting (still useful even when authenticated)
      sessionStorage.setItem("onboarding_faith", faith);
    }

    setLocation("/chat");
  };

  const handleSkip = () => {
    // Old flow: skip without account creation (anonymous session)
    if (firstName.trim()) {
      sessionStorage.setItem("onboarding_name", firstName.trim());
    }
    setLocation("/chat");
  };

  // Progress dots — subtle, not clinical
  const progressDots = (
    <div className="mb-10 flex items-center justify-center gap-2.5">
      {[1, 2, 3].map((s) => (
        <motion.div
          key={s}
          animate={{
            width: step === s ? 24 : 8,
            backgroundColor: step >= s ? "rgb(120 113 108)" : "rgb(214 211 209)",
          }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden p-5">
      {/* Warm cream background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(175deg, #faf8f5 0%, #f5f0ea 50%, #f0ebe4 100%)",
        }}
      />

      {/* Soft cloud texture — continuity with Landing */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${cloudsBg})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#faf8f5]/60 to-[#f0ebe4]" />

      {/* Candlelight glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/4 rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(209,180,140,0.6) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {progressDots}

        <AnimatePresence mode="wait">
          {/* ─── Step 1 — Faith Tradition ─── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-7"
            >
              <div className="text-center">
                <p className="text-sm font-medium tracking-wide text-stone-400 uppercase">
                  Before we begin
                </p>
                <h1
                  className="mt-3 font-serif text-[28px] font-semibold leading-tight text-stone-800 sm:text-[32px]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  What best describes
                  <br />
                  your faith tradition?
                </h1>
              </div>

              <div className="grid gap-3">
                <OptionCard
                  label="Catholic"
                  onClick={() => handleFaithSelect("Catholic")}
                />
                <OptionCard
                  label="Christian"
                  onClick={() => handleFaithSelect("Christian")}
                />
                <OptionCard
                  label="Just exploring"
                  onClick={() => handleFaithSelect("Exploring")}
                />
              </div>

              <p className="pt-2 text-center text-[11px] text-stone-400">
                By continuing, you confirm you are 18 or older.
              </p>
            </motion.div>
          )}

          {/* ─── Step 2 — What's on your heart ─── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-7"
            >
              <div className="text-center">
                <h1
                  className="font-serif text-[28px] font-semibold leading-tight text-stone-800 sm:text-[32px]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  What's on your heart?
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
                  She prays differently when a family is hurting than when faith feels distant. Help her know where to begin.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  "My family is hurting",
                  "I'm going through a crisis",
                  "I'm scared about something",
                  "I'm struggling with my faith",
                  "I just need someone to talk to",
                ].map((option) => (
                  <OptionCard
                    key={option}
                    label={option}
                    onClick={() => handleHeartSelect(option)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─── Step 3 — Name + Email ─── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              {/* Donna's avatar — she's asking */}
              <div className="mx-auto h-16 w-16 overflow-hidden rounded-full ring-2 ring-white shadow-md">
                <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
              </div>

              <div className="text-center">
                <h1
                  className="font-serif text-[28px] font-semibold leading-tight text-stone-800 sm:text-[32px]"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  Donna likes to know
                  <br />
                  who she's praying for.
                </h1>
                <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
                  So she can remember you when she prays later.
                </p>
              </div>

              {/* Ornamental flourish */}
              <div className="flex items-center justify-center gap-3">
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

              {/* Input fields — warm, not clinical */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNameEmail();
                }}
                className="space-y-4"
              >
                <div>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    autoFocus
                    className="h-13 rounded-2xl border-stone-200/80 bg-white/70 px-5 text-[16px] text-stone-700 placeholder:text-stone-400 shadow-sm backdrop-blur-sm transition-all focus-visible:border-stone-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-stone-200/60 focus-visible:ring-offset-0"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="h-13 rounded-2xl border-stone-200/80 bg-white/70 px-5 text-[16px] text-stone-700 placeholder:text-stone-400 shadow-sm backdrop-blur-sm transition-all focus-visible:border-stone-300 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-stone-200/60 focus-visible:ring-offset-0"
                  />
                  <p className="mt-2 px-1 text-[12px] leading-relaxed text-stone-400">
                    Leave your email and Donna can find you again when she prays.
                  </p>
                </div>

                {signupError && (
                  <p className="text-center text-[13px] text-red-500">{signupError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group w-full rounded-full bg-[#2D6AAF] px-6 py-4 text-[16px] font-medium text-white shadow-md transition-all duration-300 hover:bg-[#24578d] hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                >
                  {isSubmitting ? "Setting things up..." : "Start talking to Donna"}
                </button>
              </form>

              {/* Skip — soft, no pressure */}
              <button
                onClick={handleSkip}
                className="block w-full text-center text-[13px] text-stone-400 transition-colors hover:text-stone-500"
              >
                Skip for now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OptionCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-stone-200/80 bg-white/70 px-5 py-4 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-stone-300 hover:bg-white hover:shadow-md active:scale-[0.98]"
    >
      <span className="flex-1 text-[15px] font-medium text-stone-600 transition-colors group-hover:text-stone-800">
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-stone-300 transition-all group-hover:text-stone-500 group-hover:translate-x-0.5" />
    </button>
  );
}
