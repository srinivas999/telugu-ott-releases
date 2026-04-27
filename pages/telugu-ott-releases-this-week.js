import Image from 'next/image';
import Link from 'next/link';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import Breadcrumb from '../components/common/Breadcrumb';
import ContinueBrowsing from '../components/common/ContinueBrowsing';
import { supabase } from '../lib/supabaseClient';
import { generateCollectionPageSchema, generateItemListSchema } from '../lib/utils/schema';
import { formatCompactVoteCount, getTmdbVoteCountValue } from '../lib/utils/ratings';
import { generateUniqueSlug } from '../lib/utils/slug';

const TMDB_POSTER_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280';

function normalizePlatform(value) {
  if (!value) return '';
  const lower = String(value).toLowerCase();
  if (lower.includes('prime')) return 'Prime Video';
  if (lower.includes('netflix')) return 'Netflix';
  if (lower.includes('aha')) return 'Aha';
  if (lower.includes('hotstar')) return 'JioHotstar';
  if (lower.includes('zee')) return 'Zee5';
  if (lower.includes('sun nxt') || lower.includes('sun')) return 'Sun NXT';
  if (lower.includes('etv')) return 'ETV Win';
  return String(value).trim();
}

function formatReleaseDate(value) {
  if (!value) return 'TBA';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toPosterUrl(movie) {
  if (!movie?.poster_path) return '/images/default_poster.png';
  if (String(movie.poster_path).startsWith('http')) return movie.poster_path;
  return `${TMDB_POSTER_BASE}${movie.poster_path}`;
}

function toBackdropUrl(movie) {
  const path = movie?.backdrop_path || movie?.poster_path;
  if (!path) return '/images/default_poster.png';
  if (String(path).startsWith('http')) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

function getWeekBadge(movie, hasWeekMovies) {
  if (!movie?.poster_path) return '';
  if ((movie.popularity || 0) >= 18) return 'Popular This Week';
  if (hasWeekMovies) return 'New This Week';
  return 'This Month';
}

function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getStaticProps() {
  if (!supabase) {
    return {
      props: {
        weekMovies: [],
        monthMovies: [],
        weekRange: null,
        monthRange: null,
      },
      revalidate: 3600,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const todayStr = toLocalDateKey(today);
  const weekEndStr = toLocalDateKey(weekEnd);
  const monthStartStr = toLocalDateKey(monthStart);
  const monthEndStr = toLocalDateKey(monthEnd);

  const { data: weekData } = await supabase
    .from('ott_movies')
    .select('*')
    .gte('digital_release_date', todayStr)
    .lte('digital_release_date', weekEndStr)
    .order('digital_release_date', { ascending: false });

  const { data: monthData } = await supabase
    .from('ott_movies')
    .select('*')
    .gte('digital_release_date', monthStartStr)
    .lte('digital_release_date', monthEndStr)
    .order('digital_release_date', { ascending: false });

  const weekMovies = (weekData || []).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  const monthMovies = (monthData || []).map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  return {
    props: {
      weekMovies,
      monthMovies,
      weekRange: { start: todayStr, end: weekEndStr },
      monthRange: { start: monthStartStr, end: monthEndStr },
    },
    revalidate: 3600,
  };
}

export default function TeluguOttReleasesThisWeekPage({
  weekMovies = [],
  monthMovies = [],
  weekRange,
  monthRange,
}) {
  const hasWeekMovies = weekMovies.length > 0;
  const displayMovies = hasWeekMovies ? weekMovies : monthMovies;
  const title = hasWeekMovies ? 'Telugu OTT Releases This Week' : 'Telugu OTT Releases This Month';
  const dateWindow = hasWeekMovies && weekRange
    ? `${formatReleaseDate(weekRange.start)} to ${formatReleaseDate(weekRange.end)}`
    : monthRange
      ? `${formatReleaseDate(monthRange.start)} to ${formatReleaseDate(monthRange.end)}`
      : '';
  const description = hasWeekMovies
    ? `See Telugu OTT releases this week for ${dateWindow} with streaming platforms, release dates, and direct movie pages.`
    : `No releases in the next 7 days. Explore Telugu OTT releases scheduled for ${dateWindow}.`;
  const retentionItems = [
    {
      href: '/browse/trending-now',
      eyebrow: 'Trending Now',
      title: 'After the release calendar, see what is buzzing',
      description: 'Move from scheduled drops into the titles that are hottest right now.',
      cta: 'Open Trending',
    },
    {
      href: '/top-rated-telugu-ott-movies',
      eyebrow: 'Top Picks',
      title: 'Balance new releases with proven favorites',
      description: 'Pair this week OTT drops with the highest-rated Telugu streaming movies.',
      cta: 'View Top Picks',
    },
    {
      href: '/browse/recently-added',
      eyebrow: 'Continue Browsing',
      title: 'Keep going with recently added titles',
      description: 'Stay in discovery mode with fresh additions to the database.',
      cta: 'See New Additions',
    },
    {
      href: '/theatre-release',
      eyebrow: 'Beyond OTT',
      title: 'Take the next step into theatres',
      description: 'When the OTT queue ends, continue into current Telugu theatre releases.',
      cta: 'Browse Theatres',
    },
  ];

  const featured = displayMovies[0] || null;
  const jsonLd = [
    generateCollectionPageSchema({
      name: title,
      description,
      url: '/telugu-ott-releases-this-week',
    }),
    generateItemListSchema({
      title,
      items: displayMovies.slice(0, 20),
      url: '/telugu-ott-releases-this-week',
    }),
  ];

  return (
    <Layout>
      <Seo
        title={title}
        description={description}
        url="/telugu-ott-releases-this-week"
        keywords="Telugu OTT releases this week, Telugu OTT releases this month, weekly Telugu OTT releases"
        jsonLd={jsonLd}
      />

      <main className="netflix-home week-page">
        <div className="nf-breadcrumb-wrap">
          <Breadcrumb
            items={[
              { name: 'Home', url: '/' },
              { name: 'OTT Movies', url: '/ott-movies' },
              { name: hasWeekMovies ? 'This Week' : 'This Month' },
            ]}
          />
        </div>

        <section className="nf-hero week-hero">
          {featured ? (
            <div className="nf-hero__bg">
              <Image
                src={toBackdropUrl(featured)}
                alt={featured.movie_name || 'Featured movie'}
                fill
                priority
                sizes="100vw"
                className="nf-hero__bg-image"
              />
            </div>
          ) : null}
          <div className="nf-hero__overlay" />
          <div className="nf-hero__content">
            <p className="nf-hero__kicker">{hasWeekMovies ? 'Weekly Calendar' : 'Monthly Calendar'}</p>
            <h1>{title}</h1>
            <p className="nf-hero__desc">
              {hasWeekMovies
                ? 'Track Telugu OTT movies releasing over the next 7 days across major platforms.'
                : 'No titles in the upcoming 7 days. Here are Telugu OTT releases scheduled for the current month.'}
            </p>
            <div className="nf-hero__meta">
              <span>{displayMovies.length} releases</span>
              {hasWeekMovies && weekRange ? (
                <span>{formatReleaseDate(weekRange.start)} - {formatReleaseDate(weekRange.end)}</span>
              ) : null}
              {!hasWeekMovies && monthRange ? (
                <span>{formatReleaseDate(monthRange.start)} - {formatReleaseDate(monthRange.end)}</span>
              ) : null}
              {featured ? <span>{formatCompactVoteCount(getTmdbVoteCountValue(featured)) || 'Popular this week'}</span> : null}
            </div>
            <div className="nf-hero__actions">
              <Link href="/browse/trending-now" className="nf-btn nf-btn--primary">
                Explore Movies
              </Link>
              <Link href="/top-rated-telugu-ott-movies" className="nf-btn nf-btn--ghost">
                View Top Picks
              </Link>
            </div>
          </div>
        </section>

        <section className="nf-content">
          {hasWeekMovies ? (
            <section className="nf-explore">
              <div className="nf-explore__header">
                <h2>Quick Explore</h2>
              </div>
              <p className="nf-collection-copy">
                Use this weekly calendar with <Link href="/browse/trending-now" className="nf-inline-link">trending Telugu OTT movies</Link>,
                {' '}the full <Link href="/ott-movies" className="nf-inline-link">OTT archive</Link>, and
                <Link href="/top-rated-telugu-ott-movies" className="nf-inline-link"> top rated Telugu OTT movies</Link>,
                plus direct platform pages like <Link href="/platform/netflix" className="nf-inline-link">Netflix</Link> and <Link href="/platform/aha" className="nf-inline-link">Aha</Link> to cover both fresh releases and evergreen picks.
              </p>
              <div className="nf-explore__grid">
                <Link href="/browse/trending-now" className="nf-explore__card">
                  <span>Trending</span>
                  <h3>What is buzzing now</h3>
                  <p>Jump to the current trending OTT titles.</p>
                </Link>
                <Link href="/browse/recently-added" className="nf-explore__card">
                  <span>Recently Added</span>
                  <h3>Latest database updates</h3>
                  <p>See movies newly added to the OTT library.</p>
                </Link>
                <Link href="/ott-movies" className="nf-explore__card">
                  <span>Full Archive</span>
                  <h3>Complete OTT list</h3>
                  <p>Browse all Telugu OTT entries with filters.</p>
                </Link>
                <Link href="/theatre-release" className="nf-explore__card">
                  <span>Theatres</span>
                  <h3>Beyond OTT</h3>
                  <p>Track Telugu theatre releases as well.</p>
                </Link>
              </div>
            </section>
          ) : (
            <section className="nf-rail">
              <div className="nf-rail__header">
                <h2>This Month Releases</h2>
              </div>
              <p className="nf-collection-copy">
                Weekly window is empty, so we are showing all scheduled Telugu OTT releases for the current month.
              </p>
            </section>
          )}

          <section className="nf-rail">
            <div className="nf-rail__header">
              <h2>{hasWeekMovies ? `This Week (${weekMovies.length})` : `This Month (${monthMovies.length})`}</h2>
            </div>

            {displayMovies.length === 0 ? (
              <p className="nf-status">No releases yet. New Telugu OTT drops will show up here soon.</p>
            ) : (
              <div className="nf-collection__grid week-grid">
                {displayMovies.map((movie) => {
                  const slug = generateUniqueSlug(movie.movie_name, movie.id);
                  const badge = getWeekBadge(movie, hasWeekMovies);
                  return (
                    <Link key={movie.id || slug} href={`/movie/${slug}`} className="nf-card">
                      <div className="nf-card__poster">
                        <Image
                          src={toPosterUrl(movie)}
                          alt={`${movie.movie_name || 'Movie'} poster`}
                          fill
                          sizes="(max-width: 640px) 44vw, (max-width: 980px) 22vw, 15vw"
                          className="nf-card__image"
                        />
                        {badge ? <span className="nf-card__badge">{badge}</span> : null}
                        <div className="nf-card__overlay">
                          <span className="nf-card__overlay-cta">View Details</span>
                        </div>
                      </div>
                      <div className="nf-card__meta">
                        <h3>{movie.movie_name || 'Untitled'}</h3>
                        <p>{movie.streaming_partner || 'OTT'} - {formatReleaseDate(movie.digital_release_date)}</p>
                        <div className="nf-card__trust">
                          <span>{formatCompactVoteCount(getTmdbVoteCountValue(movie)) || 'Fresh audience signal'}</span>
                          <span>{hasWeekMovies ? 'Popular this week' : 'Current release'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          <ContinueBrowsing
            title="Continue Browsing"
            description="The release calendar should lead into another watch path, not a dead end."
            items={retentionItems}
          />
        </section>
      </main>
    </Layout>
  );
}
