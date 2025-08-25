import type { Express } from "express";
import { eq, desc, and, isNull, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { moderators, supportChats, supportMessages, users } from "@shared/schema";
import type { InsertModerator, InsertSupportChat, InsertSupportMessage } from "@shared/schema";

// Middleware para verificar si el usuario es admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Middleware para verificar si es un moderador autenticado
const requireModerator = (req: any, res: any, next: any) => {
  if (!req.session.moderatorId) {
    return res.status(401).json({ message: "Moderator authentication required" });
  }
  next();
};

export function registerModeratorRoutes(app: Express) {
  // === RUTAS ADMIN PARA GESTIÓN DE MODERADORES ===

  // Crear moderador (solo admin)
  app.post("/api/admin/moderators", requireAdmin, async (req, res) => {
    try {
      const { moderatorId, password, name } = req.body;
      
      // Verificar que no existe ya un moderador con ese ID
      const existing = await db
        .select()
        .from(moderators)
        .where(eq(moderators.moderatorId, moderatorId))
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ message: "El ID de moderador ya existe" });
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      const newModerator: InsertModerator = {
        moderatorId,
        password: hashedPassword,
        name,
        createdBy: req.user?.id || ''
      };

      const [createdModerator] = await db.insert(moderators).values(newModerator).returning();

      // No devolver la contraseña
      const { password: _, ...moderatorWithoutPassword } = createdModerator;
      
      res.status(201).json(moderatorWithoutPassword);
    } catch (error) {
      console.error("Error creating moderator:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Listar moderadores (solo admin)
  app.get("/api/admin/moderators", requireAdmin, async (req, res) => {
    try {
      const allModerators = await db
        .select({
          id: moderators.id,
          moderatorId: moderators.moderatorId,
          name: moderators.name,
          isActive: moderators.isActive,
          createdAt: moderators.createdAt,
          createdBy: moderators.createdBy
        })
        .from(moderators)
        .orderBy(desc(moderators.createdAt));

      res.json(allModerators);
    } catch (error) {
      console.error("Error fetching moderators:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Activar/desactivar moderador (solo admin)
  app.patch("/api/admin/moderators/:id/toggle", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      await db
        .update(moderators)
        .set({ isActive })
        .where(eq(moderators.id, id));

      res.json({ message: "Estado del moderador actualizado" });
    } catch (error) {
      console.error("Error updating moderator:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Eliminar moderador (solo admin)
  app.delete("/api/admin/moderators/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      await db.delete(moderators).where(eq(moderators.id, id));

      res.json({ message: "Moderador eliminado" });
    } catch (error) {
      console.error("Error deleting moderator:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === RUTAS DE AUTENTICACIÓN DE MODERADORES ===

  // Login de moderador
  app.post("/api/moderator/login", async (req, res) => {
    try {
      const { moderatorId, password } = req.body;

      // Buscar moderador por ID
      const [moderator] = await db
        .select()
        .from(moderators)
        .where(and(
          eq(moderators.moderatorId, moderatorId),
          eq(moderators.isActive, true)
        ))
        .limit(1);

      if (!moderator) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, moderator.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Guardar en sesión
      req.session.moderatorId = moderator.id;
      req.session.moderatorName = moderator.name;

      // No devolver la contraseña
      const { password: _, ...moderatorWithoutPassword } = moderator;
      res.json(moderatorWithoutPassword);
    } catch (error) {
      console.error("Error in moderator login:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Logout de moderador
  app.post("/api/moderator/logout", (req, res) => {
    req.session.moderatorId = undefined;
    req.session.moderatorName = undefined;
    res.json({ message: "Sesión cerrada" });
  });

  // Verificar sesión de moderador
  app.get("/api/moderator/me", async (req, res) => {
    try {
      if (!req.session.moderatorId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const [moderator] = await db
        .select({
          id: moderators.id,
          moderatorId: moderators.moderatorId,
          name: moderators.name,
          isActive: moderators.isActive,
          createdAt: moderators.createdAt
        })
        .from(moderators)
        .where(eq(moderators.id, req.session.moderatorId))
        .limit(1);

      if (!moderator || !moderator.isActive) {
        req.session.moderatorId = undefined;
        req.session.moderatorName = undefined;
        return res.status(401).json({ message: "Sesión inválida" });
      }

      res.json(moderator);
    } catch (error) {
      console.error("Error verifying moderator session:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === RUTAS DE CHATS DE SOPORTE ===

  // Crear chat de soporte (usuarios autenticados)
  app.post("/api/support/chat", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Autenticación requerida" });
      }

      const { subject } = req.body;

      // Verificar si el usuario ya tiene un chat abierto
      const existingChat = await db
        .select()
        .from(supportChats)
        .where(and(
          eq(supportChats.userId, req.user.id),
          or(eq(supportChats.status, "open"), eq(supportChats.status, "assigned"))
        ))
        .limit(1);

      if (existingChat.length > 0) {
        return res.status(400).json({ 
          message: "Ya tienes un chat de soporte activo",
          chatId: existingChat[0].id
        });
      }

      const newChat: InsertSupportChat = {
        userId: req.user.id,
        subject: subject || "Solicitud de soporte",
        status: "open",
        priority: "medium"
      };

      const [createdChat] = await db.insert(supportChats).values(newChat).returning();

      // Crear mensaje automático del sistema
      try {
        const { storage } = await import('./storage.js');
        await storage.createSupportSystemMessage(
          createdChat.id,
          "Estas a la espera de un agente",
          "system_info"
        );
      } catch (systemMessageError) {
        console.error("Error creating system welcome message:", systemMessageError);
      }

      // Notificar a todos los moderadores conectados sobre el nuevo chat
      // Import the function dynamically to avoid circular imports
      try {
        const { notifyModeratorsOfNewChat } = await import('./routes.js');
        notifyModeratorsOfNewChat({
          ...createdChat,
          user: {
            id: req.user.id,
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email
          }
        });
      } catch (wsError) {
        console.error("Error notifying moderators via WebSocket:", wsError);
      }

      res.status(201).json(createdChat);
    } catch (error) {
      console.error("Error creating support chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener chat de soporte del usuario
  app.get("/api/support/my-chat", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Autenticación requerida" });
      }

      const [activeChat] = await db
        .select()
        .from(supportChats)
        .where(and(
          eq(supportChats.userId, req.user.id),
          or(
            eq(supportChats.status, "open"), 
            eq(supportChats.status, "assigned"),
            eq(supportChats.status, "escalated")
          )
        ))
        .orderBy(desc(supportChats.createdAt))
        .limit(1);

      if (!activeChat) {
        return res.status(404).json({ message: "No tienes un chat activo" });
      }

      res.json(activeChat);
    } catch (error) {
      console.error("Error fetching user chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Obtener mensajes de un chat (usuario o moderador)
  app.get("/api/support/chat/:chatId/messages", async (req, res) => {
    try {
      const { chatId } = req.params;
      let hasAccess = false;

      // Verificar acceso: usuario propietario, moderador, o administrador
      if (req.isAuthenticated()) {
        const [chat] = await db
          .select({ userId: supportChats.userId })
          .from(supportChats)
          .where(eq(supportChats.id, chatId))
          .limit(1);
        
        if (chat && (chat.userId === req.user.id || req.user.isAdmin)) {
          hasAccess = true;
        }
      }

      if (req.session.moderatorId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.supportChatId, chatId))
        .orderBy(supportMessages.createdAt);

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Enviar mensaje en chat de soporte
  app.post("/api/support/chat/:chatId/messages", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content } = req.body;
      let hasAccess = false;
      let senderId = null;
      let senderType = null;

      // Verificar acceso y determinar tipo de sender
      if (req.isAuthenticated()) {
        const [chat] = await db
          .select({ userId: supportChats.userId })
          .from(supportChats)
          .where(eq(supportChats.id, chatId))
          .limit(1);
        
        if (chat && chat.userId === req.user.id) {
          hasAccess = true;
          senderId = req.user.id;
          senderType = "user";
        }
      }

      if (req.session.moderatorId) {
        hasAccess = true;
        senderId = req.session.moderatorId;
        senderType = "moderator";
      }

      if (!hasAccess) {
        return res.status(403).json({ message: "Acceso denegado" });
      }

      const newMessage: InsertSupportMessage = {
        supportChatId: chatId,
        senderId,
        senderType: senderType as "user" | "moderator" | "admin",
        content,
        messageType: "text"
      };

      const [createdMessage] = await db.insert(supportMessages).values(newMessage).returning();

      // Actualizar timestamp del chat
      await db
        .update(supportChats)
        .set({ 
          lastMessageAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supportChats.id, chatId));

      res.status(201).json(createdMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // === RUTAS PARA MODERADORES ===

  // Listar todos los chats de soporte (solo moderadores)
  app.get("/api/moderator/support-chats", requireModerator, async (req, res) => {
    try {
      const chats = await db
        .select({
          id: supportChats.id,
          subject: supportChats.subject,
          status: supportChats.status,
          priority: supportChats.priority,
          lastMessageAt: supportChats.lastMessageAt,
          createdAt: supportChats.createdAt,
          user: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            profileImageUrl: users.profileImageUrl
          },
          moderator: {
            id: moderators.id,
            name: moderators.name
          }
        })
        .from(supportChats)
        .leftJoin(users, eq(supportChats.userId, users.id))
        .leftJoin(moderators, eq(supportChats.moderatorId, moderators.id))
        .where(or(
          eq(supportChats.status, "open"),
          eq(supportChats.status, "assigned"),
          eq(supportChats.status, "escalated")
        ))
        .orderBy(desc(supportChats.createdAt));

      res.json(chats);
    } catch (error) {
      console.error("Error fetching support chats:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Asumir responsabilidad de un chat (solo moderadores)
  app.post("/api/moderator/support-chats/:chatId/assign", requireModerator, async (req, res) => {
    try {
      const { chatId } = req.params;

      // Verificar que el chat existe y no está ya asignado
      const [chat] = await db
        .select()
        .from(supportChats)
        .where(eq(supportChats.id, chatId))
        .limit(1);

      if (!chat) {
        return res.status(404).json({ message: "Chat no encontrado" });
      }

      if (chat.status === "assigned" && chat.moderatorId) {
        return res.status(400).json({ message: "Chat ya asignado a otro moderador" });
      }

      // Asignar el chat al moderador
      await db
        .update(supportChats)
        .set({
          moderatorId: req.session.moderatorId,
          status: "assigned",
          updatedAt: new Date()
        })
        .where(eq(supportChats.id, chatId));

      res.json({ message: "Chat asignado exitosamente" });
    } catch (error) {
      console.error("Error assigning chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Escalar chat a administradores (solo moderadores)
  app.post("/api/moderator/support-chats/:chatId/escalate", requireModerator, async (req, res) => {
    try {
      const { chatId } = req.params;
      const { reason } = req.body; // Optional escalation reason

      // Crear mensaje automático del sistema de escalación
      try {
        const { storage } = await import('./storage.js');
        await storage.createSupportSystemMessage(
          chatId,
          "Tu situación ha sido escalada",
          "system_warning"
        );
      } catch (systemMessageError) {
        console.error("Error creating escalation system message:", systemMessageError);
      }

      await db
        .update(supportChats)
        .set({
          status: "escalated",
          escalationReason: reason || "Escalado por moderador",
          isAdminVisible: true,
          updatedAt: new Date()
        })
        .where(eq(supportChats.id, chatId));

      res.json({ message: "Chat escalado a administradores" });
    } catch (error) {
      console.error("Error escalating chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Cerrar un chat (solo moderadores - no pueden cerrar chats escalados)
  app.post("/api/moderator/support-chats/:chatId/close", requireModerator, async (req, res) => {
    try {
      const { chatId } = req.params;

      // Verificar que el chat no esté escalado
      const [chat] = await db
        .select({ status: supportChats.status })
        .from(supportChats)
        .where(eq(supportChats.id, chatId))
        .limit(1);

      if (!chat) {
        return res.status(404).json({ message: "Chat no encontrado" });
      }

      if (chat.status === "escalated") {
        return res.status(403).json({ 
          message: "No se puede cerrar un chat escalado. Solo los administradores pueden cerrar chats escalados." 
        });
      }

      await db
        .update(supportChats)
        .set({
          status: "closed",
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supportChats.id, chatId));

      res.json({ message: "Chat cerrado exitosamente" });
    } catch (error) {
      console.error("Error closing chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Archivar y cerrar chat (solo moderadores)
  app.post("/api/moderator/support-chats/:chatId/archive", requireModerator, async (req, res) => {
    try {
      const { chatId } = req.params;

      // Obtener datos del chat y mensajes para archivado
      const [chat] = await db
        .select()
        .from(supportChats)
        .where(eq(supportChats.id, chatId))
        .limit(1);

      if (!chat) {
        return res.status(404).json({ message: "Chat no encontrado" });
      }

      const messages = await db
        .select()
        .from(supportMessages)
        .where(eq(supportMessages.supportChatId, chatId))
        .orderBy(supportMessages.createdAt);

      // Crear estructura de archivo de chat
      const archiveData = {
        chatId: chat.id,
        subject: chat.subject,
        userId: chat.userId,
        moderatorId: chat.moderatorId,
        startedAt: chat.createdAt,
        closedAt: new Date().toISOString(),
        messages: messages.map(msg => ({
          sender: msg.senderType,
          content: msg.content,
          timestamp: msg.createdAt
        }))
      };

      // Log del archivo (aquí podrías implementar guardado real en filesystem)
      console.log(`📁 Archivando chat ${chatId}:`, JSON.stringify(archiveData, null, 2));
      
      // Implementar guardado real en carpeta modchatlogs
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        await fs.mkdir(path.join(process.cwd(), 'modchatlogs'), { recursive: true });
        const archivePath = path.join(process.cwd(), 'modchatlogs', `chat-${chatId}-${Date.now()}.json`);
        await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));
        console.log(`✅ Chat archivado en: ${archivePath}`);
      } catch (archiveError) {
        console.error('Error archivando chat:', archiveError);
        // Continue with database close even if file save fails
      }

      await db
        .update(supportChats)
        .set({
          status: "closed",
          closedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(supportChats.id, chatId));

      res.json({ message: "Chat archivado y cerrado exitosamente" });
    } catch (error) {
      console.error("Error archiving chat:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
}