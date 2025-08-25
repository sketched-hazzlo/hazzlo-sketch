import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ScrollAnimation from "@/components/scroll-animations";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animationType="fade">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6 tracking-tight">
                Términos y <span className="font-medium bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">Condiciones</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Última actualización: 16 de agosto de 2025
              </p>
            </div>
          </ScrollAnimation>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ScrollAnimation animationType="slide-up" delay={100}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Aceptación de los Términos</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Al acceder y utilizar Hazzlo, usted acepta estar sujeto a estos Términos y Condiciones. 
                  Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro servicio.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={200}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Descripción del Servicio</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Hazzlo es una plataforma digital que conecta profesionales de servicios con clientes en la República Dominicana. 
                  Facilitamos la búsqueda, contratación y gestión de servicios profesionales en diversas categorías incluyendo:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Servicios de belleza y cuidado personal</li>
                  <li>Tecnología y desarrollo</li>
                  <li>Servicios del hogar y mantenimiento</li>
                  <li>Servicios automotrices</li>
                  <li>Educación y tutorías</li>
                  <li>Salud y bienestar</li>
                  <li>Organización de eventos</li>
                  <li>Servicios de limpieza</li>
                </ul>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={300}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Registro y Cuentas de Usuario</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>3.1 Elegibilidad:</strong> Debe ser mayor de 18 años y tener capacidad legal para celebrar contratos en la República Dominicana.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>3.2 Información Veraz:</strong> Se compromete a proporcionar información precisa, actualizada y completa durante el registro.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>3.3 Seguridad:</strong> Es responsable de mantener la confidencialidad de sus credenciales de acceso.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>3.4 Verificación:</strong> Los profesionales deben completar un proceso de verificación que incluye validación de identidad y competencias.
                  </p>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={400}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Responsabilidades de los Usuarios</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Para Clientes:</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Proporcionar información clara sobre el servicio requerido</li>
                      <li>Cumplir con los términos acordados con el profesional</li>
                      <li>Realizar pagos según lo pactado</li>
                      <li>Proporcionar reseñas honestas y constructivas</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Para Profesionales:</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Mantener licencias y certificaciones vigentes</li>
                      <li>Prestar servicios de calidad según estándares profesionales</li>
                      <li>Cumplir con horarios y compromisos acordados</li>
                      <li>Mantener comunicación clara y profesional</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={500}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Pagos y Comisiones</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  <strong>5.1 Comisiones de Plataforma:</strong> Hazzlo cobra una comisión sobre las transacciones completadas exitosamente.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  <strong>5.2 Métodos de Pago:</strong> Aceptamos tarjetas de crédito/débito, transferencias bancarias y otros métodos de pago autorizados.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>5.3 Disputas:</strong> En caso de disputas, Hazzlo actuará como mediador pero no garantiza resoluciones específicas.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={600}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Limitación de Responsabilidad</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Hazzlo actúa únicamente como intermediario entre clientes y profesionales. No somos responsables por:
                  la calidad de los servicios prestados, daños o pérdidas resultantes del uso de la plataforma,
                  incumplimientos contractuales entre usuarios, o contenido generado por usuarios.
                  Nuestra responsabilidad se limita al valor de las comisiones cobradas por la transacción específica.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={700}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Modificaciones de los Términos</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los usuarios serán notificados de cambios significativos con al menos 30 días de anticipación. 
                  El uso continuado de la plataforma después de las modificaciones constituye aceptación de los nuevos términos.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={800}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200/30 dark:border-blue-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Contacto</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Para preguntas sobre estos términos, contáctenos en:
                  <br />
                  <strong>Email:</strong> legal@hazzlo.net
                  <br />
                  <strong>Dirección:</strong> Santo Domingo, República Dominicana
                </p>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}