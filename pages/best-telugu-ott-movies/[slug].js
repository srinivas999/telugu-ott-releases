import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Breadcrumb from '../../components/common/Breadcrumb';
import { supabase } from '../../lib/supabaseClient';
import { getOmdbRatingValue } from '../../lib/utils/ratings';
import {
  getAvailableEditorialCollections,
  getCollectionDefinition,
  getCollectionMovies,
  getMovieGenreNames,
} from '../../lib/utils/editorialCollections';
import { generateUniqueSlug } from '../../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const FALLBACK_POSTER = '/images/default_poster.png';

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
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function toPosterUrl(movie) {
  if (!movie?.poster_path) return FALLBACK_POSTER;
  if (String(movie.poster_path).startsWith('http')) return movie.poster_path;
  return `${TMDB_POSTER_BASE}${movie.poster_path}`;
}

function toBackdropUrl(movie) {
  const path = movie?.backdrop_path || movie?.poster_path;
  if (!path) return FALLBACK_POSTER;
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

export async function getServerSideProps({ params }) {
  if (!supabase) {
    return { notFound: true };
  }

  const collection = getCollectionDefinition(params.slug);
  if (!collection) {
    return { notFound: true };
  }

  const { data } = await supabase
    .from('ott_movies')
    .select('*')
    .order('digital_release_date', { ascending: false });

  const allMovies = data || [];
  const movies = getCollectionMovies(allMovies, collection.slug, 40).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
    imdbRating: getOmdbRatingValue(movie),
  }));

  const relatedCollections = getAvailableEditorialCollections(allMovies, 10)
    .filter((item) => item.slug !== collection.slug)
    .slice(0, 6)
    .map((item) => ({
      slug: item.slug,
      shortLabel: item.shortLabel,
      title: item.title,
      href: item.href,
      movieCount: item.movieCount,
    }));

  return {
    props: {
      collection,
      movies,
      relatedCollections,
    },
  };
}

export default function BestTeluguOttCollectionPage({
  collection,
  movies = [],
  relatedCollections = [],
}) {
  const title = collection?.title || 'Best Telugu OTT Movies';
  const description = collection?.description || 'Discover curated Telugu OTT movie picks ranked by IMDb rating.';
  const featuredMovie = movies[0] || null;
  const featuredMovieSlug = featuredMovie
    ? generateUniqueSlug(featuredMovie.movie_name, featuredMovie.id)
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    itemListElement: movies.map((movie, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Movie',
        name: movie.movie_name || 'Untitled',
        genre: getMovieGenreNames(movie),
        datePublished: movie.digital_release_date || '',
        aggregateRating: movie.imdbRating
          ? {
              '@type': 'AggregateRating',
              ratingValue: movie.imdbRating,
              bestRating: 10,
            }
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
        url={`/best-telugu-ott-movies/${collection.slug}`}
        keywords={`${collection.shortLabel}, Telugu OTT movies, IMDb rated Telugu movies, Telugu streaming movies`}
        jsonLd={jsonLd}
      />

      <main className="netflix-home nf-collection-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'Best Telugu OTT Movies' },
              { name: collection.shortLabel },
            ]}
          />
        </div>

        <section className="nf-collection-hero">
          <div className="nf-content">
            <div className="nf-collection-hero__panel">
              {featuredMovie ? (
                <div className="nf-collection-hero__background" aria-hidden="true">
                  <Image
                    src={toBackdropUrl(featuredMovie)}
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="nf-collection-hero__background-image"
                  />
                </div>
              ) : null}
              <div className="nf-collection-hero__scrim" aria-hidden="true" />
              <div className="nf-collection-hero__copy">
                <p className="nf-hero__kicker">{collection.shortLabel}</p>
                <h1>{title}</h1>
                <p className="nf-hero__desc">{collection.intro || description}</p>
                <div className="nf-hero__meta">
                  <span>{movies.length} curated picks</span>
                  <span>IMDb focused</span>
                  <span>Telugu OTT only</span>
                </div>
                <div className="nf-hero__actions">
                  <a href="#collection-list" className="nf-btn nf-btn--primary">Browse List</a>
                  {featuredMovie ? (
                    <Link href={`/movie/${featuredMovieSlug}`} className="nf-btn nf-btn--ghost">
                      Open Top Pick
                    </Link>
                  ) : null}
                </div>
              </div>

              {featuredMovie ? (
                <Link href={`/movie/${featuredMovieSlug}`} className="nf-collection-hero__top-pick">
                  <span className="nf-collection-hero__top-pick-label">Top Pick</span>
                  <h2>{featuredMovie.movie_name || 'Untitled'}</h2>
                  <p>{featuredMovie.imdbRating ? featuredMovie.imdbRating.toFixed(1) : 'NR'}/10 IMDb</p>
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="nf-content">
          <section id="collection-list" className="nf-rail">
            <div className="nf-rail__header">
              <h2>{collection.sectionHeading || title}</h2>
              <span className="nf-collection-count">{movies.length} movies</span>
            </div>
            <p className="nf-collection-copy">{collection.sectionText || description}</p>
            <div className="nf-collection__grid">
              {movies.length === 0 ? (
                <p className="nf-status">{collection.emptyMessage || 'No IMDb-rated Telugu OTT movies in this genre right now.'}</p>
              ) : (
                movies.map((movie, index) => {
                  const movieSlug = generateUniqueSlug(movie.movie_name, movie.id);
                  return (
                    <Link key={movie.id || movieSlug} href={`/movie/${movieSlug}`} className="nf-card">
                      <div className="nf-card__poster">
                        <Image
                          src={toPosterUrl(movie)}
                          alt={`${movie.movie_name || 'Movie'} poster`}
                          fill
                          sizes="(max-width: 640px) 44vw, (max-width: 980px) 24vw, 15vw"
                          className="nf-card__image"
                        />
                        <span className="nf-card__rating">
                          {(movie.imdbRating || 0) > 0 ? movie.imdbRating.toFixed(1) : 'NR'}
                        </span>
                        <span className="nf-collection-rank">#{index + 1}</span>
                      </div>
                      <div className="nf-card__meta">
                        <h3>{movie.movie_name || 'Untitled'}</h3>
                        <p>{movie.streaming_partner || 'OTT'} - {formatReleaseDate(movie.digital_release_date)}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </section>

          {relatedCollections.length > 0 ? (
            <section className="nf-genre">
              <div className="nf-genre__header">
                <h2>Explore More Genres</h2>
              </div>
              <div className="nf-genre__grid">
                {relatedCollections.map((item) => (
                  <Link key={item.slug} href={item.href} className="nf-genre__card">
                    <span>{item.shortLabel}</span>
                    <h3>{item.title}</h3>
                    <p>{item.movieCount} IMDb-rated OTT movies available right now.</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </Layout>
  );
}
