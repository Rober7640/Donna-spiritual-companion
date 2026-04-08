import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error-handler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { authRequestLinkLimiter } from "../middleware/rate-limit";
import * as authService from "../services/auth.service";

export const authRouter = Router();

// POST /api/v1/auth/request-link — Send magic link email
const requestLinkSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

authRouter.post(
  "/request-link",
  authRequestLinkLimiter,
  validate(requestLinkSchema),
  asyncHandler(async (req, res) => {
    try {
      await authService.requestMagicLink(req.body.email);
      res.json({ success: true, message: "Check your email for a sign-in link." });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }),
);

// GET /api/v1/auth/verify — Verify magic link token
authRouter.get(
  "/verify",
  asyncHandler(async (req, res) => {
    const token = req.query.token as string;
    const redirect = req.query.redirect as string;

    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    const result = await authService.verifyToken(token);

    // If redirect parameter provided, redirect to that path with JWT
    if (redirect) {
      const appUrl = process.env.APP_URL || "http://localhost:5000";
      res.redirect(`${appUrl}${redirect}?jwt=${result.jwt}`);
      return;
    }

    // Otherwise return JSON (for API clients)
    res.json({ jwt: result.jwt, userId: result.userId });
  }),
);

// POST /api/v1/auth/convert — Convert anonymous → authenticated
const convertSchema = z.object({
  jwt: z.string(),
  faithTradition: z.string().max(200),
  onboardingConcern: z.string().max(500),
  transcript: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
      timestamp: z.string(),
    }),
  ),
  tempSessionToken: z.string(),
});

authRouter.post(
  "/convert",
  validate(convertSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.convertAnonymous(req.body);
    res.json({
      userId: result.userId,
      sessionId: result.sessionId,
      creditBalance: result.creditBalance,
    });
  }),
);

// POST /api/v1/auth/signup — Option B: Direct signup (no magic link)
const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
  faithTradition: z.string().max(200).optional(),
  onboardingConcern: z.string().max(500).optional(),
});

authRouter.post(
  "/signup",
  authRequestLinkLimiter,
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.directSignup(req.body);
    res.json({
      userId: result.userId,
      tokenHash: result.tokenHash,
      creditBalance: result.creditBalance,
    });
  }),
);

// POST /api/v1/auth/login — Option A: Returning user instant login (no magic link email)
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

authRouter.post(
  "/login",
  authRequestLinkLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    try {
      const result = await authService.loginWithEmail(req.body.email);
      res.json({
        userId: result.userId,
        tokenHash: result.tokenHash,
      });
    } catch (err: any) {
      res.status(404).json({ message: err.message });
    }
  }),
);

// GET /api/v1/auth/me — Get current user profile + balance
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const result = await authService.getMe(req.userId!);
    res.json(result);
  }),
);
