import Stripe from "stripe";
import { CREDIT_PACKAGES, type CreditPackageKey } from "@shared/constants";
import * as creditsService from "./credits.service";
import * as aweber from "./aweber.service";
import { storage } from "../storage";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey ? new Stripe(stripeKey) : null;

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  }
  return stripe;
}

// Stripe price IDs from env (server-only)
const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_STARTER_PRICE_ID,
  faithful: process.env.STRIPE_FAITHFUL_PRICE_ID,
};

/**
 * Create a Stripe Checkout session for a credit package purchase.
 */
export async function createCheckoutSession(
  userId: string,
  packageKey: "starter" | "faithful",
): Promise<string> {
  const s = getStripe();
  const pkg = CREDIT_PACKAGES[packageKey];
  const priceId = STRIPE_PRICE_IDS[packageKey];
  if (!pkg || !priceId) {
    throw new Error(`Invalid package or missing price ID: ${packageKey}`);
  }

  const appUrl = process.env.APP_URL || "http://localhost:5000";

  const productName = `Donna — ${pkg.name} (${pkg.minutes} minutes)`;

  const session = await s.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      packageKey,
      app: "donna",
      product: productName,
    },
    payment_intent_data: {
      description: productName,
      statement_descriptor_suffix: "DONNA",
      metadata: {
        app: "donna",
        userId,
        packageKey,
      },
    },
    success_url: `${appUrl}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard`,
  });

  return session.url!;
}

/**
 * Verify and parse a Stripe webhook event.
 */
export function verifyWebhook(payload: Buffer, signature: string): Stripe.Event {
  const s = getStripe();
  if (!WEBHOOK_SECRET) {
    throw new Error("Stripe webhook secret not configured");
  }
  return s.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
}

/**
 * Handle a fulfilled checkout session — add credits to user.
 * Idempotent: safe to call multiple times for the same session.
 */
export async function handleCheckoutComplete(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId;
  const packageKey = session.metadata?.packageKey as CreditPackageKey | undefined;

  if (!userId || !packageKey) {
    console.error("Webhook missing metadata:", session.id);
    return;
  }

  await creditsService.fulfillCredits(userId, packageKey, session.id);

  // Move user to AWeber paid list (fire-and-forget)
  const user = await storage.getUser(userId);
  if (user?.email) {
    const meta = (user.metadata as Record<string, unknown>) || {};
    const displayName = (meta.displayName as string) || undefined;
    aweber.moveToPayedList(user.email, displayName, packageKey).catch(() => {});
  }
}

/**
 * Retrieve a checkout session to confirm purchase status.
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.retrieve(sessionId);
}
