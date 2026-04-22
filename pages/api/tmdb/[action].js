export default async function handler(req, res) {
  const { action } = req.query;
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const readAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey && !readAccessToken) {
    return res.status(500).json({ error: 'TMDb API key is not configured. Set TMDB_API_KEY.' });
  }

  let url;
  if (action === 'search') {
    const query = String(req.query.query || '').trim();
    const mediaType = String(req.query.mediaType || 'movie').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }
    if (!['movie', 'tv'].includes(mediaType)) {
      return res.status(400).json({ error: 'Invalid mediaType. Use "movie" or "tv".' });
    }

    url = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(query)}&language=en-US&region=IN&page=1&include_adult=false`;
  } else if (action === 'latest') {
    const page = String(req.query.page || '1');
    url = `https://api.themoviedb.org/3/discover/movie?language=te-IN&region=IN&sort_by=primary_release_date.desc&with_original_language=te&page=${encodeURIComponent(page)}`;
  } else if (action === 'trending') {
    const page = String(req.query.page || '1');
    url = `https://api.themoviedb.org/3/discover/movie?language=te-IN&watch_region=IN&with_watch_monetization_types=flatrate&sort_by=popularity.desc&with_original_language=te&include_adult=false&page=${encodeURIComponent(page)}`;
  } else if (action === 'details') {
    const movieId = String(req.query.id || '').trim();
    const mediaType = String(req.query.mediaType || 'movie').trim().toLowerCase();
    if (!movieId) {
      return res.status(400).json({ error: 'Missing id parameter.' });
    }
    if (!['movie', 'tv'].includes(mediaType)) {
      return res.status(400).json({ error: 'Invalid mediaType. Use "movie" or "tv".' });
    }

    url = `https://api.themoviedb.org/3/${mediaType}/${encodeURIComponent(movieId)}?language=en-US&append_to_response=credits,videos,images`;
  } else {
    return res.status(404).json({ error: 'Unknown TMDb action.' });
  }

  try {
    const tmdbUrl = `${url}${readAccessToken ? '' : `${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`}`;
    const tmdbResponse = await fetch(tmdbUrl, {
      headers: readAccessToken
        ? {
            Authorization: `Bearer ${readAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          }
        : undefined,
    });
    const payload = await tmdbResponse.json();
    return res.status(tmdbResponse.ok ? 200 : tmdbResponse.status).json(payload);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch TMDb data.' });
  }
}
