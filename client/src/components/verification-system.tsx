import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Upload, 
  FileText, 
  User, 
  Phone, 
  MapPin,
  Award 
} from "lucide-react";

const verificationFormSchema = z.object({
  idNumber: z.string().min(11, "La cédula debe tener 11 dígitos").max(11, "La cédula debe tener 11 dígitos"),
  businessLicense: z.string().optional(),
  portfolio: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
  references: z.string().min(10, "Proporciona al menos una referencia").optional(),
  experienceYears: z.string().transform((val) => parseInt(val)),
  specializations: z.string().min(5, "Describe tus especializaciones"),
});

interface VerificationSystemProps {
  professional: any;
  isOwner?: boolean;
}

export default function VerificationSystem({ professional, isOwner = false }: VerificationSystemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationOpen, setVerificationOpen] = useState(false);
  
  const verificationForm = useForm<z.infer<typeof verificationFormSchema>>({
    resolver: zodResolver(verificationFormSchema),
    defaultValues: {
      idNumber: "",
      businessLicense: "",
      portfolio: "",
      references: "",
      experienceYears: "",
      specializations: "",
    },
  });

  const submitVerificationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof verificationFormSchema>) => {
      const response = await apiRequest('POST', `/api/professionals/${professional.id}/verify`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "¡Solicitud enviada!",
        description: "Tu solicitud de verificación ha sido enviada. Te contactaremos pronto.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/professionals', professional.id] });
      setVerificationOpen(false);
      verificationForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de verificación. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmitVerification = (data: z.infer<typeof verificationFormSchema>) => {
    submitVerificationMutation.mutate(data);
  };

  const getVerificationStatus = () => {
    if (professional.isVerified) {
      return {
        status: 'verified',
        title: 'Perfil Verificado',
        description: 'Este profesional ha sido verificado por nuestro equipo',
        color: 'bg-green-500',
        icon: CheckCircle,
        progress: 100
      };
    }
    
    if (professional.verificationStatus === 'pending') {
      return {
        status: 'pending',
        title: 'Verificación en Proceso',
        description: 'La verificación está siendo revisada por nuestro equipo',
        color: 'bg-yellow-500',
        icon: Clock,
        progress: 75
      };
    }
    
    if (professional.verificationStatus === 'rejected') {
      return {
        status: 'rejected',
        title: 'Verificación Rechazada',
        description: 'La solicitud necesita correcciones',
        color: 'bg-red-500',
        icon: AlertCircle,
        progress: 25
      };
    }
    
    return {
      status: 'not_started',
      title: 'Sin Verificar',
      description: isOwner ? 'Inicia el proceso de verificación' : 'Este perfil no está verificado',
      color: 'bg-gray-400',
      icon: Shield,
      progress: 0
    };
  };

  const verificationInfo = getVerificationStatus();
  const StatusIcon = verificationInfo.icon;

  const verificationBenefits = [
    {
      icon: Shield,
      title: "Credibilidad aumentada",
      description: "Los clientes confían más en profesionales verificados"
    },
    {
      icon: Award,
      title: "Mejor posicionamiento",
      description: "Apareces primero en los resultados de búsqueda"
    },
    {
      icon: User,
      title: "Más solicitudes",
      description: "Recibe hasta 3x más solicitudes de servicio"
    }
  ];

  return (
    <Card className="border-l-4" style={{ borderLeftColor: verificationInfo.color.replace('bg-', '') }}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 ${verificationInfo.color} rounded-full flex items-center justify-center`}>
              <StatusIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{verificationInfo.title}</CardTitle>
              <CardDescription>{verificationInfo.description}</CardDescription>
            </div>
          </div>
          
          {professional.isVerified && (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verificado
            </Badge>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progreso de verificación</span>
            <span>{verificationInfo.progress}%</span>
          </div>
          <Progress value={verificationInfo.progress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent>
        {!professional.isVerified && isOwner && (
          <div className="space-y-4">
            {/* Benefits */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {verificationBenefits.map((benefit, index) => {
                const BenefitIcon = benefit.icon;
                return (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <BenefitIcon className="h-6 w-6 text-hazzlo-blue mx-auto mb-2" />
                    <h4 className="font-medium text-sm text-gray-900 mb-1">{benefit.title}</h4>
                    <p className="text-xs text-gray-600">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
            
            {/* Action Button */}
            {verificationInfo.status === 'not_started' && (
              <Dialog open={verificationOpen} onOpenChange={setVerificationOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full hazzlo-gradient">
                    <Shield className="h-4 w-4 mr-2" />
                    Iniciar verificación
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Verificación Profesional
                    </DialogTitle>
                    <DialogDescription>
                      Completa la información para verificar tu perfil profesional. Este proceso puede tomar 1-2 días hábiles.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(onSubmitVerification)} className="space-y-4">
                      
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Información Personal
                        </h3>
                        
                        <FormField
                          control={verificationForm.control}
                          name="idNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de Cédula</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="00112345678"
                                  maxLength={11}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Professional Information */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Información Profesional
                        </h3>
                        
                        <FormField
                          control={verificationForm.control}
                          name="experienceYears"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Años de experiencia</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number"
                                  placeholder="5"
                                  min="0"
                                  max="50"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={verificationForm.control}
                          name="specializations"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Especializaciones</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe tus principales especializaciones y habilidades..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={verificationForm.control}
                          name="businessLicense"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Licencia comercial (opcional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Número de licencia o RNC"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* References */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          Referencias y Portafolio
                        </h3>
                        
                        <FormField
                          control={verificationForm.control}
                          name="portfolio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL del portafolio (opcional)</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://mi-portafolio.com"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={verificationForm.control}
                          name="references"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Referencias (opcional)</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Nombre y contacto de referencias profesionales..."
                                  className="min-h-[80px]"
                                  {...field}
                                />
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
                          onClick={() => setVerificationOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          className="hazzlo-gradient"
                          disabled={submitVerificationMutation.isPending}
                        >
                          {submitVerificationMutation.isPending ? "Enviando..." : "Enviar solicitud"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            
            {verificationInfo.status === 'pending' && (
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-yellow-800">
                  Tu solicitud está siendo revisada. Te contactaremos en 1-2 días hábiles.
                </p>
              </div>
            )}
            
            {verificationInfo.status === 'rejected' && (
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-red-800 mb-3">
                  Tu solicitud necesita correcciones. Por favor, revisa la información y vuelve a enviarla.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setVerificationOpen(true)}
                  className="border-red-300 text-red-700"
                >
                  Revisar solicitud
                </Button>
              </div>
            )}
          </div>
        )}
        
        {professional.isVerified && (
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-800">
              Este perfil ha sido verificado por nuestro equipo de expertos.
            </p>
          </div>
        )}
        
        {!isOwner && !professional.isVerified && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Este profesional aún no ha completado el proceso de verificación.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}