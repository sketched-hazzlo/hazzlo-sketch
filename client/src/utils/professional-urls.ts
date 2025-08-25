/**
 * Utility functions for generating professional URLs with friendly slugs
 */

export function getProfessionalUrl(professional: { id: string; slug?: string }): string {
  // Use slug if available, otherwise fallback to ID
  const identifier = professional.slug || professional.id;
  return `/professional/${identifier}`;
}

export function getChatUrl(professional: { id: string; slug?: string }): string {
  // Use slug if available, otherwise fallback to ID
  const identifier = professional.slug || professional.id;
  return `/chat?professional=${identifier}`;
}

export function isSlugFormat(identifier: string): boolean {
  // Check if it's in slug format (initials-numbers)
  const slugPattern = /^[a-z]{1,4}-\d{5}$/;
  return slugPattern.test(identifier);
}

export function isUUIDFormat(identifier: string): boolean {
  // Check if it's a UUID format
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(identifier);
}