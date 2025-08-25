import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProfessionalCardElegant from "@/components/professional-card-elegant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, MapPin, Star, SlidersHorizontal } from "lucide-react";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Get URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    const category = urlParams.get('category');
    const loc = urlParams.get('location');
    
    if (query) setSearchQuery(query);
    if (category) setSelectedCategory(category);
    if (loc) setSelectedLocation(loc);
  }, []);

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/professionals/search', {
      query: searchQuery,
      category: selectedCategory,
      location: selectedLocation,
      page: currentPage,
      sort: sortBy
    }],
    queryFn: () => {
      const params = new URLSearchParams({
        ...(searchQuery && { query: searchQuery }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedLocation && { location: selectedLocation }),
        page: currentPage.toString(),
        sort: sortBy,
        limit: '12'
      });
      return fetch(`/api/professionals/search?${params}`).then(r => r.json());
    },
  });

  const handleSearch = () => {
    setCurrentPage(1);
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedLocation) params.set('location', selectedLocation);
    
    setLocation(`/search${params.toString() ? '?' + params.toString() : ''}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedLocation("");
    setSortBy("rating");
    setCurrentPage(1);
    setLocation('/search');
  };

  const dominicanaLocations = [
    "Santo Domingo", "Santiago", "Puerto Plata", "La Romana", "San Pedro de Macorís",
    "La Vega", "San Cristóbal", "Higüey", "Moca", "Baní", "Azua", "Nagua"
  ];

  return (
    <div className="min-h-screen bg-hazzlo-gray-50">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display font-light text-4xl sm:text-5xl text-foreground mb-4 tracking-tight">
              Buscar <span className="font-medium">profesionales</span>
            </h1>
            <p className="text-lg text-hazzlo-gray-600">
              Encuentra expertos verificados en toda República Dominicana
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {/* Main Search Bar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hazzlo-gray-400 h-5 w-5" />
                    <Input
                      placeholder="¿Qué servicio necesitas?"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 lg:w-auto">
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-12 w-full sm:w-48">
                      <MapPin className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las ubicaciones</SelectItem>
                      {dominicanaLocations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={handleSearch}
                    className="hazzlo-gradient h-12 px-8"
                  >
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? 'Ocultar filtros' : 'Más filtros'}
                </Button>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-hazzlo-gray-600">Ordenar por:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating">Mejor calificación</SelectItem>
                      <SelectItem value="reviews">Más reseñas</SelectItem>
                      <SelectItem value="newest">Más recientes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 pt-6 border-t border-hazzlo-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-hazzlo-gray-700 mb-2">
                        Categoría
                      </label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todas las categorías" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todas las categorías</SelectItem>
                          {categories?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button onClick={handleSearch} className="hazzlo-gradient">
                      Aplicar filtros
                    </Button>
                    <Button variant="outline" onClick={clearFilters}>
                      Limpiar filtros
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Filters */}
          {(searchQuery || selectedCategory || selectedLocation) && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-hazzlo-gray-600">Filtros activos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  "{searchQuery}"
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:bg-hazzlo-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  {categories?.find((c: any) => c.id === selectedCategory)?.name}
                  <button 
                    onClick={() => setSelectedCategory("")}
                    className="ml-1 hover:bg-hazzlo-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedLocation && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedLocation}
                  <button 
                    onClick={() => setSelectedLocation("")}
                    className="ml-1 hover:bg-hazzlo-gray-300 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}

          {/* Results */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults?.professionals?.length > 0 ? (
            <>
              {/* Results Summary */}
              <div className="flex justify-between items-center mb-6">
                <p className="text-hazzlo-gray-600">
                  Mostrando {searchResults.professionals.length} de {searchResults.total} profesionales
                </p>
                {searchResults.total > 0 && (
                  <p className="text-sm text-hazzlo-gray-500">
                    Página {currentPage} de {searchResults.totalPages}
                  </p>
                )}
              </div>

              {/* Professional Cards Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {searchResults.professionals.map((professional: any) => (
                  <ProfessionalCardElegant key={professional.id} professional={professional} />
                ))}
              </div>

              {/* Pagination */}
              {searchResults.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, searchResults.totalPages))].map((_, i) => {
                      const pageNumber = i + 1;
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={currentPage === pageNumber ? "hazzlo-gradient" : ""}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(Math.min(searchResults.totalPages, currentPage + 1))}
                    disabled={currentPage === searchResults.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="text-center py-16">
              <CardContent>
                <Search className="h-16 w-16 text-hazzlo-gray-400 mx-auto mb-6" />
                <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                  No se encontraron profesionales
                </h3>
                <p className="text-hazzlo-gray-600 mb-6">
                  Intenta ajustar tus filtros de búsqueda para encontrar más resultados.
                </p>
                <Button onClick={clearFilters} className="hazzlo-gradient">
                  Limpiar filtros
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
