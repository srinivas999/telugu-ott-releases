/**
 * Dynamic Movie Detail Page
 * Route: /movie/[slug]
 * Example: /movie/baahubali-2-123
 */

import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import Seo from '../../components/Seo';
import MovieDetails from '../../components/movie/MovieDetails';
import Breadcrumb from '../../components/common/Breadcrumb';
import SchemaMarkup from '../../components/seo/SchemaMarkup';
import SimilarMovies from '../../components/movie/SimilarMovies';
import { useMovie, useSimilarMovies } from '../../lib/hooks/useMovies';
import {
  generateMovieSchema,
  generateFaqSchema,
} from '../../lib/utils/schema';
import { generateUniqueSlug, parseSlug } from '../../lib/utils/slug';
import { supabase } from '../../lib/supabaseClient';

export default function MovieDetailPage({ movie: initialMovie }) {
  const router = useRouter();
  const slug = Array.isArray(router.query.slug) ? router.query.slug[0] : router.query.slug;

  // Parse slug to get ID
  const { id } = parseSlug(slug);

  // Fetch movie data (use initial data if available, otherwise fetch)
  const { movie, loading, error } = useMovie(initialMovie ? null : (id || slug));
  const actualMovie = movie || initialMovie;

  // Fetch similar movies
  const { movies: similarMovies } = useSimilarMovies(actualMovie?.id, 6);

  if (!router.isFallback && !actualMovie && !loading) {
    return (
      <Layout>
        <Seo title="Movie Not Found" description="The movie you&apos;re looking for doesn&apos;t exist." />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Movie Not Found</h1>
          <p>Sorry, we couldn&apos;t find the movie you&apos;re looking for.</p>
        </div>
      </Layout>
    );
  }

  if (router.isFallback || loading) {
    return (
      <Layout>
        <Seo title="Loading..." description="Loading movie details..." />
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>Loading...</h1>
        </div>
      </Layout>
    );
  }

  // Prepare SEO data
  const movieTitle = actualMovie?.title || actualMovie?.movie_name || 'Movie';
  const movieDescription =
    actualMovie?.overview ||
    actualMovie?.description ||
    `Watch ${movieTitle} on OTT platforms in Telugu.`;
  const posterImage = actualMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${actualMovie.poster_path}`
    : 'https://svteluguott.in/images/ott-hero-banner.png';

  // Generate schemas
  const movieSchema = generateMovieSchema(actualMovie);
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Movies', url: '/ott-movies' },
    { name: movieTitle },
  ];

  // FAQ data (you'd fetch this from your DB or generate dynamically)
  const faqData = [
    {
      question: `When is ${movieTitle} releasing on OTT?`,
      answer: actualMovie?.digital_release_date
        ? `${movieTitle} is releasing on ${actualMovie.digital_release_date} on ${actualMovie.streaming_partner || 'OTT platforms'}.`
        : 'Release date information is not available yet.',
    },
    {
      question: `Where can I watch ${movieTitle} online?`,
      answer: actualMovie?.streaming_partner
        ? `${movieTitle} is available on ${actualMovie.streaming_partner}.`
        : 'Platform information not available.',
    },
    {
      question: `What is the runtime of ${movieTitle}?`,
      answer: actualMovie?.runtime
        ? `${movieTitle} has a runtime of ${actualMovie.runtime} minutes.`
        : 'Runtime information is not available.',
    },
  ];

  const faqSchema = generateFaqSchema(faqData.filter((item) => item.answer));

  return (
    <Layout>
      <Seo
        title={`${movieTitle} - Watch Online on OTT Platforms`}
        description={movieDescription}
        keywords={`${movieTitle}, ${movieTitle} OTT release, watch ${movieTitle} online, ${actualMovie?.streaming_partner || ''}`}
        image={posterImage}
        url={slug ? `/movie/${slug}` : undefined}
      />

      {/* Schema Markup */}
      <SchemaMarkup schema={movieSchema} />
      {faqSchema && <SchemaMarkup schema={faqSchema} />}

      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} />

      {/* Movie Details */}
      <MovieDetails movie={actualMovie} loading={loading} error={error} />

      {/* Similar Movies */}
      {similarMovies && similarMovies.length > 0 && (
        <div style={{ marginTop: '3rem' }}>
          <h2>Similar Movies</h2>
          <SimilarMovies movies={similarMovies} />
        </div>
      )}
    </Layout>
  );
}

/**
 * Static Generation: Generate pages for popular movies at build time
 * Fallback to SSR for other movies
 */
export async function getStaticProps({ params }) {
  try {
    if (!supabase) {
      return { notFound: true };
    }

    const { id } = parseSlug(params.slug);

    // Query movie by ID or slug
    let query = supabase.from('ott_movies').select('*');

    if (id) {
      query = query.eq('id', id).maybeSingle();
    } else {
      query = query
        .ilike('movie_name', `%${params.slug.replace(/-/g, ' ')}%`)
        .order('digital_release_date', { ascending: false })
        .limit(1)
        .maybeSingle();
    }

    const { data, error } = await query;

    if (error || !data) {
      return { notFound: true };
    }

    return {
      props: {
        movie: data,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error generating static props:', error);
    return { notFound: true };
  }
}

/**
 * Generate paths for popular movies
 * This runs at build time and generates paths for the most popular movies
 */
export async function getStaticPaths() {
  try {
    if (!supabase) {
      return { paths: [], fallback: true };
    }

    // Fetch top 50 recent movies to generate paths
    const { data, error } = await supabase
      .from('ott_movies')
      .select('id, movie_name')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) {
      return { paths: [], fallback: true };
    }

    // Generate slug for each movie
    const paths = data.map((movie) => ({
      params: {
        slug: generateUniqueSlug(movie.movie_name, movie.id),
      },
    }));

    return {
      paths,
      fallback: true, // Enable ISR (Incremental Static Regeneration)
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    return { paths: [], fallback: true };
  }
}
