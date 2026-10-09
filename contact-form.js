document.addEventListener('DOMContentLoaded', () => {
    const template = document.createElement('template');
    template.innerHTML = `
        <dialog class="news-modal contact-form-dialog" id="contact-form-dialog" aria-labelledby="contact-form-title">
            <div class="modal-content">
                <button class="modal-close" type="button" aria-label="Close contact form">&times;</button>
                <div class="modal-header">
                    <h2 id="contact-form-title">Send us a message</h2>
                </div>
                <form class="contact-form" action="https://formspree.io/f/mwlvozov" method="POST">
                    <label for="contact-name">Your name</label>
                    <input id="contact-name" name="name" type="text" autocomplete="name" required>
                    <label for="contact-email">Your email</label>
                    <input id="contact-email" name="email" type="email" autocomplete="email" required>
                    <label for="contact-subject">Enquiry about</label>
                    <input id="contact-subject" name="subject" type="text" required>
                    <label for="contact-message">Message</label>
                    <textarea id="contact-message" name="message" rows="5" required></textarea>
                    <button class="contact-form-submit" type="submit">Send message</button>
                    <p class="contact-form-status" role="status" aria-live="polite"></p>
                    <p class="contact-form-note">Your message and email address will be sent to Goldenacre Bowling Club.</p>
                </form>
            </div>
        </dialog>
        <dialog class="news-modal contact-success-dialog" id="contact-success-dialog" aria-labelledby="contact-success-title">
            <div class="modal-content">
                <button class="modal-close" type="button" aria-label="Close confirmation">&times;</button>
                <div class="modal-header">
                    <h2 id="contact-success-title">Thank you</h2>
                </div>
                <p class="contact-success-message">Your message has been sent.</p>
            </div>
        </dialog>`;
    document.body.append(template.content);

    const dialog = document.getElementById('contact-form-dialog');
    const successDialog = document.getElementById('contact-success-dialog');
    const form = dialog.querySelector('.contact-form');
    const subject = form.elements.namedItem('subject');
    const status = dialog.querySelector('.contact-form-status');
    const submitButton = form.querySelector('button[type="submit"]');

    document.addEventListener('click', event => {
        if (!(event.target instanceof Element)) return;
        const trigger = event.target.closest('a[href^="mailto:"], .contact-form-trigger');
        if (!(trigger instanceof HTMLAnchorElement)) return;

        event.preventDefault();
        const mailtoSubject = trigger.href.startsWith('mailto:')
            ? new URL(trigger.href).searchParams.get('subject')
            : null;
        subject.value = trigger.dataset.enquiry || mailtoSubject || 'General Enquiry';
        status.textContent = '';
        dialog.showModal();
        form.elements.namedItem('name').focus();
    });

    dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });

    successDialog.querySelector('.modal-close').addEventListener('click', () => successDialog.close());
    successDialog.addEventListener('click', event => {
        if (event.target === successDialog) successDialog.close();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        status.textContent = 'Sending your message…';
        submitButton.disabled = true;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' }
            });

            if (!response.ok) {
                status.textContent = 'Sorry, your message could not be sent. Please try again.';
                return;
            }

            form.reset();
            dialog.close();
            successDialog.showModal();
            successDialog.querySelector('.modal-close').focus();
        } catch {
            status.textContent = 'There was a connection problem. Please check your internet and try again.';
        } finally {
            submitButton.disabled = false;
        }
    });
});
