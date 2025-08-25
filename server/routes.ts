import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { createTransactionSchema, createWithdrawalSchema, PAYMENT_ADDRESSES } from "@shared/schema";
import { z } from "zod";
import axios from 'axios';
import bcrypt from 'bcryptjs';

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize mining plans, admin user, and start services
  await initializeMiningPlans();
  await initializeAdminUser();
  startPriceUpdateService();

  // Crypto prices endpoint
  app.get('/api/crypto-prices', async (req, res) => {
    try {
      const prices = await storage.getCryptoPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      res.status(500).json({ message: "Failed to fetch crypto prices" });
    }
  });

  // Mining plans endpoint
  app.get('/api/mining-plans', async (req, res) => {
    try {
      const plans = await storage.getMiningPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching mining plans:", error);
      res.status(500).json({ message: "Failed to fetch mining plans" });
    }
  });

  // Get payment addresses
  app.get('/api/payment-addresses', (req, res) => {
    res.json(PAYMENT_ADDRESSES);
  });

  // User transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Create transaction
  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const transactionData = createTransactionSchema.parse(req.body);

      // Get the mining plan to calculate USD amount
      const plan = await storage.getMiningPlan(transactionData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Mining plan not found" });
      }

      const transaction = await storage.createTransaction({
        ...transactionData,
        userId,
        amount: plan.price, // USD amount from plan
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  // User mining contracts
  app.get('/api/mining-contracts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const contracts = await storage.getUserMiningContracts(userId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching mining contracts:", error);
      res.status(500).json({ message: "Failed to fetch mining contracts" });
    }
  });

  // User earnings
  app.get('/api/earnings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const [earnings, totals] = await Promise.all([
        storage.getUserEarnings(userId),
        storage.getUserTotalEarnings(userId)
      ]);
      res.json({ earnings, totals });
    } catch (error) {
      console.error("Error fetching earnings:", error);
      res.status(500).json({ message: "Failed to fetch earnings" });
    }
  });

  // User withdrawals
  app.get('/api/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const withdrawals = await storage.getUserWithdrawals(userId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  // Create withdrawal
  app.post('/api/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      const withdrawalData = createWithdrawalSchema.parse(req.body);

      // Check if user has sufficient balance
      const totals = await storage.getUserTotalEarnings(userId);
      const totalBtc = totals.totalBtc;
      const requestedAmount = withdrawalData.amount;

      if (requestedAmount > totalBtc) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawal({
        ...withdrawalData,
        userId
      });

      res.json(withdrawal);
    } catch (error) {
      console.error("Error creating withdrawal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid withdrawal data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create withdrawal" });
      }
    }
  });

  // Admin routes
  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/all-transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      res.status(500).json({ message: "Failed to fetch all transactions" });
    }
  });

  app.post('/api/admin/transactions/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const transaction = await storage.approveTransaction(id, req.user._id.toString());
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Create mining contract for approved transaction
      if (transaction.status === "approved") {
        const plan = await storage.getMiningPlan(transaction.planId);
        if (plan) {
          const startDate = new Date();
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + plan.contractPeriod);

          await storage.createMiningContract({
            userId: transaction.userId,
            planId: transaction.planId,
            transactionId: transaction._id.toString(),
            startDate,
            endDate,
            isActive: true,
            totalEarnings: 0,
          });

          // Start generating daily earnings for this contract
          generateDailyEarnings(transaction.userId, plan);
        }
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error approving transaction:", error);
      res.status(500).json({ message: "Failed to approve transaction" });
    }
  });

  app.post('/api/admin/transactions/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { reason } = req.body;
      const transaction = await storage.rejectTransaction(id, req.user._id.toString(), reason);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json(transaction);
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });

  // Admin withdrawal management
  app.get('/api/admin/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const withdrawals = await storage.getPendingWithdrawals();
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.post('/api/admin/withdrawals/:id/process', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { transactionHash, networkFee } = req.body;

      const withdrawal = await storage.updateWithdrawal(id, {
        status: 'completed',
        transactionHash,
        networkFee: networkFee || 0,
        processedAt: new Date(),
      });

      res.json(withdrawal);
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default mining plans
async function initializeMiningPlans() {
  try {
    const existingPlans = await storage.getMiningPlans();
    if (existingPlans.length === 0) {
      const plans = [
        {
          name: "Starter Plan",
          price: 10,
          miningRate: 1.0, // MH/s
          dailyEarnings: 0.00000500, // BTC
          monthlyRoi: 15.0, // percentage
          contractPeriod: 12, // months
          description: "Perfect for beginners wanting to start their mining journey",
          features: [
            "1 MH/s mining power",
            "Daily BTC earnings",
            "12-month contract",
            "15% monthly ROI",
            "Basic support"
          ],
          isActive: true,
        },
        {
          name: "Pro Plan",
          price: 50,
          miningRate: 5.0,
          dailyEarnings: 0.00002800,
          monthlyRoi: 18.0,
          contractPeriod: 12,
          description: "For serious miners looking for better returns",
          features: [
            "5 MH/s mining power",
            "Higher daily earnings",
            "12-month contract",
            "18% monthly ROI",
            "Priority support"
          ],
          isActive: true,
        },
        {
          name: "Enterprise Plan",
          price: 200,
          miningRate: 20.0,
          dailyEarnings: 0.00012500,
          monthlyRoi: 22.0,
          contractPeriod: 12,
          description: "Maximum mining power for professional investors",
          features: [
            "20 MH/s mining power",
            "Maximum daily earnings",
            "12-month contract",
            "22% monthly ROI",
            "VIP support",
            "Custom analytics"
          ],
          isActive: true,
        },
      ];

      for (const plan of plans) {
        await storage.createMiningPlan(plan);
      }
      console.log("✓ Mining plans initialized successfully");
    }
  } catch (error) {
    console.error("Error initializing mining plans:", error);
  }
}

async function initializeAdminUser() {
  try {
    console.log("Starting admin user initialization...");
    const adminEmail = "anjoriniyanuoluwa08@gmail.com";
    const adminPassword = "@Damilola30";
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    
    if (!existingAdmin) {
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Administrator",
        lastName: "CryptoMine",
        isEmailVerified: true,
        isAdmin: true,
      });
      
      console.log("✓ Admin user created successfully");
    } else {
      console.log("Admin user already exists, updating credentials...");
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await storage.updateUser(existingAdmin._id.toString(), {
        password: hashedPassword,
        isAdmin: true,
        isEmailVerified: true,
        firstName: "Administrator",
        lastName: "CryptoMine",
      });
      
      console.log("✓ Admin user credentials updated successfully");
    }
  } catch (error) {
    console.error("Error initializing admin user:", error);
  }
}

// Fetch cryptocurrency prices from CoinMarketCap
async function fetchCryptoPrices() {
  try {
    // Free CoinMarketCap API alternative - using CoinGecko
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d'
    );

    if (response.data) {
      for (const crypto of response.data) {
        await storage.upsertCryptoPrice({
          symbol: crypto.symbol.toUpperCase(),
          name: crypto.name,
          price: crypto.current_price,
          change1h: crypto.price_change_percentage_1h_in_currency,
          change24h: crypto.price_change_percentage_24h,
          change7d: crypto.price_change_percentage_7d_in_currency,
          marketCap: crypto.market_cap,
          volume24h: crypto.total_volume,
          circulatingSupply: crypto.circulating_supply,
          logoUrl: crypto.image,
        });
      }
      console.log("✓ Crypto prices updated successfully");
    }
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    
    // Fallback: Insert some default crypto prices if API fails
    try {
      const defaultPrices = [
        { symbol: 'BTC', name: 'Bitcoin', price: 45000, change24h: 2.5 },
        { symbol: 'ETH', name: 'Ethereum', price: 3000, change24h: 1.8 },
        { symbol: 'USDT', name: 'Tether', price: 1, change24h: 0.1 },
        { symbol: 'BNB', name: 'Binance Coin', price: 300, change24h: 3.2 },
        { symbol: 'SOL', name: 'Solana', price: 100, change24h: 4.1 },
      ];

      for (const crypto of defaultPrices) {
        await storage.upsertCryptoPrice(crypto);
      }
    } catch (fallbackError) {
      console.error("Error setting fallback prices:", fallbackError);
    }
  }
}

// Generate daily earnings for active contracts
async function generateDailyEarnings(userId: string, plan: any) {
  try {
    // This would typically run as a scheduled job
    // For demo purposes, we'll just create one earning entry
    const btcPrice = await storage.getCryptoPrice('BTC');
    const btcPriceUsd = btcPrice?.price || 45000;
    
    await storage.createMiningEarning({
      contractId: 'contract_id_placeholder', // This would be the actual contract ID
      userId,
      date: new Date(),
      amount: plan.dailyEarnings,
      usdValue: plan.dailyEarnings * btcPriceUsd,
    });
  } catch (error) {
    console.error("Error generating daily earnings:", error);
  }
}

// Start the price update service
function startPriceUpdateService() {
  // Update prices every 5 minutes
  setInterval(fetchCryptoPrices, 5 * 60 * 1000);
  
  // Initial fetch
  fetchCryptoPrices();
  
  console.log("✓ Price update service started");
}