import { sql, and, eq, lt, isNull, isNotNull } from "drizzle-orm";
import { db } from "../db";
import { users, sessions, reengagementLog } from "@shared/schema";
import { storage } from "../storage";
import {
  REENGAGEMENT_COOLDOWN_DAYS,
  REENGAGEMENT_MAX_EMAILS,
} from "@shared/constants";
import type { ReengagementTrigger, TranscriptMessage } from "@shared/types";
import { generateReengagementEmail } from "./claude.service";
import { sendEmail, wrapEmailHtml } from "./email.service";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

interface EligibleUser {
  id: string;
  email: string;
  lastSessionAt: Date;
  lastSessionId: string;
  lastSessionSummary: string | null;
  reengagementCount: number;
  triggerType: ReengagementTrigger;
}

/**
 * Determine which trigger type applies based on user behavior.
 */
function determineTrigger(
  daysSinceLastSession: number,
  reengagementCount: number,
  hasPrayerIntention: boolean,
): ReengagementTrigger {
  if (reengagementCount === 0 && daysSinceLastSession >= 2) {
    return "first_followup";
  }
  if (hasPrayerIntention && daysSinceLastSession >= 7) {
    return "prayer_reminder";
  }
  if (daysSinceLastSession >= 14) {
    return "gentle_reopen";
  }
  return "checkin";
}

/**
 * Find users eligible for re-engagement emails.
 * Criteria:
 * - Has verified email
 * - Not unsubscribed
 * - Not crisis-flagged
 * - Last session > 2 days ago
 * - Not sent a re-engagement email in COOLDOWN_DAYS
 * - Total re-engagement emails < MAX_EMAILS
 */
export async function findEligibleUsers(): Promise<EligibleUser[]> {
  if (!db) {
    console.log("[reengagement] No database — skipping in dev mode");
    return [];
  }

  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - REENGAGEMENT_COOLDOWN_DAYS);

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const eligibleUsers = await db
    .select({
      id: users.id,
      email: users.email,
      lastSessionAt: users.lastSessionAt,
      reengagementCount: users.reengagementCount,
      lastReengagementAt: users.lastReengagementAt,
    })
    .from(users)
    .where(
      and(
        eq(users.emailVerified, true),
        eq(users.unsubscribed, false),
        eq(users.crisisFlagged, false),
        isNotNull(users.lastSessionAt),
        lt(users.lastSessionAt, twoDaysAgo),
        lt(users.reengagementCount, REENGAGEMENT_MAX_EMAILS),
      ),
    );

  const results: EligibleUser[] = [];

  for (const u of eligibleUsers) {
    // Check cooldown
    if (u.lastReengagementAt && u.lastReengagementAt > cooldownDate) {
      continue;
    }

    // Get the user's most recent session
    const userSessions = await storage.listUserSessions(u.id);
    if (userSessions.length === 0) continue;

    const lastSession = userSessions[0];
    const daysSince = Math.floor(
      (Date.now() - new Date(lastSession.startedAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const triggerType = determineTrigger(
      daysSince,
      u.reengagementCount,
      !!lastSession.prayerIntention,
    );

    results.push({
      id: u.id,
      email: u.email,
      lastSessionAt: u.lastSessionAt!,
      lastSessionId: lastSession.id,
      lastSessionSummary: lastSession.summary,
      reengagementCount: u.reengagementCount,
      triggerType,
    });
  }

  return results;
}

/**
 * Generate and send a re-engagement email for a single user.
 */
async function sendReengagementEmail(user: EligibleUser): Promise<void> {
  const appUrl = process.env.APP_URL || "https://benedara.com";
  const unsubscribeUrl = `${appUrl}/api/v1/auth/unsubscribe?userId=${user.id}`;

  // Generate magic link for one-click authentication
  let magicLinkUrl = `${appUrl}/chat`; // Fallback if magic link fails
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: user.email,
        options: {
          redirectTo: `${appUrl}/api/v1/auth/verify?redirect=/chat`,
        },
      });
      if (data?.properties?.action_link) {
        magicLinkUrl = data.properties.action_link;
      }
    } catch (error) {
      console.error(`[reengagement] Failed to generate magic link for ${user.email}:`, error);
      // Continue with fallback URL
    }
  }

  // Generate personalized email body via Haiku
  const emailBody = await generateReengagementEmail({
    userName: user.email.split("@")[0],
    lastSessionSummary: user.lastSessionSummary || "a meaningful conversation",
    triggerType: user.triggerType,
  });

  // Build subject line based on trigger
  const subjects: Record<ReengagementTrigger, string> = {
    first_followup: "Donna has been thinking of you",
    checkin: "How are you doing?",
    prayer_reminder: "A prayer intention from your last visit",
    gentle_reopen: "Benedara is always open",
  };

  const html = wrapEmailHtml(emailBody, magicLinkUrl, unsubscribeUrl);

  await sendEmail({
    to: user.email,
    subject: subjects[user.triggerType],
    html,
  });

  // Record the log entry
  await storage.createReengagementLog({
    userId: user.id,
    sessionId: user.lastSessionId,
    triggerType: user.triggerType,
    emailBody,
  });

  // Update user's re-engagement tracking
  await storage.updateUser(user.id, {
    reengagementCount: user.reengagementCount + 1,
    lastReengagementAt: new Date(),
  });
}

/**
 * Main cron job handler: find eligible users and send re-engagement emails.
 */
export async function runReengagementJob(): Promise<{ sent: number; errors: number }> {
  console.log("[reengagement] Starting daily re-engagement job...");

  const eligible = await findEligibleUsers();
  console.log(`[reengagement] Found ${eligible.length} eligible users`);

  let sent = 0;
  let errors = 0;

  for (const user of eligible) {
    try {
      await sendReengagementEmail(user);
      sent++;
      console.log(`[reengagement] Sent ${user.triggerType} email to ${user.email}`);
    } catch (err) {
      errors++;
      console.error(`[reengagement] Failed for ${user.email}:`, err);
    }
  }

  console.log(`[reengagement] Complete: ${sent} sent, ${errors} errors`);
  return { sent, errors };
}
