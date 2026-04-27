import Head from 'next/head';

export default function Seo({
  title,
  description,
  url,
  image,
  keywords,
  jsonLd,
  robots = 'index,follow',
}) {
  const pageTitle = title ? `${title} | Srinivas OTT Movies` : 'Srinivas OTT Movies';
  const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const defaultImage = `https://svteluguott.in${assetBasePath}/images/default_poster.png`;
  const pageUrl = url ? `https://svteluguott.in${url}` : 'https://svteluguott.in';
  const ogImage = image || defaultImage;
  const schemas = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : jsonLd ? [jsonLd] : [];

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <link rel="canonical" href={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Srinivas OTT Movies" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@Srinivas" />
      <meta name="twitter:creator" content="@Srinivas" />
      <meta name="robots" content={robots} />
      {schemas.map((schema, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}
