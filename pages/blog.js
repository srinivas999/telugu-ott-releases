import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

const values = [
  {
    title: 'Clarity Over Noise',
    body: 'This site exists to reduce the time Telugu OTT fans spend hunting across social posts, rumor threads, and platform apps just to answer one simple question: what is releasing, where, and when?',
  },
  {
    title: 'Useful, Not Bloated',
    body: 'Every page should help you decide faster. Release dates, platforms, ratings, and direct movie pages matter more here than filler, celebrity gossip, or empty listicles.',
  },
  {
    title: 'Telugu-First Discovery',
    body: 'The site is built for people who specifically want Telugu movie discovery. That means spotlighting Telugu OTT launches, theatre crossover titles, and platform-wise browsing with less friction.',
  },
];

const promises = [
  'Track Telugu OTT releases in a way that feels fast and practical.',
  'Keep movie pages connected so users can jump from one useful page to the next.',
  'Make platform, weekly, and top-rated discovery easy for both people and search engines.',
  'Keep improving the site structure so the best content gets to the user faster.',
];

const pathways = [
  {
    href: '/telugu-ott-releases-this-week',
    label: 'This Week',
    title: 'See only the newest Telugu OTT releases',
    body: 'A focused page for the next 7 days of streaming launches.',
  },
  {
    href: '/top-rated-telugu-ott-movies',
    label: 'Top Rated',
    title: 'Browse the best rated Telugu OTT movies',
    body: 'Useful when you want quality first instead of newest first.',
  },
  {
    href: '/ott-movies',
    label: 'Full Archive',
    title: 'Explore the entire OTT release database',
    body: 'Filter by platform and browse all recorded Telugu OTT launches.',
  },
  {
    href: '/theatre-release',
    label: 'Theatres',
    title: 'Track what is happening beyond OTT',
    body: 'Theatre releases add context to the overall Telugu release landscape.',
  },
];

export default function BlogPage() {
  return (
    <Layout>
      <Seo
        title="The Heart Of Telugu OTT Releases"
        description="Read the purpose, editorial approach, and long-term vision behind Telugu OTT Releases."
        url="/blog"
        keywords="about Telugu OTT Releases, Telugu OTT website, Telugu OTT blog, Telugu movie release tracker"
      />

      <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog' }]} />

      <section className="page-projects page-ott">
        <div className="projects-page-inner">
          <section className="ott-hero blog-manifesto">
            <div className="ott-hero__panel">
              <p className="eyebrow">The Heart</p>
              <h1>Why Telugu OTT Releases exists</h1>
              <p className="ott-hero__tagline">
                This website is built around one idea: Telugu movie discovery should feel simple, trustworthy, and fast. Users should not have to dig through scattered updates to understand what is releasing on OTT and where to watch it.
              </p>
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <h2>The Problem This Site Tries To Solve</h2>
            </div>
            <p>
              Telugu OTT information often lives in too many places at once: platform apps, social media posts, poster announcements, comments, and scattered entertainment coverage. That creates friction for users who only want a clean answer.
            </p>
            <p>
              Telugu OTT Releases is meant to become that clean answer. It brings together OTT release dates, movie pages, platform data, ratings, and related discovery paths in one place so the site feels useful on the first visit and on every visit after that.
            </p>
          </section>

          <section className="ott-section blog-grid-section">
            <div className="section-heading">
              <p className="eyebrow">Core Values</p>
              <h2>What guides the website</h2>
            </div>
            <div className="blog-manifesto__grid">
              {values.map((item) => (
                <article key={item.title} className="blog-manifesto__card">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <p className="eyebrow">Editorial Promise</p>
              <h2>What users should expect from this site</h2>
            </div>
            <div className="blog-manifesto__list">
              {promises.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>

          <section className="ott-section blog-grid-section">
            <div className="section-heading">
              <p className="eyebrow">Best Ways To Use It</p>
              <h2>Choose your path into Telugu OTT discovery</h2>
            </div>
            <div className="blog-manifesto__grid">
              {pathways.map((item) => (
                <Link key={item.href} href={item.href} className="blog-manifesto__card blog-manifesto__card--link">
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="ott-section ott-seo-copy">
            <div className="section-heading">
              <p className="eyebrow">Long-Term Vision</p>
              <h2>Where this website is headed</h2>
            </div>
            <p>
              The long-term goal is not just to list release dates. It is to build a Telugu entertainment discovery layer that helps users move naturally between OTT releases, theatre releases, platform catalogs, and quality-based picks without confusion.
            </p>
            <p>
              That means better page structure, stronger internal linking, richer movie detail pages, clearer weekly updates, and category pages that feel genuinely helpful. The best version of this site should feel like a home base for Telugu streaming discovery.
            </p>
          </section>

          <section className="ott-section ott-home-links">
            <div className="section-heading">
              <p className="eyebrow">Explore Now</p>
              <h2>Start with the pages people use most</h2>
            </div>
            <div className="ott-home-links__grid">
              <Link href="/ott-movies" className="ott-home-links__card">
                <span>OTT Movies</span>
                <h3>Browse the full Telugu OTT release list</h3>
                <p>Search across the whole release database with platform filters.</p>
              </Link>
              <Link href="/telugu-ott-releases-this-week" className="ott-home-links__card">
                <span>This Week</span>
                <h3>Focus only on the next 7 days</h3>
                <p>Perfect if you want the quickest possible answer.</p>
              </Link>
              <Link href="/top-rated-telugu-ott-movies" className="ott-home-links__card">
                <span>Top Rated</span>
                <h3>Discover stronger picks faster</h3>
                <p>Useful when you care more about quality than release order.</p>
              </Link>
              <Link href="/theatre-release" className="ott-home-links__card">
                <span>Theatres</span>
                <h3>Track the Telugu movie ecosystem beyond OTT</h3>
                <p>See what is arriving in cinemas alongside streaming launches.</p>
              </Link>
            </div>
          </section>
        </div>
      </section>
    </Layout>
  );
}
