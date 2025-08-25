import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { ArrowLeft, Check, X, Clock, DollarSign } from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  userId: string;
  planId: string;
  amount: string;
  currency: string;
  cryptoAmount: string;
  transactionHash?: string;
  status: string;
  createdAt: string;
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user?.isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Success",
        description: "Transaction approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transactions"] });
      toast({
        title: "Success",
        description: "Transaction rejected successfully",
      });
      setRejectReason("");
      setSelectedTransaction(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (transactionId: string) => {
    approveMutation.mutate(transactionId);
  };

  const handleReject = () => {
    if (selectedTransaction && rejectReason.trim()) {
      rejectMutation.mutate({ 
        transactionId: selectedTransaction, 
        reason: rejectReason.trim() 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cmc-dark">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cmc-dark text-white">
      {/* Header */}
      <div className="bg-cmc-card border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-cmc-blue hover:text-blue-400" data-testid="link-back">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin Dashboard</h1>
            </div>
            <Badge variant="secondary" className="bg-cmc-blue text-white" data-testid="badge-admin">
              Administrator
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-cmc-card border-gray-700" data-testid="card-pending-transactions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Pending Transactions</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{transactions.length}</div>
              <p className="text-xs text-cmc-gray">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-value">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-cmc-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-green">
                ${transactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0).toFixed(2)}
              </div>
              <p className="text-xs text-cmc-gray">Pending transactions</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-processing">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Processing</CardTitle>
              <Clock className="h-4 w-4 text-cmc-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-blue">
                {approveMutation.isPending || rejectMutation.isPending ? "1" : "0"}
              </div>
              <p className="text-xs text-cmc-gray">Currently processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card className="bg-cmc-card border-gray-700" data-testid="card-transactions">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray">Loading transactions...</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray" data-testid="text-no-transactions">No pending transactions</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="text-cmc-gray">Transaction ID</TableHead>
                      <TableHead className="text-cmc-gray">Amount</TableHead>
                      <TableHead className="text-cmc-gray">Currency</TableHead>
                      <TableHead className="text-cmc-gray">Crypto Amount</TableHead>
                      <TableHead className="text-cmc-gray">Transaction Hash</TableHead>
                      <TableHead className="text-cmc-gray">Date</TableHead>
                      <TableHead className="text-cmc-gray">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction: Transaction) => (
                      <TableRow key={transaction.id} className="border-gray-700" data-testid={`row-transaction-${transaction.id}`}>
                        <TableCell className="font-mono text-sm">
                          {transaction.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-semibold text-cmc-green">
                          ${transaction.amount}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-cmc-blue text-cmc-blue">
                            {transaction.currency}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {transaction.cryptoAmount}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.transactionHash ? (
                            `${transaction.transactionHash.slice(0, 10)}...`
                          ) : (
                            <span className="text-cmc-gray">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-cmc-gray">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleApprove(transaction.id)}
                              disabled={approveMutation.isPending}
                              className="bg-cmc-green hover:bg-green-600"
                              data-testid={`button-approve-${transaction.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setSelectedTransaction(transaction.id)}
                                  disabled={rejectMutation.isPending}
                                  data-testid={`button-reject-${transaction.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-cmc-card border-gray-700">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Reject Transaction</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="reason" className="text-cmc-gray">
                                      Rejection Reason
                                    </Label>
                                    <Textarea
                                      id="reason"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      className="bg-cmc-dark border-gray-600 text-white mt-2"
                                      placeholder="Please provide a reason for rejection..."
                                      data-testid="textarea-reject-reason"
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setRejectReason("");
                                        setSelectedTransaction(null);
                                      }}
                                      data-testid="button-cancel-reject"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleReject}
                                      disabled={!rejectReason.trim() || rejectMutation.isPending}
                                      data-testid="button-confirm-reject"
                                    >
                                      Reject Transaction
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
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
