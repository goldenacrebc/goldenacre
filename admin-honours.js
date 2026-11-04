(function() {
    const honoursForm = document.getElementById('form-honours');
    if (!honoursForm) return;

    honoursForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusMsg = document.getElementById('status-honours');
        const btn = document.getElementById('btn-publish-honours');

        statusMsg.style.backgroundColor = '#e0f2fe';
        statusMsg.style.color = '#0369a1';
        statusMsg.innerText = "Updating honours.json live...";
        btn.disabled = true;

        try {
            const supabaseClient = window.supabase.createClient(
                'https://xprnfaadcqlxeamoywjs.supabase.co',
                'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea'
            );

            const yearInput = document.getElementById('honours-year').value.trim();
            const year = parseInt(yearInput);

            if (isNaN(year) || year < 1940 || year > 2035) {
                throw new Error("Please enter a valid 4-digit year (e.g. 2026).");
            }

            const decadePrefix = Math.floor(year / 10) * 10;
            const era = `${decadePrefix}s`;

            const president = document.getElementById('honours-president').value.trim();
            const gents = document.getElementById('honours-gents').value.trim();
            const ladies = document.getElementById('honours-ladies').value.trim();
            const junior = document.getElementById('honours-junior').value.trim();

            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const githubToken = tokenData.value;
            const fileUrl = 'https://api.github.com/repos/goldenacrebc/goldenacre/contents/honours.json';
            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${githubToken}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch honours.json");

            const fileData = await getRes.json();
            const decodeBase64Utf8 = (base64Str) => {
                const binString = atob(base64Str.replace(/\s/g, ''));
                const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
                return new TextDecoder().decode(bytes);
            };
            const encodeUtf8Base64 = (str) => {
                const bytes = new TextEncoder().encode(str);
                const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
                return btoa(binString);
            };

            const honoursData = JSON.parse(decodeBase64Utf8(fileData.content));
            if (!honoursData.eras) honoursData.eras = {};
            if (!honoursData.eras[era]) honoursData.eras[era] = [];

            const newRow = [year];
            if (junior || ladies || gents || president) newRow.push(president || "");
            if (junior || ladies || gents) newRow.push(gents || "");
            if (junior || ladies) newRow.push(ladies || "");
            if (junior) newRow.push(junior);

            const eraList = honoursData.eras[era];
            const existingIndex = eraList.findIndex(row => row[0] === year);
            if (existingIndex !== -1) {
                eraList[existingIndex] = newRow;
            } else {
                eraList.push(newRow);
            }
            eraList.sort((a, b) => b[0] - a[0]);

            const commitRes = await fetch(fileUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${githubToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Admin portal: updated honours board for year ${year}`,
                    content: encodeUtf8Base64(JSON.stringify(honoursData, null, 2)),
                    sha: fileData.sha,
                    branch: "main"
                })
            });
            if (!commitRes.ok) throw new Error("Failed to commit honours update to GitHub.");

            statusMsg.style.backgroundColor = '#dcfce7';
            statusMsg.style.color = '#16a34a';
            statusMsg.innerText = `Successfully updated year ${year} live!`;
            honoursForm.reset();
        } catch (err) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = "Error: " + err.message;
        } finally {
            btn.disabled = false;
        }
    });
})();
