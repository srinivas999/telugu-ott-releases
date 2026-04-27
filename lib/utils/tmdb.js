function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getTmdbDetails(movie) {
  const details = movie?.TMDB_Details ?? movie?.tmdb_details ?? null;

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

  if (isObject(details)) {
    return details;
  }

  return null;
}

export function withStoredTmdbDetails(movie) {
  if (!movie) {
    return movie;
  }

  const tmdbDetails = getTmdbDetails(movie);
  if (!tmdbDetails) {
    return movie;
  }

  return {
    ...tmdbDetails,
    ...movie,
    title: movie.title || movie.movie_name || tmdbDetails.title || tmdbDetails.name,
    original_title: movie.original_title || tmdbDetails.original_title || tmdbDetails.original_name,
    overview: movie.overview || movie.description || tmdbDetails.overview,
    poster_path: movie.poster_path || tmdbDetails.poster_path,
    backdrop_path: movie.backdrop_path || tmdbDetails.backdrop_path,
    genres: movie.genres || tmdbDetails.genres || [],
    genre_ids: movie.genre_ids || tmdbDetails.genre_ids || [],
    cast_data: movie.cast_data || tmdbDetails.credits?.cast || [],
    crew: movie.crew || tmdbDetails.credits?.crew || [],
    runtime: movie.runtime || tmdbDetails.runtime,
    release_date: movie.release_date || tmdbDetails.release_date || tmdbDetails.first_air_date,
    vote_average: movie.vote_average ?? tmdbDetails.vote_average,
    vote_count: movie.vote_count ?? tmdbDetails.vote_count,
    trailer_url: movie.trailer_url,
  };
}
