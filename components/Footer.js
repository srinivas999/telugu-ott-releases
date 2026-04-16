import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <p className="site-footer__name">Srinivas</p>
            <p className="site-footer__tagline">
              UX designer crafting digital experiences people actually enjoy using.
            </p>
          </div>
          <nav className="site-footer__nav" aria-label="Footer">
            <p className="site-footer__label" id="footer-nav-label">
              Navigate
            </p>
            <ul aria-labelledby="footer-nav-label">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/projects">Projects</Link>
              </li>
              <li>
                <Link href="/ott-movies">OTT MOVIES</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </nav>
          <div className="site-footer__social">
            <p className="site-footer__label" id="footer-social-label">
              Connect
            </p>
            <ul aria-labelledby="footer-social-label">
              <li>
                <a
                  href="https://www.linkedin.com/in/srinivas-villa-30222560/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://dribbble.com/srinivasv"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Dribbble
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/srinivas999/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="site-footer__copy">&copy; {new Date().getFullYear()} Srinivas. All rights reserved.</p>
      </div>
    </footer>
  );
}
