function openNewsModal(key) {
    const data = window.modalData[key];
    if (!data) return;

    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.classList.toggle('membership-modal', key === 'membership');

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

function toggleMoreNews(event) {
    event.preventDefault();
    const extraItems = document.querySelectorAll('.news-item-extra');
    const button = document.getElementById('load-more-news-btn');
    const isExpanding = [...extraItems].some(item => item.classList.contains('news-hidden'));

    extraItems.forEach(item => item.classList.toggle('news-hidden', !isExpanding));
    button.innerHTML = isExpanding ? 'Show Less News &uarr;' : 'More / Archived News &darr;';
    if (!isExpanding) {
        document.getElementById('news').scrollIntoView({ behavior: 'smooth' });
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