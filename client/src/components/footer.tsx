import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Hazzlo</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Conectando profesionales con clientes en República Dominicana.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/servicios" className="hover:text-blue-600 dark:hover:text-blue-400">Explorar servicios</a></li>
              <li><a href="/profesionales" className="hover:text-blue-600 dark:hover:text-blue-400">Encontrar profesionales</a></li>
              <li><a href="/search" className="hover:text-blue-600 dark:hover:text-blue-400">Búsqueda avanzada</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Soporte</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/ayuda" className="hover:text-blue-600 dark:hover:text-blue-400">Centro de ayuda</a></li>
              <li><a href="/auth" className="hover:text-blue-600 dark:hover:text-blue-400">Crear cuenta</a></li>
              <li><a href="/configuracion" className="hover:text-blue-600 dark:hover:text-blue-400">Configuración</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="/tos" className="hover:text-blue-600 dark:hover:text-blue-400">Términos de uso</a></li>
              <li><a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Política de privacidad</a></li>
              <li><a href="/cookies" className="hover:text-blue-600 dark:hover:text-blue-400">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 Hazzlo. Todos los derechos reservados.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
              Conectando a la República Dominicana <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-2" />
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}