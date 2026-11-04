(() => {
    const supabaseClient = window.supabase.createClient(
        'https://xprnfaadcqlxeamoywjs.supabase.co',
        'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea'
    );
    const owner = 'goldenacrebc';
    const repo = 'goldenacre';
    const branch = 'main';

    function encodeUtf8Base64(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        bytes.forEach(byte => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1]);
            reader.onerror = () => reject(reader.error || new Error('Could not read the selected image.'));
            reader.readAsDataURL(file);
        });
    }

    async function getGitHubToken() {
        const { data, error } = await supabaseClient
            .from('settings').select('value').eq('key', 'github_token').single();
        if (error || !data?.value) throw new Error('Could not retrieve the GitHub token from secure storage.');
        return data.value;
    }

    async function checkAdminAuth() {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user || user.email !== 'admin@goldenacre.local') {
            await supabaseClient.auth.signOut();
            window.location.replace('admin_login.html');
        }
    }

    checkAdminAuth();

    const logout = document.getElementById('logout-btn');
    logout?.addEventListener('click', async event => {
        event.preventDefault();
        await supabaseClient.auth.signOut();
        window.location.replace('admin_login.html');
    });

    const form = document.getElementById('form-club-news');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('btn-publish-club-news');
        const status = document.getElementById('status-club-news');
        const title = document.getElementById('club-news-title').value.trim();
        const description = document.getElementById('club-news-content').value.trim();
        const imageFile = document.getElementById('club-news-image').files[0];
        button.disabled = true;
        status.textContent = 'Publishing club news...';

        try {
            const token = await getGitHubToken();
            const headers = { Authorization: `token ${token}` };
            let image = 'logo.jpeg';

            if (imageFile) {
                const safeName = imageFile.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
                const photoPath = `photos/${Date.now()}-${safeName}`;
                const upload = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${photoPath}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Admin upload: club news photo ${safeName}`,
                        content: await fileToBase64(imageFile),
                        branch
                    })
                });
                if (!upload.ok) throw new Error(`Image upload failed (${upload.status}).`);
                image = photoPath;
            }

            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/news.json`;
            const getResponse = await fetch(fileUrl, { headers });
            if (!getResponse.ok) throw new Error(`Could not load news.json (${getResponse.status}).`);
            const fileData = await getResponse.json();
            const binary = atob(fileData.content.replace(/\s/g, ''));
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            const news = JSON.parse(new TextDecoder().decode(bytes));

            news.unshift({
                title,
                description,
                category: 'club',
                tag: 'latest',
                image,
                modal: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            });

            const saveResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Admin portal: added club news ${title}`,
                    content: encodeUtf8Base64(JSON.stringify(news, null, 2)),
                    sha: fileData.sha,
                    branch
                })
            });
            if (!saveResponse.ok) throw new Error(`Could not save club news (${saveResponse.status}).`);

            status.textContent = 'Club news published successfully. Allow a minute or two for the site feed to refresh.';
            form.reset();
        } catch (error) {
            console.error('Club news publishing error:', error);
            status.textContent = `Error: ${error.message}`;
        } finally {
            button.disabled = false;
        }
    });
})();
