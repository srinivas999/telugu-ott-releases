import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import Breadcrumb from '../../components/common/Breadcrumb';
import { supabase } from '../../lib/supabaseClient';
import { getPreferredMovieRating } from '../../lib/utils/ratings';
import { generateUniqueSlug } from '../../lib/utils/slug';
import { withStoredTmdbDetails } from '../../lib/utils/tmdb';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_POSTER = '/images/default_poster.png';

const collectionConfig = {
  'latest-ott': {
    title: 'Latest on OTT',
    description: 'Latest Telugu OTT releases sorted by newest release date.',
  },
  'trending-now': {
    title: 'Trending Now',
    description: 'Trending Telugu OTT releases based on ratings and release momentum.',
  },
  'recently-added': {
    title: 'Recently Added',
    description: 'Recently added Telugu OTT titles from the latest database updates.',
  },
  'top-rated-telugu-ott': {
    title: 'Top Rated Telugu OTT',
    description: 'Highest rated Telugu OTT movies currently available in the database.',
  },
};

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

function buildCollectionMovies(allMovies, slug) {
  const base = allMovies.map(withDisplayFields);

  if (slug === 'recently-added') {
    return [...base].sort((a, b) => {
      const firstTime = new Date(a.created_at || a.digital_release_date || 0).getTime();
      const secondTime = new Date(b.created_at || b.digital_release_date || 0).getTime();
      return secondTime - firstTime;
    });
  }

  if (slug === 'top-rated-telugu-ott') {
    return [...base]
      .filter((movie) => (getPreferredMovieRating(movie) || 0) > 0)
      .sort((a, b) => (getPreferredMovieRating(b) || 0) - (getPreferredMovieRating(a) || 0));
  }

  if (slug === 'trending-now') {
    return [...base]
      .filter((movie) => (getPreferredMovieRating(movie) || 0) > 0)
      .sort((a, b) => {
        const ratingDiff = (getPreferredMovieRating(b) || 0) - (getPreferredMovieRating(a) || 0);
        if (ratingDiff !== 0) return ratingDiff;
        const firstTime = new Date(a.digital_release_date || 0).getTime();
        const secondTime = new Date(b.digital_release_date || 0).getTime();
        return secondTime - firstTime;
      });
  }

  return [...base].sort((a, b) => {
    const firstTime = new Date(a.digital_release_date || 0).getTime();
    const secondTime = new Date(b.digital_release_date || 0).getTime();
    return secondTime - firstTime;
  });
}

export default function BrowseCollectionPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [allMovies, setAllMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const collection = collectionConfig[slug] || null;

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
        setAllMovies(data || []);
      } catch (fetchError) {
        console.error('Browse collection fetch error:', fetchError);
        setError('Unable to load this collection right now. Please refresh and try again.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const movies = useMemo(() => buildCollectionMovies(allMovies, slug), [allMovies, slug]);
  const filteredMovies = useMemo(() => {
    if (selectedPlatform === 'all') {
      return movies;
    }

    return movies.filter((movie) => {
      const normalized = normalizePlatform(movie.streaming_partner);
      if (selectedPlatform === 'other') {
        return !['Netflix', 'Aha', 'Prime Video', 'JioHotstar', 'Zee5', 'Sun NXT', 'ETV Win'].includes(normalized);
      }
      return normalized === selectedPlatform;
    });
  }, [movies, selectedPlatform]);

  if (!collection && typeof slug === 'string') {
    return (
      <Layout>
        <main className="netflix-home nf-collection">
          <div className="nf-content">
            <p className="nf-status nf-status--error">Collection not found.</p>
          </div>
        </main>
      </Layout>
    );
  }

  const title = collection ? `${collection.title} | Telugu OTT` : 'Browse | Telugu OTT';

  return (
    <Layout>
      <Seo
        title={title}
        description={collection?.description || 'Browse Telugu OTT movie collections.'}
        url={slug ? `/browse/${slug}` : '/browse'}
      />

      <main className="netflix-home nf-collection">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: collection?.title || 'Browse' },
            ]}
          />
        </div>

        <section className="nf-collection__hero">
          <div className="nf-content">
            <p className="nf-hero__kicker">SV Telugu OTT</p>
            <h1>{collection?.title || 'Browse'}</h1>
            <p className="nf-hero__desc">{collection?.description}</p>
            <p className="nf-status">{loading ? 'Loading...' : `${filteredMovies.length} titles`}</p>
          </div>
        </section>

        <section className="nf-content">
          <section className="nf-controls" aria-label="Platform filters">
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
          </section>

          <div className="nf-collection__grid">
            {loading ? (
              <p className="nf-status">Loading collection...</p>
            ) : error ? (
              <p className="nf-status nf-status--error">{error}</p>
            ) : filteredMovies.length === 0 ? (
              <p className="nf-status">No movies found in this collection.</p>
            ) : (
              filteredMovies.map((movie, index) => {
                const movieSlug = generateUniqueSlug(movie.movie_name || movie.title, movie.id);
                const rating = getPreferredMovieRating(movie) || 0;
                return (
                  <Link key={movie.id || `${movie.movie_name}-${index}`} href={`/movie/${movieSlug}`} className="nf-card">
                    <div className="nf-card__poster">
                      <Image
                        src={toPosterUrl(movie)}
                        alt={movie.movie_name || movie.title || 'Movie poster'}
                        fill
                        sizes="(max-width: 640px) 44vw, (max-width: 980px) 22vw, 15vw"
                        className="nf-card__image"
                      />
                      {rating > 0 ? <span className="nf-card__rating">{rating.toFixed(1)}</span> : null}
                    </div>
                    <div className="nf-card__meta">
                      <h3>{movie.movie_name || movie.title || 'Untitled'}</h3>
                      <p>{movie.streaming_partner || 'OTT'} - {formatReleaseDate(movie.digital_release_date)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
}
