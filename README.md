# Srinivas Portfolio

A simple static portfolio site for a UX designer, built with HTML, CSS, and JavaScript.

The project also includes Supabase integration for storing contact form submissions and an admin page for reviewing submissions.

## Features

- Portfolio landing page with sections for about, projects, and contact
- Contact form that submits user data to Supabase
- Admin interface to review contact submissions and mark them as read
- Responsive layout and interactive navigation

## Files

- `pages/` — React/Next.js page components for the main site
- `components/` — shared React UI components and layout
- `css/styles.css` — project styles imported by Next.js
- `lib/supabaseClient.js` — Supabase client configuration
- `package.json` — Next.js build and dependency configuration
- `public/images/` — static image assets served by Next.js
- `supabase-config.example.js` — local Supabase config template for legacy client scripts
- `.env.local.example` — example environment variables for Supabase

## Setup

1. Open the project in a code editor.
2. Create `.env.local` from `.env.local.example` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

> `.env.local` is ignored by Git and should not be committed. Deployments use GitHub repository secrets instead of committing Supabase keys.

## GitHub Pages Deployment

This repo uses GitHub Actions to build and export the Next.js app as static files. Set these repository secrets before pushing:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

The workflow will pass those secrets into the Next.js build as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then publish the generated `out` directory to the `gh-pages` branch.

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
