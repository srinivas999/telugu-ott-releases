import { useEffect, useState } from 'react';
import Seo from '../components/Seo';
import { supabase } from '../lib/supabaseClient';

const EMPTY_MOVIE = {
  movie_name: '',
  streaming_partner: '',
  digital_release_date: '',
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
            <div className="admin-dashboard-grid">
              <div className="admin-management-card">
                <div className="admin-management-card__header">
                  <div>
                    <p className="admin-panel__welcome">Signed in as {user.email || 'admin user'}.</p>
                    <p className="admin-management-card__subtitle">Manage OTT release records here.</p>
                  </div>
                  <button type="button" className="admin-button" onClick={handleSignOut} disabled={loading}>
                    {loading ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>

                <form className="admin-form" onSubmit={handleMovieSave}>
                  <h2>{editingMovieId ? 'Edit OTT movie' : 'Add OTT movie'}</h2>

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
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Movie</th>
                        <th>Partner</th>
                        <th>Release date</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {movies.map((movie) => (
                        <tr key={movie.id || `${movie.movie_name}-${movie.digital_release_date}`}>
                          <td>{movie.movie_name || 'Untitled'}</td>
                          <td>{movie.streaming_partner || 'TBA'}</td>
                          <td>{movie.digital_release_date || 'TBA'}</td>
                          <td>
                            <button type="button" className="admin-action-button" onClick={() => handleEditMovie(movie)}>
                              Edit
                            </button>
                            <button type="button" className="admin-action-button admin-action-button--danger" onClick={() => handleDeleteMovie(movie.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {status ? <p className="admin-status">{status}</p> : null}
        </div>
      </section>
    </main>
  );
}
