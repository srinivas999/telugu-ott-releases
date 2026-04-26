import '../css/styles.css';
import '../css/ott-movies.css';
import '../css/hero-v2.css';
import '../css/ott-table-v3.css';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/next';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
