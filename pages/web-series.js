import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

function WebSeriesCard({ series }) {
  return (
    <div className="webseries-card">
      <div className="webseries-card__img-wrap">
        <Image
          src={series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : '/images/default_poster.png'}
          alt={series.name}
          className="webseries-card__img"
          fill
          sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
      </div>
      <div className="webseries-card__body">
        <h3 className="webseries-card__title">{series.name}</h3>
        <div className="webseries-card__meta">
          <span>{series.first_air_date ? new Date(series.first_air_date).toLocaleDateString() : 'TBA'}</span>
          {series.vote_average > 0 && <span className="webseries-card__rating">★ {series.vote_average.toFixed(1)}</span>}
        </div>
        <p className="webseries-card__desc">{series.overview || 'No description available.'}</p>
      </div>
    </div>
  );
}

export default function WebSeriesPage() {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSeries() {
      setLoading(true);
      try {
        const res = await fetch('/api/tmdb/latest-webseries');
        if (!res.ok) throw new Error('Failed to fetch web series');
        const data = await res.json();
        setSeries(data.results || []);
        setError('');
      } catch (err) {
        setError(err.message);
        setSeries([]);
      }
      setLoading(false);
    }

    fetchSeries();
  }, []);

  return (
    <Layout>
      <Seo
        title="Latest Telugu Web Series"
        description="Latest Telugu web series streaming on OTT platforms. Find new Telugu web series releases with posters, ratings, and more."
        url="/web-series"
        keywords="latest Telugu web series, Telugu OTT web series, Telugu streaming series"
      />

      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Web Series' }]} />

      <section className="ott-hero">
        <div className="ott-hero__panel">
          <h1>Latest Telugu Web Series</h1>
          <p className="ott-hero__tagline">Discover the newest Telugu web series streaming now!</p>
        </div>
      </section>

      <section className="webseries-list-section">
        <h2 className="visually-hidden">Latest Telugu web series list</h2>
        {loading ? (
          <div className="webseries-list__loading">Loading...</div>
        ) : error ? (
          <div className="webseries-list__error">{error}</div>
        ) : series.length === 0 ? (
          <div className="webseries-list__empty">No web series found.</div>
        ) : (
          <div className="webseries-list-grid">
            {series.map((s) => (
              <WebSeriesCard key={s.id} series={s} />
            ))}
          </div>
        )}
      </section>

      <section className="webseries-list-section">
        <h2 className="webseries-list__loading">Explore More</h2>
        <div className="webseries-list-grid">
          <Link href="/ott-movies" className="webseries-card">
            <div className="webseries-card__body">
              <h3 className="webseries-card__title">OTT Movies</h3>
              <p className="webseries-card__desc">Browse upcoming and latest Telugu OTT movie releases.</p>
            </div>
          </Link>
          <Link href="/theatre-release" className="webseries-card">
            <div className="webseries-card__body">
              <h3 className="webseries-card__title">Theatre Releases</h3>
              <p className="webseries-card__desc">Track Tollywood theatrical releases with ratings and details.</p>
            </div>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
