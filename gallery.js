document.addEventListener("DOMContentLoaded", () => {
    const categoryMenu = document.querySelector(".gallery-category-menu");
    const categoryButtons = [...document.querySelectorAll("[data-open-category]")];
    const categoryCounts = document.querySelectorAll(".gallery-category-count");
    const photosView = document.querySelector(".gallery-photos");
    const heading = document.querySelector(".gallery-category-heading");
    const backButton = document.querySelector(".gallery-back");
    const cards = [...document.querySelectorAll(".gallery-card")];
    const galleryGroups = [...document.querySelectorAll("[data-gallery-group]")];
    const count = document.querySelector(".gallery-count");
    const dialog = document.querySelector(".gallery-lightbox");
    const lightboxImage = document.querySelector(".gallery-lightbox-image");
    const lightboxCaption = document.querySelector(".gallery-lightbox-caption");
    const closeButton = document.querySelector(".gallery-close");
    const previousButton = document.querySelector(".gallery-previous");
    const nextButton = document.querySelector(".gallery-next");
    let visibleCards = [];
    let currentIndex = 0;

    const getCards = (category) => cards.filter((card) => (
        category === "all" || card.dataset.category === category
    ));

    const openCategory = (category) => {
        visibleCards = getCards(category);
        cards.forEach((card) => {
            card.hidden = !visibleCards.includes(card);
        });
        galleryGroups.forEach((group) => {
            const groupCategory = group.dataset.galleryGroup;
            group.hidden = category === "green"
                ? groupCategory !== "green"
                : category === "competition"
                    ? groupCategory === "green"
                    : false;
        });

        const selectedButton = categoryButtons.find((button) => button.dataset.openCategory === category);
        heading.textContent = selectedButton.querySelector("strong")?.textContent || "All photos";
        count.textContent = `${visibleCards.length} ${visibleCards.length === 1 ? "photo" : "photos"}`;
        categoryMenu.hidden = true;
        photosView.hidden = false;
        backButton.focus();
    };

    categoryCounts.forEach((categoryCount) => {
        const photoCount = getCards(categoryCount.dataset.countCategory).length;
        categoryCount.textContent = `${photoCount} ${photoCount === 1 ? "photo" : "photos"}`;
    });

    categoryButtons.forEach((button) => {
        button.addEventListener("click", () => openCategory(button.dataset.openCategory));
    });

    backButton.addEventListener("click", () => {
        photosView.hidden = true;
        categoryMenu.hidden = false;
        categoryButtons[0].focus();
    });

    const showPhoto = (index) => {
        currentIndex = (index + visibleCards.length) % visibleCards.length;
        const card = visibleCards[currentIndex];
        lightboxImage.src = card.dataset.full;
        lightboxImage.alt = card.querySelector("img").alt;
        lightboxCaption.textContent = card.dataset.caption;
    };

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            showPhoto(visibleCards.indexOf(card));
            dialog.showModal();
            closeButton.focus();
        });
    });

    closeButton.addEventListener("click", () => dialog.close());
    previousButton.addEventListener("click", () => showPhoto(currentIndex - 1));
    nextButton.addEventListener("click", () => showPhoto(currentIndex + 1));

    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (!dialog.open) {
            return;
        }

        if (event.key === "ArrowLeft") {
            showPhoto(currentIndex - 1);
        } else if (event.key === "ArrowRight") {
            showPhoto(currentIndex + 1);
        }
    });
});
