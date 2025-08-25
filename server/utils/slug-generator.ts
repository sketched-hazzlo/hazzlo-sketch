/**
 * Utilidades para generar y manejar slugs únicos de profesionales
 * Formato: iniciales-12345 (ejemplo: ag-84729)
 */

/**
 * Genera iniciales a partir del nombre del negocio
 */
export function generateInitials(businessName: string): string {
  // Eliminar caracteres especiales y dividir por espacios
  const words = businessName
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 0);
  
  if (words.length === 0) return 'xx';
  
  // Tomar la primera letra de cada palabra (máximo 4)
  const initials = words
    .slice(0, 4)
    .map(word => word.charAt(0).toLowerCase())
    .join('');
  
  // Normalizar caracteres con acentos
  return initials
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 4) || 'xx';
}

/**
 * Genera un número único de 5 dígitos
 */
export function generateUniqueNumber(): string {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

/**
 * Genera un slug único completo
 */
export function generateSlug(businessName: string): string {
  const initials = generateInitials(businessName);
  const number = generateUniqueNumber();
  return `${initials}-${number}`;
}

/**
 * Valida si un slug tiene el formato correcto
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z]{1,4}-\d{5}$/.test(slug);
}

/**
 * Extrae las partes de un slug
 */
export function parseSlug(slug: string): { initials: string; number: string } | null {
  const match = slug.match(/^([a-z]{1,4})-(\d{5})$/);
  if (!match) return null;
  
  return {
    initials: match[1],
    number: match[2]
  };
}

/**
 * Determina si el parámetro es un ID UUID o un slug
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}