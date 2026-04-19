import { useRouter } from 'next/router';
import Nav from './Nav';
import Footer from './Footer';

export default function Layout({ children }) {
  const router = useRouter();

  return (
    <>
       <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}
