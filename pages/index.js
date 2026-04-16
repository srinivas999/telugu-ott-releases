import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Srinivas OTT Movies',
  url: 'https://svteluguott.in/',
  description:
    'Telugu OTT releases this week, upcoming OTT movies, streaming dates, and platform availability across Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.',
};

export default function HomePage() {
  return (
    <Layout>
      <Seo
        title="Telugu OTT releases this week"
        description="Telugu OTT releases this week: upcoming OTT movies on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win with streaming dates and platform availability."
        url="/"
        keywords="Telugu OTT releases this week, upcoming OTT movies Telugu, Netflix Telugu premieres, Aha Telugu releases, Prime Video Telugu"
        jsonLd={jsonLd}
      />

      <section className="projects-page-inner">
        <header className="projects-page-header">
          <h1>Telugu OTT releases this week</h1>
          <p className="projects-page-lede">
            Weekly Telugu OTT release schedule for upcoming movies on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.
          </p>
          <p className="projects-page-lede">
            Find the latest streaming dates, platform partners, and release details for April 2026 and beyond.
          </p>
        </header>

        <div className="homepage-grid">
          <article className="homepage-card">
            <h2>Latest OTT releases</h2>
            <p>
              Quickly browse the newest Telugu OTT movies and learn where to watch them today.
            </p>
            <Link href="/ott-movies" className="button-link">
              View OTT schedule
            </Link>
          </article>

          <article className="homepage-card">
            <h2>About Srinivas</h2>
            <p>
              A UX designer focused on creating calm, usable product experiences across mobile and web.
            </p>
            <Link href="/about" className="button-link">
              Learn more
            </Link>
          </article>

          <article className="homepage-card">
            <h2>Projects & case studies</h2>
            <p>
              Explore recent work in product design, research, and digital storytelling.
            </p>
            <Link href="/projects" className="button-link">
              Explore projects
            </Link>
          </article>

          <article className="homepage-card">
            <h2>Contact</h2>
            <p>
              Want to collaborate or ask about a project? Reach out and start the conversation.
            </p>
            <Link href="/contact" className="button-link">
              Get in touch
            </Link>
          </article>
        </div>
      </section>
    </Layout>
  );
}
