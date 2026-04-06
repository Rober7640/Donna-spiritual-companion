/**
 * AWeber Email List Integration
 *
 * Manages two lists:
 *   - Free list: users added on signup (Option B direct signup)
 *   - Paid list: users moved here on Stripe purchase
 *
 * Uses OAuth 2.0 with auto-refresh of access tokens.
 * Refreshed tokens are persisted to .aweber-tokens.json so they
 * survive server restarts (AWeber may rotate refresh tokens).
 *
 * All methods are fire-and-forget safe — errors are logged but never
 * block the calling flow (signup, payment).
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const AWEBER_API = "https://api.aweber.com/1.0";
const TOKEN_URL = "https://auth.aweber.com/oauth2/token";
const TOKEN_FILE = join(process.cwd(), ".aweber-tokens.json");

// Config from env — service degrades gracefully if not set
const config = {
  clientId: process.env.AWEBER_CLIENT_ID || "",
  clientSecret: process.env.AWEBER_CLIENT_SECRET || "",
  accountId: process.env.AWEBER_ACCOUNT_ID || "",
  freeListId: process.env.AWEBER_FREE_LIST_ID || "",
  paidListId: process.env.AWEBER_PAID_LIST_ID || "",
};

// Mutable token state — refreshed automatically when expired
let accessToken = "";
let refreshToken = "";

/**
 * Load tokens: prefer persisted file (has latest refreshed tokens),
 * fall back to .env values (initial setup).
 */
function loadTokens(): void {
  try {
    const raw = readFileSync(TOKEN_FILE, "utf-8");
    const saved = JSON.parse(raw);
    if (saved.accessToken && saved.refreshToken) {
      accessToken = saved.accessToken;
      refreshToken = saved.refreshToken;
      console.log("[AWeber] Loaded tokens from .aweber-tokens.json");
      return;
    }
  } catch {
    // File doesn't exist or is invalid — fall through to env
  }

  accessToken = process.env.AWEBER_ACCESS_TOKEN || "";
  refreshToken = process.env.AWEBER_REFRESH_TOKEN || "";
  if (accessToken) {
    console.log("[AWeber] Loaded tokens from .env");
  }
}

/**
 * Persist current tokens to disk so they survive restarts.
 */
function saveTokens(): void {
  try {
    writeFileSync(
      TOKEN_FILE,
      JSON.stringify(
        { accessToken, refreshToken, updatedAt: new Date().toISOString() },
        null,
        2,
      ),
    );
    console.log("[AWeber] Tokens persisted to .aweber-tokens.json");
  } catch (err) {
    console.error("[AWeber] Failed to persist tokens:", err);
  }
}

// Load tokens on module init
loadTokens();

function isConfigured(): boolean {
  return !!(
    config.clientId &&
    config.clientSecret &&
    config.accountId &&
    config.freeListId &&
    config.paidListId &&
    accessToken &&
    refreshToken
  );
}

/**
 * Refresh the OAuth 2.0 access token using the refresh token.
 * Persists new tokens to disk after a successful refresh.
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    const credentials = Buffer.from(
      `${config.clientId}:${config.clientSecret}`,
    ).toString("base64");

    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      console.error("[AWeber] Token refresh failed:", res.status, await res.text());
      return false;
    }

    const data = await res.json();
    accessToken = data.access_token;
    if (data.refresh_token) {
      refreshToken = data.refresh_token;
    }

    // Persist so new tokens survive server restarts
    saveTokens();

    console.log("[AWeber] Access token refreshed successfully");
    return true;
  } catch (err) {
    console.error("[AWeber] Token refresh error:", err);
    return false;
  }
}

/**
 * Make an authenticated AWeber API request. Retries once on 401 (token expired).
 */
async function aweberFetch(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response | null> {
  try {
    const res = await fetch(`${AWEBER_API}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });

    // Token expired — refresh and retry once
    if (res.status === 401 && !retried) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return aweberFetch(path, options, true);
      }
    }

    return res;
  } catch (err) {
    console.error("[AWeber] API request failed:", err);
    return null;
  }
}

/**
 * Add a subscriber to a specific AWeber list.
 */
async function addSubscriber(
  listId: string,
  params: { email: string; name?: string; tags?: string[] },
): Promise<boolean> {
  const body: Record<string, unknown> = {
    email: params.email,
    update_existing: true,
  };
  if (params.name) body.name = params.name;
  if (params.tags?.length) body.tags = params.tags;

  const res = await aweberFetch(
    `/accounts/${config.accountId}/lists/${listId}/subscribers`,
    { method: "POST", body: JSON.stringify(body) },
  );

  if (!res) return false;

  if (res.status === 201 || res.status === 200) {
    console.log(`[AWeber] Subscriber added to list ${listId}: ${params.email}`);
    return true;
  }

  // 209 = already subscribed (not an error)
  if (res.status === 209) {
    console.log(`[AWeber] Subscriber already on list ${listId}: ${params.email}`);
    return true;
  }

  const errText = await res.text();
  console.error(`[AWeber] Failed to add subscriber (${res.status}):`, errText);
  return false;
}

/**
 * Find a subscriber on a specific list by email. Returns subscriber self_link or null.
 */
async function findSubscriber(
  listId: string,
  email: string,
): Promise<string | null> {
  const res = await aweberFetch(
    `/accounts/${config.accountId}/lists/${listId}/subscribers?ws.op=find&email=${encodeURIComponent(email)}`,
  );

  if (!res || !res.ok) return null;

  const data = await res.json();
  const entries = data.entries;
  if (entries && entries.length > 0) {
    return entries[0].self_link || null;
  }
  return null;
}

/**
 * Remove (unsubscribe) a subscriber from a specific list.
 */
async function removeSubscriber(subscriberLink: string): Promise<boolean> {
  // subscriberLink is a full URL like https://api.aweber.com/1.0/accounts/.../lists/.../subscribers/...
  try {
    const res = await fetch(subscriberLink, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ status: "unsubscribed" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * Add user to the FREE list. Called on Option B signup.
 * Fire-and-forget safe — never throws.
 */
export async function addToFreeList(email: string, name?: string): Promise<void> {
  if (!isConfigured()) {
    console.log("[AWeber] Not configured — skipping addToFreeList");
    return;
  }

  try {
    await addSubscriber(config.freeListId, {
      email,
      name,
      tags: ["free_trial", "option_b_signup"],
    });
  } catch (err) {
    console.error("[AWeber] addToFreeList error:", err);
  }
}

/**
 * Add user to PAID list. Called on Stripe purchase.
 * User remains subscribed on the free list as well.
 * Fire-and-forget safe — never throws.
 */
export async function moveToPayedList(email: string, name?: string, packageKey?: string): Promise<void> {
  if (!isConfigured()) {
    console.log("[AWeber] Not configured — skipping moveToPayedList");
    return;
  }

  try {
    // Add to paid list (keep free list subscription intact)
    const tags = ["customer"];
    if (packageKey) tags.push(`package_${packageKey}`);

    await addSubscriber(config.paidListId, { email, name, tags });
  } catch (err) {
    console.error("[AWeber] moveToPayedList error:", err);
  }
}
