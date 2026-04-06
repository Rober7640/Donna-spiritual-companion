import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import { runReengagementJob } from "../services/reengagement.service";

export const adminRouter = Router();

/**
 * POST /api/v1/admin/trigger-reengagement
 * Manually trigger the re-engagement email job.
 *
 * This is useful for testing without waiting for the cron job.
 *
 * Returns:
 * {
 *   sent: number,      // Number of emails sent successfully
 *   errors: number,    // Number of errors encountered
 *   timestamp: string  // When the job ran
 * }
 */
adminRouter.post(
  "/trigger-reengagement",
  asyncHandler(async (req, res) => {
    console.log("\n🔧 [ADMIN] Manual re-engagement job triggered");

    const startTime = Date.now();
    const result = await runReengagementJob();
    const duration = Date.now() - startTime;

    console.log(`🔧 [ADMIN] Job completed in ${duration}ms: ${result.sent} sent, ${result.errors} errors\n`);

    res.json({
      ...result,
      timestamp: new Date().toISOString(),
      durationMs: duration,
    });
  }),
);

/**
 * GET /api/v1/admin/health
 * Simple health check endpoint.
 */
adminRouter.get(
  "/health",
  asyncHandler(async (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  }),
);
