import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Menu, 
  X, 
  Home, 
  Search, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut, 
  User,
  MessageSquare,
  BarChart3,
  Bell
} from "lucide-react";
import NotificationCenter from "@/components/notifications";

interface MobileMenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  user?: any;
  isAuthenticated?: boolean;
}

export default function MobileMenu({ isOpen, onClose, user: propUser, isAuthenticated }: MobileMenuProps = {}) {
  const { user: authUser, isLoading, logoutMutation } = useAuth();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use props if provided, otherwise use internal state and auth
  const user = propUser || authUser;
  const menuIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const setIsOpen = onClose ? (open: boolean) => !open && onClose() : setInternalIsOpen;

  const handleLogout = () => {
    logoutMutation.mutate();
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleNavigation = (url: string) => {
    window.location.href = url;
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (isLoading) return null;

  return (
    <Sheet open={menuIsOpen} onOpenChange={(open) => {
      if (onClose && !open) {
        onClose();
      } else {
        setInternalIsOpen(open);
      }
    }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-left">
            <span className="font-bold text-gray-900 dark:text-white">
              Hazzlo
            </span>
          </SheetTitle>
          <SheetDescription className="text-left">
            {user ? `Hola, ${(user as any)?.firstName || 'Usuario'}` : 'Bienvenido'}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {user ? (
            <>
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-100 font-semibold border border-gray-200 dark:border-gray-600">
                  {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {(user as any)?.firstName} {(user as any)?.lastName}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {(user as any)?.email}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {(user as any)?.userType === 'professional' ? 'Profesional' : 'Cliente'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Navigation Links */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/home')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Inicio
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/search')}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/profesionales')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Profesionales
                </Button>

                {/* Messages button only for clients */}
                {(user as any)?.userType === 'client' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/all-chats')}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensajes
                  </Button>
                )}

                {/* Dashboard for professionals */}
                {(user as any)?.userType === 'professional' && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/ayuda')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/configuracion')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </Button>
              </div>

              <Separator />

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Notificaciones</span>
                <NotificationCenter />
              </div>

              <Separator />

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar sesión'}
              </Button>
            </>
          ) : (
            <>
              {/* Guest Menu */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/')}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Inicio
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/profesionales')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Profesionales
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation('/ayuda')}
                >
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleNavigation('/auth')}
                >
                  <User className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Button>
                
                <Button
                  className="w-full hazzlo-gradient"
                  onClick={() => handleNavigation('/auth')}
                >
                  Registrarse
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}