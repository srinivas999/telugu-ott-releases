import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';

const platformOptions = [
  { value: 'all', label: 'All' },
  { value: 'Netflix', label: 'Netflix', color: '#E50914' },
  { value: 'Aha', label: 'Aha', color: '#FF6B00' },
  { value: 'Prime Video', label: 'Prime', color: '#00A8E1' },
  { value: 'JioHotstar', label: 'Hotstar', color: '#1F80E0' },
  { value: 'Zee5', label: 'Zee5', color: '#6C2E7C' },
  { value: 'Sun NXT', label: 'Sun NXT', color: '#E31837' },
  { value: 'ETV Win', label: 'ETV Win', color: '#0066CC' },
  { value: 'other', label: 'Other', color: '#64748b' },
];

const platformColorMap = {
  Netflix: '#E50914',
  'Prime Video': '#00A8E1',
  Aha: '#FF6B00',
  JioHotstar: '#1F80E0',
  Zee5: '#6C2E7C',
  'Sun NXT': '#E31837',
  'ETV Win': '#0066CC',
};

const defaultSeoDescription =
  'Telugu OTT release schedule for upcoming Telugu OTT movies, streaming dates, and platform availability across Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.';

function normalizePlatform(value) {
  if (!value) return '';
  const lower = String(value).toLowerCase();
  if (lower.includes('prime')) return 'Prime Video';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('aha')) return 'Aha';
  if (lower.includes('hotstar')) return 'JioHotstar';
  if (lower.includes('zee')) return 'Zee5';
  if (lower.includes('sun nxt') || lower.includes('sun')) return 'Sun NXT';
  if (lower.includes('etv')) return 'ETV Win';
  return String(value).trim();
}

function formatReleaseDate(value) {
  if (!value) return 'TBA';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const release = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((release - now) / (1000 * 60 * 60 * 24));
  return diff;
}

function sortMovies(movies, sortOrder) {
  return [...movies].sort((a, b) => {
    const firstTime = new Date(`${a.digital_release_date}T00:00:00`).getTime();
    const secondTime = new Date(`${b.digital_release_date}T00:00:00`).getTime();
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0;
    if (sortOrder === 'asc') return firstTime - secondTime;
    return secondTime - firstTime;
  });
}

function getPlatformColor(platform) {
  return platformColorMap[normalizePlatform(platform)] || '#64748b';
}

function SkeletonCard() {
  return (
    <article className="ott-movie-card ott-movie-card--skeleton">
      <div className="ott-movie-card__header skeleton-shimmer" />
      <div className="ott-movie-card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line skeleton-line--meta" />
        <div className="skeleton-line skeleton-line--date" />
      </div>
    </article>
  );
}

export default function OttMoviesPage({ home = false }) {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [ottMovies, setOttMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const pageUrl = home ? '/' : '/ott-movies';

  useEffect(() => {
    async function loadMovies() {
      if (!supabase) {
        setError('Supabase is not configured. OTT releases will not load until environment variables are set.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await supabase
          .from('ott_movies')
          .select('*')
          .order('digital_release_date', { ascending: false })
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;

        setOttMovies(
          (data || []).map((movie) => ({
            ...movie,
            streaming_partner: normalizePlatform(movie.streaming_partner),
          }))
        );
      } catch (fetchError) {
        console.error('Fetch OTT movies error:', fetchError);
        setError('Unable to load OTT releases right now. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const filteredMovies = useMemo(() => {
    const filtered = ottMovies.filter((movie) => {
      const normalized = normalizePlatform(movie.streaming_partner);
      if (selectedPlatform === 'all') return true;
      if (selectedPlatform === 'other') {
        return !['Netflix', 'Aha', 'Prime Video', 'JioHotstar', 'Zee5', 'Sun NXT', 'ETV Win'].includes(normalized);
      }
      return normalized === selectedPlatform;
    });
    return sortMovies(filtered, sortOrder);
  }, [ottMovies, selectedPlatform, sortOrder]);

  const trendingMovies = useMemo(() => sortMovies(ottMovies, 'desc').slice(0, 6), [ottMovies]);
  const latestMovie = filteredMovies[0];

  const shareUrl = `https://svteluguott.in${router.asPath}`;
  const shareText = encodeURIComponent('Check the latest Telugu OTT movie releases this week.');
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Latest Telugu OTT Releases',
    itemListElement: filteredMovies.slice(0, 10).map((movie, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Movie',
        name: movie.movie_name || 'Untitled',
        datePublished: movie.digital_release_date || '',
        description: movie.streaming_partner ? `Streaming on ${movie.streaming_partner}` : 'Telugu OTT movie release',
        url: shareUrl,
      },
    })),
  };

  return (
    <Layout>
      <Seo
        title="Telugu OTT releases this week | OTT Movies"
        description={defaultSeoDescription}
        url={pageUrl}
        keywords="Telugu OTT releases this week, upcoming OTT movies Telugu, Netflix Telugu, Aha Telugu, Prime Video Telugu"
        jsonLd={jsonLd}
      />

      <main className="page-ott-movies">
        {/* Animated background */}
        <div className="ott-movies-bg" aria-hidden="true">
          <div className="ott-movies-bg__blob ott-movies-bg__blob--1" />
          <div className="ott-movies-bg__blob ott-movies-bg__blob--2" />
          <div className="ott-movies-bg__blob ott-movies-bg__blob--3" />
        </div>

        <div className="page-ott-movies__inner">
          {/* Hero */}
          <section className="ott-movies-hero">
            <div className="ott-movies-hero__badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Streaming Guide
            </div>
            <h1 className="ott-movies-hero__title">Telugu OTT Releases</h1>
            <p className="ott-movies-hero__subtitle">
              Track the latest Telugu movies streaming on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT &amp; ETV Win
            </p>
            <div className="ott-movies-hero__stats">
              <div className="ott-movies-hero__stat">
                <span>{ottMovies.length}</span>
                <label>Total Releases</label>
              </div>
              <div className="ott-movies-hero__stat">
                <span>{filteredMovies.length}</span>
                <label>Showing Now</label>
              </div>
              <div className="ott-movies-hero__stat">
                <span>{platformOptions.length - 2}</span>
                <label>Platforms</label>
              </div>
            </div>
          </section>

          {/* Share buttons */}
          <div className="ott-movies-share">
            <a className="ott-share-btn ott-share-btn--whatsapp" href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <span className="ott-share-btn__icon" />
            </a>
            <a className="ott-share-btn ott-share-btn--telegram" href={telegramShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
              <span className="ott-share-btn__icon" />
            </a>
            <a className="ott-share-btn ott-share-btn--twitter" href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <span className="ott-share-btn__icon" />
            </a>
          </div>

          {/* Featured latest release */}
          {!loading && latestMovie && (
            <section className="ott-movies-featured">
              <div className="ott-movies-featured__card">
                <div className="ott-movies-featured__content">
                  <div className="ott-movies-featured__label">Latest Addition</div>
                  <h2 className="ott-movies-featured__title">{latestMovie.movie_name || 'Untitled'}</h2>
                  <div className="ott-movies-featured__meta">
                    <span
                      className="ott-movies-featured__platform"
                      style={{ '--platform-color': getPlatformColor(latestMovie.streaming_partner) }}
                    >
                      {latestMovie.streaming_partner || 'TBA'}
                    </span>
                    <span className="ott-movies-featured__dot" />
                    <span>{formatReleaseDate(latestMovie.digital_release_date)}</span>
                    <span className="ott-movies-featured__dot" />
                    <span>{latestMovie.language || 'Telugu'}</span>
                  </div>
                  {(() => {
                    const d = daysUntil(latestMovie.digital_release_date);
                    if (d === null) return null;
                    return (
                      <div className={`ott-movies-featured__countdown ${d < 0 ? 'is-released' : ''}`}>
                        {d === 0 ? 'Releasing Today!' : d < 0 ? `Released ${Math.abs(d)} days ago` : `${d} days until release`}
                      </div>
                    );
                  })()}
                </div>
                <div
                  className="ott-movies-featured__glow"
                  style={{ background: `radial-gradient(circle at center, ${getPlatformColor(latestMovie.streaming_partner)}33, transparent 70%)` }}
                />
              </div>
            </section>
          )}

          {/* Filters */}
          <section className="ott-movies-filters">
            <div className="ott-movies-filters__platforms">
              {platformOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`ott-platform-pill ${selectedPlatform === option.value ? 'is-active' : ''}`}
                  style={
                    selectedPlatform === option.value && option.color
                      ? { '--pill-color': option.color }
                      : {}
                  }
                  onClick={() => setSelectedPlatform(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="ott-movies-filters__controls">
              <div className="ott-movies-filters__sort">
                <label htmlFor="ott-sort">Sort</label>
                <select
                  id="ott-sort"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>

              <div className="ott-movies-filters__view">
                <button
                  type="button"
                  className={`ott-view-btn ${viewMode === 'cards' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('cards')}
                  title="Card view"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`ott-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table view"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <rect x="3" y="3" width="18" height="6" rx="1" /><rect x="3" y="12" width="18" height="6" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </section>

          {/* Count */}
          <div className="ott-movies-count">
            {loading ? 'Loading releases…' : `${filteredMovies.length} release${filteredMovies.length !== 1 ? 's' : ''} found`}
          </div>

          {/* Movies - Card View */}
          {viewMode === 'cards' && (
            <section className="ott-movies-grid">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              ) : error ? (
                <div className="ott-movies-error">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="40" height="40">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>{error}</p>
                </div>
              ) : filteredMovies.length === 0 ? (
                <div className="ott-movies-empty">No releases match your filter.</div>
              ) : (
                filteredMovies.map((movie) => {
                  const platformColor = getPlatformColor(movie.streaming_partner);
                  const days = daysUntil(movie.digital_release_date);
                  return (
                    <article key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`} className="ott-movie-card">
                      <div
                        className="ott-movie-card__header"
                        style={{ '--card-accent': platformColor }}
                      >
                        <span className="ott-movie-card__platform">{movie.streaming_partner || 'TBA'}</span>
                        {days !== null && (
                          <span className={`ott-movie-card__badge ${days < 0 ? 'is-released' : days === 0 ? 'is-today' : ''}`}>
                            {days === 0 ? 'Today' : days < 0 ? 'Released' : `${days}d`}
                          </span>
                        )}
                      </div>
                      <div className="ott-movie-card__body">
                        <h3 className="ott-movie-card__title">{movie.movie_name || 'Untitled'}</h3>
                        <div className="ott-movie-card__meta">
                          <span className="ott-movie-card__date">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatReleaseDate(movie.digital_release_date)}
                          </span>
                          <span className="ott-movie-card__lang">{movie.language || movie.movie_language || 'Telugu'}</span>
                        </div>
                        <div className="ott-movie-card__category">{movie.category || 'Film'}</div>
                      </div>
                    </article>
                  );
                })
              )}
            </section>
          )}

          {/* Movies - Table View */}
          {viewMode === 'table' && (
            <section className="ott-movies-table-section">
              <div className="ott-movies-table-wrap">
                <table className="ott-movies-table-v2">
                  <thead>
                    <tr>
                      <th>Movie</th>
                      <th>Release Date</th>
                      <th>Platform</th>
                      <th>Language</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="ott-movies-table-v2__loading">Loading releases…</td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="5" className="ott-movies-table-v2__error">{error}</td>
                      </tr>
                    ) : filteredMovies.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="ott-movies-table-v2__empty">No releases match your filter.</td>
                      </tr>
                    ) : (
                      filteredMovies.map((movie) => (
                        <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}>
                          <td className="ott-movies-table-v2__name">{movie.movie_name || 'Untitled'}</td>
                          <td>{formatReleaseDate(movie.digital_release_date)}</td>
                          <td>
                            <span
                              className="ott-movies-table-v2__platform"
                              style={{ '--platform-color': getPlatformColor(movie.streaming_partner) }}
                            >
                              {movie.streaming_partner || 'TBA'}
                            </span>
                          </td>
                          <td>{movie.language || movie.movie_language || 'Telugu'}</td>
                          <td>{movie.category || 'Film'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Trending */}
          {!loading && !error && trendingMovies.length > 0 && (
            <section className="ott-movies-trending">
              <div className="ott-movies-trending__header">
                <p className="ott-movies-trending__eyebrow">Trending Now</p>
                <h2 className="ott-movies-trending__title">Buzzing Telugu OTT Premieres</h2>
              </div>
              <div className="ott-movies-trending__grid">
                {trendingMovies.map((movie) => (
                  <article key={`${movie.movie_name}-${movie.digital_release_date}`} className="ott-trending-card-v2">
                    <div
                      className="ott-trending-card-v2__stripe"
                      style={{ background: `linear-gradient(90deg, ${getPlatformColor(movie.streaming_partner)}, #6366f1)` }}
                    />
                    <div className="ott-trending-card-v2__body">
                      <span
                        className="ott-trending-card-v2__platform"
                        style={{ color: getPlatformColor(movie.streaming_partner) }}
                      >
                        {movie.streaming_partner || 'Partner'}
                      </span>
                      <h3>{movie.movie_name || 'Untitled'}</h3>
                      <p>{formatReleaseDate(movie.digital_release_date)}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}

