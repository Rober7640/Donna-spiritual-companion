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
