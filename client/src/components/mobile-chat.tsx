import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Send, ArrowLeft, MoreVertical, AlertTriangle, Flag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  clientId: string;
  professionalId: string;
  lastMessageAt: string;
  professional?: {
    id: string;
    businessName: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
  };
}

interface MobileChatProps {
  recipientId?: string;
  recipientName?: string;
  conversationId?: string;
}

export default function MobileChat({ recipientId, recipientName, conversationId }: MobileChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationId || null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Report conversation mutation
  const reportConversationMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation) throw new Error('No hay conversación seleccionada');
      return await apiRequest(`/api/conversations/${selectedConversation}/report`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({
        title: "Conversación reportada",
        description: "El reporte ha sido enviado exitosamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al reportar conversación",
        variant: "destructive"
      });
    }
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
    refetchInterval: 3000,
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws-chat`;
    console.log('[Mobile Chat] Attempting WebSocket connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Mobile Chat] WebSocket connected successfully');
      setWsConnected(true);
      ws.send(JSON.stringify({
        type: 'join',
        userId: user.id
      }));
      console.log('[Mobile Chat] Sent join message for user:', user.id);
    };

    ws.onerror = (error) => {
      console.error('[Mobile Chat] WebSocket connection error:', error);
      setWsConnected(false);
    };

    ws.onclose = (event) => {
      console.log('[Mobile Chat] WebSocket connection closed:', event.code, event.reason);
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message') {
          if (data.conversationId === selectedConversation) {
            setMessages(prev => [...prev, data.message]);
          }
          
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          
          if (data.conversationId === selectedConversation) {
            queryClient.invalidateQueries({ 
              queryKey: ['/api/conversations', selectedConversation, 'messages'] 
            });
          }
        } else if (data.type === 'message_sent') {
          if (data.conversationId === selectedConversation) {
            setMessages(prev => [...prev, data.message]);
          }
          
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation, 'messages'] 
          });
        } else if (data.type === 'new_notification') {
          // Refresh notifications when new notification arrives via WebSocket
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          console.log('[Mobile Chat] Received new notification via WebSocket');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('[Mobile Chat] WebSocket disconnected');
      setWsConnected(false);
    };
    ws.onerror = (error) => {
      console.error('[Mobile Chat] WebSocket error:', error);
      setWsConnected(false);
    };

    return () => ws.close();
  }, [user, selectedConversation, queryClient]);

  // Initialize messages when conversation is selected
  useEffect(() => {
    setMessages(Array.isArray(initialMessages) ? initialMessages : []);
  }, [initialMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-start conversation if recipientId is provided and it's a client
  useEffect(() => {
    if (recipientId && (user as any)?.userType === 'client' && !selectedConversation) {
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        setSelectedConversation(conversation.id);
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      })
      .catch(error => {
        console.error('Error creating conversation:', error);
        toast({
          title: "Error",
          description: "No se pudo iniciar la conversación",
          variant: "destructive",
        });
      });
    }
  }, [recipientId, user, selectedConversation, queryClient, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    inputRef.current?.focus();

    // Try WebSocket first for real-time messaging, fallback to REST API
    if (wsConnected && wsRef.current) {
      console.log('[Mobile Chat] Sending via WebSocket:', messageContent);
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        conversationId: selectedConversation,
        content: messageContent,
        senderId: user?.id
      }));
    } else {
      // Fallback to REST API
      console.log('[Mobile Chat] Using REST API for reliable notifications');
      console.log('[Mobile Chat] Sending to:', `/api/conversations/${selectedConversation}/messages`);
      console.log('[Mobile Chat] Message content:', messageContent);
      try {
        const response = await fetch(`/api/conversations/${selectedConversation}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: messageContent }),
        });
        console.log('[Mobile Chat] Response status:', response.status, response.statusText);

        if (response.ok) {
          const newMsg = await response.json();
          setMessages(prev => [...prev, newMsg]);
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          queryClient.invalidateQueries({ 
            queryKey: ['/api/conversations', selectedConversation, 'messages'] 
          });
          // Force refresh notifications to see the new notification immediately
          queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
          console.log('[Mobile Chat] Message sent successfully via REST API');
        } else {
          console.error('[Mobile Chat] REST API response not ok:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error sending message via REST:', error);
        toast({
          title: "Error",
          description: "No se pudo enviar el mensaje",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Inicia sesión para acceder al chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden fixed inset-0">
      {/* Mobile Chat Header - Fixed at top */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary border-b shadow-sm flex-shrink-0 relative z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => window.history.back()}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-sm">
              {recipientName ? recipientName.charAt(0).toUpperCase() : 'P'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-primary-foreground text-sm truncate">
              {recipientName || 'Profesional'}
            </h3>
            <p className="text-primary-foreground/70 text-xs">
              {wsConnected ? 'En línea' : 'Desconectado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => reportConversationMutation.mutate()}
                disabled={!selectedConversation || reportConversationMutation.isPending}
              >
                <Flag className="mr-2 h-4 w-4" />
                {reportConversationMutation.isPending ? 'Reportando...' : 'Reportar usuario'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Cerrar conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area - Scrollable middle section */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 relative">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="bg-white rounded-full p-6 mb-4 shadow-sm">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {recipientName ? recipientName.charAt(0).toUpperCase() : 'P'}
                </AvatarFallback>
              </Avatar>
            </div>
            <h3 className="font-medium text-lg text-gray-900 mb-2">
              Conversación con {recipientName || 'Profesional'}
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Este es el inicio de tu conversación. Puedes hacer preguntas sobre servicios, precios o agendar una cita.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    isOwnMessage ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-white text-gray-900 rounded-bl-md"
                    )}
                  >
                    <p className="text-sm leading-relaxed break-words">
                      {message.content}
                    </p>
                    <div className={cn(
                      "flex items-center justify-end gap-1 mt-1",
                      isOwnMessage ? "text-primary-foreground/70" : "text-gray-400"
                    )}>
                      <span className="text-xs">
                        {formatDistanceToNow(new Date(message.createdAt), { 
                          addSuffix: false, 
                          locale: es 
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="px-3 py-3 bg-white border-t flex-shrink-0 relative z-20">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              onKeyPress={handleKeyPress}
              disabled={!wsConnected}
              className="pr-12 py-3 text-base border-gray-200 rounded-full bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !wsConnected}
            size="icon"
            className="h-11 w-11 rounded-full shadow-sm"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}