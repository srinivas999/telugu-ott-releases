import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const YOUTUBE_SEARCH_URL_BASE = 'https://www.youtube.com/results?search_query=';
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

export default function TheatreReleasePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function loadMovies() {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      setLoading(true);
      setError('');

      try {
        if (typeof window !== 'undefined') {
          const cacheRaw = window.localStorage.getItem(CACHE_KEY);
          if (cacheRaw) {
            const cache = JSON.parse(cacheRaw);
            const isFresh = cache.timestamp && Date.now() - cache.timestamp < CACHE_TTL;

            if (isFresh && Array.isArray(cache.movies)) {
              setMovies(cache.movies);
              setLoading(false);
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
        setError(fetchError.message || 'Unable to load theatre release movies at this time.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  return (
    <Layout>
      <Seo
        title="Telugu theatre releases"
        description="Latest Tollywood theatre release movies, displayed in a card layout."
        url="/theatre-release"
        keywords="Telugu theatre releases, Tollywood theatre movies, theatre movie list"
      />

      <main className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="theatre-hero">
            <div className="theatre-hero__content">
              <p className="eyebrow">Theatre Release</p>
              <h1 className="theatre-hero__title">Latest Tollywood theatre releases</h1>
              <div className="theatre-hero__controls">
                <button
                  type="button"
                  className="theatre-hero__toggle"
                  onClick={() => setCompactMode((current) => !current)}
                >
                  {compactMode ? 'Switch to regular mode' : 'Switch to compact mode'}
                </button>
              </div>
            </div>
          </section>

          {/* {!loading && !error && movies.length > 0 && (
            <section className="movie-carousel">
              <div className="movie-carousel__inner">
                {movies.map((carouselMovie) => (
                  <article key={carouselMovie.id} className="tmdb-release-card movie-carousel__card">
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

                      <div className="tmdb-release-card__overlay movie-carousel__overlay">
                        <div className="tmdb-release-card__content">
                          <h2 className="tmdb-release-card__title">{carouselMovie.title || carouselMovie.original_title || 'Untitled'}</h2>
                          <p className="tmdb-release-card__meta">
                            {getMovieGenres(carouselMovie.genre_ids)} &middot; {carouselMovie.vote_average ? carouselMovie.vote_average.toFixed(1) : 'NR'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
 */}
          <section className="tmdb-release-section">
            {loading ? (
              <p className="admin-status">Loading theatre release movies...</p>
            ) : error ? (
              <p className="admin-status admin-status--error">{error}</p>
            ) : movies.length === 0 ? (
              <p className="admin-status">No theatre release movies were found.</p>
            ) : (
              <div className={`tmdb-release-grid${compactMode ? ' tmdb-release-grid--compact' : ''}`}>
                {movies.map((movie) => (
                  <article key={movie.id} className={`tmdb-release-card${compactMode ? ' tmdb-release-card--compact' : ''}`}>
                    <div className="tmdb-release-card__poster">
                      {movie.poster_path ? (
                        <img
                          src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                          alt={movie.title || movie.original_title}
                          className="tmdb-release-card__image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="tmdb-release-card__image tmdb-release-card__placeholder">
                          <span>No poster available</span>
                        </div>
                      )}

                      <div className="tmdb-release-card__pill">{formatReleaseDate(movie.release_date)}</div>
                      {/* <div className="tmdb-release-card__badge">OTT</div> */}

                      <div className="tmdb-release-card__overlay">
                        <div className="tmdb-release-card__content">
                          <h2 className="tmdb-release-card__title">{movie.title || movie.original_title || 'Untitled'}</h2>
                          <p className="tmdb-release-card__meta">
                            {getMovieGenres(movie.genre_ids)} &middot; {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
                          </p>
                          <div className="tmdb-release-card__actions">
                            <Link
                              href={`/theatre-release/${movie.id}`}
                              className="tmdb-release-card__action tmdb-release-card__action--primary"
                            >
                              Details
                            </Link>
                            <a
                              href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${movie.title || movie.original_title || 'Movie'} trailer`)}`}
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
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
}
