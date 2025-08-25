import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/navbar";
import HeroSearch from "@/components/hero-search";
import ServiceCategories from "@/components/service-categories";
import ProfessionalCardFeatured from "@/components/professional-card-featured";
import Footer from "@/components/footer";
import AuthModal from "@/components/auth-modal";
import ScrollAnimation from "@/components/scroll-animations";
import { Button } from "@/components/ui/button";
import { Star, Users, Shield, Calendar } from "lucide-react";

export default function Landing() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Initialize categories on page load
  const { mutate: initCategories } = useMutation({
    mutationFn: () => fetch('/api/categories/init', { method: 'POST' }).then(r => r.json()),
  });

  useEffect(() => {
    initCategories();
  }, [initCategories]);

  const { data: professionals } = useQuery({
    queryKey: ['/api/professionals/search', { limit: 3 }],
    queryFn: () => fetch('/api/professionals/search?limit=3').then(r => r.json()),
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-20 sm:pt-32 md:pt-48 lg:pt-80 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <ScrollAnimation animationType="fade">
            <div className="text-center">
              <h1 className="font-display font-light text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-gray-900 dark:text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                Conecta con <span className="font-medium bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">profesionales</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8 sm:mb-10 lg:mb-12 leading-relaxed px-2">
                La plataforma más confiable para encontrar y contratar servicios profesionales. 
                Miles de expertos verificados listos para ayudarte.
              </p>
            </div>
          </ScrollAnimation>
          
          <ScrollAnimation animationType="slide-up" delay={300}>
            <HeroSearch />
          </ScrollAnimation>

          <ScrollAnimation animationType="scale" delay={500}>
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-6 sm:mt-8 px-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span>Profesionales verificados</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>4.8/5 calificación promedio</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>Miles de servicios</span>
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <ScrollAnimation animationType="slide-up" delay={200}>
        <ServiceCategories />
      </ScrollAnimation>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <ScrollAnimation animationType="fade" delay={100}>
            <div className="text-center mb-16">
              <h2 className="font-display font-light text-display-medium text-gray-900 dark:text-white mb-6 tracking-tight">
                Cómo <span className="font-medium">funciona</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Tres simples pasos para conectar con el profesional perfecto
              </p>
            </div>
          </ScrollAnimation>

          <div className="grid md:grid-cols-3 gap-12">
            <ScrollAnimation animationType="slide-up" delay={200}>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-display font-semibold text-2xl">1</span>
                </div>
                <h3 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-4">Busca y filtra</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Utiliza nuestros filtros avanzados por ubicación, categoría, calificaciones y precio para encontrar exactamente lo que necesitas.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={400}>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-display font-semibold text-2xl">2</span>
                </div>
                <h3 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-4">Conecta directamente</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Contacta profesionales verificados, revisa sus portafolios, lee reseñas reales y solicita cotizaciones personalizadas.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={600}>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white font-display font-semibold text-2xl">3</span>
                </div>
                <h3 className="font-display font-semibold text-2xl text-gray-900 dark:text-white mb-4">Contrata con confianza</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Agenda servicios, realiza pagos protegidos por nosotros y califica tu experiencia para ayudar a otros usuarios.
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      {professionals?.professionals && professionals.professionals.length > 0 && (
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <ScrollAnimation animationType="fade" delay={100}>
              <div className="flex flex-col sm:flex-row justify-between items-center mb-16">
                <div>
                  <h2 className="font-display font-light text-display-medium text-gray-900 dark:text-white mb-4 tracking-tight">
                    Profesionales <span className="font-medium">destacados</span>
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400">
                    Conecta con expertos verificados y altamente calificados
                  </p>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={300}>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionals.professionals.map((professional: any) => (
                  <ProfessionalCardFeatured key={professional.id} professional={professional} />
                ))}
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="scale" delay={500}>
              <div className="text-center mt-12">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.href = '/search'}
                >
                  Ver todos los profesionales
                </Button>
              </div>
            </ScrollAnimation>
          </div>
        </section>
      )}

      {/* Professional Dashboard Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollAnimation animationType="slide-right" delay={200}>
              <div>
              <h2 className="font-display font-light text-display-medium text-gray-900 dark:text-white mb-6 tracking-tight">
                ¿Eres un <span className="font-medium">profesional</span>?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Únete a miles de profesionales que hacen crecer sus negocios en Hazzlo. 
                Obtén más clientes, gestiona tu reputación y aumenta tus ingresos.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Perfil profesional completo</h3>
                    <p className="text-gray-600 dark:text-gray-400">Muestra tu portafolio, servicios y experiencia de forma elegante</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Panel analítico avanzado</h3>
                    <p className="text-gray-600 dark:text-gray-400">Rastrea métricas, clientes, ingresos y el crecimiento de tu negocio</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-1">Verificación y reputación</h3>
                    <p className="text-gray-600 dark:text-gray-400">Gana confianza con verificación de identidad y reseñas auténticas</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Crear perfil profesional
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => window.location.href = '/ayuda'}
                >
                  Ver sección de ayuda
                </Button>
              </div>
              </div>
            </ScrollAnimation>
            
            {/* Dashboard Preview */}
            <ScrollAnimation animationType="slide-left" delay={400}>
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display font-semibold text-xl text-gray-900 dark:text-white">Dashboard</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 rounded-2xl p-4 text-white">
                    <p className="text-blue-100 text-sm mb-1">Servicios completados</p>
                    <p className="font-display font-bold text-2xl">127</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-700 dark:from-green-500 dark:to-green-600 rounded-2xl p-4 text-white">
                    <p className="text-green-100 text-sm mb-1">Calificación promedio</p>
                    <p className="font-display font-bold text-2xl">4.8</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Nueva solicitud</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Miguel Nunez - Corte de cabello</p>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white">
                      Responder
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Cita confirmada</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alana Ruiz - Mañana 3:00 PM</p>
                    </div>
                    <span className="bg-green-600 dark:bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Confirmado
                    </span>
                  </div>
                </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <ScrollAnimation animationType="fade" delay={100}>
            <div className="text-center mb-16">
              <h2 className="font-display font-light text-display-medium text-gray-900 dark:text-white mb-6 tracking-tight">
                Lo que dicen nuestros <span className="font-medium">usuarios</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Miles de dominicanos ya confían en Hazzlo para sus servicios
              </p>
            </div>
          </ScrollAnimation>

          <ScrollAnimation animationType="slide-up" delay={300}>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Carmen Silva",
                  location: "Contadora",
                  comment: "Pude conseguir empleo el mismo dia que me registre. El servicio es excelente y la plataforma te da muchas facilidades.",
                  avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=60&h=60&fit=crop&crop=face"
                },
                {
                  name: "Roberto Jiménez",
                  role: "Desarrollador Web",
                  comment: "Me registre en hazzlo hace un tiempo y puedo decir que se te triplica la clientela desde que te verifican.",
                  avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&w=60&h=60&fit=crop&crop=face"
                },
                {
                  name: "Isabella Morales",
                  role: "Estilista",
                  comment: "La mejor decisión para mi salón de belleza, recibo clientes nuevos practicamente cada semana y el panel de control que tienen es increíble.",
                  avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&w=60&h=60&fit=crop&crop=face"
                }
              ].map((testimonial, index) => (
                <div key={index} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl p-8 border border-gray-200/30 dark:border-gray-700/30 transition-all duration-300 hover:shadow-lg hover:scale-105">
                  <div className="flex text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center space-x-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-display font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.location || testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollAnimation animationType="fade" delay={100}>
            <h2 className="font-display font-light text-4xl sm:text-6xl text-white mb-6 tracking-tight">
              Comienza <span className="font-medium">hoy mismo</span>
            </h2>
            <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto leading-relaxed">
              Únete a la comunidad de profesionales y usuarios más grande de República Dominicana. 
              Encuentra o ofrece servicios de calidad en minutos.
            </p>
          </ScrollAnimation>
          
          <ScrollAnimation animationType="scale" delay={400}>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white hover:bg-gray-50 text-blue-600"
                onClick={() => window.location.href = '/search'}
              >
                Buscar servicios
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent hover:bg-white/10 text-white border-white/30 hover:border-white/50"
                onClick={() => setAuthModalOpen(true)}
              >
                Soy profesional
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Button>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
}
