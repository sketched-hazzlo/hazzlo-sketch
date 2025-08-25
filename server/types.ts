// Session type extension
declare module "express-session" {
  interface SessionData {
    userId?: string;
    moderatorId?: string;
    moderatorName?: string;
  }
}

export {};