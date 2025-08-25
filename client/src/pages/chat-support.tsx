import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Send, MessageCircle, Clock, User, Shield, AlertTriangle, Info } from "lucide-react";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SupportMessage {
  id: string;
  supportChatId: string;
  senderId: string | null;
  senderType: "user" | "moderator" | "admin" | "system";
  content: string;
  messageType: "text" | "image" | "file" | "system_info" | "system_warning";
  fileUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

interface SupportChat {
  id: string;
  userId: string;
  moderatorId: string | null;
  status: "open" | "assigned" | "closed";
  priority: "low" | "medium" | "high";
  subject: string | null;
  lastMessageAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ChatSupport() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get active support chat
  const { data: activeChat, isLoading: chatLoading } = useQuery<SupportChat>({
    queryKey: ["/api/support/my-chat"],
    queryFn: async () => {
      const response = await apiRequest("/api/support/my-chat");
      return response;
    },
    enabled: isAuthenticated,
    retry: 1,
    refetchInterval: 5000, // Check chat status every 5 seconds
  });

  // Get chat messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/chat", activeChat?.id, "messages"],
    queryFn: async () => {
      if (!activeChat?.id) return [];
      const response = await apiRequest(`/api/support/chat/${activeChat.id}/messages`);
      return response;
    },
    enabled: !!activeChat?.id,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!activeChat?.id) throw new Error("No active chat");
      
      const response = await apiRequest(`/api/support/chat/${activeChat.id}/messages`, {
        method: "POST",
        body: { content }
      });
      return response;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/chat", activeChat?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/my-chat"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle authentication redirect
  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Acceso Requerido</CardTitle>
              <CardDescription className="text-center">
                Debes iniciar sesión para acceder al chat de soporte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setLocation("/auth")}
                className="w-full"
                data-testid="button-login-redirect"
              >
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Handle no active chat
  if (!chatLoading && !activeChat) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Sin Chat Activo</CardTitle>
              <CardDescription className="text-center">
                No tienes un chat de soporte activo en este momento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => setLocation("/ayuda")}
                className="w-full"
                data-testid="button-go-to-help"
              >
                Ir a Centro de Ayuda
              </Button>
              <Button 
                variant="outline"
                onClick={() => setLocation("/")}
                className="w-full"
                data-testid="button-go-home"
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessageMutation.mutate(newMessage.trim());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary">Esperando Moderador</Badge>;
      case "assigned":
        return <Badge variant="default" className="bg-green-100 text-green-800">En Conversación</Badge>;
      case "escalated":
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Escalado a Admin</Badge>;
      case "closed":
        return <Badge variant="destructive">Cerrado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (chatLoading || messagesLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            <div>Cargando chat...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setLocation("/ayuda")}
              className="mb-4"
              data-testid="button-back-to-help"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Ayuda
            </Button>
            
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-600" />
                      Chat de Soporte
                    </CardTitle>
                    <CardDescription>
                      {activeChat?.subject || "Consulta general"}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(activeChat?.status || "open")}
                    <div className="text-xs text-gray-500 mt-1">
                      Creado: {format(new Date(activeChat?.createdAt || Date.now()), "PPp", { locale: es })}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Messages */}
          <Card className="mb-4">
            <CardContent className="p-0">
              <ScrollArea className="h-96 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay mensajes aún</p>
                    <p className="text-sm">Escribe tu primer mensaje abajo</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isSystemMessage = message.senderType === "system";
                      const isWarning = message.messageType === "system_warning";
                      
                      if (isSystemMessage) {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg text-center border ${
                                isWarning
                                  ? "bg-orange-50 text-orange-800 border-orange-200"
                                  : "bg-blue-50 text-blue-800 border-blue-200"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1 mb-2">
                                {isWarning ? (
                                  <AlertTriangle className="w-4 h-4" />
                                ) : (
                                  <Info className="w-4 h-4" />
                                )}
                                <span className="text-xs font-medium">Sistema</span>
                              </div>
                              <p className="text-sm font-medium">{message.content}</p>
                              <div className={`text-xs mt-1 ${
                                isWarning ? "text-orange-600" : "text-blue-600"
                              }`}>
                                {format(new Date(message.createdAt), "HH:mm")}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      
                      return (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderType === "user"
                                ? "bg-blue-600 text-white"
                                : message.senderType === "admin"
                                  ? "bg-red-100 text-red-900 border border-red-200"
                                  : "bg-gray-200 text-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {message.senderType === "user" ? (
                                <User className="w-3 h-3" />
                              ) : message.senderType === "admin" ? (
                                <Shield className="w-3 h-3" />
                              ) : (
                                <MessageCircle className="w-3 h-3" />
                              )}
                              <span className="text-xs opacity-75">
                                {message.senderType === "user" 
                                  ? "Tú" 
                                  : message.senderType === "admin" 
                                    ? "Administrador" 
                                    : "Moderador"
                                }
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                            <div className="text-xs opacity-75 mt-1">
                              {format(new Date(message.createdAt), "HH:mm")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          {activeChat?.status !== "closed" && (
            <Card>
              <CardContent className="p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={sendMessageMutation.isPending}
                    className="flex-1"
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    data-testid="button-send-message"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                {activeChat?.status === "open" && (
                  <p className="text-xs text-gray-500 mt-2">
                    Un moderador se conectará contigo pronto. Por favor, describe tu consulta en detalle.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {activeChat?.status === "closed" && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-gray-500">Este chat ha sido cerrado.</p>
                <Button 
                  onClick={() => setLocation("/ayuda")}
                  className="mt-2"
                  data-testid="button-new-support-request"
                >
                  Crear Nueva Consulta
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}