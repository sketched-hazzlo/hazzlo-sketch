import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import BusinessPhotosCarousel from "@/components/business-photos-carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Shield, 
  Heart, 
  MessageCircle, 
  Calendar,
  DollarSign,
  Clock,
  Award,
  CheckCircle,
  ExternalLink,
  Images,
  Mail,
  User,
  Briefcase,
  Quote,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Sparkles,
} from "lucide-react";
import { ReportButton } from '@/components/report-button';
import { motion, AnimatePresence } from "framer-motion";

const contactFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres"),
  scheduledDate: z.string().optional(),
});

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "El comentario debe tener al menos 10 caracteres"),
});

export default function ProfessionalProfileElegant() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [photosCarouselOpen, setPhotosCarouselOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);

  const { data: professional, isLoading } = useQuery({
    queryKey: ['/api/professionals', id],
    queryFn: () => fetch(`/api/professionals/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: reviews, refetch: refetchReviews } = useQuery({
    queryKey: ['/api/professionals', id, 'reviews'],
    queryFn: () => fetch(`/api/professionals/${id}/reviews`).then(r => r.json()),
    enabled: !!id,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['/api/professionals', id, 'portfolio'],
    queryFn: () => fetch(`/api/professionals/${id}/portfolio`).then(r => r.json()),
    enabled: !!id,
  });

  // Get business images from professional - moved here to avoid hooks order issues
  const { data: businessImages } = useQuery({
    queryKey: ['/api/business-images', id],
    queryFn: () => fetch(`/api/business-images/${id}`).then(r => r.json()),
    enabled: !!id,
  });

  const contactForm = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledDate: "",
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: z.infer<typeof contactFormSchema>) => {
      const requestData = {
        ...data,
        professionalId: id,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      };
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Solicitud enviada!",
        description: "El profesional recibirá tu solicitud y te contactará pronto.",
      });
      setContactDialogOpen(false);
      contactForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Inicia sesión",
          description: "Debes iniciar sesión para contactar profesionales.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo más tarde.",
        variant: "destructive",
      });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewFormSchema>) => {
      const response = await fetch(`/api/professionals/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', id, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', id] });
      refetchReviews();
      toast({
        title: "¡Reseña enviada!",
        description: "Tu reseña ha sido publicada correctamente.",
      });
      setReviewDialogOpen(false);
      reviewForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Inicia sesión",
          description: "Debes iniciar sesión para escribir reseñas.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo enviar la reseña. Inténtalo más tarde.",
        variant: "destructive",
      });
    },
  });

  const onSubmitContact = (data: z.infer<typeof contactFormSchema>) => {
    contactMutation.mutate(data);
  };

  const onSubmitReview = (data: z.infer<typeof reviewFormSchema>) => {
    reviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Hero skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-sm mb-8">
              <div className="h-80 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600"></div>
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex items-end gap-6">
                  <Skeleton className="w-24 h-24 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-1/3 mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/2 mb-4" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="pt-24 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Profesional no encontrado
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                El perfil que buscas no existe o ha sido eliminado.
              </p>
              <Button onClick={() => window.location.href = '/profesionales'}>
                Ver todos los profesionales
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }



  // Filter visible business photos
  const businessPhotos = businessImages?.filter((img: any) => img.isVisible).map((img: any) => img.imageUrl) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gray-800 shadow-sm mb-8">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800"></div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-200/30 to-transparent dark:from-blue-700/20 rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-transparent dark:from-purple-700/20 rounded-full -ml-32 -mb-32"></div>
            
            {/* Content */}
            <div className="relative p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8">
                
                {/* Profile Image */}
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-6 ring-white dark:ring-gray-700 shadow-xl">
                    <AvatarImage 
                      src={professional.user?.profileImageUrl} 
                      alt={professional.businessName}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-100 text-2xl font-bold border border-gray-200 dark:border-gray-600">
                      {professional.businessName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  

                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {professional.businessName}
                  </h1>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600 dark:text-gray-300 mb-3 sm:mb-4 leading-relaxed">
                    {professional.description || "Profesional certificado con amplia experiencia en el área."}
                  </p>
                  
                  {/* Quick stats */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      <span className="font-medium text-xs sm:text-sm">{professional.location}</span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 fill-current" />
                      <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                        {professional.rating || "0.0"}
                      </span>
                      <span className="text-xs sm:text-sm">
                        Reputación
                      </span>
                    </div>

                  </div>
                </div>

                {/* Action Buttons - Mobile optimized horizontal layout */}
                <div className="flex flex-row gap-2 items-center justify-start sm:justify-end w-full sm:w-auto">
                  <ReportButton 
                    reportType="professional_profile" 
                    targetId={professional.id} 
                    variant="icon"
                    className="flex-shrink-0 sm:self-start"
                  />
                  {businessPhotos && businessPhotos.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setPhotosCarouselOpen(true)}
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-white/20 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-lg text-xs px-2 sm:px-4 py-2 flex-1 sm:flex-none"
                    >
                      <Images className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Ver fotos</span>
                      <span className="xs:hidden">Fotos</span>
                      <span className="ml-1">({businessPhotos.length})</span>
                    </Button>
                  )}
                  
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg font-semibold text-xs px-2 sm:px-8 py-2 flex-1 sm:flex-none"
                    onClick={() => {
                      if (user) {
                        window.location.href = `/chat?professional=${professional.id}`;
                      } else {
                        window.location.href = `/auth?redirect=/chat?professional=${professional.id}`;
                      }
                    }}
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Contactar
                  </Button>
                  
                  <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-white/20 hover:bg-white dark:hover:bg-gray-700 text-gray-900 dark:text-white shadow-lg text-xs px-2 sm:px-4 py-2 flex-1 sm:flex-none">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Solicitar</span>
                        <span className="xs:hidden">Servicio</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Contactar a {professional.businessName}</DialogTitle>
                        <DialogDescription>
                          Envía una solicitud de servicio con los detalles de tu proyecto.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...contactForm}>
                        <form onSubmit={contactForm.handleSubmit(onSubmitContact)} className="space-y-4">
                          <FormField
                            control={contactForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Título del proyecto</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ej: Diseño de logo para empresa" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={contactForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                  <Textarea placeholder="Describe tu proyecto en detalle..." {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={contactForm.control}
                            name="scheduledDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fecha deseada (opcional)</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)} className="flex-1">
                              Cancelar
                            </Button>
                            <Button type="submit" disabled={contactMutation.isPending} className="flex-1">
                              {contactMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Services Section */}
              <Card className="overflow-hidden">
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors py-4" onClick={() => setServicesExpanded(!servicesExpanded)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-medium cursor-pointer flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Servicios
                            <ChevronDown className={`h-4 w-4 text-blue-600 dark:text-blue-400 transition-all duration-300 ${servicesExpanded ? 'rotate-180' : ''}`} />
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Conoce todos los servicios que ofrezco</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {servicesExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <CardContent className="p-0">
                      {professional.services && professional.services.length > 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, staggerChildren: 0.1 }}
                          className="space-y-0"
                        >
                          {professional.services.map((service: any, index: number) => (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }} 
                            key={service.id} 
                            className={`p-6 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/30'
                            }`}
                          >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                                {service.title || service.name}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                                {service.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                {service.duration && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>{service.duration} min</span>
                                  </div>
                                )}
                                {service.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {service.category.name}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-6">
                              {service.priceFrom && (
                                <div className="text-base sm:text-lg lg:text-xl font-bold text-blue-600 dark:text-blue-400">
                                  ${parseFloat(service.priceFrom).toLocaleString()}
                                  {service.priceTo && service.priceTo !== service.priceFrom && (
                                    <span className="text-xs sm:text-sm text-gray-500"> - ${parseFloat(service.priceTo).toLocaleString()}</span>
                                  )}
                                </div>
                              )}
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedService(service);
                                  setContactDialogOpen(true);
                                }}
                                className="mt-2"
                              >
                                Solicitar
                              </Button>
                            </div>
                          </div>
                          </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="h-6 w-6 text-gray-400" />
                          </div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Sin servicios registrados
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Este profesional aún no ha publicado servicios específicos.
                          </p>
                        </div>
                      )}
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>

              {/* Portfolio Section */}
              {portfolio && portfolio.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle 
                            className="text-base font-medium cursor-pointer flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                            onClick={() => setPortfolioExpanded(!portfolioExpanded)}
                          >
                            Portfolio
                            <ChevronDown className={`h-4 w-4 text-blue-600 dark:text-blue-400 transition-all duration-300 ${portfolioExpanded ? 'rotate-180' : ''}`} />
                          </CardTitle>
                          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Algunos de mis trabajos más destacados</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <AnimatePresence>
                    {portfolioExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        className="overflow-hidden"
                      >
                        <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {portfolio.map((item: any) => (
                          <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-700">
                            {item.imageUrl && (
                              <div className="aspect-video overflow-hidden">
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2">
                                {item.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.description}
                              </p>
                              {item.projectUrl && (
                                <Button variant="ghost" size="sm" className="p-0 h-auto mt-2">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ver proyecto
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )}

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle 
                          className="text-base font-medium cursor-pointer flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                          onClick={() => setReviewsExpanded(!reviewsExpanded)}
                        >
                          Reseñas
                          <ChevronDown className={`h-4 w-4 text-blue-600 dark:text-blue-400 transition-all duration-300 ${reviewsExpanded ? 'rotate-180' : ''}`} />
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 dark:text-gray-400">Lo que dicen mis clientes</CardDescription>
                      </div>
                    </div>
                    {user && (user as any).userType === "client" && (
                      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Escribir reseña
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Escribir reseña</DialogTitle>
                            <DialogDescription>
                              Comparte tu experiencia con {professional.businessName}
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...reviewForm}>
                            <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-4">
                              <FormField
                                control={reviewForm.control}
                                name="rating"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Calificación</FormLabel>
                                    <FormControl>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => field.onChange(star)}
                                            className="p-1"
                                          >
                                            <Star 
                                              className={`h-6 w-6 ${
                                                star <= field.value 
                                                  ? 'text-green-500 fill-current' 
                                                  : 'text-gray-300'
                                              }`} 
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={reviewForm.control}
                                name="comment"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Comentario</FormLabel>
                                    <FormControl>
                                      <Textarea placeholder="Comparte tu experiencia..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setReviewDialogOpen(false)} className="flex-1">
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={reviewMutation.isPending} className="flex-1">
                                  {reviewMutation.isPending ? "Enviando..." : "Publicar reseña"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <AnimatePresence>
                  {reviewsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden"
                    >
                      <CardContent>
                    {reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-b-0 last:pb-0">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={review.client?.profileImageUrl} />
                              <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                                {review.client?.firstName?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-semibold text-gray-900 dark:text-white">
                                  {review.client?.firstName} {review.client?.lastName}
                                </h5>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating 
                                          ? 'text-green-500 fill-current' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                <Quote className="h-3 w-3 inline mr-1 text-gray-400" />
                                {review.comment}
                              </p>
                              {review.isVerified && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Reseña verificada
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-6 w-6 text-gray-400" />
                      </div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Sin reseñas aún
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        Sé el primero en dejar una reseña para este profesional.
                      </p>
                    </div>
                  )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              
              {/* Contact Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Información de contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professional.phone && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Teléfono</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{professional.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{professional.user?.email}</p>
                    </div>
                  </div>

                  {professional.website && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Sitio web</p>
                        <a 
                          href={professional.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Visitar sitio
                        </a>
                      </div>
                    </div>
                  )}

                  {professional.address && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Dirección</p>
                        <p className="font-semibold text-gray-900 dark:text-white leading-relaxed">{professional.address}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>



              {/* Action Buttons */}
              <div className="space-y-3">
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    navigator.share?.({
                      title: professional.businessName,
                      text: professional.description,
                      url: window.location.href,
                    }) || navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Enlace copiado",
                      description: "El enlace del perfil ha sido copiado al portapapeles.",
                    });
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Compartir negocio
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Photos Carousel */}
      <BusinessPhotosCarousel 
        photos={businessPhotos}
        isOpen={photosCarouselOpen}
        onClose={() => setPhotosCarouselOpen(false)}
        businessName={professional.businessName}
      />

      <Footer />
    </div>
  );
}