import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function SuspensionBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);

  if (!user?.suspendedUntil || !isVisible) {
    return null;
  }

  const suspensionEnds = new Date(user.suspendedUntil);
  const isStillSuspended = suspensionEnds > new Date();

  if (!isStillSuspended) {
    return null;
  }

  const timeRemaining = formatDistanceToNow(suspensionEnds, { 
    locale: es, 
    addSuffix: true 
  });

  return (
    <Alert className="border-yellow-200 bg-yellow-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            Tu cuenta está suspendida temporalmente.
          </span>
          <span className="text-yellow-700">
            La suspensión terminará {timeRemaining}.
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsVisible(false)}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
      {user.suspensionReason && (
        <div className="mt-2 text-sm text-yellow-700">
          <strong>Motivo:</strong> {user.suspensionReason}
        </div>
      )}
    </Alert>
  );
}