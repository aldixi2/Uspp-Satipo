// ============ USPP SATIPO — Pantalla de entrada: total de afiliados ============
// Cifras desde assets/data/afiliados-data.js (generado con actualizar_cifras.py).
const AFILIADOS = Object.assign({ total: 161208, actualizado: "07/10/2026" }, window.AFILIADOS_DATA || {});

(function () {
  const el = document.getElementById("splash");
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => Math.round(n).toLocaleString("en-US");

  let seen = false;
  try { seen = sessionStorage.getItem("uspp_splash") === "1"; } catch (e) {}
  if (seen) { el.remove(); window.dispatchEvent(new Event("splash:done")); return; }

  document.body.style.overflow = "hidden";
  const num = el.querySelector("#spNumber");
  el.querySelector("#spUpdated").textContent = AFILIADOS.actualizado;

  let closed = false, timerId;
  function close() {
    if (closed) return;
    closed = true; clearTimeout(timerId);
    try { sessionStorage.setItem("uspp_splash", "1"); } catch (e) {}
    el.classList.add("leaving");
    document.body.style.overflow = "";
    setTimeout(() => { el.remove(); window.dispatchEvent(new Event("splash:done")); }, 700);
  }

  if (reduce) num.textContent = fmt(AFILIADOS.total);
  else {
    const t0 = performance.now() + 400;
    (function tick(now) {
      const t = Math.min(Math.max((now - t0) / 2400, 0), 1);
      num.textContent = fmt(AFILIADOS.total * (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)));
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const AUTO = reduce ? 3500 : 5000;
  const bar = el.querySelector("#spTimer i");
  if (bar && !reduce) bar.animate([{ width: "0%" }, { width: "100%" }], { duration: AUTO, easing: "linear", fill: "forwards" });
  timerId = setTimeout(close, AUTO);

  el.querySelector("#spEnter").addEventListener("click", close);
  el.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  el.querySelector("#spEnter").focus({ preventScroll: true });
})();
