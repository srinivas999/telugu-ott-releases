import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { generateUniqueSlug } from '../lib/utils/slug';

const PLATFORMS = ['Netflix', 'Aha', 'Prime Video', 'JioHotstar', 'Zee5', 'Sun NXT', 'ETV Win'];

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

function getPlatformSlug(platform) {
  return platform.toLowerCase().replace(/\s+/g, '-');
}

export default function SearchBar() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Search movies and platforms
  useEffect(() => {
    const searchMoviesAndPlatforms = async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      try {
        if (!supabase) {
          throw new Error('Supabase client not configured');
        }

        const searchLower = searchTerm.toLowerCase();
        
        // Get matching platforms
        const matchingPlatforms = PLATFORMS.filter((p) =>
          p.toLowerCase().includes(searchLower)
        );

        // Get matching movies
        const { data: movies, error } = await supabase
          .from('ott_movies')
          .select('id, movie_name, poster_path, streaming_partner, digital_release_date')
          .ilike('movie_name', `%${searchTerm}%`)
          .limit(6);

        if (error) throw error;

        // Combine results: platforms first, then movies
        const combinedResults = [
          ...matchingPlatforms.map((platform) => ({
            type: 'platform',
            id: platform,
            name: platform,
            display_name: platform,
          })),
          ...(movies || []).map((movie) => ({
            type: 'movie',
            ...movie,
            streaming_partner: normalizePlatform(movie.streaming_partner),
          })),
        ];

        setResults(combinedResults);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMoviesAndPlatforms, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search when pressing Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (result) => {
    if (result.type === 'platform') {
      // Navigate to platform page
      const platformSlug = getPlatformSlug(result.id);
      setSearchTerm('');
      setResults([]);
      setIsOpen(false);
      router.push(`/platform/${platformSlug}`);
    } else {
      // Navigate to movie page
      const movieSlug = generateUniqueSlug(result.movie_name, result.id);
      setSearchTerm('');
      setResults([]);
      setIsOpen(false);
      router.push(`/movie/${movieSlug}`);
    }
  };

  return (
    <div className="search-bar" ref={searchRef}>
      <div
        className="search-bar__input-group"
        role="combobox"
        aria-controls="search-results"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder="Search movies or platforms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => {
            if (searchTerm.trim()) {
              setIsOpen(true);
            }
          }}
          aria-label="Search movies or platforms"
          aria-autocomplete="list"
          aria-controls="search-results"
        />
        <svg
          className="search-bar__icon"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="search-bar__dropdown" id="search-results" role="listbox">
          {isLoading && (
            <div className="search-bar__item search-bar__item--loading">
              <span>Searching...</span>
            </div>
          )}

          {!isLoading && results.length > 0 && (
            <ul className="search-bar__results">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`} className="search-bar__result-item">
                  <button
                    type="button"
                    className="search-bar__result-button"
                    onClick={() => handleSelect(result)}
                  >
                    {result.type === 'platform' ? (
                      <>
                        <div className="search-bar__result-platform-icon">
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                            <path d="M17 2l-5 5-5-5" />
                          </svg>
                        </div>
                        <div className="search-bar__result-content">
                          <div className="search-bar__result-title">{result.display_name}</div>
                          <div className="search-bar__result-subtitle">Platform</div>
                        </div>
                      </>
                    ) : (
                      <>
                        {result.poster_path && (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                            alt={result.movie_name}
                            className="search-bar__result-poster"
                            width={40}
                            height={60}
                          />
                        )}
                        <div className="search-bar__result-content">
                          <div className="search-bar__result-title">{result.movie_name}</div>
                          <div className="search-bar__result-platform">
                            {result.streaming_partner}
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!isLoading && searchTerm.trim() && results.length === 0 && (
            <div className="search-bar__item search-bar__item--empty">
              <span>No movies or platforms found. Try a different search.</span>
            </div>
          )}

          {!isLoading && !searchTerm.trim() && (
            <div className="search-bar__item search-bar__item--tip">
              <span>Search for movies or platforms...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
