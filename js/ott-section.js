(function () {
  const currentUrl = window.location.href.replace(/\/$/, "");
  const shareText = encodeURIComponent(
    "Telugu OTT releases this week: latest Telugu OTT movie schedule on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win."
  );
  const shareUrl = encodeURIComponent(currentUrl);
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}&via=srinivasv`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
  const telegramShareUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;

  const ottSectionHtml = `
<main class="page-ott">
  <section class="ott-hero">
    <p class="eyebrow">Telugu OTT releases</p>
    <div class="ott-hero__visual">
      <img src="images/ott-hero-banner.png" alt="Telugu OTT hero banner" class="hero-image" loading="lazy" />
    </div>
    <div class="ott-hero__panel">
      <h1>Telugu OTT releases this week</h1>
      <p class="ott-hero__tagline">
        Find upcoming Telugu OTT movies on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT and ETV Win with release dates and platform availability.
      </p>
      <div class="ott-hero__actions share-buttons">
        <a class="share-button share-button--whatsapp" href="${whatsappShareUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
          <span class="share-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 3.5c-2.83-.92-5.59.16-7.76 2.33-2.17 2.17-3.25 4.93-2.33 7.76l-.79 3.75 3.85-.76c2.08 1.21 4.44 1.13 6.38-.31 2.45-1.89 3.3-5.31 1.75-8.18C18.45 5.76 17.5 4.1 16.5 3.5z"/><path d="M15.25 14.48c-.47-.24-1.36-.66-1.57-.73-.21-.07-.37-.11-.53.24-.16.36-.63.73-.77.88-.14.15-.28.17-.55.06-.27-.11-1.12-.41-2.13-1.31-.79-.7-1.33-1.56-1.49-1.83-.16-.27-.02-.42.12-.56.12-.12.27-.31.41-.46.14-.15.19-.26.28-.43.09-.17.05-.32-.02-.46-.07-.14-.53-1.28-.72-1.75-.19-.46-.39-.4-.53-.41-.14-.01-.3-.01-.46-.01-.16 0-.43.06-.66.32-.23.26-.86.84-.86 2.05 0 1.21.88 2.38 1.01 2.55.13.17 1.7 2.74 4.12 3.84.58.25 1.03.4 1.38.51.58.18 1.11.15 1.53.09.47-.07 1.36-.56 1.55-1.1.19-.54.19-1.01.14-1.11-.05-.1-.18-.16-.39-.27z"/></svg>
          </span>
          <span class="share-button__label">WhatsApp</span>
        </a>
        <a class="share-button share-button--telegram" href="${telegramShareUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram">
          <span class="share-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L2 9.5l5.5 2.1L9 21l3.3-3 2.9 2.2 6.8-16.2-0.0 0z"/></svg>
          </span>
          <span class="share-button__label">Telegram</span>
        </a>
        <a class="share-button share-button--twitter" href="${twitterShareUrl}" target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter">
          <span class="share-button__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43 1s-4.3 1.96-6.18 2.5A4.48 4.48 0 0 0 16.11 0c-2.5 0-4.5 2.02-4.5 4.5 0 .35.04.7.11 1.03C7.7 5.37 4.07 3.45 1.64.87a4.5 4.5 0 0 0-.61 2.26 4.5 4.5 0 0 0 2.01 3.75A4.51 4.51 0 0 1 .96 6v.05c0 2.14 1.52 3.92 3.54 4.33a4.5 4.5 0 0 1-2.04.08 4.5 4.5 0 0 0 4.2 3.12A9.02 9.02 0 0 1 0 18.54a12.78 12.78 0 0 0 6.92 2.03c8.3 0 12.84-6.88 12.84-12.84 0-.2 0-.42-.01-.63A9.2 9.2 0 0 0 23 3z"/></svg>
          </span>
          <span class="share-button__label">Twitter</span>
        </a>
      </div>
    </div>
  </section>

  <section class="ott-section ott-seo-copy" itemscope itemtype="https://schema.org/Article">
    <div class="section-heading">
      <p class="eyebrow">OTT guide</p>
      <h2 itemprop="headline">Upcoming OTT movies Telugu April 2026</h2>
    </div>
    <div itemprop="articleBody">
      <p>
        This page is your weekly Telugu OTT schedule for new streaming releases, verified digital release dates, and platform rights. Use it to track the latest Telugu OTT premieres on Netflix, Aha, Prime Video, JioHotstar, Zee5, Sun NXT, and ETV Win.
      </p>
      <p>
        If you're searching for "Telugu OTT releases this week" or "upcoming OTT movies Telugu April 2026," this page helps you find the latest Telugu streaming launch dates and movie details in one place.
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
