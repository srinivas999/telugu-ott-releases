import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';

const platformOptions = [
  { value: 'all', label: 'All platforms' },
  { value: 'Netflix', label: 'Netflix' },
  { value: 'Aha', label: 'Aha' },
  { value: 'Prime Video', label: 'Prime Video' },
  { value: 'JioHotstar', label: 'JioHotstar' },
  { value: 'Zee5', label: 'Zee5' },
  { value: 'Sun NXT', label: 'Sun NXT' },
  { value: 'ETV Win', label: 'ETV Win' },
  { value: 'other', label: 'Other' },
];

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

function sortMovies(movies, sortOrder) {
  return [...movies].sort((a, b) => {
    const firstTime = new Date(`${a.digital_release_date}T00:00:00`).getTime();
    const secondTime = new Date(`${b.digital_release_date}T00:00:00`).getTime();
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0;
    if (sortOrder === 'asc') return firstTime - secondTime;
    return secondTime - firstTime;
  });
}

export default function OttMoviesPage({ home = false }) {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const [ottMovies, setOttMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

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

        if (fetchError) {
          throw fetchError;
        }

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
    }))
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

      <section className="page-projects page-ott">
        <div className="projects-page-inner">
          <div className="ott-home-header">
            <div className="ott-home-header__inner">
              <Link href="/" className="ott-home-header__brand">
                <span className="ott-home-header__text ott-home-header__text--brand">telugu</span>
                <span className="ott-home-header__text ott-home-header__text--accent">OTT</span>
                <span className="ott-home-header__text ott-home-header__text--brand">Releases</span>
              </Link>
              <nav className="ott-home-header__nav" aria-label="Primary site navigation">
                <Link href="/" className="ott-home-header__link">Home</Link>
                <Link href="/blog" className="ott-home-header__link">Blog</Link>
                <Link href="/theatre-release" className="ott-home-header__link">Theatre Release</Link>
                <Link href="/web-series" className="ott-home-header__link">Web Series</Link>
                <Link href="/ott-movies?platform=Netflix" className="ott-home-header__link">Netflix</Link>
                <Link href="/ott-movies?platform=Prime%20Video" className="ott-home-header__link">Prime Video</Link>
                <Link href="/contact" className="ott-home-header__link">Contact Us</Link>
              </nav>
            </div>
          </div>
          <section className="ott-hero">
            <div className="ott-hero__visual">
              <img
                src={`${assetBasePath}/images/ott-hero-banner.png`}
                alt="Telugu OTT hero banner"
                className="hero-image"
                loading="lazy"
              />
            </div>
            <div className="ott-hero__panel">
              <h1>Telugu OTT releases this week</h1>
              <p className="ott-hero__tagline">
                Find upcoming Telugu OTT movies on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT and ETV Win with release dates and platform availability.
              </p>
              <div className="ott-hero__actions share-buttons">
                <a
                  className="share-button share-button--whatsapp"
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on WhatsApp"
                  title="Share on WhatsApp"
                >
                  <span className="share-button__icon" aria-hidden="true" />
                </a>
                <a
                  className="share-button share-button--telegram"
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Telegram"
                  title="Share on Telegram"
                >
                  <span className="share-button__icon" aria-hidden="true" />
                </a>
                <a
                  className="share-button share-button--twitter"
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter"
                  title="Share on Twitter"
                >
                  <span className="share-button__icon" aria-hidden="true" />
                </a>
              </div>
            </div>
          </section>

          <section className="ott-section ott-seo-copy" itemScope itemType="https://schema.org/Article">
            <div className="section-heading">
              <p className="eyebrow">OTT guide</p>
              <h2 itemProp="headline">Upcoming OTT movies Telugu April 2026</h2>
            </div>
            <div itemProp="articleBody">
              <p>
                This page is your weekly Telugu OTT schedule for new streaming releases, verified digital release dates, and platform rights. Use it to track the latest Telugu OTT premieres on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.
              </p>
              <p>
                If you're searching for "Telugu OTT releases this week" or "upcoming OTT movies Telugu April 2026," this page helps you find the latest Telugu streaming launch dates and movie details in one place.
              </p>
            </div>
          </section>

          <section className="ott-section ott-table-section">
            <div className="section-heading">
              <p className="eyebrow">All releases</p>
              <h2>Upcoming Telugu OTT launches</h2>
            </div>

            <div className="ott-table-filters">
              <div className="ott-filter-buttons">
                {platformOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    data-platform-filter={option.value}
                    className={`ott-filter-button ${selectedPlatform === option.value ? 'is-active' : ''}`}
                    onClick={() => setSelectedPlatform(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="ott-filter-mobile">
                <label htmlFor="ott-platform-select" className="ott-filter-label">
                  Platform
                </label>
                <select
                  id="ott-platform-select"
                  name="ott-platform-select"
                  className="ott-select"
                  value={selectedPlatform}
                  onChange={(event) => setSelectedPlatform(event.target.value)}
                >
                  {platformOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ott-filter-actions">
                <label htmlFor="ott-date-sort" className="ott-filter-label">
                  Sort by date
                </label>
                <select
                  id="ott-date-sort"
                  name="ott-date-sort"
                  className="ott-select"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                >
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </div>
            </div>

            <span className="ott-movie-count">
              {loading ? 'Loading movies...' : `${filteredMovies.length} releases`}
            </span>

            <div className="ott-table-wrap">
              <table className="ott-movies-table">
                <thead>
                  <tr>
                    <th scope="col">Movie</th>
                    <th scope="col">Release date</th>
                    <th scope="col">Platform</th>
                    <th scope="col">Language</th>
                    <th scope="col">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovies.length === 0 ? (
                    <tr>
                      <td className="ott-empty" colSpan="5">
                        {loading ? 'Loading OTT releases...' : 'No releases match your filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMovies.map((movie) => (
                      <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`} itemScope itemType="https://schema.org/Movie">
                        <td data-label="Movie">
                          <span itemProp="name">{movie.movie_name || 'Untitled'}</span>
                        </td>
                        <td data-label="Release Date">
                          <time itemProp="datePublished" dateTime={movie.digital_release_date || ''}>
                            {formatReleaseDate(movie.digital_release_date)}
                          </time>
                        </td>
                        <td data-label="Platform">
                          <span>{movie.streaming_partner || 'TBA'}</span>
                        </td>
                        <td data-label="Language">{movie.language || movie.movie_language || 'Telugu'}</td>
                        <td data-label="Category" itemProp="genre">
                          <span>{movie.category || 'Film'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p id="ott-movies-status" className="admin-status" hidden={!error} aria-live="polite">
              {error}
            </p>
            <div id="ott-movies-loading" className="admin-loading" hidden={!loading}>
              Loading OTT releases...
            </div>
          </section>

          <section className="ott-section ott-trending" aria-labelledby="trending-heading">
            <div className="section-heading">
              <p className="eyebrow">Trending</p>
              <h2 id="trending-heading">Buzzing Telugu OTT premieres</h2>
            </div>
            <div className="ott-trending-carousel" aria-label="Trending OTT releases">
              {trendingMovies.map((movie) => (
                <article key={`${movie.movie_name}-${movie.digital_release_date}`} className="ott-trending-card">
                  <div className="ott-trending-card__stripe" />
                  <div className="ott-trending-card__body">
                    <span className="ott-trending-card__partner">{movie.streaming_partner || 'Partner'}</span>
                    <h3>{movie.movie_name || 'Untitled'}</h3>
                    <p>{formatReleaseDate(movie.digital_release_date)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}
