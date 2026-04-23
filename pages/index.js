import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';
import Breadcrumb from '../components/common/Breadcrumb';

// NEW: Import content modules
import {
  TrendingNow,
  ReleasingThisWeekend,
  RecentlyAdded,
} from '../components/home/ContentModules';

// NEW: Import custom hooks
import {
  useTrendingMovies,
  useReleasingThisWeek,
  useRecentlyAdded,
} from '../lib/hooks/useMovies';
import { generateUniqueSlug } from '../lib/utils/slug';


const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';

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

export default function HomePage() {
  const router = useRouter();
  const [ottMovies, setOttMovies] = useState([]);
  const [theatreMovies, setTheatreMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theatreLoading, setTheatreLoading] = useState(true);
  const [error, setError] = useState('');
  const [theatreError, setTheatreError] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  // NEW: Fetch content for modules
  const { movies: moduleTrendingMovies } = useTrendingMovies(10);
  const { movies: weekendReleases } = useReleasingThisWeek();
  const { movies: recentlyAddedMovies } = useRecentlyAdded(10);

  const carouselRef = useRef(null);
  const trendingMovies = useMemo(() => sortMovies(ottMovies, 'desc').slice(0, 8), [ottMovies]);

  // Create duplicated movies for infinite marquee effect
  const marqueeMovies = useMemo(() => {
    if (theatreMovies.length === 0) return [];
    // Duplicate movies 4 times for smooth infinite scrolling
    return [...theatreMovies, ...theatreMovies, ...theatreMovies, ...theatreMovies];
  }, [theatreMovies]);

  useEffect(() => {
    const container = carouselRef.current;
    if (!container || marqueeMovies.length <= 1) return;

    let frame;
    let scrollAmount = 0;
    const scrollSpeed = 0.8; // Adjust speed as needed

    const step = () => {
      if (!container) {
        frame = requestAnimationFrame(step);
        return;
      }

      // Calculate the width of one set of movies
      const singleSetWidth = container.scrollWidth / 4; // Since we have 4 duplicates
      if (singleSetWidth <= 0) {
        frame = requestAnimationFrame(step);
        return;
      }

      scrollAmount += scrollSpeed;
      if (scrollAmount >= singleSetWidth) {
        scrollAmount -= singleSetWidth;
      }

      container.scrollLeft = scrollAmount;
      frame = requestAnimationFrame(step);
    };

    // Start scrolling
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [marqueeMovies]);

  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('ott_movies')
          .select('*')
          .order('digital_release_date', { ascending: false });

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

  useEffect(() => {
    async function loadTheatreMovies() {
      setTheatreLoading(true);
      setTheatreError('');
      try {
        const response = await fetch('/api/tmdb/latest');

        if (!response.ok) {
          const body = await response.text();
          console.error(`Unable to fetch theatre release movies (${response.status}). ${body}`);
          setTheatreMovies([]);
          setTheatreError('Unable to load theatre release data right now. Please refresh later.');
          setTheatreLoading(false);
          return;
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        setTheatreMovies(results);
      } catch (fetchError) {
        console.error('Fetch theatre release movies error:', fetchError);
        setTheatreMovies([]);
        setTheatreError('Unable to load theatre release data right now. Please refresh later.');
      } finally {
        setTheatreLoading(false);
      }
    }

    loadTheatreMovies();
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

  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const shareUrl = `https://svteluguott.in${router.asPath}`;
  const shareText = encodeURIComponent('Check the latest Telugu OTT movie releases this week.');
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(shareUrl)}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
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
        url: `https://svteluguott.in/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`,
      },
    }))
  };

  return (
    <Layout>
      <Seo
        title="Telugu OTT releases this week | OTT Movies"
        description={defaultSeoDescription}
        url="/"
        keywords="Telugu OTT releases this week, upcoming OTT movies Telugu, Netflix Telugu, Aha Telugu, Prime Video Telugu, JioHotstar Telugu, Zee5 Telugu, Sun NXT Telugu, ETV Win Telugu"
        jsonLd={jsonLd}
      />

      {/* NEW: Add breadcrumb at top */}
      <Breadcrumb items={[{ name: 'Home' }]} />

      <section className="page-projects page-ott">
        <div className="projects-page-inner">
        
          {/* NEW: Add content modules */}
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            <TrendingNow movies={moduleTrendingMovies} />
            <ReleasingThisWeekend movies={weekendReleases} />
            <RecentlyAdded movies={recentlyAddedMovies} />
          </div>

          <section className="movie-carousel" aria-label="Theatre release movies">
            {theatreLoading ? (
              <p className="admin-status">Loading theatre release data...</p>
            ) : theatreError ? (
              <p className="admin-status admin-status--error">{theatreError}</p>
            ) : marqueeMovies.length > 0 ? (
              <div className="movie-carousel__inner" ref={carouselRef}>
                {marqueeMovies.map((carouselMovie, index) => (
                  <article key={`${carouselMovie.id}-${index}`} className="tmdb-release-card movie-carousel__card">
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
            ) : (
              <p className="admin-status">No theatre release data available at this time.</p>
            )}
          </section>

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
                  <span className="share-button__icon" aria-hidden="true">📱</span>
                </a>
                <a
                  className="share-button share-button--facebook"
                  href={facebookShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  title="Share on Facebook"
                >
                  <span className="share-button__icon" aria-hidden="true">✈️</span>
                </a>
                <a
                  className="share-button share-button--telegram"
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Telegram"
                  title="Share on Telegram"
                >
                  <span className="share-button__icon" aria-hidden="true">Telegram</span>
                </a>
                <a
                  className="share-button share-button--twitter"
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter"
                  title="Share on Twitter"
                >
                  <span className="share-button__icon" aria-hidden="true">🐦</span>
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
                If you&apos;re searching for &quot;Telugu OTT releases this week&quot; or &quot;upcoming OTT movies Telugu April 2026,&quot; this page helps you find the latest Telugu streaming launch dates and movie details in one place.
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
                          <Link href={`/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`} itemProp="url">
                            <span itemProp="name">{movie.movie_name || 'Untitled'}</span>
                          </Link>
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
                    <h3>
                      <Link href={`/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`}>
                        {movie.movie_name || 'Untitled'}
                      </Link>
                    </h3>
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
