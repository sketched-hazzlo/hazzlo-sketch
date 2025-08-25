import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Users,
  Clock,
  Send,
  LogOut,
  User,
  CheckCircle,
  AlertCircle,
  Shield,
  X,
  AlertTriangle,
  Archive,
  Info,
} from "lucide-react";
import type { SupportChatListItem, SupportMessage, Moderator } from "@shared/schema";

export default function ModeratorDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Verificar autenticación del moderador
  const { data: moderator, isLoading: authLoading } = useQuery<Moderator>({
    queryKey: ["/api/moderator/me"],
    queryFn: async () => {
      const response = await apiRequest("/api/moderator/me");
      return response;
    },
    retry: false,
  });

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!authLoading && !moderator) {
      setLocation("/modsupply/login");
    }
  }, [moderator, authLoading, setLocation]);

  // Obtener chats de soporte
  const { data: supportChats = [], isLoading: chatsLoading, refetch: refetchChats } = useQuery<SupportChatListItem[]>({
    queryKey: ["/api/moderator/support-chats"],
    queryFn: async () => {
      const response = await apiRequest("/api/moderator/support-chats");
      return response;
    },
    enabled: !!moderator,
    // Remove refetchInterval since we now use WebSocket for real-time updates
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!moderator) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws-chat`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[ModeratorWS] Connected to WebSocket');
      // Join as moderator to receive support chat updates
      ws.send(JSON.stringify({
        type: 'moderator_join',
        moderatorId: moderator.id
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[ModeratorWS] Received message:', message);
        
        if (message.type === 'new_support_chat') {
          // Refresh the chats list when a new support chat is created
          refetchChats();
          
          // Show notification
          toast({
            title: "Nueva solicitud de soporte",
            description: `${message.chat.user?.firstName || 'Usuario'} ha iniciado un chat de soporte`,
          });
        }
      } catch (error) {
        console.error('[ModeratorWS] Error parsing message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('[ModeratorWS] WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('[ModeratorWS] WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [moderator, refetchChats, toast]);

  // Obtener mensajes del chat seleccionado
  const { data: messages = [], refetch: refetchMessages } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/chat", selectedChatId, "messages"],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const response = await apiRequest(`/api/support/chat/${selectedChatId}/messages`);
      return response;
    },
    enabled: !!selectedChatId,
    refetchInterval: 2000, // Refetch messages every 2 seconds
  });

  // Cerrar sesión
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/moderator/logout", {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/modsupply/login");
    },
  });

  // Asumir responsabilidad de un chat
  const assignChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/moderator/support-chats/${chatId}/assign`, {
        method: "POST"
      });
      return response;
    },
    onSuccess: (_, chatId) => {
      toast({ title: "Chat asignado", description: "Ahora eres responsable de este chat" });
      refetchChats();
      setSelectedChatId(chatId);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Enviar mensaje
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const response = await apiRequest(`/api/support/chat/${chatId}/messages`, {
        method: "POST",
        body: { content }
      });
      return response;
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      refetchChats();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Escalar chat a administradores
  const escalateChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/moderator/support-chats/${chatId}/escalate`, {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Chat escalado", description: "Este chat ha sido escalado a los administradores" });
      refetchChats();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Cerrar chat
  const closeChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/moderator/support-chats/${chatId}/close`, {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Chat cerrado" });
      setSelectedChatId(null);
      refetchChats();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Archivar y cerrar chat
  const archiveChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/moderator/support-chats/${chatId}/archive`, {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Chat archivado", description: "El chat ha sido cerrado y archivado" });
      setSelectedChatId(null);
      refetchChats();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: newMessage.trim()
    });
  };

  const selectedChat = supportChats.find(chat => chat.id === selectedChatId);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Verificando autenticación...</div>
      </div>
    );
  }

  if (!moderator) {
    return null; // Will redirect to login
  }

  const openChats = supportChats.filter(chat => chat.status === "open");
  const assignedChats = supportChats.filter(chat => chat.status === "assigned");
  const escalatedChats = supportChats.filter(chat => chat.status === "escalated");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Soporte</h1>
              <p className="text-sm text-gray-500">Moderador: {moderator.name}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Chats Abiertos</CardTitle>
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openChats.length}</div>
              <p className="text-sm text-gray-500">Esperando asignación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Chats Asignados</CardTitle>
                <User className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedChats.length}</div>
              <p className="text-sm text-gray-500">En progreso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Escalados</CardTitle>
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{escalatedChats.length}</div>
              <p className="text-sm text-gray-500">Necesitan admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Activos</CardTitle>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportChats.length}</div>
              <p className="text-sm text-gray-500">Chats en el sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Chats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Chats de Soporte Activos</CardTitle>
            <CardDescription>
              Gestiona los chats de soporte de los usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Asunto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Moderador</TableHead>
                    <TableHead>Último Mensaje</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatsLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando chats...
                      </TableCell>
                    </TableRow>
                  ) : supportChats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No hay chats activos
                      </TableCell>
                    </TableRow>
                  ) : (
                    supportChats.map((chat) => (
                      <TableRow key={chat.id} data-testid={`chat-row-${chat.id}`}>
                        <TableCell>
                          <div className="font-medium">
                            {chat.user.firstName} {chat.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{chat.user.email}</div>
                        </TableCell>
                        <TableCell>{chat.subject || "Sin asunto"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={chat.status === "open" ? "secondary" : "default"}
                            className={
                              chat.status === "open" 
                                ? "bg-blue-100 text-blue-800" 
                                : chat.status === "assigned"
                                ? "bg-green-100 text-green-800"
                                : chat.status === "escalated"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {chat.status === "open" ? "Abierto" : 
                             chat.status === "assigned" ? "Asignado" :
                             chat.status === "escalated" ? "Escalado" : 
                             chat.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {chat.moderator ? chat.moderator.name : "-"}
                        </TableCell>
                        <TableCell>
                          {chat.lastMessageAt ? (
                            <div className="text-sm">
                              {new Date(chat.lastMessageAt).toLocaleString('es-ES')}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {chat.status === "open" && (
                              <Button
                                size="sm"
                                onClick={() => assignChatMutation.mutate(chat.id)}
                                disabled={assignChatMutation.isPending}
                                data-testid={`button-assign-${chat.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Asumir
                              </Button>
                            )}
                            {chat.status === "assigned" && chat.moderator?.name === moderator.name && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedChatId(chat.id)}
                                  data-testid={`button-chat-${chat.id}`}
                                >
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Chatear
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => closeChatMutation.mutate(chat.id)}
                                  disabled={closeChatMutation.isPending}
                                  data-testid={`button-close-${chat.id}`}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cerrar
                                </Button>
                              </>
                            )}
                            {chat.status === "assigned" && chat.moderator?.name !== moderator.name && (
                              <span className="text-sm text-gray-500">Asignado a otro</span>
                            )}
                            {chat.status === "escalated" && (
                              <span className="text-sm text-orange-600 font-medium">Escalado a administradores</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Dialog */}
      <Dialog open={!!selectedChatId} onOpenChange={() => setSelectedChatId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Chat con {selectedChat?.user.firstName} {selectedChat?.user.lastName}
            </DialogTitle>
            <DialogDescription>
              {selectedChat?.subject && `Asunto: ${selectedChat.subject}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[60vh]">
            {/* Messages */}
            <ScrollArea className="flex-1 border rounded-lg p-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isSystemMessage = message.senderType === "system";
                  const isWarning = message.messageType === "system_warning";
                  
                  if (isSystemMessage) {
                    return (
                      <div key={message.id} className="flex justify-center my-2">
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-center border ${
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
                          <p className={`text-xs mt-1 ${
                            isWarning ? "text-orange-600" : "text-blue-600"
                          }`}>
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-ES') : ''}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${message.senderType === "moderator" ? "justify-end" : "justify-start"}`}
                    >
                      <div 
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderType === "moderator" 
                            ? "bg-purple-500 text-white" 
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === "moderator" 
                            ? "text-purple-100" 
                            : "text-gray-500"
                        }`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-ES') : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => escalateChatMutation.mutate(selectedChatId!)}
                disabled={escalateChatMutation.isPending}
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid="button-escalate-chat"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Escalar a Admin
              </Button>
              <Button
                onClick={() => setShowCloseDialog(true)}
                variant="outline"
                size="sm"
                className="flex-1"
                data-testid="button-close-chat-options"
              >
                <X className="w-4 h-4 mr-2" />
                Cerrar Chat
              </Button>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                disabled={sendMessageMutation.isPending}
                data-testid="input-message"
              />
              <Button 
                type="submit"
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Options Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Chat</DialogTitle>
            <DialogDescription>
              ¿Cómo deseas cerrar este chat?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                archiveChatMutation.mutate(selectedChatId!);
                setShowCloseDialog(false);
              }}
              disabled={archiveChatMutation.isPending}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-archive-close"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archivar y Cerrar
              <span className="text-xs text-gray-500 ml-auto">
                Guarda logs en modchatlogs
              </span>
            </Button>
            <Button
              onClick={() => {
                closeChatMutation.mutate(selectedChatId!);
                setShowCloseDialog(false);
              }}
              disabled={closeChatMutation.isPending}
              variant="outline"
              className="w-full justify-start"
              data-testid="button-simple-close"
            >
              <X className="w-4 h-4 mr-2" />
              Cerrar Simple
              <span className="text-xs text-gray-500 ml-auto">
                Solo cerrar sin archivar
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}