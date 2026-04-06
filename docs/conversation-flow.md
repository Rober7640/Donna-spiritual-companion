# Conversation Flow

```mermaid
flowchart TD
    %% ── Entry ──────────────────────────────────────────
    LAND["Landing Page"]
    LAND -->|"Talk to Marie"| ONB1

    LOGIN["Welcome Back (/login)"]
    LOGIN -->|"Enter email"| MAGIC["Magic Link Sent"]
    MAGIC -->|"Click link in inbox"| DASH

    LOGIN -->|"Already authenticated"| DASH

    %% ── Onboarding ────────────────────────────────────
    ONB1["Onboarding Step 1\nAge confirmation + Faith tradition"]
    ONB1 -->|"Under 18"| BLOCK["Blocked — age gate"]
    ONB1 -->|"18+ confirmed"| ONB2["Onboarding Step 2\nWhat's on your heart?"]
    ONB2 --> CHAT_START

    %% ── Chat Start ────────────────────────────────────
    CHAT_START(["Chat Session Begins"])
    CHAT_START -->|"POST /chat/start"| SESSION_CREATED["Session Created"]
    SESSION_CREATED --> GREETING["Marie: I'm glad you're here tonight.\nTell me — what's weighing on your heart?"]
    GREETING --> MSG_LOOP

    %% ── Core Message Loop ─────────────────────────────
    MSG_LOOP{"User types a message"}

    %% Gate check
    MSG_LOOP -->|"Email detected\nin message"| EMAIL_CAPTURE["Capture Email\nSend magic link"]
    EMAIL_CAPTURE --> CONFIRM_MSG["Marie: Got it, sweetheart.\nCheck your inbox..."]
    CONFIRM_MSG --> AUTH_TRANSITION["Session converts\nAnonymous → Authenticated"]
    AUTH_TRANSITION --> CREDIT_START["Free trial credits granted\nHeartbeat begins"]
    CREDIT_START --> MSG_LOOP

    MSG_LOOP -->|"Normal message"| SEND_TO_SERVER

    %% ── Server Processing ─────────────────────────────
    SEND_TO_SERVER["POST /chat/message"]
    SEND_TO_SERVER --> SIGNAL{"Signal Detection"}

    SIGNAL -->|"CRISIS"| CRISIS_FLOW
    SIGNAL -->|"WANTS_TO_LEAVE"| LEAVE_FLOW
    SIGNAL -->|"ASKING_FOR_PRAYER"| PRAYER_FLOW
    SIGNAL -->|"DOUBTING_FAITH"| DOUBT_FLOW
    SIGNAL -->|"STUCK"| STUCK_FLOW
    SIGNAL -->|"GOING_DEEPER"| DEEPER_FLOW
    SIGNAL -->|"FEELING_BETTER"| BETTER_FLOW
    SIGNAL -->|"CONTINUE"| NORMAL_FLOW

    %% ── Signal Responses ──────────────────────────────
    CRISIS_FLOW["Flag session\nShow crisis resources\n988 / 741741 / 1-800-799-7233"]
    CRISIS_FLOW --> STREAM

    LEAVE_FLOW["Brief warm closing\nPersonal prayer\nLet them go with grace"]
    LEAVE_FLOW --> STREAM

    PRAYER_FLOW["Pray now — specific, personal\nName what they shared\nDon't assume conversation over"]
    PRAYER_FLOW --> STREAM

    DOUBT_FLOW["Meet them in the doubt\nShare personal experience\nDon't quote Scripture defensively"]
    DOUBT_FLOW --> STREAM

    STUCK_FLOW["Try a different angle\nShare about self\nAsk a concrete question"]
    STUCK_FLOW --> STREAM

    DEEPER_FLOW["Stay in listening mode\nAsk follow-up\nDon't rush to reframe"]
    DEEPER_FLOW --> STREAM

    BETTER_FLOW["Affirm gently\nOffer practice or prayer\nLet user choose to continue"]
    BETTER_FLOW --> STREAM

    NORMAL_FLOW["Standard Rosary-grounded\nconversation"]
    NORMAL_FLOW --> STREAM

    %% ── Streaming Response ────────────────────────────
    STREAM["Stream Claude response\ntoken by token via SSE"]
    STREAM --> MARIE_REPLY["Marie's response\nappears in chat"]
    MARIE_REPLY --> CREDIT_CHECK

    %% ── Credit / Gate Check ───────────────────────────
    CREDIT_CHECK{"Check state"}

    CREDIT_CHECK -->|"Authenticated\n+ credits > 0"| MSG_LOOP
    CREDIT_CHECK -->|"Authenticated\n+ credits = 0"| TOPUP_POPUP
    CREDIT_CHECK -->|"Anonymous\n+ Marie's 4th response"| GATE_ASK
    CREDIT_CHECK -->|"Anonymous\n+ < 4 responses"| MSG_LOOP

    %% ── Email Gate (Conversational, Soft Only) ───────
    GATE_ASK["Marie asks once, gently:\n'I want to remember you.\nLeave me your email?'"]
    GATE_ASK --> MSG_LOOP

    %% ── Top Up Flow ───────────────────────────────────
    TOPUP_POPUP["Top Up Popup\nStarter: 30 min / $14.99\nFaithful: 90 min / $39.99"]
    TOPUP_POPUP -->|"Select package"| STRIPE["Stripe Checkout"]
    TOPUP_POPUP -->|"Dismiss"| END_SESSION
    STRIPE -->|"Payment success"| WEBHOOK["Stripe Webhook\nCredits added"]
    WEBHOOK --> PURCHASE_SUCCESS["Purchase Success Page\nUpdated balance shown"]
    PURCHASE_SUCCESS -->|"Continue with Marie"| CHAT_START

    %% ── Session End ───────────────────────────────────
    MSG_LOOP -->|"User clicks End"| END_SESSION
    END_SESSION["POST /chat/end"]
    END_SESSION --> WRAPUP["Calculate duration\nDeduct credits\nGenerate summary + prayer intention"]
    WRAPUP -->|"Authenticated"| DASH
    WRAPUP -->|"Anonymous"| LAND

    %% ── Dashboard (Post-Auth) ─────────────────────────
    DASH["Dashboard"]
    DASH -->|"Talk to Marie"| CHAT_START
    DASH -->|"View past session"| SESSION_DETAIL["Session Detail\nTranscript + Summary\n+ Prayer Intention + Rating"]
    DASH -->|"Add credits"| TOPUP_POPUP
    SESSION_DETAIL -->|"Rate: helpful / not helpful"| SESSION_DETAIL

    %% ── Styling ───────────────────────────────────────
    classDef entry fill:#e8f4f8,stroke:#2196F3
    classDef gate fill:#fff3e0,stroke:#FF9800
    classDef crisis fill:#ffebee,stroke:#f44336
    classDef purchase fill:#e8f5e9,stroke:#4CAF50
    classDef signal fill:#f3e5f5,stroke:#9C27B0

    class LAND,LOGIN,DASH entry
    class GATE_ASK gate
    class CRISIS_FLOW crisis
    class TOPUP_POPUP,STRIPE,WEBHOOK,PURCHASE_SUCCESS purchase
    class SIGNAL,LEAVE_FLOW,PRAYER_FLOW,DOUBT_FLOW,STUCK_FLOW,DEEPER_FLOW,BETTER_FLOW,NORMAL_FLOW signal
```

## Email Gate — Depth-Based, Soft Only

Marie asks for email **once**, after her **4th response** in the conversation. By that point she knows the user's name, their concern, and has gone at least one round deeper — the conversation has enough value that preserving it feels natural, not transactional.

| Trigger | Marie Says | Behavior |
|---------|-----------|----------|
| 4th assistant message | "I want to remember this conversation — and I want to remember you. If you leave me your email, I can hold onto what you shared tonight." | Chat continues normally. Never blocks. Never asks again. |

**Key rules**: Asks once. Never blocks conversation. Never escalates. If user ignores, Marie moves on.

## Signal Priority (highest to lowest)

| Signal | Trigger | Marie's Approach |
|--------|---------|-----------------|
| CRISIS | "kill myself", "want to die", abuse language | Stop conversation. Show resources. Flag session. |
| QUESTIONING_MARIE | "are you AI / real / human" | Stay in character. "I'm as real as this conversation." |
| WANTS_TO_LEAVE | "bye", "gotta go", "thank you" | Brief closing. Personal prayer. Let them go. |
| FEELING_BETTER | "feel better", "that helped" | Affirm. Offer a practice. Don't over-talk. |
| ASKING_FOR_PRAYER | "pray for me", "can you pray" | Pray immediately. Specific. Personal. |
| DOUBTING_FAITH | "god doesn't listen", "lost my faith" | Meet in doubt. Share experience. No proof-texting. |
| STUCK | Short replies after 4+ messages | Change angle. Ask something concrete. |
| GOING_DEEPER | Long message, vulnerable language | Listen. Follow up. Don't rush to reframe. |
| CONTINUE | Default | Standard Rosary-grounded conversation |

## Credit Flow

```
Anonymous user → Email gate (conversational) → Magic link → Authenticated
    → Free trial (10 min) granted
    → Heartbeat every 60s tracks usage
    → Credits hit 0 → TopUp popup
    → Stripe checkout → Webhook adds credits → Continue
```

## Session Lifecycle

```
Start → Messages ↔ Marie → [optional: email gate] → [optional: crisis] → End
    → Duration calculated
    → Credits deducted
    → Summary generated (Haiku)
    → Prayer intention extracted
    → Session saved to history
```
