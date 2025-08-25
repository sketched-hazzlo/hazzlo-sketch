import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for PostgreSQL session store
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type", { enum: ["client", "professional"] }).default("client"),
  password: varchar("password"), // For custom auth
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service Categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: varchar("icon"),
  color: varchar("color"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Professional Profiles
export const professionals = pgTable("professionals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: varchar("business_name").notNull(),
  slug: varchar("slug").unique(), // URL amigable: iniciales-12345
  description: text("description"),
  phone: varchar("phone"),
  location: varchar("location").notNull(),
  address: text("address"),
  website: varchar("website"),
  businessPhotos: text("business_photos").array(), // Array of business photo URLs
  isVerified: boolean("is_verified").default(false),
  isPremium: boolean("is_premium").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  completedServices: integer("completed_services").default(0),
  isBanned: boolean("is_banned").default(false),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professional Services
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  title: varchar("title").notNull(),
  description: text("description"),
  priceFrom: decimal("price_from", { precision: 10, scale: 2 }),
  priceTo: decimal("price_to", { precision: 10, scale: 2 }),
  duration: integer("duration"), // in minutes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Business Images
export const businessImages = pgTable("business_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  imageUrl: varchar("image_url").notNull(),
  orderIndex: integer("order_index").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Portfolio Items
export const portfolio = pgTable("portfolio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  projectUrl: varchar("project_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service Requests
export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  serviceId: varchar("service_id").references(() => services.id),
  title: varchar("title").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["pending", "accepted", "declined", "completed", "cancelled"] }).default("pending"),
  scheduledDate: timestamp("scheduled_date"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Conversations
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  serviceRequestId: varchar("service_request_id").references(() => serviceRequests.id),
  isActive: boolean("is_active").default(true),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ["text", "image", "file"] }).default("text"),
  fileUrl: varchar("file_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type", { enum: ["message", "service_request", "review", "payment", "system"] }).notNull(),
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  emailNotifications: boolean("email_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  pushNotifications: boolean("push_notifications").default(true),
  marketingEmails: boolean("marketing_emails").default(true),
  theme: varchar("theme", { enum: ["light", "dark", "system"] }).default("system"),
  language: varchar("language").default("es"),
  timezone: varchar("timezone").default("America/Mexico_City"),
  privacy: jsonb("privacy").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin Actions Log
export const adminActions = pgTable("admin_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: varchar("target_type", { enum: ["user", "professional", "service", "category", "review", "database"] }).notNull(),
  targetId: varchar("target_id").notNull(),
  action: varchar("action").notNull(), // e.g., "ban", "suspend", "verify", "promote_admin", "edit_profile", etc.
  details: jsonb("details"), // Store action-specific data
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Moderadores - Tabla separada para cuentas de moderador
export const moderators = pgTable("moderators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moderatorId: varchar("moderator_id").notNull().unique(), // ID personalizado para login
  password: varchar("password").notNull(), // Contraseña hasheada
  name: varchar("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id), // Admin que lo creó
});

// Chats de soporte en vivo
export const supportChats = pgTable("support_chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moderatorId: varchar("moderator_id").references(() => moderators.id), // Moderador asignado
  adminInterventionId: varchar("admin_intervention_id").references(() => users.id), // Admin que interviene
  status: varchar("status", { enum: ["open", "assigned", "escalated", "closed"] }).default("open"),
  priority: varchar("priority", { enum: ["low", "medium", "high"] }).default("medium"),
  subject: varchar("subject"),
  adminIntervened: boolean("admin_intervened").default(false), // Si un admin ha decidido intervenir
  isAdminVisible: boolean("is_admin_visible").default(false), // Si está visible para admins
  escalationReason: text("escalation_reason"), // Razón del escalamiento
  lastMessageAt: timestamp("last_message_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mensajes de chats de soporte
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supportChatId: varchar("support_chat_id").notNull().references(() => supportChats.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id"), // Puede ser user_id, moderator_id o admin_id
  senderType: varchar("sender_type", { enum: ["user", "moderator", "admin", "system"] }).notNull(),
  content: text("content").notNull(),
  messageType: varchar("message_type", { enum: ["text", "image", "file", "system_info", "system_warning"] }).default("text"),
  fileUrl: varchar("file_url"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports System
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportType: varchar("report_type", { enum: ["professional_profile", "chat_conversation"] }).notNull(),
  targetId: varchar("target_id").notNull(), // ID of the professional or conversation being reported
  reason: text("reason").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["pending", "reviewing", "resolved", "dismissed"] }).default("pending"),
  adminNotes: text("admin_notes"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Verification Requests
export const verificationRequests = pgTable("verification_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { enum: ["pending", "reviewed"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  notes: text("notes"),
});

// Profile Clicks Tracking
export const profileClicks = pgTable("profile_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  professionalId: varchar("professional_id").notNull().references(() => professionals.id, { onDelete: "cascade" }),
  deviceFingerprint: varchar("device_fingerprint").notNull(), // Unique identifier per device
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  referrerPage: varchar("referrer_page"), // /profesionales, /servicios, landing, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Ensure one click per device per professional
  index("idx_profile_clicks_unique").on(table.professionalId, table.deviceFingerprint),
]);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  professional: one(professionals, {
    fields: [users.id],
    references: [professionals.userId],
  }),
  reviews: many(reviews),
  serviceRequests: many(serviceRequests),
}));

export const professionalsRelations = relations(professionals, ({ one, many }) => ({
  user: one(users, {
    fields: [professionals.userId],
    references: [users.id],
  }),
  services: many(services),
  portfolio: many(portfolio),
  reviews: many(reviews),
  serviceRequests: many(serviceRequests),
  profileClicks: many(profileClicks),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  services: many(services),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  professional: one(professionals, {
    fields: [services.professionalId],
    references: [professionals.id],
  }),
  category: one(categories, {
    fields: [services.categoryId],
    references: [categories.id],
  }),
  reviews: many(reviews),
  serviceRequests: many(serviceRequests),
}));

export const portfolioRelations = relations(portfolio, ({ one }) => ({
  professional: one(professionals, {
    fields: [portfolio.professionalId],
    references: [professionals.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  professional: one(professionals, {
    fields: [reviews.professionalId],
    references: [professionals.id],
  }),
  client: one(users, {
    fields: [reviews.clientId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [reviews.serviceId],
    references: [services.id],
  }),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  client: one(users, {
    fields: [serviceRequests.clientId],
    references: [users.id],
  }),
  professional: one(professionals, {
    fields: [serviceRequests.professionalId],
    references: [professionals.id],
  }),
  service: one(services, {
    fields: [serviceRequests.serviceId],
    references: [services.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  client: one(users, {
    fields: [conversations.clientId],
    references: [users.id],
  }),
  professional: one(professionals, {
    fields: [conversations.professionalId],
    references: [professionals.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [conversations.serviceRequestId],
    references: [serviceRequests.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  admin: one(users, {
    fields: [adminActions.adminId],
    references: [users.id],
  }),
}));

export const moderatorsRelations = relations(moderators, ({ one, many }) => ({
  createdByAdmin: one(users, {
    fields: [moderators.createdBy],
    references: [users.id],
  }),
  supportChats: many(supportChats),
}));

export const supportChatsRelations = relations(supportChats, ({ one, many }) => ({
  user: one(users, {
    fields: [supportChats.userId],
    references: [users.id],
  }),
  moderator: one(moderators, {
    fields: [supportChats.moderatorId],
    references: [moderators.id],
  }),
  adminIntervention: one(users, {
    fields: [supportChats.adminInterventionId],
    references: [users.id],
  }),
  messages: many(supportMessages),
}));

export const supportMessagesRelations = relations(supportMessages, ({ one }) => ({
  supportChat: one(supportChats, {
    fields: [supportMessages.supportChatId],
    references: [supportChats.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  resolvedByAdmin: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
  }),
}));

// Validation schemas
export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  status: true,
  adminNotes: true,
  resolvedBy: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type SelectReport = typeof reports.$inferSelect;

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfessionalSchema = createInsertSchema(professionals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  reviewCount: true,
  completedServices: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBusinessImageSchema = createInsertSchema(businessImages).omit({
  id: true,
  createdAt: true,
});

export const insertAdminActionSchema = createInsertSchema(adminActions).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertModeratorSchema = createInsertSchema(moderators).omit({
  id: true,
  createdAt: true,
});

export const insertSupportChatSchema = createInsertSchema(supportChats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Professional = typeof professionals.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Portfolio = typeof portfolio.$inferSelect;
export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type BusinessImage = typeof businessImages.$inferSelect;
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertBusinessImage = z.infer<typeof insertBusinessImageSchema>;
export type AdminAction = typeof adminActions.$inferSelect;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Nuevos tipos para las tablas de soporte
export type Moderator = typeof moderators.$inferSelect;
export type SupportChat = typeof supportChats.$inferSelect;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertModerator = z.infer<typeof insertModeratorSchema>;
export type InsertSupportChat = z.infer<typeof insertSupportChatSchema>;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

// Tipos con relaciones para soporte
export type SupportChatWithDetails = SupportChat & {
  user: User;
  moderator?: Moderator;
  adminIntervention?: User;
  messages: SupportMessage[];
};

export type SupportChatListItem = SupportChat & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'profileImageUrl'>;
  moderator?: Pick<Moderator, 'id' | 'name'>;
  adminIntervention?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  _count: {
    messages: number;
  };
};

// Professional with relations
export type ProfessionalWithDetails = Professional & {
  user: User;
  services: (Service & { category: Category })[];
  portfolio: Portfolio[];
  reviews: (Review & { client: User })[];
};

// User with relations
export type UserWithProfessional = User & {
  professional?: Professional;
};

// Verification Requests Types
export type VerificationRequest = typeof verificationRequests.$inferSelect;
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert;

export const insertVerificationRequestSchema = createInsertSchema(verificationRequests).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
  reviewedBy: true,
});

export type VerificationRequestWithDetails = VerificationRequest & {
  professional: Professional & { user: User };
  reviewedByUser?: User;
};

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  code: varchar("code").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password Reset Token Relations
export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, {
    fields: [passwordResetTokens.userId],
    references: [users.id],
  }),
}));

// Password Reset Token Types
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// Profile Clicks Relations
export const profileClicksRelations = relations(profileClicks, ({ one }) => ({
  professional: one(professionals, {
    fields: [profileClicks.professionalId],
    references: [professionals.id],
  }),
}));

// Profile Clicks Types
export const insertProfileClickSchema = createInsertSchema(profileClicks).omit({
  id: true,
  createdAt: true,
});

export type ProfileClick = typeof profileClicks.$inferSelect;
export type InsertProfileClick = z.infer<typeof insertProfileClickSchema>;