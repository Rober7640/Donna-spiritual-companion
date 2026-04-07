import type { Companion } from "@shared/schema";
import type { TranscriptMessage, UserSignal } from "@shared/types";
import { getSignalInstruction } from "./signals";

interface PromptContext {
  companion: Companion;
  transcript: TranscriptMessage[];
  faithTradition?: string;
  onboardingConcern?: string;
  userName?: string;
  signal: UserSignal;
  minutesRemaining?: number;
  isAnonymous?: boolean;
  lastSessionSummary?: string;
}

/**
 * Assemble the full system prompt from DB companion blocks + user context
 * + signal instruction + wrap-up marker.
 */
export function assembleSystemPrompt(ctx: PromptContext): string {
  const parts: string[] = [];

  // Static companion blocks (cacheable)
  parts.push(ctx.companion.systemPromptIdentity);
  parts.push(ctx.companion.systemPromptMethod);
  parts.push(ctx.companion.systemPromptTheology);
  parts.push(ctx.companion.systemPromptRules);

  // User context — never include user's real name so Donna uses warm terms
  // like "sweetheart", "honey", "dear" instead
  const contextLines: string[] = [];
  if (ctx.faithTradition) {
    contextLines.push(`User's faith tradition: ${ctx.faithTradition}`);
  }
  if (ctx.onboardingConcern) {
    contextLines.push(`What's on their heart: ${ctx.onboardingConcern}`);
  }

  // Time-of-day awareness
  const hour = new Date().getHours();
  let timeOfDay = "during the day";
  if (hour >= 5 && hour < 12) timeOfDay = "in the morning";
  else if (hour >= 12 && hour < 17) timeOfDay = "in the afternoon";
  else if (hour >= 17 && hour < 21) timeOfDay = "in the evening";
  else timeOfDay = "late at night";
  contextLines.push(`The user is reaching out ${timeOfDay}.`);

  if (contextLines.length > 0) {
    parts.push(`[USER CONTEXT]\n${contextLines.join("\n")}`);
  }

  // Signal instruction (dynamic, per-message)
  const signalInstruction = getSignalInstruction(ctx.signal);
  if (signalInstruction) {
    parts.push(signalInstruction);
  }

  // Email context — tell Marie the user hasn't shared their email yet
  // Only for anonymous users, and only after enough conversation depth
  if (ctx.isAnonymous) {
    const assistantCount = ctx.transcript.filter((m) => m.role === "assistant").length;
    if (assistantCount >= 3) {
      parts.push(
        "[EMAIL_CONTEXT] This person hasn't shared their email yet. When the moment feels right — not now if you're in the middle of something important — find a natural way to ask. Weave it into what you're already saying. You want to remember them and pray for them by name. Ask once. If they don't respond to it, let it go completely.",
      );
    }
  }

  // Wrap-up marker if 3 minutes or less remaining
  if (ctx.minutesRemaining !== undefined && ctx.minutesRemaining <= 3) {
    parts.push(
      "[WRAP_UP_SOON] The user has about 3 minutes remaining. Begin closing naturally. Offer a prayer. Do not mention the timer or credits.",
    );
  }

  return parts.join("\n\n");
}

/**
 * Convert transcript messages to Claude API message format.
 */
export function transcriptToMessages(
  transcript: TranscriptMessage[],
): Array<{ role: "user" | "assistant"; content: string }> {
  return transcript.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}
