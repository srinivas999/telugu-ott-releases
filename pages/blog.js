import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';

const values = [
  {
    title: 'Clarity Over Noise',
    body: 'This site exists to reduce the time Telugu OTT fans spend hunting across social posts and apps just to know what is releasing, where, and when.',
  },
  {
    title: 'Useful, Not Bloated',
    body: 'Release dates, platforms, ratings, and direct movie pages matter more here than filler updates and low-value listicles.',
  },
  {
    title: 'Telugu-First Discovery',
    body: 'The experience is designed for Telugu OTT discovery with less friction and faster decisions.',
  },
];

const promises = [
  'Track Telugu OTT releases in a way that feels fast and practical.',
  'Keep pages interconnected so discovery does not dead-end.',
  'Make weekly, platform, and quality-based browsing easy.',
  'Continuously improve structure so users get useful answers faster.',
];

const pathways = [
  {
    href: '/telugu-ott-releases-this-week',
    label: 'This Week',
    title: 'See only the newest Telugu OTT releases',
    body: 'A focused page for the next 7 days of streaming launches.',
  },
  {
    href: '/browse/trending-now',
    label: 'Trending',
    title: 'Browse what is buzzing now',
    body: 'A quick way to jump to currently trending OTT titles.',
  },
  {
    href: '/ott-movies',
    label: 'Full Archive',
    title: 'Explore the complete OTT release database',
    body: 'Browse all recorded Telugu OTT launches in one place.',
  },
  {
    href: '/theatre-release',
    label: 'Theatres',
    title: 'Track releases beyond OTT',
    body: 'Theatre releases add context to the full Telugu movie cycle.',
  },
];

const exploreNow = [
  {
    href: '/ott-movies',
    label: 'OTT Movies',
    title: 'Browse the full Telugu OTT release list',
    body: 'Search across the whole release database with platform filters.',
  },
  {
    href: '/telugu-ott-releases-this-week',
    label: 'This Week',
    title: 'Focus only on the next 7 days',
    body: 'Perfect if you want the quickest possible answer.',
  },
  {
    href: '/top-rated-telugu-ott-movies',
    label: 'Top Rated',
    title: 'Discover stronger picks faster',
    body: 'Useful when you care more about quality than release order.',
  },
  {
    href: '/theatre-release',
    label: 'Theatres',
    title: 'Track the Telugu ecosystem beyond OTT',
    body: 'See what is arriving in cinemas alongside streaming launches.',
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

      <main className="netflix-home blog-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb items={[{ name: 'Home', url: '/' }, { name: 'Blog' }]} />
        </div>

        <section className="nf-hero blog-hero">
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">Editorial</p>
            <h1>Why Telugu OTT Releases Exists</h1>
            <p className="nf-hero__desc">
              This website is built around one idea: Telugu movie discovery should feel simple, trustworthy, and fast.
            </p>
            <div className="nf-hero__actions">
              <Link href="/ott-movies" className="nf-btn nf-btn--primary">Browse OTT Movies</Link>
              <Link href="/telugu-ott-releases-this-week" className="nf-btn nf-btn--ghost">This Week</Link>
            </div>
          </div>
        </section>

        <section className="nf-content">
          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>The Problem This Site Solves</h2>
            </div>
            <p className="nf-collection-copy">
              Telugu OTT information often lives in too many places at once: platform apps, social posts, announcement posters, and scattered coverage.
              Telugu OTT Releases is designed to bring clean answers into one place with meaningful navigation between related pages.
            </p>
            <p className="nf-collection-copy">
              The goal is to make the first visit useful and every follow-up visit faster, with practical release intelligence instead of noise.
            </p>
          </section>

          <section className="nf-genre">
            <div className="nf-genre__header">
              <h2>Core Values</h2>
            </div>
            <div className="nf-genre__grid">
              {values.map((item) => (
                <article key={item.title} className="nf-genre__card nf-genre__card--static">
                  <span>{item.title}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>Editorial Promise</h2>
            </div>
            <div className="blog-promise">
              {promises.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>

          <section className="nf-genre">
            <div className="nf-genre__header">
              <h2>Best Ways To Use It</h2>
            </div>
            <div className="nf-genre__grid">
              {pathways.map((item) => (
                <Link key={item.href} href={item.href} className="nf-genre__card">
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>Long-Term Vision</h2>
            </div>
            <div className="blog-longread">
              <p>
                The long-term goal is not just to list release dates. It is to build a Telugu entertainment discovery layer that helps users move naturally between OTT releases, theatre releases, platform catalogs, and quality-first picks.
              </p>
              <p>
                That means better page structure, stronger internal linking, richer movie pages, and clearer weekly updates so this site becomes a true home base for Telugu streaming discovery.
              </p>
            </div>
          </section>

          <section className="nf-genre">
            <div className="nf-genre__header">
              <h2>Explore Now</h2>
            </div>
            <div className="nf-genre__grid">
              {exploreNow.map((item) => (
                <Link key={item.href} href={item.href} className="nf-genre__card">
                  <span>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </main>
    </Layout>
  );
}
