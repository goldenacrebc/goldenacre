document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('upcoming-events-widget');
    if (!container) return;

    try {
        // Fetch both regular events and league fixtures concurrently
        const [resEvents, resFixtures] = await Promise.all([
            fetch('events.json').catch(() => ({ ok: false })),
            fetch('fixtures.json').catch(() => ({ ok: false }))
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
                location: item.location || '',
                description: item.description || '',
                isFixture: false
            };
        }).filter(Boolean);

        // Parse fixtures (incorporating the team property like "1st 16" or "2nd 16")
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

        // Filter for upcoming future events and slice up to 5 items
        const upcoming = allEvents.filter(event => event.date >= today).slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="events-empty">No upcoming events or fixtures currently listed.</p>';
            return;
        }

        container.innerHTML = upcoming.map((event, index, arr) => {
            const monthStr = event.date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const dayNum = event.date.getDate();
            const weekdayStr = event.date.toLocaleString('en-GB', { weekday: 'short' });
            const fullDateStr = event.date.toLocaleString('en-GB', { day: 'numeric', month: 'long' });

            // Check if the previous event falls on the exact same date to hide duplicate date badges
            const prevEvent = index > 0 ? arr[index - 1] : null;
            const isSameDayAsPrevious = prevEvent && prevEvent.date.getTime() === event.date.getTime();

            // Construct title with trophy and team prefix if applicable
            let fullTitle = event.title;
            if (event.isFixture) {
                const teamPrefix = event.team ? `${event.team} Fixture: ` : 'Fixture: ';
                fullTitle = `🏆 ${teamPrefix}${event.title}`;
            }

            // If it's the same day as the previous item, render an invisible placeholder box to keep alignment clean
            const dateBadgeHtml = isSameDayAsPrevious
                ? `<div class="event-date-badge" style="visibility: hidden; opacity: 0;" aria-hidden="true"></div>`
                : `<div class="event-date-badge">
                       <span class="badge-month">${monthStr}</span>
                       <span class="badge-day">${dayNum}</span>
                   </div>`;

            return `
                <article class="event-badge-card">
                    ${dateBadgeHtml}
                    <div class="event-info-body">
                        <h3>${fullTitle}</h3>
                        <p class="event-time-meta">📅 ${weekdayStr} ${fullDateStr} ${event.time ? '@ ' + event.time : ''}</p>
                        ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                    </div>
                </article>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to load upcoming items:', error);
        container.innerHTML = '<p class="events-empty">Unable to load upcoming events and fixtures.</p>';
    }
});
