# Database Setup & Email Testing Guide

Complete guide to setting up the database and testing re-engagement emails.

---

## 📋 Overview

This guide will help you:
1. Create database tables in Supabase
2. Insert test data for email testing
3. Trigger re-engagement emails manually
4. Verify emails were sent

**Time required:** ~10 minutes

---

## 🗄️ Step 1: Create Database Schema

### Go to Supabase SQL Editor

1. **Login:** https://supabase.com
2. **Project:** fqgspaqzwnzsysozaxzj
3. **Navigate:** SQL Editor (left sidebar)
4. **Click:** "New query"

### Run Schema Migration

**Copy and paste this entire SQL script:**

```sql
-- Benedara - Initial Database Schema
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  faith_tradition TEXT,
  onboarding_concern TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_session_at TIMESTAMP WITH TIME ZONE,
  reengagement_count INTEGER NOT NULL DEFAULT 0,
  last_reengagement_at TIMESTAMP WITH TIME ZONE,
  unsubscribed BOOLEAN NOT NULL DEFAULT false,
  crisis_flagged BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB
);

-- Table 2: companions
CREATE TABLE IF NOT EXISTS companions (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  bio TEXT NOT NULL,
  faith_lane TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  system_prompt_identity TEXT NOT NULL,
  system_prompt_method TEXT NOT NULL,
  system_prompt_theology TEXT NOT NULL,
  system_prompt_rules TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Table 3: credit_balances
CREATE TABLE IF NOT EXISTS credit_balances (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  balance_minutes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table 4: credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  stripe_session_id TEXT,
  gift_from_user_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Table 5: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  companion_id TEXT NOT NULL REFERENCES companions(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  credits_consumed INTEGER,
  transcript JSONB,
  summary TEXT,
  prayer_intention TEXT,
  flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,
  rating TEXT,
  metadata JSONB
);

-- Table 6: user_memory
CREATE TABLE IF NOT EXISTS user_memory (
  user_id UUID NOT NULL REFERENCES users(id),
  companion_id TEXT NOT NULL REFERENCES companions(id),
  family_members JSONB,
  active_concerns TEXT[],
  prayer_intentions TEXT[],
  faith_practices JSONB,
  emotional_baseline TEXT,
  last_session_summary TEXT,
  session_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, companion_id)
);

-- Table 7: reengagement_log
CREATE TABLE IF NOT EXISTS reengagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  trigger_type TEXT NOT NULL,
  email_body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_session ON users(last_session_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_reengagement_user_id ON reengagement_log(user_id);
CREATE INDEX IF NOT EXISTS idx_reengagement_sent_at ON reengagement_log(sent_at);

-- Insert Donna companion (required for sessions)
INSERT INTO companions (
  id,
  display_name,
  tagline,
  bio,
  faith_lane,
  system_prompt_identity,
  system_prompt_method,
  system_prompt_theology,
  system_prompt_rules
) VALUES (
  'donna',
  'Donna',
  'A grandmother who listens with wisdom and prays without judgment',
  'Donna is a 67-year-old mother and grandmother who has weathered storms of faith, loss, and renewal. She prays the Rosary daily and believes in meeting people exactly where they are.',
  'catholic',
  'You are Donna, a 67-year-old Catholic grandmother who has lived through deep pain and emerged with hard-won wisdom.',
  'Listen deeply, ask thoughtful questions, and offer gentle wisdom rooted in lived experience.',
  'Meet people in their doubt and pain. God''s love is bigger than perfect theology.',
  'Never rush to fix. Never offer platitudes. Always honor the person''s agency and experience.'
) ON CONFLICT (id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully! Tables: users, companions, credit_balances, credit_transactions, sessions, user_memory, reengagement_log';
END $$;
```

**Click:** "Run" button

### ✅ Expected Output

```
Database schema created successfully!
Tables: users, companions, credit_balances, credit_transactions,
        sessions, user_memory, reengagement_log
```

### Verify Tables Created

**Run this query:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected tables:**
- companions
- credit_balances
- credit_transactions
- reengagement_log
- sessions
- user_memory
- users

---

## 📧 Step 2: Insert Test Data

### Create Test User for Email Testing

**⚠️ IMPORTANT:** Replace `your-email@gmail.com` with your actual email address!

**Run this query:**
```sql
-- Insert test user
INSERT INTO users (
  email,
  email_verified,
  last_session_at,
  reengagement_count,
  unsubscribed,
  crisis_flagged
) VALUES (
  'your-email@gmail.com',  -- 👈 CHANGE THIS TO YOUR EMAIL!
  true,                    -- Email verified (required for re-engagement)
  NOW() - INTERVAL '3 days',  -- 3 days ago (triggers re-engagement)
  0,                       -- No emails sent yet
  false,                   -- Not unsubscribed
  false                    -- Not in crisis
)
ON CONFLICT (email) DO UPDATE SET
  last_session_at = EXCLUDED.last_session_at,
  email_verified = true
RETURNING id;
```

**✅ Copy the UUID** that's returned - you'll need it for the next step!

Example output:
```
id: 550e8400-e29b-41d4-a716-446655440000
```

---

### Create Test Session

**Replace `USER_ID_HERE` with the UUID from above:**

```sql
INSERT INTO sessions (
  user_id,
  companion_id,
  started_at,
  ended_at,
  summary,
  prayer_intention,
  transcript
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,  -- 👈 PASTE YOUR USER ID HERE!
  'donna',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '15 minutes',
  'User shared deep anxiety about their daughter starting college next month. Moving 500 miles away. Worried she won''t be okay on her own. Donna listened and offered prayer.',
  'For peace about daughter''s upcoming move to college',
  '[]'::jsonb
);
```

---

### Verify Test Data

**Run this query (replace email):**
```sql
SELECT
  u.email,
  u.email_verified,
  u.last_session_at,
  NOW() - u.last_session_at AS days_since_session,
  u.reengagement_count,
  s.summary
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
WHERE u.email = 'your-email@gmail.com'  -- 👈 CHANGE THIS!
ORDER BY s.started_at DESC
LIMIT 1;
```

### ✅ Expected Output

```
email: your-email@gmail.com
email_verified: true
last_session_at: 2026-02-06 14:30:00 (3 days ago)
days_since_session: 3 days
reengagement_count: 0
summary: User shared deep anxiety about their daughter...
```

**If you see this data, you're ready to trigger the email!** ✅

---

## 🚀 Step 3: Trigger Re-engagement Email

### Method A: Command Line

**Open terminal and run:**
```bash
curl -X POST http://localhost:5000/api/v1/admin/trigger-reengagement
```

### Method B: Browser/API Tool

**URL:** `http://localhost:5000/api/v1/admin/trigger-reengagement`
**Method:** POST
**Headers:** `Content-Type: application/json`

---

## ✅ Step 4: Verify Email Sent

### 1. Check API Response

**Expected response:**
```json
{
  "sent": 1,
  "errors": 0,
  "timestamp": "2026-02-09T19:53:50.000Z",
  "durationMs": 1234
}
```

- `sent: 1` means 1 email was sent successfully
- `errors: 0` means no errors occurred

---

### 2. Check Server Console

**Look for these log messages:**
```
🔧 [ADMIN] Manual re-engagement job triggered
[reengagement] Starting daily re-engagement job...
[reengagement] Found 1 eligible users
[reengagement] Sent first_followup email to your-email@gmail.com
[reengagement] Complete: 1 sent, 0 errors
🔧 [ADMIN] Job completed in 1234ms: 1 sent, 0 errors
```

---

### 3. Check Resend Dashboard

**URL:** https://resend.com/emails

**What to look for:**
- Email to your address
- **From:** Donna <onboarding@resend.dev>
- **Subject:** Donna has been thinking of you
- **Status:** Delivered ✓
- **Time:** Just now

**Click on the email** to see:
- Email preview
- Delivery details
- Email content

---

### 4. Check Your Inbox

**Subject:** Donna has been thinking of you

**From:** Donna <onboarding@resend.dev>

**Content:** Personalized email generated by Claude Haiku based on your session summary

**CTA Button:** "Talk to Donna"

**Footer:**
- Benedara — A place for prayer and reflection
- Unsubscribe link

**⚠️ Note:** First email might go to spam. Check spam folder and mark as "Not Spam"

---

### 5. Check Database Log

**Run this query:**
```sql
SELECT
  rl.sent_at,
  u.email,
  rl.trigger_type,
  LEFT(rl.email_body, 100) AS email_preview
FROM reengagement_log rl
JOIN users u ON rl.user_id = u.id
ORDER BY rl.sent_at DESC
LIMIT 1;
```

**Expected output:**
```
sent_at: 2026-02-09 14:53:50
email: your-email@gmail.com
trigger_type: first_followup
email_preview: I've been thinking about you since our conversation...
```

---

## 🔍 Troubleshooting

### Email Not Sent

**Check 1: User is eligible**
```sql
SELECT
  email,
  email_verified,
  last_session_at,
  NOW() - last_session_at AS time_since,
  reengagement_count,
  unsubscribed
FROM users
WHERE email_verified = true
  AND unsubscribed = false
  AND last_session_at < NOW() - INTERVAL '2 days'
  AND reengagement_count < 4;
```

If your email doesn't appear, check:
- `email_verified` must be `true`
- `last_session_at` must be more than 2 days ago
- `reengagement_count` must be less than 4
- `unsubscribed` must be `false`

---

**Check 2: Session exists**
```sql
SELECT COUNT(*) FROM sessions
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');
```

Should return at least 1.

---

**Check 3: Server logs**

Look for errors in the terminal where server is running:
```
[reengagement] Found 0 eligible users
```

If found 0 users, check the eligibility query above.

---

### Error: "relation users does not exist"

**Solution:** Run Step 1 (Create Database Schema) first.

---

### Error: "insert or update on table sessions violates foreign key constraint"

**Solution:** Make sure you replaced `USER_ID_HERE` with actual user ID from the INSERT query.

---

### Email in Spam Folder

**Solution:**
1. Check spam folder
2. Mark as "Not Spam"
3. Future emails should go to inbox

---

## 📊 Database Schema Reference

### Tables Created

| Table | Purpose |
|-------|---------|
| `users` | User accounts and email settings |
| `companions` | Donna's profile and system prompts |
| `sessions` | Conversation history |
| `credit_balances` | User credit tracking |
| `credit_transactions` | Purchase history |
| `user_memory` | Long-term conversation memory |
| `reengagement_log` | Email send history and analytics |

---

### Re-engagement Eligibility Criteria

For a user to receive re-engagement email:

✅ `email_verified = true`
✅ `unsubscribed = false`
✅ `crisis_flagged = false`
✅ `last_session_at < NOW() - INTERVAL '2 days'`
✅ `reengagement_count < 4`
✅ Has at least one session

---

### Email Trigger Types

| Type | When | Subject |
|------|------|---------|
| `first_followup` | 2 days after first session | "Donna has been thinking of you" |
| `checkin` | 7-14 days inactive | "How are you doing?" |
| `prayer_reminder` | 7+ days with prayer intention | "A prayer intention from your last visit" |
| `gentle_reopen` | 14+ days inactive | "Benedara is always open" |

---

## 🧪 Testing Different Scenarios

### Test Email After 7 Days

```sql
UPDATE users
SET last_session_at = NOW() - INTERVAL '7 days'
WHERE email = 'your-email@gmail.com';
```

Then trigger job → Should send "checkin" email.

---

### Test With Prayer Intention

```sql
UPDATE sessions
SET prayer_intention = 'For healing of relationship with mother'
WHERE user_id = (SELECT id FROM users WHERE email = 'your-email@gmail.com');

UPDATE users
SET last_session_at = NOW() - INTERVAL '7 days'
WHERE email = 'your-email@gmail.com';
```

Then trigger job → Should send "prayer_reminder" email.

---

### Test Multiple Re-engagements

```sql
-- Simulate 3 previous emails sent
UPDATE users
SET reengagement_count = 3,
    last_reengagement_at = NOW() - INTERVAL '8 days'
WHERE email = 'your-email@gmail.com';
```

Then trigger job → Should send 4th and final email.

---

### Test Email Limit (Max 4 Emails)

```sql
-- Simulate 4 emails already sent
UPDATE users
SET reengagement_count = 4
WHERE email = 'your-email@gmail.com';
```

Then trigger job → Should NOT send email (limit reached).

---

## 📝 Useful Queries

### See All Eligible Users
```sql
SELECT
  email,
  last_session_at,
  NOW() - last_session_at AS inactive_for,
  reengagement_count
FROM users
WHERE email_verified = true
  AND unsubscribed = false
  AND last_session_at < NOW() - INTERVAL '2 days'
  AND reengagement_count < 4
ORDER BY last_session_at;
```

---

### See Email History
```sql
SELECT
  u.email,
  rl.trigger_type,
  rl.sent_at,
  LEFT(rl.email_body, 50) AS preview
FROM reengagement_log rl
JOIN users u ON rl.user_id = u.id
ORDER BY rl.sent_at DESC;
```

---

### Reset User for Testing
```sql
UPDATE users
SET reengagement_count = 0,
    last_reengagement_at = NULL,
    last_session_at = NOW() - INTERVAL '3 days'
WHERE email = 'your-email@gmail.com';
```

---

## 🎉 Success Checklist

- [ ] Database schema created (7 tables)
- [ ] Donna companion inserted
- [ ] Test user created with your email
- [ ] Test session created
- [ ] Verified test data in database
- [ ] Triggered re-engagement job
- [ ] Received email in Resend dashboard
- [ ] Received email in inbox
- [ ] Email logged in reengagement_log table

---

## 📚 Next Steps

**After successful test:**

1. **Set up cron job** to run daily:
   ```bash
   # Run every day at 9 AM
   0 9 * * * curl -X POST http://localhost:5000/api/v1/admin/trigger-reengagement
   ```

2. **Monitor Resend dashboard** for deliverability

3. **Check database logs** to see which emails convert users

4. **Adjust trigger timing** based on user behavior

5. **Test different email variations** with A/B testing

---

**Created:** 2026-02-09
**Status:** Production Ready ✅
**Email System:** Resend + Claude Haiku
**Database:** Supabase PostgreSQL
