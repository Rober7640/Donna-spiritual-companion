import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error-handler";
import { validate } from "../middleware/validate";
import { optionalAuth } from "../middleware/auth";
import { chatMessageLimiter } from "../middleware/rate-limit";
import { sanitizeMessage } from "../middleware/sanitize";
import { anonymousSessions } from "../lib/anonymous-sessions";
import { startTracking } from "../lib/credit-timer";
import { storage } from "../storage";
import { handleMessage, endSession, handleHeartbeat } from "../services/chat.service";

export const chatRouter = Router();

// POST /api/v1/chat/start — Create a new chat session
const chatStartSchema = z.object({
  faithTradition: z.string().max(200).optional(),
  onboardingConcern: z.string().max(500).optional(),
  userName: z.string().max(100).optional(),
  previousTranscript: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string(),
  })).optional(),
  replaceSessionId: z.string().uuid().optional(),
});

chatRouter.post(
  "/start",
  optionalAuth,
  validate(chatStartSchema),
  asyncHandler(async (req, res) => {
    const { faithTradition, onboardingConcern, userName, previousTranscript, replaceSessionId } = req.body;

    if (req.userId) {
      // Authenticated user — create a real session in the database
      // If previousTranscript is provided (e.g. post-purchase restore), carry it over
      const session = await storage.createSession({
        userId: req.userId,
        companionId: "donna",
        transcript: previousTranscript || [],
        metadata: { faithTradition, onboardingConcern, userName },
      });

      // Update last session timestamp
      await storage.updateUser(req.userId, { lastSessionAt: new Date() });

      // If replacing an old session (post-purchase), delete the old one
      // so the dashboard only shows the complete merged session
      if (replaceSessionId) {
        const oldSession = await storage.getSession(replaceSessionId);
        if (oldSession && oldSession.userId === req.userId) {
          await storage.deleteSession(replaceSessionId);
        }
      }

      // Start heartbeat tracking for credit timer
      startTracking(session.id);

      res.json({ sessionId: session.id, companionId: "donna" });
    } else {
      // Anonymous user — create an in-memory session
      const session = anonymousSessions.create(
        faithTradition || "",
        onboardingConcern || "",
        userName || "",
      );

      res.json({ sessionId: session.id, companionId: "donna" });
    }
  }),
);

// POST /api/v1/chat/message — Send message, receive SSE stream
const chatMessageSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(5000),
});

chatRouter.post(
  "/message",
  chatMessageLimiter,
  optionalAuth,
  validate(chatMessageSchema),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const message = sanitizeMessage(req.body.message);

    // For authenticated users, fetch last session summary for returning user context
    let lastSessionSummary: string | undefined;
    if (req.userId) {
      const session = await storage.getSession(sessionId);
      const transcript = (session?.transcript as Array<unknown>) || [];
      // Only fetch summary on the first message of a new session (empty transcript)
      if (transcript.length === 0) {
        const userSessions = await storage.listUserSessions(req.userId);
        const lastEndedSession = userSessions.find(s => {
          if (!s.endedAt || !s.summary) return false;
          if (s.id === sessionId) return false; // skip current session
          const t = (s.transcript as Array<unknown>) || [];
          return t.length >= 2;
        });
        lastSessionSummary = lastEndedSession?.summary || undefined;
      }
    }

    await handleMessage({
      sessionId,
      message,
      userId: req.userId,
      res,
      lastSessionSummary,
    });
  }),
);

// POST /api/v1/chat/end — End session
const chatEndSchema = z.object({
  sessionId: z.string().uuid(),
});

chatRouter.post(
  "/end",
  optionalAuth,
  validate(chatEndSchema),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (!req.userId) {
      // Anonymous session — just remove from memory
      const removed = anonymousSessions.remove(sessionId);
      if (!removed) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json({ durationMinutes: 0, creditsConsumed: 0 });
      return;
    }

    const result = await endSession(sessionId, req.userId);
    res.json(result);
  }),
);

// POST /api/v1/chat/heartbeat — Keep session alive, get remaining credits
const heartbeatSchema = z.object({
  sessionId: z.string().uuid(),
});

chatRouter.post(
  "/heartbeat",
  optionalAuth,
  validate(heartbeatSchema),
  asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    const result = await handleHeartbeat(sessionId, req.userId);
    res.json(result);
  }),
);
