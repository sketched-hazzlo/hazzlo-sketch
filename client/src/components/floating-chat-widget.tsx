import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Minimize2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function FloatingChatWidget() {
  const { isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Check for active support chat
  const { data: activeChat } = useQuery({
    queryKey: ["/api/support/my-chat"],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      try {
        const response = await apiRequest("/api/support/my-chat");
        return response;
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 5000, // Check every 5 seconds for real-time updates
  });

  // Don't show widget if no active chat or if user is on chat support page
  if (!activeChat || location === "/chat/support") return null;

  const handleOpenChat = () => {
    // Navigate to the support chat page or open chat interface
    setLocation("/chat/support");
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
          data-testid="button-expand-chat"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-600" />
              Chat de Soporte Activo
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
                data-testid="button-minimize-chat"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="text-xs text-gray-600">
              <div className="font-medium">Asunto: {activeChat.subject || "Consulta general"}</div>
              <div className="text-gray-500">
                Estado: <span className={`font-medium ${
                  activeChat.status === 'assigned' ? 'text-green-600' : 
                  activeChat.status === 'escalated' ? 'text-orange-600' : 
                  'text-blue-600'
                }`}>
                  {activeChat.status === 'open' ? 'Esperando moderador' : 
                   activeChat.status === 'assigned' ? 'En conversación' :
                   activeChat.status === 'escalated' ? 'Escalado a admin' :
                   activeChat.status}
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleOpenChat}
                className="flex-1 text-xs h-8"
                data-testid="button-open-support-chat"
              >
                Abrir Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}