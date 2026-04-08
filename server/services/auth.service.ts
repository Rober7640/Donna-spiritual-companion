import { createClient } from "@supabase/supabase-js";
import { storage } from "../storage";
import { CREDIT_PACKAGES } from "@shared/constants";
import * as aweber from "./aweber.service";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

function getSupabase() {
  if (!supabaseAdmin) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabaseAdmin;
}

export async function requestMagicLink(email: string): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.APP_URL || "http://localhost:5000"}/login`,
    },
  });

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }
}

export async function verifyToken(token: string): Promise<{ userId: string; jwt: string }> {
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Invalid or expired token");
  }

  // Ensure user exists in our database
  let user = await storage.getUserByEmail(data.user.email!);
  if (!user) {
    user = await storage.createUser({ email: data.user.email! });
  }

  // Mark email as verified
  if (!user.emailVerified) {
    await storage.updateUser(user.id, { emailVerified: true });
  }

  return { userId: user.id, jwt: token };
}

export async function convertAnonymous(params: {
  jwt: string;
  faithTradition: string;
  onboardingConcern: string;
  transcript: Array<{ role: string; content: string; timestamp: string }>;
  tempSessionToken: string;
}): Promise<{ userId: string; sessionId: string; creditBalance: number }> {
  const supabase = getSupabase();

  // Verify the JWT
  const { data, error } = await supabase.auth.getUser(params.jwt);
  if (error || !data.user) {
    throw new Error("Invalid or expired token");
  }

  const email = data.user.email!;

  // Create or get user
  let user = await storage.getUserByEmail(email);
  if (!user) {
    user = await storage.createUser({
      email,
      faithTradition: params.faithTradition,
      onboardingConcern: params.onboardingConcern,
    });
  } else {
    await storage.updateUser(user.id, {
      faithTradition: params.faithTradition,
      onboardingConcern: params.onboardingConcern,
      emailVerified: true,
    });
  }

  // Create credit balance with free trial
  const existingBalance = await storage.getCreditBalance(user.id);
  let creditBalance: number = CREDIT_PACKAGES.free_trial.minutes;

  if (!existingBalance) {
    await storage.createCreditBalance({
      userId: user.id,
      balanceMinutes: creditBalance,
      updatedAt: new Date(),
    });

    // Record free trial transaction
    await storage.createCreditTransaction({
      userId: user.id,
      type: "free_trial",
      amount: creditBalance,
      metadata: { package: "free_trial" },
    });
  } else {
    creditBalance = existingBalance.balanceMinutes;
  }

  // Create session with transcript
  const session = await storage.createSession({
    userId: user.id,
    companionId: "donna",
    transcript: params.transcript,
    metadata: { convertedFromAnonymous: true },
  });

  // Update last session timestamp
  await storage.updateUser(user.id, { lastSessionAt: new Date() });

  return {
    userId: user.id,
    sessionId: session.id,
    creditBalance,
  };
}

/**
 * Option B: Direct signup — create account immediately without magic link.
 * Creates Supabase user (email pre-confirmed), creates DB user, grants free trial.
 * Returns a token_hash the client can use with supabase.auth.verifyOtp() to get a real session.
 */
export async function directSignup(params: {
  email: string;
  name?: string;
  faithTradition?: string;
  onboardingConcern?: string;
}): Promise<{ userId: string; tokenHash: string; creditBalance: number }> {
  const supabase = getSupabase();

  // 1. Create Supabase auth user (or get existing one)
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
  const existingSupaUser = listError ? null : existingUsers?.users?.find(u => u.email === params.email);

  if (!existingSupaUser) {
    const { error: createError } = await supabase.auth.admin.createUser({
      email: params.email,
      email_confirm: true,
    });
    if (createError && !createError.message.includes("already been registered")) {
      throw new Error(`Failed to create auth user: ${createError.message}`);
    }
  }

  // 2. Generate a magic link token (not sent via email — we just need the token_hash)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: params.email,
  });
  if (linkError || !linkData) {
    throw new Error(`Failed to generate auth token: ${linkError?.message}`);
  }

  const tokenHash = linkData.properties.hashed_token;

  // 3. Create or get DB user
  let user = await storage.getUserByEmail(params.email);
  if (!user) {
    user = await storage.createUser({
      email: params.email,
      faithTradition: params.faithTradition || null,
      onboardingConcern: params.onboardingConcern || null,
    });
  } else {
    // Update with latest onboarding data
    await storage.updateUser(user.id, {
      faithTradition: params.faithTradition || user.faithTradition,
      onboardingConcern: params.onboardingConcern || user.onboardingConcern,
    });
  }

  // Store name and trial expiration in metadata
  const existingMeta = (user.metadata as Record<string, unknown>) || {};
  const metaUpdate: Record<string, unknown> = { ...existingMeta };
  if (params.name) {
    metaUpdate.displayName = params.name;
  }
  await storage.updateUser(user.id, { metadata: metaUpdate, emailVerified: true });

  // 4. Grant free trial credits (only if no existing balance)
  const existingBalance = await storage.getCreditBalance(user.id);
  let creditBalance: number = CREDIT_PACKAGES.free_trial.minutes;

  if (!existingBalance) {
    await storage.createCreditBalance({
      userId: user.id,
      balanceMinutes: creditBalance,
      updatedAt: new Date(),
    });

    await storage.createCreditTransaction({
      userId: user.id,
      type: "free_trial",
      amount: creditBalance,
      metadata: { package: "free_trial", source: "option_b_signup" },
    });
  } else {
    creditBalance = existingBalance.balanceMinutes;
  }

  // 5. Add to AWeber free list (fire-and-forget — never blocks signup)
  aweber.addToFreeList(params.email, params.name).catch(() => {});

  return {
    userId: user.id,
    tokenHash,
    creditBalance,
  };
}

export async function getMe(userId: string) {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const balance = await storage.getCreditBalance(userId);
  const meta = (user.metadata as Record<string, unknown>) || {};
  const balanceMinutes = balance?.balanceMinutes ?? 0;

  // Get last session summary for returning users (only from sessions with actual messages)
  const userSessions = await storage.listUserSessions(userId);
  const lastEndedSession = userSessions.find(s => {
    if (!s.endedAt || !s.summary) return false;
    const transcript = (s.transcript as Array<unknown>) || [];
    return transcript.length >= 2;
  });
  const lastSessionSummary = lastEndedSession?.summary || null;

  return {
    userId: user.id,
    email: user.email,
    displayName: (meta.displayName as string) || null,
    balanceMinutes,
    faithTradition: user.faithTradition,
    onboardingConcern: user.onboardingConcern,
    trialExpiresAt: null,
    lastSessionSummary,
  };
}

/**
 * Option A: Returning user login — instant email-based login (no magic link email sent).
 * Checks if user exists, generates a token hash for immediate session establishment.
 */
export async function loginWithEmail(email: string): Promise<{ tokenHash: string; userId: string }> {
  const supabase = getSupabase();

  // 1. Check if user exists in our DB
  const user = await storage.getUserByEmail(email);
  if (!user) {
    throw new Error("No account found with this email. Please sign up first.");
  }

  // 2. Generate a magic link token hash (not sent via email — used for instant OTP verification)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (linkError || !linkData) {
    throw new Error(`Failed to generate auth token: ${linkError?.message}`);
  }

  return {
    tokenHash: linkData.properties.hashed_token,
    userId: user.id,
  };
}
