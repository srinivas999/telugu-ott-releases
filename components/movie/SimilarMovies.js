/**
 * Similar Movies Component
 * Displays related movies in a horizontal scrollable list
 */

import Link from 'next/link';
import Image from 'next/image';
import styles from './SimilarMovies.module.css';
import { generateUniqueSlug } from '../../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w300';

function formatReleaseDate(dateString) {
  if (!dateString) return '';

  try {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function SimilarMovies({ title = 'Related Movies', description = '', movies = [] }) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {description ? <p className={styles.description}>{description}</p> : null}
      </div>
      <div className={styles.scrollContainer}>
        {movies.map((movie) => {
          const slug = generateUniqueSlug(movie.movie_name || movie.title, movie.id);
          const posterUrl = movie.poster_path
            ? `${TMDB_POSTER_BASE}${movie.poster_path}`
            : '/images/default_poster.png';

          return (
            <Link key={movie.id} href={`/movie/${slug}`} className={styles.movieCard}>
              <div className={styles.posterWrapper}>
                <Image
                  src={posterUrl}
                  alt={movie.movie_name || movie.title}
                  width={150}
                  height={225}
                  className={styles.poster}
                />
              </div>
              <div className={styles.movieInfo}>
                <h4 className={styles.movieTitle}>{movie.movie_name || movie.title}</h4>
                {movie.streaming_partner && (
                  <p className={styles.platform}>{movie.streaming_partner}</p>
                )}
                {movie.digital_release_date && (
                  <p className={styles.releaseDate}>{formatReleaseDate(movie.digital_release_date)}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
