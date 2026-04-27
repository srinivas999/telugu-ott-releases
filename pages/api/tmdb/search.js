import https from 'https';

function fetchJsonFromUrl(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const payload = JSON.parse(body);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(payload);
          } else if (response.statusCode === 404) {
            resolve({ results: [], statusCode: 404, statusMessage: payload?.status_message || 'Not found' });
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

function normalizeTitle(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title) {
  const strippedTitle = String(title || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!strippedTitle) {
    return '';
  }

  const words = strippedTitle.split(' ').filter(Boolean);
  if (words.length <= 1) {
    return strippedTitle;
  }

  const [firstWord, ...remainingWords] = words;
  if (/^(a|an|the)$/i.test(firstWord)) {
    return `${firstWord} ${remainingWords.join('')}`.trim();
  }

  return words.join('');
}

function getResultTitle(result) {
  return result?.title || result?.original_title || result?.name || result?.original_name || '';
}

function getResultYear(result, mediaType) {
  const dateValue = mediaType === 'tv'
    ? result?.first_air_date || result?.release_date
    : result?.release_date || result?.first_air_date;

  return String(dateValue || '').slice(0, 4);
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function buildSearchCandidates({ query, year }) {
  const cleanedTitle = cleanTitle(query);
  const candidates = [
    { label: 'cleaned', query: cleanedTitle },
  ];

  if (year && cleanedTitle) {
    candidates.push({ label: 'year', query: `${cleanedTitle} ${year}` });
  }

  return uniqueValues(candidates.map((candidate) => candidate.query)).map((candidateQuery) => ({
    query: candidateQuery,
    label: candidateQuery === cleanedTitle ? 'cleaned' : 'year',
  }));
}

function scoreResult(result, referenceTitle, year, mediaType) {
  const normalizedReference = normalizeTitle(referenceTitle);
  const normalizedCandidate = normalizeTitle(getResultTitle(result));
  let score = 0;

  if (!normalizedCandidate) {
    return -1;
  }

  if (normalizedCandidate === normalizedReference) {
    score += 1000;
  } else if (
    normalizedCandidate.includes(normalizedReference) ||
    normalizedReference.includes(normalizedCandidate)
  ) {
    score += 700;
  }

  const referenceWords = normalizedReference.split(' ').filter(Boolean);
  const candidateWords = normalizedCandidate.split(' ').filter(Boolean);
  const overlappingWords = referenceWords.filter((word) => candidateWords.includes(word)).length;
  score += overlappingWords * 50;

  if (typeof result.popularity === 'number') {
    score += Math.min(result.popularity, 100);
  }

  if (typeof result.vote_average === 'number') {
    score += result.vote_average * 5;
  }

  if (year) {
    const resultYear = getResultYear(result, mediaType);
    if (resultYear === year) {
      score += 400;
    } else if (resultYear) {
      score -= 250;
    }
  }

  return score;
}

function rankResults(results, referenceTitle, mediaType, year) {
  return [...results]
    .filter((result) => !result.media_type || result.media_type === mediaType)
    .map((result) => ({
      ...result,
      _score: scoreResult(result, referenceTitle, year, mediaType),
    }))
    .sort((first, second) => second._score - first._score);
}

function buildTmdbUrl({ mediaType, query, year }) {
  const baseUrl = `https://api.themoviedb.org/3/search/${mediaType}?query=${encodeURIComponent(query)}&language=en-US&region=IN&page=1&include_adult=false`;
  if (mediaType === 'movie' && year) {
    return `${baseUrl}&year=${encodeURIComponent(year)}`;
  }
  if (mediaType === 'tv' && year) {
    return `${baseUrl}&first_air_date_year=${encodeURIComponent(year)}`;
  }
  return baseUrl;
}

function getTmdbCredentials() {
  return {
    apiKey: process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY,
    readAccessToken: process.env.TMDB_API_READ_ACCESS_TOKEN,
  };
}

function parseTmdbError(error) {
  const message = String(error?.message || '');
  const match = message.match(/TMDb returned (\d{3}):\s*([\s\S]*)$/i);
  if (!match) {
    return null;
  }

  const status = Number(match[1]);
  let details = match[2] || '';
  try {
    details = JSON.parse(details);
  } catch {
    // Keep raw body text when TMDb response body is not valid JSON.
  }

  return { status, details };
}

function isAuthErrorStatus(status) {
  return status === 401 || status === 403;
}

async function fetchWithAuth(url, { apiKey, readAccessToken }) {
  if (readAccessToken) {
    try {
      return await fetchJsonFromUrl(url, {
        Authorization: `Bearer ${readAccessToken}`,
        'Content-Type': 'application/json;charset=utf-8',
      });
    } catch (error) {
      const tmdbError = parseTmdbError(error);
      if (!apiKey || !isAuthErrorStatus(tmdbError?.status)) {
        throw error;
      }
    }
  }

  return fetchJsonFromUrl(`${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = String(req.query.query || '').trim();
  const year = String(req.query.y || req.query.year || '').trim();
  const mediaType = String(req.query.mediaType || 'movie').trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter.' });
  }

  if (!['movie', 'tv'].includes(mediaType)) {
    return res.status(400).json({ error: 'Invalid mediaType. Use "movie" or "tv".' });
  }

  const { apiKey, readAccessToken } = getTmdbCredentials();

  if (!apiKey && !readAccessToken) {
    return res.status(500).json({
      error: 'TMDb credentials are not configured. Set TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN.',
    });
  }

  try {
    const cleanedQuery = cleanTitle(query) || query;
    const referenceTitle = cleanedQuery;
    const candidates = buildSearchCandidates({ query: cleanedQuery, year });
    const attempts = [];
    let rankedResults = [];
    let bestMatch = null;

    for (const candidate of candidates) {
      const payload = await fetchWithAuth(
        buildTmdbUrl({ mediaType, query: candidate.query, year }),
        { apiKey, readAccessToken }
      );

      const results = Array.isArray(payload?.results) ? payload.results : [];
      attempts.push({ strategy: candidate.label, query: candidate.query, count: results.length });

      rankedResults = rankResults(results, referenceTitle, mediaType, year);
      bestMatch = rankedResults[0] || null;

      if (bestMatch) {
        return res.status(200).json({
          results: rankedResults,
          bestMatch,
          attempts,
          cleanedTitle: cleanedQuery,
          message: `Match found using ${candidate.label} search.`,
        });
      }
    }

    const multiPayload = await fetchWithAuth(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(cleanedQuery)}&language=en-US&region=IN&page=1&include_adult=false`,
      { apiKey, readAccessToken }
    );
    const multiResults = Array.isArray(multiPayload?.results) ? multiPayload.results : [];
    attempts.push({ strategy: 'multi', query: cleanedQuery, count: multiResults.length });

    rankedResults = rankResults(multiResults, referenceTitle, mediaType, year);
    bestMatch = rankedResults[0] || null;

    return res.status(200).json({
      results: rankedResults,
      bestMatch,
      attempts,
      cleanedTitle: cleanedQuery,
      message: bestMatch
        ? 'Match found using multi-search fallback.'
        : 'No TMDb match found after all fallback strategies.',
    });
  } catch (error) {
    const tmdbError = parseTmdbError(error);
    if (tmdbError) {
      return res.status(tmdbError.status || 502).json({
        error: 'TMDb request failed.',
        details: tmdbError.details,
        results: [],
        bestMatch: null,
      });
    }

    return res.status(500).json({
      error: `Unable to fetch TMDb data. ${error?.message || ''}`,
      results: [],
      bestMatch: null,
    });
  }
}
