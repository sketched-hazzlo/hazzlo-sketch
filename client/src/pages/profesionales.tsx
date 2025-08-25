import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/navbar";
import ProfessionalCardElegant from "@/components/professional-card-elegant";
import { Search, MapPin, Star, Filter, Users } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Profesionales() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/professionals/search', {
      query: searchQuery,
      category: selectedCategory,
      sort: sortBy,
      page: currentPage,
      limit: 12
    }],
    queryFn: () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sort: sortBy
      });
      
      if (searchQuery) params.append('query', searchQuery);
      if (selectedCategory) params.append('category', selectedCategory);
      
      return fetch(`/api/professionals/search?${params}`).then(r => r.json());
    },
  });

  const handleSearch = () => {
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}>
            <h1 className={`font-display font-light text-gray-900 dark:text-white ${isMobile ? 'text-2xl mb-4' : 'text-4xl sm:text-5xl mb-6'} tracking-tight`}>
              Encuentra <span className="font-medium">Profesionales</span>
            </h1>
            <p className={`text-gray-600 dark:text-gray-400 max-w-2xl mx-auto ${isMobile ? 'text-base px-4' : 'text-xl'}`}>
              {isMobile ? "Profesionales verificados en RD" : "Descubre profesionales verificados en República Dominicana"}
            </p>
          </div>

          {/* Search Filters */}
          <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl ${isMobile ? 'p-4 mb-6' : 'p-6 mb-8'}`}>
            <div className={`grid gap-4 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
              
              <div className="space-y-2">
                <Label htmlFor="search" className={`${isMobile ? "text-sm" : ""} text-gray-900 dark:text-white`}>
                  {isMobile ? "Buscar" : "Buscar profesionales"}
                </Label>
                <div className="relative">
                  <Search className={`absolute left-3 top-3 text-gray-500 dark:text-gray-400 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                  <Input
                    id="search"
                    className={`${isMobile ? "pl-8 text-sm" : "pl-10"} bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`}
                    placeholder="Ej: peluquería, desarrollo web..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className={`${isMobile ? "text-sm" : ""} text-gray-900 dark:text-white`}>Categoría</Label>
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
                  <SelectTrigger className={`${isMobile ? "text-sm" : ""} bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`}>
                    <SelectValue placeholder={isMobile ? "Categoría" : "Todas las categorías"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {Array.isArray(categories) && categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id || `cat-${category.name}`}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={`${isMobile ? "text-sm" : ""} text-gray-900 dark:text-white`}>
                  {isMobile ? "Ordenar" : "Ordenar por"}
                </Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className={`${isMobile ? "text-sm" : ""} bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Mejor calificación</SelectItem>
                    <SelectItem value="reviews">Más reseñas</SelectItem>
                    <SelectItem value="newest">Más recientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleSearch} 
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  size={isMobile ? "sm" : "default"}
                >
                  <Filter className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'}`} />
                  Buscar
                </Button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mb-6">
            {searchResults && (
              <p className="text-gray-600 dark:text-gray-400">
                {searchResults.total} profesionales encontrados
                {searchQuery && ` para "${searchQuery}"`}
                {selectedCategory && Array.isArray(categories) && ` en ${categories.find((c: any) => c.id === selectedCategory)?.name}`}
              </p>
            )}
          </div>

          {/* Professionals Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {[...Array(12)].map((_, i) => (
                <Card key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-1" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults?.professionals && searchResults.professionals.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {searchResults.professionals.map((professional: any) => (
                  <ProfessionalCardElegant 
                    key={professional.id}
                    professional={professional}
                  />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mb-12">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                    Página {currentPage} de {searchResults.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(prev => Math.min(searchResults.totalPages, prev + 1))}
                    disabled={currentPage === searchResults.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-2">
                No se encontraron profesionales
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Intenta con otros términos de búsqueda o revisa más categorías.
              </p>
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                Limpiar filtros
              </Button>
            </div>
          )}

          {/* Call to Action */}
          <section className="text-center py-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-display font-medium text-3xl text-gray-900 dark:text-white mb-4">
                ¿Eres un profesional?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Únete a nuestra comunidad y conecta con clientes que necesitan tus servicios
              </p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-8 py-4 rounded-full font-semibold text-white"
                onClick={() => window.location.href = '/dashboard'}
              >
                Crear perfil profesional
              </Button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}