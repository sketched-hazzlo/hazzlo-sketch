import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-lg mx-auto text-center"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-500 dark:from-gray-600 dark:to-gray-400 leading-none">
            404
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            La página que buscas no existe o ha sido movida.
            <br />
            Pero no te preocupes, podemos ayudarte a encontrar lo que necesitas.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 text-white transition-all duration-300 shadow-lg hover:shadow-xl">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
            <Link href="/profesionales">
              <Search className="w-4 h-4 mr-2" />
              Buscar profesionales
            </Link>
          </Button>
        </motion.div>

        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 flex justify-center"
        >
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-400 dark:via-gray-600 to-transparent"></div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-8 text-sm text-gray-500 dark:text-gray-500"
        >
          ¿Necesitas ayuda? Contáctanos en 
          <a href="/ayuda" className="text-gray-700 dark:text-gray-300 hover:underline font-medium ml-1">
            soporte
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}