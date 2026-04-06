import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  jsonb,
  timestamp,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Table 1: users ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  faithTradition: text("faith_tradition"),
  onboardingConcern: text("onboarding_concern"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastSessionAt: timestamp("last_session_at", { withTimezone: true }),
  reengagementCount: integer("reengagement_count").notNull().default(0),
  lastReengagementAt: timestamp("last_reengagement_at", { withTimezone: true }),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  crisisFlagged: boolean("crisis_flagged").notNull().default(false),
  metadata: jsonb("metadata"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  faithTradition: true,
  onboardingConcern: true,
});

export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ─── Table 2: companions ─────────────────────────────────────────

export const companions = pgTable("companions", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  tagline: text("tagline").notNull(),
  bio: text("bio").notNull(),
  faithLane: text("faith_lane").notNull(),
  status: text("status").notNull().default("active"),
  systemPromptIdentity: text("system_prompt_identity").notNull(),
  systemPromptMethod: text("system_prompt_method").notNull(),
  systemPromptTheology: text("system_prompt_theology").notNull(),
  systemPromptRules: text("system_prompt_rules").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertCompanionSchema = createInsertSchema(companions);
export const selectCompanionSchema = createSelectSchema(companions);
export type InsertCompanion = z.infer<typeof insertCompanionSchema>;
export type Companion = typeof companions.$inferSelect;

// ─── Table 3: credit_balances ─────────────────────────────────────

export const creditBalances = pgTable("credit_balances", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id),
  balanceMinutes: integer("balance_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCreditBalanceSchema = createInsertSchema(creditBalances);
export const selectCreditBalanceSchema = createSelectSchema(creditBalances);
export type InsertCreditBalance = z.infer<typeof insertCreditBalanceSchema>;
export type CreditBalance = typeof creditBalances.$inferSelect;

// ─── Table 4: credit_transactions ─────────────────────────────────

export const creditTransactions = pgTable("credit_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  stripeSessionId: text("stripe_session_id"),
  giftFromUserId: uuid("gift_from_user_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).pick({
  userId: true,
  type: true,
  amount: true,
  stripeSessionId: true,
  giftFromUserId: true,
  metadata: true,
});

export const selectCreditTransactionSchema = createSelectSchema(creditTransactions);
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ─── Table 5: sessions ────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  companionId: text("companion_id")
    .notNull()
    .references(() => companions.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationMinutes: integer("duration_minutes"),
  creditsConsumed: integer("credits_consumed"),
  transcript: jsonb("transcript"),
  summary: text("summary"),
  prayerIntention: text("prayer_intention"),
  flagged: boolean("flagged").notNull().default(false),
  flagReason: text("flag_reason"),
  rating: text("rating"),
  metadata: jsonb("metadata"),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  companionId: true,
  transcript: true,
  metadata: true,
});

export const selectSessionSchema = createSelectSchema(sessions);
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// ─── Table 6: user_memory (Phase 2 — empty in MVP) ───────────────

export const userMemory = pgTable(
  "user_memory",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    companionId: text("companion_id")
      .notNull()
      .references(() => companions.id),
    familyMembers: jsonb("family_members"),
    activeConcerns: text("active_concerns").array(),
    prayerIntentions: text("prayer_intentions").array(),
    faithPractices: jsonb("faith_practices"),
    emotionalBaseline: text("emotional_baseline"),
    lastSessionSummary: text("last_session_summary"),
    sessionCount: integer("session_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.companionId] })],
);

export const insertUserMemorySchema = createInsertSchema(userMemory);
export const selectUserMemorySchema = createSelectSchema(userMemory);
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type UserMemory = typeof userMemory.$inferSelect;

// ─── Table 7: reengagement_log ────────────────────────────────────

export const reengagementLog = pgTable("reengagement_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id),
  triggerType: text("trigger_type").notNull(),
  emailBody: text("email_body").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  clickedAt: timestamp("clicked_at", { withTimezone: true }),
  convertedAt: timestamp("converted_at", { withTimezone: true }),
});

export const insertReengagementLogSchema = createInsertSchema(reengagementLog).pick({
  userId: true,
  sessionId: true,
  triggerType: true,
  emailBody: true,
});

export const selectReengagementLogSchema = createSelectSchema(reengagementLog);
export type InsertReengagementLog = z.infer<typeof insertReengagementLogSchema>;
export type ReengagementLog = typeof reengagementLog.$inferSelect;
