# Telugu OTT Releases

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

## Deployment

This project now uses Next.js API routes for TMDb and Supabase integration, so GitHub Pages static hosting is no longer a compatible deployment target.

Recommended deployment options:

- Vercel
- Render
- Railway

### Vercel

1. Connect this repository to Vercel.
2. Add these environment variables in your Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TMDB_API_KEY`
   - `TMDB_API_KEY`
   - `TMDB_API_READ_ACCESS_TOKEN`
3. Deploy the project with the default build command:
   ```bash
   npm install
   npm run build
   ```

### Render

1. Create a new Web Service on Render.
2. Use `npm install && npm run build` as the build command.
3. Use `npm run start` as the start command.
4. Add the same environment variables in Render dashboard.

### Railway

1. Connect your repository to Railway.
2. Set up a Node.js deployment with the same build and start commands.
3. Add the same environment variables in Railway settings.

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
