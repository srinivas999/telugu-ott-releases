import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';
import Breadcrumb from '../components/common/Breadcrumb';

// NEW: Import content modules
import { TrendingNow, ReleasingThisWeekend, RecentlyAdded } from '../components/home/ContentModules';

// NEW: Import custom hooks
import {
  useTrendingMovies,
  useReleasingThisWeek,
  useRecentlyAdded,
} from '../lib/hooks/useMovies';
import { getPreferredMovieRating, withPreferredMovieRating } from '../lib/utils/ratings';
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

function sortMoviesByRating(movies) {
  return [...movies].sort((a, b) => {
    const firstRating = getPreferredMovieRating(a) || 0;
    const secondRating = getPreferredMovieRating(b) || 0;

    if (secondRating !== firstRating) {
      return secondRating - firstRating;
    }

    const firstTime = new Date(`${a.digital_release_date}T00:00:00`).getTime();
    const secondTime = new Date(`${b.digital_release_date}T00:00:00`).getTime();

    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0;
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
  const trendingMovies = useMemo(
    () => sortMoviesByRating(ottMovies).filter((movie) => (getPreferredMovieRating(movie) || 0) > 0).slice(0, 8),
    [ottMovies]
  );

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
            ...withPreferredMovieRating(movie),
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
  const featuredUpcoming = filteredMovies[0];

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


      {/* Breadcrumb: shows current page context */}
      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Latest OTT Releases' }]} />

      <section className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="ott-hero-v2">
            <header className="ott-hero-v2__header">
              <div className="ott-hero-v2__logo">
                <span className="logo-sv">SV</span>
                <span className="logo-telugu">TELUGU</span>
                <span className="logo-ott">OTT</span>
              </div>
              <nav className="ott-hero-v2__nav">
                <Link href="/">HOME</Link>
                <Link href="/">MOVIES</Link>
                <Link href="/">WEB SERIES</Link>
                <Link href="/">PLATFORMS</Link>
                <Link href="/">GENRES</Link>
                <Link href="/telugu-ott-releases-this-week">UPCOMING</Link>
                <Link href="/blog">NEWS</Link>
              </nav>
              <button className="ott-hero-v2__search-btn" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              </button>
            </header>

            <div className="ott-hero-v2__body">
              <div className="ott-hero-v2__content">
                <p className="ott-hero-v2__eyebrow">YOUR ULTIMATE GUIDE TO</p>
                <h1 className="ott-hero-v2__title">
                  <span className="title-white">TELUGU</span>
                  <br />
                  <span className="title-red">OTT RELEASES</span>
                </h1>
                <p className="ott-hero-v2__desc">
                  Find where to watch latest Telugu Movies &amp; Web Series across all OTT platforms.
                </p>

                <div className="ott-hero-v2__platforms">
                  <span className="platform-logo p-netflix">NETFLIX</span>
                  <span className="platform-logo p-aha">aha</span>
                  <span className="platform-logo p-prime">
                    <span className="prime-blue">prime</span> video
                  </span>
                  <span className="platform-logo p-hotstar">
                    Disney+<br />hotstar
                  </span>
                  <span className="platform-logo p-zee5">
                    <span className="zee-z">Z</span>EE<span className="zee-5">5</span>
                  </span>
                </div>

                <div className="ott-hero-v2__actions">
                  <Link href="#ott-movies-status" className="btn-v2 btn-v2--primary" onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('.ott-table-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    EXPLORE MOVIES
                  </Link>
                  <Link href="/telugu-ott-releases-this-week" className="btn-v2 btn-v2--outline">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    THIS WEEK RELEASES
                  </Link>
                </div>
              </div>

              <div className="ott-hero-v2__visual">
                <div className="ott-hero-grid">
                  {theatreMovies.length > 0 ? (
                    theatreMovies.slice(0, 7).map((movie, index) => (
                      <div key={movie.id || index} className={`ott-hero-grid__item item-${index + 1}`}>
                        {movie.poster_path ? (
                          <Image
                            src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                            alt={movie.title || movie.original_title || 'Movie Poster'}
                            fill
                            sizes="(max-width: 980px) 25vw, 15vw"
                            className="ott-hero-grid__img"
                          />
                        ) : (
                          <div className="ott-hero-grid__placeholder">{movie.title || 'Movie'}</div>
                        )}
                      </div>
                    ))
                  ) : (
                    Array.from({ length: 7 }).map((_, i) => (
                       <div key={i} className={`ott-hero-grid__item item-${i + 1} item-skeleton`} />
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="ott-hero-v2__footer">
              <div className="hero-feature">
                <div className="hero-feature__icon">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>
                </div>
                <div className="hero-feature__text">
                  <strong>All OTT Platforms</strong>
                  <span>In One Place</span>
                </div>
              </div>
              <div className="hero-feature">
                <div className="hero-feature__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div className="hero-feature__text">
                  <strong>Daily Updates</strong>
                  <span>Never Miss Anything</span>
                </div>
              </div>
              <div className="hero-feature">
                <div className="hero-feature__icon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div className="hero-feature__text">
                  <strong>Ratings &amp; Reviews</strong>
                  <span>Choose The Best</span>
                </div>
              </div>
              <div className="hero-feature">
                <div className="hero-feature__icon">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                </div>
                <div className="hero-feature__text">
                  <strong>Get Notified</strong>
                  <span>New Releases</span>
                </div>
              </div>
            </div>
          </section>

          <section className="ott-section ott-home-links">
            <div className="section-heading">
              <p className="eyebrow">Start Here</p>
              <h2>Jump straight to what you want to watch</h2>
            </div>
            <div className="ott-home-links__grid">
              <Link href="/telugu-ott-releases-this-week" className="ott-home-links__card">
                <span>This Week</span>
                <h3>New Telugu OTT releases</h3>
                <p>See only the titles releasing over the next 7 days.</p>
              </Link>
              <Link href="/top-rated-telugu-ott-movies" className="ott-home-links__card">
                <span>Top Rated</span>
                <h3>Best Telugu OTT movies</h3>
                <p>Browse the highest rated streaming titles in the database.</p>
              </Link>
              <Link href="/theatre-release" className="ott-home-links__card">
                <span>Theatres</span>
                <h3>Latest Tollywood theatre releases</h3>
                <p>Switch from OTT to big-screen releases in one tap.</p>
              </Link>
              <Link href="/blog" className="ott-home-links__card">
                <span>About</span>
                <h3>Why this website exists</h3>
                <p>Read the heart, purpose, and editorial promise behind the site.</p>
              </Link>
            </div>
          </section>

          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.25rem 1rem 1.5rem' }}>
            <ReleasingThisWeekend movies={weekendReleases} />
            <TrendingNow movies={moduleTrendingMovies} />
            <RecentlyAdded movies={recentlyAddedMovies} />
          </div>

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

            <div className="ott-table-wrap-v3">
              <table className="ott-movies-table-v3">
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
                      <td colSpan="5">
                        <div className="ott-empty-v3">
                        {loading ? 'Loading OTT releases...' : 'No releases match your filter.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMovies.map((movie) => (
                      <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`} itemScope itemType="https://schema.org/Movie">
                        <td data-label="Movie">
                          <Link href={`/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`} className="ott-table-movie-title" itemProp="url">
                            <div className="ott-table-movie-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </div>
                            <span itemProp="name">{movie.movie_name || 'Untitled'}</span>
                          </Link>
                        </td>
                        <td data-label="Release Date">
                          <time className="ott-table-date" itemProp="datePublished" dateTime={movie.digital_release_date || ''}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {formatReleaseDate(movie.digital_release_date)}
                          </time>
                        </td>
                        <td data-label="Platform">
                          <span className={`ott-badge ${
                            (movie.streaming_partner || '').toLowerCase().includes('netflix') ? 'ott-badge--netflix' :
                            (movie.streaming_partner || '').toLowerCase().includes('aha') ? 'ott-badge--aha' :
                            (movie.streaming_partner || '').toLowerCase().includes('prime') ? 'ott-badge--prime' :
                            (movie.streaming_partner || '').toLowerCase().includes('hotstar') ? 'ott-badge--hotstar' :
                            (movie.streaming_partner || '').toLowerCase().includes('zee5') ? 'ott-badge--zee5' :
                            'ott-badge--default'
                          }`}>
                            {movie.streaming_partner || 'TBA'}
                          </span>
                        </td>
                        <td data-label="Language">
                          <span className="ott-badge ott-badge--lang">{movie.language || movie.movie_language || 'Telugu'}</span>
                        </td>
                        <td data-label="Category" itemProp="genre">
                          <span className="ott-badge ott-badge--category">{movie.category || 'Film'}</span>
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
              <p className="eyebrow">Editor&apos;s Picks</p>
              <h2 id="trending-heading">Top rated Telugu OTT movies right now</h2>
            </div>
            <div className="ott-trending-carousel-v2" aria-label="Trending OTT releases">
              {trendingMovies.map((movie) => (
                <article key={`${movie.movie_name}-${movie.digital_release_date}`} className="ott-trending-card-v2">
                  <div className="ott-trending-card-v2__body">
                    <span className="ott-trending-card-v2__partner">{movie.streaming_partner || 'Partner'}</span>
                    <h3>
                      <Link href={`/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`}>
                        {movie.movie_name || 'Untitled'}
                      </Link>
                    </h3>
                    <p className="ott-trending-card-v2__rating">
                      {(getPreferredMovieRating(movie) || 0) > 0 ? `Rating ${getPreferredMovieRating(movie).toFixed(1)}/10` : formatReleaseDate(movie.digital_release_date)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ott-section ott-home-theatre movie-carousel" aria-labelledby="theatre-home-heading">
            <div className="section-heading">
              <p className="eyebrow">Beyond OTT</p>
              <h2 id="theatre-home-heading">Also tracking Telugu theatre releases</h2>
            </div>
            <p className="ott-home-theatre__copy">
              If you want the full Telugu movie picture, we also track new theatre releases with ratings, trailers, and detail pages.
            </p>
            {theatreLoading ? (
              <p className="admin-status">Loading theatre release data...</p>
            ) : theatreError ? (
              <p className="admin-status admin-status--error">{theatreError}</p>
            ) : marqueeMovies.length > 0 ? (
              <>
                <div className="movie-carousel__inner" ref={carouselRef}>
                  {marqueeMovies.map((carouselMovie, index) => (
                    <article key={`${carouselMovie.id}-${index}`} className="tmdb-release-card movie-carousel__card">
                      <div className="tmdb-release-card__poster">
                        {carouselMovie.poster_path ? (
                          <Image
                            src={`${TMDB_POSTER_BASE}${carouselMovie.poster_path}`}
                            alt={carouselMovie.title || carouselMovie.original_title}
                            className="tmdb-release-card__image"
                            fill
                            sizes="200px"
                          />
                        ) : (
                          <div className="tmdb-release-card__image tmdb-release-card__placeholder">
                            <span>No poster available</span>
                          </div>
                        )}

                        <div className="tmdb-release-card__pill">{formatReleaseDate(carouselMovie.release_date)}</div>

                        <div className="tmdb-release-card__overlay movie-carousel__overlay">
                          <div className="tmdb-release-card__content">
                            <h3 className="tmdb-release-card__title">{carouselMovie.title || carouselMovie.original_title || 'Untitled'}</h3>
                            <p className="tmdb-release-card__meta">
                              {getMovieGenres(carouselMovie.genre_ids)} &middot; {carouselMovie.vote_average ? carouselMovie.vote_average.toFixed(1) : 'NR'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="ott-home-theatre__actions">
                  <Link href="/theatre-release" className="ott-home-theatre__link">
                    Explore all theatre releases
                  </Link>
                </div>
              </>
            ) : (
              <p className="admin-status">No theatre release data available at this time.</p>
            )}
          </section>
        </div>
      </section>
    </Layout>
  );
}
