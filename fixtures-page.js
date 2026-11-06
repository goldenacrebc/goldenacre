document.addEventListener('DOMContentLoaded', () => {
    const tabs = [...document.querySelectorAll('.fixtures-tab')];
    const count = document.getElementById('fixtures-count');
    const status = document.getElementById('fixtures-status');
    const list = document.getElementById('fixtures-list');

    if (tabs.length === 0 || !count || !status || !list) return;

    const monthLabel = new Intl.DateTimeFormat('en-GB', {
        month: 'long',
        year: 'numeric'
    });
    const fixtures = [];
    let selectedTeam = 'first';
    let skippedCount = 0;

    function getTeamCategory(team) {
        const normalizedTeam = team.trim().toLowerCase();
        if (/^(1st|first)(\s|$)/.test(normalizedTeam)) return 'first';
        if (/^(2nd|second)(\s|$)/.test(normalizedTeam)) return 'second';
        if (normalizedTeam.startsWith('senior')) return 'seniors';
        if (normalizedTeam === 'friendly') return 'friendly';
        return null;
    }

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function localDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseFixture(item) {
        if (!item || typeof item !== 'object' || typeof item.date !== 'string' || typeof item.title !== 'string') {
            return null;
        }

        const match = item.date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match || !item.title.trim()) return null;

        const [, year, month, day] = match;
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        if (
            date.getFullYear() !== Number(year) ||
            date.getMonth() !== Number(month) - 1 ||
            date.getDate() !== Number(day)
        ) {
            return null;
        }

        return {
            date,
            team: typeof item.team === 'string' && item.team.trim() ? item.team.trim() : 'Other',
            teamCategory: getTeamCategory(typeof item.team === 'string' ? item.team : ''),
            title: item.title.trim(),
            time: typeof item.time === 'string' ? item.time.trim() : '',
            location: typeof item.location === 'string' ? item.location.trim() : '',
            description: typeof item.description === 'string' ? item.description.trim() : ''
        };
    }

    function renderFixture(fixture) {
        return window.createFixtureCardElement(fixture);
    }

    function render() {
        const activeTab = tabs.find(tab => tab.dataset.team === selectedTeam);
        tabs.forEach(tab => {
            const isSelected = tab === activeTab;
            tab.setAttribute('aria-selected', String(isSelected));
            tab.tabIndex = isSelected ? 0 : -1;
        });
        if (activeTab) list.setAttribute('aria-labelledby', activeTab.id);

        const visibleFixtures = fixtures.filter(fixture => fixture.teamCategory === selectedTeam);
        list.replaceChildren();

        if (visibleFixtures.length === 0) {
            count.textContent = '';
            const teamName = activeTab ? activeTab.textContent : 'this team';
            const message = `There are no upcoming fixtures listed for ${teamName}. Please check back soon.`;
            status.className = skippedCount > 0
                ? 'fixtures-status fixtures-status-warning'
                : 'fixtures-status fixtures-status-empty';
            status.textContent = skippedCount > 0
                ? `${skippedCount} fixture ${skippedCount === 1 ? 'entry was' : 'entries were'} skipped because the date or title is invalid. ${message}`
                : message;
            return;
        }

        status.className = skippedCount > 0
            ? 'fixtures-status fixtures-status-warning'
            : 'fixtures-status';
        status.textContent = skippedCount > 0
            ? `${skippedCount} fixture ${skippedCount === 1 ? 'entry was' : 'entries were'} skipped because the date or title is invalid.`
            : '';
        count.textContent = `${visibleFixtures.length} ${visibleFixtures.length === 1 ? 'fixture' : 'fixtures'}`;

        const groups = new Map();
        visibleFixtures.forEach(fixture => {
            const key = `${fixture.date.getFullYear()}-${fixture.date.getMonth()}`;
            if (!groups.has(key)) {
                groups.set(key, {
                    date: new Date(fixture.date.getFullYear(), fixture.date.getMonth(), 1),
                    fixtures: []
                });
            }
            groups.get(key).fixtures.push(fixture);
        });

        groups.forEach(group => {
            const section = createElement('section', 'fixture-month-group');
            const heading = createElement('h3', 'fixture-month-heading', monthLabel.format(group.date));
            const monthFixtures = createElement('div', 'fixture-month-list');
            group.fixtures.forEach(fixture => monthFixtures.append(renderFixture(fixture)));
            section.append(heading, monthFixtures);
            list.append(section);
        });
    }

    async function loadFixtures() {
        status.className = 'fixtures-status';
        status.textContent = 'Loading fixtures…';
        count.textContent = '';
        list.replaceChildren();

        try {
            const response = await fetch('fixtures.json', { cache: 'no-store' });
            if (!response.ok) throw new Error(`Fixtures could not be loaded (${response.status}).`);

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('The fixtures data is not in the expected format.');

            const today = localDateString(new Date());
            const parsed = data.map(parseFixture);
            fixtures.splice(
                0,
                fixtures.length,
                ...parsed
                    .filter(fixture => fixture && localDateString(fixture.date) >= today)
                    .sort((a, b) => a.date - b.date || a.team.localeCompare(b.team))
            );

            fixtures.splice(0, fixtures.length, ...fixtures.filter(fixture => fixture.teamCategory));
            skippedCount = parsed.filter(fixture => !fixture).length;
            render();
        } catch (error) {
            status.className = 'fixtures-status fixtures-status-error';
            status.textContent = `${error.message} Please try again later.`;
            count.textContent = '';
            list.replaceChildren();
        }
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            selectedTeam = tab.dataset.team;
            render();
        });
        tab.addEventListener('keydown', event => {
            let nextIndex = index;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                nextIndex = (index + 1) % tabs.length;
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                nextIndex = (index - 1 + tabs.length) % tabs.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = tabs.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            selectedTeam = tabs[nextIndex].dataset.team;
            tabs[nextIndex].focus();
            render();
        });
    });
    loadFixtures();
});
