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

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const settings = JSON.parse(raw);
    const root = document.documentElement;
    const homepageMode = settings.homepage_mode || "portfolio";

    root.dataset.hideHome = String(settings.show_home === false);
    root.dataset.hideAbout = String(settings.show_about === false);
    root.dataset.hideProjects = String(settings.show_projects === false);
    root.dataset.hideContact = String(settings.show_contact === false);
    root.dataset.hideOttTab = String(homepageMode === "portfolio");
    root.dataset.hideSiteHeader = String(homepageMode === "ott_only");
    root.dataset.homepageMode = homepageMode;

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
