(function() {
    const supabaseClient = window.adminSupabaseClient;
    let loadedNewsItems = [];

    function decodeBase64Utf8(base64Str) {
        const binString = atob(base64Str.replace(/\s/g, ''));
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        return new TextDecoder().decode(bytes);
    }

    function encodeUtf8Base64(str) {
        const bytes = new TextEncoder().encode(str);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
        return btoa(binString);
    }

    function isArchived(item) {
        const tag = (item.tag || '').toLowerCase();
        return tag === 'archive' || tag === 'archived';
    }

    async function loadArchiveList() {
        const container = document.getElementById('archive-list-container');
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">Fetching news articles...</p>`;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const fileUrl = 'https://api.github.com/repos/goldenacrebc/goldenacre/contents/news.json';
            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch news.json");

            const fileData = await getRes.json();
            loadedNewsItems = JSON.parse(decodeBase64Utf8(fileData.content));

            if (loadedNewsItems.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No news articles found.</p>`;
                return;
            }

            container.innerHTML = loadedNewsItems.map((item, index) => {
                const archived = isArchived(item);
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px; border-bottom: 1px solid var(--border-color); background: #fff; margin-bottom: 6px; border-radius: 6px;">
                        <div>
                            <strong>${item.title}</strong>
                            <span style="font-size: 0.75rem; background: ${archived ? '#cbd5e1' : '#dcfce7'}; color: ${archived ? '#334155' : '#16a34a'}; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">
                                ${item.tag || 'latest'}
                            </span>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${item.category || 'general'}</div>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                            <label style="cursor: pointer; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" class="archive-checkbox" data-index="${index}" ${archived ? 'checked' : ''}>
                                ${archived ? '<span style="color:#b91c1c;">Archived (uncheck to restore)</span>' : 'Archive'}
                            </label>
                            <label style="cursor: pointer; color: #b91c1c; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                                <input type="checkbox" class="delete-news-checkbox" data-index="${index}">
                                Delete permanently
                            </label>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (err) {
            container.innerHTML = `<p style="color: #dc2626; text-align: center; margin: 20px 0;">Error loading news: ${err.message}</p>`;
        }
    }

    window.loadArchiveList = loadArchiveList;

    const btn = document.getElementById('btn-execute-archive');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const statusMsg = document.getElementById('status-archive');
        const deleteCheckboxes = Array.from(document.querySelectorAll('.delete-news-checkbox:checked'));
        const deleteIndexes = new Set(deleteCheckboxes.map((checkbox) => Number(checkbox.dataset.index)));

        if (deleteIndexes.size > 0 && !window.confirm(
            `Permanently delete ${deleteIndexes.size} selected news article${deleteIndexes.size === 1 ? '' : 's'}? This cannot be undone.`
        )) {
            return;
        }

        statusMsg.style.backgroundColor = '#e0f2fe';
        statusMsg.style.color = '#0369a1';
        statusMsg.innerText = "Processing archive changes...";
        btn.disabled = true;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const fileUrl = 'https://api.github.com/repos/goldenacrebc/goldenacre/contents/news.json';
            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch news.json for updating.");

            const fileData = await getRes.json();
            let newsItems = JSON.parse(decodeBase64Utf8(fileData.content));
            const archiveCheckboxes = Array.from(document.querySelectorAll('.archive-checkbox'));
            const changedIndexes = new Set(deleteIndexes);

            archiveCheckboxes.forEach((checkbox) => {
                const index = Number(checkbox.dataset.index);
                if (checkbox.checked !== isArchived(loadedNewsItems[index])) {
                    changedIndexes.add(index);
                }
            });

            changedIndexes.forEach((index) => {
                if (!loadedNewsItems[index] ||
                    JSON.stringify(newsItems[index]) !== JSON.stringify(loadedNewsItems[index])) {
                    throw new Error("The news feed changed while the archivist was open. Reload it and try again.");
                }
            });

            archiveCheckboxes.forEach((checkbox) => {
                const index = Number(checkbox.dataset.index);
                if (newsItems[index]) {
                    newsItems[index].tag = checkbox.checked ? 'archive' : 'latest';
                }
            });

            newsItems = newsItems.filter((_, index) => !deleteIndexes.has(index));

            const commitRes = await fetch(fileUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${tokenData.value}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: deleteIndexes.size
                        ? `Admin portal: deleted ${deleteIndexes.size} news article(s) and updated archive statuses`
                        : "Admin portal: updated archive statuses for news feed",
                    content: encodeUtf8Base64(JSON.stringify(newsItems, null, 2)),
                    sha: fileData.sha,
                    branch: "main"
                })
            });
            if (!commitRes.ok) throw new Error("Failed to save news archive changes to GitHub.");

            statusMsg.style.backgroundColor = '#dcfce7';
            statusMsg.style.color = '#16a34a';
            statusMsg.innerText = deleteIndexes.size
                ? `Successfully deleted ${deleteIndexes.size} article${deleteIndexes.size === 1 ? '' : 's'} and updated archive statuses. Refreshing list...`
                : "Successfully updated live news statuses! Refreshing list...";
            await loadArchiveList();
        } catch (err) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = "Error: " + err.message;
        } finally {
            btn.disabled = false;
        }
    });
})();
