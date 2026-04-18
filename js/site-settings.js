(function () {
  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    return;
  }

  const STORAGE_KEY = "siteSettingsCache";
  const SETTINGS_TABLE_NAME = "site_settings";
  const SETTINGS_ROW_ID = 1;

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
    const footerName = document.querySelector(".site-footer__name");
    const footerTagline = document.querySelector(".site-footer__tagline");
    const footerNavLabel = document.getElementById("footer-nav-label");
    const footerSocial = document.querySelector(".site-footer__social");
    const footerNavList = document.querySelector(".site-footer__nav ul");

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
  }

  function applyVisibility(settings) {
    const root = document.documentElement;
    const showHome = settings.show_home !== false;

    root.dataset.hideHome = String(!showHome);

    setLinkVisibility("index.html", showHome);
    setLinkVisibility("ott-movies.html", true);

    applyFooterContent(settings);
  }

  function applyHomepageMode(settings) {
    const homepageMode = settings.homepage_mode || "ott_only";
    document.documentElement.dataset.homepageMode = homepageMode;
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
      const localRaw = window.localStorage.getItem(STORAGE_KEY);
      const localSettings = localRaw ? JSON.parse(localRaw) : {};
      const mergedSettings = {
        ...data,
        site_update_date: data.site_update_date ?? localSettings.site_update_date,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("siteSettingsLoaded", { detail: mergedSettings }));
      }
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
