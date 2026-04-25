import https from 'https';

const TITLE_SUFFIX_PATTERNS = [
  /\(\s*telugu\s*\)/gi,
  /\(\s*tamil\s*dubbed\s*\)/gi,
  /\(\s*hindi\s*dubbed\s*\)/gi,
];

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
  const withoutSuffixes = TITLE_SUFFIX_PATTERNS.reduce(
    (currentTitle, pattern) => currentTitle.replace(pattern, ' '),
    String(title || '')
  );

  return withoutSuffixes.replace(/\s+/g, ' ').trim();
}

function getResultTitle(result) {
  return result?.title || result?.original_title || result?.name || result?.original_name || '';
}

function uniqueValues(values) {
  return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))];
}

function buildSearchCandidates({ query, originalTitle, year }) {
  const cleanedTitle = cleanTitle(query);
  const candidates = [
    { label: 'original', query: originalTitle },
    { label: 'cleaned', query: cleanedTitle },
  ];

  if (year && cleanedTitle) {
    candidates.push({ label: 'year', query: `${cleanedTitle} ${year}` });
  }

  return uniqueValues(candidates.map((candidate) => candidate.query)).map((candidateQuery) => ({
    query: candidateQuery,
    label:
      candidateQuery === String(originalTitle || '').trim()
        ? 'original'
        : candidateQuery === cleanedTitle
          ? 'cleaned'
          : 'year',
  }));
}

function scoreResult(result, referenceTitle) {
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

  return score;
}

function rankResults(results, referenceTitle, mediaType) {
  return [...results]
    .filter((result) => !result.media_type || result.media_type === mediaType)
    .map((result) => ({
      ...result,
      _score: scoreResult(result, referenceTitle),
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

async function fetchWithAuth(url, { apiKey, readAccessToken }) {
  if (readAccessToken) {
    return fetchJsonFromUrl(url, {
      Authorization: `Bearer ${readAccessToken}`,
      'Content-Type': 'application/json;charset=utf-8',
    });
  }

  return fetchJsonFromUrl(`${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(apiKey)}`);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = String(req.query.query || '').trim();
  const originalTitle = String(req.query.originalTitle || '').trim();
  const year = String(req.query.year || '').trim();
  const mediaType = String(req.query.mediaType || 'movie').trim().toLowerCase();

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter.' });
  }

  if (!['movie', 'tv'].includes(mediaType)) {
    return res.status(400).json({ error: 'Invalid mediaType. Use "movie" or "tv".' });
  }

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const readAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN;

  if (!apiKey && !readAccessToken) {
    return res.status(500).json({ error: 'TMDb API key or read access token is not configured.' });
  }

  try {
    const referenceTitle = cleanTitle(originalTitle || query) || query;
    const candidates = buildSearchCandidates({ query, originalTitle, year });
    const attempts = [];
    let rankedResults = [];
    let bestMatch = null;

    for (const candidate of candidates) {
      const payload = await fetchWithAuth(
        buildTmdbUrl({ mediaType, query: candidate.query, year: candidate.label === 'year' ? year : '' }),
        { apiKey, readAccessToken }
      );

      const results = Array.isArray(payload?.results) ? payload.results : [];
      attempts.push({ strategy: candidate.label, query: candidate.query, count: results.length });

      rankedResults = rankResults(results, referenceTitle, mediaType);
      bestMatch = rankedResults[0] || null;

      if (bestMatch) {
        return res.status(200).json({
          results: rankedResults,
          bestMatch,
          attempts,
          cleanedTitle: cleanTitle(query),
          message: `Match found using ${candidate.label} search.`,
        });
      }
    }

    const multiPayload = await fetchWithAuth(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(referenceTitle)}&language=en-US&region=IN&page=1&include_adult=false`,
      { apiKey, readAccessToken }
    );
    const multiResults = Array.isArray(multiPayload?.results) ? multiPayload.results : [];
    attempts.push({ strategy: 'multi', query: referenceTitle, count: multiResults.length });

    rankedResults = rankResults(multiResults, referenceTitle, mediaType);
    bestMatch = rankedResults[0] || null;

    return res.status(200).json({
      results: rankedResults,
      bestMatch,
      attempts,
      cleanedTitle: cleanTitle(query),
      message: bestMatch
        ? 'Match found using multi-search fallback.'
        : 'No TMDb match found after all fallback strategies.',
    });
  } catch (error) {
    return res.status(500).json({
      error: `Unable to fetch TMDb data. ${error?.message || ''}`,
      results: [],
      bestMatch: null,
    });
  }
}
