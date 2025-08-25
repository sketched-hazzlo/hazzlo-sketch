import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
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
  ArrowLeft,
  Send,
  User,
  Shield,
  AlertTriangle,
  Eye,
  EyeOff,
  Settings,
  Clock,
  CheckCircle,
  X,
  Info,
} from "lucide-react";
import type { SupportChatListItem, SupportMessage } from "@shared/schema";

export default function AdminSupervision() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNonEscalated, setShowNonEscalated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Verificar que es admin
  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      setLocation("/admin");
    }
  }, [isAuthenticated, user, setLocation]);

  // Obtener todos los chats de soporte
  const { data: allChats = [], isLoading: chatsLoading, refetch: refetchChats } = useQuery<SupportChatListItem[]>({
    queryKey: ["/api/admin/support-chats"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/support-chats");
      return response;
    },
    refetchInterval: 5000,
  });

  // Filtrar chats según las opciones seleccionadas
  const filteredChats = allChats.filter(chat => {
    const matchesSearch = !searchQuery || 
      chat.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.subject?.toLowerCase().includes(searchQuery.toLowerCase());

    if (showNonEscalated) {
      return matchesSearch; // Mostrar todos los chats
    } else {
      return matchesSearch && (chat.status === "escalated" || chat.adminIntervened); // Solo escalados o con intervención admin
    }
  });

  // Obtener mensajes del chat seleccionado
  const { data: messages = [], refetch: refetchMessages } = useQuery<SupportMessage[]>({
    queryKey: ["/api/support/chat", selectedChatId, "messages"],
    queryFn: async () => {
      if (!selectedChatId) return [];
      const response = await apiRequest(`/api/support/chat/${selectedChatId}/messages`);
      return response;
    },
    enabled: !!selectedChatId,
    refetchInterval: 2000,
  });

  // Enviar mensaje como admin
  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, content }: { chatId: string; content: string }) => {
      const response = await apiRequest(`/api/admin/support-chat/${chatId}/message`, {
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

  // Intervenir en chat no escalado
  const interveneChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const response = await apiRequest(`/api/admin/support-chat/${chatId}/intervene`, {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      toast({ 
        title: "Intervención activada", 
        description: "Ahora puedes participar en este chat" 
      });
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
      const response = await apiRequest(`/api/admin/support-chat/${chatId}/close`, {
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChatId || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({
      chatId: selectedChatId,
      content: newMessage.trim()
    });
  };

  const selectedChat = filteredChats.find(chat => chat.id === selectedChatId);

  const escalatedChats = filteredChats.filter(chat => chat.status === "escalated");
  const nonEscalatedChats = filteredChats.filter(chat => chat.status !== "escalated" && chat.status !== "closed");
  const intervenedChats = filteredChats.filter(chat => chat.adminIntervened);

  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Admin
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supervisión de Chats de Ayuda</h1>
              <p className="text-sm text-gray-500">Gestiona y supervisa todos los chats de soporte</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch 
                id="show-all"
                checked={showNonEscalated}
                onCheckedChange={setShowNonEscalated}
              />
              <label 
                htmlFor="show-all" 
                className="text-sm font-medium cursor-pointer"
              >
                Mostrar chats no escalados
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Chats Escalados</CardTitle>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{escalatedChats.length}</div>
              <p className="text-sm text-gray-500">Requieren atención admin</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Con Intervención</CardTitle>
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{intervenedChats.length}</div>
              <p className="text-sm text-gray-500">Admin participando</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">No Escalados</CardTitle>
                <Clock className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{nonEscalatedChats.length}</div>
              <p className="text-sm text-gray-500">En proceso normal</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Visibles</CardTitle>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredChats.length}</div>
              <p className="text-sm text-gray-500">En esta vista</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por usuario, email o asunto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="text-sm text-gray-500">
                Mostrando {filteredChats.length} chats
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chats Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              {showNonEscalated ? "Todos los Chats de Soporte" : "Chats Escalados y con Intervención Admin"}
            </CardTitle>
            <CardDescription>
              {showNonEscalated 
                ? "Vista completa de todos los chats. Puedes intervenir en cualquiera activando la intervención."
                : "Solo chats que han sido escalados a administradores o donde ya hay intervención admin activa."
              }
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
                    <TableHead>Intervención Admin</TableHead>
                    <TableHead>Último Mensaje</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chatsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Cargando chats...
                      </TableCell>
                    </TableRow>
                  ) : filteredChats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-gray-500">
                          {showNonEscalated 
                            ? searchQuery 
                              ? "No se encontraron chats que coincidan con la búsqueda"
                              : "No hay chats activos"
                            : "No hay chats escalados o con intervención admin"
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChats.map((chat) => (
                      <TableRow key={chat.id} data-testid={`admin-chat-row-${chat.id}`}>
                        <TableCell>
                          <div className="font-medium">
                            {chat.user.firstName} {chat.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{chat.user.email}</div>
                        </TableCell>
                        <TableCell>{chat.subject || "Sin asunto"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={chat.status === "escalated" ? "destructive" : "default"}
                            className={
                              chat.status === "open" 
                                ? "bg-blue-100 text-blue-800" 
                                : chat.status === "assigned"
                                ? "bg-green-100 text-green-800"
                                : chat.status === "escalated"
                                ? "bg-red-100 text-red-800"
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
                          <div className="flex items-center gap-2">
                            {chat.adminIntervened ? (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Intervenido
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                            {chat.adminIntervention && (
                              <span className="text-xs text-gray-500">
                                ({chat.adminIntervention.firstName})
                              </span>
                            )}
                          </div>
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
                            {/* Botón para intervenir en chats no escalados */}
                            {chat.status !== "escalated" && !chat.adminIntervened && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => interveneChatMutation.mutate(chat.id)}
                                disabled={interveneChatMutation.isPending}
                                data-testid={`button-intervene-${chat.id}`}
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Intervenir
                              </Button>
                            )}
                            
                            {/* Botón para chatear (disponible si está escalado o con intervención admin) */}
                            {(chat.status === "escalated" || chat.adminIntervened) && (
                              <Button
                                size="sm"
                                onClick={() => setSelectedChatId(chat.id)}
                                data-testid={`button-admin-chat-${chat.id}`}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Chatear
                              </Button>
                            )}

                            {/* Solo los administradores pueden cerrar chats escalados */}
                            {chat.status === "escalated" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => closeChatMutation.mutate(chat.id)}
                                disabled={closeChatMutation.isPending}
                                data-testid={`button-admin-close-${chat.id}`}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cerrar
                              </Button>
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
              Chat con {selectedChat?.user.firstName} {selectedChat?.user.lastName} (ADMIN)
            </DialogTitle>
            <DialogDescription>
              {selectedChat?.subject && `Asunto: ${selectedChat.subject}`}
              {selectedChat?.escalationReason && (
                <div className="mt-2 p-2 bg-red-50 rounded text-red-800 text-sm">
                  <strong>Razón de escalamiento:</strong> {selectedChat.escalationReason}
                </div>
              )}
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
                      className={`flex ${
                        message.senderType === "admin" ? "justify-end" : 
                        message.senderType === "moderator" ? "justify-center" : "justify-start"
                      }`}
                    >
                      <div 
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.senderType === "admin" 
                            ? "bg-red-500 text-white" 
                            : message.senderType === "moderator"
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {message.senderType === "user" && <User className="w-3 h-3" />}
                          {message.senderType === "moderator" && <Shield className="w-3 h-3" />}
                          {message.senderType === "admin" && <Settings className="w-3 h-3" />}
                          <span className="text-xs font-medium">
                            {message.senderType === "user" ? "Usuario" :
                             message.senderType === "moderator" ? "Moderador" : "Admin"}
                          </span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderType === "admin" ? "text-red-100" :
                          message.senderType === "moderator" ? "text-purple-100" : "text-gray-500"
                        }`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('es-ES') : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Message Input - Solo disponible si el admin puede participar */}
            {(selectedChat?.status === "escalated" || selectedChat?.adminIntervened) && (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe como administrador..."
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-admin-message"
                />
                <Button 
                  type="submit"
                  disabled={sendMessageMutation.isPending || !newMessage.trim()}
                  data-testid="button-send-admin-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}