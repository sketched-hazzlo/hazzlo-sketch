import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Navbar from "@/components/navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Phone, 
  Mail, 
  HelpCircle, 
  Shield, 
  CreditCard, 
  User, 
  Settings,
  Search,
  ArrowRight,
  LifeBuoy
} from "lucide-react";

export default function Ayuda() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  
  const [isChatDialogOpen, setIsChatDialogOpen] = useState(false);
  const [chatSubject, setChatSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaq, setSelectedFaq] = useState<{ question: string; answer: string; category: string } | null>(null);

  // Mutation for submitting help form
  const submitHelpFormMutation = useMutation({
    mutationFn: async (data: typeof contactForm) => {
      const response = await fetch("/api/help/submit", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'No se pudo enviar la consulta');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Consulta enviada", 
        description: "Hemos recibido tu consulta. Te contactaremos pronto." 
      });
      setContactForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo enviar la consulta", 
        variant: "destructive" 
      });
    },
  });

  // Check for existing support chat
  const { data: existingChat } = useQuery({
    queryKey: ["/api/support/my-chat"],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      try {
        const response = await fetch("/api/support/my-chat");
        if (!response.ok) return null;
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: isAuthenticated,
  });

  // Start new support chat
  const startChatMutation = useMutation({
    mutationFn: async (subject: string) => {
      const response = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subject }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'No se pudo iniciar el chat');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Chat iniciado", description: "Un moderador se conectará contigo pronto" });
      setIsChatDialogOpen(false);
      setChatSubject("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "No se pudo iniciar el chat", 
        variant: "destructive" 
      });
    },
  });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitHelpFormMutation.mutate(contactForm);
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:soporte@hazzlo.net';
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:+18094866678';
  };

  const handleStartChat = () => {
    if (!isAuthenticated) {
      toast({ 
        title: "Iniciar sesión requerido", 
        description: "Debes iniciar sesión para usar el chat de soporte",
        variant: "destructive" 
      });
      return;
    }

    if (existingChat) {
      // Redirect to existing chat
      window.location.href = "/chat/support";
      return;
    }

    setIsChatDialogOpen(true);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatSubject.trim()) {
      toast({ 
        title: "Error", 
        description: "Por favor ingresa un asunto para el chat", 
        variant: "destructive" 
      });
      return;
    }
    startChatMutation.mutate(chatSubject.trim());
  };

  // Complete FAQ database with 100 questions
  const allFaqQuestions = [
    // General Questions (25)
    { question: "¿Qué es Hazzlo?", answer: "Hazzlo es una plataforma que conecta clientes con profesionales verificados en República Dominicana. Puedes encontrar servicios de belleza, tecnología, hogar, educación y mucho más.", category: "General" },
    { question: "¿Es gratis usar Hazzlo?", answer: "Sí, buscar y contactar profesionales en Hazzlo es completamente gratis para los clientes. Los profesionales pueden tener diferentes planes de membresía.", category: "General" },
    { question: "¿Cómo funciona la verificación de profesionales?", answer: "Todos los profesionales pasan por un proceso de verificación que incluye validación de identidad, experiencia y referencias antes de ser aprobados en la plataforma.", category: "General" },
    { question: "¿En qué ciudades está disponible Hazzlo?", answer: "Hazzlo está disponible en toda República Dominicana, con mayor concentración de profesionales en Santo Domingo, Santiago y las principales ciudades del país.", category: "General" },
    { question: "¿Cómo me registro en Hazzlo?", answer: "Puedes registrarte fácilmente con tu email, Facebook o Google. Solo llena tu información básica y podrás empezar a usar la plataforma inmediatamente.", category: "General" },
    { question: "¿Puedo usar Hazzlo desde mi móvil?", answer: "Sí, Hazzlo está optimizado para dispositivos móviles y funciona perfectamente desde cualquier navegador en tu teléfono o tablet.", category: "General" },
    { question: "¿Qué tipos de servicios puedo encontrar?", answer: "Encuentra servicios de belleza, tecnología, hogar, salud, educación, eventos, limpieza, reparaciones, diseño y muchos más.", category: "General" },
    { question: "¿Cómo contacto con un profesional?", answer: "Puedes contactar directamente a través de su perfil mediante chat interno, llamada telefónica o WhatsApp según sus preferencias de contacto.", category: "General" },
    { question: "¿Los profesionales están disponibles 24/7?", answer: "Cada profesional maneja sus propios horarios. Puedes ver la disponibilidad en su perfil y contactarlos según sus horarios establecidos.", category: "General" },
    { question: "¿Qué hago si no encuentro lo que busco?", answer: "Puedes publicar tu necesidad específica y los profesionales interesados te contactarán con propuestas personalizadas.", category: "General" },
    { question: "¿Cómo funciona el sistema de calificaciones?", answer: "Los clientes califican a los profesionales después de completar un servicio. Las calificaciones van de 1 a 5 estrellas e incluyen reseñas detalladas.", category: "General" },
    { question: "¿Puedo ver el portafolio de un profesional?", answer: "Sí, cada profesional puede subir fotos de sus trabajos anteriores, certificaciones y testimonios de otros clientes.", category: "General" },
    { question: "¿Qué significa 'profesional verificado'?", answer: "Significa que hemos validado su identidad, experiencia y referencias. Los profesionales verificados tienen una insignia especial en su perfil.", category: "General" },
    { question: "¿Hay una app móvil de Hazzlo?", answer: "Actualmente Hazzlo funciona como web app optimizada para móviles. Una app nativa está en desarrollo para el futuro.", category: "General" },
    { question: "¿Puedo solicitar servicios para el mismo día?", answer: "Depende de la disponibilidad del profesional. Muchos ofrecen servicios urgentes o del mismo día por un costo adicional.", category: "General" },
    { question: "¿Cómo reporto un problema con un profesional?", answer: "Puedes reportar cualquier problema a través de nuestro sistema de reportes en el perfil del profesional o contactando a soporte.", category: "General" },
    { question: "¿Los precios están fijos o son negociables?", answer: "Los profesionales pueden establecer precios fijos o rangos. Siempre puedes solicitar una cotización personalizada para tu proyecto específico.", category: "General" },
    { question: "¿Puedo programar servicios recurrentes?", answer: "Sí, muchos profesionales ofrecen servicios recurrentes como limpieza semanal, mantenimiento mensual o clases regulares.", category: "General" },
    { question: "¿Qué hago si llueve el día de mi servicio?", answer: "Depende del tipo de servicio. Los profesionales suelen tener políticas claras sobre clima y reagendamiento en sus perfiles.", category: "General" },
    { question: "¿Puedo solicitar cotizaciones de varios profesionales?", answer: "Absolutamente, te recomendamos comparar precios y servicios de varios profesionales antes de tomar una decisión.", category: "General" },
    { question: "¿Cómo sé si un profesional es confiable?", answer: "Revisa sus calificaciones, reseñas, verificaciones, portafolio y tiempo en la plataforma. También puedes contactar referencias previas.", category: "General" },
    { question: "¿Puedo cancelar mi cuenta en cualquier momento?", answer: "Sí, puedes cancelar tu cuenta cuando desees desde la configuración de tu perfil o contactando a nuestro equipo de soporte.", category: "General" },
    { question: "¿Hazzlo ofrece garantías en los servicios?", answer: "Hazzlo no ofrece garantías directas, pero trabajamos con los profesionales para resolver cualquier problema y mantener altos estándares de calidad.", category: "General" },
    { question: "¿Puedo trabajar como profesional si vivo fuera de RD?", answer: "Algunos servicios digitales pueden realizarse remotamente, pero la mayoría requieren presencia física en República Dominicana.", category: "General" },
    { question: "¿Cómo manejo las emergencias durante un servicio?", answer: "Para emergencias médicas o de seguridad, contacta inmediatamente los servicios de emergencia locales. Luego reporta el incidente a Hazzlo.", category: "General" },

    // Para Clientes (25)
    { question: "¿Cómo puedo encontrar un profesional?", answer: "Puedes usar nuestra barra de búsqueda, filtrar por categorías, ubicación y calificaciones. También puedes explorar nuestras recomendaciones personalizadas.", category: "Para Clientes" },
    { question: "¿Cómo solicito un servicio?", answer: "Una vez que encuentres el profesional ideal, puedes contactarlo directamente a través de su perfil o solicitar una cotización detallada del servicio.", category: "Para Clientes" },
    { question: "¿Puedo cancelar una solicitud?", answer: "Sí, puedes cancelar una solicitud antes de que sea confirmada por el profesional. Revisa los términos específicos de cada profesional.", category: "Para Clientes" },
    { question: "¿Cómo pago por un servicio?", answer: "Puedes pagar en efectivo al profesional, por transferencia bancaria, o usando los métodos de pago digitales que cada profesional acepta.", category: "Para Clientes" },
    { question: "¿Qué debo hacer antes de que llegue el profesional?", answer: "Prepara el área de trabajo, ten los materiales necesarios listos si se acordó, y asegúrate de estar disponible en el horario acordado.", category: "Para Clientes" },
    { question: "¿Puedo estar presente durante todo el servicio?", answer: "Sí, tienes derecho a supervisar el trabajo, hacer preguntas y asegurarte de que se realice según tus expectativas.", category: "Para Clientes" },
    { question: "¿Qué hago si no estoy satisfecho con el servicio?", answer: "Comunica inmediatamente tus preocupaciones al profesional. Si no se resuelve, puedes reportar el problema a través de la plataforma.", category: "Para Clientes" },
    { question: "¿Puedo solicitar modificaciones durante el servicio?", answer: "Puedes hacer modificaciones, pero esto podría afectar el precio y tiempo estimado. Comunícalo claramente con el profesional.", category: "Para Clientes" },
    { question: "¿Cómo dejo una reseña?", answer: "Después de completar un servicio, recibirás una notificación para calificar y escribir una reseña sobre tu experiencia con el profesional.", category: "Para Clientes" },
    { question: "¿Puedo solicitar un profesional específico nuevamente?", answer: "Sí, puedes guardar profesionales como favoritos y contactarlos directamente para servicios futuros.", category: "Para Clientes" },
    { question: "¿Qué hago si el profesional llega tarde?", answer: "Comunícate con el profesional para conocer el motivo. Si el retraso es excesivo, puedes cancelar y reportar la situación.", category: "Para Clientes" },
    { question: "¿Puedo solicitar servicios fuera de horario laboral?", answer: "Algunos profesionales ofrecen servicios en horarios extendidos o fines de semana, generalmente con un costo adicional.", category: "Para Clientes" },
    { question: "¿Necesito proporcionar herramientas o materiales?", answer: "Depende del servicio. En la descripción del profesional se especifica qué incluye y qué necesitas proporcionar tú.", category: "Para Clientes" },
    { question: "¿Puedo reagendar una cita?", answer: "Sí, puedes reagendar contactando directamente al profesional con suficiente anticipación, preferiblemente 24 horas antes.", category: "Para Clientes" },
    { question: "¿Qué medidas de seguridad debo tomar?", answer: "Verifica la identificación del profesional, mantén objetos de valor seguros y confía en tu instinto si algo no se siente bien.", category: "Para Clientes" },
    { question: "¿Puedo solicitar un presupuesto detallado?", answer: "Absolutamente, siempre solicita un presupuesto detallado que incluya mano de obra, materiales y cualquier costo adicional.", category: "Para Clientes" },
    { question: "¿Cómo funciona el sistema de favoritos?", answer: "Puedes marcar profesionales como favoritos para contactarlos fácilmente en el futuro desde tu panel de control.", category: "Para Clientes" },
    { question: "¿Puedo ver el historial de mis servicios?", answer: "Sí, en tu perfil tienes acceso completo al historial de todos los servicios solicitados, fechas, profesionales y calificaciones.", category: "Para Clientes" },
    { question: "¿Qué hago si necesito factura?", answer: "Solicita la factura directamente al profesional. Algunos pueden emitir facturas formales si tienen esta capacidad.", category: "Para Clientes" },
    { question: "¿Puedo compartir mi experiencia en redes sociales?", answer: "¡Por supuesto! Nos encanta cuando compartes experiencias positivas y etiquetas a @hazzlord en tus publicaciones.", category: "Para Clientes" },
    { question: "¿Cómo actualizo mi información de contacto?", answer: "Ve a la configuración de tu perfil donde puedes actualizar teléfono, dirección, email y preferencias de contacto.", category: "Para Clientes" },
    { question: "¿Puedo solicitar servicios como regalo?", answer: "Sí, puedes coordinar servicios como regalo. Solo asegúrate de tener autorización de la persona que recibirá el servicio.", category: "Para Clientes" },
    { question: "¿Qué hago si el profesional no se presenta?", answer: "Espera 15-30 minutos, luego contacta al profesional. Si no responde, reporta la situación a través de la plataforma.", category: "Para Clientes" },
    { question: "¿Puedo negociar precios con los profesionales?", answer: "Algunos profesionales están abiertos a negociación, especialmente para proyectos grandes o servicios recurrentes.", category: "Para Clientes" },
    { question: "¿Cómo protejo mi privacidad?", answer: "Solo comparte información necesaria para el servicio. Usa el sistema de mensajería interno cuando sea posible.", category: "Para Clientes" },

    // Para Profesionales (25)
    { question: "¿Cómo creo mi perfil profesional?", answer: "Regístrate como profesional, completa tu perfil con información detallada, sube tu portafolio y espera el proceso de verificación.", category: "Para Profesionales" },
    { question: "¿Cuánto cobra Hazzlo por sus servicios?", answer: "Hazzlo cobra una pequeña comisión solo cuando completas un trabajo exitosamente. No hay costos ocultos ni tarifas mensuales obligatorias.", category: "Para Profesionales" },
    { question: "¿Cómo recibo los pagos?", answer: "Los pagos se manejan directamente entre tú y el cliente. Puedes aceptar efectivo, transferencias bancarias o métodos de pago digitales.", category: "Para Profesionales" },
    { question: "¿Qué documentos necesito para verificarme?", answer: "Necesitas cédula de identidad, certificaciones profesionales si las tienes, y referencias de trabajos anteriores.", category: "Para Profesionales" },
    { question: "¿Puedo establecer mis propios precios?", answer: "Sí, tienes total libertad para establecer tus precios basados en tu experiencia, costos y valor ofrecido.", category: "Para Profesionales" },
    { question: "¿Cómo manejo las consultas de clientes?", answer: "Responde rápidamente a las consultas, sé profesional y claro sobre tus servicios, precios y disponibilidad.", category: "Para Profesionales" },
    { question: "¿Puedo rechazar trabajos que no me convengan?", answer: "Absolutamente, tienes derecho a rechazar trabajos que no se ajusten a tus capacidades, horarios o términos.", category: "Para Profesionales" },
    { question: "¿Cómo mejoro mi ranking en la plataforma?", answer: "Mantén altas calificaciones, responde rápidamente, cumple horarios, ofrece excelente servicio y obtén buenas reseñas.", category: "Para Profesionales" },
    { question: "¿Puedo ofrecer múltiples servicios?", answer: "Sí, puedes crear perfiles para diferentes servicios o combinar varios servicios relacionados en tu área de expertise.", category: "Para Profesionales" },
    { question: "¿Qué hago si un cliente no paga?", answer: "Primero intenta resolver directamente con el cliente. Si no se resuelve, reporta la situación a través de la plataforma.", category: "Para Profesionales" },
    { question: "¿Puedo trabajar fuera de mi ciudad?", answer: "Sí, puedes indicar tu área de cobertura geográfica y aceptar trabajos dentro de tu zona de desplazamiento.", category: "Para Profesionales" },
    { question: "¿Cómo actualizo mi portafolio?", answer: "Ve a tu perfil profesional y agrega nuevas fotos de trabajos, certificaciones o testimonios de clientes satisfechos.", category: "Para Profesionales" },
    { question: "¿Puedo pausar mi perfil temporalmente?", answer: "Sí, puedes pausar tu perfil si no estás disponible por vacaciones, enfermedad o cualquier otra razón temporal.", category: "Para Profesionales" },
    { question: "¿Cómo manejo clientes difíciles?", answer: "Mantén la profesionalidad, documenta cualquier problema y no dudes en contactar a soporte si la situación se vuelve problemática.", category: "Para Profesionales" },
    { question: "¿Puedo subir certificaciones a mi perfil?", answer: "Sí, sube todas tus certificaciones, diplomas y credenciales relevantes para generar más confianza con los clientes.", category: "Para Profesionales" },
    { question: "¿Cómo establezco mis horarios de disponibilidad?", answer: "En tu perfil puedes configurar tus días y horarios de trabajo, así como marcar períodos de no disponibilidad.", category: "Para Profesionales" },
    { question: "¿Puedo ofrecer garantías en mi trabajo?", answer: "Puedes ofrecer tus propias garantías como parte de tu propuesta de valor. Esto puede diferenciarte de otros profesionales.", category: "Para Profesionales" },
    { question: "¿Qué hago si me enfermo y no puedo cumplir una cita?", answer: "Contacta inmediatamente al cliente para reagendar, sé honesto sobre la situación y ofrece alternativas cuando sea posible.", category: "Para Profesionales" },
    { question: "¿Cómo promociono mis servicios en la plataforma?", answer: "Mantén tu perfil actualizado, obtén buenas reseñas, comparte trabajos en redes sociales y considera ofertas especiales ocasionales.", category: "Para Profesionales" },
    { question: "¿Puedo trabajar en equipo con otros profesionales?", answer: "Sí, puedes colaborar con otros profesionales para proyectos grandes, solo asegúrate de coordinar bien las responsabilidades.", category: "Para Profesionales" },
    { question: "¿Cómo manejo los materiales y herramientas?", answer: "Especifica claramente en tu perfil qué herramientas y materiales incluyes y qué debe proporcionar el cliente.", category: "Para Profesionales" },
    { question: "¿Puedo ofrecer consultas gratuitas?", answer: "Sí, las consultas gratuitas pueden ser una excelente estrategia para generar confianza y conseguir más clientes.", category: "Para Profesionales" },
    { question: "¿Cómo me destaco de la competencia?", answer: "Ofrece valor único, mantén excelente comunicación, sé puntual, profesional y busca constantemente mejorar tus habilidades.", category: "Para Profesionales" },
    { question: "¿Puedo cambiar de categoría de servicio?", answer: "Sí, puedes agregar o cambiar categorías de servicio según tu evolución profesional y nuevas habilidades adquiridas.", category: "Para Profesionales" },
    { question: "¿Qué hago si recibo una mala calificación injusta?", answer: "Puedes responder públicamente a la reseña de manera profesional y contactar a soporte si crees que la calificación es injusta.", category: "Para Profesionales" },

    // Pagos y Seguridad (25)
    { question: "¿Es seguro hacer pagos en Hazzlo?", answer: "Sí, utilizamos encriptación de grado bancario y socios de pago confiables para garantizar que todas las transacciones sean seguras.", category: "Pagos y Seguridad" },
    { question: "¿Qué métodos de pago acepta Hazzlo?", answer: "Aceptamos tarjetas de crédito/débito, transferencias bancarias y los principales métodos de pago digitales disponibles en República Dominicana.", category: "Pagos y Seguridad" },
    { question: "¿Qué hago si tengo un problema con un pago?", answer: "Contáctanos inmediatamente a través de nuestro centro de ayuda. Nuestro equipo de soporte resolverá cualquier problema de pago en un plazo de 24-48 horas.", category: "Pagos y Seguridad" },
    { question: "¿Hazzlo maneja mis datos de pago?", answer: "No almacenamos información sensible de tarjetas. Todos los pagos se procesan a través de procesadores certificados PCI DSS.", category: "Pagos y Seguridad" },
    { question: "¿Puedo obtener factura por mis pagos?", answer: "Sí, todas las transacciones procesadas a través de la plataforma generan recibos automáticos que puedes descargar desde tu perfil.", category: "Pagos y Seguridad" },
    { question: "¿Qué pasa si mi tarjeta es rechazada?", answer: "Verifica que los datos sean correctos, que tengas fondos suficientes y que la tarjeta esté habilitada para compras en línea.", category: "Pagos y Seguridad" },
    { question: "¿Puedo pagar en cuotas?", answer: "Depende de tu banco y tipo de tarjeta. Algunos bancos permiten dividir automáticamente las compras en cuotas.", category: "Pagos y Seguridad" },
    { question: "¿Cómo reporto una transacción fraudulenta?", answer: "Contacta inmediatamente a nuestro equipo de soporte y a tu banco. Investigaremos el caso y tomaremos las medidas necesarias.", category: "Pagos y Seguridad" },
    { question: "¿Mis datos personales están seguros?", answer: "Sí, cumplimos con altos estándares de seguridad y privacidad. No compartimos tus datos personales con terceros sin tu consentimiento.", category: "Pagos y Seguridad" },
    { question: "¿Puedo cambiar mi método de pago?", answer: "Sí, puedes agregar, eliminar o cambiar tus métodos de pago desde la configuración de tu cuenta en cualquier momento.", category: "Pagos y Seguridad" },
    { question: "¿Qué es la verificación de identidad?", answer: "Es un proceso donde validamos tu identidad usando documentos oficiales para garantizar la seguridad de todos los usuarios.", category: "Pagos y Seguridad" },
    { question: "¿Puedo usar PayPal o otras billeteras digitales?", answer: "Trabajamos constantemente para agregar más métodos de pago. Revisa las opciones disponibles en tu región.", category: "Pagos y Seguridad" },
    { question: "¿Cómo protejo mi contraseña?", answer: "Usa una contraseña fuerte, única para Hazzlo, no la compartas y cámbiala regularmente. Considera usar autenticación de dos factores.", category: "Pagos y Seguridad" },
    { question: "¿Qué hago si olvido mi contraseña?", answer: "Usa la opción 'Olvidé mi contraseña' en la página de inicio de sesión. Te enviaremos un enlace seguro para restablecerla.", category: "Pagos y Seguridad" },
    { question: "¿Puedo confiar en los profesionales verificados?", answer: "Los profesionales verificados han pasado nuestros controles de seguridad, pero siempre mantén precauciones básicas de seguridad personal.", category: "Pagos y Seguridad" },
    { question: "¿Cómo reporto comportamiento sospechoso?", answer: "Usa el botón de reporte en el perfil del profesional o contacta directamente a nuestro equipo de seguridad con todos los detalles.", category: "Pagos y Seguridad" },
    { question: "¿Guardan mi información de tarjeta?", answer: "No guardamos información completa de tarjetas. Solo almacenamos tokens seguros para facilitar pagos futuros si lo autorizas.", category: "Pagos y Seguridad" },
    { question: "¿Puedo solicitar reembolsos?", answer: "Los reembolsos dependen de las políticas específicas del profesional y las circunstancias. Contacta a soporte para casos específicos.", category: "Pagos y Seguridad" },
    { question: "¿Cómo verifico que un perfil es auténtico?", answer: "Busca la insignia de verificación, revisa reseñas, portafolio y tiempo en la plataforma. Desconfía de perfiles muy nuevos sin historial.", category: "Pagos y Seguridad" },
    { question: "¿Qué pasa si hay una disputa de pago?", answer: "Hazzlo mediará entre ambas partes para encontrar una solución justa. Documentar todo el proceso ayuda en estas situaciones.", category: "Pagos y Seguridad" },
    { question: "¿Puedo bloquear a un usuario problemático?", answer: "Sí, puedes bloquear usuarios desde su perfil. Esto impedirá que te contacten o vean tu información de contacto.", category: "Pagos y Seguridad" },
    { question: "¿Cómo sé si una oferta es legítima?", answer: "Ofertas extremadamente baratas o que piden pagos anticipados completos pueden ser sospechosas. Usa tu sentido común.", category: "Pagos y Seguridad" },
    { question: "¿Tienen seguros para los servicios?", answer: "Algunos profesionales tienen sus propios seguros de responsabilidad civil. Pregunta directamente si esto es importante para tu servicio.", category: "Pagos y Seguridad" },
    { question: "¿Cómo manejo información sensible durante un servicio?", answer: "Solo comparte información necesaria para el servicio. Para trabajos en casa, guarda objetos de valor y mantén areas privadas cerradas.", category: "Pagos y Seguridad" },
    { question: "¿Puedo usar Hazzlo de forma anónima?", answer: "Para mantener la seguridad y confianza, requerimos información real verificable. Sin embargo, controlas qué información compartes públicamente.", category: "Pagos y Seguridad" }
  ];

  // Group questions by category for display
  const faqData = [
    {
      category: "General",
      icon: HelpCircle,
      questions: allFaqQuestions.filter(q => q.category === "General")
    },
    {
      category: "Para Clientes", 
      icon: User,
      questions: allFaqQuestions.filter(q => q.category === "Para Clientes")
    },
    {
      category: "Para Profesionales",
      icon: Settings, 
      questions: allFaqQuestions.filter(q => q.category === "Para Profesionales")
    },
    {
      category: "Pagos y Seguridad",
      icon: Shield,
      questions: allFaqQuestions.filter(q => q.category === "Pagos y Seguridad")
    }
  ];

  // Filter FAQ questions based on search
  const filteredFaqQuestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    return allFaqQuestions.filter(faq => 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query)
    ).slice(0, 10); // Limit to 10 results
  }, [searchQuery]);

  const contactMethods = [
    {
      icon: MessageCircle,
      title: "Chat en vivo",
      description: "Chatea con nuestro equipo",
      action: "Iniciar chat",
      available: "Lun-Vie 8AM-6PM"
    },
    {
      icon: Mail,
      title: "Email",
      description: "soporte@hazzlo.net",
      action: "Enviar email",
      available: "Respuesta en 24hrs"
    },
    {
      icon: Phone,
      title: "Teléfono",
      description: "+1 (809) 486-6678",
      action: "Llamar ahora",
      available: "Lun-Vie 8AM-6PM"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-display font-light text-4xl sm:text-5xl text-gray-900 dark:text-white mb-6 tracking-tight">
              Centro de <span className="font-medium">Ayuda</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Encuentra respuestas a tus preguntas o contacta con nuestro equipo de soporte
            </p>
          </div>

          {/* Quick Search */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 dark:text-gray-400" />
                <Input
                  placeholder="Buscar en el centro de ayuda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg rounded-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400"
                  data-testid="input-search-help"
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  onClick={() => setSearchQuery("")}
                >
                  {searchQuery ? "Limpiar" : "Buscar"}
                </Button>
              </div>

              {/* Search Results */}
              {filteredFaqQuestions.length > 0 && (
                <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Preguntas relacionadas:</h3>
                    <div className="space-y-2">
                      {filteredFaqQuestions.map((faq, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedFaq(faq)}
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-100 dark:border-gray-600"
                          data-testid={`button-faq-result-${index}`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">{faq.question}</div>
                          <div className="text-gray-600 dark:text-gray-400 text-xs">
                            {faq.answer.substring(0, 100)}...
                          </div>
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                            {faq.category}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Methods */}
          <section className="mb-16">
            <h2 className="font-display font-medium text-2xl text-gray-900 dark:text-white mb-8 text-center">
              Contáctanos
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <Card key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 text-center">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Icon className="text-white w-8 h-8" />
                      </div>
                      <CardTitle className="text-lg text-gray-900 dark:text-white">{method.title}</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                        {method.available}
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => {
                          if (method.title === "Chat en vivo") {
                            handleStartChat();
                          } else if (method.title === "Email") {
                            handleEmailClick();
                          } else if (method.title === "Teléfono") {
                            handlePhoneClick();
                          }
                        }}
                        data-testid={`button-${method.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {method.title === "Chat en vivo" && existingChat ? "Tienes un chat abierto" : method.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <h2 className="font-display font-medium text-3xl text-gray-900 dark:text-white mb-4">
                Preguntas Frecuentes
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Encuentra respuestas rápidas a las preguntas más comunes
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {faqData.map((category, categoryIndex) => {
                const CategoryIcon = category.icon;
                return (
                  <Card key={categoryIndex} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-600 dark:to-blue-700 rounded-xl flex items-center justify-center">
                          <CategoryIcon className="text-blue-600 dark:text-white w-5 h-5" />
                        </div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">{category.category}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.questions.map((faq, index) => (
                          <AccordionItem 
                            key={index} 
                            value={`${categoryIndex}-${index}`}
                            className="border border-gray-200 dark:border-gray-600 rounded-lg px-4 bg-gray-50 dark:bg-gray-700"
                          >
                            <AccordionTrigger className="text-left hover:no-underline text-gray-900 dark:text-white">
                              {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 dark:text-gray-400 pt-2">
                              {faq.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Contact Form */}
          <section className="mb-16">
            <div className="max-w-2xl mx-auto">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-gray-900 dark:text-white">¿No encuentras tu respuesta?</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Escríbenos directamente y te responderemos lo antes posible
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-gray-900 dark:text-white">Nombre completo</Label>
                        <Input
                          id="name"
                          placeholder="Tu nombre"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-900 dark:text-white">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          required
                          className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-gray-900 dark:text-white">Asunto</Label>
                      <Input
                        id="subject"
                        placeholder="¿En qué te podemos ayudar?"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        required
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-900 dark:text-white">Mensaje</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe tu consulta o problema con el mayor detalle posible..."
                        rows={6}
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        required
                        className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={submitHelpFormMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                      data-testid="button-submit-help-form"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      {submitHelpFormMutation.isPending ? "Enviando..." : "Enviar mensaje"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Additional Resources */}
          <section className="text-center py-16">
            <h2 className="font-display font-medium text-2xl text-gray-900 dark:text-white mb-4">
              Recursos Adicionales
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Explora más recursos para sacar el máximo provecho de Hazzlo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/servicios'}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                Ver todos los servicios
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/profesionales'}
                className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                Explorar profesionales
              </Button>
            </div>
          </section>

        </div>
      </div>

      {/* Start Support Chat Dialog */}
      <Dialog open={isChatDialogOpen} onOpenChange={setIsChatDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-500" />
              Iniciar Chat de Soporte
            </DialogTitle>
            <DialogDescription>
              Inicia una conversación con nuestro equipo de soporte. Un moderador se conectará contigo pronto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChatSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-subject">Asunto del Chat</Label>
              <Input
                id="chat-subject"
                value={chatSubject}
                onChange={(e) => setChatSubject(e.target.value)}
                placeholder="Ej: Problema con mi cuenta"
                disabled={startChatMutation.isPending}
                data-testid="input-chat-subject"
              />
              <p className="text-sm text-gray-500">
                Describe brevemente sobre qué necesitas ayuda
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsChatDialogOpen(false)}
                disabled={startChatMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={startChatMutation.isPending || !chatSubject.trim()}
                data-testid="button-start-chat"
              >
                {startChatMutation.isPending ? "Iniciando..." : "Iniciar Chat"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* FAQ Answer Modal */}
      <Dialog open={selectedFaq !== null} onOpenChange={(open) => !open && setSelectedFaq(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              {selectedFaq?.question}
            </DialogTitle>
            <DialogDescription>
              Respuesta del Centro de Ayuda
            </DialogDescription>
          </DialogHeader>
          {selectedFaq && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedFaq.answer}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <span className="inline-block px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {selectedFaq.category}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFaq(null)}
                  data-testid="button-close-faq-modal"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}