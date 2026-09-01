// Shows only the first N news items and injects a "Show more" button if needed.
// Works on containers with class "news-grid-2col" containing children with class "news-block".
(function () {
  const VISIBLE_COUNT = 6;

  function setupNewsToggle(container) {
    const items = Array.from(container.querySelectorAll('.news-block'));
    if (items.length <= VISIBLE_COUNT) return;

    // Ensure container has an id (for aria-controls)
    if (!container.id) container.id = 'news-grid-' + Math.random().toString(36).slice(2, 9);

    // Hide items after the first VISIBLE_COUNT
    const hiddenItems = items.slice(VISIBLE_COUNT);
    hiddenItems.forEach(i => i.classList.add('news-hidden'));

    // Create toggle button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'more-news-btn';
    btn.setAttribute('aria-controls', container.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = `Show more news (${items.length - VISIBLE_COUNT})`;

    let expanded = false;
    btn.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        hiddenItems.forEach(i => i.classList.remove('news-hidden'));
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = 'Show less';
      } else {
        hiddenItems.forEach(i => i.classList.add('news-hidden'));
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = `Show more news (${items.length - VISIBLE_COUNT})`;
        // scroll to container top for better UX if needed
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Insert button after the container
    container.parentNode.insertBefore(btn, container.nextSibling);
  }

  function init() {
    const containers = document.querySelectorAll('.news-grid-2col');
    containers.forEach(setupNewsToggle);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
