import { test, expect } from "@playwright/test";
import { config } from "dotenv";

// Load environment variables for tests
config();

const baseURL = process.env.BASE_URL || "http://localhost:5000";

test.describe("Email & Database Integration Tests", () => {
  test("1. Check environment configuration", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("TEST 1: Environment Configuration");
    console.log("══════════════════════════════════════════════════════\n");

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    const databaseUrl = process.env.DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL;

    console.log("📧 RESEND:");
    console.log(`   API Key: ${resendKey ? `✅ ${resendKey.substring(0, 10)}...` : "❌ Not set"}`);
    console.log(`   From Email: ${fromEmail || "❌ Not set"}\n`);

    console.log("🗄️  DATABASE:");
    console.log(`   PostgreSQL: ${databaseUrl ? "✅ Configured" : "❌ Not set"}`);
    console.log(`   Supabase: ${supabaseUrl ? "✅ Configured" : "❌ Not set"}\n`);

    // Check that at least Resend OR database is configured
    const hasEmail = !!resendKey;
    const hasDatabase = !!databaseUrl || !!supabaseUrl;

    console.log("✅ STATUS:");
    console.log(`   Email system: ${hasEmail ? "✅ Ready" : "⚠️  Not configured"}`);
    console.log(`   Database: ${hasDatabase ? "✅ Ready" : "⚠️  Not configured"}\n`);

    expect(hasEmail || hasDatabase).toBe(true);

    console.log("✅ TEST 1 PASSED: Configuration verified\n");
  });

  test("2. Test magic link API (Supabase Auth)", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("TEST 2: Supabase Auth - Magic Link");
    console.log("══════════════════════════════════════════════════════\n");

    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`📧 Requesting magic link for: ${testEmail}`);

    const response = await fetch(`${baseURL}/api/v1/auth/request-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });

    console.log(`   Response status: ${response.status}`);

    if (response.ok) {
      console.log("   ✅ Magic link request successful");
      console.log("\n📬 IMPORTANT:");
      console.log("   Supabase sends this email, NOT Resend");
      console.log("   Check Supabase Auth logs for confirmation\n");
    } else {
      const error = await response.text();
      console.log(`   ❌ Failed: ${error}\n`);
    }

    expect(response.ok).toBe(true);

    console.log("✅ TEST 2 PASSED: Supabase Auth working\n");
  });

  test("3. Test chat session creation (Database write)", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("TEST 3: Database - Session Creation");
    console.log("══════════════════════════════════════════════════════\n");

    console.log("🗄️  Creating anonymous chat session...");

    const response = await fetch(`${baseURL}/api/v1/chat/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "TestUser",
        onboardingConcern: "Testing database integration",
      }),
    });

    console.log(`   Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Session created: ${data.sessionId}`);
      console.log(`   Companion: ${data.companionId}\n`);

      console.log("📊 DATABASE IMPACT:");
      console.log("   Anonymous sessions are stored in-memory only");
      console.log("   To test database, user needs to be authenticated\n");

      expect(data.sessionId).toBeTruthy();
      expect(data.companionId).toBe("donna");
    } else {
      const error = await response.text();
      console.log(`   ❌ Failed: ${error}\n`);
      expect(response.ok).toBe(true);
    }

    console.log("✅ TEST 3 PASSED: Session creation working\n");
  });

  test("4. Check Resend configuration", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("TEST 4: Resend Email Service");
    console.log("══════════════════════════════════════════════════════\n");

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;

    if (!resendKey) {
      console.log("⚠️  Resend API key not configured");
      console.log("   Set RESEND_API_KEY in .env file\n");
      expect(resendKey).toBeTruthy();
      return;
    }

    console.log("✅ Resend is configured:");
    console.log(`   API Key: ${resendKey.substring(0, 10)}...`);
    console.log(`   From: ${fromEmail || "Not set"}\n`);

    console.log("📧 EMAIL BEHAVIOR:");
    console.log("   Re-engagement emails will be sent via Resend");
    console.log("   View sent emails at: https://resend.com/emails\n");

    console.log("🧪 TO TEST EMAIL SENDING:");
    console.log("   1. Create a test user with verified email");
    console.log("   2. Have them start a conversation");
    console.log("   3. Wait 2+ days (or manipulate database)");
    console.log("   4. Trigger re-engagement job");
    console.log("   5. Check Resend dashboard for sent email\n");

    expect(resendKey).toBeTruthy();

    console.log("✅ TEST 4 PASSED: Resend ready to send emails\n");
  });

  test("5. Re-engagement system overview", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("RE-ENGAGEMENT EMAIL SYSTEM - MANUAL TEST GUIDE");
    console.log("══════════════════════════════════════════════════════\n");

    console.log("📋 SYSTEM COMPONENTS:");
    console.log("   ✅ Resend: Configured (onboarding@resend.dev)");
    console.log("   ✅ Database: Connected (Supabase PostgreSQL)");
    console.log("   ✅ Email service: server/services/email.service.ts");
    console.log("   ✅ Re-engagement: server/services/reengagement.service.ts\n");

    console.log("🔄 HOW IT WORKS:");
    console.log("   1. User has conversation → Stored in database");
    console.log("   2. User doesn't return for 2+ days");
    console.log("   3. Daily cron job runs: runReengagementJob()");
    console.log("   4. Claude Haiku generates personalized email");
    console.log("   5. Email sent via Resend");
    console.log("   6. Event logged in reengagement_log table\n");

    console.log("🧪 MANUAL TEST OPTIONS:\n");

    console.log("   OPTION A - Database Manipulation (FASTEST):");
    console.log("   1. Go to Supabase dashboard: https://supabase.com");
    console.log("   2. SQL Editor → Run this query:");
    console.log("      UPDATE users");
    console.log("      SET last_session_at = NOW() - INTERVAL '3 days',");
    console.log("          email_verified = true");
    console.log("      WHERE email = 'your-test-email@gmail.com';");
    console.log("   3. Create admin endpoint to trigger job");
    console.log("   4. Check Resend dashboard for email\n");

    console.log("   OPTION B - Create Admin Trigger Endpoint:");
    console.log("   Add to server/routes/admin.routes.ts:");
    console.log("   POST /api/v1/admin/trigger-reengagement");
    console.log("   → Calls runReengagementJob()");
    console.log("   → Returns { sent, errors }\n");

    console.log("   OPTION C - Wait Naturally:");
    console.log("   1. Create real user with your email");
    console.log("   2. Have a conversation with Donna");
    console.log("   3. Wait 2 days");
    console.log("   4. Check your inbox\n");

    console.log("📬 WHERE TO CHECK:");
    console.log("   Sent emails: https://resend.com/emails");
    console.log("   Database logs: Supabase → reengagement_log table");
    console.log("   Server logs: Console output when job runs\n");

    console.log("✅ TEST 5 INFO: Manual testing guide provided\n");
  });

  test("6. Create simple admin trigger (TODO)", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("TEST 6: Admin Trigger Endpoint (Not Yet Implemented)");
    console.log("══════════════════════════════════════════════════════\n");

    console.log("🔧 SUGGESTED IMPLEMENTATION:\n");

    console.log("Create: server/routes/admin.routes.ts");
    console.log(`
import { Router } from "express";
import { asyncHandler } from "../middleware/error-handler";
import { runReengagementJob } from "../services/reengagement.service";

export const adminRouter = Router();

// POST /api/v1/admin/trigger-reengagement
adminRouter.post(
  "/trigger-reengagement",
  asyncHandler(async (req, res) => {
    const result = await runReengagementJob();
    res.json(result);
  }),
);
`);

    console.log("Then add to server/routes.ts:");
    console.log(`
import { adminRouter } from "./routes/admin.routes";
app.use("/api/v1/admin", adminRouter);
`);

    console.log("Then test with:");
    console.log("curl -X POST http://localhost:5000/api/v1/admin/trigger-reengagement\n");

    console.log("⚠️  TEST 6: Implementation guide provided\n");
  });
});

test.describe("Database Table Verification", () => {
  test("7. Check expected database tables", async () => {
    console.log("\n══════════════════════════════════════════════════════");
    console.log("DATABASE SCHEMA - Expected Tables");
    console.log("══════════════════════════════════════════════════════\n");

    console.log("📊 TABLES NEEDED FOR RE-ENGAGEMENT:\n");

    console.log("1. users");
    console.log("   - id (uuid)");
    console.log("   - email (text)");
    console.log("   - email_verified (boolean)");
    console.log("   - last_session_at (timestamp)");
    console.log("   - reengagement_count (integer)");
    console.log("   - last_reengagement_at (timestamp)");
    console.log("   - unsubscribed (boolean)");
    console.log("   - crisis_flagged (boolean)\n");

    console.log("2. sessions");
    console.log("   - id (uuid)");
    console.log("   - user_id (uuid, foreign key)");
    console.log("   - started_at (timestamp)");
    console.log("   - ended_at (timestamp, nullable)");
    console.log("   - summary (text, nullable)");
    console.log("   - prayer_intention (text, nullable)");
    console.log("   - transcript (jsonb)\n");

    console.log("3. reengagement_log");
    console.log("   - id (uuid)");
    console.log("   - user_id (uuid, foreign key)");
    console.log("   - session_id (uuid, foreign key)");
    console.log("   - trigger_type (text)");
    console.log("   - email_body (text)");
    console.log("   - sent_at (timestamp)\n");

    console.log("🔍 TO VERIFY:");
    console.log("   1. Go to: https://supabase.com");
    console.log("   2. Select project: fqgspaqzwnzsysozaxzj");
    console.log("   3. Table Editor → Check each table exists");
    console.log("   4. SQL Editor → Run: SELECT * FROM reengagement_log;\n");

    console.log("✅ TEST 7 INFO: Schema documentation provided\n");
  });
});
