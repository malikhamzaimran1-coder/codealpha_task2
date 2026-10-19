(() => {
  "use strict";

  // ---------- Data ----------
  const U = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${w}`;

  const photos = [
    { id: "1506744038136-46273834b3fb", title: "Valley at first light",  category: "nature",       size: "wide" },
    { id: "1470071459604-3b5ec3a7fe05", title: "Fog in the pines",       category: "nature",       size: "tall" },
    { id: "1477959858617-67f85cf4f1df", title: "Downtown from above",    category: "city" },
    { id: "1474511320723-9a56873867b5", title: "Red fox in the grass",   category: "animals",      size: "tall" },
    { id: "1487958449943-2429e8be8625", title: "Glass and concrete",     category: "architecture" },
    { id: "1441974231531-c6227db76b6e", title: "Sunlit forest path",     category: "nature" },
    { id: "1449824913935-59a10b8d2000", title: "Crossing at dusk",       category: "city",         size: "wide" },
    { id: "1546182990-dffeafbe841d",    title: "Lion at rest",           category: "animals" },
    { id: "1486718448742-163732cd1544", title: "Spiral stair",           category: "architecture", size: "tall" },
    { id: "1480714378408-67cf0d13bc1b", title: "City after dark",        category: "city" },
    { id: "1517849845537-4d257902454a", title: "Waiting by the door",    category: "animals" },
    { id: "1511818966892-d7d671e672a2", title: "Facade study",           category: "architecture", size: "wide" },
    { id: "1507525428034-b723cf961d3e", title: "Shoreline",              category: "nature" },
    { id: "1514565131-fce0801e5785",    title: "Skyline at blue hour",   category: "city" }
  ];

  // ---------- Elements ----------
  const gallery  = document.getElementById("gallery");
  const filters  = document.querySelectorAll(".filter");
  const countEl  = document.getElementById("count");
  const lightbox = document.getElementById("lightbox");
  const lbImg    = document.getElementById("lbImg");
  const lbCap    = document.getElementById("lbCaption");
  const lbCount  = document.getElementById("lbCounter");
  const lbPrev   = document.getElementById("lbPrev");
  const lbNext   = document.getElementById("lbNext");
  const lbClose  = document.getElementById("lbClose");

  let visible = [];        // photos in the current filter, in display order
  let current = 0;         // index inside `visible`
  let lastFocused = null;

  // Fallback so a missing image never leaves an empty tile
  const withFallback = (img, seed, w) => {
    img.addEventListener("error", () => {
      img.src = `https://picsum.photos/seed/${seed}/${w}/${Math.round(w * .75)}`;
    }, { once: true });
  };

  // ---------- Build the grid ----------
  photos.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "item" + (p.size ? ` ${p.size}` : "");
    btn.type = "button";
    btn.dataset.category = p.category;
    btn.dataset.index = i;
    btn.setAttribute("aria-label", `Open ${p.title}`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.alt = p.title;
    img.src = U(p.id, 800);
    withFallback(img, `fieldnotes${i}`, 800);

    const meta = document.createElement("span");
    meta.className = "meta";
    meta.innerHTML = `<strong>${p.title}</strong><span>${p.category}</span>`;

    btn.append(img, meta);
    btn.addEventListener("click", () => openLightbox(p));
    gallery.appendChild(btn);
  });

  const items = [...gallery.querySelectorAll(".item")];

  // ---------- Filtering ----------
  function applyFilter(cat) {
    visible = photos.filter(p => cat === "all" || p.category === cat);

    items.forEach(el => {
      const show = cat === "all" || el.dataset.category === cat;
      if (show) {
        if (el.hidden) {
          el.hidden = false;
          el.classList.add("is-hiding");          // start faded...
          requestAnimationFrame(() =>
            requestAnimationFrame(() => el.classList.remove("is-hiding"))); // ...then fade in
        } else {
          el.classList.remove("is-hiding");
        }
      } else if (!el.hidden) {
        el.classList.add("is-hiding");
        setTimeout(() => { if (el.classList.contains("is-hiding")) el.hidden = true; }, 300);
      }
    });

    countEl.textContent = `${visible.length} photo${visible.length === 1 ? "" : "s"}`;
  }

  filters.forEach(btn => btn.addEventListener("click", () => {
    filters.forEach(b => {
      const on = b === btn;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on);
    });
    applyFilter(btn.dataset.filter);
  }));

  // ---------- Lightbox ----------
  function show(index) {
    current = (index + visible.length) % visible.length;   // wrap around
    const p = visible[current];

    lbImg.classList.add("is-loading");
    const next = new Image();
    next.onload = () => {
      lbImg.src = next.src;
      lbImg.alt = p.title;
      lbImg.classList.remove("is-loading");
    };
    next.onerror = () => {
      lbImg.src = `https://picsum.photos/seed/fieldnotes${photos.indexOf(p)}/1600/1200`;
      lbImg.classList.remove("is-loading");
    };
    next.src = U(p.id, 1800);

    lbCap.textContent = p.title;
    lbCount.textContent = `${current + 1} / ${visible.length}`;

    // preload neighbours so next/prev feel instant
    [current + 1, current - 1].forEach(i => {
      new Image().src = U(visible[(i + visible.length) % visible.length].id, 1800);
    });
  }

  function openLightbox(photo) {
    lastFocused = document.activeElement;
    lightbox.hidden = false;
    show(visible.indexOf(photo));
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    document.body.classList.add("no-scroll");
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { lightbox.hidden = true; }, 300);
    if (lastFocused) lastFocused.focus();
  }

  const isOpen = () => lightbox.classList.contains("is-open");

  lbNext.addEventListener("click", () => show(current + 1));
  lbPrev.addEventListener("click", () => show(current - 1));
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", e => {
    if (e.target === lightbox) closeLightbox();           // click on the dark backdrop
  });

  document.addEventListener("keydown", e => {
    if (!isOpen()) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") show(current + 1);
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "Tab") {                            // keep focus inside the dialog
      const f = [lbClose, lbPrev, lbNext];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
  });

  // Swipe on touch screens
  let startX = null;
  lightbox.addEventListener("touchstart", e => { startX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });

  // ---------- Init ----------
  applyFilter("all");
})();
