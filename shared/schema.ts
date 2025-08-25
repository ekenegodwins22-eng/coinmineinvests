import { pgTable, serial, varchar, text, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Status enums
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'approved', 'rejected']);
export const withdrawalStatusEnum = pgEnum('withdrawal_status', ['pending', 'processing', 'completed', 'rejected']);

// User table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  profileImageUrl: varchar('profile_image_url', { length: 500 }),
  googleId: varchar('google_id', { length: 255 }).unique(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mining Plans table
export const miningPlans = pgTable('mining_plans', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  miningRate: decimal('mining_rate', { precision: 10, scale: 8 }).notNull(), // MH/s
  dailyEarnings: decimal('daily_earnings', { precision: 10, scale: 8 }).notNull(), // BTC
  monthlyRoi: decimal('monthly_roi', { precision: 5, scale: 2 }).notNull(), // percentage
  contractPeriod: integer('contract_period').notNull(), // months
  isActive: boolean('is_active').default(true).notNull(),
  description: text('description').notNull(),
  features: text('features').array(), // JSON array of features
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  planId: integer('plan_id').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  cryptoAmount: decimal('crypto_amount', { precision: 20, scale: 8 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  transactionHash: varchar('transaction_hash', { length: 255 }),
  status: transactionStatusEnum('status').default('pending').notNull(),
  approvedBy: integer('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mining Contracts table
export const miningContracts = pgTable('mining_contracts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  planId: integer('plan_id').notNull(),
  transactionId: integer('transaction_id').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  totalEarnings: decimal('total_earnings', { precision: 20, scale: 8 }).default('0').notNull(),
  lastPayoutAt: timestamp('last_payout_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Mining Earnings table
export const miningEarnings = pgTable('mining_earnings', {
  id: serial('id').primaryKey(),
  contractId: integer('contract_id').notNull(),
  userId: integer('user_id').notNull(),
  date: timestamp('date').notNull(),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull(), // BTC
  usdValue: decimal('usd_value', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Withdrawals table
export const withdrawals = pgTable('withdrawals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  amount: decimal('amount', { precision: 20, scale: 8 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 255 }).notNull(),
  status: withdrawalStatusEnum('status').default('pending').notNull(),
  transactionHash: varchar('transaction_hash', { length: 255 }),
  networkFee: decimal('network_fee', { precision: 20, scale: 8 }).default('0'),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Crypto Prices table
export const cryptoPrices = pgTable('crypto_prices', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  price: decimal('price', { precision: 20, scale: 8 }).notNull(),
  change1h: decimal('change_1h', { precision: 5, scale: 2 }),
  change24h: decimal('change_24h', { precision: 5, scale: 2 }),
  change7d: decimal('change_7d', { precision: 5, scale: 2 }),
  marketCap: decimal('market_cap', { precision: 20, scale: 2 }),
  volume24h: decimal('volume_24h', { precision: 20, scale: 2 }),
  circulatingSupply: decimal('circulating_supply', { precision: 20, scale: 2 }),
  logoUrl: varchar('logo_url', { length: 500 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Announcements table (for admin ads/promotions)
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  type: varchar('type', { length: 20 }).default('promotion').notNull(), // promotion, announcement, warning
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const createUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isAdmin: true,
  isEmailVerified: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const createTransactionSchema = z.object({
  planId: z.number(),
  currency: z.string(),
  cryptoAmount: z.number().positive(),
  walletAddress: z.string().min(1),
  transactionHash: z.string().optional(),
});

export const createWithdrawalSchema = z.object({
  currency: z.string(),
  amount: z.number().positive(),
  walletAddress: z.string().min(1),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.string().default('promotion'),
  isActive: z.boolean().default(true),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MiningPlan = typeof miningPlans.$inferSelect;
export type NewMiningPlan = typeof miningPlans.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type MiningContract = typeof miningContracts.$inferSelect;
export type NewMiningContract = typeof miningContracts.$inferInsert;
export type MiningEarning = typeof miningEarnings.$inferSelect;
export type NewMiningEarning = typeof miningEarnings.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type NewWithdrawal = typeof withdrawals.$inferInsert;
export type CryptoPrice = typeof cryptoPrices.$inferSelect;
export type NewCryptoPrice = typeof cryptoPrices.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type CreateWithdrawalData = z.infer<typeof createWithdrawalSchema>;
export type CreateAnnouncementData = z.infer<typeof createAnnouncementSchema>;

// Crypto payment addresses
export const PAYMENT_ADDRESSES = {
  BNB: '0x09f616C4118870CcB2BE1aCE1EAc090bF443833B',
  BTC: 'bc1qfxl02mlrwfnnamr6qqhcgcutyth87du67u0nm0',
  USDT: 'TDsBManQwvT698thSMKmhjYqKTupVxWFwK',
  SOL: '9ENQmbQFA1mKWYZWaL1qpH1ACLioLz55eANsigHGckXt',
  ETH: '0x09f616C4118870CcB2BE1aCE1EAc090bF443833B',
};

// Supported withdrawal currencies
export const WITHDRAWAL_CURRENCIES = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether USDT', icon: '₮' },
  { symbol: 'BNB', name: 'Binance Coin', icon: 'BNB' },
  { symbol: 'SOL', name: 'Solana', icon: 'SOL' },
  { symbol: 'ADA', name: 'Cardano', icon: 'ADA' },
  { symbol: 'DOT', name: 'Polkadot', icon: 'DOT' },
];