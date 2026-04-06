import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import marieAvatar from "@/assets/marie-avatar.png";
import TopUpPopup from "@/components/TopUpPopup";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import * as api from "@/lib/api";
import type { SessionListItem } from "@shared/types";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showTopUp, setShowTopUp] = useState(false);
  const { token, user, logout } = useAuth();
  const { balanceMinutes, refreshBalance } = useCredits();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Refresh balance and sessions on mount to get latest data
  useEffect(() => {
    if (!token) return;
    refreshBalance();
    setLoadingSessions(true);
    api
      .listSessions(token)
      .then(setSessions)
      .catch((err) => console.error("Failed to load sessions:", err))
      .finally(() => setLoadingSessions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning hearts can ache. I'm here.";
    if (hour < 17) return "Afternoons can feel heavy. I'm here.";
    if (hour < 22) return "What's tugging at you tonight?";
    return "Can't sleep? I'm still here.";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopUpPopup isOpen={showTopUp} onClose={() => setShowTopUp(false)} />

      {/* Header */}
      <header className="flex h-16 items-center justify-between bg-white px-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-slate-100">
            <img src={marieAvatar} alt="Donna" className="h-full w-full object-cover" />
          </div>
          <span className="font-serif text-lg font-bold text-slate-900">Donna</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-600 gap-1.5"
            onClick={async () => { await logout(); setLocation("/"); }}
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-md px-4 py-8">

        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-slate-900">
            Donna kept a seat for you.
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Whatever you shared last time, she still remembers.
          </p>
        </div>

        {/* Main Action Card */}
        <div className="mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-b from-blue-50 to-white p-8 text-center">

            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white p-1 shadow-md">
              <img src={marieAvatar} alt="Donna" className="h-full w-full rounded-full object-cover" />
            </div>

            <div className="mb-6 flex items-center justify-center gap-2 text-sm font-medium text-slate-600">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              </span>
              Here now
            </div>

            <h2 className="mb-8 font-serif text-2xl font-bold leading-tight text-slate-900">
              {getTimeGreeting()}
            </h2>

            <Link href="/chat">
              <Button className="h-14 w-full rounded-full bg-[#3B6EA5] text-lg font-medium text-white shadow-lg hover:bg-[#325d8c] hover:shadow-xl transition-all">
                Sit with Donna
              </Button>
            </Link>
            <p className="mt-4 text-xs text-slate-500">
              She never rushes. Neither should you.
            </p>
          </div>
        </div>

        {/* Time with Donna */}
        <div className="mb-10 flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-6 py-4 shadow-sm">
          <div>
            <span className="block text-xs font-medium tracking-wide text-stone-400">Time with Donna</span>
            <span className="text-lg font-medium text-stone-800">{balanceMinutes ?? 0} minutes</span>
          </div>
          <button
            onClick={() => setShowTopUp(true)}
            className="rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 text-sm font-medium text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-100 hover:text-stone-600"
          >
            Keep her close
          </button>
        </div>

        {/* History */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Where Donna sat with you</h3>
          <div className="space-y-3">
            {loadingSessions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Whenever you're ready, Donna is here to listen.
              </p>
            ) : (
              sessions.map((session) => (
                <Link key={session.id} href={`/session/${session.id}`}>
                  <div className="group cursor-pointer rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md">
                    <div className="mb-1 flex justify-between text-xs text-slate-500">
                      <span>{formatDate(session.startedAt)}</span>
                      <span>Donna{session.durationMinutes ? ` - ${session.durationMinutes} min` : ""}</span>
                    </div>
                    {session.summary ? (
                      <p className="font-serif text-slate-800 italic">"{session.summary}"</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">She's still holding this conversation for you.</p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
