import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Coins, Zap, Clock, TrendingUp } from "lucide-react";

interface MiningEarning {
  _id: string;
  amount: number;
  usdValue: number;
  date: string;
}

interface MiningContract {
  _id: string;
  planId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  totalEarnings: number;
}

interface Transaction {
  _id: string;
  amount: number;
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
  });

  const { data: contracts = [], isLoading: contractsLoading } = useQuery<MiningContract[]>({
    queryKey: ["/api/mining-contracts"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const earnings = earningsData?.earnings || [];
  const totals = earningsData?.totals || { totalBtc: 0, totalUsd: 0 };

  const activeContracts = contracts.filter((contract: MiningContract) => contract.isActive);
  const totalMiningRate = activeContracts.length * 5; // Assuming average 5 MH/s per contract

  const formatBtc = (amount: number | string) => {
    return `${Number(amount).toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number | string) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  if (earningsLoading || contractsLoading || transactionsLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-cmc-gray" data-testid="text-loading-dashboard">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="container-mining-dashboard">
      {/* Stats Cards */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="bg-cmc-card border-gray-700" data-testid="card-total-earnings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">Total Earnings</CardTitle>
            <Coins className="text-cmc-green text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cmc-green mb-2" data-testid="text-total-btc">
              {formatBtc(totals.totalBtc)}
            </div>
            <div className="text-sm text-cmc-gray" data-testid="text-total-usd">
              ≈ {formatUsd(totals.totalUsd)}
            </div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Today's Earnings</div>
              <div className="text-lg font-semibold text-cmc-green" data-testid="text-today-earnings">
                {earnings.length > 0 ? `+${formatBtc(earnings[0]?.amount || 0)}` : "+0.00000000 BTC"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-cmc-card border-gray-700" data-testid="card-mining-power">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-white">Mining Power</CardTitle>
            <Zap className="text-cmc-blue text-xl" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cmc-blue mb-2" data-testid="text-mining-power">
              {totalMiningRate.toFixed(1)} MH/s
            </div>
            <div className="text-sm text-cmc-gray" data-testid="text-active-contracts">
              {activeContracts.length} Active Contract{activeContracts.length !== 1 ? 's' : ''}
            </div>
            <div className="mt-4 bg-cmc-dark rounded-lg p-3">
              <div className="text-sm text-cmc-gray mb-1">Efficiency</div>
              <div className="text-lg font-semibold text-cmc-green" data-testid="text-efficiency">99.8%</div>
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
