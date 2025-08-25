import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  Settings,
  Bell, 
  Mail, 
  MessageSquare, 
  Palette, 
  Globe, 
  Shield, 
  User, 
  CreditCard,
  Trash2,
  Eye,
  EyeOff,
  Upload
} from "lucide-react";

export default function Configuracion() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    enabled: !!user,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: any) => {
      return await apiRequest("/api/settings", {
        method: "PUT",
        body: updatedSettings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Configuración actualizada",
        description: "Tus preferencias han sido guardadas correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las configuraciones",
        variant: "destructive",
      });
    },
  });

  const handleSettingChange = (key: string, value: any) => {
    if (!settings) return;
    
    const updatedSettings = { ...settings, [key]: value };
    updateSettingsMutation.mutate(updatedSettings);
  };

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Compress and resize the image before converting to base64
      const compressedBase64 = await new Promise<string>((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Set maximum dimensions
          const maxWidth = 400;
          const maxHeight = 400;
          let { width, height } = img;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8)); // 80% quality
        };
        
        img.onerror = reject;
        
        // Convert file to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return await apiRequest("/api/users/upload-profile-image", {
        method: "POST",
        body: {
          imageData: compressedBase64,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil ha sido actualizada correctamente",
      });
      setSelectedProfileImage(null);
      // Force refresh to show new image immediately
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil. Inténtalo más tarde.",
        variant: "destructive",
      });
    },
  });

  const handleProfileImageUpload = () => {
    if (selectedProfileImage) {
      uploadProfileImageMutation.mutate(selectedProfileImage);
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/account", {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada permanentemente",
      });
      // Logout and redirect to landing
      logoutMutation.mutate();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la cuenta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate();
    setShowDeleteDialog(false);
  };

  if (isLoading || !settings) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto pt-32 pb-8 px-4 max-w-4xl" data-testid="settings-container">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="title-settings">Configuración</h1>
          {(user as any)?.userType === "professional" && (
            <Badge variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">Profesional</Badge>
          )}
        </div>

        {/* Profile Photo Section */}
        <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Foto de perfil
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Gestiona tu imagen de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center overflow-hidden">
                  {(user as any)?.profileImageUrl ? (
                    <img 
                      src={(user as any).profileImageUrl} 
                      alt="Foto de perfil" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-xl">
                      {(user as any)?.firstName?.charAt(0) || (user as any)?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedProfileImage(file);
                      }
                    }}
                  />
                  <Button 
                    variant="outline" 
                    className="text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    onClick={handleProfileImageUpload}
                    disabled={!selectedProfileImage || uploadProfileImageMutation.isPending}
                  >
                    {uploadProfileImageMutation.isPending ? "Subiendo..." : "Cambiar"}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => {
                    // For now, this would require a separate endpoint to remove the photo
                    toast({
                      title: "Funcionalidad próximamente",
                      description: "La eliminación de fotos estará disponible pronto.",
                    });
                  }}
                >
                  Eliminar foto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Perfil */}
          <Card data-testid="card-profile" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <User className="h-5 w-5" />
                Información del Perfil
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Administra tu información personal y de cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" data-testid="label-firstName" className="text-gray-900 dark:text-white">Nombre</Label>
                  <Input 
                    id="firstName" 
                    value={(user as any)?.firstName || ""} 
                    readOnly 
                    className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    data-testid="input-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" data-testid="label-lastName" className="text-gray-900 dark:text-white">Apellido</Label>
                  <Input 
                    id="lastName" 
                    value={(user as any)?.lastName || ""} 
                    readOnly 
                    className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                    data-testid="input-lastName"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" data-testid="label-email" className="text-gray-900 dark:text-white">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  value={(user as any)?.email || ""} 
                  readOnly 
                  className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  data-testid="input-email"
                />
              </div>
              <div>
                <Label htmlFor="userType" data-testid="label-userType" className="text-gray-900 dark:text-white">Tipo de Usuario</Label>
                <Input 
                  id="userType" 
                  value={(user as any)?.userType === "professional" ? "Profesional" : "Cliente"} 
                  readOnly 
                  className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                  data-testid="input-userType"
                />
              </div>
              
              {/* Chat access for clients */}
              {(user as any)?.userType === "client" && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Mensajes</h3>
                      <p className="text-sm text-muted-foreground">
                        Gestiona todas tus conversaciones
                      </p>
                    </div>
                    <Button 
                      onClick={() => window.location.href = '/all-chats'}
                      variant="outline"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Ver todos los chats
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificaciones */}
          <Card data-testid="card-notifications" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Controla cómo y cuándo quieres recibir notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-900 dark:text-white">Notificaciones por correo</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Recibe notificaciones en tu email</div>
                </div>
                <Switch
                  checked={(settings as any)?.emailNotifications || false}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                  data-testid="switch-emailNotifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-500 dark:text-gray-500">Notificaciones SMS</Label>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    Esta función no está disponible aún
                  </div>
                </div>
                <Switch
                  disabled
                  checked={false}
                  data-testid="switch-smsNotifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-500 dark:text-gray-500">Notificaciones push</Label>
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    Esta función no está disponible aún
                  </div>
                </div>
                <Switch
                  disabled
                  checked={false}
                  data-testid="switch-pushNotifications"
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-900 dark:text-white">Emails promocionales</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Recibe ofertas y novedades</div>
                </div>
                <Switch
                  checked={(settings as any)?.marketingEmails || false}
                  onCheckedChange={(checked) => handleSettingChange("marketingEmails", checked)}
                  data-testid="switch-marketingEmails"
                />
              </div>
            </CardContent>
          </Card>

          {/* Apariencia */}
          <Card data-testid="card-appearance" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Palette className="h-5 w-5" />
                Apariencia
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Personaliza la interfaz según tus preferencias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="theme" className="text-gray-900 dark:text-white">Tema de la aplicación</Label>
                <Select 
                  value={theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => {
                    setTheme(value);
                    handleSettingChange("theme", value);
                  }}
                >
                  <SelectTrigger data-testid="select-theme">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Oscuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="timezone" className="text-gray-900 dark:text-white">Zona horaria</Label>
                <Select 
                  value={(settings as any)?.timezone || "America/Santo_Domingo"} 
                  onValueChange={(value) => handleSettingChange("timezone", value)}
                >
                  <SelectTrigger data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Santo_Domingo">República Dominicana</SelectItem>
                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    <SelectItem value="America/Mexico_City">Ciudad de México</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cuenta */}
          <Card data-testid="card-account" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Shield className="h-5 w-5" />
                Cuenta y Seguridad
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Gestiona tu cuenta y configuración de seguridad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">Cerrar sesión</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cerrar sesión en este dispositivo
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? "Cerrando..." : "Cerrar sesión"}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-red-600 dark:text-red-400">Eliminar cuenta</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Eliminar permanentemente tu cuenta y todos los datos
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteAccountMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delete Account Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro de que quieres eliminar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta
                y todos tus datos de nuestros servidores.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sí, eliminar mi cuenta
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}