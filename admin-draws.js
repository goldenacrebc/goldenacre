(function() {
    const supabaseClient = window.supabase.createClient(
        'https://xprnfaadcqlxeamoywjs.supabase.co',
        'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea'
    );

    function encodeUtf8Base64(str) {
        const bytes = new TextEncoder().encode(str);
        const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
        return btoa(binString);
    }

    const drawFiles = {
        championship: 'draws/championship.json',
        '2bowl': 'draws/2bowl.json',
        handicap: 'draws/handicap.json',
        tomwilson: 'draws/tomwilson.json',
        pairs: 'draws/pairs.json',
        triples: 'draws/triples.json',
        rinks: 'draws/rinks.json'
    };

    let currentDrawData = null;
    let currentDrawFile = null;

    function getFlatRounds(drawData) {
        const rounds = [];
        (drawData.rows || []).forEach((row, rowIdx) => {
            (row.rounds || []).forEach((round, roundIdx) => {
                rounds.push({ rowIdx, roundIdx, ri: rowIdx, rj: roundIdx, name: round.name, round });
            });
        });
        return rounds;
    }

    window.loadDrawsRounds = async function() {
        const comp = document.getElementById('draws-competition-select').value;
        const roundSelect = document.getElementById('draws-round-select');
        const editor = document.getElementById('draws-match-editor');
        const statusMsg = document.getElementById('status-draws');

        roundSelect.innerHTML = '<option value="">Loading...</option>';
        editor.innerHTML = '';
        statusMsg.innerText = '';
        currentDrawData = null;
        currentDrawFile = drawFiles[comp];

        try {
            const res = await fetch(currentDrawFile + '?t=' + Date.now());
            if (!res.ok) throw new Error('Could not load draw file.');
            currentDrawData = await res.json();

            const flatRounds = getFlatRounds(currentDrawData);
            roundSelect.innerHTML = flatRounds.map((round, index) =>
                `<option value="${index}">${round.name}</option>`
            ).join('');
            window.loadDrawsMatches();
        } catch (err) {
            roundSelect.innerHTML = '<option value="">Error loading</option>';
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = 'Error: ' + err.message;
        }
    };

    window.loadDrawsMatches = function() {
        const editor = document.getElementById('draws-match-editor');
        const roundIdx = parseInt(document.getElementById('draws-round-select').value);
        if (!currentDrawData || isNaN(roundIdx)) {
            editor.innerHTML = '';
            return;
        }

        const flatRounds = getFlatRounds(currentDrawData);
        const { round } = flatRounds[roundIdx];
        const allMatches = [...(round.matches || []), ...(round.extra || [])];
        const isExtra = (index) => index >= (round.matches || []).length;

        function buildMatchRow(match, index, isNew = false) {
            const tag = isExtra(index) && !isNew ? ' <span style="font-size:0.7rem;color:#64748b;">(extra)</span>' : '';
            const newTag = isNew ? ' <span style="font-size:0.7rem;color:#16a34a;font-weight:700;">NEW</span>' : '';
            return `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;" data-match-index="${index}" ${isNew ? 'data-new="true"' : ''}>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="font-size:0.78rem;font-weight:700;color:#64748b;">Match ${index + 1}${tag}${newTag}</span>
                <button type="button" onclick="removeMatch(this);"
                    style="background:#fee2e2;border:none;color:#dc2626;font-size:0.8rem;cursor:pointer;font-weight:700;padding:2px 8px;border-radius:4px;">− Remove</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr auto auto auto 1fr;gap:8px;align-items:center;">
                <input type="text" class="dm-p1" placeholder="Player 1" value="${match && match.p1 !== 'TBD' ? match.p1 : ''}"
                    style="padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;">
                <input type="text" class="dm-s1" placeholder="Score" value="${match ? (match.s1 || '') : ''}" maxlength="4"
                    style="width:52px;padding:6px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;text-align:center;">
                <span style="font-size:0.75rem;color:#94a3b8;font-weight:600;">v</span>
                <input type="text" class="dm-s2" placeholder="Score" value="${match ? (match.s2 || '') : ''}" maxlength="4"
                    style="width:52px;padding:6px 6px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;text-align:center;">
                <input type="text" class="dm-p2" placeholder="Player 2" value="${match && match.p2 !== 'TBD' ? match.p2 : ''}"
                    style="padding:6px 8px;border:1px solid #cbd5e1;border-radius:4px;font-size:0.85rem;">
            </div>
            <div style="display:flex;gap:16px;margin-top:8px;align-items:center;">
                <span style="font-size:0.78rem;font-weight:600;color:#475569;">Winner:</span>
                <label style="font-size:0.82rem;display:flex;align-items:center;gap:5px;cursor:pointer;">
                    <input type="radio" class="dm-winner" name="winner-${index}" value="1" ${match && match.winner === 1 ? 'checked' : ''}> Player 1
                </label>
                <label style="font-size:0.82rem;display:flex;align-items:center;gap:5px;cursor:pointer;">
                    <input type="radio" class="dm-winner" name="winner-${index}" value="2" ${match && match.winner === 2 ? 'checked' : ''}> Player 2
                </label>
                <label style="font-size:0.82rem;display:flex;align-items:center;gap:5px;cursor:pointer;">
                    <input type="radio" class="dm-winner" name="winner-${index}" value="null" ${!match || !match.winner ? 'checked' : ''}> Not played
                </label>
            </div>
        </div>`;
        }

        let html = '<div id="dm-match-list" style="display:flex;flex-direction:column;gap:10px;">';
        if (allMatches.length === 0) {
            html += '<p style="color:var(--text-muted);font-size:0.85rem;margin:0;">No matches yet — add one below.</p>';
        } else {
            allMatches.forEach((match, index) => { html += buildMatchRow(match, index); });
        }
        html += `</div>
    <button type="button" id="btn-add-match"
        style="margin-top:10px;width:100%;padding:8px;background:transparent;border:2px dashed #0369a1;border-radius:6px;color:#0369a1;font-size:0.82rem;font-weight:700;cursor:pointer;">
        + Add Match
    </button>`;
        editor.innerHTML = html;

        document.getElementById('btn-add-match').addEventListener('click', () => {
            const list = document.getElementById('dm-match-list');
            const currentCount = list.querySelectorAll('[data-match-index]').length;
            const div = document.createElement('div');
            div.innerHTML = buildMatchRow(null, currentCount, true);
            list.appendChild(div.firstElementChild);
            window.renumberMatches();
        });
    };

    window.removeMatch = function(btn) {
        btn.closest('[data-match-index]').remove();
        window.renumberMatches();
    };

    window.addDrawRound = async function() {
        const statusMsg = document.getElementById('status-draws');
        const name = document.getElementById('new-round-name').value.trim();
        const deadline = document.getElementById('new-round-deadline').value.trim();

        if (!currentDrawData) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = 'Please select a competition first.';
            return;
        }
        if (!name) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = 'Please enter a round name.';
            return;
        }

        const newRound = { name, deadline: deadline || 'To be confirmed', matches: [], extra: [] };
        if (!currentDrawData.rows || currentDrawData.rows.length === 0) {
            currentDrawData.rows = [{ tier: 'tier-1', rounds: [newRound] }];
        } else {
            currentDrawData.rows[currentDrawData.rows.length - 1].rounds.push(newRound);
        }

        await saveCurrentDrawData(`Added round "${name}" to ${currentDrawData.label}`);
        document.getElementById('new-round-name').value = '';
        document.getElementById('new-round-deadline').value = '';

        const roundSelect = document.getElementById('draws-round-select');
        const flatRounds = getFlatRounds(currentDrawData);
        roundSelect.innerHTML = flatRounds.map((round, index) =>
            `<option value="${index}">${round.name}</option>`
        ).join('');
        roundSelect.value = String(flatRounds.length - 1);
        window.loadDrawsMatches();
    };

    window.removeDrawRound = async function() {
        const statusMsg = document.getElementById('status-draws');
        const roundIdx = parseInt(document.getElementById('draws-round-select').value);
        if (!currentDrawData || isNaN(roundIdx)) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = 'Please select a round to remove.';
            return;
        }

        const flatRounds = getFlatRounds(currentDrawData);
        const { ri, rj, name } = flatRounds[roundIdx];
        if (!confirm(`Remove round "${name}"? This will delete all its matches. This cannot be undone.`)) return;

        currentDrawData.rows[ri].rounds.splice(rj, 1);
        currentDrawData.rows = currentDrawData.rows.filter(row => row.rounds && row.rounds.length > 0);
        await saveCurrentDrawData(`Removed round "${name}" from ${currentDrawData.label}`);

        const roundSelect = document.getElementById('draws-round-select');
        const remainingRounds = getFlatRounds(currentDrawData);
        if (remainingRounds.length === 0) {
            roundSelect.innerHTML = '<option value="">— no rounds —</option>';
            document.getElementById('draws-match-editor').innerHTML = '';
        } else {
            roundSelect.innerHTML = remainingRounds.map((round, index) =>
                `<option value="${index}">${round.name}</option>`
            ).join('');
            roundSelect.value = '0';
            window.loadDrawsMatches();
        }
    };

    async function saveCurrentDrawData(commitMsg) {
        const statusMsg = document.getElementById('status-draws');
        statusMsg.style.backgroundColor = '#e0f2fe';
        statusMsg.style.color = '#0369a1';
        statusMsg.innerText = 'Saving…';

        const { data: tokenData, error: tokenError } = await supabaseClient
            .from('settings').select('value').eq('key', 'github_token').single();
        if (tokenError || !tokenData) throw new Error('Could not retrieve GitHub token.');

        const fileUrl = `https://api.github.com/repos/goldenacrebc/goldenacre/contents/${currentDrawFile}`;
        const getRes = await fetch(fileUrl, { headers: { 'Authorization': `token ${tokenData.value}` } });
        if (!getRes.ok) throw new Error(`Failed to fetch draw file (${getRes.status}).`);
        const fileData = await getRes.json();
        const putRes = await fetch(fileUrl, {
            method: 'PUT',
            headers: { 'Authorization': `token ${tokenData.value}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `Admin portal: ${commitMsg}`,
                content: encodeUtf8Base64(JSON.stringify(currentDrawData, null, 2)),
                sha: fileData.sha,
                branch: 'main'
            })
        });
        if (!putRes.ok) throw new Error('Failed to save to GitHub.');

        statusMsg.style.backgroundColor = '#dcfce7';
        statusMsg.style.color = '#16a34a';
        statusMsg.innerText = `✓ ${commitMsg} — saved live!`;
    }

    window.renumberMatches = function() {
        const list = document.getElementById('dm-match-list');
        if (!list) return;
        list.querySelectorAll('[data-match-index]').forEach((div, index) => {
            div.setAttribute('data-match-index', index);
            const label = div.querySelector('span:first-child');
            if (label) {
                label.innerHTML = `Match ${index + 1}${div.dataset.new ? ' <span style="font-size:0.7rem;color:#16a34a;font-weight:700;">NEW</span>' : ''}`;
            }
            div.querySelectorAll('input[name^="winner-"]').forEach(radio => {
                radio.name = `winner-${index}`;
            });
        });
    };

    const saveButton = document.getElementById('btn-save-draws');
    if (saveButton) {
        saveButton.addEventListener('click', async () => {
            const statusMsg = document.getElementById('status-draws');
            const btn = document.getElementById('btn-save-draws');
            if (!currentDrawData || !currentDrawFile) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = 'Please select a competition and round first.';
                return;
            }

            statusMsg.style.backgroundColor = '#e0f2fe';
            statusMsg.style.color = '#0369a1';
            statusMsg.innerText = 'Saving draw changes live...';
            btn.disabled = true;

            try {
                const roundIdx = parseInt(document.getElementById('draws-round-select').value);
                const flatRounds = getFlatRounds(currentDrawData);
                const { rowIdx, roundIdx: selectedRoundIdx, round } = flatRounds[roundIdx];
                const existingMatches = [...(round.matches || []), ...(round.extra || [])];
                const matchDivs = document.querySelectorAll('#draws-match-editor [data-match-index]');
                const allMatches = [];

                matchDivs.forEach(div => {
                    const p1Val = div.querySelector('.dm-p1').value.trim();
                    const p2Val = div.querySelector('.dm-p2').value.trim();
                    const s1Val = div.querySelector('.dm-s1').value.trim();
                    const s2Val = div.querySelector('.dm-s2').value.trim();
                    const winnerRadio = div.querySelector('.dm-winner:checked');
                    const winnerVal = winnerRadio ? winnerRadio.value : 'null';
                    const index = parseInt(div.getAttribute('data-match-index'));
                    const existing = existingMatches[index] || {};

                    allMatches.push({
                        p1: p1Val || 'TBD',
                        p2: p2Val || 'TBD',
                        s1: s1Val,
                        s2: s2Val,
                        winner: winnerVal === 'null' ? null : parseInt(winnerVal),
                        ...(existing.advanceTo ? { advanceTo: existing.advanceTo } : {}),
                        ...(existing.advanceFrom1 ? { advanceFrom1: existing.advanceFrom1 } : {}),
                        ...(existing.advanceFrom2 ? { advanceFrom2: existing.advanceFrom2 } : {})
                    });
                });

                currentDrawData.rows[rowIdx].rounds[selectedRoundIdx].matches = allMatches;
                currentDrawData.rows[rowIdx].rounds[selectedRoundIdx].extra = [];

                const { data: tokenData, error: tokenError } = await supabaseClient
                    .from('settings').select('value').eq('key', 'github_token').single();
                if (tokenError || !tokenData) throw new Error('Could not retrieve GitHub token.');

                const fileUrl = `https://api.github.com/repos/goldenacrebc/goldenacre/contents/${currentDrawFile}`;
                const getRes = await fetch(fileUrl, {
                    headers: { 'Authorization': `token ${tokenData.value}` }
                });
                if (!getRes.ok) throw new Error('Failed to fetch draw file from GitHub.');
                const fileData = await getRes.json();
                const commitRes = await fetch(fileUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${tokenData.value}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Admin portal: updated ${currentDrawData.label} — ${flatRounds[roundIdx].name}`,
                        content: encodeUtf8Base64(JSON.stringify(currentDrawData, null, 2)),
                        sha: fileData.sha,
                        branch: 'main'
                    })
                });
                if (!commitRes.ok) throw new Error('Failed to save draw changes to GitHub.');

                statusMsg.style.backgroundColor = '#dcfce7';
                statusMsg.style.color = '#16a34a';
                statusMsg.innerText = `${currentDrawData.label} — ${flatRounds[roundIdx].name} saved live successfully!`;
            } catch (err) {
                statusMsg.style.backgroundColor = '#fee2e2';
                statusMsg.style.color = '#dc2626';
                statusMsg.innerText = 'Error: ' + err.message;
            } finally {
                btn.disabled = false;
            }
        });
    }

    const originalToggleCard = window.toggleCard;
    window.toggleCard = function(cardId) {
        originalToggleCard(cardId);
        if (cardId === 'draws-manager-card') window.loadDrawsRounds();
    };
})();
