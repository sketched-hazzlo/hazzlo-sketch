import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UserCheck,
  Ban,
  Clock,
  Shield,
  Star,
  Plus,
  Search,
  Settings,
  Database,
  Bell,
  MoreHorizontal,
  Building,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  UserX,
  Crown,
  Award,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  X,
  Flag,
  MessageSquare,
  FileText,
  LifeBuoy,
  Key,
} from "lucide-react";
import SuspensionPrompt from "@/components/suspension-prompt";

export default function AdminDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", icon: "", color: "" });
  const [notificationData, setNotificationData] = useState({ 
    title: "", 
    message: "", 
    type: "system",
    targetEmail: "",
    sendToAll: true 
  });
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [editingTableRow, setEditingTableRow] = useState<any>(null);
  
  // Suspension prompts states
  const [userSuspensionPrompt, setUserSuspensionPrompt] = useState<{
    open: boolean;
    type: "temporary" | "permanent";
    user?: any;
  }>({ open: false, type: "temporary" });
  
  const [professionalSuspensionPrompt, setProfessionalSuspensionPrompt] = useState<{
    open: boolean;
    type: "temporary" | "permanent";
    professional?: any;
  }>({ open: false, type: "temporary" });

  // Chat modal state
  const [chatModal, setChatModal] = useState<{
    open: boolean;
    conversationId: string | null;
    reportId: string | null;
  }>({ open: false, conversationId: null, reportId: null });

  // Fetch admin dashboard data - ALWAYS call hooks first
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/admin/dashboard"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin, // Only run when authenticated and admin
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: professionals, isLoading: professionalsLoading } = useQuery({
    queryKey: ["/api/admin/professionals"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: adminActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["/api/admin/actions"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ["/api/admin/services"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: databaseTables } = useQuery<any>({
    queryKey: ["/api/admin/database/tables"],
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/admin/reports"],
    retry: false,
    enabled: isAuthenticated && !!user?.isAdmin,
  });

  // Fetch chat messages for modal
  const { data: chatMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/admin/conversation", chatModal.conversationId, "messages"],
    enabled: !!chatModal.conversationId && chatModal.open,
  });

  // Debug logging
  useEffect(() => {
    console.log('=== ADMIN DASHBOARD DEBUG ===');
    console.log('authLoading:', authLoading);
    console.log('isAuthenticated:', isAuthenticated);
    console.log('user object:', user);
    console.log('user?.isAdmin:', user?.isAdmin);
    console.log('typeof user?.isAdmin:', typeof user?.isAdmin);
    console.log('user && user.isAdmin:', user && user.isAdmin);
    console.log('!!user?.isAdmin:', !!user?.isAdmin);
    console.log('===============================');
  }, [authLoading, isAuthenticated, user]);

  // All mutations MUST be declared before any conditional logic (React Rules of Hooks)
  const promoteToAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest(`/api/admin/promote-admin`, {
        method: 'POST',
        body: { email }
      });
    },
    onSuccess: () => {
      toast({ title: "Éxito", description: "Usuario promovido a administrador" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSearchEmail("");
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return await apiRequest(`/api/admin/ban-user`, {
        method: 'POST',
        body: { userId, reason }
      });
    },
    onSuccess: () => {
      toast({ title: "Usuario suspendido permanentemente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: async ({ userId, days, reason }: { userId: string; days: number; reason: string }) => {
      return await apiRequest(`/api/admin/suspend-user`, {
        method: 'POST',
        body: { userId, days, reason }
      });
    },
    onSuccess: () => {
      toast({ title: "Usuario suspendido temporalmente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const verifyProfessionalMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await apiRequest(`/api/admin/verify-professional`, {
        method: 'POST',
        body: { professionalId }
      });
    },
    onSuccess: () => {
      toast({ title: "Profesional verificado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData: any) => {
      return await apiRequest(`/api/admin/categories`, {
        method: 'POST',
        body: categoryData
      });
    },
    onSuccess: () => {
      toast({ title: "Categoría creada exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setNewCategory({ name: "", slug: "", description: "", icon: "", color: "" });
    },
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      return await apiRequest(`/api/admin/send-notification`, {
        method: 'POST',
        body: notificationData
      });
    },
    onSuccess: () => {
      toast({ title: "Notificación enviada exitosamente" });
      setNotificationData({ 
        title: "", 
        message: "", 
        type: "system",
        targetEmail: "",
        sendToAll: true 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error enviando notificación", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const loadTableDataMutation = useMutation({
    mutationFn: async (tableName: string) => {
      return await apiRequest(`/api/admin/database/tables/${tableName}/data`);
    },
    onSuccess: (data) => {
      setTableData(data.rows || []);
    },
    onError: (error) => {
      toast({ 
        title: "Error cargando datos", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateTableRowMutation = useMutation({
    mutationFn: async (data: { tableName: string; id: string; updates: any }) => {
      return await apiRequest(`/api/admin/database/tables/${data.tableName}/rows/${data.id}`, {
        method: 'PUT',
        body: data.updates
      });
    },
    onSuccess: () => {
      toast({ title: "Fila actualizada exitosamente" });
      setEditingTableRow(null);
      if (selectedTable) {
        loadTableDataMutation.mutate(selectedTable.name);
      }
    },
    onError: (error) => {
      toast({ 
        title: "Error actualizando fila", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, adminNotes }: { reportId: string; status: string; adminNotes?: string }) => {
      return await apiRequest(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        body: { status, adminNotes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] });
      toast({ title: "Reporte actualizado", description: "El estado del reporte se ha actualizado" });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo actualizar el reporte", variant: "destructive" });
    },
  });

  const togglePremiumMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await apiRequest(`/api/admin/toggle-premium`, {
        method: 'POST',
        body: { professionalId }
      });
    },
    onSuccess: () => {
      toast({ title: "Estado premium actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
  });

  const banProfessionalMutation = useMutation({
    mutationFn: async (data: { professionalId: string; reason?: string }) => {
      return await apiRequest(`/api/admin/ban-professional`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({ title: "Perfil profesional suspendido" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
  });

  const unbanProfessionalMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await apiRequest(`/api/admin/unban-professional`, {
        method: 'POST',
        body: { professionalId }
      });
    },
    onSuccess: () => {
      toast({ title: "Perfil profesional desbloqueado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/unban-user`, {
        method: 'POST',
        body: { userId }
      });
    },
    onSuccess: () => {
      toast({ title: "Usuario desbloqueado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const changeUserTypeMutation = useMutation({
    mutationFn: async (data: { userId: string; newType: string }) => {
      return await apiRequest(`/api/admin/change-user-type`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({ title: "Tipo de usuario actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async (data: { professionalId: string; rating: number }) => {
      return await apiRequest(`/api/admin/update-rating`, {
        method: 'POST',
        body: data
      });
    },
    onSuccess: () => {
      toast({ title: "Rating actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
  });

  const updateProfessionalMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/professionals/${data.id}`, {
        method: 'PUT',
        body: data.updates
      });
    },
    onSuccess: () => {
      toast({ title: "Perfil profesional actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
      setSelectedProfessional(null);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/users/${data.id}`, {
        method: 'PUT',
        body: data.updates
      });
    },
    onSuccess: () => {
      toast({ title: "Usuario actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
    },
  });

  const removeSuspensionMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest(`/api/admin/remove-suspension`, {
        method: 'POST',
        body: { userId }
      });
    },
    onSuccess: () => {
      toast({ title: "Suspensión removida exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const removeProfessionalSuspensionMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await apiRequest(`/api/admin/remove-professional-suspension`, {
        method: 'POST',
        body: { professionalId }
      });
    },
    onSuccess: () => {
      toast({ title: "Suspensión profesional removida exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/professionals"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const loadProfessionalServicesMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await apiRequest(`/api/admin/professional/${professionalId}/services`);
    },
    onSuccess: (data) => {
      toast({ title: `Servicios cargados: ${data.length} servicios encontrados` });
      // You could set this in a state to show in a modal/drawer if needed
      console.log("Professional services:", data);
    },
    onError: (error) => {
      toast({ 
        title: "Error cargando servicios", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Suspension dialog handlers
  const handleUserSuspension = async (data: { reason: string; days?: number }) => {
    try {
      if (userSuspensionPrompt.type === "temporary" && data.days) {
        await suspendUserMutation.mutateAsync({ 
          userId: userSuspensionPrompt.user.id, 
          days: data.days, 
          reason: data.reason 
        });
      } else if (userSuspensionPrompt.type === "permanent") {
        await banUserMutation.mutateAsync({ 
          userId: userSuspensionPrompt.user.id, 
          reason: data.reason 
        });
      }
      setUserSuspensionPrompt({ open: false, type: "temporary" });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const handleProfessionalSuspension = async (data: { reason: string; days?: number }) => {
    try {
      await banProfessionalMutation.mutateAsync({ 
        professionalId: professionalSuspensionPrompt.professional.id, 
        reason: data.reason 
      });
      setProfessionalSuspensionPrompt({ open: false, type: "temporary" });
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  const toggleServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await apiRequest(`/api/admin/service/${serviceId}/toggle`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      toast({ title: "Estado del servicio actualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: async (data: { id: string; updates: any }) => {
      return await apiRequest(`/api/admin/service/${data.id}`, {
        method: 'PUT',
        body: data.updates
      });
    },
    onSuccess: () => {
      toast({ title: "Servicio actualizado exitosamente" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/services"] });
      setSelectedService(null);
    },
    onError: (error) => {
      toast({ 
        title: "Error actualizando servicio", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Authentication protection effects - AFTER all hooks
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        console.log('REDIRECT: User not authenticated');
        toast({
          title: "Acceso denegado",
          description: "Debes iniciar sesión para acceder al panel de administración",
          variant: "destructive"
        });
        setLocation("/auth");
        return;
      }
      
      if (!user?.isAdmin) {
        console.log('REDIRECT: User not admin. User:', JSON.stringify(user, null, 2));
        toast({
          title: "Acceso denegado", 
          description: "No tienes permisos de administrador para acceder a esta sección",
          variant: "destructive"
        });
        setLocation("/");
        return;
      }
      
      console.log('SUCCESS: User is authenticated admin!');
    }
  }, [isAuthenticated, user, authLoading, setLocation, toast]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated or not admin, don't show anything (redirects)
  if (!isAuthenticated || !user?.isAdmin) {
    return null;
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="admin-loading">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="admin-title">
              Panel de Administración
            </h1>
            <p className="text-gray-600 mt-1">Hazzlo</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Shield className="w-3 h-3 mr-1" />
              Panel protegido
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 lg:w-auto lg:grid-cols-9">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="professionals" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Profesionales
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Categorías
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Base de Datos
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              Reportes
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" />
              Soporte
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Registros
            </TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Gestión de Usuarios
                </CardTitle>
                <CardDescription>
                  Administra usuarios, promueve administradores y gestiona suspensiones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Promote to Admin */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <Label htmlFor="admin-email">Promover a Administrador</Label>
                    <Input
                      id="admin-email"
                      placeholder="Buscar por email..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      data-testid="input-admin-email"
                    />
                  </div>
                  <Button
                    onClick={() => promoteToAdminMutation.mutate(searchEmail)}
                    disabled={!searchEmail || promoteToAdminMutation.isPending}
                    data-testid="button-promote-admin"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Promover
                  </Button>
                </div>

                {/* Users Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Cargando usuarios...
                          </TableCell>
                        </TableRow>
                      ) : (users as any[])?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No hay usuarios registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        (users as any[])?.map((user: any) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                  {user.firstName?.[0] || "U"}
                                </div>
                                <span className="font-medium">
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={user.userType === "professional" ? "default" : "secondary"}>
                                {user.userType === "professional" ? "Profesional" : "Cliente"}
                              </Badge>
                              {user.isAdmin && (
                                <Badge variant="outline" className="ml-2">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {user.isBanned ? (
                                <Badge variant="destructive">Suspendido</Badge>
                              ) : user.suspendedUntil ? (
                                <Badge variant="secondary">Suspensión Temporal</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600">Activo</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(user.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {!user.isBanned && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() => setUserSuspensionPrompt({ 
                                          open: true, 
                                          type: "temporary", 
                                          user 
                                        })}
                                      >
                                        <Clock className="w-4 h-4 mr-2" />
                                        Suspender Temporalmente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => setUserSuspensionPrompt({ 
                                          open: true, 
                                          type: "permanent", 
                                          user 
                                        })}
                                        className="text-red-600"
                                      >
                                        <Ban className="w-4 h-4 mr-2" />
                                        Suspender Permanentemente
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => changeUserTypeMutation.mutate({ 
                                          userId: user.id, 
                                          newType: user.userType === "client" ? "professional" : "client" 
                                        })}
                                      >
                                        <Users className="w-4 h-4 mr-2" />
                                        Cambiar a {user.userType === "client" ? "Profesional" : "Cliente"}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {user.isBanned && (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => unbanUserMutation.mutate(user.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Desbloquear Usuario
                                    </DropdownMenuItem>
                                  )}
                                  {user.suspendedUntil && !user.isBanned && (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => removeSuspensionMutation.mutate(user.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Remover Suspensión Temporal
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professionals Management */}
          <TabsContent value="professionals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Gestión de Profesionales
                </CardTitle>
                <CardDescription>
                  Verifica profesionales, gestiona premium y controla sus servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Negocio</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {professionalsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Cargando profesionales...
                          </TableCell>
                        </TableRow>
                      ) : (professionals as any[])?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No hay profesionales registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        (professionals as any[])?.map((professional: any) => (
                          <TableRow key={professional.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{professional.businessName}</div>
                                <div className="text-sm text-gray-500">{professional.description?.slice(0, 50)}...</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{professional.user?.firstName} {professional.user?.lastName}</div>
                                <div className="text-sm text-gray-500">{professional.user?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{professional.location}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span>{professional.rating}</span>
                                <span className="text-gray-500">({professional.reviewCount})</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {professional.isVerified && (
                                  <Badge variant="default">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verificado
                                  </Badge>
                                )}
                                {professional.isPremium && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {professional.isBanned && (
                                  <Badge variant="destructive">Suspendido</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedProfessional(professional)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar Perfil
                                  </DropdownMenuItem>
                                  {!professional.isVerified && (
                                    <DropdownMenuItem
                                      onClick={() => verifyProfessionalMutation.mutate(professional.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Verificar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => togglePremiumMutation.mutate(professional.id)}
                                  >
                                    <Crown className="w-4 h-4 mr-2" />
                                    {professional.isPremium ? "Quitar Premium" : "Hacer Premium"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newRating = prompt(`Nuevo rating para ${professional.businessName} (0-5):`, professional.rating);
                                      if (newRating && !isNaN(Number(newRating))) {
                                        updateRatingMutation.mutate({ professionalId: professional.id, rating: Number(newRating) });
                                      }
                                    }}
                                  >
                                    <Star className="w-4 h-4 mr-2" />
                                    Cambiar Rating
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => loadProfessionalServicesMutation.mutate(professional.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Servicios
                                  </DropdownMenuItem>
                                  {!professional.isBanned ? (
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => setProfessionalSuspensionPrompt({ 
                                        open: true, 
                                        type: "permanent", 
                                        professional 
                                      })}
                                    >
                                      <Ban className="w-4 h-4 mr-2" />
                                      Suspender Perfil
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => unbanProfessionalMutation.mutate(professional.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Reactivar Perfil
                                    </DropdownMenuItem>
                                  )}
                                  {professional.suspendedUntil && !professional.isBanned && (
                                    <DropdownMenuItem
                                      className="text-green-600"
                                      onClick={() => removeProfessionalSuspensionMutation.mutate(professional.id)}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Remover Suspensión Temporal
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Management */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Gestión de Categorías
                </CardTitle>
                <CardDescription>
                  Administra las categorías de servicios disponibles en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Category Form */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="col-span-2 font-semibold">Agregar Nueva Categoría</h3>
                  <div>
                    <Label htmlFor="category-name">Nombre</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="Nombre de la categoría"
                      data-testid="input-category-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-slug">Slug</Label>
                    <Input
                      id="category-slug"
                      value={newCategory.slug}
                      onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                      placeholder="slug-de-categoria"
                      data-testid="input-category-slug"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="category-description">Descripción</Label>
                    <Textarea
                      id="category-description"
                      value={newCategory.description}
                      onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                      placeholder="Descripción de la categoría"
                      data-testid="textarea-category-description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-icon">Icono</Label>
                    <Input
                      id="category-icon"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                      placeholder="nombre-del-icono"
                      data-testid="input-category-icon"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-color">Color</Label>
                    <Input
                      id="category-color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      placeholder="#000000"
                      data-testid="input-category-color"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button
                      onClick={() => createCategoryMutation.mutate(newCategory)}
                      disabled={!newCategory.name || !newCategory.slug || createCategoryMutation.isPending}
                      data-testid="button-create-category"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Categoría
                    </Button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Servicios</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoriesLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Cargando categorías...
                          </TableCell>
                        </TableRow>
                      ) : (categories as any[])?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No hay categorías creadas
                          </TableCell>
                        </TableRow>
                      ) : (
                        (categories as any[])?.map((category: any) => (
                          <TableRow key={category.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                  style={{ backgroundColor: category.color || "#6B7280" }}
                                >
                                  {category.icon || "📁"}
                                </div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {category.slug}
                              </code>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate">{category.description}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">0 servicios</Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => setSelectedUser(user)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Servicios
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Management */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Gestión de Servicios
                </CardTitle>
                <CardDescription>
                  Controla todos los servicios ofrecidos por profesionales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Service search and filters */}
                  <div className="flex gap-4">
                    <Input
                      placeholder="Buscar servicios..."
                      className="max-w-sm"
                    />
                    <Select>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filtrar por profesional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los profesionales</SelectItem>
                        {(professionals as any[])?.map((prof: any) => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.businessName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Profesional</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Duración</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {servicesLoading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="text-gray-500">Cargando servicios...</div>
                            </TableCell>
                          </TableRow>
                        ) : (services as any[])?.length > 0 ? (
                          (services as any[]).map((service: any) => (
                            <TableRow key={service.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{service.title}</div>
                                  <div className="text-sm text-gray-500">{service.description?.slice(0, 50)}...</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{service.businessName}</div>
                                  <div className="text-sm text-gray-500">
                                    {service.firstName} {service.lastName}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {service.priceFrom && service.priceTo ? 
                                    `$${service.priceFrom} - $${service.priceTo}` :
                                    service.priceFrom ? 
                                      `$${service.priceFrom}` : 
                                      'Sin precio'
                                  }
                                </Badge>
                              </TableCell>
                              <TableCell>{service.duration || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge variant={service.isActive ? "default" : "secondary"}>
                                  {service.isActive ? "Activo" : "Inactivo"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedService(service);
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        // Show service details
                                        toast({ 
                                          title: "Detalles del servicio", 
                                          description: `${service.title} - ${service.description || 'Sin descripción'}` 
                                        });
                                      }}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => toggleServiceMutation.mutate(service.id)}
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      {service.isActive ? 'Desactivar' : 'Activar'}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="text-gray-500">
                                <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No hay servicios para mostrar</p>
                                <p className="text-sm mt-2">Los servicios aparecerán aquí cuando los profesionales los publiquen</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Management */}
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Gestión de Base de Datos
                </CardTitle>
                <CardDescription>
                  Acceso directo para editar tablas de la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(databaseTables || []).map((table: any) => (
                      <Card key={table.name} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">🗃️</div>
                            <div className="flex-1">
                              <h3 className="font-medium">{table.displayName || table.name}</h3>
                              <p className="text-sm text-gray-500">Tabla: {table.name}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full mt-3" 
                            size="sm"
                            onClick={() => {
                              setSelectedTable(table);
                              loadTableDataMutation.mutate(table.name);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar Tabla
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Table Editor Modal/Dialog */}
                  <Dialog open={!!selectedTable} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedTable(null);
                      setTableData([]);
                      setEditingTableRow(null);
                    }
                  }}>
                    <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          Editando tabla: {selectedTable?.displayName || selectedTable?.name}
                        </DialogTitle>
                        <DialogDescription>
                          Puedes editar directamente los datos de esta tabla. Haz click en cualquier celda para editarla.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="flex-1 overflow-auto">
                        {loadTableDataMutation.isPending ? (
                          <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p>Cargando datos de la tabla...</p>
                          </div>
                        ) : tableData.length === 0 ? (
                          <div className="text-center py-8">
                            <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500">Esta tabla no tiene datos</p>
                          </div>
                        ) : (
                          <div className="border rounded-lg overflow-auto max-h-96">
                            <Table>
                              <TableHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                                <TableRow>
                                  {tableData[0] && Object.keys(tableData[0]).map((column) => (
                                    <TableHead key={column} className="min-w-32">
                                      {column}
                                    </TableHead>
                                  ))}
                                  <TableHead className="min-w-20">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tableData.map((row: any, index) => (
                                  <TableRow key={row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {Object.entries(row).map(([column, value]) => (
                                      <TableCell key={column} className="max-w-48">
                                        {editingTableRow?.id === row.id && editingTableRow.column === column ? (
                                          <Input
                                            value={editingTableRow.value}
                                            onChange={(e) => setEditingTableRow({ 
                                              ...editingTableRow, 
                                              value: e.target.value 
                                            })}
                                            className="w-full min-w-32"
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                updateTableRowMutation.mutate({
                                                  tableName: selectedTable?.name || '',
                                                  id: row.id,
                                                  updates: { [column]: editingTableRow.value }
                                                });
                                              }
                                              if (e.key === 'Escape') {
                                                setEditingTableRow(null);
                                              }
                                            }}
                                            autoFocus
                                          />
                                        ) : (
                                          <div 
                                            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 px-2 py-1 rounded min-h-[32px] flex items-center transition-colors"
                                            onClick={() => setEditingTableRow({ 
                                              id: row.id, 
                                              column, 
                                              value: String(value || '') 
                                            })}
                                            title="Click para editar"
                                          >
                                            <span className="truncate">
                                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : 
                                               typeof value === 'object' && value !== null ? JSON.stringify(value) :
                                               (value || '-')}
                                            </span>
                                          </div>
                                        )}
                                      </TableCell>
                                    ))}
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingTableRow({ 
                                          id: row.id, 
                                          column: Object.keys(row)[1] || Object.keys(row)[0], 
                                          value: String(row[Object.keys(row)[1]] || row[Object.keys(row)[0]] || '') 
                                        })}
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Acceso Directo a la Base de Datos</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-2">
                      Esta funcionalidad permite editar directamente las tablas de la base de datos. 
                      Haz clic en cualquier celda para editarla. Usa con precaución ya que los cambios son permanentes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Enviar Notificaciones
                </CardTitle>
                <CardDescription>
                  Envía notificaciones a todos los usuarios en nombre de la administración
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notification-title">Título</Label>
                    <Input
                      id="notification-title"
                      value={notificationData.title}
                      onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                      placeholder="Título de la notificación"
                      data-testid="input-notification-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notification-type">Tipo</Label>
                    <Select 
                      value={notificationData.type} 
                      onValueChange={(value) => setNotificationData({ ...notificationData, type: value })}
                    >
                      <SelectTrigger data-testid="select-notification-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">Sistema</SelectItem>
                        <SelectItem value="announcement">Anuncio</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                        <SelectItem value="warning">Advertencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notification-message">Mensaje</Label>
                  <Textarea
                    id="notification-message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                    placeholder="Contenido de la notificación"
                    rows={4}
                    data-testid="textarea-notification-message"
                  />
                </div>
                
                {/* Enhanced targeting options */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="send-to-all"
                      checked={notificationData.sendToAll}
                      onChange={(e) => setNotificationData({ 
                        ...notificationData, 
                        sendToAll: e.target.checked,
                        targetEmail: e.target.checked ? "" : notificationData.targetEmail 
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="send-to-all" className="text-sm font-medium">
                      Enviar a todos los usuarios
                    </Label>
                  </div>
                  
                  {!notificationData.sendToAll && (
                    <div>
                      <Label htmlFor="target-email">Email del usuario específico</Label>
                      <Input
                        id="target-email"
                        type="email"
                        value={notificationData.targetEmail}
                        onChange={(e) => setNotificationData({ ...notificationData, targetEmail: e.target.value })}
                        placeholder="usuario@ejemplo.com"
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Deja en blanco para enviar a todos, o ingresa un email específico
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={() => sendNotificationMutation.mutate(notificationData)}
                    disabled={
                      !notificationData.title || 
                      !notificationData.message || 
                      (!notificationData.sendToAll && !notificationData.targetEmail) ||
                      sendNotificationMutation.isPending
                    }
                    data-testid="button-send-notification"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {sendNotificationMutation.isPending 
                      ? "Enviando..." 
                      : notificationData.sendToAll 
                        ? "Enviar a Todos los Usuarios" 
                        : "Enviar a Usuario Específico"
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Actions Log */}
          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Registro de Acciones Administrativas
                </CardTitle>
                <CardDescription>
                  Historial de todas las acciones realizadas por administradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Administrador</TableHead>
                        <TableHead>Acción</TableHead>
                        <TableHead>Objetivo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Detalles</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actionsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            Cargando acciones...
                          </TableCell>
                        </TableRow>
                      ) : (adminActions as any[])?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            No hay acciones registradas
                          </TableCell>
                        </TableRow>
                      ) : (
                        (adminActions as any[])?.map((action: any) => (
                          <TableRow key={action.id}>
                            <TableCell>{action.admin?.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{action.action}</Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{action.targetType}</div>
                                <div className="text-sm text-gray-500">{action.targetId}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(action.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {action.reason && (
                                <div className="text-sm text-gray-600">{action.reason}</div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Management */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Sistema de Reportes
                </CardTitle>
                <CardDescription>
                  Gestiona reportes de usuarios sobre perfiles y conversaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Reportado por</TableHead>
                        <TableHead>Razón</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportsLoading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Cargando reportes...
                          </TableCell>
                        </TableRow>
                      ) : !reports || reports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            No hay reportes registrados
                          </TableCell>
                        </TableRow>
                      ) : (
                        reports.map((report: any) => (
                          <TableRow key={report.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {report.reportType === "professional_profile" ? (
                                  <FileText className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <MessageSquare className="w-4 h-4 text-green-500" />
                                )}
                                <span className="text-sm">
                                  {report.reportType === "professional_profile" ? "Perfil" : "Chat"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {report.reporter?.firstName} {report.reporter?.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{report.reporter?.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium capitalize">{report.reason.replace('_', ' ')}</div>
                                {report.description && (
                                  <div className="text-sm text-gray-500 max-w-xs truncate">
                                    {report.description}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  report.status === "resolved" ? "default" : 
                                  report.status === "investigating" ? "secondary" : "outline"
                                }
                              >
                                {report.status === "pending" ? "Pendiente" :
                                 report.status === "investigating" ? "Investigando" :
                                 "Resuelto"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    if (report.reportType === "professional_profile") {
                                      // Navigate to professional profile
                                      window.open(`/professional/${report.targetId}`, '_blank');
                                    } else if (report.reportType === "chat_conversation") {
                                      // Open chat messages modal
                                      setChatModal({
                                        open: true,
                                        conversationId: report.targetId,
                                        reportId: report.id
                                      });
                                    }
                                  }}
                                >
                                  Ver
                                </Button>
                                <Select
                                  value={report.status}
                                  onValueChange={(status) => {
                                    updateReportStatusMutation.mutate({
                                      reportId: report.id,
                                      status: status,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pendiente</SelectItem>
                                    <SelectItem value="investigating">Investigando</SelectItem>
                                    <SelectItem value="resolved">Resuelto</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Management */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5" />
                  Centro de Soporte
                </CardTitle>
                <CardDescription>
                  Herramientas y recursos para brindar soporte a los usuarios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <h3 className="font-medium">Chats Abiertos</h3>
                    </div>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-sm text-gray-500">Chats de soporte activos</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-500" />
                      <h3 className="font-medium">Usuarios Activos</h3>
                    </div>
                    <div className="text-2xl font-bold">{(users as any[])?.length || 0}</div>
                    <p className="text-sm text-gray-500">Usuarios registrados en total</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flag className="w-5 h-5 text-red-500" />
                      <h3 className="font-medium">Reportes Activos</h3>
                    </div>
                    <div className="text-2xl font-bold">
                      {reports?.filter((r: any) => r.status !== "resolved").length || 0}
                    </div>
                    <p className="text-sm text-gray-500">Reportes sin resolver</p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Recursos de Soporte</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 justify-start"
                      onClick={() => setLocation("/admin/credenciales")}
                    >
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-purple-500" />
                        <div className="text-left">
                          <div className="font-medium">Credenciales</div>
                          <div className="text-sm text-gray-500">Gestión de moderadores</div>
                        </div>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-auto p-4 justify-start"
                      onClick={() => setLocation("/admin/supervision")}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-500" />
                        <div className="text-left">
                          <div className="font-medium">Chats de Ayuda</div>
                          <div className="text-sm text-gray-500">Supervisión y gestión de chats</div>
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Herramientas Rápidas</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation("/admin/credenciales")}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Credenciales
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation("/moderator/login")}
                    >
                      <LifeBuoy className="w-4 h-4 mr-2" />
                      Login Moderadores
                    </Button>
                    <Button variant="outline" size="sm">
                      <Database className="w-4 h-4 mr-2" />
                      Exportar Datos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation("/admin/verifier")}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Verificaciones
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



        </Tabs>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">Nombre</Label>
                  <Input
                    id="edit-firstName"
                    value={selectedUser.firstName || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                    data-testid="input-edit-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Apellido</Label>
                  <Input
                    id="edit-lastName"
                    value={selectedUser.lastName || ''}
                    onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                    data-testid="input-edit-lastName"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email || ''}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  data-testid="input-edit-email"
                />
              </div>
              <div>
                <Label htmlFor="edit-userType">Tipo de Usuario</Label>
                <Select 
                  value={selectedUser.userType || 'client'} 
                  onValueChange={(value) => setSelectedUser({ ...selectedUser, userType: value })}
                >
                  <SelectTrigger data-testid="select-edit-userType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Cliente</SelectItem>
                    <SelectItem value="professional">Profesional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isAdmin"
                  checked={selectedUser.isAdmin || false}
                  onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isAdmin: checked })}
                  data-testid="switch-edit-isAdmin"
                />
                <Label htmlFor="edit-isAdmin">Es Administrador</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                  data-testid="button-cancel-edit"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedUser) {
                      updateUserMutation.mutate({
                        id: selectedUser.id,
                        updates: {
                          firstName: selectedUser.firstName,
                          lastName: selectedUser.lastName,
                          email: selectedUser.email,
                          userType: selectedUser.userType,
                          isAdmin: selectedUser.isAdmin
                        }
                      });
                    }
                  }}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-edit"
                >
                  {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Professional Dialog */}
      <Dialog open={selectedProfessional !== null} onOpenChange={(open) => !open && setSelectedProfessional(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Perfil Profesional</DialogTitle>
            <DialogDescription>
              Modifica la información del perfil profesional
            </DialogDescription>
          </DialogHeader>
          {selectedProfessional && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-businessName">Nombre del Negocio</Label>
                  <Input
                    id="edit-businessName"
                    value={selectedProfessional.businessName || ''}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, businessName: e.target.value })}
                    data-testid="input-edit-businessName"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-location">Ubicación</Label>
                  <Input
                    id="edit-location"
                    value={selectedProfessional.location || ''}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, location: e.target.value })}
                    data-testid="input-edit-location"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={selectedProfessional.description || ''}
                  onChange={(e) => setSelectedProfessional({ ...selectedProfessional, description: e.target.value })}
                  rows={3}
                  data-testid="textarea-edit-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">Teléfono</Label>
                  <Input
                    id="edit-phone"
                    value={selectedProfessional.phone || ''}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, phone: e.target.value })}
                    data-testid="input-edit-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-website">Sitio Web</Label>
                  <Input
                    id="edit-website"
                    value={selectedProfessional.website || ''}
                    onChange={(e) => setSelectedProfessional({ ...selectedProfessional, website: e.target.value })}
                    data-testid="input-edit-website"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedProfessional(null)}
                  data-testid="button-cancel-edit-professional"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (selectedProfessional) {
                      const updates: any = {};
                      
                      // Extract data from the selectedProfessional state
                      if (selectedProfessional.businessName) updates.businessName = selectedProfessional.businessName;
                      if (selectedProfessional.description) updates.description = selectedProfessional.description;
                      if (selectedProfessional.location) updates.location = selectedProfessional.location;
                      if (selectedProfessional.phone) updates.phone = selectedProfessional.phone;
                      if (selectedProfessional.website) updates.website = selectedProfessional.website;
                      
                      updateProfessionalMutation.mutate({
                        id: selectedProfessional.id,
                        updates
                      });
                    }
                  }}
                  disabled={updateProfessionalMutation.isPending}
                  data-testid="button-save-edit-professional"
                >
                  {updateProfessionalMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Table Row Dialog */}
      <Dialog open={editingTableRow !== null} onOpenChange={(open) => !open && setEditingTableRow(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro - {selectedTable?.name}</DialogTitle>
            <DialogDescription>
              Modifica los valores de este registro en la tabla
            </DialogDescription>
          </DialogHeader>
          {editingTableRow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(editingTableRow).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={`edit-${key}`}>{key}</Label>
                    <Input
                      id={`edit-${key}`}
                      value={String(value || '')}
                      onChange={(e) => setEditingTableRow({ 
                        ...editingTableRow, 
                        [key]: e.target.value 
                      })}
                      data-testid={`input-edit-${key}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingTableRow(null)}
                  data-testid="button-cancel-edit-row"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editingTableRow && selectedTable) {
                      updateTableRowMutation.mutate({
                        tableName: selectedTable.name,
                        id: editingTableRow.id,
                        updates: editingTableRow
                      });
                    }
                  }}
                  disabled={updateTableRowMutation.isPending}
                  data-testid="button-save-edit-row"
                >
                  {updateTableRowMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Suspension Prompt */}
      <SuspensionPrompt
        open={userSuspensionPrompt.open}
        onClose={() => setUserSuspensionPrompt({ open: false, type: "temporary" })}
        onConfirm={handleUserSuspension}
        type={userSuspensionPrompt.type}
        userName={userSuspensionPrompt.user ? `${userSuspensionPrompt.user.firstName} ${userSuspensionPrompt.user.lastName}` : ""}
        isLoading={suspendUserMutation.isPending || banUserMutation.isPending}
      />

      {/* Professional Suspension Prompt */}
      <SuspensionPrompt
        open={professionalSuspensionPrompt.open}
        onClose={() => setProfessionalSuspensionPrompt({ open: false, type: "temporary" })}
        onConfirm={handleProfessionalSuspension}
        type={professionalSuspensionPrompt.type}
        userName={professionalSuspensionPrompt.professional ? professionalSuspensionPrompt.professional.businessName : ""}
        isLoading={banProfessionalMutation.isPending}
      />

      {/* Chat Messages Modal */}
      <Dialog open={chatModal.open} onOpenChange={(open) => setChatModal({ ...chatModal, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Mensajes de la Conversación Reportada
            </DialogTitle>
            <DialogDescription>
              ID de Conversación: {chatModal.conversationId}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {messagesLoading ? (
              <div className="text-center py-8">Cargando mensajes...</div>
            ) : !chatMessages || chatMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay mensajes en esta conversación
              </div>
            ) : (
              <div className="space-y-2">
                {chatMessages.map((message: any) => {
                  const messageDate = new Date(message.createdAt);
                  const dateStr = messageDate.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  });
                  const timeStr = messageDate.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                  const senderName = message.senderName ? 
                    `${message.senderName} ${message.senderLastName || ''}`.trim() : 
                    message.senderEmail || 'Usuario';

                  return (
                    <div key={message.id} className="font-mono text-sm bg-white p-2 rounded border">
                      [{dateStr}|{timeStr}]|{senderName}: {message.content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => setChatModal({ open: false, conversationId: null, reportId: null })}
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Service Dialog */}
      <Dialog open={selectedService !== null} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
            <DialogDescription>
              Modifica la información del servicio seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-service-title">Título</Label>
                <Input
                  id="edit-service-title"
                  value={selectedService.title || ''}
                  onChange={(e) => setSelectedService({ ...selectedService, title: e.target.value })}
                  data-testid="input-edit-service-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-service-description">Descripción</Label>
                <Textarea
                  id="edit-service-description"
                  value={selectedService.description || ''}
                  onChange={(e) => setSelectedService({ ...selectedService, description: e.target.value })}
                  data-testid="textarea-edit-service-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-service-priceFrom">Precio Desde</Label>
                  <Input
                    id="edit-service-priceFrom"
                    type="number"
                    step="0.01"
                    value={selectedService.priceFrom || ''}
                    onChange={(e) => setSelectedService({ ...selectedService, priceFrom: e.target.value })}
                    data-testid="input-edit-service-priceFrom"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-service-priceTo">Precio Hasta</Label>
                  <Input
                    id="edit-service-priceTo"
                    type="number"
                    step="0.01"
                    value={selectedService.priceTo || ''}
                    onChange={(e) => setSelectedService({ ...selectedService, priceTo: e.target.value })}
                    data-testid="input-edit-service-priceTo"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-service-duration">Duración (minutos)</Label>
                <Input
                  id="edit-service-duration"
                  type="number"
                  value={selectedService.duration || ''}
                  onChange={(e) => setSelectedService({ ...selectedService, duration: parseInt(e.target.value) || 0 })}
                  data-testid="input-edit-service-duration"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-service-isActive"
                  checked={selectedService.isActive || false}
                  onCheckedChange={(checked) => setSelectedService({ ...selectedService, isActive: checked })}
                  data-testid="switch-edit-service-isActive"
                />
                <Label htmlFor="edit-service-isActive">Servicio Activo</Label>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedService(null)}
                  data-testid="button-cancel-edit-service"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    updateServiceMutation.mutate({
                      id: selectedService.id,
                      updates: {
                        title: selectedService.title,
                        description: selectedService.description,
                        priceFrom: selectedService.priceFrom ? parseFloat(selectedService.priceFrom) : null,
                        priceTo: selectedService.priceTo ? parseFloat(selectedService.priceTo) : null,
                        duration: selectedService.duration,
                        isActive: selectedService.isActive
                      }
                    });
                  }}
                  disabled={updateServiceMutation.isPending}
                  data-testid="button-save-edit-service"
                >
                  {updateServiceMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}