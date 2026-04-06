import rateLimit from "express-rate-limit";
import { RATE_LIMITS } from "@shared/constants";

export const generalLimiter = rateLimit({
  windowMs: RATE_LIMITS.general.windowMs,
  max: RATE_LIMITS.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

export const authRequestLinkLimiter = rateLimit({
  windowMs: RATE_LIMITS.authRequestLink.windowMs,
  max: RATE_LIMITS.authRequestLink.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later." },
});

export const chatMessageLimiter = rateLimit({
  windowMs: RATE_LIMITS.chatMessage.windowMs,
  max: RATE_LIMITS.chatMessage.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Please slow down. Marie is still here." },
});
