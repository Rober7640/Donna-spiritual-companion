import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CreditTimerProps {
  balanceMinutes: number | null;
  isAuthenticated: boolean;
  trialExpiresAt: string | null;
  onTrialExpired?: () => void;
}

/**
 * Real-time countdown timer for trial users.
 * Shows mm:ss countdown when trialExpiresAt is set, otherwise shows balance in minutes.
 */
export default function CreditTimer({ balanceMinutes, isAuthenticated, trialExpiresAt, onTrialExpired }: CreditTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!trialExpiresAt) {
      setSecondsLeft(null);
      return;
    }

    const calcRemaining = () => {
      const remaining = Math.max(0, Math.floor((new Date(trialExpiresAt).getTime() - Date.now()) / 1000));
      return remaining;
    };

    setSecondsLeft(calcRemaining());

    const interval = setInterval(() => {
      const remaining = calcRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onTrialExpired?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [trialExpiresAt, onTrialExpired]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        <Clock className="h-3 w-3" />
        <span>Free trial</span>
      </div>
    );
  }

  if (balanceMinutes === null) {
    return (
      <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
        <Clock className="h-3 w-3" />
        <span>Loading...</span>
      </div>
    );
  }

  // Trial countdown mode (but not if trial expired and user has purchased credits)
  if (secondsLeft !== null && !(secondsLeft <= 0 && balanceMinutes > 0)) {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const display = `${mins}:${secs.toString().padStart(2, "0")}`;
    const isUrgent = secondsLeft <= 60;

    return (
      <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        isUrgent ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
      }`}>
        <Clock className="h-3 w-3" />
        <span>{display}</span>
      </div>
    );
  }

  // Paid user — show static balance
  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
      <Clock className="h-3 w-3" />
      <span>{balanceMinutes} min</span>
    </div>
  );
}
