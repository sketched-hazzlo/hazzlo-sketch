import { Router } from "express";
import { eq, sql, desc, and, or, like } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  professionals, 
  categories, 
  services, 
  adminActions,
  serviceRequests,
  reviews,
  notifications,
  reports,
  conversations,
  messages,
  supportChats,
  supportMessages,
  moderators
} from "@shared/schema";
import type { InsertSupportMessage } from "@shared/schema";
import { isAuthenticated, isAdmin } from "./auth";
import { createHash } from "crypto";

const router = Router();

// Middleware to ensure user is authenticated and is admin
router.use((req: any, res: any, next: any) => {
  console.log('Admin middleware check:', {
    isAuthenticated: req.isAuthenticated?.(),
    user: req.user ? { id: req.user.id, email: req.user.email, isAdmin: req.user.isAdmin } : null,
    sessionID: req.sessionID,
    hasSession: !!req.session,
    sessionPassport: req.session?.passport,
    cookies: req.headers.cookie
  });
  
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Admin privileges required" });
  }
  next();
});

// Dashboard stats
// Support chat management routes for admins
router.get("/support-chats", async (req, res) => {
  try {
    const chats = await db
      .select({
        id: supportChats.id,
        subject: supportChats.subject,
        status: supportChats.status,
        priority: supportChats.priority,
        adminIntervened: supportChats.adminIntervened,
        adminInterventionId: supportChats.adminInterventionId,
        escalationReason: supportChats.escalationReason,
        lastMessageAt: supportChats.lastMessageAt,
        createdAt: supportChats.createdAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
        moderator: moderators ? {
          id: moderators.id,
          name: moderators.name,
        } : null,
        adminIntervention: users ? {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        } : null,
      })
      .from(supportChats)
      .leftJoin(users, eq(supportChats.userId, users.id))
      .leftJoin(moderators, eq(supportChats.moderatorId, moderators.id))
      .where(
        or(
          eq(supportChats.status, "open"),
          eq(supportChats.status, "assigned"),
          eq(supportChats.status, "escalated"),
          eq(supportChats.adminIntervened, true)
        )
      )
      .orderBy(desc(supportChats.createdAt));

    res.json(chats);
  } catch (error) {
    console.error("Error fetching admin support chats:", error);
    res.status(500).json({ message: "Failed to fetch support chats" });
  }
});

router.post("/support-chat/:chatId/message", async (req: any, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const adminId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Verify chat exists and admin can participate
    const [chat] = await db
      .select({ 
        id: supportChats.id, 
        status: supportChats.status,
        adminIntervened: supportChats.adminIntervened 
      })
      .from(supportChats)
      .where(eq(supportChats.id, chatId))
      .limit(1);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Admin can only send messages if chat is escalated or they have intervened
    if (chat.status !== "escalated" && !chat.adminIntervened) {
      return res.status(403).json({ message: "Cannot send message to this chat" });
    }

    const newMessage: InsertSupportMessage = {
      supportChatId: chatId,
      senderId: adminId,
      senderType: "admin",
      content: content.trim(),
      messageType: "text",
      isRead: false
    };

    const [createdMessage] = await db.insert(supportMessages).values(newMessage).returning();

    // Update last message time
    await db
      .update(supportChats)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportChats.id, chatId));

    res.json(createdMessage);
  } catch (error) {
    console.error("Error sending admin message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

router.post("/support-chat/:chatId/intervene", async (req: any, res) => {
  try {
    const { chatId } = req.params;
    const adminId = req.user.id;

    // Update chat to mark admin intervention
    const [updatedChat] = await db
      .update(supportChats)
      .set({ 
        adminIntervened: true,
        adminInterventionId: adminId,
        isAdminVisible: true,
        updatedAt: new Date()
      })
      .where(eq(supportChats.id, chatId))
      .returning();

    if (!updatedChat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.json({ message: "Admin intervention activated", chat: updatedChat });
  } catch (error) {
    console.error("Error activating admin intervention:", error);
    res.status(500).json({ message: "Failed to activate intervention" });
  }
});

router.post("/support-chat/:chatId/close", async (req: any, res) => {
  try {
    const { chatId } = req.params;
    const adminId = req.user.id;

    // Only admins can close escalated chats
    const [chat] = await db
      .select({ status: supportChats.status })
      .from(supportChats)
      .where(eq(supportChats.id, chatId))
      .limit(1);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (chat.status !== "escalated") {
      return res.status(400).json({ message: "Only escalated chats can be closed by admins" });
    }

    await db
      .update(supportChats)
      .set({ 
        status: "closed",
        closedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportChats.id, chatId));

    res.json({ message: "Chat closed successfully" });
  } catch (error) {
    console.error("Error closing admin chat:", error);
    res.status(500).json({ message: "Failed to close chat" });
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalUsers,
      totalProfessionals,
      activeRequests,
      monthlyRevenue
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users),
      db.select({ count: sql<number>`count(*)` }).from(professionals),
      db.select({ count: sql<number>`count(*)` }).from(serviceRequests).where(eq(serviceRequests.status, "pending")),
      // For now, mock revenue data - would integrate with payment system later
      Promise.resolve([{ revenue: 15750 }])
    ]);

    res.json({
      stats: {
        totalUsers: totalUsers[0]?.count || 0,
        totalProfessionals: totalProfessionals[0]?.count || 0,
        activeRequests: activeRequests[0]?.count || 0,
        monthlyRevenue: monthlyRevenue[0]?.revenue || 0,
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

// Get all professionals
router.get("/professionals", async (req, res) => {
  try {
    const allProfessionals = await db
      .select({
        id: professionals.id,
        userId: professionals.userId,
        businessName: professionals.businessName,
        description: professionals.description,
        location: professionals.location,
        isVerified: professionals.isVerified,
        isPremium: professionals.isPremium,
        rating: professionals.rating,
        reviewCount: professionals.reviewCount,
        completedServices: professionals.completedServices,
        isBanned: professionals.isBanned,
        suspendedUntil: professionals.suspendedUntil,
        createdAt: professionals.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        }
      })
      .from(professionals)
      .leftJoin(users, eq(professionals.userId, users.id))
      .orderBy(desc(professionals.createdAt));

    res.json(allProfessionals);
  } catch (error) {
    console.error("Error fetching professionals:", error);
    res.status(500).json({ message: "Error fetching professionals" });
  }
});

// Promote user to admin
router.post("/promote-admin", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email es requerido" });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (user.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (user[0].isAdmin) {
      return res.status(400).json({ message: "Usuario ya es administrador" });
    }

    await db.update(users).set({ isAdmin: true }).where(eq(users.email, email));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user",
        targetId: user[0].id,
        action: "promote_admin",
        reason: `Usuario promovido a administrador: ${email}`,
      });
    }

    res.json({ message: "Usuario promovido a administrador exitosamente" });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    res.status(500).json({ message: "Error promoviendo usuario a administrador" });
  }
});

// Ban user permanently
router.post("/ban-user", async (req, res) => {
  try {
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "ID de usuario requerido" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "La razón de suspensión es requerida" });
    }

    await db.update(users).set({ 
      isBanned: true,
      suspensionReason: reason
    }).where(eq(users.id, userId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user",
        targetId: userId,
        action: "ban_user",
        reason: reason,
      });
    }

    // Send notification to user about suspension
    await db.insert(notifications).values({
      userId: userId,
      title: "Cuenta Suspendida Permanentemente",
      message: `Tu cuenta ha sido suspendida permanentemente. Razón: ${reason}`,
      type: "system",
      metadata: { suspensionType: "permanent", reason },
    });

    res.json({ message: "Usuario suspendido permanentemente" });
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Error suspendiendo usuario" });
  }
});

// Suspend user temporarily
router.post("/suspend-user", async (req, res) => {
  try {
    const { userId, days, reason } = req.body;

    if (!userId || !days) {
      return res.status(400).json({ message: "ID de usuario y días son requeridos" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "La razón de suspensión es requerida" });
    }

    const suspendedUntil = new Date();
    suspendedUntil.setDate(suspendedUntil.getDate() + days);

    await db.update(users).set({ 
      suspendedUntil,
      suspensionReason: reason
    }).where(eq(users.id, userId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user",
        targetId: userId,
        action: "suspend_user",
        reason: `Suspensión temporal por ${days} días: ${reason}`,
        details: { days, suspendedUntil },
      });
    }

    // Send notification to user about suspension
    await db.insert(notifications).values({
      userId: userId,
      title: "Cuenta Suspendida Temporalmente",
      message: `Tu cuenta ha sido suspendida temporalmente por ${days} días. Razón: ${reason}. Podrás acceder nuevamente el ${suspendedUntil.toLocaleDateString()}.`,
      type: "system",
      metadata: { suspensionType: "temporary", days, suspendedUntil, reason },
    });

    res.json({ message: `Usuario suspendido por ${days} días` });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ message: "Error suspendiendo usuario temporalmente" });
  }
});

// Verify professional
router.post("/verify-professional", async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({ message: "ID de profesional requerido" });
    }

    await db.update(professionals).set({ isVerified: true }).where(eq(professionals.id, professionalId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: professionalId,
        action: "verify_professional",
        reason: "Profesional verificado por administrador",
      });
    }

    res.json({ message: "Profesional verificado exitosamente" });
  } catch (error) {
    console.error("Error verifying professional:", error);
    res.status(500).json({ message: "Error verificando profesional" });
  }
});

// Toggle professional premium status
router.post("/toggle-premium", async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({ message: "ID de profesional requerido" });
    }

    const professional = await db.select().from(professionals).where(eq(professionals.id, professionalId)).limit(1);
    
    if (professional.length === 0) {
      return res.status(404).json({ message: "Profesional no encontrado" });
    }

    const newPremiumStatus = !professional[0].isPremium;
    
    await db.update(professionals).set({ isPremium: newPremiumStatus }).where(eq(professionals.id, professionalId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: professionalId,
        action: newPremiumStatus ? "make_premium" : "remove_premium",
        reason: `Estado premium ${newPremiumStatus ? "activado" : "desactivado"} por administrador`,
      });
    }

    res.json({ message: `Profesional ${newPremiumStatus ? "promovido a" : "removido de"} premium` });
  } catch (error) {
    console.error("Error toggling premium status:", error);
    res.status(500).json({ message: "Error cambiando estado premium" });
  }
});

// Ban professional profile (not the user account)
router.post("/ban-professional", async (req, res) => {
  try {
    const { professionalId, reason } = req.body;

    if (!professionalId) {
      return res.status(400).json({ message: "ID de profesional requerido" });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ message: "La razón de suspensión es requerida" });
    }

    // Get professional info for notification
    const professional = await db
      .select({
        userId: professionals.userId,
        businessName: professionals.businessName
      })
      .from(professionals)
      .where(eq(professionals.id, professionalId))
      .limit(1);

    if (professional.length === 0) {
      return res.status(404).json({ message: "Profesional no encontrado" });
    }

    await db.update(professionals).set({ 
      isBanned: true,
      suspensionReason: reason
    }).where(eq(professionals.id, professionalId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: professionalId,
        action: "ban_professional",
        reason: reason,
      });
    }

    // Send notification to professional about profile suspension
    await db.insert(notifications).values({
      userId: professional[0].userId,
      title: "Perfil Profesional Suspendido",
      message: `Tu perfil profesional "${professional[0].businessName}" ha sido suspendido y ocultado de la plataforma. Razón: ${reason}`,
      type: "system",
      metadata: { suspensionType: "professional_profile", reason, professionalId },
    });

    res.json({ message: "Perfil profesional suspendido" });
  } catch (error) {
    console.error("Error banning professional:", error);
    res.status(500).json({ message: "Error suspendiendo perfil profesional" });
  }
});

// Create category
router.post("/categories", async (req, res) => {
  try {
    const { name, slug, description, icon, color } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: "Nombre y slug son requeridos" });
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      description,
      icon,
      color,
    }).returning();

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "category",
        targetId: newCategory.id,
        action: "create_category",
        reason: `Categoría creada: ${name}`,
      });
    }

    res.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ message: "Error creando categoría" });
  }
});

// Get all admin actions
router.get("/actions", async (req, res) => {
  try {
    const actions = await db.select().from(adminActions).orderBy(desc(adminActions.createdAt)).limit(100);
    res.json(actions);
  } catch (error) {
    console.error("Error fetching admin actions:", error);
    res.status(500).json({ message: "Error obteniendo acciones de admin" });
  }
});

// Change user type (client/professional)
router.post("/change-user-type", async (req, res) => {
  try {
    const { userId, newType } = req.body;

    if (!userId || !newType || !["client", "professional"].includes(newType)) {
      return res.status(400).json({ message: "ID de usuario y tipo válido son requeridos" });
    }

    await db.update(users).set({ userType: newType }).where(eq(users.id, userId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user",
        targetId: userId,
        action: "change_user_type",
        reason: `Tipo de usuario cambiado a: ${newType}`,
      });
    }

    res.json({ message: `Tipo de usuario cambiado a ${newType}` });
  } catch (error) {
    console.error("Error changing user type:", error);
    res.status(500).json({ message: "Error cambiando tipo de usuario" });
  }
});

// Update professional rating
router.post("/update-rating", async (req, res) => {
  try {
    const { professionalId, rating } = req.body;

    if (!professionalId || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "ID de profesional y rating válido (0-5) son requeridos" });
    }

    await db.update(professionals).set({ rating: rating.toString() }).where(eq(professionals.id, professionalId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: professionalId,
        action: "update_rating",
        reason: `Rating actualizado a: ${rating}`,
      });
    }

    res.json({ message: `Rating actualizado a ${rating}` });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({ message: "Error actualizando rating" });
  }
});

// Get service requests for a professional
router.get("/professional/:id/requests", async (req, res) => {
  try {
    const { id } = req.params;
    
    const requests = await db
      .select({
        id: serviceRequests.id,
        title: serviceRequests.title,
        description: serviceRequests.description,

        status: serviceRequests.status,
        createdAt: serviceRequests.createdAt,
        client: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(serviceRequests)
      .leftJoin(users, eq(serviceRequests.clientId, users.id))
      .where(eq(serviceRequests.professionalId, id))
      .orderBy(desc(serviceRequests.createdAt));

    res.json(requests);
  } catch (error) {
    console.error("Error fetching professional requests:", error);
    res.status(500).json({ message: "Error obteniendo solicitudes" });
  }
});

// Unban user
router.post("/unban-user", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "ID de usuario requerido" });
    }

    await db.update(users).set({ 
      isBanned: false,
      suspendedUntil: null,
      suspensionReason: null 
    }).where(eq(users.id, userId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user",
        targetId: userId,
        action: "unban_user",
        reason: "Usuario desbloqueado por administrador",
      });
    }

    res.json({ message: "Usuario desbloqueado exitosamente" });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res.status(500).json({ message: "Error desbloqueando usuario" });
  }
});

// Unban professional
router.post("/unban-professional", async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({ message: "ID de profesional requerido" });
    }

    await db.update(professionals).set({ 
      isBanned: false,
      suspendedUntil: null,
      suspensionReason: null 
    }).where(eq(professionals.id, professionalId));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: professionalId,
        action: "unban_professional",
        reason: "Perfil profesional desbloqueado",
      });
    }

    res.json({ message: "Perfil profesional desbloqueado" });
  } catch (error) {
    console.error("Error unbanning professional:", error);
    res.status(500).json({ message: "Error desbloqueando perfil profesional" });
  }
});

// Update professional profile
router.put("/professional/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, description, location, phone, website } = req.body;

    const updateData: any = {};
    if (businessName !== undefined) updateData.businessName = businessName;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (phone !== undefined) updateData.phone = phone;
    if (website !== undefined) updateData.website = website;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    await db.update(professionals).set(updateData).where(eq(professionals.id, id));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "professional",
        targetId: id,
        action: "update_professional",
        reason: `Perfil profesional actualizado: ${Object.keys(updateData).join(", ")}`,
      });
    }

    res.json({ message: "Perfil profesional actualizado" });
  } catch (error) {
    console.error("Error updating professional:", error);
    res.status(500).json({ message: "Error actualizando perfil profesional" });
  }
});

// Get all services for admin management
router.get("/services", async (req, res) => {
  try {
    const allServices = await db
      .select({
        id: services.id,
        title: services.title,
        description: services.description,
        priceFrom: services.priceFrom,
        priceTo: services.priceTo,
        duration: services.duration,
        isActive: services.isActive,
        createdAt: services.createdAt,
        professionalId: services.professionalId,
        businessName: professionals.businessName,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(services)
      .leftJoin(professionals, eq(services.professionalId, professionals.id))
      .leftJoin(users, eq(professionals.userId, users.id))
      .orderBy(desc(services.createdAt));

    res.json(allServices);
  } catch (error) {
    console.error("Error fetching all services:", error);
    res.status(500).json({ message: "Error fetching services" });
  }
});

// Get services for a professional
router.get("/professional/:id/services", async (req, res) => {
  try {
    const { id } = req.params;
    
    const professionalServices = await db
      .select()
      .from(services)
      .where(eq(services.professionalId, id))
      .orderBy(desc(services.createdAt));

    res.json(professionalServices);
  } catch (error) {
    console.error("Error fetching professional services:", error);
    res.status(500).json({ message: "Error obteniendo servicios" });
  }
});

// Update service
router.put("/service/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priceFrom, priceTo, duration, isActive } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priceFrom !== undefined) updateData.priceFrom = priceFrom.toString();
    if (priceTo !== undefined) updateData.priceTo = priceTo.toString();
    if (duration !== undefined) updateData.duration = duration;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    await db.update(services).set(updateData).where(eq(services.id, id));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "service",
        targetId: id,
        action: "update_service",
        reason: `Servicio actualizado: ${Object.keys(updateData).join(", ")}`,
      });
    }

    res.json({ message: "Servicio actualizado" });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Error actualizando servicio" });
  }
});

// Update table row
router.put("/database/tables/:tableName/rows/:id", async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const updates = req.body;

    // Remove undefined values and prepare the update
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(cleanUpdates).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    // Create the update query dynamically using Drizzle's sql template
    const setClauses = Object.keys(cleanUpdates).map(key => sql`${sql.identifier(key)} = ${cleanUpdates[key]}`);
    const setClause = sql.join(setClauses, sql`, `);
    
    await db.execute(sql`UPDATE ${sql.identifier(tableName)} SET ${setClause} WHERE id = ${id}`);

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "database",
        targetId: `${tableName}:${id}`,
        action: "update_row",
        reason: `Fila actualizada en tabla ${tableName}: ${Object.keys(cleanUpdates).join(", ")}`,
        details: { tableName, updatedFields: Object.keys(cleanUpdates) },
      });
    }

    res.json({ message: "Fila actualizada exitosamente" });
  } catch (error) {
    console.error("Error updating table row:", error);
    res.status(500).json({ message: "Error actualizando fila de la tabla" });
  }
});

// Toggle service active status
router.post("/service/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await db.select().from(services).where(eq(services.id, id)).limit(1);
    
    if (service.length === 0) {
      return res.status(404).json({ message: "Servicio no encontrado" });
    }

    const newActiveStatus = !service[0].isActive;
    
    await db.update(services).set({ isActive: newActiveStatus }).where(eq(services.id, id));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "service",
        targetId: id,
        action: newActiveStatus ? "activate_service" : "deactivate_service",
        reason: `Servicio ${newActiveStatus ? "activado" : "desactivado"} por administrador`,
      });
    }

    res.json({ message: `Servicio ${newActiveStatus ? "activado" : "desactivado"}` });
  } catch (error) {
    console.error("Error toggling service status:", error);
    res.status(500).json({ message: "Error cambiando estado del servicio" });
  }
});

// Database management endpoints - get all tables from database
router.get("/database/tables", async (req, res) => {
  try {
    // Query to get all table names from the database
    const tablesResult = await db.execute(sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    const tables = tablesResult.rows.map((row: any) => ({
      name: row.tablename,
      displayName: row.tablename.charAt(0).toUpperCase() + row.tablename.slice(1).replace(/_/g, ' '),
      editable: true
    }));

    res.json(tables);
  } catch (error) {
    console.error("Error fetching database tables:", error);
    res.status(500).json({ message: "Error obteniendo tablas de la base de datos" });
  }
});

// Get table data with full structure
router.get("/database/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Get table structure
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);
    const columns = columnsResult.rows;

    // Get table data with pagination
    const dataResult = await db.execute(sql.raw(`SELECT * FROM "${tableName}" LIMIT ${parseInt(limit as string)} OFFSET ${parseInt(offset as string)}`));
    const rows = dataResult.rows;

    // Get total count
    const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM "${tableName}"`));
    const total = countResult.rows[0]?.total || 0;

    res.json({
      tableName,
      columns,
      rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({ message: "Error obteniendo datos de la tabla" });
  }
});

// Remove user suspension (temporary)
router.post("/remove-suspension", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "ID de usuario requerido" });
    }

    await db.update(users).set({ 
      suspendedUntil: null,
      suspensionReason: null 
    }).where(eq(users.id, userId));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: req.user!.id,
      targetType: "user",
      targetId: userId,
      action: "remove_suspension",
      reason: "Suspensión temporal removida por administrador",
    });

    res.json({ message: "Suspensión temporal removida exitosamente" });
  } catch (error) {
    console.error("Error removing suspension:", error);
    res.status(500).json({ message: "Error removiendo suspensión" });
  }
});

// Remove professional suspension (temporary)
router.post("/remove-professional-suspension", async (req, res) => {
  try {
    const { professionalId } = req.body;

    if (!professionalId) {
      return res.status(400).json({ message: "ID de profesional requerido" });
    }

    await db.update(professionals).set({ 
      suspendedUntil: null,
      suspensionReason: null 
    }).where(eq(professionals.id, professionalId));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: req.user!.id,
      targetType: "professional",
      targetId: professionalId,
      action: "remove_professional_suspension",
      reason: "Suspensión temporal profesional removida por administrador",
    });

    res.json({ message: "Suspensión temporal profesional removida exitosamente" });
  } catch (error) {
    console.error("Error removing professional suspension:", error);
    res.status(500).json({ message: "Error removiendo suspensión profesional" });
  }
});

// Update user profile
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, userType } = req.body;

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (userType !== undefined) updateData.userType = userType;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    await db.update(users).set(updateData).where(eq(users.id, id));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: req.user!.id,
      targetType: "user",
      targetId: id,
      action: "update_user",
      reason: `Usuario actualizado: ${Object.keys(updateData).join(", ")}`,
    });

    res.json({ message: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error actualizando usuario" });
  }
});

// Enhanced send notification with individual user targeting
router.post("/send-notification", async (req, res) => {
  try {
    const { title, message, type, targetEmail, sendToAll, userType } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: "Título y mensaje son requeridos" });
    }

    let targetUsers = [];

    if (sendToAll === false && targetEmail) {
      // Send to specific user by email
      const targetUser = await db.select({ id: users.id }).from(users).where(eq(users.email, targetEmail));
      if (targetUser.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado con ese email" });
      }
      targetUsers = targetUser;
    } else {
      // Send to all users or specific user type
      if (userType === "all" || !userType) {
        targetUsers = await db.select({ id: users.id }).from(users);
      } else if (userType === "professionals") {
        targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.userType, "professional"));
      } else {
        targetUsers = await db.select({ id: users.id }).from(users).where(eq(users.userType, "client"));
      }
    }

    // Create notifications for target users
    const notificationInserts = targetUsers.map(user => ({
      userId: user.id,
      title,
      message,
      type: type || "system",
      isRead: false,
    }));

    if (notificationInserts.length > 0) {
      await db.insert(notifications).values(notificationInserts);
    }

    // Log admin action
    await db.insert(adminActions).values({
      adminId: req.user!.id,
      targetType: "user",
      targetId: targetEmail || "all",
      action: "send_notification",
      reason: sendToAll === false && targetEmail 
        ? `Notificación enviada a ${targetEmail}: ${title}`
        : `Notificación enviada a ${userType || 'all'}: ${title}`,
      details: { userCount: targetUsers.length }
    });

    const recipientText = sendToAll === false && targetEmail 
      ? `al usuario ${targetEmail}` 
      : `${targetUsers.length} usuarios`;
    
    res.json({ message: `Notificación enviada ${recipientText}` });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Error enviando notificación" });
  }
});

// Get table data with editing capabilities
router.get("/database/tables/:tableName/data", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Validate table name to prevent SQL injection
    const allowedTables = ['users', 'professionals', 'categories', 'services', 'service_requests', 'reviews', 'notifications', 'business_images', 'portfolio', 'admin_actions', 'sessions', 'conversations', 'messages', 'user_settings'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ message: "Tabla no válida" });
    }

    // Get table structure
    const columnsResult = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      ORDER BY ordinal_position
    `);
    const columns = columnsResult.rows;

    // Get table data with pagination
    const dataResult = await db.execute(sql.raw(`SELECT * FROM "${tableName}" LIMIT ${parseInt(limit as string)} OFFSET ${parseInt(offset as string)}`));
    const rows = dataResult.rows;

    // Get total count
    const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as total FROM "${tableName}"`));
    const total = countResult.rows[0]?.total || 0;

    res.json({
      tableName,
      columns,
      rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({ message: "Error obteniendo datos de la tabla" });
  }
});

// Update table row (fixed duplicate)
router.put("/database/tables/:tableName/rows/:id", async (req, res) => {
  try {
    const { tableName, id } = req.params;
    const updates = req.body;

    // Validate table name to prevent SQL injection
    const allowedTables = ['users', 'professionals', 'categories', 'services', 'service_requests', 'reviews', 'notifications', 'business_images', 'portfolio', 'admin_actions', 'sessions', 'conversations', 'messages', 'user_settings', 'reports'];
    if (!allowedTables.includes(tableName)) {
      return res.status(400).json({ message: "Tabla no válida" });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `"${key}" = $${index + 2}`)
      .join(', ');

    const values = [id, ...Object.values(updates)];
    
    await db.execute(sql.raw(`UPDATE "${tableName}" SET ${setClause} WHERE id = $1`));

    // Log admin action
    if (req.user) {
      await db.insert(adminActions).values({
        adminId: req.user.id,
        targetType: "user", // Using existing enum value
        targetId: `${tableName}:${id}`,
        action: "update_table_row",
        reason: `Fila actualizada en tabla ${tableName}: ${Object.keys(updates).join(", ")}`,
      });
    }

    res.json({ message: "Fila actualizada exitosamente" });
  } catch (error) {
    console.error("Error updating table row:", error);
    res.status(500).json({ message: "Error actualizando fila" });
  }
});



// =============== REPORTS SYSTEM ===============

// Get all reports for admin dashboard
router.get("/reports", async (req, res) => {
  try {
    console.log('🟢 ADMIN: Fetching all reports...');
    const allReports = await db
      .select({
        id: reports.id,
        reportType: reports.reportType,
        targetId: reports.targetId,
        reason: reports.reason,
        description: reports.description,
        status: reports.status,
        adminNotes: reports.adminNotes,
        resolvedAt: reports.resolvedAt,
        createdAt: reports.createdAt,
        reporter: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(reports)
      .leftJoin(users, eq(reports.reporterId, users.id))
      .orderBy(desc(reports.createdAt));

    console.log(`🟢 ADMIN: Found ${allReports.length} reports`);
    console.log('🟢 ADMIN: Report types:', allReports.map(r => r.reportType));
    
    res.json(allReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Error obteniendo reportes" });
  }
});

// Get messages for a conversation (for chat reports)
router.get("/conversation/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Get all messages for this conversation with user information
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        createdAt: messages.createdAt,
        senderName: users.firstName,
        senderLastName: users.lastName,
        senderEmail: users.email
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    res.json(conversationMessages);
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ message: "Error fetching conversation messages" });
  }
});

// Update report status
router.put("/reports/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (adminNotes) updateData.adminNotes = adminNotes;
    if (status === "resolved") {
      updateData.resolvedBy = req.user!.id;
      updateData.resolvedAt = new Date();
    }

    await db.update(reports).set(updateData).where(eq(reports.id, id));

    // Log admin action
    await db.insert(adminActions).values({
      adminId: req.user!.id,
      targetType: "user", // Using existing enum value
      targetId: id,
      action: "update_report",
      reason: `Reporte actualizado - Estado: ${status || 'sin cambio'}`,
      details: { status, adminNotes },
    });

    res.json({ message: "Reporte actualizado" });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ message: "Error actualizando reporte" });
  }
});

// Get conversation messages for chat reports
router.get("/reports/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the report details first
    const report = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
    
    if (report.length === 0) {
      return res.status(404).json({ message: "Reporte no encontrado" });
    }

    if (report[0].reportType !== "chat_conversation") {
      return res.status(400).json({ message: "Este reporte no es de conversación" });
    }

    // Get conversation messages
    const conversationMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, report[0].targetId))
      .orderBy(messages.createdAt);

    res.json(conversationMessages);
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ message: "Error obteniendo mensajes de la conversación" });
  }
});

// Admin verification request management
router.put('/verification-requests/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    await storage.markVerificationRequestAsReviewed(id, req.user!.id, notes);
    
    res.json({ message: 'Solicitud marcada como revisada' });
  } catch (error) {
    console.error('Error marking verification request as reviewed:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;