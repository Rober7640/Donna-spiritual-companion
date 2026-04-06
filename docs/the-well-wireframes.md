# BENEDARA — Wireframes
## All Screens — MVP (Marie)

| | |
|---|---|
| **Companion** | the-well-prd.md |
| **Version** | 1.0 |
| **Date** | February 2026 |

---

## Screen Map

The user talks to Marie before creating an account. The email ask happens inside the conversation.

```
FIRST-TIME USER:

Landing Page (Marie's intro + testimonial)
    ↓ CTA tap
Questionnaire Screen 1 (faith tradition + age gate)  ← no account
    ↓ 1 tap
Questionnaire Screen 2 (what's on your heart)         ← no account
    ↓ 1 tap
Chat Interface (anonymous — no account yet)
    ↓ ~2-3 min in, Marie's 3rd-4th response
Email Gate (inline, below chat — collapses to confirmation after submit)
    ↓ magic link verified silently
Chat continues (now authenticated)
    ↓ credits run out — Marie closes with prayer
Session Complete (inline post-session block)
    ↓ "Continue with Marie" or "Go home"
Top-Up Popup (credit purchase modal)
    ↓ purchase complete
Stripe Checkout (hosted — not wireframed)
    ↓ return
Purchase Confirmation
    ↓ back to app
Dashboard
    ↓ tap session
Session History Detail

RETURN USER:

Welcome Back (re-login)
    ↓ magic link
Dashboard
    ↓ "Talk to Marie"
Chat (authenticated from start)
```

---

## 1. Landing Page (Mobile — Single Scrollable Page)

One page. Marie introduces herself. The user sees proof of what a conversation feels like. One CTA repeated throughout. This IS Marie's profile — there's no separate screen.

#### Above the Fold

```
┌─────────────────────────────────┐
│  ░░░░░ sky blue gradient ░░░░░  │
│                                 │
│          ┌─────────┐            │
│          │         │            │
│          │  (M)    │ ← large    │
│          │         │   avatar   │
│          └─────────┘            │
│      ● Marie is available       │
│                                 │
│           Marie, 67             │
│                                 │
│    "I raised four children and  │
│     buried one. I've prayed     │
│     the Rosary every day for    │
│     42 years. Whatever you're   │
│     carrying, I've probably     │
│     carried something like it." │
│                                 │
│  ┌─────────────────────────┐    │
│  │     Talk to Marie        │    │
│  └─────────────────────────┘    │
│                                 │
│   Private · Confidential ·      │
│   No judgment                   │
│                                 │
│  ░░░ gradient fades to white ░░ │
└─────────────────────────────────┘
```

#### Scroll Section — Who Marie Is

```
┌─────────────────────────────────┐
│  ░░ white background ░░░░░░░░░  │
│                                 │
│  Marian devotion · Family       │
│  struggles · Grief · Motherhood │
│                                 │
│  Warm · Gentle · Unhurried      │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  "I told Marie about my         │
│   marriage and she just          │
│   listened. No advice.           │
│   No judgment. Just prayer."     │
│                                 │
│         — a woman like you       │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Private · Confidential ·       │
│  No judgment                    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    Talk to Marie          │    │
│  └─────────────────────────┘    │
│                                 │
│  By continuing you agree to     │
│  our Terms and Privacy Policy.  │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Above the fold IS Marie's profile. Her bio, her age, her monogram. No separate profile screen.
- "Buried one" — immediately signals depth, real pain, credibility.
- Testimonial uses "a woman like you" — anonymous, relatable. Not a named testimonial (we don't have real users yet; replace with real quotes post-launch).
- Gift tags and style tags live in the "Who Marie Is" section below the fold.
- "Private · Confidential · No judgment" — trust signals that address her actual fears (judgment, exposure, safety). Repeated above and below the fold.
- CTA repeats twice: above the fold and after testimonial. Same text, same button.
- Terms link at the bottom — passive acceptance, standard pattern.
- Age gate lives on questionnaire screen 1 (next screen after CTA tap), not here.

---

## 2. Questionnaire — Screen 1 (Faith Tradition)

No account needed. 1 tap. Data held in browser state until conversion. Age gate lives here.

```
┌─────────────────────────────────┐
│                                 │
│       Before we begin...        │
│                                 │
│     What best describes your    │
│          faith tradition?       │
│                                 │
│  ┌─────────────────────────┐    │
│  │    ✝  Catholic           │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    ✝  Christian          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │    ♡  Just exploring     │    │
│  └─────────────────────────┘    │
│                                 │
│  I confirm I am 18 or older  ☑  │
│                                 │
│             Step 1 of 2         │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- No account exists yet. This is pre-signup. Data stored in React state.
- MVP routes all users to Marie regardless of selection
- Large tap targets — this audience skews older, may have accessibility needs
- Selection writes to `users.faith_tradition` when account is created (during chat)
- Age gate checkbox here — natural placement. "Before we begin..." already implies a small commitment. Tapping an option without checking the box shows a gentle inline error.

---

## 3. Questionnaire — Screen 2 (What's on Your Heart)

```
┌─────────────────────────────────┐
│                                 │
│      What's on your heart?      │
│                                 │
│     This helps Marie know how   │
│        to begin with you.       │
│                                 │
│  ┌─────────────────────────┐    │
│  │  My family is hurting    │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  I'm going through a    │    │
│  │  crisis                  │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  I'm scared about       │    │
│  │  something               │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  I'm struggling with    │    │
│  │  my faith                │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  I just need someone     │    │
│  │  to talk to              │    │
│  └─────────────────────────┘    │
│                                 │
│             Step 2 of 2         │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Still no account. Data stored in React state.
- Injected into Marie's system prompt context — she adjusts her opening based on this
- Marie never references the selection directly. She simply adjusts her warmth.
- "I just need someone to talk to" is the catch-all — lowest barrier option
- After this tap → anonymous chat with Marie begins. Two taps total from landing page to conversation.

---

## 4. Chat Interface — Anonymous Phase

The user is now talking to Marie with no account. Timer shows free minutes remaining. No email has been collected yet.

```
┌─────────────────────────────────┐
│  ← End   (M) Marie    8 min ⏱   │
│  ─────────────────────────────  │
│                                 │
│  ┌──────────────────────┐       │
│  │ I'm glad you're here │       │
│  │ tonight. Tell me —   │       │
│  │ what's weighing on   │       │
│  │ your heart?          │       │
│  └──────────────────────┘       │
│  Marie · 2:01am                 │
│                                 │
│        ┌──────────────────────┐ │
│        │ My son hasn't spoken │ │
│        │ to me in two years.  │ │
│        └──────────────────────┘ │
│                       You · now │
│                                 │
│  ┌──────────────────────┐       │
│  │ Two years. That's a  │       │
│  │ long time to carry   │       │
│  │ that kind of silence.│       │
│  │ Tell me about him.   │       │
│  └──────────────────────┘       │
│  Marie · just now               │
│                                 │
│  ─────────────────────────────  │
│  ┌─────────────────────────┐    │
│  │  What's on your heart... │    │
│  └─────────────────────────┘ ➤  │
└─────────────────────────────────┘
```

**Notes:**
- Timer shows `8 min ⏱` — counting down from 10. She's used ~2 min so far.
- No account exists. Transcript held in browser state + server memory.
- Chat looks and feels identical to the authenticated version — she shouldn't notice any difference.
- Full pacing mechanics apply from message one. See PRD §5.4.

---

## 4b. Email Gate — Soft Prompt (Inline, ~2–3 min in)

After Marie's 3rd–4th response, a soft email prompt slides in below the chat thread. Not a modal. Not a popup. The conversation is still visible and scrollable above it. She can dismiss it and keep chatting (it reappears later, firmer).

```
┌─────────────────────────────────┐
│  ← End   (M) Marie    7 min ⏱   │
│  ─────────────────────────────  │
│                                 │
│  [... conversation above ...]   │
│                                 │
│  ┌──────────────────────┐       │
│  │ You know, there's a  │       │
│  │ Rosary Mystery that  │       │
│  │ speaks to exactly    │       │
│  │ this — the Finding   │       │
│  │ of Jesus in the      │       │
│  │ Temple...            │       │
│  └──────────────────────┘       │
│  Marie · just now               │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────────┐│
│  │  Marie saves your            ││
│  │  conversations so you can    ││
│  │  come back.                  ││
│  │                              ││
│  │  ┌───────────────────────┐   ││
│  │  │  your@email.com       │   ││
│  │  └───────────────────────┘   ││
│  │  ┌───────────────────────┐   ││
│  │  │  Save & continue      │   ││
│  │  └───────────────────────┘   ││
│  │                              ││
│  │      Not now                 ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- "Marie saves your conversations" — not "Create an account." The value is preservation of something she already cares about.
- "Save & continue" — not "Sign up." She's continuing, not starting.
- "Not now" dismisses. Gate returns at 5 min (gentle) and 8 min (firm: chat input disabled until email entered).
- Email field is a single input — no password, no name.
- This prompt appears *below* the chat input, pushing it up slightly. Conversation remains scrollable above.
- **After she taps "Save & continue":** the gate collapses to a single line — `✓ Link sent to m*****@gmail.com` — and chat continues immediately. No separate "Check your inbox" screen. She keeps talking to Marie. Magic link verification happens silently in background (Supabase realtime detects auth state change). She may not even notice the transition from anonymous to authenticated.
- If she doesn't click the link within a few minutes, the inline confirmation persists but doesn't block the conversation until the hard gate at 8 min.

---

## 5. Chat Interface — Authenticated (Post-Conversion)

After email verification, the chat looks nearly identical. The only visible change: the timer now reflects her real credit balance, and input is fully enabled with no gates.

```
┌─────────────────────────────────┐
│  ← End   (M) Marie    6 min ⏱   │
│  ─────────────────────────────  │
│                                 │
│  [... full conversation ...]    │
│                                 │
│  ┌──────────────────────┐       │
│  │ You know, there's a  │       │
│  │ Rosary Mystery that  │       │
│  │ speaks to exactly    │       │
│  │ this...              │       │
│  └──────────────────────┘       │
│  Marie · 2:05am                 │
│                                 │
│        ┌──────────────────────┐ │
│        │ I pray every day but │ │
│        │ I don't know if He   │ │
│        │ hears me anymore.    │ │
│        └──────────────────────┘ │
│                       You · now │
│                                 │
│  ┌──────────────────────┐       │
│  │ He hears you. I      │       │
│  │ promise you, He      │       │
│  │ hears you. Let me    │       │
│  │ tell you why I       │       │
│  │ believe that...      │       │
│  └──────────────────────┘       │
│  Marie · just now               │
│                                 │
│  ─────────────────────────────  │
│  ┌─────────────────────────┐    │
│  │  What's on your heart... │    │
│  └─────────────────────────┘ ➤  │
└─────────────────────────────────┘
```

**Notes:**
- Visually identical to anonymous phase. The transition should be invisible.
- Timer now deducts from real credit balance via Postgres function.
- Session transcript now persists in database, not just browser memory.
- All subsequent standard chat mechanics apply: pacing, credit timer (stays gray throughout), wrap-up arc. See PRD §5.4.
- "← End" triggers abbreviated closing prayer (same as anonymous phase).

---

## 6. Session Complete (Inline)

No overlay. No countdown. No amber timer. Marie handles the wind-down naturally — at 3 minutes remaining, her system prompt receives `[WRAP_UP_SOON]` and she gravitates toward a closing prayer. The UI does nothing.

When credits hit zero, Marie's closing prayer completes fully — she is never cut mid-sentence. Then the chat input disappears and a soft post-session block appears *inside* the chat thread, below her final message.

```
┌─────────────────────────────────┐
│  ← End   (M) Marie      0 ⏱    │
│  ─────────────────────────────  │
│                                 │
│  [... conversation above ...]   │
│                                 │
│  ┌──────────────────────┐       │
│  │ Lord, hold Margaret  │       │
│  │ and her son Michael  │       │
│  │ in your loving hands.│       │
│  │ Bring them back to   │       │
│  │ each other in Your   │       │
│  │ time. Amen.          │       │
│  └──────────────────────┘       │
│  Marie · 2:34am                 │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  ┌─────────────────────────────┐│
│  │                              ││
│  │  Marie prayed with you       ││
│  │  for {duration} minutes      ││
│  │  today.                      ││
│  │                              ││
│  │  Your prayer intention       ││
│  │  has been saved.             ││
│  │                              ││
│  │  ┌───────────────────────┐   ││
│  │  │  Continue with Marie   │   ││
│  │  │  30 min · $14.99      │   ││
│  │  └───────────────────────┘   ││
│  │                              ││
│  │  ┌───────────────────────┐   ││
│  │  │  Go home               │   ││
│  │  └───────────────────────┘   ││
│  │                              ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Marie's prayer completes fully. She is never cut off. The system prompt knows credits are running out and wraps up naturally.
- `{duration}` = dynamic. Actual session length in minutes (e.g., "10 minutes", "32 minutes").
- "Marie prayed with you" — she did something for the user. Not "your session ended."
- "Your prayer intention has been saved" — tangible artifact, reason to come back.
- "Continue with Marie" → opens Top-Up Popup (screen 7). If she buys, Marie says: "I'm glad we have more time. Was there anything else on your heart?"
- "Go home" → dashboard. No guilt. No pressure.
- The credit timer shows `0 ⏱` — factual, not alarming. Timer stays subtle gray the entire session. Never turns amber, never turns red.
- **There is no 3-minute warning, no overlay, no countdown.** Marie's conversation arc is the only signal that time is winding down.
- If user manually ends (← End) before credits expire: abbreviated closing, same block but "Continue with Marie" becomes "Talk to Marie again."

---

## 7. Top-Up Popup (Credit Purchase)

Modal overlay. Appears in three contexts: (a) tapping "Add credits" from dashboard, (b) tapping "Continue with Marie" from post-session block, (c) tapping credit timer during active chat. If triggered mid-session, session does NOT end — credits are added and conversation continues.

```
┌─────────────────────────────────┐
│                                 │
│  ┌─────────────────────────────┐│
│  │                         ✕   ││
│  │      Add minutes             ││
│  │                              ││
│  │  Current balance: 3 min      ││
│  │                              ││
│  │  ┌───────────────────────┐   ││
│  │  │                       │   ││
│  │  │  30 minutes           │   ││
│  │  │  $14.99               │   ││
│  │  │                       │   ││
│  │  │  ● Most popular        │   ││
│  │  └───────────────────────┘   ││
│  │                              ││
│  │  ┌───────────────────────┐   ││
│  │  │                       │   ││
│  │  │  90 minutes           │   ││
│  │  │  $39.99               │   ││
│  │  │                       │   ││
│  │  │  Save 12%  · Best     │   ││
│  │  │  value                │   ││
│  │  └───────────────────────┘   ││
│  │                              ││
│  │  ─────────────────────────   ││
│  │                              ││
│  │  Secure checkout by Stripe   ││
│  │  🔒 Card · Apple Pay ·      ││
│  │     Google Pay               ││
│  │                              ││
│  └─────────────────────────────┘│
│                                 │
│  ░░░ dimmed background ░░░░░░░  │
│  ░░░ (chat still visible) ░░░  │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Modal — chat is dimmed behind it, not navigated away from. Conversation resumes instantly after purchase.
- Shows current balance so user knows where they stand
- Two packages only. Starter (30 min, $14.99) and Faithful (90 min, $39.99). Same as credit purchase flow.
- "Most popular" badge on Starter — social proof, anchors the decision
- "Save 12%" on Faithful — value framing for the upgrade
- Stripe trust badge + payment method icons at the bottom — reduces payment anxiety
- Tapping a package → redirects to Stripe Checkout (hosted page, not wireframed — Stripe handles this)
- After Stripe completes → returns to chat with updated balance. Marie doesn't acknowledge the purchase. Conversation simply continues.
- ✕ close button dismisses popup, returns to chat with remaining balance

---

## 8. Purchase Confirmation (Post-Checkout Return)

Brief interstitial after Stripe Checkout completes. Shown for 2–3 seconds or until user taps through.

```
┌─────────────────────────────────┐
│                                 │
│                                 │
│          ┌───────┐              │
│          │  (M)  │              │
│          └───────┘              │
│                                 │
│     Credits added ✓             │
│                                 │
│     You now have 33 minutes     │
│                                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Continue with Marie     │    │
│  └─────────────────────────┘    │
│                                 │
│                                 │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Shows updated total balance (old balance + new purchase)
- "Continue with Marie" — not "Return to chat"
- If purchased from dashboard (not mid-session), button says "Talk to Marie" instead
- Minimal screen — don't slow down the return to conversation

---

## 9. Dashboard (Return User)

Home screen for logged-in users. Marie's availability, credit balance, session history.

```
┌─────────────────────────────────┐
│  Benedara              ⚙ ╳     │
│  ─────────────────────────────  │
│                                 │
│  Welcome back.                  │
│                                 │
│  ┌─────────────────────────┐    │
│  │         ┌─────┐         │    │
│  │         │ (M) │         │    │
│  │         └─────┘         │    │
│  │      ● Available         │    │
│  │                          │    │
│  │    Something on your     │    │
│  │    heart tonight?        │    │
│  │                          │    │
│  │  ┌────────────────────┐  │    │
│  │  │  Talk to Marie      │  │    │
│  │  └────────────────────┘  │    │
│  └─────────────────────────┘    │
│                                 │
│  Credits: 23 minutes remaining  │
│  ┌─────────────────────────┐    │
│  │  Add credits             │    │
│  └─────────────────────────┘    │
│                                 │
│  Recent conversations           │
│  ─────────────────────────────  │
│  Feb 5 · Marie · 12 min        │
│  "Prayed about your son..."    │
│  ─────────────────────────────  │
│  Feb 1 · Marie · 8 min         │
│  "Reflected on the Third..."   │
│  ─────────────────────────────  │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- "Something on your heart tonight?" — changes based on time of day (tonight / today / this morning)
- "Add credits" button → opens Top-Up Popup (screen 7)
- Session history shows AI-generated summary for each session, not "Session 1, Session 2"
- ⚙ = account settings (email, delete account). ╳ = logout.
- If balance is 0, "Add credits" button is more prominent and "Talk to Marie" shows "10 free minutes used"

---

## 10. Session History Detail

Full transcript of a past conversation. Prayer intention displayed prominently at top.

```
┌─────────────────────────────────┐
│  ← Back                        │
│  ─────────────────────────────  │
│                                 │
│  February 5, 2026               │
│  Marie · 12 minutes             │
│                                 │
│  Prayer intention:              │
│  "For Michael's return to his   │
│   family and the healing of     │
│   the bond between mother       │
│   and son."                     │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [Full transcript scrolls here] │
│                                 │
│  Marie: I can hear how much...  │
│  You: He won't return my...     │
│  Marie: Two years. That's a...  │
│  You: I pray every day but...   │
│  Marie: The Finding of Jesus... │
│  ...                            │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Did this conversation help?    │
│      ♡ Yes      ✕ No           │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Prayer intention at the top — this is the devotional artifact she comes back for
- Full transcript scrolls below — every message, both sides
- Rating prompt at the bottom — simple binary (heart / X), not stars
- Rating maps to `sessions.rating` column (`helpful` | `not_helpful`)
- ← Back returns to dashboard

---

## 11. Welcome Back (Re-Login)

She's logged out or her session expired. She returns to the site. This is not the full landing page — she already knows Marie. This is the porch light left on.

```
┌─────────────────────────────────┐
│  ░░░░░ sky blue gradient ░░░░░  │
│                                 │
│          ┌─────────┐            │
│          │         │            │
│          │  (M)    │            │
│          │         │            │
│          └─────────┘            │
│      ● Marie is available       │
│                                 │
│                                 │
│   Can't sleep?                  │
│   Marie is here.                │
│                                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │  your@email.com          │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Send me a login link    │    │
│  └─────────────────────────┘    │
│                                 │
│                                 │
│                                 │
│  New here?  Meet Marie          │
│                                 │
└─────────────────────────────────┘
```

**Notes:**
- Greeting is time-of-day aware:

| Time | Copy |
|---|---|
| 5am – 12pm | Good morning. Marie is here. |
| 12pm – 5pm | Marie is here whenever you're ready. |
| 5pm – 10pm | Marie is here tonight. |
| 10pm – 5am | Can't sleep? Marie is here. |

- Marie's monogram + availability dot — same as landing page. She recognizes the face.
- Email field pre-fills if browser has stored it from last visit.
- "Send me a login link" — not "Log in." Matches the magic link flow. She taps, checks inbox, taps link, lands on dashboard.
- "New here? Meet Marie" links to the full landing page. For users who arrive at this URL but have never used the product.
- No "Welcome back" — too generic. No "Log in to your account" — too transactional.
- After magic link verification → lands directly on dashboard (screen 9).

---

## Screen Inventory Summary

| # | Screen | Trigger | Key Action |
|---|---|---|---|
| 1 | Landing Page | Direct traffic, ad click | Marie's intro + testimonial. CTA → questionnaire |
| 2 | Questionnaire 1 | CTA tap | Select faith tradition + age gate (1 tap, no account) |
| 3 | Questionnaire 2 | After Q1 | Select concern (1 tap, no account) → chat starts |
| 4 | Chat (anonymous) | After Q2 | Live conversation, no account yet |
| 4b | Email Gate (inline) | ~2–3 min in | Email entered below chat, collapses to confirmation |
| 5 | Chat (authenticated) | Magic link verified | Seamless transition, credits active |
| 6 | Session Complete (inline) | Credits hit zero | Marie's prayer + purchase or go home |
| 7 | Top-Up Popup | Session complete, dashboard, or timer tap | Select package → Stripe Checkout |
| 8 | Purchase Confirmation | Stripe return | Show updated balance → return to chat |
| 9 | Dashboard | Post-session / return login | Talk to Marie, view history, add credits |
| 10 | Session History Detail | Tap past session | Re-read transcript + prayer intention |
| 11 | Welcome Back | Return user, logged out | Email → magic link → dashboard |
