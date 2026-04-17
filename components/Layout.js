import { useRouter } from 'next/router';
import Nav from './Nav';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();
  const hideHeader = router.pathname === '/ott-movies';

  return (
    <>
      {!hideHeader && <Nav />}
      <main>{children}</main>
      <Footer />
    </>
  );
}
