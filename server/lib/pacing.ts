/**
 * Server-side pacing configuration.
 * The actual pacing (token reveal speed, paragraph pauses) is controlled client-side.
 * This module provides delay hints sent to the client via SSE.
 */

/**
 * Calculate the recommended initial delay before the first token,
 * based on user message length.
 */
export function getRecommendedDelayMs(message: string): number {
  const wordCount = message.split(/\s+/).length;

  if (wordCount < 20) return randomBetween(1500, 2000);
  if (wordCount <= 80) return randomBetween(2000, 3000);
  return randomBetween(3000, 4000);
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
