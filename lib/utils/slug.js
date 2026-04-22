/**
 * Utilities for URL slug generation and parsing
 * Used for creating SEO-friendly URLs like /movie/baahubali-2
 */

/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - Text to slugify
 * @returns {string} - URL-friendly slug
 */
export function generateSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Remove special characters and non-ASCII
    .replace(/[^\w\s-]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a unique slug with ID to prevent collisions
 * @param {string} title - Movie title
 * @param {number|string} id - Unique ID (from TMDB or database)
 * @returns {string} - Unique slug
 */
export function generateUniqueSlug(title, id) {
  const baseSlug = generateSlug(title);
  return id ? `${baseSlug}-${id}` : baseSlug;
}

/**
 * Parse slug to extract title and ID
 * @param {string} slug - URL slug
 * @returns {object} - { title, id }
 */
export function parseSlug(slug) {
  if (!slug) return { title: '', id: null };
  
  const lastHyphen = slug.lastIndexOf('-');
  if (lastHyphen === -1) {
    return { title: slug, id: null };
  }
  
  const potentialId = slug.slice(lastHyphen + 1);
  
  // Check if the last part is a number (likely ID)
  if (/^\d+$/.test(potentialId)) {
    return {
      title: slug.slice(0, lastHyphen),
      id: parseInt(potentialId, 10),
    };
  }
  
  return { title: slug, id: null };
}

/**
 * Normalize a title for comparison (case-insensitive, no special chars)
 * @param {string} title - Movie title
 * @returns {string} - Normalized title
 */
export function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
