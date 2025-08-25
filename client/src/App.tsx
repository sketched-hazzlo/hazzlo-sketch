import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import NotFound from "@/pages/not-found";
import Chat from "@/pages/chat";
import AllChats from "@/pages/all-chats";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ProfessionalDashboard from "@/pages/professional-dashboard";
import Search from "@/pages/search";
import ProfessionalProfileElegant from "@/pages/professional-profile-elegant";
import Servicios from "@/pages/servicios";
import Profesionales from "@/pages/profesionales";
import Ayuda from "@/pages/ayuda";
import Configuracion from "@/pages/configuracion";
import AuthPage from "@/pages/auth";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminSupervision from "@/pages/admin/supervision";
import ModeratorCredentials from "@/pages/admin/moderator-credentials";
import VerificationRequestsPage from "@/pages/admin/verifier";
import ModeratorLogin from "@/pages/moderator/login";
import ModeratorDashboard from "@/pages/moderator/dashboard";
import BannedScreen from "@/components/banned-screen";
import FloatingChatWidget from "@/components/floating-chat-widget";
import ChatSupport from "@/pages/chat-support";
import TermsOfService from "@/pages/tos";
import PrivacyPolicy from "@/pages/privacy";
import CookiesPolicy from "@/pages/cookies";
import ResetPassword from "@/pages/reset-password";

function Router() {
  const { user, isAuthenticated } = useAuth();

  // Show banned screen for permanently banned or temporarily suspended users
  if (isAuthenticated && (user?.isBanned || (user?.suspendedUntil && new Date(user.suspendedUntil) > new Date()))) {
    return <BannedScreen />;
  }

  return (
    <div>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/home" component={Home} />
        <Route path="/dashboard" component={ProfessionalDashboard} />
        <Route path="/search" component={Search} />
        <Route path="/professional/:id" component={ProfessionalProfileElegant} />
        <Route path="/professional" component={Profesionales} />
        <Route path="/servicios" component={Servicios} />
        <Route path="/profesionales" component={Profesionales} />
        <Route path="/ayuda" component={Ayuda} />
        <Route path="/configuracion" component={Configuracion} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/support" component={ChatSupport} />
        <Route path="/all-chats" component={AllChats} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/supervision" component={AdminSupervision} />
        <Route path="/admin/verifier" component={VerificationRequestsPage} />
        <Route path="/admin/credenciales" component={ModeratorCredentials} />
        <Route path="/moderator/login" component={ModeratorLogin} />
        <Route path="/modsupply/login" component={ModeratorLogin} />
        <Route path="/modsupply" component={ModeratorDashboard} />
        <Route path="/auth/reset-password" component={ResetPassword} />
        <Route path="/tos" component={TermsOfService} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/cookies" component={CookiesPolicy} />
        <Route component={NotFound} />
      </Switch>
      
      {/* Global Support Chat Widget - only show when user is authenticated and not on moderator or admin pages */}
      {isAuthenticated && user && !window.location.pathname.startsWith('/admin') && !window.location.pathname.startsWith('/modsupply') && !window.location.pathname.startsWith('/moderator') && (
        <FloatingChatWidget />
      )}
    </div>
  );
}

function AppWithTheme() {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Initialize theme on app load
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }, [theme]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function App() {
  return <AppWithTheme />;
}

export default App;
