// Load the existing admin dashboard logic, then wire up the Club News form.
// Keep the legacy dashboard script pinned to the revision that was current before
// this bootstrap was introduced so the dashboard's existing modules continue to work.
(function loadAdminScripts() {
    const scripts = [
        'https://raw.githubusercontent.com/goldenacrebc/goldenacre/8b46dc249886c5dac8bc47dd515a3b8f1d1488f5/admin.js',
        'club-news-admin.js'
    ];

    function loadNext(index) {
        if (index >= scripts.length) return;
        const script = document.createElement('script');
        script.src = scripts[index];
        script.onload = () => loadNext(index + 1);
        script.onerror = () => console.error(`Could not load admin script: ${scripts[index]}`);
        document.head.appendChild(script);
    }

    loadNext(0);
})();
