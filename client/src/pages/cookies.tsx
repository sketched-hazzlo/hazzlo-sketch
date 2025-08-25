import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ScrollAnimation from "@/components/scroll-animations";

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animationType="fade">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6 tracking-tight">
                Política de <span className="font-medium bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">Cookies</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Última actualización: 16 de agosto de 2025
              </p>
            </div>
          </ScrollAnimation>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ScrollAnimation animationType="slide-up" delay={100}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">¿Qué son las Cookies?</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web. 
                  Nos ayudan a proporcionar una mejor experiencia de usuario, recordar sus preferencias y analizar cómo utiliza nuestra plataforma.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={200}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Tipos de Cookies que Utilizamos</h2>
                
                <div className="space-y-6">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">Cookies Esenciales</h3>
                    <p className="text-green-700 dark:text-green-300 text-sm">
                      Necesarias para el funcionamiento básico del sitio web. No se pueden desactivar.
                    </p>
                    <ul className="list-disc pl-6 text-green-700 dark:text-green-300 text-sm mt-2 space-y-1">
                      <li>Cookies de sesión de usuario</li>
                      <li>Cookies de autenticación</li>
                      <li>Cookies de seguridad</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Cookies de Funcionalidad</h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      Permiten recordar sus preferencias y personalizar su experiencia.
                    </p>
                    <ul className="list-disc pl-6 text-blue-700 dark:text-blue-300 text-sm mt-2 space-y-1">
                      <li>Preferencias de idioma</li>
                      <li>Configuración de tema (claro/oscuro)</li>
                      <li>Filtros de búsqueda guardados</li>
                      <li>Ubicación preferida</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Cookies Analíticas</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Nos ayudan a entender cómo los usuarios interactúan con nuestro sitio.
                    </p>
                    <ul className="list-disc pl-6 text-yellow-700 dark:text-yellow-300 text-sm mt-2 space-y-1">
                      <li>Google Analytics</li>
                      <li>Métricas de rendimiento</li>
                      <li>Análisis de comportamiento</li>
                      <li>Estadísticas de uso</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">Cookies de Marketing</h3>
                    <p className="text-purple-700 dark:text-purple-300 text-sm">
                      Utilizadas para mostrar anuncios relevantes y medir la efectividad de campañas.
                    </p>
                    <ul className="list-disc pl-6 text-purple-700 dark:text-purple-300 text-sm mt-2 space-y-1">
                      <li>Cookies de redes sociales</li>
                      <li>Cookies de retargeting</li>
                      <li>Análisis de conversiones</li>
                      <li>Personalización de anuncios</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={300}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Cookies de Terceros</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Algunos de nuestros socios de confianza también pueden establecer cookies en su dispositivo:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Google Analytics</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Para análisis de tráfico y comportamiento de usuarios</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">PayPal</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Para procesamiento seguro de pagos</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Facebook Pixel</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Para optimizar anuncios en redes sociales</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Hotjar</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Para análisis de experiencia de usuario</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={400}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Gestión de Cookies</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Configuración del Navegador:</strong> Puede configurar su navegador para rechazar cookies o alertarle cuando se envíen cookies.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Centro de Preferencias:</strong> Utilizamos un sistema de gestión de consentimiento que le permite controlar qué tipos de cookies acepta.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Configuración de Cuenta:</strong> Los usuarios registrados pueden gestionar preferencias de cookies desde su panel de configuración.
                  </p>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Instrucciones por Navegador:</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-blue-700 dark:text-blue-300"><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</p>
                      <p className="text-blue-700 dark:text-blue-300"><strong>Firefox:</strong> Opciones → Privacidad y seguridad</p>
                    </div>
                    <div>
                      <p className="text-blue-700 dark:text-blue-300"><strong>Safari:</strong> Preferencias → Privacidad</p>
                      <p className="text-blue-700 dark:text-blue-300"><strong>Edge:</strong> Configuración → Permisos del sitio → Cookies</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={500}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Duración de las Cookies</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Cookies de sesión</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Se eliminan al cerrar el navegador</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Cookies de autenticación</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">30 días</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Cookies de preferencias</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">1 año</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Cookies analíticas</span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">2 años</span>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={600}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200/30 dark:border-blue-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contacto sobre Cookies</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Si tiene preguntas sobre nuestra política de cookies:
                  <br />
                  <strong>Email:</strong> cookies@hazzlo.net
                  <br />
                  <strong>Soporte:</strong> soporte@hazzlo.net
                  <br />
                  <strong>Centro de Ayuda:</strong> /ayuda
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