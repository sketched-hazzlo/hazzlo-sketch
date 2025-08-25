import { Resend } from 'resend';
import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateResetCode(): string {
  // Generar código de 6 dígitos
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateTokenExpiry(): Date {
  // Token válido por 1 hora
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 1);
  return expiryTime;
}

export async function sendHelpFormEmail(name: string, email: string, subject: string, message: string) {
  if (!resend) {
    console.warn('📧 Email service not configured - RESEND_API_KEY not found. Email would be sent to:', email);
    return { success: false, message: 'Email service not configured' };
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Hazzlo <noreply@hazzlo.net>',
      to: ['nunezmiguel@hazzlo.net'],
      subject: `Formulario de Ayuda - ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Formulario de Ayuda - Hazzlo</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            .header {
              padding: 32px;
              text-align: center;
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
              border-bottom: 1px solid #e2e8f0;
            }
            .header h1 {
              color: #1e293b;
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 32px;
            }
            .field {
              margin-bottom: 24px;
            }
            .field-label {
              color: #475569;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 8px;
              display: block;
            }
            .field-value {
              color: #1e293b;
              font-size: 16px;
              line-height: 1.6;
              background: #f8fafc;
              padding: 12px 16px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .message-field {
              white-space: pre-wrap;
            }
            .footer {
              background: #f8fafc;
              padding: 24px 32px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              color: #64748b;
              font-size: 12px;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nuevo mensaje de ayuda</h1>
            </div>
            
            <div class="content">
              <div class="field">
                <span class="field-label">Nombre:</span>
                <div class="field-value">${name}</div>
              </div>
              
              <div class="field">
                <span class="field-label">Email:</span>
                <div class="field-value">${email}</div>
              </div>
              
              <div class="field">
                <span class="field-label">Asunto:</span>
                <div class="field-value">${subject}</div>
              </div>
              
              <div class="field">
                <span class="field-label">Mensaje:</span>
                <div class="field-value message-field">${message}</div>
              </div>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Este mensaje fue enviado desde el formulario de ayuda de Hazzlo.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Nuevo mensaje de ayuda - Hazzlo
        
        Nombre: ${name}
        Email: ${email}
        Asunto: ${subject}
        
        Mensaje:
        ${message}
        
        ---
        Este mensaje fue enviado desde el formulario de ayuda de Hazzlo.
      `
    });

    if (error) {
      console.error('Error sending help form email:', error);
      throw new Error('Error enviando el correo de ayuda');
    }

    console.log('Help form email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send help form email:', error);
    throw new Error('Error enviando el correo de ayuda');
  }
}

export async function sendPasswordResetEmail(email: string, token: string, code: string, userName: string) {
  if (!resend) {
    console.warn('📧 Email service not configured - RESEND_API_KEY not found.');
    console.log(`🔐 Password reset code for ${email}: ${code}`);
    console.log('💡 Para producción, configure RESEND_API_KEY para enviar emails reales');
    return { success: false, message: 'Email service not configured', code };
  }
  
  const resetUrl = `${process.env.APP_URL || 'https://hazzlo.net'}/auth/reset-password?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Hazzlo <noreply@hazzlo.net>',
      to: [email],
      subject: 'Código de restablecimiento - Hazzlo',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Código de restablecimiento - Hazzlo</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              line-height: 1.6;
              color: #1e293b;
              background-color: #f8fafc;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
              border: 1px solid #e2e8f0;
            }
            .header {
              padding: 48px 32px 32px;
              text-align: center;
              background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            }
            .header h1 {
              color: #1e293b;
              margin: 0 0 8px 0;
              font-size: 24px;
              font-weight: 600;
              letter-spacing: -0.5px;
            }
            .header .subtitle {
              color: #64748b;
              margin: 0;
              font-size: 15px;
              font-weight: 400;
            }
            .code-section {
              padding: 48px 32px;
              text-align: center;
              background: #ffffff;
            }
            .code-label {
              color: #64748b;
              font-size: 14px;
              font-weight: 500;
              margin: 0 0 16px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .code-display {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              margin: 0 0 32px 0;
              display: inline-block;
              min-width: 200px;
            }
            .code {
              font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
              font-size: 36px;
              font-weight: 700;
              color: #1e293b;
              letter-spacing: 8px;
              margin: 0;
            }
            .instructions {
              color: #475569;
              font-size: 15px;
              margin: 0 0 40px 0;
              line-height: 1.6;
            }
            .expire-text {
              color: #f97316;
              font-size: 13px;
              font-weight: 500;
              margin: 16px 0 0 0;
            }
            .alternative {
              padding: 24px 32px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
            }
            .alternative-text {
              color: #64748b;
              font-size: 13px;
              margin: 0 0 16px 0;
              text-align: center;
            }
            .link-button {
              display: inline-block;
              padding: 12px 24px;
              background: #ffffff;
              color: #3b82f6;
              text-decoration: none;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              font-weight: 500;
              font-size: 14px;
              text-align: center;
              transition: all 0.2s ease;
              width: 100%;
              box-sizing: border-box;
            }
            .link-button:hover {
              background: #f8fafc;
              border-color: #cbd5e0;
            }
            .footer {
              background: #f8fafc;
              padding: 24px 32px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer-text {
              color: #64748b;
              font-size: 12px;
              margin: 0;
            }
            @media (max-width: 600px) {
              .container { margin: 0 16px; }
              .header, .code-section, .alternative { padding: 32px 24px; }
              .code { font-size: 28px; letter-spacing: 6px; }
              .code-display { min-width: 180px; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Código de restablecimiento</h1>
              <p class="subtitle">Hola ${userName}, usa este código para restablecer tu contraseña</p>
            </div>
            
            <div class="code-section">
              <p class="code-label">Tu código de verificación</p>
              <div class="code-display">
                <p class="code">${code}</p>
              </div>
              <p class="instructions">
                Ingresa este código en la página de restablecimiento de contraseña para continuar.
              </p>
              <p class="expire-text">⏰ Este código expira en 1 hora</p>
            </div>
            
            <div class="alternative">
              <p class="alternative-text">¿Prefieres usar un enlace directo?</p>
              <a href="${resetUrl}" class="link-button">
                Restablecer con enlace
              </a>
            </div>
            
            <div class="footer">
              <p class="footer-text">
                Si no solicitaste este restablecimiento, ignora este correo.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Código de restablecimiento - Hazzlo
        
        Hola ${userName},
        
        Tu código de verificación es: ${code}
        
        Ingresa este código en la página de restablecimiento de contraseña.
        
        Alternativamente, puedes usar este enlace directo:
        ${resetUrl}
        
        Este código expira en 1 hora por seguridad.
        
        Si no solicitaste este restablecimiento, ignora este correo.
        
        Saludos,
        El equipo de Hazzlo
      `
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Error enviando el correo de restablecimiento');
    }

    console.log('Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Error enviando el correo de restablecimiento');
  }
}