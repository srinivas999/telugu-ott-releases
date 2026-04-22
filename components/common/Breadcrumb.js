/**
 * Breadcrumb Navigation Component
 * Improves UX and provides schema.org structured data for SEO
 */

import Link from 'next/link';
import { generateBreadcrumbSchema } from '../../lib/utils/schema';
import styles from './Breadcrumb.module.css';

export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  // Generate schema for SEO
  const schema = generateBreadcrumbSchema(items);

  return (
    <>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol className={styles.list}>
          {items.map((item, index) => (
            <li key={index} className={styles.item}>
              {item.url ? (
                <>
                  <Link href={item.url} className={styles.link}>
                    {item.name}
                  </Link>
                  {index < items.length - 1 && (
                    <span className={styles.separator}>/</span>
                  )}
                </>
              ) : (
                <>
                  <span className={styles.current}>{item.name}</span>
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Schema markup for search engines */}
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </>
  );
}
