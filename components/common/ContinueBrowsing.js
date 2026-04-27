import Link from 'next/link';

export default function ContinueBrowsing({ title = 'Continue Browsing', description = '', items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <section className="nf-retention" aria-label={title}>
      <div className="nf-retention__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="nf-retention__grid">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="nf-retention__card">
            <span className="nf-retention__eyebrow">{item.eyebrow}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <span className="nf-retention__cta">{item.cta || 'Keep Exploring'}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
