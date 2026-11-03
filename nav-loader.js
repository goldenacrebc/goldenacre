/**
 * nav-loader.js
 * Builds the site navigation <details> panel from nav.json.
 * Add <script src="nav-loader.js" defer></script> to every public page header.
 * The script automatically marks the current page link with aria-current="page".
 */
(function () {
  function buildNav(links) {
    const panel = document.querySelector('.site-menu-panel');
    if (!panel) return;

    // Determine current page filename for aria-current
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    panel.innerHTML = links
      .map(function (link) {
        const isCurrent = link.href === currentPage || link.href === currentPage + '#' || currentPage === '' && link.href === 'index.html';
        const ariaCurrent = isCurrent ? ' aria-current="page"' : '';
        const label = link.label.replace(/&/g, '&amp;');
        return '<a href="' + link.href + '"' + ariaCurrent + '>' + label + '</a>';
      })
      .join('\n');
  }

  function init() {
    fetch('nav.json')
      .then(function (r) { return r.json(); })
      .then(buildNav)
      .catch(function (err) {
        console.warn('nav-loader: could not load nav.json', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
