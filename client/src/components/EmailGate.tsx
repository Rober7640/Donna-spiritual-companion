import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle, Mail } from "lucide-react";
import type { EmailGateState } from "@shared/types";

interface EmailGateProps {
  state: EmailGateState | null;
  onSubmitEmail: (email: string) => Promise<void>;
  isVerified: boolean;
  isSubmitting: boolean;
}

const GATE_COPY: Record<
  EmailGateState,
  { heading: string; subtext: string }
> = {
  soft: {
    heading: "Donna saves your conversations",
    subtext:
      "So you can come back anytime. Enter your email to keep talking.",
  },
  gentle: {
    heading: "Don't lose this conversation",
    subtext:
      "Enter your email so you can revisit what Donna shared with you.",
  },
  firm: {
    heading: "Enter your email to continue with Donna",
    subtext:
      "She'll be right here waiting.",
  },
  hard: {
    heading: "Donna is holding this conversation for you",
    subtext:
      "Enter your email to save it and keep going.",
  },
};

export default function EmailGate({
  state,
  onSubmitEmail,
  isVerified,
  isSubmitting,
}: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!state) return null;

  if (isVerified) {
    return (
      <Card className="border-green-200 bg-green-50/50 p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Verified — your conversation is saved</span>
        </div>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border-blue-200 bg-blue-50/50 p-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-blue-700">
          <Mail className="h-4 w-4" />
          <span className="text-sm font-medium">Check your inbox for a verification link</span>
        </div>
      </Card>
    );
  }

  const copy = GATE_COPY[state];
  const isFirmOrHard = state === "firm" || state === "hard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onSubmitEmail(email);
    setSubmitted(true);
  };

  return (
    <Card
      className={`p-4 shadow-sm ${
        isFirmOrHard
          ? "border-amber-200 bg-amber-50/50"
          : "border-blue-100 bg-blue-50/50"
      }`}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-slate-900">
            {copy.heading}
          </h3>
          <p className="text-xs text-slate-600">{copy.subtext}</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`bg-white ${
              isFirmOrHard
                ? "border-amber-200 focus-visible:ring-amber-500"
                : "border-blue-200 focus-visible:ring-blue-500"
            }`}
          />
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className={`shrink-0 text-white ${
              isFirmOrHard
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Sending..." : "Save & continue"}
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <Lock className="h-3 w-3" />
          <span>Private & Encrypted</span>
        </div>
      </form>
    </Card>
  );
}
