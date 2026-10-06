function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
}

function renderTeamSheet(root, team) {
    const fixture = document.createElement("p");
    fixture.className = "team-fixture";
    fixture.append(document.createTextNode(team.opponent));

    const venue = document.createElement("span");
    venue.className = `team-venue ${team.venue}`;
    venue.textContent = team.venue === "home" ? "Home" : "Away";
    fixture.append(venue);
    root.append(fixture);

    const rinks = document.createElement("div");
    rinks.className = "draws-row tier-1 team-rinks";

    const positions = [
        ["Lead", "lead"],
        ["Second", "second"],
        ["Third", "third"],
        ["Skip", "skip"]
    ];

    team.rinks.forEach((players, index) => {
        const card = document.createElement("div");
        card.className = "draw-card";

        const header = document.createElement("div");
        header.className = "draw-card-header";
        addTextElement(header, "h3", "", `Rink ${index + 1}`);
        card.append(header);

        const list = document.createElement("ul");
        list.className = "rink-list";

        positions.forEach(([label, key]) => {
            const row = document.createElement("li");
            row.className = "rink-row";
            addTextElement(row, "span", "rink-position", label);
            addTextElement(row, "span", "rink-player", players[key]);
            list.append(row);
        });

        card.append(list);
        rinks.append(card);
    });

    root.append(rinks);
}

document.addEventListener("DOMContentLoaded", () => {
    const roots = [
        ["firsts-team-sheet", "firsts"],
        ["seconds-team-sheet", "seconds"]
    ];

    roots.forEach(([rootId, teamId]) => {
        const root = document.getElementById(rootId);
        if (!root) return;

        const team = window.teamSheets?.[teamId];
        if (!team) {
            console.error(`Missing team sheet data for "${teamId}".`);
            return;
        }

        renderTeamSheet(root, team);
    });
});
