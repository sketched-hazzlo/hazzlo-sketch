import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ScrollAnimation from "@/components/scroll-animations";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollAnimation animationType="fade">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-light text-gray-900 dark:text-white mb-6 tracking-tight">
                Política de <span className="font-medium bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">Privacidad</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Última actualización: 16 de agosto de 2025
              </p>
            </div>
          </ScrollAnimation>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ScrollAnimation animationType="slide-up" delay={100}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">1. Información que Recopilamos</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Información Personal:</strong> Nombre, dirección de email, número de teléfono, dirección física, información de pago.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Información Profesional:</strong> Para profesionales, recopilamos certificaciones, experiencia, portafolio, y documentos de identificación.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Información de Uso:</strong> Datos sobre cómo interactúa con nuestra plataforma, preferencias de servicios, historial de transacciones.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Información Técnica:</strong> Dirección IP, tipo de navegador, sistema operativo, datos de ubicación (con su consentimiento).
                  </p>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={200}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">2. Cómo Utilizamos su Información</h2>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Facilitar conexiones entre clientes y profesionales</li>
                  <li>Procesar pagos y transacciones</li>
                  <li>Verificar la identidad de profesionales</li>
                  <li>Proporcionar soporte al cliente</li>
                  <li>Mejorar nuestros servicios y experiencia de usuario</li>
                  <li>Enviar comunicaciones relacionadas con el servicio</li>
                  <li>Cumplir con obligaciones legales y regulatorias</li>
                  <li>Prevenir fraude y garantizar la seguridad de la plataforma</li>
                </ul>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={300}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">3. Compartir Información</h2>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Entre Usuarios:</strong> Compartimos información necesaria para facilitar las transacciones (nombre, foto, calificaciones, información de contacto).
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Proveedores de Servicios:</strong> Con empresas que nos ayudan a operar la plataforma (procesadores de pago, servicios de hosting).
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Cumplimiento Legal:</strong> Cuando sea requerido por ley o para proteger nuestros derechos legales.
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    <strong>Nunca Vendemos:</strong> No vendemos ni alquilamos su información personal a terceros para fines de marketing.
                  </p>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={400}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">4. Seguridad de Datos</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Implementamos medidas de seguridad técnicas, administrativas y físicas para proteger su información:
                </p>
                <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
                  <li>Cifrado SSL/TLS para todas las transmisiones de datos</li>
                  <li>Almacenamiento seguro en servidores protegidos</li>
                  <li>Acceso restringido a información personal</li>
                  <li>Monitoreo continuo de seguridad</li>
                  <li>Auditorías regulares de seguridad</li>
                  <li>Cumplimiento con estándares internacionales de protección de datos</li>
                </ul>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={500}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">5. Sus Derechos</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Acceso y Control:</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Acceder a su información personal</li>
                      <li>Corregir datos inexactos</li>
                      <li>Actualizar su perfil</li>
                      <li>Eliminar su cuenta</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Comunicaciones:</h3>
                    <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Optar por no recibir emails promocionales</li>
                      <li>Controlar notificaciones push</li>
                      <li>Administrar preferencias de comunicación</li>
                      <li>Solicitar portabilidad de datos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={600}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">6. Retención de Datos</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Conservamos su información personal durante el tiempo necesario para proporcionar nuestros servicios y cumplir con obligaciones legales. 
                  Los datos de transacciones se conservan por períodos requeridos por regulaciones financieras. 
                  Puede solicitar la eliminación de su cuenta en cualquier momento, sujeto a ciertos requisitos legales de retención.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={700}>
              <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-gray-200/30 dark:border-gray-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">7. Transferencias Internacionales</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Sus datos pueden ser procesados en servidores ubicados fuera de la República Dominicana. 
                  Garantizamos que cualquier transferencia internacional cumple con estándares adecuados de protección de datos 
                  y se realiza únicamente con proveedores que mantienen medidas de seguridad equivalentes.
                </p>
              </div>
            </ScrollAnimation>

            <ScrollAnimation animationType="slide-up" delay={800}>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-8 border border-blue-200/30 dark:border-blue-700/30">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">8. Contacto sobre Privacidad</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Para ejercer sus derechos de privacidad o hacer preguntas sobre esta política:
                  <br />
                  <strong>Email:</strong> privacy@hazzlo.net
                  <br />
                  <strong>Oficial de Protección de Datos:</strong> legal@hazzlo.net
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