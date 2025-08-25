// Device fingerprinting utility for click tracking
export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const canvasData = canvas.toDataURL();
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenWidth: screen.width,
    screenHeight: screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvasData.substring(canvasData.length - 50), // Last 50 chars for uniqueness
    colorDepth: screen.colorDepth,
    pixelDepth: screen.pixelDepth,
  };
  
  // Create a simple hash from the fingerprint data
  const fingerprintString = JSON.stringify(fingerprint);
  let hash = 0;
  
  for (let i = 0; i < fingerprintString.length; i++) {
    const char = fingerprintString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Track profile click
export async function trackProfileClick(professionalId: string, referrerPage?: string) {
  try {
    const deviceFingerprint = generateDeviceFingerprint();
    
    const response = await fetch(`/api/professionals/${professionalId}/clicks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deviceFingerprint,
        referrerPage: referrerPage || window.location.pathname,
      }),
    });
    
    if (!response.ok) {
      console.warn('Failed to track profile click:', response.statusText);
    }
    
    return response.json();
  } catch (error) {
    console.warn('Error tracking profile click:', error);
  }
}