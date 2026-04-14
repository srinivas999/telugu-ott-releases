const ottMoviesTableBody = document.getElementById("ott-movies-table-body");
const ottTrendingList = document.getElementById("ott-trending-list");
const ottMoviesStatus = document.getElementById("ott-movies-status");
const ottMoviesLoading = document.getElementById("ott-movies-loading");
const ottDateSort = document.getElementById("ott-date-sort");
const ottPlatformSelect = document.getElementById("ott-platform-select");
const ottMovieCount = document.getElementById("ott-movie-count");
const ottFilters = Array.from(document.querySelectorAll("[data-platform-filter]"));

const TABLE_NAME = "ott_movies";
let ottMovies = [];
let selectedPlatform = "all";

function resolveSupabaseClient(options = {}) {
  if (typeof window.getSupabaseClient === "function") {
    return window.getSupabaseClient(options);
  }

  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error("Supabase client configuration is unavailable.");
  }

  const storageType = options.storageType === "session" ? "session" : "local";
  const cacheKey = storageType === "session" ? "__SUPABASE_CLIENT_SESSION__" : "__SUPABASE_CLIENT_LOCAL__";

  if (window[cacheKey]) {
    return window[cacheKey];
  }

  const config =
    storageType === "session"
      ? {
          auth: {
            storage: window.sessionStorage,
            persistSession: true,
          },
        }
      : {};

  window[cacheKey] = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, config);
  return window[cacheKey];
}

function setStatus(message, isError = false) {
  if (!ottMoviesStatus) return;
  ottMoviesStatus.textContent = message;
  ottMoviesStatus.classList.toggle("admin-status--error", isError);
  ottMoviesStatus.hidden = !message;
}

function normalizePlatform(value) {
  if (!value) return "";
  const lower = String(value).toLowerCase();
  if (lower.includes("prime")) return "Prime Video";
  if (lower.includes("netflix")) return "Netflix";
  if (lower.includes("aha")) return "Aha";
  if (lower.includes("hotstar")) return "JioHotstar";
  return String(value).trim();
}

const ottSeoJsonLd = document.getElementById("ott-jsonld");
const defaultSeoTitle = "OTT Movies | Srinivas";
const defaultSeoDescription =
  "Discover upcoming Telugu OTT release dates, platform partners, and streaming availability for Telugu movies.";
const ottJsonLdDomain = "https://svteluguott.in/";

function setMeta(selector, content) {
  if (!content) return;
  const meta = document.querySelector(selector);
  if (meta) {
    meta.setAttribute("content", content);
  }
}

function updateSeoTags(filteredMovies) {
  const movie = filteredMovies[0] || ottMovies[0];
  const currentUrl = window.location.href.replace(/\/$/, "");
  const title = movie
    ? `${movie.movie_name} on ${movie.streaming_partner || "OTT"} — Telugu OTT release`
    : defaultSeoTitle;
  const description = movie
    ? `${movie.movie_name} is coming to ${movie.streaming_partner || "OTT"} on ${formatReleaseDate(
        movie.digital_release_date
      )}. Browse upcoming Telugu OTT movie releases and streaming schedules.`
    : defaultSeoDescription;

  document.title = title;
  setMeta('meta[name="description"]', description);
  setMeta('meta[property="og:title"]', title);
  setMeta('meta[property="og:description"]', description);
  setMeta('meta[name="twitter:title"]', title);
  setMeta('meta[name="twitter:description"]', description);
  setMeta('meta[property="og:url"]', currentUrl);

  if (ottSeoJsonLd) {
    const items = filteredMovies.slice(0, 10).map((movieEntry) => ({
      "@type": "Movie",
      name: movieEntry.movie_name || "Untitled",
      datePublished: movieEntry.digital_release_date || "",
      sameAs: ottJsonLdDomain,
    }));

    ottSeoJsonLd.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": "Latest Telugu OTT Releases",
        itemListElement: items,
      },
      null,
      2
    );
  }
}

function formatReleaseDate(value) {
  if (!value) return "TBA";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function createMovieRow(movie) {
  const row = document.createElement("tr");
  row.dataset.platform = movie.streaming_partner || "";

  const nameCell = document.createElement("td");
  nameCell.textContent = movie.movie_name || "Untitled";

  const dateCell = document.createElement("td");
  dateCell.textContent = formatReleaseDate(movie.digital_release_date);

  const partnerCell = document.createElement("td");
  partnerCell.textContent = movie.streaming_partner || "TBA";

  const languageCell = document.createElement("td");
  languageCell.textContent = movie.language || "Telugu";

  const categoryCell = document.createElement("td");
  categoryCell.textContent = movie.category || "Film";

  row.appendChild(nameCell);
  row.appendChild(dateCell);
  row.appendChild(partnerCell);
  row.appendChild(languageCell);
  row.appendChild(categoryCell);

  return row;
}

function sortMovies(entries) {
  const sortOrder = ottDateSort?.value || "desc";
  return [...entries].sort((a, b) => {
    const firstTime = new Date(`${a.digital_release_date}T00:00:00`).getTime();
    const secondTime = new Date(`${b.digital_release_date}T00:00:00`).getTime();
    if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
      return 0;
    }
    const sorted = sortOrder === "asc" ? firstTime - secondTime : secondTime - firstTime;
    return sorted !== 0 ? sorted : String(a.movie_name || "").localeCompare(String(b.movie_name || ""));
  });
}

function renderMovies(movies) {
  if (!ottMoviesTableBody) return;

  ottMoviesTableBody.innerHTML = "";
  if (ottMovieCount) {
    ottMovieCount.textContent = `${movies.length} movie${movies.length === 1 ? "" : "s"} found`;
  }

  if (!movies.length) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.className = "ott-empty";
    emptyCell.textContent = "No releases match your filter.";
    emptyRow.appendChild(emptyCell);
    ottMoviesTableBody.appendChild(emptyRow);
    return;
  }

  movies.forEach((movie) => ottMoviesTableBody.appendChild(createMovieRow(movie)));
}

function createTrendingCard(movie) {
  const partner = normalizePlatform(movie.streaming_partner) || "Partner";
  const card = document.createElement("article");
  card.className = "ott-trending-card";

  card.innerHTML = `
    <div class="ott-trending-card__stripe"></div>
    <div class="ott-trending-card__body">
      <span class="ott-trending-card__partner">${partner}</span>
      <h3>${movie.movie_name || "Untitled"}</h3>
      <p>${formatReleaseDate(movie.digital_release_date)}</p>
    </div>
  `;

  return card;
}

function renderTrending(movies) {
  if (!ottTrendingList) return;
  ottTrendingList.innerHTML = "";
  const trending = sortMovies(movies).slice(0, 6);
  trending.forEach((movie) => ottTrendingList.appendChild(createTrendingCard(movie)));
}

function updateFilters() {
  ottFilters.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.platformFilter === selectedPlatform);
  });

  if (ottPlatformSelect) {
    ottPlatformSelect.value = selectedPlatform;
  }
}

function applyFilters() {
  const filtered = ottMovies.filter((movie) => {
    if (selectedPlatform === "all") return true;
    return normalizePlatform(movie.streaming_partner) === selectedPlatform;
  });

  renderMovies(sortMovies(filtered));
  renderTrending(ottMovies);
  updateSeoTags(filtered);
}

async function loadOttMovies() {
  if (!ottMoviesLoading || !ottMoviesTableBody) return;

  setStatus("");
  ottMoviesLoading.hidden = false;
  ottMoviesTableBody.innerHTML = "";

  const supabaseClient = resolveSupabaseClient();
  const { data, error } = await supabaseClient
    .from(TABLE_NAME)
    .select("*")
    .order("digital_release_date", { ascending: false })
    .order("created_at", { ascending: false });

  ottMoviesLoading.hidden = true;

  if (error) {
    console.error("Fetch OTT movies error:", error);
    setStatus("Unable to load OTT releases right now. Please refresh and try again.", true);
    const errorRow = document.createElement("tr");
    const errorCell = document.createElement("td");
    errorCell.colSpan = 5;
    errorCell.className = "ott-empty";
    errorCell.textContent = "OTT releases could not be loaded.";
    errorRow.appendChild(errorCell);
    ottMoviesTableBody.appendChild(errorRow);
    return;
  }

  if (!data || data.length === 0) {
    const emptyRow = document.createElement("tr");
    const emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.className = "ott-empty";
    emptyCell.textContent = "No OTT releases added yet.";
    emptyRow.appendChild(emptyCell);
    ottMoviesTableBody.appendChild(emptyRow);
    if (ottMovieCount) {
      ottMovieCount.textContent = "0 movies found";
    }
    return;
  }

  ottMovies = data.map((movie) => ({
    ...movie,
    streaming_partner: normalizePlatform(movie.streaming_partner),
  }));

  applyFilters();
}

ottFilters.forEach((button) => {
  button.addEventListener("click", () => {
    selectedPlatform = button.dataset.platformFilter || "all";
    updateFilters();
    applyFilters();
  });
});

if (ottPlatformSelect) {
  ottPlatformSelect.addEventListener("change", () => {
    selectedPlatform = ottPlatformSelect.value || "all";
    updateFilters();
    applyFilters();
  });
}

if (ottDateSort) {
  ottDateSort.addEventListener("change", applyFilters);
}

loadOttMovies();
