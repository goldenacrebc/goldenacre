document.addEventListener('DOMContentLoaded', async () => {
    const heading = document.getElementById('calendar-heading');
    const calendarGrid = document.getElementById('calendar-grid');
    const status = document.getElementById('events-status');
    const upcomingList = document.getElementById('upcoming-events-widget');
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
    let allCalendarItems = [];
    let displayedMonth = new Date();
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);

    try {
        const cacheBuster = `?t=${Date.now()}`;
        const [resEvents, resFixtures] = await Promise.all([
            fetch(`events.json${cacheBuster}`).catch(() => ({ ok: false })),
            fetch(`fixtures.json${cacheBuster}`).catch(() => ({ ok: false }))
        ]);

        let dataEvents = [];
        let dataFixtures = [];

        if (resEvents.ok) dataEvents = await resEvents.json();
        if (resFixtures.ok) dataFixtures = await resFixtures.json();

        // Helper to parse YYYY-MM-DD cleanly as local midnight
        function parseLocalDate(dateString) {
            if (!dateString) return null;
            const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }

        // Parse regular events
        const parsedEvents = (Array.isArray(dataEvents) ? dataEvents : []).map(item => {
            const date = parseLocalDate(item.date);
            if (!date) return null;
            return {
                title: item.title,
                team: '',
                date: date,
                time: item.time || '',
                location: item.location || 'Goldenacre Bowling Club',
                description: item.description || '',
                isFixture: false,
                type: item.type ? item.type.toLowerCase() : 'social'
            };
        }).filter(Boolean);

        // Parse fixtures
        const parsedFixtures = (Array.isArray(dataFixtures) ? dataFixtures : []).map(item => {
            const date = parseLocalDate(item.date);
            if (!date) return null;
            return {
                title: item.title,
                team: item.team || '',
                date: date,
                time: item.time || '',
                location: item.location || 'Goldenacre Bowling Club',
                description: item.description || '',
                isFixture: true,
                type: 'fixtures'
            };
        }).filter(Boolean);

        allCalendarItems = [...parsedEvents, ...parsedFixtures];
        allCalendarItems.sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));

    } catch (error) {
        if (status) {
            status.textContent = `Events and fixtures could not be loaded: ${error.message}`;
            status.classList.add('events-status-error');
        }
    }

    function renderCalendar() {
        if (!heading || !calendarGrid) return;
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
            const dayEvents = allCalendarItems.filter(event => event.date.getTime() === date.getTime());
            const dayCell = document.createElement(dayEvents.length ? 'button' : 'article');
            dayCell.className = 'calendar-day';
            if (date.getTime() === today.getTime()) {
                dayCell.classList.add('calendar-day-today');
            }

            if (dayEvents.length) {
                dayCell.type = 'button';
                dayCell.classList.add('calendar-day-has-events');
                dayCell.setAttribute('aria-label', `${eventDateLabel.format(date)}, ${dayEvents.length} item${dayEvents.length === 1 ? '' : 's'}. Show details.`);
                dayCell.addEventListener('click', () => showDayEvents(date, dayEvents));
            }

            const dateNumber = document.createElement(dayEvents.length ? 'span' : 'h3');
            if (dayEvents.length) dateNumber.className = 'calendar-day-number';
            dateNumber.textContent = String(day);
            dayCell.append(dateNumber);

            dayEvents.forEach(event => {
                const eventLabel = document.createElement('span');
                eventLabel.className = 'calendar-event';
                eventLabel.textContent = event.time ? `${event.time} ${event.title}` : event.title;
                dayCell.append(eventLabel);
            });

            calendarGrid.append(dayCell);
        }
    }

    function showDayEvents(date, dayEvents) {
        if (!detailDate || !detailList || !detailDialog) return;
        detailDate.textContent = eventDateLabel.format(date);
        detailList.replaceChildren();

        dayEvents.forEach((event, idx) => {
            const card = document.createElement('article');
            card.className = 'events-detail-item';
            
            const dividerStyle = idx > 0 ? 'margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;' : 'padding-bottom: 8px;';
            card.style.cssText = `${dividerStyle}`;

            if (event.isFixture) {
                // Match Fixture Badge vs Badge Popup Format matching index page behavior
                let opponentName = 'Opponent';
                let clubNameSlug = 'club-badge';
                if (event.title) {
                    const parts = event.title.split(/vs\.?|v\.?|-/i);
                    opponentName = parts.length > 1 ? parts[1].trim() : event.title;
                    clubNameSlug = opponentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                }
                const badgeFileUrl = `photos/${clubNameSlug}.png`;
                const homeBadgeUrl = 'logo.jpeg';
                const teamLabel = event.team ? `${event.team} Fixture` : 'Match Fixture';
                const formattedDateStr = eventDateLabel.format(date);

                let teamBadgeClass = 'tag-fixture-default';
                if (event.team === '1st 16') teamBadgeClass = 'tag-fixture-1st';
                else if (event.team === '2nd 16') teamBadgeClass = 'tag-fixture-2nd';
                else if (event.team === 'Seniors') teamBadgeClass = 'tag-fixture-seniors';
                else if (event.team === 'Ladies') teamBadgeClass = 'tag-fixture-ladies';

                const initials = opponentName.split(' ').map(w => w[0]).filter(Boolean).join('').substring(0, 3).toUpperCase();

                card.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 12px; padding-top: 4px;">
                        <div style="text-align: center;">
                            <img src="${homeBadgeUrl}" alt="Goldenacre BC" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="this.style.display='none'">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #173b32; margin-top: 4px;">Goldenacre</div>
                        </div>
                        <div style="font-weight: 800; font-size: 1rem; color: #64748b; font-style: italic;">VS</div>
                        <div style="text-align: center;">
                            <img src="${badgeFileUrl}" alt="${opponentName}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('div'), {className:'club-badge-placeholder', innerText:'${initials}', style:'width:56px; height:56px; font-size:0.9rem; margin:0 auto; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#173b32; color:#ffcc00; font-weight:bold;'}))">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #173b32; margin-top: 4px;">${opponentName}</div>
                        </div>
                    </div>
                    <div style="text-align: center; margin-bottom: 14px;">
                        <span class="fixture-team-badge ${teamBadgeClass}" style="display: inline-block; font-weight: 700; font-size: 0.9rem; padding: 4px 12px; border-radius: 20px;">🏆 ${teamLabel}</span>
                    </div>
                    <h3 style="font-family: Georgia, serif; font-size: 1.15rem; font-weight: 700; color: #173b32; margin: 0 0 10px 0; text-align: center;">${event.title}</h3>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 0.9rem; color: #334155;">
                        <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${formattedDateStr}</p>
                        <p style="margin: 4px 0;"><strong>🕒 Time:</strong> ${event.time || '7:00 pm'}</p>
                        <p style="margin: 4px 0;"><strong>📍 Venue:</strong> ${event.location || 'Goldenacre Bowling Club'}</p>
                    </div>
                    ${event.description ? `<div style="font-size: 0.92rem; color: #334155; line-height: 1.5;"><p style="margin: 0 0 4px 0;"><strong>Details:</strong></p><p style="margin: 0;">${event.description.replace(/\n/g, '<br>')}</p></div>` : ''}
                `;
            } else {
                // Regular Event Popup Format (Roll-ups, Coaching, Social)
                let badgeHtml = '';
                if (event.type === 'rollups') {
                    badgeHtml = `<div style="margin-bottom: 8px;"><span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e6f4ea; color: #137333; border: 1px solid #ceead6; text-transform: uppercase;">🎯 Roll-up</span></div>`;
                } else if (event.type === 'coaching') {
                    badgeHtml = `<div style="margin-bottom: 8px;"><span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc; text-transform: uppercase;">📋 Coaching</span></div>`;
                } else if (event.type === 'social') {
                    badgeHtml = `<div style="margin-bottom: 8px;"><span style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; text-transform: uppercase;">🎉 Social</span></div>`;
                }

                card.innerHTML = `
                    ${badgeHtml}
                    <h3 style="font-family: Georgia, serif; font-size: 1.15rem; font-weight: 700; color: #173b32; margin: 0 0 10px 0;">${event.title}</h3>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 14px; font-size: 0.9rem; color: #334155;">
                        <p style="margin: 4px 0;"><strong>🕒 Time:</strong> ${event.time || '7:00 pm'}</p>
                        <p style="margin: 4px 0;"><strong>📍 Location:</strong> ${event.location || 'Goldenacre Bowling Club'}</p>
                    </div>
                    ${event.description ? `<div style="font-size: 0.92rem; color: #334155; line-height: 1.5;"><p style="margin: 0 0 4px 0;"><strong>Details:</strong></p><p style="margin: 0;">${event.description.replace(/\n/g, '<br>')}</p></div>` : ''}
                `;
            }

            detailList.append(card);
        });

        detailDialog.showModal();
        if (closeDetailsButton) closeDetailsButton.focus();
    }

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

    renderCalendar();
});