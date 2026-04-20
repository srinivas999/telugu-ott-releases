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

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDb API key is not configured. Set NEXT_PUBLIC_TMDB_API_KEY.' });
  }

  const page = String(req.query.page || '1');
  const url = `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&language=te-IN&sort_by=first_air_date.desc&with_original_language=te&page=${page}`;

  try {
    const data = await fetchJsonFromUrl(url);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
