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
import { useToast } from "@/hooks/use-toast";
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, User, Headphones } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(['technical', 'payment', 'account', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

const addMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

type CreateTicketData = z.infer<typeof createTicketSchema>;
type AddMessageData = z.infer<typeof addMessageSchema>;

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
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

export default function SupportTicket() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const { toast } = useToast();

  // Fetch user's support tickets
  const { data: tickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
  });

  // Fetch messages for selected ticket
  const { data: messages = [] } = useQuery<TicketMessage[]>({
    queryKey: ['/api/support-tickets', selectedTicket?.id, 'messages'],
    enabled: !!selectedTicket,
  });

  // Create ticket form
  const createForm = useForm<CreateTicketData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      description: "",
      category: "general",
      priority: "medium",
    },
  });

  // Add message form
  const messageForm = useForm<AddMessageData>({
    resolver: zodResolver(addMessageSchema),
    defaultValues: {
      message: "",
    },
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: (data: CreateTicketData) => apiRequest('POST', '/api/support-tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Support ticket created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: (data: AddMessageData) => apiRequest('POST', `/api/support-tickets/${selectedTicket?.id}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets', selectedTicket?.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
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

  const onCreateTicket = createForm.handleSubmit((data) => {
    createTicketMutation.mutate(data);
  });

  const onAddMessage = messageForm.handleSubmit((data) => {
    addMessageMutation.mutate(data);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Loading support tickets...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Headphones className="w-8 h-8 text-cmc-blue" />
          <div>
            <h2 className="text-2xl font-bold text-white" data-testid="text-support-title">Support Center</h2>
            <p className="text-cmc-gray" data-testid="text-support-description">Get help with your account and mining operations</p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cmc-blue hover:bg-blue-600" data-testid="button-create-ticket">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-cmc-card border-gray-700 max-w-2xl" data-testid="modal-create-ticket">
            <DialogHeader>
              <DialogTitle className="text-white text-xl" data-testid="text-modal-title">Create Support Ticket</DialogTitle>
              <DialogDescription className="text-cmc-gray">
                Describe your issue and we'll help you resolve it quickly.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...createForm}>
              <form onSubmit={onCreateTicket} className="space-y-6">
                <FormField
                  control={createForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Subject</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Brief description of your issue"
                          className="bg-cmc-dark border-gray-600 text-white"
                          data-testid="input-ticket-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-cmc-dark border-gray-600 text-white" data-testid="select-ticket-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-cmc-dark border-gray-600">
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="payment">Payment & Mining</SelectItem>
                            <SelectItem value="account">Account Settings</SelectItem>
                            <SelectItem value="general">General Inquiry</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={createForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please describe your issue in detail..."
                          className="bg-cmc-dark border-gray-600 text-white min-h-[120px]"
                          data-testid="textarea-ticket-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="border-gray-600 text-white hover:bg-gray-700"
                    data-testid="button-cancel-ticket"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="bg-cmc-blue hover:bg-blue-600"
                    data-testid="button-submit-ticket"
                  >
                    {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {tickets.length === 0 ? (
        <Card className="bg-cmc-card border-gray-700" data-testid="card-no-tickets">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Headphones className="w-16 h-16 text-cmc-gray mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Support Tickets</h3>
            <p className="text-cmc-gray text-center mb-6">
              You haven't created any support tickets yet. Need help? Create your first ticket!
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-cmc-blue hover:bg-blue-600"
              data-testid="button-first-ticket"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tickets List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white" data-testid="text-tickets-list">Your Support Tickets</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`bg-cmc-card border-gray-700 cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id ? 'ring-2 ring-cmc-blue' : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                  data-testid={`card-ticket-${ticket.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-white truncate pr-2" data-testid={`text-ticket-subject-${ticket.id}`}>
                        {ticket.subject}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={priorityColors[ticket.priority]} data-testid={`badge-priority-${ticket.id}`}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]} data-testid={`badge-status-${ticket.id}`}>
                          {statusIcons[ticket.status]}
                          <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                    <p className="text-cmc-gray text-sm mb-3 line-clamp-2" data-testid={`text-ticket-description-${ticket.id}`}>
                      {ticket.description}
                    </p>
                    <div className="flex justify-between items-center text-xs text-cmc-gray">
                      <span data-testid={`text-ticket-category-${ticket.id}`}>
                        {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                      </span>
                      <span data-testid={`text-ticket-time-${ticket.id}`}>
                        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Ticket Messages */}
          <div>
            {selectedTicket ? (
              <Card className="bg-cmc-card border-gray-700 h-[600px] flex flex-col" data-testid="card-ticket-messages">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white text-lg" data-testid="text-selected-ticket-subject">
                        {selectedTicket.subject}
                      </CardTitle>
                      <CardDescription className="text-cmc-gray">
                        Ticket #{selectedTicket.id} • {selectedTicket.category}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={priorityColors[selectedTicket.priority]}>
                        {selectedTicket.priority}
                      </Badge>
                      <Badge className={statusColors[selectedTicket.status]}>
                        {statusIcons[selectedTicket.status]}
                        <span className="ml-1 capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
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
                            <span className="text-sm font-medium text-white">You</span>
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
                                {message.isFromAdmin ? 'Support Team' : 'You'}
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
                  {selectedTicket.status !== 'closed' && (
                    <>
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
                                      placeholder="Type your reply..."
                                      className="bg-cmc-dark border-gray-600 text-white resize-none"
                                      rows={2}
                                      data-testid="textarea-ticket-reply"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="submit"
                              disabled={addMessageMutation.isPending}
                              className="bg-cmc-blue hover:bg-blue-600 self-end"
                              data-testid="button-send-reply"
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              {addMessageMutation.isPending ? "Sending..." : "Send"}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-cmc-card border-gray-700 h-[600px] flex items-center justify-center" data-testid="card-select-ticket">
                <CardContent className="text-center">
                  <MessageSquare className="w-16 h-16 text-cmc-gray mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Ticket</h3>
                  <p className="text-cmc-gray">Choose a ticket from the list to view the conversation</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}