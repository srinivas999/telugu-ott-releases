import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const YOUTUBE_SEARCH_URL_BASE = 'https://www.youtube.com/results?search_query=';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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
    day: 'numeric',
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

export default function MovieDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const hasFetchedMoviesRef = useRef(false);
  const isGitHubDeploy =
    process.env.NEXT_PUBLIC_IS_GITHUB_DEPLOY === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname.includes('github.io'));
  const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

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

        const listUrl = isGitHubDeploy
          ? `https://api.themoviedb.org/3/movie/now_playing?api_key=${tmdbApiKey}&language=te-IN&page=1`
          : '/api/tmdb/latest';

        if (isGitHubDeploy && !tmdbApiKey) {
          throw new Error('TMDB API key is not configured for GitHub Pages deployment.');
        }

        const response = await fetch(listUrl);
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

  return (
    <Layout>
      <Seo
        title={movie?.title || movie?.original_title || 'Movie details'}
        description={movie?.overview || 'Movie details and trailer links.'}
        url={id ? `/theatre-release/${id}` : '/theatre-release'}
        keywords="Telugu theatre movie details, movie details"
      />

      <main className="page-projects page-ott movie-detail-page">
        <div className="projects-page-inner">
          <div className="projects-page-header">
            <p className="eyebrow">Theatre Release</p>
            <h1 className="projects-page-title">Movie details</h1>
          </div>

          {loading ? (
            <p className="admin-status">Loading movie details…</p>
          ) : error ? (
            <p className="admin-status admin-status--error">{error}</p>
          ) : movie ? (
            <>
              {!moviesLoading && movies.length > 0 && (
                <section className="movie-carousel">
                  <div className="movie-carousel__inner">
                    {movies.map((carouselMovie) => (
                      <article key={carouselMovie.id} className="tmdb-release-card">
                        <div className="tmdb-release-card__poster">
                          {carouselMovie.poster_path ? (
                            <img
                              src={`${TMDB_POSTER_BASE}${carouselMovie.poster_path}`}
                              alt={carouselMovie.title || carouselMovie.original_title}
                              className="tmdb-release-card__image"
                              loading="lazy"
                            />
                          ) : (
                            <div className="tmdb-release-card__image tmdb-release-card__placeholder">
                              <span>No poster available</span>
                            </div>
                          )}
                          <div className="tmdb-release-card__pill">{formatReleaseDate(carouselMovie.release_date)}</div>
                          <div className="tmdb-release-card__badge">OTT</div>

                          <div className="tmdb-release-card__overlay">
                            <div className="tmdb-release-card__content">
                              <h2 className="tmdb-release-card__title">{carouselMovie.title || carouselMovie.original_title || 'Untitled'}</h2>
                              <p className="tmdb-release-card__meta">
                                {getMovieGenres(carouselMovie.genre_ids)} &middot; {carouselMovie.vote_average ? carouselMovie.vote_average.toFixed(1) : 'NR'}
                              </p>
                              <div className="tmdb-release-card__actions">
                                <Link
                                  href={`/theatre-release/${carouselMovie.id}`}
                                  className="tmdb-release-card__action tmdb-release-card__action--primary"
                                >
                                  Details
                                </Link>
                                <a
                                  href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${carouselMovie.title || carouselMovie.original_title || 'Movie'} trailer`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="tmdb-release-card__action tmdb-release-card__action--secondary"
                                >
                                  Trailer
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              <section className="movie-detail-hero">
              {movie.backdrop_path ? (
                <img
                  src={`${TMDB_BACKDROP_BASE}${movie.backdrop_path}`}
                  alt={movie.title || movie.original_title}
                  className="movie-detail-hero__backdrop"
                />
              ) : null}

              <div className="movie-detail-hero__inner">
                <div className="movie-detail-poster">
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                      alt={`${movie.title || movie.original_title} poster`}
                    />
                  ) : (
                    <div className="movie-detail-poster__placeholder">
                      <span>No poster available</span>
                    </div>
                  )}
                  <span className="movie-detail-poster__pill">{formatReleaseDate(movie.release_date)}</span>
                  {/* <span className="movie-detail-poster__badge">OTT</span> */}
                </div>

                <div className="movie-detail-copy">
                  <p className="eyebrow movie-detail-eyebrow">{movie.status || 'Released'}</p>
                  <h1 className="movie-detail-title">{movie.title || movie.original_title}</h1>
                  {movie.tagline ? <p className="movie-detail-tagline">{movie.tagline}</p> : null}

                  <div className="movie-detail-stats">
                    <span>{formatReleaseDate(movie.release_date)}</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                    <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                    <span>{movie.genres?.map((genre) => genre.name).join(', ') || 'Genre N/A'}</span>
                  </div>

                  <p className="movie-detail-overview">{movie.overview || 'No overview available.'}</p>

                  <div className="movie-detail-actions">
                    {movie.homepage && (
                      <a
                        href={movie.homepage}
                        target="_blank"
                        rel="noreferrer"
                        className="tmdb-release-card__action tmdb-release-card__action--primary"
                      >
                        Official site
                      </a>
                    )}
                    <a
                      href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${movie.title || movie.original_title} trailer`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tmdb-release-card__action tmdb-release-card__action--secondary"
                    >
                      Watch trailer
                    </a>
                    <Link href="/theatre-release" className="tmdb-release-card__action tmdb-release-card__action--secondary">
                      Back to releases
                    </Link>
                  </div>
                </div>
              </div>
            </section>
            </>
          ) : (
            <p className="admin-status">Movie details are unavailable.</p>
          )}
        </div>
      </main>
    </Layout>
  );
}
