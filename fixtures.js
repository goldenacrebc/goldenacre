(function() {
    let fixtures = [];
    const calendarGrid = document.getElementById('calendar-grid');
    const detailList = document.getElementById('events-detail-list');
    
    const eventDateLabel = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Fetch the separate fixtures.json file independently
    async function loadFixtures() {
        try {
            const response = await fetch('fixtures.json');
            if (!response.ok) return;
            fixtures = await response.json();
            
            // Retry system: Waits for your existing grid days to become available
            ensureGridIsReadyAndInject();
        } catch (e) {
            console.error("Could not load separate fixtures file:", e);
        }
    }

    function ensureGridIsReadyAndInject() {
        if (!calendarGrid) return;
        
        const testCells = calendarGrid.querySelectorAll('.calendar-day');
        // If your original script hasn't built the day cells yet, wait 100ms and try again
        if (testCells.length === 0) {
            setTimeout(ensureGridIsReadyAndInject, 100);
            return;
        }

        injectFixturesToGrid();
    }

    // Inject your separate fixtures into your existing calendar cells safely
    function injectFixturesToGrid() {
        if (!calendarGrid) return;
        
        const dayCells = calendarGrid.querySelectorAll('.calendar-day');
        const headingElement = document.getElementById('calendar-heading');
        if (!headingElement) return;
        
        const headingText = headingElement.textContent.trim(); // e.g. "October 2026"

        dayCells.forEach(cell => {
            // Find the day number text to calculate the true date
            const numSpan = cell.querySelector('.calendar-day-number, h3');
            if (!numSpan) return;
            
            const dayNum = numSpan.textContent.trim();
            const dateStr = `${dayNum} ${headingText}`;
            const parsedDate = new Date(Date.parse(dateStr));
            if (isNaN(parsedDate)) return;

            // Convert date variables to YYYY-MM-DD match keys
            const yyyy = parsedDate.getFullYear();
            const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(parsedDate.getDate()).padStart(2, '0');
            const targetKey = `${yyyy}-${mm}-${dd}`;

            // Check if there is an upcoming match scheduled for this specific date
            const dayFixtures = fixtures.filter(f => f.date === targetKey);
            
            dayFixtures.forEach(fixture => {
                // If it was a plain day cell block, upgrade it to a clickable button element
                if (cell.tagName === 'ARTICLE') {
                    const btn = document.createElement('button');
                    btn.className = cell.className;
                    btn.type = 'button';
                    btn.innerHTML = cell.innerHTML;
                    cell.parentNode.replaceChild(btn, cell);
                    cell = btn;
                }
                
                cell.classList.add('calendar-day-has-events');
                
                // Check if this fixture is already drawn on screen to prevent duplicates
                const existingTags = Array.from(cell.querySelectorAll('.fixture-event-tag'));
                const isAlreadyAdded = existingTags.some(t => t.textContent.includes(fixture.title));
                
                if (!isAlreadyAdded) {
                    const label = document.createElement('span');
                    label.className = 'calendar-event fixture-event-tag';
                    label.textContent = fixture.time ? `🏆 ${fixture.time} ${fixture.title}` : `🏆 ${fixture.title}`;
                    cell.appendChild(label);
                }
                
                // Add the pop-up modal view display execution trigger
                cell.addEventListener('click', (e) => {
                    e.stopPropagation();
                    showFixtureModal(parsedDate, fixture);
                });
            });
        });
    }

    // Render the layout popup cards
    function showFixtureModal(date, fixture) {
        const detailDialog = document.getElementById('events-detail-dialog');
        const detailDate = document.getElementById('events-detail-date');
        const closeDetailsButton = document.getElementById('close-events-detail');
        
        if (!detailDialog || !detailList) return;

        detailDate.textContent = eventDateLabel.format(date);
        detailList.replaceChildren();

        const card = document.createElement('article');
        card.className = 'events-detail-item fixture-popup-card';
        
        const matchRegex = /(.*?)\s+v(?:s)?(?:\.)?\s+(.*)/i;
        const isMatch = fixture.title.match(matchRegex);
        
        let homeTeam = isMatch ? isMatch[1].trim() : fixture.title;
        let awayTeam = isMatch ? isMatch[2].trim() : "Opponent";
        
        const homeInitials = homeTeam.split(' ').map(w => w).filter(Boolean).join('').substring(0, 3).toUpperCase();
        const awayInitials = awayTeam.split(' ').map(w => w).filter(Boolean).join('').substring(0, 3).toUpperCase();

        card.innerHTML = `
            <div class="fixture-badge-grid">
                <div class="fixture-team-col home-team">
                    <div class="club-badge-placeholder">${homeInitials}</div>
                    <span class="fixture-team-name">${homeTeam}</span>
                    <span class="venue-tag tag-home">Home</span>
                </div>
                <div class="fixture-vs-divider">VS</div>
                <div class="fixture-team-col away-team">
                    <div class="club-badge-placeholder">${awayInitials}</div>
                    <span class="fixture-team-name">${awayTeam}</span>
                    <span class="venue-tag tag-away">Away</span>
                </div>
            </div>
            <div class="fixture-meta-info">
                ${fixture.time ? `<p class="events-detail-meta">🕒 \${fixture.time}</p>` : ''}
                <p class="fixture-description">${fixture.description || 'No match details listed.'}</p>
            </div>
            <div class="reminder-action-panel">
                <button type="button" class="btn-set-reminder">🔔 Set Match Reminder</button>
                <p class="reminder-status-text" style="display: none;"></p>
            </div>
        `;

        const reminderBtn = card.querySelector('.btn-set-reminder');
        const statusText = card.querySelector('.reminder-status-text');

        reminderBtn.addEventListener('click', () => {
            if (!('Notification' in window)) {
                statusText.textContent = '❌ Web alerts not supported by this browser.';
                statusText.style.display = 'block';
                return;
            }

            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    reminderBtn.textContent = '✓ Reminder Scheduled';
                    reminderBtn.disabled = true;
                    statusText.textContent = '🔔 Notification approved! Alert sets before match rolls.';
                    statusText.style.display = 'block';
                    
                    setTimeout(() => {
                        new Notification(`Matchday Reminder: ${fixture.title}`, {
                            body: `Your match reminder has been activated successfully!`,
                            icon: '/favicon.ico'
                        });
                    }, 2000);
                } else {
                    statusText.textContent = '❌ Permission denied. Adjust site notifications in your settings.';
                    statusText.style.display = 'block';
                }
            });
        });

        detailList.appendChild(card);
        detailDialog.showModal();
        if (closeDetailsButton) closeDetailsButton.focus();
    }

    // Run file loading setup
    loadFixtures();
    
    // Watch grid to recapture month pagination adjustments asynchronously (Prev/Next month clicks)
    if (calendarGrid) {
        const gridObserver = new MutationObserver(() => {
            gridObserver.disconnect();
            injectFixturesToGrid();
            gridObserver.observe(calendarGrid, { childList: true });
        });
        gridObserver.observe(calendarGrid, { childList: true });
    }
})();

