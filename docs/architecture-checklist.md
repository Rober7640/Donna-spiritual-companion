# Benedara — File Architecture & Feature Checklist

## Context

The PRD (1,476 lines) specifies a complete credit-based prayer companionship MVP. The frontend UI is **built** (8 pages, smooth animations, responsive). The backend is an **empty scaffold** — no routes, no real database schema, no integrations. This plan defines the file architecture for the full MVP and a phased checklist to execute against.

---

## File Architecture

```
spiritual-companion/
│
├── shared/
│   ├── schema.ts                  [EXPAND] All 7 Drizzle tables
│   ├── types.ts                   [NEW]   UserSignal, API contracts, enums
│   └── constants.ts               [NEW]   Credit packages, gate timings, signal priority
│
├── server/
│   ├── index.ts                   [MODIFY] Middleware registration, cron job
│   ├── routes.ts                  [REWRITE] Mount domain routers under /api/v1/
│   ├── storage.ts                 [REWRITE] DrizzleStorage replacing MemStorage
│   ├── db.ts                      [NEW]   Drizzle client + Postgres pool
│   │
│   ├── middleware/
│   │   ├── auth.ts                requireAuth, optionalAuth (JWT validation)
│   │   ├── rate-limit.ts          General, anonymous chat, auth rate limits
│   │   ├── validate.ts            Zod request body validation factory
│   │   └── error-handler.ts       asyncHandler wrapper
│   │
│   ├── routes/
│   │   ├── auth.routes.ts         request-link, verify, convert, me
│   │   ├── chat.routes.ts         start, message (SSE), end, heartbeat
│   │   ├── credits.routes.ts      balance, checkout, webhook, transactions
│   │   ├── sessions.routes.ts     list, detail, rate
│   │   ├── companions.routes.ts   list, detail
│   │   └── onboarding.routes.ts   save
│   │
│   ├── services/
│   │   ├── auth.service.ts        Supabase Auth wrapper (magic link, verify, convert)
│   │   ├── chat.service.ts        Orchestration: signal → prompt → Claude → save
│   │   ├── claude.service.ts      Anthropic SDK: streaming, summary gen, email gen
│   │   ├── credits.service.ts     Balance check, atomic deduction, free trial grant
│   │   ├── stripe.service.ts      Checkout session, webhook verify, fulfill credits
│   │   ├── session.service.ts     CRUD + transcript storage + async summary trigger
│   │   ├── companion.service.ts   Load companion data, cache prompt blocks
│   │   ├── email.service.ts       Resend client wrapper
│   │   └── reengagement.service.ts  Cron logic: eligible users → Haiku email → send
│   │
│   └── lib/
│       ├── signals.ts             detectSignal() + getSignalInstruction()
│       ├── prompt-assembler.ts    Build system prompt from DB blocks + context + signal
│       ├── pacing.ts              Server-side delay config by message length
│       ├── anonymous-sessions.ts  In-memory Map for anonymous transcripts (auto-expire)
│       ├── credit-timer.ts        Heartbeat validation, wrap-up detection
│       └── summary-generator.ts   Post-session Haiku call for summary + prayer intention
│
├── client/src/
│   ├── App.tsx                    [MODIFY] AuthProvider, ProtectedRoute wrappers
│   │
│   ├── context/
│   │   ├── AuthContext.tsx        [NEW] Auth state, user, login/logout
│   │   └── ChatContext.tsx        [NEW] Active session state, messages, gate
│   │
│   ├── pages/
│   │   ├── Landing.tsx            [MODIFY] Wire CTA
│   │   ├── Onboarding.tsx         [MODIFY] sessionStorage + pass to /chat/start
│   │   ├── Chat.tsx               [REWRITE] Real SSE, pacing, email gate, credit timer
│   │   ├── Dashboard.tsx          [MODIFY] Fetch real sessions + balance
│   │   ├── SessionDetail.tsx      [MODIFY] Fetch real transcript, wire rating
│   │   ├── WelcomeBack.tsx        [MODIFY] Wire to Supabase magic link
│   │   └── PurchaseSuccess.tsx    [MODIFY] Read Stripe callback, show real balance
│   │
│   ├── components/
│   │   ├── EmailGate.tsx          [NEW] Inline email capture, 4 escalation states
│   │   ├── CreditTimer.tsx        [NEW] Real-time countdown (always subtle gray)
│   │   ├── StreamingMessage.tsx   [NEW] Token-by-token reveal with pacing
│   │   ├── TypingIndicator.tsx    [NEW] "Marie is typing..." slow pulse
│   │   ├── CrisisResources.tsx    [NEW] 988, Crisis Text Line, DV Hotline card
│   │   └── ProtectedRoute.tsx     [NEW] Auth guard → redirect to /login
│   │
│   ├── hooks/
│   │   ├── use-auth.ts            [NEW] Supabase auth state + login/logout
│   │   ├── use-chat.ts            [NEW] SSE connection, sendMessage, session lifecycle
│   │   ├── use-credits.ts         [NEW] Balance query, timer, heartbeat interval
│   │   ├── use-email-gate.ts      [NEW] Gate escalation state machine
│   │   └── use-streaming.ts       [NEW] Token buffer, throttled reveal, paragraph pauses
│   │
│   └── lib/
│       ├── supabase.ts            [NEW] Supabase client init
│       ├── api.ts                 [NEW] Typed API helpers for every endpoint
│       └── pacing.ts              [NEW] Client-side pacing engine
│
├── script/
│   └── seed-companion.ts          [NEW] Seeds Marie's companion row
│
└── migrations/                    [NEW] Drizzle-generated SQL migrations
```

**Totals: ~46 new files, ~14 modified files.**

---

## Feature Checklist

### Phase 1 — Foundation (Week 1)

Database, auth, and server scaffolding. Everything downstream depends on this.

- [ ] **1.1 Database schema** — Expand `shared/schema.ts` with all 7 tables (users, companions, credit_balances, credit_transactions, sessions, user_memory, reengagement_log). Add Zod insert/select schemas.
- [ ] **1.2 Shared types & constants** — `shared/types.ts` (UserSignal, API contracts), `shared/constants.ts` (credit packages, gate timings, signal priority).
- [ ] **1.3 DB connection** — `server/db.ts` (pg Pool + Drizzle instance). Rewrite `server/storage.ts` to DrizzleStorage.
- [ ] **1.4 Seed script** — `script/seed-companion.ts` inserts Marie's full companion row (all 4 system prompt blocks from PRD).
- [ ] **1.5 Server middleware** — `auth.ts` (requireAuth/optionalAuth), `rate-limit.ts`, `validate.ts`, `error-handler.ts`.
- [ ] **1.6 Route scaffold** — Rewrite `server/routes.ts` to mount domain routers. Create all 6 route files as empty Express Routers.
- [ ] **1.7 Auth service (server)** — `auth.service.ts` wrapping Supabase Admin SDK. Implement all 4 auth routes: request-link, verify, convert, me.
- [ ] **1.8 Auth client** — `supabase.ts`, `AuthContext.tsx`, `use-auth.ts`, `ProtectedRoute.tsx`. Wrap App in AuthProvider. Wire WelcomeBack page.
- [ ] **1.9 Anonymous sessions** — `anonymous-sessions.ts` in-memory Map (UUID-keyed, 30min auto-expire). Initial `/chat/start` endpoint for both anonymous and authenticated.
- [ ] **1.10 Install dependencies** — `@supabase/supabase-js`, `@anthropic-ai/sdk`, `stripe`, `resend`, `express-rate-limit`, `node-cron`.

### Phase 2 — Core Product (Week 2)

Marie talks. This is the product.

- [ ] **2.1 Signal detection** — `server/lib/signals.ts`: `detectSignal()` and `getSignalInstruction()`. All 9 signals with priority ordering. CRISIS always fires first.
- [ ] **2.2 Prompt assembly** — `server/lib/prompt-assembler.ts`: builds full system prompt from DB companion blocks + user context + signal instruction + `[WRAP_UP_SOON]`.
- [ ] **2.3 Companion service** — `companion.service.ts`: loads companion data from DB, caches prompt blocks in memory.
- [ ] **2.4 Claude service** — `claude.service.ts`: streaming `messages.create`, Haiku summary generation, Haiku email generation.
- [ ] **2.5 Chat service** — `chat.service.ts`: orchestrates signal detect → prompt assemble → Claude stream → transcript save. Handles both anonymous and authenticated sessions.
- [ ] **2.6 Chat routes (SSE)** — Complete `chat.routes.ts`: `/start`, `/message` (SSE streaming), `/end`, `/heartbeat`.
- [ ] **2.7 Client pacing engine** — `client/src/lib/pacing.ts`: delay calculation, TokenBuffer class, paragraph break detection. `use-streaming.ts` hook.
- [ ] **2.8 Chat page rewrite** — Replace mock with real SSE. Add `StreamingMessage.tsx`, `TypingIndicator.tsx`, `CrisisResources.tsx`. Wire input states (enabled/disabled/hidden). Integrate `ChatContext.tsx` and `use-chat.ts`.
- [ ] **2.9 Email gate** — `use-email-gate.ts` state machine (soft→gentle→firm→hard). `EmailGate.tsx` inline component with escalation UI. Supabase auth state detection for silent verification.
- [ ] **2.10 Onboarding data flow** — Save to `sessionStorage`, pass to `/chat/start`. Onboarding route for edge cases.

### Phase 3 — Monetization & History (Week 3)

Credits, Stripe, session history, re-engagement emails.

- [ ] **3.1 Credits service** — `credits.service.ts`: balance check, atomic deduction via Postgres function `deduct_credit()`, free trial grant. `credit-timer.ts` for heartbeat validation.
- [ ] **3.2 Stripe integration** — `stripe.service.ts`: create checkout session, verify webhook, fulfill credits (idempotent). Complete `credits.routes.ts` (balance, checkout, webhook, transactions).
- [ ] **3.3 Credit timer (client)** — `use-credits.ts` hook (balance query, 60s heartbeat, local countdown). `CreditTimer.tsx` (always subtle gray, no color changes per PRD).
- [ ] **3.4 Purchase flow (client)** — Wire TopUpPopup to real `/credits/checkout`. Wire PurchaseSuccess to read Stripe callback. Wire SessionComplete buttons.
- [ ] **3.5 Session history (server)** — Expand `session.service.ts` with list/detail/rate. `summary-generator.ts` for post-session Haiku calls. Complete `sessions.routes.ts`.
- [ ] **3.6 Session history (client)** — Wire Dashboard to fetch real sessions + balance. Wire SessionDetail to fetch real transcript + rating.
- [ ] **3.7 Companions routes** — Complete `companions.routes.ts` (list, detail — excluding system prompt fields).
- [ ] **3.8 Re-engagement emails** — `email.service.ts` (Resend wrapper), `reengagement.service.ts` (cron logic: find eligible → determine trigger → generate via Haiku → send). Register `node-cron` daily job. All 4 trigger types: first_followup, checkin, prayer_reminder, gentle_reopen.
- [ ] **3.9 Client API layer** — `client/src/lib/api.ts` with typed wrappers for every endpoint.

### Phase 4 — Testing & Launch (Week 4)

- [ ] **4.1 Signal detection testing** — All 9 signals, priority ordering, edge cases (multi-match, typos, short messages).
- [ ] **4.2 Crisis safety testing** — CRISIS fires correctly, resources render, crisis_flagged set, no re-engagement emails sent.
- [ ] **4.3 Auth flow testing** — Full anonymous→gate→magic link→verify→convert. Tab-switching on iOS/Android. Transcript preservation. Free trial granted exactly once.
- [ ] **4.4 Credit system testing** — Atomic deduction (no double-deduct), insufficient credits (graceful pause), webhook idempotency, heartbeat timeout.
- [ ] **4.5 Pacing QA** — Delay varies by message length, token reveal ~30-40 wps, paragraph pauses 0.8-1.2s, response length varies.
- [ ] **4.6 Re-engagement testing** — All 4 triggers, 7-day cooldown, max 4 cap, crisis exclusion, unsubscribe exclusion.
- [ ] **4.7 Mobile responsiveness** — All pages at 375px-428px, chat keyboard behavior, credit timer layout.
- [ ] **4.8 Error handling** — SSE reconnection, Sentry integration, rate limit enforcement.
- [ ] **4.9 Production setup** — Seed Marie in prod DB, configure env vars (DATABASE_URL, SUPABASE, ANTHROPIC, STRIPE, RESEND), RLS policies, Stripe products/prices, Resend domain verification (SPF/DKIM/DMARC), deploy.

---

## Critical Path

```
Schema (1.1) → DB (1.3) → Auth Server (1.7) → Auth Client (1.8) → Email Gate (2.9)
                         → Signals (2.1) → Prompt Assembly (2.2) → Claude (2.4)
                           → Chat Service (2.5) → Chat Routes (2.6) → Chat Rewrite (2.8)
                         → Credits (3.1) → Stripe (3.2) → Timer (3.3) → Purchase (3.4)
```

Re-engagement (3.8) and session history (3.5-3.6) can be built in parallel once the DB and Claude service layers are done.

## Verification

1. **Smoke test**: Landing → Onboarding → Chat (anonymous) → email gate → magic link → chat continues (authenticated) → credits expire → Marie closes with prayer → session complete block → purchase → new session
2. **Crisis test**: Send "I want to kill myself" → CRISIS signal fires → Marie responds with care + resources → crisis_flagged set → no re-engagement emails
3. **Pacing test**: Send messages of varying lengths → verify delay, token speed, and paragraph pauses match PRD spec
4. **Payment test**: Purchase both packages → verify Stripe webhook → verify credits added → verify balance display
