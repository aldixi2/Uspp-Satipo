// Sección "Afiliación en cifras" + animación de aparición al hacer scroll
(function () {
  const D = window.AFILIADOS_DATA;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const sec = document.getElementById("cifras");

  if (sec && D) {
    document.getElementById("cfFecha").textContent = D.actualizado;
    const bars = (id, rows, tot) => {
      const max = Math.max(...rows.map((r) => r[1]));
      document.getElementById(id).innerHTML = rows.map((r) =>
        `<div class="cf-row"><span class="cf-name">${r[0]}</span><div class="cf-track"><i data-w="${(r[1] / max) * 100}"></i></div><span class="cf-num">${fmt(r[1])}<small>${((r[1] / tot) * 100).toFixed(1)}%</small></span></div>`).join("");
    };
    bars("cfDistritos", D.distritos || [], D.total);
    bars("cfEtareo", D.etareo || [], D.total);

    const run = () => {
      sec.querySelectorAll("[data-cf]").forEach((n) => {
        const to = D[n.dataset.cf] || 0, t0 = performance.now();
        if (reduce) { n.textContent = fmt(to); return; }
        (function tick(now) {
          const t = Math.min((now - t0) / 1800, 1);
          n.textContent = fmt(to * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)));
          if (t < 1) requestAnimationFrame(tick);
        })(t0);
      });
      sec.querySelectorAll(".cf-track i").forEach((i) => (i.style.width = i.dataset.w + "%"));
    };
    new IntersectionObserver((es, ob) => { if (es[0].isIntersecting) { run(); ob.disconnect(); } }, { threshold: 0.25 }).observe(sec);
  }

  // Aparición suave de tarjetas y títulos
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-reveal");
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    document.querySelectorAll(".info-card,.section-header,.cf-kpi,.cf-panel,.sis-flip-card,.doc-slide").forEach((el, i) => {
      el.classList.add("rv"); el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el);
    });
  }
})();
