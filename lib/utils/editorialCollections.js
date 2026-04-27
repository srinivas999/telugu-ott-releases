import { TMDB_GENRE_MAP } from './schema';
import { getOmdbDetails, getOmdbRatingValue } from './ratings';

export const OTT_EDITORIAL_COLLECTIONS = [
  {
    slug: 'crime-thrillers',
    shortLabel: 'Crime Thrillers',
    accentColor: '#dc2626',
    accentSoft: 'rgba(220, 38, 38, 0.14)',
    glowColor: 'rgba(220, 38, 38, 0.18)',
    title: 'Telugu Crime Thriller Movies on OTT',
    description:
      'Browse Telugu crime thriller movies streaming on OTT, sorted by IMDb rating and updated from the Telugu OTT Releases database.',
    intro:
      'Explore Telugu crime thriller movies with investigations, suspense, twists, and darker storytelling, ranked by IMDb rating.',
    sectionHeading: 'Best Telugu crime thrillers to stream now',
    sectionText:
      'This collection focuses on Telugu OTT movies tagged with crime and thriller genres, then ranks them using IMDb rating from OMDb details.',
    emptyMessage: 'No IMDb-rated Telugu crime thrillers are available in the OTT database right now.',
    matchType: 'all',
    genres: ['crime', 'thriller'],
  },
  {
    slug: 'love-stories',
    shortLabel: 'Love Stories',
    accentColor: '#db2777',
    accentSoft: 'rgba(219, 39, 119, 0.14)',
    glowColor: 'rgba(219, 39, 119, 0.18)',
    title: 'Telugu Love Story Movies on OTT',
    description:
      'Browse Telugu love story movies on OTT, ranked by IMDb rating and filtered from the Telugu OTT movie database.',
    intro:
      'Find Telugu love story movies with romance, emotion, and relationship drama, ordered by IMDb rating.',
    sectionHeading: 'Top Telugu love stories on OTT',
    sectionText:
      'These romantic Telugu OTT movies are grouped from the Supabase movie database and refreshed as your movie entries change.',
    emptyMessage: 'No IMDb-rated Telugu love story movies are available in the OTT database right now.',
    matchType: 'all',
    genres: ['romance', 'drama'],
    fallbackMatchType: 'any',
    fallbackGenres: ['romance'],
  },
  {
    slug: 'horror-movies',
    shortLabel: 'Horror',
    accentColor: '#7c3aed',
    accentSoft: 'rgba(124, 58, 237, 0.14)',
    glowColor: 'rgba(124, 58, 237, 0.18)',
    title: 'Telugu Horror Movies on OTT',
    description:
      'Discover Telugu horror movies on OTT, filtered from the database and ranked by IMDb rating.',
    intro:
      'Discover Telugu horror movies filled with fear, supernatural tension, and suspense, ranked by IMDb rating.',
    sectionHeading: 'Top Telugu horror movies to watch on OTT',
    sectionText:
      'This page tracks horror-focused Telugu OTT movies from the database and updates automatically as new rated titles are added.',
    emptyMessage: 'No IMDb-rated Telugu horror movies are available in the OTT database right now.',
    matchType: 'any',
    genres: ['horror'],
  },
  {
    slug: 'action-movies',
    shortLabel: 'Action',
    accentColor: '#ea580c',
    accentSoft: 'rgba(234, 88, 12, 0.14)',
    glowColor: 'rgba(234, 88, 12, 0.18)',
    title: 'Telugu Action Movies on OTT',
    description:
      'Explore Telugu action movies on OTT, ranked by IMDb rating from the Telugu OTT movie database.',
    intro:
      'Watch Telugu action movies with fights, chases, mass moments, and high-energy set pieces, sorted by IMDb rating.',
    sectionHeading: 'Best Telugu action movies on OTT',
    sectionText:
      'This action collection uses only OTT movie entries from your database and ranks them with IMDb-first rating logic.',
    emptyMessage: 'No IMDb-rated Telugu action movies are available in the OTT database right now.',
    matchType: 'any',
    genres: ['action', 'adventure'],
  },
  {
    slug: 'comedy-movies',
    shortLabel: 'Comedy',
    accentColor: '#ca8a04',
    accentSoft: 'rgba(202, 138, 4, 0.16)',
    glowColor: 'rgba(202, 138, 4, 0.20)',
    title: 'Telugu Comedy Movies on OTT',
    description:
      'Browse Telugu comedy movies on OTT and discover the highest-rated fun entertainers in the database.',
    intro:
      'Enjoy Telugu comedy movies with humor, light-hearted storytelling, and crowd-pleasing entertainment, ranked by IMDb rating.',
    sectionHeading: 'Best Telugu comedy movies to stream now',
    sectionText:
      'This comedy list is built from OTT movie records in Supabase and updates automatically when rated comedy titles change.',
    emptyMessage: 'No IMDb-rated Telugu comedy movies are available in the OTT database right now.',
    matchType: 'any',
    genres: ['comedy'],
  },
  {
    slug: 'family-dramas',
    shortLabel: 'Family Dramas',
    accentColor: '#0f766e',
    accentSoft: 'rgba(15, 118, 110, 0.14)',
    glowColor: 'rgba(15, 118, 110, 0.18)',
    title: 'Telugu Family Drama Movies on OTT',
    description:
      'See Telugu family drama movies streaming on OTT, ranked by IMDb rating and pulled from the Telugu OTT database.',
    intro:
      'Watch Telugu family drama movies built around relationships, emotions, home conflicts, and heartfelt storytelling.',
    sectionHeading: 'Best Telugu family dramas on OTT',
    sectionText:
      'This family drama page groups emotionally driven Telugu OTT movies from your database and keeps the list current as movie data changes.',
    emptyMessage: 'No IMDb-rated Telugu family drama movies are available in the OTT database right now.',
    matchType: 'all',
    genres: ['family', 'drama'],
    fallbackMatchType: 'any',
    fallbackGenres: ['family', 'drama'],
  },
];

function normalizeGenreName(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function getMovieCategory(movie) {
  return String(movie?.category || '')
    .trim()
    .toLowerCase();
}

export function isOttMovieEntry(movie) {
  const category = getMovieCategory(movie);

  if (!category) {
    return true;
  }

  return !category.includes('series') && !category.includes('tv');
}

export function getMovieGenreNames(movie) {
  const genreNames = new Set();

  if (Array.isArray(movie?.genre_ids)) {
    movie.genre_ids.forEach((genreId) => {
      const name = TMDB_GENRE_MAP[genreId];
      if (name) {
        genreNames.add(normalizeGenreName(name));
      }
    });
  }

  if (Array.isArray(movie?.genres)) {
    movie.genres.forEach((genre) => {
      const value = typeof genre === 'string' ? genre : genre?.name;
      if (value) {
        genreNames.add(normalizeGenreName(value));
      }
    });
  } else if (typeof movie?.genres === 'string') {
    movie.genres
      .split(',')
      .map((genre) => normalizeGenreName(genre))
      .filter(Boolean)
      .forEach((genre) => genreNames.add(genre));
  }

  const omdbDetails = getOmdbDetails(movie);
  if (typeof omdbDetails?.Genre === 'string') {
    omdbDetails.Genre
      .split(',')
      .map((genre) => normalizeGenreName(genre))
      .filter(Boolean)
      .forEach((genre) => genreNames.add(genre));
  }

  return [...genreNames];
}

function hasGenreMatch(movieGenres, genres, matchType = 'any') {
  if (!Array.isArray(genres) || genres.length === 0) {
    return false;
  }

  if (matchType === 'all') {
    return genres.every((genre) => movieGenres.includes(normalizeGenreName(genre)));
  }

  return genres.some((genre) => movieGenres.includes(normalizeGenreName(genre)));
}

function sortMoviesByImdbRating(movies) {
  return [...movies].sort((firstMovie, secondMovie) => {
    const firstRating = getOmdbRatingValue(firstMovie) || 0;
    const secondRating = getOmdbRatingValue(secondMovie) || 0;

    if (secondRating !== firstRating) {
      return secondRating - firstRating;
    }

    const firstTime = new Date(`${firstMovie.digital_release_date || firstMovie.release_date || ''}T00:00:00`).getTime();
    const secondTime = new Date(`${secondMovie.digital_release_date || secondMovie.release_date || ''}T00:00:00`).getTime();

    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
      return 0;
    }

    return secondTime - firstTime;
  });
}

export function getCollectionDefinition(slug) {
  return OTT_EDITORIAL_COLLECTIONS.find((collection) => collection.slug === slug) || null;
}

export function getCollectionMovies(movies, slug, limit = 10) {
  const collection = getCollectionDefinition(slug);
  if (!collection) {
    return [];
  }

  const filteredMovies = (movies || []).filter((movie) => {
    if (!isOttMovieEntry(movie)) {
      return false;
    }

    if (getOmdbRatingValue(movie) === null) {
      return false;
    }

    const movieGenres = getMovieGenreNames(movie);
    if (hasGenreMatch(movieGenres, collection.genres, collection.matchType)) {
      return true;
    }

    if (collection.fallbackGenres) {
      return hasGenreMatch(movieGenres, collection.fallbackGenres, collection.fallbackMatchType || 'any');
    }

    return false;
  });

  const sortedMovies = sortMoviesByImdbRating(filteredMovies);

  if (typeof limit === 'number') {
    return sortedMovies.slice(0, limit);
  }

  return sortedMovies;
}

export function getAvailableEditorialCollections(movies, limitPerCollection = 10) {
  return OTT_EDITORIAL_COLLECTIONS
    .map((collection) => {
      const allItems = getCollectionMovies(movies, collection.slug, null);
      const items = typeof limitPerCollection === 'number'
        ? allItems.slice(0, limitPerCollection)
        : allItems;

      return {
        ...collection,
        href: `/best-telugu-ott-movies/${collection.slug}`,
        movies: items,
        movieCount: allItems.length,
        topRating: allItems.length > 0 ? getOmdbRatingValue(allItems[0]) : null,
      };
    })
    .filter((collection) => collection.movieCount > 0)
    .sort((firstCollection, secondCollection) => {
      if (secondCollection.movieCount !== firstCollection.movieCount) {
        return secondCollection.movieCount - firstCollection.movieCount;
      }

      return (secondCollection.topRating || 0) - (firstCollection.topRating || 0);
    });
}
