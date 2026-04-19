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

  const query = String(req.query.query || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter.' });
  }

  const apiKey =  process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const readAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  try {
    if (readAccessToken) {
      const payload = await new Promise((resolve, reject) => {
        const request = https.request('https://api.themoviedb.org/4/search/movie', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${readAccessToken}`,
            'Content-Type': 'application/json;charset=utf-8',
          },
        }, (response) => {
          let body = '';
          response.on('data', (chunk) => { body += chunk; });
          response.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (response.statusCode >= 200 && response.statusCode < 300) {
                resolve(data);
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
        request.write(JSON.stringify({ query, page: 1, include_adult: false, language: 'en-US' }));
        request.end();
      });
      return res.status(200).json(payload);
    }

    if (!apiKey) {
      return res.status(500).json({ error: 'TMDb API key or read access token is not configured.' });
    }

    const url = `https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}&language=en-US&region=IN&page=1&include_adult=false`;
    const payload = await fetchJsonFromUrl(url);
    return res.status(200).json(payload);
  } catch (error) {
    return res.status(500).json({ error: `Unable to fetch TMDb data. ${error?.message || ''}` });
  }
}
