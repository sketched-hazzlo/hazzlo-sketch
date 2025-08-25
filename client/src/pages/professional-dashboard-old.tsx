import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ProfessionalProfileWizard from "@/components/professional-profile-wizard";
import ChatSystem from "@/components/chat-system";
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
import { BarChart3, Users, Star, Calendar, Plus, MapPin, Phone, Globe, CheckCircle, Clock, AlertCircle, MessageCircle, TrendingUp, DollarSign } from "lucide-react";

const professionalFormSchema = z.object({
  businessName: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  phone: z.string().min(10, "Ingrese un número de teléfono válido"),
  location: z.string().min(2, "Ingrese su ubicación"),
  address: z.string().optional(),
  website: z.string().url("Ingrese una URL válida").optional().or(z.literal("")),
});

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
  imageUrl: z.string().url("Ingrese una URL válida de imagen").optional().or(z.literal("")),
  projectUrl: z.string().url("Ingrese una URL válida").optional().or(z.literal("")),
});

export default function ProfessionalDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [addPortfolioOpen, setAddPortfolioOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const { data: serviceRequests } = useQuery({
    queryKey: ['/api/service-requests/professional'],
    enabled: !!user?.professional,
  });

  const { data: services } = useQuery({
    queryKey: ['/api/professionals', user?.professional?.id, 'services'],
    enabled: !!user?.professional?.id,
    queryFn: () => fetch(`/api/professionals/${user?.professional?.id}/services`).then(r => r.json()),
  });

  const createProfessionalForm = useForm<z.infer<typeof professionalFormSchema>>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues: {
      businessName: "",
      description: "",
      phone: "",
      location: "",
      address: "",
      website: "",
    },
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

  const createProfessionalMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalFormSchema>) => {
      const response = await apiRequest('POST', '/api/professionals', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Perfil creado!",
        description: "Tu perfil profesional ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setCreateProfileOpen(false);
      createProfessionalForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo crear el perfil profesional. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof serviceFormSchema>) => {
      const response = await apiRequest('POST', '/api/services', data);
      return response.json();
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
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
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

  const onCreateProfessional = (data: z.infer<typeof professionalFormSchema>) => {
    createProfessionalMutation.mutate(data);
  };

  const onCreateService = (data: z.infer<typeof serviceFormSchema>) => {
    createServiceMutation.mutate(data);
  };

  const addPortfolioMutation = useMutation({
    mutationFn: async (data: z.infer<typeof portfolioFormSchema>) => {
      const response = await apiRequest('POST', '/api/portfolio', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Elemento agregado!",
        description: "El elemento se agregó a tu portafolio exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', user?.professional?.id, 'portfolio'] });
      setAddPortfolioOpen(false);
      portfolioForm.reset();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
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
      const response = await apiRequest('PUT', `/api/service-requests/${requestId}/status`, { status });
      return response.json();
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
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
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

  const onAddPortfolio = (data: z.infer<typeof portfolioFormSchema>) => {
    addPortfolioMutation.mutate(data);
  };

  const handleRequestAction = (status: string) => {
    if (selectedRequest) {
      updateRequestStatusMutation.mutate({ requestId: selectedRequest.id, status });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-hazzlo-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-hazzlo-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-hazzlo-gray-600">Cargando...</p>
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
          <div className="min-h-screen bg-background">
            <Navbar />
            
            <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="bg-white rounded-3xl p-12 shadow-xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                  
                  <h1 className="font-display font-light text-4xl text-foreground mb-4">
                    Crea tu perfil <span className="font-medium">profesional</span>
                  </h1>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Únete a miles de profesionales en Hazzlo y comienza a recibir clientes de toda República Dominicana.
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white px-8 py-3 text-lg"
                    onClick={() => setShowWizard(true)}
                  >
                    Crear mi perfil profesional
                  </Button>
              
              <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-hazzlo-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Perfil verificado</h3>
                    <p className="text-sm text-hazzlo-gray-600">Gana credibilidad con la verificación de identidad</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-hazzlo-blue mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Analytics avanzados</h3>
                    <p className="text-sm text-hazzlo-gray-600">Rastrea métricas y el crecimiento de tu negocio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-hazzlo-green mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Más clientes</h3>
                    <p className="text-sm text-hazzlo-gray-600">Conecta con miles de usuarios activos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hazzlo-gray-50">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-display font-light text-4xl text-foreground mb-2">
                  Panel de control
                </h1>
                <p className="text-lg text-hazzlo-gray-600">
                  Gestiona tu negocio y servicios en Hazzlo
                </p>
              </div>
              
              <div className="flex gap-3 mt-4 sm:mt-0">
                <Dialog open={addPortfolioOpen} onOpenChange={setAddPortfolioOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Portafolio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
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
                              <FormLabel>URL de imagen</FormLabel>
                              <FormControl>
                                <Input placeholder="https://ejemplo.com/imagen.jpg" {...field} />
                              </FormControl>
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
                                <Input placeholder="https://proyecto.com" {...field} />
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
                            className="hazzlo-gradient"
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
                    <Button className="hazzlo-gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Agregar nuevo servicio</DialogTitle>
                      <DialogDescription>
                        Describe el servicio que ofreces.
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
                          control={createServiceForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Título del servicio</FormLabel>
                              <FormControl>
                                <Input placeholder="Corte de cabello profesional" {...field} />
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
                                  placeholder="Describe en detalle tu servicio..."
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
                                <FormLabel>Precio desde (DOP)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="1000" {...field} />
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
                                  <Input type="number" placeholder="60" {...field} />
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
                            className="hazzlo-gradient"
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

          {/* Request Management Dialog */}
          <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Gestionar solicitud</DialogTitle>
                <DialogDescription>
                  Revisa los detalles y toma una acción sobre esta solicitud.
                </DialogDescription>
              </DialogHeader>
              {selectedRequest && (
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{selectedRequest.title}</h3>
                    <p className="text-sm text-hazzlo-gray-600 mb-3">{selectedRequest.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedRequest.budget && (
                        <div>
                          <span className="font-medium">Presupuesto:</span> ${selectedRequest.budget} DOP
                        </div>
                      )}
                      {selectedRequest.scheduledDate && (
                        <div>
                          <span className="font-medium">Fecha:</span> {new Date(selectedRequest.scheduledDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-sm font-medium">Estado actual:</span>
                      <Badge className="ml-2" variant={selectedRequest.status === 'pending' ? 'secondary' : 'default'}>
                        {selectedRequest.status === 'pending' ? 'Pendiente' : 
                         selectedRequest.status === 'accepted' ? 'Aceptada' :
                         selectedRequest.status === 'declined' ? 'Rechazada' :
                         selectedRequest.status === 'completed' ? 'Completada' : 'Cancelada'}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleRequestAction('accepted')}
                        disabled={updateRequestStatusMutation.isPending}
                      >
                        Aceptar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleRequestAction('declined')}
                        disabled={updateRequestStatusMutation.isPending}
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                  
                  {selectedRequest.status === 'accepted' && (
                    <Button 
                      className="w-full hazzlo-gradient"
                      onClick={() => handleRequestAction('completed')}
                      disabled={updateRequestStatusMutation.isPending}
                    >
                      Marcar como completado
                    </Button>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Servicios completados</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.professional.completedServices || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación promedio</CardTitle>
                <Star className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.professional.rating || "0.0"}</div>
                <p className="text-xs text-muted-foreground">
                  {user.professional.reviewCount || 0} reseñas
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes pendientes</CardTitle>
                <Clock className="h-4 w-4 text-hazzlo-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(serviceRequests) ? serviceRequests.filter((req: any) => req.status === 'pending').length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requieren atención
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado del perfil</CardTitle>
                {user.professional.isVerified ? (
                  <CheckCircle className="h-4 w-4 text-hazzlo-green" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">
                  {user.professional.isVerified ? "Verificado" : "Pendiente"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.professional.isVerified ? "Perfil verificado" : "Verificación en proceso"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard Tabs */}
          <Tabs defaultValue="requests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requests">Solicitudes</TabsTrigger>
              <TabsTrigger value="services">Mis Servicios</TabsTrigger>
              <TabsTrigger value="portfolio">Portafolio</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de servicio</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes que has recibido de clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {serviceRequests && serviceRequests.length > 0 ? (
                    <div className="space-y-4">
                      {serviceRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4 hover:bg-hazzlo-gray-50 smooth-transition">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-foreground">{request.title}</h3>
                                <Badge variant={request.status === 'pending' ? 'secondary' : 
                                              request.status === 'accepted' ? 'default' :
                                              request.status === 'completed' ? 'outline' : 'destructive'}>
                                  {request.status === 'pending' ? 'Pendiente' : 
                                   request.status === 'accepted' ? 'Aceptada' :
                                   request.status === 'declined' ? 'Rechazada' :
                                   request.status === 'completed' ? 'Completada' : 'Cancelada'}
                                </Badge>
                              </div>
                              <p className="text-sm text-hazzlo-gray-600 mb-3 line-clamp-2">{request.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-hazzlo-gray-500">
                                {request.budget && (
                                  <span>Presupuesto: ${request.budget} DOP</span>
                                )}
                                {request.scheduledDate && (
                                  <span>Fecha: {new Date(request.scheduledDate).toLocaleDateString()}</span>
                                )}
                                <span>Creada: {new Date(request.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No hay solicitudes</h3>
                      <p className="text-hazzlo-gray-600">Cuando los clientes te contacten, aparecerán aquí.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services">
              <Card>
                <CardHeader>
                  <CardTitle>Mis servicios</CardTitle>
                  <CardDescription>
                    Gestiona los servicios que ofreces en tu perfil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {services && services.length > 0 ? (
                    <div className="space-y-4">
                      {services.map((service: any) => (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                              <p className="text-sm text-hazzlo-gray-600 mb-3">{service.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-hazzlo-gray-500">
                                <span>Desde ${service.priceFrom} DOP</span>
                                {service.duration && <span>{service.duration} min</span>}
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                              <Button size="sm" variant="destructive">
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BarChart3 className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                      <h3 className="font-semibold text-foreground mb-2">No tienes servicios</h3>
                      <p className="text-hazzlo-gray-600 mb-4">Agrega servicios para que los clientes puedan contactarte.</p>
                      <Button onClick={() => setCreateServiceOpen(true)} className="hazzlo-gradient">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar servicio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle>Mi portafolio</CardTitle>
                  <CardDescription>
                    Muestra tus mejores trabajos para impresionar a futuros clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">Portafolio vacío</h3>
                    <p className="text-hazzlo-gray-600 mb-4">Agrega trabajos anteriores para mostrar tu experiencia.</p>
                    <Button onClick={() => setAddPortfolioOpen(true)} className="hazzlo-gradient">
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar proyecto
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics y estadísticas</CardTitle>
                  <CardDescription>
                    Revisa el rendimiento de tu perfil y servicios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Resumen este mes</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-hazzlo-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Vistas del perfil</span>
                          <span className="font-semibold">12</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-hazzlo-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Solicitudes recibidas</span>
                          <span className="font-semibold">{serviceRequests?.length || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-hazzlo-gray-50 rounded-lg">
                          <span className="text-sm font-medium">Tasa de conversión</span>
                          <span className="font-semibold">23%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Servicios más solicitados</h4>
                      <div className="text-center py-8 text-hazzlo-gray-500">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Datos disponibles cuando tengas más actividad</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="requests">Solicitudes</TabsTrigger>
              <TabsTrigger value="services">Mis servicios</TabsTrigger>
              <TabsTrigger value="profile">Mi perfil</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Solicitudes de servicios</CardTitle>
                  <CardDescription>
                    Gestiona las solicitudes de tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {serviceRequests && serviceRequests.length > 0 ? (
                    <div className="space-y-4">
                      {serviceRequests.map((request: any) => (
                        <div key={request.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium text-foreground">{request.title}</h3>
                              <p className="text-sm text-hazzlo-gray-600 mt-1">{request.description}</p>
                            </div>
                            <Badge 
                              variant={request.status === 'pending' ? 'default' : 
                                      request.status === 'accepted' ? 'secondary' : 'outline'}
                            >
                              {request.status}
                            </Badge>
                          </div>
                          {request.budget && (
                            <p className="text-sm text-hazzlo-gray-600">
                              Presupuesto: ${request.budget} DOP
                            </p>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" className="hazzlo-gradient">
                              Aceptar
                            </Button>
                            <Button size="sm" variant="outline">
                              Declinar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                      <p className="text-hazzlo-gray-600">No hay solicitudes pendientes</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mis servicios</CardTitle>
                  <CardDescription>
                    Administra los servicios que ofreces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {services && services.length > 0 ? (
                    <div className="grid gap-4">
                      {services.map((service: any) => (
                        <div key={service.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-foreground">{service.title}</h3>
                              <p className="text-sm text-hazzlo-gray-600 mt-1">{service.description}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-hazzlo-gray-600">
                                  Desde: ${service.priceFrom} DOP
                                </span>
                                {service.duration && (
                                  <span className="text-sm text-hazzlo-gray-600">
                                    Duración: {service.duration} min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                Editar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Plus className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                      <p className="text-hazzlo-gray-600 mb-4">
                        Aún no tienes servicios registrados
                      </p>
                      <Button 
                        className="hazzlo-gradient"
                        onClick={() => setCreateServiceOpen(true)}
                      >
                        Crear mi primer servicio
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del perfil</CardTitle>
                  <CardDescription>
                    Tu información profesional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-hazzlo-gray-700">Nombre del negocio</label>
                      <p className="text-foreground">{user.professional.businessName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-hazzlo-gray-700">Ubicación</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-hazzlo-gray-500" />
                        <p className="text-foreground">{user.professional.location}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-hazzlo-gray-700">Teléfono</label>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-hazzlo-gray-500" />
                        <p className="text-foreground">{user.professional.phone}</p>
                      </div>
                    </div>
                    {user.professional.website && (
                      <div>
                        <label className="text-sm font-medium text-hazzlo-gray-700">Sitio web</label>
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-hazzlo-gray-500" />
                          <a 
                            href={user.professional.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-hazzlo-blue hover:underline"
                          >
                            {user.professional.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-hazzlo-gray-700">Descripción</label>
                    <p className="text-foreground mt-1">{user.professional.description}</p>
                  </div>
                  <Button className="hazzlo-gradient">
                    Editar perfil
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de rendimiento</CardTitle>
                    <CardDescription>
                      Métricas de tu negocio en Hazzlo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-hazzlo-gray-400 mx-auto mb-4" />
                      <p className="text-hazzlo-gray-600">
                        Las métricas detalladas estarán disponibles próximamente
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
