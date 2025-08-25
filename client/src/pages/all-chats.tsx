import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, ArrowLeft, Search, Users } from "lucide-react";

interface Conversation {
  id: string;
  clientId: string;
  professionalId: string;
  isActive: boolean;
  lastMessageAt: string;
  createdAt: string;
  lastMessage?: {
    content: string;
    isRead: boolean;
    senderId: string;
    createdAt: string;
  };
  client?: {
    id: string;
    firstName: string;
    lastName: string;
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

export default function AllChats() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = "/auth";
      return;
    }
  }, [user, isLoading]);

  // Fetch conversations for current user
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: () => fetch('/api/conversations').then(r => r.json()),
    enabled: !!user,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getConversationParticipant = (conversation: Conversation) => {
    if (!user) return null;
    
    if ((user as any).userType === 'client') {
      return {
        name: conversation.professional?.businessName || 'Profesional',
        image: conversation.professional?.user.profileImageUrl,
        firstName: conversation.professional?.user.firstName || 'P',
        type: 'professional'
      };
    } else {
      return {
        name: `${conversation.client?.firstName} ${conversation.client?.lastName}` || 'Cliente',
        image: conversation.client?.profileImageUrl,
        firstName: conversation.client?.firstName || 'C',
        type: 'client'
      };
    }
  };

  const filteredConversations = conversations.filter((conversation: Conversation) => {
    const participant = getConversationParticipant(conversation);
    return participant && participant.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleConversationClick = (conversationId: string) => {
    setLocation(`/chat?conversation=${conversationId}`);
  };

  if (isLoading || conversationsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando chats...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-primary" />
              <div>
                <h1 className="font-display font-light text-3xl text-foreground">
                  Mis conversaciones
                </h1>
                <p className="text-muted-foreground">
                  {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
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

          {/* Conversations List */}
          <Card>
            <CardContent className="p-0">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchQuery ? 'No se encontraron conversaciones' : 'No tienes conversaciones'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Cuando inicies una conversación, aparecerá aquí'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conversation) => {
                    const participant = getConversationParticipant(conversation);
                    const isUnread = conversation.lastMessage && 
                      !conversation.lastMessage.isRead && 
                      conversation.lastMessage.senderId !== user.id;

                    return (
                      <div
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation.id)}
                        className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={participant?.image} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {participant?.firstName?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-foreground truncate">
                                {participant?.name}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {isUnread && (
                                  <Badge variant="default" className="h-2 w-2 p-0 bg-primary"></Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(conversation.lastMessage?.createdAt || conversation.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            {conversation.lastMessage && (
                              <p className={`text-sm truncate mt-1 ${
                                isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                              }`}>
                                {conversation.lastMessage.senderId === user.id ? 'Tú: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}