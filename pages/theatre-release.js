import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

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
        description="Latest Tollywood theatre release movies from TMDb, displayed in a card layout."
        url="/theatre-release"
        keywords="Telugu theatre releases, Tollywood theatre movies, TMDb theatre list"
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

          <section className="tmdb-release-section">
            {loading ? (
              <p className="admin-status">Loading theatre release movies…</p>
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
                      <div className="tmdb-release-card__badge">{movie.release_date || 'TBA'}</div>
                    </div>

                    <div className="tmdb-release-card__body">
                      <div className="tmdb-release-card__heading">
                        <h2 className="tmdb-release-card__title">{movie.title || movie.original_title || 'Untitled'}</h2>
                        <span className="tmdb-release-card__score">{movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                      </div>
                      <p className="tmdb-release-card__overview">{movie.overview || 'No description is available for this movie yet.'}</p>
                      <div className="tmdb-release-card__footer">
                        <span className="tmdb-release-card__tag">{movie.original_language?.toUpperCase() || 'LANG N/A'}</span>
                        <span className="tmdb-release-card__tag">{movie.genre_ids?.length ? `${movie.genre_ids.length} genre(s)` : 'Genre N/A'}</span>
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
