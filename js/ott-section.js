(function () {
  const ottSectionHtml = `
<main class="page-ott">
  <section class="ott-hero">
    <p class="eyebrow">Telugu OTT releases</p>
    <div class="ott-hero__visual">
      <img src="images/ott-hero-banner.png" alt="Telugu OTT hero banner" class="hero-image" loading="lazy" />
    </div>
    <div class="ott-hero__panel">
      <h1>Premium OTT platform for Telugu movie streaming launches</h1>
      <p class="ott-hero__tagline">
        Discover upcoming OTT release dates, platform rights, and premium launch highlights with a
        sleek dark interface built for streaming enthusiasts.
      </p>
    </div>
  </section>

  <section class="ott-section ott-table-section">
    <div class="section-heading">
      <p class="eyebrow">All releases</p>
      <h2>Upcoming Telugu OTT launches</h2>
    </div>
    <div class="ott-table-filters">
      <div class="ott-filter-buttons">
        <button data-platform-filter="all" class="ott-filter-button is-active">All platforms</button>
        <button data-platform-filter="Netflix" class="ott-filter-button">Netflix</button>
        <button data-platform-filter="Aha" class="ott-filter-button">Aha</button>
        <button data-platform-filter="Prime Video" class="ott-filter-button">Prime Video</button>
        <button data-platform-filter="JioHotstar" class="ott-filter-button">JioHotstar</button>
        <button data-platform-filter="Zee5" class="ott-filter-button">Zee5</button>
        <button data-platform-filter="Sun NXT" class="ott-filter-button">Sun NXT</button>
        <button data-platform-filter="ETV Win" class="ott-filter-button">ETV Win</button>
        <button data-platform-filter="other" class="ott-filter-button">Other</button>
      </div>
      <div class="ott-filter-mobile">
        <label for="ott-platform-select" class="ott-filter-label">Platform</label>
        <select id="ott-platform-select" name="ott-platform-select" class="ott-select">
          <option value="all">All platforms</option>
          <option value="Netflix">Netflix</option>
          <option value="Aha">Aha</option>
          <option value="Prime Video">Prime Video</option>
          <option value="JioHotstar">JioHotstar</option>
          <option value="Zee5">Zee5</option>
          <option value="Sun NXT">Sun NXT</option>
          <option value="ETV Win">ETV Win</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div class="ott-filter-actions">
        <label for="ott-date-sort" class="ott-filter-label">Sort by date</label>
        <select id="ott-date-sort" name="ott-date-sort" class="ott-select">
          <option value="desc">Newest first</option>
          <option value="asc">Oldest first</option>
        </select>
      </div>
    </div>
    <span id="ott-movie-count" class="ott-movie-count">Loading movies...</span>
    <div class="ott-table-wrap">
      <table class="ott-movies-table">
        <thead>
          <tr>
            <th>Movie</th>
            <th>Release date</th>
            <th>Platform</th>
            <th>Language</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody id="ott-movies-table-body"></tbody>
      </table>
    </div>
    <p id="ott-movies-status" class="admin-status" hidden aria-live="polite"></p>
    <div id="ott-movies-loading" class="admin-loading" hidden>Loading OTT releases...</div>
  </section>

  <section class="ott-section ott-trending">
    <div class="section-heading">
      <p class="eyebrow">Trending</p>
      <h2>Buzzing Telugu OTT premieres</h2>
    </div>
    <div class="ott-trending-carousel" id="ott-trending-list" aria-label="Trending OTT releases"></div>
  </section>
</main>
`;

  window.ottSectionHtml = ottSectionHtml;
})();
