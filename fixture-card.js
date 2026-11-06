(function () {
    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text) element.textContent = text;
        return element;
    }

    function getOpponentDetails(fixture) {
        const sides = fixture.title.match(/^(.*?)\s+(?:v(?:s)?\.?|[-–—])\s+(.*?)$/i);
        const venueIsHome = /goldenacre/i.test(fixture.location || '');

        if (sides) {
            const homeSide = sides[1].trim();
            const awaySide = sides[2].trim();
            if (/goldenacre/i.test(homeSide)) {
                return { name: awaySide || 'Opponent', venue: 'Home' };
            }
            if (/goldenacre/i.test(awaySide)) {
                return { name: homeSide || 'Opponent', venue: 'Away' };
            }
            return { name: awaySide || homeSide || 'Opponent', venue: venueIsHome ? 'Home' : 'Away' };
        }

        return { name: fixture.title || 'Opponent', venue: venueIsHome ? 'Home' : 'Away' };
    }

    function createOpponentBadge(opponentName, preferredBadgeUrl) {
        const slug = opponentName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const baseUrl = preferredBadgeUrl || `bowling_badges/${slug}.png`;
        const extension = baseUrl.match(/\.(png|jpg|jpeg|webp)$/i);
        const extensions = ['png', 'jpg', 'jpeg', 'webp'];
        const startIndex = extension ? extensions.indexOf(extension[1].toLowerCase()) : 0;
        const badgeBase = extension ? baseUrl.slice(0, -extension[0].length) : baseUrl;
        const image = document.createElement('img');
        let extensionIndex = startIndex;

        image.className = 'fixture-opponent-image';
        image.alt = `${opponentName} badge`;
        image.addEventListener('load', () => {
            const card = image.closest('.fixture-card');
            if (!card) return;
            card.style.setProperty('--fixture-opponent-watermark', `url("${image.currentSrc || image.src}")`);
            card.classList.add('has-opponent-watermark');
        });
        image.src = `${badgeBase}.${extensions[extensionIndex]}`;
        image.addEventListener('error', () => {
            extensionIndex += 1;
            if (extensionIndex < extensions.length) {
                image.src = `${badgeBase}.${extensions[extensionIndex]}`;
                return;
            }

            const initials = opponentName
                .split(' ')
                .map(word => word[0])
                .filter(Boolean)
                .join('')
                .substring(0, 3)
                .toUpperCase();
            const placeholder = createElement('span', 'fixture-opponent-placeholder', initials);
            placeholder.setAttribute('role', 'img');
            placeholder.setAttribute('aria-label', `${opponentName} badge unavailable`);
            const card = image.closest('.fixture-card');
            if (card) {
                card.classList.remove('has-opponent-watermark');
                card.style.removeProperty('--fixture-opponent-watermark');
            }
            image.replaceWith(placeholder);
        });

        return image;
    }

    function getFixtureDate(date) {
        if (date instanceof Date && !Number.isNaN(date.getTime())) return date;
        if (typeof date === 'string') {
            const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match) {
                const [, year, month, day] = match;
                const parsedDate = new Date(Number(year), Number(month) - 1, Number(day));
                if (
                    parsedDate.getFullYear() === Number(year) &&
                    parsedDate.getMonth() === Number(month) - 1 &&
                    parsedDate.getDate() === Number(day)
                ) {
                    return parsedDate;
                }
            }
            const parsedDate = new Date(date);
            if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
        }
        throw new TypeError('Fixture card requires a valid date.');
    }

    window.createFixtureCardElement = function (fixture, options = {}) {
        const opponent = getOpponentDetails(fixture);
        const date = getFixtureDate(fixture.date);
        const dateLabel = options.dateLabel || new Intl.DateTimeFormat('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
        const card = createElement('article', `fixture-card${options.popup ? ' fixture-popup-card' : ''}`);
        const dateElement = createElement('div', 'fixture-date');
        const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(date);
        dateElement.setAttribute('aria-label', dateLabel);
        dateElement.append(
            createElement('span', 'fixture-date-month', month),
            createElement('strong', 'fixture-date-day', String(date.getDate())),
            createElement('span', 'fixture-date-weekday', new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(date))
        );

        const details = createElement('div', 'fixture-details');
        const info = createElement('div', 'fixture-info');
        const heading = createElement('div', 'fixture-card-heading');
        heading.append(
            createElement('h3', '', opponent.name),
            createElement('span', 'fixture-home-away', opponent.venue)
        );
        info.append(heading);

        const metadata = createElement('div', 'fixture-metadata');
        if (fixture.time) metadata.append(createElement('span', 'fixture-time', fixture.time));
        if (fixture.location) metadata.append(createElement('span', 'fixture-location', fixture.location));
        info.append(metadata);

        if (fixture.description) info.append(createElement('p', 'fixture-description', fixture.description));
        const opponentBadge = createElement('div', 'fixture-opponent');
        opponentBadge.append(createOpponentBadge(opponent.name, options.badgeUrl));

        details.append(info, opponentBadge);
        card.append(dateElement, details);
        const badgeImage = opponentBadge.querySelector('.fixture-opponent-image');
        if (badgeImage && badgeImage.complete && badgeImage.naturalWidth > 0) {
            card.style.setProperty('--fixture-opponent-watermark', `url("${badgeImage.currentSrc || badgeImage.src}")`);
            card.classList.add('has-opponent-watermark');
        }
        return card;
    };
})();
