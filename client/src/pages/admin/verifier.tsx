import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Clock,
  Eye,
  ArrowLeft,
  User,
  Building,
  Calendar,
  FileText
} from "lucide-react";

export default function VerificationRequestsPage() {
  const { user, authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Check if user is admin
  if (!authLoading && (!user || !user.isAdmin)) {
    setLocation("/admin");
    return null;
  }

  const { data: verificationRequests = [], isLoading } = useQuery({
    queryKey: ['/api/verification-requests'],
    queryFn: () => fetch('/api/verification-requests').then(r => r.json()),
  });

  const markAsReviewedMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/admin/verification-requests/${id}/review`, {
        method: 'PUT',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "Solicitud marcada como revisada",
        description: "La solicitud ha sido marcada como revisada exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests'] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo marcar la solicitud como revisada.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return await apiRequest(`/api/admin/verification-requests/${id}/approve`, {
        method: 'PUT',
        body: { notes }
      });
    },
    onSuccess: () => {
      toast({
        title: "Profesional verificado",
        description: "El profesional ha sido verificado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/verification-requests'] });
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo verificar el profesional.",
        variant: "destructive",
      });
    },
  });

  const pendingRequests = verificationRequests.filter((req: any) => req.status === 'pending');
  const reviewedRequests = verificationRequests.filter((req: any) => req.status === 'reviewed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Solicitudes de Verificación
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gestiona las solicitudes de verificación de profesionales
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Requieren revisión
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes Revisadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviewedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Ya procesadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Solicitudes Pendientes ({pendingRequests.length})
            </CardTitle>
            <CardDescription>
              Estas solicitudes requieren revisión administrativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando solicitudes...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Fecha de Solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {request.professional?.user?.firstName} {request.professional?.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.professional?.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{request.professional?.businessName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.professional?.location}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(request.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Pendiente
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Revisar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Revisar Solicitud</DialogTitle>
                              <DialogDescription>
                                Revisa y verifica esta solicitud de profesional
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium">Profesional:</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedRequest?.professional?.user?.firstName} {selectedRequest?.professional?.user?.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Negocio:</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedRequest?.professional?.businessName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Ubicación:</p>
                                <p className="text-sm text-muted-foreground">
                                  {selectedRequest?.professional?.location}
                                </p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Notas de revisión (opcional):</label>
                                <Textarea
                                  value={reviewNotes}
                                  onChange={(e) => setReviewNotes(e.target.value)}
                                  placeholder="Agrega notas sobre la revisión..."
                                  className="mt-2"
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedRequest(null);
                                    setReviewNotes("");
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => {
                                    if (selectedRequest) {
                                      markAsReviewedMutation.mutate({
                                        id: selectedRequest.id,
                                        notes: reviewNotes
                                      });
                                    }
                                  }}
                                  disabled={markAsReviewedMutation.isPending}
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  {markAsReviewedMutation.isPending ? "Marcando..." : "Solo Marcar como Revisada"}
                                </Button>
                                <Button
                                  onClick={() => {
                                    if (selectedRequest) {
                                      approveMutation.mutate({
                                        id: selectedRequest.id,
                                        notes: reviewNotes
                                      });
                                    }
                                  }}
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  {approveMutation.isPending ? "Verificando..." : "Verificar Profesional"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reviewed Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Solicitudes Revisadas ({reviewedRequests.length})
            </CardTitle>
            <CardDescription>
              Historial de solicitudes ya procesadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviewedRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-muted-foreground">No hay solicitudes revisadas aún</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Negocio</TableHead>
                    <TableHead>Fecha de Solicitud</TableHead>
                    <TableHead>Fecha de Revisión</TableHead>
                    <TableHead>Revisado por</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewedRequests.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {request.professional?.user?.firstName} {request.professional?.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.professional?.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{request.professional?.businessName}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.professional?.location}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDate(request.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {request.reviewedAt ? formatDate(request.reviewedAt) : "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {request.reviewedByUser ? 
                            `${request.reviewedByUser.firstName} ${request.reviewedByUser.lastName}` : 
                            "N/A"
                          }
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Revisada
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}