import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function WebSeriesPage() {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <Layout>
       <section className="ott-hero">
            <div className="ott-hero__panel">
              <h1>Web Series</h1>
              <p className="ott-hero__tagline">
                Coming Soon
              </p>
            </div>
          </section>
    </Layout>
  );
}

