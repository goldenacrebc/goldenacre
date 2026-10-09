document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('contact-form-dialog');
    const successDialog = document.getElementById('contact-success-dialog');
    const subject = document.getElementById('contact-subject');
    const form = document.querySelector('.contact-form');
    const status = document.querySelector('.contact-form-status');
    const submitButton = form?.querySelector('button[type="submit"]');
    if (!(dialog instanceof HTMLDialogElement)
        || !(successDialog instanceof HTMLDialogElement)
        || !(subject instanceof HTMLInputElement)
        || !(form instanceof HTMLFormElement)
        || !(status instanceof HTMLElement)
        || !(submitButton instanceof HTMLButtonElement)) return;

    document.querySelectorAll('.contact-form-trigger').forEach(trigger => {
        trigger.addEventListener('click', event => {
            event.preventDefault();
            subject.value = trigger.dataset.enquiry || 'General Enquiry';
            status.textContent = '';
            dialog.showModal();
            document.getElementById('contact-name').focus();
        });
    });

    dialog.querySelector('.modal-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
        if (event.target === dialog) dialog.close();
    });

    const closeSuccessDialog = () => successDialog.close();
    successDialog.querySelector('.modal-close').addEventListener('click', closeSuccessDialog);
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
