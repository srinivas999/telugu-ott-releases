import Nav from './Nav';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <>
      <Nav />
      <div className="layout-shell">{children}</div>
      <Footer />
    </>
  );
}
