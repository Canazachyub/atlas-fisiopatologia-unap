/* Síndromes pleuropulmonares — PARTITURA Y DIBUJO (funciones puras: devuelven datos o texto SVG, sin DOM).
   Se separan del núcleo para poder probarlas en Node (_test.js).
     · compilarSonido(): convierte una lista de capas ("murmullo", "crepitantes"…) en una partitura que app.js toca con Web Audio.
     · corteSVG(): corte coronal del tórax con lo que hay dentro (líquido, aire, exudado, colapso, mediastino).
     · torsoSVG(): tórax visto desde fuera, por delante o por detrás, con las seis zonas de exploración. */
(function (root) {
  "use strict";
  const M = root.PULMON || require("./motor.js");
  const rng = M.rng;

  /* =====================================================================
     SONIDO
     Ciclo respiratorio: inspiración 1,0 s + espiración 1,6 s (I/E de 1:1,6, dentro del 1:2 a 1:1,5 de la clase).
     ===================================================================== */
  const TI = 1.0, TE = 1.6, T = TI + TE;
  // Murmullo vesicular: [amplitud inspiración, amplitud espiración, fracción de la espiración que se oye]
  const NIV_MV = { nor: [0.9, 0.35, 0.3], dis: [0.3, 0.1, 0.3], abol: [0.03, 0, 0.3], dis_esp: [0.4, 0.3, 1.0], aum: [1.4, 0.5, 0.3] };

  /* Envolvente de un ciclo: aI en inspiración, aE en espiración; eFr = fracción de la espiración que suena */
  function envCiclo(s, aI, aE, eFr) {
    const e = eFr == null ? 1 : eFr;
    return [[s, 0.001], [s + 0.12, aI * 0.8], [s + 0.45, aI], [s + TI - 0.08, aI * 0.85], [s + TI, Math.max(aE, 0.001) * 0.9],
      [s + TI + TE * e * 0.5, Math.max(aE * 0.7, 0.001)], [s + TI + TE * e, 0.001]];
  }
  // Recetas de las capas continuas: filtros de ruido [tipo, Hz, Q, peso] u osciladores
  const RECETA = {
    tubarico: { tipo: "ruido", f: [["bandpass", 700, 1.2, 1], ["bandpass", 1400, 3, 0.5]], a: [0.7, 0.62] },
    cavitario: { tipo: "ruido", f: [["bandpass", 340, 3, 1], ["bandpass", 700, 3, 0.45]], a: [0.8, 0.7] },
    anforico: { tipo: "ruido", f: [["bandpass", 210, 12, 1], ["bandpass", 420, 12, 0.6]], a: [1.0, 0.9] },
    pleuritico: { tipo: "ruido", f: [["bandpass", 2200, 4, 1]], a: [0.6, 0.15] },
    roncus: { tipo: "roncus", a: [0.55, 0.5] },
    sibilancias: { tipo: "sibil", a: [0.09, 0.2] },
    estridor: { tipo: "estridor", a: [0.38, 0.1] }
  };

  /* capas: [{k, n?, suave?}]; nc: ciclos; devuelve {dur, cont:[…], ev:[…]} */
  function compilarSonido(capas, nc, seed) {
    const r = rng(seed || 11), out = { dur: nc * T + 0.2, nc, T, TI, TE, cont: [], ev: [] };
    const sube = pts => { for (let i = 1; i < pts.length; i++) if (pts[i][0] <= pts[i - 1][0]) pts[i][0] = pts[i - 1][0] + 0.001; return pts; };
    capas.forEach(c => {
      const k = c.k;
      if (k === "mv") {
        const lv = NIV_MV[c.n || "nor"], pts = [];
        for (let i = 0; i < nc; i++) pts.push.apply(pts, envCiclo(i * T, lv[0], lv[1], lv[2]));
        out.cont.push({ k, tipo: "ruido", f: [["lowpass", 450, 0.6, 1]], pts: sube(pts) });
      } else if (RECETA[k]) {
        const q = RECETA[k], sz = c.suave ? 0.45 : 1, pts = [];
        for (let i = 0; i < nc; i++) pts.push.apply(pts, envCiclo(i * T, q.a[0] * sz, q.a[1] * sz, 1));
        out.cont.push({ k, tipo: q.tipo, f: q.f, pts: sube(pts) });
      } else if (k === "crepitantes") {          // final de la inspiración, cada vez más juntos
        for (let i = 0; i < nc; i++) for (let j = 0; j < 16; j++)
          out.ev.push({ k, t: i * T + TI * (0.5 + 0.5 * Math.sqrt(r())), f: 2600 + r() * 1800, dur: 0.004 + r() * 0.004, amp: 0.5 + r() * 0.5 });
      } else if (k === "subcrepitantes") {       // burbujeo en ambos tiempos
        for (let i = 0; i < nc; i++) for (let j = 0; j < 9; j++)
          out.ev.push({ k, t: i * T + 0.1 + r() * (T - 0.3), f: 350 + r() * 600, dur: 0.03 + r() * 0.03, amp: 0.45 + r() * 0.5 });
      } else if (k === "frote") {                // roce áspero en ambos tiempos
        for (let i = 0; i < nc; i++) [0.12, 0.3, 0.52, 0.74, 1.1, 1.45, 1.8, 2.15].forEach(d => {
          const n = 5 + Math.floor(r() * 3);
          for (let m = 0; m < n; m++) out.ev.push({ k, t: i * T + d + m * 0.013, f: 380 + r() * 300, dur: 0.012, amp: 0.4 + r() * 0.6 });
        });
      }
    });
    out.ev.sort((a, b) => a.t - b.t);
    return out;
  }

  /* =====================================================================
     DIBUJO
     ===================================================================== */
  const f1 = x => Math.round(x * 10) / 10;

  /* Contorno de un hemitórax / pulmón. g = {xo, xi, yT, yB, dome}; m = desplazamiento del mediastino; k = "R"|"L" */
  function pulmonPath(g, m, k) {
    const s = k === "R" ? 1 : -1, xi = g.xi + m, xo = g.xo, w = Math.abs(xi - xo), yT = g.yT, yB = g.yB, d = g.dome;
    const X = f => f1(xo + s * w * f);
    return `M${f1(xi)},${yT + 34} C${f1(xi)},${yT + 8} ${X(0.62)},${yT - 6} ${X(0.3)},${yT + 14} C${X(0.06)},${yT + 34} ${xo},${yT + 80} ${xo},${yT + 130} ` +
      `C${xo},${yB - 60} ${X(0.04)},${yB - 16} ${X(0.22)},${yB - 4} C${X(0.45)},${yB - d} ${X(0.8)},${yB - d - 8} ${f1(xi)},${yB - d + 4} Z`;
  }
  /* Árbol bronquial esquemático de un pulmón: [{d, w}] */
  function bronquios(g, m, k) {
    const s = k === "R" ? 1 : -1, xi = g.xi + m, w = Math.abs(xi - g.xo), hx = xi - s * w * 0.16, hy = g.yT + 92;
    const P = (fx, y) => [f1(xi - s * w * fx), y];
    const rama = (a, b, c) => `M${f1(hx)},${hy} Q${f1(a[0])},${f1(a[1])} ${f1(b[0])},${f1(b[1])}` + (c ? ` L${f1(c[0])},${f1(c[1])}` : "");
    return [
      { d: rama(P(0.2, hy - 30), P(0.5, g.yT + 40), P(0.7, g.yT + 30)), w: 3 },
      { d: rama(P(0.4, hy - 6), P(0.85, hy - 14)), w: 3 },
      { d: rama(P(0.3, hy + 40), P(0.55, g.yB - 70), P(0.5, g.yB - 36)), w: 3 },
      { d: rama(P(0.45, hy + 24), P(0.9, hy + 50)), w: 2.4 },
      { d: `M${f1(hx)},${hy} L${f1(xi - s * 2)},${g.yT + 52}`, w: 4 }
    ];
  }

  /* Corte coronal. G viene de PULMON.geom(). Paciente de frente: su derecha queda a la izquierda de la figura.
     pref: prefijo de ids (para poder tener dos cortes en la misma página). */
  function corteSVG(G, pref) {
    const p = pref || "c", cav = { R: pulmonPath(G.R, G.m, "R"), L: pulmonPath(G.L, G.m, "L") };
    const sentido = k => (k === "R" ? 1 : -1);
    let o = `<defs><clipPath id="${p}cR"><path d="${cav.R}"/></clipPath><clipPath id="${p}cL"><path d="${cav.L}"/></clipPath>` +
      `<marker id="${p}fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="var(--ro)"/></marker></defs>`;
    const cont = G.contenido, tiene = (t, k) => cont.some(c => c.t === t && (c.lado === k || c.lado === "ambos"));
    const rot = [];
    ["R", "L"].forEach(k => {
      const g = G[k], s = sentido(k), xi = g.xi + G.m, w = Math.abs(xi - g.xo), hx = xi - s * w * 0.16, hy = g.yT + 92;
      const X = f => f1(g.xo + s * w * f);
      // pared torácica (con las costillas punteadas) y cavidad pleural llena de aire
      o += `<path d="${cav[k]}" fill="var(--aire)" stroke="var(--pared)" stroke-width="13" stroke-linejoin="round"/>`;
      o += `<path d="${cav[k]}" fill="none" stroke="var(--costilla)" stroke-width="13" stroke-dasharray="2 10" stroke-linejoin="round"/>`;
      // pulmón
      const neumo = tiene("aire", k), colapso = tiene("colapso", k), liquido = tiene("liquido", k);
      const hiper = tiene("hiperinsuflado", k) || tiene("bronquios_estrechos", k);
      let fill = "var(--pulm)", tr = "";
      if (neumo) { fill = "var(--colapso)"; tr = `translate(${f1(hx)} ${hy}) scale(.42) translate(${-f1(hx)} ${-hy})`; }
      else if (liquido) tr = `translate(${f1(xi)} ${g.yT}) scale(.86 .8) translate(${-f1(xi)} ${-g.yT})`;
      else if (colapso) fill = "var(--colapso)";
      else if (hiper) fill = "var(--hiper)";
      o += `<g transform="${tr}"><path d="${cav[k]}" fill="${fill}" stroke="var(--pulm-b)" stroke-width="2"/>`;
      if (!colapso) bronquios(g, G.m, k).forEach(b => {
        const grueso = tiene("bronquios_inflamados", k) ? 2.2 : 1, fino = tiene("bronquios_estrechos", k) ? 0.45 : 1;
        o += `<path d="${b.d}" fill="none" stroke="var(--pulm-b)" stroke-width="${f1(b.w * grueso * fino)}" opacity=".55" stroke-linecap="round"/>`;
      });
      o += `</g>`;
      // contenidos de cada síndrome
      if (tiene("consolidacion", k)) {       // lóbulo inferior lleno de exudado, con el bronquio abierto (broncograma aéreo)
        o += `<g clip-path="url(#${p}c${k})"><rect x="0" y="${g.yT + 110}" width="300" height="200" fill="var(--exud)" opacity=".92"/>`;
        [[0.12, 170], [0.4, 200], [0.7, 214], [0.55, 172], [0.3, 226]].forEach(b =>   // el bronquio sigue abierto: broncograma aéreo
          o += `<path d="M${f1(hx)},${g.yT + 112} L${X(b[0])},${b[1]}" fill="none" stroke="var(--aire)" stroke-width="2.6" stroke-linecap="round"/>`);
        o += `</g>`;
      }
      if (liquido) {                          // líquido con menisco: más alto en la axila (Damoiseau)
        const yL = g.yB - 100, yM = g.yB - 56, xe = g.xo - s * 16, xm = xi + s * 14;
        o += `<g clip-path="url(#${p}c${k})"><path d="M${xe},${yL} Q${X(0.45)},${yM + 14} ${xm},${yM} L${xm},${g.yB + 20} L${xe},${g.yB + 20} Z" fill="var(--liq)" opacity=".88"/>` +
          `<path d="M${xe},${yL} Q${X(0.45)},${yM + 14} ${xm},${yM}" fill="none" stroke="var(--tx)" stroke-width="1.6" stroke-dasharray="4 3" opacity=".7"/></g>`;
      }
      if (neumo) for (let i = 0; i < 6; i++) o += `<circle cx="${X(0.2 + (i % 3) * 0.28)}" cy="${g.yT + 50 + Math.floor(i / 3) * 70 + (i % 2) * 14}" r="${3 + (i % 3)}" fill="none" stroke="var(--costilla)" stroke-width="1.2" opacity=".6"/>`;
      if (tiene("hiperinsuflado", k)) [[0.28, 70, 11], [0.6, 100, 8], [0.4, 150, 13], [0.7, 190, 9], [0.3, 200, 7]].forEach(b =>
        o += `<circle cx="${X(b[0])}" cy="${b[1]}" r="${b[2]}" fill="var(--aire)" stroke="var(--pulm-b)" stroke-width="1.2" opacity=".85"/>`);
      if (tiene("caverna", k)) {
        const cx = X(0.5), cy = g.yT + 56;
        o += `<circle cx="${cx}" cy="${cy}" r="30" fill="var(--exud)" opacity=".3"/><path d="M${f1(hx)},${hy} Q${X(0.3)},${cy + 40} ${cx},${cy + 14}" fill="none" stroke="var(--aire)" stroke-width="3"/>` +
          `<circle cx="${cx}" cy="${cy}" r="17" fill="var(--aire)" stroke="var(--exud)" stroke-width="6"/>`;
      }
      if (tiene("edema", k)) {
        o += `<g clip-path="url(#${p}c${k})"><rect x="0" y="${g.yB - 92}" width="300" height="120" fill="var(--liq)" opacity=".38"/>`;
        for (let i = 0; i < 7; i++) o += `<circle cx="${X(0.15 + i * 0.12)}" cy="${g.yB - 70 + (i % 3) * 14}" r="2.2" fill="var(--liq)" opacity=".9"/>`;
        o += `</g>`;
      }
      if (tiene("pleura_inflamada", k)) {
        o += `<path d="${cav[k]}" fill="none" stroke="var(--exud)" stroke-width="4" stroke-dasharray="${Math.round(w * 2.2)} 1000" stroke-dashoffset="-${Math.round(w * 1.4)}" opacity=".95"/>`;
        for (let i = 0; i < 4; i++) o += `<path d="M${g.xo - s * 4},${g.yB - 90 + i * 14} l${s * 8},4 l${-s * 8},4" fill="none" stroke="var(--exud)" stroke-width="1.6"/>`;
      }
      if (tiene("pleura_gruesa", k)) {
        o += `<path d="${cav[k]}" fill="none" stroke="var(--tx2)" stroke-width="6" opacity=".85"/>`;
        for (let i = 0; i < 4; i++) o += `<circle cx="${g.xo + s * 3}" cy="${g.yT + 110 + i * 20}" r="2.4" fill="#fff" stroke="var(--tx)" stroke-width=".6"/>`;
      }
      if (tiene("bronquiectasias", k)) [[0.35, g.yB - 72, 9], [0.55, g.yB - 54, 11], [0.45, g.yB - 96, 8]].forEach(b =>
        o += `<circle cx="${X(b[0])}" cy="${b[1]}" r="${b[2]}" fill="var(--aire)" stroke="var(--pulm-b)" stroke-width="2.4"/><path d="M${f1(X(b[0]) - b[2] + 2)},${b[1] + 3} h${b[2] * 2 - 4}" stroke="#D8B84A" stroke-width="3"/>`);
      if (tiene("bronquios_estrechos", k) || tiene("bronquios_inflamados", k))
        for (let i = 0; i < 6; i++) o += `<circle cx="${X(0.2 + (i % 3) * 0.22)}" cy="${g.yT + 80 + Math.floor(i / 3) * 70}" r="2.8" fill="#D8B84A" stroke="var(--pulm-b)" stroke-width=".6"/>`;
      if (tiene("focos", k)) [[0.3, 150, 9], [0.6, 175, 8], [0.4, 205, 10], [0.7, 215, 7], [0.5, 110, 6], [0.25, 230, 7]].forEach(b =>
        o += `<circle cx="${X(b[0])}" cy="${b[1]}" r="${b[2]}" fill="var(--exud)" opacity=".9"/>`);
      // rótulos de lo que hay dentro (solo si ese lado tiene el contenido)
      const R = { liquido: ["líquido", g.yB - 36], aire: ["aire libre", g.yT + 150], consolidacion: ["exudado", g.yB - 60], colapso: ["colapso", g.yT + 150], caverna: ["caverna", g.yT + 100] };
      Object.keys(R).forEach(t => { if (tiene(t, k)) rot.push(`<text x="${f1(g.xo + s * w * 0.5)}" y="${R[t][1]}" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" stroke="#000" stroke-width=".4" paint-order="stroke">${R[t][0]}</text>`); });
    });
    // mediastino: tráquea, corazón y grandes vasos, desplazados m
    const m = G.m;
    o += `<g transform="translate(${f1(m)} 0)"><ellipse cx="160" cy="186" rx="27" ry="42" transform="rotate(-12 160 186)" fill="var(--medias)" stroke="var(--tx2)" stroke-width="1.5" opacity=".95"/>` +
      `<rect x="144" y="22" width="12" height="82" rx="5" fill="var(--aire)" stroke="var(--tx2)" stroke-width="1.5" transform="translate(${f1(m * 0.35)} 0)"/>` +
      `<path d="M150,102 L132,122 M150,102 L168,122" stroke="var(--tx2)" stroke-width="3" fill="none" transform="translate(${f1(m * 0.35)} 0)"/>` +
      `<rect x="144" y="108" width="22" height="40" rx="8" fill="var(--medias)" opacity=".9"/></g>`;
    o += `<line x1="150" y1="14" x2="150" y2="290" stroke="var(--tx2)" stroke-width="1" stroke-dasharray="3 5" opacity=".5"/>`;
    if (Math.abs(m) >= 6) {
      const d = m > 0 ? 1 : -1;
      o += `<path d="M150,290 L${f1(150 + m * 1.2)},290" stroke="var(--ro)" stroke-width="3" marker-end="url(#${p}fl)"/>` +
        `<text x="${f1(150 + m * 1.2 + d * 6)}" y="294" text-anchor="${d > 0 ? "start" : "end"}" font-size="11" fill="var(--ro)" font-weight="700">mediastino</text>`;
    }
    o += `<text x="12" y="16" font-size="13" font-weight="700" fill="var(--tx2)">D</text><text x="288" y="16" font-size="13" font-weight="700" fill="var(--tx2)" text-anchor="end">I</text>`;
    if (cont.some(c => c.t === "liquido")) o += `<text x="150" y="314" text-anchor="middle" font-size="11" fill="var(--tx2)">curva de Damoiseau: el líquido sube más en la axila</text>`;
    return o + rot.join("");
  }

  /* Tórax visto desde fuera. vista "ant"|"pos"; bultos {R, L}: px de abombamiento (+) o retracción (−) */
  const ZX = [52, 152], ZW = 96, ZY = [62, 126, 190], ZH = 60;
  function torsoSVG(vista, bultos) {
    const bi = vista === "ant" ? bultos.R : bultos.L, bd = vista === "ant" ? bultos.L : bultos.R;
    const lx = f1(30 - bi * 1.3), rx = f1(270 + bd * 1.3);
    let o = `<path d="M${lx},300 L${lx},118 C${lx},70 ${f1(lx + 4)},44 82,38 L110,28 C130,44 170,44 190,28 L218,38 C${f1(rx - 4)},44 ${rx},70 ${rx},118 L${rx},300 Z" fill="var(--cuerpo)" stroke="var(--cuerpo-b)" stroke-width="3"/>`;
    o += `<rect x="128" y="0" width="44" height="34" rx="10" fill="var(--cuerpo)" stroke="var(--cuerpo-b)" stroke-width="3"/>`;
    if (vista === "ant") {
      o += `<path d="M150,50 L112,40 M150,50 L188,40" stroke="var(--cuerpo-b)" stroke-width="2.5" fill="none"/><line x1="150" y1="50" x2="150" y2="170" stroke="var(--cuerpo-b)" stroke-width="2" opacity=".6"/>` +
        `<circle cx="96" cy="160" r="5" fill="none" stroke="var(--cuerpo-b)" stroke-width="2"/><circle cx="204" cy="160" r="5" fill="none" stroke="var(--cuerpo-b)" stroke-width="2"/>`;
    } else {
      o += `<line x1="150" y1="40" x2="150" y2="296" stroke="var(--cuerpo-b)" stroke-width="2" stroke-dasharray="2 5"/>` +
        `<path d="M70,80 Q104,70 120,96 Q112,140 82,150 Q64,120 70,80 Z M230,80 Q196,70 180,96 Q188,140 218,150 Q236,120 230,80 Z" fill="none" stroke="var(--cuerpo-b)" stroke-width="2" opacity=".7"/>`;
    }
    o += `<text x="14" y="56" font-size="13" font-weight="700" fill="var(--tx2)">${vista === "ant" ? "D" : "I"}</text><text x="286" y="56" font-size="13" font-weight="700" fill="var(--tx2)" text-anchor="end">${vista === "ant" ? "I" : "D"}</text>`;
    return o;
  }

  const api = { TI, TE, T, NIV_MV, compilarSonido, corteSVG, torsoSVG, pulmonPath, ZX, ZW, ZY, ZH };
  root.PULMON_DIB = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
