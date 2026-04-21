/**
 * Movie Details Component
 * Displays comprehensive movie information for detail pages
 */

import Image from 'next/image';
import styles from './MovieDetails.module.css';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const FALLBACK_IMAGE = '/images/ott-hero-banner.png';

function formatDate(dateString) {
  if (!dateString) return 'TBA';

  try {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function getGenreName(genreId) {
  const genreMap = {
    28: 'Action',
    12: 'Adventure',
    16: 'Animation',
    35: 'Comedy',
    80: 'Crime',
    99: 'Documentary',
    18: 'Drama',
    10751: 'Family',
    14: 'Fantasy',
    36: 'History',
    27: 'Horror',
    10402: 'Music',
    9648: 'Mystery',
    10749: 'Romance',
    878: 'Sci-Fi',
    10770: 'TV Movie',
    53: 'Thriller',
    10752: 'War',
    37: 'Western',
  };

  return genreMap[genreId] || `Genre ${genreId}`;
}

export default function MovieDetails({ movie, loading = false, error = null }) {
  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>Error: {error}</div>;
  }

  if (!movie) {
    return <div className={styles.container}>Movie not found</div>;
  }

  const title = movie.title || movie.movie_name || 'Untitled';
  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
    : FALLBACK_IMAGE;
  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}`
    : null;

  return (
    <article className={styles.container}>
      {backdropUrl && (
        <div className={styles.backdrop}>
          <Image
            src={backdropUrl}
            alt={title}
            fill
            priority
            style={{ objectFit: 'cover' }}
          />
          <div className={styles.backdropOverlay} />
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.posterContainer}>
            <Image
              src={posterUrl}
              alt={title}
              width={280}
              height={420}
              priority
              className={styles.poster}
            />
          </div>

          <div className={styles.info}>
            <h1 className={styles.title}>{title}</h1>
            {movie.tagline && <p className={styles.tagline}>&quot;{movie.tagline}&quot;</p>}

            <div className={styles.metadata}>
              {movie.release_date && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Release Date:</span>
                  <span className={styles.metaValue}>{formatDate(movie.release_date)}</span>
                </div>
              )}

              {movie.digital_release_date && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>OTT Release:</span>
                  <span className={styles.metaValue}>
                    {formatDate(movie.digital_release_date)}
                  </span>
                </div>
              )}

              {movie.runtime && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Runtime:</span>
                  <span className={styles.metaValue}>{movie.runtime} min</span>
                </div>
              )}

              {movie.rating && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Rating:</span>
                  <span className={styles.metaValue}>{Number(movie.rating).toFixed(1)}/10</span>
                </div>
              )}
            </div>

            {Array.isArray(movie.genre_ids) && movie.genre_ids.length > 0 && (
              <div className={styles.genres}>
                {movie.genre_ids.slice(0, 4).map((genreId) => (
                  <span key={genreId} className={styles.genre}>
                    {getGenreName(genreId)}
                  </span>
                ))}
              </div>
            )}

            {movie.streaming_partner && (
              <div className={styles.ottPlatform}>
                <strong>Available on:</strong>
                <div className={styles.platformBadge}>{movie.streaming_partner}</div>
              </div>
            )}
          </div>
        </div>

        {(movie.overview || movie.description) && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Plot</h2>
            <p className={styles.overview}>{movie.overview || movie.description}</p>
          </section>
        )}

        {Array.isArray(movie.cast) && movie.cast.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Cast</h2>
            <div className={styles.castGrid}>
              {movie.cast.slice(0, 6).map((actor, index) => (
                <div key={index} className={styles.castCard}>
                  <div className={styles.castName}>{actor.name || actor}</div>
                  {actor.character && (
                    <div className={styles.castCharacter}>as {actor.character}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {Array.isArray(movie.crew) && movie.crew.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Crew</h2>
            <div className={styles.crewList}>
              {movie.crew.slice(0, 5).map((member, index) => (
                <div key={index} className={styles.crewItem}>
                  <strong>{member.name}</strong>
                  <span className={styles.crewJob}>{member.job}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Where to Watch</h2>
          <div className={styles.watchInfo}>
            {movie.streaming_partner ? (
              <>
                <p>
                  Watch <strong>{title}</strong> on <strong>{movie.streaming_partner}</strong>
                </p>
                {movie.digital_release_date && (
                  <p className={styles.releaseInfo}>
                    Streaming from <strong>{formatDate(movie.digital_release_date)}</strong>
                  </p>
                )}
              </>
            ) : (
              <p>Platform information not available</p>
            )}
          </div>
        </section>

        {Array.isArray(movie.faq) && movie.faq.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqContainer}>
              {movie.faq.map((item, index) => (
                <div key={index} className={styles.faqItem}>
                  <h3 className={styles.faqQuestion}>{item.question}</h3>
                  <p className={styles.faqAnswer}>{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
