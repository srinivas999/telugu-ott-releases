/**
 * Homepage content modules
 */

import Link from 'next/link';
import Image from 'next/image';
import styles from './ContentModules.module.css';
import { generateUniqueSlug } from '../../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w300';

export function TrendingNow({ movies = [] }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.module}>
      <div className={styles.moduleHeader}>
        <h2 className={styles.moduleTitle}>Trending Now</h2>
        <Link href="/ott-movies" className={styles.viewAll}>
          View All →
        </Link>
      </div>
      <div className={styles.grid}>
        {movies.slice(0, 6).map((movie, index) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            index={index}
            fallbackPoster="/images/default_poster.png"
          />
        ))}
      </div>
    </section>
  );
}

export function ReleasingThisWeekend({ movies = [] }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.module}>
      <div className={styles.moduleHeader}>
        <h2 className={styles.moduleTitle}>Coming This Weekend</h2>
        <Link href="/ott-movies" className={styles.viewAll}>
          Calendar →
        </Link>
      </div>
      <div className={styles.grid}>
        {movies.slice(0, 6).map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} showDate />
        ))}
      </div>
    </section>
  );
}

export function RecentlyAdded({ movies = [] }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.module}>
      <div className={styles.moduleHeader}>
        <h2 className={styles.moduleTitle}>Recently Added to OTT</h2>
        <Link href="/ott-movies" className={styles.viewAll}>
          All Releases →
        </Link>
      </div>
      <div className={styles.grid}>
        {movies.slice(0, 6).map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} showDate />
        ))}
      </div>
    </section>
  );
}

function MovieCard({ movie, index, showDate = false, fallbackPoster = '/images/default_poster.png' }) {
  const slug = generateUniqueSlug(movie.movie_name || movie.title, movie.id);
  const href = movie.disableLink ? null : movie.href || `/movie/${slug}`;
  const posterUrl = movie.poster_path
    ? `${TMDB_POSTER_BASE}${movie.poster_path}`
    : fallbackPoster;

  const content = (
    <>
      <div className={styles.posterContainer}>
        <Image
          src={posterUrl}
          alt={movie.movie_name || movie.title || 'Movie poster'}
          fill
          className={styles.poster}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        <div className={styles.overlay}>
          {typeof movie.rating === 'number' && movie.rating > 0 ? (
            <div className={styles.rating}>★ {movie.rating.toFixed(1)}</div>
          ) : null}
          {index === 0 ? <div className={styles.badge}>TRENDING</div> : null}
        </div>
      </div>
      <div className={styles.cardInfo}>
        <h3 className={styles.cardTitle}>{movie.movie_name || movie.title || 'Untitled'}</h3>
        {movie.streaming_partner ? (
          <p className={styles.platform}>{movie.streaming_partner}</p>
        ) : null}
        {showDate && movie.digital_release_date ? (
          <p className={styles.date}>{formatDate(movie.digital_release_date)}</p>
        ) : null}
      </div>
    </>
  );

  if (!href) {
    return <article className={styles.card}>{content}</article>;
  }

  return (
    <Link href={href} className={styles.card}>
      {content}
    </Link>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';

  try {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
