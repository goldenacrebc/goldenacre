function openNewsModal(key) {
    const data = window.modalData[key];
    if (!data) return;

    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.classList.toggle('membership-modal', key === 'membership');
    modal.classList.toggle('honours-list-modal', key === 'honours-list');

    document.getElementById('modal-tag').textContent = data.tag;
    document.getElementById('modal-title').textContent = data.title;

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = data.body;

    modal.querySelector('.modal-content').scrollTop = 0;
    modalBody.scrollTop = 0;

    modalBody.querySelectorAll('img').forEach(image => {
        image.addEventListener('error', () => {
            image.remove();
            if (!modalBody.querySelector('img') && !modalBody.querySelector('.modal-image-fallback')) {
                const fallback = document.createElement('p');
                fallback.className = 'modal-image-fallback';
                fallback.textContent = 'Hall photos are not available yet.';
                modalBody.prepend(fallback);
            }
        });
    });

    document.body.style.overflow = 'hidden';
    if (!modal.open) {
        modal.showModal();
    }
}

function closeNewsModal() {
    const modal = document.getElementById('global-modal');
    if (modal) {
        modal.close();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.addEventListener('close', () => {
        document.body.style.overflow = '';
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close();
        }
    });
});