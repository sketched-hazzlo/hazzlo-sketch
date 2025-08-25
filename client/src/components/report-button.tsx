import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Flag } from "lucide-react";

interface ReportButtonProps {
  reportType: "professional_profile" | "chat_conversation";
  targetId: string;
  className?: string;
  variant?: "icon" | "button";
}

export function ReportButton({ reportType, targetId, className = "", variant = "icon" }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const reportMutation = useMutation({
    mutationFn: async (data: { reportType: string; targetId: string; reason: string; description?: string }) => {
      return await apiRequest("/api/reports", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast({ 
        title: "Reporte enviado", 
        description: "Gracias por reportar. Revisaremos tu reporte pronto." 
      });
      setIsOpen(false);
      setReason("");
      setDescription("");
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "No se pudo enviar el reporte. Intenta de nuevo.", 
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({ 
        title: "Error", 
        description: "Por favor selecciona una razón para el reporte.", 
        variant: "destructive" 
      });
      return;
    }

    reportMutation.mutate({
      reportType,
      targetId,
      reason,
      description: description.trim() || undefined,
    });
  };

  const reasonOptions = [
    { value: "spam", label: "Spam o contenido no deseado" },
    { value: "inappropriate", label: "Contenido inapropiado" },
    { value: "harassment", label: "Acoso o bullying" },
    { value: "fake", label: "Perfil falso o fraudulento" },
    { value: "scam", label: "Estafa o fraude" },
    { value: "other", label: "Otra razón" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
          >
            <Flag className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className={`text-red-600 border-red-200 hover:bg-red-50 ${className}`}
          >
            <Flag className="h-4 w-4 mr-1" />
            Reportar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reportar {reportType === "professional_profile" ? "perfil" : "conversación"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason">Razón del reporte</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una razón" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Descripción adicional (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proporciona más detalles sobre el problema..."
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={reportMutation.isPending}
            >
              {reportMutation.isPending ? "Enviando..." : "Enviar reporte"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}