import db from './db';
import {
  users,
  miningPlans,
  transactions,
  miningContracts,
  miningEarnings,
  withdrawals,
  cryptoPrices,
  announcements,
  type User,
  type MiningPlan,
  type Transaction,
  type MiningContract,
  type MiningEarning,
  type Withdrawal,
  type CryptoPrice,
  type Announcement,
  type NewUser,
  type NewMiningPlan,
  type NewTransaction,
  type NewMiningContract,
  type NewMiningEarning,
  type NewWithdrawal,
  type NewCryptoPrice,
  type NewAnnouncement,
  type CreateTransactionData,
  type CreateWithdrawalData,
  type CreateAnnouncementData,
} from "@shared/schema";
import { eq, desc, and, sql, sum } from 'drizzle-orm';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserByGoogleId(googleId: string): Promise<User | null>;
  createUser(user: Partial<NewUser>): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | null>;
  getTotalUsers(): Promise<number>;
  
  // Mining plans
  getMiningPlans(): Promise<MiningPlan[]>;
  getMiningPlan(id: number): Promise<MiningPlan | null>;
  createMiningPlan(plan: NewMiningPlan): Promise<MiningPlan>;
  
  // Transactions
  createTransaction(transaction: CreateTransactionData & { userId: number; amount: number }): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | null>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  approveTransaction(id: number, approvedBy: number): Promise<Transaction | null>;
  rejectTransaction(id: number, approvedBy: number, reason: string): Promise<Transaction | null>;
  
  // Mining contracts
  createMiningContract(contract: NewMiningContract): Promise<MiningContract>;
  getUserMiningContracts(userId: number): Promise<MiningContract[]>;
  getActiveMiningContracts(): Promise<MiningContract[]>;
  
  // Mining earnings
  createMiningEarning(earning: NewMiningEarning): Promise<MiningEarning>;
  getUserEarnings(userId: number): Promise<MiningEarning[]>;
  getUserTotalEarnings(userId: number): Promise<{ totalBtc: number; totalUsd: number }>;
  
  // Withdrawals
  createWithdrawal(withdrawal: CreateWithdrawalData & { userId: number }): Promise<Withdrawal>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  getAllWithdrawals(): Promise<Withdrawal[]>;
  updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | null>;
  
  // Crypto prices
  upsertCryptoPrice(price: NewCryptoPrice): Promise<CryptoPrice>;
  getCryptoPrices(): Promise<CryptoPrice[]>;
  getCryptoPrice(symbol: string): Promise<CryptoPrice | null>;
  
  // Announcements
  createAnnouncement(announcement: CreateAnnouncementData & { createdBy: number }): Promise<Announcement>;
  getActiveAnnouncements(): Promise<Announcement[]>;
  getAllAnnouncements(): Promise<Announcement[]>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null>;
  deleteAnnouncement(id: number): Promise<boolean>;
}

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0] || null;
  }

  async getUserByGoogleId(googleId: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: Partial<NewUser>): Promise<User> {
    const result = await db.insert(users).values(userData as NewUser).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    const result = await db.update(users).set({...updates, updatedAt: sql`NOW()`}).where(eq(users.id, id)).returning();
    return result[0] || null;
  }

  async getTotalUsers(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(users);
    return result[0].count;
  }

  // Mining plans
  async getMiningPlans(): Promise<MiningPlan[]> {
    return await db.select().from(miningPlans).where(eq(miningPlans.isActive, true)).orderBy(miningPlans.price);
  }

  async getMiningPlan(id: number): Promise<MiningPlan | null> {
    const result = await db.select().from(miningPlans).where(eq(miningPlans.id, id)).limit(1);
    return result[0] || null;
  }

  async createMiningPlan(planData: NewMiningPlan): Promise<MiningPlan> {
    const result = await db.insert(miningPlans).values(planData).returning();
    return result[0];
  }

  // Transactions
  async createTransaction(transactionData: CreateTransactionData & { userId: number; amount: number }): Promise<Transaction> {
    const insertData = {
      ...transactionData,
      amount: transactionData.amount.toString(),
      cryptoAmount: transactionData.cryptoAmount.toString()
    };
    const result = await db.insert(transactions).values(insertData as any).returning();
    return result[0];
  }

  async getTransaction(id: number): Promise<Transaction | null> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0] || null;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.status, 'pending')).orderBy(desc(transactions.createdAt));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async approveTransaction(id: number, approvedBy: number): Promise<Transaction | null> {
    const result = await db.update(transactions).set({
      status: 'approved',
      approvedBy,
      approvedAt: sql`NOW()`,
      updatedAt: sql`NOW()`
    }).where(eq(transactions.id, id)).returning();
    return result[0] || null;
  }

  async rejectTransaction(id: number, approvedBy: number, reason: string): Promise<Transaction | null> {
    const result = await db.update(transactions).set({
      status: 'rejected',
      approvedBy,
      rejectionReason: reason,
      updatedAt: sql`NOW()`
    }).where(eq(transactions.id, id)).returning();
    return result[0] || null;
  }

  // Mining contracts
  async createMiningContract(contractData: NewMiningContract): Promise<MiningContract> {
    const result = await db.insert(miningContracts).values(contractData).returning();
    return result[0];
  }

  async getUserMiningContracts(userId: number): Promise<MiningContract[]> {
    return await db.select().from(miningContracts).where(eq(miningContracts.userId, userId)).orderBy(desc(miningContracts.createdAt));
  }

  async getActiveMiningContracts(): Promise<MiningContract[]> {
    return await db.select().from(miningContracts).where(
      and(
        eq(miningContracts.isActive, true),
        sql`${miningContracts.endDate} >= NOW()`
      )
    );
  }

  // Mining earnings
  async createMiningEarning(earningData: NewMiningEarning): Promise<MiningEarning> {
    const result = await db.insert(miningEarnings).values(earningData).returning();
    return result[0];
  }

  async getUserEarnings(userId: number): Promise<MiningEarning[]> {
    return await db.select().from(miningEarnings).where(eq(miningEarnings.userId, userId)).orderBy(desc(miningEarnings.date));
  }

  async getUserTotalEarnings(userId: number): Promise<{ totalBtc: number; totalUsd: number }> {
    const result = await db
      .select({
        totalBtc: sql<number>`COALESCE(SUM(${miningEarnings.amount}), 0)`,
        totalUsd: sql<number>`COALESCE(SUM(${miningEarnings.usdValue}), 0)`
      })
      .from(miningEarnings)
      .where(eq(miningEarnings.userId, userId));

    return {
      totalBtc: Number(result[0].totalBtc) || 0,
      totalUsd: Number(result[0].totalUsd) || 0,
    };
  }

  // Withdrawals
  async createWithdrawal(withdrawalData: CreateWithdrawalData & { userId: number }): Promise<Withdrawal> {
    const insertData = {
      ...withdrawalData,
      amount: withdrawalData.amount.toString()
    };
    const result = await db.insert(withdrawals).values(insertData as any).returning();
    return result[0];
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.status, 'pending')).orderBy(desc(withdrawals.createdAt));
  }

  async getAllWithdrawals(): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).orderBy(desc(withdrawals.createdAt));
  }

  async updateWithdrawal(id: number, updates: Partial<Withdrawal>): Promise<Withdrawal | null> {
    const result = await db.update(withdrawals).set({...updates, updatedAt: sql`NOW()`}).where(eq(withdrawals.id, id)).returning();
    return result[0] || null;
  }

  // Crypto prices
  async upsertCryptoPrice(priceData: NewCryptoPrice): Promise<CryptoPrice> {
    const result = await db.insert(cryptoPrices).values({
      ...priceData,
      updatedAt: sql`NOW()`
    }).onConflictDoUpdate({
      target: cryptoPrices.symbol,
      set: {
        ...priceData,
        updatedAt: sql`NOW()`
      }
    }).returning();
    return result[0];
  }

  async getCryptoPrices(): Promise<CryptoPrice[]> {
    return await db.select().from(cryptoPrices).orderBy(desc(cryptoPrices.updatedAt));
  }

  async getCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
    const result = await db.select().from(cryptoPrices).where(eq(cryptoPrices.symbol, symbol)).limit(1);
    return result[0] || null;
  }

  // Announcements
  async createAnnouncement(announcementData: CreateAnnouncementData & { createdBy: number }): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcementData).returning();
    return result[0];
  }

  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | null> {
    const result = await db.update(announcements).set({...updates, updatedAt: sql`NOW()`}).where(eq(announcements.id, id)).returning();
    return result[0] || null;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new PostgresStorage();