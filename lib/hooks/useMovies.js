/**
 * Custom React hook for fetching movie data
 * Handles loading, error states, and caching
 */

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { getPreferredMovieRating, withPreferredMovieRating } from '../utils/ratings';
import { withStoredTmdbDetails } from '../utils/tmdb';
import { normalizePlatform } from '../utils/platforms';

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;

function formatLocalDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapOttMovieToTrendingMovie(movie) {
  const movieWithTmdbDetails = withStoredTmdbDetails(movie);

  return {
    ...movieWithTmdbDetails,
    title: movieWithTmdbDetails.title || movieWithTmdbDetails.movie_name || 'Untitled',
    movie_name: movieWithTmdbDetails.movie_name || movieWithTmdbDetails.title || 'Untitled',
    rating: getPreferredMovieRating(movieWithTmdbDetails),
    streaming_partner: normalizePlatform(movieWithTmdbDetails.streaming_partner),
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

        setMovie(withPreferredMovieRating(data));
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
        setMovies((data || []).map(withPreferredMovieRating));
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

function normalizeGenres(genres, genreIds) {
  const source = Array.isArray(genres) && genres.length > 0
    ? genres
    : Array.isArray(genreIds)
      ? genreIds
      : [];

  return source
    .map((genre) => {
      if (typeof genre === 'string' || typeof genre === 'number') {
        return String(genre).trim().toLowerCase();
      }

      if (genre && (genre.name || genre.id)) {
        return String(genre.name || genre.id).trim().toLowerCase();
      }

      return '';
    })
    .filter(Boolean);
}

function getMovieDateValue(movie) {
  const rawDate = movie?.digital_release_date || movie?.release_date || movie?.created_at || '';
  const timestamp = new Date(`${String(rawDate).slice(0, 10)}T00:00:00`).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getMovieScore(movie, genreMatches = 0, platformMatches = 0) {
  const rating = Number(getPreferredMovieRating(movie) || 0);
  const voteCount = Number(movie?.vote_count || movie?.tmdb_vote_count || movie?.imdb_votes || 0);

  return (
    genreMatches * 30 +
    platformMatches * 18 +
    Math.min(rating, 10) * 12 +
    Math.min(voteCount / 150, 8) +
    getMovieDateValue(movie) / 1000000000000
  );
}

export function useMovieRetentionRows(movie, limit = 8) {
  const [rows, setRows] = useState({
    moreLikeThis: [],
    peopleAlsoWatched: [],
    moreFromPlatform: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const movieId = movie?.id || null;
  const moviePlatform = movie?.streaming_partner || '';
  const movieCategory = movie?.category || '';
  const movieLanguage = movie?.language || '';
  const movieAltLanguage = movie?.movie_language || '';
  const movieGenresKey = JSON.stringify(movie?.genres || []);
  const movieGenreIdsKey = JSON.stringify(movie?.genre_ids || []);
  const movieGenres = useMemo(() => JSON.parse(movieGenresKey), [movieGenresKey]);
  const movieGenreIds = useMemo(() => JSON.parse(movieGenreIdsKey), [movieGenreIdsKey]);
  const currentGenres = useMemo(
    () => normalizeGenres(movieGenres, movieGenreIds),
    [movieGenres, movieGenreIds]
  );
  const currentPlatform = useMemo(() => normalizePlatform(moviePlatform), [moviePlatform]);
  const currentCategory = useMemo(() => String(movieCategory || '').trim().toLowerCase(), [movieCategory]);
  const currentLanguage = useMemo(
    () => String(movieLanguage || movieAltLanguage || 'Telugu').trim().toLowerCase(),
    [movieLanguage, movieAltLanguage]
  );

  useEffect(() => {
    if (!movieId) {
      setRows({
        moreLikeThis: [],
        peopleAlsoWatched: [],
        moreFromPlatform: [],
      });
      setLoading(false);
      return;
    }

    async function loadRetentionRows() {
      setLoading(true);
      setError(null);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .neq('id', movieId)
          .order('digital_release_date', { ascending: false })
          .limit(160);

        if (dbError) throw dbError;

        const candidates = (data || []).map(withPreferredMovieRating);
        const usedIds = new Set([movieId]);

        const scoredCandidates = candidates.map((candidate) => {
          const candidateGenres = normalizeGenres(candidate?.genres, candidate?.genre_ids);
          const genreMatches = candidateGenres.filter((genre) => currentGenres.includes(genre)).length;
          const samePlatform = normalizePlatform(candidate.streaming_partner) === currentPlatform ? 1 : 0;
          const sameCategory = String(candidate.category || '').trim().toLowerCase() === currentCategory ? 1 : 0;
          const sameLanguage = String(candidate.language || candidate.movie_language || 'Telugu').trim().toLowerCase() === currentLanguage ? 1 : 0;

          return {
            ...candidate,
            __genreMatches: genreMatches,
            __samePlatform: samePlatform,
            __sameCategory: sameCategory,
            __sameLanguage: sameLanguage,
            __score: getMovieScore(candidate, genreMatches + sameCategory, samePlatform + sameLanguage),
          };
        });

        const pickMovies = (predicate, sorter) => scoredCandidates
          .filter((candidate) => !usedIds.has(candidate.id) && predicate(candidate))
          .sort(sorter)
          .slice(0, limit)
          .map((candidate) => {
            usedIds.add(candidate.id);
            return candidate;
          });

        const moreLikeThis = pickMovies(
          (candidate) => candidate.__genreMatches > 0 || candidate.__sameCategory,
          (a, b) => b.__score - a.__score
        );

        const peopleAlsoWatched = pickMovies(
          (candidate) => candidate.__sameLanguage || candidate.__genreMatches > 0 || candidate.__samePlatform,
          (a, b) => b.__score - a.__score
        );

        const moreFromPlatform = pickMovies(
          (candidate) => normalizePlatform(candidate.streaming_partner) === currentPlatform,
          (a, b) => getMovieDateValue(b) - getMovieDateValue(a)
        );

        setRows({
          moreLikeThis,
          peopleAlsoWatched,
          moreFromPlatform,
        });
      } catch (err) {
        console.error('Error loading movie retention rows:', err);
        setError(err.message || 'Failed to load recommendations');
        setRows({
          moreLikeThis: [],
          peopleAlsoWatched: [],
          moreFromPlatform: [],
        });
      } finally {
        setLoading(false);
      }
    }

    loadRetentionRows();
  }, [
    movieId,
    moviePlatform,
    movieCategory,
    movieLanguage,
    movieAltLanguage,
    movieGenresKey,
    movieGenreIdsKey,
    currentGenres,
    currentPlatform,
    currentCategory,
    currentLanguage,
    limit,
  ]);

  return { rows, loading, error };
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
        setMovies((data || []).map(withPreferredMovieRating));
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
          setMovies(cachedData.movies.map(mapOttMovieToTrendingMovie));
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
          setMovies(cachedData.movies.map(mapOttMovieToTrendingMovie));
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

        const todayStr = formatLocalDateISO(today);
        const weekStr = formatLocalDateISO(weekFromNow);

        const { data, error: dbError } = await supabase
          .from('ott_movies')
          .select('*')
          .gte('digital_release_date', todayStr)
          .lte('digital_release_date', weekStr)
          .order('digital_release_date', { ascending: true });

        if (dbError) throw dbError;
        setMovies((data || []).map(withPreferredMovieRating));
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
        const dateStr = formatLocalDateISO(thirtyDaysAgo);

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
