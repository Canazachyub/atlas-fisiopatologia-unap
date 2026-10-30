/* Pupilas y pares craneales — núcleo: tema, router, utilidades SVG y el dibujo del ojo.
   Las pestañas viven en linterna.js, motilidad.js, pares.js y texto.js y se registran en window.SECC. */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { $, $$ };
  const NS = "http://www.w3.org/2000/svg";

  /* ---------- tema (el mismo que el atlas) ---------- */
  const CLAVE = "atlas-semio-v1";
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  const guardar = o => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} };
  { const P = leer(); if (P.tema) document.documentElement.dataset.theme = P.tema; }
  $("#tema-btn").onclick = () => {
    const P = leer(), osc = matchMedia("(prefers-color-scheme: dark)").matches;
    P.tema = (P.tema || (osc ? "dark" : "light")) === "dark" ? "light" : "dark"; guardar(P);
    document.documentElement.dataset.theme = P.tema;
  };

  /* ---------- animación con contador de generación: se detiene al cambiar de pestaña ---------- */
  U.gen = 0;
  U.detener = () => { U.gen++; };
  // loop(fn): fn(dt, t) en segundos; devuelve false para parar
  U.loop = fn => {
    const g = U.gen; let t0 = null, ult = null;
    const paso = ts => {
      if (g !== U.gen) return;
      if (t0 === null) { t0 = ts; ult = ts; }
      const dt = Math.min(0.1, (ts - ult) / 1000); ult = ts;
      if (fn(dt, (ts - t0) / 1000) === false) return;
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  /* ---------- SVG ---------- */
  U.el = (tag, attrs, padre, texto) => {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (texto !== undefined) e.textContent = texto;
    if (padre) padre.appendChild(e);
    return e;
  };
  // Arrastre en coordenadas del viewBox: cb(x, y, fase) con fase "ini" | "mov" | "fin"
  U.arrastre = (svg, cb) => {
    let activo = false;
    const pos = ev => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      return [vb.x + (ev.clientX - r.left) / r.width * vb.width, vb.y + (ev.clientY - r.top) / r.height * vb.height];
    };
    svg.addEventListener("pointerdown", ev => { activo = true; try { svg.setPointerCapture(ev.pointerId); } catch (e) {} const [x, y] = pos(ev); cb(x, y, "ini"); ev.preventDefault(); });
    svg.addEventListener("pointermove", ev => { if (!activo) return; const [x, y] = pos(ev); cb(x, y, "mov"); });
    const fin = ev => { if (!activo) return; activo = false; const [x, y] = pos(ev); cb(x, y, "fin"); };
    svg.addEventListener("pointerup", fin); svg.addEventListener("pointercancel", fin);
  };
  U.fmt = x => (Math.round(x * 10) / 10).toString().replace(".", ",");
  U.sem = n => `<span class="sem ${n}">${n}</span>`;
  U.azar = (() => { let s = (Date.now() & 0xffffffff) >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();

  /* ---------- el ojo ---------- */
  let nOjo = 0;
  const R_IRIS = 32, MM = 5.1; // radio del iris en px; el radio de la pupila en px = d(mm) * MM / 2
  /* Dibuja un ojo frontal centrado en (cx, cy). set({d, px, py, ptosis, enof, irregular, luz}) lo actualiza.
     px, py: posición de la mirada -1..1 en términos del PACIENTE (px>0 = hacia su derecha). El dibujo se ve
     desde el examinador: lo que va a la derecha del paciente queda a la izquierda de la pantalla (flip = -1). */
  U.ojo = (padre, cx, cy, escala) => {
    const id = "oj" + (++nOjo), s = escala || 1;
    const g = U.el("g", { transform: `translate(${cx},${cy}) scale(${s})` }, padre);
    const defs = U.el("defs", null, g), cp = U.el("clipPath", { id }, defs);
    U.el("path", { d: "M-66 0 C-40 -44 40 -44 66 0 C40 44 -40 44 -66 0 Z" }, cp);
    const cuerpo = U.el("g", null, g);
    U.el("path", { class: "esclera", d: "M-66 0 C-40 -44 40 -44 66 0 C40 44 -40 44 -66 0 Z" }, cuerpo);
    const clip = U.el("g", { "clip-path": `url(#${id})` }, cuerpo);
    const globo = U.el("g", null, clip);
    U.el("circle", { class: "iris", r: R_IRIS, cx: 0, cy: 0 }, globo);
    U.el("circle", { r: R_IRIS - 8, cx: 0, cy: 0, fill: "none", stroke: "#a67545", "stroke-width": 3, opacity: .55 }, globo);
    const pup = U.el("path", { class: "pup" }, globo);
    U.el("circle", { cx: -8, cy: -9, r: 4.5, fill: "#fff", opacity: .85 }, globo);
    const parpado = U.el("rect", { class: "parp", x: -70, y: -50, width: 140, height: 50 }, clip);
    const borde = U.el("path", { d: "M-66 0 C-40 -44 40 -44 66 0", fill: "none", stroke: "#8a5a3a", "stroke-width": 3 }, g);
    U.el("path", { d: "M-66 0 C-40 44 40 44 66 0", fill: "none", stroke: "#8a5a3a", "stroke-width": 2.5 }, g);
    const sombra = U.el("path", { d: "M-66 0 C-40 44 40 44 66 0", fill: "none", stroke: "rgba(0,0,0,.22)", "stroke-width": 9, opacity: 0 }, g);
    const forma = (r, irr) => {
      const n = 28; let d = "";
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2, k = irr ? 1 + .16 * Math.sin(3 * a + 1) + .09 * Math.sin(5 * a + 2) : 1;
        d += (i ? "L" : "M") + (r * k * Math.cos(a)).toFixed(2) + " " + (r * k * Math.sin(a)).toFixed(2);
      }
      return d + "Z";
    };
    const api = {
      g,
      set(o) {
        const d = o.d === undefined ? 4 : o.d, px = o.px || 0, py = o.py || 0;
        const rp = Math.max(2, Math.min(R_IRIS - 4, d * MM / 2 * 1.05));
        globo.setAttribute("transform", `translate(${(-px * 26).toFixed(1)},${(-py * 14).toFixed(1)})`);
        pup.setAttribute("d", forma(rp, o.irregular));
        // párpado: 0 abierto, 1 ptosis parcial, 2 ptosis casi completa
        const alto = [-48, -14, 6][o.ptosis || 0];
        parpado.setAttribute("height", Math.max(0, alto + 50)); parpado.setAttribute("y", -50);
        cuerpo.setAttribute("transform", o.enof ? "scale(.9) translate(0,3)" : "");
        sombra.setAttribute("opacity", o.enof ? 1 : 0);
      }
    };
    api.set({ d: 4 });
    return api;
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "linterna").split("/");
    const f = SECC[id] || SECC.linterna;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "linterna")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: clases 11j (pares oculomotores y examen pupilar), 11d (los 12 pares), 11e (pupila en coma) y 11h y 06a (síndrome de Horner), según Sotomayor, <i>Semiología</i> (2020), y lo dicho en clase.
      Lo marcado <span class="lit">literatura</span> no está en la clase. Los dibujos son esquemas didácticos, no imágenes clínicas.</p>`);
  }
  addEventListener("hashchange", ruta);
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
