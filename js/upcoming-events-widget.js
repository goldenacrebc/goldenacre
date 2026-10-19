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
                
                // Extract opponent name and filename slug for opponent badge (used in popup modal)
                let opponentName = 'Opponent';
                let clubNameSlug = 'club-badge';
                if (event.title) {
                    const parts = event.title.split(/vs\.?|-/i);
                    opponentName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                    clubNameSlug = opponentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                }
                const badgeFileUrl = `photos/${clubNameSlug}.png`;

                if (event.isFixture) {
                    let badgeClass = 'tag-fixture-default';
                    let labelText = 'Fixture';

                    if (event.team === '1st 16') {
                        badgeClass = 'tag-fixture-1st';
                        labelText = '1st 16 Fixture';
                    } else if (event.team === '2nd 16') {
                        badgeClass = 'tag-fixture-2nd';
                        labelText = '2nd 16 Fixture';
                    } else if (event.team === 'Seniors') {
                        badgeClass = 'tag-fixture-seniors';
                        labelText = 'Seniors Fixture';
                    } else if (event.team === 'Ladies') {
                        badgeClass = 'tag-fixture-ladies';
                        labelText = 'Ladies Fixture';
                    } else if (event.team) {
                        labelText = `${event.team} Fixture`;
                    }

                    badgeHtml = `<span class="fixture-team-badge ${badgeClass}" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;">🏆 ${labelText}</span>`;
                } else if (event.type === 'rollups') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e6f4ea; color: #137333; border: 1px solid #ceead6; text-transform: uppercase;">🎯 Roll-up</span>`;
                } else if (event.type === 'coaching') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc; text-transform: uppercase;">📋 Coaching</span>`;
                } else if (event.type === 'social') {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; text-transform: uppercase;">🎉 Social</span>`;
                } else {
                    badgeHtml = `<span class="fixture-team-badge" style="display: inline-block; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; text-transform: uppercase;">📌 Event</span>`;
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

                const dividerStyle = idx > 0 ? 'margin-top: 14px; padding-top: 14px; border-top: 1px dashed #cbd5e1;' : '';

                if (event.isFixture) {
                    const teamLabel = event.team ? `${event.team} Fixture` : 'Match Fixture';
                    const formattedDateStr = group.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

                    return `
                        <div style="${dividerStyle} text-align: left; cursor: pointer;" onclick="openFixturePopup('${encodeURIComponent(event.title)}', '${encodeURIComponent(teamLabel)}', '${encodeURIComponent(formattedDateStr)}', '${encodeURIComponent(event.time || '7:00 pm')}', '${encodeURIComponent(event.location || 'Goldenacre Bowling Club')}', '${encodeURIComponent(event.description || '')}', '${encodeURIComponent(badgeFileUrl)}', '${encodeURIComponent(opponentName)}')">
                            <div style="margin-bottom: 6px;">
                                ${badgeHtml}
                            </div>
                            <h4 style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 1.05rem; font-weight: 700; color: #173b32; line-height: 1.3; text-align: left;">${event.title}</h4>
                            <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 8px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-start; align-items: center;">
                                <span>🕒 ${event.time || '7:00 pm'}</span>
                                <span>📍 ${event.location || 'Goldenacre Bowling club'}</span>
                            </div>
                            ${event.description ? `<p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #334155; line-height: 1.4; text-align: left;">${event.description}</p>` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                <a href="${icsUrl}" download="${safeFileTitle}.ics" onclick="event.stopPropagation();" style="font-size: 0.78rem; font-weight: 700; color: #0369a1; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    📅 Add to Calendar
                                </a>
                                <span style="font-size: 0.78rem; color: #173b32; font-weight: 700;">View Fixture &rarr;</span>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div style="${dividerStyle} text-align: left; cursor: pointer;" onclick="openEventPopup('${encodeURIComponent(event.title)}', '${encodeURIComponent(event.time || '7:00 pm')}', '${encodeURIComponent(event.location || 'Goldenacre Bowling Club')}', '${encodeURIComponent(event.description || '')}')">
                            <div style="margin-bottom: 6px;">
                                ${badgeHtml}
                            </div>
                            <h4 style="margin: 0 0 6px 0; font-family: Georgia, serif; font-size: 1.05rem; font-weight: 700; color: #173b32; line-height: 1.3; text-align: left;">${event.title}</h4>
                            <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 8px; display: flex; gap: 12px; flex-wrap: wrap; justify-content: flex-start; align-items: center;">
                                <span>🕒 ${event.time || '7:00 pm'}</span>
                                <span>📍 ${event.location || 'Goldenacre Bowling club'}</span>
                            </div>
                            ${event.description ? `<p style="margin: 0 0 10px 0; font-size: 0.85rem; color: #334155; line-height: 1.4; text-align: left;">${event.description}</p>` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                                <a href="${icsUrl}" download="${safeFileTitle}.ics" onclick="event.stopPropagation();" style="font-size: 0.78rem; font-weight: 700; color: #0369a1; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                    📅 Add to Calendar
                                </a>
                                <span style="font-size: 0.78rem; color: #173b32; font-weight: 700;">View Details &rarr;</span>
                            </div>
                        </div>
                    `;
                }
            }).join('');

            return `
                <div class="event-card-item" style="display: flex; align-items: flex-start; gap: 16px; position: relative;">
                    ${pillTagHtml}
                    <div class="event-date-badge" style="flex-shrink: 0; margin-top: 4px;">
                        <span class="event-month">${monthStr}</span>
                        <span class="event-day">${dayNum}</span>
                    </div>
                    <div class="event-details" style="flex-grow: 1; width: 100%;">
                        ${eventsListHtml}
                    </div>
                </div>
            `;
        }).join('');
    }
});

// Standard Event Popup Modal Handler (for Roll-ups, Coaching, and Social events)
window.openEventPopup = function(title, time, location, description) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalTag = document.getElementById('modal-tag');
    const globalModal = document.getElementById('global-modal');

    if (modalTitle) modalTitle.textContent = decodeURIComponent(title);
    if (modalBody) {
        modalBody.innerHTML = `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.9rem;">
                <p style="margin: 4px 0;"><strong>🕒 Time:</strong> ${decodeURIComponent(time)}</p>
                <p style="margin: 4px 0;"><strong>📍 Location:</strong> ${decodeURIComponent(location)}</p>
            </div>
            ${decodeURIComponent(description) ? `<div style="font-size: 0.92rem; color: #334155; line-height: 1.5;"><p><strong>Details:</strong></p><p>${decodeURIComponent(description).replace(/\n/g, '<br>')}</p></div>` : ''}
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

// Match Fixture Popup Modal Handler with Badge vs Badge Header & Sub-Team Name
window.openFixturePopup = function(title, teamLabel, dateStr, time, location, description, opponentBadgeUrl, opponentName) {
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalTag = document.getElementById('modal-tag');
    const globalModal = document.getElementById('global-modal');

    const decodedTeam = decodeURIComponent(teamLabel);
    const decodedDate = decodeURIComponent(dateStr);
    const decodedTime = decodeURIComponent(time);
    const decodedLocation = decodeURIComponent(location);
    const decodedDesc = decodeURIComponent(description);
    const decodedOpponentBadge = decodeURIComponent(opponentBadgeUrl);
    const decodedOpponentName = decodeURIComponent(opponentName);

    const homeBadgeUrl = 'logo.jpeg';

    if (modalTitle) modalTitle.textContent = "";

    if (modalBody) {
        modalBody.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 12px; padding-top: 4px;">
                <!-- Home Club Badge -->
                <div style="text-align: center;">
                    <img src="${homeBadgeUrl}" alt="Goldenacre BC" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="this.style.display='none'">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #173b32; margin-top: 4px;">Goldenacre</div>
                </div>
                
                <!-- VS Divider -->
                <div style="font-weight: 800; font-size: 1rem; color: #64748b; font-style: italic;">VS</div>

                <!-- Opponent Club Badge with Actual Name -->
                <div style="text-align: center;">
                    <img src="${decodedOpponentBadge}" alt="${decodedOpponentName}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="this.style.display='none'">
                    <div style="font-size: 0.8rem; font-weight: 700; color: #173b32; margin-top: 4px;">${decodedOpponentName}</div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 16px;">
                <div style="font-weight: 700; color: #173b32; font-size: 0.95rem; background: #f1f5f9; display: inline-block; padding: 4px 12px; border-radius: 20px; border: 1px solid #e2e8f0;">🏆 ${decodedTeam}</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 0.9rem;">
                <p style="margin: 4px 0;"><strong>📅 Date:</strong> ${decodedDate}</p>
                <p style="margin: 4px 0;"><strong>🕒 Time:</strong> ${decodedTime}</p>
                <p style="margin: 4px 0;"><strong>📍 Venue:</strong> ${decodedLocation}</p>
            </div>
            ${decodedDesc ? `<div style="font-size: 0.92rem; color: #334155; line-height: 1.5;"><p><strong>Details:</strong></p><p>${decodedDesc.replace(/\n/g, '<br>')}</p></div>` : ''}
        `;
    }
    if (modalTag) {
        modalTag.textContent = decodedTeam;
        modalTag.className = 'news-tag badge-external';
    }
    if (globalModal && typeof globalModal.showModal === 'function') {
        globalModal.showModal();
    }
};
