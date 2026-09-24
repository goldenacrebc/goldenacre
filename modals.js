// 1. ALL POP-UP CONTENT GOES HERE
const modalData = {
    "championship": {
        tag: "Club Championship",
        title: "Championship Winner",
        body: `
            <img src="photos/MT.jpg" alt="Malcolm Thomson" class="modal-img">
            <p><strong>Congratulations to Malcolm Thomson, winner of the Gents Championship!</strong></p>
            <p>Well done Malcolm beating Mark Hogg in the final to secure this year's top honor.</p>
        `
    },
    "steele": {
        tag: "Steele Trophy",
        title: "Steele Trophy Winner",
        body: `
            <img src="photos/RR_ST.jpg" alt="Rita Reid" class="modal-img" style="object-position: 50% 5% !important;">
            <p><strong>Congratulations to Rita Reid, winner of the Steele Trophy!</strong></p>
            <p>Congratulations to Rita beating Jessica Young from Craigentinny 21 - 20 in the final.</p>
        `
    },
    "ebapairs": {
        tag: "EBA Gents Knockout",
        title: "Pairs Winners",
        body: `
            <img src="photos/pairs2.png" alt="Pairs" class="modal-img" style="object-position: 50% 5% !important;">
            <p><strong>Congratulations to Malcolm Thomson and Gary Robertson</strong></p>
            <p>Congratulations to Malcolm Thomson and Gary Robertson winners of the EBA Gents knockout pairs beating Mayfield 18 -9 in the final</p>
        `
    },
    "closing-day": {
        tag: "Social Event",
        title: "Closing Day - Saturday 26th September",
        body: `
            <h3>Sign Up Now & Meal Choice</h3>
            <p>If you have signed up for the closing day meal, please add your meal choice by ticking the box on the adapted sign up sheet on the noticeboard ASAP.</p>
            <p><em>(Choose from Chicken Curry, Chilli con Carne or Vegetarian Macaroni. All come with a sweet too.)</em></p>
        `
    },
    "ladies-championship": {
        tag: "Ladies Championship",
        title: "Ladies Championship Winner",
        body: `
            <img src="photos/RR.png" alt="Ladies Champion" class="modal-img">
            <p>Congratulations to Rita Reid winner of the Ladies Championship.</p>
        `
    },
    "junior-championship": {
        tag: "Junior",
        title: "Junior Championship Winner",
        body: `
            <img src="photos/DT.jpg" alt="Daniel Taylor" class="modal-img">
            <p><strong>Junior Championship Winner</strong></p>
            <p>Congratulations to Daniel Taylor, winner of the Junior Championship. Beating Daniel Kidd in the final.</p>
        `
    },
    "membership": {
        tag: "Join Us",
        title: "Membership Options",
        body: `
            <div class="membership-modal-body">
                <p class="membership-intro">New members are always welcome! Free introductory coaching and equipment are available for beginners.</p>
                <div class="membership-grid">
                    <a href="mailto:goldenacrebc@hotmail.com?subject=Adult%20Membership%20Enquiry" class="membership-card">
                        <h3>Adult</h3>
                        <div class="adult-price-box">
                            <div class="price-split">
                                <div class="price-item">
                                    <span class="price-num">£50<span class="price-cycle">&nbsp;/ year</span></span>
                                    <span class="price-label">(New)</span>
                                </div>
                                <div class="price-item">
                                    <span class="price-num">£200<span class="price-cycle">&nbsp;/ year</span></span>
                                    <span class="price-label">(Existing)</span>
                                </div>
                            </div>
                        </div>
                        <p>Access to club, green & bar</p>
                        <div class="enquire-text">Enquire via Email &rarr;</div>
                    </a>
                    <a href="mailto:goldenacrebc@hotmail.com?subject=Junior%20Membership%20Enquiry" class="membership-card">
                        <h3>Junior</h3>
                        <div class="price">£5 <span>/ year</span></div>
                        <p>Full junior coaching & green access</p>
                        <div class="enquire-text">Enquire via Email &rarr;</div>
                    </a>
                    <a href="mailto:goldenacrebc@hotmail.com?subject=Social%20Membership%20Enquiry" class="membership-card">
                        <h3>Social</h3>
                        <div class="price">£25 <span>/ year</span></div>
                        <p>Access to club & bar facilities</p>
                        <div class="enquire-text">Enquire via Email &rarr;</div>
                    </a>
                </div>
            </div>
        `
    },
    "facilities": {
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
    },
    "hall-photos": {
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
    },
    "honours-list": {
        tag: "internal",
        title: "Competition Winners",
        body: `
            <p><strong>2026 Honours List</strong></p>
            <br />
            <p><strong>Gents Championship</strong> - Malcolm Thomson</p>
            <p><strong>Ladies Championship </strong> - Rita Reid</p>
            <p><strong>Junior Championship </strong> - Daniel Taylor</p>
            <p><strong>Gents 2 Bowl</strong> - <p>
            <hr>
            <p><strong>Gents Pairs</strong> - </p>
            <p><strong>Gents Triples </strong> - G Lamb, D Taylor, B Taylor</p>
            <p><strong>Gents Rinks </strong> - </p>
            <hr>
            <br />
            <p>More Details to follow after closing day</p>
        `
    },
    // TO ADD A NEW POP-UP: Just add a new key here!
};

// 2. MODAL CONTROLLER FUNCTIONS
function openNewsModal(key) {
    const data = modalData[key];
    if (!data) return;

    const modal = document.getElementById('global-modal');
    if (!modal) return;
    modal.classList.toggle('membership-modal', key === 'membership');

    // Inject content into the HTML modal elements
    document.getElementById('modal-tag').textContent = data.tag;
    document.getElementById('modal-title').textContent = data.title;
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = data.body;
    modal.querySelector('.modal-content').scrollTop = 0;
    modalBody.scrollTop = 0;

    modalBody.querySelectorAll('img').forEach(image => {
        image.addEventListener('error', () => {
            image.remove();
            if (!modalBody.querySelector('img') && !modalBody.querySelector('.modal-image-fallback')) {
                const fallback = document.createElement('p');
                fallback.className = 'modal-image-fallback';
                fallback.textContent = 'Hall photos are not available yet.';
                modalBody.prepend(fallback);
            }
        });
    });

    document.body.style.overflow = 'hidden';
    if (!modal.open) {
        modal.showModal();
    }
}

function closeNewsModal() {
    const modal = document.getElementById('global-modal');
    if (modal) {
        modal.close();
    }
}

function toggleMoreNews(event) {
    event.preventDefault();
    const extraItems = document.querySelectorAll('.news-item-extra');
    const button = document.getElementById('load-more-news-btn');
    const isExpanding = [...extraItems].some(item => item.classList.contains('news-hidden'));

    extraItems.forEach(item => item.classList.toggle('news-hidden', !isExpanding));
    button.innerHTML = isExpanding ? 'Show Less News &uarr;' : 'More / Archived News &darr;';
    if (!isExpanding) {
        document.getElementById('news').scrollIntoView({ behavior: 'smooth' });
    }
}

// 3. EVENT LISTENERS FOR CLOSE & BACKDROP CLICK
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('global-modal');
    if (!modal) return;

    modal.addEventListener('close', () => {
        document.body.style.overflow = '';
    });

    modal.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.close();
        }
    });
});
