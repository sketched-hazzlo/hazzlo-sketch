import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import type { IStorage } from "./storage";
import { User as DBUser } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { sendPasswordResetEmail, generateResetToken, generateResetCode, generateTokenExpiry, hashPassword as hashPasswordUtil, comparePasswords as comparePasswordsUtil } from "./email-service";

declare global {
  namespace Express {
    interface User extends DBUser {}
    interface Request {
      user?: DBUser;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PgSession = connectPgSimple(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool: pool,
      tableName: 'sessions',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    }),
    cookie: {
      httpOnly: true,
      secure: false, // Change to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for persistent sessions
      sameSite: 'lax',
      path: '/' // Ensure cookie is available for all routes
    },
    name: 'hazzlo.sid', // Custom session name
    rolling: true, // Extend session on each request
    proxy: false // Important for proper cookie handling
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !user.password) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user with ID:', id);
      const user = await storage.getUser(id);
      console.log('Deserialized user:', user ? { 
        id: user.id, 
        email: ('email' in user) ? user.email || 'N/A' : 'N/A', 
        isAdmin: ('isAdmin' in user) ? user.isAdmin || false : false 
      } : null);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { email, firstName, lastName, password, userType = 'client' } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createCustomUser({
        email,
        firstName,
        lastName,
        userType,
        password: hashedPassword,
      });

      // Auto login after registration
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ ...user, password: undefined }); // Don't send password back
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        console.log('Login successful - Session ID:', req.sessionID);
        console.log('Login successful - User:', { id: user.id, email: user.email, isAdmin: user.isAdmin });
        res.json({ ...user, password: undefined }); // Don't send password back
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('hazzlo.sid');
        res.json({ message: "Logged out successfully" });
      });
    });
  });

  // Request password reset
  app.post("/api/auth/request-password-reset", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // For security, always return success even if user doesn't exist
        return res.json({ message: "Si el email existe en nuestro sistema, recibirás un correo con las instrucciones." });
      }

      // Clean up expired tokens
      await storage.deleteExpiredPasswordResetTokens();

      // Generate reset token and code
      const token = generateResetToken();
      const code = generateResetCode();
      const expiresAt = generateTokenExpiry();

      // Save token to database
      await storage.createPasswordResetToken(user.id, token, code, expiresAt);

      // Send reset email
      const firstName = (user && 'firstName' in user && user.firstName) ? user.firstName : 'Usuario';
      await sendPasswordResetEmail(email, token, code, firstName);

      res.json({ message: "Si el email existe en nuestro sistema, recibirás un correo con las instrucciones." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Error procesando la solicitud" });
    }
  });

  // Reset password with token or code
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, code, newPassword, email } = req.body;

      if ((!token && !code) || !newPassword) {
        return res.status(400).json({ message: "Token o código y nueva contraseña son requeridos" });
      }

      // Validate password length
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
      }

      let resetToken;
      
      // Get reset token by token or code
      if (token) {
        resetToken = await storage.getPasswordResetToken(token);
      } else if (code) {
        resetToken = await storage.getPasswordResetTokenByCode(code);
      }

      if (!resetToken) {
        return res.status(400).json({ message: "Token o código inválido o expirado" });
      }

      // ADDITIONAL SECURITY CHECK: If email is provided, verify it matches the token's user
      if (email) {
        const user = await storage.getUserByEmail(email);
        if (!user || user.id !== resetToken.userId) {
          console.error(`Security violation: Email ${email} doesn't match token user ${resetToken.userId}`);
          return res.status(400).json({ message: "Token o código inválido o expirado" });
        }
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.token);

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Error restableciendo la contraseña" });
    }
  });

  // Verify reset code (old endpoint - kept for backward compatibility)
  app.post("/api/auth/verify-reset-code", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Código es requerido" });
      }

      // Get reset token by code
      const resetToken = await storage.getPasswordResetTokenByCode(code);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Código inválido o expirado", valid: false });
      }

      res.json({ message: "Código válido", valid: true });
    } catch (error) {
      console.error("Code verification error:", error);
      res.status(500).json({ message: "Error verificando el código", valid: false });
    }
  });

  // Secure verify reset code - validates code belongs to specific email
  app.post("/api/auth/verify-reset-code-secure", async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: "Email y código son requeridos" });
      }

      // First verify the user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "Código inválido o expirado", valid: false });
      }

      // Get reset token by code
      const resetToken = await storage.getPasswordResetTokenByCode(code);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Código inválido o expirado", valid: false });
      }

      // CRITICAL SECURITY CHECK: Verify the code belongs to this specific user
      if (resetToken.userId !== user.id) {
        console.error(`Security violation: User ${user.id} (${email}) attempted to use code ${code} that belongs to user ${resetToken.userId}`);
        return res.status(400).json({ message: "Código inválido o expirado", valid: false });
      }

      res.json({ message: "Código válido", valid: true });
    } catch (error) {
      console.error("Secure code verification error:", error);
      res.status(500).json({ message: "Error verificando el código", valid: false });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Token requerido" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      res.json({ valid: true, message: "Token válido" });
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({ message: "Error verificando el token" });
    }
  });

  // Get current user
  app.get("/api/auth/user", async (req, res) => {
    console.log('GET /api/auth/user - Session ID:', req.sessionID);
    console.log('GET /api/auth/user - req.isAuthenticated():', req.isAuthenticated?.());
    console.log('GET /api/auth/user - req.user:', req.user ? { 
      id: req.user.id, 
      email: ('email' in req.user) ? req.user.email || 'N/A' : 'N/A', 
      isAdmin: ('isAdmin' in req.user) ? req.user.isAdmin || false : false 
    } : null);
    console.log('GET /api/auth/user - Session data:', req.session);
    
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get professional profile if user is a professional
      const professional = await storage.getProfessionalByUserId(user.id);
      
      res.json({ ...user, professional, password: undefined });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

}

export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

export function isAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
}