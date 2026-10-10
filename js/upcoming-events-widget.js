document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('upcoming-events-widget');
    if (!container) return;

    try {
        // Fetch both files concurrently with cache-busting to prevent stale browser cache on reload
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

        // Helper to generate a downloadable .ics calendar data URI
        function createIcsDataUri(event) {
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

            return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
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
                isFixture: false
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
                isFixture: true
            };
        }).filter(Boolean);

        // Merge and sort chronologically
        const allEvents = [...parsedEvents, ...parsedFixtures];
        allEvents.sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter for upcoming future events and slice up to top 5 items
        const upcoming = allEvents.filter(event => event.date >= today).slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="events-empty">No upcoming events or fixtures currently listed.</p>';
            return;
        }

        // Strictly group upcoming items by date string (YYYY-MM-DD) so same-day events share ONE card
        const groupedMap = new Map();
        upcoming.forEach(event => {
            const key = event.date.toISOString().split('T')[0];
            if (!groupedMap.has(key)) {
                groupedMap.set(key, { date: event.date, events: [] });
            }
            groupedMap.get(key).events.push(event);
        });

        // Render cards with a single vertically centered date badge per calendar day
        container.innerHTML = Array.from(groupedMap.values()).map(group => {
            const monthStr = group.date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const dayNum = group.date.getDate();
            const weekdayStr = group.date.toLocaleString('en-GB', { weekday: 'short' });
            const fullDateStr = group.date.toLocaleString('en-GB', { day: 'numeric', month: 'long' });

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

                    badgeHtml = `<span class="fixture-team-badge ${badgeClass}">🏆 ${labelText}</span>`;
                }

                const icsUrl = createIcsDataUri(event);
                const safeFileTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                
                // Tight divider line when multiple events land on the same date
                const dividerStyle = idx > 0 ? 'margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e2e8f0;' : '';

                return `
                    <div style="${dividerStyle}">
                        ${badgeHtml}
                        <h3 style="margin: 0 0 1px 0; font-size: 0.98rem; line-height: 1.2;">${event.title}</h3>
                        <p class="event-time-meta" style="margin: 0 0 1px 0; font-size: 0.78rem;">📅 ${weekdayStr} ${fullDateStr} ${event.time ? '@ ' + event.time : ''}</p>
                        ${event.description ? `<p class="event-desc" style="margin: 0 0 2px 0; font-size: 0.78rem; line-height: 1.25;">${event.description}</p>` : ''}
                        <div>
                            <a href="${icsUrl}" download="${safeFileTitle}.ics" style="font-size: 0.72rem; font-weight: 700; color: #0369a1; text-decoration: none; display: inline-flex; align-items: center; gap: 3px;">
                                📥 Add to Calendar
                            </a>
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <article class="event-badge-card" style="padding: 8px 0;">
                    <div class="event-date-badge">
                        <span class="badge-month">${monthStr}</span>
                        <span class="badge-day">${dayNum}</span>
                    </div>
                    <div class="event-info-body">
                        ${eventsListHtml}
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load upcoming items:', error);
        container.innerHTML = '<p class="events-empty">Unable to load upcoming events and fixtures.</p>';
    }
});
