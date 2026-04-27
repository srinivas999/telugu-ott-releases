import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import ContinueBrowsing from '../components/common/ContinueBrowsing';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

function formatDate(value) {
  if (!value) return 'TBA';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toPosterUrl(item) {
  if (!item?.poster_path) return '/images/default_poster.png';
  if (String(item.poster_path).startsWith('http')) return item.poster_path;
  return `${TMDB_POSTER_BASE}${item.poster_path}`;
}

function toBackdropUrl(item) {
  const path = item?.backdrop_path || item?.poster_path;
  if (!path) return '/images/default_poster.png';
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

function getSeriesBadge(item) {
  if (!item?.poster_path) return 'Poster Soon';
  if ((item.vote_average || 0) >= 7.5) return 'Top Series';
  return 'Streaming';
}

export default function WebSeriesPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function fetchSeries() {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/tmdb/latest-webseries');
        if (!res.ok) throw new Error('Failed to fetch web series');
        const data = await res.json();
        setSeries(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        setError(err.message || 'Unable to load web series right now.');
        setSeries([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSeries();
  }, []);

  const featured = useMemo(() => series[0] || null, [series]);
  const list = useMemo(() => series.slice(1), [series]);
  const retentionItems = [
    {
      href: '/browse/trending-now',
      eyebrow: 'Trending Now',
      title: 'After series, jump into trending movies',
      description: 'Keep the binge flow alive with the Telugu OTT titles everyone is checking out.',
      cta: 'Open Trending',
    },
    {
      href: '/top-rated-telugu-ott-movies',
      eyebrow: 'Top Picks',
      title: 'Continue with the highest-rated Telugu OTT movies',
      description: 'Move from web series discovery into the strongest film recommendations.',
      cta: 'View Top Picks',
    },
    {
      href: '/telugu-ott-releases-this-week',
      eyebrow: 'New Releases',
      title: 'Keep going with this week OTT drops',
      description: 'See which Telugu movies are newly landing on OTT over the next few days.',
      cta: 'See This Week',
    },
    {
      href: '/theatre-release',
      eyebrow: 'Beyond Series',
      title: 'Switch from streaming series to theatre releases',
      description: 'Continue the session with the latest Telugu movies playing in theatres.',
      cta: 'Browse Theatres',
    },
  ];

  return (
    <Layout>
      <Seo
        title="Latest Telugu Web Series"
        description="Latest Telugu web series streaming on OTT platforms. Find new Telugu web series releases with posters and ratings."
        url="/web-series"
        keywords="latest Telugu web series, Telugu OTT web series, Telugu streaming series"
      />

      <main className="netflix-home webseries-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Web Series' }]} />
        </div>

        <section className="nf-hero webseries-hero">
          {featured ? (
            <div className="nf-hero__bg">
              <Image
                src={toBackdropUrl(featured)}
                alt={featured.name || 'Featured web series'}
                fill
                priority
                sizes="100vw"
                className="nf-hero__bg-image"
              />
            </div>
          ) : null}
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">Web Series</p>
            <h1>Latest Telugu Web Series</h1>
            <p className="nf-hero__desc">
              Discover the newest Telugu web series streaming now with release dates and audience ratings.
            </p>
            <div className="nf-hero__meta">
              <span>{loading ? 'Loading...' : `${series.length} Series`}</span>
              {featured?.first_air_date ? <span>{formatDate(featured.first_air_date)}</span> : null}
              {featured?.vote_average > 0 ? <span>{featured.vote_average.toFixed(1)}/10</span> : null}
            </div>
            <div className="nf-hero__actions">
              <Link href="/ott-movies" className="nf-btn nf-btn--primary">Explore Movies</Link>
              <Link href="/theatre-release" className="nf-btn nf-btn--ghost">View Theatre Picks</Link>
            </div>
          </div>
        </section>

        <section className="nf-content">
          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>{loading ? 'Loading Series' : `All Series (${series.length})`}</h2>
            </div>
            {loading ? (
              <p className="nf-status">Loading web series...</p>
            ) : error ? (
              <p className="nf-status nf-status--error">{error}</p>
            ) : list.length === 0 && !featured ? (
              <p className="nf-status">No web series here yet. New Telugu series will land soon.</p>
            ) : (
              <div className="nf-collection__grid webseries-grid">
                {(featured ? [featured, ...list] : list).map((item) => (
                  <article key={item.id} className="nf-card nf-card--static">
                    <div className="nf-card__poster">
                      <Image
                        src={toPosterUrl(item)}
                        alt={item.name || 'Web series poster'}
                        fill
                        sizes="(max-width: 640px) 44vw, (max-width: 980px) 22vw, 15vw"
                        className="nf-card__image"
                      />
                      <span className="nf-card__badge">{getSeriesBadge(item)}</span>
                      {item.vote_average > 0 ? (
                        <span className="nf-card__rating">{item.vote_average.toFixed(1)}</span>
                      ) : null}
                      <div className="nf-card__overlay">
                        <span className="nf-card__overlay-cta">Latest Telugu Series</span>
                      </div>
                    </div>
                    <div className="nf-card__meta">
                      <h3>{item.name || 'Untitled'}</h3>
                      <p>{formatDate(item.first_air_date)} - Telugu Series</p>
                      <p className="webseries-card__overview">
                        {item.overview
                          ? item.overview.length > 110
                            ? `${item.overview.slice(0, 110)}...`
                            : item.overview
                          : 'No description available.'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <ContinueBrowsing
            title="Keep Watching"
            description="A series page should point straight into the next binge path."
            items={retentionItems}
          />
        </section>
      </main>
    </Layout>
  );
}
