export const PLATFORM_DIRECTORY = [
  { slug: 'netflix', name: 'Netflix', shortName: 'Netflix', color: '#E50914' },
  { slug: 'aha', name: 'Aha', shortName: 'Aha', color: '#FF6B00' },
  { slug: 'prime-video', name: 'Prime Video', shortName: 'Prime', color: '#00A8E1' },
  { slug: 'jiohotstar', name: 'JioHotstar', shortName: 'Hotstar', color: '#1F80E0' },
  { slug: 'zee5', name: 'Zee5', shortName: 'Zee5', color: '#6C2E7C' },
  { slug: 'sun-nxt', name: 'Sun NXT', shortName: 'Sun NXT', color: '#E31837' },
  { slug: 'etv-win', name: 'ETV Win', shortName: 'ETV Win', color: '#0066CC' },
];

const PLATFORM_LOOKUP = PLATFORM_DIRECTORY.reduce((lookup, platform) => {
  lookup[platform.name] = platform;
  return lookup;
}, {});

export function normalizePlatform(value) {
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

export function getPlatformMeta(platformValue) {
  return PLATFORM_LOOKUP[normalizePlatform(platformValue)] || null;
}

export function getPlatformColor(platformValue, fallback = '#64748b') {
  return getPlatformMeta(platformValue)?.color || fallback;
}

export function getPlatformHref(platformValue, fallback = '/ott-movies') {
  const meta = getPlatformMeta(platformValue);
  return meta ? `/platform/${meta.slug}` : fallback;
}

export function getPlatformFilterOptions() {
  return [
    { value: 'all', label: 'All' },
    ...PLATFORM_DIRECTORY.map((platform) => ({
      value: platform.name,
      label: platform.shortName,
      color: platform.color,
      href: `/platform/${platform.slug}`,
    })),
    { value: 'other', label: 'Other', color: '#64748b' },
  ];
}

export function getKnownPlatformNames() {
  return PLATFORM_DIRECTORY.map((platform) => platform.name);
}

function sortByLatestRelease(firstMovie, secondMovie) {
  const firstTime = new Date(`${firstMovie?.digital_release_date || ''}T00:00:00`).getTime();
  const secondTime = new Date(`${secondMovie?.digital_release_date || ''}T00:00:00`).getTime();
  if (Number.isNaN(firstTime) && Number.isNaN(secondTime)) return 0;
  if (Number.isNaN(firstTime)) return 1;
  if (Number.isNaN(secondTime)) return -1;
  return secondTime - firstTime;
}

export function buildPlatformSpotlights(movies = [], limit = PLATFORM_DIRECTORY.length) {
  return PLATFORM_DIRECTORY.map((platform) => {
    const platformMovies = (movies || [])
      .filter((movie) => normalizePlatform(movie.streaming_partner) === platform.name)
      .sort(sortByLatestRelease);

    return {
      ...platform,
      href: `/platform/${platform.slug}`,
      movieCount: platformMovies.length,
      latestMovie: platformMovies[0] || null,
      movies: platformMovies,
    };
  })
    .filter((platform) => platform.movieCount > 0)
    .slice(0, limit);
}
