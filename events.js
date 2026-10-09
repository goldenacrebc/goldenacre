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

    try {
        const response = await fetch('events.json');
        if (!response.ok) {
            throw new Error(`Could not load events.json (${response.status}).`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('events.json must contain a JSON array of events.');
        }

        events = data.map((item, index) => {
            if (!item || typeof item !== 'object' || typeof item.title !== 'string' || !item.title.trim()) {
                throw new Error(`Event ${index + 1} needs a title.`);
            }

            const match = typeof item.date === 'string' && item.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) {
                throw new Error(`Event "${item.title}" needs a date in YYYY-MM-DD format.`);
            }

            const [, year, month, day] = match;
            const date = new Date(Number(year), Number(month) - 1, Number(day));
            if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
                throw new Error(`Event "${item.title}" has an invalid date.`);
            }

            return {
                title: item.title.trim(),
                date,
                time: typeof item.time === 'string' ? item.time.trim() : '',
                location: typeof item.location === 'string' ? item.location.trim() : '',
                description: typeof item.description === 'string' ? item.description.trim() : ''
            };
        }).sort((a, b) => a.date - b.date || a.title.localeCompare(b.title));
    } catch (error) {
        status.textContent = `Events could not be loaded: ${error.message}`;
        status.classList.add('events-status-error');
    }

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
                dayCell.setAttribute('aria-label', `${eventDateLabel.format(date)}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}. Show details.`);
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
        detailDate.textContent = eventDateLabel.format(date);
        detailList.replaceChildren();

        dayEvents.forEach(event => {
            const card = document.createElement('article');
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
            detailList.append(card);
        });

        detailDialog.showModal();
        closeDetailsButton.focus();
    }

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

            const date = document.createElement('p');
            date.className = 'upcoming-event-date';
            date.textContent = eventDateLabel.format(event.date);

            const title = document.createElement('h3');
            title.textContent = event.title;
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

    renderCalendar();
    renderUpcomingEvents();
});
