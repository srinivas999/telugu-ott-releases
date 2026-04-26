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
        <nav className="site-nav" aria-label="Primary">
          <Link className="logo" href="/">
            <span className="ott-home-header__text ott-home-header__text--brand">Telugu</span>
            <span className="ott-home-header__text ott-home-header__text--accent">OTT</span>
            <span className="ott-home-header__text ott-home-header__text--brand">Releases</span>
          </Link>
          
          <div className="nav-search-container mobile-only">
            <SearchBar />
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

          <div
            id="primary-menu"
            className={`nav-menu ${menuOpen ? 'is-open' : ''}`}
            aria-hidden={!menuOpen}
          >
            <div className="nav-search-container desktop-only">
              <SearchBar />
            </div>
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
