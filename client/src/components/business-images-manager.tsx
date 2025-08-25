import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
// Removed apiRequest import - using fetch directly
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical, 
  Edit3, 
  X,
  Plus,
  Image as ImageIcon
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BusinessImage {
  id: string;
  url: string;
  order: number;
  isVisible: boolean;
  createdAt: string;
}

interface BusinessImagesManagerProps {
  professionalId: string;
}

export default function BusinessImagesManager({ professionalId }: BusinessImagesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['/api/business-images', professionalId],
    queryFn: () => fetch(`/api/business-images/${professionalId}`).then(r => r.json()),
    enabled: !!professionalId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const response = await fetch('/api/business-images/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: base64,
          professionalId: professionalId,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-images', professionalId] });
      toast({
        title: "Imagen subida",
        description: "La imagen se ha agregado exitosamente.",
      });
      setUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/business-images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-images', professionalId] });
      toast({
        title: "Imagen eliminada",
        description: "La imagen se ha eliminado exitosamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    },
  });

  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ imageId, isVisible }: { imageId: string; isVisible: boolean }) => {
      const response = await fetch(`/api/business-images/${imageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-images', professionalId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (newOrder: { id: string; orderIndex: number }[]) => {
      const response = await fetch('/api/business-images/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: newOrder }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-images', professionalId] });
      toast({
        title: "Orden actualizado",
        description: "El orden de las imágenes se ha actualizado.",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos de imagen (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validar que no exceda el límite de 10 imágenes
    if (images.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "Solo puedes tener máximo 10 imágenes de negocio",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    uploadMutation.mutate(file);
  };

  const handleDelete = (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (imageToDelete) {
      deleteMutation.mutate(imageToDelete);
      setImageToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const toggleVisibility = (imageId: string, currentVisibility: boolean) => {
    updateVisibilityMutation.mutate({ imageId, isVisible: !currentVisibility });
  };

  const handleDragStart = (e: React.DragEvent, imageId: string) => {
    // Solo permitir arrastre si se inicia desde el handle de arrastre
    if (!(e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      return;
    }
    setDraggedImage(imageId);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropTargetId: string) => {
    e.preventDefault();
    
    if (!draggedImage || draggedImage === dropTargetId || !isDragging) {
      setDraggedImage(null);
      setIsDragging(false);
      return;
    }

    const draggedIndex = images.findIndex((img: BusinessImage) => img.id === draggedImage);
    const dropIndex = images.findIndex((img: BusinessImage) => img.id === dropTargetId);

    if (draggedIndex === -1 || dropIndex === -1) {
      setDraggedImage(null);
      setIsDragging(false);
      return;
    }

    // Crear nuevo orden
    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    // Actualizar órdenes
    const newOrder = newImages.map((img, index) => ({
      id: img.id,
      orderIndex: index
    }));

    reorderMutation.mutate(newOrder);
    setDraggedImage(null);
    setIsDragging(false);
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setIsDragging(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <div className="text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Upload className="h-8 w-8 text-gray-500" />
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Agregar nueva imagen
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sube imágenes de alta calidad que representen tu negocio.
                  <br />
                  Máximo 10 imágenes, hasta 5MB cada una.
                </p>
                
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || images.length >= 10}
                  className="mb-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {uploading ? "Subiendo..." : "Seleccionar imagen"}
                </Button>
                
                <p className="text-xs text-gray-500">
                  {images.length}/10 imágenes utilizadas
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              Imágenes de tu negocio
            </h3>
            <Badge variant="secondary">
              {images.filter((img: BusinessImage) => img.isVisible).length} visibles
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image: BusinessImage, index: number) => (
              <Card
                key={image.id}
                className={`group relative overflow-hidden transition-all duration-200 ${
                  draggedImage === image.id ? 'opacity-50 scale-95 border-blue-300 shadow-lg' : ''
                } ${!image.isVisible ? 'opacity-60' : ''} ${
                  isDragging && draggedImage !== image.id ? 'border-dashed border-2 border-blue-200' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, image.id)}
                onDragEnd={handleDragEnd}
              >
                <div className="aspect-square relative">
                  {(image as any).imageUrl ? (
                    <img
                      src={(image as any).imageUrl}
                      alt={`Imagen de negocio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Imagen de negocio {index + 1}</span>
                    </div>
                  )}
                  
                  {/* Overlay - Always visible on mobile */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 sm:group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-gray-100 text-xs sm:text-sm p-2 sm:p-3"
                        onClick={() => toggleVisibility(image.id, image.isVisible)}
                      >
                        {image.isVisible ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white hover:bg-red-100 text-red-600 text-xs sm:text-sm p-2 sm:p-3"
                        onClick={() => handleDelete(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Drag Handle - Always visible on mobile */}
                  <div className="drag-handle absolute top-2 left-2 cursor-grab active:cursor-grabbing opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 z-10 hover:scale-110">
                    <div className="bg-white rounded-md p-1.5 shadow-md hover:shadow-lg hover:bg-blue-50 border hover:border-blue-200 transition-all duration-200">
                      <GripVertical className="h-4 w-4 text-gray-600 hover:text-blue-600 transition-colors" />
                    </div>
                  </div>

                  {/* Order Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-white text-gray-700">
                      {index + 1}
                    </Badge>
                  </div>

                  {/* Visibility Status */}
                  {!image.isVisible && (
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="destructive">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Oculta
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p>• Arrastra las imágenes para cambiar su orden</p>
            <p>• Usa el ojo para mostrar/ocultar imágenes en tu perfil</p>
            <p>• Las imágenes aparecen en el carrusel de tu perfil profesional</p>
            <p className="text-xs text-gray-500 mt-2">
              En móviles, toca y mantén presionado para arrastrar
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar imagen</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres eliminar esta imagen? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}