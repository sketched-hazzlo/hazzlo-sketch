import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get token from URL parameters
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    setToken(urlToken);
  }, []);

  // Reset password form
  const [resetData, setResetData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // Verify token validity
  const tokenVerification = useQuery({
    queryKey: ['/api/auth/verify-reset-token', token],
    queryFn: async () => {
      if (!token) throw new Error('Token no encontrado');
      return await apiRequest(`/api/auth/verify-reset-token/${token}`);
    },
    enabled: !!token,
    retry: false,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }) => {
      return await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { token, newPassword }
      });
    },
    onSuccess: (data) => {
      toast({
        title: "¡Contraseña actualizada!",
        description: data.message,
      });
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/auth');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error restableciendo la contraseña",
        variant: "destructive",
      });
    },
  });

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      toast({
        title: "Token inválido",
        description: "No se encontró un token válido en la URL",
        variant: "destructive",
      });
      return;
    }

    if (!resetData.newPassword || !resetData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      toast({
        title: "Error en contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (resetData.newPassword.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate({ 
      token, 
      newPassword: resetData.newPassword 
    });
  };

  // Loading state while verifying token
  if (!token || tokenVerification.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-300">Verificando token...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenVerification.isError || !tokenVerification.data?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 text-center"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-light text-slate-900 dark:text-white mb-4">
              Token inválido o expirado
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              El enlace para restablecer tu contraseña ha expirado o no es válido. 
              Por favor, solicita un nuevo enlace.
            </p>
            <Button
              onClick={() => setLocation('/auth')}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl"
              data-testid="button-back-to-auth"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio de sesión
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Success state after password reset
  if (resetPasswordMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-light text-slate-900 dark:text-white mb-4">
              ¡Contraseña actualizada!
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Tu contraseña ha sido actualizada exitosamente. 
              Ahora puedes iniciar sesión con tu nueva contraseña.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirigiendo al inicio de sesión...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8"
            data-testid="reset-password-form"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white mb-3">
                Nueva contraseña
              </h1>
              <p className="text-slate-600 dark:text-slate-300">
                Crea una nueva contraseña segura para tu cuenta
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6" data-testid="form-reset-password">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                <Label htmlFor="new-password" className="text-slate-700 dark:text-slate-300 font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={resetData.newPassword}
                    onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    data-testid="button-toggle-new-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.2 }}
              >
                <Label htmlFor="confirm-password" className="text-slate-700 dark:text-slate-300 font-medium">
                  Confirmar contraseña
                </Label>
                <div className="relative mt-2">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-10 sm:h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  data-testid="button-reset-password"
                >
                  {resetPasswordMutation.isPending ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Lock className="w-5 h-5" />
                      <span>Actualizar contraseña</span>
                    </div>
                  )}
                </Button>
              </motion.div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setLocation('/auth')}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium transition-colors"
                  data-testid="link-back-to-auth"
                >
                  ← Volver al inicio de sesión
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}