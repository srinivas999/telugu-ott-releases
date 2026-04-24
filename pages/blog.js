import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import Breadcrumb from '../components/common/Breadcrumb';

export default function BlogPage() {
  const router = useRouter();
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

return (
    <Layout>
      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog' }]} />
      <section className="page-projects page-ott">
        <div className="projects-page-inner">

          <section className="ott-hero">
           
            <div className="ott-hero__panel">
              <h1>Blog</h1>
              <p className="ott-hero__tagline">
                Coming Soon
              </p>
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}

