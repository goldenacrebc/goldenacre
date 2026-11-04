// Load the dashboard's legacy module handlers from the pinned working revision,
// then initialize the Club News publisher. Keep a second CDN/source fallback so
// a transient host failure cannot leave the entire admin dashboard without handlers.
(function loadAdminScripts() {
    const sources = [
        [
            'https://cdn.jsdelivr.net/gh/goldenacrebc/goldenacre@8b46dc249886c5dac8bc47dd515a3b8f1d1488f5/admin.js',
            'https://raw.githubusercontent.com/goldenacrebc/goldenacre/8b46dc249886c5dac8bc47dd515a3b8f1d1488f5/admin.js'
        ],
        ['club-news-admin.js']
    ];

    function loadSourceGroup(groupIndex, sourceIndex) {
        if (groupIndex >= sources.length) return;
        const group = sources[groupIndex];
        if (sourceIndex >= group.length) {
            console.error('Could not load admin script:', group.join(' or '));
            return;
        }

        const script = document.createElement('script');
        script.src = group[sourceIndex];
        script.onload = () => loadSourceGroup(groupIndex + 1, 0);
        script.onerror = () => loadSourceGroup(groupIndex, sourceIndex + 1);
        document.head.appendChild(script);
    }

    loadSourceGroup(0, 0);
})();
