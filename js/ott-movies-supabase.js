function getOttPageContainer() {
  const ottPage = document.querySelector(".page-ott");
  const projectsPage = document.querySelector(".page-projects");
  const homepageMode = document.documentElement.dataset.homepageMode;

  if (ottPage && projectsPage) {
    if (homepageMode === "ott_only") {
      return ottPage;
    }
    if (homepageMode === "portfolio") {
      return projectsPage;
    }
  }

  return (
    document.querySelector(".page-ott:not([hidden])") ||
    document.querySelector(".page-projects:not([hidden])") ||
    ottPage ||
    projectsPage ||
    document.documentElement
  );
}

function getPageElement(id) {
  const page = getOttPageContainer();
  return page ? page.querySelector(`#${id}`) : document.querySelector(`#${id}`);
}

function getPageElements(selector) {
  const page = getOttPageContainer();
  return page ? Array.from(page.querySelectorAll(selector)) : Array.from(document.querySelectorAll(selector));
}

function getOttMoviesTableBody() {
  return getPageElement("ott-movies-table-body");
}

function getOttTrendingList() {
  return getPageElement("ott-trending-list") || document.getElementById("ott-trending-list");
}

function getOttMoviesStatus() {
  return getPageElement("ott-movies-status") || document.getElementById("ott-movies-status");
}

function getOttMoviesLoading() {
  return getPageElement("ott-movies-loading") || document.getElementById("ott-movies-loading");
}

function getOttDateSort() {
  return getPageElement("ott-date-sort") || document.getElementById("ott-date-sort");
}

function getOttPlatformSelect() {
  return getPageElement("ott-platform-select") || document.getElementById("ott-platform-select");
}

function getOttMovieCount() {
  return getPageElement("ott-movie-count") || document.getElementById("ott-movie-count");
}

function getOttFilters() {
  return getPageElements("[data-platform-filter]");
}

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
  const ottMoviesStatus = getOttMoviesStatus();
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
  if (lower.includes("zee")) return "Zee5";
  if (lower.includes("sun nxt") || lower.includes("sun")) return "Sun NXT";
  if (lower.includes("etv")) return "ETV Win";
  return String(value).trim();
}

const ottSeoJsonLd = document.getElementById("ott-jsonld");
const defaultSeoTitle = "Telugu OTT releases this week | OTT Movies";
const defaultSeoDescription =
  "Telugu OTT release schedule for upcoming Telugu OTT movies, streaming dates, and platform availability across Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.";
const ottJsonLdDomain = "https://svteluguott.in/";

function setMeta(selector, content) {
  if (!content) return;
  const meta = document.querySelector(selector);
  if (meta) {
    meta.setAttribute("content", content);
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
  row.setAttribute("itemscope", "");
  row.setAttribute("itemtype", "https://schema.org/Movie");

  const nameCell = document.createElement("td");
  nameCell.innerHTML = `<span itemprop="name">${movie.movie_name || "Untitled"}</span>`;

  const dateCell = document.createElement("td");
  const datePublished = movie.digital_release_date || "";
  dateCell.innerHTML = `<time itemprop="datePublished" datetime="${datePublished}">${formatReleaseDate(movie.digital_release_date)}</time>`;

  const partnerCell = document.createElement("td");
  partnerCell.innerHTML = `<span>${movie.streaming_partner || "TBA"}</span>`;

  const languageCell = document.createElement("td");
  languageCell.innerHTML = `<span itemprop="inLanguage">${movie.language || "Telugu"}</span>`;

  const categoryCell = document.createElement("td");
  categoryCell.innerHTML = `<span itemprop="genre">${movie.category || "Film"}</span>`;

  const metaDescription = document.createElement("meta");
  metaDescription.setAttribute("itemprop", "description");
  metaDescription.content = `${movie.movie_name || "Untitled"} on ${movie.streaming_partner || "OTT"} releases on ${formatReleaseDate(movie.digital_release_date)}.`;
  row.appendChild(metaDescription);

  row.appendChild(nameCell);
  row.appendChild(dateCell);
  row.appendChild(partnerCell);
  row.appendChild(languageCell);
  row.appendChild(categoryCell);

  return row;
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
    const items = filteredMovies.slice(0, 10).map((movieEntry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Movie",
        name: movieEntry.movie_name || "Untitled",
        datePublished: movieEntry.digital_release_date || "",
        description: movieEntry.streaming_partner
          ? `Streaming on ${movieEntry.streaming_partner}`
          : "Telugu OTT movie release",
        url: currentUrl,
      },
    }));

    ottSeoJsonLd.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Latest Telugu OTT Releases",
        itemListElement: items,
      },
      null,
      2
    );
  }
}

function sortMovies(entries) {
  const sortOrder = getOttDateSort()?.value || "desc";
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

function isAllPlatformSelected() {
  return String(selectedPlatform || "").trim().toLowerCase() === "all";
}

function renderMovies(movies) {
  const ottMoviesTableBody = getOttMoviesTableBody();
  const ottMovieCount = getOttMovieCount();
  if (!ottMoviesTableBody) return;

  ottMoviesTableBody.innerHTML = "";
  if (ottMovieCount) {
    const hideCount = isAllPlatformSelected();
    ottMovieCount.hidden = hideCount;
    ottMovieCount.textContent = hideCount ? "" : `${movies.length} movie${movies.length === 1 ? "" : "s"} found`;
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
  const ottTrendingList = getOttTrendingList();
  if (!ottTrendingList) return;
  ottTrendingList.innerHTML = "";
  const trending = sortMovies(movies).slice(0, 6);
  trending.forEach((movie) => ottTrendingList.appendChild(createTrendingCard(movie)));
}

function updateFilters() {
  getOttFilters().forEach((button) => {
    button.classList.toggle("is-active", button.dataset.platformFilter === selectedPlatform);
  });

  const ottPlatformSelect = getOttPlatformSelect();
  if (ottPlatformSelect) {
    ottPlatformSelect.value = selectedPlatform;
  }
}

function applyFilters() {
  const filtered = ottMovies.filter((movie) => {
    const normalized = normalizePlatform(movie.streaming_partner);
    if (isAllPlatformSelected()) return true;
    if (selectedPlatform === "other") {
      return ![
        "Netflix",
        "Aha",
        "Prime Video",
        "JioHotstar",
        "Zee5",
        "Sun NXT",
        "ETV Win",
      ].includes(normalized);
    }
    return normalized === selectedPlatform;
  });

  renderMovies(sortMovies(filtered));
  renderTrending(ottMovies);
  updateSeoTags(filtered);
}

async function loadOttMovies() {
  const ottMoviesLoading = getOttMoviesLoading();
  const ottMoviesTableBody = getOttMoviesTableBody();
  const ottMovieCount = getOttMovieCount();
  if (!ottMoviesLoading || !ottMoviesTableBody) return;

  if (ottMovieCount) {
    ottMovieCount.textContent = "";
    ottMovieCount.hidden = isAllPlatformSelected();
  }

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
    const ottMovieCount = getOttMovieCount();
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

let ottMoviesInitialized = false;

function initializeOttMovies() {
  if (ottMoviesInitialized) return;

  const ottPage = document.querySelector(".page-ott");
  const projectsPage = document.querySelector(".page-projects");
  const homepageMode = document.documentElement.dataset.homepageMode;

  if (ottPage && projectsPage && typeof homepageMode === "undefined") {
    return;
  }

  ottMoviesInitialized = true;

  getOttFilters().forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlatform = button.dataset.platformFilter || "all";
      window.trackAnalyticsEvent?.("click", "OTT Filter", selectedPlatform);
      updateFilters();
      applyFilters();
    });
  });

  const ottPlatformSelectElement = getOttPlatformSelect();
  if (ottPlatformSelectElement) {
    ottPlatformSelectElement.addEventListener("change", () => {
      selectedPlatform = ottPlatformSelectElement.value || "all";
      updateFilters();
      applyFilters();
    });
  }

  const ottDateSortElement = getOttDateSort();
  if (ottDateSortElement) {
    ottDateSortElement.addEventListener("change", applyFilters);
  }

  loadOttMovies();
}

function resetScrollOnLoad() {
  if (!window.location.hash) {
    window.scrollTo(0, 0);
  }
}

initializeOttMovies();
window.addEventListener("homepageModeApplied", initializeOttMovies);
window.addEventListener("sharedContentLoaded", initializeOttMovies);
window.addEventListener("load", () => {
  initializeOttMovies();
  resetScrollOnLoad();
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted && !window.location.hash) {
    resetScrollOnLoad();
  }
});
