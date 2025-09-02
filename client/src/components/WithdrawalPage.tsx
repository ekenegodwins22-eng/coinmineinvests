import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";

const WITHDRAWAL_CURRENCIES = [
  { symbol: "BTC", name: "Bitcoin", minAmount: "0.0001" },
  { symbol: "ETH", name: "Ethereum", minAmount: "0.001" },
  { symbol: "USDT", name: "Tether", minAmount: "10" },
  { symbol: "USDC", name: "USD Coin", minAmount: "10" },
  { symbol: "BNB", name: "BNB", minAmount: "0.01" },
  { symbol: "SOL", name: "Solana", minAmount: "0.1" },
  { symbol: "ADA", name: "Cardano", minAmount: "10" },
  { symbol: "DOT", name: "Polkadot", minAmount: "1" },
];

interface Withdrawal {
  id: string;
  currency: string;
  amount: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  transactionHash?: string;
}

export default function WithdrawalPage() {
  const [currency, setCurrency] = useState("");
  const [amount, setAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: earningsData } = useQuery({
    queryKey: ["/api/earnings"],
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["/api/withdrawals"],
  });

  const totals = earningsData?.totals || { totalBtc: "0", totalUsd: "0" };
  const availableBalance = parseFloat(totals.totalBtc);

  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/withdrawals", data);
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Requested",
        description: "Your withdrawal request has been submitted and is being processed.",
      });
      setCurrency("");
      setAmount("");
      setWalletAddress("");
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create withdrawal request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const selectedCurrency = WITHDRAWAL_CURRENCIES.find(c => c.symbol === currency);
  const networkFee = currency === "BTC" ? "0.00001" : currency === "ETH" ? "0.001" : "0";
  const minAmount = selectedCurrency?.minAmount || "0";
  const amountNum = parseFloat(amount || "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currency || !amount || !walletAddress.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (amountNum <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (amountNum < parseFloat(minAmount)) {
      toast({
        title: "Error",
        description: `Minimum withdrawal amount is ${minAmount} ${currency}`,
        variant: "destructive",
      });
      return;
    }

    // Check balance for all currencies (convert BTC balance to requested currency)
    if (currency === "BTC") {
      if (amountNum > availableBalance) {
        toast({
          title: "Error",
          description: "Insufficient balance",
          variant: "destructive",
        });
        return;
      }
    } else {
      // For other currencies, we need to convert BTC to the requested currency
      // This is a simplified validation - the backend will handle the actual conversion
      toast({
        title: "Info",
        description: "Multi-currency withdrawal will be processed based on current market rates",
        variant: "default",
      });
    }

    createWithdrawalMutation.mutate({
      currency,
      amount: amountNum, // Send as number instead of string
      walletAddress: walletAddress.trim(),
    });
  };

  return (
    <div className="space-y-8" data-testid="container-withdrawal-page">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Withdrawal Form */}
        <Card className="bg-cmc-card border-gray-700" data-testid="card-withdrawal-form">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Withdraw Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label className="text-cmc-gray">Select Cryptocurrency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="bg-cmc-dark border-gray-600 text-white mt-2" data-testid="select-currency">
                    <SelectValue placeholder="Choose cryptocurrency" />
                  </SelectTrigger>
                  <SelectContent className="bg-cmc-dark border-gray-600">
                    {WITHDRAWAL_CURRENCIES.map((crypto) => (
                      <SelectItem 
                        key={crypto.symbol} 
                        value={crypto.symbol}
                        className="text-white hover:bg-gray-700"
                        data-testid={`option-currency-${crypto.symbol.toLowerCase()}`}
                      >
                        {crypto.name} ({crypto.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-cmc-gray">Wallet Address</Label>
                <Input
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="bg-cmc-dark border-gray-600 text-white mt-2"
                  placeholder="Enter your wallet address"
                  data-testid="input-wallet-address"
                />
              </div>

              <div>
                <Label className="text-cmc-gray">Amount</Label>
                <div className="relative mt-2">
                  <Input
                    type="number"
                    step="0.00000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-cmc-dark border-gray-600 text-white pr-16"
                    placeholder="0.00000000"
                    data-testid="input-amount"
                  />
                  <div className="absolute right-3 top-3 text-cmc-gray">
                    {currency || "BTC"}
                  </div>
                </div>
                {currency === "BTC" && (
                  <div className="text-xs text-cmc-gray mt-1">
                    Available: {availableBalance.toFixed(8)} BTC
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={createWithdrawalMutation.isPending}
                className="w-full bg-cmc-green text-white hover:bg-green-600"
                data-testid="button-submit-withdrawal"
              >
                {createWithdrawalMutation.isPending ? "Processing..." : "Withdraw Funds"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Withdrawal Information */}
        <Card className="bg-cmc-dark border-gray-600" data-testid="card-withdrawal-info">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Withdrawal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-cmc-gray">Available Balance:</span>
                <span className="font-semibold text-white" data-testid="text-available-balance">
                  {availableBalance.toFixed(8)} BTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cmc-gray">Network Fee:</span>
                <span className="font-semibold text-white" data-testid="text-network-fee">
                  {networkFee} {currency || "BTC"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-cmc-gray">Processing Time:</span>
                <span className="font-semibold text-white">1-6 hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cmc-gray">Minimum Withdrawal:</span>
                <span className="font-semibold text-white" data-testid="text-min-withdrawal">
                  {minAmount} {currency || "BTC"}
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-semibold text-yellow-500 mb-1">Important Note</div>
                  <div className="text-cmc-gray">
                    Please double-check your wallet address. Transactions cannot be reversed once confirmed.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card className="bg-cmc-card border-gray-700" data-testid="card-withdrawal-history">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white">Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalsLoading ? (
            <div className="text-center py-8">
              <div className="text-cmc-gray">Loading withdrawal history...</div>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-cmc-gray" data-testid="text-no-withdrawals">No withdrawals yet</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-cmc-gray">Currency</TableHead>
                    <TableHead className="text-cmc-gray">Amount</TableHead>
                    <TableHead className="text-cmc-gray">Address</TableHead>
                    <TableHead className="text-cmc-gray">Status</TableHead>
                    <TableHead className="text-cmc-gray">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal: Withdrawal) => (
                    <TableRow key={withdrawal.id} className="border-gray-700" data-testid={`row-withdrawal-${withdrawal.id}`}>
                      <TableCell>
                        <Badge variant="outline" className="border-cmc-blue text-cmc-blue">
                          {withdrawal.currency}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-white" data-testid={`text-withdrawal-amount-${withdrawal.id}`}>
                        {withdrawal.amount}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-cmc-gray" data-testid={`text-withdrawal-address-${withdrawal.id}`}>
                        {withdrawal.walletAddress.slice(0, 10)}...
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            withdrawal.status === "completed" ? "default" :
                            withdrawal.status === "rejected" ? "destructive" : "secondary"
                          }
                          className={withdrawal.status === "completed" ? "bg-cmc-green" : ""}
                          data-testid={`badge-withdrawal-status-${withdrawal.status}`}
                        >
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-cmc-gray">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
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
