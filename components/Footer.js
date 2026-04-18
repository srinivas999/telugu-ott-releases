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
            </ul>
          </nav>
         
        </div>
        <p className="site-footer__copy">&copy; {new Date().getFullYear()} Srinivas. All rights reserved.</p>
      </div>
    </footer>
  );
}
