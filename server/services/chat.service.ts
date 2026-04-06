import type { Response } from "express";
import type { TranscriptMessage, UserSignal } from "@shared/types";
import { detectSignal } from "../lib/signals";
import { assembleSystemPrompt, transcriptToMessages } from "../lib/prompt-assembler";
import { streamChat, generateSummary } from "./claude.service";
import { getCompanion } from "./companion.service";
import { deductCredits, checkTrialExpiration } from "./credits.service";
import { anonymousSessions } from "../lib/anonymous-sessions";
import { recordHeartbeat, startTracking, stopTracking } from "../lib/credit-timer";
import { storage } from "../storage";

interface HandleMessageParams {
  sessionId: string;
  message: string;
  userId?: string;
  res: Response;
  lastSessionSummary?: string;
}

/**
 * Core chat orchestration: detect signal → assemble prompt → stream Claude → save transcript.
 * Works for both anonymous and authenticated sessions.
 */
export async function handleMessage(params: HandleMessageParams): Promise<void> {
  const { sessionId, message, userId, res, lastSessionSummary } = params;

  // Determine session type and get context
  const isAnonymous = !userId;
  let transcript: TranscriptMessage[];
  let faithTradition: string | undefined;
  let onboardingConcern: string | undefined;
  let userName: string | undefined;
  let minutesRemaining: number | undefined;

  if (isAnonymous) {
    const anonSession = anonymousSessions.get(sessionId);
    if (!anonSession) {
      res.status(404).json({ message: "Session not found or expired" });
      return;
    }
    transcript = anonSession.transcript;
    faithTradition = anonSession.faithTradition || undefined;
    onboardingConcern = anonSession.onboardingConcern || undefined;
    userName = anonSession.userName || undefined;
  } else {
    const session = await storage.getSession(sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    transcript = (session.transcript as TranscriptMessage[]) || [];
    const meta = session.metadata as Record<string, string> | null;
    faithTradition = meta?.faithTradition;
    onboardingConcern = meta?.onboardingConcern;
    userName = meta?.userName;

    // Check credit balance for authenticated users (auto-expire trial if needed)
    const currentBalance = await checkTrialExpiration(userId);
    if (currentBalance <= 0) {
      res.status(402).json({ message: "Insufficient credits" });
      return;
    }
    minutesRemaining = currentBalance;
  }

  // Add user message to transcript
  const userMessage: TranscriptMessage = {
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  transcript.push(userMessage);

  // Detect signal
  const messageCount = transcript.filter((m) => m.role === "user").length;
  const signal: UserSignal = detectSignal(message, messageCount);

  // Flag crisis sessions
  if (signal === "CRISIS") {
    if (!isAnonymous) {
      await storage.updateSession(sessionId, {
        flagged: true,
        flagReason: "suicidal_ideation",
      });
      await storage.updateUser(userId!, { crisisFlagged: true });
    }
  }

  // Load companion and assemble prompt
  const companion = await getCompanion("donna");
  const systemPrompt = assembleSystemPrompt({
    companion,
    transcript,
    faithTradition,
    onboardingConcern,
    userName,
    signal,
    minutesRemaining,
    isAnonymous,
    lastSessionSummary,
  });

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send signal info to client
  res.write(`data: ${JSON.stringify({ type: "signal", signal })}\n\n`);

  // Stream Claude response via SSE
  const messages = transcriptToMessages(transcript);

  await streamChat({
    systemPrompt,
    messages,
    onToken: (token) => {
      res.write(`data: ${JSON.stringify({ type: "token", token })}\n\n`);
    },
    onDone: async (fullText) => {
      // Add assistant message to transcript
      const assistantMessage: TranscriptMessage = {
        role: "assistant",
        content: fullText,
        timestamp: new Date().toISOString(),
        signal,
      };

      if (isAnonymous) {
        anonymousSessions.addMessage(sessionId, userMessage);
        anonymousSessions.addMessage(sessionId, assistantMessage);
      } else {
        transcript.push(assistantMessage);
        await storage.updateSession(sessionId, { transcript });
      }

      res.write(`data: ${JSON.stringify({ type: "done", signal })}\n\n`);
      res.end();
    },
    onError: (error) => {
      console.error("Claude streaming error:", error);
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Something went wrong. Marie is still here." })}\n\n`,
      );
      res.end();
    },
  });
}

/**
 * End a session: calculate duration, generate summary, save.
 */
export async function endSession(
  sessionId: string,
  userId: string,
): Promise<{ durationMinutes: number; creditsConsumed: number }> {
  const session = await storage.getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }

  // Prevent double-ending: if session already has endedAt, return previous result
  if (session.endedAt) {
    return {
      durationMinutes: session.durationMinutes ?? 0,
      creditsConsumed: session.creditsConsumed ?? 0,
    };
  }

  // Stop heartbeat tracking
  stopTracking(sessionId);

  const now = new Date();
  const startedAt = new Date(session.startedAt);
  const durationMinutes = Math.ceil(
    (now.getTime() - startedAt.getTime()) / 60000,
  );

  // Credits are already deducted per-minute by the heartbeat.
  // Count how many heartbeat deductions occurred during this session
  // to record creditsConsumed accurately (don't deduct again).
  const transactions = await storage.listCreditTransactions(userId);
  const sessionDeductions = transactions.filter(t => {
    if (t.type !== "deduction") return false;
    const txTime = new Date(t.createdAt);
    return txTime >= startedAt && txTime <= now;
  });
  const creditsConsumed = sessionDeductions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Generate summary before closing session (so returning users see it)
  const transcript = (session.transcript as TranscriptMessage[]) || [];
  let summary: string | undefined;
  let prayerIntention: string | undefined;
  if (transcript.length >= 2) {
    try {
      const result = await generateSummary(transcript);
      summary = result.summary;
      prayerIntention = result.prayerIntention;
    } catch (err) {
      console.error("Summary generation failed:", err);
    }
  }

  await storage.updateSession(sessionId, {
    endedAt: now,
    durationMinutes,
    creditsConsumed,
    ...(summary && { summary }),
    ...(prayerIntention && { prayerIntention }),
  });

  return { durationMinutes, creditsConsumed };
}

/**
 * Handle heartbeat: validates session is still active.
 */
export async function handleHeartbeat(
  sessionId: string,
  userId?: string,
): Promise<{ minutesRemaining: number | null }> {
  if (!userId) {
    // Anonymous session — just check it exists
    const session = anonymousSessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found or expired");
    }
    return { minutesRemaining: null };
  }

  const session = await storage.getSession(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }

  // Record heartbeat for timeout tracking
  recordHeartbeat(sessionId);

  // Check trial expiration first (auto-zeros balance if expired)
  const currentBalance = await checkTrialExpiration(userId);

  if (currentBalance > 0) {
    try {
      const newBalance = await deductCredits(userId, 1);
      return { minutesRemaining: newBalance };
    } catch {
      return { minutesRemaining: 0 };
    }
  }

  return { minutesRemaining: 0 };
}
