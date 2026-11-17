document.addEventListener('DOMContentLoaded', () => {
    const publishedSheet = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Actu1PSn-5TSGsRxwFW64nlx2dzhvKQBhmo6wsGHEPN0gTYWSVm1cChKxuwU_CGYZLfKfJ6RbBFT/pub';
    const leagues = [
        {
            idPrefix: 'firsts',
            teamLabel: '1st XVI',
            division: 'Division 3',
            standingsTitle: 'Final standings',
            standingsGid: '572974802',
            standingsRange: 'A26:L35',
            fixturesGid: '422711259',
            fixturesRange: 'V2:AB127'
        },
        {
            idPrefix: 'seconds',
            teamLabel: '2nd XVI',
            division: 'Division 2',
            standingsTitle: 'Standings',
            standingsGid: '572974802',
            standingsRange: 'A76:L85',
            fixturesGid: '328096682',
            fixturesRange: 'L2:R127'
        }
    ];

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function parseCsv(text) {
        const rows = [];
        let row = [];
        let value = '';
        let quoted = false;

        for (let i = 0; i < text.length; i++) {
            const character = text[i];
            if (character === '"' && quoted && text[i + 1] === '"') {
                value += '"';
                i++;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === ',' && !quoted) {
                row.push(value.trim());
                value = '';
            } else if (character === '\n' && !quoted) {
                row.push(value.trim());
                rows.push(row);
                row = [];
                value = '';
            } else if (character !== '\r' || quoted) {
                value += character;
            }
        }

        if (value.length || row.length) {
            row.push(value.trim());
            rows.push(row);
        }

        if (rows[0]?.[0]?.startsWith('\uFEFF')) rows[0][0] = rows[0][0].slice(1);
        return rows;
    }

    async function fetchSheetRange(gid, range) {
        const url = `${publishedSheet}?output=csv&gid=${gid}&range=${encodeURIComponent(range)}`;
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) throw new Error(`The EBA data could not be loaded (${response.status}).`);
        const csv = await response.text();
        if (!csv.trim()) throw new Error('The EBA spreadsheet returned no data.');
        return parseCsv(csv);
    }

    function columnIndex(header, name) {
        return header.findIndex(value => value.toLowerCase() === name.toLowerCase());
    }

    function displayValue(value) {
        return value && value.trim() ? value.trim() : '—';
    }

    function updateSeasonLabels(config, state, fixturesHeading) {
        if (state.seasonYear) {
            fixturesHeading.textContent = `${config.teamLabel} ${config.division} — ${state.seasonYear} Fixtures & Results`;
        }
        if (state.standingsCaption) {
            state.standingsCaption.textContent = `${config.standingsTitle}${state.standingsWeek ? ` · ${state.standingsWeek}` : ''}${state.seasonYear ? ` · ${state.seasonYear} season` : ''}`;
        }
    }

    function renderForm(value) {
        const outcomes = Array.from(value).filter(mark => mark === '🟢' || mark === '🟠' || mark === '🔴');
        const names = { '🟢': 'win', '🟠': 'draw', '🔴': 'loss' };
        const labels = { '🟢': 'W', '🟠': 'D', '🔴': 'L' };
        const form = element('div', 'league-form');
        form.setAttribute('aria-label', outcomes.length
            ? `Recent form: ${outcomes.map(mark => names[mark]).join(', ')}`
            : 'No recent form recorded');

        outcomes.forEach(mark => {
            const badge = element('span', `league-form-item ${names[mark]}`, labels[mark]);
            badge.setAttribute('aria-hidden', 'true');
            form.append(badge);
        });

        return form;
    }

    function renderStandings(rows, config, refs, state) {
        const headerIndex = rows.findIndex(row => row.some(value => /^Week\s+\d+$/i.test(value)) && row.some(value => value.toLowerCase() === 'points'));
        if (headerIndex < 0) throw new Error('The standings header could not be found in the EBA data.');

        const header = rows[headerIndex];
        const weekColumn = header.findIndex(value => /^Week\s+\d+$/i.test(value));
        const teamColumn = weekColumn < 0 ? 2 : weekColumn;
        const columns = {
            played: columnIndex(header, 'Pld'),
            points: columnIndex(header, 'Points'),
            won: columnIndex(header, 'Won'),
            drawn: columnIndex(header, 'Drawn'),
            lost: columnIndex(header, 'Lost'),
            scored: columnIndex(header, 'For'),
            conceded: columnIndex(header, 'Against'),
            difference: columnIndex(header, 'Diff'),
            form: columnIndex(header, 'Form')
        };
        if (Object.values(columns).some(index => index < 0)) {
            throw new Error('The standings columns do not match the expected EBA format.');
        }

        const clubs = rows.slice(headerIndex + 1).filter(row => row[teamColumn]);
        if (!clubs.length) throw new Error('No clubs were found in the EBA standings data.');

        state.standingsWeek = header[weekColumn] || '';
        const scroll = element('div', 'league-standings-scroll');
        const table = element('table', 'league-standings-table');
        table.setAttribute('aria-label', `${config.teamLabel} ${config.division} standings`);
        state.standingsCaption = element('caption', '', '');

        const tableHead = document.createElement('thead');
        const headingRow = document.createElement('tr');
        ['Pos', 'Club', 'Played', 'Points', 'W–D–L', 'For–Against', 'Diff', 'Form'].forEach(label => {
            headingRow.append(element('th', '', label));
        });
        tableHead.append(headingRow);

        const tableBody = document.createElement('tbody');
        clubs.forEach((club, index) => {
            const name = club[teamColumn];
            const row = element('tr', name.toLowerCase() === 'goldenacre' ? 'goldenacre-row' : '');
            const won = displayValue(club[columns.won]);
            const drawn = displayValue(club[columns.drawn]);
            const lost = displayValue(club[columns.lost]);
            const scored = displayValue(club[columns.scored]);
            const conceded = displayValue(club[columns.conceded]);
            const difference = Number(club[columns.difference]);
            const differenceText = Number.isFinite(difference) && difference > 0
                ? `+${club[columns.difference]}`
                : displayValue(club[columns.difference]).replace('-', '−');

            [
                String(index + 1),
                name,
                displayValue(club[columns.played]),
                displayValue(club[columns.points]),
                `${won}–${drawn}–${lost}`,
                `${scored}–${conceded}`,
                differenceText
            ].forEach((value, cellIndex) => {
                const cell = element(cellIndex === 0 ? 'th' : 'td', '', value);
                if (cellIndex === 0) cell.setAttribute('scope', 'row');
                row.append(cell);
            });

            const formCell = document.createElement('td');
            formCell.append(renderForm(club[columns.form] || ''));
            row.append(formCell);
            tableBody.append(row);
        });

        table.append(state.standingsCaption, tableHead, tableBody);
        scroll.append(table);
        refs.standingsView.replaceChildren(scroll);
        refs.standingsStatus.textContent = '';
        updateSeasonLabels(config, state, refs.fixturesHeading);
    }

    function parseSheetDate(value) {
        const match = value.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
        if (!match) return '';

        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const month = months.indexOf(match[2].slice(0, 3).toLowerCase());
        if (month < 0) return '';

        const date = new Date(Number(match[3]), month, Number(match[1]), 12);
        if (date.getFullYear() !== Number(match[3]) || date.getMonth() !== month || date.getDate() !== Number(match[1])) return '';
        return `${match[3]}-${String(month + 1).padStart(2, '0')}-${String(match[1]).padStart(2, '0')}`;
    }

    function createFixtureCard(fixture) {
        const card = element('article', 'first-team-fixture-card');
        const header = element('div', 'first-team-fixture-header');
        header.append(
            element('span', 'first-team-week', fixture.week),
            element('time', '', `${fixture.date}${fixture.time ? ` · ${fixture.time}` : ''}`)
        );
        const scoreline = element('div', 'first-team-scoreline');
        const homeSide = element('div', 'first-team-fixture-side home');
        homeSide.append(
            element('strong', '', fixture.homeTeam),
            element('small', '', `Home · Rink ${fixture.homeRink || '—'}`)
        );
        const awaySide = element('div', 'first-team-fixture-side away');
        awaySide.append(
            element('strong', '', fixture.awayTeam),
            element('small', '', `Away · Rink ${fixture.awayRink || '—'}`)
        );

        const score = fixture.hasScore
            ? element('div', 'first-team-score', `${fixture.homeScore} – ${fixture.awayScore}`)
            : element('div', 'first-team-score pending', 'vs');
        scoreline.append(homeSide, score, awaySide);

        const meta = element('div', 'first-team-fixture-meta');
        const result = element('span', `first-team-result ${fixture.result.toLowerCase()}`, fixture.result);
        meta.append(result);
        card.append(header, scoreline, meta);

        const dateTime = parseSheetDate(fixture.date);
        if (dateTime) header.querySelector('time').dateTime = dateTime;
        return card;
    }

    function renderFixtures(rows, config, refs, state) {
        const fixtures = [];
        let weekInfo = null;

        rows.forEach(row => {
            const weekMatch = (row[0] || '').match(/^Week\s+(\d+)$/i);
            if (weekMatch) {
                weekInfo = {
                    week: `Week ${weekMatch[1]}`,
                    date: row[1] || '',
                    time: row[6] || ''
                };
                const yearMatch = weekInfo.date.match(/\b(20\d{2})\b/);
                if (yearMatch) state.seasonYear = yearMatch[1];
                return;
            }

            if (!weekInfo || (row[0] || '').toLowerCase() !== 'goldenacre') return;

            const home = (row[3] || '').toLowerCase() === 'vs';
            const teamScore = row[2] === '' || row[2] === undefined ? null : Number(row[2]);
            const opponentScore = row[4] === '' || row[4] === undefined ? null : Number(row[4]);
            const hasScore = Number.isFinite(teamScore) && Number.isFinite(opponentScore);
            const opponent = row[6] || 'Opponent';
            let result = 'Fixture';

            if (hasScore) {
                result = teamScore === opponentScore ? 'Draw' : teamScore > opponentScore ? 'Win' : 'Loss';
            }

            fixtures.push({
                week: weekInfo.week,
                date: weekInfo.date,
                time: weekInfo.time,
                homeTeam: home ? 'Goldenacre' : opponent,
                awayTeam: home ? opponent : 'Goldenacre',
                homeRink: home ? row[1] : row[5],
                awayRink: home ? row[5] : row[1],
                homeScore: home ? teamScore : opponentScore,
                awayScore: home ? opponentScore : teamScore,
                hasScore,
                result
            });
        });

        if (!fixtures.length) {
            refs.fixturesStatus.textContent = `No ${config.teamLabel} ${config.division} fixtures were found in the EBA data.`;
            return;
        }

        const primaryList = element('div', 'first-team-fixture-list');
        fixtures.slice(0, 7).forEach(fixture => primaryList.append(createFixtureCard(fixture)));
        refs.fixturesView.replaceChildren(primaryList);

        if (fixtures.length > 7) {
            const more = document.createElement('details');
            more.className = 'league-fixture-more';
            const finalWeek = fixtures[fixtures.length - 1].week.replace('Week ', '');
            more.append(element('summary', '', `Show weeks 8–${finalWeek}`));
            const laterList = element('div', 'first-team-fixture-list');
            fixtures.slice(7).forEach(fixture => laterList.append(createFixtureCard(fixture)));
            more.append(laterList);
            refs.fixturesView.append(more);
        }

        refs.fixturesStatus.textContent = '';
        updateSeasonLabels(config, state, refs.fixturesHeading);
    }

    function initializeLeague(config) {
        const refs = {
            standingsStatus: document.getElementById(`${config.idPrefix}-standings-status`),
            standingsView: document.getElementById(`${config.idPrefix}-standings-view`),
            fixturesStatus: document.getElementById(`${config.idPrefix}-fixtures-status`),
            fixturesView: document.getElementById(`${config.idPrefix}-fixtures-view`),
            fixturesHeading: document.getElementById(`${config.idPrefix}-fixtures-heading`)
        };
        if (Object.values(refs).some(ref => !ref)) return;

        const state = { standingsWeek: '', seasonYear: '', standingsCaption: null };

        async function loadStandings() {
            try {
                renderStandings(await fetchSheetRange(config.standingsGid, config.standingsRange), config, refs, state);
            } catch (error) {
                refs.standingsStatus.className = 'league-data-status error';
                refs.standingsStatus.textContent = `${error.message} Visit the EBA website to check the source data.`;
            }
        }

        async function loadFixtures() {
            try {
                renderFixtures(await fetchSheetRange(config.fixturesGid, config.fixturesRange), config, refs, state);
            } catch (error) {
                refs.fixturesStatus.className = 'league-data-status error';
                refs.fixturesStatus.textContent = `${error.message} Visit the EBA website to check the source data.`;
            }
        }

        loadStandings();
        loadFixtures();
    }

    leagues.forEach(initializeLeague);
});
