import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MobileChat from "@/components/mobile-chat";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  ArrowLeft, 
  Send, 
  MoreVertical,
  Flag,
  Trash2,
  Check,
  CheckCheck
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Types for the desktop chat
interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  messageType: string;
  sender?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default function Chat() {
  const { user, isLoading } = useAuth();
  const search = useSearch();
  const professionalId = new URLSearchParams(search).get("professional");
  const conversationId = new URLSearchParams(search).get("conversation");
  const [professionalName, setProfessionalName] = useState("");
  const [currentConversation, setCurrentConversation] = useState<string | null>(conversationId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [wsConnected, setWsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch messages for current conversation
  const { data: initialMessages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/conversations', currentConversation, 'messages'],
    enabled: !!currentConversation,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/auth";
      return;
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (professionalId) {
      fetch(`/api/professionals/${professionalId}`)
        .then(r => r.json())
        .then(data => setProfessionalName(data.businessName))
        .catch(console.error);
    }
  }, [professionalId]);

  // Create conversation if needed
  useEffect(() => {
    if (professionalId && (user as any)?.userType === 'client' && !currentConversation) {
      fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ professionalId }),
      })
      .then(r => r.json())
      .then(conversation => {
        setCurrentConversation(conversation.id);
      })
      .catch(error => {
        console.error('Error creating conversation:', error);
      });
    }
  }, [professionalId, user, currentConversation]);

  // WebSocket connection for real-time messages
  useEffect(() => {
    if (!user || !currentConversation) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws-chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: 'join', userId: user.id }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'new_message' && data.conversationId === currentConversation) {
          setMessages(prev => [...prev, data.message]);
        } else if (data.type === 'message_sent' && data.conversationId === currentConversation) {
          setMessages(prev => [...prev, data.message]);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => setWsConnected(false);
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    return () => ws.close();
  }, [user, currentConversation]);

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

  // Handle sending messages
  const sendMessage = async () => {
    if (!newMessage.trim() || !currentConversation || !wsRef.current) return;

    const messageData = {
      type: 'chat_message',
      conversationId: currentConversation,
      content: newMessage.trim(),
      senderId: user?.id
    };

    wsRef.current.send(JSON.stringify(messageData));
    setNewMessage("");
  };

  // Handle report conversation
  const handleReportConversation = async () => {
    if (!currentConversation) return;
    
    try {
      const response = await fetch(`/api/conversations/${currentConversation}/report`, {
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

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!currentConversation) return;
    
    try {
      const response = await fetch(`/api/conversations/${currentConversation}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: "Conversación eliminada",
          description: "La conversación ha sido eliminada exitosamente.",
        });
        
        // Redirect to home or show empty state
        window.location.href = "/";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Use mobile chat for mobile devices
  if (isMobile) {
    return (
      <MobileChat 
        recipientId={professionalId || undefined}
        recipientName={professionalName}
        conversationId={conversationId || undefined}
      />
    );
  }

  // Desktop chat experience - Simple elegant layout without sidebar
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col overflow-hidden">
      <Navbar />
      
      {/* Main chat container */}
      <div className="flex-1 flex flex-col overflow-hidden mx-4 mt-20 mb-4" style={{ height: 'calc(100vh - 5rem)' }}>
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {currentConversation ? (
            <>
              {/* Chat header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.history.back()}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-lg">
                          {professionalName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{professionalName}</h3>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">En línea</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Options menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={handleReportConversation}
                          className="text-orange-600 focus:text-orange-600"
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Reportar conversación
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteConversation}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar conversación
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-4">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center p-12">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
                          <MessageCircle className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">¡Inicia la conversación!</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                          Escribe tu primer mensaje a {professionalName} y comienza a chatear.
                        </p>
                      </div>
                    ) : (
                      messages.map((message, index) => {
                        const isOwn = message.senderId === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;
                        
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex items-end space-x-3",
                              isOwn ? "justify-end" : "justify-start"
                            )}
                          >
                            {!isOwn && showAvatar && (
                              <Avatar className="h-8 w-8 mb-1">
                                <AvatarFallback className="bg-gray-300 text-gray-700 text-sm">
                                  {professionalName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            {!isOwn && !showAvatar && <div className="w-8" />}
                            
                            <div className={cn(
                              "max-w-md px-4 py-3 rounded-2xl shadow-sm",
                              isOwn 
                                ? "bg-blue-500 text-white rounded-br-md" 
                                : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-md"
                            )}>
                              <p className="whitespace-pre-wrap break-words">{message.content}</p>
                              <div className={cn(
                                "flex items-center justify-end mt-2 space-x-1",
                                isOwn ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                              )}>
                                <span className="text-xs">
                                  {new Date(message.createdAt).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                                {isOwn && (
                                  message.isRead ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>

              {/* Message input */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="py-3 px-4 bg-gray-50 dark:bg-gray-700 border-0 rounded-full text-base"
                      data-testid="message-input"
                    />
                  </div>
                  <Button 
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !wsConnected}
                    size="lg"
                    className="rounded-full w-12 h-12 p-0 bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                    data-testid="send-button"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                
                {!wsConnected && (
                  <div className="mt-3 text-sm text-amber-600 dark:text-amber-400 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                    <span>Reconectando al chat...</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No conversation */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Bienvenido al chat
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Para iniciar una conversación, navega a un perfil de profesional y haz clic en "Chatear".
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}