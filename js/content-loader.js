(function () {
  const PLACEHOLDER_ID = "ott-section-placeholder";

  function setHomepageModeVisibility() {
    const homepageMode = document.documentElement.dataset.homepageMode;
    const projectPage = document.querySelector(".page-projects");
    const ottPage = document.querySelector(".page-ott");

    if (!ottPage) {
      return;
    }

    if (!homepageMode && projectPage) {
      ottPage.hidden = true;
      return;
    }

    if (homepageMode === "ott_only") {
      ottPage.hidden = false;
      if (projectPage) {
        projectPage.hidden = true;
      }
    } else if (homepageMode === "portfolio") {
      ottPage.hidden = true;
    }
  }

  function insertOttSection() {
    const placeholder = document.getElementById(PLACEHOLDER_ID);
    if (!placeholder) {
      return;
    }

    if (typeof window.ottSectionHtml !== "string") {
      placeholder.innerHTML = "<!-- OTT section template is unavailable -->";
      return;
    }

    placeholder.innerHTML = window.ottSectionHtml;
    setHomepageModeVisibility();
    window.dispatchEvent(new Event("sharedContentLoaded"));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", insertOttSection);
  } else {
    insertOttSection();
  }
})();
