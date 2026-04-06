import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptMessage } from "@shared/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL_SONNET = "claude-sonnet-4-5-20250929";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

interface StreamChatParams {
  systemPrompt: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Stream a chat response from Claude. Calls onToken for each text chunk,
 * onDone with the full response text when complete.
 */
export async function streamChat(params: StreamChatParams): Promise<void> {
  const { systemPrompt, messages, onToken, onDone, onError } = params;

  let finished = false;

  try {
    const stream = anthropic.messages.stream({
      model: MODEL_SONNET,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    let fullText = "";

    stream.on("text", (text) => {
      fullText += text;
      onToken(text);
    });

    stream.on("end", () => {
      if (!finished) {
        finished = true;
        onDone(fullText);
      }
    });

    stream.on("error", (error) => {
      if (!finished) {
        finished = true;
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    });

    await stream.finalMessage();
  } catch (error) {
    if (!finished) {
      finished = true;
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Generate a session summary using Haiku (fast, cheap).
 * Called after a session ends.
 */
export async function generateSummary(
  transcript: TranscriptMessage[],
): Promise<{ summary: string; prayerIntention: string }> {
  const conversationText = transcript
    .map((m) => `${m.role === "user" ? "User" : "Donna"}: ${m.content}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 300,
    system:
      "You summarize prayer conversations between a user and Donna (a Catholic grandmother). Output valid JSON with two fields: summary (1-2 sentences describing what the user shared — write in second person addressing the user directly, e.g. 'you shared that you were struggling with faith after losing your job' NOT 'Lewis shared...') and prayerIntention (a single prayer intention drawn from what the user shared, or empty string if none). Be warm, specific, and concise. Never use the user's name in the summary. Never use generic phrases like 'a meaningful conversation'.",
    messages: [
      {
        role: "user",
        content: `Summarize this conversation:\n\n${conversationText}`,
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    // Try to extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    return {
      summary: parsed.summary || "",
      prayerIntention: parsed.prayerIntention || "",
    };
  } catch (err) {
    console.error("Summary parse failed:", err, "Raw response:", response.content[0]);
    return {
      summary: "",
      prayerIntention: "",
    };
  }
}

/**
 * Generate a re-engagement email using Haiku.
 */
export async function generateReengagementEmail(params: {
  userName: string;
  lastSessionSummary: string;
  triggerType: string;
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL_HAIKU,
    max_tokens: 300,
    system:
      "You write brief, warm re-engagement emails from Donna (a Catholic grandmother and prayer companion). Keep them under 100 words. Be genuine, not salesy. Reference the user's last conversation naturally. Sign with 'Donna' at the end.",
    messages: [
      {
        role: "user",
        content: `Write a ${params.triggerType} email for ${params.userName}. Their last session: ${params.lastSessionSummary}`,
      },
    ],
  });

  return response.content[0].type === "text"
    ? response.content[0].text
    : "Donna has been thinking of you. Come back when you're ready.";
}
