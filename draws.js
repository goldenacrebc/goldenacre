// Competition draw files — order determines tab order
const DRAW_FILES = [
  'draws/championship.json',
  'draws/2bowl.json',
  'draws/handicap.json',
  'draws/tomwilson.json',
  'draws/pairs.json',
  'draws/triples.json',
  'draws/rinks.json',
  'draws/mixed-pairs.json'
];

document.addEventListener('DOMContentLoaded', () => initDraws());
document.addEventListener('draws-refresh', () => initDraws());

async function initDraws() {
  const root = document.getElementById('draws-root');
  if (!root) return;

  // Load all draw JSON files in parallel
  let competitions = [];
  try {
    const results = await Promise.all(
      DRAW_FILES.map(f => fetch(f + '?t=' + Date.now()).then(r => r.ok ? r.json() : null))
    );
    competitions = results.filter(Boolean);
  } catch (err) {
    root.innerHTML = '<p class="draw-sheet-error">Could not load draw data.</p>';
    return;
  }

  if (competitions.length === 0) {
    root.innerHTML = '<p class="draw-sheet-pending">No draw data available yet.</p>';
    return;
  }

  const initialIndex = Math.max(0, competitions.findIndex(c => c.active));

  // ── Tab bar ────────────────────────────────────────────────────────────────
  const tabs = document.createElement('div');
  tabs.className = 'draws-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Club competition draws');

  // ── Stage area ─────────────────────────────────────────────────────────────
  const stages = document.createElement('div');
  stages.className = 'draws-stages-wrapper';

  // ── Render one competition ─────────────────────────────────────────────────
  function showCompetition(index) {
    const comp = competitions[index];
    if (!comp) return;

    tabs.querySelectorAll('.tab-btn').forEach((btn, i) => {
      const active = i === index;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    stages.replaceChildren();

    if (!comp.rows || comp.rows.length === 0) {
      const msg = document.createElement('p');
      msg.className = 'draw-sheet-pending';
      msg.setAttribute('role', 'status');
      msg.textContent = `The 2027 ${comp.label} draw will appear here once it has been made.`;
      stages.append(msg);
      return;
    }

    // Flatten all rounds across all tiers to track progression between rounds
    const allRounds = [];
    comp.rows.forEach(row => {
      if (row.rounds && Array.isArray(row.rounds)) {
        allRounds.push(...row.rounds);
      }
    });

    const renderedRounds = [];
    let globalRoundCounter = 0;
    comp.rows.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = `draws-row ${row.tier}`;
      
      row.rounds.forEach(round => {
        const currentRoundIdx = globalRoundCounter++;
        const isFinal = /^final$/i.test(round.name.trim());
        const card = buildCard(round, isFinal, currentRoundIdx, allRounds);
        const matchCount = (round.matches || []).length + (round.extra || []).length;
        if (matchCount > 8) card.classList.add('large-round-card');
        renderedRounds.push({ round, card, row: rowEl });
        rowEl.append(card);
      });
      stages.append(rowEl);
    });

    buildMobileRoundNavigation(stages, renderedRounds);
  }

  // On phones, show one round at a time and page through large draws.
  function buildMobileRoundNavigation(stages, rounds) {
    const controls = document.createElement('div');
    controls.className = 'mobile-round-nav';

    const roundLabel = document.createElement('label');
    roundLabel.className = 'mobile-round-label';
    roundLabel.htmlFor = 'mobile-round-select';
    roundLabel.textContent = 'Round';

    const roundSelect = document.createElement('select');
    roundSelect.className = 'mobile-round-select';
    roundSelect.id = 'mobile-round-select';
    rounds.forEach(({ round }, index) => {
      roundSelect.add(new Option(round.name, String(index)));
    });

    const pageControls = document.createElement('div');
    pageControls.className = 'mobile-game-pages';

    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.textContent = 'Previous games';

    const pageLabel = document.createElement('span');
    pageLabel.className = 'mobile-game-page-label';
    pageLabel.setAttribute('aria-live', 'polite');

    const nextButton = document.createElement('button');
    nextButton.type = 'button';
    nextButton.textContent = 'Next games';

    pageControls.append(previousButton, pageLabel, nextButton);
    controls.append(roundLabel, roundSelect, pageControls);
    stages.prepend(controls);
    stages.classList.add('mobile-round-view');

    const gamesPerPage = 8;
    let selectedRoundIndex = 0;
    let pageIndex = 0;

    function updateView() {
      const selected = rounds[selectedRoundIndex];
      if (!selected) return;

      rounds.forEach(({ card }, index) => {
        const isSelected = index === selectedRoundIndex;
        card.classList.toggle('mobile-round-active', isSelected);
      });
      const activeRow = selected.row;
      [...new Set(rounds.map(entry => entry.row))].forEach(row => {
        row.classList.toggle('mobile-round-active-row', row === activeRow);
      });

      const matchRows = Array.from(selected.card.querySelectorAll('.match-list > .match-row:not(.extra-match)'));
      const pageCount = Math.max(1, Math.ceil(matchRows.length / gamesPerPage));
      pageIndex = Math.min(pageIndex, pageCount - 1);
      const firstGameIndex = pageIndex * gamesPerPage;
      matchRows.forEach((matchRow, index) => {
        matchRow.classList.toggle('mobile-page-hidden', index < firstGameIndex || index >= firstGameIndex + gamesPerPage);
      });

      if (matchRows.length > gamesPerPage) {
        const first = firstGameIndex + 1;
        const last = Math.min(firstGameIndex + gamesPerPage, matchRows.length);
        pageLabel.textContent = `Games ${first}–${last} of ${matchRows.length}`;
        pageControls.hidden = false;
        previousButton.disabled = pageIndex === 0;
        nextButton.disabled = pageIndex >= pageCount - 1;
      } else {
        pageLabel.textContent = matchRows.length ? `${matchRows.length} game${matchRows.length === 1 ? '' : 's'}` : 'No games';
        pageControls.hidden = true;
      }
    }

    roundSelect.addEventListener('change', () => {
      selectedRoundIndex = Number(roundSelect.value);
      pageIndex = 0;
      updateView();
    });
    previousButton.addEventListener('click', () => {
      if (pageIndex > 0) { pageIndex -= 1; updateView(); }
    });
    nextButton.addEventListener('click', () => {
      pageIndex += 1;
      updateView();
    });

    updateView();
  }

  // ── Build a single round card ──────────────────────────────────────────────
  function buildCard(round, isFinal, roundIdx, allRounds) {
    const card = document.createElement('div');
    card.className = 'draw-card' + (isFinal ? ' final-card' : '');

    const header = document.createElement('div');
    header.className = 'draw-card-header';

    const title = document.createElement('h3');
    title.textContent = round.name;

    const badge = document.createElement('span');
    badge.className = 'badge deadline';
    badge.textContent = round.deadline || '';

    header.append(title, badge);
    card.append(header);

    const allMatches = [...(round.matches || [])];
    const extraMatches = round.extra || [];
    const hasScores = allMatches.concat(extraMatches).some(m => m.s1 && m.s1 !== '');

    const list = document.createElement('ul');
    list.className = 'match-list';
    list.setAttribute('role', 'list');

    allMatches.forEach((m, matchIdx) => {
      list.append(buildMatchRow(m, false, hasScores, roundIdx, matchIdx, allRounds));
    });
    extraMatches.forEach((m, matchIdx) => {
      list.append(buildMatchRow(m, true, hasScores, roundIdx, allMatches.length + matchIdx, allRounds));
    });

    card.append(list);

    if (allMatches.length > 8) {
      const collapsedRows = Array.from(list.children).slice(8);
      collapsedRows.forEach(row => row.classList.add('desktop-collapsed-match'));

      const btn = document.createElement('button');
      btn.className = 'toggle-round-games-btn';
      btn.type = 'button';
      btn.textContent = `Show ${allMatches.length - 8} more games`;
      btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('show-all-round-games');
        btn.textContent = expanded ? 'Show fewer games' : `Show ${allMatches.length - 8} more games`;
      });
      card.append(btn);
    }

    if (extraMatches.length > 0) {
      const btn = document.createElement('button');
      btn.className = 'toggle-more-btn';
      btn.type = 'button';
      const n = extraMatches.length;
      btn.textContent = `Show ${n} more match${n > 1 ? 'es' : ''}`;
      btn.addEventListener('click', () => {
        const expanded = card.classList.toggle('expanded');
        btn.textContent = expanded
          ? 'Show fewer matches'
          : `Show ${n} more match${n > 1 ? 'es' : ''}`;
      });
      card.append(btn);
    }

    return card;
  }

  // ── Build one match row with progression info ──────────────────────────────
  function buildMatchRow(match, isExtra, hasScores, roundIdx, matchIdx, allRounds) {
    const row = document.createElement('li');
    row.className = 'match-row' +
      (isExtra ? ' extra-match' : '') +
      (hasScores ? '' : ' no-scores');
    row.setAttribute('role', 'listitem');

    let p1Text = match.p1 || 'TBD';
    let p2Text = match.p2 || 'TBD';

    // Calculate feeder matches from the previous round for TBD slots
    if (roundIdx > 0) {
      const prevRound = allRounds[roundIdx - 1];
      if (prevRound) {
        // Prefer the explicit routing on the previous round. Preliminary
        // matches can feed into non-sequential slots (for example, prelim
        // match 3 may feed Last 64 match 2), so bracket arithmetic gives the
        // wrong match number for those slots.
        const feederForSlot = slot => (prevRound.matches || []).findIndex(feeder =>
          feeder.advanceTo &&
          feeder.advanceTo.round === round.name &&
          feeder.advanceTo.match === matchIdx &&
          feeder.advanceTo.slot === slot
        );
        const feedMatch1Idx = feederForSlot('p1') >= 0
          ? feederForSlot('p1')
          : matchIdx * 2;
        const feedMatch2Idx = feederForSlot('p2') >= 0
          ? feederForSlot('p2')
          : matchIdx * 2 + 1;

        if (!match.p1 || match.p1 === 'TBD') {
          p1Text = match.advanceFrom1 || `Winner of ${prevRound.name} (Match ${feedMatch1Idx + 1})`;
        }
        if (!match.p2 || match.p2 === 'TBD') {
          p2Text = match.advanceFrom2 || `Winner of ${prevRound.name} (Match ${feedMatch2Idx + 1})`;
        }
      }
    }

    const p1 = document.createElement('span');
    p1.className = 'player player-left' + (match.winner === 1 ? ' winner' : '');
    p1.textContent = p1Text;
    if (match.h1) {
      const hcp = document.createElement('span');
      hcp.className = 'handicap-value';
      hcp.textContent = `hcp ${match.h1}`;
      p1.append(hcp);
    }

    const vs = document.createElement('span');
    vs.className = 'vs';
    vs.textContent = 'v';

    const p2 = document.createElement('span');
    p2.className = 'player player-right' + (match.winner === 2 ? ' winner' : '');
    p2.textContent = p2Text;
    if (match.h2) {
      const hcp = document.createElement('span');
      hcp.className = 'handicap-value';
      hcp.textContent = `hcp ${match.h2}`;
      p2.append(hcp);
    }

    if (hasScores) {
      const s1 = document.createElement('span');
      s1.className = 'score';
      s1.textContent = match.s1 || '–';

      const s2 = document.createElement('span');
      s2.className = 'score';
      s2.textContent = match.s2 || '–';

      row.append(p1, s1, vs, s2, p2);
    } else {
      row.append(p1, vs, p2);
    }

    return row;
  }

  // ── Wire up tabs ───────────────────────────────────────────────────────────
  competitions.forEach((comp, index) => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.type = 'button';
    btn.textContent = comp.label;
    btn.addEventListener('click', () => showCompetition(index));
    tabs.append(btn);

    if (index < competitions.length - 1) {
      const divider = document.createElement('span');
      divider.className = 'tab-divider';
      divider.setAttribute('aria-hidden', 'true');
      divider.textContent = '|';
      tabs.append(divider);
    }
  });

  const subtitle = document.createElement('p');
  subtitle.className = 'draws-subtitle';
  subtitle.textContent = 'Select a competition to view its draw.';

  root.replaceChildren(subtitle, tabs, stages);
  showCompetition(initialIndex);
}
