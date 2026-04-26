/**
 * Schema and structured data generation for SEO
 * Generates JSON-LD markup for various schema types
 */

import { generateUniqueSlug } from './slug';
import { getPreferredMovieRating } from './ratings';

/**
 * Generate Movie schema for a movie detail page
 * @param {object} movie - Movie data
 * @param {string} baseUrl - Base URL of the site
 * @returns {object} - JSON-LD Movie schema
 */
export function generateMovieSchema(movie, baseUrl = 'https://svteluguott.in') {
  if (!movie) return null;

  const title = movie.title || movie.movie_name || 'Untitled';
  const releaseDate = movie.digital_release_date || movie.release_date;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: title,
    description: movie.overview || movie.description || '',
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : undefined,
    ...(movie.id && {
      url: `${baseUrl}/movie/${generateUniqueSlug(title, movie.id)}`,
    }),
    ...(movie.backdrop_path && {
      thumbnailUrl: `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`,
    }),
    ...(releaseDate && {
      datePublished: releaseDate,
    }),
    ...(movie.runtime && {
      duration: `PT${movie.runtime}M`,
    }),
  };

  // Add genres if available
  if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    const genres = movie.genre_ids.map((id) => TMDB_GENRE_MAP[id]).filter(Boolean);
    if (genres.length > 0) {
      schema.genre = genres;
    }
  } else if (movie.genres && Array.isArray(movie.genres)) {
    schema.genre = movie.genres.map((g) => g.name || g);
  }

  // Add cast
  if (movie.cast && Array.isArray(movie.cast)) {
    schema.actor = movie.cast.slice(0, 5).map((actor) => ({
      '@type': 'Person',
      name: actor.name || actor,
    }));
  }

  // Add director/crew
  if (movie.crew && Array.isArray(movie.crew)) {
    const directors = movie.crew
      .filter((member) => member.job === 'Director')
      .slice(0, 3);
    if (directors.length > 0) {
      schema.director = directors.map((director) => ({
        '@type': 'Person',
        name: director.name,
      }));
    }
  }

  // Add ratings if available
  const preferredRating = getPreferredMovieRating(movie);
  if (preferredRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(preferredRating * 10) / 10,
      ratingCount: 1000, // Placeholder; would come from your DB
    };
  }

  // Add OTT platform offers
  if (movie.streaming_partner || movie.ott_platforms) {
    const platform = movie.streaming_partner || movie.ott_platforms?.[0];
    if (platform) {
      schema.offers = {
        '@type': 'Offer',
        name: platform,
        price: 'included',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      };
    }
  }

  return schema;
}

/**
 * Generate FAQ schema for FAQ sections
 * @param {array} faqs - Array of { question, answer } objects
 * @returns {object} - JSON-LD FAQPage schema
 */
export function generateFaqSchema(faqs) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate Breadcrumb schema for navigation
 * @param {array} breadcrumbs - Array of { name, url } objects
 * @returns {object} - JSON-LD BreadcrumbList schema
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) return null;
  const baseUrl = 'https://svteluguott.in';

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}` }),
    })),
  };
}

/**
 * Generate VideoObject schema for trailer embeds
 * @param {object} video - Video data { title, description, url, uploadDate }
 * @returns {object} - JSON-LD VideoObject schema
 */
export function generateVideoSchema(video) {
  if (!video) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: video.title || 'Video',
    description: video.description || '',
    ...(video.url && { contentUrl: video.url }),
    ...(video.thumbnailUrl && { thumbnailUrl: video.thumbnailUrl }),
    ...(video.uploadDate && { uploadDate: video.uploadDate }),
    ...(video.duration && { duration: video.duration }),
  };
}

/**
 * Generate Organization schema (for site-wide structured data)
 * @returns {object} - JSON-LD Organization schema
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Telugu OTT Releases',
    url: 'https://svteluguott.in',
    logo: 'https://svteluguott.in/logo.png', // Update with actual logo
    sameAs: [
      'https://twitter.com/teluguottinfo', // Update with actual social
      'https://t.me/teluguottinfo',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-XXX-XXX-XXXX', // Update with actual contact
      contactType: 'Customer Service',
    },
  };
}

/**
 * Generate ItemList schema (for collections)
 * @param {object} config - { title, items, url }
 * @returns {object} - JSON-LD ItemList schema
 */
export function generateItemListSchema(config) {
  const { title, items, url } = config;
  
  if (!Array.isArray(items) || items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    url,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Movie',
        name: item.name || item.title,
        ...(item.image && { image: item.image }),
        ...(item.url && { url: item.url }),
      },
    })),
  };
}

/**
 * TMDB Genre ID to name mapping
 */
export const TMDB_GENRE_MAP = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

/**
 * Serialize schema to JSON-LD script tag
 * @param {object} schema - Schema object
 * @returns {string} - JSON-LD script string
 */
export function schemaToJsonLd(schema) {
  if (!schema) return '';
  return JSON.stringify(schema);
}
