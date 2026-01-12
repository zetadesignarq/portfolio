/* Zeta Design — lightweight, static JS */
const projects = window.__PROJECTS__ || [];
const grid = document.getElementById("projectsGrid");

/* Mobile nav */
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    })
  );
}

/* Render project cards */
function makeCard(p) {
  const el = document.createElement("article");
  el.className = "project";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.setAttribute("aria-label", `Open project: ${p.title}`);
  el.dataset.category = p.category;

  // Card carousel images (min 2)
  const rawGallery = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.cover];
  const ensured = rawGallery.length >= 2 ? rawGallery : [rawGallery[0], rawGallery[0]];
  const cardImgs = ensured.slice(0, Math.min(ensured.length, 5));

  const imgsHtml = cardImgs
    .map(
      (src, i) =>
        `<img class="carousel__img${i === 0 ? " is-active" : ""}" src="${src}" alt="${p.title} image ${
          i + 1
        }" loading="lazy" />`
    )
    .join("");

  const dotsHtml = cardImgs
    .map(
      (_, i) =>
        `<button type="button" class="carousel__dot${i === 0 ? " is-active" : ""}" aria-label="Go to image ${
          i + 1
        }"></button>`
    )
    .join("");

  el.innerHTML = `
    <div class="project__media" aria-label="${p.title} image carousel">
      ${imgsHtml}
      <button class="carousel__btn prev" type="button" aria-label="Previous image">‹</button>
      <button class="carousel__btn next" type="button" aria-label="Next image">›</button>
      <div class="carousel__dots">${dotsHtml}</div>
    </div>
    <div class="project__body">
      <h3 class="project__title">${p.title}</h3>
      <p class="project__subtitle">${p.subtitle || ""}</p>
      <div class="project__meta">
        <span class="badge">${p.category || ""}</span>
        <span class="arrow">→</span>
      </div>
    </div>
  `;

  // Carousel behavior inside the card
  const media = el.querySelector(".project__media");
  const images = Array.from(el.querySelectorAll(".carousel__img"));
  const dots = Array.from(el.querySelectorAll(".carousel__dot"));
  const prev = el.querySelector(".carousel__btn.prev");
  const next = el.querySelector(".carousel__btn.next");
  let idx = 0;

  function setActive(nextIdx) {
    if (!images.length) return;
    idx = (nextIdx + images.length) % images.length;
    images.forEach((im, i) => im.classList.toggle("is-active", i === idx));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
  }

  if (images.length <= 1) {
    prev.style.display = "none";
    next.style.display = "none";
    const dotWrap = el.querySelector(".carousel__dots");
    if (dotWrap) dotWrap.style.display = "none";
  } else {
    prev.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActive(idx - 1);
    });
    next.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      setActive(idx + 1);
    });
    dots.forEach((d, i) =>
      d.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        setActive(i);
      })
    );

    // Click on image area advances carousel (does NOT open modal)
    media.addEventListener("click", (e) => {
      if (e.target.closest(".carousel__btn") || e.target.closest(".carousel__dot")) return;
      e.stopPropagation();
      setActive(idx + 1);
    });
  }

  // Open modal only when clicking outside carousel area
  el.addEventListener("click", (e) => {
    if (e.target && e.target.closest(".project__media")) return;
    openModal(p);
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openModal(p);
  });

  return el;
}

function render(list) {
  if (!grid) return;
  grid.innerHTML = "";
  list.forEach((p) => grid.appendChild(makeCard(p)));
}
render(projects);

/* Filters */
const chips = Array.from(document.querySelectorAll(".chip"));
chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");

    const f = chip.dataset.filter;
    if (!f || f === "all") render(projects);
    else render(projects.filter((p) => p.category === f));
  });
});

/* =========================================================
   ✅ MODAL logic (iOS/Android/Desktop robust scroll + no cut)
   ========================================================= */
const modal = document.getElementById("projectModal");
const modalTitle = document.getElementById("modalTitle");
const modalCategory = document.getElementById("modalCategory");
const modalMeta = document.getElementById("modalMeta");
const modalDesc = document.getElementById("modalDescription");
const modalMainImage = document.getElementById("modalMainImage");
const modalThumbs = document.getElementById("modalThumbs");

let lastFocus = null;
let lockedScrollY = 0;

// More robust on iOS than only overflow:hidden
function lockBodyScroll() {
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add("modal-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockBodyScroll() {
  document.body.classList.remove("modal-open");
  document.body.style.position = "";
  const top = document.body.style.top;
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  const y = top ? Math.abs(parseInt(top, 10)) : lockedScrollY;
  window.scrollTo(0, y || 0);
}

function setMainImage(src, title) {
  if (!modalMainImage) return;
  modalMainImage.src = src;
  modalMainImage.alt = `${title} image`;
}

function openModal(p) {
  if (!modal) return;
  lastFocus = document.activeElement;

  if (modalTitle) modalTitle.textContent = p.title || "";
  if (modalCategory) modalCategory.textContent = p.category || "";
  if (modalMeta) modalMeta.textContent = [p.location, p.year].filter(Boolean).join(" • ");
  if (modalDesc) modalDesc.textContent = p.description || "";

  const imgs = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.cover];
  setMainImage(imgs[0], p.title || "Project");

  if (modalThumbs) {
    modalThumbs.innerHTML = "";
    imgs.forEach((src, idx) => {
      const t = document.createElement("button");
      t.className = "thumb" + (idx === 0 ? " is-active" : "");
      t.type = "button";
      t.innerHTML = `<img src="${src}" alt="Thumbnail ${idx + 1} for ${p.title}" loading="lazy" />`;

      t.addEventListener("click", () => {
        modalThumbs.querySelectorAll(".thumb").forEach((x) => x.classList.remove("is-active"));
        t.classList.add("is-active");
        setMainImage(src, p.title || "Project");
      });

      modalThumbs.appendChild(t);
    });
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");

  lockBodyScroll();

  // focus close button (better for iOS)
  const closeBtn = modal.querySelector("[data-close]");
  if (closeBtn) closeBtn.focus();
  else modal.focus?.();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");

  unlockBodyScroll();

  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

/* Close handlers */
if (modal) {
  // Close when clicking backdrop or [data-close]
  modal.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) {
      closeModal();
      return;
    }
    // click outside panel = close
    const panel = modal.querySelector(".modal__panel");
    if (panel && !panel.contains(e.target)) closeModal();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal && modal.classList.contains("is-open")) closeModal();
});

/* Contact form — creates a mailto link (no backend needed) */
const form = document.getElementById("contactForm");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();

    const subject = encodeURIComponent(`Zeta Design — New inquiry from ${name || "Client"}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\n— Sent from zetadesign portfolio site`
    );

    window.location.href = `mailto:emilyzavalaf@gmail.com?subject=${subject}&body=${body}`;
  });
}

/* Instagram block
   Instagram no longer allows a "live grid" without the official API.
   Here we support 6 optional embeds: paste post URLs in this array. */
const instagramPosts = [
  "https://www.instagram.com/p/DLSx3U9v0Uw/",
  "https://www.instagram.com/p/DLBMEAOPLay/",
  "https://www.instagram.com/p/DN4IhQYEYb-/?img_index=1",
];

const igGrid = document.getElementById("igGrid");
if (igGrid) {
  if (instagramPosts.length) {
    igGrid.innerHTML = "";
    instagramPosts.slice(0, 6).forEach((url) => {
      const cell = document.createElement("div");
      cell.className = "ig__cell";
      cell.innerHTML = `
        <blockquote class="instagram-media ig__embed" data-instgrm-permalink="${url}" data-instgrm-version="14"></blockquote>
      `;
      igGrid.appendChild(cell);
    });

    if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
      window.instgrm.Embeds.process();
    }
  } else {
    igGrid.innerHTML = "";
    for (let i = 0; i < 6; i++) {
      const cell = document.createElement("div");
      cell.className = "ig__cell";
      cell.innerHTML = `<div class="ig__placeholder">
        Add an Instagram post URL in <strong>script.js</strong><br/>
        to render an embed here.
      </div>`;
      igGrid.appendChild(cell);
    }
  }
}
