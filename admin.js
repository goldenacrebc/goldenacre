(function() {
    const supabaseUrl = 'https://xprnfaadcqlxeamoywjs.supabase.co';
    const supabaseKey = 'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea';
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

    async function checkAdminAuth() {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user || user.email !== 'admin@goldenacre.local') {
            await supabaseClient.auth.signOut();
            window.location.replace('admin_login.html');
        }
    }
    checkAdminAuth();

    window.switchTab = function(tabId) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        
        document.getElementById(tabId).classList.add('active');
        event.currentTarget.classList.add('active');
    };

    window.toggleCard = function(cardId) {
        const card = document.getElementById(cardId);
        const isOpen = card.classList.contains('open');
        
        document.querySelectorAll('#modules-tab .admin-card-custom').forEach(c => c.classList.remove('open'));
        
        if (!isOpen) {
            card.classList.add('open');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        if (cardId === 'archive-news-card') {
            loadArchiveList();
        } else if (cardId === 'calendar-manager-card') {
            switchCalSubTab('add');
        } else if (cardId === 'broadcast-card') {
            loadBroadcastManageList();
        } else if (cardId === 'sponsors-card') {
            setupImagePreview('sponsor-image', 'sponsor-upload-text', 'sponsor-preview-box', 'sponsor-preview-img');
            loadSponsorManageList();
        }
    };

    // Calendar Sub-Tab Switcher
    window.switchCalSubTab = function(subTab) {
        if (subTab === 'add') {
            document.getElementById('cal-section-add').style.display = 'block';
            document.getElementById('cal-section-manage').style.display = 'none';
            document.getElementById('cal-subtab-add').classList.add('active');
            document.getElementById('cal-subtab-manage').classList.remove('active');
        } else {
            document.getElementById('cal-section-add').style.display = 'none';
            document.getElementById('cal-section-manage').style.display = 'block';
            document.getElementById('cal-subtab-manage').classList.add('active');
            document.getElementById('cal-subtab-add').classList.remove('active');
            loadCalendarManageList();
        }
    };

    function setupImagePreview(inputId, textId, boxId, imgId) {
        const input = document.getElementById(inputId);
        const text = document.getElementById(textId);
        const box = document.getElementById(boxId);
        const img = document.getElementById(imgId);

        if (!input) return;

        input.addEventListener('change', () => {
            const file = input.files[0];
            if (file) {
                text.innerText = `Selected: ${file.name}`;
                const reader = new FileReader();
                reader.onload = (e) => {
                    img.src = e.target.result;
                    box.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                text.innerText = "Click or drag an image file here to attach";
                box.style.display = 'none';
            }
        });
    }

    setupImagePreview('internal-image', 'internal-upload-text', 'internal-preview-box', 'internal-preview-img');
    setupImagePreview('external-image', 'external-upload-text', 'external-preview-box', 'external-preview-img');

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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

    async function loadArchiveList() {
        const container = document.getElementById('archive-list-container');
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">Fetching news articles...</p>`;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const owner = "goldenacrebc";
            const repo = "goldenacre";
            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/news.json`;

            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch news.json");

            const fileData = await getRes.json();
            const newsItems = JSON.parse(decodeBase64Utf8(fileData.content));

            if (newsItems.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No news articles found.</p>`;
                return;
            }

            let html = '';
            newsItems.forEach((item, index) => {
                const tag = (item.tag || '').toLowerCase();
                const isArchived = tag === 'archive' || tag === 'archived';
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color); background: #fff; margin-bottom: 6px; border-radius: 6px;">
                        <div>
                            <strong>${item.title}</strong> 
                            <span style="font-size: 0.75rem; background: ${isArchived ? '#cbd5e1' : '#dcfce7'}; color: ${isArchived ? '#334155' : '#16a34a'}; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">
                                ${item.tag || 'latest'}
                            </span>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${item.category || 'general'}</div>
                        </div>
                        <label style="cursor: pointer; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                            <input type="checkbox" class="archive-checkbox" data-index="${index}" ${isArchived ? 'checked' : ''}> 
                            ${isArchived ? '<span style="color:#b91c1c;">Archived (Uncheck to Restore)</span>' : 'Archive'}
                        </label>
                    </div>
                `;
            });
            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `<p style="color: #dc2626; text-align: center; margin: 20px 0;">Error loading news: ${err.message}</p>`;
        }
    }

    const btnExecArchive = document.getElementById('btn-execute-archive');
    if (btnExecArchive) {
        btnExecArchive.addEventListener('click', async () => {
            const statusMsg = document.getElementById('status-archive');
            const btn = document.getElementById('btn-execute-archive');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Processing archive status changes...";
            btn.disabled = true;

            try {
                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/news.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch news.json for updating.");

                const fileData = await getRes.json();
                let newsItems = JSON.parse(decodeBase64Utf8(fileData.content));

                const checkboxes = document.querySelectorAll('.archive-checkbox');
                checkboxes.forEach(cb => {
                    const idx = parseInt(cb.getAttribute('data-index'));
                    if (newsItems[idx]) {
                        if (cb.checked) {
                            newsItems[idx].tag = 'archive';
                        } else {
                            newsItems[idx].tag = 'latest';
                        }
                    }
                });

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: updated archive statuses for news feed`,
                        content: encodeUtf8Base64(JSON.stringify(newsItems, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit archive/restore updates to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Successfully updated live news statuses! Refreshing list...";
                btn.disabled = false;
                loadArchiveList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    let cachedEventsList = [];

    async function loadCalendarManageList() {
        const container = document.getElementById('cal-manage-list-container');
        if (!container) return;
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">Fetching events...</p>`;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const owner = "goldenacrebc";
            const repo = "goldenacre";
            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/events.json`;

            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch events.json");

            const fileData = await getRes.json();
            cachedEventsList = JSON.parse(decodeBase64Utf8(fileData.content));

            if (!cachedEventsList || cachedEventsList.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align: center; margin: 20px 0;">No events found in calendar.</p>`;
                return;
            }

            let html = '';
            cachedEventsList.forEach((ev, index) => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color); background: #fff; margin-bottom: 6px; border-radius: 6px;">
                        <div>
                            <strong>${ev.date}</strong> - ${ev.title} <span style="font-size: 0.75rem; color: var(--text-muted);">(${ev.time || 'All Day'})</span>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${ev.location || 'Goldenacre'}</div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button type="button" onclick="startCalendarEdit(${index})" style="background-color: var(--brand-green); color: white; border: none; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Edit</button>
                            <label style="cursor: pointer; font-size: 0.8rem; font-weight: 600; color: #dc2626; display: flex; align-items: center; gap: 4px;">
                                <input type="checkbox" class="cal-delete-checkbox" data-index="${index}"> Delete
                            </label>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `<p style="color: #dc2626; text-align: center; margin: 20px 0;">Error loading events: ${err.message}</p>`;
        }
    }

    window.startCalendarEdit = function(index) {
        const ev = cachedEventsList[index];
        if (!ev) return;

        document.getElementById('cal-edit-index').value = index;
        document.getElementById('cal-event-title').value = ev.title || '';
        document.getElementById('cal-event-date').value = ev.date || '';
        document.getElementById('cal-event-time').value = ev.time || '';
        document.getElementById('cal-event-location').value = ev.location || '';
        document.getElementById('cal-event-desc').value = ev.description || '';

        document.getElementById('btn-publish-calendar').textContent = "Save Changes Live";
        document.getElementById('btn-cancel-cal-edit').style.display = 'block';

        switchCalSubTab('add');
    };

    window.cancelCalendarEdit = function() {
        document.getElementById('form-calendar-add').reset();
        document.getElementById('cal-edit-index').value = '';
        document.getElementById('btn-publish-calendar').textContent = "Publish Event to Calendar Live";
        document.getElementById('btn-cancel-cal-edit').style.display = 'none';
        document.getElementById('status-calendar-add').textContent = '';
    };

    const formCalAdd = document.getElementById('form-calendar-add');
    if (formCalAdd) {
        formCalAdd.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusMsg = document.getElementById('status-calendar-add');
            const btn = document.getElementById('btn-publish-calendar');
            const editIndexVal = document.getElementById('cal-edit-index').value;
            const isEditing = editIndexVal !== '';

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = isEditing ? "Saving event changes..." : "Publishing event to calendar...";
            btn.disabled = true;

            try {
                const title = document.getElementById('cal-event-title').value.trim();
                const date = document.getElementById('cal-event-date').value;
                const time = document.getElementById('cal-event-time').value.trim();
                const location = document.getElementById('cal-event-location').value.trim();
                const description = document.getElementById('cal-event-desc').value.trim();

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/events.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch events.json");

                const fileData = await getRes.json();
                let eventsList = JSON.parse(decodeBase64Utf8(fileData.content));

                const updatedEventObj = {
                    date: date,
                    title: title,
                    time: time,
                    location: location,
                    description: description,
                    notify: true
                };

                if (isEditing) {
                    const idx = parseInt(editIndexVal);
                    eventsList[idx] = updatedEventObj;
                } else {
                    eventsList.push(updatedEventObj);
                }

                eventsList.sort((a, b) => new Date(a.date) - new Date(b.date));

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: isEditing ? `Admin portal: updated calendar event ${title}` : `Admin portal: added calendar event ${title} on ${date}`,
                        content: encodeUtf8Base64(JSON.stringify(eventsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit event changes to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = isEditing ? "Successfully updated event live!" : "Successfully added event to calendar live!";
                
                cancelCalendarEdit();
                btn.disabled = false;

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    const btnExecCalDel = document.getElementById('btn-execute-cal-delete');
    if (btnExecCalDel) {
        btnExecCalDel.addEventListener('click', async () => {
            const statusMsg = document.getElementById('status-calendar-manage');
            const btn = document.getElementById('btn-execute-cal-delete');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Removing selected events...";
            btn.disabled = true;

            try {
                const checkboxes = document.querySelectorAll('.cal-delete-checkbox:checked');
                if (checkboxes.length === 0) {
                    throw new Error("Please select at least one event to delete.");
                }

                const deleteIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/events.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch events.json");

                const fileData = await getRes.json();
                let eventsList = JSON.parse(decodeBase64Utf8(fileData.content));

                eventsList = eventsList.filter((_, idx) => !deleteIndices.includes(idx));

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: removed ${deleteIndices.length} calendar event(s)`,
                        content: encodeUtf8Base64(JSON.stringify(eventsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit deletion to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Successfully deleted selected events! Refreshing list...";
                btn.disabled = false;
                loadCalendarManageList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    // Broadcast Push Alert Form Handler
    const broadcastForm = document.getElementById('form-broadcast');
    if (broadcastForm) {
        broadcastForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusMsg = document.getElementById('status-broadcast');
            const btn = document.getElementById('btn-publish-broadcast');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Broadcasting alert live...";
            btn.disabled = true;

            try {
                const title = document.getElementById('broadcast-title').value.trim();
                const message = document.getElementById('broadcast-message').value.trim();

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/notifications.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch notifications.json");

                const fileData = await getRes.json();
                let alertsList = JSON.parse(decodeBase64Utf8(fileData.content));

                alertsList.unshift({
                    id: Date.now(),
                    date: new Date().toISOString().split('T')[0],
                    title: title,
                    message: message,
                    active: true
                });

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: published urgent broadcast alert - ${title}`,
                        content: encodeUtf8Base64(JSON.stringify(alertsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit broadcast to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Alert successfully broadcasted live!";
                broadcastForm.reset();
                btn.disabled = false;
                loadBroadcastManageList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    async function loadBroadcastManageList() {
        const container = document.getElementById('broadcast-manage-list');
        if (!container) return;
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-size: 0.85rem; margin: 10px 0;">Fetching alerts...</p>`;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const owner = "goldenacrebc";
            const repo = "goldenacre";
            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/notifications.json`;

            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch notifications.json");

            const fileData = await getRes.json();
            let alertsList = JSON.parse(decodeBase64Utf8(fileData.content));

            if (!alertsList || alertsList.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-size: 0.85rem; margin: 10px 0;">No broadcasts found.</p>`;
                return;
            }

            let html = '';
            alertsList.forEach((alert, index) => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color); background: #fff; margin-bottom: 6px; border-radius: 6px; font-size: 0.85rem;">
                        <div>
                            <strong>${alert.title}</strong> 
                            <span style="font-size: 0.7rem; background: ${alert.active ? '#fee2e2' : '#f1f5f9'}; color: ${alert.active ? '#991b1b' : '#64748b'}; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: bold;">
                                ${alert.active ? 'ACTIVE LIVE' : 'Inactive'}
                            </span>
                            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${alert.message}</div>
                        </div>
                        <label style="cursor: pointer; font-weight: 600; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; background: #f8fafc; padding: 6px 10px; border: 1px solid #cbd5e1; border-radius: 6px;">
                            <input type="checkbox" class="broadcast-toggle-checkbox" data-index="${index}" ${alert.active ? 'checked' : ''}>
                            <span>${alert.active ? 'Active' : 'Enable'}</span>
                        </label>
                    </div>
                `;
            });
            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `<p style="color: #dc2626; text-align: center; font-size: 0.85rem; margin: 10px 0;">Error: ${err.message}</p>`;
        }
    }

    const executeBroadcastBtn = document.getElementById('btn-execute-broadcast-changes');
    if (executeBroadcastBtn) {
        executeBroadcastBtn.addEventListener('click', async () => {
            const statusMsg = document.getElementById('status-broadcast-manage');
            const btn = document.getElementById('btn-execute-broadcast-changes');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Updating broadcast statuses live...";
            btn.disabled = true;

            try {
                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/notifications.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch notifications.json");

                const fileData = await getRes.json();
                let alertsList = JSON.parse(decodeBase64Utf8(fileData.content));

                const checkboxes = document.querySelectorAll('.broadcast-toggle-checkbox');
                checkboxes.forEach(cb => {
                    const idx = parseInt(cb.getAttribute('data-index'));
                    if (alertsList[idx] !== undefined) {
                        alertsList[idx].active = cb.checked;
                        if (cb.checked) {
                            alertsList[idx].date = new Date().toISOString().split('T')[0];
                        }
                    }
                });

                alertsList.sort((a, b) => (b.active === a.active) ? 0 : b.active ? 1 : -1);

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: updated broadcast alert toggle statuses`,
                        content: encodeUtf8Base64(JSON.stringify(alertsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit changes to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Successfully updated live alert statuses!";
                btn.disabled = false;
                loadBroadcastManageList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    // --- SPONSORS MANAGER FUNCTIONS ---
    async function loadSponsorManageList() {
        const container = document.getElementById('sponsor-manage-list');
        if (!container) return;
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-size: 0.85rem; margin: 10px 0;">Fetching sponsors...</p>`;

        try {
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const owner = "goldenacrebc";
            const repo = "goldenacre";
            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sponsors.json`;

            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${tokenData.value}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch sponsors.json");

            const fileData = await getRes.json();
            let sponsorsList = JSON.parse(decodeBase64Utf8(fileData.content));

            if (!sponsorsList || sponsorsList.length === 0) {
                container.innerHTML = `<p style="color: var(--text-muted); text-align: center; font-size: 0.85rem; margin: 10px 0;">No commercial sponsors found.</p>`;
                return;
            }

            let html = '';
            sponsorsList.forEach((sponsor, index) => {
                html += `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid var(--border-color); background: #fff; margin-bottom: 6px; border-radius: 6px; font-size: 0.85rem;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="${sponsor.image}" alt="" style="height: 30px; width: auto; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 4px; padding: 2px;">
                            <div>
                                <strong>${sponsor.name}</strong>
                                <div style="font-size: 0.75rem; color: var(--text-muted);"><a href="${sponsor.url}" target="_blank">${sponsor.url}</a></div>
                            </div>
                        </div>
                        <label style="cursor: pointer; font-weight: 600; font-size: 0.8rem; color: #dc2626; display: flex; align-items: center; gap: 4px;">
                            <input type="checkbox" class="sponsor-delete-checkbox" data-index="${index}"> Remove
                        </label>
                    </div>
                `;
            });
            container.innerHTML = html;

        } catch (err) {
            container.innerHTML = `<p style="color: #dc2626; text-align: center; font-size: 0.85rem; margin: 10px 0;">Error: ${err.message}</p>`;
        }
    }

    const sponsorForm = document.getElementById('form-sponsor');
    if (sponsorForm) {
        sponsorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusMsg = document.getElementById('status-sponsor');
            const btn = document.getElementById('btn-publish-sponsor');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Uploading sponsor logo and publishing live...";
            btn.disabled = true;

            try {
                const name = document.getElementById('sponsor-name').value.trim();
                const url = document.getElementById('sponsor-url').value.trim();
                const imageFile = document.getElementById('sponsor-image').files[0];

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const githubToken = tokenData.value;
                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";

                const fileName = `sponsor-${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
                const photoPath = `photos/${fileName}`;
                const photoBase64 = await fileToBase64(imageFile);

                const photoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${photoPath}`, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${githubToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin upload: added sponsor logo ${fileName}`,
                        content: photoBase64,
                        branch: branch
                    })
                });

                if (!photoRes.ok) throw new Error("Failed to upload sponsor logo to GitHub.");

                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sponsors.json`;
                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${githubToken}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch sponsors.json");

                const fileData = await getRes.json();
                let sponsorsList = JSON.parse(decodeBase64Utf8(fileData.content));

                sponsorsList.push({
                    name: name,
                    url: url,
                    image: photoPath
                });

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${githubToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: added sponsor ${name}`,
                        content: encodeUtf8Base64(JSON.stringify(sponsorsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit new sponsor to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Sponsor successfully published live!";
                sponsorForm.reset();
                document.getElementById('sponsor-preview-box').style.display = 'none';
                document.getElementById('sponsor-upload-text').innerText = "Click or drag logo image file here";
                btn.disabled = false;
                loadSponsorManageList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }

    const executeSponsorDeleteBtn = document.getElementById('btn-execute-sponsor-delete');
    if (executeSponsorDeleteBtn) {
        executeSponsorDeleteBtn.addEventListener('click', async () => {
            const statusMsg = document.getElementById('status-sponsor-manage');
            const btn = document.getElementById('btn-execute-sponsor-delete');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Removing selected sponsors...";
            btn.disabled = true;

            try {
                const checkboxes = document.querySelectorAll('.sponsor-delete-checkbox:checked');
                if (checkboxes.length === 0) {
                    throw new Error("Please select at least one sponsor to remove.");
                }

                const deleteIndices = Array.from(checkboxes).map(cb => parseInt(cb.getAttribute('data-index')));

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/sponsors.json`;

                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error("Failed to fetch sponsors.json");

                const fileData = await getRes.json();
                let sponsorsList = JSON.parse(decodeBase64Utf8(fileData.content));

                sponsorsList = sponsorsList.filter((_, idx) => !deleteIndices.includes(idx));

                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${tokenData.value}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Admin portal: removed ${deleteIndices.length} sponsor(s)`,
                        content: encodeUtf8Base64(JSON.stringify(sponsorsList, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error("Failed to commit sponsor removal to GitHub.");

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Successfully removed selected sponsors! Refreshing list...";
                btn.disabled = false;
                loadSponsorManageList();

            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    }
    // --- END OF SPONSORS MANAGER ---

    document.querySelectorAll('.btn-publish').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            const form = btn.closest('form');
            const statusMsg = form.querySelector('.status-msg-custom');

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = "Authenticating with secure vault...";
            btn.disabled = true;

            try {
                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings')
                    .select('value')
                    .eq('key', 'github_token')
                    .single();

                if (tokenError || !tokenData) {
                    throw new Error("Could not retrieve GitHub token from secure storage.");
                }

                const githubToken = tokenData.value;
                const owner = "goldenacrebc";
                const repo = "goldenacre";
                const branch = "main";

                let targetFile = "";
                if (type === 'internal-news' || type === 'external-news') targetFile = 'news.json';
                else if (type === 'events') targetFile = 'events.json';
                else if (type === 'teams') targetFile = 'team-sheets.json';

                let imageUrl = "logo.jpeg";
                if (type === 'internal-news' || type === 'external-news') {
                    const fileInputId = type === 'internal-news' ? 'internal-image' : 'external-image';
                    const imageFile = document.getElementById(fileInputId).files[0];
                    if (imageFile) {
                        statusMsg.innerText = "Uploading photo to GitHub repository...";
                        const fileName = `${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
                        const photoPath = `photos/${fileName}`;
                        const photoBase64 = await fileToBase64(imageFile);

                        const photoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${photoPath}`, {
                            method: "PUT",
                            headers: {
                                "Authorization": `token ${githubToken}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({
                                message: `Admin upload: added photo ${fileName}`,
                                content: photoBase64,
                                branch: branch
                            })
                        });

                        if (!photoRes.ok) throw new Error("Failed to upload photo to GitHub repository.");
                        imageUrl = photoPath;
                    }
                }

                statusMsg.innerText = "Fetching current file data...";
                const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetFile}`;
                const getRes = await fetch(fileUrl, {
                    headers: { "Authorization": `token ${githubToken}` }
                });
                
                if (!getRes.ok) throw new Error(`Failed to fetch file (${getRes.status})`);
                
                const fileData = await getRes.json();
                let existingContent = JSON.parse(decodeBase64Utf8(fileData.content));
                let commitMessage = "";

                if (type === 'teams') {
                    const teamKey = document.getElementById('team-target').value;
                    const opponent = document.getElementById('team-opponent').value.trim();
                    const venue = document.getElementById('team-venue').value;

                    const rinks = [0, 1, 2, 3].map(rinkIdx => {
                        const lead = document.querySelector(`.rink-input[data-rink="${rinkIdx}"][data-pos="lead"]`).value.trim();
                        const second = document.querySelector(`.rink-input[data-rink="${rinkIdx}"][data-pos="second"]`).value.trim();
                        const third = document.querySelector(`.rink-input[data-rink="${rinkIdx}"][data-pos="third"]`).value.trim();
                        const skip = document.querySelector(`.rink-input[data-rink="${rinkIdx}"][data-pos="skip"]`).value.trim();
                        return { lead, second, third, skip };
                    });

                    existingContent[teamKey] = {
                        opponent: opponent,
                        venue: venue,
                        rinks: rinks
                    };

                    commitMessage = `Admin portal update: updated ${teamKey} team sheet`;
                } else if (type === 'internal-news' || type === 'external-news') {
                    const isInternal = type === 'internal-news';
                    const title = document.getElementById(isInternal ? 'internal-title' : 'external-title').value.trim();
                    const content = document.getElementById(isInternal ? 'internal-content' : 'external-content').value.trim();
                    const category = isInternal ? 'internal' : 'external';
                    const modalSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

                    existingContent.unshift({
                        title: title,
                        description: content,
                        category: category,
                        tag: "latest",
                        image: imageUrl,
                        modal: modalSlug
                    });
                    commitMessage = `Admin portal update: added ${category} news ${title}`;
                } else if (type === 'events') {
                    const title = document.getElementById('event-title').value.trim();
                    const time = document.getElementById('event-time').value.trim();
                    const location = document.getElementById('event-location').value.trim();
                    const content = document.getElementById('event-desc').value.trim();

                    existingContent.unshift({
                        date: new Date().toISOString().split('T')[0],
                        title: title,
                        time: time,
                        location: location,
                        description: content,
                        notify: true
                    });
                    commitMessage = `Admin portal update: added social event ${title}`;
                }

                statusMsg.innerText = "Committing update to GitHub...";
                const commitRes = await fetch(fileUrl, {
                    method: "PUT",
                    headers: {
                        "Authorization": `token ${githubToken}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: commitMessage,
                        content: encodeUtf8Base64(JSON.stringify(existingContent, null, 2)),
                        sha: fileData.sha,
                        branch: branch
                    })
                });

                if (!commitRes.ok) throw new Error(`Failed to commit changes (${commitRes.status})`);

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = "Successfully published live! Please allow 1-2 mins for site feeds to refresh.";
                form.reset();
                if (type === 'internal-news') {
                    document.getElementById('internal-preview-box').style.display = 'none';
                    document.getElementById('internal-upload-text').innerText = "Click or drag an image file here to attach";
                } else if (type === 'external-news') {
                    document.getElementById('external-preview-box').style.display = 'none';
                    document.getElementById('external-upload-text').innerText = "Click or drag an image file here to attach";
                }
                btn.disabled = false;

            } catch (err) {
                console.error("Publishing error:", err);
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = "Error: " + err.message;
                btn.disabled = false;
            }
        });
    });

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await supabaseClient.auth.signOut();
            window.location.replace('index.html');
        });
    }
})();