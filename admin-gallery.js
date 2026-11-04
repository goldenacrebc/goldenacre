(function() {
    const galleryForm = document.getElementById('form-gallery');
    if (!galleryForm) return;

    galleryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const statusMsg = document.getElementById('status-gallery');
        const btn = document.getElementById('btn-publish-gallery');

        statusMsg.style.backgroundColor = '#e0f2fe';
        statusMsg.style.color = '#0369a1';
        statusMsg.innerText = "Uploading photo to repository...";
        btn.disabled = true;

        try {
            const category = document.getElementById('gallery-category').value;
            const caption = document.getElementById('gallery-caption').value.trim();
            const imageFile = document.getElementById('gallery-image').files[0];
            const supabaseClient = window.supabase.createClient(
                'https://xprnfaadcqlxeamoywjs.supabase.co',
                'sb_publishable_FLKn6BtisIoFBvS7lFjVFg_fRuprjea'
            );
            const { data: tokenData, error: tokenError } = await supabaseClient
                .from('settings').select('value').eq('key', 'github_token').single();
            if (tokenError || !tokenData) throw new Error("Could not retrieve GitHub token.");

            const githubToken = tokenData.value;
            const fileName = `gallery-${Date.now()}-${imageFile.name.replace(/\s+/g, '-')}`;
            const photoPath = `photos/${fileName}`;
            const photoBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(imageFile);
            });

            const photoRes = await fetch(`https://api.github.com/repos/goldenacrebc/goldenacre/contents/${photoPath}`, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${githubToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Admin upload: added gallery photo ${fileName}`,
                    content: photoBase64,
                    branch: "main"
                })
            });
            if (!photoRes.ok) throw new Error("Failed to upload photo file to GitHub.");

            statusMsg.innerText = "Updating gallery page code...";
            const fileUrl = 'https://api.github.com/repos/goldenacrebc/goldenacre/contents/gallery.html';
            const getRes = await fetch(fileUrl, {
                headers: { "Authorization": `token ${githubToken}` }
            });
            if (!getRes.ok) throw new Error("Failed to fetch gallery.html");

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
            let htmlContent = decodeBase64Utf8(fileData.content);

            const newCardHTML = `            <button class="gallery-card" type="button" data-category="${category}" data-full="${photoPath}" data-caption="${caption}">
            <img src="${photoPath}" alt="${caption}" loading="lazy">
            <span class="gallery-card-caption">${caption}</span>
        </button>`;

            if (category === 'green') {
                const targetAnchor = '<section class="gallery-group" data-gallery-group="green">';
                const insertionPoint = htmlContent.indexOf(targetAnchor);
                if (insertionPoint !== -1) {
                    const gridTarget = htmlContent.indexOf('<div class="gallery-grid">', insertionPoint);
                    const insertIdx = htmlContent.indexOf('>', gridTarget) + 1;
                    htmlContent = htmlContent.slice(0, insertIdx) + '\n' + newCardHTML + htmlContent.slice(insertIdx);
                }
            } else if (category === 'competition') {
                const targetAnchor = '<h4 class="gallery-subheading">Internal Competitions</h4>';
                const insertionPoint = htmlContent.indexOf(targetAnchor);
                if (insertionPoint !== -1) {
                    const gridTarget = htmlContent.indexOf('<div class="gallery-grid">', insertionPoint);
                    const insertIdx = htmlContent.indexOf('>', gridTarget) + 1;
                    htmlContent = htmlContent.slice(0, insertIdx) + '\n' + newCardHTML + htmlContent.slice(insertIdx);
                }
            }

            const commitRes = await fetch(fileUrl, {
                method: "PUT",
                headers: {
                    "Authorization": `token ${githubToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    message: `Admin portal: added new photo to gallery (${caption})`,
                    content: encodeUtf8Base64(htmlContent),
                    sha: fileData.sha,
                    branch: "main"
                })
            });
            if (!commitRes.ok) throw new Error("Failed to commit gallery update to GitHub.");

            statusMsg.style.backgroundColor = '#dcfce7';
            statusMsg.style.color = '#16a34a';
            statusMsg.innerText = "Photo successfully published live to gallery!";
            galleryForm.reset();
            document.getElementById('gallery-preview-box').style.display = 'none';
            document.getElementById('gallery-upload-text').innerText = "Click or drag image file here";
        } catch (err) {
            statusMsg.style.backgroundColor = '#fee2e2';
            statusMsg.style.color = '#dc2626';
            statusMsg.innerText = "Error: " + err.message;
        } finally {
            btn.disabled = false;
        }
    });
})();
