import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  User, 
  Clock, 
  Check, 
  CheckCheck,
  Search,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantImage?: string;
  lastMessage: Message;
  unreadCount: number;
}

interface ChatSystemProps {
  recipientId?: string;
  recipientName?: string;
}

export default function ChatSystem({ recipientId, recipientName }: ChatSystemProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations data
  const mockConversations: Conversation[] = [
    {
      id: "1",
      participantId: "user-123",
      participantName: "María González",
      participantImage: "",
      lastMessage: {
        id: "msg-1",
        senderId: "user-123",
        recipientId: user?.id || "",
        content: "Hola! Estoy interesada en tu servicio de corte de cabello",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        read: false,
        type: 'text'
      },
      unreadCount: 1
    },
    {
      id: "2",
      participantId: "user-456",
      participantName: "Carlos Pérez",
      participantImage: "",
      lastMessage: {
        id: "msg-2",
        senderId: user?.id || "",
        recipientId: "user-456",
        content: "Perfecto, nos vemos mañana a las 3pm",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        read: true,
        type: 'text'
      },
      unreadCount: 0
    }
  ];

  const mockMessages: Message[] = [
    {
      id: "msg-1",
      senderId: "user-123",
      recipientId: user?.id || "",
      content: "Hola! Estoy interesada en tu servicio de corte de cabello",
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      read: true,
      type: 'text'
    },
    {
      id: "msg-2",
      senderId: user?.id || "",
      recipientId: "user-123",
      content: "¡Hola María! Claro, estaré encantado de ayudarte. ¿Qué tipo de corte tienes en mente?",
      timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
      read: true,
      type: 'text'
    },
    {
      id: "msg-3",
      senderId: "user-123",
      recipientId: user?.id || "",
      content: "Me gustaría algo moderno, como un bob corto. ¿Cuándo tienes disponibilidad?",
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      read: false,
      type: 'text'
    }
  ];

  useEffect(() => {
    setConversations(mockConversations);
    if (selectedConversation) {
      setMessages(mockMessages);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: user?.id || "",
      recipientId: selectedConversation,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Update conversation's last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: message }
        : conv
    ));
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-full">
          <MessageCircle className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] h-[600px] p-0">
        <div className="flex h-full">
          {/* Conversations Sidebar */}
          <div className="w-1/3 border-r flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-lg">Mensajes</DialogTitle>
            </DialogHeader>
            
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedConversation === conversation.id && "bg-blue-50 border-r-2 border-blue-500"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.participantImage} />
                          <AvatarFallback>
                            {conversation.participantName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {conversation.participantName}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.lastMessage.timestamp)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage.senderId === user?.id && "Tú: "}
                              {conversation.lastMessage.content}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Sin conversaciones</h3>
                  <p className="text-sm text-gray-500">
                    Tus mensajes aparecerán aquí
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {conversations.find(c => c.id === selectedConversation)?.participantName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">
                        {conversations.find(c => c.id === selectedConversation)?.participantName}
                      </h3>
                      <p className="text-xs text-gray-500">En línea</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderId === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            message.senderId === user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-900"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end mt-1 space-x-1">
                            <span className="text-xs opacity-70">
                              {formatTime(message.timestamp)}
                            </span>
                            {message.senderId === user?.id && (
                              message.read ? 
                                <CheckCheck className="h-3 w-3 text-blue-200" /> : 
                                <Check className="h-3 w-3 text-blue-200" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Escribe un mensaje..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim()}
                      className="hazzlo-gradient"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">
                    Selecciona una conversación
                  </h3>
                  <p className="text-sm text-gray-500">
                    Elige una conversación para empezar a chatear
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Quick Chat Button Component
export function QuickChatButton({ recipientId, recipientName }: ChatSystemProps) {
  return (
    <ChatSystem recipientId={recipientId} recipientName={recipientName} />
  );
}