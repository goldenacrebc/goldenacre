document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('event-generator-form');
    if (!form) return;

    const output = document.getElementById('event-generator-output');
    const jsonField = document.getElementById('event-generator-json');
    const status = document.getElementById('event-generator-status');
    const copyButton = document.getElementById('copy-event-generator-json');
    const downloadButton = document.getElementById('download-event-generator-json');

    form.addEventListener('submit', event => {
        event.preventDefault();
        if (!form.reportValidity()) return;

        const formData = new FormData(form);
        const newEvent = {
            date: String(formData.get('date')),
            title: String(formData.get('title')).trim()
        };

        ['time', 'location', 'description'].forEach(field => {
            const value = String(formData.get(field)).trim();
            if (value) newEvent[field] = value;
        });

        jsonField.value = JSON.stringify(newEvent, null, 2);
        status.textContent = 'Event JSON generated. Copy or download it, then add it to events.json.';
        output.hidden = false;
        jsonField.focus();
        jsonField.select();
    });

    copyButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(jsonField.value);
            status.textContent = 'Event JSON copied. Add it to events.json.';
        } catch {
            jsonField.focus();
            jsonField.select();
            status.textContent = 'Automatic copy is unavailable here. The JSON is selected; use your browser’s Copy command.';
        }
    });

    downloadButton.addEventListener('click', () => {
        const file = new Blob([jsonField.value], { type: 'application/json' });
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'club-event.json';
        link.click();
        URL.revokeObjectURL(url);
        status.textContent = 'Event JSON entry downloaded. Add it to events.json.';
    });
});
