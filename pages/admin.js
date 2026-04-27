import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';
import { getOmdbRatingValue } from '../lib/utils/ratings';
import { getTmdbDetails } from '../lib/utils/tmdb';

const EMPTY_MOVIE = {
  movie_name: '',
  year: '',
  streaming_partner: '',
  digital_release_date: '',
  language: '',
  category: '',
};

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [movies, setMovies] = useState([]);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [movieForm, setMovieForm] = useState(EMPTY_MOVIE);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    site_update_date: '',
  });
  const [siteSettingsLoading, setSiteSettingsLoading] = useState(false);
  const [siteSettingsActionLoading, setSiteSettingsActionLoading] = useState(false);
  const [tmdbSyncLoading, setTmdbSyncLoading] = useState(false);
  const [tmdbSyncStatus, setTmdbSyncStatus] = useState('');
  const [tmdbSyncError, setTmdbSyncError] = useState(false);
  const [tmdbFetchLoading, setTmdbFetchLoading] = useState(false);
  const [tmdbFetchStatus, setTmdbFetchStatus] = useState('');
  const [tmdbFetchError, setTmdbFetchError] = useState(false);
  const [liveSyncMovieId, setLiveSyncMovieId] = useState(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState('');
  const [liveSyncError, setLiveSyncError] = useState(false);
  const [omdbSyncMovieId, setOmdbSyncMovieId] = useState(null);
  const [omdbSyncStatus, setOmdbSyncStatus] = useState('');
  const [omdbSyncError, setOmdbSyncError] = useState(false);
  const [activeTab, setActiveTab] = useState('add');
  const [csvFile, setCsvFile] = useState(null);
  const [csvStatus, setCsvStatus] = useState('');
  const [csvStatusError, setCsvStatusError] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const dismissToast = (toastId) => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  };

  const showErrorToast = (message) => {
    const trimmedMessage = String(message || '').trim();
    if (!trimmedMessage) return;

    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id: toastId, message: trimmedMessage }].slice(-4));

    setTimeout(() => {
      dismissToast(toastId);
    }, 7000);
  };

  const extractApiErrorMessage = async (response, fallbackMessage) => {
    const rawBody = await response.text();
    if (!rawBody) {
      return `${fallbackMessage} (${response.status})`;
    }

    try {
      const parsed = JSON.parse(rawBody);
      const parsedMessage =
        parsed?.error ||
        parsed?.message ||
        parsed?.status_message ||
        parsed?.details?.error ||
        parsed?.details?.message ||
        parsed?.details?.status_message ||
        parsed?.details?.Error ||
        parsed?.data?.Error;

      if (parsedMessage) {
        return `${fallbackMessage} (${response.status}): ${parsedMessage}`;
      }
    } catch (_error) {
      // The API may return plain text/HTML on failure; keep the raw body fallback below.
    }

    return `${fallbackMessage} (${response.status}): ${rawBody.slice(0, 240)}`;
  };

  useEffect(() => {
    if (!supabase) return undefined;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setMovies([]);
      return;
    }
    fetchMovies();
    fetchSiteSettings();
  }, [user]);

  const fetchMovies = async () => {
    if (!supabase) return;
    setMoviesLoading(true);
    const { data, error } = await supabase
      .from('ott_movies')
      .select('*')
      .order('digital_release_date', { ascending: false });

    setMoviesLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to load OTT movies.');
      return;
    }

    setMovies(data || []);
  };

  const fetchSiteSettings = async () => {
    if (!supabase) return;
    setSiteSettingsLoading(true);

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    setSiteSettingsLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to load site settings.');
      return;
    }

    if (data) {
      setSiteSettings((current) => ({
        ...current,
        site_update_date: data.site_update_date || current.site_update_date,
      }));
    }
  };

  const handleSyncTmdbMetadata = async () => {
    if (!supabase) {
      setTmdbSyncError(true);
      setTmdbSyncStatus('Supabase is not configured.');
      return;
    }

    setTmdbSyncLoading(true);
    setTmdbSyncStatus('');
    setTmdbSyncError(false);

    try {
      const { data: currentMovies, error } = await supabase
        .from('ott_movies')
        .select('id,movie_name,year,digital_release_date');

      if (error) {
        throw error;
      }

      if (!currentMovies || currentMovies.length === 0) {
        setTmdbSyncStatus('No movies available to sync.');
        return;
      }

      const moviesToSync = currentMovies.filter((movie) => !movie.digital_release_date && movie.movie_name?.trim());
      if (moviesToSync.length === 0) {
        setTmdbSyncStatus('All movies already have release dates. No TMDb sync needed.');
        return;
      }

      const updates = [];
      const stats = {
        total: moviesToSync.length,
        updated: 0,
        noMatch: 0,
        noReleaseDate: 0,
        failedRequests: 0,
      };
      let firstFailedRequestMessage = '';

      for (const movie of moviesToSync) {
        const title = movie.movie_name.trim();
        const searchQuery = buildTmdbSearchQuery(title);
        const syncYear = String(movie.year || movie.digital_release_date || '').slice(0, 4);
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&y=${encodeURIComponent(syncYear)}&mediaType=movie`
        );

        if (!response.ok) {
          if (!firstFailedRequestMessage) {
            firstFailedRequestMessage = await extractApiErrorMessage(response, 'TMDb search failed');
          }
          stats.failedRequests += 1;
          continue;
        }

        const metadata = await response.json();
        const result = metadata.bestMatch || metadata.results?.[0];
        if (!result) {
          stats.noMatch += 1;
          continue;
        }

        const releaseDate = result.release_date?.trim();
        if (!releaseDate) {
          stats.noReleaseDate += 1;
          continue;
        }

        updates.push({
          id: movie.id,
          digital_release_date: releaseDate,
        });
        stats.updated += 1;
      }

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from('ott_movies')
          .upsert(updates, { onConflict: 'id' });

        if (updateError) {
          throw updateError;
        }
      }

      if (updates.length > 0) {
        const updatesById = new Map(updates.map((item) => [item.id, item]));
        setMovies((currentMovies) =>
          currentMovies.map((currentMovie) =>
            updatesById.has(currentMovie.id)
              ? { ...currentMovie, ...updatesById.get(currentMovie.id) }
              : currentMovie,
          ),
        );
      }

      let statusMessage = `${stats.updated} movie release date(s) synced from TMDb.`;
      if (stats.noMatch > 0) {
        statusMessage += ` ${stats.noMatch} title(s) were not found.`;
      }
      if (stats.noReleaseDate > 0) {
        statusMessage += ` ${stats.noReleaseDate} title(s) were found but had no release date.`;
      }
      if (stats.failedRequests > 0) {
        statusMessage += ` ${stats.failedRequests} request(s) failed.`;
        if (firstFailedRequestMessage) {
          showErrorToast(firstFailedRequestMessage);
        }
      }
      if (stats.updated === 0 && stats.noMatch === 0 && stats.noReleaseDate === 0 && stats.failedRequests === 0) {
        statusMessage = 'TMDb search completed, but no updateable titles were found.';
      }

      setTmdbSyncStatus(statusMessage);
    } catch (error) {
      const errorMessage = error?.message || 'Unable to sync TMDb metadata.';
      setTmdbSyncStatus(errorMessage);
      setTmdbSyncError(true);
      showErrorToast(errorMessage);
    } finally {
      setTmdbSyncLoading(false);
    }
  };

  const handleFetchLatestTollywoodMovies = async () => {
    if (!supabase) {
      setTmdbFetchError(true);
      setTmdbFetchStatus('Supabase is not configured.');
      return;
    }

    setTmdbFetchLoading(true);
    setTmdbFetchStatus('');
    setTmdbFetchError(false);

    try {
      const response = await fetch('/api/tmdb/latest');
      if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response, 'TMDb request failed'));
      }

      const payload = await response.json();
      const results = payload.results || [];
      if (results.length === 0) {
        setTmdbFetchStatus('No recent Tollywood titles were returned by TMDb.');
        return;
      }

      setTmdbFetchStatus(`Fetched ${results.length} Tollywood movie(s) from TMDb. They were not saved to the database.`);
    } catch (error) {
      const errorMessage = error?.message || 'Unable to fetch latest Tollywood movies from TMDb.';
      setTmdbFetchStatus(errorMessage);
      setTmdbFetchError(true);
      showErrorToast(errorMessage);
    } finally {
      setTmdbFetchLoading(false);
    }
  };

  const handleSaveSiteSettings = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    setSiteSettingsActionLoading(true);
    setStatus('');

    const payload = {
      id: 1,
      site_update_date: siteSettings.site_update_date || null,
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert([payload], { onConflict: 'id' });

    setSiteSettingsActionLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to save site settings.');
      return;
    }

    setStatus('Site settings saved successfully.');
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setStatus('Supabase is not configured. Please check environment settings.');
      return;
    }

    setLoading(true);
    setStatus('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to sign in.');
      return;
    }

    if (data.session) {
      setUser(data.session.user);
      setStatus('Signed in successfully.');
      return;
    }

    setStatus('Check your email for login instructions.');
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    setUser(null);
    setStatus('Signed out.');
  };

  const resetMovieForm = () => {
    setMovieForm(EMPTY_MOVIE);
    setEditingMovieId(null);
    setStatus('');
  };

  const handleMovieFormChange = (field, value) => {
    setMovieForm((current) => ({ ...current, [field]: value }));
  };

  const patchMovieInState = (movieId, updates) => {
    setMovies((currentMovies) =>
      currentMovies.map((currentMovie) =>
        currentMovie.id === movieId
          ? { ...currentMovie, ...updates }
          : currentMovie
      ),
    );
  };

  const handleMovieSave = async (event) => {
    event.preventDefault();
    if (!movieForm.movie_name.trim() || !movieForm.digital_release_date.trim()) {
      setStatus('Movie name and digital release date are required.');
      return;
    }

    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    setActionLoading(true);
    setStatus('');

    const payload = {
      movie_name: movieForm.movie_name.trim(),
      year: String(movieForm.year || '').trim(),
      streaming_partner: movieForm.streaming_partner.trim(),
      digital_release_date: movieForm.digital_release_date.trim(),
      language: movieForm.language.trim(),
      category: movieForm.category.trim(),
    };

    let error;
    if (editingMovieId) {
      ({ error } = await supabase
        .from('ott_movies')
        .update(payload)
        .eq('id', editingMovieId));
    } else {
      ({ error } = await supabase.from('ott_movies').insert(payload));
    }

    setActionLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to save movie.');
      return;
    }

    setStatus(editingMovieId ? 'Movie updated successfully.' : 'Movie added successfully.');
    resetMovieForm();
    fetchMovies();
  };

  const handleEditMovie = (movie) => {
    setEditingMovieId(movie.id);
    setActiveTab('add');
    setMovieForm({
      movie_name: movie.movie_name || '',
      year: String(movie.year || ''),
      streaming_partner: movie.streaming_partner || '',
      digital_release_date: movie.digital_release_date || '',
      language: movie.language || '',
      category: movie.category || '',
    });
    setStatus('Editing movie. Update the fields and save.');
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return;
    if (!supabase) {
      setStatus('Supabase is not configured.');
      return;
    }

    setActionLoading(true);
    const { error } = await supabase.from('ott_movies').delete().eq('id', movieId);
    setActionLoading(false);

    if (error) {
      setStatus(error.message || 'Unable to delete movie.');
      return;
    }

    setStatus('Movie deleted successfully.');
    if (editingMovieId === movieId) resetMovieForm();
    fetchMovies();
  };

  const normalizeMovieTitle = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const buildTmdbSearchQuery = (value) => {
    const strippedTitle = String(value || '')
      .replace(/\(.*?\)/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!strippedTitle) {
      return '';
    }

    const words = strippedTitle.split(' ').filter(Boolean);
    if (words.length <= 1) {
      return strippedTitle;
    }

    const [firstWord, ...remainingWords] = words;
    if (/^(a|an|the)$/i.test(firstWord)) {
      return `${firstWord} ${remainingWords.join('')}`.trim();
    }

    return words.join('');
  };

  const getTmdbMediaType = (category) => {
    const normalizedCategory = String(category || '').toLowerCase();
    if (
      normalizedCategory.includes('series') ||
      normalizedCategory.includes('web series') ||
      normalizedCategory.includes('tv')
    ) {
      return 'tv';
    }

    return 'movie';
  };

  const findBestSearchMatch = (results, title) => {
    if (!Array.isArray(results) || results.length === 0) {
      return null;
    }

    const normalizedTitle = normalizeMovieTitle(title);
    const exactMatch = results.find((result) => {
      const candidate = normalizeMovieTitle(result.title || result.original_title);
      return candidate === normalizedTitle;
    });

    if (exactMatch) {
      return exactMatch;
    }

    const partialMatch = results.find((result) => {
      const candidate = normalizeMovieTitle(result.title || result.original_title);
      return candidate.includes(normalizedTitle) || normalizedTitle.includes(candidate);
    });

    return partialMatch || results[0];
  };

  const getOmdbSyncYear = (movie) =>
    String(
      movie?.year ||
      movie?.release_date ||
      movie?.digital_release_date ||
      '',
    ).slice(0, 4);

  const saveOmdbDetails = async (movieId, payload) => {
    const rating = getOmdbRatingValue({ OMTB_Details: payload });
    let result = await supabase
      .from('ott_movies')
      .update({ OMTB_Details: payload, rating, omdb_last_sync: new Date().toISOString() })
      .eq('id', movieId);

    if (!result.error) {
      return null;
    }

    if (!/omtb_details/i.test(result.error.message || '')) {
      return result.error;
    }

    result = await supabase
      .from('ott_movies')
      .update({ omtb_details: payload, rating, omdb_last_sync: new Date().toISOString() })
      .eq('id', movieId);

    return result.error || null;
  };

  const saveTmdbDetails = async (movieId, payload) => {
    let result = await supabase
      .from('ott_movies')
      .update({ TMDB_Details: payload, tmdb_last_sync: new Date().toISOString() })
      .eq('id', movieId);

    if (!result.error) {
      return null;
    }

    if (!/tmdb_details/i.test(result.error.message || '')) {
      return result.error;
    }

    result = await supabase
      .from('ott_movies')
      .update({ tmdb_details: payload, tmdb_last_sync: new Date().toISOString() })
      .eq('id', movieId);

    return result.error || null;
  };

  const handleSyncLiveData = async (movie) => {
    if (!supabase) {
      setLiveSyncError(true);
      setLiveSyncStatus('Supabase is not configured.');
      return;
    }

    const movieTitle = movie?.movie_name?.trim();
    if (!movieTitle) {
      setLiveSyncError(true);
      setLiveSyncStatus('Movie title is missing, so TMDB sync cannot run.');
      return;
    }

    setLiveSyncMovieId(movie.id);
    setLiveSyncStatus('');
    setLiveSyncError(false);

    try {
      const mediaType = getTmdbMediaType(movie.category);
      const searchQuery = buildTmdbSearchQuery(movieTitle);
      const syncYear = String(
        movie.year ||
        movie.digital_release_date ||
        movie.release_date ||
        ''
      ).slice(0, 4);
      const searchResponse = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&y=${encodeURIComponent(syncYear)}&mediaType=${encodeURIComponent(mediaType)}`
      );
      if (!searchResponse.ok) {
        throw new Error(await extractApiErrorMessage(searchResponse, 'TMDB search failed'));
      }

      const searchPayload = await searchResponse.json();
      const bestMatch = searchPayload.bestMatch || findBestSearchMatch(searchPayload.results, movieTitle);

      if (!bestMatch?.id) {
        throw new Error(`No TMDB match found for "${movieTitle}".`);
      }

      const detailsResponse = await fetch(
        `/api/tmdb/details?id=${encodeURIComponent(bestMatch.id)}&mediaType=${encodeURIComponent(mediaType)}`
      );
      if (!detailsResponse.ok) {
        throw new Error(await extractApiErrorMessage(detailsResponse, 'TMDB details failed'));
      }

      const detailsPayload = await detailsResponse.json();
      const storedDetails = getTmdbDetails({ TMDB_Details: detailsPayload }) || detailsPayload;

      const payload = {
        tmdb_id: bestMatch.id,
        original_title:
          storedDetails.original_title ||
          storedDetails.original_name ||
          bestMatch.original_title ||
          bestMatch.original_name ||
          '',
        poster_path: storedDetails.poster_path || bestMatch.poster_path || '',
        backdrop_path: storedDetails.backdrop_path || bestMatch.backdrop_path || '',
        overview: storedDetails.overview || bestMatch.overview || '',
        rating:
          typeof storedDetails.vote_average === 'number'
            ? Number(storedDetails.vote_average.toFixed(1))
            : typeof bestMatch.vote_average === 'number'
              ? Number(bestMatch.vote_average.toFixed(1))
              : null,
        release_date:
          storedDetails.release_date ||
          storedDetails.first_air_date ||
          bestMatch.release_date ||
          bestMatch.first_air_date ||
          null,
        year: String(
          movie.year ||
          storedDetails.release_date ||
          storedDetails.first_air_date ||
          bestMatch.release_date ||
          bestMatch.first_air_date ||
          ''
        ).slice(0, 4),
        genres: storedDetails.genres || null,
        genre_ids: storedDetails.genre_ids || null,
        cast_data: storedDetails.credits?.cast || null,
        crew: storedDetails.credits?.crew || null,
        runtime: storedDetails.runtime || null,
      };

      const { error } = await supabase
        .from('ott_movies')
        .update(payload)
        .eq('id', movie.id);

      if (error) {
        throw error;
      }

      const tmdbDetailsError = await saveTmdbDetails(movie.id, detailsPayload);
      if (tmdbDetailsError) {
        throw tmdbDetailsError;
      }

      const tmdbSyncedAt = new Date().toISOString();
      patchMovieInState(movie.id, {
        ...payload,
        TMDB_Details: detailsPayload,
        tmdb_details: detailsPayload,
        tmdb_last_sync: tmdbSyncedAt,
      });
      setLiveSyncStatus(`Live TMDB data synced for "${movieTitle}".`);
    } catch (error) {
      const errorMessage = error?.message || 'Unable to sync live TMDB data.';
      setLiveSyncError(true);
      setLiveSyncStatus(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setLiveSyncMovieId(null);
    }
  };

  const handleSyncOmdbData = async (movie) => {
    if (!supabase) {
      setOmdbSyncError(true);
      setOmdbSyncStatus('Supabase is not configured.');
      return;
    }

    const movieTitle = movie?.movie_name?.trim();
    if (!movieTitle) {
      setOmdbSyncError(true);
      setOmdbSyncStatus('Movie title is missing, so OMDb sync cannot run.');
      return;
    }

    setOmdbSyncMovieId(movie.id);
    setOmdbSyncStatus('');
    setOmdbSyncError(false);

    try {
      const syncYear = getOmdbSyncYear(movie);
      const query = new URLSearchParams({
        movieId: String(movie.id),
        title: movieTitle,
        force: 'true',
      });

      if (syncYear) {
        query.set('year', syncYear);
      }

      const response = await fetch(`/api/omdb?${query.toString()}`);
      if (!response.ok) {
        throw new Error(await extractApiErrorMessage(response, 'OMDb sync failed'));
      }

      const payload = await response.json();
      const updateError = await saveOmdbDetails(movie.id, payload);

      if (updateError) {
        throw new Error(
          updateError.message || 'Unable to save OMDb details. Add an OMTB_Details JSONB column to ott_movies.',
        );
      }

      const omdbSyncedAt = new Date().toISOString();
      patchMovieInState(movie.id, {
        OMTB_Details: payload,
        omtb_details: payload,
        rating: getOmdbRatingValue({ OMTB_Details: payload }),
        omdb_last_sync: omdbSyncedAt,
      });
      setOmdbSyncStatus(`OMDb details synced for "${movieTitle}".`);
    } catch (error) {
      const errorMessage = error?.message || 'Unable to sync OMDb details.';
      setOmdbSyncError(true);
      setOmdbSyncStatus(errorMessage);
      showErrorToast(errorMessage);
    } finally {
      setOmdbSyncMovieId(null);
    }
  };

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? '').trim();
    if (/"|,|\n|\r/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const buildCsvContent = (rows) => {
    const headers = ['movie_name', 'streaming_partner', 'digital_release_date'];
    const lines = [headers.join(',')];
    rows.forEach((movie) => {
      lines.push([
        escapeCsvValue(movie.movie_name),
        escapeCsvValue(movie.streaming_partner),
        escapeCsvValue(movie.digital_release_date),
      ].join(','));
    });
    return lines.join('\r\n');
  };

  const parseCsvLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (inQuotes) {
        if (char === '"') {
          if (line[index + 1] === '"') {
            current += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    return values;
  };

  const parseCsv = (text) => {
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (rows.length === 0) {
      return [];
    }

    const headers = parseCsvLine(rows[0]).map((header) => header.trim().toLowerCase());
    return rows.slice(1).map((row) => {
      const values = parseCsvLine(row);
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index] ?? '';
      });
      return record;
    });
  };

  const handleDownloadCsv = () => {
    setCsvStatus('');
    setCsvStatusError(false);
    if (movies.length === 0) {
      setCsvStatus('There are no movies available to export.');
      setCsvStatusError(true);
      return;
    }

    const csv = buildCsvContent(movies);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ott-movies.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvStatus('CSV downloaded successfully.');
  };

  const handleUploadCsv = async () => {
    if (!csvFile) {
      setCsvStatus('Choose a CSV file before uploading.');
      setCsvStatusError(true);
      return;
    }

    setCsvLoading(true);
    setCsvStatus('');
    setCsvStatusError(false);

    try {
      const text = await csvFile.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        throw new Error('The CSV file is empty or invalid.');
      }

      const newMovies = rows
        .map((row) => ({
          movie_name: String(row.movie_name || '').trim(),
          streaming_partner: String(row.streaming_partner || '').trim(),
          digital_release_date: String(row.digital_release_date || '').trim(),
        }))
        .filter((row) => row.movie_name && row.digital_release_date);

      if (newMovies.length === 0) {
        throw new Error('No valid movie rows were found in the CSV.');
      }

      const existingKeys = new Set(
        movies.map((movie) =>
          `${String(movie.movie_name || '').trim().toLowerCase()}|${String(movie.digital_release_date || '').trim()}`,
        ),
      );

      const rowsToInsert = newMovies.filter(
        (movie) => !existingKeys.has(`${movie.movie_name.toLowerCase()}|${movie.digital_release_date}`),
      );

      if (rowsToInsert.length === 0) {
        setCsvStatus('CSV checked successfully. All movies already exist, so no new rows were added.');
        return;
      }

      const { error } = await supabase.from('ott_movies').insert(rowsToInsert);
      if (error) {
        throw error;
      }

      await fetchMovies();
      setCsvStatus(`${rowsToInsert.length} new movie row(s) added from CSV.`);
      setCsvFile(null);
    } catch (error) {
      setCsvStatus(error?.message || 'Unable to upload the CSV file. Please check the file and try again.');
      setCsvStatusError(true);
    } finally {
      setCsvLoading(false);
    }
  };

  const handleCsvFileChange = (event) => {
    setCsvFile(event.target.files?.[0] || null);
    setCsvStatus('');
    setCsvStatusError(false);
  };

  return (
    <main className="admin-page">
      <Seo
        title="Admin login"
        description="Admin login for Telugu OTT movies administration."
        url="/admin"
        keywords="admin login, OTT movies admin"
        robots="noindex,nofollow"
      />
      <section className="admin-panel">
        <div className="admin-panel__card">
          <h1>Admin panel</h1>
          <p className="admin-panel__intro">
            Sign in to manage Telugu OTT release data and site settings.
          </p>

          {!user ? (
            <form className="admin-form" onSubmit={handleSignIn}>
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button type="submit" className="admin-button" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          ) : (
            <div className="admin-dashboard-card">
              <div className="admin-dashboard__header">
                <div>
                  <p className="admin-panel__welcome">Signed in as {user.email || 'admin user'}.</p>
                  <p className="admin-panel__subtitle">Use the tabs below to manage movies and site settings.</p>
                </div>
                <button type="button" className="admin-button" onClick={handleSignOut} disabled={loading}>
                  {loading ? 'Signing out...' : 'Sign out'}
                </button>
              </div>

              <div className="admin-tabs" role="tablist" aria-label="Admin tabs">
                <button
                  type="button"
                  className={`admin-tab-button ${activeTab === 'add' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('add')}
                  role="tab"
                  aria-selected={activeTab === 'add'}
                >
                  Add movies
                </button>
                <button
                  type="button"
                  className={`admin-tab-button ${activeTab === 'edit' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('edit')}
                  role="tab"
                  aria-selected={activeTab === 'edit'}
                >
                  Edit movies
                </button>
                <button
                  type="button"
                  className={`admin-tab-button ${activeTab === 'settings' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                  role="tab"
                  aria-selected={activeTab === 'settings'}
                >
                  Site settings
                </button>
                <button
                  type="button"
                  className={`admin-tab-button ${activeTab === 'csv' ? 'is-active' : ''}`}
                  onClick={() => setActiveTab('csv')}
                  role="tab"
                  aria-selected={activeTab === 'csv'}
                >
                  Import / export
                </button>
              </div>

              <div className="admin-tab-panel" hidden={activeTab !== 'add'}>
                <div className="admin-management-card">
                  <div className="admin-management-card__header">
                    <div>
                      <h2>{editingMovieId ? 'Edit OTT movie' : 'Add OTT movie'}</h2>
                      <p className="admin-management-card__subtitle">Create new releases or update existing entries.</p>
                    </div>
                  </div>

                  <form className="admin-form" onSubmit={handleMovieSave}>
                    <label htmlFor="movie-name">Movie name</label>
                    <input
                      id="movie-name"
                      type="text"
                      value={movieForm.movie_name}
                      onChange={(event) => handleMovieFormChange('movie_name', event.target.value)}
                      required
                    />

                    <label htmlFor="movie-year">Year</label>
                    <input
                      id="movie-year"
                      type="number"
                      min="1900"
                      max="2100"
                      value={movieForm.year}
                      onChange={(event) => handleMovieFormChange('year', event.target.value)}
                      placeholder="2026"
                    />

                    <label htmlFor="movie-platform">Streaming partner</label>
                    <input
                      id="movie-platform"
                      type="text"
                      value={movieForm.streaming_partner}
                      onChange={(event) => handleMovieFormChange('streaming_partner', event.target.value)}
                      placeholder="Netflix, Aha, Prime Video, etc."
                    />

                    <label htmlFor="movie-date">Digital release date</label>
                    <input
                      id="movie-date"
                      type="date"
                      value={movieForm.digital_release_date}
                      onChange={(event) => handleMovieFormChange('digital_release_date', event.target.value)}
                      required
                    />

                    <label htmlFor="movie-language">Language</label>
                    <input
                      id="movie-language"
                      type="text"
                      value={movieForm.language}
                      onChange={(event) => handleMovieFormChange('language', event.target.value)}
                      placeholder="Telugu, Hindi, English, etc."
                    />

                    <label htmlFor="movie-category">Category</label>
                    <input
                      id="movie-category"
                      type="text"
                      value={movieForm.category}
                      onChange={(event) => handleMovieFormChange('category', event.target.value)}
                      placeholder="Movie, Web Series, etc."
                    />

                    <div className="admin-form-actions">
                      <button type="submit" className="admin-button" disabled={actionLoading}>
                        {actionLoading ? 'Saving…' : editingMovieId ? 'Save changes' : 'Add movie'}
                      </button>
                      {editingMovieId ? (
                        <button type="button" className="admin-action-button" onClick={resetMovieForm} disabled={actionLoading}>
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </form>
                </div>
              </div>

              <div className="admin-tab-panel" hidden={activeTab !== 'edit'}>
                <div className="admin-management-card">
                  <div className="admin-management-card__header">
                    <div>
                      <h2>Movie list</h2>
                      <p className="admin-management-card__subtitle">Edit or delete releases from your Supabase table.</p>
                    </div>
                  </div>

                  {moviesLoading ? (
                    <p className="admin-status">Loading movies…</p>
                  ) : movies.length === 0 ? (
                    <p className="admin-status">No movies found. Add your first OTT release.</p>
                  ) : (
                    <>
                      <div className="admin-movie-grid">
                        {movies.map((movie) => (
                          <div className="admin-movie-card" key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}>
                            <div className="admin-movie-card__content">
                              <h3 className="admin-movie-card__title">{movie.movie_name || 'Untitled'}</h3>
                              <div className="admin-movie-card__meta">
                                <span className="admin-badge admin-badge--year">{movie.year || 'TBA'}</span>
                                <span className="admin-badge admin-badge--partner">{movie.streaming_partner || 'TBA'}</span>
                                <span className="admin-badge admin-badge--date">{movie.digital_release_date || 'TBA'}</span>
                                <span className="admin-badge admin-badge--lang">{movie.language || 'Telugu'}</span>
                                <span className="admin-badge admin-badge--category">{movie.category || 'Film'}</span>
                              </div>
                              <div className="admin-movie-card__meta admin-movie-card__meta--sync">
                                {movie.tmdb_last_sync && (
                                  <span className="admin-badge admin-badge--sync" title={`TMDB Last Sync: ${new Date(movie.tmdb_last_sync).toLocaleString()}`}>
                                    TMDB: {new Date(movie.tmdb_last_sync).toLocaleDateString()}
                                  </span>
                                )}
                                {movie.omdb_last_sync && (
                                  <span className="admin-badge admin-badge--sync" title={`OMDB Last Sync: ${new Date(movie.omdb_last_sync).toLocaleString()}`}>
                                    OMDB: {new Date(movie.omdb_last_sync).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="admin-movie-card__actions">
                              <button type="button" className="admin-action-button" onClick={(e) => { e.preventDefault(); handleEditMovie(movie); }}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={(e) => { e.preventDefault(); handleSyncLiveData(movie); }}
                                disabled={liveSyncMovieId === movie.id}
                              >
                                {liveSyncMovieId === movie.id ? 'Syncing…' : 'Sync TMDB'}
                              </button>
                              <button
                                type="button"
                                className="admin-action-button"
                                onClick={(e) => { e.preventDefault(); handleSyncOmdbData(movie); }}
                                disabled={omdbSyncMovieId === movie.id}
                              >
                                {omdbSyncMovieId === movie.id
                                  ? 'Syncing OMDb...'
                                  : movie.OMTB_Details || movie.omtb_details
                                    ? 'Refresh OMDb'
                                    : 'Sync OMDb'}
                              </button>
                              <button type="button" className="admin-action-button admin-action-button--danger" onClick={(e) => { e.preventDefault(); handleDeleteMovie(movie.id); }}>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {liveSyncStatus ? (
                        <p className={`admin-status ${liveSyncError ? 'admin-status--error' : ''}`}>
                          {liveSyncStatus}
                        </p>
                      ) : null}
                      {omdbSyncStatus ? (
                        <p className={`admin-status ${omdbSyncError ? 'admin-status--error' : ''}`}>
                          {omdbSyncStatus}
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>

              <div className="admin-tab-panel" hidden={activeTab !== 'settings'}>
                <div className="admin-management-card">
                  <div className="admin-management-card__header">
                    <div>
                      <h2>Site settings</h2>
                      <p className="admin-management-card__subtitle">Manage the site settings stored in Supabase.</p>
                    </div>
                  </div>

                  {siteSettingsLoading ? (
                    <p className="admin-status">Loading site settings…</p>
                  ) : (
                    <form className="admin-form" onSubmit={handleSaveSiteSettings}>
                      <label htmlFor="site-update-date">Site update date</label>
                      <input
                        id="site-update-date"
                        type="date"
                        value={siteSettings.site_update_date || ''}
                        onChange={(event) => setSiteSettings((current) => ({ ...current, site_update_date: event.target.value }))}
                      />

                      <div className="admin-form-actions">
                        <button type="submit" className="admin-button" disabled={siteSettingsActionLoading}>
                          {siteSettingsActionLoading ? 'Saving…' : 'Save settings'}
                        </button>
                        <button
                          type="button"
                          className="admin-button"
                          onClick={handleSyncTmdbMetadata}
                          disabled={tmdbSyncLoading || siteSettingsActionLoading}
                        >
                          {tmdbSyncLoading ? 'Syncing TMDb…' : 'Sync TMDb metadata'}
                        </button>
                        <button
                          type="button"
                          className="admin-button"
                          onClick={handleFetchLatestTollywoodMovies}
                          disabled={tmdbFetchLoading || siteSettingsActionLoading}
                        >
                          {tmdbFetchLoading ? 'Fetching latest movies…' : 'Fetch latest Tollywood movies'}
                        </button>
                      </div>

                      {tmdbSyncStatus ? (
                        <p className={`admin-status ${tmdbSyncError ? 'admin-status--error' : ''}`}>
                          {tmdbSyncStatus}
                        </p>
                      ) : null}
                      {tmdbFetchStatus ? (
                        <p className={`admin-status ${tmdbFetchError ? 'admin-status--error' : ''}`}>
                          {tmdbFetchStatus}
                        </p>
                      ) : null}
                    </form>
                  )}
                </div>
              </div>

              <div className="admin-tab-panel" hidden={activeTab !== 'csv'}>
                <div className="admin-management-card admin-import-export">
                  <div className="admin-import-export__header">
                    <div>
                      <h2>Import / export CSV</h2>
                      <p>Upload movies from a CSV file or export the current release table.</p>
                    </div>
                  </div>

                  <div className="admin-import-export__upload">
                    <label htmlFor="csv-file">Select a CSV file</label>
                    <input
                      id="csv-file"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvFileChange}
                    />
                  </div>

                  <div className="admin-form-actions">
                    <button type="button" className="admin-button" onClick={handleUploadCsv} disabled={csvLoading}>
                      {csvLoading ? 'Uploading…' : 'Upload CSV'}
                    </button>
                    <button type="button" className="admin-action-button" onClick={handleDownloadCsv} disabled={csvLoading || movies.length === 0}>
                      Download CSV
                    </button>
                  </div>

                  {csvStatus ? (
                    <p className={`admin-status ${csvStatusError ? 'admin-status--error' : ''}`}>
                      {csvStatus}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {toasts.length > 0 ? (
            <div className="admin-toast-stack" role="status" aria-live="polite">
              {toasts.map((toast) => (
                <div className="admin-toast admin-toast--error" key={toast.id}>
                  <p className="admin-toast__message">{toast.message}</p>
                  <button
                    type="button"
                    className="admin-toast__close"
                    onClick={() => dismissToast(toast.id)}
                    aria-label="Dismiss notification"
                  >
                    Close
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {status ? <p className="admin-status">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}

