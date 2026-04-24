
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

function WebSeriesCard({ series }) {
  return (
    <div className="webseries-card">
      <div className="webseries-card__img-wrap">
        <img
          src={series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : '/images/default_poster.png'}
          alt={series.name}
          className="webseries-card__img"
        />
      </div>
      <div className="webseries-card__body">
        <h2 className="webseries-card__title">{series.name}</h2>
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
        setError(''); // Clear error if fetch succeeds
      } catch (err) {
        setError(err.message);
        setSeries([]); // Clear data if fetch fails
      }
      setLoading(false);
    }
    fetchSeries();
  }, []);

  return (
<Layout>
      <Seo title="Latest Telugu Web Series" description="Latest Telugu web series streaming on OTT platforms. Find new Telugu web series releases with posters, ratings, and more." />
      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Web Series' }]} />
      <section className="ott-hero">
        <div className="ott-hero__panel">
          <h1>Latest Telugu Web Series</h1>
          <p className="ott-hero__tagline">Discover the newest Telugu web series streaming now!</p>
        </div>
      </section>
      <section className="webseries-list-section">
        {loading ? (
          <div className="webseries-list__loading">Loading…</div>
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
    </Layout>
  );
}

