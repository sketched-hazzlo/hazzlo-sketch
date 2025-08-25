import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Briefcase, ArrowRight, ArrowLeft, Sparkles, Shield, Users, CheckCircle, ChevronUp, Phone, Mail, Lock, KeyRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register' | 'forgot-password'>('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Forgot password form
  const [forgotPasswordData, setForgotPasswordData] = useState({
    email: "",
  });
  
  // Store the email that requested password reset for security validation
  const [resetRequestEmail, setResetRequestEmail] = useState("");

  // Code verification form
  const [codeVerificationData, setCodeVerificationData] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCodeVerification, setShowCodeVerification] = useState(false);
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState("");
  
  // Registration form
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    userType: "client" as "client" | "professional",
  });



  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.email || !registerData.password || !registerData.firstName || !registerData.lastName) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Error en contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    const { confirmPassword, ...dataToSend } = registerData;
    registerMutation.mutate(dataToSend);
  };

  // Password reset request mutation
  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error enviando la solicitud');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Correo enviado",
        description: "Revisa tu correo electrónico e ingresa el código de 6 dígitos",
      });
      // Store the email for security validation
      setResetRequestEmail(forgotPasswordData.email);
      setShowCodeVerification(true);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error enviando la solicitud",
        variant: "destructive",
      });
    },
  });

  // Code verification mutation - validates code belongs to specific email
  const verifyResetCodeMutation = useMutation({
    mutationFn: async (data: { email: string; code: string }) => {
      const response = await fetch('/api/auth/verify-reset-code-secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email, code: data.code }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Código inválido o expirado');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Code verified successfully, proceed to password reset modal
      setVerifiedCode(codeVerificationData.code);
      setShowCodeVerification(false);
      setShowNewPasswordModal(true);
      toast({
        title: "Código verificado",
        description: "Ahora puedes establecer tu nueva contraseña",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Código inválido",
        description: error.message || "El código no es válido o ha expirado",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const resetPasswordWithCodeMutation = useMutation({
    mutationFn: async (data: { code: string; newPassword: string; email: string }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: data.code, newPassword: data.newPassword, email: data.email }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error restableciendo la contraseña');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido restablecida exitosamente",
      });
      setCurrentView('login');
      setShowCodeVerification(false);
      setShowNewPasswordModal(false);
      setCodeVerificationData({ code: "", newPassword: "", confirmPassword: "" });
      setResetRequestEmail("");
      setVerifiedCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error restableciendo la contraseña",
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotPasswordData.email) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email",
        variant: "destructive",
      });
      return;
    }

    requestPasswordResetMutation.mutate(forgotPasswordData.email);
  };

  const handleCodeVerification = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeVerificationData.code) {
      toast({
        title: "Campo requerido",
        description: "Por favor ingresa el código de verificación",
        variant: "destructive",
      });
      return;
    }

    if (codeVerificationData.code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "El código debe tener 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (!resetRequestEmail) {
      toast({
        title: "Error de seguridad",
        description: "No se puede verificar el email asociado. Solicita un nuevo código.",
        variant: "destructive",
      });
      setCurrentView('forgot-password');
      return;
    }

    // Verify that the code belongs to the specific email that requested the reset
    verifyResetCodeMutation.mutate({
      email: resetRequestEmail,
      code: codeVerificationData.code
    });
  };

  const handleNewPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codeVerificationData.newPassword || !codeVerificationData.confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (codeVerificationData.newPassword !== codeVerificationData.confirmPassword) {
      toast({
        title: "Error en contraseña",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    if (codeVerificationData.newPassword.length < 8) {
      toast({
        title: "Contraseña débil",
        description: "La contraseña debe tener al menos 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    resetPasswordWithCodeMutation.mutate({
      code: verifiedCode,
      newPassword: codeVerificationData.newPassword,
      email: resetRequestEmail
    });
  };


  const features = [
    {
      icon: Shield,
      title: "Seguridad garantizada",
      description: "Todos los profesionales están verificados"
    },
    {
      icon: Users,
      title: "Confianza absoluta",
      description: "Miles de reseñas reales de usuarios satisfechos"
    },
    {
      icon: Phone,
      title: "Facilidad de contacto",
      description: "Facilitamos tu conexión con profesionales"
    }
  ];

  // Don't render if already logged in - moved after all hooks
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700 relative overflow-hidden will-change-transform">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Welcome section - appears first on mobile, left on desktop */}
        <div className="lg:w-1/2 flex flex-col justify-center p-6 sm:p-8 lg:p-12 xl:p-16 min-h-[20vh] lg:min-h-screen order-1 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light text-slate-900 dark:text-white mb-4 lg:mb-6 tracking-tight leading-tight">
              Bienvenido a{" "}
              <span className="font-medium bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Hazzlo
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 lg:mb-12 leading-relaxed hidden sm:block">
              La plataforma que conecta profesionales excepcionales con clientes que buscan calidad.
            </p>
          </motion.div>

          {/* Features only visible on desktop */}
          <div className="space-y-8 hidden lg:block">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Auth forms - appears second on mobile, right on desktop */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[60vh] lg:min-h-screen order-2 lg:order-2">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {/* Welcome Screen */}
              {currentView === 'welcome' && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8 will-change-transform"
                  data-testid="auth-welcome"
                >
                  <div className="text-center mb-8">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    >
                      <div className="text-slate-900 dark:text-white text-lg font-light tracking-wider" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif' }}>Hazzlo</div>
                    </motion.div>
                    <h2 className="text-2xl sm:text-3xl font-light text-slate-900 dark:text-white mb-3">
                      Comenzar
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      Elige cómo quieres continuar
                    </p>
                  </div>

                  <div className="space-y-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('login')}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-2xl py-4 px-6 font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                      data-testid="button-go-to-login"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCurrentView('register')}
                      className="w-full bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-700/70 text-slate-900 dark:text-white rounded-2xl py-4 px-6 font-medium transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50 backdrop-blur-sm"
                      data-testid="button-go-to-register"
                    >
                      <div className="flex items-center justify-center space-x-3">
                        <span>Crear Cuenta</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </motion.button>
                  </div>

                  <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Al continuar, aceptas nuestros{" "}
                      <a
                        href="/tos"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        términos y condiciones
                      </a>
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Login Form */}
              {currentView === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8 will-change-transform"
                  data-testid="auth-login"
                >
                  <div className="flex items-center mb-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentView('welcome')}
                      className="mr-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      data-testid="button-back-from-login"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </motion.button>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white">
                        Bienvenido de vuelta
                      </h2>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Ingresa tus credenciales para continuar
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6" data-testid="form-login">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.2 }}
                    >
                      <Label htmlFor="email-login" className="text-slate-700 dark:text-slate-300 font-medium">
                        Correo Electrónico
                      </Label>
                      <Input
                        id="email-login"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                        data-testid="input-email-login"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                      <Label htmlFor="password-login" className="text-slate-700 dark:text-slate-300 font-medium">
                        Contraseña
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="password-login"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-password-login"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          data-testid="button-toggle-password-login"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        disabled={loginMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-10 sm:h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200 will-change-transform"
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Iniciando sesión...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>Iniciar Sesión</span>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    <div className="text-center pt-4 space-y-3">
                      <p className="text-slate-600 dark:text-slate-400">
                        ¿Olvidaste tu contraseña?{" "}
                        <button
                          type="button"
                          onClick={() => setCurrentView('forgot-password')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          data-testid="link-to-forgot-password"
                        >
                          Restablecer
                        </button>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        ¿No tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={() => setCurrentView('register')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          data-testid="link-to-register"
                        >
                          Crear cuenta
                        </button>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}


              {/* Forgot Password Form */}
              {currentView === 'forgot-password' && (
                <motion.div
                  key="forgot-password"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8 will-change-transform"
                  data-testid="auth-forgot-password"
                >
                  <div className="flex items-center mb-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentView('login')}
                      className="mr-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      data-testid="button-back-from-forgot-password"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </motion.button>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white">
                        Restablecer contraseña
                      </h2>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Te enviaremos un enlace para restablecer tu contraseña
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-6" data-testid="form-forgot-password">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.2 }}
                    >
                      <Label htmlFor="email-forgot" className="text-slate-700 dark:text-slate-300 font-medium">
                        Correo Electrónico
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="email-forgot"
                          type="email"
                          placeholder="tu@email.com"
                          value={forgotPasswordData.email}
                          onChange={(e) => setForgotPasswordData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pl-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-email-forgot"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Button
                        type="submit"
                        disabled={requestPasswordResetMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-10 sm:h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200 will-change-transform"
                        data-testid="button-forgot-password"
                      >
                        {requestPasswordResetMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <KeyRound className="w-5 h-5" />
                            <span>Enviar enlace de restablecimiento</span>
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    <div className="text-center pt-4">
                      <p className="text-slate-600 dark:text-slate-400">
                        ¿Recordaste tu contraseña?{" "}
                        <button
                          type="button"
                          onClick={() => setCurrentView('login')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          data-testid="link-to-login-from-forgot"
                        >
                          Iniciar sesión
                        </button>
                      </p>
                    </div>
                  </form>

                  {/* Code Verification Modal - First Modal */}
                  {showCodeVerification && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 z-50"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          setShowCodeVerification(false);
                        }
                      }}
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            Ingresa el código
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                            Revisa tu correo e ingresa el código de 6 dígitos
                          </p>
                        </div>

                        <form onSubmit={handleCodeVerification} className="space-y-4">
                          <div>
                            <Label htmlFor="code" className="text-slate-700 dark:text-slate-300 font-medium">
                              Código de verificación
                            </Label>
                            <Input
                              id="code"
                              type="text"
                              placeholder="123456"
                              maxLength={6}
                              value={codeVerificationData.code}
                              onChange={(e) => setCodeVerificationData(prev => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                              required
                              className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-12 text-center text-lg tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              data-testid="input-code-verification"
                            />
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCodeVerification(false)}
                              className="flex-1 rounded-xl h-12"
                              data-testid="button-cancel-code"
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                              data-testid="button-verify-code"
                            >
                              Continuar
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}

                  {/* New Password Modal - Second Modal */}
                  {showNewPasswordModal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 z-50"
                      onClick={(e) => {
                        if (e.target === e.currentTarget) {
                          setShowNewPasswordModal(false);
                        }
                      }}
                    >
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            Nueva contraseña
                          </h3>
                          <p className="text-slate-600 dark:text-slate-300 text-sm">
                            Establece tu nueva contraseña
                          </p>
                        </div>

                        <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="newPassword" className="text-slate-700 dark:text-slate-300 font-medium">
                              Nueva contraseña
                            </Label>
                            <div className="relative mt-2">
                              <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={codeVerificationData.newPassword}
                                onChange={(e) => setCodeVerificationData(prev => ({ ...prev, newPassword: e.target.value }))}
                                required
                                className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                data-testid="input-new-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium">
                              Confirmar contraseña
                            </Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="••••••••"
                              value={codeVerificationData.confirmPassword}
                              onChange={(e) => setCodeVerificationData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                              className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              data-testid="input-confirm-password"
                            />
                          </div>

                          <div className="flex space-x-3 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowNewPasswordModal(false);
                                setShowCodeVerification(true);
                              }}
                              className="flex-1 rounded-xl h-12"
                              data-testid="button-back-to-code"
                            >
                              Volver
                            </Button>
                            <Button
                              type="submit"
                              disabled={resetPasswordWithCodeMutation.isPending}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                              data-testid="button-reset-password-final"
                            >
                              {resetPasswordWithCodeMutation.isPending ? (
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  <span>Actualizando...</span>
                                </div>
                              ) : (
                                "Actualizar contraseña"
                              )}
                            </Button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Register Form */}
              {currentView === 'register' && (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="backdrop-blur-xl bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-6 sm:p-8 will-change-transform"
                  data-testid="auth-register"
                >
                  <div className="flex items-center mb-8">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentView('welcome')}
                      className="mr-4 p-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                      data-testid="button-back-from-register"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </motion.button>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-light text-slate-900 dark:text-white">
                        Crear cuenta
                      </h2>
                      <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
                        Únete a nuestra comunidad de profesionales
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-5" data-testid="form-register">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05, duration: 0.2 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <div>
                        <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300 font-medium">
                          Nombre
                        </Label>
                        <Input
                          id="firstName"
                          placeholder="Nombre"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                          className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-firstName-register"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300 font-medium">
                          Apellido
                        </Label>
                        <Input
                          id="lastName"
                          placeholder="Apellido"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                          className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-lastName-register"
                        />
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                      <Label htmlFor="email-register" className="text-slate-700 dark:text-slate-300 font-medium">
                        Correo Electrónico
                      </Label>
                      <Input
                        id="email-register"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-2 bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                        data-testid="input-email-register"
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label className="text-slate-700 dark:text-slate-300 font-medium">Tipo de Cuenta</Label>
                      <RadioGroup
                        value={registerData.userType}
                        onValueChange={(value) => setRegisterData(prev => ({ ...prev, userType: value as "client" | "professional" }))}
                        className="flex gap-4 mt-3"
                        data-testid="radio-userType-register"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`flex-1 relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            registerData.userType === 'client'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-slate-600 bg-white/30 dark:bg-slate-700/30'
                          }`}
                        >
                          <RadioGroupItem value="client" id="client" className="sr-only" data-testid="radio-client" />
                          <Label htmlFor="client" className="flex items-center space-x-3 cursor-pointer">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-slate-900 dark:text-white">Cliente</span>
                            {registerData.userType === 'client' && (
                              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-auto" />
                            )}
                          </Label>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className={`flex-1 relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                            registerData.userType === 'professional'
                              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                              : 'border-slate-200 dark:border-slate-600 bg-white/30 dark:bg-slate-700/30'
                          }`}
                        >
                          <RadioGroupItem value="professional" id="professional" className="sr-only" data-testid="radio-professional" />
                          <Label htmlFor="professional" className="flex items-center space-x-3 cursor-pointer">
                            <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-slate-900 dark:text-white">Profesional</span>
                            {registerData.userType === 'professional' && (
                              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 ml-auto" />
                            )}
                          </Label>
                        </motion.div>
                      </RadioGroup>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Label htmlFor="password-register" className="text-slate-700 dark:text-slate-300 font-medium">
                        Contraseña
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="password-register"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-password-register"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          data-testid="button-toggle-password-register"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300 font-medium">
                        Confirmar Contraseña
                      </Label>
                      <div className="relative mt-2">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                          minLength={6}
                          className="bg-white/50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 rounded-xl h-10 sm:h-12 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all will-change-transform"
                          data-testid="input-confirmPassword-register"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                          data-testid="button-toggle-confirmPassword-register"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl h-10 sm:h-12 font-medium shadow-lg hover:shadow-xl transition-all duration-200 will-change-transform"
                        data-testid="button-register"
                      >
                        {registerMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Creando cuenta...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <span>Crear Cuenta</span>
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        )}
                      </Button>
                    </motion.div>

                    <div className="text-center pt-4 space-y-2">
                      <p className="text-slate-600 dark:text-slate-400">
                        ¿Ya tienes cuenta?{" "}
                        <button
                          type="button"
                          onClick={() => setCurrentView('login')}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                          data-testid="link-to-login"
                        >
                          Iniciar sesión
                        </button>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Al continuar, aceptas nuestros{" "}
                        <a
                          href="/tos"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          términos y condiciones
                        </a>
                      </p>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features section for mobile - appears third on mobile, hidden on desktop */}
        <div className="lg:hidden p-6 sm:p-8 order-3 hidden">
          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                className="flex items-start space-x-4"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 will-change-transform"
            data-testid="scroll-to-top"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}