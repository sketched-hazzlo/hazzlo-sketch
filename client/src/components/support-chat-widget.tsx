import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  User,
  Shield,
  AlertTriangle,
  Info,
} from "lucide-react";
import type { SupportChat, SupportMessage } from "@shared/schema";

interface SupportChatWidgetProps {
  userId: string;
}

export function SupportChatWidget({ userId }: SupportChatWidgetProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active support chat
  const { data: activeChat, refetch: refetchChat } = useQuery<SupportChat | null>({
    queryKey: ["/api/support/chat/active"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/support/chat/active");
        if (response.status === 404) return null;
        return await response.json();
      } catch {
        return null;
      }
    },
    refetchInterval: 10000, // Check every 10 seconds
  });

  // Get messages for the active chat
  const { data: messages = [], refetch: refetchMessages } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/chat", activeChat?.id, "messages"],
    queryFn: async () => {
      if (!activeChat?.id) return [];
      try {
        const response = await apiRequest(`/api/support/chat/${activeChat.id}/messages`);
        return await response.json();
      } catch {
        return [];
      }
    },
    enabled: !!activeChat?.id,
    refetchInterval: 3000, // Refresh messages every 3 seconds
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const response = await apiRequest(`/api/support/chat/${chatId}/messages`, {
        method: "POST",
        body: { content }
      });
      return await response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      refetchChat();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al enviar mensaje", 
        variant: "destructive" 
      });
    },
  });

  // Close chat
  const closeChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/support/chat/${chatId}/close`, {
        method: "POST"
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Chat cerrado" });
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/support/chat/active"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle sending message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat?.id || !newMessage.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate({
      chatId: activeChat.id,
      content: newMessage.trim()
    });
  };

  // Don't render if no active chat
  if (!activeChat) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "assigned":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Minimized widget */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          data-testid="button-open-chat-widget"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      )}

      {/* Expanded chat widget */}
      {isOpen && (
        <Card className="w-80 h-96 bg-white shadow-xl border border-gray-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-sm">Chat de Soporte</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className={getStatusColor(activeChat.status || "")}>
                  {activeChat.status === "open" ? "Abierto" : "Asignado"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {activeChat.subject && (
              <p className="text-xs text-gray-500">Asunto: {activeChat.subject}</p>
            )}
            {activeChat.status === "open" && (
              <p className="text-xs text-yellow-600">
                Esperando que un moderador se conecte...
              </p>
            )}
            {activeChat.status === "assigned" && activeChat.moderatorId && (
              <p className="text-xs text-green-600">
                Conectado con moderador
              </p>
            )}
          </CardHeader>

          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No hay mensajes aún
                  </div>
                ) : (
                  messages.map((message) => {
                    const isSystemMessage = message.senderType === "system";
                    const isWarning = message.messageType === "system_warning";
                    
                    if (isSystemMessage) {
                      return (
                        <div key={message.id} className="flex justify-center my-2">
                          <div
                            className={`max-w-[80%] p-2 rounded-lg text-sm text-center border ${
                              isWarning
                                ? "bg-orange-50 text-orange-800 border-orange-200"
                                : "bg-blue-50 text-blue-800 border-blue-200"
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1 mb-1">
                              {isWarning ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <Info className="w-3 h-3" />
                              )}
                              <span className="text-xs font-medium">Sistema</span>
                            </div>
                            <p className="font-medium">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isWarning ? "text-orange-600" : "text-blue-600"
                            }`}>
                              {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              }) : ''}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderType === "user" ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-2 rounded-lg text-sm ${
                            message.senderType === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {message.senderType === "user" ? (
                              <User className="w-3 h-3" />
                            ) : (
                              <Shield className="w-3 h-3" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.senderType === "user" ? "Tú" : "Soporte"}
                            </span>
                          </div>
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.senderType === "user" ? "text-blue-100" : "text-gray-500"
                          }`}>
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="border-t p-3">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  disabled={sendMessageMutation.isPending || activeChat.status === "closed"}
                  className="text-sm"
                  data-testid="input-chat-message"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={sendMessageMutation.isPending || !newMessage.trim() || activeChat.status === "closed"}
                  data-testid="button-send-chat-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              
              {activeChat.status !== "closed" && (
                <div className="flex justify-end mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (activeChat?.id && confirm("¿Estás seguro de que quieres cerrar este chat?")) {
                        closeChatMutation.mutate(activeChat.id);
                      }
                    }}
                    disabled={closeChatMutation.isPending}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cerrar chat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}