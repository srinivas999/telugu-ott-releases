import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OMDB_CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const globalState = globalThis;
if (!globalState.__omdbResponseCache) {
  globalState.__omdbResponseCache = new Map();
}
if (!globalState.__omdbInFlightRequests) {
  globalState.__omdbInFlightRequests = new Map();
}

const omdbResponseCache = globalState.__omdbResponseCache;
const omdbInFlightRequests = globalState.__omdbInFlightRequests;

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCacheKey(title, year) {
  return `${normalizeTitle(title)}|${String(year || '').trim()}`;
}

function getCachedResponse(cacheKey) {
  const cachedEntry = omdbResponseCache.get(cacheKey);
  if (!cachedEntry) {
    return null;
  }

  if (cachedEntry.expiresAt < Date.now()) {
    omdbResponseCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.payload;
}

function setCachedResponse(cacheKey, payload) {
  omdbResponseCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + OMDB_CACHE_TTL_MS,
  });
}

async function fetchOmdbTitle({ apiKey, title, year }) {
  const yearParam = year ? `&y=${encodeURIComponent(year)}` : '';
  const omdbUrl = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&t=${encodeURIComponent(title)}${yearParam}`;
  const response = await fetch(omdbUrl);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.Error || payload?.error || 'Unable to fetch OMDb data.');
  }

  return payload;
}

async function fetchOmdbWithFallback({ apiKey, title, year }) {
  const attempts = [];
  const cleaned = cleanTitle(title);
  const candidates = [];

  if (year) {
    candidates.push({ title, year, label: 'title+year' });
  }
  candidates.push({ title, year: '', label: 'title' });
  if (cleaned && normalizeTitle(cleaned) !== normalizeTitle(title)) {
    if (year) {
      candidates.push({ title: cleaned, year, label: 'cleaned+year' });
    }
    candidates.push({ title: cleaned, year: '', label: 'cleaned' });
  }

  for (const candidate of candidates) {
    const payload = await fetchOmdbTitle({
      apiKey,
      title: candidate.title,
      year: candidate.year,
    });

    attempts.push({
      strategy: candidate.label,
      title: candidate.title,
      year: candidate.year || null,
      response: payload?.Response || null,
      error: payload?.Error || null,
    });

    if (payload?.Response !== 'False') {
      return {
        ...payload,
        success: true,
        attempted: attempts,
      };
    }
  }

  return {
    success: false,
    rating: null,
    message: 'Movie not found in OMDb',
    attempted: attempts,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const movieId = String(req.query.movieId || '').trim();
  const title = String(req.query.title || '').trim();
  const year = String(req.query.year || '').trim();
  const forceRefresh = String(req.query.force || '').trim().toLowerCase() === 'true';
  const apiKey = process.env.OMDB_API_KEY || process.env.NEXT_PUBLIC_OMDB_API_KEY;

  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'OMDb API key is not configured. Set OMDB_API_KEY.' });
  }

  try {
    if (movieId && !forceRefresh && supabase) {
      const { data: cachedMovie, error: cacheError } = await supabase
        .from('ott_movies')
        .select('OMTB_Details,omtb_details')
        .eq('id', movieId)
        .maybeSingle();

      const cachedPayload = cachedMovie?.OMTB_Details || cachedMovie?.omtb_details;
      if (!cacheError && cachedPayload) {
        return res.status(200).json(cachedPayload);
      }
    }

    const cacheKey = buildCacheKey(title, year);
    if (!forceRefresh) {
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return res.status(200).json(cachedResponse);
      }
    }

    if (!forceRefresh && omdbInFlightRequests.has(cacheKey)) {
      const sharedResponse = await omdbInFlightRequests.get(cacheKey);
      return res.status(200).json(sharedResponse);
    }

    const requestPromise = fetchOmdbWithFallback({ apiKey, title, year });
    if (!forceRefresh) {
      omdbInFlightRequests.set(cacheKey, requestPromise);
    }

    const payload = await requestPromise;

    if (!forceRefresh) {
      setCachedResponse(cacheKey, payload);
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: `Unable to fetch OMDb data. ${error?.message || ''}`.trim(),
    });
  } finally {
    const cacheKey = buildCacheKey(title, year);
    if (omdbInFlightRequests.has(cacheKey)) {
      omdbInFlightRequests.delete(cacheKey);
    }
  }
}
