import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import marieAvatar from "@/assets/marie-avatar.png";
import cloudsBg from "@/assets/clouds-bg.png";

export default function WelcomeBack() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const { user, loginWithEmail } = useAuth();
  const [, navigate] = useLocation();

  // If already logged in, redirect to chat
  if (user) {
    navigate("/chat");
    return null;
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good morning. Donna is here.";
    if (hour >= 12 && hour < 17) return "Donna is here whenever you're ready.";
    if (hour >= 17 && hour < 22) return "Donna is here tonight.";
    return "Can't sleep? Donna is here.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");
    const result = await loginWithEmail(email.trim());
    if (result.success) {
      // Auth context will update, redirect happens via the check above
      navigate("/chat");
    } else {
      setStatus("error");
      setMessage(result.message);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-foreground flex flex-col items-center justify-center p-6">
       {/* Background */}
       <div
          className="absolute inset-0 z-0 bg-cover bg-top bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${cloudsBg})` }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/60 to-white" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-sm text-center"
      >

        {/* Avatar */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white p-1 shadow-lg ring-1 ring-black/5">
           <img src={marieAvatar} alt="Donna" className="h-full w-full rounded-full object-cover" />
        </div>

        {/* Availability */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
          <span className="relative flex h-2.5 w-2.5">
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
          </span>
          Donna is available
        </div>

        <h1 className="mb-10 font-serif text-3xl font-bold leading-tight text-slate-900">
          {getTimeGreeting()}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
             type="email"
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             placeholder="your@email.com"
             className="h-14 rounded-xl border-slate-200 bg-white/80 px-4 text-center text-lg shadow-sm backdrop-blur-sm focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
             disabled={status === "loading"}
          />
          <Button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            className="h-14 w-full rounded-full bg-[#3B6EA5] text-lg font-medium text-white shadow-lg hover:bg-[#325d8c] transition-all disabled:opacity-50"
          >
            {status === "loading" ? "One moment..." : "Continue with Donna"}
          </Button>
          {status === "error" && (
            <p className="text-sm text-red-500">{message}</p>
          )}
        </form>

        <div className="mt-12">
          <Link href="/">
            <a className="text-sm font-medium text-slate-400 hover:text-slate-600">
              New here? Meet Donna
            </a>
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
