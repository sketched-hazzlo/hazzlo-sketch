import {
  users,
  professionals,
  services,
  categories,
  reviews,
  portfolio,
  serviceRequests,
  conversations,
  messages,
  notifications,
  userSettings,
  businessImages,
  reports,
  verificationRequests,
  supportChats,
  supportMessages,
  profileClicks,
  passwordResetTokens,
  type User,
  type UpsertUser,
  type Professional,
  type Service,
  type Category,
  type Review,
  type Portfolio,
  type ServiceRequest,
  type Conversation,
  type Message,
  type Notification,
  type UserSettings,
  type BusinessImage,
  type InsertProfessional,
  type InsertService,
  type InsertReview,
  type InsertServiceRequest,
  type InsertConversation,
  type InsertMessage,
  type InsertNotification,
  type InsertUserSettings,
  type InsertBusinessImage,
  type InsertReport,
  type VerificationRequest,
  type InsertVerificationRequest,
  type VerificationRequestWithDetails,
  type ProfessionalWithDetails,
  type ProfileClick,
  type InsertProfileClick,
  type PasswordResetToken,
  type InsertPasswordResetToken,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, ilike, or, sql, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createCustomUser(user: { email: string; firstName: string; lastName: string; userType: string; password: string }): Promise<User>;
  updateUserProfileImage(userId: string, imageUrl: string): Promise<User | undefined>;
  getAdminUsers(): Promise<User[]>;
  
  // Professional operations
  createProfessional(professional: InsertProfessional): Promise<Professional>;
  getProfessional(id: string): Promise<Professional | undefined>;
  getProfessionalByUserId(userId: string): Promise<Professional | undefined>;
  getProfessionalWithDetails(id: string): Promise<ProfessionalWithDetails | undefined>;
  getProfessionalBySlug(slug: string): Promise<Professional | undefined>;
  getProfessionalWithDetailsBySlug(slug: string): Promise<ProfessionalWithDetails | undefined>;
  updateProfessional(id: string, updates: Partial<InsertProfessional>): Promise<Professional | undefined>;
  searchProfessionals(params: {
    query?: string;
    categoryId?: string;
    location?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'rating' | 'reviews' | 'newest';
  }): Promise<{ professionals: ProfessionalWithDetails[]; total: number }>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  createCategory(name: string, slug: string, description?: string, icon?: string, color?: string): Promise<Category>;
  
  // Service operations
  createService(service: InsertService): Promise<Service>;
  getServicesByProfessional(professionalId: string): Promise<Service[]>;
  updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<void>;
  
  // Review operations
  createReview(review: InsertReview): Promise<Review>;
  getReviewsByProfessional(professionalId: string): Promise<(Review & { client: User })[]>;
  updateProfessionalRating(professionalId: string): Promise<void>;
  
  // Portfolio operations
  createPortfolioItem(item: { professionalId: string; title: string; description?: string; imageUrl?: string; projectUrl?: string }): Promise<Portfolio>;
  getPortfolioByProfessional(professionalId: string): Promise<Portfolio[]>;
  updatePortfolioItem(id: string, updates: Partial<{ title: string; description?: string; imageUrl?: string; projectUrl?: string }>): Promise<Portfolio | undefined>;
  deletePortfolioItem(id: string): Promise<void>;
  
  // Service request operations
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  getServiceRequestsByClient(clientId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByProfessional(professionalId: string): Promise<ServiceRequest[]>;
  updateServiceRequestStatus(id: string, status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'): Promise<ServiceRequest | undefined>;
  
  // Chat operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversationsByUser(userId: string): Promise<(Conversation & { client: User; professional: Professional; unreadCount: number })[]>;
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationBetweenUsers(clientId: string, professionalId: string): Promise<Conversation | undefined>;
  deleteConversation(id: string): Promise<void>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: string): Promise<(Message & { sender: User })[]>;
  deleteMessagesByConversation(conversationId: string): Promise<void>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string, userId?: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  clearAllNotifications(userId: string): Promise<void>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  
  // Business images operations
  createBusinessImage(image: InsertBusinessImage): Promise<BusinessImage>;
  getBusinessImagesByProfessional(professionalId: string): Promise<BusinessImage[]>;
  updateBusinessImage(id: string, updates: Partial<InsertBusinessImage>): Promise<BusinessImage | undefined>;
  deleteBusinessImage(id: string): Promise<void>;
  reorderBusinessImages(images: { id: string; orderIndex: number }[]): Promise<void>;
  getBusinessImageById(id: string): Promise<BusinessImage | undefined>;
  
  // Report operations
  createReport(report: InsertReport): Promise<any>;
  
  // Verification request operations
  createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest>;
  getVerificationRequestByProfessional(professionalId: string): Promise<VerificationRequest | undefined>;
  getAllVerificationRequests(): Promise<VerificationRequestWithDetails[]>;
  markVerificationRequestAsReviewed(id: string, reviewedBy: string, notes?: string): Promise<VerificationRequest | undefined>;
  approveVerificationRequest(id: string, reviewedBy: string, notes?: string): Promise<VerificationRequest | undefined>;
  
  // Profile clicks operations
  createProfileClick(click: InsertProfileClick): Promise<ProfileClick>;
  getProfileClickByDeviceAndProfessional(deviceFingerprint: string, professionalId: string): Promise<ProfileClick | undefined>;
  getProfileClickCount(professionalId: string): Promise<number>;
  
  // Password reset operations
  createPasswordResetToken(userId: string, token: string, code: string, expiresAt: Date): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  getPasswordResetTokenByCode(code: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(tokenOrCode: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<void>;
  updateUserPassword(userId: string, newPassword: string): Promise<User | undefined>;
  
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createCustomUser(userData: { email: string; firstName: string; lastName: string; userType: string; password: string }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      userType: userData.userType as "client" | "professional",
      password: userData.password,
    }).returning();
    return user;
  }

  async updateUserProfileImage(userId: string, imageUrl: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ profileImageUrl: imageUrl, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getAdminUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }

  // Professional operations
  async createProfessional(professional: InsertProfessional): Promise<Professional> {
    // Generate slug if not provided
    if (!professional.slug) {
      const { generateSlug } = await import("./utils/slug-generator");
      professional.slug = await generateSlug(professional.businessName || 'profesional');
    }
    const [newProfessional] = await db.insert(professionals).values(professional).returning();
    return newProfessional;
  }

  async getProfessional(id: string): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.id, id));
    return professional;
  }

  async getProfessionalByUserId(userId: string): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.userId, userId));
    return professional;
  }

  async getProfessionalWithDetails(id: string): Promise<ProfessionalWithDetails | undefined> {
    const result = await db.query.professionals.findFirst({
      where: eq(professionals.id, id),
      with: {
        user: true,
        services: {
          with: {
            category: true,
          },
        },
        reviews: {
          with: {
            client: true,
          },
          limit: 10,
          orderBy: desc(reviews.createdAt),
        },
        portfolio: {
          limit: 10,
          orderBy: desc(portfolio.createdAt),
        },
      },
    });
    return result as ProfessionalWithDetails | undefined;
  }

  async updateProfessional(id: string, updates: Partial<InsertProfessional>): Promise<Professional | undefined> {
    const [updated] = await db
      .update(professionals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(professionals.id, id))
      .returning();
    return updated;
  }

  async getProfessionalBySlug(slug: string): Promise<Professional | undefined> {
    const [professional] = await db.select().from(professionals).where(eq(professionals.slug, slug));
    return professional;
  }

  async getProfessionalWithDetailsBySlug(slug: string): Promise<ProfessionalWithDetails | undefined> {
    const result = await db.query.professionals.findFirst({
      where: eq(professionals.slug, slug),
      with: {
        user: true,
        services: {
          with: {
            category: true,
          },
        },
        reviews: {
          with: {
            client: true,
          },
          limit: 10,
          orderBy: desc(reviews.createdAt),
        },
        portfolio: {
          limit: 10,
          orderBy: desc(portfolio.createdAt),
        },
      },
    });
    return result as ProfessionalWithDetails | undefined;
  }

  async searchProfessionals(params: {
    query?: string;
    categoryId?: string;
    location?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'rating' | 'reviews' | 'newest';
  }): Promise<{ professionals: ProfessionalWithDetails[]; total: number }> {
    const { query, categoryId, location, limit = 12, offset = 0, sortBy = 'rating' } = params;

    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          ilike(professionals.businessName, `%${query}%`),
          ilike(professionals.description, `%${query}%`)
        )
      );
    }

    if (location) {
      whereConditions.push(ilike(professionals.location, `%${location}%`));
    }

    let orderByClause;
    switch (sortBy) {
      case 'reviews':
        orderByClause = desc(professionals.reviewCount);
        break;
      case 'newest':
        orderByClause = desc(professionals.createdAt);
        break;
      default:
        orderByClause = desc(professionals.rating);
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [{ total }] = await db
      .select({ total: count() })
      .from(professionals)
      .where(whereClause);

    // Get professionals with details
    const professionalsQuery = db.query.professionals.findMany({
      where: whereClause,
      with: {
        user: true,
        services: {
          with: {
            category: true,
          },
          ...(categoryId && {
            where: eq(services.categoryId, categoryId),
          }),
        },
        reviews: {
          with: {
            client: true,
          },
          limit: 3,
          orderBy: desc(reviews.createdAt),
        },
        portfolio: {
          limit: 3,
          orderBy: desc(portfolio.createdAt),
        },
      },
      limit,
      offset,
      orderBy: orderByClause,
    });

    const result = await professionalsQuery;
    
    // Filter by category if provided
    let filteredResult = result;
    if (categoryId) {
      filteredResult = result.filter(p => p.services.some(s => s.categoryId === categoryId));
    }

    return {
      professionals: filteredResult as ProfessionalWithDetails[],
      total: Number(total),
    };
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(name: string, slug: string, description?: string, icon?: string, color?: string): Promise<Category> {
    const [category] = await db.insert(categories).values({
      name,
      slug,
      description,
      icon,
      color,
    }).returning();
    return category;
  }

  // Service operations
  async createService(service: InsertService): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async getServicesByProfessional(professionalId: string): Promise<Service[]> {
    return await db.select().from(services)
      .where(eq(services.professionalId, professionalId))
      .orderBy(desc(services.createdAt));
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const [updated] = await db
      .update(services)
      .set(updates)
      .where(eq(services.id, id))
      .returning();
    return updated;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  // Review operations
  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    
    // Update professional rating after creating review
    await this.updateProfessionalRating(review.professionalId);
    
    return newReview;
  }

  async getReviewsByProfessional(professionalId: string): Promise<(Review & { client: User })[]> {
    return await db.query.reviews.findMany({
      where: eq(reviews.professionalId, professionalId),
      with: {
        client: true,
      },
      orderBy: desc(reviews.createdAt),
    }) as (Review & { client: User })[];
  }

  async updateProfessionalRating(professionalId: string): Promise<void> {
    const [result] = await db
      .select({
        avgRating: sql`AVG(${reviews.rating})::numeric(3,2)`,
        count: count(reviews.id),
      })
      .from(reviews)
      .where(eq(reviews.professionalId, professionalId));

    await db
      .update(professionals)
      .set({
        rating: result.avgRating ? result.avgRating.toString() : "0.00",
        reviewCount: result.count,
        updatedAt: new Date(),
      })
      .where(eq(professionals.id, professionalId));
  }

  // Portfolio operations
  async createPortfolioItem(item: { 
    professionalId: string; 
    title: string; 
    description?: string; 
    imageUrl?: string; 
    projectUrl?: string 
  }): Promise<Portfolio> {
    const [portfolioItem] = await db.insert(portfolio).values(item).returning();
    return portfolioItem;
  }

  async getPortfolioByProfessional(professionalId: string): Promise<Portfolio[]> {
    return await db.select().from(portfolio)
      .where(eq(portfolio.professionalId, professionalId))
      .orderBy(desc(portfolio.createdAt));
  }

  async updatePortfolioItem(id: string, updates: Partial<{ 
    title: string; 
    description?: string; 
    imageUrl?: string; 
    projectUrl?: string 
  }>): Promise<Portfolio | undefined> {
    const [updated] = await db
      .update(portfolio)
      .set(updates)
      .where(eq(portfolio.id, id))
      .returning();
    return updated;
  }

  async deletePortfolioItem(id: string): Promise<void> {
    await db.delete(portfolio).where(eq(portfolio.id, id));
  }

  // Service request operations
  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [serviceRequest] = await db.insert(serviceRequests).values(request).returning();
    return serviceRequest;
  }

  async getServiceRequestsByClient(clientId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests)
      .where(eq(serviceRequests.clientId, clientId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async getServiceRequestsByProfessional(professionalId: string): Promise<ServiceRequest[]> {
    return await db.select().from(serviceRequests)
      .where(eq(serviceRequests.professionalId, professionalId))
      .orderBy(desc(serviceRequests.createdAt));
  }

  async updateServiceRequestStatus(
    id: string, 
    status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  ): Promise<ServiceRequest | undefined> {
    const [updated] = await db
      .update(serviceRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(serviceRequests.id, id))
      .returning();
    return updated;
  }

  // Chat operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const conversationData = {
      id: nanoid(),
      ...conversation,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    const [newConversation] = await db.insert(conversations).values(conversationData).returning();
    return newConversation;
  }

  async getConversationsByUser(userId: string): Promise<(Conversation & { client: User; professional: Professional; unreadCount: number })[]> {
    // Get user's professional profile if they have one
    const userProfessional = await this.getProfessionalByUserId(userId);
    
    const userConversations = await db.query.conversations.findMany({
      where: or(
        eq(conversations.clientId, userId),
        userProfessional ? eq(conversations.professionalId, userProfessional.id) : sql`false`
      ),
      with: {
        client: true,
        professional: {
          with: {
            user: true,
          },
        },
      },
      orderBy: desc(conversations.lastMessageAt),
    });

    // Get unread message count for each conversation
    const conversationsWithUnread = await Promise.all(
      userConversations.map(async (conv) => {
        const [unreadCount] = await db
          .select({ count: count(messages.id) })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.isRead, false),
              sql`${messages.senderId} != ${userId}`
            )
          );

        return {
          ...conv,
          unreadCount: unreadCount.count,
        };
      })
    );

    return conversationsWithUnread;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return await db.query.conversations.findFirst({
      where: eq(conversations.id, id),
    });
  }

  async getConversationBetweenUsers(clientId: string, professionalId: string): Promise<Conversation | undefined> {
    return await db.query.conversations.findFirst({
      where: and(
        eq(conversations.clientId, clientId),
        eq(conversations.professionalId, professionalId)
      ),
    });
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const messageData = {
      id: nanoid(),
      ...message,
      createdAt: new Date()
    };
    const [newMessage] = await db.insert(messages).values(messageData).returning();
    
    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async getMessagesByConversation(conversationId: string): Promise<(Message & { sender: User })[]> {
    return await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      with: {
        sender: true,
      },
      orderBy: asc(messages.createdAt),
    }) as (Message & { sender: User })[];
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`,
          eq(messages.isRead, false)
        )
      );
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string, userId?: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async clearAllNotifications(userId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    return await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    });
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    // Check if settings exist
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ userId, ...settings })
        .returning();
      return created;
    }
  }

  // Simple chat methods for API routes

  async getConversationById(conversationId: string): Promise<any> {
    try {
      const conversation = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1);
      
      console.log('getConversationById result:', conversation[0]);
      return conversation[0] || null;
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    }
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Add alias for the API routes
  async getUserConversations(userId: string): Promise<any[]> {
    return await this.getConversationsByUser(userId);
  }

  // Delete conversation and all its messages
  async deleteConversation(id: string): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Delete all messages in a conversation
  async deleteMessagesByConversation(conversationId: string): Promise<void> {
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
  }

  // Business images operations
  async createBusinessImage(image: InsertBusinessImage): Promise<BusinessImage> {
    const [created] = await db.insert(businessImages).values(image).returning();
    return created;
  }

  async getBusinessImagesByProfessional(professionalId: string): Promise<BusinessImage[]> {
    return await db
      .select()
      .from(businessImages)
      .where(eq(businessImages.professionalId, professionalId))
      .orderBy(asc(businessImages.orderIndex), asc(businessImages.createdAt));
  }

  async updateBusinessImage(id: string, updates: Partial<InsertBusinessImage>): Promise<BusinessImage | undefined> {
    const [updated] = await db
      .update(businessImages)
      .set(updates)
      .where(eq(businessImages.id, id))
      .returning();
    return updated;
  }

  async deleteBusinessImage(id: string): Promise<void> {
    await db.delete(businessImages).where(eq(businessImages.id, id));
  }

  async reorderBusinessImages(images: { id: string; orderIndex: number }[]): Promise<void> {
    for (const image of images) {
      await db
        .update(businessImages)
        .set({ orderIndex: image.orderIndex })
        .where(eq(businessImages.id, image.id));
    }
  }

  async getBusinessImageById(id: string): Promise<BusinessImage | undefined> {
    const [image] = await db
      .select()
      .from(businessImages)
      .where(eq(businessImages.id, id));
    return image;
  }

  // Report operations
  async createReport(report: InsertReport): Promise<any> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  // Verification request operations
  async createVerificationRequest(request: InsertVerificationRequest): Promise<VerificationRequest> {
    const [newRequest] = await db.insert(verificationRequests).values(request).returning();
    return newRequest;
  }

  async getVerificationRequestByProfessional(professionalId: string): Promise<VerificationRequest | undefined> {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.professionalId, professionalId))
      .orderBy(desc(verificationRequests.createdAt));
    return request;
  }

  async getAllVerificationRequests(): Promise<VerificationRequestWithDetails[]> {
    const requests = await db
      .select({
        id: verificationRequests.id,
        professionalId: verificationRequests.professionalId,
        userId: verificationRequests.userId,
        status: verificationRequests.status,
        createdAt: verificationRequests.createdAt,
        reviewedAt: verificationRequests.reviewedAt,
        reviewedBy: verificationRequests.reviewedBy,
        notes: verificationRequests.notes,
        professionalId_: professionals.id,
        businessName: professionals.businessName,
        description: professionals.description,
        location: professionals.location,
        isVerified: professionals.isVerified,
        userId_: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(verificationRequests)
      .leftJoin(professionals, eq(verificationRequests.professionalId, professionals.id))
      .leftJoin(users, eq(professionals.userId, users.id))
      .orderBy(desc(verificationRequests.createdAt));

    return requests.map(request => ({
      id: request.id,
      professionalId: request.professionalId,
      userId: request.userId,
      status: request.status,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      reviewedBy: request.reviewedBy,
      notes: request.notes,
      professional: request.professionalId_ ? {
        id: request.professionalId_,
        businessName: request.businessName || "",
        description: request.description || "",
        location: request.location || "",
        isVerified: request.isVerified || false,
        user: request.userId_ ? {
          id: request.userId_,
          firstName: request.firstName || "",
          lastName: request.lastName || "",
          email: request.email || "",
        } : null
      } : null,
      reviewedByUser: null // For now, we'll simplify this
    })) as VerificationRequestWithDetails[];
  }

  async markVerificationRequestAsReviewed(id: string, reviewedBy: string, notes?: string): Promise<VerificationRequest | undefined> {
    const [updated] = await db
      .update(verificationRequests)
      .set({
        status: 'reviewed',
        reviewedAt: new Date(),
        reviewedBy,
        notes,
      })
      .where(eq(verificationRequests.id, id))
      .returning();
    return updated;
  }

  async approveVerificationRequest(id: string, reviewedBy: string, notes?: string): Promise<VerificationRequest | undefined> {
    // First get the verification request to find the professional
    const [verifyRequest] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.id, id));
    
    if (!verifyRequest) {
      return undefined;
    }

    // Update the verification request status
    const [updated] = await db
      .update(verificationRequests)
      .set({
        status: 'reviewed',
        reviewedAt: new Date(),
        reviewedBy,
        notes,
      })
      .where(eq(verificationRequests.id, id))
      .returning();

    // Set the professional as verified
    await db
      .update(professionals)
      .set({
        isVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(professionals.id, verifyRequest.professionalId));

    // Create notification for the professional
    await this.createNotification({
      userId: verifyRequest.userId,
      title: "¡Cuenta Verificada!",
      message: "Tu cuenta profesional ha sido verificada exitosamente. Ahora tienes la insignia de verificación.",
      type: "system",
    });

    return updated;
  }

  // Support message operations
  async createSupportSystemMessage(chatId: string, content: string, messageType: 'system_info' | 'system_warning' = 'system_info'): Promise<void> {
    const newMessage = {
      supportChatId: chatId,
      senderId: null, // Sistema no tiene senderId
      senderType: "system" as const,
      content,
      messageType,
      isRead: false
    };

    await db.insert(supportMessages).values(newMessage);

    // Actualizar timestamp del chat
    await db
      .update(supportChats)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(supportChats.id, chatId));
  }

  // Profile clicks operations
  async createProfileClick(click: InsertProfileClick): Promise<ProfileClick> {
    const [newClick] = await db.insert(profileClicks).values(click).returning();
    return newClick;
  }

  async getProfileClickByDeviceAndProfessional(deviceFingerprint: string, professionalId: string): Promise<ProfileClick | undefined> {
    const [click] = await db
      .select()
      .from(profileClicks)
      .where(and(
        eq(profileClicks.deviceFingerprint, deviceFingerprint),
        eq(profileClicks.professionalId, professionalId)
      ));
    return click;
  }

  async getProfileClickCount(professionalId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(profileClicks)
      .where(eq(profileClicks.professionalId, professionalId));
    return result.count;
  }

  // Password reset operations
  async createPasswordResetToken(userId: string, token: string, code: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId,
      token,
      code,
      expiresAt,
    }).returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`
      ));
    return resetToken;
  }

  async getPasswordResetTokenByCode(code: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db.select().from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.code, code),
        eq(passwordResetTokens.used, false),
        sql`${passwordResetTokens.expiresAt} > NOW()`
      ));
    return resetToken;
  }

  async markPasswordResetTokenAsUsed(tokenOrCode: string): Promise<void> {
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(or(
        eq(passwordResetTokens.token, tokenOrCode),
        eq(passwordResetTokens.code, tokenOrCode)
      ));
  }

  async deleteExpiredPasswordResetTokens(): Promise<void> {
    await db.delete(passwordResetTokens)
      .where(sql`${passwordResetTokens.expiresAt} < NOW()`);
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ password: newPassword, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

}

export const storage = new DatabaseStorage();
