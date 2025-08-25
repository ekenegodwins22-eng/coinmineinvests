import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { insertTransactionSchema, insertWithdrawalSchema, type User } from "@shared/schema";
import { z } from "zod";

// Crypto wallet addresses for payments
const CRYPTO_ADDRESSES = {
  BNB: "0x09f616C4118870CcB2BE1aCE1EAc090bF443833B",
  BTC: "bc1qfxl02mlrwfnnamr6qqhcgcutyth87du67u0nm0",
  USDT: "TDsBManQwvT698thSMKmhjYqKTupVxWFwK",
  SOL: "9ENQmbQFA1mKWYZWaL1qpH1ACLioLz55eANsigHGckXt"
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize mining plans if they don't exist
  await initializeMiningPlans();
  
  // Start price update service
  startPriceUpdateService();

  // Note: Auth routes are handled in auth.ts

  // Crypto prices
  app.get('/api/crypto-prices', async (req, res) => {
    try {
      const prices = await storage.getCryptoPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching crypto prices:", error);
      res.status(500).json({ message: "Failed to fetch crypto prices" });
    }
  });

  // Mining plans
  app.get('/api/mining-plans', async (req, res) => {
    try {
      const plans = await storage.getMiningPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching mining plans:", error);
      res.status(500).json({ message: "Failed to fetch mining plans" });
    }
  });

  // User transactions
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
      const userId = req.user.id;
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId,
        walletAddress: CRYPTO_ADDRESSES[req.body.currency as keyof typeof CRYPTO_ADDRESSES]
      });

      const transaction = await storage.createTransaction(transactionData);
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

  // Withdrawals
  app.get('/api/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const withdrawals = await storage.getUserWithdrawals(userId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Failed to fetch withdrawals" });
    }
  });

  app.post('/api/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const withdrawalData = insertWithdrawalSchema.parse({
        ...req.body,
        userId
      });

      // Check if user has sufficient balance
      const totals = await storage.getUserTotalEarnings(userId);
      const totalBtc = parseFloat(totals.totalBtc);
      const requestedAmount = parseFloat(withdrawalData.amount);

      if (requestedAmount > totalBtc) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const withdrawal = await storage.createWithdrawal(withdrawalData);
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
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getPendingTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching admin transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/admin/transactions/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const transaction = await storage.approveTransaction(id, req.user.claims.sub);
      
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
            transactionId: transaction.id,
            startDate,
            endDate,
            isActive: true,
            totalEarnings: "0",
          });
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
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { reason } = req.body;
      const transaction = await storage.rejectTransaction(id, req.user.claims.sub, reason);
      
      res.json(transaction);
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      res.status(500).json({ message: "Failed to reject transaction" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeMiningPlans() {
  try {
    const existingPlans = await storage.getMiningPlans();
    if (existingPlans.length === 0) {
      // Create default mining plans
      const plans = [
        {
          name: "Starter",
          price: "10.00",
          miningRate: "1.00",
          dailyEarnings: "0.00000500",
          monthlyRoi: "15.00",
          contractPeriod: 12,
          isActive: true,
        },
        {
          name: "Pro",
          price: "50.00",
          miningRate: "5.00",
          dailyEarnings: "0.00002800",
          monthlyRoi: "18.00",
          contractPeriod: 12,
          isActive: true,
        },
        {
          name: "Enterprise",
          price: "200.00",
          miningRate: "20.00",
          dailyEarnings: "0.00012500",
          monthlyRoi: "22.00",
          contractPeriod: 12,
          isActive: true,
        },
      ];

      // Note: This would need to be done via direct DB insertion in a real scenario
      console.log("Mining plans would be initialized here");
    }
  } catch (error) {
    console.error("Error initializing mining plans:", error);
  }
}

async function fetchCryptoPrices() {
  try {
    // Use CoinMarketCap API
    const response = await fetch(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=10&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || 'demo_key',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      for (const crypto of data.data) {
        await storage.upsertCryptoPrice({
          id: crypto.id.toString(),
          symbol: crypto.symbol,
          name: crypto.name,
          price: crypto.quote.USD.price.toString(),
          change1h: crypto.quote.USD.percent_change_1h?.toString(),
          change24h: crypto.quote.USD.percent_change_24h?.toString(),
          change7d: crypto.quote.USD.percent_change_7d?.toString(),
          marketCap: crypto.quote.USD.market_cap?.toString(),
          volume24h: crypto.quote.USD.volume_24h?.toString(),
          circulatingSupply: crypto.circulating_supply?.toString(),
          logoUrl: `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
  }
}

function startPriceUpdateService() {
  // Update prices every 30 seconds
  setInterval(fetchCryptoPrices, 30000);
  // Initial fetch
  fetchCryptoPrices();
}
