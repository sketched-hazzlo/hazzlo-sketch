import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Heart, Shield, ExternalLink, Clock, Award } from "lucide-react";
import { trackProfileClick } from "@/lib/deviceFingerprint";
import { getProfessionalUrl } from "@/utils/professional-urls";

interface ProfessionalCardProps {
  professional: any;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleViewProfile = async () => {
    // Track the click
    await trackProfileClick(professional.id, window.location.pathname);
    // Navigate to professional profile
    window.location.href = getProfessionalUrl(professional);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // TODO: Add favorite functionality with API call
  };

  const getLowestPrice = () => {
    if (!professional.services || professional.services.length === 0) return null;
    const prices = professional.services
      .map((service: any) => parseFloat(service.priceFrom))
      .filter((price: number) => !isNaN(price));
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const lowestPrice = getLowestPrice();

  return (
    <Card className="group overflow-hidden bg-white dark:bg-card border border-gray-100 dark:border-gray-800 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 rounded-3xl">
      <div className="relative">
        {/* Professional Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Avatar className="w-full h-full rounded-none">
            <AvatarImage 
              src={professional.user?.profileImageUrl} 
              alt={professional.businessName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            <AvatarFallback className="w-full h-full rounded-none bg-gradient-to-br from-blue-500 to-purple-600 text-white text-6xl font-display font-bold flex items-center justify-center">
              {professional.businessName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          {/* Overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            {professional.isVerified && (
              <Badge className="bg-emerald-500 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1.5">
                <Shield className="h-3 w-3" />
                Verificado
              </Badge>
            )}
            {professional.isPremium && (
              <Badge className="bg-amber-500 text-white border-0 shadow-lg flex items-center gap-1.5 px-3 py-1.5">
                <Award className="h-3 w-3" />
                Sponsored
              </Badge>
            )}
          </div>
          
          {/* Favorite Button */}
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white shadow-lg transition-all duration-200"
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isFavorited 
                    ? 'text-red-500 fill-current' 
                    : 'text-gray-600 hover:text-red-500'
                }`} 
              />
            </Button>
          </div>

          {/* Quick action button on hover */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Button
              onClick={handleViewProfile}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 px-4 py-2 rounded-full"
            >
              Ver perfil
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {/* Card Content */}
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1">
              {professional.businessName}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {professional.description || "Profesional certificado con amplia experiencia."}
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {professional.rating || "4.8"}
                </span>
                <span className="text-xs text-gray-500">
                  ({professional.reviewCount || "42"})
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{professional.experience || "5+"} años</span>
              </div>
            </div>

            {/* Price */}
            {lowestPrice && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Desde</div>
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  ${lowestPrice}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <MapPin className="h-4 w-4" />
            <span>{professional.location || "Santo Domingo, RD"}</span>
          </div>

          {/* Services or Categories */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(() => {
              // Get unique categories to avoid duplicates
              const uniqueCategories = Array.from(
                new Set(
                  professional.services
                    ?.map((service: any) => service.category?.name || service.name)
                    .filter(Boolean) || []
                )
              );
              
              return (
                <>
                  {uniqueCategories.slice(0, 2).map((categoryName: string, index: number) => (
                    <Badge 
                      key={`category-${index}`} 
                      variant="secondary" 
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 text-xs px-2 py-1"
                    >
                      {categoryName}
                    </Badge>
                  ))}
                  {uniqueCategories.length > 2 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-1 border-gray-300"
                    >
                      +{uniqueCategories.length - 2} más
                    </Badge>
                  )}
                </>
              );
            })()}
          </div>

          {/* Action Button */}
          <Button
            onClick={handleViewProfile}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white font-semibold py-3 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-lg"
          >
            Ver perfil completo
          </Button>
        </CardContent>
      </div>
    </Card>
  );
}
