(function () {
  var currentUrl = window.location.href.replace(/\/$/, "");
  var canonical = document.querySelector('link[rel="canonical"]');
  var ogUrl = document.querySelector('meta[property="og:url"]');
  var jsonLd = document.getElementById("site-jsonld");

  if (canonical) {
    canonical.href = currentUrl;
  }

  if (ogUrl) {
    ogUrl.content = currentUrl;
  }

  if (jsonLd && jsonLd.textContent) {
    try {
      var data = JSON.parse(jsonLd.textContent);
      data.url = currentUrl;
      jsonLd.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("Failed to parse JSON-LD metadata:", e);
    }
  }
})();
