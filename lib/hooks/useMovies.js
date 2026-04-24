/**
 * Custom React hook for fetching movie data
 * Handles loading, error states, and caching
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

function normalizePlatform(value) {
  if (!value) return '';
  const lower = String(value).toLowerCase();
  if (lower.includes('prime')) return 'Prime Video';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('aha')) return 'Aha';
  if (lower.includes('hotstar')) return 'JioHotstar';
  if (lower.includes('zee')) return 'Zee5';
  if (lower.includes('sun nxt') || lower.includes('sun')) return 'Sun NXT';
  if (lower.includes('etv')) return 'ETV Win';
  return String(value).trim();
}

function mapOttMovieToTrendingMovie(movie) {
  const parsedRating = typeof movie.rating === 'number' ? movie.rating : Number(movie.rating);

  return {
    ...movie,
    title: movie.title || movie.movie_name || 'Untitled',
    movie_name: movie.movie_name || movie.title || 'Untitled',
    rating: Number.isFinite(parsedRating) ? parsedRating : null,
    streaming_partner: normalizePlatform(movie.streaming_partner),
    source: 'supabase',
  };
}

/**
 * Hook to fetch a single movie by slug
 * @param {string} slug - Movie slug or ID
 * @returns {object} - { movie, loading, error }
 */
export function useMovie(slug) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    async function loadMovie() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        // Try to parse ID from slug (slug format: "title-123")
        const slugValue = String(slug);
        const trailingId = slugValue.match(/(\d+)$/)?.[1];
        const id = trailingId ? parseInt(trailingId, 10) : null;

        let query = supabase.from('ott_movies').select('*');

        if (id) {
          query = query.eq('id', id).maybeSingle();
        } else {
          query = query
            .ilike('movie_name', `%${slugValue.replace(/-/g, ' ')}%`)
            .order('digital_release_date', { ascending: false })
            .limit(1)
            .maybeSingle();
        }

        const { data, error: dbError } = await query;

        if (dbError) throw dbError;
        if (!data) throw new Error('Movie not found');

        setMovie(data);
      } catch (err) {
        console.error('Error loading movie:', err);
        setError(err.message || 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [slug]);

  return { movie, loading, error };
}

function getTmdbMediaType(category) {
  const normalizedCategory = String(category || '').toLowerCase();
  if (
    normalizedCategory.includes('series') ||
    normalizedCategory.includes('web series') ||
    normalizedCategory.includes('tv')
  ) {
    return 'tv';
  }

  return 'movie';
}

function getLocalStorageCache(cacheKey) {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cachedValue = window.localStorage.getItem(cacheKey);
    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch (error) {
    console.error(`Error reading cache for ${cacheKey}:`, error);
    return null;
  }
}

function isCacheFresh(timestamp, maxAge = TWENTY_FOUR_HOURS_IN_MS) {
  if (!timestamp) {
    return false;
  }

  return Date.now() - timestamp < maxAge;
}

function setLocalStorageCache(cacheKey, data) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing cache for ${cacheKey}:`, error);
  }
}

export function useTmdbDetails(tmdbId, category) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tmdbId) {
      setDetails(null);
      setLoading(false);
      return;
    }

    async function loadDetails() {
      setLoading(true);
      setError(null);

      try {
        const mediaType = getTmdbMediaType(category);
        const response = await fetch(
          `/api/tmdb/details?id=${encodeURIComponent(tmdbId)}&mediaType=${encodeURIComponent(mediaType)}`
        );

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`TMDB details request failed (${response.status}): ${body}`);
        }

        const payload = await response.json();
        setDetails(payload);
      } catch (err) {
        console.error('Error loading TMDB details:', err);
        setError(err.message || 'Failed to load TMDB details');
        setDetails(null);
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [tmdbId, category]);

  return { details, loading, error };
}

/**
 * Hook to fetch related/similar movies
 * @param {string|number} movieId - Movie ID to get related movies for
 * @param {number} limit - Number of movies to fetch (default: 6)
 * @returns {object} - { movies, loading, error }
 */
export function useSimilarMovies(movieId, limit = 6) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movieId) {
      setLoading(false);
      return;
    }

    async function loadSimilar() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        // Get current movie genres (you'd need this field in your schema)
        const { data: currentMovie } = await supabase
          .from('ott_movies')
          .select('genre_ids, streaming_partner')
          .eq('id', movieId)
          .single();

        if (!currentMovie) throw new Error('Movie not found');

        // Simple recommendation: same platform or similar properties
        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .eq('streaming_partner', currentMovie.streaming_partner)
          .neq('id', movieId)
          .limit(limit);

        if (dbError) throw dbError;
        setMovies(data || []);
      } catch (err) {
        console.error('Error loading similar movies:', err);
        setError(err.message || 'Failed to load similar movies');
      } finally {
        setLoading(false);
      }
    }

    loadSimilar();
  }, [movieId, limit]);

  return { movies, loading, error };
}

/**
 * Hook to fetch movies by platform
 * @param {string} platform - Platform name (e.g., 'Netflix')
 * @param {number} limit - Number of movies to fetch
 * @returns {object} - { movies, loading, error }
 */
export function useMoviesByPlatform(platform, limit = 20) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!platform) {
      setLoading(false);
      return;
    }

    async function loadMovies() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .ilike('streaming_partner', `%${platform}%`)
          .order('digital_release_date', { ascending: false })
          .limit(limit);

        if (dbError) throw dbError;
        setMovies(data || []);
      } catch (err) {
        console.error('Error loading movies by platform:', err);
        setError(err.message || 'Failed to load movies');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [platform, limit]);

  return { movies, loading, error };
}

/**
 * Hook to fetch highest-rated OTT movies from Supabase with 24-hour localStorage caching
 * @param {number} limit - Number of movies to fetch
 * @returns {object} - { movies, loading, error }
 */
export function useTrendingMovies(limit = 10) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadTrending() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const cacheKey = `supabase_trending_${limit}`;
        const cachedData = getLocalStorageCache(cacheKey);
        const hasCachedMovies = Array.isArray(cachedData?.movies) && cachedData.movies.length > 0;

        if (hasCachedMovies && isCacheFresh(cachedData.timestamp)) {
          setMovies(cachedData.movies);
          setLoading(false);
          return;
        }

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .not('rating', 'is', null)
          .gt('rating', 0)
          .order('rating', { ascending: false })
          .order('digital_release_date', { ascending: false })
          .limit(limit);

        if (dbError) throw dbError;

        const filtered = (data || []).map(mapOttMovieToTrendingMovie);

        setMovies(filtered);

        setLocalStorageCache(cacheKey, {
          movies: filtered,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error loading trending movies:', err);
        const cacheKey = `supabase_trending_${limit}`;
        const cachedData = getLocalStorageCache(cacheKey);

        if (Array.isArray(cachedData?.movies) && cachedData.movies.length > 0) {
          setMovies(cachedData.movies);
        } else {
          setMovies([]);
        }

        setError(err.message || 'Failed to load trending movies');
      } finally {
        setLoading(false);
      }
    }

    loadTrending();
  }, [limit]);

  return { movies, loading, error };
}

/**
 * Hook to fetch movies releasing this week
 * @returns {object} - { movies, loading, error }
 */
export function useReleasingThisWeek() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReleases() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const todayStr = today.toISOString().split('T')[0];
        const weekStr = weekFromNow.toISOString().split('T')[0];

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .gte('digital_release_date', todayStr)
          .lte('digital_release_date', weekStr)
          .order('digital_release_date', { ascending: true });

        if (dbError) throw dbError;
        setMovies(data || []);
      } catch (err) {
        console.error('Error loading this week releases:', err);
        setError(err.message || 'Failed to load releases');
      } finally {
        setLoading(false);
      }
    }

    loadReleases();
  }, []);

  return { movies, loading, error };
}

/**
 * Hook to fetch recently added movies (last 30 days)
 * @param {number} limit - Number of movies to fetch
 * @returns {object} - { movies, loading, error }
 */
export function useRecentlyAdded(limit = 10) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadRecent() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .gte('created_at', dateStr)
          .not('poster_path', 'is', null)
          .order('digital_release_date', { ascending: false })
          .limit(limit);

        if (dbError) throw dbError;
        setMovies(data || []);
      } catch (err) {
        console.error('Error loading recently added:', err);
        setError(err.message || 'Failed to load movies');
      } finally {
        setLoading(false);
      }
    }

    loadRecent();
  }, [limit]);

  return { movies, loading, error };
}
