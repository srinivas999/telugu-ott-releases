import https from 'https';

function fetchJsonFromUrl(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const payload = JSON.parse(body);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(payload);
          } else {
            reject(new Error(`TMDb returned ${response.statusCode}: ${body}`));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('TMDb request timed out'));
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey =  process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDb API key is not configured. Set TMDB_API_KEY.' });
  }

  const page = String(req.query.page || '1');
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${encodeURIComponent(apiKey)}&language=te-IN&region=IN&sort_by=primary_release_date.desc&with_original_language=te&page=${encodeURIComponent(page)}`;

  try {
    const payload = await fetchJsonFromUrl(url);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: `Unable to fetch TMDb data. ${error?.message || ''}` });
  }
}
