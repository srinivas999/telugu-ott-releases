import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import { supabase } from '../../lib/supabaseClient';

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
  return (
    <div className="webseries-card">
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
    </div>
  );
}

export default function PlatformPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const platformName = slug ? PLATFORM_MAP[slug] : '';

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
  }, [slug]);

  return (
    <Layout>
      <Seo
        title={`${platformName} Movies - Telugu OTT Releases`}
        description={`Browse all ${platformName} Telugu movies on TeluguOTTReleases. Find release dates, streaming information, and more.`}
        url={`/platform/${slug}`}
      />

      <section className="ott-hero">
        <div className="ott-hero__panel">
          <h1>{platformName} Telugu Movies</h1>
          <p className="ott-hero__tagline">Discover all Telugu movies available on {platformName}</p>
        </div>
      </section>

      <section className="webseries-list-section">
        {error && (
          <div className="webseries-list__error">{error}</div>
        )}

        {loading ? (
          <div className="webseries-list__loading">Loading {platformName} movies...</div>
        ) : movies.length === 0 ? (
          <div className="webseries-list__empty">No movies found on {platformName}.</div>
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
