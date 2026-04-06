import { Link, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Heart, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import * as api from "@/lib/api";
import type { SessionDetailResponse, SessionRating } from "@shared/types";

export default function SessionDetail() {
  const [, params] = useRoute("/session/:id");
  const { token } = useAuth();
  const [session, setSession] = useState<SessionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (!token || !params?.id) return;
    setLoading(true);
    api
      .getSessionDetail(token, params.id)
      .then(setSession)
      .catch((err) => console.error("Failed to load session:", err))
      .finally(() => setLoading(false));
  }, [token, params?.id]);

  const handleRate = async (rating: SessionRating) => {
    if (!token || !params?.id || ratingSubmitted) return;
    try {
      await api.rateSession(token, params.id, { rating });
      setRatingSubmitted(true);
      setSession((prev) => (prev ? { ...prev, rating } : prev));
    } catch (err) {
      console.error("Failed to rate session:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500">Session not found.</p>
        <Link href="/dashboard">
          <Button variant="ghost" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const hasRated = !!session.rating || ratingSubmitted;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <div className="sticky top-0 z-10 flex h-16 items-center border-b border-slate-200 bg-white px-4 shadow-sm">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="-ml-2 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8">

        {/* Meta */}
        <div className="mb-8 text-center">
          <h1 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {formatDate(session.startedAt)}
          </h1>
          <p className="mt-1 font-medium text-slate-600">
            Donna{session.durationMinutes ? ` - ${session.durationMinutes} minutes` : ""}
          </p>
        </div>

        {/* Prayer Intention Card */}
        {session.prayerIntention && (
          <div className="mb-10 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm ring-1 ring-blue-50">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-blue-600">Prayer Intention</h2>
            <p className="font-serif text-lg leading-relaxed text-slate-800 italic">
              "{session.prayerIntention}"
            </p>
          </div>
        )}

        {/* Summary */}
        {session.summary && (
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Summary</h2>
            <p className="font-serif leading-relaxed text-slate-700">{session.summary}</p>
          </div>
        )}

        {/* Transcript */}
        <div className="mb-12 space-y-6">
          <div className="flex flex-col gap-6 font-serif leading-relaxed text-slate-700">
            {session.transcript.map((msg, i) => (
              <p key={i}>
                <span className="font-bold text-slate-900 not-italic font-sans text-sm uppercase mr-2">
                  {msg.role === "assistant" ? "Donna:" : "You:"}
                </span>
                {msg.content}
              </p>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-10 h-px w-full bg-slate-200"></div>

        {/* Feedback */}
        <div className="text-center">
          {hasRated ? (
            <p className="text-sm font-medium text-slate-500">
              Thank you for your feedback.
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm font-medium text-slate-600">Did this conversation help?</p>
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleRate("helpful")}
                  className="h-12 min-w-[100px] gap-2 rounded-full border-slate-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                >
                  <Heart className="h-4 w-4" /> Yes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRate("not_helpful")}
                  className="h-12 min-w-[100px] gap-2 rounded-full border-slate-200 hover:border-slate-300 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" /> No
                </Button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
