import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
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
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, X, Clock, DollarSign, Users, TrendingUp, TrendingDown, Megaphone, Plus, Edit, Trash2, Headphones } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminSupportTickets from "@/components/AdminSupportTickets";

interface Transaction {
  id: number;
  userId: number;
  planId: number;
  amount: string;
  currency: string;
  cryptoAmount: string;
  transactionHash?: string;
  status: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
}

interface AdminStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalUsers: number;
  pendingTransactions: number;
  pendingWithdrawals: number;
  netProfit: number;
}

interface Withdrawal {
  id: number;
  userId: number;
  amount: string;
  walletAddress: string;
  status: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  type: string;
  isActive: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  
  // Announcement management state
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "promotion",
    isActive: true
  });

  useEffect(() => {
    if (!isLoading && (!user || !user.isAdmin)) {
      toast({
        title: "Unauthorized",
        description: "Admin access required",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/");
      }, 500);
      return;
    }
  }, [user, isLoading, toast, setLocation]);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
    enabled: !!user?.isAdmin,
  });

  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: !!user?.isAdmin,
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/admin/announcements"],
    enabled: !!user?.isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async (transactionId: number) => {
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
    mutationFn: async ({ transactionId, reason }: { transactionId: number; reason: string }) => {
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

  // Announcement mutations
  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      await apiRequest("POST", "/api/admin/announcements", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Success", description: "Announcement created successfully" });
      setAnnouncementForm({ title: "", content: "", type: "promotion", isActive: true });
      setShowCreateAnnouncement(false);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create announcement", variant: "destructive" });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof announcementForm> }) => {
      await apiRequest("PUT", `/api/admin/announcements/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Success", description: "Announcement updated successfully" });
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: "", content: "", type: "promotion", isActive: true });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update announcement", variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
      toast({ title: "Success", description: "Announcement deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete announcement", variant: "destructive" });
    },
  });

  const handleApprove = (transactionId: number) => {
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
        {/* Enhanced Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Total Users</CardTitle>
              <Users className="h-4 w-4 text-cmc-blue" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-blue">
                {statsLoading ? "..." : adminStats?.totalUsers || 0}
              </div>
              <p className="text-xs text-cmc-gray">Registered users</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-deposits">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Total Deposits</CardTitle>
              <TrendingUp className="h-4 w-4 text-cmc-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cmc-green">
                ${statsLoading ? "..." : adminStats?.totalDeposits.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-cmc-gray">All approved deposits</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-total-withdrawals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Total Withdrawals</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                ${statsLoading ? "..." : adminStats?.totalWithdrawals.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-cmc-gray">All completed withdrawals</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-net-profit">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-500">
                ${statsLoading ? "..." : adminStats?.netProfit.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-cmc-gray">Platform profit</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-cmc-card border-gray-700" data-testid="card-pending-transactions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Pending Transactions</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {statsLoading ? "..." : adminStats?.pendingTransactions || 0}
              </div>
              <p className="text-xs text-cmc-gray">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="bg-cmc-card border-gray-700" data-testid="card-pending-withdrawals">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cmc-gray">Pending Withdrawals</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {statsLoading ? "..." : adminStats?.pendingWithdrawals || 0}
              </div>
              <p className="text-xs text-cmc-gray">Awaiting processing</p>
            </CardContent>
          </Card>
        </div>

        {/* Support Ticket Management */}
        <div className="mb-8">
          <AdminSupportTickets />
        </div>

        {/* Transactions */}
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
                      <TableHead className="text-cmc-gray">User</TableHead>
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
                          {transaction.id ? transaction.id.toString().slice(0, 8) + '...' : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{transaction.userName || 'Unknown'}</span>
                            <span className="text-xs text-cmc-gray">{transaction.userEmail || 'Unknown'}</span>
                          </div>
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
                              disabled={approveMutation.isPending || !transaction.id}
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
          </TabsContent>

          <TabsContent value="withdrawals">
            {/* Withdrawals Management */}
            <Card className="bg-cmc-card border-gray-700" data-testid="card-withdrawals">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white">Pending Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-cmc-gray">Withdrawal management coming soon...</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="announcements">
            <Card className="bg-cmc-card border-gray-700" data-testid="card-announcements">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Megaphone className="text-orange-500 text-xl" />
                  <CardTitle className="text-xl font-bold text-white">Announcements & Promotions</CardTitle>
                </div>
                <Button 
              onClick={() => setShowCreateAnnouncement(true)}
              className="bg-orange-500 hover:bg-orange-600"
              data-testid="button-create-announcement"
            >
              <Plus className="w-4 h-4 mr-1" />
              Create Announcement
                </Button>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray">Loading announcements...</div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-cmc-gray" data-testid="text-no-announcements">No announcements created</div>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement: Announcement) => (
                  <div key={announcement.id} className="bg-cmc-dark rounded-lg p-4" data-testid={`announcement-${announcement.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                        <Badge 
                          variant={announcement.type === 'promotion' ? 'default' : announcement.type === 'warning' ? 'destructive' : 'secondary'}
                          className="capitalize"
                        >
                          {announcement.type}
                        </Badge>
                        <Badge variant={announcement.isActive ? 'default' : 'secondary'}>
                          {announcement.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingAnnouncement(announcement);
                            setAnnouncementForm({
                              title: announcement.title,
                              content: announcement.content,
                              type: announcement.type,
                              isActive: announcement.isActive
                            });
                          }}
                          data-testid={`button-edit-${announcement.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                          data-testid={`button-delete-${announcement.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-cmc-gray text-sm mb-2">{announcement.content}</p>
                    <div className="text-xs text-cmc-gray">
                      Created: {new Date(announcement.createdAt).toLocaleDateString()} | 
                      Updated: {new Date(announcement.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
                )}
              </CardContent>
            </Card>

            {/* Create/Edit Announcement Dialog */}
            <Dialog open={showCreateAnnouncement || !!editingAnnouncement} onOpenChange={(open) => {
          if (!open) {
                setShowCreateAnnouncement(false);
              setEditingAnnouncement(null);
              setAnnouncementForm({ title: "", content: "", type: "promotion", isActive: true });
            }
            }}>
            <DialogContent className="bg-cmc-card border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-cmc-gray">Title</Label>
                <Input
                  id="title"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                  className="bg-cmc-dark border-gray-600 text-white mt-1"
                  placeholder="Enter announcement title..."
                  data-testid="input-announcement-title"
                />
              </div>
              <div>
                <Label htmlFor="content" className="text-cmc-gray">Content</Label>
                <Textarea
                  id="content"
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                  className="bg-cmc-dark border-gray-600 text-white mt-1 min-h-[120px]"
                  placeholder="Enter announcement content..."
                  data-testid="textarea-announcement-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type" className="text-cmc-gray">Type</Label>
                  <Select value={announcementForm.type} onValueChange={(value) => setAnnouncementForm({...announcementForm, type: value})}>
                    <SelectTrigger className="bg-cmc-dark border-gray-600 text-white mt-1" data-testid="select-announcement-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Switch
                    checked={announcementForm.isActive}
                    onCheckedChange={(checked) => setAnnouncementForm({...announcementForm, isActive: checked})}
                    data-testid="switch-announcement-active"
                  />
                  <Label className="text-cmc-gray">Active</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateAnnouncement(false);
                    setEditingAnnouncement(null);
                    setAnnouncementForm({ title: "", content: "", type: "promotion", isActive: true });
                  }}
                  data-testid="button-cancel-announcement"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (editingAnnouncement) {
                      updateAnnouncementMutation.mutate({ 
                        id: editingAnnouncement.id, 
                        data: announcementForm 
                      });
                    } else {
                      createAnnouncementMutation.mutate(announcementForm);
                    }
                  }}
                  disabled={!announcementForm.title.trim() || !announcementForm.content.trim() || 
                           createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-save-announcement"
                >
                  {editingAnnouncement ? 'Update' : 'Create'} Announcement
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <AdminSupportTickets />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
