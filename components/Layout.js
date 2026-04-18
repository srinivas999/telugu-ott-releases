import { useRouter } from 'next/router';
import Nav from './Nav';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();
  const hideHeader = router.pathname === '/' || router.pathname === '/ott-movies' || router.pathname === '/theatre-release' || router.pathname === '/theatre-release/[id]';

  return (
    <>
      {!hideHeader && <Nav />}
      <main>{children}</main>
      <Footer />
    </>
  );
}
