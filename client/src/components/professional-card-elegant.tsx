import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Shield } from "lucide-react";
import { trackProfileClick } from "@/lib/deviceFingerprint";
import { getProfessionalUrl } from "@/utils/professional-urls";

interface ProfessionalCardElegantProps {
  professional: any;
}

export default function ProfessionalCardElegant({ professional }: ProfessionalCardElegantProps) {
  // Use business photo as background if available, otherwise use gradient
  const backgroundImage = professional.businessPhotos && professional.businessPhotos.length > 0 
    ? professional.businessPhotos[0] 
    : null;

  const handleCardClick = async () => {
    // Track the click
    await trackProfileClick(professional.id, window.location.pathname);
    // Navigate to professional profile
    window.location.href = getProfessionalUrl(professional);
  };

  const handleViewNowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track the click
    await trackProfileClick(professional.id, window.location.pathname);
    // Navigate to professional profile
    window.location.href = getProfessionalUrl(professional);
  };

  return (
    <Card 
      className="group relative overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-2xl"
      onClick={handleCardClick}
    >
      {/* Background */}
      {backgroundImage ? (
        <div 
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/5 dark:to-gray-800 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
      )}

      <CardContent className="relative p-5">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-gray-700 shadow-sm">
              <AvatarImage 
                src={professional.user?.profileImageUrl} 
                alt={professional.businessName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 text-sm font-medium border border-gray-200 dark:border-gray-600">
                {professional.businessName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {/* Status Badge */}
            {professional.isVerified && (
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate text-sm">
              {professional.businessName}
            </h3>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-1">
              <MapPin className="h-3 w-3 mr-1" />
              <span className="truncate">{professional.location}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 text-emerald-500 fill-current" />
              <span className="font-medium text-gray-900 dark:text-white">
                {parseFloat(professional.rating || "0.0").toFixed(1)}
              </span>
              <span className="text-gray-400">Reputación</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
          {professional.description || "Profesional experimentado comprometido con la excelencia."}
        </p>

        {/* Services Tags */}
        {professional.services && professional.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {(() => {
              // Get unique categories to avoid duplicates
              const uniqueCategories = Array.from(
                new Set(
                  professional.services
                    .map((service: any) => service.category?.name || service.name)
                    .filter(Boolean)
                )
              );
              
              return (
                <>
                  {uniqueCategories.slice(0, 2).map((categoryName: string, index: number) => (
                    <Badge 
                      key={`category-${index}`} 
                      variant="secondary" 
                      className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-0 px-2 py-0.5"
                    >
                      {categoryName}
                    </Badge>
                  ))}
                  {uniqueCategories.length > 2 && (
                    <Badge 
                      variant="secondary" 
                      className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5"
                    >
                      +{uniqueCategories.length - 2}
                    </Badge>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {professional.isPremium && (
              <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white border-0 text-[10px] px-1.5 py-0.5">
                Sponsored
              </Badge>
            )}
            {professional.isOnline && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span>En línea</span>
              </div>
            )}
          </div>
          
          <Button 
            size="sm" 
            variant="ghost"
            className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs px-2 py-1 h-6"
            onClick={handleViewNowClick}
          >
            Ver ahora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}