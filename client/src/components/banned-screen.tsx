import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Mail, Phone, Clock, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export default function BannedScreen() {
  const { user, logout } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>("");

  // Check if user is temporarily suspended
  const isTemporarilySuspended = user?.suspendedUntil && new Date(user.suspendedUntil) > new Date();
  const isPermanentlyBanned = user?.isBanned;

  useEffect(() => {
    if (isTemporarilySuspended && user?.suspendedUntil) {
      const updateTimeLeft = () => {
        const now = new Date();
        const suspendedUntil = new Date(user.suspendedUntil!);
        const diff = suspendedUntil.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft("Suspensión expirada - Recarga la página");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setTimeLeft(`${days} días, ${hours} horas y ${minutes} minutos`);
        } else if (hours > 0) {
          setTimeLeft(`${hours} horas y ${minutes} minutos`);
        } else {
          setTimeLeft(`${minutes} minutos`);
        }
      };

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isTemporarilySuspended, user?.suspendedUntil]);

  // Fixed overlay that covers everything
  return (
    <div className="fixed inset-0 z-[9999] bg-red-50 flex items-center justify-center p-4" style={{ 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      background: isPermanentlyBanned ? '#fef2f2' : '#fff7ed'
    }}>
      <Card className={`max-w-lg w-full shadow-2xl ${isPermanentlyBanned ? 'border-red-200' : 'border-orange-200'}`}>
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              isPermanentlyBanned ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              {isPermanentlyBanned ? (
                <Ban className="w-10 h-10 text-red-600" />
              ) : (
                <Clock className="w-10 h-10 text-orange-600" />
              )}
            </div>
          </div>
          <CardTitle className={`text-2xl ${isPermanentlyBanned ? 'text-red-800' : 'text-orange-800'}`}>
            {isPermanentlyBanned ? 'Cuenta Suspendida Permanentemente' : 'Cuenta Suspendida Temporalmente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="text-gray-700">
            {isPermanentlyBanned ? (
              <>
                <p className="mb-3 text-lg">
                  Tu cuenta ha sido suspendida permanentemente por violar nuestros términos de servicio.
                </p>
                <p className="text-sm">
                  Esta decisión fue tomada tras una revisión cuidadosa de la actividad de tu cuenta.
                </p>
              </>
            ) : (
              <>
                <p className="mb-3 text-lg">
                  Tu cuenta ha sido suspendida temporalmente por violar nuestros términos de servicio.
                </p>
                <p className="text-sm mb-4">
                  No podrás acceder a ninguna funcionalidad de la plataforma durante este período.
                </p>
                {timeLeft && (
                  <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 text-center`}>
                    <AlertTriangle className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-medium text-orange-800 mb-1">Tiempo restante de suspensión:</h4>
                    <p className="text-lg font-bold text-orange-700">{timeLeft}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {user?.suspensionReason && (
            <div className={`border rounded-lg p-4 text-left ${
              isPermanentlyBanned ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
            }`}>
              <h4 className={`font-medium mb-2 ${isPermanentlyBanned ? 'text-red-800' : 'text-orange-800'}`}>
                Motivo de la suspensión:
              </h4>
              <p className={`text-sm ${isPermanentlyBanned ? 'text-red-700' : 'text-orange-700'}`}>
                {user.suspensionReason}
              </p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h4 className="font-medium text-gray-800 mb-2">¿Crees que esto es un error?</h4>
            <p className="text-sm text-gray-600 mb-3">
              Si consideras que esta suspensión es injusta, puedes contactar a nuestro equipo de soporte:
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>soporte@hazzlo.net</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>+1 (809) 486-6678</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={() => logout()} 
              variant="outline" 
              className="w-full"
            >
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}