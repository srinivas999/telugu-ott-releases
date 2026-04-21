import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';

const EMPTY_MOVIE = {
  movie_name: '',
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
  const [activeTab, setActiveTab] = useState('add');
  const [csvFile, setCsvFile] = useState(null);
  const [csvStatus, setCsvStatus] = useState('');
  const [csvStatusError, setCsvStatusError] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

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
        .select('id,movie_name,digital_release_date');

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

      for (const movie of moviesToSync) {
        const title = movie.movie_name.trim();
        const response = await fetch(
          `/api/tmdb/search?query=${encodeURIComponent(title)}&originalTitle=${encodeURIComponent(title)}&mediaType=movie`
        );

        if (!response.ok) {
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

      await fetchMovies();

      let statusMessage = `${stats.updated} movie release date(s) synced from TMDb.`;
      if (stats.noMatch > 0) {
        statusMessage += ` ${stats.noMatch} title(s) were not found.`;
      }
      if (stats.noReleaseDate > 0) {
        statusMessage += ` ${stats.noReleaseDate} title(s) were found but had no release date.`;
      }
      if (stats.failedRequests > 0) {
        statusMessage += ` ${stats.failedRequests} request(s) failed.`;
      }
      if (stats.updated === 0 && stats.noMatch === 0 && stats.noReleaseDate === 0 && stats.failedRequests === 0) {
        statusMessage = 'TMDb search completed, but no updateable titles were found.';
      }

      setTmdbSyncStatus(statusMessage);
    } catch (error) {
      setTmdbSyncStatus(error?.message || 'Unable to sync TMDb metadata.');
      setTmdbSyncError(true);
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
        const errorBody = await response.text();
        throw new Error(`TMDb request failed (${response.status}): ${errorBody}`);
      }

      const payload = await response.json();
      const results = payload.results || [];
      if (results.length === 0) {
        setTmdbFetchStatus('No recent Tollywood titles were returned by TMDb.');
        return;
      }

      setTmdbFetchStatus(`Fetched ${results.length} Tollywood movie(s) from TMDb. They were not saved to the database.`);
    } catch (error) {
      setTmdbFetchStatus(error?.message || 'Unable to fetch latest Tollywood movies from TMDb.');
      setTmdbFetchError(true);
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
    setMovieForm({
      movie_name: movie.movie_name || '',
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
      const syncYear = String(
        movie.release_date ||
        movie.digital_release_date ||
        ''
      ).slice(0, 4);
      const searchResponse = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(movieTitle)}&originalTitle=${encodeURIComponent(movie.original_title || movieTitle)}&year=${encodeURIComponent(syncYear)}&mediaType=${encodeURIComponent(mediaType)}`
      );
      if (!searchResponse.ok) {
        const errorBody = await searchResponse.text();
        throw new Error(`TMDB search failed (${searchResponse.status}): ${errorBody}`);
      }

      const searchPayload = await searchResponse.json();
      const bestMatch = searchPayload.bestMatch || findBestSearchMatch(searchPayload.results, movieTitle);

      if (!bestMatch?.id) {
        throw new Error(`No TMDB match found for "${movieTitle}".`);
      }

      const payload = {
        tmdb_id: bestMatch.id,
        original_title:
          bestMatch.original_title ||
          bestMatch.original_name ||
          '',
        poster_path: bestMatch.poster_path || '',
        backdrop_path: bestMatch.backdrop_path || '',
        overview: bestMatch.overview || '',
        rating: typeof bestMatch.vote_average === 'number' ? Number(bestMatch.vote_average.toFixed(1)) : null,
        release_date: bestMatch.release_date || bestMatch.first_air_date || null,
      };

      const { error } = await supabase
        .from('ott_movies')
        .update(payload)
        .eq('id', movie.id);

      if (error) {
        throw error;
      }

      await fetchMovies();
      setLiveSyncStatus(`Live TMDB data synced for "${movieTitle}".`);
    } catch (error) {
      setLiveSyncError(true);
      setLiveSyncStatus(error?.message || 'Unable to sync live TMDB data.');
    } finally {
      setLiveSyncMovieId(null);
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
                      <div className="admin-table-wrapper">
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Movie</th>
                              <th>Partner</th>
                              <th>Release date</th>
                              <th>Language</th>
                              <th>Category</th>
                              <th aria-label="Actions" />
                            </tr>
                          </thead>
                          <tbody>
                          {movies.map((movie) => (
                            <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}>
                              <td>{movie.movie_name || 'Untitled'}</td>
                              <td>{movie.streaming_partner || 'TBA'}</td>
                              <td>{movie.digital_release_date || 'TBA'}</td>
                              <td>{movie.language || 'Telugu'}</td>
                              <td>{movie.category || 'Film'}</td>
                              <td>
                                <button type="button" className="admin-action-button" onClick={() => handleEditMovie(movie)}>
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-button"
                                  onClick={() => handleSyncLiveData(movie)}
                                  disabled={liveSyncMovieId === movie.id}
                                >
                                  {liveSyncMovieId === movie.id ? 'Syncing…' : 'Sync live data'}
                                </button>
                                <button type="button" className="admin-action-button admin-action-button--danger" onClick={() => handleDeleteMovie(movie.id)}>
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                      {liveSyncStatus ? (
                        <p className={`admin-status ${liveSyncError ? 'admin-status--error' : ''}`}>
                          {liveSyncStatus}
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

          {status ? <p className="admin-status">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
