import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Globe, 
  Briefcase,
  ArrowLeft, 
  ArrowRight,
  Plus,
  Trash2
} from "lucide-react";

interface ProfessionalProfileWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const steps = [
  {
    id: 1,
    title: "Información básica",
    description: "Cuéntanos sobre tu negocio",
    icon: Building2,
  },
  {
    id: 2,
    title: "Contacto y ubicación",
    description: "Datos de contacto",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Servicios y experiencia",
    description: "¿Qué servicios ofreces?",
    icon: Briefcase,
  },
];

export default function ProfessionalProfileWizard({ onComplete, onCancel }: ProfessionalProfileWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState("");
  
  // Step 1 data
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  
  // Step 2 data
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  
  // Step 3 data
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState("");
  const [experience, setExperience] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()),
  });

  const createProfessionalMutation = useMutation({
    mutationFn: async () => {
      const professionalData = {
        businessName,
        description,
        phone,
        location,
        address,
        website,
      };
      
      return await apiRequest('/api/professionals', {
        method: 'POST',
        body: professionalData
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Perfil creado con éxito!",
        description: "Tu perfil profesional ha sido creado. Ahora puedes empezar a recibir solicitudes.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear perfil",
        description: error.message || "Hubo un problema al crear tu perfil profesional.",
        variant: "destructive",
      });
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const nextStep = async () => {
    let isValid = true;
    
    switch (currentStep) {
      case 1:
        isValid = !!businessName?.trim() && businessName.trim().length >= 2 && 
                  !!description?.trim() && description.trim().length >= 113;
        if (!isValid) {
          if (!businessName?.trim() || businessName.trim().length < 2) {
            toast({
              title: "Nombre del negocio requerido",
              description: "El nombre del negocio debe tener al menos 2 caracteres",
              variant: "destructive",
            });
          } else if (!description?.trim() || description.trim().length < 113) {
            toast({
              title: "Descripción insuficiente",
              description: "La descripción debe tener al menos 113 caracteres",
              variant: "destructive",
            });
          }
        }
        break;
      case 2:
        isValid = !!phone?.trim() && !!location?.trim();
        if (!isValid) {
          toast({
            title: "Campos requeridos", 
            description: "Por favor completa el teléfono y la ubicación",
            variant: "destructive",
          });
        }
        break;
      case 3:
        isValid = categoryIds.length > 0 && !!experience?.trim();
        if (!isValid) {
          toast({
            title: "Campos requeridos",
            description: "Por favor selecciona al menos una categoría y tu experiencia",
            variant: "destructive",
          });
        }
        break;
    }

    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === steps.length) {
      onSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = () => {
    createProfessionalMutation.mutate();
  };

  const addCertification = () => {
    if (newCertification.trim()) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification("");
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-400 dark:to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Información básica</h3>
              <p className="text-gray-600 dark:text-gray-400">Cuéntanos sobre tu negocio o servicio profesional</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">Nombre del negocio</label>
                <Input 
                  placeholder="Ej: Salón de Belleza María" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  El nombre que los clientes verán en tu perfil
                </p>
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">Descripción del servicio</label>
                <Textarea 
                  placeholder="Describe tu experiencia, especialidades y qué hace único tu servicio..."
                  className="min-h-[120px] resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Una descripción detallada ayuda a los clientes a conocerte mejor (mínimo 113 caracteres)
                  </p>
                  <span className={`text-sm ${description.length >= 113 ? 'text-green-600' : 'text-orange-600'}`}>
                    {description.length}/113
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-400 dark:to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contacto y ubicación</h3>
              <p className="text-gray-600 dark:text-gray-400">Información para que los clientes puedan contactarte</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono
                </label>
                <Input 
                  placeholder="(809) 123-4567" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Ciudad o provincia
                </label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecciona tu ciudad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Santo Domingo">Santo Domingo</SelectItem>
                    <SelectItem value="Santiago">Santiago</SelectItem>
                    <SelectItem value="Puerto Plata">Puerto Plata</SelectItem>
                    <SelectItem value="La Romana">La Romana</SelectItem>
                    <SelectItem value="San Pedro de Macorís">San Pedro de Macorís</SelectItem>
                    <SelectItem value="La Vega">La Vega</SelectItem>
                    <SelectItem value="San Cristóbal">San Cristóbal</SelectItem>
                    <SelectItem value="Higüey">Higüey</SelectItem>
                    <SelectItem value="Moca">Moca</SelectItem>
                    <SelectItem value="Baní">Baní</SelectItem>
                    <SelectItem value="Azua">Azua</SelectItem>
                    <SelectItem value="Nagua">Nagua</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">
                  Dirección (opcional)
                </label>
                <Input 
                  placeholder="Ej: Av. 27 de Febrero #123" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Sitio web (opcional)
                </label>
                <Input 
                  placeholder="https://mi-negocio.com" 
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-400 dark:to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-white dark:text-gray-900" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Servicios y experiencia</h3>
              <p className="text-gray-600 dark:text-gray-400">Define qué servicios ofreces y tu experiencia</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">
                  Categorías de servicio
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category: any) => (
                    <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                      <Checkbox
                        checked={categoryIds.includes(category.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCategoryIds([...categoryIds, category.id]);
                          } else {
                            setCategoryIds(categoryIds.filter(id => id !== category.id));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{category.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Selecciona todas las categorías que apliquen a tu negocio
                </p>
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">Años de experiencia</label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue placeholder="Selecciona tu experiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">0-1 años</SelectItem>
                    <SelectItem value="2-5">2-5 años</SelectItem>
                    <SelectItem value="6-10">6-10 años</SelectItem>
                    <SelectItem value="11-15">11-15 años</SelectItem>
                    <SelectItem value="16+">Más de 16 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">Especialidades (opcional)</label>
                <Textarea 
                  placeholder="Describe tus especialidades, técnicas especiales, o servicios únicos..."
                  className="min-h-[80px] resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                />
              </div>

              <div>
                <label className="text-gray-900 dark:text-white font-medium block mb-2">Certificaciones (opcional)</label>
                <div className="flex gap-2 mb-3">
                  <Input 
                    placeholder="Ej: Certificación en Cosmetología" 
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  <Button type="button" onClick={addCertification} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, index) => (
                      <Badge key={index} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
                        {cert}
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Crear perfil profesional</CardTitle>
              <CardDescription className="text-gray-100">
                Paso {currentStep} de {steps.length}: {steps[currentStep - 1]?.description}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progress} className="h-2 bg-gray-200/30" />
            <div className="flex justify-between mt-2 text-sm text-gray-100">
              {steps.map((step, index) => (
                <div key={step.id} className={`flex items-center ${index + 1 <= currentStep ? 'text-white' : 'text-gray-200'}`}>
                  <step.icon className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </CardContent>
        
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="border-gray-300 dark:border-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={createProfessionalMutation.isPending}
            className="bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700 text-white"
          >
            {createProfessionalMutation.isPending ? (
              "Creando..."
            ) : currentStep === steps.length ? (
              "Crear perfil"
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}