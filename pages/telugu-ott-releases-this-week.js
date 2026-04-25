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
    return { props: { movies: [], weekRange: null }, revalidate: 3600 };
  }

  const today = new Date();
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const todayStr = today.toISOString().split('T')[0];
  const weekStr = weekFromNow.toISOString().split('T')[0];

  const { data } = await supabase
    .from('ott_movies')
    .select('*')
    .gte('digital_release_date', todayStr)
    .lte('digital_release_date', weekStr)
    .order('digital_release_date', { ascending: true });

  const movies = (data || []).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  return {
    props: {
      movies,
      weekRange: {
        start: todayStr,
        end: weekStr,
      },
    },
    revalidate: 3600,
  };
}

export default function TeluguOttReleasesThisWeekPage({ movies = [], weekRange }) {
  const title = 'Telugu OTT Releases This Week';
  const description = 'See Telugu OTT releases this week with streaming platforms, release dates, and direct links to movie detail pages.';
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
        url: `https://svteluguott.in/movie/${generateUniqueSlug(movie.movie_name, movie.id)}`,
      },
    })),
  };

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        url="/telugu-ott-releases-this-week"
        keywords="Telugu OTT releases this week, weekly Telugu OTT releases, new Telugu OTT movies this week"
        jsonLd={jsonLd}
      />

      <Breadcrumb
        items={[
          { name: 'Home', url: '/' },
          { name: 'OTT Movies', url: '/ott-movies' },
          { name: 'This Week' },
        ]}
      />

      <main className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="ott-hero">
            <div className="ott-hero__panel">
              <h1>{title}</h1>
              <p className="ott-hero__tagline">
                Track the Telugu OTT movies releasing over the next 7 days across Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT and ETV Win.
              </p>
              {weekRange ? (
                <p className="ott-hero__updated-note">
                  Coverage window: {formatReleaseDate(weekRange.start)} to {formatReleaseDate(weekRange.end)}
                </p>
              ) : null}
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <h2>Weekly Telugu Streaming Calendar</h2>
            </div>
            <p>
              This page focuses only on the Telugu OTT titles releasing this week, making it easier to spot what is landing soon without browsing the full catalog.
            </p>
            <p>
              You can also explore <Link href="/top-rated-telugu-ott-movies">top rated Telugu OTT movies</Link> or the full <Link href="/ott-movies">OTT movie list</Link>.
            </p>
          </section>

          <section className="ott-movies-grid">
            {movies.length === 0 ? (
              <div className="ott-movies-empty">No Telugu OTT movies are scheduled in the next 7 days.</div>
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
