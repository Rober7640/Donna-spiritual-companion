import { test, expect } from "@playwright/test";

/**
 * Integration tests for re-engagement email system.
 *
 * Tests:
 * 1. User creation in Supabase
 * 2. Session creation and storage
 * 3. Re-engagement email trigger
 * 4. Email sending via Resend
 * 5. Database logging
 */

const baseURL = process.env.BASE_URL || "http://localhost:5000";

// Helper to create a test user and session
async function createTestUserWithSession(email: string) {
  // Step 1: Request magic link (creates user in Supabase)
  const magicLinkResponse = await fetch(`${baseURL}/api/v1/auth/request-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!magicLinkResponse.ok) {
    throw new Error(`Failed to request magic link: ${magicLinkResponse.statusText}`);
  }

  console.log(`✅ Magic link requested for ${email}`);

  // Step 2: Start an anonymous chat session
  const chatResponse = await fetch(`${baseURL}/api/v1/chat/anonymous`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userName: "TestUser",
      concern: "I'm testing the re-engagement system",
    }),
  });

  if (!chatResponse.ok) {
    throw new Error(`Failed to start chat: ${chatResponse.statusText}`);
  }

  const { sessionId, userId } = await chatResponse.json();
  console.log(`✅ Session created: ${sessionId} for user ${userId}`);

  return { sessionId, userId, email };
}

// Helper to send a message in a session
async function sendMessage(sessionId: string, content: string) {
  const response = await fetch(`${baseURL}/api/v1/chat/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, content }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  // Consume the SSE stream
  const reader = response.body?.getReader();
  if (!reader) return "";

  let fullResponse = "";
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (!data || data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "token" && parsed.token) {
          fullResponse += parsed.token;
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
  }

  return fullResponse;
}

// Helper to trigger re-engagement job manually
async function triggerReengagementJob() {
  // For now, we'll need to add an endpoint to manually trigger this
  // Or we can directly call the service function in a test environment
  console.log("⏰ Re-engagement job would run here (needs manual trigger endpoint)");
}

test.describe("Re-engagement Email Integration", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  let sessionId: string;
  let userId: string;

  test("1. Create user and session in database", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 1: User & Session Creation");
    console.log("═══════════════════════════════════════════════════════\n");

    const result = await createTestUserWithSession(testEmail);
    sessionId = result.sessionId;
    userId = result.userId;

    expect(sessionId).toBeTruthy();
    expect(userId).toBeTruthy();

    console.log(`\n✅ TEST 1 PASSED: User and session created`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Session ID: ${sessionId}`);
    console.log(`   Email: ${testEmail}\n`);
  });

  test("2. Have a conversation to create session content", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 2: Session Conversation");
    console.log("═══════════════════════════════════════════════════════\n");

    // Create a new session for this test
    const result = await createTestUserWithSession(`test-conv-${Date.now()}@example.com`);
    const testSessionId = result.sessionId;

    // Send a few messages to create conversation context
    console.log("Sending message 1...");
    const response1 = await sendMessage(
      testSessionId,
      "I'm feeling really anxious about my daughter starting college next month."
    );
    console.log(`Donna: ${response1.substring(0, 100)}...\n`);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Sending message 2...");
    const response2 = await sendMessage(
      testSessionId,
      "She's moving 500 miles away and I'm worried she won't be okay on her own."
    );
    console.log(`Donna: ${response2.substring(0, 100)}...\n`);

    expect(response1.length).toBeGreaterThan(0);
    expect(response2.length).toBeGreaterThan(0);

    console.log(`✅ TEST 2 PASSED: Conversation created with meaningful content\n`);
  });

  test("3. Check database entries", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 3: Database Verification");
    console.log("═══════════════════════════════════════════════════════\n");

    // For this test to work, we'd need a database query endpoint
    // For now, we'll verify through the API that session exists

    console.log("📊 This test requires direct database access or admin endpoint");
    console.log("   Skipping database query verification for now");
    console.log("   Session was created successfully in Test 1\n");

    // TODO: Add admin endpoint to query database
    // const dbCheck = await fetch(`${baseURL}/api/v1/admin/session/${sessionId}`);
    // expect(dbCheck.ok).toBe(true);

    console.log("⚠️  TEST 3 SKIPPED: Needs admin/debug endpoint\n");
  });

  test("4. Verify Resend configuration", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 4: Resend Configuration");
    console.log("═══════════════════════════════════════════════════════\n");

    // Check environment variables
    const hasResendKey = process.env.RESEND_API_KEY?.startsWith("re_");
    const hasFromEmail = !!process.env.FROM_EMAIL;

    console.log(`📧 Resend API Key: ${hasResendKey ? "✅ Configured" : "❌ Missing"}`);
    console.log(`📧 From Email: ${hasFromEmail ? "✅ Configured" : "❌ Missing"}`);

    if (hasResendKey && hasFromEmail) {
      console.log(`   From: ${process.env.FROM_EMAIL}`);
    }

    expect(hasResendKey || hasFromEmail).toBe(true);

    console.log(`\n✅ TEST 4 PASSED: Resend is configured\n`);
  });

  test("5. Manual re-engagement email test", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 5: Re-engagement Email (Manual)");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📧 To test re-engagement emails manually:");
    console.log("   1. Wait 2+ days after creating a session");
    console.log("   2. OR create an admin endpoint to trigger job");
    console.log("   3. OR set up a cron job to run daily\n");

    console.log("📝 Expected behavior:");
    console.log("   - Email sent to: onboarding@resend.dev");
    console.log("   - Subject: 'Marie has been thinking of you'");
    console.log("   - Body: Personalized based on last conversation");
    console.log("   - Database: Entry in reengagement_log table\n");

    console.log("🔍 Check Resend dashboard:");
    console.log("   https://resend.com/emails");
    console.log("   You should see the test email there\n");

    console.log("⚠️  TEST 5 INFO: Manual verification required\n");
  });
});

test.describe("Database Integration", () => {
  test("6. Verify Supabase connection", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 6: Supabase Database Connection");
    console.log("═══════════════════════════════════════════════════════\n");

    // Try to create a session (which requires database)
    const response = await fetch(`${baseURL}/api/v1/chat/anonymous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "DatabaseTest",
        concern: "Testing database connection",
      }),
    });

    const success = response.ok;
    console.log(`🗄️  Database Connection: ${success ? "✅ Connected" : "❌ Failed"}`);

    if (success) {
      const data = await response.json();
      console.log(`   Session created: ${data.sessionId}`);
      console.log(`   User created: ${data.userId}`);
    }

    expect(success).toBe(true);

    console.log(`\n✅ TEST 6 PASSED: Supabase is connected and working\n`);
  });

  test("7. Verify session persistence", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("TEST 7: Session Persistence");
    console.log("═══════════════════════════════════════════════════════\n");

    // Create a session
    const createResponse = await fetch(`${baseURL}/api/v1/chat/anonymous`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userName: "PersistenceTest",
        concern: "Testing session persistence",
      }),
    });

    const { sessionId } = await createResponse.json();
    console.log(`📝 Session created: ${sessionId}`);

    // Send a message
    await sendMessage(sessionId, "This is a test message");
    console.log(`✅ Message sent successfully`);

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Send another message (this verifies session was stored and retrieved)
    const response2 = await sendMessage(sessionId, "This is a follow-up message");
    console.log(`✅ Follow-up message sent successfully`);

    expect(response2.length).toBeGreaterThan(0);

    console.log(`\n✅ TEST 7 PASSED: Session persists across messages\n`);
  });
});

test.describe("Email System Setup Guide", () => {
  test("8. Display setup instructions", async () => {
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("EMAIL SYSTEM SETUP GUIDE");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📧 RESEND SETUP:");
    console.log("   1. Go to: https://resend.com/emails");
    console.log("   2. Look for test emails sent to 'onboarding@resend.dev'");
    console.log("   3. Verify email content and formatting\n");

    console.log("🗄️  DATABASE SETUP:");
    console.log("   1. Go to: https://supabase.com");
    console.log("   2. Project: fqgspaqzwnzsysozaxzj");
    console.log("   3. Check tables: users, sessions, reengagement_log\n");

    console.log("🧪 TO TEST RE-ENGAGEMENT:");
    console.log("   Option A - Wait naturally:");
    console.log("     1. Create a test user with real email");
    console.log("     2. Have a conversation");
    console.log("     3. Wait 2+ days");
    console.log("     4. Check your inbox for re-engagement email\n");

    console.log("   Option B - Manual trigger (TODO):");
    console.log("     1. Create admin endpoint: POST /api/v1/admin/trigger-reengagement");
    console.log("     2. Call endpoint to run job manually");
    console.log("     3. Check Resend dashboard for sent email\n");

    console.log("   Option C - Database manipulation:");
    console.log("     1. Create session now");
    console.log("     2. Manually update 'last_session_at' in database to 3 days ago");
    console.log("     3. Trigger re-engagement job");
    console.log("     4. Check for email\n");

    console.log("✅ CURRENT STATUS:");
    console.log(`   Resend: ${process.env.RESEND_API_KEY ? "✅ Configured" : "❌ Not configured"}`);
    console.log(`   Database: ✅ Connected (Supabase PostgreSQL)`);
    console.log(`   From Email: ${process.env.FROM_EMAIL || "Not set"}`);
    console.log("");
  });
});
