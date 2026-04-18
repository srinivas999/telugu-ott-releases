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
  } catch (error) {
    console.error("Site settings init error:", error);
  }
})();
