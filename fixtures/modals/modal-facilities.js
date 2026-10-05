window.modalData = window.modalData || {};

window.modalData["facilities"] = {
    tag: "Facilities",
    title: "Our Facilities",
    body: `
        <div class="facility-block">
            <img src="photos/bowls.jpeg" alt="Outdoor Bowling Green" class="modal-img">
            <span class="img-label">Outdoor Bowling Green</span>
            <p>Enjoy our pristine outdoor green for competitive league matches, club competitions, and social roll-ups.</p>
        </div>
        <hr class="modal-divider">
        <div class="facility-block">
            <img src="photos/hall.jpg" alt="Clubhouse Function Hall" class="modal-img">
            <span class="img-label">Function Hall</span>
            <p>Our hall holds up to 80 people and is available for hire for private events and functions. Bar facilities are available on request.</p>
            <p><a href="#" onclick="openNewsModal('hall-photos'); return false;" class="text-link">View more photos of the hall &rarr;</a></p>
            <p>To check hall availability, please <a href="mailto:goldenacrebc@hotmail.com" class="hall-link">contact us</a>.</p>
            <p class="hall-hire-subtext"><small><strong>** No 18th or 21st Birthday parties **</strong></small></p>
            <p class="hall-hire-subtext"><small><strong>** Please note the club does not offer catering **</strong></small></p>
        </div>
    `
};

window.modalData["hall-photos"] = {
    tag: "Gallery",
    title: "Function Hall Photos",
    body: `
        <div class="hall-gallery-grid">
            <img src="photos/hall1.jpg" alt="Hall Interior View 1" class="modal-img">
            <img src="photos/hall2.jpg" alt="Hall Interior View 2" class="modal-img">
            <img src="photos/hall3.jpg" alt="Hall Bar Area" class="modal-img">
        </div>
        <p style="margin-top: 16px;"><a href="#" onclick="openNewsModal('facilities'); return false;" class="text-link">&larr; Back to Facilities</a></p>
    `
};