import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SearchBar from './SearchBar';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/theatre-release', label: 'Theatre Release' },
  { href: '/web-series', label: 'Web Series' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact Us' }
];

export default function Nav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const isLinkActive = useCallback(
    (href) => (href === '/' ? router.pathname === href : router.pathname.startsWith(href)),
    [router.pathname]
  );

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', menuOpen);

    // Scroll to top when menu opens on mobile
    if (menuOpen && window.innerWidth <= 767.98) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    return () => {
      document.body.classList.remove('nav-open');
    };
  }, [menuOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 767.98) {
        setMenuOpen(false);
      }
    }

    function handleScroll() {
      setShowScrollTop(window.scrollY > 400);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <header className={`site-header ${menuOpen ? 'is-open' : ''}`}>
        <div className="header-glow" aria-hidden="true" />
        <nav className="site-nav" aria-label="Primary">
          <div className="site-nav__brand">
            <Link className="logo" href="/">
              <span className="logo-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logoGrad1)" />
                  <path d="M2 17L12 22L22 17" stroke="url(#logoGrad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="url(#logoGrad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="logoGrad1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f97316" />
                      <stop offset="1" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="logoGrad2" x1="2" y1="12" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#f59e0b" />
                      <stop offset="1" stopColor="#dc2626" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span className="logo-text">
                <span className="logo-text__eyebrow">Daily tracker</span>
                <span className="logo-text__title">
                  <span className="logo-text__primary">Telugu</span>
                  <span className="logo-text__accent">OTT</span>
                  <span className="logo-text__secondary">Releases</span>
                </span>
              </span>
            </Link>
         {/*    <div className="nav-status desktop-only" aria-label="Site focus">
              <span className="nav-status__dot" aria-hidden="true" />
              New drops, theatre dates, and streaming updates
            </div> */}
          </div>

          <div className="nav-menu" id="primary-menu">
            <ul className="nav-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={isLinkActive(link.href) ? 'is-active' : undefined}
                    aria-current={isLinkActive(link.href) ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="nav-search-container desktop-only">
              <SearchBar />
            </div>
          </div>

          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            aria-haspopup="true"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((value) => !value)}
          >
            <span className="nav-toggle__lines" aria-hidden="true">
              <span className="nav-toggle__bar" />
              <span className="nav-toggle__bar" />
              <span className="nav-toggle__bar" />
            </span>
          </button>

          <div className="nav-search-container mobile-only">
            <SearchBar />
          </div>
        </nav>
        <div
          className={`nav-backdrop ${menuOpen ? 'is-visible' : ''}`}
          aria-hidden={!menuOpen}
          onClick={() => setMenuOpen(false)}
        />
      </header>

      <button
        type="button"
        className={`scroll-to-top ${showScrollTop ? 'is-visible' : ''}`}
        onClick={handleScrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </>
  );
}
