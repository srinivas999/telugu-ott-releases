/**
 * Schema Markup Component
 * Renders JSON-LD structured data for SEO
 */

export default function SchemaMarkup({ schema }) {
  if (!schema) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
