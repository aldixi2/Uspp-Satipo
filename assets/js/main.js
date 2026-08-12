// ============ USPP SATIPO — comportamiento compartido ============

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// ---- Loader ----
window.addEventListener("load", () => {
  const l = document.getElementById("loader");
  if (!l) return;
  l.style.opacity = "0";
  setTimeout(() => (l.style.display = "none"), 500);
});

// ---- Menú móvil ----
(function initMobileNav() {
  const burger = document.getElementById("navBurger");
  const panel = document.getElementById("mobilePanel");
  const scrim = document.getElementById("mobileScrim");
  if (!burger || !panel || !scrim) return;
  function toggle(open) {
    burger.classList.toggle("open", open);
    panel.classList.toggle("open", open);
    scrim.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", () => toggle(!panel.classList.contains("open")));
  scrim.addEventListener("click", () => toggle(false));
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggle(false)));
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggle(false);
  });
})();

// ---- Reloj de horario ----
(function clock() {
  function update() {
    const now = new Date();
    const t = document.getElementById("scheduleTime");
    const d = document.getElementById("scheduleDate");
    if (t) t.textContent = new Intl.DateTimeFormat("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(now);
    if (d) d.textContent = new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(now).toUpperCase();
  }
  if (document.getElementById("scheduleTime")) {
    update();
    setInterval(update, 1000);
  }
})();

// ---- Modal de anuncio ----
(function initModal() {
  const overlay = document.getElementById("announcementModal");
  if (!overlay) return;
  const btnClose = document.getElementById("modalClose");
  const btnOk = document.getElementById("modalOk");

  window.addEventListener("load", () => {
    setTimeout(() => {
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    }, 800);
  });

  function closeModal() {
    overlay.classList.remove("show");
    document.body.style.overflow = "";
    const video = overlay.querySelector("video");
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnOk) btnOk.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && overlay.classList.contains("show")) closeModal(); });
})();

// ---- Slider de documentos ----
(function initDocSlider() {
  document.addEventListener("DOMContentLoaded", () => {
    const section = document.getElementById("documentos");
    if (!section) return;
    const slider = section.querySelector(".doc-slider");
    const btnLeft = section.querySelector(".slider-btn.left");
    const btnRight = section.querySelector(".slider-btn.right");
    const dotsWrap = document.getElementById("docDots");
    const slides = slider ? Array.from(slider.querySelectorAll(".doc-slide")) : [];
    if (!slider || !btnLeft || !btnRight || !slides.length || !dotsWrap) return;
    const getStep = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(slider).gap || "16");
    const goBy = (px) => { try { slider.scrollBy({ left: px, behavior: "smooth" }); } catch (e) { slider.scrollLeft += px; } };
    btnLeft.addEventListener("click", () => goBy(-getStep()));
    btnRight.addEventListener("click", () => goBy(getStep()));
    const setActiveDot = (idx) => Array.from(dotsWrap.querySelectorAll(".dot")).forEach((d, i) => d.classList.toggle("active", i === idx));
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const d = document.createElement("button");
      d.className = "dot" + (i === 0 ? " active" : "");
      d.type = "button";
      d.setAttribute("aria-label", "Ir a documento " + (i + 1));
      d.addEventListener("click", () => { slider.scrollTo({ left: i * getStep(), behavior: "smooth" }); setActiveDot(i); });
      dotsWrap.appendChild(d);
    });
    let ticking = false;
    slider.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setActiveDot(Math.max(0, Math.min(Math.round(slider.scrollLeft / getStep()), slides.length - 1))); ticking = false; });
    }, { passive: true });
    let auto = setInterval(() => goBy(getStep()), 5000);
    slider.addEventListener("mouseenter", () => { clearInterval(auto); auto = null; });
    slider.addEventListener("mouseleave", () => { if (!auto) auto = setInterval(() => goBy(getStep()), 5000); });
  });
})();

// ---- Tarjetas SIS (flip) ----
document.addEventListener("click", (e) => {
  const c = e.target.closest(".sis-flip-card[data-href]");
  if (c) window.open(c.getAttribute("data-href"), "_blank", "noopener");
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const c = e.target.closest(".sis-flip-card[data-href]");
  if (c) { e.preventDefault(); window.open(c.getAttribute("data-href"), "_blank", "noopener"); }
});

// ---- Lightbox genérico (galería) ----
(function initLightbox() {
  const lb = document.getElementById("lightbox");
  if (!lb) return;
  const lbImg = document.getElementById("lbImg");
  const lbTitle = document.getElementById("lbTitle");
  document.querySelectorAll("[data-lightbox]").forEach((c) => {
    c.addEventListener("click", () => {
      lbImg.src = c.dataset.img || "";
      lbTitle.textContent = c.dataset.title || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    });
  });
  function closeLB() { lb.classList.remove("open"); lbImg.src = ""; document.body.style.overflow = ""; }
  const closeBtn = document.getElementById("lbClose");
  if (closeBtn) closeBtn.addEventListener("click", closeLB);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLB(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLB(); });
})();
