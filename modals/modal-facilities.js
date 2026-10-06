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
            <span class="img-label">Pool Table</span>
            <p>Our clubhouse pool table hosts a fortnightly Monday night pool league. Everyone is welcome.</p>
        </div>
        <hr class="modal-divider">
        <div class="facility-block">
            <img src="photos/hall.jpg" alt="Clubhouse Function Hall" class="modal-img">
            <span class="img-label">Function Hall</span>
            <p>Our function hall accommodates up to 80 people and is available to hire for private events. Bar facilities are available on request. <strong>Please note that we do not provide catering and cannot accept bookings for 18th or 21st birthday parties.</strong> To check hall availability, please <a href="mailto:goldenacrebc@hotmail.com" class="hall-link">contact us</a>.</p>
            <p><a href="#" onclick="openNewsModal('hall-photos'); return false;" class="hall-photos-button">View Hall Photos</a></p>
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