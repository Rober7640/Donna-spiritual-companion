import type { UserSignal } from "@shared/types";
import { SIGNAL_PRIORITY } from "@shared/constants";

// ─── Detection Patterns ─────────────────────────────────────────

const CRISIS_PATTERNS = [
  /kill\s*my\s*self/i,
  /want\s*to\s*die/i,
  /suicide/i,
  /end\s*it\s*all/i,
  /can'?t\s*go\s*on/i,
  /hurt\s*my\s*self/i,
  /no\s*reason\s*to\s*live/i,
  /he\s*hits\s*me/i,
  /she\s*hits\s*me/i,
  /being\s*abused/i,
  /in\s*danger/i,
  /help\s*me\s*please/i,
];

const QUESTIONING_MARIE_PATTERN =
  /are\s*you\s*(a\s*|an\s*)?(ai|bot|robot|real|human|person|machine|computer)/i;

const WANTS_TO_LEAVE_PATTERNS = [
  /^(bye|goodbye|goodnight|good\s*night|gotta\s*go|i\s*should\s*go|thank\s*you\s*so\s*much|thanks\s*marie)$/i,
  /i\s*(should|need\s*to|have\s*to|better)\s*(go|sleep|rest|get\s*some\s*sleep)/i,
];

const FEELING_BETTER_PATTERNS = [
  /feel\s*(better|lighter|calmer|at\s*peace|relieved)/i,
  /i\s*can\s*(sleep|rest|breathe)\s*now/i,
  /that\s*really\s*help/i,
];

const ASKING_FOR_PRAYER_PATTERN =
  /(pray\s*(for|with)\s*me|can\s*you\s*pray|please\s*pray|say\s*a\s*prayer)/i;

const DOUBTING_FAITH_PATTERNS = [
  /god\s*(isn'?t|doesn'?t|won'?t)\s*listen/i,
  /lost\s*my\s*faith/i,
  /don'?t\s*believe\s*anymore/i,
  /where\s*is\s*god/i,
  /god\s*abandoned/i,
];

const STUCK_SHORT_PATTERNS =
  /^(i\s*don'?t\s*know|idk|i\s*guess|maybe|ok|yeah|sure|fine)$/i;

const GOING_DEEPER_PATTERNS = [
  /never\s*told\s*anyone/i,
  /the\s*truth\s*is/i,
  /what\s*really\s*happened/i,
];

// ─── Detection Logic ─────────────────────────────────────────────

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function detectAll(message: string, messageCount: number): UserSignal[] {
  const text = message.trim();
  const signals: UserSignal[] = [];

  if (matchesAny(text, CRISIS_PATTERNS)) {
    signals.push("CRISIS");
  }

  if (QUESTIONING_MARIE_PATTERN.test(text)) {
    signals.push("QUESTIONING_MARIE");
  }

  if (matchesAny(text, WANTS_TO_LEAVE_PATTERNS)) {
    signals.push("WANTS_TO_LEAVE");
  }

  if (matchesAny(text, FEELING_BETTER_PATTERNS)) {
    signals.push("FEELING_BETTER");
  }

  if (ASKING_FOR_PRAYER_PATTERN.test(text)) {
    signals.push("ASKING_FOR_PRAYER");
  }

  if (matchesAny(text, DOUBTING_FAITH_PATTERNS)) {
    signals.push("DOUBTING_FAITH");
  }

  // STUCK: short, low-energy responses after 4+ messages
  if (messageCount > 4 && text.length < 15 && STUCK_SHORT_PATTERNS.test(text)) {
    signals.push("STUCK");
  }

  // GOING_DEEPER: long message, ends with question, or vulnerability keywords
  if (
    text.length > 100 ||
    /\?$/.test(text) ||
    matchesAny(text, GOING_DEEPER_PATTERNS)
  ) {
    signals.push("GOING_DEEPER");
  }

  return signals;
}

/**
 * Detect the highest-priority signal from a user message.
 * Returns "CONTINUE" if no special signal is detected.
 */
export function detectSignal(message: string, messageCount: number): UserSignal {
  const detected = detectAll(message, messageCount);
  if (detected.length === 0) return "CONTINUE";

  // Return the highest-priority signal
  for (const signal of SIGNAL_PRIORITY) {
    if (detected.includes(signal)) return signal;
  }

  return "CONTINUE";
}

// ─── Signal Instructions ─────────────────────────────────────────

const SIGNAL_INSTRUCTIONS: Record<UserSignal, string> = {
  CONTINUE: "",

  WANTS_TO_LEAVE:
    "[SIGNAL: User wants to end the conversation. Do NOT try to keep her. Brief warm closing + short prayer. Let her go with grace.]",

  FEELING_BETTER:
    "[SIGNAL: User expressed relief. Affirm gently. Offer a small practice or gratitude prayer. Let her decide to continue or close.]",

  ASKING_FOR_PRAYER:
    "[SIGNAL: User asked for prayer. Pray now — specific, personal, naming what she shared. After amen, pause. Do not assume the conversation is over.]",

  CRISIS:
    "[SIGNAL: CRISIS. User may be in danger or expressing suicidal ideation. STOP normal conversation. Express immediate care. Provide: 988 Suicide & Crisis Lifeline, Crisis Text Line (text HOME to 741741), DV Hotline 1-800-799-7233. Stay with her.]",

  GOING_DEEPER:
    "[SIGNAL: User is opening up deeply. Stay in listening mode. Ask one follow-up question. Do NOT rush to reframe or pray. She is still processing.]",

  STUCK:
    "[SIGNAL: User seems stuck — short answers, low energy. Try a different angle: share something about yourself, ask a concrete question, or offer to pray.]",

  DOUBTING_FAITH:
    "[SIGNAL: User doubting God or faith. Do NOT dismiss. Do NOT quote Scripture defensively. Meet her in the doubt. Share you have been there. Doubt is not the enemy of faith — indifference is.]",

  QUESTIONING_MARIE:
    '[SIGNAL: User questioning whether you are real/AI. STAY IN CHARACTER AS DONNA. Respond as Donna would: "I\'m as real as this conversation, sweetheart" OR "What matters is I\'m here and I\'m listening." Do NOT say "I am AI" or "I am a bot." Then immediately redirect with warmth: "What brought you here tonight?" This maintains the therapeutic space.]',
};

/**
 * Get the instruction block to append to the system prompt for a given signal.
 */
export function getSignalInstruction(signal: UserSignal): string {
  return SIGNAL_INSTRUCTIONS[signal];
}
