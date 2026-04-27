import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import ContinueBrowsing from '../components/common/ContinueBrowsing';
import { supabase } from '../lib/supabaseClient';
import {
  useTrendingMovies,
  useReleasingThisWeek,
  useRecentlyAdded,
} from '../lib/hooks/useMovies';
import { formatCompactVoteCount, getPreferredMovieRating, getTmdbVoteCountValue } from '../lib/utils/ratings';
import { getAvailableEditorialCollections } from '../lib/utils/editorialCollections';
import { generateUniqueSlug } from '../lib/utils/slug';
import { withStoredTmdbDetails } from '../lib/utils/tmdb';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const FALLBACK_POSTER = '/images/default_poster.png';

const platformOptions = [
  { value: 'all', label: 'All' },
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
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function withDisplayFields(movie) {
  const merged = withStoredTmdbDetails(movie);
  const movieName = merged.movie_name || merged.title || 'Untitled';

  return {
    ...merged,
    movie_name: movieName,
    title: movieName,
    streaming_partner: normalizePlatform(merged.streaming_partner),
  };
}

function toPosterUrl(movie) {
  const path = movie?.poster_path;
  if (!path) return FALLBACK_POSTER;
  if (String(path).startsWith('http')) return path;
  return `${TMDB_POSTER_BASE}${path}`;
}

function toBackdropUrl(movie) {
  const backdropPath = movie?.backdrop_path || movie?.poster_path;
  if (!backdropPath) return null;
  if (String(backdropPath).startsWith('http')) return backdropPath;
  return `${TMDB_BACKDROP_BASE}${backdropPath}`;
}

function getCardBadge(movie, type = 'ott', signal = '') {
  if (signal === 'trending') return 'Popular This Week';
  if (signal === 'week') return 'Trending Release';
  if (signal === 'recent') return 'Hot Pick';
  if (type === 'theatre') return 'Popular This Week';
  if (!movie?.poster_path) return '';
  const rating = getPreferredMovieRating(movie) || movie.vote_average || 0;
  if (rating >= 8) return 'Top Rated';
  return 'Streaming';
}

function getTrustSignal(signal = '', type = 'ott') {
  if (signal === 'trending') return 'Popular this week';
  if (signal === 'week') return 'Trending now';
  if (signal === 'recent') return 'Fresh pick';
  if (type === 'theatre') return 'Audience buzz';
  return 'Viewer trust';
}

function sortByReleaseDate(movies, sortOrder) {
  return [...movies].sort((a, b) => {
    const firstTime = new Date(`${a.digital_release_date || ''}T00:00:00`).getTime();
    const secondTime = new Date(`${b.digital_release_date || ''}T00:00:00`).getTime();
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0;
    if (sortOrder === 'asc') return firstTime - secondTime;
    return secondTime - firstTime;
  });
}

function MovieRail({ title, movies, type = 'ott', viewAllHref = '', signal = '' }) {
  if (!movies || movies.length === 0) return null;

  return (
    <section className="nf-rail" aria-label={title}>
      <div className="nf-rail__header">
        <h2>{title}</h2>
        {viewAllHref ? (
          <Link href={viewAllHref} className="nf-rail__view-all">
            View All
          </Link>
        ) : null}
      </div>
      <div className="nf-rail__track">
        {movies.map((movie, index) => {
          const key = `${movie.id || movie.movie_name}-${index}`;
          const isTheatre = type === 'theatre';
          const href = isTheatre
            ? `/theatre-release/${movie.id}`
            : `/movie/${generateUniqueSlug(movie.movie_name || movie.title, movie.id)}`;
          const badge = getCardBadge(movie, type, signal);
          const rating = getPreferredMovieRating(movie) || movie.vote_average || 0;
          const voteCountLabel = formatCompactVoteCount(getTmdbVoteCountValue(movie));
          const label = isTheatre
            ? formatReleaseDate(movie.release_date)
            : formatReleaseDate(movie.digital_release_date);

          return (
            <Link key={key} href={href} className="nf-card">
              <div className="nf-card__poster">
                <Image
                  src={toPosterUrl(movie)}
                  alt={movie.movie_name || movie.title || 'Movie poster'}
                  fill
                  sizes="(max-width: 640px) 38vw, (max-width: 980px) 22vw, 16vw"
                  className="nf-card__image"
                />
                {badge ? <span className="nf-card__badge">{badge}</span> : null}
                {rating > 0 ? (
                  <span className="nf-card__rating">{Number(rating).toFixed(1)}</span>
                ) : null}
                <div className="nf-card__overlay">
                  <span className="nf-card__overlay-cta">View Details</span>
                </div>
              </div>
              <div className="nf-card__meta">
                <h3>{movie.movie_name || movie.title || 'Untitled'}</h3>
                <p>{isTheatre ? 'Theatre' : movie.streaming_partner || 'OTT'} - {label}</p>
                <div className="nf-card__trust">
                  <span>{voteCountLabel || 'New audience signal'}</span>
                  <span>{getTrustSignal(signal, type)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage() {
  const [ottMovies, setOttMovies] = useState([]);
  const [theatreMovies, setTheatreMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');

  const { movies: moduleTrendingMovies } = useTrendingMovies(16);
  const { movies: weekendReleases } = useReleasingThisWeek();
  const { movies: recentlyAddedMovies } = useRecentlyAdded(16);

  useEffect(() => {
    async function loadMovies() {
      setLoading(true);
      setError('');

      try {
        const { data, error: fetchError } = await supabase
          .from('ott_movies')
          .select('*')
          .order('digital_release_date', { ascending: false });

        if (fetchError) throw fetchError;
        setOttMovies((data || []).map(withDisplayFields));
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
      try {
        const response = await fetch('/api/tmdb/latest');
        if (!response.ok) {
          setTheatreMovies([]);
          return;
        }
        const data = await response.json();
        setTheatreMovies(Array.isArray(data.results) ? data.results : []);
      } catch (fetchError) {
        console.error('Fetch theatre release movies error:', fetchError);
        setTheatreMovies([]);
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

    return sortByReleaseDate(filtered, sortOrder);
  }, [ottMovies, selectedPlatform, sortOrder]);

  const editorialCollections = useMemo(
    () => getAvailableEditorialCollections(ottMovies, 10).slice(0, 6),
    [ottMovies]
  );

  const heroMovie = filteredMovies[0] || moduleTrendingMovies[0] || recentlyAddedMovies[0] || null;
  const heroTitle = heroMovie?.movie_name || heroMovie?.title || 'Telugu OTT Releases';
  const heroDescription =
    heroMovie?.overview ||
    'Discover the latest Telugu OTT drops, trending movies, and this week releases across every major streaming platform.';
  const retentionItems = [
    {
      href: '/browse/trending-now',
      eyebrow: 'Trending Now',
      title: 'Because you are browsing new Telugu OTT releases',
      description: 'Jump into the hottest titles people are likely to click next.',
      cta: 'Open Trending',
    },
    {
      href: '/top-rated-telugu-ott-movies',
      eyebrow: 'Top Rated',
      title: 'Stay with the strongest picks',
      description: 'Move from fresh releases into the best-rated Telugu OTT movies.',
      cta: 'View Top Picks',
    },
    {
      href: '/telugu-ott-releases-this-week',
      eyebrow: 'This Week',
      title: 'Keep the release loop going',
      description: 'See what is dropping over the next 7 days across OTT platforms.',
      cta: 'See This Week',
    },
    {
      href: '/theatre-release',
      eyebrow: 'Beyond OTT',
      title: 'Continue into theatre releases',
      description: 'Switch from streaming to the latest big-screen Telugu movies.',
      cta: 'Browse Theatres',
    },
  ];

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
    })),
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

      <main className="netflix-home">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Latest OTT Releases' }]} />
        </div>

        <section className="nf-hero">
          {heroMovie ? (
            <div className="nf-hero__bg">
              <Image
                src={toBackdropUrl(heroMovie) || toPosterUrl(heroMovie)}
                alt={heroTitle}
                fill
                priority
                sizes="100vw"
                className="nf-hero__bg-image"
              />
            </div>
          ) : null}
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">SV Telugu OTT</p>
            <h1>{heroTitle}</h1>
            <p className="nf-hero__desc">{heroDescription}</p>
            <div className="nf-hero__meta">
              <span>{heroMovie?.streaming_partner || 'Multi-platform'}</span>
              <span>{formatReleaseDate(heroMovie?.digital_release_date)}</span>
              {heroMovie && (getPreferredMovieRating(heroMovie) || 0) > 0 ? (
                <span>{getPreferredMovieRating(heroMovie).toFixed(1)}/10</span>
              ) : null}
              {heroMovie ? (
                <span>{formatCompactVoteCount(getTmdbVoteCountValue(heroMovie)) || 'Popular pick'}</span>
              ) : null}
            </div>
            <div className="nf-hero__actions">
              <Link href="/telugu-ott-releases-this-week" className="nf-btn nf-btn--primary">
                Explore This Week
              </Link>
              <Link href="/browse/trending-now" className="nf-btn nf-btn--ghost">
                View Top Picks
              </Link>
            </div>
          </div>
        </section>

        <div className="nf-content">
          <section className="nf-explore">
            <div className="nf-explore__header">
              <h2>Explore More</h2>
            </div>
            <div className="nf-explore__grid">
              <Link href="/telugu-ott-releases-this-week" className="nf-explore__card">
                <span>This Week</span>
                <h3>New Telugu OTT Releases</h3>
                <p>Only movies releasing in the next 7 days.</p>
              </Link>
              <Link href="/top-rated-telugu-ott-movies" className="nf-explore__card">
                <span>Top Rated</span>
                <h3>Best Telugu OTT Movies</h3>
                <p>Highest-rated titles from your library.</p>
              </Link>
              <Link href="/theatre-release" className="nf-explore__card">
                <span>Theatres</span>
                <h3>Latest Theatre Releases</h3>
                <p>Track new big-screen Telugu movies.</p>
              </Link>
              <Link href="/blog" className="nf-explore__card">
                <span>Editorial</span>
                <h3>News and Stories</h3>
                <p>Updates and explainers from the site.</p>
              </Link>
            </div>
          </section>

          {editorialCollections.length > 0 ? (
            <section className="nf-genre">
              <div className="nf-genre__header">
                <h2>Browse by Genre</h2>
              </div>
              <div className="nf-genre__grid">
                {editorialCollections.map((collection) => (
                  <Link key={collection.slug} href={collection.href} className="nf-genre__card">
                    <span>{collection.shortLabel}</span>
                    <h3>{collection.title}</h3>
                    <p>{collection.movieCount} rated movies</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <MovieRail
            title="Trending Now"
            movies={moduleTrendingMovies.slice(0, 20).map(withDisplayFields)}
            viewAllHref="/browse/trending-now"
            signal="trending"
          />
          <MovieRail
            title="Coming This Week"
            movies={weekendReleases.slice(0, 20).map(withDisplayFields)}
            signal="week"
          />
          <MovieRail
            title="Recently Added"
            movies={recentlyAddedMovies.slice(0, 20).map(withDisplayFields)}
            viewAllHref="/browse/recently-added"
            signal="recent"
          />

          <section className="nf-table">
            <section className="nf-controls" aria-label="Browse filters">
              <div className="nf-platforms">
                {platformOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`nf-chip ${selectedPlatform === option.value ? 'is-active' : ''}`}
                    onClick={() => setSelectedPlatform(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <label className="nf-sort">
                <span>Sort</span>
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                  <option value="desc">Newest</option>
                  <option value="asc">Oldest</option>
                </select>
              </label>
            </section>

            <div className="nf-table__head">
              <h2>All Releases</h2>
              <span>{loading ? 'Loading...' : `${filteredMovies.length} titles`}</span>
            </div>
            <div className="nf-table__wrap">
              <table>
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
                  {filteredMovies.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="nf-table__empty">
                        {loading ? 'Loading OTT releases...' : 'No results here yet. Fresh Telugu OTT releases are coming soon.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMovies.map((movie) => {
                      const movieUrl = `/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`;
                      return (
                      <tr
                        key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}
                      >
                        <td>
                          <Link href={movieUrl} className="nf-table__movie">
                            {movie.movie_name || 'Untitled'}
                          </Link>
                        </td>
                        <td>{formatReleaseDate(movie.digital_release_date)}</td>
                        <td>{movie.streaming_partner || 'TBA'}</td>
                        <td>{movie.language || movie.movie_language || 'Telugu'}</td>
                        <td>{movie.category || 'Film'}</td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <MovieRail
            title="Upcoming Theatre Releases"
            movies={theatreMovies.slice(0, 20)}
            type="theatre"
            viewAllHref="/theatre-release"
            signal="trending"
          />

          <ContinueBrowsing
            title="Continue Browsing"
            description="Every section should lead to the next watchlist. Pick where you want to go next."
            items={retentionItems}
          />
        </div>

        {loading ? <p className="nf-status">Loading OTT releases...</p> : null}
        {error ? <p className="nf-status nf-status--error">{error}</p> : null}
      </main>
    </Layout>
  );
}
