import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const movieId = String(req.query.movieId || '').trim();
  const title = String(req.query.title || '').trim();
  const year = String(req.query.year || '').trim();
  const forceRefresh = String(req.query.force || '').trim().toLowerCase() === 'true';
  const apiKey = process.env.OMDB_API_KEY;

  if (!title) {
    return res.status(400).json({ error: 'Missing title parameter.' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'OMDb API key is not configured.' });
  }

  try {
    if (movieId && !forceRefresh && supabase) {
      const { data: cachedMovie, error: cacheError } = await supabase
        .from('ott_movies')
        .select('OMTB_Details')
        .eq('id', movieId)
        .maybeSingle();

      if (!cacheError && cachedMovie?.OMTB_Details) {
        return res.status(200).json(cachedMovie.OMTB_Details);
      }
    }

    const yearParam = year ? `&y=${encodeURIComponent(year)}` : '';
    const omdbUrl = `https://www.omdbapi.com/?apikey=${encodeURIComponent(apiKey)}&t=${encodeURIComponent(title)}${yearParam}`;
    const response = await fetch(omdbUrl);
    const payload = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Unable to fetch OMDb data.',
        details: payload,
      });
    }

    if (payload?.Response === 'False') {
      return res.status(404).json({
        error: payload?.Error || 'Movie not found.',
        data: payload,
      });
    }

    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({
      error: `Unable to fetch OMDb data. ${error?.message || ''}`.trim(),
    });
  }
}
