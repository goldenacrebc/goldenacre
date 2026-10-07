window.modalData = window.modalData || {};

window.modalData["championship"] = {
    tag: "Club Championship",
    title: "Championship Winner",
    body: `
        <img src="photos/MT.jpg" alt="Malcolm Thomson" class="modal-img">
        <p><strong>Congratulations to Malcolm Thomson, winner of the Gents Championship!</strong></p>
        <p>Well done Malcolm beating Mark Hogg in the final to secure this year's top honor.</p>
    `
};

window.modalData["ladies-championship"] = {
    tag: "Ladies Championship",
    title: "Ladies Championship Winner",
    body: `
        <img src="photos/RR.png" alt="Ladies Champion" class="modal-img">
        <p>Congratulations to Rita Reid winner of the Ladies Championship.</p>
    `
};

window.modalData["junior-championship"] = {
    tag: "Junior",
    title: "Junior Championship Winner",
    body: `
        <img src="photos/DT.jpg" alt="Daniel Taylor" class="modal-img">
        <p><strong>Junior Championship Winner</strong></p>
        <p>Congratulations to Daniel Taylor, winner of the Junior Championship. Beating Daniel Kidd in the final.</p>
    `
};

window.modalData["honours-list"] = {
    tag: "2026 Honours",
    title: "Internal Competition Winners",
    body: `
        <div class="honours-intro">
            <p>Congratulations to all our club competition winners.</p>
        </div>
        <section class="honours-group" aria-labelledby="honours-singles-heading">
            <div class="honours-champion">
                <span>Club Championship</span>
                <strong>Malcolm Thomson</strong>
            </div>
            <h3 id="honours-singles-heading">Singles Competitions</h3>
            <ul class="honours-list">
                <li><span>Gents 2 Bowl</span><strong>Jim Hutchinson</strong></li>
                <li><span>Tom Wilson</span><strong>Andy Kidd</strong></li>
                <li><span>Gerard Handicap</span><strong>Malcolm Thomson</strong></li>
            </ul>
        </section>
        <section class="honours-group" aria-labelledby="honours-teams-heading">
            <h3 id="honours-teams-heading">Team Competitions</h3>
            <ul class="honours-list">
                <li><span>Gents Pairs</span><strong>Malcolm Thomson / Jim Hutchison</strong></li>
                <li><span>Gents Triples</span><strong>G. Lamb, D. Taylor, B. Taylor</strong></li>
                <li><span>Gents Rinks</span><strong>G. Stafford, M. Thomson, J. Hutchison, G. Robertson</strong></li>
            </ul>
        </section>
        <section class="honours-group" aria-labelledby="honours-other-heading">
            <h3 id="honours-other-heading">Other Club Competitions</h3>
            <ul class="honours-list">
                <li><span>Ladies Championship</span><strong>Rita Reid</strong></li>
                <li><span>Junior Championship</span><strong>Daniel Taylor</strong></li>
            </ul>
        </section>
    `
};