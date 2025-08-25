import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Shield } from "lucide-react";
import { trackProfileClick } from "@/lib/deviceFingerprint";
import { getProfessionalUrl } from "@/utils/professional-urls";

interface ProfessionalCardFeaturedProps {
  professional: any;
}

export default function ProfessionalCardFeatured({ professional }: ProfessionalCardFeaturedProps) {
  const getSpecializations = () => {
    if (!professional.services || professional.services.length === 0) return [];
    // Get unique categories to avoid duplicates
    const uniqueCategories = Array.from(
      new Set(
        professional.services
          .map((service: any) => service.category?.name || service.title)
          .filter(Boolean)
      )
    );
    return uniqueCategories.slice(0, 2);
  };

  const specializations = getSpecializations();

  const handleViewClick = async () => {
    // Track the click
    await trackProfileClick(professional.id, window.location.pathname);
    // Navigate to professional profile
    window.location.href = getProfessionalUrl(professional);
  };

  return (
    <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-lg transition-all duration-300 rounded-xl">
      <CardContent className="p-6">
        {/* Header with Avatar and Verification */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-2 ring-white dark:ring-gray-700 shadow-sm">
              <AvatarImage 
                src={professional.user?.profileImageUrl} 
                alt={professional.businessName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 text-lg font-medium border border-gray-200 dark:border-gray-600">
                {professional.businessName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            
            {professional.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
              {professional.businessName}
            </h3>
            
            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-emerald-500 fill-current" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">
                  {parseFloat(professional.rating || "0.0").toFixed(1)}
                </span>
              </div>
              <span className="text-gray-400 text-sm">Reputación</span>
            </div>

            {/* Location */}
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate">{professional.location}</span>
            </div>
          </div>
        </div>

        {/* Specializations */}
        {specializations.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {specializations.map((categoryName: string, index: number) => (
                <Badge 
                  key={`category-${index}`}
                  variant="secondary" 
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0"
                >
                  {categoryName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {professional.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
            {professional.description}
          </p>
        )}

        {/* Action Button */}
        <Button 
          variant="outline" 
          className="w-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600"
          onClick={handleViewClick}
          data-testid={`button-view-professional-${professional.id}`}
        >
          Ver ahora
        </Button>
      </CardContent>
    </Card>
  );
}