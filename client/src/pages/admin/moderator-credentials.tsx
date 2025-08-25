import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Trash2,
  Shield,
  Key,
} from "lucide-react";
import type { Moderator } from "@shared/schema";

interface CreateModeratorForm {
  moderatorId: string;
  password: string;
  name: string;
}

export default function ModeratorCredentials() {
  const { user, authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newModerator, setNewModerator] = useState<CreateModeratorForm>({
    moderatorId: "",
    password: "",
    name: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  // Verificar acceso de administrador
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Esta página requiere permisos de administrador
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Obtener moderadores
  const { data: moderators = [], isLoading: moderatorsLoading } = useQuery<Moderator[]>({
    queryKey: ["/api/admin/moderators"],
    queryFn: async () => {
      const response = await apiRequest("/api/admin/moderators");
      return response;
    },
  });

  // Crear moderador
  const createModeratorMutation = useMutation({
    mutationFn: async (data: CreateModeratorForm) => {
      const response = await apiRequest("/api/admin/moderators", {
        method: "POST",
        body: data
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Moderador creado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      setIsCreateDialogOpen(false);
      setNewModerator({ moderatorId: "", password: "", name: "" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear moderador", 
        variant: "destructive" 
      });
    },
  });

  // Activar/desactivar moderador
  const toggleModeratorMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest(`/api/admin/moderators/${id}/toggle`, {
        method: "PATCH",
        body: { isActive }
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Eliminar moderador
  const deleteModeratorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/admin/moderators/${id}`, {
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({ title: "Moderador eliminado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleCreateModerator = () => {
    if (!newModerator.moderatorId.trim() || !newModerator.password.trim() || !newModerator.name.trim()) {
      toast({ 
        title: "Error", 
        description: "Todos los campos son obligatorios", 
        variant: "destructive" 
      });
      return;
    }

    if (newModerator.password.length < 6) {
      toast({ 
        title: "Error", 
        description: "La contraseña debe tener al menos 6 caracteres", 
        variant: "destructive" 
      });
      return;
    }

    createModeratorMutation.mutate(newModerator);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewModerator({ ...newModerator, password });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Key className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Gestión de Credenciales de Moderadores</h1>
        </div>
        <p className="text-gray-600">
          Administra las credenciales de los moderadores para acceso al panel de soporte
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Moderadores ({moderators.length})
              </CardTitle>
              <CardDescription>
                Lista de moderadores con acceso al sistema de soporte
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-moderator">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Moderador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Moderador</DialogTitle>
                  <DialogDescription>
                    Configura las credenciales para un nuevo moderador
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="moderator-id">ID de Moderador</Label>
                    <Input
                      id="moderator-id"
                      value={newModerator.moderatorId}
                      onChange={(e) => setNewModerator({ ...newModerator, moderatorId: e.target.value })}
                      placeholder="Ej: mod001"
                      data-testid="input-moderator-id"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Este será el ID de inicio de sesión
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="moderator-name">Nombre Completo</Label>
                    <Input
                      id="moderator-name"
                      value={newModerator.name}
                      onChange={(e) => setNewModerator({ ...newModerator, name: e.target.value })}
                      placeholder="Nombre del moderador"
                      data-testid="input-moderator-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="moderator-password">Contraseña</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="moderator-password"
                          type={showPassword ? "text" : "password"}
                          value={newModerator.password}
                          onChange={(e) => setNewModerator({ ...newModerator, password: e.target.value })}
                          placeholder="Contraseña"
                          data-testid="input-moderator-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePassword}
                        data-testid="button-generate-password"
                      >
                        Generar
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createModeratorMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateModerator}
                      disabled={createModeratorMutation.isPending}
                      data-testid="button-save-moderator"
                    >
                      {createModeratorMutation.isPending ? "Creando..." : "Crear Moderador"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID de Moderador</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Creación</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moderatorsLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Cargando moderadores...
                    </TableCell>
                  </TableRow>
                ) : moderators.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No hay moderadores creados
                    </TableCell>
                  </TableRow>
                ) : (
                  moderators.map((moderator) => (
                    <TableRow key={moderator.id} data-testid={`row-moderator-${moderator.id}`}>
                      <TableCell className="font-medium">
                        {moderator.moderatorId}
                      </TableCell>
                      <TableCell>{moderator.name}</TableCell>
                      <TableCell>
                        <Badge variant={moderator.isActive ? "default" : "secondary"}>
                          {moderator.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(moderator.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-actions-${moderator.id}`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => toggleModeratorMutation.mutate({
                                id: moderator.id,
                                isActive: !moderator.isActive
                              })}
                              disabled={toggleModeratorMutation.isPending}
                              data-testid={`button-toggle-${moderator.id}`}
                            >
                              {moderator.isActive ? "Desactivar" : "Activar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm(`¿Estás seguro de que quieres eliminar el moderador "${moderator.name}"?`)) {
                                  deleteModeratorMutation.mutate(moderator.id);
                                }
                              }}
                              disabled={deleteModeratorMutation.isPending}
                              className="text-red-600 focus:text-red-600"
                              data-testid={`button-delete-${moderator.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {moderators.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Información Importante</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• Los moderadores usan sus credenciales para acceder al panel /modsupply</p>
                <p>• Solo moderadores activos pueden iniciar sesión</p>
                <p>• Las contraseñas están cifradas y no se pueden recuperar, solo resetear</p>
                <p>• Los moderadores pueden gestionar chats de soporte en tiempo real</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}