/**
 * Custom React hook for fetching movie data
 * Handles loading, error states, and caching
 */

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

function isGitHubPagesDeploy() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    process.env.NEXT_PUBLIC_IS_GITHUB_DEPLOY === 'true' ||
    window.location.hostname.includes('github.io')
  );
}

function mapTmdbMovieToTrendingMovie(movie) {
  return {
    id: movie.id,
    title: movie.title || movie.original_title || 'Untitled',
    movie_name: movie.title || movie.original_title || 'Untitled',
    poster_path: movie.poster_path || null,
    backdrop_path: movie.backdrop_path || null,
    overview: movie.overview || '',
    rating: typeof movie.vote_average === 'number' ? movie.vote_average : null,
    digital_release_date: movie.release_date || '',
    release_date: movie.release_date || '',
    streaming_partner: 'Live TMDB',
    href: `/theatre-release/${movie.id}`,
    source: 'tmdb',
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
 * Hook to fetch trending movies (highest rated)
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
        const isGitHubDeploy = isGitHubPagesDeploy();
        const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        let response;

        if (isGitHubDeploy) {
          if (!tmdbApiKey) {
            throw new Error('TMDB API key is not configured');
          }

          response = await fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${encodeURIComponent(tmdbApiKey)}&language=te-IN&watch_region=IN&with_watch_monetization_types=flatrate&sort_by=popularity.desc&with_original_language=te&include_adult=false&page=1`
          );
        } else {
          response = await fetch(`/api/tmdb/trending?limit=${encodeURIComponent(limit)}`);
        }

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`TMDB trending request failed (${response.status}): ${body}`);
        }

        const payload = await response.json();
        const results = Array.isArray(payload.results) ? payload.results : [];

        // Filter: only movies with poster and rating > 0
        const filtered = results
          .filter((movie) => movie.poster_path && movie.vote_average && movie.vote_average > 0)
          .slice(0, limit)
          .map(mapTmdbMovieToTrendingMovie);

        setMovies(filtered);
      } catch (err) {
        console.error('Error loading trending movies:', err);
        setError(err.message || 'Failed to load trending movies');
        setMovies([]);
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
