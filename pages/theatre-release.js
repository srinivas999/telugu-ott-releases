import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const YOUTUBE_SEARCH_URL_BASE = 'https://www.youtube.com/results?search_query=';

const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

function formatReleaseDate(date) {
  if (!date) return 'TBA';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMovieGenres(genreIds) {
  if (!Array.isArray(genreIds) || genreIds.length === 0) return 'Genre N/A';
  const names = genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean).slice(0, 2);
  return names.length > 0 ? names.join(', ') : 'Genre N/A';
}

function StarRating({ rating }) {
  const stars = [];
  const fullStars = Math.floor(rating / 2);
  const hasHalf = (rating / 2) % 1 >= 0.5;
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars.push('★');
    else if (i === fullStars && hasHalf) stars.push('½');
    else stars.push('☆');
  }
  return <span className="theatre-card__stars" title={`${rating}/10`}>{stars.join('')}</span>;
}

function SkeletonCard() {
  return (
    <article className="theatre-card theatre-card--skeleton">
      <div className="theatre-card__poster skeleton" />
      <div className="theatre-card__body">
        <div className="skeleton-text skeleton-text--title" />
        <div className="skeleton-text skeleton-text--meta" />
      </div>
    </article>
  );
}

export default function TheatreReleasePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compactMode, setCompactMode] = useState(false);
  const [sortBy, setSortBy] = useState('latest');
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
          window.localStorage.setItem(CACHE_KEY, JSON.stringify({ movies: results, timestamp: Date.now() }));
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

  const sortedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
    if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
    return new Date(b.release_date || 0) - new Date(a.release_date || 0);
  });

  const featuredMovie = sortedMovies[0];
  const gridMovies = sortedMovies.slice(1);

  return (
    <Layout>
      <Seo
        title="Latest Telugu Theatre Releases"
        description="Discover the latest Tollywood theatre release movies with posters, ratings, and trailers."
        url="/theatre-release"
        keywords="Telugu theatre releases, Tollywood theatre movies, latest Telugu movies"
      />

      <main className="theatre-page">
        {/* Decorative background */}
        <div className="theatre-page__bg" aria-hidden="true">
          <div className="theatre-page__bg-blob theatre-page__bg-blob--1" />
          <div className="theatre-page__bg-blob theatre-page__bg-blob--2" />
          <div className="theatre-page__bg-blob theatre-page__bg-blob--3" />
        </div>

        <div className="theatre-page__inner">
          {/* Hero */}
          <section className="theatre-hero-v2">
            <div className="theatre-hero-v2__content">
              <div className="theatre-hero-v2__badge">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Theatre Releases
              </div>
              <h1 className="theatre-hero-v2__title">Latest Tollywood Movies</h1>
              <p className="theatre-hero-v2__subtitle">
                Stay updated with the newest Telugu films hitting theatres. Explore ratings, genres, and trailers.
              </p>

              <div className="theatre-hero-v2__stats">
                <div className="theatre-hero-v2__stat">
                  <span className="theatre-hero-v2__stat-num">{movies.length}</span>
                  <span className="theatre-hero-v2__stat-label">Movies</span>
                </div>
                <div className="theatre-hero-v2__stat">
                  <span className="theatre-hero-v2__stat-num">{movies.length > 0 ? new Date(Math.max(...movies.map(m => new Date(m.release_date || 0)))).getFullYear() : '—'}</span>
                  <span className="theatre-hero-v2__stat-label">Latest Year</span>
                </div>
              </div>
            </div>
          </section>

          {/* Controls */}
          <div className="theatre-controls">
            <div className="theatre-controls__group">
              <label className="theatre-controls__label" htmlFor="sort-select">Sort by</label>
              <select
                id="sort-select"
                className="theatre-controls__select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Release Date</option>
                <option value="rating">Rating</option>
                <option value="popular">Popularity</option>
              </select>
            </div>

            <div className="theatre-view-toggle">
              <button
                type="button"
                className={`theatre-view-toggle__btn ${!compactMode ? 'is-active' : ''}`}
                onClick={() => setCompactMode(false)}
                title="Grid view"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                className={`theatre-view-toggle__btn ${compactMode ? 'is-active' : ''}`}
                onClick={() => setCompactMode(true)}
                title="Compact view"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <rect x="3" y="3" width="18" height="6" rx="1" /><rect x="3" y="12" width="18" height="6" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Featured Movie */}
          {!loading && !error && featuredMovie && (
            <section className="theatre-featured">
              <div className="theatre-featured__card">
                <div className="theatre-featured__poster">
                  {featuredMovie.poster_path ? (
                    <img
                      src={`${TMDB_POSTER_BASE}${featuredMovie.poster_path}`}
                      alt={featuredMovie.title || featuredMovie.original_title}
                      loading="eager"
                    />
                  ) : (
                    <div className="theatre-featured__placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" />
                        <line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
                        <line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
                      </svg>
                      <span>No poster</span>
                    </div>
                  )}
                  <div className="theatre-featured__rating">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {featuredMovie.vote_average ? featuredMovie.vote_average.toFixed(1) : 'NR'}
                  </div>
                </div>

                <div className="theatre-featured__info">
                  <div className="theatre-featured__label">Featured Release</div>
                  <h2 className="theatre-featured__title">
                    {featuredMovie.title || featuredMovie.original_title || 'Untitled'}
                  </h2>
                  <p className="theatre-featured__meta">
                    <span>{formatReleaseDate(featuredMovie.release_date)}</span>
                    <span className="theatre-featured__dot" />
                    <span>{getMovieGenres(featuredMovie.genre_ids)}</span>
                    <span className="theatre-featured__dot" />
                    <StarRating rating={featuredMovie.vote_average || 0} />
                  </p>
                  <p className="theatre-featured__overview">
                    {featuredMovie.overview
                      ? featuredMovie.overview.length > 180
                        ? featuredMovie.overview.slice(0, 180) + '...'
                        : featuredMovie.overview
                      : 'No overview available.'}
                  </p>
                  <div className="theatre-featured__actions">
                    <Link href={`/theatre-release/${featuredMovie.id}`} className="theatre-btn theatre-btn--primary">
                      View Details
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                    <a
                      href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${featuredMovie.title || featuredMovie.original_title || 'Movie'} trailer`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="theatre-btn theatre-btn--ghost"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Watch Trailer
                    </a>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Movie Grid */}
          <section className="theatre-section">
            <div className="theatre-section__header">
              <h2 className="theatre-section__title">
                {loading ? 'Loading Movies' : `All Releases (${movies.length})`}
              </h2>
            </div>

            {loading ? (
              <div className={`theatre-grid${compactMode ? ' theatre-grid--compact' : ''}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="theatre-error">
                <div className="theatre-error__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="theatre-error__text">{error}</p>
                <button
                  className="theatre-btn theatre-btn--primary"
                  onClick={() => { hasFetchedRef.current = false; window.location.reload(); }}
                >
                  Try Again
                </button>
              </div>
            ) : movies.length === 0 ? (
              <div className="theatre-empty">
                <p>No theatre release movies were found.</p>
              </div>
            ) : (
              <div className={`theatre-grid${compactMode ? ' theatre-grid--compact' : ''}`}>
                {gridMovies.map((movie) => (
                  <article key={movie.id} className="theatre-card">
                    <div className="theatre-card__poster">
                      {movie.poster_path ? (
                        <img
                          src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                          alt={movie.title || movie.original_title}
                          className="theatre-card__image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="theatre-card__placeholder">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" /><line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" />
                          </svg>
                        </div>
                      )}
                      <div className="theatre-card__date">{formatReleaseDate(movie.release_date)}</div>
                      <div className="theatre-card__rating-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
                      </div>
                      <div className="theatre-card__overlay">
                        <Link href={`/theatre-release/${movie.id}`} className="theatre-card__overlay-btn">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                          </svg>
                          View Details
                        </Link>
                      </div>
                    </div>
                    <div className="theatre-card__body">
                      <h3 className="theatre-card__title">{movie.title || movie.original_title || 'Untitled'}</h3>
                      <div className="theatre-card__meta">
                        <span>{getMovieGenres(movie.genre_ids)}</span>
                        <span className="theatre-card__divider" />
                        <StarRating rating={movie.vote_average || 0} />
                      </div>
                      <div className="theatre-card__actions">
                        <Link href={`/theatre-release/${movie.id}`} className="theatre-card__link">
                          Details
                        </Link>
                        <a
                          href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${movie.title || movie.original_title || 'Movie'} trailer`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="theatre-card__link theatre-card__link--secondary"
                        >
                          Trailer
                        </a>
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

