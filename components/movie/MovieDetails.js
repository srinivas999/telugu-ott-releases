/**
 * Movie Details Component
 * Displays richer TMDB-powered detail content on top of OTT DB data
 */

import Image from 'next/image';
import styles from './MovieDetails.module.css';
import { getOmdbDetails, getPreferredMovieRating } from '../../lib/utils/ratings';

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w780';
const FALLBACK_IMAGE = '/images/default_poster.png';

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

function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return 'Runtime N/A';

  const totalMinutes = Number(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  return `${hours > 0 ? `${hours}h ` : ''}${remainingMinutes}m`;
}

function getGenreLabel(genre) {
  if (!genre) return '';
  if (typeof genre === 'string') return genre;
  return genre.name || `Genre ${genre.id || ''}`.trim();
}

function getTopCast(movie) {
  if (Array.isArray(movie.cast_data) && movie.cast_data.length > 0) {
    return movie.cast_data.slice(0, 8);
  }

  if (Array.isArray(movie.cast) && movie.cast.length > 0) {
    return movie.cast.slice(0, 8);
  }

  return [];
}

function getTopCrew(movie) {
  if (!Array.isArray(movie.crew)) {
    return [];
  }

  const priorityJobs = ['Director', 'Writer', 'Screenplay', 'Producer', 'Original Music Composer'];
  const prioritized = priorityJobs
    .map((job) => movie.crew.find((member) => member.job === job))
    .filter(Boolean);

  const uniqueCrew = [...new Map([...prioritized, ...movie.crew].map((member) => [`${member.name}-${member.job}`, member])).values()];
  return uniqueCrew.slice(0, 6);
}

function isPresentOmdbValue(value) {
  return value !== null && value !== undefined && value !== '' && value !== 'N/A';
}

function getCrewNamesByJobs(movie, jobs) {
  if (!Array.isArray(movie?.crew)) {
    return '';
  }

  const normalizedJobs = jobs.map((job) => String(job).toLowerCase());
  const names = movie.crew
    .filter((member) => normalizedJobs.includes(String(member?.job || '').toLowerCase()))
    .map((member) => member?.name)
    .filter(Boolean);

  return [...new Set(names)].join(', ');
}

function getCastNames(movie) {
  const names = getTopCast(movie)
    .map((member) => (typeof member === 'string' ? member : member?.name))
    .filter(Boolean);

  return [...new Set(names)].join(', ');
}

function getGenreText(movie) {
  if (Array.isArray(movie?.genres) && movie.genres.length > 0) {
    return movie.genres.map(getGenreLabel).filter(Boolean).join(', ');
  }

  return '';
}

function getReleaseYear(movie) {
  const releaseSource = movie?.release_date || movie?.digital_release_date || '';
  return String(releaseSource).slice(0, 4);
}

function getTmdbVoteCount(movie) {
  const voteCount = typeof movie?.vote_count === 'number' ? movie.vote_count : Number(movie?.vote_count);
  if (!Number.isFinite(voteCount) || voteCount <= 0) {
    return '';
  }

  return voteCount.toLocaleString('en-IN');
}

function getFallbackFieldValue(movie, label) {
  switch (label) {
    case 'IMDb Rating':
      return getPreferredMovieRating(movie);
    case 'IMDb Votes':
      return getTmdbVoteCount(movie);
    case 'Year':
      return getReleaseYear(movie);
    case 'Released':
      return movie?.release_date ? formatDate(movie.release_date) : '';
    case 'Runtime':
      return movie?.runtime ? formatRuntime(movie.runtime) : '';
    case 'Genre':
      return getGenreText(movie);
    case 'Director':
      return getCrewNamesByJobs(movie, ['Director']);
    case 'Writer':
      return getCrewNamesByJobs(movie, ['Writer', 'Screenplay']);
    case 'Actors':
      return getCastNames(movie);
    case 'Language':
      return movie?.language || movie?.movie_language || '';
    case 'Type':
      return movie?.category || '';
    default:
      return '';
  }
}

function buildOmdbFieldGroups(movie) {
  const omdb = getOmdbDetails(movie);
  const hasOmdbRating = isPresentOmdbValue(omdb?.imdbRating);
  const hasOmdbVotes = isPresentOmdbValue(omdb?.imdbVotes);

  const highlightFields = [
    {
      label: hasOmdbRating ? 'IMDb Rating' : 'TMDb Rating',
      value: omdb?.imdbRating ?? getFallbackFieldValue(movie, 'IMDb Rating'),
    },
    {
      label: hasOmdbVotes ? 'IMDb Votes' : 'TMDb Votes',
      value: omdb?.imdbVotes ?? getFallbackFieldValue(movie, 'IMDb Votes'),
    },
    { label: 'Rated', value: omdb?.Rated },
    { label: 'Awards', value: omdb?.Awards },
  ].filter((field) => isPresentOmdbValue(field.value));

  const primaryFieldMap = [
    ['Year', omdb?.Year ?? getFallbackFieldValue(movie, 'Year')],
    ['Released', omdb?.Released ?? getFallbackFieldValue(movie, 'Released')],
    ['Runtime', omdb?.Runtime ?? getFallbackFieldValue(movie, 'Runtime')],
    ['Genre', omdb?.Genre ?? getFallbackFieldValue(movie, 'Genre')],
    ['Director', omdb?.Director ?? getFallbackFieldValue(movie, 'Director')],
    ['Writer', omdb?.Writer ?? getFallbackFieldValue(movie, 'Writer')],
    ['Actors', omdb?.Actors ?? getFallbackFieldValue(movie, 'Actors')],
    ['Language', omdb?.Language ?? getFallbackFieldValue(movie, 'Language')],
    ['Country', omdb?.Country],
    ['Box Office', omdb?.BoxOffice],
    ['Metascore', omdb?.Metascore],
    ['DVD', omdb?.DVD],
    ['Production', omdb?.Production],
    ['Website', omdb?.Website],
    ['Type', omdb?.Type ?? getFallbackFieldValue(movie, 'Type')],
    ['Total Seasons', omdb?.totalSeasons],
  ];

  const seenKeys = new Set([
    'Title',
    'Poster',
    'Plot',
    'Response',
    'Ratings',
    'imdbID',
    'imdbRating',
    'imdbVotes',
    'Rated',
    'Awards',
  ]);

  const detailFields = primaryFieldMap
    .map(([label, value]) => ({ label, value }))
    .filter((field) => isPresentOmdbValue(field.value));

  if (omdb) {
    primaryFieldMap.forEach(([label]) => {
      const key = label === 'Box Office' ? 'BoxOffice'
        : label === 'Total Seasons' ? 'totalSeasons'
        : label;
      seenKeys.add(key);
    });

    Object.entries(omdb).forEach(([key, value]) => {
      if (seenKeys.has(key) || !isPresentOmdbValue(value)) {
        return;
      }

      detailFields.push({
        label: key.replace(/([a-z])([A-Z])/g, '$1 $2'),
        value,
      });
    });
  }

  return { highlightFields, detailFields };
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
  const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : FALLBACK_IMAGE;
  const backdropUrl = movie.backdrop_path ? `${TMDB_IMAGE_BASE}${movie.backdrop_path}` : null;
  const genres = Array.isArray(movie.genres) ? movie.genres : [];
  const cast = getTopCast(movie);
  const crew = getTopCrew(movie);
  const rating = getPreferredMovieRating(movie);
  const omdb = getOmdbDetails(movie);
  const { highlightFields, detailFields } = buildOmdbFieldGroups(movie);
  const storyText = movie.overview || movie.description || '';
  const detailsPlotText =
    isPresentOmdbValue(omdb?.Plot) && omdb.Plot !== storyText
      ? omdb.Plot
      : !storyText && isPresentOmdbValue(omdb?.Plot)
        ? omdb.Plot
        : '';

  return (
    <article className={styles.container}>
      <section className={styles.hero}>
        {backdropUrl ? (
          <div className={styles.backdrop}>
            <Image
              src={backdropUrl}
              alt={title}
              fill
              priority
              className={styles.backdropImage}
            />
          </div>
        ) : null}
        <div className={styles.heroShade} />

        <div className={styles.heroInner}>
          <div className={styles.posterPanel}>
            <Image
              src={posterUrl}
              alt={title}
              width={320}
              height={480}
              priority
              className={styles.poster}
            />
          </div>

          <div className={styles.infoPanel}>
            <p className={styles.kicker}>{movie.streaming_partner || 'OTT Premiere'}</p>
            <h1 className={styles.title}>{title}</h1>
            {movie.tagline ? <p className={styles.tagline}>{movie.tagline}</p> : null}

            <div className={styles.statRow}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>OTT Release</span>
                <span className={styles.statValue}>{formatDate(movie.digital_release_date)}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Theatrical</span>
                <span className={styles.statValue}>{formatDate(movie.release_date)}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Runtime</span>
                <span className={styles.statValue}>{formatRuntime(movie.runtime)}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Rating</span>
                <span className={styles.statValue}>
                  {rating ? Number(rating).toFixed(1) : 'NR'}/10
                </span>
              </div>
            </div>

            {genres.length > 0 ? (
              <div className={styles.genreRow}>
                {genres.slice(0, 5).map((genre) => (
                  <span key={genre.id || genre.name || genre} className={styles.genreChip}>
                    {getGenreLabel(genre)}
                  </span>
                ))}
              </div>
            ) : null}

            {highlightFields.length > 0 ? (
              <div className={styles.omdbHeroGrid}>
                {highlightFields.map((field) => (
                  <div key={field.label} className={styles.omdbHeroCard}>
                    <span className={styles.omdbHeroLabel}>{field.label}</span>
                    <span className={styles.omdbHeroValue}>{field.value}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.watchPanel}>
              <div>
                <p className={styles.watchLabel}>Now Streaming</p>
                <p className={styles.watchValue}>{movie.streaming_partner || 'Platform TBA'}</p>
              </div>
              {movie.trailer_url ? (
                <a
                  href={movie.trailer_url}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.primaryAction}
                >
                  Watch Trailer
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className={styles.content}>
        {storyText ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Story</p>
              <h2 className={styles.sectionTitle}>Overview</h2>
            </div>
            <p className={styles.overview}>{storyText}</p>
          </section>
        ) : null}

        {(detailFields.length > 0 || detailsPlotText) ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Details</p>
              <h2 className={styles.sectionTitle}>Movie Facts</h2>
            </div>

            {detailsPlotText ? (
              <p className={styles.omdbPlot}>{detailsPlotText}</p>
            ) : null}

            {detailFields.length > 0 ? (
              <div className={styles.omdbFactsGrid}>
                {detailFields.map((field) => (
                  <div key={`${field.label}-${field.value}`} className={styles.omdbFactCard}>
                    <p className={styles.omdbFactLabel}>{field.label}</p>
                    <p className={styles.omdbFactValue}>{field.value}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {cast.length > 0 ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Talent</p>
              <h2 className={styles.sectionTitle}>Cast</h2>
            </div>
            <div className={styles.castGrid}>
              {cast.map((actor, index) => (
                <article key={`${actor.id || actor.name || actor}-${index}`} className={styles.personCard}>
                  <h3 className={styles.personName}>{actor.name || actor}</h3>
                  {actor.character ? (
                    <p className={styles.personMeta}>{actor.character}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {crew.length > 0 ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <p className={styles.sectionEyebrow}>Craft</p>
              <h2 className={styles.sectionTitle}>Crew</h2>
            </div>
            <div className={styles.crewGrid}>
              {crew.map((member, index) => (
                <article key={`${member.name}-${member.job}-${index}`} className={styles.personCard}>
                  <h3 className={styles.personName}>{member.name}</h3>
                  <p className={styles.personMeta}>{member.job}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionEyebrow}>Streaming</p>
            <h2 className={styles.sectionTitle}>Where to Watch</h2>
          </div>
          <div className={styles.watchDetails}>
            <p>
              <strong>{title}</strong> is available on{' '}
              <strong>{movie.streaming_partner || 'OTT platform'}</strong>.
            </p>
            {movie.digital_release_date ? (
              <p className={styles.releaseInfo}>
                Streaming from <strong>{formatDate(movie.digital_release_date)}</strong>
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </article>
  );
}
