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
} from '../lib/hooks/useMovies';
import {
  buildPlatformSpotlights,
  getKnownPlatformNames,
  getPlatformFilterOptions,
  getPlatformHref,
  normalizePlatform,
} from '../lib/utils/platforms';
import { formatCompactVoteCount, getPreferredMovieRating, getTmdbVoteCountValue } from '../lib/utils/ratings';
import { getAvailableEditorialCollections } from '../lib/utils/editorialCollections';
import { generateCollectionPageSchema, generateItemListSchema } from '../lib/utils/schema';
import { generateUniqueSlug } from '../lib/utils/slug';
import { withStoredTmdbDetails } from '../lib/utils/tmdb';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const FALLBACK_POSTER = '/images/default_poster.png';

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
  if (type === 'theatre') return 'Popular This Week';
  if (!movie?.poster_path) return '';
  const rating = getPreferredMovieRating(movie) || movie.vote_average || 0;
  if (rating >= 8) return 'Top Rated';
  return 'Streaming';
}

function getTrustSignal(signal = '', type = 'ott') {
  if (signal === 'trending') return 'Popular this week';
  if (signal === 'week') return 'Trending now';
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

function sortByRating(movies) {
  return [...movies].sort((firstMovie, secondMovie) => {
    const firstRating = getPreferredMovieRating(firstMovie) || 0;
    const secondRating = getPreferredMovieRating(secondMovie) || 0;

    if (secondRating !== firstRating) {
      return secondRating - firstRating;
    }

    const firstTime = new Date(`${firstMovie.digital_release_date || ''}T00:00:00`).getTime();
    const secondTime = new Date(`${secondMovie.digital_release_date || ''}T00:00:00`).getTime();
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) return 0;
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
  const platformOptions = useMemo(() => getPlatformFilterOptions(), []);
  const [ottMovies, setOttMovies] = useState([]);
  const [theatreMovies, setTheatreMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState('');

  const { movies: moduleTrendingMovies } = useTrendingMovies(16);
  const { movies: weekReleases } = useReleasingThisWeek();

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
    const knownPlatformNames = getKnownPlatformNames();
    const filtered = ottMovies.filter((movie) => {
      const normalized = normalizePlatform(movie.streaming_partner);
      if (selectedPlatform === 'all') return true;
      if (selectedPlatform === 'other') return !knownPlatformNames.includes(normalized);
      return normalized === selectedPlatform;
    });

    return sortByReleaseDate(filtered, sortOrder);
  }, [ottMovies, selectedPlatform, sortOrder]);

  const editorialCollections = useMemo(
    () => getAvailableEditorialCollections(ottMovies, 10).slice(0, 6),
    [ottMovies]
  );
  const topGenresText = useMemo(
    () => editorialCollections.slice(0, 3).map((collection) => collection.shortLabel).join(', '),
    [editorialCollections]
  );
  const platformSections = useMemo(
    () => [
      {
        title: 'Netflix Releases',
        viewAllHref: '/platform/netflix',
        movies: sortByReleaseDate(
          ottMovies.filter((movie) => normalizePlatform(movie.streaming_partner) === 'Netflix'),
          'desc'
        ).slice(0, 18),
      },
      {
        title: 'Aha Releases',
        viewAllHref: '/platform/aha',
        movies: sortByReleaseDate(
          ottMovies.filter((movie) => normalizePlatform(movie.streaming_partner) === 'Aha'),
          'desc'
        ).slice(0, 18),
      },
      {
        title: 'Prime Video Releases',
        viewAllHref: '/platform/prime-video',
        movies: sortByReleaseDate(
          ottMovies.filter((movie) => normalizePlatform(movie.streaming_partner) === 'Prime Video'),
          'desc'
        ).slice(0, 18),
      },
    ].filter((section) => section.movies.length > 0),
    [ottMovies]
  );
  const genreSections = useMemo(
    () => editorialCollections
      .slice(0, 4)
      .map((collection) => ({
        title: collection.shortLabel,
        viewAllHref: collection.href,
        movies: (collection.movies || []).slice(0, 12).map(withDisplayFields),
      }))
      .filter((section) => section.movies.length > 0),
    [editorialCollections]
  );
  const topRatedMovies = useMemo(
    () => sortByRating(
      ottMovies.filter((movie) => (getPreferredMovieRating(movie) || 0) > 0)
    ).slice(0, 20),
    [ottMovies]
  );
  const platformSpotlights = useMemo(() => buildPlatformSpotlights(ottMovies, 6), [ottMovies]);

  const heroMovie = moduleTrendingMovies[0] || weekReleases[0] || filteredMovies[0] || null;
  const heroTitle = heroMovie?.movie_name || heroMovie?.title || 'Telugu OTT Releases';
  const heroDescription =
    heroMovie?.overview ||
    'Discover the latest Telugu OTT drops, trending movies, and this week releases across every major streaming platform.';
  const heroPlatformHref = heroMovie?.streaming_partner ? getPlatformHref(heroMovie.streaming_partner, '') : '';
  const retentionItems = [
    {
      href: '/browse/trending-now',
      eyebrow: 'Next Click',
      title: 'Because you viewed trending Telugu OTT releases',
      description: 'Stay in the same discovery mood and jump into the titles most likely to earn the next click.',
      cta: 'Open Trending',
    },
    {
      href: platformSpotlights[0]?.href || '/platform/netflix',
      eyebrow: 'Platform Jump',
      title: `Because you viewed ${platformSpotlights[0]?.name || 'platform'} releases`,
      description: 'Keep browsing inside one app feed instead of resetting back to the full archive.',
      cta: 'Open Platform',
    },
    {
      href: '/telugu-ott-releases-this-week',
      eyebrow: 'Fresh Loop',
      title: 'Because you viewed the latest drops',
      description: 'Continue into the weekly release calendar and keep the session anchored in freshness.',
      cta: 'See This Week',
    },
    {
      href: '/top-rated-telugu-ott-movies',
      eyebrow: 'Quality Loop',
      title: 'Because you viewed what is new',
      description: 'Switch from recency to quality and keep exploring the strongest Telugu OTT titles.',
      cta: 'View Top Rated',
    },
  ];

  const seoDescription = [
    `Track ${ottMovies.length || 'latest'} Telugu OTT releases with streaming dates, platform updates, and direct movie pages.`,
    topGenresText ? `Browse ${topGenresText} collections, top-rated picks, and this week releases.` : '',
  ].filter(Boolean).join(' ');
  const jsonLd = [
    generateCollectionPageSchema({
      name: 'Latest Telugu OTT Releases',
      description: seoDescription,
      url: '/',
    }),
    generateItemListSchema({
      title: 'Latest Telugu OTT Releases',
      items: filteredMovies.slice(0, 10),
      url: '/',
    }),
  ];

  return (
    <Layout>
      <Seo
        title="Latest Telugu OTT releases, streaming dates and movie updates"
        description={seoDescription}
        url="/"
        keywords="Telugu OTT releases this week, upcoming OTT movies Telugu, Netflix Telugu, Aha Telugu, Prime Video Telugu, JioHotstar Telugu, Zee5 Telugu, Sun NXT Telugu, ETV Win Telugu"
        jsonLd={jsonLd}
      />

      <main className="netflix-home">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Latest OTT Releases' }]} />
        </div>

        <section className="nf-hero nf-hero--compact">
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
              {heroPlatformHref ? (
                <Link href={heroPlatformHref} className="nf-btn nf-btn--ghost">
                  What&apos;s New on {heroMovie?.streaming_partner}
                </Link>
              ) : (
                <Link href="/browse/trending-now" className="nf-btn nf-btn--ghost">
                  View Trending
                </Link>
              )}
            </div>
          </div>
        </section>

        <div className="nf-content">
          <MovieRail
            title="Trending Now"
            movies={moduleTrendingMovies.slice(0, 20).map(withDisplayFields)}
            viewAllHref="/browse/trending-now"
            signal="trending"
          />

          <MovieRail
            title="Released This Week"
            movies={weekReleases.slice(0, 20).map(withDisplayFields)}
            viewAllHref="/telugu-ott-releases-this-week"
            signal="week"
          />

          {platformSections.map((section) => (
            <MovieRail
              key={section.title}
              title={section.title}
              movies={section.movies}
              viewAllHref={section.viewAllHref}
            />
          ))}

          {genreSections.map((section) => (
            <MovieRail
              key={section.title}
              title={section.title}
              movies={section.movies}
              viewAllHref={section.viewAllHref}
            />
          ))}

          <MovieRail
            title="Top Rated"
            movies={topRatedMovies.map(withDisplayFields)}
            viewAllHref="/top-rated-telugu-ott-movies"
            signal="trending"
          />

          <ContinueBrowsing
            title="Because You Viewed"
            description="The home page should hand off to the next browsing path instead of ending at one row."
            items={retentionItems}
          />

          {platformSpotlights.length > 0 ? (
            <section className="nf-platform-hub">
              <div className="nf-platform-hub__header">
                <h2>Platform Shortcuts</h2>
                <p>
                  Jump directly into Netflix, Aha, Prime Video, JioHotstar, and more when you already know which app you want to open next.
                </p>
              </div>
              <div className="nf-platform-hub__grid">
                {platformSpotlights.map((platform) => (
                  <Link
                    key={platform.slug}
                    href={platform.href}
                    className="nf-platform-hub__card"
                    style={{ '--platform-accent': platform.color }}
                  >
                    <span className="nf-platform-hub__eyebrow">{platform.name}</span>
                    <h3>What&apos;s new on {platform.name}?</h3>
                    <p>
                      {platform.movieCount} Telugu release{platform.movieCount !== 1 ? 's' : ''} tracked
                      {platform.latestMovie?.digital_release_date ? ` · latest ${formatReleaseDate(platform.latestMovie.digital_release_date)}` : ''}.
                    </p>
                    <strong>{platform.latestMovie?.movie_name || `Open ${platform.name}`}</strong>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

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
                        <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}>
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
                      );
                    })
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
        </div>

        {loading ? <p className="nf-status">Loading OTT releases...</p> : null}
        {error ? <p className="nf-status nf-status--error">{error}</p> : null}
      </main>
    </Layout>
  );
}
