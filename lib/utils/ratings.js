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

export function getPreferredMovieRating(movie) {
  const omdbRating = getOmdbRatingValue(movie);
  if (omdbRating !== null) {
    return omdbRating;
  }

  return toFiniteNumber(movie?.rating);
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
