import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

// Hash password function (consistent with auth.ts)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log('🔧 Checking for admin user...');
    
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'admin@hazzlo.com'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      
      // Update to ensure it has admin privileges
      const hashedPassword = await hashPassword('hazzlo2312');
      await db
        .update(users)
        .set({ 
          isAdmin: true,
          password: hashedPassword
        })
        .where(eq(users.email, 'admin@hazzlo.com'));
      
      console.log('✅ Admin user updated with latest credentials');
      return;
    }

    // Create new admin user
    const hashedPassword = await hashPassword('hazzlo2312');
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: 'admin@hazzlo.com',
        firstName: 'Administrator',
        lastName: 'Hazzlo',
        password: hashedPassword,
        isAdmin: true,
        userType: 'client',
      })
      .returning();

    console.log('✅ Admin user created successfully:', newAdmin.email);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  }
}

export { createAdminUser };