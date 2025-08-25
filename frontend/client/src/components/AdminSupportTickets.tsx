import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Clock, CheckCircle, AlertCircle, User, Headphones, RefreshCw, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const addMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

type AddMessageData = z.infer<typeof addMessageSchema>;
type UpdateTicketData = z.infer<typeof updateTicketSchema>;

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  userId: number;
  assignedTo?: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface TicketMessage {
  id: number;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
  userId: number;
}

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusColors = {
  open: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  resolved: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
};

const statusIcons = {
  open: <AlertCircle className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
  closed: <CheckCircle className="w-4 h-4" />,
};

export default function AdminSupportTickets() {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const { toast } = useToast();

  // Fetch all support tickets
  const { data: allTickets = [], isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ['/api/admin/support-tickets'],
  });

  // Filter tickets based on status and priority
  const filteredTickets = allTickets.filter(ticket => {
    const statusMatch = statusFilter === 'all' || ticket.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery<TicketMessage[]>({
    queryKey: ['/api/support-tickets', selectedTicket?.id, 'messages'],
    enabled: !!selectedTicket,
  });

  // Add message form
  const messageForm = useForm<AddMessageData>({
    resolver: zodResolver(addMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Update ticket form
  const updateForm = useForm<UpdateTicketData>({
    resolver: zodResolver(updateTicketSchema),
    defaultValues: {
      status: undefined,
      priority: undefined,
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: (data: AddMessageData) => apiRequest('POST', `/api/support-tickets/${selectedTicket?.id}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets', selectedTicket?.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      messageForm.reset();
      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: (data: UpdateTicketData) => apiRequest('PATCH', `/api/admin/support-tickets/${selectedTicket?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-tickets'] });
      toast({
        title: "Success",
        description: "Ticket updated successfully!",
      });
      // Update selected ticket with new data
      setSelectedTicket(prev => prev ? { ...prev, ...updateForm.getValues() } : null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  const onAddMessage = messageForm.handleSubmit((data) => {
    addMessageMutation.mutate(data);
  });

  const onUpdateTicket = updateForm.handleSubmit((data) => {
    if (Object.values(data).some(value => value !== undefined)) {
      updateTicketMutation.mutate(data);
    }
  });

  // Get ticket counts by status
  const ticketCounts = {
    all: allTickets.length,
    open: allTickets.filter(t => t.status === 'open').length,
    in_progress: allTickets.filter(t => t.status === 'in_progress').length,
    resolved: allTickets.filter(t => t.status === 'resolved').length,
    closed: allTickets.filter(t => t.status === 'closed').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-cmc-blue mx-auto mb-4" />
          <div className="text-white text-lg">Loading support tickets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Headphones className="w-8 h-8 text-cmc-blue" />
          <div>
            <h2 className="text-2xl font-bold text-white" data-testid="text-admin-support-title">Support Ticket Management</h2>
            <p className="text-cmc-gray" data-testid="text-admin-support-description">Manage customer support tickets and respond to user inquiries</p>
          </div>
        </div>
        
        <Button onClick={() => refetch()} className="bg-cmc-blue hover:bg-blue-600" data-testid="button-refresh-tickets">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Ticket Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-cmc-card border-gray-700" data-testid="card-stats-all">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{ticketCounts.all}</div>
            <div className="text-sm text-cmc-gray">Total Tickets</div>
          </CardContent>
        </Card>
        <Card className="bg-cmc-card border-gray-700" data-testid="card-stats-open">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{ticketCounts.open}</div>
            <div className="text-sm text-cmc-gray">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-cmc-card border-gray-700" data-testid="card-stats-progress">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{ticketCounts.in_progress}</div>
            <div className="text-sm text-cmc-gray">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-cmc-card border-gray-700" data-testid="card-stats-resolved">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{ticketCounts.resolved}</div>
            <div className="text-sm text-cmc-gray">Resolved</div>
          </CardContent>
        </Card>
        <Card className="bg-cmc-card border-gray-700" data-testid="card-stats-closed">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{ticketCounts.closed}</div>
            <div className="text-sm text-cmc-gray">Closed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-cmc-card border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="text-sm text-cmc-gray mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-cmc-dark border-gray-600 text-white" data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-cmc-dark border-gray-600">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-cmc-gray mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-cmc-dark border-gray-600 text-white" data-testid="select-filter-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-cmc-dark border-gray-600">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredTickets.length === 0 ? (
        <Card className="bg-cmc-card border-gray-700" data-testid="card-no-filtered-tickets">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Headphones className="w-16 h-16 text-cmc-gray mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
            <p className="text-cmc-gray text-center">
              No support tickets match the current filters. Try adjusting the filters or check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white" data-testid="text-tickets-list">
              Support Tickets ({filteredTickets.length})
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredTickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`bg-cmc-card border-gray-700 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-cmc-blue' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                  data-testid={`card-admin-ticket-${ticket.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <h4 className="font-semibold text-white truncate" data-testid={`text-admin-ticket-subject-${ticket.id}`}>
                          #{ticket.id} - {ticket.subject}
                        </h4>
                        <p className="text-xs text-cmc-gray">User ID: {ticket.userId}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={priorityColors[ticket.priority]} data-testid={`badge-admin-priority-${ticket.id}`}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]} data-testid={`badge-admin-status-${ticket.id}`}>
                          {statusIcons[ticket.status]}
                          <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                    <p className="text-cmc-gray text-sm mb-3 line-clamp-2" data-testid={`text-admin-ticket-description-${ticket.id}`}>
                      {ticket.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-cmc-gray">
                      <span data-testid={`text-admin-ticket-category-${ticket.id}`}>
                        {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                      </span>
                      <span data-testid={`text-admin-ticket-time-${ticket.id}`}>
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ticket Details */}
          <div>
            {selectedTicket ? (
              <div className="space-y-4">
                {/* Ticket Actions */}
                <Card className="bg-cmc-card border-gray-700" data-testid="card-ticket-actions">
                  <CardHeader>
                    <CardTitle className="text-white text-lg" data-testid="text-selected-admin-ticket-subject">
                      #{selectedTicket.id} - {selectedTicket.subject}
                    </CardTitle>
                    <CardDescription className="text-cmc-gray">
                      User ID: {selectedTicket.userId} • {selectedTicket.category} • Created {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...updateForm}>
                      <form onSubmit={onUpdateTicket} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={updateForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={selectedTicket.status}>
                                  <FormControl>
                                    <SelectTrigger className="bg-cmc-dark border-gray-600 text-white" data-testid="select-ticket-status">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-cmc-dark border-gray-600">
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={updateForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={selectedTicket.priority}>
                                  <FormControl>
                                    <SelectTrigger className="bg-cmc-dark border-gray-600 text-white" data-testid="select-ticket-priority">
                                      <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-cmc-dark border-gray-600">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          disabled={updateTicketMutation.isPending}
                          className="bg-cmc-blue hover:bg-blue-600"
                          data-testid="button-update-ticket"
                        >
                          {updateTicketMutation.isPending ? "Updating..." : "Update Ticket"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {/* Ticket Messages */}
                <Card className="bg-cmc-card border-gray-700 h-[400px] flex flex-col" data-testid="card-admin-ticket-messages">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-lg">Conversation</CardTitle>
                  </CardHeader>
                  
                  <Separator className="bg-gray-700" />
                  
                  <CardContent className="flex-1 flex flex-col p-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {/* Initial ticket message */}
                        <div className="flex items-start space-x-3">
                          <div className="bg-cmc-blue rounded-full p-2 mt-1">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 bg-gray-800 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-white">User #{selectedTicket.userId}</span>
                              <span className="text-xs text-cmc-gray">
                                {formatDistanceToNow(new Date(selectedTicket.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-cmc-gray text-sm whitespace-pre-wrap">
                              {selectedTicket.description}
                            </p>
                          </div>
                        </div>
                        
                        {/* Messages */}
                        {messages.map((message) => (
                          <div key={message.id} className="flex items-start space-x-3">
                            <div className={`rounded-full p-2 mt-1 ${
                              message.isFromAdmin ? 'bg-green-600' : 'bg-cmc-blue'
                            }`}>
                              {message.isFromAdmin ? (
                                <Headphones className="w-4 h-4 text-white" />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                            <div className="flex-1 bg-gray-800 rounded-lg p-3">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-white">
                                  {message.isFromAdmin ? 'Support Team' : `User #${message.userId}`}
                                </span>
                                <span className="text-xs text-cmc-gray">
                                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-cmc-gray text-sm whitespace-pre-wrap">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {/* Reply form */}
                    <Separator className="bg-gray-700" />
                    <div className="p-4">
                      <Form {...messageForm}>
                        <form onSubmit={onAddMessage} className="flex space-x-3">
                          <FormField
                            control={messageForm.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Type your admin response..."
                                    className="bg-cmc-dark border-gray-600 text-white resize-none"
                                    rows={2}
                                    data-testid="textarea-admin-reply"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            disabled={addMessageMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 self-end"
                            data-testid="button-send-admin-reply"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {addMessageMutation.isPending ? "Sending..." : "Reply"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-cmc-card border-gray-700 h-[600px] flex items-center justify-center" data-testid="card-select-admin-ticket">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 text-cmc-gray mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Ticket</h3>
                  <p className="text-cmc-gray">Choose a ticket from the list to manage and respond</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}