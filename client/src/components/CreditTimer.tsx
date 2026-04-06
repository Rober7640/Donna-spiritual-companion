import { Clock } from "lucide-react";

interface CreditTimerProps {
  balanceMinutes: number | null;
  isAuthenticated: boolean;
}

/**
 * Shows remaining credit balance in minutes.
 * Both trial and paid users see the same static display.
 * Balance is updated by heartbeat (1 min deducted per minute while on /chat).
 */
export default function CreditTimer({ balanceMinutes, isAuthenticated }: CreditTimerProps) {
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

  return (
    <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
      <Clock className="h-3 w-3" />
      <span>{balanceMinutes} min</span>
    </div>
  );
}
