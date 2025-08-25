import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Scissors, 
  Code, 
  Zap, 
  Sparkles, 
  GraduationCap, 
  Heart, 
  Music, 
  Wrench, 
  Home, 
  Car,
  Camera,
  Paintbrush2,
  Hammer,
  Stethoscope,
  PartyPopper,
  Shield,
  Briefcase,
  Laptop,
  Dumbbell,
  TrendingUp
} from "lucide-react";

export default function ServiceCategories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const handleCategoryClick = (categoryId: string) => {
    window.location.href = `/search?category=${categoryId}`;
  };

  const iconMap: { [key: string]: any } = {
    'belleza': Scissors,
    'tecnologia': Laptop,
    'hogar': Home,
    'automotriz': Car,
    'educacion': GraduationCap,
    'salud': Stethoscope,
    'eventos': PartyPopper,
    'electricidad': Zap,
    'limpieza': Sparkles,
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
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-light text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-6 tracking-tight">
            Servicios <span className="font-medium">populares</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra expertos en las categorías más demandadas
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center border border-gray-200 dark:border-gray-700">
                <Skeleton className="w-16 h-16 rounded-2xl mx-auto mb-4" />
                <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 text-center hover-lift cursor-pointer border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${category.color || 'from-blue-100 to-blue-200'} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 smooth-transition`}>
                  {category.slug === 'belleza' && <Scissors className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'tecnologia' && <Laptop className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'hogar' && <Home className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'automotriz' && <Car className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'educacion' && <GraduationCap className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'salud' && <Stethoscope className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'eventos' && <PartyPopper className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'limpieza' && <Sparkles className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'entrenamiento' && <Dumbbell className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'diseno' && <Paintbrush2 className="text-blue-600 dark:text-white w-8 h-8" />}
                  {category.slug === 'finanzas' && <TrendingUp className="text-blue-600 dark:text-white w-8 h-8" />}
                  {!['belleza', 'tecnologia', 'hogar', 'automotriz', 'educacion', 'salud', 'eventos', 'limpieza', 'entrenamiento', 'diseno', 'finanzas'].includes(category.slug) && <Code className="text-blue-600 dark:text-white w-8 h-8" />}
                </div>
                <h3 className="font-display font-medium text-lg text-gray-900 dark:text-white mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ver profesionales
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-gray-400 dark:text-gray-500 text-2xl">📂</span>
            </div>
            <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-2">
              No hay categorías disponibles
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Estamos trabajando en agregar categorías de servicios.
            </p>
          </div>
        )}

        <div className="text-center mt-12">
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/servicios'}
            className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-8 py-4 rounded-full font-semibold border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 smooth-transition"
          >
            Ver todas las categorías
          </Button>
        </div>
      </div>
    </section>
  );
}
