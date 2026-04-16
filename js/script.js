(function () {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  const siteHeader = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const navBackdrop = document.querySelector(".nav-backdrop");
  const primaryMenu = document.getElementById("primary-menu");
  const mqMobileNav = window.matchMedia("(max-width: 767.98px)");

  function closeMobileNav() {
    if (!siteHeader || !navToggle) return;
    siteHeader.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
    if (navBackdrop) {
      navBackdrop.setAttribute("aria-hidden", "true");
    }
  }

  function openMobileNav() {
    if (!siteHeader || !navToggle) return;
    siteHeader.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("nav-open");
    if (navBackdrop) {
      navBackdrop.setAttribute("aria-hidden", "false");
    }
  }

  if (siteHeader && navToggle && primaryMenu) {
    navToggle.addEventListener("click", () => {
      if (siteHeader.classList.contains("is-open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    if (navBackdrop) {
      navBackdrop.addEventListener("click", closeMobileNav);
    }

    primaryMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (mqMobileNav.matches) {
          closeMobileNav();
        }
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeMobileNav();
      }
    });

    function onViewportNavChange(e) {
      if (!e.matches) {
        closeMobileNav();
      }
    }

    if (typeof mqMobileNav.addEventListener === "function") {
      mqMobileNav.addEventListener("change", onViewportNavChange);
    } else if (typeof mqMobileNav.addListener === "function") {
      mqMobileNav.addListener(onViewportNavChange);
    }
  }

  const navLinks = document.querySelectorAll("[data-nav-link]");

  function isHomeLink(href) {
    if (!href) return false;
    const path = href.split("#")[0];
    if (path === "index.html" || path === "./index.html") return true;
    if (/\/index\.html$/i.test(path)) return true;
    return href === "#home" || href === "index.html#home";
  }

  function isAboutLink(href) {
    if (!href) return false;
    return href === "about.html" || /\/about\.html$/i.test(href.split("#")[0]);
  }

  function isProjectsLink(href) {
    if (!href) return false;
    const path = href.split("#")[0];
    return (
      href === "#projects" ||
      href.endsWith("#projects") ||
      path === "projects.html" ||
      /\/projects\.html$/i.test(path)
    );
  }

  function isOttMoviesLink(href) {
    if (!href) return false;
    const path = href.split("#")[0];
    return path === "ott-movies.html" || /\/ott-movies\.html$/i.test(path);
  }

  function isAdminLink(href) {
    if (!href) return false;
    const path = href.split("#")[0];
    return path === "admin.html" || /\/admin\.html$/i.test(path);
  }

  function isContactLink(href) {
    if (!href) return false;
    const path = href.split("#")[0];
    return (
      href === "#contact" ||
      href.endsWith("#contact") ||
      path === "contact.html" ||
      /\/contact\.html$/i.test(path)
    );
  }

  function setNavHighlight(active) {
    navLinks.forEach((a) => {
      const href = a.getAttribute("href");
      let match = false;
      if (active === "home") match = isHomeLink(href);
      else if (active === "about") match = isAboutLink(href);
      else if (active === "projects") match = isProjectsLink(href);
      else if (active === "ott-movies") match = isOttMoviesLink(href);
      else if (active === "admin") match = isAdminLink(href);
      else if (active === "contact") match = isContactLink(href);
      a.classList.toggle("is-active", match);
      if (match) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function sectionIdToNav(id) {
    if (id === "projects") return "projects";
    if (id === "contact") return "contact";
    return "home";
  }

  const path = window.location.pathname || "";
  const onAboutPage = /about\.html$/i.test(path) || /[/\\]about$/i.test(path);
  const onProjectsPage = /projects\.html$/i.test(path) || /[/\\]projects$/i.test(path);
  const onOttMoviesPage = /ott-movies\.html$/i.test(path) || /[/\\]ott-movies$/i.test(path);
  const onAdminPage = /admin\.html$/i.test(path) || /[/\\]admin$/i.test(path);
  const onContactPage = /contact\.html$/i.test(path) || /[/\\]contact$/i.test(path);

  if (navLinks.length && onAboutPage) {
    setNavHighlight("about");
    return;
  }

  if (navLinks.length && onProjectsPage) {
    setNavHighlight("projects");
    return;
  }

  if (navLinks.length && onOttMoviesPage) {
    setNavHighlight("ott-movies");
    return;
  }

  if (navLinks.length && onAdminPage) {
    setNavHighlight("admin");
    return;
  }

  if (navLinks.length && onContactPage) {
    setNavHighlight("contact");
    return;
  }

  const sectionIds = ["home", "skills", "about", "projects", "contact"];
  const sections = sectionIds.map((id) => document.getElementById(id));
  const validSections = sections.filter(Boolean);

  if (navLinks.length && validSections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setNavHighlight(sectionIdToNav(visible[0].target.id));
        }
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    validSections.forEach((el) => observer.observe(el));

    const hash = window.location.hash.replace("#", "");
    if (hash === "projects" && document.getElementById("projects")) {
      setNavHighlight("projects");
    } else if (hash === "contact" && document.getElementById("contact")) {
      setNavHighlight("contact");
    } else {
      setNavHighlight("home");
    }

    window.addEventListener("hashchange", () => {
      const id = window.location.hash.replace("#", "");
      if (id === "projects" && document.getElementById("projects")) {
        setNavHighlight("projects");
      } else if (id === "contact" && document.getElementById("contact")) {
        setNavHighlight("contact");
      } else {
        setNavHighlight("home");
      }
    });
  }
})();
