import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/error-handler";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import * as creditsService from "../services/credits.service";
import * as stripeService from "../services/stripe.service";
import * as paypalService from "../services/paypal.service";

export const creditsRouter = Router();

// Payment provider configuration
const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "stripe"; // "stripe" or "paypal"

// GET /api/v1/credits/balance — Get current credit balance
creditsRouter.get(
  "/balance",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { balanceMinutes, updatedAt } = await creditsService.getBalance(req.userId!);
    res.json({ balanceMinutes, updatedAt: updatedAt.toISOString() });
  }),
);

// POST /api/v1/credits/checkout — Create Stripe checkout session
const checkoutSchema = z.object({
  package: z.enum(["starter", "faithful"]),
  chatSessionId: z.string().uuid().optional(),
});

creditsRouter.post(
  "/checkout",
  requireAuth,
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const checkoutUrl = await stripeService.createCheckoutSession(
      req.userId!,
      req.body.package,
      req.body.chatSessionId,
    );
    res.json({ checkoutUrl });
  }),
);

// POST /api/v1/credits/webhook — Stripe webhook handler
creditsRouter.post(
  "/webhook",
  asyncHandler(async (req, res) => {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).json({ message: "Missing stripe-signature header" });
      return;
    }

    const event = stripeService.verifyWebhook(
      req.rawBody as Buffer,
      signature,
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await stripeService.handleCheckoutComplete(session);
    }

    res.json({ received: true });
  }),
);

// POST /api/v1/credits/verify-session — Verify checkout and fulfill credits (no webhook needed)
const verifySessionSchema = z.object({
  sessionId: z.string(),
});

creditsRouter.post(
  "/verify-session",
  requireAuth,
  validate(verifySessionSchema),
  asyncHandler(async (req, res) => {
    const session = await stripeService.getCheckoutSession(req.body.sessionId);

    if (session.payment_status !== "paid") {
      res.status(400).json({ message: "Payment not completed" });
      return;
    }

    const userId = session.metadata?.userId;
    const packageKey = session.metadata?.packageKey as "starter" | "faithful" | undefined;

    if (!userId || !packageKey) {
      res.status(400).json({ message: "Invalid session metadata" });
      return;
    }

    // Verify the session belongs to this user
    if (userId !== req.userId) {
      res.status(403).json({ message: "Session does not belong to this user" });
      return;
    }

    // fulfillCredits is idempotent — safe to call even if webhook already handled it
    const newBalance = await creditsService.fulfillCredits(userId, packageKey, session.id);

    // Move to AWeber paid list (fire-and-forget)
    const { storage } = await import("../storage");
    const { moveToPayedList } = await import("../services/aweber.service");
    const user = await storage.getUser(userId);
    if (user?.email) {
      const meta = (user.metadata as Record<string, unknown>) || {};
      const displayName = (meta.displayName as string) || undefined;
      moveToPayedList(user.email, displayName, packageKey).catch(() => {});
    }

    res.json({ success: true, balanceMinutes: newBalance });
  }),
);

// GET /api/v1/credits/transactions — List credit transaction history
creditsRouter.get(
  "/transactions",
  requireAuth,
  asyncHandler(async (req, res) => {
    const transactions = await creditsService.getTransactions(req.userId!);
    res.json(
      transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        createdAt: tx.createdAt.toISOString(),
        metadata: tx.metadata,
      })),
    );
  }),
);

// ─── PayPal Routes ───────────────────────────────────────────────────────────

// POST /api/v1/credits/paypal/checkout — Create PayPal order
creditsRouter.post(
  "/paypal/checkout",
  requireAuth,
  validate(checkoutSchema),
  asyncHandler(async (req, res) => {
    const approvalUrl = await paypalService.createOrder(
      req.userId!,
      req.body.package,
    );
    res.json({ checkoutUrl: approvalUrl });
  }),
);

// GET /api/v1/credits/paypal/capture — Capture PayPal order (return URL)
creditsRouter.get(
  "/paypal/capture",
  asyncHandler(async (req, res) => {
    const token = req.query.token as string; // PayPal order ID

    if (!token) {
      res.status(400).json({ message: "Missing PayPal order token" });
      return;
    }

    try {
      await paypalService.captureOrder(token);
      // Redirect to success page
      res.redirect(`/purchase-success?session_id=${token}`);
    } catch (error: any) {
      console.error("PayPal capture failed:", error);
      res.redirect("/dashboard?error=payment_failed");
    }
  }),
);

// POST /api/v1/credits/paypal/webhook — PayPal webhook handler (optional)
creditsRouter.post(
  "/paypal/webhook",
  asyncHandler(async (req, res) => {
    // PayPal webhook verification is more complex
    // For now, we rely on the capture flow above
    // TODO: Implement when needed for additional security
    console.log("PayPal webhook received:", req.body);
    res.json({ received: true });
  }),
);
