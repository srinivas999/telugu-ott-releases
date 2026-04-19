export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =  process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const readToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (!apiKey && !readToken) {
    return res.status(500).json({ error: 'TMDb API key is not configured.' });
  }

  const url = `https://api.themoviedb.org/3/discover/movie?language=te-IN&region=IN&sort_by=primary_release_date.desc&with_original_language=te&page=1`;
  const headers = {};
  if (readToken) {
    headers.Authorization = `Bearer ${readToken}`;
  }

  const response = await fetch(`${url}${!readToken ? `&api_key=${encodeURIComponent(apiKey)}` : ''}`, {
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return res.status(response.status).json({ error: `TMDb request failed (${response.status}): ${errorBody}` });
  }

  const data = await response.json();
  return res.status(200).json(data);
}
