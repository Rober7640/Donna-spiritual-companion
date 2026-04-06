import { randomUUID } from "crypto";
import { ANONYMOUS_SESSION_EXPIRE_MS } from "@shared/constants";
import type { TranscriptMessage } from "@shared/types";

interface AnonymousSession {
  id: string;
  faithTradition: string;
  onboardingConcern: string;
  userName: string;
  transcript: TranscriptMessage[];
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
}

class AnonymousSessionStore {
  private sessions = new Map<string, AnonymousSession>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  create(faithTradition: string, onboardingConcern: string, userName: string = ""): AnonymousSession {
    const now = Date.now();
    const session: AnonymousSession = {
      id: randomUUID(),
      faithTradition,
      onboardingConcern,
      userName,
      transcript: [],
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + ANONYMOUS_SESSION_EXPIRE_MS,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  get(id: string): AnonymousSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(id);
      return undefined;
    }
    return session;
  }

  addMessage(id: string, message: TranscriptMessage): boolean {
    const session = this.get(id);
    if (!session) return false;
    session.transcript.push(message);
    session.lastActivityAt = Date.now();
    return true;
  }

  getElapsedSeconds(id: string): number {
    const session = this.get(id);
    if (!session) return 0;
    return Math.floor((Date.now() - session.createdAt) / 1000);
  }

  remove(id: string): AnonymousSession | undefined {
    const session = this.sessions.get(id);
    this.sessions.delete(id);
    return session;
  }

  private cleanup() {
    const now = Date.now();
    this.sessions.forEach((session, id) => {
      if (now > session.expiresAt) {
        this.sessions.delete(id);
      }
    });
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export const anonymousSessions = new AnonymousSessionStore();
