import connectDB from './db';
import {
  User,
  MiningPlan,
  Transaction,
  MiningContract,
  MiningEarning,
  Withdrawal,
  CryptoPrice,
  type IUser,
  type IMiningPlan,
  type ITransaction,
  type IMiningContract,
  type IMiningEarning,
  type IWithdrawal,
  type ICryptoPrice,
  type CreateTransactionData,
  type CreateWithdrawalData,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<IUser | null>;
  getUserByEmail(email: string): Promise<IUser | null>;
  getUserByGoogleId(googleId: string): Promise<IUser | null>;
  createUser(user: Partial<IUser>): Promise<IUser>;
  updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null>;
  getTotalUsers(): Promise<number>;
  
  // Mining plans
  getMiningPlans(): Promise<IMiningPlan[]>;
  getMiningPlan(id: string): Promise<IMiningPlan | null>;
  createMiningPlan(plan: Partial<IMiningPlan>): Promise<IMiningPlan>;
  
  // Transactions
  createTransaction(transaction: CreateTransactionData & { userId: string; amount: number }): Promise<ITransaction>;
  getTransaction(id: string): Promise<ITransaction | null>;
  getUserTransactions(userId: string): Promise<ITransaction[]>;
  getPendingTransactions(): Promise<ITransaction[]>;
  getAllTransactions(): Promise<ITransaction[]>;
  approveTransaction(id: string, approvedBy: string): Promise<ITransaction | null>;
  rejectTransaction(id: string, approvedBy: string, reason: string): Promise<ITransaction | null>;
  
  // Mining contracts
  createMiningContract(contract: Partial<IMiningContract>): Promise<IMiningContract>;
  getUserMiningContracts(userId: string): Promise<IMiningContract[]>;
  getActiveMiningContracts(): Promise<IMiningContract[]>;
  
  // Mining earnings
  createMiningEarning(earning: Partial<IMiningEarning>): Promise<IMiningEarning>;
  getUserEarnings(userId: string): Promise<IMiningEarning[]>;
  getUserTotalEarnings(userId: string): Promise<{ totalBtc: number; totalUsd: number }>;
  
  // Withdrawals
  createWithdrawal(withdrawal: CreateWithdrawalData & { userId: string }): Promise<IWithdrawal>;
  getUserWithdrawals(userId: string): Promise<IWithdrawal[]>;
  getPendingWithdrawals(): Promise<IWithdrawal[]>;
  getAllWithdrawals(): Promise<IWithdrawal[]>;
  updateWithdrawal(id: string, updates: Partial<IWithdrawal>): Promise<IWithdrawal | null>;
  
  // Crypto prices
  upsertCryptoPrice(price: Partial<ICryptoPrice>): Promise<ICryptoPrice>;
  getCryptoPrices(): Promise<ICryptoPrice[]>;
  getCryptoPrice(symbol: string): Promise<ICryptoPrice | null>;
}

export class MongoStorage implements IStorage {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (!this.initialized) {
      await connectDB();
      this.initialized = true;
    }
  }

  private async ensureConnected() {
    if (!this.initialized) {
      await this.init();
    }
  }

  // User operations
  async getUser(id: string): Promise<IUser | null> {
    await this.ensureConnected();
    return await User.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    await this.ensureConnected();
    return await User.findOne({ email });
  }

  async getUserByGoogleId(googleId: string): Promise<IUser | null> {
    return await User.findOne({ googleId });
  }

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async updateUser(id: string, updates: Partial<IUser>): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async getTotalUsers(): Promise<number> {
    return await User.countDocuments();
  }

  // Mining plans
  async getMiningPlans(): Promise<IMiningPlan[]> {
    await this.ensureConnected();
    return await MiningPlan.find({ isActive: true }).sort({ price: 1 });
  }

  async getMiningPlan(id: string): Promise<IMiningPlan | null> {
    return await MiningPlan.findById(id);
  }

  async createMiningPlan(planData: Partial<IMiningPlan>): Promise<IMiningPlan> {
    const plan = new MiningPlan(planData);
    return await plan.save();
  }

  // Transactions
  async createTransaction(transactionData: CreateTransactionData & { userId: string; amount: number }): Promise<ITransaction> {
    const transaction = new Transaction(transactionData);
    return await transaction.save();
  }

  async getTransaction(id: string): Promise<ITransaction | null> {
    return await Transaction.findById(id);
  }

  async getUserTransactions(userId: string): Promise<ITransaction[]> {
    return await Transaction.find({ userId }).sort({ createdAt: -1 });
  }

  async getPendingTransactions(): Promise<ITransaction[]> {
    return await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 });
  }

  async getAllTransactions(): Promise<ITransaction[]> {
    return await Transaction.find().sort({ createdAt: -1 });
  }

  async approveTransaction(id: string, approvedBy: string): Promise<ITransaction | null> {
    return await Transaction.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
      },
      { new: true }
    );
  }

  async rejectTransaction(id: string, approvedBy: string, reason: string): Promise<ITransaction | null> {
    return await Transaction.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        approvedBy,
        rejectionReason: reason,
      },
      { new: true }
    );
  }

  // Mining contracts
  async createMiningContract(contractData: Partial<IMiningContract>): Promise<IMiningContract> {
    const contract = new MiningContract(contractData);
    return await contract.save();
  }

  async getUserMiningContracts(userId: string): Promise<IMiningContract[]> {
    return await MiningContract.find({ userId }).sort({ createdAt: -1 });
  }

  async getActiveMiningContracts(): Promise<IMiningContract[]> {
    return await MiningContract.find({
      isActive: true,
      endDate: { $gte: new Date() }
    });
  }

  // Mining earnings
  async createMiningEarning(earningData: Partial<IMiningEarning>): Promise<IMiningEarning> {
    const earning = new MiningEarning(earningData);
    return await earning.save();
  }

  async getUserEarnings(userId: string): Promise<IMiningEarning[]> {
    return await MiningEarning.find({ userId }).sort({ date: -1 });
  }

  async getUserTotalEarnings(userId: string): Promise<{ totalBtc: number; totalUsd: number }> {
    const result = await MiningEarning.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          totalBtc: { $sum: '$amount' },
          totalUsd: { $sum: '$usdValue' }
        }
      }
    ]);

    return {
      totalBtc: result[0]?.totalBtc || 0,
      totalUsd: result[0]?.totalUsd || 0,
    };
  }

  // Withdrawals
  async createWithdrawal(withdrawalData: CreateWithdrawalData & { userId: string }): Promise<IWithdrawal> {
    const withdrawal = new Withdrawal(withdrawalData);
    return await withdrawal.save();
  }

  async getUserWithdrawals(userId: string): Promise<IWithdrawal[]> {
    return await Withdrawal.find({ userId }).sort({ createdAt: -1 });
  }

  async getPendingWithdrawals(): Promise<IWithdrawal[]> {
    return await Withdrawal.find({ status: 'pending' }).sort({ createdAt: -1 });
  }

  async getAllWithdrawals(): Promise<IWithdrawal[]> {
    return await Withdrawal.find().sort({ createdAt: -1 });
  }

  async updateWithdrawal(id: string, updates: Partial<IWithdrawal>): Promise<IWithdrawal | null> {
    return await Withdrawal.findByIdAndUpdate(id, updates, { new: true });
  }

  // Crypto prices
  async upsertCryptoPrice(priceData: Partial<ICryptoPrice>): Promise<ICryptoPrice> {
    await this.ensureConnected();
    return await CryptoPrice.findOneAndUpdate(
      { symbol: priceData.symbol },
      priceData,
      { upsert: true, new: true }
    ) as ICryptoPrice;
  }

  async getCryptoPrices(): Promise<ICryptoPrice[]> {
    return await CryptoPrice.find().sort({ updatedAt: -1 });
  }

  async getCryptoPrice(symbol: string): Promise<ICryptoPrice | null> {
    return await CryptoPrice.findOne({ symbol });
  }
}

export const storage = new MongoStorage();