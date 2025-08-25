import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Eye, EyeOff, LogIn } from "lucide-react";

interface LoginForm {
  moderatorId: string;
  password: string;
}

export default function ModeratorLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [credentials, setCredentials] = useState<LoginForm>({
    moderatorId: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("/api/moderator/login", {
        method: "POST",
        body: data
      });
      return response;
    },
    onSuccess: (moderator) => {
      toast({ 
        title: "Acceso concedido", 
        description: `Bienvenido, ${moderator.name}` 
      });
      setLocation("/modsupply");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error de acceso", 
        description: error.message || "Credenciales inválidas", 
        variant: "destructive" 
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.moderatorId.trim() || !credentials.password.trim()) {
      toast({ 
        title: "Error", 
        description: "Por favor ingresa tu ID y contraseña", 
        variant: "destructive" 
      });
      return;
    }

    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-2xl">Panel de Moderadores</CardTitle>
          <CardDescription>
            Accede al sistema de gestión de soporte con tus credenciales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moderator-id">ID de Moderador</Label>
              <Input
                id="moderator-id"
                type="text"
                value={credentials.moderatorId}
                onChange={(e) => setCredentials({ ...credentials, moderatorId: e.target.value })}
                placeholder="Ingresa tu ID de moderador"
                disabled={loginMutation.isPending}
                data-testid="input-moderator-id"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  placeholder="Ingresa tu contraseña"
                  disabled={loginMutation.isPending}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loginMutation.isPending}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                "Verificando..."
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-1">Acceso Restringido</p>
                <p>Esta área está destinada únicamente para moderadores autorizados del sistema de soporte.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}