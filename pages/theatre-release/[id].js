import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';
const YOUTUBE_SEARCH_URL_BASE = 'https://www.youtube.com/results?search_query=';

function formatReleaseDate(date) {
  if (!date) return 'TBA';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRuntime(minutes) {
  if (!minutes || typeof minutes !== 'number') return 'Runtime N/A';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
}

export default function MovieDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    async function loadMovie() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/tmdb/details?id=${encodeURIComponent(id)}`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Unable to load movie details (${response.status}). ${text}`);
        }

        const data = await response.json();
        setMovie(data);
      } catch (fetchError) {
        console.error('Movie details fetch error:', fetchError);
        setError(fetchError.message || 'Unable to load movie details.');
      } finally {
        setLoading(false);
      }
    }

    loadMovie();
  }, [id]);

  return (
    <Layout>
      <Seo
        title={movie?.title || movie?.original_title || 'Movie details'}
        description={movie?.overview || 'Movie details and trailer links.'}
        url={id ? `/theatre-release/${id}` : '/theatre-release'}
        keywords="Telugu theatre movie details, TMDb movie details"
      />

      <main className="page-projects page-ott movie-detail-page">
        <div className="projects-page-inner">
          <div className="projects-page-header">
            <p className="eyebrow">Theatre Release</p>
            <h1 className="projects-page-title">Movie details</h1>
          </div>

          {loading ? (
            <p className="admin-status">Loading movie details…</p>
          ) : error ? (
            <p className="admin-status admin-status--error">{error}</p>
          ) : movie ? (
            <section className="movie-detail-hero">
              {movie.backdrop_path ? (
                <img
                  src={`${TMDB_BACKDROP_BASE}${movie.backdrop_path}`}
                  alt={movie.title || movie.original_title}
                  className="movie-detail-hero__backdrop"
                />
              ) : null}

              <div className="movie-detail-hero__inner">
                <div className="movie-detail-poster">
                  {movie.poster_path ? (
                    <img
                      src={`${TMDB_POSTER_BASE}${movie.poster_path}`}
                      alt={`${movie.title || movie.original_title} poster`}
                    />
                  ) : (
                    <div className="movie-detail-poster__placeholder">
                      <span>No poster available</span>
                    </div>
                  )}
                  <span className="movie-detail-poster__pill">{formatReleaseDate(movie.release_date)}</span>
                  <span className="movie-detail-poster__badge">OTT</span>
                </div>

                <div className="movie-detail-copy">
                  <p className="eyebrow movie-detail-eyebrow">{movie.status || 'Released'}</p>
                  <h1 className="movie-detail-title">{movie.title || movie.original_title}</h1>
                  {movie.tagline ? <p className="movie-detail-tagline">{movie.tagline}</p> : null}

                  <div className="movie-detail-stats">
                    <span>{formatReleaseDate(movie.release_date)}</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                    <span>{movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}</span>
                    <span>{movie.genres?.map((genre) => genre.name).join(', ') || 'Genre N/A'}</span>
                  </div>

                  <p className="movie-detail-overview">{movie.overview || 'No overview available.'}</p>

                  <div className="movie-detail-actions">
                    <a
                      href={movie.homepage || `https://www.themoviedb.org/movie/${id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tmdb-release-card__action tmdb-release-card__action--primary"
                    >
                      View on TMDb
                    </a>
                    <a
                      href={`${YOUTUBE_SEARCH_URL_BASE}${encodeURIComponent(`${movie.title || movie.original_title} trailer`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="tmdb-release-card__action tmdb-release-card__action--secondary"
                    >
                      Watch trailer
                    </a>
                    <Link href="/theatre-release" className="tmdb-release-card__action tmdb-release-card__action--secondary">
                      Back to releases
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <p className="admin-status">Movie details are unavailable.</p>
          )}
        </div>
      </main>
    </Layout>
  );
}
