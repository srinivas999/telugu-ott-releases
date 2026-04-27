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
  const movies = getCollectionMovies(allMovies, collection.slug, 10).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
    imdbRating: getOmdbRatingValue(movie),
  }));
  const relatedCollections = getAvailableEditorialCollections(allMovies, 10)
    .filter((item) => item.slug !== collection.slug)
    .slice(0, 4)
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
  const featuredMovieSlug = featuredMovie ? generateUniqueSlug(featuredMovie.movie_name, featuredMovie.id) : null;
  const featuredPosterUrl = featuredMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${featuredMovie.poster_path}`
    : '/images/default_poster.png';
  const collectionTheme = {
    '--collection-accent': collection?.accentColor || '#4f46e5',
    '--collection-accent-soft': collection?.accentSoft || 'rgba(79, 70, 229, 0.14)',
    '--collection-glow': collection?.glowColor || 'rgba(79, 70, 229, 0.18)',
  };

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

      <Breadcrumb
        items={[
          { name: 'Home', url: '/' },
          { name: 'Best Telugu OTT Movies' },
          { name: collection.shortLabel },
        ]}
      />

      <main className="page-projects page-ott ott-collection-page" style={collectionTheme}>
        <div className="projects-page-inner">
          <section className="ott-hero ott-collection-hero">
            <div className="ott-collection-hero__inner">
              <div className="ott-collection-hero__copy">
                <p className="eyebrow">{collection.shortLabel}</p>
                <h1>{title}</h1>
                <p className="ott-hero__tagline">
                  {collection.intro}
                </p>
                <div className="ott-collection-hero__meta">
                  <span>{movies.length} curated picks</span>
                  <span>IMDb ranked</span>
                  <span>Updated from OTT database</span>
                </div>
                <div className="ott-collection-hero__actions">
                  <a href="#collection-list" className="ott-collection-hero__action ott-collection-hero__action--primary">
                    Browse the list
                  </a>
                  {featuredMovie ? (
                    <Link href={`/movie/${featuredMovieSlug}`} className="ott-collection-hero__action ott-collection-hero__action--secondary">
                      Open top pick
                    </Link>
                  ) : null}
                </div>
              </div>

              {featuredMovie ? (
                <Link href={`/movie/${featuredMovieSlug}`} className="ott-collection-hero__visual">
                  <div className="ott-collection-hero__poster">
                    <Image
                      src={featuredPosterUrl}
                      alt={`${featuredMovie.movie_name || 'Movie'} poster`}
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, 280px"
                      className="ott-collection-hero__poster-image"
                    />
                    <div className="ott-collection-hero__poster-badge">
                      <span>{featuredMovie.streaming_partner || 'OTT'}</span>
                      <strong>{featuredMovie.imdbRating.toFixed(1)}</strong>
                    </div>
                  </div>
                  <div className="ott-collection-hero__visual-copy">
                    <span className="ott-collection-hero__visual-label">Top Pick</span>
                    <h2>{featuredMovie.movie_name || 'Untitled'}</h2>
                    <p>{featuredMovie.imdbRating.toFixed(1)}/10 on IMDb</p>
                  </div>
                </Link>
              ) : null}
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <h2>{collection.sectionHeading || title}</h2>
            </div>
            <p>
              {collection.sectionText || description}
            </p>
            <p>
              For more Telugu OTT picks, browse <Link href="/top-rated-telugu-ott-movies">top rated Telugu OTT movies</Link> and the full <Link href="/ott-movies">OTT movie list</Link>.
            </p>
          </section>

          <section id="collection-list" className="ott-movies-grid">
            {movies.length === 0 ? (
              <div className="ott-movies-empty">{collection.emptyMessage || 'No IMDb-rated Telugu OTT movies match this collection right now.'}</div>
            ) : (
              movies.map((movie, index) => {
                const movieSlug = generateUniqueSlug(movie.movie_name, movie.id);
                const posterUrl = movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                  : '/images/default_poster.png';

                return (
                  <Link key={movie.id || movieSlug} href={`/movie/${movieSlug}`} className="ott-movie-card-link">
                    <article className="ott-movie-card-v2">
                      <div className="ott-movie-card-v2__poster-wrap">
                        <Image
                          src={posterUrl}
                          alt={`${movie.movie_name || 'Movie'} poster`}
                          className="ott-movie-card-v2__poster"
                          fill
                          sizes="(max-width: 400px) 100vw, (max-width: 640px) 50vw, (max-width: 1200px) 25vw, 200px"
                        />
                        <span className="ott-movie-card-v2__platform-badge">
                          {movie.streaming_partner || 'TBA'}
                        </span>
                        <span className="ott-movie-card-v2__rating-badge">{movie.imdbRating.toFixed(1)}</span>
                        <span className="ott-collection-rank-badge">#{index + 1}</span>
                      </div>
                      <div className="ott-movie-card-v2__info">
                        <h3 className="ott-movie-card-v2__title">{movie.movie_name || 'Untitled'}</h3>
                        <div className="ott-movie-card-v2__meta-row">
                          <span className="ott-movie-card-v2__date">{formatReleaseDate(movie.digital_release_date)}</span>
                          <span className="ott-movie-card-v2__divider" />
                          <span className="ott-movie-card-v2__lang">{movie.language || movie.movie_language || 'Telugu'}</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })
            )}
          </section>

          {relatedCollections.length > 0 ? (
            <section className="ott-section ott-genre-discovery">
              <div className="section-heading">
                <p className="eyebrow">More Genres</p>
                <h2>Explore more Telugu OTT genres</h2>
              </div>
              <div className="ott-genre-discovery__grid">
                {relatedCollections.map((item) => (
                  <Link key={item.slug} href={item.href} className="ott-genre-discovery__card">
                    <span className="ott-genre-discovery__badge">{item.shortLabel}</span>
                    <h3>{item.title}</h3>
                    <p>{item.movieCount} IMDb-rated OTT movies available right now.</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </Layout>
  );
}
