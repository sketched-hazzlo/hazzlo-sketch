import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Clock, 
  Check, 
  CheckCheck,
  Search,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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

interface ChatSystemProps {
  recipientId?: string;
  recipientName?: string;
  onStartConversation?: (conversationId: string) => void;
}

export default function ChatSystem({ recipientId, recipientName, onStartConversation }: ChatSystemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: () => fetch('/api/conversations').then(r => r.json()),
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    queryFn: () => fetch(`/api/conversations/${selectedConversation}/messages`).then(r => r.json()),
    enabled: !!selectedConversation,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      const response = await apiRequest('POST', '/api/conversations', { professionalId });
      return response.json();
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setSelectedConversation(conversation.id);
      if (onStartConversation) {
        onStartConversation(conversation.id);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo iniciar la conversación",
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      const response = await apiRequest('POST', `/api/conversations/${conversationId}/messages`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-start conversation if recipientId is provided
  useEffect(() => {
    if (recipientId && !selectedConversation && conversations.length === 0) {
      createConversationMutation.mutate(recipientId);
    }
  }, [recipientId, selectedConversation, conversations.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage.trim(),
    });
  };

  const getConversationParticipant = (conversation: Conversation) => {
    if (!user) return null;
    
    if (user.userType === 'client') {
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
      <Card>
        <CardContent className="p-6 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Inicia sesión para acceder al chat</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-[600px] flex border rounded-lg overflow-hidden">
      {/* Conversations sidebar */}
      <div className="w-1/3 border-r bg-muted/30">
        <div className="p-4 border-b">
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

        <ScrollArea className="h-[calc(600px-80px)]">
          {conversationsLoading ? (
            <div className="p-4 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {conversations.length === 0 ? "No tienes conversaciones" : "No se encontraron conversaciones"}
              </p>
              {recipientId && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => createConversationMutation.mutate(recipientId)}
                  disabled={createConversationMutation.isPending}
                >
                  {createConversationMutation.isPending ? "Iniciando..." : "Iniciar chat"}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation: Conversation) => {
                const participant = getConversationParticipant(conversation);
                if (!participant) return null;

                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      selectedConversation === conversation.id && "bg-muted/70"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={participant.image} />
                        <AvatarFallback>{participant.firstName}</AvatarFallback>
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
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Messages area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b bg-muted/20">
              {(() => {
                const conversation = conversations.find((c: Conversation) => c.id === selectedConversation);
                const participant = conversation ? getConversationParticipant(conversation) : null;
                
                return participant ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.image} />
                      <AvatarFallback>{participant.firstName}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{participant.name}</h3>
                      <p className="text-xs text-muted-foreground">En línea</p>
                    </div>
                  </div>
                ) : (
                  <p>Cargando...</p>
                );
              })()}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <MessageCircle className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay mensajes. ¡Inicia la conversación!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: Message) => {
                    const isOwnMessage = message.senderId === user.id;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 max-w-[70%]",
                          isOwnMessage ? "ml-auto" : "mr-auto"
                        )}
                      >
                        {!isOwnMessage && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="text-xs">U</AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={cn(
                            "rounded-lg px-3 py-2 text-sm",
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p>{message.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs",
                            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            <span>
                              {formatDistanceToNow(new Date(message.createdAt), { 
                                addSuffix: true, 
                                locale: es 
                              })}
                            </span>
                            {isOwnMessage && (
                              <>
                                {message.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 border-t bg-muted/20">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">Selecciona una conversación</h3>
              <p className="text-muted-foreground max-w-sm">
                Elige una conversación de la lista para comenzar a chatear
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}