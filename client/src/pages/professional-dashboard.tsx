import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { useSearch } from "wouter";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProfessionalProfileWizard from "@/components/professional-profile-wizard-new";
import ChatSystem from "@/components/chat-websocket";
import BusinessImagesManager from "@/components/business-images-manager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  BarChart3, 
  Users, 
  Star, 
  Calendar, 
  Plus, 
  MapPin, 
  Phone, 
  Globe, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageCircle, 
  TrendingUp, 
  DollarSign,
  Eye,
  Edit,
  Shield,
  Images,
  Trash2,
  Award,
  MousePointer,
  Camera,
  Settings,
  User
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const serviceFormSchema = z.object({
  categoryId: z.string().min(1, "Seleccione una categoría"),
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  priceFrom: z.string().min(1, "Ingrese un precio"),
  priceTo: z.string().optional(),
  duration: z.string().optional(),
});

const portfolioFormSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  projectUrl: z.string().optional().refine((val) => !val || z.string().url().safeParse(val).success, {
    message: "Ingrese una URL válida"
  }),
});

export default function ProfessionalDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();
  const isMobile = useIsMobile();
  const [showWizard, setShowWizard] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
  const [businessImagesOpen, setBusinessImagesOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editServiceOpen, setEditServiceOpen] = useState(false);
  const [editPortfolioOpen, setEditPortfolioOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [showMetrics, setShowMetrics] = useState(false);
  
  // Handle URL parameters for chat navigation
  const urlParams = new URLSearchParams(search);
  const tabParam = urlParams.get('tab');
  const conversationParam = urlParams.get('conversation');
  const [activeTab, setActiveTab] = useState(tabParam === 'chat' ? 'chat' : 'requests');

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "No autorizado",
        description: "Debes iniciar sesión para acceder al dashboard.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const { data: serviceRequests = [] } = useQuery({
    queryKey: ['/api/service-requests/professional'],
    enabled: !!user?.professional,
    queryFn: () => fetch('/api/service-requests/professional').then(r => r.json()),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/professionals', user?.professional?.id, 'services'],
    enabled: !!user?.professional?.id,
    queryFn: () => fetch(`/api/professionals/${user?.professional?.id}/services`).then(r => r.json()),
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ['/api/professionals', user?.professional?.id, 'portfolio'],
    enabled: !!user?.professional?.id,
    queryFn: () => fetch(`/api/professionals/${user?.professional?.id}/portfolio`).then(r => r.json()),
  });

  const { data: verificationRequest } = useQuery({
    queryKey: ['/api/verification-requests/my'],
    enabled: !!user?.professional,
    queryFn: () => fetch('/api/verification-requests/my').then(r => r.json()),
  });

  const { data: profileClicks } = useQuery({
    queryKey: ['/api/professionals', user?.professional?.id, 'clicks'],
    enabled: !!user?.professional?.id,
    queryFn: () => fetch(`/api/professionals/${user?.professional?.id}/clicks`).then(r => r.json()),
  });

  const createServiceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      priceFrom: "",
      priceTo: "",
      duration: "",
    },
  });

  const portfolioForm = useForm<z.infer<typeof portfolioFormSchema>>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      projectUrl: "",
    },
  });

  const editServiceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      categoryId: "",
      title: "",
      description: "",
      priceFrom: "",
      priceTo: "",
      duration: "",
    },
  });

  const editPortfolioForm = useForm<z.infer<typeof portfolioFormSchema>>({
    resolver: zodResolver(portfolioFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      projectUrl: "",
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceFormSchema>) => {
      return await apiRequest('/api/services', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Servicio creado!",
        description: "Tu nuevo servicio ha sido agregado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', user?.professional?.id, 'services'] });
      setCreateServiceOpen(false);
      createServiceForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo crear el servicio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const addPortfolioMutation = useMutation({
    mutationFn: async (data: z.infer<typeof portfolioFormSchema>) => {
      let portfolioData = data;
      
      // Upload image if file is selected
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
          const uploadResponse = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          });
          
          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            portfolioData.imageUrl = uploadResult.url;
          }
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }
      
      return await apiRequest('/api/portfolio', {
        method: 'POST',
        body: portfolioData
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Elemento agregado!",
        description: "El elemento se agregó a tu portafolio exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', user?.professional?.id, 'portfolio'] });
      setAddPortfolioOpen(false);
      portfolioForm.reset();
      setImageFile(null);
      setImagePreview("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo agregar el elemento al portafolio. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateRequestStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: string }) => {
      return await apiRequest(`/api/service-requests/${requestId}/status`, {
        method: 'PUT',
        body: { status }
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Estado actualizado!",
        description: "El estado de la solicitud ha sido actualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-requests/professional'] });
      setRequestDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "No autorizado",
          description: "Tu sesión ha expirado. Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la solicitud.",
        variant: "destructive",
      });
    },
  });



  const onCreateService = (data: z.infer<typeof serviceFormSchema>) => {
    createServiceMutation.mutate(data);
  };

  const onAddPortfolio = (data: z.infer<typeof portfolioFormSchema>) => {
    addPortfolioMutation.mutate(data);
  };

  // Get verification status for display
  const getVerificationStatus = () => {
    if (user?.professional?.isVerified) {
      return {
        status: 'verified',
        title: 'Verificado',
        description: 'Cuenta verificada',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        canRequest: false
      };
    }
    
    if (verificationRequest) {
      if (verificationRequest.status === 'pending') {
        return {
          status: 'pending',
          title: 'En revisión',
          description: 'Verificación pendiente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          icon: Clock,
          canRequest: false
        };
      }
      
      if (verificationRequest.status === 'reviewed') {
        return {
          status: 'reviewed',
          title: 'Revisada',
          description: 'Solicitud revisada por administración',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          icon: Eye,
          canRequest: false
        };
      }
    }
    
    return {
      status: 'not_verified',
      title: 'En proceso',
      description: 'Verificación en proceso',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: Shield,
      canRequest: false
    };
  };

  const verificationStatus = getVerificationStatus();

  // Profile image upload mutation
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Compress and resize the image before converting to base64
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Set maximum dimensions
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality
        };
        
        img.onerror = reject;
        
        // Convert file to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return await apiRequest("/api/users/upload-profile-image", {
        method: "POST",
        body: {
          imageData: compressedBase64,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      });
      setSelectedProfileImage(null);
      // Force refresh to show new image immediately
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil. Inténtalo más tarde.",
        variant: "destructive",
      });
    },
  });

  const handleProfileImageUpload = () => {
    if (selectedProfileImage) {
      uploadProfileImageMutation.mutate(selectedProfileImage);
    }
  };

  // Edit service mutation
  const editServiceMutation = useMutation({
    mutationFn: async (data: { id: string } & z.infer<typeof serviceFormSchema>) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/services/${id}`, {
        method: 'PUT',
        body: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Servicio actualizado!",
        description: "Tu servicio ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      setEditServiceOpen(false);
      setSelectedService(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el servicio.",
        variant: "destructive",
      });
    },
  });

  // Edit portfolio mutation
  const editPortfolioMutation = useMutation({
    mutationFn: async (data: { id: string } & z.infer<typeof portfolioFormSchema>) => {
      const { id, ...updateData } = data;
      return await apiRequest(`/api/portfolio/${id}`, {
        method: 'PUT',
        body: updateData
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Portfolio actualizado!",
        description: "Tu proyecto ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
      setEditPortfolioOpen(false);
      setSelectedPortfolio(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proyecto.",
        variant: "destructive",
      });
    },
  });

  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/portfolio/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Proyecto eliminado!",
        description: "El proyecto ha sido eliminado de tu portfolio.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto.",
        variant: "destructive",
      });
    },
  });

  const onEditService = (data: z.infer<typeof serviceFormSchema>) => {
    if (selectedService) {
      editServiceMutation.mutate({ id: selectedService.id, ...data });
    }
  };

  const onEditPortfolio = (data: z.infer<typeof portfolioFormSchema>) => {
    if (selectedPortfolio) {
      editPortfolioMutation.mutate({ id: selectedPortfolio.id, ...data });
    }
  };

  // Update form defaults when selectedService changes
  useEffect(() => {
    if (selectedService) {
      editServiceForm.reset({
        categoryId: selectedService.categoryId,
        title: selectedService.title,
        description: selectedService.description,
        priceFrom: selectedService.priceFrom?.toString() || "",
        priceTo: selectedService.priceTo?.toString() || "",
        duration: selectedService.duration?.toString() || "",
      });
    }
  }, [selectedService, editServiceForm]);

  // Update form defaults when selectedPortfolio changes
  useEffect(() => {
    if (selectedPortfolio) {
      editPortfolioForm.reset({
        title: selectedPortfolio.title,
        description: selectedPortfolio.description || "",
        imageUrl: selectedPortfolio.imageUrl || "",
        projectUrl: selectedPortfolio.projectUrl || "",
      });
    }
  }, [selectedPortfolio, editPortfolioForm]);

  const handleRequestAction = (status: string) => {
    if (selectedRequest) {
      updateRequestStatusMutation.mutate({ requestId: selectedRequest.id, status });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user?.professional) {
    return (
      <>
        {showWizard ? (
          <ProfessionalProfileWizard 
            onComplete={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
          />
        ) : (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            
            <div className={`${isMobile ? 'pt-32 pb-16 px-4' : 'pt-40 pb-32 px-4 sm:px-6 lg:px-8'}`}>
              <div className={`${isMobile ? 'w-full' : 'max-w-6xl mx-auto'}`}>
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                  <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center mx-auto ${isMobile ? 'mb-6' : 'mb-8'}`}>
                    <Users className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} text-white`} />
                  </div>
                  
                  <h1 className={`font-display font-medium ${isMobile ? 'text-2xl' : 'text-4xl lg:text-5xl'} text-gray-900 dark:text-white ${isMobile ? 'mb-4' : 'mb-6'} tracking-tight`}>
                    Crea tu perfil <span className="font-semibold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">profesional</span>
                  </h1>
                  <p className={`${isMobile ? 'text-base' : 'text-lg lg:text-xl'} text-gray-600 dark:text-gray-400 ${isMobile ? 'mb-8' : 'mb-10'} ${isMobile ? 'max-w-md mx-auto leading-relaxed' : 'max-w-2xl mx-auto leading-relaxed'}`}>
                    Únete a miles de profesionales en Hazzlo y comienza a recibir clientes de toda República Dominicana
                  </p>
                  
                  <Button 
                    size={isMobile ? "lg" : "lg"}
                    className={`bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transition-all duration-300 ${isMobile ? 'px-6 py-3 text-base w-full max-w-sm' : 'px-10 py-3 text-lg'}`}
                    onClick={() => setShowWizard(true)}
                  >
                    Crear mi perfil profesional
                  </Button>
                </div>

                {/* Features Grid */}
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'md:grid-cols-3 gap-8'} mb-16`}>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mb-6">
                      <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-3">Perfil verificado</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Gana credibilidad y confianza con nuestro sistema de verificación de identidad y experiencia profesional
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-3">Analytics avanzados</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Rastrea métricas importantes, visualiza el crecimiento de tu negocio y optimiza tu estrategia
                    </p>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-6">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-3">Más clientes</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      Conecta con miles de usuarios activos que buscan servicios profesionales todos los días
                    </p>
                  </div>
                </div>

                {/* Benefits Section */}
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-lg border border-gray-200 dark:border-gray-700 mb-16">
                  <div className="text-center mb-12">
                    <h2 className="font-display font-light text-3xl lg:text-4xl text-gray-900 dark:text-white mb-4">
                      ¿Por qué elegir <span className="font-medium">Hazzlo</span>?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                      La plataforma líder en República Dominicana para profesionales independientes
                    </p>
                  </div>
                  
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'md:grid-cols-2 gap-12'}`}>
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Proceso de verificación confiable</h3>
                          <p className="text-gray-600 dark:text-gray-400">Validamos tu identidad y experiencia para generar confianza con los clientes</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Crecimiento garantizado</h3>
                          <p className="text-gray-600 dark:text-gray-400">Los profesionales en Hazzlo aumentan sus ingresos en promedio 40% en los primeros 6 meses</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Conexiones Seguras</h3>
                          <p className="text-gray-600 dark:text-gray-400">Nuestros profesionales son inspeccionados antes ofrecer servicios</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <MessageCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Comunicación directa</h3>
                          <p className="text-gray-600 dark:text-gray-400">Chat integrado para comunicarte directamente con tus clientes potenciales</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Star className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Sistema de reseñas</h3>
                          <p className="text-gray-600 dark:text-gray-400">Construye tu reputación con reseñas auténticas de clientes satisfechos</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                          <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Flexibilidad total</h3>
                          <p className="text-gray-600 dark:text-gray-400">Trabaja en tus propios horarios y establece tus propias tarifas</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <div className={`flex-1 flex flex-col ${isMobile ? 'pt-20 pb-4 px-0' : 'pt-32 pb-20 px-4 sm:px-6 lg:px-8'}`}>
        <div className={`${isMobile ? 'w-full' : 'max-w-7xl mx-auto'} flex flex-col flex-1`}>
          {/* Enhanced Profile Header */}
          <div className={`${isMobile ? 'mx-4 mb-6' : 'mb-8'} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-6 border border-blue-100 dark:border-gray-600`}>
            <div className={`${isMobile ? 'space-y-4' : 'flex items-center justify-between'}`}>
              <div className={`flex ${isMobile ? 'flex-col items-center text-center' : 'items-center gap-6'}`}>
                {/* Profile Picture Section */}
                <div className="relative group">
                  <div className={`${isMobile ? 'w-20 h-20' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-800 shadow-lg`}>
                    {(user as any)?.profileImageUrl ? (
                      <img 
                        src={(user as any).profileImageUrl} 
                        alt="Foto de perfil" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className={`text-white font-semibold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                        {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  {/* Camera overlay */}
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => document.getElementById('profile-image-input')?.click()}>
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <input
                    id="profile-image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedProfileImage(file);
                        handleProfileImageUpload();
                      }
                    }}
                  />
                </div>
                
                <div className={isMobile ? 'mt-4' : ''}>
                  <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900 dark:text-white`}>
                    ¡Hola, {(user as any)?.firstName || 'Usuario'}!
                  </h1>
                  <p className={`${isMobile ? 'text-sm mt-1' : 'text-base mt-2'} text-gray-600 dark:text-gray-300`}>
                    {user.professional?.businessName || 'Tu dashboard profesional'}
                  </p>
                  <div className={`flex ${isMobile ? 'justify-center mt-3' : 'mt-3'} items-center gap-2`}>
                    <verificationStatus.icon className={`h-4 w-4 ${verificationStatus.color}`} />
                    <span className={`text-sm font-medium ${verificationStatus.color}`}>
                      {verificationStatus.title}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={`flex ${isMobile ? 'flex-col w-full mt-4 gap-2' : 'gap-3'}`}>
                <Button 
                  variant="outline"
                  onClick={() => setShowMetrics(true)}
                  className={`${isMobile ? 'w-full' : ''} bg-white dark:bg-gray-800 border-blue-200 dark:border-gray-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700`}
                >
                  <BarChart3 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
                  {isMobile ? "Métricas" : "Ver métricas"}
                </Button>
                
                <Dialog open={businessImagesOpen} onOpenChange={setBusinessImagesOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <Images className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      {isMobile ? "Imágenes" : "Imágenes"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isMobile ? "mx-2 my-4 max-h-[90vh] overflow-auto" : "sm:max-w-[600px]"}>
                    <DialogHeader>
                      <DialogTitle>Imágenes de negocio</DialogTitle>
                      <DialogDescription>
                        Gestiona las imágenes que representan tu negocio. Estas aparecerán en tu perfil profesional.
                      </DialogDescription>
                    </DialogHeader>
                    <BusinessImagesManager professionalId={user?.professional?.id} />
                  </DialogContent>
                </Dialog>
                
                <Dialog open={addPortfolioOpen} onOpenChange={setAddPortfolioOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size={isMobile ? "sm" : "default"}>
                      <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      {isMobile ? "Portfolio" : "Portafolio"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isMobile ? "mx-2 my-4 max-h-[90vh] overflow-auto" : "sm:max-w-[425px]"}>
                    <DialogHeader>
                      <DialogTitle>Agregar al portafolio</DialogTitle>
                      <DialogDescription>
                        Muestra tus mejores trabajos a futuros clientes.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...portfolioForm}>
                      <form onSubmit={portfolioForm.handleSubmit(onAddPortfolio)} className="space-y-4">
                        <FormField
                          control={portfolioForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título del proyecto</FormLabel>
                              <FormControl>
                                <Input placeholder="Mi proyecto increible" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portfolioForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción (opcional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe el proyecto..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portfolioForm.control}
                          name="imageUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Imagen del proyecto</FormLabel>
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        setImageFile(file);
                                        const reader = new FileReader();
                                        reader.onload = (e) => setImagePreview(e.target?.result as string);
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                </div>
                                <p className="text-sm text-muted-foreground">O ingresa una URL de imagen:</p>
                                <Input 
                                  placeholder="https://ejemplo.com/imagen.jpg" 
                                  {...field}
                                  disabled={!!imageFile}
                                />
                                {imagePreview && (
                                  <div className="mt-2">
                                    <img 
                                      src={imagePreview} 
                                      alt="Preview" 
                                      className="w-full h-32 object-cover rounded-md border"
                                    />
                                  </div>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={portfolioForm.control}
                          name="projectUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL del proyecto (opcional)</FormLabel>
                              <FormControl>
                                <Input placeholder="https://ejemplo.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setAddPortfolioOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={addPortfolioMutation.isPending}
                          >
                            {addPortfolioMutation.isPending ? "Agregando..." : "Agregar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog open={createServiceOpen} onOpenChange={setCreateServiceOpen}>
                  <DialogTrigger asChild>
                    <Button size={isMobile ? "sm" : "default"}>
                      <Plus className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
                      {isMobile ? "Servicio" : "Nuevo servicio"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={isMobile ? "mx-2 my-4 max-h-[90vh] overflow-auto" : "sm:max-w-[425px]"}>
                    <DialogHeader>
                      <DialogTitle>Crear nuevo servicio</DialogTitle>
                      <DialogDescription>
                        Agrega un nuevo servicio a tu catálogo.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...createServiceForm}>
                      <form onSubmit={createServiceForm.handleSubmit(onCreateService)} className="space-y-4">
                        <FormField
                          control={createServiceForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categoría</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecciona una categoría" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category: any) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createServiceForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título del servicio</FormLabel>
                              <FormControl>
                                <Input placeholder="Corte de cabello moderno" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createServiceForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descripción</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe tu servicio en detalle..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createServiceForm.control}
                            name="priceFrom"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Precio desde (RD$)</FormLabel>
                                <FormControl>
                                  <Input placeholder="500" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createServiceForm.control}
                            name="duration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Duración (min)</FormLabel>
                                <FormControl>
                                  <Input placeholder="60" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setCreateServiceOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createServiceMutation.isPending}
                          >
                            {createServiceMutation.isPending ? "Creando..." : "Crear servicio"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>


          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className={`space-y-6 flex flex-col flex-1 min-h-0 ${isMobile ? 'w-full px-4' : ''}`}>
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-4 h-10' : 'grid-cols-4'}`}>
              <TabsTrigger value="requests" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Solicitudes" : "Solicitudes"}
              </TabsTrigger>
              <TabsTrigger value="services" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Servicios" : "Servicios"}
              </TabsTrigger>
              <TabsTrigger value="portfolio" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Portfolio" : "Portafolio"}
              </TabsTrigger>
              <TabsTrigger value="chat" className={isMobile ? "text-xs px-2" : ""}>
                {isMobile ? "Chat" : "Mensajes"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className={isMobile ? "w-full" : ""}>
              <Card className="w-full">
                <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Solicitudes de servicios</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    {isMobile ? "Gestiona solicitudes" : "Gestiona las solicitudes de tus clientes"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                  {serviceRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium text-foreground mb-2">No tienes solicitudes</h3>
                      <p className="text-muted-foreground">
                        Las solicitudes de servicios aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {serviceRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">{request.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant={
                                  request.status === 'pending' ? 'default' :
                                  request.status === 'accepted' ? 'secondary' :
                                  request.status === 'completed' ? 'default' : 'destructive'
                                }>
                                  {request.status}
                                </Badge>
                                {request.budget && (
                                  <span className="text-sm text-muted-foreground">
                                    RD$ {request.budget}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setRequestDialogOpen(true);
                                }}
                              >
                                Ver detalles
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className={isMobile ? "w-full" : ""}>
              <Card className="w-full">
                <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Mis servicios</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    {isMobile ? "Catálogo de servicios" : "Gestiona tu catálogo de servicios"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                  {services.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                      <Plus className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-muted-foreground mx-auto mb-4`} />
                      <h3 className={`font-medium text-foreground mb-2 ${isMobile ? 'text-base' : ''}`}>
                        {isMobile ? "No tienes servicios" : "No tienes servicios"}
                      </h3>
                      <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                        {isMobile ? "Agrega tu primer servicio" : "Agrega tu primer servicio para empezar a recibir clientes"}
                      </p>
                      <Button onClick={() => setCreateServiceOpen(true)} size={isMobile ? "sm" : "default"}>
                        {isMobile ? "Crear servicio" : "Crear primer servicio"}
                      </Button>
                    </div>
                  ) : (
                    <div className={`grid ${isMobile ? 'gap-3' : 'gap-4'}`}>
                      {services.map((service: any) => (
                        <div key={service.id} className={`border rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                          <div className={`flex items-center justify-between ${isMobile ? 'flex-col items-start gap-3' : ''}`}>
                            <div className={isMobile ? 'w-full' : ''}>
                              <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{service.title}</h3>
                              <p className={`text-muted-foreground ${isMobile ? 'text-xs mt-1' : 'text-sm'}`}>
                                {service.description}
                              </p>
                              <div className={`flex items-center gap-2 ${isMobile ? 'mt-2' : 'mt-2'}`}>
                                <Badge variant="secondary" className={isMobile ? 'text-xs' : ''}>
                                  RD$ {service.priceFrom}
                                  {service.priceTo && ` - ${service.priceTo}`}
                                </Badge>
                                {service.duration && (
                                  <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    {service.duration} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`flex gap-2 ${isMobile ? 'w-full justify-end' : ''}`}>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedService(service);
                                  setEditServiceOpen(true);
                                }}
                              >
                                <Edit className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className={isMobile ? "w-full" : ""}>
              <Card className="w-full">
                <CardHeader className={isMobile ? "px-4 py-3" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Mi portafolio</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    {isMobile ? "Mejores trabajos" : "Muestra tus mejores trabajos"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-4" : ""}>
                  {portfolio.length === 0 ? (
                    <div className={`text-center ${isMobile ? 'py-6' : 'py-8'}`}>
                      <Eye className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'} text-muted-foreground mx-auto mb-4`} />
                      <h3 className={`font-medium text-foreground mb-2 ${isMobile ? 'text-base' : ''}`}>
                        {isMobile ? "Portfolio vacío" : "Portafolio vacío"}
                      </h3>
                      <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                        {isMobile ? "Agrega tus proyectos" : "Agrega proyectos para mostrar tu trabajo a futuros clientes"}
                      </p>
                      <Button onClick={() => setAddPortfolioOpen(true)} size={isMobile ? "sm" : "default"}>
                        {isMobile ? "Agregar proyecto" : "Agregar primer proyecto"}
                      </Button>
                    </div>
                  ) : (
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}>
                      {portfolio.map((item: any) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden">
                          {item.imageUrl && (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className={`w-full object-cover ${isMobile ? 'h-32' : 'h-48'}`}
                            />
                          )}
                          <div className={isMobile ? "p-3" : "p-4"}>
                            <h3 className={`font-medium mb-2 ${isMobile ? 'text-sm' : ''}`}>{item.title}</h3>
                            {item.description && (
                              <p className={`text-muted-foreground mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              {item.projectUrl && (
                                <a 
                                  href={item.projectUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`text-primary hover:underline ${isMobile ? 'text-xs' : 'text-sm'}`}
                                >
                                  Ver proyecto
                                </a>
                              )}
                              <div className="flex gap-2">
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPortfolio(item);
                                    setEditPortfolioOpen(true);
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    if (confirm("¿Estás seguro de eliminar este proyecto?")) {
                                      deletePortfolioMutation.mutate(item.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className={`space-y-6 ${isMobile ? 'w-full' : ''}`}>
              <Card className="w-full">
                <CardHeader className={isMobile ? "px-4 py-3 flex-shrink-0" : ""}>
                  <CardTitle className={isMobile ? "text-lg" : ""}>Sistema de mensajes</CardTitle>
                  <CardDescription className={isMobile ? "text-sm" : ""}>
                    {isMobile ? "Chat con clientes" : "Chatea con tus clientes en tiempo real"}
                  </CardDescription>
                </CardHeader>
                <CardContent className={isMobile ? "px-4 pb-4" : "p-0"}>
                  <ChatSystem 
                    showSidebar={true} 
                    conversationId={conversationParam || undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de la solicitud</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedRequest.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>
              {selectedRequest.budget && (
                <div>
                  <span className="text-sm font-medium">Presupuesto: </span>
                  <span className="text-sm">RD$ {selectedRequest.budget}</span>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRequestAction('accepted')}
                  disabled={updateRequestStatusMutation.isPending}
                >
                  Aceptar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRequestAction('declined')}
                  disabled={updateRequestStatusMutation.isPending}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={editServiceOpen} onOpenChange={setEditServiceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar servicio</DialogTitle>
            <DialogDescription>
              Actualiza la información de tu servicio
            </DialogDescription>
          </DialogHeader>
          <Form {...editServiceForm}>
            <form onSubmit={editServiceForm.handleSubmit(onEditService)} className="space-y-4">
              <FormField
                control={editServiceForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category: any) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editServiceForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del servicio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editServiceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe tu servicio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editServiceForm.control}
                  name="priceFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio desde</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editServiceForm.control}
                  name="priceTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio hasta (opcional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="500" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editServiceForm.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duración (minutos, opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="60" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditServiceOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editServiceMutation.isPending}>
                  {editServiceMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Portfolio Dialog */}
      <Dialog open={editPortfolioOpen} onOpenChange={setEditPortfolioOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
            <DialogDescription>
              Actualiza la información de tu proyecto
            </DialogDescription>
          </DialogHeader>
          <Form {...editPortfolioForm}>
            <form onSubmit={editPortfolioForm.handleSubmit(onEditPortfolio)} className="space-y-4">
              <FormField
                control={editPortfolioForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título del proyecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del proyecto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPortfolioForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe tu proyecto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPortfolioForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de imagen (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editPortfolioForm.control}
                name="projectUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del proyecto (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditPortfolioOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={editPortfolioMutation.isPending}>
                  {editPortfolioMutation.isPending ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Metrics Modal */}
      <Dialog open={showMetrics} onOpenChange={setShowMetrics}>
        <DialogContent className={`${isMobile ? "mx-2 my-4 max-h-[90vh] overflow-auto" : "sm:max-w-[800px]"}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Métricas y estadísticas
            </DialogTitle>
            <DialogDescription>
              Analiza el rendimiento de tu negocio en Hazzlo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'}`}>
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Servicios</CardTitle>
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{services.length}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Servicios activos</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Aceptados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {serviceRequests.filter((req: any) => req.status === 'accepted').length}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Trabajos aceptados</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {serviceRequests.filter((req: any) => req.status === 'pending').length}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Requieren respuesta</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Calificación</CardTitle>
                  <Star className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{user.professional?.rating || "0.0"}</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Promedio de reseñas</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Performance Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rendimiento</h3>
              <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-3 gap-4'}`}>
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Estado de verificación</CardTitle>
                    <verificationStatus.icon className={`h-4 w-4 ${verificationStatus.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{verificationStatus.title}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{verificationStatus.description}</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Portafolio</CardTitle>
                    <Eye className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{portfolio.length}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Proyectos showcased</p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Clicks obtenidos</CardTitle>
                    <MousePointer className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{profileClicks?.clickCount || 0}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Vistas al perfil</p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recomendaciones</h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tips para mejorar tu rendimiento</h4>
                    <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                      {services.length === 0 && <li>• Agrega al menos 3 servicios para aparecer más en las búsquedas</li>}
                      {portfolio.length === 0 && <li>• Crea un portafolio con tus mejores trabajos</li>}
                      {!user.professional?.isVerified && <li>• Completa tu verificación para generar más confianza</li>}
                      {serviceRequests.filter((req: any) => req.status === 'pending').length > 0 && <li>• Responde rápidamente a las solicitudes pendientes</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button onClick={() => setShowMetrics(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}