import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { createTransactionSchema, createWithdrawalSchema, createAnnouncementSchema, createSupportTicketSchema, createTicketMessageSchema, updateTicketSchema, PAYMENT_ADDRESSES } from "@shared/schema";
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
  startDailyEarningsService();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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
      const transactionData = createTransactionSchema.parse(req.body);

      // Get the mining plan to calculate USD amount
      const plan = await storage.getMiningPlan(transactionData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Mining plan not found" });
      }

      const transaction = await storage.createTransaction({
        ...transactionData,
        userId,
        amount: Number(plan.price), // USD amount from plan
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
      const userId = req.user.id;
      const contracts = await storage.getUserMiningContracts(userId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching mining contracts:", error);
      res.status(500).json({ message: "Failed to fetch mining contracts" });
    }
  });

  // User mining contracts with plan details
  app.get('/api/mining-contracts-with-plans', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contracts = await storage.getUserMiningContracts(userId);
      
      // Fetch plan details for each contract
      const contractsWithPlans = await Promise.all(
        contracts.map(async (contract) => {
          const plan = await storage.getMiningPlan(contract.planId);
          return {
            ...contract,
            plan: plan
          };
        })
      );
      
      res.json(contractsWithPlans);
    } catch (error) {
      console.error("Error fetching mining contracts with plans:", error);
      res.status(500).json({ message: "Failed to fetch mining contracts with plans" });
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

  // User withdrawals
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

  // Create withdrawal
  app.post('/api/withdrawals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
  app.get('/api/admin/stats', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allTransactions = await storage.getAllTransactions();
      const allWithdrawals = await storage.getAllWithdrawals();
      
      const totalDeposits = allTransactions
        .filter(tx => tx.status === 'approved')
        .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
      
      const totalWithdrawals = allWithdrawals
        .filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0);
      
      const totalUsers = await storage.getTotalUsers();
      const pendingTransactions = await storage.getPendingTransactions();
      const pendingWithdrawals = await storage.getPendingWithdrawals();

      res.json({
        totalDeposits,
        totalWithdrawals,
        totalUsers,
        pendingTransactions: pendingTransactions.length,
        pendingWithdrawals: pendingWithdrawals.length,
        netProfit: totalDeposits - totalWithdrawals
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/transactions', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactions = await storage.getPendingTransactions();
      
      // Enhance transactions with user details
      const enhancedTransactions = await Promise.all(
        transactions.map(async (tx) => {
          const user = await storage.getUser(tx.userId);
          return {
            ...tx,
            userEmail: user?.email || 'Unknown',
            userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
          };
        })
      );
      
      res.json(enhancedTransactions);
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
      const transaction = await storage.approveTransaction(parseInt(id), req.user.id);
      
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

          const contract = await storage.createMiningContract({
            userId: transaction.userId,
            planId: transaction.planId,
            transactionId: transaction.id,
            startDate,
            endDate,
            isActive: true,
            totalEarnings: "0",
          });

          // Start generating daily earnings for this contract
          generateDailyEarnings(transaction.userId.toString(), plan, contract.id);
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
      const transaction = await storage.rejectTransaction(id, req.user.id, reason);
      
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

  // Announcements routes
  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  // Admin announcements management
  app.get('/api/admin/announcements', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching admin announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post('/api/admin/announcements', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const announcementData = createAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement({
        ...announcementData,
        createdBy: req.user.id
      });

      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid announcement data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create announcement" });
      }
    }
  });

  app.put('/api/admin/announcements/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const updates = createAnnouncementSchema.partial().parse(req.body);
      
      const announcement = await storage.updateAnnouncement(parseInt(id), updates);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      res.json(announcement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid announcement data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update announcement" });
      }
    }
  });

  app.delete('/api/admin/announcements/:id', isAuthenticated, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const success = await storage.deleteAnnouncement(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Support Ticket endpoints

  // Get user's support tickets
  app.get('/api/support-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tickets = await storage.getUserSupportTickets(userId);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Create a new support ticket
  app.post('/api/support-tickets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketData = createSupportTicketSchema.parse(req.body);
      
      const ticket = await storage.createSupportTicket({
        ...ticketData,
        userId,
      });
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Get ticket messages
  app.get('/api/support-tickets/:ticketId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = parseInt(req.params.ticketId);
      
      // Verify user owns this ticket or is admin
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket || (ticket.userId !== userId && !req.user.isAdmin)) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const messages = await storage.getTicketMessages(ticketId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching ticket messages:", error);
      res.status(500).json({ message: "Failed to fetch ticket messages" });
    }
  });

  // Add message to ticket
  app.post('/api/support-tickets/:ticketId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const ticketId = parseInt(req.params.ticketId);
      const messageData = createTicketMessageSchema.parse({
        ...req.body,
        ticketId
      });
      
      // Verify user owns this ticket or is admin
      const ticket = await storage.getSupportTicket(ticketId);
      if (!ticket || (ticket.userId !== userId && !req.user.isAdmin)) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const message = await storage.createTicketMessage({
        ...messageData,
        userId,
        isFromAdmin: req.user.isAdmin,
      });
      
      // Update ticket status if it was resolved and user is replying
      if (ticket.status === 'resolved' && !req.user.isAdmin) {
        await storage.updateSupportTicket(ticketId, { status: 'open' });
      }
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating ticket message:", error);
      res.status(500).json({ message: "Failed to create ticket message" });
    }
  });

  // Admin-only endpoints

  // Get all support tickets (admin)
  app.get('/api/admin/support-tickets', isAdmin, async (req: any, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all support tickets:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Update ticket status/assignment (admin)
  app.patch('/api/admin/support-tickets/:ticketId', isAdmin, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const updateData = updateTicketSchema.parse(req.body);
      
      if (updateData.status === 'resolved' && !updateData.assignedTo) {
        updateData.assignedTo = req.user.id;
      }
      
      const ticket = await storage.updateSupportTicket(ticketId, updateData);
      res.json(ticket);
    } catch (error) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default mining plans
async function initializeMiningPlans() {
  try {
    const existingPlans = await storage.getMiningPlans();
    
    // Update existing plans to 1-month contract period if they have old values
    if (existingPlans.length > 0) {
      for (const existingPlan of existingPlans) {
        if (existingPlan.contractPeriod === 12) {
          // Update the plan with new values
          const updatedFeatures = existingPlan.features?.map(feature => 
            feature.replace('12-month contract', '1-month contract')
          );
          
          await storage.updateMiningPlan(existingPlan.id, {
            contractPeriod: 1,
            features: updatedFeatures
          });
        }
      }
      console.log("✓ Existing mining plans updated to 1-month contracts");
      return;
    }
    
    if (existingPlans.length === 0) {
      const plans = [
        {
          name: "Starter Plan",
          price: "10",
          miningRate: "1.0", // MH/s
          dailyEarnings: "0.00000500", // BTC
          monthlyRoi: "15.0", // percentage
          contractPeriod: 1, // months (changed to 1 month)
          description: "Perfect for beginners wanting to start their mining journey",
          features: [
            "1 MH/s mining power",
            "Daily BTC earnings",
            "1-month contract",
            "15% monthly ROI",
            "Basic support"
          ],
          isActive: true,
        },
        {
          name: "Pro Plan",
          price: "50",
          miningRate: "5.0",
          dailyEarnings: "0.00002800",
          monthlyRoi: "18.0",
          contractPeriod: 1,
          description: "For serious miners looking for better returns",
          features: [
            "5 MH/s mining power",
            "Higher daily earnings",
            "1-month contract",
            "18% monthly ROI",
            "Priority support"
          ],
          isActive: true,
        },
        {
          name: "Enterprise Plan",
          price: "200",
          miningRate: "20.0",
          dailyEarnings: "0.00012500",
          monthlyRoi: "22.0",
          contractPeriod: 1,
          description: "Maximum mining power for professional investors",
          features: [
            "20 MH/s mining power",
            "Maximum daily earnings",
            "1-month contract",
            "22% monthly ROI",
            "VIP support",
            "Custom analytics"
          ],
          isActive: true,
        },
        {
          name: "Advanced Plan",
          price: "100",
          miningRate: "10.0",
          dailyEarnings: "0.00003500",
          monthlyRoi: "20.0",
          contractPeriod: 1,
          description: "Advanced mining solution with enhanced performance",
          features: [
            "10 MH/s mining power",
            "Enhanced daily earnings",
            "1-month contract",
            "20% monthly ROI",
            "Advanced support",
            "Performance analytics"
          ],
          isActive: true,
        },
        {
          name: "Premium Plan",
          price: "500",
          miningRate: "50.0",
          dailyEarnings: "0.00018500",
          monthlyRoi: "25.0",
          contractPeriod: 1,
          description: "Premium mining package for high-volume investors",
          features: [
            "50 MH/s mining power",
            "Premium daily earnings",
            "1-month contract",
            "25% monthly ROI",
            "Premium support",
            "Dedicated account manager",
            "Real-time monitoring"
          ],
          isActive: true,
        },
        {
          name: "Ultimate Plan",
          price: "1000",
          miningRate: "100.0",
          dailyEarnings: "0.00045000",
          monthlyRoi: "30.0",
          contractPeriod: 1,
          description: "Ultimate mining power for institutional investors",
          features: [
            "100 MH/s mining power",
            "Ultimate daily earnings",
            "1-month contract",
            "30% monthly ROI",
            "White-glove support",
            "Dedicated infrastructure",
            "Custom reporting",
            "API access"
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
    const adminEmail = "fredokcee1@gmail.com";
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
      
      await storage.updateUser(existingAdmin.id, {
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
          price: crypto.current_price.toString(),
          change1h: crypto.price_change_percentage_1h_in_currency?.toString() || null,
          change24h: crypto.price_change_percentage_24h?.toString() || null,
          change7d: crypto.price_change_percentage_7d_in_currency?.toString() || null,
          marketCap: crypto.market_cap?.toString() || null,
          volume24h: crypto.total_volume?.toString() || null,
          circulatingSupply: crypto.circulating_supply?.toString() || null,
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
        await storage.upsertCryptoPrice({
          ...crypto,
          price: crypto.price.toString(),
          change24h: crypto.change24h.toString()
        });
      }
    } catch (fallbackError) {
      console.error("Error setting fallback prices:", fallbackError);
    }
  }
}

// Generate per-second earnings for active contracts  
async function generateDailyEarnings(userId: string, plan: any, contractId: number) {
  try {
    const btcPrice = await storage.getCryptoPrice('BTC');
    const btcPriceUsd = Number(btcPrice?.price) || 111325;
    
    // Convert daily earnings to per-second earnings (daily / 86,400 seconds in a day)
    const dailyEarningsAmount = Number(plan.dailyEarnings);
    const perSecondEarningsAmount = dailyEarningsAmount / 86400; // 24 hours * 60 minutes * 60 seconds = 86,400
    
    await storage.createMiningEarning({
      contractId,
      userId: Number(userId),
      date: new Date(),
      amount: perSecondEarningsAmount.toString(), // Correct per-second BTC amount
      usdValue: (perSecondEarningsAmount * btcPriceUsd).toString(),
    });
  } catch (error) {
    console.error("Error generating per-second earnings:", error);
  }
}

// Generate earnings for all active contracts (per second)
async function generateEarningsForAllContracts() {
  try {
    const activeContracts = await storage.getActiveMiningContracts();
    
    for (const contract of activeContracts) {
      const plan = await storage.getMiningPlan(contract.planId);
      if (plan) {
        await generateDailyEarnings(contract.userId.toString(), plan, contract.id);
      }
    }
    
    // Log every 10 seconds to avoid spam
    if (Date.now() % 10000 < 1000) {
      console.log(`⛏️ Real-time mining active: ${activeContracts.length} contracts earning per second`);
    }
  } catch (error) {
    console.error("Error in real-time earnings generation:", error);
  }
}

// Real-time earnings generation service (every second)
function startDailyEarningsService() {
  console.log("✓ Real-time earnings service started - generating every second");
  
  // Generate earnings immediately
  generateEarningsForAllContracts();
  
  // Generate earnings every second (1000 milliseconds) for live balance updates
  setInterval(() => {
    generateEarningsForAllContracts();
  }, 1000);
}

// Start the price update service
function startPriceUpdateService() {
  // Update prices every 1 minute for more real-time conversion rates
  setInterval(fetchCryptoPrices, 1 * 60 * 1000);
  
  // Initial fetch
  fetchCryptoPrices();
  
  console.log("✓ Price update service started - updating every minute for real-time rates");
}

