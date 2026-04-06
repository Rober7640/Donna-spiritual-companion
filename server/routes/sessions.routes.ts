import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error-handler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import * as sessionService from "../services/session.service";

export const sessionsRouter = Router();

// GET /api/v1/sessions — List past sessions
sessionsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const sessions = await sessionService.listSessions(req.userId!);
    res.json(sessions);
  }),
);

// GET /api/v1/sessions/:id — Get session detail with transcript
sessionsRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const detail = await sessionService.getSessionDetail(req.params.id as string, req.userId!);
    if (!detail) {
      res.status(404).json({ message: "Session not found" });
      return;
    }
    res.json(detail);
  }),
);

// POST /api/v1/sessions/:id/rate — Submit session rating
const rateSchema = z.object({
  rating: z.enum(["helpful", "not_helpful"]),
});

sessionsRouter.post(
  "/:id/rate",
  requireAuth,
  validate(rateSchema),
  asyncHandler(async (req, res) => {
    const success = await sessionService.rateSession(
      req.params.id as string,
      req.userId!,
      req.body.rating,
    );

    if (!success) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    res.json({ success: true });
  }),
);
