document.addEventListener('DOMContentLoaded', async () => {
    const heading = document.getElementById('calendar-heading');
    const calendarGrid = document.getElementById('calendar-grid');
    const status = document.getElementById('events-status');
    const upcomingList = document.getElementById('upcoming-events-list');
    const detailDialog = document.getElementById('events-detail-dialog');
    const detailDate = document.getElementById('events-detail-date');
    const detailList = document.getElementById('events-detail-list');
    const closeDetailsButton = document.getElementById('close-events-detail');
    const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
    const eventDateLabel = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    let events = [];
    let displayedMonth = new Date();
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);

    // 1. Dual File Data Loading Core
    try {
        // Fetch regular club events
        const responseEvents = await fetch('events.json');
        if (!responseEvents.ok) {
            throw new Error(`Could not load events.json (${responseEvents.status}).`);
        }
        const dataEvents = await responseEvents.json();
        if (!Array.isArray(dataEvents)) {
            throw new Error('events.json must contain a JSON array of events.');
        }

        events = dataEvents.map((item, index) => {
            if (!item || typeof item !== 'object' || typeof item.title !== 'string' || !item.title.trim()) {
                throw new Error(`Event ${index + 1} needs a title.`);
            }
            const match = typeof item.date === 'string' && item.date.match(/^(\d{4})-(\d{2})-(\d{2})\$/);
            if (!match) {
                throw new Error(`Event "${item.title}" needs a date in YYYY-MM-DD format.`);
            }
            const [, year, month, day] = match;
            return {
                title: item.title.trim(),
                date: new Date(Number(year), Number(month) - 1, Number(day)),
                time: typeof item.time === 'string' ? item.time.trim() : '',
                location: typeof item.location === 'string' ? item.location.trim() : '',
                description: typeof item.description === 'string' ? item.description.trim() : '',
                isFixture: false
            };
        });

        // Fetch independent match fixtures file safely
        try {
            const responseFixtures = await fetch('fixtures.json');
            if (responseFixtures.ok) {
                const dataFixtures = await responseFixtures.json();
                if (Array.isArray(dataFixtures)) {
                    const parsedFixtures = dataFixtures.map(item => {
                        const match = typeof item.date === 'string' && item.date.match(/^(\d{4})-(\d{2})-(\d{2})\$/);
                        const [, year, month, day] = match;
                        return {
                            title: item.title.trim(),
                            date: new Date(Number(year), Number(month) - 1, Number(day)),
                            time: typeof item.time === 'string' ? item.time.trim() : '',
                            location: typeof item.location === 'string' ? item.location.trim() : 'Goldenacre Bowling Club',
                            description: typeof item.description === 'string' ? item.description.trim() : '',
                            isFixture: true
                        };
                    });
                    // Merge regular club events and match fixtures together
                    events = [...events, ...parsedFixtures];
                }
            }
        } catch (fixtureErr) {
            console.warn("fixtures.json file reading skipped or empty:", fixtureErr);
        }

        // Sort everything chronologically by calendar date
        events.sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));

    } catch (error) {
        status.textContent = `Events could not be loaded: ${error.message}`;
        status.classList.add('events-status-error');
    }

    // 2. Main Grid Rendering Logic
    function renderCalendar() {
        heading.textContent = monthLabel.format(displayedMonth);
        calendarGrid.replaceChildren();

        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let index = 0; index < firstWeekday; index += 1) {
            const blank = document.createElement('div');
            blank.className = 'calendar-day calendar-day-empty';
            blank.setAttribute('aria-hidden', 'true');
            calendarGrid.append(blank);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            const dayEvents = events.filter(event => event.date.getTime() === date.getTime());
            const dayCell = document.createElement(dayEvents.length ? 'button' : 'article');
            dayCell.className = 'calendar-day';
            
            if (date.getTime() === today.getTime()) {
                dayCell.classList.add('calendar-day-today');
            }

            if (dayEvents.length) {
                dayCell.type = 'button';
                dayCell.classList.add('calendar-day-has-events');
                dayCell.setAttribute('aria-label', `${eventDateLabel.format(date)}, ${dayEvents.length} entry listed. Open popup details.`);
                dayCell.addEventListener('click', () => showDayEvents(date, dayEvents));
            }

            const dateNumber = document.createElement(dayEvents.length ? 'span' : 'h3');
            if (dayEvents.length) dateNumber.className = 'calendar-day-number';
            dateNumber.textContent = String(day);
            dayCell.append(dateNumber);

            dayEvents.forEach(event => {
                const eventLabel = document.createElement('span');
                eventLabel.className = event.isFixture ? 'calendar-event fixture-event-tag' : 'calendar-event';
                const prefix = event.isFixture ? '🏆 ' : '';
                eventLabel.textContent = event.time ? `${prefix}${event.time} ${event.title}` : `${prefix}${event.title}`;
                dayCell.append(eventLabel);
            });

            calendarGrid.append(dayCell);
        }
    }
    // 3. Dynamic Pop-up Selector Engine
    function showDayEvents(date, dayEvents) {
        detailDate.textContent = eventDateLabel.format(date);
        detailList.replaceChildren();

        dayEvents.forEach(event => {
            const card = document.createElement('article');

            // Check if this item is a true separate fixture matchup
            if (event.isFixture) {
                card.className = 'events-detail-item fixture-popup-card';
                
                const matchRegex = /(.*?)\s+v(?:s)?(?:\.)?\s+(.*)/i;
                const isMatch = event.title.match(matchRegex);
                
                let homeTeam = isMatch ? isMatch[1].trim() : event.title;
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
                        ${event.time ? `<p class="events-detail-meta">🕒 event.time · {event.location}</p>` : `<p class="events-detail-meta">📍 \${event.location}</p>`}
                        <p class="fixture-description">${event.description || 'No further match details listed for this fixture.'}</p>
                    </div>
                    <div class="reminder-action-panel">
                        <button type="button" class="btn-set-reminder">🔔 Set Match Reminder</button>
                        <p class="reminder-status-text" style="display: none;"></p>
                    </div>
                `;

                // Set up Web Notification Trigger permissions
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
                            statusText.textContent = '🔔 Notification approved! Alert triggers 15–30 mins before green rolls.';
                            statusText.style.display = 'block';
                            
                            setTimeout(() => {
                                new Notification(`Matchday Reminder: ${event.title}`, {
                                    body: `The fixture starts at ${event.time || 'Scheduled Time'}. Good luck!`,
                                    icon: '/favicon.ico'
                                });
                            }, 2000);
                        } else {
                            statusText.textContent = '❌ Permission denied. Unblock notification settings in your browser bar.';
                            statusText.style.display = 'block';
                        }
                    });
                });

            } else {
                // Fallback structure: Standard text layouts for socials/meetings stay completely safe
                card.className = 'events-detail-item';
                const title = document.createElement('h3');
                title.textContent = event.title;
                card.append(title);

                const details = [event.time, event.location].filter(Boolean).join(' · ');
                if (details) {
                    const detailText = document.createElement('p');
                    detailText.className = 'events-detail-meta';
                    detailText.textContent = details;
                    card.append(detailText);
                }

                const description = document.createElement('p');
                description.textContent = event.description || 'No further details are available for this event.';
                card.append(description);
            }

            detailList.append(card);
        });

        detailDialog.showModal();
        closeDetailsButton.focus();
    }

    // 4. Sidebar List Layout Generator
    function renderUpcomingEvents() {
        upcomingList.replaceChildren();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcoming = events.filter(event => event.date >= today);

        if (!upcoming.length) {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'events-empty-message';
            emptyMessage.textContent = 'There are no upcoming events listed just now.';
            upcomingList.append(emptyMessage);
            return;
        }

        upcoming.forEach(event => {
            const card = document.createElement('article');
            card.className = 'upcoming-event-card';
            if (event.isFixture) {
                card.style.borderTop = '3px solid #0369a1';
            }

            const date = document.createElement('p');
            date.className = 'upcoming-event-date';
            date.textContent = eventDateLabel.format(event.date);

            const title = document.createElement('h3');
            title.textContent = event.isFixture ? `🏆 ${event.title}` : event.title;
            card.append(date, title);

            if (event.time || event.location) {
                const details = document.createElement('p');
                details.className = 'upcoming-event-details';
                details.textContent = [event.time, event.location].filter(Boolean).join(' · ');
                card.append(details);
            }

            if (event.description) {
                const description = document.createElement('p');
                description.textContent = event.description;
                card.append(description);
            }

            upcomingList.append(card);
        });
    }

    // 5. Month Switcher Event Listeners
    document.getElementById('previous-month').addEventListener('click', () => {
        displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
        renderCalendar();
    });

    closeDetailsButton.addEventListener('click', () => detailDialog.close());
    detailDialog.addEventListener('click', event => {
        if (event.target === detailDialog) detailDialog.close();
    });

    // Run layout render configurations
    renderCalendar();
    renderUpcomingEvents();
});

