# Srinivas Portfolio

A simple static portfolio site for a UX designer, built with HTML, CSS, and JavaScript.

The project also includes Supabase integration for storing contact form submissions and an admin page for reviewing submissions.

## Features

- Portfolio landing page with sections for about, projects, and contact
- Contact form that submits user data to Supabase
- Admin interface to review contact submissions and mark them as read
- Responsive layout and interactive navigation

## Files

- `index.html` — main landing page
- `about.html` — about page
- `projects.html` — projects overview page
- `contact.html` — contact page with submission form
- `admin.html` — admin dashboard for submission review
- `css/styles.css` — project styles
- `js/script.js` — shared UI behavior and navigation
- `js/contact-supabase.js` — Supabase contact form submission logic
- `js/admin.js` — Supabase admin fetch and update logic
- `supabase-config.example.js` — local Supabase config template

## Setup

1. Open the project in a code editor.
2. Copy `supabase-config.example.js` to `supabase-config.js`.
3. Replace the placeholder values in `supabase-config.js` with your Supabase project URL and anon key.
4. Serve the site using a local HTTP server for best compatibility (recommended).

> `supabase-config.js` is ignored by Git and should not be committed. Deployments use GitHub Secrets to generate this file.

### Example local server commands

- Python 3:
  ```bash
  python -m http.server 8000
  ```
- Node.js (if you have `serve` installed):
  ```bash
  npx serve .
  ```

Then open `http://localhost:8000` in your browser.

## Search Console

1. Open Google Search Console and add your site property: `https://svteluguott.in`
2. Verify ownership through your hosting provider or DNS record.
3. In Search Console, go to "Sitemaps" and submit:
   - `https://svteluguott.in/sitemap.xml`
4. Use the URL inspection tool to request indexing for important pages like `/`, `/ott-movies.html`, and `/about.html`.

This helps Google discover your sitemap faster and index your Telugu OTT content more quickly.

## Supabase Notes

- The contact form submits data to the `contact_submissions` table.
- The admin page fetches rows from the `contact_submissions` table ordered by newest first.
- Each admin card includes a button to mark a submission as read by updating the `is_read` field.

## Important

This project currently has no authentication or login protection on `admin.html`, so it should only be used for demos or development until access control is added.
