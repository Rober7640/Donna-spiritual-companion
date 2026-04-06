-- Test Data for Re-engagement Email Testing
-- Run this AFTER 001_initial_schema.sql

-- Replace 'your-email@gmail.com' with your actual email to receive test emails!

-- Insert test user
INSERT INTO users (
  email,
  email_verified,
  last_session_at,
  reengagement_count,
  unsubscribed,
  crisis_flagged
) VALUES (
  'outsourcejoel@gmail.com',  -- 👈 CHANGE THIS TO YOUR EMAIL!
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

-- Copy the user ID from the result above, then run this:
-- (Replace USER_ID_HERE with the actual UUID from above)

INSERT INTO sessions (
  user_id,
  companion_id,
  started_at,
  ended_at,
  summary,
  prayer_intention,
  transcript
) VALUES (
  'USER_ID_HERE'::uuid,  -- 👈 PASTE USER ID HERE!
  'donna',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '15 minutes',
  'User shared deep anxiety about their daughter starting college next month. Moving 500 miles away. Worried she won''t be okay on her own. Donna listened and offered prayer.',
  'For peace about daughter''s upcoming move to college',
  '[]'::jsonb
);

-- Verify the data
SELECT
  u.email,
  u.email_verified,
  u.last_session_at,
  NOW() - u.last_session_at AS days_since_session,
  u.reengagement_count,
  s.summary
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
WHERE u.email = 'your-email@gmail.com'  -- 👈 CHANGE THIS TOO!
ORDER BY s.started_at DESC
LIMIT 1;

-- Expected output:
-- email: your-email@gmail.com
-- email_verified: true
-- last_session_at: 3 days ago
-- days_since_session: 3 days
-- reengagement_count: 0
-- summary: User shared deep anxiety about...

-- ✅ If this shows your data, you're ready to trigger the re-engagement email!
