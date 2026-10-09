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

    // 1. Independent & Safe Data Loading Core
    try {
        let dataEvents = [];
        let dataFixtures = [];

        // Fetch regular events safely
        try {
            const resEvents = await fetch('events.json');
            if (resEvents.ok) {
                dataEvents = await resEvents.json();
            } else {
                console.warn(`Could not load events.json (${resEvents.status})`);
            }
        } catch (e) {
            console.warn('Error reading events.json:', e);
        }

        // Fetch fixtures safely
        try {
            const resFixtures = await fetch('fixtures.json');
            if (resFixtures.ok) {
                dataFixtures = await resFixtures.json();
            } else {
                console.warn(`Could not load fixtures.json (${resFixtures.status})`);
            }
        } catch (e) {
            console.warn('Error reading fixtures.json:', e);
        }

        // Parse regular events
        const parsedEvents = (Array.isArray(dataEvents) ? dataEvents : []).map((item, index) => {
            if (!item || typeof item !== 'object') return null;
            const match = typeof item.date === 'string' && item.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const [, year, month, day] = match;
            return {
                title: typeof item.title === 'string' ? item.title.trim() : `Event ${index + 1}`,
                date: new Date(Number(year), Number(month) - 1, Number(day)),
                time: typeof item.time === 'string' ? item.time.trim() : '',
                location: typeof item.location === 'string' ? item.location.trim() : '',
                description: typeof item.description === 'string' ? item.description.trim() : '',
                isFixture: false
            };
        }).filter(Boolean);

        // Parse fixtures
        const parsedFixtures = (Array.isArray(dataFixtures) ? dataFixtures : []).map((item, index) => {
            if (!item || typeof item !== 'object') return null;
            const match = typeof item.date === 'string' && item.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            const [, year, month, day] = match;
            return {
                title: typeof item.title === 'string' ? item.title.trim() : `Fixture ${index + 1}`,
                team: typeof item.team === 'string' ? item.team.trim() : '',
                date: new Date(Number(year), Number(month) - 1, Number(day)),
                time: typeof item.time === 'string' ? item.time.trim() : '',
                location: typeof item.location === 'string' ? item.location.trim() : 'Goldenacre Bowling Club',
                description: typeof item.description === 'string' ? item.description.trim() : '',
                isFixture: true
            };
        }).filter(Boolean);

        // Merge and sort chronologically by date
        events = [...parsedEvents, ...parsedFixtures];
        events.sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));

    } catch (error) {
        if (status) {
            status.textContent = `Events could not be loaded: ${error.message}`;
            status.classList.add('events-status-error');
        }
    }

    // 2. Main Grid Rendering Logic
    function renderCalendar() {
        if (!calendarGrid || !heading) return;
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
                
                // Color-coding class assignment
                if (event.team === '1st 16') {
                    eventLabel.classList.add('fixture-team-1st');
                } else if (event.team === '2nd 16') {
                    eventLabel.classList.add('fixture-team-2nd');
                }

                const prefix = event.isFixture ? '🏆 ' : '';
                eventLabel.textContent = event.time ? `${prefix}${event.time} ${event.title}` : `${prefix}${event.title}`;
                dayCell.append(eventLabel);
            });

            calendarGrid.append(dayCell);
        }
    }

    // 3. Dynamic Pop-up Selector Engine
    function showDayEvents(date, dayEvents) {
        if (!detailDate || !detailList || !detailDialog) return;
        detailDate.textContent = eventDateLabel.format(date);
        detailList.replaceChildren();

        dayEvents.forEach(event => {
            const card = document.createElement('article');

            if (event.isFixture) {
                card.className = 'events-detail-item fixture-popup-card';
                
                const matchRegex = /(.*?)\s+v(?:s)?(?:\.)?\s+(.*)/i;
                const isMatch = event.title.match(matchRegex);
                
                let homeTeam = isMatch ? isMatch[1].trim() : event.title;
                let awayTeam = isMatch ? isMatch[2].trim() : "Opponent";
                
                const homeInitials = homeTeam.split(' ').map(w => w[0]).filter(Boolean).join('').substring(0, 3).toUpperCase();
                const awayInitials = awayTeam.split(' ').map(w => w[0]).filter(Boolean).join('').substring(0, 3).toUpperCase();

                // Format Team Badge Label
                let teamLabelHtml = '';
                if (event.team) {
                    teamLabelHtml = `<div class="fixture-team-badge-header">${event.team} Fixture</div>`;
                }

                card.innerHTML = `
                    ${teamLabelHtml}
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
                        ${event.time ? `<p class="events-detail-meta">🕒 ${event.time} ·${event.location}</p>` : `<p class="events-detail-meta">📍 ${event.location}</p>`}
                        <p class="fixture-description">${event.description || 'No further match details listed for this fixture.'}</p>
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
                            statusText.textContent = '🔔 Notification approved! Alert triggers before green rolls.';
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
        if (closeDetailsButton) closeDetailsButton.focus();
    }

    // 4. Sidebar List Layout Generator
    function renderUpcomingEvents() {
        if (!upcomingList) return;
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
                if (event.team === '1st 16') {
                    card.style.borderTop = '3px solid #0369a1';
                } else if (event.team === '2nd 16') {
                    card.style.borderTop = '3px solid #7c3aed';
                } else {
                    card.style.borderTop = '3px solid #0369a1';
                }
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

    // 5. Navigation Controls
    const prevBtn = document.getElementById('previous-month');
    const nextBtn = document.getElementById('next-month');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
            renderCalendar();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
            renderCalendar();
        });
    }

    if (closeDetailsButton && detailDialog) {
        closeDetailsButton.addEventListener('click', () => detailDialog.close());
        detailDialog.addEventListener('click', event => {
            if (event.target === detailDialog) detailDialog.close();
        });
    }

    // Execute Initial Render
    renderCalendar();
    renderUpcomingEvents();
});
