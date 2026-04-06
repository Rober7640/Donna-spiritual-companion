import type { UserSignal } from "./types";

// ─── Credit Packages ─────────────────────────────────────────────

export const CREDIT_PACKAGES = {
  free_trial: {
    name: "Free Trial",
    minutes: 5, // Option B: 5-minute free trial
    priceUsd: 0,
    stripePriceId: null as string | null,
  },
  starter: {
    name: "Starter",
    minutes: 30,
    priceUsd: 14.99,
    stripePriceId: null as string | null,
  },
  faithful: {
    name: "Faithful",
    minutes: 90,
    priceUsd: 39.99,
    stripePriceId: null as string | null,
  },
} as const;

export type CreditPackageKey = keyof typeof CREDIT_PACKAGES;

// ─── Email Gate ──────────────────────────────────────────────────
// Gate is now depth-based (assistant message count), configured
// directly in use-email-gate.ts. No timing constants needed.

export const ANONYMOUS_SESSION_HARD_CAP_SECONDS = 600; // 10 minutes
export const ANONYMOUS_SESSION_EXPIRE_MS = 30 * 60 * 1000; // 30 minutes

// ─── Signal Priority (highest → lowest) ──────────────────────────

export const SIGNAL_PRIORITY: UserSignal[] = [
  "CRISIS",
  "QUESTIONING_MARIE",
  "WANTS_TO_LEAVE",
  "FEELING_BETTER",
  "ASKING_FOR_PRAYER",
  "DOUBTING_FAITH",
  "STUCK",
  "GOING_DEEPER",
  "CONTINUE",
];

// ─── Chat / Session Constants ────────────────────────────────────

export const HEARTBEAT_INTERVAL_MS = 60_000;       // Client sends heartbeat every 60s
export const HEARTBEAT_TIMEOUT_MS = 3 * 60_000;    // No heartbeat for 3 min = auto-pause
export const MAX_ANONYMOUS_SESSIONS_PER_IP = 3;     // Per 24 hours

// ─── Rate Limiting ───────────────────────────────────────────────

export const RATE_LIMITS = {
  general: { windowMs: 15 * 60 * 1000, max: 100 },
  authRequestLink: { windowMs: 60 * 60 * 1000, max: 5 },
  chatMessage: { windowMs: 60 * 1000, max: 10 },
} as const;

// ─── Re-engagement ───────────────────────────────────────────────

export const REENGAGEMENT_COOLDOWN_DAYS = 7;
export const REENGAGEMENT_MAX_EMAILS = 4;

// ─── Crisis Resources ────────────────────────────────────────────

export const CRISIS_RESOURCES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    action: "Call or text 988",
    url: "https://988lifeline.org",
  },
  {
    name: "Crisis Text Line",
    action: "Text HOME to 741741",
    url: "https://www.crisistextline.org",
  },
  {
    name: "National Domestic Violence Hotline",
    action: "Call 1-800-799-7233",
    url: "https://www.thehotline.org",
  },
] as const;
