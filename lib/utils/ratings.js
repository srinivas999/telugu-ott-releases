import { getTmdbDetails } from './tmdb';

function toFiniteNumber(value) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getOmdbDetails(movie) {
  const details = movie?.OMTB_Details ?? movie?.omtb_details ?? null;

  if (!details) {
    return null;
  }

  if (typeof details === 'string') {
    try {
      return JSON.parse(details);
    } catch {
      return null;
    }
  }

  if (typeof details === 'object') {
    return details;
  }

  return null;
}

export function getOmdbRatingValue(movie) {
  const omdbDetails = getOmdbDetails(movie);
  const imdbRating = omdbDetails?.imdbRating;

  if (!imdbRating || imdbRating === 'N/A') {
    return null;
  }

  return toFiniteNumber(imdbRating);
}

export function getTmdbVoteCountValue(movie) {
  const tmdbDetails = getTmdbDetails(movie);
  const voteCount = toFiniteNumber(movie?.vote_count ?? tmdbDetails?.vote_count);

  if (voteCount === null || voteCount <= 0) {
    return null;
  }

  return voteCount;
}

export function formatCompactVoteCount(value) {
  const voteCount = toFiniteNumber(value);

  if (voteCount === null || voteCount <= 0) {
    return null;
  }

  if (voteCount >= 1000000) {
    return `${(voteCount / 1000000).toFixed(voteCount >= 10000000 ? 0 : 1)}M votes`;
  }

  if (voteCount >= 1000) {
    return `${(voteCount / 1000).toFixed(voteCount >= 10000 ? 0 : 1)}K votes`;
  }

  return `${voteCount} votes`;
}

export function getTmdbRatingValue(movie) {
  const tmdbDetails = getTmdbDetails(movie);
  const voteCount = getTmdbVoteCountValue(movie);

  if (voteCount === null || voteCount <= 50) {
    return null;
  }

  const tmdbRating = toFiniteNumber(
    movie?.vote_average ??
    tmdbDetails?.vote_average ??
    movie?.rating
  );

  return tmdbRating;
}

export function getPreferredMovieRating(movie) {
  const omdbRating = getOmdbRatingValue(movie);
  if (omdbRating !== null) {
    return omdbRating;
  }

  return getTmdbRatingValue(movie);
}

export function withPreferredMovieRating(movie) {
  if (!movie) {
    return movie;
  }

  return {
    ...movie,
    rating: getPreferredMovieRating(movie),
  };
}
