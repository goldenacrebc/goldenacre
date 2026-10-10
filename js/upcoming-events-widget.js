document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('upcoming-events-widget');
    if (!container) return;

    try {
        // Fetch both regular events and league fixtures concurrently (matching fixtures.js paths)
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
                date: date,
                time: item.time || '',
                location: item.location || '',
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

        // Filter for upcoming future events starting from today onwards
        const upcoming = allEvents.filter(event => event.date >= today).slice(0, 5);

        if (upcoming.length === 0) {
            container.innerHTML = '<p class="events-empty">No upcoming events or fixtures currently listed.</p>';
            return;
        }

        container.innerHTML = upcoming.map(event => {
            const monthStr = event.date.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const dayNum = event.date.getDate();
            const weekdayStr = event.date.toLocaleString('en-GB', { weekday: 'short' });
            const fullDateStr = event.date.toLocaleString('en-GB', { day: 'numeric', month: 'long' });

            // Add team badge or fixture indicator tag
            let tagHtml = '';
            if (event.isFixture) {
                const teamText = event.team ? `${event.team} Fixture` : 'Fixture';
                tagHtml = `<span class="category-tag tag-social" style="margin-bottom: 6px; display: inline-block; background-color: #0369a1; color: #fff;">🏆 ${teamText}</span>`;
            }

            return `
                <article class="event-badge-card" ${event.isFixture ? 'style="border-left: 4px solid #0369a1;"' : ''}>
                    <div class="event-date-badge">
                        <span class="badge-month">${monthStr}</span>
                        <span class="badge-day">${dayNum}</span>
                    </div>
                    <div class="event-info-body">
                        ${tagHtml}
                        <h3>${event.title}</h3>
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
