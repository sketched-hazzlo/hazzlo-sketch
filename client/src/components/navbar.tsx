import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Menu, User, Settings, LogOut, BarChart3, Bell, MessageSquare } from "lucide-react";
import NotificationCenter from "@/components/notifications";
import MobileMenu from "./mobile-menu";

export default function Navbar() {
  const { user, isLoading, logoutMutation } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-lg' 
        : 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => window.location.href = '/'}
          >
            <span className="font-semibold text-xl text-gray-900 dark:text-white">
              Hazzlo
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Collapsible Apple-inspired search bar */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center">
                <div 
                  className={`bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-full border border-gray-200/30 dark:border-gray-700/30 transition-all duration-500 ease-out ${
                    searchExpanded ? 'w-64 bg-white/90 dark:bg-gray-800/90 shadow-lg' : 'w-10 h-10 hover:bg-gray-200/80 dark:hover:bg-gray-700/80'
                  }`}
                  onClick={() => setSearchExpanded(!searchExpanded)}
                >
                  <div className="flex items-center h-full">
                    <Search className={`text-gray-400 dark:text-gray-500 h-4 w-4 transition-all duration-300 ${
                      searchExpanded ? 'ml-3' : 'ml-3'
                    } hover:text-gray-600 dark:hover:text-gray-300`} />
                    <input
                      type="text"
                      placeholder="Buscar servicios..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`bg-transparent border-0 focus:ring-0 focus:outline-none text-sm font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-500 ease-out ${
                        searchExpanded ? 'w-44 opacity-100 pl-2 pr-3 py-2' : 'w-0 opacity-0'
                      }`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <a 
              href="/profesionales"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              Profesionales
            </a>
            <a 
              href="/ayuda"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            >
              Ayuda
            </a>
            
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {(user as any)?.userType === "professional" && (
                  <Button
                    variant="ghost"
                    onClick={() => window.location.href = '/dashboard'}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                
                {/* Notifications */}
                <NotificationCenter />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(user as any)?.profileImageUrl || ""} alt={(user as any)?.firstName || 'Usuario'} />
                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 text-sm font-medium border border-gray-200 dark:border-gray-600">
                          {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {(user as any)?.firstName && (
                          <p className="font-medium">{(user as any)?.firstName} {(user as any)?.lastName}</p>
                        )}
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {(user as any)?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />


                    <DropdownMenuItem onClick={() => window.location.href = '/configuracion'}>
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending}>
                      <LogOut className="mr-2 h-4 w-4" />
                      {logoutMutation.isPending ? 'Cerrando...' : 'Cerrar sesión'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/auth'}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-gray-600"
                >
                  Iniciar Sesión
                </Button>
                <Button 
                  onClick={() => window.location.href = '/auth'}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Registrarse
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/search'}
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Menu */}
    <MobileMenu 
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      user={user}
      isAuthenticated={!!user && !isLoading}
    />
    </>
  );
}