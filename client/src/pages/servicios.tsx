import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import ProfessionalCardElegant from "@/components/professional-card-elegant";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Scissors, 
  Code, 
  Home, 
  Car, 
  GraduationCap, 
  Heart, 
  Music, 
  Sparkles,
  Zap,
  Hammer,
  Camera,
  Paintbrush2,
  Stethoscope,
  PartyPopper,
  Shield,
  Briefcase,
  Laptop,
  Dumbbell,
  TrendingUp,
  Search,
  Star
} from "lucide-react";

export default function Servicios() {
  const isMobile = useIsMobile();
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/professionals/search', { limit: 6 }],
    queryFn: () => fetch('/api/professionals/search?limit=6').then(r => r.json()),
  });

  const iconMap: { [key: string]: any } = {
    'belleza': Scissors,
    'tecnologia': Laptop,
    'hogar': Home,
    'automotriz': Car,
    'educacion': GraduationCap,
    'salud': Stethoscope,
    'eventos': PartyPopper,
    'limpieza': Sparkles,
    'entrenamiento': Dumbbell,
    'finanzas': TrendingUp,
    'electricidad': Zap,
    'reparaciones': Hammer,
    'fotografia': Camera,
    'arte': Paintbrush2,
    'seguridad': Shield,
    'consultoria': Briefcase,
    'medicina': Heart,
    'musica': Music,
  };

  const getIconForCategory = (slug: string) => {
    return iconMap[slug] || Code;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}>
            <h1 className={`font-display font-light text-gray-900 dark:text-white ${isMobile ? 'text-2xl mb-4' : 'text-4xl sm:text-5xl mb-6'} tracking-tight`}>
              Nuestros <span className="font-medium">Servicios</span>
            </h1>
            <p className={`text-gray-600 dark:text-gray-400 max-w-2xl mx-auto ${isMobile ? 'text-base px-4' : 'text-xl'}`}>
              {isMobile ? "Categorías de servicios disponibles" : "Explora todas las categorías de servicios disponibles en nuestra plataforma"}
            </p>
          </div>

          {/* Categories Grid */}
          <section className={isMobile ? "mb-12" : "mb-20"}>
            <h2 className={`font-display font-medium text-gray-900 dark:text-white ${isMobile ? 'text-lg mb-6' : 'text-2xl mb-8'}`}>
              {isMobile ? "Categorías" : "Categorías Disponibles"}
            </h2>
            
            {isLoading ? (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                      <Skeleton className={`rounded-xl ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
                      <Skeleton className={`${isMobile ? 'h-4 w-3/4' : 'h-6 w-3/4'}`} />
                    </CardHeader>
                    <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                      <Skeleton className={`w-full mb-2 ${isMobile ? 'h-3' : 'h-4'}`} />
                      <Skeleton className={`w-2/3 ${isMobile ? 'h-3' : 'h-4'}`} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : categories && Array.isArray(categories) && categories.length > 0 ? (
              <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
                {categories.map((category: any) => {
                  const Icon = getIconForCategory(category.slug);
                  return (
                    <Card 
                      key={category.id} 
                      className="bg-white dark:bg-gray-800 hover-lift cursor-pointer group border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                      onClick={() => window.location.href = `/search?category=${category.id}`}
                    >
                      <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                        <div className={`bg-gradient-to-br ${category.color || 'from-blue-100 to-blue-200'} rounded-xl flex items-center justify-center group-hover:scale-110 smooth-transition ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`}>
                          <Icon className={`text-blue-600 dark:text-white ${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`} />
                        </div>
                        <CardTitle className={`${isMobile ? "text-base" : "text-lg"} text-gray-900 dark:text-white`}>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                        <CardDescription className={`mb-4 ${isMobile ? 'text-xs' : ''} text-gray-600 dark:text-gray-400`}>
                          {isMobile 
                            ? `${category.name.toLowerCase()}` 
                            : (category.description || `Servicios de ${category.name.toLowerCase()}`)
                          }
                        </CardDescription>
                        <Button variant="outline" size={isMobile ? "sm" : "sm"} className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                          <span className={isMobile ? "text-xs" : ""}>Ver servicios</span>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-2">
                  No hay categorías disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Estamos trabajando en agregar más categorías de servicios.
                </p>
              </div>
            )}
          </section>

          {/* Featured Services Section */}
          <section className={isMobile ? "mb-12" : "mb-20"}>
            <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
              <h2 className={`font-display font-medium text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-2xl'}`}>
                {isMobile ? "Destacados" : "Profesionales Destacados"}
              </h2>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/search'}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                size={isMobile ? "sm" : "default"}
              >
                <span className={isMobile ? "text-xs" : ""}>Ver todos</span>
              </Button>
            </div>
            
            {searchLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-5 w-3/4 mb-1" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchResults?.professionals && searchResults.professionals.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.professionals.map((professional: any) => (
                  <ProfessionalCardElegant 
                    key={professional.id}
                    professional={professional}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-2">
                  No hay profesionales disponibles
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Pronto tendremos profesionales verificados en la plataforma.
                </p>
              </div>
            )}
          </section>

          {/* CTA Section */}
          <section className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display font-medium text-3xl text-gray-900 dark:text-white mb-4">
                ¿No encuentras lo que buscas?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Contáctanos y te ayudaremos a encontrar el profesional perfecto para tu proyecto
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => window.location.href = '/search'}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-8 py-4 rounded-full font-semibold text-white"
                >
                  Buscar profesionales
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/ayuda'}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-4 rounded-full font-semibold text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                >
                  Obtener ayuda
                </Button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}