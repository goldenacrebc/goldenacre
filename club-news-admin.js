(() => {
    const supabaseClient = window.supabase.createClient(
        'https://xprnfaadcqlxeamoywjs.supabase.co',
        'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea'
    );
    const owner = 'goldenacrebc';
    const repo = 'goldenacre';
    const branch = 'main';
    const form = document.getElementById('form-club-news');
    if (!form) return;

    const titleInput = document.getElementById('club-news-title');
    const contentInput = document.getElementById('club-news-content');
    const imageInput = document.getElementById('club-image');
    const button = form.querySelector('[data-type="club-news"]');
    const status = document.getElementById('status-club-news');

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

    async function publishClubNews() {
        if (!form.reportValidity() || button.disabled) return;
        button.disabled = true;
        status.textContent = 'Publishing Club News...';
        status.style.color = '#0369a1';

        try {
            const token = await getGitHubToken();
            const headers = { Authorization: `token ${token}` };
            const title = titleInput.value.trim();
            const description = contentInput.value.trim();
            let image = 'logo.jpeg';

            if (imageInput?.files?.[0]) {
                const file = imageInput.files[0];
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-');
                const photoPath = `photos/${Date.now()}-${safeName}`;
                status.textContent = 'Uploading photo...';
                const upload = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${photoPath}`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: `Admin upload: Club News photo ${safeName}`,
                        content: await fileToBase64(file),
                        branch
                    })
                });
                if (!upload.ok) throw new Error(`Image upload failed (${upload.status}).`);
                image = photoPath;
            }

            const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/news.json`;
            status.textContent = 'Loading current news...';
            const getResponse = await fetch(fileUrl, { headers });
            if (!getResponse.ok) throw new Error(`Could not load news.json (${getResponse.status}).`);
            const fileData = await getResponse.json();
            if (typeof fileData.content !== 'string') {
                throw new Error('GitHub returned no file content for news.json. Please check the file size and try again.');
            }

            const binary = atob(fileData.content.replace(/\s/g, ''));
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            const news = JSON.parse(new TextDecoder().decode(bytes));
            if (!Array.isArray(news)) throw new Error('news.json must contain a JSON array.');

            news.unshift({
                title,
                description,
                category: 'club',
                tag: 'latest',
                image,
                modal: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
            });

            status.textContent = 'Saving Club News...';
            const saveResponse = await fetch(fileUrl, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: `Admin portal: added Club News ${title}`,
                    content: encodeUtf8Base64(JSON.stringify(news, null, 2)),
                    sha: fileData.sha,
                    branch
                })
            });
            if (!saveResponse.ok) {
                const details = await saveResponse.json().catch(() => ({}));
                throw new Error(details.message || `Could not save Club News (${saveResponse.status}).`);
            }

            status.textContent = 'Club News published successfully. Allow a minute or two for the Latest News feed to refresh.';
            status.style.color = '#16a34a';
            form.reset();
            const previewBox = document.getElementById('club-preview-box');
            if (previewBox) previewBox.style.display = 'none';
            const uploadText = document.getElementById('club-upload-text');
            if (uploadText) uploadText.textContent = 'Click or drag an image file here to attach';
        } catch (error) {
            console.error('Club News publishing error:', error);
            status.textContent = `Error: ${error.message || 'Club News could not be published.'}`;
            status.style.color = '#dc2626';
        } finally {
            button.disabled = false;
        }
    }

    // Intercept the shared admin publisher's click handler for this specific form;
    // Club News has its own category and publishing path.
    document.addEventListener('click', event => {
        const publishButton = event.target.closest('button[data-type="club-news"]');
        if (!publishButton || !form.contains(publishButton)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        publishClubNews();
    }, true);

    form.addEventListener('submit', event => {
        event.preventDefault();
        publishClubNews();
    });

    if (imageInput) {
        imageInput.addEventListener('change', () => {
            const file = imageInput.files?.[0];
            const uploadText = document.getElementById('club-upload-text');
            const previewBox = document.getElementById('club-preview-box');
            const previewImage = document.getElementById('club-preview-img');
            if (file && uploadText && previewBox && previewImage) {
                uploadText.textContent = `Selected: ${file.name}`;
                previewImage.src = URL.createObjectURL(file);
                previewBox.style.display = 'block';
            }
        });
    }
})();
