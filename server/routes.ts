import type { Express } from "express";
import type { Server } from "http";
import { generalLimiter } from "./middleware/rate-limit";
import { authRouter } from "./routes/auth.routes";
import { chatRouter } from "./routes/chat.routes";
import { creditsRouter } from "./routes/credits.routes";
import { sessionsRouter } from "./routes/sessions.routes";
import { companionsRouter } from "./routes/companions.routes";
import { onboardingRouter } from "./routes/onboarding.routes";
import { adminRouter } from "./routes/admin.routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Apply general rate limiter to all API routes
  app.use("/api", generalLimiter);

  // Mount domain routers under /api/v1/
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/chat", chatRouter);
  app.use("/api/v1/credits", creditsRouter);
  app.use("/api/v1/sessions", sessionsRouter);
  app.use("/api/v1/companions", companionsRouter);
  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/admin", adminRouter);

  return httpServer;
}
