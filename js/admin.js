const authSection = document.getElementById("admin-auth-section");
const dashboardSection = document.getElementById("admin-dashboard-section");
const loginForm = document.getElementById("admin-login-form");
const authStatus = document.getElementById("admin-auth-status");
const loginButton = document.getElementById("admin-login-button");
const loginButtonText = loginButton?.querySelector(".contact-submit__text");
const loginButtonSpinner = loginButton?.querySelector(".contact-submit__spinner");
const sessionLabel = document.getElementById("admin-session-label");
const logoutButton = document.getElementById("admin-logout-button");

const tabButtons = document.querySelectorAll("[data-admin-tab-button]");
const tabPanels = document.querySelectorAll("[data-admin-tab-panel]");

const movieForm = document.getElementById("movie-form");
const movieFormStatus = document.getElementById("movie-form-status");
const movieSubmitButton = document.getElementById("movie-submit-button");
const movieSubmitButtonText = movieSubmitButton?.querySelector(".contact-submit__text");
const movieSubmitButtonSpinner = movieSubmitButton?.querySelector(".contact-submit__spinner");
const ottCsvStatus = document.getElementById("ott-csv-status");
const ottDownloadButton = document.getElementById("ott-download-button");
const ottCsvFileInput = document.getElementById("ott-csv-file");
const ottUploadButton = document.getElementById("ott-upload-button");
const ottUploadButtonText = ottUploadButton?.querySelector(".contact-submit__text");
const ottUploadButtonSpinner = ottUploadButton?.querySelector(".contact-submit__spinner");
const moviesList = document.getElementById("movies-list");
const moviesStatus = document.getElementById("admin-data-status");
const moviesLoading = document.getElementById("admin-loading");

const contactSubmissionsList = document.getElementById("contact-submissions-list");
const contactAdminStatus = document.getElementById("contact-admin-status");
const contactAdminLoading = document.getElementById("contact-admin-loading");

const siteSettingsForm = document.getElementById("site-settings-form");
const siteSettingsStatus = document.getElementById("site-settings-status");
const siteSettingsSubmitButton = document.getElementById("site-settings-submit-button");
const siteSettingsSubmitButtonText = siteSettingsSubmitButton?.querySelector(".contact-submit__text");
const siteSettingsSubmitButtonSpinner = siteSettingsSubmitButton?.querySelector(".contact-submit__spinner");

const OTT_TABLE_NAME = "ott_movies";
const CONTACT_TABLE_NAME = "contact_submissions";
const SITE_SETTINGS_TABLE_NAME = "site_settings";
const SITE_SETTINGS_ROW_ID = 1;
const SITE_SETTINGS_STORAGE_KEY = "siteSettingsCache";

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

const supabaseClient = resolveSupabaseClient({ storageType: "session" });
let ottMoviesCache = [];

function formatCreatedAt(value) {
  if (!value) return "Unknown date";
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReleaseDate(value) {
  if (!value) return "TBA";
  const normalized = normalizeCsvDate(value) || String(value).trim();
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function setStatus(target, message, isError = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle("admin-status--error", isError);
  target.hidden = !message;
}

function setButtonLoading(button, textNode, spinnerNode, isLoading, idleText, loadingText) {
  if (button) button.disabled = isLoading;
  if (textNode) textNode.textContent = isLoading ? loadingText : idleText;
  if (spinnerNode) spinnerNode.hidden = !isLoading;
}

function setAuthenticatedState(session) {
  const isAuthenticated = Boolean(session);
  if (authSection) authSection.hidden = isAuthenticated;
  if (dashboardSection) dashboardSection.hidden = !isAuthenticated;
  if (sessionLabel) {
    sessionLabel.textContent = isAuthenticated ? `Signed in as ${session.user.email || "admin user"}` : "";
  }
}

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.adminTabButton === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    panel.hidden = panel.dataset.adminTabPanel !== tabName;
  });
}

function renderEmptyState(container, message) {
  if (!container) return;
  container.innerHTML = `<p class="admin-empty">${message}</p>`;
}

function escapeCsvValue(value) {
  const normalized = value == null ? "" : String(value);
  if (/[",\r\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function normalizeCsvHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => String(cell || "").trim() !== ""));
}

function normalizeCsvDate(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const cleaned = raw.replace(/\b(st|nd|rd|th)\b/gi, "").trim();

  const isoDateMatch = cleaned.match(/^(\d{4})[\/\.\- ](\d{1,2})[\/\.\- ](\d{1,2})(?:[T ]\d{2}:\d{2}:\d{2})?$/);
  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    return `${year.padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const europeanDateMatch = cleaned.match(/^(\d{1,2})[\/\.\- ](\d{1,2})[\/\.\- ](\d{2,4})(?:[T ]\d{2}:\d{2}:\d{2})?$/);
  if (europeanDateMatch) {
    const [, day, month, year] = europeanDateMatch;
    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year.length === 2 ? `20${year}` : year);
    if (dayNumber >= 1 && dayNumber <= 31 && monthNumber >= 1 && monthNumber <= 12) {
      return `${String(yearNumber).padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    }
  }

  const monthNames = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    sept: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };

  const namedMonthMatch = cleaned.match(/^(\d{1,2})[\s\-\/\.]+([A-Za-z]+)[\s\-\/\.]+(\d{4})$/);
  if (namedMonthMatch) {
    const [, day, monthName, year] = namedMonthMatch;
    const monthNumber = monthNames[monthName.toLowerCase().slice(0, 3)];
    const dayNumber = Number(day);
    if (monthNumber && dayNumber >= 1 && dayNumber <= 31) {
      return `${year.padStart(4, "0")}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(cleaned);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

function buildCsvPayload(text) {
  const rows = parseCsv(text);
  if (!rows.length) {
    throw new Error("The CSV file is empty.");
  }

  const headers = rows[0].map(normalizeCsvHeader);
  const requiredColumns = ["movie_name"];
  const missingRequiredColumns = requiredColumns.filter((column) => !headers.includes(column));

  if (missingRequiredColumns.length) {
    throw new Error(`Missing required column(s): ${missingRequiredColumns.join(", ")}`);
  }

  return rows.slice(1).map((row, rowIndex) => {
    const record = {};
    headers.forEach((header, headerIndex) => {
      record[header] = row[headerIndex]?.trim() ?? "";
    });

    const normalizedDate = normalizeCsvDate(record.digital_release_date);
    if (record.digital_release_date && normalizedDate === null) {
      throw new Error(
        `Invalid date format in CSV row ${rowIndex + 2}: "${record.digital_release_date}". ` +
          `Expected formats like 13-03-2026, 2026-03-13, or 13 Mar 2026.`
      );
    }

    return {
      movie_name: record.movie_name || "",
      digital_release_date: normalizedDate,
      streaming_partner: record.streaming_partner || "",
      category: record.category || "",
      language: record.language || "",
    };
  }).filter((row) => row.movie_name);
}

async function uploadMovieRows(rows) {
  const { data: existingMovies, error: fetchError } = await supabaseClient
    .from(OTT_TABLE_NAME)
    .select("id, movie_name");

  if (fetchError) {
    throw fetchError;
  }

  const existingMovieNames = new Set(
    (existingMovies || [])
      .map((movie) => String(movie.movie_name || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const highestExistingId = (existingMovies || [])
    .map((movie) => Number(movie.id) || 0)
    .reduce((max, current) => Math.max(max, current), 0);
  let nextId = highestExistingId + 1;

  const uniqueNewRows = [];

  rows.forEach((row) => {
    const movieNameKey = String(row.movie_name || "").trim().toLowerCase();
    if (!movieNameKey || existingMovieNames.has(movieNameKey)) {
      return;
    }

    existingMovieNames.add(movieNameKey);
    uniqueNewRows.push({ id: nextId++, ...row });
  });

  if (!uniqueNewRows.length) {
    return { insertedCount: 0 };
  }

  const { error } = await supabaseClient.from(OTT_TABLE_NAME).insert(uniqueNewRows);

  if (error) {
    throw error;
  }

  return { insertedCount: uniqueNewRows.length };
}

function createMovieCard(movie) {
  const card = document.createElement("article");
  card.className = "submission-card";

  const top = document.createElement("div");
  top.className = "submission-card__top";

  const title = document.createElement("div");
  title.className = "submission-card__title";
  title.textContent = movie.movie_name || "Untitled";

  const category = document.createElement("span");
  category.className = "submission-card__status";
  category.textContent = movie.category || "Movie";
  title.appendChild(category);

  const date = document.createElement("time");
  date.className = "submission-card__date";
  date.dateTime = movie.created_at || "";
  date.textContent = formatCreatedAt(movie.created_at);

  top.appendChild(title);
  top.appendChild(date);

  const releaseDate = document.createElement("p");
  releaseDate.className = "submission-card__meta";
  releaseDate.textContent = `Digital Release Date: ${formatReleaseDate(movie.digital_release_date)}`;

  const partner = document.createElement("p");
  partner.className = "submission-card__meta";
  partner.textContent = `Streaming Partner: ${movie.streaming_partner || "-"}`;

  const language = document.createElement("p");
  language.className = "submission-card__meta";
  language.textContent = `Language: ${movie.language || "-"}`;

  card.appendChild(top);
  card.appendChild(releaseDate);
  card.appendChild(partner);
  card.appendChild(language);

  return card;
}

function createContactSubmissionCard(submission) {
  const card = document.createElement("article");
  card.className = "submission-card";
  if (submission.is_read) card.classList.add("submission-card--read");

  const top = document.createElement("div");
  top.className = "submission-card__top";

  const title = document.createElement("div");
  title.className = "submission-card__title";
  title.textContent = submission.full_name || "Unnamed";

  const status = document.createElement("span");
  status.className = "submission-card__status";
  status.textContent = submission.is_read ? "Read" : "Unread";
  title.appendChild(status);

  const date = document.createElement("time");
  date.className = "submission-card__date";
  date.dateTime = submission.created_at || "";
  date.textContent = formatCreatedAt(submission.created_at);

  top.appendChild(title);
  top.appendChild(date);

  const email = document.createElement("p");
  email.className = "submission-card__meta";
  const emailLabel = document.createElement("strong");
  emailLabel.textContent = "Email:";
  email.appendChild(emailLabel);
  email.appendChild(document.createTextNode(" "));
  if (submission.email) {
    const emailLink = document.createElement("a");
    emailLink.href = `mailto:${submission.email}`;
    emailLink.textContent = submission.email;
    email.appendChild(emailLink);
  } else {
    email.appendChild(document.createTextNode("-"));
  }

  const subject = document.createElement("p");
  subject.className = "submission-card__meta";
  const subjectLabel = document.createElement("strong");
  subjectLabel.textContent = "Subject:";
  subject.appendChild(subjectLabel);
  subject.appendChild(document.createTextNode(` ${submission.subject || "(no subject)"}`));

  const message = document.createElement("p");
  message.className = "submission-card__message";
  message.textContent = submission.message || "(no message)";

  const controls = document.createElement("div");
  controls.className = "submission-card__controls";

  const markReadButton = document.createElement("button");
  markReadButton.type = "button";
  markReadButton.className = "submission-card__button";
  markReadButton.textContent = submission.is_read ? "Already read" : "Mark as read";
  markReadButton.disabled = submission.is_read;

  markReadButton.addEventListener("click", async () => {
    if (submission.is_read) return;
    markReadButton.disabled = true;
    markReadButton.textContent = "Saving...";
    setStatus(contactAdminStatus, "");

    const { error } = await supabaseClient
      .from(CONTACT_TABLE_NAME)
      .update({ is_read: true })
      .eq("id", submission.id);

    if (error) {
      console.error("Mark read error:", error);
      setStatus(contactAdminStatus, "Unable to update read status. Please try again.", true);
      markReadButton.disabled = false;
      markReadButton.textContent = "Mark as read";
      return;
    }

    submission.is_read = true;
    card.classList.add("submission-card--read");
    status.textContent = "Read";
    markReadButton.textContent = "Already read";
  });

  controls.appendChild(markReadButton);
  card.appendChild(top);
  card.appendChild(email);
  card.appendChild(subject);
  card.appendChild(message);
  card.appendChild(controls);
  return card;
}

function applySiteSettingsToForm(settings) {
  const homepageMode = document.getElementById("homepage-mode");
  const showHome = document.getElementById("setting-show-home");
  const showAbout = document.getElementById("setting-show-about");
  const showProjects = document.getElementById("setting-show-projects");
  const showContact = document.getElementById("setting-show-contact");
  const siteUpdateDate = document.getElementById("site-update-date");

  if (homepageMode) homepageMode.value = settings.homepage_mode || "portfolio";
  if (showHome) showHome.checked = settings.show_home !== false;
  if (showAbout) showAbout.checked = settings.show_about !== false;
  if (showProjects) showProjects.checked = settings.show_projects !== false;
  if (showContact) showContact.checked = settings.show_contact !== false;

  const localSettingsRaw = window.localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
  const localSettings = localSettingsRaw ? JSON.parse(localSettingsRaw) : {};
  if (siteUpdateDate) {
    siteUpdateDate.value = settings.site_update_date || localSettings.site_update_date || "";
  }
}

function cacheSiteSettings(settings) {
  try {
    window.localStorage.setItem(SITE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Site settings cache error:", error);
  }
}

async function loadMovies() {
  if (!moviesList || !moviesLoading) return;
  setStatus(moviesStatus, "");
  moviesLoading.hidden = false;
  moviesList.innerHTML = "";

  const { data, error } = await supabaseClient
    .from(OTT_TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  moviesLoading.hidden = true;

  if (error) {
    console.error("Fetch OTT movies error:", error);
    setStatus(moviesStatus, "Unable to load movies. Please check your permissions.", true);
    renderEmptyState(moviesList, "No movies could be loaded.");
    return;
  }

  if (!data || data.length === 0) {
    ottMoviesCache = [];
    renderEmptyState(moviesList, "No movies added yet.");
    return;
  }

  ottMoviesCache = data;
  data.forEach((movie) => {
    moviesList.appendChild(createMovieCard(movie));
  });
}

async function loadContactSubmissions() {
  if (!contactSubmissionsList || !contactAdminLoading) return;
  setStatus(contactAdminStatus, "");
  contactAdminLoading.hidden = false;
  contactSubmissionsList.innerHTML = "";

  const { data, error } = await supabaseClient
    .from(CONTACT_TABLE_NAME)
    .select("*")
    .order("created_at", { ascending: false });

  contactAdminLoading.hidden = true;

  if (error) {
    console.error("Fetch contact submissions error:", error);
    setStatus(contactAdminStatus, "Unable to load contact submissions. Please check your permissions.", true);
    renderEmptyState(contactSubmissionsList, "No submissions could be loaded.");
    return;
  }

  if (!data || data.length === 0) {
    renderEmptyState(contactSubmissionsList, "No submissions found.");
    return;
  }

  data.forEach((submission) => {
    contactSubmissionsList.appendChild(createContactSubmissionCard(submission));
  });
}

async function loadSiteSettings() {
  if (!siteSettingsForm) return;

  const { data, error } = await supabaseClient
    .from(SITE_SETTINGS_TABLE_NAME)
    .select("*")
    .eq("id", SITE_SETTINGS_ROW_ID)
    .maybeSingle();

  if (error) {
    console.error("Fetch site settings error:", error);
    setStatus(siteSettingsStatus, "Unable to load site settings. Create the settings table and policies first.", true);
    return;
  }

  applySiteSettingsToForm(data || {});
  cacheSiteSettings(data || {});
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    window.trackAnalyticsEvent?.("click", "Admin", `Admin tab: ${button.dataset.adminTabButton}`);
    setActiveTab(button.dataset.adminTabButton);
  });
});

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;

    window.trackAnalyticsEvent?.("sign_in", "Admin", "Admin login attempt");

    setStatus(authStatus, "");
    setButtonLoading(loginButton, loginButtonText, loginButtonSpinner, true, "Sign In", "Signing In...");

    const formData = new FormData(loginForm);
    const email = formData.get("email")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

    setButtonLoading(loginButton, loginButtonText, loginButtonSpinner, false, "Sign In", "Signing In...");

    if (error) {
      console.error("Admin sign-in error:", error);
      setStatus(authStatus, "Login failed. Check your email and password.", true);
      return;
    }

    loginForm.reset();
    setStatus(authStatus, "");
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    window.trackAnalyticsEvent?.("sign_out", "Admin", "Admin logout");

    setStatus(moviesStatus, "");
    setStatus(movieFormStatus, "");
    setStatus(contactAdminStatus, "");
    setStatus(siteSettingsStatus, "");

    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      console.error("Admin sign-out error:", error);
      setStatus(moviesStatus, "Unable to sign out right now. Please try again.", true);
    }
  });
}

if (movieForm) {
  movieForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!movieForm.reportValidity()) return;

    window.trackAnalyticsEvent?.("submit", "Admin Form", "Add movie");

    setStatus(movieFormStatus, "");
    setButtonLoading(movieSubmitButton, movieSubmitButtonText, movieSubmitButtonSpinner, true, "Add Movie", "Saving...");

    const formData = new FormData(movieForm);
    const payload = {
      movie_name: formData.get("movie_name")?.toString().trim() ?? "",
      digital_release_date: formData.get("digital_release_date")?.toString() || null,
      streaming_partner: formData.get("streaming_partner")?.toString().trim() ?? "",
      category: formData.get("category")?.toString().trim() ?? "",
      language: formData.get("language")?.toString().trim() ?? "",
    };

    const { error } = await supabaseClient.from(OTT_TABLE_NAME).insert([payload]);

    setButtonLoading(movieSubmitButton, movieSubmitButtonText, movieSubmitButtonSpinner, false, "Add Movie", "Saving...");

    if (error) {
      console.error("Insert OTT movie error:", error);
      setStatus(movieFormStatus, "Unable to save the movie. Check your table policies and try again.", true);
      return;
    }

    movieForm.reset();
    const languageField = document.getElementById("movie-language");
    if (languageField) languageField.value = "Telugu";

    setStatus(movieFormStatus, "Movie added successfully.");
    loadMovies();
  });
}

if (ottDownloadButton) {
  ottDownloadButton.addEventListener("click", async () => {
    window.trackAnalyticsEvent?.("download", "Admin", "OTT CSV export");
    setStatus(ottCsvStatus, "");

    if (!ottMoviesCache.length) {
      await loadMovies();
    }

    if (!ottMoviesCache.length) {
      setStatus(ottCsvStatus, "There are no movies available to export.", true);
      return;
    }

    const header = [
      "id",
      "movie_name",
      "digital_release_date",
      "streaming_partner",
      "category",
      "language",
    ];

    const lines = [
      header.join(","),
      ...ottMoviesCache.map((movie) =>
        [
          movie.id,
          movie.movie_name,
          movie.digital_release_date,
          movie.streaming_partner,
          movie.category,
          movie.language,
        ]
          .map(escapeCsvValue)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ott-movies.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setStatus(ottCsvStatus, "CSV downloaded successfully.");
  });
}

if (ottUploadButton) {
  ottUploadButton.addEventListener("click", async () => {
    window.trackAnalyticsEvent?.("upload", "Admin", "OTT CSV import");
    const file = ottCsvFileInput?.files?.[0];
    if (!file) {
      setStatus(ottCsvStatus, "Choose a CSV file before uploading.", true);
      return;
    }

    setStatus(ottCsvStatus, "");
    setButtonLoading(
      ottUploadButton,
      ottUploadButtonText,
      ottUploadButtonSpinner,
      true,
      "Upload CSV",
      "Uploading..."
    );

    try {
      const csvText = await file.text();
      const rows = buildCsvPayload(csvText);

      if (!rows.length) {
        throw new Error("No valid movie rows were found in the CSV.");
      }

      const result = await uploadMovieRows(rows);
      if (ottCsvFileInput) {
        ottCsvFileInput.value = "";
      }

      if (!result.insertedCount) {
        setStatus(ottCsvStatus, "CSV checked successfully. All movies already exist, so no new rows were added.");
      } else {
        setStatus(
          ottCsvStatus,
          `CSV uploaded successfully. ${result.insertedCount} new movie row(s) added.`
        );
      }
      await loadMovies();
    } catch (error) {
      console.error("CSV upload error:", error);
      setStatus(
        ottCsvStatus,
        error?.message || "Unable to upload the CSV file. Please check the file and try again.",
        true
      );
    } finally {
      setButtonLoading(
        ottUploadButton,
        ottUploadButtonText,
        ottUploadButtonSpinner,
        false,
        "Upload CSV",
        "Uploading..."
      );
    }
  });
}

if (siteSettingsForm) {
  siteSettingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    window.trackAnalyticsEvent?.("submit", "Admin Form", "Site settings");

    setStatus(siteSettingsStatus, "");
    setButtonLoading(
      siteSettingsSubmitButton,
      siteSettingsSubmitButtonText,
      siteSettingsSubmitButtonSpinner,
      true,
      "Save Settings",
      "Saving..."
    );

    const siteUpdateDate = String(document.getElementById("site-update-date")?.value || "").trim();
    const payload = {
      id: SITE_SETTINGS_ROW_ID,
      homepage_mode: document.getElementById("homepage-mode")?.value || "portfolio",
      show_home: Boolean(document.getElementById("setting-show-home")?.checked),
      show_about: Boolean(document.getElementById("setting-show-about")?.checked),
      show_projects: Boolean(document.getElementById("setting-show-projects")?.checked),
      show_contact: Boolean(document.getElementById("setting-show-contact")?.checked),
      site_update_date: siteUpdateDate || null,
    };

    const { error } = await supabaseClient
      .from(SITE_SETTINGS_TABLE_NAME)
      .upsert([payload], { onConflict: "id" });

    setButtonLoading(
      siteSettingsSubmitButton,
      siteSettingsSubmitButtonText,
      siteSettingsSubmitButtonSpinner,
      false,
      "Save Settings",
      "Saving..."
    );

    if (error) {
      console.error("Save site settings error:", error);
      setStatus(siteSettingsStatus, "Unable to save site settings. Check your table and policies.", true);
      return;
    }

    const cachePayload = { ...payload };
    cacheSiteSettings(cachePayload);

    setStatus(
      siteSettingsStatus,
      "Site settings saved successfully.",
      false
    );
  });
}

supabaseClient.auth.onAuthStateChange((_event, session) => {
  setAuthenticatedState(session);
  setStatus(authStatus, "");

  if (session) {
    loadMovies();
    loadContactSubmissions();
    loadSiteSettings();
  } else {
    if (moviesList) moviesList.innerHTML = "";
    if (contactSubmissionsList) contactSubmissionsList.innerHTML = "";
  }
});

async function initAdmin() {
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  setActiveTab("ott");
  setAuthenticatedState(session);

  if (session) {
    loadMovies();
    loadContactSubmissions();
    loadSiteSettings();
  }
}

initAdmin();
