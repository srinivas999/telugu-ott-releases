import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';
const CACHE_KEY = 'theatreReleaseMoviesCache';
const CACHE_TTL = 1000 * 60 * 60;

const TMDB_GENRES = {
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

function formatReleaseDate(date) {
  if (!date) return 'TBA';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMovieGenres(genreIds) {
  if (!Array.isArray(genreIds) || genreIds.length === 0) return 'Genre N/A';
  const names = genreIds.map((id) => TMDB_GENRES[id]).filter(Boolean).slice(0, 2);
  return names.length > 0 ? names.join(', ') : 'Genre N/A';
}

function toPosterUrl(movie) {
  if (!movie?.poster_path) return '/images/default_poster.png';
  if (String(movie.poster_path).startsWith('http')) return movie.poster_path;
  return `${TMDB_POSTER_BASE}${movie.poster_path}`;
}

function toBackdropUrl(movie) {
  const path = movie?.backdrop_path || movie?.poster_path;
  if (!path) return '/images/default_poster.png';
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

export default function TheatreReleasePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function loadMovies() {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setLoading(true);
      setError('');

      try {
        if (typeof window !== 'undefined') {
          const cacheRaw = window.localStorage.getItem(CACHE_KEY);
          if (cacheRaw) {
            const cache = JSON.parse(cacheRaw);
            const isFresh = cache.timestamp && Date.now() - cache.timestamp < CACHE_TTL;
            if (isFresh && Array.isArray(cache.movies)) {
              setMovies(cache.movies);
              setLoading(false);
              return;
            }
          }
        }

        const response = await fetch('/api/tmdb/latest');
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Unable to fetch theatre releases (${response.status}). ${body}`);
        }

        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        setMovies(results);

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ movies: results, timestamp: Date.now() })
          );
        }
      } catch (fetchError) {
        console.error('Theatre release fetch error:', fetchError);
        setError(fetchError.message || 'Unable to load theatre releases right now.');
      } finally {
        setLoading(false);
      }
    }

    loadMovies();
  }, []);

  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      if (sortBy === 'rating') return (b.vote_average || 0) - (a.vote_average || 0);
      if (sortBy === 'popular') return (b.popularity || 0) - (a.popularity || 0);
      return new Date(b.release_date || 0) - new Date(a.release_date || 0);
    });
  }, [movies, sortBy]);

  const featuredMovie = sortedMovies[0];
  const gridMovies = sortedMovies.slice(1);

  return (
    <Layout>
      <Seo
        title="Latest Telugu Theatre Releases"
        description="Discover the latest Tollywood theatre release movies with posters, ratings, and details."
        url="/theatre-release"
        keywords="Telugu theatre releases, Tollywood theatre movies, latest Telugu movies"
      />

      <main className="netflix-home theatre-browse-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Theatre Releases' }]} />
        </div>

        <section className="nf-hero theatre-browse-hero">
          {featuredMovie ? (
            <div className="nf-hero__bg">
              <Image
                src={toBackdropUrl(featuredMovie)}
                alt={featuredMovie.title || featuredMovie.original_title || 'Featured movie'}
                fill
                priority
                sizes="100vw"
                className="nf-hero__bg-image"
              />
            </div>
          ) : null}
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">Theatre Tracker</p>
            <h1>Latest Telugu Theatre Releases</h1>
            <p className="nf-hero__desc">
              Track the newest Tollywood movies in theatres with release dates, ratings, and quick access to details.
            </p>
            <div className="nf-hero__meta">
              <span>{movies.length} Movies</span>
              <span>{featuredMovie ? formatReleaseDate(featuredMovie.release_date) : 'Updated Daily'}</span>
              {featuredMovie?.vote_average ? <span>{featuredMovie.vote_average.toFixed(1)}/10</span> : null}
            </div>
            <div className="nf-hero__actions">
              {featuredMovie ? (
                <Link href={`/theatre-release/${featuredMovie.id}`} className="nf-btn nf-btn--primary">
                  Featured Details
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="nf-controls" aria-label="Theatre controls">
          <div className="nf-platforms">
            <button
              type="button"
              className={`nf-chip ${sortBy === 'latest' ? 'is-active' : ''}`}
              onClick={() => setSortBy('latest')}
            >
              Latest
            </button>
            <button
              type="button"
              className={`nf-chip ${sortBy === 'rating' ? 'is-active' : ''}`}
              onClick={() => setSortBy('rating')}
            >
              Top Rated
            </button>
            <button
              type="button"
              className={`nf-chip ${sortBy === 'popular' ? 'is-active' : ''}`}
              onClick={() => setSortBy('popular')}
            >
              Popular
            </button>
          </div>

        </section>

        <section className="nf-content">
          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>{loading ? 'Loading Movies' : `All Theatre Releases (${movies.length})`}</h2>
            </div>

            {loading ? (
              <p className="nf-status">Loading theatre releases...</p>
            ) : error ? (
              <p className="nf-status nf-status--error">{error}</p>
            ) : gridMovies.length === 0 ? (
              <p className="nf-status">No theatre release movies found.</p>
            ) : (
              <div className="nf-collection__grid">
                {gridMovies.map((movie) => (
                  <Link key={movie.id} href={`/theatre-release/${movie.id}`} className="nf-card">
                    <div className="nf-card__poster">
                      <Image
                        src={toPosterUrl(movie)}
                        alt={movie.title || movie.original_title || 'Movie poster'}
                        fill
                        sizes="(max-width: 640px) 44vw, (max-width: 980px) 22vw, 15vw"
                        className="nf-card__image"
                      />
                      <span className="nf-card__rating">
                        {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'}
                      </span>
                    </div>
                    <div className="nf-card__meta">
                      <h3>{movie.title || movie.original_title || 'Untitled'}</h3>
                      <p>{getMovieGenres(movie.genre_ids)} - {formatReleaseDate(movie.release_date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </Layout>
  );
}
