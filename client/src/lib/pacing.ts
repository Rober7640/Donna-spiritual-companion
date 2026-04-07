/**
 * Pacing engine for Donna's responses.
 * Controls initial delay, token reveal speed, and paragraph pauses.
 */

/**
 * Calculate the initial "thinking" delay before Donna starts typing.
 * Simulates Donna reading and considering the user's message.
 * Inspired by Seer Within: 60ms/char base, 1–5s range, ±20% variance.
 */
export function getInitialDelay(userMessageLength: number): number {
  const baseSpeed = 60; // ms per character of user's message
  const variance = 0.2;
  const randomFactor = 1 + (Math.random() * variance * 2 - variance);
  const baseTime = userMessageLength * baseSpeed * randomFactor;
  return Math.min(Math.max(baseTime, 2000), 5000);
}

/**
 * Human-like typing speed: ~5-7 characters per second.
 * Returns milliseconds per character with slight randomness.
 */
export const TOKEN_REVEAL_INTERVAL_MS = 50; // ~20 chars/sec — feels like natural reading pace

/**
 * Paragraph pause duration in milliseconds.
 * When Donna's response has a paragraph break, pause before continuing
 * as if she's gathering her next thought.
 */
export function getParagraphPauseMs(): number {
  return randomBetween(1200, 2000);
}

/**
 * Sentence-end pause: a brief pause after periods, question marks, exclamation marks.
 * Makes longer responses feel like they're being composed thoughtfully.
 */
export function getSentencePauseMs(): number {
  return randomBetween(300, 600);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * TokenBuffer: accumulates tokens from SSE, releases them at a controlled pace.
 */
export class TokenBuffer {
  private buffer: string[] = [];
  private displayedText = "";
  private isRevealing = false;
  private onReveal: (text: string) => void;
  private onComplete: () => void;
  private isDone = false;
  private aborted = false;

  constructor(
    onReveal: (text: string) => void,
    onComplete: () => void,
  ) {
    this.onReveal = onReveal;
    this.onComplete = onComplete;
  }

  /** Add a token chunk from the SSE stream */
  push(token: string) {
    this.aborted = false;
    this.buffer.push(token);
    if (!this.isRevealing) {
      this.startRevealing();
    }
  }

  /** Mark the stream as complete */
  finish() {
    this.isDone = true;
    // If not currently revealing, flush remaining
    if (!this.isRevealing && this.buffer.length > 0) {
      this.startRevealing();
    }
  }

  private async startRevealing() {
    this.isRevealing = true;

    while ((this.buffer.length > 0 || !this.isDone) && !this.aborted) {
      if (this.buffer.length === 0) {
        if (this.isDone) break;
        // Wait for more tokens
        await sleep(50);
        continue;
      }

      const chunk = this.buffer.shift()!;

      for (const char of chunk) {
        if (this.aborted) return;

        this.displayedText += char;

        // Detect paragraph break — longer pause as if gathering next thought
        if (char === "\n" && this.displayedText.endsWith("\n\n")) {
          this.onReveal(this.displayedText);
          await sleep(getParagraphPauseMs());
          continue;
        }

        // Sentence-end pause — brief breath after completing a thought
        if ((char === "." || char === "?" || char === "!") && this.displayedText.length > 1) {
          const prevChar = this.displayedText[this.displayedText.length - 2];
          // Only pause on real sentence endings, not abbreviations like "St."
          if (prevChar !== "." && prevChar !== " ") {
            this.onReveal(this.displayedText);
            await sleep(getSentencePauseMs());
            continue;
          }
        }

        this.onReveal(this.displayedText);
        await sleep(TOKEN_REVEAL_INTERVAL_MS);
      }
    }

    if (this.aborted) return;

    // Flush any remaining text
    if (this.buffer.length > 0) {
      const remaining = this.buffer.join("");
      this.displayedText += remaining;
      this.onReveal(this.displayedText);
      this.buffer = [];
    }

    this.isRevealing = false;
    this.onComplete();
  }

  /** Reset the buffer state and stop revealing */
  reset() {
    this.aborted = true;
    this.buffer = [];
    this.displayedText = "";
    this.isRevealing = false;
    this.isDone = false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
