// ─── User Signals ─────────────────────────────────────────────────

export type UserSignal =
  | "CONTINUE"
  | "WANTS_TO_LEAVE"
  | "FEELING_BETTER"
  | "ASKING_FOR_PRAYER"
  | "CRISIS"
  | "GOING_DEEPER"
  | "STUCK"
  | "DOUBTING_FAITH"
  | "QUESTIONING_MARIE";

// ─── Enums ────────────────────────────────────────────────────────

export type FaithTradition = "catholic" | "evangelical" | "charismatic" | "other";
export type OnboardingConcern = "family" | "crisis" | "fear" | "doubt" | "talk";
export type CompanionStatus = "active" | "coming_soon" | "retired";
export type CreditTransactionType =
  | "free_trial"
  | "purchase"
  | "deduction"
  | "gift_received"
  | "refund"
  | "promo";
export type SessionRating = "helpful" | "not_helpful";
export type FlagReason =
  | "suicidal_ideation"
  | "self_harm"
  | "abuse_disclosure"
  | "minor_detected";
export type ReengagementTrigger =
  | "first_followup"
  | "checkin"
  | "prayer_reminder"
  | "gentle_reopen";
export type EmailGateState = "soft" | "gentle" | "firm" | "hard";

// ─── API Request/Response Contracts ───────────────────────────────

// Auth
export interface RequestLinkBody {
  email: string;
}

export interface RequestLinkResponse {
  success: boolean;
  message: string;
}

export interface VerifyResponse {
  jwt: string;
  userId: string;
}

export interface ConvertBody {
  jwt: string;
  faithTradition: string;
  onboardingConcern: string;
  transcript: TranscriptMessage[];
  tempSessionToken: string;
}

export interface ConvertResponse {
  userId: string;
  sessionId: string;
  creditBalance: number;
}

// Option B: Direct signup (no magic link)
export interface SignupBody {
  email: string;
  name?: string;
  faithTradition?: string;
  onboardingConcern?: string;
}

export interface SignupResponse {
  userId: string;
  tokenHash: string;
  creditBalance: number;
}

export interface MeResponse {
  userId: string;
  email: string;
  displayName: string | null;
  balanceMinutes: number;
  faithTradition: string | null;
  onboardingConcern: string | null;
  trialExpiresAt: string | null;
  lastSessionSummary: string | null;
}

// Credits
export interface CreditBalanceResponse {
  balanceMinutes: number;
  updatedAt: string;
}

export interface CheckoutBody {
  package: "starter" | "faithful";
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

export interface CreditTransactionResponse {
  id: string;
  type: CreditTransactionType;
  amount: number;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

// Chat
export interface ChatStartBody {
  faithTradition?: string;
  onboardingConcern?: string;
}

export interface ChatStartResponse {
  sessionId: string;
  companionId: string;
}

export interface ChatMessageBody {
  sessionId: string;
  message: string;
}

export interface ChatEndBody {
  sessionId: string;
}

export interface ChatEndResponse {
  durationMinutes: number;
  creditsConsumed: number;
}

export interface ChatHeartbeatBody {
  sessionId: string;
}

// Sessions
export interface SessionListItem {
  id: string;
  companionId: string;
  startedAt: string;
  durationMinutes: number | null;
  summary: string | null;
  prayerIntention: string | null;
  rating: string | null;
}

export interface SessionDetailResponse {
  id: string;
  companionId: string;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
  transcript: TranscriptMessage[];
  summary: string | null;
  prayerIntention: string | null;
  rating: string | null;
}

export interface SessionRateBody {
  rating: SessionRating;
}

// Companions
export interface CompanionListItem {
  id: string;
  displayName: string;
  tagline: string;
  bio: string;
  faithLane: string;
  status: string;
  sortOrder: number;
}

// Onboarding
export interface OnboardingSaveBody {
  faithTradition: FaithTradition;
  onboardingConcern: OnboardingConcern;
}

// ─── Shared Types ─────────────────────────────────────────────────

export interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  signal?: UserSignal;
}
