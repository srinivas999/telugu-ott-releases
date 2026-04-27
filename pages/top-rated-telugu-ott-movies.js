import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import { supabase } from '../lib/supabaseClient';
import { getPreferredMovieRating, withPreferredMovieRating } from '../lib/utils/ratings';
import { generateUniqueSlug } from '../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

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

export async function getStaticProps() {
  if (!supabase) {
    return { props: { movies: [] }, revalidate: 3600 };
  }

  const { data } = await supabase
    .from('ott_movies')
    .select('*')
    .not('rating', 'is', null)
    .gt('rating', 0)
    .order('rating', { ascending: false })
    .order('digital_release_date', { ascending: false })
    .limit(60);

  const movies = (data || []).map((movie) => ({
    ...withPreferredMovieRating(movie),
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  return { props: { movies }, revalidate: 3600 };
}

export default function TopRatedTeluguOttMoviesPage({ movies = [] }) {
  const title = 'Top Rated Telugu OTT Movies';
  const description = 'Browse highest rated Telugu OTT movies from the Telugu OTT database.';
  const featured = movies[0] || null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    itemListElement: movies.slice(0, 20).map((movie, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Movie',
        name: movie.movie_name || 'Untitled',
        datePublished: movie.digital_release_date || '',
        aggregateRating: getPreferredMovieRating(movie)
          ? { '@type': 'AggregateRating', ratingValue: getPreferredMovieRating(movie), bestRating: 10 }
          : undefined,
        url: `https://svteluguott.in/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`,
      },
    })),
  };

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        url="/top-rated-telugu-ott-movies"
        keywords="top rated Telugu OTT movies, best Telugu OTT movies, highest rated Telugu streaming movies"
        jsonLd={jsonLd}
      />

      <main className="netflix-home top-rated-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'OTT Movies', url: '/ott-movies' },
              { name: 'Top Rated' },
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
            <p className="nf-hero__kicker">Top Rated</p>
            <h1>{title}</h1>
            <p className="nf-hero__desc">
              Discover the strongest Telugu OTT picks ranked by ratings and release freshness.
            </p>
            <div className="nf-hero__meta">
              <span>{movies.length} movies</span>
              {featured ? <span>{featured.streaming_partner || 'OTT'}</span> : null}
              {featured && (getPreferredMovieRating(featured) || 0) > 0 ? (
                <span>{getPreferredMovieRating(featured).toFixed(1)}/10</span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="nf-content">
          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>All Top Rated ({movies.length})</h2>
            </div>
            {movies.length === 0 ? (
              <p className="nf-status">No rated Telugu OTT movies are available right now.</p>
            ) : (
              <div className="nf-collection__grid">
                {movies.map((movie) => {
                  const movieSlug = generateUniqueSlug(movie.movie_name, movie.id);
                  return (
                    <Link key={movie.id || movieSlug} href={`/movie/${movieSlug}`} className="nf-card">
                      <div className="nf-card__poster">
                        <Image
                          src={toPosterUrl(movie)}
                          alt={`${movie.movie_name || 'Movie'} poster`}
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
                        <p>{movie.streaming_partner || 'OTT'} - {formatReleaseDate(movie.digital_release_date)}</p>
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
