document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('upcoming-events-widget');
    if (!container) return;

    let currentMonthEvents = [];

    // Setup filter button listeners immediately so tabs work right away
    const filterButtons = document.querySelectorAll('.event-filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterButtons.forEach(b => {
                b.classList.remove('active');
                b.style.background = '#fff';
                b.style.color = '#173b32';
            });
            e.target.classList.add('active');
            e.target.style.background = '#173b32';
            e.target.style.color = '#fff';

            const filterType = e.target.getAttribute('data-filter');
            if (filterType === 'all') {
                renderFilteredEvents(currentMonthEvents.slice(0, 6));
            } else {
                const filtered = currentMonthEvents.filter(ev => ev.type === filterType).slice(0, 6);
                renderFilteredEvents(filtered);
            }
        });
    });

    // Fetch and load event data
    (async () => {
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

            // Parse regular events and map their explicit type (fallback to 'social')
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
                    tag: item.tag || '',
                    isFixture: false,
                    type: item.type ? item.type.toLowerCase() : 'social'
                };
            }).filter(Boolean);

            // Parse fixtures as 'fixtures' type
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
                    tag: item.tag || '',
                    isFixture: true,
                    type: 'fixtures'
                };
            }).filter(Boolean);

            // Merge and sort chronologically
            const allCombinedEvents = [...parsedEvents, ...parsedFixtures];
            allCombinedEvents.sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // STRICT MONTH FILTER: Keep future events that fall *only* in the current calendar month/year
            currentMonthEvents = allCombinedEvents.filter(event => {
                return event.date >= today &&
                       event.date.getMonth() === today.getMonth() &&
                       event.date.getFullYear() === today.getFullYear();
            });

            if (currentMonthEvents.length === 0) {
                container.innerHTML = '<p class="events-empty">No upcoming events or fixtures listed for this month.</p>';
                return;
            }

            // Render default view (All Events active)
            renderFilteredEvents(currentMonthEvents.slice(0, 6));

        } catch (error) {
            console.error('Failed to load upcoming items:', error);
            container.innerHTML = '<p class="events-empty">Unable to load upcoming events and fixtures.</p>';
        }
    })();

    function renderFilteredEvents(eventsToRender) {
        if (!eventsToRender.length) {
            container.innerHTML = '<p class="events-empty">No upcoming events found for this filter.</p>';
            return;
        }

        // Group filtered upcoming items by date string (YYYY-MM-DD) so same-day events share ONE card
        const groupedMap = new Map();
        eventsToRender.forEach(event => {
            const key = event.date.toISOString().split('T')[0];
            if (!groupedMap.has(key)) {
                groupedMap.set(key, { date: event.date, events: [] });
            }
            groupedMap.get(key).events.push(event);
        });

        container.innerHTML = Array.from(groupedMap.values()).map(group => {
            const monthStr = group.date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const dayNum = group.date.getDate();

            // Find if any event in this group has a custom gold pill tag
            const eventWithTag = group.events.find(ev => ev.tag);
            const pillTagHtml = eventWithTag ? `<span class="event-pill-tag">${eventWithTag.tag}</span>` : '';

            const eventsListHtml = group.events.map((event, idx) => {
                let badgeHtml = '';
                if (event.isFixture) {
                    let badgeClass = 'tag-fixture-default';
                    let labelText = 'Fixture';

                    if (event.team === '1st 16') {
                        badgeClass = 'tag-fixture-1st';
                        labelText = '1st 16 Fixture';
                    } else if (event.team === '2nd 16') {
                        badgeClass = 'tag-fixture-2nd';
                        labelText = '2nd 16 Fixture';
                    } else if (event.team) {
                        labelText = `${event.team} Fixture`;
                    }

                    badgeHtml = `<span class="fixture-team-badge ${badgeClass}" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px;">🏆 ${labelText}</span>`;
                } else if (event.type === 'rollups') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; background: #e6f4ea; color: #137333; border: 1px solid #ceead6;">🎯 Roll-up</span>`;
                } else if (event.type === 'coaching') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; background: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc;">📋 Coaching</span>`;
                } else if (event.type === 'social') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">🎉 Social</span>`;
                } else {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 4px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">📌 Event</span>`;
                }

                // Helper for .ics calendar data URI generation inline
                const pad = (n) => String(n).padStart(2, '0');
                const d = event.date;
                const dateStr = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
                let timeStr = 'T140000Z';
                if (event.time) {
                    const matchTime = event.time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
                    if (matchTime) {
                        let hours = parseInt(matchTime[1], 10);
                        const minutes = matchTime[2] ? matchTime[2] : '00';
                        const ampm = matchTime[3] ? matchTime[3].toLowerCase() : '';
                        if (ampm === 'pm' && hours < 12) hours += 12;
                        if (ampm === 'am' && hours === 12) hours = 0;
                        timeStr = `T${pad(hours)}${minutes}00`;
                    }
                }
                const startIso = `${dateStr}${timeStr}`;
                const summary = event.isFixture && event.team ? `${event.team} Fixture: ${event.title}` : event.title;
                const description = event.description || 'Goldenacre Bowling Club Event';
                const location = event.location || 'Goldenacre Bowling Club, Warriston, Edinburgh';

                const icsContent = [
                    'BEGIN:VCALENDAR',
                    'VERSION:2.0',
                    'BEGIN:VEVENT',
                    `SUMMARY:${summary}`,
                    `DESCRIPTION:${description}`,
                    `LOCATION:${location}`,
                    `DTSTART:${startIso}`,
                    'END:VEVENT',
                    'END:VCALENDAR'
                ].join('\r\n');
                const icsUrl = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
                const safeFileTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                const dividerStyle = idx > 0 ? 'margin-top: 10px; padding-top: 10px; border-top: 1px dashed #cbd5e1;' : '';

                return `
                    <div style="${dividerStyle} cursor: pointer;" onclick="openEventPopup('${encodeURIComponent(event.title)}', '${encodeURIComponent(event.time || '7:00 pm')}', '${encodeURIComponent(event.location || 'Goldenacre Bowling Club')}', '${encodeURIComponent(event.description || '')}')">
                        ${badgeHtml}
                        <h4 style="margin: 0 0 4px 0; font-family: Georgia, serif; font-size: 0.98rem; color: #173b32; line-height: 1.3;">${event.title}</h4>
                        <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 6px; display: flex; gap: 8px; flex-wrap: wrap;">
                            <span>🕒 ${event.time || '7:00 pm'}</span>
                            <span>📍 ${event.location || 'Goldenacre'}</span>
                        </div>
                        ${event.description ? `<p style="margin: 0 0 6px 0; font-size: 0.82rem; color: #334155; line-height: 1.35;">${event.description}</p>` : ''}
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
                            <a href="${icsUrl}" download="${safeFileTitle}.ics" onclick="event.stopPropagation();" style="font-size: 0.75rem; font-weight: 700; color: #0369a1; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                📅 Add to Calendar
                            </a>
                            <span style="font-size: 0.75rem; color: #173b32; font-weight: 600;">View Details &rarr;</span>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="event-card-item">
                    ${pillTagHtml}
                    <div class="event-date-badge">
                        <span class="event-month">${monthStr}</span>
                        <span class="event-day">${dayNum}</span>
                    </div>
                    <div class="event-details">
                        ${eventsListHtml}
                    </div>
                </div>
            `;
        }).join('');
    }
});

// Global handler to trigger popup modal when an event is clicked
window.openEventPopup = function(title, time, location, description) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalTag = document.getElementById('modal-tag');
    const globalModal = document.getElementById('global-modal');

    if (modalTitle) modalTitle.textContent = decodeURIComponent(title);
    if (modalBody) {
        modalBody.innerHTML = `
            <p style="margin-bottom: 10px;"><strong>🕒 Time:</strong> ${decodeURIComponent(time)}</p>
            <p style="margin-bottom: 15px;"><strong>📍 Location:</strong> ${decodeURIComponent(location)}</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;">
            <p>${decodeURIComponent(description).replace(/\n/g, '<br>')}</p>
        `;
    }
    if (modalTag) {
        modalTag.textContent = 'Event Details';
        modalTag.className = 'news-tag badge-internal';
    }
    if (globalModal && typeof globalModal.showModal === 'function') {
        globalModal.showModal();
    }
};
