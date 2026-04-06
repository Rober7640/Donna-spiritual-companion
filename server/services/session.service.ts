import { storage } from "../storage";
import { generateSummary } from "./claude.service";
import type { TranscriptMessage, SessionRating } from "@shared/types";

/**
 * List past sessions for a user (most recent first).
 */
export async function listSessions(userId: string) {
  const sessions = await storage.listUserSessions(userId);
  return sessions.map((s) => ({
    id: s.id,
    companionId: s.companionId,
    startedAt: s.startedAt.toISOString(),
    durationMinutes: s.durationMinutes,
    summary: s.summary,
    prayerIntention: s.prayerIntention,
    rating: s.rating,
  }));
}

/**
 * Get session detail with full transcript.
 */
export async function getSessionDetail(sessionId: string, userId: string) {
  const session = await storage.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return null;
  }

  return {
    id: session.id,
    companionId: session.companionId,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    durationMinutes: session.durationMinutes,
    transcript: (session.transcript as TranscriptMessage[]) || [],
    summary: session.summary,
    prayerIntention: session.prayerIntention,
    rating: session.rating,
  };
}

/**
 * Rate a session (helpful / not_helpful).
 */
export async function rateSession(
  sessionId: string,
  userId: string,
  rating: SessionRating,
): Promise<boolean> {
  const session = await storage.getSession(sessionId);
  if (!session || session.userId !== userId) {
    return false;
  }

  await storage.updateSession(sessionId, { rating });
  return true;
}

/**
 * Trigger async summary generation for a completed session.
 * Called after session ends — runs in background.
 */
export async function triggerSummaryGeneration(sessionId: string): Promise<void> {
  const session = await storage.getSession(sessionId);
  if (!session) return;

  const transcript = (session.transcript as TranscriptMessage[]) || [];
  if (transcript.length === 0) return;

  try {
    const { summary, prayerIntention } = await generateSummary(transcript);
    await storage.updateSession(sessionId, { summary, prayerIntention });
  } catch (err) {
    console.error(`Summary generation failed for session ${sessionId}:`, err);
  }
}
