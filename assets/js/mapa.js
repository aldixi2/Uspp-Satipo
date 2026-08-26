// ============ Mapa de Establecimientos — USPP Satipo ============

let TODOS = [];
let MAPA = null;
let MARCADORES = new Map(); // nombre+lat -> {marker, data}
let MARKER_ACTIVO = null;

/**
 * Capa base con respaldo automático.
 * Los proveedores de tiles "gratis" (CARTO, Esri, etc.) cambian sus políticas
 * sin avisar y a veces empiezan a pedir API key de la nada (ya nos pasó una vez).
 * Por eso: probamos primero un estilo gris claro y minimalista (bonito, a juego
 * con la marca), pero si en los primeros segundos vemos que varios tiles fallan
 * en cargar (403, "API key required", etc.), cambiamos solo — sin intervención —
 * a OpenStreetMap estándar, que es 100% gratis y sin llave, así el mapa NUNCA
 * se queda roto para quien lo visite.
 */
function agregarCapaBaseConRespaldo(mapa){
  const PRINCIPAL = {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    opciones: {
      attribution: '&copy; <a href="https://www.esri.com">Esri</a> — Light Gray Canvas, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 16
    }
  };
  const RESPALDO = {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    opciones: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }
  };

  let fallosDeTeja = 0;
  let yaCambio = false;
  const UMBRAL_FALLOS = 3; // si 3+ tiles fallan al inicio, algo anda mal con el proveedor

  const capaPrincipal = L.tileLayer(PRINCIPAL.url, PRINCIPAL.opciones);

  capaPrincipal.on("tileerror", () => {
    fallosDeTeja++;
    if (fallosDeTeja >= UMBRAL_FALLOS && !yaCambio){
      yaCambio = true;
      console.warn("Mapa: el proveedor principal de tiles está fallando, cambiando a OpenStreetMap de respaldo.");
      mapa.removeLayer(capaPrincipal);
      L.tileLayer(RESPALDO.url, RESPALDO.opciones).addTo(mapa);
    }
  });

  capaPrincipal.addTo(mapa);
}

const COLOR_POR_CLASIFICACION = {
  "Puesto de Salud": "var(--river-bright)",
  "Centro de Salud": "var(--achiote-bright)",
  "Centro de Salud (con camas)": "var(--achiote-bright)",
  "Hospital": "var(--ink)",
  "Oficina administrativa": "var(--gold-bright)"
};

function colorDe(item){
  if (item.es_punto_digitacion) return "#E49C30";
  const map = {
    "Puesto de Salud": "#4A90CC",
    "Centro de Salud": "#CC3054",
    "Centro de Salud (con camas)": "#CC3054",
    "Hospital": "#25232A",
    "Oficina administrativa": "#E49C30"
  };
  return map[item.clasificacion] || "#65626A";
}

function iconoPara(item){
  const color = colorDe(item);
  const esPunto = item.es_punto_digitacion;
  const size = esPunto ? 22 : 13;
  const cls = esPunto ? "marker-punto" : "marker-normal";
  return L.divIcon({
    className: "",
    html: `<div class="${cls}" style="width:${size}px;height:${size}px;background:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
}

function esc(s){
  return String(s==null?"":s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function popupHTML(item){
  const badgeColor = item.es_punto_digitacion
    ? "background:#FBEACB;color:#7A4D0A"
    : "background:#E4EEF3;color:#1B4A6E";
  const badgeTexto = item.es_punto_digitacion ? "⭐ Punto de digitación" : item.clasificacion;
  return `
    <div class="lp-band"></div>
    <div class="lp-body">
      <span class="lp-badge" style="${badgeColor}">${esc(badgeTexto)}</span>
      <div class="lp-nombre">${esc(item.nombre)}</div>
      ${item.es_punto_digitacion && item.etiqueta_punto ? `<div style="font-size:.72rem;color:var(--stone);margin-bottom:.4rem">${esc(item.etiqueta_punto)}</div>` : ""}
      <div class="lp-fila"><b>Distrito</b><span>${esc(item.distrito)}</span></div>
      ${item.direccion ? `<div class="lp-fila"><b>Dirección</b><span>${esc(item.direccion)}</span></div>` : ""}
      ${item.microrred ? `<div class="lp-fila"><b>Microrred</b><span>${esc(item.microrred)}</span></div>` : ""}
      ${item.categoria ? `<div class="lp-fila"><b>Categoría</b><span>${esc(item.categoria)}</span></div>` : ""}
      ${item.horario ? `<div class="lp-fila"><b>Horario</b><span>${esc(item.horario)}</span></div>` : ""}
      ${item.telefono ? `<div class="lp-fila"><b>Teléfono</b><span>${esc(item.telefono)}</span></div>` : ""}
      ${item.director ? `<div class="lp-fila"><b>A cargo</b><span>${esc(item.director)}</span></div>` : ""}
      <a class="lp-link" href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank" rel="noopener">📍 Cómo llegar (Google Maps) ↗</a>
    </div>
  `;
}

async function init(){
  const res = await fetch("assets/data/establecimientos.json?ts=" + Date.now());
  TODOS = await res.json();

  document.getElementById("metaTotal").textContent = TODOS.length;

  // Mapa base
  MAPA = L.map("mapaLeaflet", { scrollWheelZoom: true });
  agregarCapaBaseConRespaldo(MAPA);

  const bounds = L.latLngBounds(TODOS.map(x => [x.lat, x.lng]));
  MAPA.fitBounds(bounds, { padding: [30, 30] });

  // Selects de filtro
  const distritos = [...new Set(TODOS.map(x => x.distrito))].sort();
  const selDistrito = document.getElementById("filtroDistrito");
  distritos.forEach(d => selDistrito.insertAdjacentHTML("beforeend", `<option value="${esc(d)}">${esc(d)}</option>`));

  const tipos = [...new Set(TODOS.map(x => x.clasificacion))].sort();
  const selTipo = document.getElementById("filtroTipo");
  tipos.forEach(t => selTipo.insertAdjacentHTML("beforeend", `<option value="${esc(t)}">${esc(t)}</option>`));

  renderTodo();

  document.getElementById("buscador").addEventListener("input", renderTodo);
  selDistrito.addEventListener("change", renderTodo);
  selTipo.addEventListener("change", renderTodo);
  document.getElementById("soloPuntos").addEventListener("change", renderTodo);
}

function filtrar(){
  const q = document.getElementById("buscador").value.trim().toLowerCase();
  const distrito = document.getElementById("filtroDistrito").value;
  const tipo = document.getElementById("filtroTipo").value;
  const soloPuntos = document.getElementById("soloPuntos").checked;

  return TODOS.filter(item => {
    if (soloPuntos && !item.es_punto_digitacion) return false;
    if (distrito && item.distrito !== distrito) return false;
    if (tipo && item.clasificacion !== tipo) return false;
    if (q && !item.nombre.toLowerCase().includes(q) && !item.distrito.toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderTodo(){
  const filtrados = filtrar();

  // --- Limpiar y volver a poner marcadores ---
  MARCADORES.forEach(({marker}) => MAPA.removeLayer(marker));
  MARCADORES.clear();

  filtrados.forEach(item => {
    const marker = L.marker([item.lat, item.lng], { icon: iconoPara(item) });
    marker.bindPopup(popupHTML(item));
    marker.addTo(MAPA);
    const key = item.nombre + item.lat;
    MARCADORES.set(key, { marker, data: item });
    marker.on("click", () => marcarActivoEnLista(key));
  });

  // --- Lista lateral ---
  const lista = document.getElementById("listaEstablecimientos");
  document.getElementById("contadorResultados").textContent = `${filtrados.length} resultado${filtrados.length===1?"":"s"}`;

  if (!filtrados.length){
    lista.innerHTML = `<div class="mapa-vacio">No se encontraron establecimientos con esos filtros.</div>`;
    return;
  }

  // Puntos de digitación primero, luego alfabético
  const ordenados = [...filtrados].sort((a,b) => {
    if (a.es_punto_digitacion !== b.es_punto_digitacion) return b.es_punto_digitacion - a.es_punto_digitacion;
    return a.nombre.localeCompare(b.nombre);
  });

  lista.innerHTML = ordenados.map(item => {
    const key = item.nombre + item.lat;
    return `
    <div class="mapa-item" data-key="${esc(key)}">
      <div class="mapa-item-dot" style="background:${colorDe(item)}"></div>
      <div>
        <div class="mapa-item-nombre">${esc(item.nombre)}</div>
        <div class="mapa-item-sub">${esc(item.distrito)} · ${esc(item.clasificacion)}</div>
        ${item.es_punto_digitacion ? `<span class="mapa-item-badge">⭐ Punto de digitación</span>` : ""}
      </div>
    </div>`;
  }).join("");

  lista.querySelectorAll(".mapa-item").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.dataset.key;
      const entry = MARCADORES.get(key);
      if (!entry) return;
      MAPA.flyTo([entry.data.lat, entry.data.lng], 14, { duration: 0.6 });
      entry.marker.openPopup();
      marcarActivoEnLista(key);
    });
  });
}

function marcarActivoEnLista(key){
  document.querySelectorAll(".mapa-item").forEach(el => el.classList.remove("activo"));
  const el = document.querySelector(`.mapa-item[data-key="${CSS.escape(key)}"]`);
  if (el){
    el.classList.add("activo");
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

document.addEventListener("DOMContentLoaded", init);
