const SHOW_PUBLISHED_DRAW_SHEETS = false;

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('draws-root');
  if (!root) return;

  const competitions = window.drawSheets || [];
  const initialIndex = Math.max(0, competitions.findIndex(competition => competition.active));
  const tabs = document.createElement('div');
  tabs.className = 'draws-tabs';
  tabs.setAttribute('role', 'group');
  tabs.setAttribute('aria-label', 'Club competition draws');

  const stages = document.createElement('div');
  stages.className = 'draws-stages-wrapper';

  function showCompetition(index) {
    const competition = competitions[index];
    if (!competition) return;

    tabs.querySelectorAll('.tab-btn').forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    stages.replaceChildren();

    if (!SHOW_PUBLISHED_DRAW_SHEETS || !competition.embedUrl) {
      const message = document.createElement('p');
      message.className = 'draw-sheet-pending';
      message.setAttribute('role', 'status');
      message.textContent = `The 2027 ${competition.label} draw will appear here once it has been made and published to Google Sheets.`;
      stages.append(message);
      return;
    }

    if (!URL.canParse(competition.embedUrl)) {
      const message = document.createElement('p');
      message.className = 'draw-sheet-error';
      message.setAttribute('role', 'alert');
      message.textContent = `The published Google Sheets link for ${competition.label} is invalid.`;
      stages.append(message);
      return;
    }

    const embedUrl = new URL(competition.embedUrl);
    if (embedUrl.protocol !== 'https:' || embedUrl.hostname !== 'docs.google.com' || !embedUrl.pathname.startsWith('/spreadsheets/')) {
      const message = document.createElement('p');
      message.className = 'draw-sheet-error';
      message.setAttribute('role', 'alert');
      message.textContent = `The published Google Sheets link for ${competition.label} is invalid.`;
      stages.append(message);
      return;
    }

    const frame = document.createElement('iframe');
    frame.className = 'draw-sheet-frame';
    frame.src = embedUrl.href;
    frame.title = `${competition.label} 2027 draw`;
    frame.loading = 'lazy';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    stages.append(frame);
  }

  competitions.forEach((competition, index) => {
    const button = document.createElement('button');
    button.className = 'tab-btn';
    button.type = 'button';
    button.textContent = competition.label;
    button.addEventListener('click', () => showCompetition(index));
    tabs.append(button);

    if (index < competitions.length - 1) {
      const divider = document.createElement('span');
      divider.className = 'tab-divider';
      divider.textContent = '|';
      tabs.append(divider);
    }
  });

  const subtitle = document.createElement('p');
  subtitle.className = 'draws-subtitle';
  subtitle.textContent = 'Select a competition to view its draw.';
  root.replaceChildren(subtitle, tabs, stages);

  if (competitions.length) showCompetition(initialIndex);
});
