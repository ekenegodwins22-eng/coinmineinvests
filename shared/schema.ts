import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mining plans
export const miningPlans = pgTable("mining_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  miningRate: decimal("mining_rate", { precision: 10, scale: 2 }).notNull(), // MH/s
  dailyEarnings: decimal("daily_earnings", { precision: 10, scale: 8 }).notNull(), // BTC
  monthlyRoi: decimal("monthly_roi", { precision: 5, scale: 2 }).notNull(), // percentage
  contractPeriod: integer("contract_period").notNull(), // months
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User transactions/payments
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => miningPlans.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").notNull(), // BTC, ETH, USDT, etc.
  cryptoAmount: decimal("crypto_amount", { precision: 20, scale: 8 }).notNull(),
  walletAddress: text("wallet_address").notNull(),
  transactionHash: text("transaction_hash"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User mining contracts
export const miningContracts = pgTable("mining_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  planId: varchar("plan_id").references(() => miningPlans.id).notNull(),
  transactionId: varchar("transaction_id").references(() => transactions.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  totalEarnings: decimal("total_earnings", { precision: 20, scale: 8 }).default("0"),
  lastPayoutAt: timestamp("last_payout_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily mining earnings
export const miningEarnings = pgTable("mining_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").references(() => miningContracts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(), // BTC
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawal requests
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  currency: varchar("currency").notNull(),
  amount: decimal("amount", { precision: 20, scale: 8 }).notNull(),
  walletAddress: text("wallet_address").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, rejected
  transactionHash: text("transaction_hash"),
  networkFee: decimal("network_fee", { precision: 20, scale: 8 }),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cryptocurrency prices cache
export const cryptoPrices = pgTable("crypto_prices", {
  id: varchar("id").primaryKey(),
  symbol: varchar("symbol").notNull(),
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 20, scale: 8 }).notNull(),
  change1h: decimal("change_1h", { precision: 10, scale: 2 }),
  change24h: decimal("change_24h", { precision: 10, scale: 2 }),
  change7d: decimal("change_7d", { precision: 10, scale: 2 }),
  marketCap: decimal("market_cap", { precision: 20, scale: 2 }),
  volume24h: decimal("volume_24h", { precision: 20, scale: 2 }),
  circulatingSupply: decimal("circulating_supply", { precision: 20, scale: 2 }),
  logoUrl: text("logo_url"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  miningContracts: many(miningContracts),
  miningEarnings: many(miningEarnings),
  withdrawals: many(withdrawals),
}));

export const miningPlansRelations = relations(miningPlans, ({ many }) => ({
  transactions: many(transactions),
  miningContracts: many(miningContracts),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
  plan: one(miningPlans, { fields: [transactions.planId], references: [miningPlans.id] }),
  approver: one(users, { fields: [transactions.approvedBy], references: [users.id] }),
  miningContract: many(miningContracts),
}));

export const miningContractsRelations = relations(miningContracts, ({ one, many }) => ({
  user: one(users, { fields: [miningContracts.userId], references: [users.id] }),
  plan: one(miningPlans, { fields: [miningContracts.planId], references: [miningPlans.id] }),
  transaction: one(transactions, { fields: [miningContracts.transactionId], references: [transactions.id] }),
  earnings: many(miningEarnings),
}));

export const miningEarningsRelations = relations(miningEarnings, ({ one }) => ({
  contract: one(miningContracts, { fields: [miningEarnings.contractId], references: [miningContracts.id] }),
  user: one(users, { fields: [miningEarnings.userId], references: [users.id] }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, { fields: [withdrawals.userId], references: [users.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMiningPlanSchema = createInsertSchema(miningPlans).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedBy: true,
  approvedAt: true,
});

export const insertWithdrawalSchema = createInsertSchema(withdrawals).omit({
  id: true,
  createdAt: true,
  processedAt: true,
  transactionHash: true,
  networkFee: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type MiningPlan = typeof miningPlans.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type MiningContract = typeof miningContracts.$inferSelect;
export type MiningEarning = typeof miningEarnings.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type CryptoPrice = typeof cryptoPrices.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
