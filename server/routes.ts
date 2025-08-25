import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import adminRoutes from "./admin-routes";
import { registerModeratorRoutes } from "./moderator-routes";
import { isUUID, isValidSlug } from "./utils/slug-generator";
import { 
  insertProfessionalSchema, 
  insertServiceSchema, 
  insertReviewSchema,
  insertServiceRequestSchema,
  insertReportSchema,
  insertVerificationRequestSchema,
  insertProfileClickSchema
} from "@shared/schema";

// WebSocket connections store
const wsConnections = new Map<string, WebSocket>();
const moderatorConnections = new Map<string, WebSocket>();

// Utility function to resolve professional by ID or slug
async function resolveProfessional(idOrSlug: string) {
  if (isUUID(idOrSlug)) {
    return await storage.getProfessional(idOrSlug);
  } else if (isValidSlug(idOrSlug)) {
    return await storage.getProfessionalBySlug(idOrSlug);
  }
  return null;
}

// Utility function to resolve professional with details by ID or slug
async function resolveProfessionalWithDetails(idOrSlug: string) {
  if (isUUID(idOrSlug)) {
    return await storage.getProfessionalWithDetails(idOrSlug);
  } else if (isValidSlug(idOrSlug)) {
    return await storage.getProfessionalWithDetailsBySlug(idOrSlug);
  }
  return null;
}

// Global function to notify moderators of new support chats
export function notifyModeratorsOfNewChat(chatData: any) {
  console.log(`[WebSocket] Notifying ${moderatorConnections.size} connected moderators about new support chat`);
  
  moderatorConnections.forEach((ws, moderatorId) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'new_support_chat',
          chat: chatData
        }));
        console.log(`[WebSocket] ✅ Notified moderator ${moderatorId} about new support chat`);
      } catch (error) {
        console.error(`[WebSocket] ❌ Error notifying moderator ${moderatorId}:`, error);
        moderatorConnections.delete(moderatorId);
      }
    } else {
      console.log(`[WebSocket] ⚠️ Removing closed connection for moderator ${moderatorId}`);
      moderatorConnections.delete(moderatorId);
    }
  });
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function registerRoutes(app: Express): Server {
  // Auth middleware
  setupAuth(app);

  // Auth routes are now handled in auth.ts

  // Initialize categories on first load
  app.post('/api/categories/init', async (req, res) => {
    try {
      const existingCategories = await storage.getCategories();
      if (existingCategories.length > 0) {
        return res.json({ message: "Categories already initialized" });
      }

      const defaultCategories = [
        { name: "Belleza", slug: "belleza", description: "Servicios de belleza y cuidado personal", icon: "Scissors", color: "from-blue-100 to-blue-200" },
        { name: "Tecnología", slug: "tecnologia", description: "Desarrollo web, apps y servicios tecnológicos", icon: "Laptop", color: "from-blue-100 to-blue-200" },
        { name: "Hogar", slug: "hogar", description: "Reparaciones y servicios para el hogar", icon: "Home", color: "from-blue-100 to-blue-200" },
        { name: "Automotriz", slug: "automotriz", description: "Reparación y mantenimiento de vehículos", icon: "Car", color: "from-blue-100 to-blue-200" },
        { name: "Educación", slug: "educacion", description: "Tutorías y servicios educativos", icon: "GraduationCap", color: "from-blue-100 to-blue-200" },
        { name: "Salud", slug: "salud", description: "Servicios de salud y bienestar", icon: "Stethoscope", color: "from-blue-100 to-blue-200" },
        { name: "Eventos", slug: "eventos", description: "Organización y servicios para eventos", icon: "PartyPopper", color: "from-blue-100 to-blue-200" },
        { name: "Limpieza", slug: "limpieza", description: "Servicios de limpieza profesional", icon: "Sparkles", color: "from-blue-100 to-blue-200" },
        { name: "Entrenamiento", slug: "entrenamiento", description: "Entrenamiento personal y fitness", icon: "Dumbbell", color: "from-blue-100 to-blue-200" },
        { name: "Diseño", slug: "diseno", description: "Diseño gráfico, web y servicios creativos", icon: "Paintbrush2", color: "from-blue-100 to-blue-200" },
      ];

      for (const category of defaultCategories) {
        await storage.createCategory(category.name, category.slug, category.description, category.icon, category.color);
      }

      res.json({ message: "Categories initialized successfully" });
    } catch (error) {
      console.error("Error initializing categories:", error);
      res.status(500).json({ message: "Failed to initialize categories" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Test email route - Para probar el sistema de correos
  app.post('/api/test-email', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      console.log(`🧪 Enviando correo de prueba a: ${email}`);
      
      // Test email functionality removed
      const result = true;
      
      if (result) {
        res.json({ 
          message: "Correo de prueba enviado exitosamente",
          email: email,
          success: true 
        });
      } else {
        res.status(500).json({ 
          message: "Error enviando correo de prueba",
          email: email,
          success: false 
        });
      }
    } catch (error) {
      console.error("Error en ruta de prueba de correo:", error);
      res.status(500).json({ 
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Auth routes are handled in auth.ts through setupAuth()

  // Professional routes
  app.post('/api/professionals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professionalData = insertProfessionalSchema.parse({ ...req.body, userId });
      
      // Check if user already has a professional profile
      const existing = await storage.getProfessionalByUserId(userId);
      if (existing) {
        return res.status(400).json({ message: "Professional profile already exists" });
      }
      
      const professional = await storage.createProfessional(professionalData);
      
      // Create notification for new professional profile
      await storage.createNotification({
        userId,
        title: "Perfil Profesional Creado",
        message: "Tu perfil profesional ha sido creado exitosamente. Ahora puedes comenzar a recibir solicitudes de clientes.",
        type: "system",
      });

      // Automatically create verification request
      try {
        const verificationRequest = await storage.createVerificationRequest({
          professionalId: professional.id,
          userId: userId,
          status: "pending"
        });

        // Create notification for admin users
        const adminUsers = await storage.getAdminUsers();
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            title: "Nueva Solicitud de Verificación",
            message: `${professional.businessName} ha solicitado verificación de cuenta`,
            type: "system",
            actionUrl: "/admin/verifier"
          });
        }
      } catch (verificationError) {
        console.error('Error creating automatic verification request:', verificationError);
        // Don't fail the professional creation if verification request fails
      }
      
      res.status(201).json(professional);
    } catch (error) {
      console.error("Error creating professional:", error);
      res.status(500).json({ message: "Failed to create professional profile" });
    }
  });

  app.get('/api/professionals/search', async (req, res) => {
    try {
      const { query, category, location, page = '1', limit = '12', sort = 'rating' } = req.query;
      
      const result = await storage.searchProfessionals({
        query: query as string,
        categoryId: category as string,
        location: location as string,
        limit: parseInt(limit as string),
        offset: (parseInt(page as string) - 1) * parseInt(limit as string),
        sortBy: sort as 'rating' | 'reviews' | 'newest',
      });
      
      res.json({
        professionals: result.professionals,
        total: result.total,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string)),
      });
    } catch (error) {
      console.error("Error searching professionals:", error);
      res.status(500).json({ message: "Failed to search professionals" });
    }
  });

  app.get('/api/professionals/:id', async (req, res) => {
    try {
      const professional = await resolveProfessionalWithDetails(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      res.json(professional);
    } catch (error) {
      console.error("Error fetching professional:", error);
      res.status(500).json({ message: "Failed to fetch professional" });
    }
  });

  app.put('/api/professionals/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await resolveProfessional(req.params.id);
      
      if (!professional || professional.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updates = insertProfessionalSchema.partial().parse(req.body);
      const updated = await storage.updateProfessional(professional.id, updates);
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating professional:", error);
      res.status(500).json({ message: "Failed to update professional" });
    }
  });

  // Service routes
  app.post('/api/services', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }
      
      // Fix the service data validation
      const serviceData = {
        ...req.body,
        professionalId: professional.id,
        priceFrom: req.body.priceFrom ? parseInt(req.body.priceFrom) : 0,
        priceTo: req.body.priceTo ? parseInt(req.body.priceTo) : null,
        duration: req.body.duration ? parseInt(req.body.duration) : null,
      };
      
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service", error: (error as Error).message });
    }
  });

  app.get('/api/professionals/:id/services', async (req, res) => {
    try {
      const professional = await resolveProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      const services = await storage.getServicesByProfessional(professional.id);
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Service update route
  app.put('/api/services/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }

      const serviceData = {
        ...req.body,
        priceFrom: req.body.priceFrom ? parseInt(req.body.priceFrom) : null,
        priceTo: req.body.priceTo ? parseInt(req.body.priceTo) : null,
        duration: req.body.duration ? parseInt(req.body.duration) : null,
      };

      const updatedService = await storage.updateService(req.params.id, serviceData);
      if (!updatedService) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(updatedService);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service", error: (error as Error).message });
    }
  });

  // Service delete route
  app.delete('/api/services/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }

      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Review routes
  app.post('/api/reviews', requireAuth, async (req: any, res) => {
    try {
      const clientId = req.user.id;
      const reviewData = insertReviewSchema.parse({ ...req.body, clientId });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post('/api/professionals/:id/reviews', requireAuth, async (req: any, res) => {
    try {
      const clientId = req.user.id;
      
      // RESOLVE SLUG TO REAL ID
      const professional = await resolveProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      
      const reviewData = insertReviewSchema.parse({ ...req.body, clientId, professionalId: professional.id });
      const review = await storage.createReview(reviewData);
      
      // Update professional rating after creating review
      await storage.updateProfessionalRating(professional.id);
      
      res.status(200).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/professionals/:id/reviews', async (req, res) => {
    try {
      const professional = await resolveProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      const reviews = await storage.getReviewsByProfessional(professional.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  // Service request routes
  app.post('/api/service-requests', requireAuth, async (req: any, res) => {
    try {
      const clientId = req.user.id;
      
      // RESOLVE SLUG TO REAL ID for professionalId
      let professionalId = req.body.professionalId;
      if (professionalId) {
        const professional = await resolveProfessional(professionalId);
        if (!professional) {
          return res.status(404).json({ message: "Professional not found" });
        }
        professionalId = professional.id; // Use the real UUID, not the slug
      }
      
      // Convert scheduledDate string to Date object if present
      const requestBody = { ...req.body, clientId, professionalId };
      if (requestBody.scheduledDate && typeof requestBody.scheduledDate === 'string') {
        requestBody.scheduledDate = new Date(requestBody.scheduledDate);
      }
      const requestData = insertServiceRequestSchema.parse(requestBody);
      const serviceRequest = await storage.createServiceRequest(requestData);

      // Create notification for the professional
      try {
        // Get professional info to get the user ID
        const professional = await storage.getProfessional(professionalId);
        if (professional?.userId) {
          // Get client info for the notification
          const client = await storage.getUserById(clientId);
          const clientName = `${client?.firstName || ''} ${client?.lastName || ''}`.trim() || 'Un cliente';
          
          await storage.createNotification({
            userId: professional.userId,
            title: "Nueva solicitud de servicio",
            message: `${clientName} ha solicitado el servicio "${requestData.title}". Ve los detalles en tu dashboard.`,
            type: "service_request",
            actionUrl: `/professional-dashboard?tab=requests`,
            metadata: {
              serviceRequestId: serviceRequest.id,
              clientId: clientId,
              title: requestData.title
            }
          });
          console.log(`[SERVICE REQUEST] ✅ Notification created for professional ${professional.userId}`);
        }
      } catch (notificationError) {
        console.error("[SERVICE REQUEST] ❌ Error creating notification:", notificationError);
        // Don't fail the request if notification fails
      }

      res.status(201).json(serviceRequest);
    } catch (error) {
      console.error("Error creating service request:", error);
      res.status(500).json({ message: "Failed to create service request" });
    }
  });

  app.get('/api/service-requests/client', requireAuth, async (req: any, res) => {
    try {
      const clientId = req.user.id;
      const requests = await storage.getServiceRequestsByClient(clientId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching client service requests:", error);
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });

  app.get('/api/service-requests/professional', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }
      
      const requests = await storage.getServiceRequestsByProfessional(professional.id);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching professional service requests:", error);
      res.status(500).json({ message: "Failed to fetch service requests" });
    }
  });

  app.put('/api/service-requests/:id/status', requireAuth, async (req: any, res) => {
    try {
      const { status } = req.body;
      const updated = await storage.updateServiceRequestStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating service request status:", error);
      res.status(500).json({ message: "Failed to update service request status" });
    }
  });

  // Portfolio routes
  app.post('/api/portfolio', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }
      
      const portfolioItem = await storage.createPortfolioItem({
        ...req.body,
        professionalId: professional.id,
      });
      res.status(201).json(portfolioItem);
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      res.status(500).json({ message: "Failed to create portfolio item" });
    }
  });

  // Portfolio update route
  app.put('/api/portfolio/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }

      const updatedPortfolio = await storage.updatePortfolioItem(req.params.id, req.body);
      if (!updatedPortfolio) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.json(updatedPortfolio);
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      res.status(500).json({ message: "Failed to update portfolio item", error: (error as Error).message });
    }
  });

  // Portfolio delete route
  app.delete('/api/portfolio/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }

      await storage.deletePortfolioItem(req.params.id);
      res.json({ message: "Portfolio item deleted successfully" });
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });

  // Simple image upload route (in production, use proper file storage)
  app.post('/api/upload/image', requireAuth, async (req: any, res) => {
    try {
      // For now, return a placeholder URL
      // In production, implement proper file upload to cloud storage
      res.json({ 
        url: `https://via.placeholder.com/400x300?text=Portfolio+Image&${Date.now()}`,
        message: "Image uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Verification Request routes
  app.post('/api/verification-requests', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }
      
      // Check if there's already a pending request
      const existingRequest = await storage.getVerificationRequestByProfessional(professional.id);
      if (existingRequest && existingRequest.status === 'pending') {
        return res.status(400).json({ message: "Ya tienes una solicitud de verificación pendiente" });
      }
      
      const verificationRequest = await storage.createVerificationRequest({
        professionalId: professional.id,
        userId,
        status: 'pending'
      });
      
      // Create notification for admin users
      try {
        const adminUsers = await storage.getAdminUsers();
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            title: "Nueva Solicitud de Verificación",
            message: `${professional.businessName} ha solicitado verificación de cuenta`,
            type: "system",
            actionUrl: "/admin/verifier"
          });
        }
      } catch (notificationError) {
        console.error('Error creating admin notification:', notificationError);
        // Don't fail the request if notification fails
      }
      
      res.status(201).json(verificationRequest);
    } catch (error) {
      console.error("Error creating verification request:", error);
      res.status(500).json({ message: "Error al enviar solicitud de verificación" });
    }
  });

  app.get('/api/verification-requests/my', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const professional = await storage.getProfessionalByUserId(userId);
      
      if (!professional) {
        return res.status(403).json({ message: "Professional profile required" });
      }
      
      const verificationRequest = await storage.getVerificationRequestByProfessional(professional.id);
      res.json(verificationRequest || null);
    } catch (error) {
      console.error("Error fetching verification request:", error);
      res.status(500).json({ message: "Error al obtener solicitud de verificación" });
    }
  });

  app.get('/api/verification-requests', requireAuth, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const requests = await storage.getAllVerificationRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching verification requests:", error);
      res.status(500).json({ message: "Error al obtener solicitudes de verificación" });
    }
  });

  app.put('/api/admin/verification-requests/:id/review', requireAuth, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const { notes } = req.body;
      
      const updatedRequest = await storage.markVerificationRequestAsReviewed(id, req.user.id, notes);
      if (!updatedRequest) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error reviewing verification request:", error);
      res.status(500).json({ message: "Error al revisar solicitud de verificación" });
    }
  });

  app.put('/api/admin/verification-requests/:id/approve', requireAuth, async (req: any, res) => {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { id } = req.params;
      const { notes } = req.body;
      
      const result = await storage.approveVerificationRequest(id, req.user.id, notes);
      if (!result) {
        return res.status(404).json({ message: "Verification request not found" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error approving verification request:", error);
      res.status(500).json({ message: "Error al verificar profesional" });
    }
  });

  // Chat routes
  app.get('/api/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getConversationsByUser(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { professionalId } = req.body;
      
      if (!professionalId) {
        return res.status(400).json({ message: "Professional ID is required" });
      }

      // Check if conversation already exists
      const existingConversation = await storage.getConversationBetweenUsers(userId, professionalId);
      if (existingConversation) {
        return res.json(existingConversation);
      }

      const conversation = await storage.createConversation({
        clientId: userId,
        professionalId,
        isActive: true,
      });
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations/:conversationId/messages', requireAuth, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      
      // Check if user is the professional owner of this conversation
      let hasAccess = false;
      let userProfessional = null;
      
      if (conversation) {
        // Direct client access
        if (conversation.clientId === userId) {
          hasAccess = true;
        } else {
          // Check if user is the professional associated with this conversation
          userProfessional = await storage.getProfessionalByUserId(userId);
          if (userProfessional && userProfessional.id === conversation.professionalId) {
            hasAccess = true;
          }
        }
      }
      
      console.log('GET messages - User access check:', { 
        userId, 
        conversationId, 
        conversation: conversation ? {
          clientId: conversation.clientId,
          professionalId: conversation.professionalId
        } : null,
        userProfessional: userProfessional ? { id: userProfessional.id } : null,
        hasAccess
      });
      
      if (!conversation || !hasAccess) {
        console.log('GET messages - Access denied for user:', userId);
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:conversationId/messages', requireAuth, async (req: any, res) => {
    console.log('[REST API] POST messages endpoint hit with user:', req.user ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Message content is required" });
      }

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      
      // Check if user is the professional owner of this conversation
      let hasAccess = false;
      let userProfessional = null;
      
      if (conversation) {
        // Direct client access
        if (conversation.clientId === userId) {
          hasAccess = true;
        } else {
          // Check if user is the professional associated with this conversation
          userProfessional = await storage.getProfessionalByUserId(userId);
          if (userProfessional && userProfessional.id === conversation.professionalId) {
            hasAccess = true;
          }
        }
      }
      
      console.log('POST messages - User access check:', { 
        userId, 
        conversationId, 
        conversation: conversation ? {
          clientId: conversation.clientId,
          professionalId: conversation.professionalId
        } : null,
        userProfessional: userProfessional ? { id: userProfessional.id } : null,
        hasAccess
      });
      
      if (!conversation || !hasAccess) {
        console.log('POST messages - Access denied for user:', userId);
        return res.status(403).json({ message: "Access denied" });
      }

      const message = await storage.createMessage({
        conversationId,
        senderId: userId,
        content: content.trim(),
        messageType: 'text',
        isRead: false,
      });

      // Create notification for recipient
      // Get the recipient user ID (not professional ID)
      let recipientId: string;
      if (conversation.clientId === userId) {
        // Sender is client, recipient is professional - need to get professional's user ID
        const professionalUser = await storage.getProfessional(conversation.professionalId);
        recipientId = professionalUser?.userId || conversation.professionalId;
      } else {
        // Sender is professional, recipient is client
        recipientId = conversation.clientId;
      }
      
      const sender = await storage.getUser(userId);
      const senderName = sender ? (sender.firstName && sender.lastName ? 
        `${sender.firstName} ${sender.lastName}` : 
        sender.email || 'Usuario') : 'Usuario';
      
      try {
        console.log(`[REST API] Creating notification for recipient ${recipientId} from sender ${userId}`);
        const notification = await storage.createNotification({
          userId: recipientId,
          title: "Nuevo mensaje",
          message: `${senderName} te ha enviado un mensaje: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          type: "message",
          actionUrl: `/chat?conversation=${conversationId}`,
          metadata: {
            conversationId,
            senderId: userId,
            messageId: message.id
          }
        });
        console.log(`[REST API] ✅ NOTIFICATION CREATED SUCCESSFULLY! ID: ${notification.id} for user ${recipientId}`);
        
        // Send notification update via WebSocket to recipient if connected
        const recipientWs = wsConnections.get(recipientId);
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'new_notification',
            notification
          }));
          console.log(`[REST API] ✅ NOTIFICATION SENT VIA WEBSOCKET to recipient ${recipientId}`);
        } else {
          console.log(`[REST API] ⚠️ Recipient ${recipientId} not connected to WebSocket, notification saved to DB only`);
        }
      } catch (notificationError) {
        console.error("[REST API] ❌ ERROR creating notification:", notificationError);
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/professionals/:id/portfolio', async (req, res) => {
    try {
      const professional = await resolveProfessional(req.params.id);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      const portfolio = await storage.getPortfolioByProfessional(professional.id);
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Profile clicks tracking endpoints
  app.post('/api/professionals/:id/clicks', async (req, res) => {
    try {
      const { id: professionalId } = req.params;
      const { deviceFingerprint, referrerPage } = req.body;
      
      // Validate required fields
      if (!deviceFingerprint) {
        return res.status(400).json({ message: "Device fingerprint is required" });
      }
      
      // Get IP address and user agent
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');
      
      const clickData = {
        professionalId,
        deviceFingerprint,
        ipAddress,
        userAgent,
        referrerPage: referrerPage || 'unknown'
      };
      
      const result = insertProfileClickSchema.safeParse(clickData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid click data", errors: result.error.errors });
      }
      
      // Check if this device already clicked on this professional
      const existingClick = await storage.getProfileClickByDeviceAndProfessional(deviceFingerprint, professionalId);
      if (existingClick) {
        return res.status(200).json({ message: "Click already registered for this device", clickCount: await storage.getProfileClickCount(professionalId) });
      }
      
      // Create new click
      const click = await storage.createProfileClick(result.data);
      const totalClicks = await storage.getProfileClickCount(professionalId);
      
      res.status(201).json({ message: "Click registered", click, clickCount: totalClicks });
    } catch (error) {
      console.error("Error registering profile click:", error);
      res.status(500).json({ message: "Failed to register profile click" });
    }
  });
  
  app.get('/api/professionals/:id/clicks', async (req, res) => {
    try {
      const { id: professionalId } = req.params;
      const clickCount = await storage.getProfileClickCount(professionalId);
      res.json({ clickCount });
    } catch (error) {
      console.error("Error fetching profile clicks:", error);
      res.status(500).json({ message: "Failed to fetch profile clicks" });
    }
  });


  // Notification routes
  app.get('/api/notifications', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.delete('/api/notifications/clear-all', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      await storage.clearAllNotifications(userId);
      res.json({ message: "All notifications cleared" });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
      res.status(500).json({ message: "Failed to clear all notifications" });
    }
  });

  // Profile image upload route
  app.post('/api/users/upload-profile-image', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { imageData, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Validate that the imageData is a valid base64 string
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format" });
      }
      
      // Store the base64 image data directly
      const imageUrl = imageData;
      
      // Update user profile with new image URL
      await storage.updateUserProfileImage(userId, imageUrl);
      
      res.json({ 
        message: "Profile image uploaded successfully",
        imageUrl 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // User settings routes
  app.get('/api/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.getUserSettings(userId);
      res.json(settings || {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: true,
        theme: "system",
        language: "es",
        timezone: "America/Mexico_City",
        privacy: {},
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const settings = await storage.updateUserSettings(userId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Business Images routes
  app.get('/api/business-images/:professionalId', async (req, res) => {
    try {
      // RESOLVE SLUG TO REAL ID
      const professional = await resolveProfessional(req.params.professionalId);
      if (!professional) {
        return res.status(404).json({ message: "Professional not found" });
      }
      
      const images = await storage.getBusinessImagesByProfessional(professional.id);
      res.json(images);
    } catch (error) {
      console.error("Error fetching business images:", error);
      res.status(500).json({ message: "Failed to fetch business images" });
    }
  });

  app.post('/api/business-images/upload', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { imageData, professionalId } = req.body;
      
      if (!imageData || !professionalId) {
        return res.status(400).json({ message: "Image data and professional ID are required" });
      }
      
      // RESOLVE SLUG TO REAL ID if needed
      let resolvedProfessionalId = professionalId;
      let professional;
      
      // Check if professionalId is a slug and resolve it
      if (professionalId && !professionalId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        professional = await resolveProfessional(professionalId);
        if (!professional) {
          return res.status(404).json({ message: "Professional not found" });
        }
        resolvedProfessionalId = professional.id;
      } else {
        professional = await storage.getProfessional(professionalId);
      }
      
      // Verify user owns this professional profile
      if (!professional || professional.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Validate image format
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format" });
      }
      
      // Get current image count
      const currentImages = await storage.getBusinessImagesByProfessional(resolvedProfessionalId);
      if (currentImages.length >= 10) {
        return res.status(400).json({ message: "Maximum 10 images allowed" });
      }
      
      // Create new business image
      const newImage = await storage.createBusinessImage({
        professionalId: resolvedProfessionalId, // Use the resolved ID
        imageUrl: imageData,
        orderIndex: currentImages.length,
        isVisible: true,
      });
      
      res.json(newImage);
    } catch (error) {
      console.error("Error uploading business image:", error);
      res.status(500).json({ message: "Failed to upload business image" });
    }
  });

  app.patch('/api/business-images/:imageId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { imageId } = req.params;
      const updates = req.body;
      
      // Get the image to verify ownership
      const image = await storage.getBusinessImageById(imageId);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Verify user owns this professional profile
      const professional = await storage.getProfessional(image.professionalId);
      if (!professional || professional.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedImage = await storage.updateBusinessImage(imageId, updates);
      res.json(updatedImage);
    } catch (error) {
      console.error("Error updating business image:", error);
      res.status(500).json({ message: "Failed to update business image" });
    }
  });

  app.delete('/api/business-images/:imageId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { imageId } = req.params;
      
      // Get the image to verify ownership
      const imageToDelete = await storage.getBusinessImageById(imageId);
      
      if (!imageToDelete) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Verify user owns this professional profile
      const professional = await storage.getProfessional(imageToDelete.professionalId);
      if (!professional || professional.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteBusinessImage(imageId);
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting business image:", error);
      res.status(500).json({ message: "Failed to delete business image" });
    }
  });

  app.patch('/api/business-images/reorder', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { images } = req.body;
      
      if (!Array.isArray(images)) {
        return res.status(400).json({ message: "Images array is required" });
      }
      
      // Verify user owns all these images by checking the first one
      if (images.length > 0) {
        const firstImage = await storage.getBusinessImageById(images[0].id);
        
        if (firstImage) {
          const professional = await storage.getProfessional(firstImage.professionalId);
          if (!professional || professional.userId !== userId) {
            return res.status(403).json({ message: "Access denied" });
          }
        }
      }
      
      // Update order
      const reorderData = images.map((img, index) => ({
        id: img.id,
        orderIndex: index
      }));
      
      await storage.reorderBusinessImages(reorderData);
      res.json({ message: "Images reordered successfully" });
    } catch (error) {
      console.error("Error reordering business images:", error);
      res.status(500).json({ message: "Failed to reorder business images" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server without automatic path handling to avoid conflicts
  const wss = new WebSocketServer({ 
    noServer: true
  });

  // Manual WebSocket upgrade handling
  httpServer.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url!, `http://${request.headers.host}`);
    
    if (url.pathname === '/ws-chat') {
      console.log('[WebSocket] Valid /ws-chat upgrade, handling WebSocket connection');
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('[WebSocket] WebSocket upgrade successful');
        wss.emit('connection', ws, request);
      });
    } else {
      // Silently ignore non-chat WebSocket requests (like Vite HMR)
      if (url.pathname !== '/') {
        console.log(`[WebSocket] Ignoring upgrade request for: ${url.pathname}`);
      }
      socket.destroy();
    }
  });
  
  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] New WebSocket chat connection established');
    console.log('[WebSocket] Connection URL:', req.url);
    console.log('[WebSocket] Connection origin:', req.headers.origin);
    
    ws.on('message', async (data) => {
      console.log('[WebSocket] Raw message received:', data.toString());
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Parsed message:', message);
        
        switch (message.type) {
          case 'join':
            // User joins with their userId
            if (message.userId) {
              wsConnections.set(message.userId, ws);
              console.log(`User ${message.userId} joined chat WebSocket`);
            }
            break;
            
          case 'moderator_join':
            // Moderator joins to receive support chat updates
            if (message.moderatorId) {
              moderatorConnections.set(message.moderatorId, ws);
              console.log(`Moderator ${message.moderatorId} joined WebSocket for support updates`);
            }
            break;
            
          case 'chat_message':
            // Handle real-time chat message
            console.log(`[WebSocket] Received chat_message:`, message);
            const { conversationId, content, senderId } = message;
            if (conversationId && content && senderId) {
              // Save message to database
              const newMessage = await storage.createMessage({
                conversationId,
                senderId,
                content: content.trim(),
                messageType: 'text',
                isRead: false,
              });
              
              // Get conversation to find recipient
              const conversation = await storage.getConversation(conversationId);
              console.log(`[WebSocket] Conversation found:`, conversation ? 'YES' : 'NO');
              if (conversation) {
                // Get the recipient user ID (not professional ID)
                let recipientId: string;
                if (conversation.clientId === senderId) {
                  // Sender is client, recipient is professional - need to get professional's user ID
                  const professionalUser = await storage.getProfessional(conversation.professionalId);
                  recipientId = professionalUser?.userId || conversation.professionalId;
                } else {
                  // Sender is professional, recipient is client
                  recipientId = conversation.clientId;
                }
                console.log(`[WebSocket] Determined recipientId: ${recipientId} from senderId: ${senderId}`);
                
                // Get sender information for notification
                const sender = await storage.getUser(senderId);
                const senderName = sender ? (sender.firstName && sender.lastName ? 
                  `${sender.firstName} ${sender.lastName}` : 
                  sender.email || 'Usuario') : 'Usuario';
                
                // Create notification for recipient
                try {
                  console.log(`[WebSocket] Creating notification for recipient ${recipientId} from sender ${senderId}`);
                  const notification = await storage.createNotification({
                    userId: recipientId,
                    title: "Nuevo mensaje",
                    message: `${senderName} te ha enviado un mensaje: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
                    type: "message",
                    actionUrl: `/chat?conversation=${conversationId}`,
                    metadata: {
                      conversationId,
                      senderId,
                      messageId: newMessage.id
                    }
                  });
                  console.log(`[WebSocket] ✅ NOTIFICATION CREATED SUCCESSFULLY! ID: ${notification.id} for user ${recipientId}`);
                  
                  // Send notification update via WebSocket to recipient if connected
                  const recipientWs = wsConnections.get(recipientId);
                  if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                    recipientWs.send(JSON.stringify({
                      type: 'new_notification',
                      notification
                    }));
                    console.log(`[WebSocket] ✅ NOTIFICATION SENT VIA WEBSOCKET to recipient ${recipientId}`);
                  } else {
                    console.log(`[WebSocket] ⚠️ Recipient ${recipientId} not connected to WebSocket, notification saved to DB only`);
                  }
                } catch (notificationError) {
                  console.error("[WebSocket] ❌ ERROR creating notification:", notificationError);
                }
                
                // Send to recipient if connected
                const recipientWs = wsConnections.get(recipientId);
                if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
                  recipientWs.send(JSON.stringify({
                    type: 'new_message',
                    message: newMessage,
                    conversationId
                  }));
                }
                
                // Send confirmation back to sender
                ws.send(JSON.stringify({
                  type: 'message_sent',
                  message: newMessage,
                  conversationId
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove connection when client disconnects
      Array.from(wsConnections.entries()).forEach(([userId, connection]) => {
        if (connection === ws) {
          wsConnections.delete(userId);
          console.log(`User ${userId} disconnected from chat WebSocket`);
        }
      });
      
      // Remove moderator connection when they disconnect
      Array.from(moderatorConnections.entries()).forEach(([moderatorId, connection]) => {
        if (connection === ws) {
          moderatorConnections.delete(moderatorId);
          console.log(`Moderator ${moderatorId} disconnected from WebSocket`);
        }
      });
    });
  });



  // Delete conversation endpoint
  app.delete('/api/conversations/:conversationId', requireAuth, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      // Verify user has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      let hasAccess = false;
      
      // Check if user is part of this conversation
      if (conversation.clientId === userId) {
        hasAccess = true;
      } else {
        const userProfessional = await storage.getProfessionalByUserId(userId);
        if (userProfessional && userProfessional.id === conversation.professionalId) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete all messages in the conversation first
      await storage.deleteMessagesByConversation(conversationId);
      
      // Delete the conversation
      await storage.deleteConversation(conversationId);
      
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Report routes
  app.post('/api/reports', requireAuth, async (req: any, res) => {
    try {
      const reporterId = req.user.id;
      const reportData = insertReportSchema.parse({ ...req.body, reporterId });
      const report = await storage.createReport(reportData);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Error creando reporte" });
    }
  });

  // Report conversation route (legacy compatibility)
  app.post('/api/conversations/:conversationId/report', requireAuth, async (req: any, res) => {
    try {
      const reporterId = req.user.id;
      const { conversationId } = req.params;
      
      console.log(`🔴 CHAT REPORT: Conversation ${conversationId} reported by user ${reporterId}`);
      console.log('🔴 User object:', req.user);
      console.log('🔴 Session:', req.sessionID);
      
      // Create report using the new reports system
      const reportData = {
        reportType: "chat_conversation" as const,
        targetId: conversationId,
        reporterId,
        reason: "inappropriate", // Default reason for legacy reports
        description: "Reported from chat interface",
        status: "pending" as const,
      };
      
      console.log('🔴 Creating report with data:', reportData);
      const report = await storage.createReport(reportData);
      console.log('🔴 Report created successfully:', report.id);
      
      res.json({ message: "Conversación reportada exitosamente", reportId: report.id });
    } catch (error) {
      console.error("🔴 Error reporting conversation:", error);
      res.status(500).json({ message: "Error reportando conversación" });
    }
  });

  // Moderator routes
  registerModeratorRoutes(app);

  // Admin routes
  app.use("/api/admin", adminRoutes);

  // Help support form submission
  app.post('/api/help/submit', async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "Todos los campos son requeridos" });
      }

      // Import sendHelpFormEmail function
      const { sendHelpFormEmail } = await import('./email-service.js');

      // Send email to support
      await sendHelpFormEmail(name, email, subject, message);

      const consultation = {
        id: Date.now().toString(),
        name,
        email,
        subject,
        message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Read existing consultations
      const fs = require('fs');
      const path = require('path');
      const consultationsPath = path.join(process.cwd(), 'consultasayuda.json');
      
      let consultations = [];
      try {
        if (fs.existsSync(consultationsPath)) {
          const data = fs.readFileSync(consultationsPath, 'utf8');
          consultations = JSON.parse(data);
        }
      } catch (error) {
        console.log('Creating new consultasayuda.json file');
      }

      // Add new consultation
      consultations.push(consultation);

      // Write back to file
      fs.writeFileSync(consultationsPath, JSON.stringify(consultations, null, 2));

      res.json({ message: "Consulta enviada exitosamente", id: consultation.id });
    } catch (error) {
      console.error("Error sending help form:", error);
      res.status(500).json({ message: "Error al enviar consulta" });
    }
  });
  
  return httpServer;
}
