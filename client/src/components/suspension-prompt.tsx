import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Ban, Clock } from "lucide-react";

interface SuspensionPromptProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; days?: number }) => void;
  type: "temporary" | "permanent";
  userName?: string;
  isLoading?: boolean;
}

export default function SuspensionPrompt({
  open,
  onClose,
  onConfirm,
  type,
  userName = "",
  isLoading = false
}: SuspensionPromptProps) {
  const [reason, setReason] = useState("");
  const [days, setDays] = useState<number>(1);

  const handleSubmit = () => {
    if (!reason.trim()) return;
    
    if (type === "temporary") {
      onConfirm({ reason: reason.trim(), days });
    } else {
      onConfirm({ reason: reason.trim() });
    }
    
    // Reset form
    setReason("");
    setDays(1);
  };

  const handleClose = () => {
    setReason("");
    setDays(1);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {type === "permanent" ? (
              <Ban className="w-6 h-6 text-red-600" />
            ) : (
              <Clock className="w-6 h-6 text-orange-600" />
            )}
            <DialogTitle className={type === "permanent" ? "text-red-800" : "text-orange-800"}>
              {type === "permanent" ? "Suspender Permanentemente" : "Suspender Temporalmente"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {userName && (
              <span className="font-medium">Usuario: {userName}<br /></span>
            )}
            {type === "permanent" 
              ? "Esta acción suspenderá la cuenta permanentemente. El usuario no podrá acceder a la plataforma."
              : "Esta acción suspenderá la cuenta temporalmente. El usuario no podrá acceder a la plataforma durante el período especificado."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {type === "temporary" && (
            <div className="space-y-2">
              <Label htmlFor="suspension-days">Duración de la suspensión</Label>
              <Select value={days.toString()} onValueChange={(value) => setDays(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 día</SelectItem>
                  <SelectItem value="3">3 días</SelectItem>
                  <SelectItem value="7">7 días (1 semana)</SelectItem>
                  <SelectItem value="14">14 días (2 semanas)</SelectItem>
                  <SelectItem value="30">30 días (1 mes)</SelectItem>
                  <SelectItem value="90">90 días (3 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="suspension-reason">
              Razón de la suspensión <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="suspension-reason"
              placeholder="Describe la razón específica de la suspensión (mínimo 10 caracteres)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              Esta razón será visible para el usuario y se registrará en el historial de acciones.
            </p>
          </div>

          {type === "permanent" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Advertencia: Acción irreversible</p>
                  <p>Esta suspensión permanente no se puede deshacer automáticamente. El usuario tendrá que contactar soporte para solicitar una revisión.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || reason.trim().length < 10 || isLoading}
            variant={type === "permanent" ? "destructive" : "default"}
            className={type === "temporary" ? "bg-orange-600 hover:bg-orange-700" : ""}
          >
            {isLoading ? "Procesando..." : `Suspender ${type === "permanent" ? "Permanentemente" : `por ${days} día${days > 1 ? 's' : ''}`}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}