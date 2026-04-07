import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  companions,
  creditBalances,
  creditTransactions,
  sessions,
  reengagementLog,
  type User,
  type InsertUser,
  type Companion,
  type InsertCompanion,
  type CreditBalance,
  type InsertCreditBalance,
  type CreditTransaction,
  type InsertCreditTransaction,
  type Session,
  type InsertSession,
  type ReengagementLog,
  type InsertReengagementLog,
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Companions
  getCompanion(id: string): Promise<Companion | undefined>;
  listCompanions(): Promise<Companion[]>;
  createCompanion(companion: InsertCompanion): Promise<Companion>;

  // Credit Balances
  getCreditBalance(userId: string): Promise<CreditBalance | undefined>;
  createCreditBalance(balance: InsertCreditBalance): Promise<CreditBalance>;
  updateCreditBalance(userId: string, balanceMinutes: number): Promise<CreditBalance | undefined>;

  // Credit Transactions
  createCreditTransaction(tx: InsertCreditTransaction): Promise<CreditTransaction>;
  listCreditTransactions(userId: string): Promise<CreditTransaction[]>;

  // Sessions
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, data: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  listUserSessions(userId: string): Promise<Session[]>;

  // Reengagement
  createReengagementLog(log: InsertReengagementLog): Promise<ReengagementLog>;
}

// ─── Drizzle (Postgres) Storage ────────────────────────────────────

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db!.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db!.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db!.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getCompanion(id: string): Promise<Companion | undefined> {
    const [companion] = await db!.select().from(companions).where(eq(companions.id, id));
    return companion;
  }

  async listCompanions(): Promise<Companion[]> {
    return db!.select().from(companions).where(eq(companions.status, "active")).orderBy(companions.sortOrder);
  }

  async createCompanion(companion: InsertCompanion): Promise<Companion> {
    const [created] = await db!
      .insert(companions)
      .values(companion)
      .onConflictDoUpdate({ target: companions.id, set: companion })
      .returning();
    return created;
  }

  async getCreditBalance(userId: string): Promise<CreditBalance | undefined> {
    const [balance] = await db!.select().from(creditBalances).where(eq(creditBalances.userId, userId));
    return balance;
  }

  async createCreditBalance(balance: InsertCreditBalance): Promise<CreditBalance> {
    const [created] = await db!.insert(creditBalances).values(balance).returning();
    return created;
  }

  async updateCreditBalance(userId: string, balanceMinutes: number): Promise<CreditBalance | undefined> {
    const [updated] = await db!
      .update(creditBalances)
      .set({ balanceMinutes, updatedAt: new Date() })
      .where(eq(creditBalances.userId, userId))
      .returning();
    return updated;
  }

  async createCreditTransaction(tx: InsertCreditTransaction): Promise<CreditTransaction> {
    const [created] = await db!.insert(creditTransactions).values(tx).returning();
    return created;
  }

  async listCreditTransactions(userId: string): Promise<CreditTransaction[]> {
    return db!.select().from(creditTransactions).where(eq(creditTransactions.userId, userId)).orderBy(desc(creditTransactions.createdAt));
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db!.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db!.insert(sessions).values(session).returning();
    return created;
  }

  async updateSession(id: string, data: Partial<Session>): Promise<Session | undefined> {
    const [updated] = await db!.update(sessions).set(data).where(eq(sessions.id, id)).returning();
    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    const result = await db!.delete(sessions).where(eq(sessions.id, id)).returning();
    return result.length > 0;
  }

  async listUserSessions(userId: string): Promise<Session[]> {
    return db!.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.startedAt));
  }

  async createReengagementLog(log: InsertReengagementLog): Promise<ReengagementLog> {
    const [created] = await db!.insert(reengagementLog).values(log).returning();
    return created;
  }
}

// ─── In-Memory Storage (dev fallback) ──────────────────────────────

function uuid(): string {
  return crypto.randomUUID();
}

export class MemStorage implements IStorage {
  private users = new Map<string, User>();
  private companionMap = new Map<string, Companion>();
  private balances = new Map<string, CreditBalance>();
  private transactions = new Map<string, CreditTransaction[]>();
  private sessionMap = new Map<string, Session>();
  private reengagementLogs: ReengagementLog[] = [];

  async getUser(id: string) { return this.users.get(id); }

  async getUserByEmail(email: string) {
    let found: User | undefined;
    this.users.forEach((u) => {
      if (u.email === email) found = u;
    });
    return found;
  }

  async createUser(data: InsertUser): Promise<User> {
    const user: User = {
      id: uuid(),
      email: data.email,
      emailVerified: false,
      faithTradition: data.faithTradition ?? null,
      onboardingConcern: data.onboardingConcern ?? null,
      createdAt: new Date(),
      lastSessionAt: null,
      reengagementCount: 0,
      lastReengagementAt: null,
      unsubscribed: false,
      crisisFlagged: false,
      metadata: null,
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, data: Partial<User>) {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }

  async getCompanion(id: string) { return this.companionMap.get(id); }

  async listCompanions() {
    return Array.from(this.companionMap.values())
      .filter((c) => c.status === "active")
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createCompanion(data: InsertCompanion): Promise<Companion> {
    const companion: Companion = {
      id: data.id,
      displayName: data.displayName,
      tagline: data.tagline,
      bio: data.bio,
      faithLane: data.faithLane,
      status: data.status ?? "active",
      systemPromptIdentity: data.systemPromptIdentity,
      systemPromptMethod: data.systemPromptMethod,
      systemPromptTheology: data.systemPromptTheology,
      systemPromptRules: data.systemPromptRules,
      sortOrder: data.sortOrder ?? 0,
    };
    this.companionMap.set(companion.id, companion);
    return companion;
  }

  async getCreditBalance(userId: string) { return this.balances.get(userId); }

  async createCreditBalance(data: InsertCreditBalance): Promise<CreditBalance> {
    const balance: CreditBalance = {
      userId: data.userId,
      balanceMinutes: data.balanceMinutes ?? 0,
      updatedAt: data.updatedAt ?? new Date(),
    };
    this.balances.set(balance.userId, balance);
    return balance;
  }

  async updateCreditBalance(userId: string, balanceMinutes: number) {
    const balance = this.balances.get(userId);
    if (!balance) return undefined;
    const updated = { ...balance, balanceMinutes, updatedAt: new Date() };
    this.balances.set(userId, updated);
    return updated;
  }

  async createCreditTransaction(data: InsertCreditTransaction): Promise<CreditTransaction> {
    const tx: CreditTransaction = {
      id: uuid(),
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      stripeSessionId: data.stripeSessionId ?? null,
      giftFromUserId: data.giftFromUserId ?? null,
      metadata: data.metadata ?? null,
      createdAt: new Date(),
    };
    const list = this.transactions.get(data.userId) || [];
    list.unshift(tx);
    this.transactions.set(data.userId, list);
    return tx;
  }

  async listCreditTransactions(userId: string) {
    return this.transactions.get(userId) || [];
  }

  async getSession(id: string) { return this.sessionMap.get(id); }

  async createSession(data: InsertSession): Promise<Session> {
    const session: Session = {
      id: uuid(),
      userId: data.userId,
      companionId: data.companionId,
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
      creditsConsumed: null,
      transcript: data.transcript ?? null,
      summary: null,
      prayerIntention: null,
      flagged: false,
      flagReason: null,
      rating: null,
      metadata: data.metadata ?? null,
    };
    this.sessionMap.set(session.id, session);
    return session;
  }

  async updateSession(id: string, data: Partial<Session>) {
    const session = this.sessionMap.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...data };
    this.sessionMap.set(id, updated);
    return updated;
  }

  async deleteSession(id: string) {
    return this.sessionMap.delete(id);
  }

  async listUserSessions(userId: string) {
    return Array.from(this.sessionMap.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async createReengagementLog(data: InsertReengagementLog): Promise<ReengagementLog> {
    const log: ReengagementLog = {
      id: uuid(),
      userId: data.userId,
      sessionId: data.sessionId,
      triggerType: data.triggerType,
      emailBody: data.emailBody,
      sentAt: new Date(),
      openedAt: null,
      clickedAt: null,
      convertedAt: null,
    };
    this.reengagementLogs.push(log);
    return log;
  }
}

// ─── Export singleton (re-initializable after testConnection) ─────

export let storage: IStorage = db ? new DrizzleStorage() : new MemStorage();

export function reinitStorage(): void {
  storage = db ? new DrizzleStorage() : new MemStorage();
}
