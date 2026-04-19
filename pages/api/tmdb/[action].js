export default async function handler(req, res) {
  const { action } = req.query;
  const apiKey =  process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: 'TMDb API key is not configured. Set TMDB_API_KEY.' });
  }

  let url;
  if (action === 'search') {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }

    url = `https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&language=en-US&region=IN&page=1&include_adult=false`;
  } else if (action === 'latest') {
    const page = String(req.query.page || '1');
    url = `https://api.themoviedb.org/3/discover/movie?api_key=${encodeURIComponent(apiKey)}&language=te-IN&region=IN&sort_by=primary_release_date.desc&with_original_language=te&page=${encodeURIComponent(page)}`;
  } else if (action === 'details') {
    const movieId = String(req.query.id || '').trim();
    if (!movieId) {
      return res.status(400).json({ error: 'Missing id parameter.' });
    }

    url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(movieId)}?api_key=${encodeURIComponent(apiKey)}&language=en-US`;
  } else {
    return res.status(404).json({ error: 'Unknown TMDb action.' });
  }

  try {
    const tmdbResponse = await fetch(url);
    const payload = await tmdbResponse.json();
    return res.status(tmdbResponse.ok ? 200 : tmdbResponse.status).json(payload);
  } catch (error) {
    return res.status(500).json({ error: 'Unable to fetch TMDb data.' });
  }
}
