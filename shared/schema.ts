import mongoose, { Schema, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  googleId?: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  profileImageUrl: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  isAdmin: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
}, {
  timestamps: true
});

// Mining Plan Schema
export interface IMiningPlan extends Document {
  _id: string;
  name: string;
  price: number;
  miningRate: number; // MH/s
  dailyEarnings: number; // BTC
  monthlyRoi: number; // percentage
  contractPeriod: number; // months
  isActive: boolean;
  description: string;
  features: string[];
  createdAt: Date;
}

const miningPlanSchema = new Schema<IMiningPlan>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  miningRate: { type: Number, required: true },
  dailyEarnings: { type: Number, required: true },
  monthlyRoi: { type: Number, required: true },
  contractPeriod: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  description: { type: String, required: true },
  features: [{ type: String }],
}, {
  timestamps: true
});

// Transaction Schema
export interface ITransaction extends Document {
  _id: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  cryptoAmount: number;
  walletAddress: string;
  transactionHash?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  userId: { type: String, required: true, ref: 'User' },
  planId: { type: String, required: true, ref: 'MiningPlan' },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  cryptoAmount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  transactionHash: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approvedBy: { type: String, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
}, {
  timestamps: true
});

// Mining Contract Schema
export interface IMiningContract extends Document {
  _id: string;
  userId: string;
  planId: string;
  transactionId: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalEarnings: number;
  lastPayoutAt?: Date;
  createdAt: Date;
}

const miningContractSchema = new Schema<IMiningContract>({
  userId: { type: String, required: true, ref: 'User' },
  planId: { type: String, required: true, ref: 'MiningPlan' },
  transactionId: { type: String, required: true, ref: 'Transaction' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  totalEarnings: { type: Number, default: 0 },
  lastPayoutAt: { type: Date },
}, {
  timestamps: true
});

// Mining Earnings Schema
export interface IMiningEarning extends Document {
  _id: string;
  contractId: string;
  userId: string;
  date: Date;
  amount: number; // BTC
  usdValue: number;
  createdAt: Date;
}

const miningEarningSchema = new Schema<IMiningEarning>({
  contractId: { type: String, required: true, ref: 'MiningContract' },
  userId: { type: String, required: true, ref: 'User' },
  date: { type: Date, required: true },
  amount: { type: Number, required: true },
  usdValue: { type: Number, required: true },
}, {
  timestamps: true
});

// Withdrawal Schema
export interface IWithdrawal extends Document {
  _id: string;
  userId: string;
  currency: string;
  amount: number;
  walletAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  transactionHash?: string;
  networkFee?: number;
  processedAt?: Date;
  createdAt: Date;
}

const withdrawalSchema = new Schema<IWithdrawal>({
  userId: { type: String, required: true, ref: 'User' },
  currency: { type: String, required: true },
  amount: { type: Number, required: true },
  walletAddress: { type: String, required: true },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending' },
  transactionHash: { type: String },
  networkFee: { type: Number },
  processedAt: { type: Date },
}, {
  timestamps: true
});

// Crypto Price Schema
export interface ICryptoPrice extends Document {
  _id: string;
  symbol: string;
  name: string;
  price: number;
  change1h?: number;
  change24h?: number;
  change7d?: number;
  marketCap?: number;
  volume24h?: number;
  circulatingSupply?: number;
  logoUrl?: string;
  updatedAt: Date;
}

const cryptoPriceSchema = new Schema<ICryptoPrice>({
  symbol: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  change1h: { type: Number },
  change24h: { type: Number },
  change7d: { type: Number },
  marketCap: { type: Number },
  volume24h: { type: Number },
  circulatingSupply: { type: Number },
  logoUrl: { type: String },
}, {
  timestamps: true
});

// Create models
export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const MiningPlan = mongoose.models.MiningPlan || mongoose.model<IMiningPlan>('MiningPlan', miningPlanSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export const MiningContract = mongoose.models.MiningContract || mongoose.model<IMiningContract>('MiningContract', miningContractSchema);
export const MiningEarning = mongoose.models.MiningEarning || mongoose.model<IMiningEarning>('MiningEarning', miningEarningSchema);
export const Withdrawal = mongoose.models.Withdrawal || mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
export const CryptoPrice = mongoose.models.CryptoPrice || mongoose.model<ICryptoPrice>('CryptoPrice', cryptoPriceSchema);

// Validation schemas
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
  planId: z.string(),
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

// Types
export type User = IUser;
export type MiningPlan = IMiningPlan;
export type Transaction = ITransaction;
export type MiningContract = IMiningContract;
export type MiningEarning = IMiningEarning;
export type Withdrawal = IWithdrawal;
export type CryptoPrice = ICryptoPrice;

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type CreateTransactionData = z.infer<typeof createTransactionSchema>;
export type CreateWithdrawalData = z.infer<typeof createWithdrawalSchema>;

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