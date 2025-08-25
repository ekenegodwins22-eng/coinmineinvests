import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Zap, Clock, TrendingUp, ArrowUpCircle, ArrowDownCircle, BarChart3, Activity, Plus } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import RealTimeBalanceTicker from "./RealTimeBalanceTicker";

interface MiningEarning {
  id: number;
  amount: number;
  usdValue: number;
  date: string;
}

interface MiningPlan {
  id: number;
  name: string;
  price: string;
  miningRate: string;
  dailyEarnings: string;
  monthlyRoi: string;
  contractPeriod: number;
  description: string;
  features: string[];
  isActive: boolean;
}

interface MiningContract {
  id: number;
  planId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalEarnings: number;
  plan?: MiningPlan;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdAt: string;
}

interface Transaction {
  id: number;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface Withdrawal {
  id: number;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
}

interface EarningsData {
  earnings: MiningEarning[];
  totals: { totalBtc: number; totalUsd: number };
}

export default function MiningDashboard() {
  const { data: earningsData, isLoading: earningsLoading } = useQuery<EarningsData>({
    queryKey: ["/api/earnings"],
    refetchInterval: 1000, // Refresh every second for real-time updates
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery<MiningContract[]>({
    queryKey: ["/api/mining-contracts-with-plans"],
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const earnings = earningsData?.earnings || [];
  const totals = earningsData?.totals || { totalBtc: 0, totalUsd: 0 };

  // Calculate today's and yesterday's earnings
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
  
  const todaysEarnings = earnings.filter(earning => 
    new Date(earning.date).toDateString() === today
  );
  
  const yesterdaysEarnings = earnings.filter(earning => 
    new Date(earning.date).toDateString() === yesterday
  );

  const todaysTotalBtc = todaysEarnings.reduce((sum, earning) => sum + Number(earning.amount), 0);
  const yesterdaysTotalBtc = yesterdaysEarnings.reduce((sum, earning) => sum + Number(earning.amount), 0);

  // Real-time balance ticker state
  const [previousBalance, setPreviousBalance] = useState(totals.totalBtc);
  const [balanceIncrement, setBalanceIncrement] = useState(0);
  const [showIncrement, setShowIncrement] = useState(false);

  // Track balance changes for micro-animations
  useEffect(() => {
    if (totals.totalBtc > previousBalance && previousBalance > 0) {
      const increment = totals.totalBtc - previousBalance;
      setBalanceIncrement(increment);
      setShowIncrement(true);
      
      // Hide increment after animation
      setTimeout(() => setShowIncrement(false), 2000);
    }
    setPreviousBalance(totals.totalBtc);
  }, [totals.totalBtc, previousBalance]);

  const activeContracts = contracts.filter((contract: MiningContract) => contract.isActive);
  const totalMiningRate = activeContracts.reduce((total, contract) => {
    const miningRate = contract.plan ? Number(contract.plan.miningRate) : 0;
    return total + miningRate;
  }, 0);

  // Calculate total deposits (approved transactions)
  const totalDeposits = transactions
    .filter(tx => tx.status === 'approved')
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Calculate total withdrawals (completed withdrawals)
  const totalWithdrawals = withdrawals
    .filter(w => w.status === 'completed')
    .reduce((sum, w) => sum + parseFloat(w.amount), 0);

  const formatBtc = (amount: number | string) => {
    return `${Number(amount).toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number | string) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  if (earningsLoading || contractsLoading || transactionsLoading || withdrawalsLoading || announcementsLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-cmc-gray" data-testid="text-loading-dashboard">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="container-mining-dashboard">
      {/* Announcements Section */}
      {announcements.length > 0 && (
        <Card className="bg-cmc-card border-gray-700" data-testid="card-announcements">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">📢 Announcements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement: Announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    announcement.type === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500'
                      : announcement.type === 'promotion'
                      ? 'bg-green-500/10 border-green-500'
                      : 'bg-blue-500/10 border-blue-500'
                  }`}
                  data-testid={`announcement-${announcement.id}`}
                >
                  <h4 className="font-semibold text-white mb-2" data-testid={`announcement-title-${announcement.id}`}>
                    {announcement.title}
                  </h4>
                  <p className="text-cmc-gray text-sm" data-testid={`announcement-content-${announcement.id}`}>
                    {announcement.content}
                  </p>
                  <p className="text-xs text-cmc-gray mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Stats Cards */}
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="bg-cmc-card border-gray-700 relative overflow-hidden" data-testid="card-total-earnings">
          {/* Mining animation background */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-cmc-green/5 to-transparent"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              Total Earnings
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Coins className="text-cmc-green text-xl" />
              </motion.div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="relative">
              {/* Real-time balance ticker */}
              <div className="text-3xl font-bold mb-2" data-testid="text-total-btc">
                <RealTimeBalanceTicker
                  currentBalance={totals.totalBtc}
                  currency=""
                  isActive={activeContracts.length > 0}
                  className="text-cmc-green"
                />
                <span className="ml-2 text-cmc-green">BTC</span>
              </div>
              
              {/* Real-time increment ticker */}
              <AnimatePresence>
                {showIncrement && balanceIncrement > 0 && (
                  <motion.div
                    className="absolute -top-6 right-0 text-sm font-semibold text-cmc-green flex items-center gap-1"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: -10, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.8 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Plus className="w-3 h-3" />
                    {formatBtc(balanceIncrement)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <motion.div 
              className="text-sm text-cmc-gray" 
              data-testid="text-total-usd"
              key={totals.totalUsd}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1 }}
            >
              ≈ <RealTimeBalanceTicker
                currentBalance={totals.totalUsd}
                currency="$"
                isActive={activeContracts.length > 0}
                className="text-cmc-gray inline-block"
              />
            </motion.div>
            <div className="mt-4 space-y-3">
              <div className="bg-cmc-dark rounded-lg p-3 relative overflow-hidden">
                <div className="text-sm text-cmc-gray mb-1">Today's Earnings</div>
                <motion.div 
                  className="text-lg font-semibold text-cmc-green" 
                  data-testid="text-today-earnings"
                  key={todaysTotalBtc}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    color: ["#10b981", "#06d6a0", "#10b981"]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  +{formatBtc(todaysTotalBtc)}
                </motion.div>
                {/* Micro pulse animation for active earning */}
                {activeContracts.length > 0 && (
                  <motion.div
                    className="absolute bottom-2 right-2 w-2 h-2 bg-cmc-green rounded-full"
                    animate={{ 
                      opacity: [0.5, 1, 0.5],
                      scale: [0.8, 1.2, 0.8] 
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <div className="bg-cmc-dark rounded-lg p-3">
                <div className="text-sm text-cmc-gray mb-1">Yesterday's Earnings</div>
                <div className="text-lg font-semibold text-yellow-500" data-testid="text-yesterday-earnings">
                  +{formatBtc(yesterdaysTotalBtc)}
                </div>
              </div>
              <Link href="/earnings">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full border-cmc-blue text-cmc-blue hover:bg-cmc-blue hover:text-white"
                  data-testid="button-view-all-earnings"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View All Earnings
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cmc-card border-gray-700 relative overflow-hidden" data-testid="card-mining-power">
          {/* Live mining animation */}
          {activeContracts.length > 0 && (
            <motion.div 
              className="absolute top-4 right-4 z-10"
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-3 h-3 bg-cmc-green rounded-full"></div>
            </motion.div>
          )}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
              Mining Power ⛏️
              {activeContracts.length > 0 && (
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Activity className="text-cmc-blue text-xl" />
                </motion.div>
              )}
            </CardTitle>
            <motion.div
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="text-cmc-blue text-xl" />
            </motion.div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cmc-blue mb-2 flex items-center gap-2" data-testid="text-mining-power">
              {totalMiningRate.toFixed(1)} MH/s
              {activeContracts.length > 0 && (
                <motion.span
                  className="text-xs text-cmc-green font-normal"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  MINING
                </motion.span>
              )}
            </div>
            <div className="text-sm text-cmc-gray" data-testid="text-active-contracts">
              {activeContracts.length} Active Contract{activeContracts.length !== 1 ? 's' : ''}
            </div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Efficiency</div>
              <div className="text-lg font-semibold text-cmc-green flex items-center gap-2" data-testid="text-efficiency">
                99.8%
                {activeContracts.length > 0 && (
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-cmc-green border-t-transparent rounded-full"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cmc-card border-gray-700" data-testid="card-total-deposits">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">Total Deposits</CardTitle>
            <ArrowUpCircle className="text-green-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500 mb-2" data-testid="text-total-deposits">
              {formatUsd(totalDeposits)}
            </div>
            <div className="text-sm text-cmc-gray">All Time Investments</div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Status</div>
              <div className="text-lg font-semibold text-green-500" data-testid="text-deposits-status">
                Active Investing
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cmc-card border-gray-700" data-testid="card-total-withdrawals">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">Total Withdrawals</CardTitle>
            <ArrowDownCircle className="text-orange-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500 mb-2" data-testid="text-total-withdrawals">
              {formatUsd(totalWithdrawals)}
            </div>
            <div className="text-sm text-cmc-gray">Successfully Withdrawn</div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Available Balance</div>
              <div className="text-lg font-semibold text-cmc-green" data-testid="text-available-balance">
                {formatBtc(totals.totalBtc)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cmc-card border-gray-700" data-testid="card-next-payout">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">Next Payout</CardTitle>
            <Clock className="text-yellow-500 text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500 mb-2" data-testid="text-next-payout">
              2d 14h
            </div>
            <div className="text-sm text-cmc-gray">Automatic Payout</div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Pending</div>
              <div className="text-lg font-semibold" data-testid="text-pending-amount">0.00024 BTC</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-cmc-card border-gray-700" data-testid="card-recent-transactions">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-cmc-gray" data-testid="text-no-transactions">No transactions yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-cmc-gray">Amount</TableHead>
                    <TableHead className="text-cmc-gray">Currency</TableHead>
                    <TableHead className="text-cmc-gray">Status</TableHead>
                    <TableHead className="text-cmc-gray">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction: Transaction) => (
                    <TableRow key={transaction.id} className="border-gray-700" data-testid={`row-transaction-${transaction.id}`}>
                      <TableCell className="font-semibold text-white">
                        ${transaction.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-cmc-blue text-cmc-blue">
                          {transaction.currency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.status === "approved" ? "default" : 
                                   transaction.status === "rejected" ? "destructive" : "secondary"}
                          className={transaction.status === "approved" ? "bg-cmc-green" : ""}
                          data-testid={`badge-status-${transaction.status}`}
                        >
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-cmc-gray">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Earnings */}
      <Card className="bg-cmc-card border-gray-700" data-testid="card-recent-earnings">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Recent Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-cmc-gray" data-testid="text-no-earnings">No earnings yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-cmc-gray">Date</TableHead>
                    <TableHead className="text-cmc-gray">BTC Amount</TableHead>
                    <TableHead className="text-cmc-gray">USD Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.slice(0, 7).map((earning: MiningEarning) => (
                    <TableRow key={earning.id} className="border-gray-700" data-testid={`row-earning-${earning.id}`}>
                      <TableCell className="text-cmc-gray">
                        {new Date(earning.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-white" data-testid={`text-btc-amount-${earning.id}`}>
                        {formatBtc(earning.amount)}
                      </TableCell>
                      <TableCell className="text-cmc-green font-semibold" data-testid={`text-usd-value-${earning.id}`}>
                        {formatUsd(earning.usdValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
