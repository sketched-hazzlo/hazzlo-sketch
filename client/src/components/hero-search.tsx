import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";

interface HeroSearchProps {
  compact?: boolean;
}

export default function HeroSearch({ compact = false }: HeroSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedLocation) params.set('location', selectedLocation);
    
    window.location.href = `/search${params.toString() ? '?' + params.toString() : ''}`;
  };

  const dominicanaLocations = [
    "Santo Domingo", "Santiago", "Puerto Plata", "La Romana", "San Pedro de Macorís",
    "La Vega", "San Cristóbal", "Higüey", "Moca", "Baní", "Azua", "Nagua"
  ];

  if (compact) {
    return (
      <div className="max-w-2xl mx-auto animate-slide-up">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-lg border border-hazzlo-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-hazzlo-gray-400 dark:text-gray-500 h-4 w-4" />
                <Input
                  placeholder="¿Qué servicio necesitas?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-0 focus:ring-1 focus:ring-hazzlo-blue bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            
            <Button 
              onClick={handleSearch}
              className="hazzlo-gradient hover:opacity-90 w-full sm:w-auto"
            >
              Buscar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mb-8 animate-slide-up">
      <div className="glass-morphism rounded-2xl p-2 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/20 dark:border-gray-700/30">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-hazzlo-gray-400 dark:text-gray-500 h-5 w-5" />
              <Input
                placeholder="¿Qué servicio necesitas?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-700 rounded-xl border-0 focus:ring-2 focus:ring-hazzlo-blue focus:outline-none smooth-transition font-medium text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>
          
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-hazzlo-gray-400 dark:text-gray-500 h-5 w-5 z-10" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-700 rounded-xl border-0 focus:ring-2 focus:ring-hazzlo-blue smooth-transition font-medium text-gray-900 dark:text-white">
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Todas las ubicaciones</SelectItem>
                {dominicanaLocations.map((location) => (
                  <SelectItem key={location} value={location} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleSearch}
            className="hazzlo-gradient hover:opacity-90 hover:scale-105 w-full sm:w-auto px-8 py-4 rounded-xl font-semibold smooth-transition"
          >
            Buscar
          </Button>
        </div>
      </div>

      {/* Popular searches */}
      <div className="mt-6 text-center">
        <p className="text-sm text-hazzlo-gray-500 dark:text-gray-400 mb-3">Búsquedas populares:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['Corte de cabello', 'Desarrollo web', 'Electricista', 'Limpieza', 'Tutorías'].map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchQuery(term);
                setTimeout(handleSearch, 100);
              }}
              className="px-3 py-1 bg-white/80 dark:bg-gray-700/80 hover:bg-white dark:hover:bg-gray-600 text-hazzlo-gray-700 dark:text-gray-200 rounded-full text-sm smooth-transition border border-hazzlo-gray-200 dark:border-gray-600 hover:border-hazzlo-gray-300 dark:hover:border-gray-500"
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
