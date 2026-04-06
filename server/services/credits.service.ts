import { sql } from "drizzle-orm";
import { db } from "../db";
import { creditBalances } from "@shared/schema";
import { storage } from "../storage";
import { CREDIT_PACKAGES, type CreditPackageKey } from "@shared/constants";

/**
 * Get or create credit balance for a user.
 */
export async function getBalance(userId: string): Promise<{ balanceMinutes: number; updatedAt: Date }> {
  const balance = await storage.getCreditBalance(userId);
  if (!balance) {
    return { balanceMinutes: 0, updatedAt: new Date() };
  }
  return { balanceMinutes: balance.balanceMinutes, updatedAt: balance.updatedAt };
}

/**
 * Grant free trial credits — only once per user.
 * Returns the new balance or null if trial was already granted.
 */
export async function grantFreeTrial(userId: string): Promise<number | null> {
  const existing = await storage.getCreditBalance(userId);
  if (existing) return null;

  const minutes = CREDIT_PACKAGES.free_trial.minutes;

  await storage.createCreditBalance({
    userId,
    balanceMinutes: minutes,
    updatedAt: new Date(),
  });

  await storage.createCreditTransaction({
    userId,
    type: "free_trial",
    amount: minutes,
    metadata: { package: "free_trial" },
  });

  return minutes;
}

/**
 * Atomic credit deduction. Uses raw SQL when Postgres is available,
 * falls back to storage-level update for in-memory dev mode.
 */
export async function deductCredits(
  userId: string,
  minutes: number,
): Promise<number> {
  if (minutes <= 0) throw new Error("Deduction amount must be positive");

  let newBalance: number;

  if (db) {
    // Atomic Postgres deduction with WHERE guard
    const result = await db
      .update(creditBalances)
      .set({
        balanceMinutes: sql`${creditBalances.balanceMinutes} - ${minutes}`,
        updatedAt: new Date(),
      })
      .where(
        sql`${creditBalances.userId} = ${userId} AND ${creditBalances.balanceMinutes} >= ${minutes}`,
      )
      .returning();

    if (result.length === 0) {
      throw new Error("Insufficient credits");
    }
    newBalance = result[0].balanceMinutes;
  } else {
    // In-memory fallback
    const balance = await storage.getCreditBalance(userId);
    if (!balance || balance.balanceMinutes < minutes) {
      throw new Error("Insufficient credits");
    }
    const updated = await storage.updateCreditBalance(userId, balance.balanceMinutes - minutes);
    newBalance = updated?.balanceMinutes ?? 0;
  }

  await storage.createCreditTransaction({
    userId,
    type: "deduction",
    amount: -minutes,
    metadata: { deductedMinutes: minutes },
  });

  return newBalance;
}

/**
 * Add credits after a purchase. Idempotent via stripeSessionId check.
 */
export async function fulfillCredits(
  userId: string,
  packageKey: CreditPackageKey,
  stripeSessionId: string,
): Promise<number> {
  // Idempotency: check if this stripe session was already fulfilled
  const existingTxs = await storage.listCreditTransactions(userId);
  const alreadyFulfilled = existingTxs.some(
    (tx) => tx.stripeSessionId === stripeSessionId,
  );
  if (alreadyFulfilled) {
    const balance = await storage.getCreditBalance(userId);
    return balance?.balanceMinutes ?? 0;
  }

  const pkg = CREDIT_PACKAGES[packageKey];
  if (!pkg) throw new Error(`Unknown package: ${packageKey}`);

  // Auto-expire any remaining trial credits before adding purchased credits
  // This prevents stale trial minutes inflating the purchased balance
  await checkTrialExpiration(userId);

  // Ensure balance row exists
  let balance = await storage.getCreditBalance(userId);
  if (!balance) {
    balance = await storage.createCreditBalance({
      userId,
      balanceMinutes: 0,
      updatedAt: new Date(),
    });
  }

  let newBalance: number;

  if (db) {
    // Atomic Postgres addition
    const [updated] = await db
      .update(creditBalances)
      .set({
        balanceMinutes: sql`${creditBalances.balanceMinutes} + ${pkg.minutes}`,
        updatedAt: new Date(),
      })
      .where(sql`${creditBalances.userId} = ${userId}`)
      .returning();
    newBalance = updated.balanceMinutes;
  } else {
    // In-memory fallback
    const updated = await storage.updateCreditBalance(userId, balance.balanceMinutes + pkg.minutes);
    newBalance = updated?.balanceMinutes ?? 0;
  }

  await storage.createCreditTransaction({
    userId,
    type: "purchase",
    amount: pkg.minutes,
    stripeSessionId,
    metadata: { package: packageKey, priceUsd: pkg.priceUsd },
  });

  return newBalance;
}

/**
 * Check current credit balance for a user.
 * Returns the current balance (deductions handled by heartbeat only).
 */
export async function checkTrialExpiration(userId: string): Promise<number> {
  const balance = await storage.getCreditBalance(userId);
  return balance?.balanceMinutes ?? 0;
}

/**
 * Check if user has enough credits to continue chatting.
 */
export async function hasCredits(userId: string): Promise<boolean> {
  const balance = await storage.getCreditBalance(userId);
  return (balance?.balanceMinutes ?? 0) > 0;
}

/**
 * Get transaction history for a user.
 */
export async function getTransactions(userId: string) {
  return storage.listCreditTransactions(userId);
}
