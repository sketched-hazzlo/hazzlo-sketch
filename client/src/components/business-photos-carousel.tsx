import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface BusinessPhotosCarouselProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  businessName?: string;
}

export default function BusinessPhotosCarousel({ photos, isOpen, onClose, businessName }: BusinessPhotosCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextPhoto();
    if (e.key === 'ArrowLeft') prevPhoto();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!photos || photos.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-none max-h-none w-screen h-screen p-0 bg-black/95 backdrop-blur-xl border-0 rounded-none"
      >
        {/* Optimized background with Apple-style blur */}
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          }}
        />
        
        {/* Clean gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />

        {/* Minimalist header */}
        <div className="absolute top-0 left-0 right-0 z-50 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white/90 text-sm font-medium tracking-wide">
                {businessName || "Fotos del negocio"}
              </h3>
              <p className="text-white/50 text-xs mt-1">
                {currentIndex + 1} de {photos.length}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 p-0 transition-all duration-200"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main image container with Apple-style presentation */}
        <div className="relative w-full h-full flex items-center justify-center p-8 pt-20 pb-20">
          <div className="relative max-w-6xl max-h-full">
            <img
              src={photos[currentIndex]}
              alt={`${businessName || "Negocio"} - Foto ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-all duration-300 ease-out"
              loading="eager"
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))',
              }}
            />
            {/* Preload next/previous images for smooth navigation */}
            {photos.length > 1 && (
              <>
                <img
                  src={photos[(currentIndex + 1) % photos.length]}
                  alt="Preload next"
                  className="hidden"
                  loading="lazy"
                />
                <img
                  src={photos[(currentIndex - 1 + photos.length) % photos.length]}
                  alt="Preload previous"
                  className="hidden"
                  loading="lazy"
                />
              </>
            )}
          </div>
        </div>

        {/* Elegant navigation buttons */}
        {photos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="absolute left-8 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-14 h-14 p-0 transition-all duration-200 backdrop-blur-sm"
              onClick={prevPhoto}
              disabled={photos.length <= 1}
            >
              <ChevronLeft className="h-7 w-7" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="absolute right-8 top-1/2 -translate-y-1/2 z-40 text-white/70 hover:text-white hover:bg-white/10 rounded-full w-14 h-14 p-0 transition-all duration-200 backdrop-blur-sm"
              onClick={nextPhoto}
              disabled={photos.length <= 1}
            >
              <ChevronRight className="h-7 w-7" />
            </Button>
          </>
        )}

        {/* Elegant dots indicator */}
        {photos.length > 1 && photos.length <= 8 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-xl rounded-full px-6 py-3">
              {photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`transition-all duration-300 ease-out ${
                    index === currentIndex 
                      ? 'w-8 h-2 bg-white rounded-full' 
                      : 'w-2 h-2 bg-white/40 rounded-full hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Thumbnail strip for many photos */}
        {photos.length > 8 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 max-w-4xl">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl rounded-2xl px-4 py-3 overflow-x-auto">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden transition-all duration-300 ${
                    index === currentIndex 
                      ? 'ring-2 ring-white scale-110 shadow-lg' 
                      : 'ring-1 ring-white/20 hover:ring-white/40 hover:scale-105'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Swipe indicators for mobile */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 md:hidden">
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <div className="w-6 h-1 bg-white/20 rounded-full" />
            <span>Desliza para navegar</span>
            <div className="w-6 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}