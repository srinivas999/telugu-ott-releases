import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Breadcrumb from '../../components/common/Breadcrumb';
import { supabase } from '../../lib/supabaseClient';
import {
  normalizePlatform,
  PLATFORM_DIRECTORY,
} from '../../lib/utils/platforms';
import { getPreferredMovieRating, withPreferredMovieRating } from '../../lib/utils/ratings';
import { generateUniqueSlug } from '../../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

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

function toPosterUrl(movie) {
  if (!movie?.poster_path) return '/images/default_poster.png';
  if (String(movie.poster_path).startsWith('http')) return movie.poster_path;
  return `${TMDB_POSTER_BASE}${movie.poster_path}`;
}

function toBackdropUrl(movie) {
  const path = movie?.backdrop_path || movie?.poster_path;
  if (!path) return '/images/default_poster.png';
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

export default function PlatformPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const platformMeta = slug ? PLATFORM_DIRECTORY.find((platform) => platform.slug === slug) || null : null;
  const platformName = platformMeta?.name || '';
  const safePlatformName = platformName || 'Platform';

  useEffect(() => {
    if (!slug) return;

    async function loadMovies() {
      if (!supabase) {
        setError('Supabase is not configured. Movies will not load until environment variables are set.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const { data, error: fetchError } = await supabase
          .from('ott_movies')
          .select('*')
          .order('digital_release_date', { ascending: false });

        if (fetchError) throw fetchError;
        const normalizedMovies = (data || [])
          .map((movie) => ({
            ...withPreferredMovieRating(movie),
            streaming_partner: normalizePlatform(movie.streaming_partner),
          }))
          .filter((movie) => movie.streaming_partner === platformName);
        setMovies(normalizedMovies);
      } catch (fetchError) {
        console.error('Fetch platform movies error:', fetchError);
        setError('Unable to load movies right now. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [slug, platformName]);

  const featured = useMemo(() => movies[0] || null, [movies]);
  const directoryPlatforms = useMemo(
    () => PLATFORM_DIRECTORY.filter((platform) => platform.slug !== slug).slice(0, 6),
    [slug]
  );

  return (
    <Layout>
      <Seo
        title={`What's New on ${safePlatformName} | Telugu Movies`}
        description={`Browse Telugu movies available on ${safePlatformName}, with latest tracked releases, release dates, and direct movie pages.`}
        url={slug ? `/platform/${slug}` : '/ott-movies'}
        keywords={`${safePlatformName} Telugu movies, what's new on ${safePlatformName}, ${safePlatformName} OTT`}
      />

      <main className="netflix-home platform-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'OTT Movies', url: '/ott-movies' },
              { name: safePlatformName },
            ]}
          />
        </div>

        <section className="nf-hero">
          {featured ? (
            <div className="nf-hero__bg">
              <Image
                src={toBackdropUrl(featured)}
                alt={featured.movie_name || 'Featured movie'}
                fill
                priority
                sizes="100vw"
                className="nf-hero__bg-image"
              />
            </div>
          ) : null}
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">Platform Spotlight</p>
            <h1>What&apos;s New on {safePlatformName}?</h1>
            <p className="nf-hero__desc">Discover the latest tracked Telugu movies on {safePlatformName}, with release dates and direct movie pages.</p>
            <div className="nf-hero__meta">
              <span>{loading ? 'Loading...' : `${movies.length} movies`}</span>
              {featured?.digital_release_date ? <span>{formatReleaseDate(featured.digital_release_date)}</span> : null}
              {featured && (getPreferredMovieRating(featured) || 0) > 0 ? (
                <span>{getPreferredMovieRating(featured).toFixed(1)}/10</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="nf-content">
          <section className="nf-platform-jump">
            <div className="nf-platform-jump__header">
              <h2>Browse Other Platforms</h2>
              <p>Switch services quickly when the title you want is on another app.</p>
            </div>
            <div className="nf-platform-jump__row">
              {directoryPlatforms.map((platform) => (
                <Link
                  key={platform.slug}
                  href={`/platform/${platform.slug}`}
                  className="nf-platform-jump__chip"
                  style={{ '--platform-accent': platform.color }}
                >
                  {platform.name}
                </Link>
              ))}
            </div>
          </section>

          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>{safePlatformName} Releases</h2>
            </div>
            {error ? (
              <p className="nf-status nf-status--error">{error}</p>
            ) : loading ? (
              <p className="nf-status">Loading {safePlatformName} movies...</p>
            ) : movies.length === 0 ? (
              <p className="nf-status">No movies found on {safePlatformName}.</p>
            ) : (
              <div className="nf-collection__grid">
                {movies.map((movie) => {
                  const movieSlug = generateUniqueSlug(movie.movie_name, movie.id);
                  return (
                    <Link key={movie.id} href={`/movie/${movieSlug}`} className="nf-card">
                      <div className="nf-card__poster">
                        <Image
                          src={toPosterUrl(movie)}
                          alt={movie.movie_name || 'Movie'}
                          fill
                          sizes="(max-width: 640px) 44vw, (max-width: 980px) 22vw, 15vw"
                          className="nf-card__image"
                        />
                        {(getPreferredMovieRating(movie) || 0) > 0 ? (
                          <span className="nf-card__rating">{getPreferredMovieRating(movie).toFixed(1)}</span>
                        ) : null}
                      </div>
                      <div className="nf-card__meta">
                        <h3>{movie.movie_name || 'Untitled'}</h3>
                        <p>{formatReleaseDate(movie.digital_release_date)} - {safePlatformName}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </Layout>
  );
}
