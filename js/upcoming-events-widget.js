document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('upcoming-events-widget');
    if (!container) return;

    try {
        const response = await fetch('events.json');
        if (!response.ok) return;

        const data = await response.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Parse and sort events
        const events = data
            .map(item => {
                const match = item.date && item.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (!match) return null;
                const [, y, m, d] = match;
                return { ...item, parsedDate: new Date(Number(y), Number(m) - 1, Number(d)) };
            })
            .filter(item => item && item.parsedDate >= today)
            .sort((a, b) => a.parsedDate - b.parsedDate)
            .slice(0, 3); // Display top 3 upcoming events

        if (events.length === 0) {
            container.innerHTML = '<p class="events-empty">No upcoming social events currently listed.</p>';
            return;
        }

        container.innerHTML = events.map(event => {
            const monthStr = event.parsedDate.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
            const dayNum = event.parsedDate.getDate();
            const weekdayStr = event.parsedDate.toLocaleString('en-GB', { weekday: 'short' });
            const fullDateStr = event.parsedDate.toLocaleString('en-GB', { day: 'numeric', month: 'long' });

            return `
                <article class="event-badge-card">
                    <div class="event-date-badge">
                        <span class="badge-month">${monthStr}</span>
                        <span class="badge-day">${dayNum}</span>
                    </div>
                    <div class="event-info-body">
                        <h3>${event.title}</h3>
                        <p class="event-time-meta">
                            📅 ${weekdayStr} ${fullDateStr} ${event.time ? '@ ' + event.time : ''}
                        </p>
                        ${event.description ? `<p class="event-desc">${event.description}</p>` : ''}
                    </div>
                </article>
            `;
        }).join('');

    } catch (e) {
        console.warn('Could not load upcoming events widget:', e);
    }
});
