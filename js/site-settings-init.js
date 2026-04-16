function trackAnalyticsEvent(action, category, label, value) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  });
}

(function () {
  const STORAGE_KEY = "siteSettingsCache";
  const path = window.location.pathname || "";
  const currentPage =
    /about\.html$/i.test(path) || /[/\\]about$/i.test(path)
      ? "about"
      : /projects\.html$/i.test(path) || /[/\\]projects$/i.test(path)
        ? "projects"
        : /contact\.html$/i.test(path) || /[/\\]contact$/i.test(path)
          ? "contact"
          : /ott-movies\.html$/i.test(path) || /[/\\]ott-movies$/i.test(path)
            ? "ott"
            : "home";

  function formatUpdateDate(dateString) {
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
      return dateString;
    }
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function applyHeroUpdateNote(dateString) {
    const heroPanel = document.querySelector(".ott-hero__panel");
    if (!heroPanel) return;

    const formattedDate = formatUpdateDate(dateString);
    const noteText = `By Srinivas – ${formattedDate}`;

    let noteEl = heroPanel.querySelector(".ott-hero__updated-note");
    if (!noteEl) {
      noteEl = document.createElement("p");
      noteEl.className = "ott-hero__updated-note";
      const tagline = heroPanel.querySelector(".ott-hero__tagline");
      if (tagline && tagline.parentNode) {
        tagline.parentNode.insertBefore(noteEl, tagline.nextSibling);
      } else {
        heroPanel.appendChild(noteEl);
      }
    }

    noteEl.textContent = noteText;
  }

  function applyHeroUpdateSettings(settings) {
    if (!settings || !settings.site_update_date?.trim()) return;
    applyHeroUpdateNote(settings.site_update_date.trim());
  }

  window.addEventListener("siteSettingsLoaded", (event) => {
    if (!event?.detail) return;
    applyHeroUpdateSettings(event.detail);
  });

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const settings = JSON.parse(raw);
    applyHeroUpdateSettings(settings);
    const root = document.documentElement;
    const homepageMode = settings.homepage_mode || "portfolio";

    root.dataset.hideHome = String(settings.show_home === false);
    root.dataset.hideAbout = String(settings.show_about === false);
    root.dataset.hideProjects = String(settings.show_projects === false);
    root.dataset.hideContact = String(settings.show_contact === false);
    root.dataset.hideOttTab = String(homepageMode === "portfolio");
    root.dataset.hideSiteHeader = String(homepageMode === "ott_only");
    root.dataset.homepageMode = homepageMode;

    applyHeroUpdateSettings(settings);

    if (currentPage === "home") {
      const projectPage = document.querySelector(".page-projects");
      const ottPage = document.querySelector(".page-ott");

      if (projectPage) {
        projectPage.hidden = homepageMode === "ott_only";
      }

      if (ottPage) {
        ottPage.hidden = homepageMode !== "ott_only";
      }
    }
  } catch (error) {
    console.error("Site settings init error:", error);
  }
})();
