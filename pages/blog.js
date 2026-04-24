import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

export default function BlogPage() {
  return (
    <Layout>
      <Seo
        title="Telugu OTT Blog"
        description="Updates, explainers, and release roundups for Telugu OTT movies, streaming platforms, and weekly premieres."
        url="/blog"
        keywords="Telugu OTT blog, OTT movie news Telugu, weekly OTT releases Telugu"
      />

      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog' }]} />

      <section className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="ott-hero">
            <div className="ott-hero__panel">
              <h1>Blog</h1>
              <p className="ott-hero__tagline">
                Weekly Telugu OTT updates, release explainers, and platform roundups are coming soon.
              </p>
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <h2>Explore Telugu OTT Releases</h2>
            </div>
            <p>
              While the blog archive is being prepared, you can explore the latest release calendars and movie pages across the site.
            </p>
            <p>
              <Link href="/ott-movies">Browse OTT movies</Link> |{' '}
              <Link href="/theatre-release">See theatre releases</Link> |{' '}
              <Link href="/web-series">Check web series</Link>
            </p>
          </section>
        </div>
      </section>
    </Layout>
  );
}
