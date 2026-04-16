import Layout from '../components/Layout';
import Seo from '../components/Seo';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Srinivas Projects',
  itemListElement: [],
};

export default function ProjectsPage() {
  return (
    <Layout>
      <Seo
        title="Projects"
        description="Explore Srinivas's UX projects, OTT tools, and design work."
        url="/projects"
        keywords="UX portfolio, projects, OTT tools, design case studies, Srinivas"
        jsonLd={jsonLd}
      />

      <section className="page-projects">
        <div className="projects-page-inner">
          <header className="projects-page-header">
            <h1>Projects</h1>
            <p className="projects-page-lede">
              Case studies across fintech, healthcare, enterprise SaaS, and consumer mobile—grounded in research and polished in the details.
            </p>
          </header>

          <div className="project-grid">
            <article className="project-card project-card--banking">
              <div className="project-card__visual" aria-hidden="true">
                <span className="project-card__visual-label">Banking onboarding</span>
              </div>
              <div className="project-card__body">
                <h3 className="project-card__title">Redesigning a banking app’s onboarding flow</h3>
                <p className="project-card__desc">
                  Simplified KYC steps, clearer progress, and error recovery so new customers could open an account without abandoning mid-flow—validated through moderated usability sessions.
                </p>
                <ul className="project-card__tags">
                  <li>Figma</li>
                  <li>User interviews</li>
                  <li>Maze</li>
                </ul>
                <a href="#" className="project-card__cta" title="Case study page coming soon">
                  View Case Study
                </a>
              </div>
            </article>

            <article className="project-card project-card--health">
              <div className="project-card__visual" aria-hidden="true">
                <span className="project-card__visual-label">Health dashboard</span>
              </div>
              <div className="project-card__body">
                <h3 className="project-card__title">A health tracking dashboard for elderly users</h3>
                <p className="project-card__desc">
                  Larger tap targets, high-contrast charts, and plain-language summaries helped older adults follow vitals and medications with confidence alongside family caregivers.
                </p>
                <ul className="project-card__tags">
                  <li>Figma</li>
                  <li>Accessibility</li>
                  <li>Prototyping</li>
                </ul>
                <a href="#" className="project-card__cta" title="Case study page coming soon">
                  View Case Study
                </a>
              </div>
            </article>

            <article className="project-card project-card--saas">
              <div className="project-card__visual" aria-hidden="true">
                <span className="project-card__visual-label">B2B navigation</span>
              </div>
              <div className="project-card__body">
                <h3 className="project-card__title">A B2B SaaS product’s navigation overhaul</h3>
                <p className="project-card__desc">
                  Rebuilt IA and global nav from card sorting and tree testing—reducing time-to-task for power users while onboarding newcomers with contextual guidance.
                </p>
                <ul className="project-card__tags">
                  <li>Figma</li>
                  <li>Information architecture</li>
                  <li>Workshops</li>
                </ul>
                <a href="#" className="project-card__cta" title="Case study page coming soon">
                  View Case Study
                </a>
              </div>
            </article>

            <article className="project-card project-card--food">
              <div className="project-card__visual" aria-hidden="true">
                <span className="project-card__visual-label">Food ordering</span>
              </div>
              <div className="project-card__body">
                <h3 className="project-card__title">A mobile food ordering experience</h3>
                <p className="project-card__desc">
                  Streamlined browse-to-checkout, transparent wait times, and reorder shortcuts increased completion rates during peak lunch hours on small screens.
                </p>
                <ul className="project-card__tags">
                  <li>Figma</li>
                  <li>Mobile UX</li>
                  <li>Usability testing</li>
                </ul>
                <a href="#" className="project-card__cta" title="Case study page coming soon">
                  View Case Study
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>
    </Layout>
  );
}
