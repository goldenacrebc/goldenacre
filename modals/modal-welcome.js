document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcome-pop-up');
    if (!welcomeModal) return;

    if (!localStorage.getItem('hasSeenWelcomePopup')) {
        setTimeout(() => {
            welcomeModal.showModal();
            startCountdown(welcomeModal, 10);
        }, 1000);
    }
});

function startCountdown(modal, secondsRemaining) {
    const body = modal.querySelector('.modal-body');
    if (!body) return;

    // Create a countdown message container if it doesn't exist
    let timerP = modal.getElementById ? modal.getElementById('modal-timer') : null;
    if (!timerP) {
        timerP = document.createElement('p');
        timerP.id = 'modal-timer';
        timerP.style.cssText = 'font-size: 0.85rem; color: #64748b; margin-top: 15px; text-align: center;';
        body.appendChild(timerP);
    }

    const interval = setInterval(() => {
        if (!modal.open) {
            clearInterval(interval);
            return;
        }

        if (secondsRemaining > 0) {
            timerP.textContent = `This window will close automatically in ${secondsRemaining} second${secondsRemaining === 1 ? '' : 's'}.`;
            secondsRemaining--;
        } else {
            clearInterval(interval);
            closeWelcomeModal();
        }
    }, 1000);

    timerP.textContent = `This window will close automatically in ${secondsRemaining} seconds.`;
}

function closeWelcomeModal() {
    const welcomeModal = document.getElementById('welcome-pop-up');
    if (welcomeModal && welcomeModal.open) {
        welcomeModal.close();
        localStorage.setItem('hasSeenWelcomePopup', 'true');
    }
}
