import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Coins, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface MiningEarning {
  id: number;
  amount: number;
  usdValue: number;
  date: string;
  contractId: number;
}

interface EarningsData {
  earnings: MiningEarning[];
  totals: { totalBtc: number; totalUsd: number };
}

export default function EarningsPage() {
  const { data: earningsData, isLoading } = useQuery<EarningsData>({
    queryKey: ["/api/earnings"],
  });

  const earnings = earningsData?.earnings || [];
  const totals = earningsData?.totals || { totalBtc: 0, totalUsd: 0 };

  // Group earnings by date
  const groupedEarnings = earnings.reduce((groups: { [key: string]: MiningEarning[] }, earning) => {
    const date = new Date(earning.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(earning);
    return groups;
  }, {});

  // Calculate daily totals
  const dailyTotals = Object.entries(groupedEarnings).map(([date, dayEarnings]) => ({
    date,
    totalBtc: dayEarnings.reduce((sum, earning) => sum + Number(earning.amount), 0),
    totalUsd: dayEarnings.reduce((sum, earning) => sum + Number(earning.usdValue), 0),
    count: dayEarnings.length
  }));

  const formatBtc = (amount: number | string) => {
    return `${Number(amount).toFixed(8)} BTC`;
  };

  const formatUsd = (amount: number | string) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cmc-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="text-cmc-gray">Loading earnings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cmc-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-cmc-blue hover:text-blue-400" data-testid="link-back-home">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-earnings-title">Mining Earnings</h1>
              <p className="text-cmc-gray">Complete transaction history with dates</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-earnings-summary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-white">Total Earnings</CardTitle>
              <Coins className="text-cmc-green text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-green mb-1">
                {formatBtc(totals.totalBtc)}
              </div>
              <div className="text-sm text-cmc-gray">
                ≈ {formatUsd(totals.totalUsd)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-transactions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-white">Total Transactions</CardTitle>
              <TrendingUp className="text-cmc-blue text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-blue mb-1">
                {earnings.length}
              </div>
              <div className="text-sm text-cmc-gray">
                Mining payouts
              </div>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-active-days">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold text-white">Active Days</CardTitle>
              <Calendar className="text-yellow-500 text-xl" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500 mb-1">
                {Object.keys(groupedEarnings).length}
              </div>
              <div className="text-sm text-cmc-gray">
                Days with earnings
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Earnings Summary */}
        <Card className="bg-cmc-card border-gray-700 mb-8" data-testid="card-daily-summary">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Daily Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTotals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray">No earnings yet</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-cmc-gray">Date</TableHead>
                      <TableHead className="text-cmc-gray">BTC Earned</TableHead>
                      <TableHead className="text-cmc-gray">USD Value</TableHead>
                      <TableHead className="text-cmc-gray">Transactions</TableHead>
                      <TableHead className="text-cmc-gray">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyTotals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((day, index) => (
                      <TableRow key={day.date} className="border-gray-700" data-testid={`row-daily-${index}`}>
                        <TableCell className="font-medium text-white">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-cmc-green">
                          +{formatBtc(day.totalBtc)}
                        </TableCell>
                        <TableCell className="font-semibold text-cmc-green">
                          +{formatUsd(day.totalUsd)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-cmc-blue text-cmc-blue">
                            {day.count} payout{day.count !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-cmc-green">
                            Confirmed
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Transaction History */}
        <Card className="bg-cmc-card border-gray-700" data-testid="card-transaction-history">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Detailed Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray">No earnings transactions yet</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-cmc-gray">Transaction ID</TableHead>
                      <TableHead className="text-cmc-gray">Date & Time</TableHead>
                      <TableHead className="text-cmc-gray">BTC Amount</TableHead>
                      <TableHead className="text-cmc-gray">USD Value</TableHead>
                      <TableHead className="text-cmc-gray">Contract</TableHead>
                      <TableHead className="text-cmc-gray">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((earning) => (
                      <TableRow key={earning.id} className="border-gray-700" data-testid={`row-earning-${earning.id}`}>
                        <TableCell className="font-mono text-sm">
                          #{earning.id.toString().padStart(6, '0')}
                        </TableCell>
                        <TableCell className="text-white">
                          {new Date(earning.date).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-semibold text-cmc-green">
                          +{formatBtc(earning.amount)}
                        </TableCell>
                        <TableCell className="font-semibold text-cmc-green">
                          +{formatUsd(earning.usdValue)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-cmc-blue text-cmc-blue">
                            Contract #{earning.contractId}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-cmc-green">
                            Confirmed
                          </Badge>
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
    </div>
  );
}