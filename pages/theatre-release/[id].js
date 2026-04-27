import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Breadcrumb from '../../components/common/Breadcrumb';
import ContinueBrowsing from '../../components/common/ContinueBrowsing';
import { formatCompactVoteCount } from '../../lib/utils/ratings';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const TMDB_PROFILE_BASE = 'https://image.tmdb.org/t/p/w185';
const YOUTUBE_SEARCH_URL_BASE = 'https://www.youtube.com/results?search_query=';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60;
const FALLBACK_POSTER = '/images/default_poster.png';

const TMDB_GENRES = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

function formatReleaseDate(date) {
  if (!date) return 'TBA';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatRuntime(minutes) {
  if (!minutes || typeof minutes !== 'number') return 'Runtime N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

function getMovieGenres(genreIds) {
  if (!Array.isArray(genreIds) || genreIds.length === 0) {
    return 'Genre N/A';
  }

  const names = genreIds
    .map((genreId) => TMDB_GENRES[genreId])
    .filter(Boolean)
    .slice(0, 2);

  return names.length > 0 ? names.join(', ') : 'Genre N/A';
}

function isFutureReleaseDate(value) {
  if (!value) return false;

  const today = new Date();
  const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const releaseDate = new Date(value);

  if (Number.isNaN(releaseDate.getTime())) {
    return false;
  }

  return releaseDate.getTime() > todayKey;
}

function getTheatreBadge(movie) {
  if (isFutureReleaseDate(movie?.release_date)) return 'Coming Soon';
  if ((movie?.popularity || 0) >= 25) return 'Popular This Week';
  if ((movie?.vote_average || 0) >= 7.5) return 'Critics Pick';
  return 'Now Showing';
}

function toPosterUrl(movie) {
  if (!movie?.poster_path) return FALLBACK_POSTER;
  if (String(movie.poster_path).startsWith('http')) return movie.poster_path;
  return `${TMDB_POSTER_BASE}${movie.poster_path}`;
}

function toBackdropUrl(movie) {
  const path = movie?.backdrop_path || movie?.poster_path;
  if (!path) return FALLBACK_POSTER;
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

function toProfileUrl(person) {
  const profilePath = person?.profile_path;
  if (!profilePath) return null;
  if (String(profilePath).startsWith('http')) return profilePath;
  return `${TMDB_PROFILE_BASE}${profilePath}`;
}

function getGenreNames(movie) {
  if (Array.isArray(movie?.genres) && movie.genres.length > 0) {
    return movie.genres
      .map((genre) => genre?.name)
      .filter(Boolean)
      .join(', ');
  }

  return getMovieGenres(movie?.genre_ids);
}

function getTrailerSearchUrl(movie) {
  const title = movie?.title || movie?.original_title || 'Movie';
  return `${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${title} trailer`)}`;
}

function getTopCast(movie) {
  if (!Array.isArray(movie?.credits?.cast)) {
    return [];
  }

  return movie.credits.cast.slice(0, 6);
}

function getTopCrew(movie) {
  if (!Array.isArray(movie?.credits?.crew)) {
    return [];
  }

  const priorityJobs = ['Director', 'Writer', 'Screenplay', 'Producer', 'Original Music Composer'];
  const matched = priorityJobs
    .map((job) => movie.credits.crew.find((member) => member?.job === job))
    .filter(Boolean);

  return [...new Map(matched.map((member) => [`${member.name}-${member.job}`, member])).values()];
}

export default function MovieDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const hasFetchedMoviesRef = useRef(false);

  useEffect(() => {
    if (!id) return;

    async function loadMovie() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/tmdb/details?id=${encodeURIComponent(id)}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Unable to load movie details (${response.status}). ${text}`);
        }

        const data = await response.json();
        setMovie(data);
      } catch (fetchError) {
        console.error('Movie details fetch error:', fetchError);
        setError(fetchError.message || 'Unable to load movie details.');
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  useEffect(() => {
    async function loadMovies() {
      if (hasFetchedMoviesRef.current) return;
      hasFetchedMoviesRef.current = true;

      setMoviesLoading(true);

      try {
        if (typeof window !== 'undefined') {
          const cacheRaw = window.localStorage.getItem(CACHE_KEY);
          if (cacheRaw) {
            const cache = JSON.parse(cacheRaw);
            const isFresh = cache.timestamp && Date.now() - cache.timestamp < CACHE_TTL;

            if (isFresh && Array.isArray(cache.movies)) {
              setMovies(cache.movies);
              setMoviesLoading(false);
              return;
            }
          }
        }

        const response = await fetch('/api/tmdb/latest');
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Unable to fetch theatre release movies (${response.status}). ${body}`);
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        setMovies(results);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              movies: results,
              timestamp: Date.now(),
            }),
          );
        }
      } catch (fetchError) {
        console.error('Theatre release fetch error:', fetchError);
      } finally {
        setMoviesLoading(false);
      }
    }

    loadMovies();
  }, []);

  const relatedMovies = useMemo(() => {
    if (!movie || movies.length === 0) return [];
    return movies
      .filter((item) => String(item.id) !== String(movie.id))
      .slice(0, 12);
  }, [movie, movies]);

  const castMembers = useMemo(() => getTopCast(movie), [movie]);
  const crewMembers = useMemo(() => getTopCrew(movie), [movie]);
  const movieTitle = movie?.title || movie?.original_title || 'Movie Details';
  const movieOverview = movie?.overview || 'No overview available.';
  const genreText = getGenreNames(movie);
  const releaseLabel = formatReleaseDate(movie?.release_date);
  const ratingLabel = movie?.vote_average ? `${movie.vote_average.toFixed(1)}/10` : 'NR';
  const voteCountLabel = formatCompactVoteCount(movie?.vote_count) || 'Audience building';
  const trailerUrl = getTrailerSearchUrl(movie);
  const heroBadge = getTheatreBadge(movie);

  const retentionItems = [
    {
      href: '/theatre-release',
      eyebrow: 'Theatre Feed',
      title: 'Back to all theatre releases',
      description: 'Return to the full Telugu theatre browse page and keep scanning new arrivals.',
      cta: 'Open Releases',
    },
    {
      href: '/telugu-ott-releases-this-week',
      eyebrow: 'Weekly Calendar',
      title: 'Shift from theatres into this week OTT drops',
      description: 'Move from big-screen release tracking into the current Telugu streaming schedule.',
      cta: 'See This Week',
    },
    {
      href: '/top-rated-telugu-ott-movies',
      eyebrow: 'Top Rated',
      title: 'Jump into the highest-rated OTT titles',
      description: 'If this theatre title caught your eye, the ratings-first OTT list is a strong next stop.',
      cta: 'View Top Picks',
    },
    {
      href: '/web-series',
      eyebrow: 'Series Mode',
      title: 'Continue with Telugu web series',
      description: 'Keep the session going by switching formats instead of ending the browse journey here.',
      cta: 'Browse Series',
    },
  ];

  return (
    <Layout>
      <Seo
        title={movieTitle}
        description={movie?.overview || 'Movie details and trailer links.'}
        url={id ? `/theatre-release/${id}` : '/theatre-release'}
        keywords="Telugu theatre movie details, movie details"
        image={movie?.poster_path ? toPosterUrl(movie) : undefined}
      />

      <main className="netflix-home theatre-detail-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'Theatre Releases', url: '/theatre-release' },
              { name: movieTitle },
            ]}
          />
        </div>

        {loading ? (
          <section className="nf-content theatre-detail-page__status-wrap">
            <p className="nf-status">Loading movie details...</p>
          </section>
        ) : error ? (
          <section className="nf-content theatre-detail-page__status-wrap">
            <p className="nf-status nf-status--error">{error}</p>
          </section>
        ) : movie ? (
          <>
            <section className="nf-hero theatre-detail-hero">
              <div className="nf-hero__bg">
                <Image
                  src={toBackdropUrl(movie)}
                  alt={movieTitle}
                  fill
                  priority
                  sizes="100vw"
                  className="nf-hero__bg-image"
                />
              </div>
              <div className="nf-hero__overlay theatre-detail-hero__overlay" />

              <div className="nf-hero__content theatre-detail-hero__content">
                <p className="nf-hero__kicker">Theatre Release</p>
                <h1>{movieTitle}</h1>
                {movie.tagline ? <p className="theatre-detail-hero__tagline">{movie.tagline}</p> : null}
                <p className="nf-hero__desc">{movieOverview}</p>

                <div className="nf-hero__meta">
                  <span>{heroBadge}</span>
                  <span>{releaseLabel}</span>
                  <span>{formatRuntime(movie.runtime)}</span>
                  <span>{ratingLabel}</span>
                  <span>{voteCountLabel}</span>
                </div>

                <div className="theatre-detail-hero__genres">
                  {genreText.split(', ').filter(Boolean).map((genre) => (
                    <span key={genre} className="theatre-detail-hero__genre-chip">{genre}</span>
                  ))}
                </div>

                <div className="nf-hero__actions">
                  <a href={trailerUrl} target="_blank" rel="noreferrer" className="nf-btn nf-btn--primary">
                    Watch Trailer
                  </a>
                  {movie.homepage ? (
                    <a href={movie.homepage} target="_blank" rel="noreferrer" className="nf-btn nf-btn--ghost">
                      Official Site
                    </a>
                  ) : null}
                  <Link href="/theatre-release" className="nf-btn nf-btn--ghost">
                    Back to Releases
                  </Link>
                </div>
              </div>

              <div className="theatre-detail-hero__poster">
                <div className="theatre-detail-hero__poster-frame">
                  <Image
                    src={toPosterUrl(movie)}
                    alt={`${movieTitle} poster`}
                    fill
                    sizes="(max-width: 980px) 240px, 300px"
                    className="theatre-detail-hero__poster-image"
                  />
                </div>
              </div>
            </section>

            <section className="nf-content theatre-detail-page__content">
              <section className="theatre-detail-section">
                <div className="theatre-detail-section__header">
                  <p className="theatre-detail-section__eyebrow">Movie Snapshot</p>
                  <h2 className="theatre-detail-section__title">Quick Facts</h2>
                </div>
                <div className="theatre-detail-facts">
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">Release Date</span>
                    <strong className="theatre-detail-facts__value">{releaseLabel}</strong>
                  </article>
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">Runtime</span>
                    <strong className="theatre-detail-facts__value">{formatRuntime(movie.runtime)}</strong>
                  </article>
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">TMDb Rating</span>
                    <strong className="theatre-detail-facts__value">{ratingLabel}</strong>
                  </article>
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">Votes</span>
                    <strong className="theatre-detail-facts__value">{voteCountLabel}</strong>
                  </article>
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">Status</span>
                    <strong className="theatre-detail-facts__value">{movie.status || heroBadge}</strong>
                  </article>
                  <article className="theatre-detail-facts__card">
                    <span className="theatre-detail-facts__label">Genres</span>
                    <strong className="theatre-detail-facts__value">{genreText}</strong>
                  </article>
                </div>
              </section>

              <section className="theatre-detail-section">
                <div className="theatre-detail-section__header">
                  <p className="theatre-detail-section__eyebrow">Story</p>
                  <h2 className="theatre-detail-section__title">Overview</h2>
                </div>
                <div className="theatre-detail-prose">
                  <p>{movieOverview}</p>
                </div>
              </section>

              {castMembers.length > 0 ? (
                <section className="theatre-detail-section">
                  <div className="theatre-detail-section__header">
                    <p className="theatre-detail-section__eyebrow">Talent</p>
                    <h2 className="theatre-detail-section__title">Top Cast</h2>
                  </div>
                  <div className="theatre-detail-people-grid">
                    {castMembers.map((member, index) => (
                      <article key={`${member.id || member.name}-${index}`} className="theatre-detail-person-card">
                        {toProfileUrl(member) ? (
                          <div className="theatre-detail-person-card__image-wrap">
                            <Image
                              src={toProfileUrl(member)}
                              alt={member.name || 'Cast member'}
                              width={88}
                              height={88}
                              className="theatre-detail-person-card__image"
                            />
                          </div>
                        ) : null}
                        <h3>{member.name}</h3>
                        {member.character ? <p>{member.character}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {crewMembers.length > 0 ? (
                <section className="theatre-detail-section">
                  <div className="theatre-detail-section__header">
                    <p className="theatre-detail-section__eyebrow">Craft</p>
                    <h2 className="theatre-detail-section__title">Core Crew</h2>
                  </div>
                  <div className="theatre-detail-people-grid">
                    {crewMembers.map((member, index) => (
                      <article key={`${member.name}-${member.job}-${index}`} className="theatre-detail-person-card">
                        <h3>{member.name}</h3>
                        <p>{member.job}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="nf-rail theatre-detail-page__rail">
                <div className="nf-rail__header">
                  <h2>{moviesLoading ? 'Loading Related Titles' : 'More Theatre Releases'}</h2>
                  <Link href="/theatre-release" className="nf-rail__view-all">View All</Link>
                </div>

                {moviesLoading ? (
                  <p className="nf-status">Loading theatre titles...</p>
                ) : relatedMovies.length === 0 ? (
                  <p className="nf-status">More theatre titles are not available right now.</p>
                ) : (
                  <div className="nf-rail__track">
                    {relatedMovies.map((carouselMovie) => (
                      <Link key={carouselMovie.id} href={`/theatre-release/${carouselMovie.id}`} className="nf-card">
                        <div className="nf-card__poster">
                          <Image
                            src={toPosterUrl(carouselMovie)}
                            alt={carouselMovie.title || carouselMovie.original_title || 'Movie poster'}
                            fill
                            sizes="(max-width: 640px) 44vw, 180px"
                            className="nf-card__image"
                          />
                          <span className="nf-card__badge">{getTheatreBadge(carouselMovie)}</span>
                          <span className="nf-card__rating">
                            {carouselMovie.vote_average ? carouselMovie.vote_average.toFixed(1) : 'NR'}
                          </span>
                          <div className="nf-card__overlay">
                            <span className="nf-card__overlay-cta">View Details</span>
                          </div>
                        </div>
                        <div className="nf-card__meta">
                          <h3>{carouselMovie.title || carouselMovie.original_title || 'Untitled'}</h3>
                          <p>{getMovieGenres(carouselMovie.genre_ids)} - {formatReleaseDate(carouselMovie.release_date)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>

              <ContinueBrowsing
                title="Keep Browsing"
                description="A detail page should keep the discovery loop moving."
                items={retentionItems}
              />
            </section>
          </>
        ) : (
          <section className="nf-content theatre-detail-page__status-wrap">
            <p className="nf-status">Movie details are unavailable.</p>
          </section>
        )}
      </main>
    </Layout>
  );
}
