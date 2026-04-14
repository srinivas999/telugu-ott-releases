(function () {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    return;
  }

  const STORAGE_KEY = "siteSettingsCache";
  const SETTINGS_TABLE_NAME = "site_settings";
  const SETTINGS_ROW_ID = 1;
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

  const supabaseClient = resolveSupabaseClient();

  function setLinkVisibility(href, isVisible) {
    document.querySelectorAll(`a[href="${href}"]`).forEach((link) => {
      const item = link.closest("li") || link;
      item.hidden = !isVisible;
    });
  }

  function setElementVisibility(selector, isVisible) {
    document.querySelectorAll(selector).forEach((element) => {
      element.hidden = !isVisible;
    });
  }

  function applyFooterContent(settings) {
    const homepageMode = settings.homepage_mode || "portfolio";
    const footerName = document.querySelector(".site-footer__name");
    const footerTagline = document.querySelector(".site-footer__tagline");
    const footerNavLabel = document.getElementById("footer-nav-label");
    const footerSocial = document.querySelector(".site-footer__social");
    const footerNavList = document.querySelector(".site-footer__nav ul");

    if (homepageMode === "ott_only") {
      if (footerName) {
        footerName.textContent = "SV Telugu OTT";
      }

      if (footerTagline) {
        footerTagline.textContent =
          "Track Telugu movie and series OTT release dates, streaming platforms, and latest digital premieres.";
      }

      if (footerNavLabel) {
        footerNavLabel.textContent = "Browse";
      }

      if (footerSocial) {
        footerSocial.hidden = true;
      }

      if (footerNavList) {
        footerNavList.innerHTML = "";

        const links = [
          { href: "index.html", label: "Latest OTT Releases" },
          { href: "ott-movies.html", label: "All OTT Movies" },
        ];

        links.forEach((item) => {
          const li = document.createElement("li");
          const link = document.createElement("a");
          link.href = item.href;
          link.textContent = item.label;
          li.appendChild(link);
          footerNavList.appendChild(li);
        });
      }

      return;
    }

    if (footerName) {
      footerName.textContent = "Srinivas";
    }

    if (footerTagline) {
      footerTagline.textContent =
        "UX designer crafting digital experiences people actually enjoy using.";
    }

    if (footerNavLabel) {
      footerNavLabel.textContent = "Navigate";
    }

    if (footerSocial) {
      footerSocial.hidden = false;
    }
  }

  function applyVisibility(settings) {
    const root = document.documentElement;
    const homepageMode = settings.homepage_mode || "portfolio";
    const showHome = settings.show_home !== false;
    const showAbout = settings.show_about !== false;
    const showProjects = settings.show_projects !== false;
    const showContact = settings.show_contact !== false;

    root.dataset.hideOttTab = String(homepageMode === "portfolio");
    root.dataset.hideSiteHeader = String(homepageMode === "ott_only");
    root.dataset.hideHome = String(!showHome);
    root.dataset.hideAbout = String(!showAbout);
    root.dataset.hideProjects = String(!showProjects);
    root.dataset.hideContact = String(!showContact);

    setLinkVisibility("index.html", showHome);
    setLinkVisibility("about.html", showAbout);
    setLinkVisibility("projects.html", showProjects);
    setLinkVisibility("contact.html", showContact);
    setLinkVisibility("ott-movies.html", homepageMode !== "portfolio");

    if (currentPage === "home") {
      setElementVisibility("#about", showAbout);
      setElementVisibility("#projects", showProjects);
      setElementVisibility("#contact", showContact);
    }

    applyFooterContent(settings);
  }

  function applyHomepageMode(settings) {
    const homepageMode = settings.homepage_mode || "portfolio";
    document.documentElement.dataset.homepageMode = homepageMode;

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
  }

  async function loadSiteSettings() {
    const { data, error } = await supabaseClient
      .from(SETTINGS_TABLE_NAME)
      .select("*")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error("Site settings load error:", error);
      }
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (storageError) {
      console.error("Site settings cache error:", storageError);
    }

    applyVisibility(data);
    applyHomepageMode(data);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("homepageModeApplied"));
    }
  }

  loadSiteSettings();
})();
