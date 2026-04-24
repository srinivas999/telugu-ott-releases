import Link from 'next/link';

const footerGroups = [
  {
    title: 'Discover',
    links: [
      { href: '/ott-movies', label: 'All OTT Movies' },
      { href: '/telugu-ott-releases-this-week', label: 'This Week' },
      { href: '/top-rated-telugu-ott-movies', label: 'Top Rated' },
      { href: '/theatre-release', label: 'Theatre Releases' },
    ],
  },
  {
    title: 'Platforms',
    links: [
      { href: '/platform/netflix', label: 'Netflix' },
      { href: '/platform/aha', label: 'Aha' },
      { href: '/platform/prime-video', label: 'Prime Video' },
      { href: '/platform/jiohotstar', label: 'JioHotstar' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/blog', label: 'The Heart Of This Site' },
      { href: '/web-series', label: 'Web Series' },
      { href: '/contact', label: 'Contact' },
      { href: '/', label: 'Home' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <p className="site-footer__eyebrow">Telugu OTT Releases</p>
            <h2 className="site-footer__name">Your Telugu streaming discovery home</h2>
            <p className="site-footer__tagline">
              Track Telugu OTT releases, find what is streaming this week, explore top rated titles, and move quickly between movie pages, platforms, and theatre releases.
            </p>
            <div className="site-footer__cta-row">
              <Link href="/telugu-ott-releases-this-week" className="site-footer__cta site-footer__cta--primary">
                See This Week&apos;s Releases
              </Link>
              <Link href="/blog" className="site-footer__cta site-footer__cta--secondary">
                Read The Story Behind The Site
              </Link>
            </div>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} className="site-footer__nav" aria-label={group.title}>
              <p className="site-footer__label">{group.title}</p>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="site-footer__bottom">
          <p className="site-footer__copy">
            &copy; {new Date().getFullYear()} Telugu OTT Releases. Built to make Telugu movie discovery simpler, faster, and more useful.
          </p>
          <p className="site-footer__note">
            Streaming dates and availability can change. Use movie pages for the latest tracked details.
          </p>
        </div>
      </div>
    </footer>
  );
}
