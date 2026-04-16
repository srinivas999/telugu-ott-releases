import Layout from '../components/Layout';
import Seo from '../components/Seo';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Srinivas',
  description:
    'Srinivas is a UX designer focused on making digital experiences feel obvious, calm, and useful.',
  url: 'https://svteluguott.in/about',
};

export default function AboutPage() {
  return (
    <Layout>
      <Seo
        title="About"
        description="Learn about Srinivas, UX designer and OTT product creator."
        url="/about"
        keywords="Srinivas, UX designer, portfolio, OTT product, Telugu movies"
        jsonLd={jsonLd}
      />

      <section className="page-about">
        <div className="about-page-inner">
          <section className="about-intro section" aria-labelledby="about-heading">
            <h1 id="about-heading">About</h1>
            <div className="about-intro__grid">
              <div className="about-avatar" role="img" aria-label="Profile placeholder, initials VS">
                VS
              </div>
              <div className="about-intro__body">
                <p>
                  Srinivas is a UX designer with a background in understanding how people think, feel,
                  and behave when they use digital products. Their path has been shaped by close
                  collaboration with researchers, product managers, and engineers—always with the goal of
                  making complex workflows feel obvious and calm.
                </p>
                <p>
                  Their design philosophy is simple: start with real problems, test early and often, and
                  favor clarity over cleverness. They believe good UX is invisible when it works—people
                  should accomplish what they came to do without fighting the interface.
                </p>
                <p>
                  What they love most about UX is the constant learning: every study, prototype, and
                  launch reveals something new about human motivation, and there is nothing more rewarding
                  than seeing research turn into something people genuinely enjoy using.
                </p>
              </div>
            </div>
          </section>

          <section className="about-timeline section" aria-labelledby="timeline-heading">
            <h2 id="timeline-heading">Career timeline</h2>
            <ol className="timeline">
              <li className="timeline__item">
                <span className="timeline__year">2019</span>
                <div className="timeline__content">
                  <p className="timeline__title">First UX-focused role</p>
                  <p className="timeline__desc">
                    Joined a product team as a UX designer, building skills in user research,
                    information architecture, and prototyping alongside engineering partners.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2020</span>
                <div className="timeline__content">
                  <p className="timeline__title">Research-led iterations</p>
                  <p className="timeline__desc">
                    Shipped redesigns grounded in usability findings and established a rhythm of regular
                    testing with real users on core journeys.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2021</span>
                <div className="timeline__content">
                  <p className="timeline__title">End-to-end ownership</p>
                  <p className="timeline__desc">
                    Took ownership of full flows across web and mobile, from discovery workshops through
                    high-fidelity specs and handoff in Figma.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2022</span>
                <div className="timeline__content">
                  <p className="timeline__title">Evidence in production</p>
                  <p className="timeline__desc">
                    Combined qualitative insights with usage data to refine flows after launch and
                    prioritize the next wave of improvements.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2023</span>
                <div className="timeline__content">
                  <p className="timeline__title">Cross-team initiatives</p>
                  <p className="timeline__desc">
                    Led complex, multi-squad workstreams and contributed to shared libraries, patterns,
                    and documentation that kept design and build aligned.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2024</span>
                <div className="timeline__content">
                  <p className="timeline__title">Storytelling and alignment</p>
                  <p className="timeline__desc">
                    Used narrative prototypes and workshops to align stakeholders on direction before
                    committing engineering time to major bets.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2025</span>
                <div className="timeline__content">
                  <p className="timeline__title">Mentorship and craft</p>
                  <p className="timeline__desc">
                    Mentored newer designers, facilitated critique, and partnered with leadership on
                    product direction while staying hands-on in research and visual design.
                  </p>
                </div>
              </li>
              <li className="timeline__item">
                <span className="timeline__year">2026</span>
                <div className="timeline__content">
                  <p className="timeline__title">Today</p>
                  <p className="timeline__desc">
                    Continues to design human-centered experiences—balancing business goals with
                    accessibility, clarity, and moments of delight in every release.
                  </p>
                </div>
              </li>
            </ol>
          </section>
        </div>
      </section>
    </Layout>
  );
}
