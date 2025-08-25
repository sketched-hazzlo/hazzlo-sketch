import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import HeroSearch from "@/components/hero-search";
import ServiceCategories from "@/components/service-categories";
import ProfessionalCard from "@/components/professional-card";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, isLoading, toast]);

  const { data: professionals } = useQuery({
    queryKey: ['/api/professionals/search', { limit: 6 }],
    queryFn: () => fetch('/api/professionals/search?limit=6').then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hazzlo-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-hazzlo-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-hazzlo-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hazzlo-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Welcome Section */}
      <section className="pt-40 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center animate-fade-in">
            <h1 className="font-display font-light text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4 tracking-tight">
              Bienvenido de vuelta{(user as any)?.firstName ? `, ${(user as any).firstName}` : ''}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
              ¿Qué servicio necesitas hoy? Encuentra profesionales cerca de ti.
            </p>
            
            <HeroSearch compact />
          </div>
        </div>
      </section>

      <ServiceCategories />

      {/* Quick Actions */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display font-semibold text-xl sm:text-2xl text-gray-900 dark:text-white mb-8 text-center">
            Acciones rápidas
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover-lift"
              onClick={() => window.location.href = '/search'}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar servicios
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover-lift"
              onClick={() => window.location.href = '/dashboard'}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Mi dashboard
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover-lift"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V10a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
              </svg>
              Mis solicitudes
            </Button>
            
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 hover-lift"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Favoritos
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      {professionals?.professionals && professionals.professionals.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="font-display font-light text-3xl sm:text-4xl text-gray-900 dark:text-white mb-2 tracking-tight">
                  Profesionales <span className="font-medium">recomendados</span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Basado en tu ubicación y búsquedas anteriores
                </p>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/search'}
              >
                Ver todos
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {professionals.professionals.map((professional: any) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
