import { CREDIT_PACKAGES, type CreditPackageKey } from "@shared/constants";
import * as creditsService from "./credits.service";

// PayPal SDK imports
import * as PayPalSDK from "@paypal/paypal-server-sdk";

const { Client, Environment } = PayPalSDK;

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox"; // "sandbox" or "live"

let paypalClient: Client | null = null;

function getPayPalClient(): Client {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  if (!paypalClient) {
    paypalClient = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: PAYPAL_CLIENT_ID,
        oAuthClientSecret: PAYPAL_CLIENT_SECRET,
      },
      environment: PAYPAL_MODE === "live" ? Environment.Production : Environment.Sandbox,
    });
  }

  return paypalClient;
}

/**
 * Create a PayPal Order for a credit package purchase.
 * Returns the approval URL where the user should be redirected.
 */
export async function createOrder(
  userId: string,
  packageKey: "starter" | "faithful",
): Promise<string> {
  const client = getPayPalClient();
  const pkg = CREDIT_PACKAGES[packageKey];

  if (!pkg) {
    throw new Error(`Invalid package: ${packageKey}`);
  }

  const appUrl = process.env.APP_URL || "http://localhost:5000";

  try {
    const { result, ...response } = await client.orders.ordersCreate({
      body: {
        intent: "CAPTURE",
        purchaseUnits: [
          {
            amount: {
              currencyCode: "USD",
              value: pkg.priceUsd.toFixed(2),
            },
            description: `${pkg.name} - ${pkg.minutes} minutes`,
            customId: `${userId}|${packageKey}`, // Store metadata
          },
        ],
        applicationContext: {
          brandName: "Benedara",
          landingPage: "BILLING",
          userAction: "PAY_NOW",
          returnUrl: `${appUrl}/api/v1/credits/paypal/capture`,
          cancelUrl: `${appUrl}/dashboard`,
        },
      },
    });

    // Find the approval URL
    const approvalUrl = result?.links?.find((link) => link.rel === "approve")?.href;

    if (!approvalUrl) {
      throw new Error("No approval URL found in PayPal order response");
    }

    console.log(`✅ PayPal order created: ${result?.id} for user ${userId}`);
    return approvalUrl;
  } catch (error: any) {
    console.error("PayPal order creation error:", error);
    throw new Error(`Failed to create PayPal order: ${error.message || error}`);
  }
}

/**
 * Capture a PayPal order after user approves it.
 * This is called when user returns from PayPal.
 */
export async function captureOrder(orderId: string): Promise<void> {
  const client = getPayPalClient();

  try {
    const { result } = await client.orders.ordersCapture({
      id: orderId,
    });

    if (result?.status !== "COMPLETED") {
      throw new Error(`PayPal capture failed. Status: ${result?.status}`);
    }

    // Extract metadata from purchase_units
    const customId = result?.purchaseUnits?.[0]?.payments?.captures?.[0]?.customId;

    if (!customId) {
      console.error("No custom_id found in PayPal capture:", orderId);
      return;
    }

    const [userId, packageKey] = customId.split("|");

    if (!userId || !packageKey) {
      console.error("Invalid custom_id format:", customId);
      return;
    }

    // Add credits to user (idempotent - safe to call multiple times)
    await creditsService.fulfillCredits(userId, packageKey as CreditPackageKey, orderId);

    console.log(`✅ PayPal order captured: ${orderId} for user ${userId}`);
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    throw new Error(`Failed to capture PayPal order: ${error.message || error}`);
  }
}

/**
 * Get order details (for verification or status checking).
 */
export async function getOrderDetails(orderId: string): Promise<any> {
  const client = getPayPalClient();

  try {
    const { result } = await client.orders.ordersGet({
      id: orderId,
    });

    return result;
  } catch (error: any) {
    console.error("PayPal get order error:", error);
    throw new Error(`Failed to get PayPal order: ${error.message || error}`);
  }
}

/**
 * Verify webhook signature (for webhook-based payment confirmation).
 * Note: This requires additional setup in PayPal dashboard.
 */
export function verifyWebhookSignature(
  payload: string,
  headers: Record<string, string>,
): boolean {
  // PayPal webhook verification is more complex than Stripe
  // Requires webhook ID from dashboard and certificate verification
  // For now, we'll rely on order capture flow instead
  // TODO: Implement when webhooks are set up
  console.warn("PayPal webhook verification not yet implemented");
  return true;
}
