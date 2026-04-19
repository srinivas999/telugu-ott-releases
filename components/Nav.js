import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/theatre-release', label: 'Theatre Release' },
  { href: '/web-series', label: 'Web Series' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact Us' }
];
/* 
                <div className="projects-page-inner">
          <div className="ott-home-header">
            <div className="ott-home-header__inner">
              <a href="/" className="ott-home-header__brand">
                <span className="ott-home-header__text ott-home-header__text--brand">telugu</span>
                <span className="ott-home-header__text ott-home-header__text--accent">OTT</span>
                <span className="ott-home-header__text ott-home-header__text--brand">Releases</span>
              </a>
              <nav className="ott-home-header__nav" aria-label="Primary site navigation">
                <a href="/" className="ott-home-header__link">Home</a>
                <a href="/theatre-release" className="ott-home-header__link">Theatre Release</a>
                <a href="/web-series" className="ott-home-header__link">Web Series</a>
                <a href="/blog" className="ott-home-header__link">Blog</a>
                <a href="/contact" className="ott-home-header__link">Contact Us</a>
              </nav>
            </div>
          </div>
        
        </div> */
export default function Nav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);

    return () => {
      document.body.classList.remove('nav-open');
    };
  }, [menuOpen]);

  return (
    <header className={`site-header ${menuOpen ? 'is-open' : ''}`}>
      <nav className="site-nav" aria-label="Primary">
        <Link className="logo" href="/">
          <span className="ott-home-header__text ott-home-header__text--brand">Telugu</span>
          <span className="ott-home-header__text ott-home-header__text--accent">OTT</span>
          <span className="ott-home-header__text ott-home-header__text--brand">Releases</span>
        </Link>
        
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span className="nav-toggle__lines" aria-hidden="true">
            <span className="nav-toggle__bar" />
            <span className="nav-toggle__bar" />
            <span className="nav-toggle__bar" />
          </span>
        </button>

        <div id="primary-menu" className="nav-menu">
          <ul className="nav-links">
            {navLinks.map((link) => {
              const active = router.pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={active ? 'is-active' : ''}
                    aria-current={active ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div
        className="nav-backdrop"
        aria-hidden={!menuOpen}
        onClick={() => setMenuOpen(false)}
      />
    </header>
  );
}
