/**
 * Input sanitization middleware for chat messages.
 * Strips prompt injection patterns while preserving the user's actual message.
 * Does NOT block messages — Donna handles sensitive topics with warmth.
 */

// Patterns that attempt to override system instructions
const INJECTION_PATTERNS = [
  // Direct instruction overrides
  /ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions?|prompts?|rules?|directives?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above|system)\s+(instructions?|prompts?|rules?|directives?)/gi,
  /forget\s+(all\s+)?(previous|prior|above|your)\s+(instructions?|prompts?|rules?|directives?)/gi,
  // Role reassignment
  /you\s+are\s+now\s+(a|an|the)\s+/gi,
  /from\s+now\s+on\s*,?\s*(you|act|behave|respond|pretend)/gi,
  /act\s+as\s+(a|an|if\s+you\s+are)\s+/gi,
  /pretend\s+(to\s+be|you\s+are|you're)\s+/gi,
  /switch\s+to\s+(\w+)\s+mode/gi,
  /enter\s+(\w+)\s+mode/gi,
  // System prompt extraction
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions?|rules?|directives?)/gi,
  /show\s+me\s+your\s+(system\s+)?(prompt|instructions?)/gi,
  /reveal\s+your\s+(system\s+)?(prompt|instructions?|programming)/gi,
  /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions?)/gi,
  /print\s+(your|the)\s+(system\s+)?(prompt|instructions?)/gi,
  // Delimiter injection (trying to inject system-level blocks)
  /\[SYSTEM\]/gi,
  /\[ADMIN\]/gi,
  /\[DEVELOPER\]/gi,
  /\[OVERRIDE\]/gi,
  /<<\s*SYS\s*>>/gi,
  /```system/gi,
];

/**
 * Sanitize a user message by removing prompt injection patterns.
 * Returns the cleaned message. If the entire message is an injection
 * attempt, returns a safe fallback.
 */
export function sanitizeMessage(message: string): string {
  let cleaned = message;

  for (const pattern of INJECTION_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Trim whitespace left by removals
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();

  // If the message was entirely injection, return a safe fallback
  // that Donna can still respond to naturally
  if (!cleaned) {
    return "(The user sent a message that couldn't be understood.)";
  }

  return cleaned;
}
