function toggleMatches(button) {
    if (!button) return;

    const card = button.closest('.draw-card');
    if (!card) return;

    const isExpanded = card.classList.toggle('expanded');
    const extraCount = card.querySelectorAll('.match-row.extra-match').length;

    button.textContent = isExpanded ? '– Show Less' : '+ Show More (' + extraCount + ')';
}

function buildMatch(match, extra = false) {
    const p1Winner = match.winner === 'p1' ? 'winner' : '';
    const p2Winner = match.winner === 'p2' ? 'winner' : '';

    return `
      <li class="match-row ${extra ? 'extra-match' : ''}">
        <div class="player player-left ${p1Winner}">${match.p1}</div>
        <span class="score">${match.s1}</span>
        <span class="vs">vs</span>
        <span class="score">${match.s2}</span>
        <div class="player player-right ${p2Winner}">${match.p2}</div>
      </li>
    `;
}

function buildRound(round) {
    const visibleMatches = (round.matches || []).map(m => buildMatch(m)).join('');
    const extraMatches = (round.extra || []).map(m => buildMatch(m, true)).join('');
    const finalClass = round.name === 'Final' ? ' final-card' : '';
    const toggleBtn = round.extra && round.extra.length
        ? `<button class="toggle-more-btn" type="button" onclick="toggleMatches(this)">+ Show More (${round.extra.length})</button>`
        : '';

    return `
      <div class="draw-card${finalClass}">
        <div class="draw-card-header">
          <h3>${round.name}</h3>
          <span class="badge deadline">${round.deadline}</span>
        </div>
        <ul class="match-list">
          ${visibleMatches}
          ${extraMatches}
        </ul>
        ${toggleBtn}
      </div>
    `;
}

function buildRows(competition) {
  return (competition.rows || []).map(row => {
        const roundsHtml = (row.rounds || []).map(buildRound).join('');
        return `<div class="draws-row ${row.tier}">${roundsHtml}</div>`;
    }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('draws-root');
  if (!root) return;

  const competitions = Object.values(window.fixtureSets || {});
    const activeIndex = Math.max(0, competitions.findIndex(competition => competition.active));
    const tabsHtml = competitions.map((competition, index) => `
      <button class="tab-btn ${index === activeIndex ? 'active' : ''}" type="button" data-competition-index="${index}">${competition.label}</button>
      ${index < competitions.length - 1 ? '<span class="tab-divider">|</span>' : ''}
    `).join('');

    root.innerHTML = `
      <p class="draws-subtitle">Select a competition to view its rounds, deadlines and fixtures.</p>
      <div class="draws-tabs">${tabsHtml}</div>
      <div class="draws-stages-wrapper"></div>
    `;

    const stages = root.querySelector('.draws-stages-wrapper');
    const tabs = root.querySelectorAll('.tab-btn');

    function showCompetition(index) {
      const competition = competitions[index];
      if (!competition || !stages) return;

      tabs.forEach((tab, tabIndex) => {
        tab.classList.toggle('active', tabIndex === index);
      });
      stages.innerHTML = competition.rows && competition.rows.length
        ? buildRows(competition)
        : '<p>No draw has been added yet.</p>';
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        showCompetition(Number(tab.dataset.competitionIndex));
      });
    });

    if (competitions.length) showCompetition(activeIndex);
});
