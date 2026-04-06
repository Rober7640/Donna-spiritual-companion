import { HEARTBEAT_TIMEOUT_MS } from "@shared/constants";

/**
 * Tracks active session heartbeats to detect abandoned sessions.
 * Key: sessionId, Value: last heartbeat timestamp.
 */
const sessionHeartbeats = new Map<string, number>();

/**
 * Record a heartbeat for a session.
 */
export function recordHeartbeat(sessionId: string): void {
  sessionHeartbeats.set(sessionId, Date.now());
}

/**
 * Start tracking a session (called when session begins).
 */
export function startTracking(sessionId: string): void {
  sessionHeartbeats.set(sessionId, Date.now());
}

/**
 * Stop tracking a session (called when session ends).
 */
export function stopTracking(sessionId: string): void {
  sessionHeartbeats.delete(sessionId);
}

/**
 * Check if a session has timed out (no heartbeat for HEARTBEAT_TIMEOUT_MS).
 */
export function isSessionTimedOut(sessionId: string): boolean {
  const lastBeat = sessionHeartbeats.get(sessionId);
  if (!lastBeat) return true;
  return Date.now() - lastBeat > HEARTBEAT_TIMEOUT_MS;
}

/**
 * Get all timed-out session IDs for cleanup.
 */
export function getTimedOutSessions(): string[] {
  const timedOut: string[] = [];
  const now = Date.now();

  sessionHeartbeats.forEach((lastBeat, sessionId) => {
    if (now - lastBeat > HEARTBEAT_TIMEOUT_MS) {
      timedOut.push(sessionId);
    }
  });

  return timedOut;
}

/**
 * Clean up all timed-out sessions from tracking.
 */
export function cleanupTimedOut(): string[] {
  const timedOut = getTimedOutSessions();
  for (const id of timedOut) {
    sessionHeartbeats.delete(id);
  }
  return timedOut;
}
