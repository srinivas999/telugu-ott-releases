import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/ott-movies', label: 'OTT MOVIES' },
  { href: '/contact', label: 'Contact' },
];

export default function Nav() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.pathname]);

  return (
    <header className={`site-header ${menuOpen ? 'is-open' : ''}`}>
      <nav className="site-nav" aria-label="Primary">
        <Link className="logo" href="/">
          Srinivas
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
