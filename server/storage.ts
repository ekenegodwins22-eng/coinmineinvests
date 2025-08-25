import {
  users,
  miningPlans,
  transactions,
  miningContracts,
  miningEarnings,
  withdrawals,
  cryptoPrices,
  type User,
  type UpsertUser,
  type MiningPlan,
  type Transaction,
  type MiningContract,
  type MiningEarning,
  type Withdrawal,
  type CryptoPrice,
  type InsertTransaction,
  type InsertWithdrawal,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Mining plans
  getMiningPlans(): Promise<MiningPlan[]>;
  getMiningPlan(id: string): Promise<MiningPlan | undefined>;
  
  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getUserTransactions(userId: string): Promise<Transaction[]>;
  getPendingTransactions(): Promise<Transaction[]>;
  approveTransaction(id: string, approvedBy: string): Promise<Transaction>;
  rejectTransaction(id: string, approvedBy: string, reason: string): Promise<Transaction>;
  
  // Mining contracts
  createMiningContract(contract: Omit<typeof miningContracts.$inferInsert, 'id' | 'createdAt'>): Promise<MiningContract>;
  getUserMiningContracts(userId: string): Promise<MiningContract[]>;
  getActiveMiningContracts(): Promise<MiningContract[]>;
  
  // Mining earnings
  createMiningEarning(earning: Omit<typeof miningEarnings.$inferInsert, 'id' | 'createdAt'>): Promise<MiningEarning>;
  getUserEarnings(userId: string): Promise<MiningEarning[]>;
  getUserTotalEarnings(userId: string): Promise<{ totalBtc: string; totalUsd: string }>;
  
  // Withdrawals
  createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal>;
  getUserWithdrawals(userId: string): Promise<Withdrawal[]>;
  getPendingWithdrawals(): Promise<Withdrawal[]>;
  
  // Crypto prices
  upsertCryptoPrice(price: typeof cryptoPrices.$inferInsert): Promise<CryptoPrice>;
  getCryptoPrices(): Promise<CryptoPrice[]>;
  getCryptoPrice(symbol: string): Promise<CryptoPrice | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Mining plans
  async getMiningPlans(): Promise<MiningPlan[]> {
    return await db.select().from(miningPlans).where(eq(miningPlans.isActive, true));
  }

  async getMiningPlan(id: string): Promise<MiningPlan | undefined> {
    const [plan] = await db.select().from(miningPlans).where(eq(miningPlans.id, id));
    return plan;
  }

  // Transactions
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async getPendingTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.status, "pending"))
      .orderBy(desc(transactions.createdAt));
  }

  async approveTransaction(id: string, approvedBy: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async rejectTransaction(id: string, approvedBy: string, reason: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({
        status: "rejected",
        approvedBy,
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // Mining contracts
  async createMiningContract(contract: Omit<typeof miningContracts.$inferInsert, 'id' | 'createdAt'>): Promise<MiningContract> {
    const [newContract] = await db.insert(miningContracts).values(contract).returning();
    return newContract;
  }

  async getUserMiningContracts(userId: string): Promise<MiningContract[]> {
    return await db
      .select()
      .from(miningContracts)
      .where(eq(miningContracts.userId, userId))
      .orderBy(desc(miningContracts.createdAt));
  }

  async getActiveMiningContracts(): Promise<MiningContract[]> {
    return await db
      .select()
      .from(miningContracts)
      .where(and(eq(miningContracts.isActive, true), gte(miningContracts.endDate, new Date())));
  }

  // Mining earnings
  async createMiningEarning(earning: Omit<typeof miningEarnings.$inferInsert, 'id' | 'createdAt'>): Promise<MiningEarning> {
    const [newEarning] = await db.insert(miningEarnings).values(earning).returning();
    return newEarning;
  }

  async getUserEarnings(userId: string): Promise<MiningEarning[]> {
    return await db
      .select()
      .from(miningEarnings)
      .where(eq(miningEarnings.userId, userId))
      .orderBy(desc(miningEarnings.date));
  }

  async getUserTotalEarnings(userId: string): Promise<{ totalBtc: string; totalUsd: string }> {
    const result = await db
      .select({
        totalBtc: sql<string>`SUM(${miningEarnings.amount})`,
        totalUsd: sql<string>`SUM(${miningEarnings.usdValue})`,
      })
      .from(miningEarnings)
      .where(eq(miningEarnings.userId, userId));

    return {
      totalBtc: result[0]?.totalBtc || "0",
      totalUsd: result[0]?.totalUsd || "0",
    };
  }

  // Withdrawals
  async createWithdrawal(withdrawal: InsertWithdrawal): Promise<Withdrawal> {
    const [newWithdrawal] = await db.insert(withdrawals).values(withdrawal).returning();
    return newWithdrawal;
  }

  async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.userId, userId))
      .orderBy(desc(withdrawals.createdAt));
  }

  async getPendingWithdrawals(): Promise<Withdrawal[]> {
    return await db
      .select()
      .from(withdrawals)
      .where(eq(withdrawals.status, "pending"))
      .orderBy(desc(withdrawals.createdAt));
  }

  // Crypto prices
  async upsertCryptoPrice(price: typeof cryptoPrices.$inferInsert): Promise<CryptoPrice> {
    const [cryptoPrice] = await db
      .insert(cryptoPrices)
      .values(price)
      .onConflictDoUpdate({
        target: cryptoPrices.id,
        set: {
          ...price,
          updatedAt: new Date(),
        },
      })
      .returning();
    return cryptoPrice;
  }

  async getCryptoPrices(): Promise<CryptoPrice[]> {
    return await db.select().from(cryptoPrices).orderBy(desc(cryptoPrices.updatedAt));
  }

  async getCryptoPrice(symbol: string): Promise<CryptoPrice | undefined> {
    const [price] = await db.select().from(cryptoPrices).where(eq(cryptoPrices.symbol, symbol));
    return price;
  }
}

export const storage = new DatabaseStorage();
