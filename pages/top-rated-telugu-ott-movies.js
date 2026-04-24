import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import { supabase } from '../lib/supabaseClient';
import { generateUniqueSlug } from '../lib/utils/slug';

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
    .limit(30);

  const movies = (data || []).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  return {
    props: { movies },
    revalidate: 3600,
  };
}

export default function TopRatedTeluguOttMoviesPage({ movies = [] }) {
  const title = 'Top Rated Telugu OTT Movies';
  const description = 'Browse the highest rated Telugu OTT movies from the Telugu OTT Releases database, sorted by rating and release freshness.';
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
        aggregateRating: movie.rating
          ? {
              '@type': 'AggregateRating',
              ratingValue: movie.rating,
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
        url="/top-rated-telugu-ott-movies"
        keywords="top rated Telugu OTT movies, best Telugu OTT movies, highest rated Telugu streaming movies"
        jsonLd={jsonLd}
      />

      <Breadcrumb
        items={[
          { name: 'Home', url: '/' },
          { name: 'OTT Movies', url: '/ott-movies' },
          { name: 'Top Rated' },
        ]}
      />

      <main className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="ott-hero">
            <div className="ott-hero__panel">
              <h1>{title}</h1>
              <p className="ott-hero__tagline">
                Discover the highest rated Telugu OTT movies currently available in the Telugu OTT Releases database.
              </p>
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <h2>Best Rated Telugu Movies on OTT</h2>
            </div>
            <p>
              This page highlights the strongest rated Telugu OTT titles, helping users quickly find standout releases without filtering through the full schedule.
            </p>
            <p>
              For upcoming titles, also check <Link href="/telugu-ott-releases-this-week">Telugu OTT releases this week</Link> and the complete <Link href="/ott-movies">OTT movie archive</Link>.
            </p>
          </section>

          <section className="ott-movies-grid">
            {movies.length === 0 ? (
              <div className="ott-movies-empty">No rated Telugu OTT movies are available right now.</div>
            ) : (
              movies.map((movie) => {
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
                        {Number(movie.rating) > 0 ? (
                          <span className="ott-movie-card-v2__rating-badge">{Number(movie.rating).toFixed(1)}</span>
                        ) : null}
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
        </div>
      </main>
    </Layout>
  );
}
