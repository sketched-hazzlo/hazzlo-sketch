import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Send, 
  Check, 
  CheckCheck,
  Search,
  ArrowLeft,
  MoreVertical,
  Flag,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  fileUrl?: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  clientId: string;
  professionalId: string;
  isActive: boolean;
  lastMessageAt: string;
  createdAt: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
  professional?: {
    id: string;
    businessName: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  };
}

interface ChatWebSocketProps {
  recipientId?: string;
  recipientName?: string;
  showSidebar?: boolean; // Controls if sidebar is shown (professionals see it, clients don't)
  conversationId?: string; // Optional conversation ID to load directly
}

export default function ChatWebSocket({ recipientId, recipientName, showSidebar, conversationId }: ChatWebSocketProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationId || null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Determine if sidebar should be shown based on user type and props
  const shouldShowSidebar = showSidebar !== false && (user as any)?.userType === 'professional' && !isMobile;

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => fetch('/api/conversations').then(r => r.json()),
    enabled: !!user && shouldShowSidebar,
    refetchInterval: shouldShowSidebar ? 5000 : false, // Poll every 5 seconds for professionals
  });

  // Fetch initial messages for selected conversation
  const { data: initialMessages = [] } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${selectedConversation}/messages`);
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    },
    enabled: !!selectedConversation,
    refetchInterval: 3000, // Poll every 3 seconds to ensure messages are updated
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-chat`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      // Join WebSocket with user ID
      ws.send(JSON.stringify({
        type: 'join',
        userId: user.id
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          // Add new message to current conversation if it matches
          if (data.conversationId === selectedConversation) {
            setMessages(prev => [...prev, data.message]);
          }
          
          // Always refresh conversations list to update last message
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          // Refresh notifications to show the new message notification
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          
          // Also refresh messages for the current conversation to ensure sync
          if (data.conversationId === selectedConversation) {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/conversations', selectedConversation, 'messages'] 
            });
          }
          
          // Show toast notification if not in current conversation
          if (data.conversationId !== selectedConversation) {
            toast({
              title: "Nuevo mensaje",
              description: "Has recibido un nuevo mensaje",
            });
          }
        } else if (data.type === 'new_notification') {
          // Handle new notification from WebSocket
          console.log('[WebSocket] New notification received:', data.notification);
          
          // Refresh notifications to update the count and list
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          
          // Show toast notification
          if (data.notification) {
            toast({
              title: data.notification.title || "Nueva notificación",
              description: data.notification.message || "Tienes una nueva notificación",
            });
          }
        } else if (data.type === 'message_sent') {
          // Message was sent successfully - add to current view
          if (data.conversationId === selectedConversation) {
            setMessages(prev => [...prev, data.message]);
          }
          
          // Refresh conversations list and current messages
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation, 'messages'] 
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user, selectedConversation, queryClient, toast]);

  // Initialize messages when conversation is selected
  useEffect(() => {
    setMessages(Array.isArray(initialMessages) ? initialMessages : []);
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive (only scroll the messages container)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end",
        inline: "nearest" 
      });
    }
  }, [messages]);

  // Auto-start conversation if recipientId is provided and it's a client
  useEffect(() => {
    if (recipientId && (user as any)?.userType === 'client' && !selectedConversation) {
      console.log('Creating conversation with professional:', recipientId);
      // Create conversation with professional
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for session auth
        body: JSON.stringify({ professionalId: recipientId }),
      })
      .then(async r => {
        if (!r.ok) {
          const error = await r.text();
          throw new Error(`HTTP ${r.status}: ${error}`);
        }
        return r.json();
      })
      .then(conversation => {
        console.log('Conversation created:', conversation);
        setSelectedConversation(conversation.id);
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      })
      .catch(error => {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo iniciar la conversación. Por favor, inicia sesión e intenta de nuevo.",
          variant: "destructive",
        });
      });
    }
  }, [recipientId, user, selectedConversation, queryClient, toast]);

  // Force conversation for client direct links even if selectedConversation exists
  useEffect(() => {
    if (recipientId && (user as any)?.userType === 'client' && !shouldShowSidebar) {
      // For direct client links, ensure we always have a conversation selected
      const findOrCreateConversation = async () => {
        try {
          const response = await fetch('/api/conversations');
          const conversations = await response.json();
          
          const existingConv = conversations.find((conv: Conversation) => 
            conv.professionalId === recipientId && conv.clientId === user?.id
          );
          
          if (existingConv && existingConv.id !== selectedConversation) {
            console.log('Setting existing conversation for client:', existingConv.id);
            setSelectedConversation(existingConv.id);
          }
        } catch (error) {
          console.error('Error finding conversation for client:', error);
        }
      };
      
      findOrCreateConversation();
    }
  }, [recipientId, user, shouldShowSidebar, selectedConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !wsConnected) return;

    // Send message via WebSocket for real-time delivery
    wsRef.current?.send(JSON.stringify({
      type: 'chat_message',
      conversationId: selectedConversation,
      content: newMessage.trim(),
      senderId: user?.id
    }));

    setNewMessage("");
  };

  const handleReportConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Conversación reportada",
          description: "Hemos recibido tu reporte. Revisaremos la conversación.",
        });
      } else {
        throw new Error('Error al reportar');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reportar la conversación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Conversación eliminada",
          description: "La conversación ha sido eliminada exitosamente.",
        });
        
        // Clear selected conversation if it was the deleted one
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
        }
        
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la conversación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const getConversationParticipant = (conversation: Conversation) => {
    if (!user) return null;
    
    if ((user as any).userType === 'client') {
      return {
        name: conversation.professional?.businessName || 'Profesional',
        image: conversation.professional?.user.profileImageUrl,
        firstName: conversation.professional?.user.firstName || 'P',
      };
    } else {
      return {
        name: `${conversation.client?.firstName} ${conversation.client?.lastName}` || 'Cliente',
        image: conversation.client?.profileImageUrl,
        firstName: conversation.client?.firstName || 'C',
      };
    }
  };

  const filteredConversations = conversations.filter((conversation: Conversation) => {
    const participant = getConversationParticipant(conversation);
    return participant && participant.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!user) {
    return (
      <div className="p-6 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Inicia sesión para acceder al chat</p>
      </div>
    );
  }

  // Mobile chat behavior: Show conversations list or selected conversation
  const showMobileConversationsList = isMobile && (user as any)?.userType === 'professional' && (!selectedConversation || showConversationsList);

  return (
    <div className={cn(
      "flex border rounded-lg overflow-hidden bg-background",
      shouldShowSidebar ? "border rounded-lg h-[600px]" : "flex-col h-[600px]",
      isMobile ? "w-full chat-container-mobile" : ""
    )}>
      {/* Connection status */}
      {!wsConnected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded-lg text-sm shadow-sm">
            Reconectando...
          </div>
        </div>
      )}

      {/* Mobile Conversations List - Shows when no conversation is selected or back button is pressed */}
      {showMobileConversationsList && !(selectedConversation && !showConversationsList) && (
        <div className="flex-1 flex flex-col">
          {/* Search header */}
          <div className="p-4 border-b bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {conversations.length === 0 ? "No tienes conversaciones" : "No se encontraron conversaciones"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation: Conversation) => {
                    const participant = getConversationParticipant(conversation);
                    if (!participant) return null;

                    return (
                      <div
                        key={conversation.id}
                        className="p-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => {
                              setSelectedConversation(conversation.id);
                              setShowConversationsList(false);
                            }}
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={participant.image} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {participant.firstName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-foreground truncate">{participant.name}</h3>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(conversation.lastMessageAt), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                Toca para chatear
                              </p>
                            </div>
                          </div>

                          {/* Mobile Options menu - always visible on mobile */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportConversation(conversation.id);
                                }}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Reportar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Conversations sidebar - only show for professionals */}
      {shouldShowSidebar && (
        <div className="w-80 border-r bg-muted/20 flex flex-col">
          <div className="p-4 border-b bg-background">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {conversationsLoading ? (
                <div className="p-6 text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {conversations.length === 0 ? "No tienes conversaciones" : "No se encontraron conversaciones"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map((conversation: Conversation) => {
                    const participant = getConversationParticipant(conversation);
                    if (!participant) return null;

                    return (
                      <div
                        key={conversation.id}
                        className={cn(
                          "p-4 hover:bg-muted/30 transition-colors group",
                          selectedConversation === conversation.id && "bg-primary/10 border-r-2 border-primary"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="flex items-center gap-3 flex-1 cursor-pointer"
                            onClick={() => setSelectedConversation(conversation.id)}
                          >
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={participant.image} />
                              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {participant.firstName}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm truncate">{participant.name}</h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.lastMessageAt 
                                  ? formatDistanceToNow(new Date(conversation.lastMessageAt), { 
                                      addSuffix: true, 
                                      locale: es 
                                    })
                                  : "Nueva conversación"
                                }
                              </p>
                            </div>
                          </div>
                          
                          {/* Options menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReportConversation(conversation.id);
                                }}
                                className="text-orange-600 focus:text-orange-600"
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Reportar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteConversation(conversation.id);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Messages area - Modern chat design - Only show if not in mobile conversations list */}
      {!showMobileConversationsList && (
      <div className="flex-1 flex flex-col min-h-0">
        {selectedConversation ? (
          <>
            {/* Chat header - WhatsApp style */}
            <div className="bg-background border-b px-4 py-3 flex-shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                {!shouldShowSidebar && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (isMobile && (user as any)?.userType === 'professional') {
                        setShowConversationsList(true);
                      } else {
                        window.history.back();
                      }
                    }}
                    className="rounded-full"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {recipientName ? recipientName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{recipientName || 'Chat'}</h3>
                  <p className="text-xs text-muted-foreground">
                    {wsConnected ? (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        En línea
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        Desconectado
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages area - Perfect scrolling like mobile */}
            <div className="flex-1 overflow-hidden bg-muted/10">
              <div className="h-full overflow-y-auto">
                <div className="p-4 space-y-3 min-h-full flex flex-col justify-end">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center">
                      <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        No hay mensajes aún. ¡Inicia la conversación!
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message: Message) => {
                        const isOwnMessage = message.senderId === user.id;
                        
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex gap-2 max-w-[75%]",
                              isOwnMessage ? "ml-auto flex-row-reverse" : "mr-auto"
                            )}
                          >
                            {!isOwnMessage && (
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarFallback className="text-xs bg-muted">
                                  {recipientName ? recipientName.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div
                              className={cn(
                                "rounded-2xl px-4 py-2 text-sm shadow-sm",
                                isOwnMessage
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-background border rounded-bl-md"
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                              <div className={cn(
                                "flex items-center gap-1 mt-1 text-xs",
                                isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                              )}>
                                <span>
                                  {formatDistanceToNow(new Date(message.createdAt), { 
                                    addSuffix: true, 
                                    locale: es 
                                  })}
                                </span>
                                {isOwnMessage && (
                                  <div className="ml-1">
                                    {message.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-blue-400" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Message input - Modern design */}
            <div className="bg-background border-t px-4 py-3 flex-shrink-0">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={!wsConnected}
                    className={cn(
                      "pr-12 rounded-full border-muted bg-muted/50 focus:bg-background transition-colors",
                      isMobile ? "text-base chat-input-mobile" : ""
                    )}
                    style={isMobile ? { fontSize: '16px' } : {}}
                  />
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !wsConnected}
                  size="sm"
                  className="rounded-full h-10 w-10 p-0 flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center bg-muted/10">
            <div className="max-w-sm px-6">
              <MessageCircle className="h-20 w-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="font-semibold text-xl mb-3 text-foreground">
                {shouldShowSidebar ? "Selecciona una conversación" : "Chat"}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {shouldShowSidebar 
                  ? "Elige una conversación de la lista para comenzar a chatear con tus clientes"
                  : recipientId ? "Iniciando conversación..." : "Cargando chat..."
                }
              </p>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}