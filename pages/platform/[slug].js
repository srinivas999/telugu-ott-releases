import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Breadcrumb from '../../components/common/Breadcrumb';
import { supabase } from '../../lib/supabaseClient';
import { generateUniqueSlug } from '../../lib/utils/slug';

const PLATFORM_MAP = {
  'netflix': 'Netflix',
  'aha': 'Aha',
  'prime-video': 'Prime Video',
  'jiohotstar': 'JioHotstar',
  'zee5': 'Zee5',
  'sun-nxt': 'Sun NXT',
  'etv-win': 'ETV Win',
};

function PlatformMovieCard({ movie }) {
  const movieSlug = generateUniqueSlug(movie.movie_name, movie.id);

  return (
    <Link href={`/movie/${movieSlug}`} className="webseries-card">
      <div className="webseries-card__img-wrap">
        <img
          src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/images/default_poster.png'}
          alt={movie.movie_name}
          className="webseries-card__img"
        />
      </div>
      <div className="webseries-card__body">
        <h2 className="webseries-card__title">{movie.movie_name}</h2>
        <div className="webseries-card__meta">
          <span>{movie.digital_release_date ? new Date(`${movie.digital_release_date}T00:00:00`).toLocaleDateString() : 'TBA'}</span>
          {movie.rating > 0 && <span className="webseries-card__rating">★ {movie.rating.toFixed(1)}</span>}
        </div>
        <p className="webseries-card__desc">{movie.overview || 'No description available.'}</p>
      </div>
    </Link>
  );
}

export default function PlatformPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const platformName = slug ? PLATFORM_MAP[slug] : '';
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
          .eq('streaming_partner', platformName)
          .order('digital_release_date', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setMovies(data || []);
      } catch (fetchError) {
        console.error('Fetch movies error:', fetchError);
        setError('Unable to load movies right now. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, [slug, platformName]);

  return (
    <Layout>
      <Seo
        title={`${safePlatformName} Telugu Movies`}
        description={`Browse Telugu movies available on ${safePlatformName}. Find OTT release dates, ratings, and streaming information.`}
        url={slug ? `/platform/${slug}` : '/ott-movies'}
        keywords={`${safePlatformName} Telugu movies, ${safePlatformName} OTT, Telugu streaming movies`}
      />

      <Breadcrumb
        items={[
          { name: 'Home', url: '/' },
          { name: 'OTT Movies', url: '/ott-movies' },
          { name: safePlatformName },
        ]}
      />

      <section className="ott-hero">
        <div className="ott-hero__panel">
          <h1>{safePlatformName} Telugu Movies</h1>
          <p className="ott-hero__tagline">Discover all Telugu movies available on {safePlatformName}</p>
        </div>
      </section>

      <section className="webseries-list-section">
        <h2 className="visually-hidden">{safePlatformName} movie list</h2>
        {error && (
          <div className="webseries-list__error">{error}</div>
        )}

        {loading ? (
          <div className="webseries-list__loading">Loading {safePlatformName} movies...</div>
        ) : movies.length === 0 ? (
          <div className="webseries-list__empty">No movies found on {safePlatformName}.</div>
        ) : (
          <div className="webseries-list-grid">
            {movies.map((movie) => (
              <PlatformMovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}
