/**
 * Pacing engine for Donna's responses.
 * Controls initial delay, token reveal speed, and paragraph pauses.
 */

/**
 * Calculate the initial delay before Donna starts "typing" based on message length.
 */
export function getInitialDelay(userMessageLength: number): number {
  const wordCount = userMessageLength.toString().split(/\s+/).length;

  if (wordCount < 20) return randomBetween(1500, 2000);
  if (wordCount <= 80) return randomBetween(2000, 3000);
  return randomBetween(3000, 4000);
}

/**
 * Target reveal speed: ~30-40 words per second.
 * Returns milliseconds per character.
 */
export const TOKEN_REVEAL_INTERVAL_MS = 25; // ~40 chars/sec ≈ 8 words/sec display

/**
 * Paragraph pause duration in milliseconds.
 * When Donna's response has a paragraph break, pause before continuing.
 */
export function getParagraphPauseMs(): number {
  return randomBetween(800, 1200);
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

        // Detect paragraph break
        if (char === "\n" && this.displayedText.endsWith("\n\n")) {
          this.onReveal(this.displayedText);
          await sleep(getParagraphPauseMs());
          continue;
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
