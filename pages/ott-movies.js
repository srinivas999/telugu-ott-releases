import { useEffect, useMemo, useState } from 'react';
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

      <section className="page-projects">
        <div className="projects-page-inner">
          <header className="projects-page-header">
            <h1>Telugu OTT releases this week</h1>
            <p className="projects-page-lede">
              Weekly Telugu OTT release schedule for upcoming Telugu movies on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.
            </p>
            <div className="share-buttons">
              <a
                className="share-button share-button--whatsapp"
                href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                className="share-button share-button--telegram"
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
              <a
                className="share-button share-button--twitter"
                href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            </div>
          </header>

          <div className="release-table-toolbar">
            <label className="release-table-toolbar__label" htmlFor="ott-date-sort">
              Sort by date
            </label>
            <select
              className="release-table-toolbar__select"
              id="ott-date-sort"
              name="ott-date-sort"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>

            <label className="release-table-toolbar__label" htmlFor="ott-platform-select">
              Filter by platform
            </label>
            <select
              className="release-table-toolbar__select"
              id="ott-platform-select"
              name="ott-platform-select"
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

          {error ? (
            <p className="admin-status admin-status--error" aria-live="assertive">
              {error}
            </p>
          ) : null}
          {loading ? (
            <div className="admin-loading">Loading OTT releases...</div>
          ) : null}

          <div className="release-table-wrapper">
            <table className="release-table">
              <thead>
                <tr>
                  <th scope="col">Movie</th>
                  <th scope="col">Digital Release Date</th>
                  <th scope="col">Online Streaming Partner</th>
                  <th scope="col">Category</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovies.length === 0 ? (
                  <tr>
                    <td className="ott-empty" colSpan="4">
                      {loading ? 'Loading OTT releases...' : 'No releases match your filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredMovies.map((movie) => (
                    <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`} itemScope itemType="https://schema.org/Movie">
                      <td>
                        <span itemProp="name">{movie.movie_name || 'Untitled'}</span>
                      </td>
                      <td>
                        <time itemProp="datePublished" dateTime={movie.digital_release_date || ''}>
                          {formatReleaseDate(movie.digital_release_date)}
                        </time>
                      </td>
                      <td>{movie.streaming_partner || 'TBA'}</td>
                      <td itemProp="genre">{movie.category || 'Film'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <section className="ott-trending section" aria-labelledby="trending-heading">
            <h2 id="trending-heading">Trending releases</h2>
            <div className="ott-trending-list">
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
