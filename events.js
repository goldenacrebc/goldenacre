document.addEventListener('DOMContentLoaded', async () => {
    const heading = document.getElementById('calendar-heading');
    const calendarGrid = document.getElementById('calendar-grid');
    const status = document.getElementById('events-status');
    const detailDialog = document.getElementById('events-detail-dialog');
    const detailDate = document.getElementById('events-detail-date');
    const detailList = document.getElementById('events-detail-list');
    const closeDetailsButton = document.getElementById('close-events-detail');
    
    // View Switcher Elements
    const viewCalendarBtn = document.getElementById('view-calendar-btn');
    const viewListBtn = document.getElementById('view-list-btn');
    const calendarViewSection = document.getElementById('calendar-view-section');
    const listViewSection = document.getElementById('list-view-section');
    const agendaListContainer = document.getElementById('agenda-list-container');

    const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });
    const eventDateLabel = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const shortMonthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short' });

    let allCalendarItems = [];
    let displayedMonth = new Date();
    displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1);
    let currentView = 'calendar'; // 'calendar' or 'list'

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

        function parseLocalDate(dateString) {
            if (!dateString) return null;
            const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (!match) return null;
            return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }

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
                image: item.image || '',
                isFixture: false,
                type: item.type ? item.type.toLowerCase() : 'social'
            };
        }).filter(Boolean);

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
                image: '',
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

    function updateView() {
        if (heading) heading.textContent = monthLabel.format(displayedMonth);

        if (currentView === 'calendar') {
            renderCalendar();
        } else {
            renderListView();
        }
    }

    function renderCalendar() {
        if (!calendarGrid) return;
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

    function renderListView() {
        if (!agendaListContainer) return;
        agendaListContainer.replaceChildren();

        const year = displayedMonth.getFullYear();
        const month = displayedMonth.getMonth();

        const monthItems = allCalendarItems.filter(item => {
            return item.date.getFullYear() === year && item.date.getMonth() === month;
        });

        if (monthItems.length === 0) {
            agendaListContainer.innerHTML = `<p class="events-empty">No events or fixtures scheduled for ${monthLabel.format(displayedMonth)}.</p>`;
            return;
        }

        monthItems.forEach(event => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'agenda-item-card';
            card.style.cssText = 'width: 100%; text-align: left; cursor: pointer; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; display: flex; gap: 16px; align-items: flex-start; box-shadow: 0 2px 6px rgba(0,0,0,0.03); position: relative; transition: transform 0.15s ease, border-color 0.15s ease;';
            
            card.addEventListener('mouseenter', () => { card.style.transform = 'translateY(-1px)'; card.style.borderColor = '#173b32'; });
            card.addEventListener('mouseleave', () => { card.style.transform = 'none'; card.style.borderColor = '#e2e8f0'; });
            
            card.addEventListener('click', () => {
                const dayEvents = allCalendarItems.filter(e => e.date.getTime() === event.date.getTime());
                showDayEvents(event.date, dayEvents);
            });

            const monthStr = shortMonthFormat.format(event.date).toUpperCase();
            const dayNum = event.date.getDate();

            let badgeHtml = `<span class="event-pill-tag" style="background:#e0f2fe; color:#0369a1;">Event</span>`;
            if (event.isFixture) {
                badgeHtml = `<span class="event-pill-tag" style="background:#f3e8ff; color:#6b21a8;">Fixture</span>`;
            } else if (event.type === 'social') {
                badgeHtml = `<span class="event-pill-tag" style="background:#fef3c7; color:#92400e;">Social</span>`;
            }

            card.innerHTML = `
                ${badgeHtml}
                <div class="event-date-badge">
                    <span class="event-month">${monthStr}</span>
                    <span class="event-day">${dayNum}</span>
                </div>
                <div class="event-details" style="position: relative; padding-top: 6px;">
                    <h4>${event.title}</h4>
                    <div class="event-meta">
                        <span>📅 ${eventDateLabel.format(event.date)}</span>
                        <span>🕒 ${event.time || '7:00 pm'}</span>
                    </div>
                    <p>${event.description || event.location}</p>
                </div>
            `;
            agendaListContainer.append(card);
        });
    }

    // Toggle Button Event Listeners
    if (viewCalendarBtn && viewListBtn && calendarViewSection && listViewSection) {
        viewCalendarBtn.addEventListener('click', () => {
            currentView = 'calendar';
            viewCalendarBtn.classList.add('active');
            viewListBtn.classList.remove('active');
            calendarViewSection.style.display = 'block';
            listViewSection.style.display = 'none';
            updateView();
        });

        viewListBtn.addEventListener('click', () => {
            currentView = 'list';
            viewListBtn.classList.add('active');
            viewCalendarBtn.classList.remove('active');
            listViewSection.style.display = 'block';
            calendarViewSection.style.display = 'none';
            updateView();
        });
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

            let resolvedImage = event.image;
            const titleLower = event.title.toLowerCase();
            if (!resolvedImage) {
                if (titleLower.includes('amanda jane')) {
                    resolvedImage = 'photos/entertainment/amanda-jane.png';
                } else if (titleLower.includes('paris')) {
                    resolvedImage = 'photos/entertainment/paris.png';
                }
            }

            const imageBannerHtml = resolvedImage ? `
                <div style="width: 100%; max-height: 180px; overflow: hidden; border-radius: 8px; background: #0f172a; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid #cbd5e1; padding: 4px;">
                    <img src="${resolvedImage}" alt="${event.title}" style="max-width: 100%; max-height: 170px; object-fit: contain; display: block;" onerror="this.parentElement.style.display='none'">
                </div>
            ` : '';

            if (event.isFixture) {
                let opponentName = 'Opponent';
                let clubNameSlug = 'club-badge';
                if (event.title) {
                    const parts = event.title.split(/vs\.?|v\.?|-/i);
                    opponentName = parts.length > 1 ? parts[1].trim() : event.title;
                    clubNameSlug = opponentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
                }

                const badgeFolder = 'bowling_badges/';
                const badgeFileUrl = `${badgeFolder}${clubNameSlug}.png`;
                const fallbackJpg = `${badgeFolder}${clubNameSlug}.jpg`;
                const fallbackJpeg = `${badgeFolder}${clubNameSlug}.jpeg`;
                const fallbackWebp = `${badgeFolder}${clubNameSlug}.webp`;
                const homeBadgeUrl = 'logo.jpeg';
                const teamLabel = event.team ? `${event.team} Fixture` : 'Match Fixture';
                const formattedDateStr = eventDateLabel.format(date);

                let teamBadgeClass = 'tag-fixture-default';
                if (event.team === '1st 16') teamBadgeClass = 'tag-fixture-1st';
                else if (event.team === '2nd 16') teamBadgeClass = 'tag-fixture-2nd';

                const initials = opponentName.split(' ').map(w => w[0]).filter(Boolean).join('').substring(0, 3).toUpperCase();

                card.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 12px; padding-top: 4px;">
                        <div style="text-align: center;">
                            <img src="${homeBadgeUrl}" alt="Goldenacre BC" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="this.style.display='none'">
                            <div style="font-size: 0.8rem; font-weight: 700; color: #173b32; margin-top: 4px;">Goldenacre</div>
                        </div>
                        <div style="font-weight: 800; font-size: 1rem; color: #64748b; font-style: italic;">VS</div>
                        <div style="text-align: center;">
                            <img src="${badgeFileUrl}" alt="${opponentName}" style="width: 56px; height: 56px; object-fit: contain; border-radius: 50%; border: 1px solid #cbd5e1; padding: 4px; background: #f8fafc;" onerror="
                                if(this.src.endsWith('.png')) { this.src='${fallbackJpg}'; }
                                else if(this.src.endsWith('.jpg')) { this.src='${fallbackJpeg}'; }
                                else if(this.src.endsWith('.jpeg')) { this.src='${fallbackWebp}'; }
                                else if(this.src.endsWith('.webp')) { 
                                    this.onerror=null; 
                                    this.replaceWith(Object.assign(document.createElement('div'), {className:'club-badge-placeholder', innerText:'${initials}', style:'width:56px; height:56px; font-size:0.9rem; margin:0 auto; display:flex; align-items:center; justify-content:center; border-radius:50%; background:#173b32; color:#ffcc00; font-weight:bold;'}));
                                }
                            ">
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
                let badgeHtml = '';
                const truePillStyle = 'display: inline-flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;';

                if (event.type === 'rollups') {
                    badgeHtml = `<div><span style="${truePillStyle} background: #e6f4ea; color: #137333; border: 1px solid #ceead6;">🎯 Roll-up</span></div>`;
                } else if (event.type === 'coaching') {
                    badgeHtml = `<div><span style="${truePillStyle} background: #e8f0fe; color: #1a73e8; border: 1px solid #d2e3fc;">📋 Coaching</span></div>`;
                } else if (titleLower.includes('pool')) {
                    badgeHtml = `<div><span style="${truePillStyle} background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1;">🎱 Pool League</span></div>`;
                } else if (resolvedImage || titleLower.includes('amanda') || titleLower.includes('paris')) {
                    badgeHtml = `<div><span style="${truePillStyle} background: #fef3c7; color: #92400e; border: 1px solid #fde68a;">🎤 Live Entertainment</span></div>`;
                } else {
                    // Guaranteed fallback pill for Christmas Day, New Year's Day, and standard events so it never shows raw unstyled text
                    badgeHtml = `<div><span style="${truePillStyle} background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd;">📅 Event</span></div>`;
                }

                card.innerHTML = `
                    ${badgeHtml}
                    ${imageBannerHtml}
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
            updateView();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
            updateView();
        });
    }

    if (closeDetailsButton && detailDialog) {
        closeDetailsButton.addEventListener('click', () => detailDialog.close());
        detailDialog.addEventListener('click', event => {
            if (event.target === detailDialog) detailDialog.close();
        });
    }

    updateView();
});
