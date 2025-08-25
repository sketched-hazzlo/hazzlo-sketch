// Script para probar el envío de correos directamente
import { sendTestEmail, sendEmail } from './email.js';

async function testEmailSystem() {
  console.log('🧪 Iniciando prueba del sistema de correos...');
  
  const testEmail = 'g27mig@icloud.com'; // Email de prueba
  
  try {
    console.log('1. Probando correo simple...');
    const result1 = await sendTestEmail(testEmail);
    console.log('Resultado correo simple:', result1);
    
    console.log('\n2. Probando correo con HTML complejo...');
    const result2 = await sendEmail({
      to: testEmail,
      subject: 'Prueba de Sistema Completo - Hazzlo',
      htmlContent: `
        <h1>Prueba de Sistema</h1>
        <p>Este es un correo de prueba con HTML más complejo.</p>
        <div style="background: #f0f0f0; padding: 20px; margin: 20px 0;">
          <h2>Sistema de Correos Funcionando</h2>
          <p>Si recibes este mensaje, todo está configurado correctamente.</p>
        </div>
      `,
      textContent: 'Correo de prueba del sistema completo.'
    });
    console.log('Resultado correo HTML:', result2);
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar prueba si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailSystem();
}

export { testEmailSystem };