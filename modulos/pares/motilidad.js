/* Pestaña 2 · Motilidad ocular: los ojos siguen el dedo; parálisis del III, IV y VI con su diplopía. */
(function () {
  "use strict";
  const U = window.UTIL, P = window.PAR, SECC = window.SECC;
  const LADOS = { D: "derecho", I: "izquierdo" };
  const otro = l => (l === "D" ? "I" : "D");

  // las 9 posiciones del examen en H: clave por (gx, gy) del paciente
  const CELDAS = [
    { gx: -1, gy: 1, n: "arriba y a su izquierda" }, { gx: 0, gy: 1, n: "arriba" }, { gx: 1, gy: 1, n: "arriba y a su derecha" },
    { gx: -1, gy: 0, n: "a su izquierda" }, { gx: 0, gy: 0, n: "al frente" }, { gx: 1, gy: 0, n: "a su derecha" },
    { gx: -1, gy: -1, n: "abajo y a su izquierda" }, { gx: 0, gy: -1, n: "abajo" }, { gx: 1, gy: -1, n: "abajo y a su derecha" }
  ];
  // músculo que lleva a cada ojo a cada posición (11j): [ojo derecho, ojo izquierdo]
  const MUSC = {
    "1,1": ["RS", "OI"], "0,1": ["RS+OI", "RS+OI"], "-1,1": ["OI", "RS"],
    "1,0": ["RL", "RM"], "0,0": ["—", "—"], "-1,0": ["RM", "RL"],
    "1,-1": ["RI", "OS"], "0,-1": ["RI+OS", "RI+OS"], "-1,-1": ["OS", "RI"]
  };
  const PARDE = { RL: "VI", RM: "III", RS: "III", OI: "III", RI: "III", OS: "IV" };

  SECC.motilidad = function (cont) {
    const E = { par: null, lado: "D", gx: 0, gy: 0, px: { D: 0, I: 0 }, py: { D: 0, I: 0 }, auto: false, tA: 0 };
    cont.innerHTML = `
      <h1>👀 Motilidad ocular</h1>
      <p class="lema">Arrastra el dedo del examinador por el campo de abajo: los ojos lo siguen. Elige una parálisis del III, IV o VI y repite el recorrido en H: el ojo afectado no llega, y el paciente ve doble.</p>
      <div class="grid2">
        <div>
          <div class="caja">
            <svg class="dib" id="mov" viewBox="0 0 600 420" role="img" aria-label="Ojos que siguen un dedo"></svg>
            <div class="ctrl"><button class="btn sec" id="h">▶ Recorrido en H</button><button class="btn sec" id="cent">Al centro</button></div>
          </div>
          <div class="caja">
            <div class="ctrl"><span class="nota">Parálisis:</span><span class="chips" id="pc"></span></div>
            <div class="ctrl" id="lc"></div>
          </div>
        </div>
        <div>
          <div class="letrero" id="letrero"></div>
          <div class="caja"><b>Lo que ve el paciente</b>
            <svg class="dib" id="pac" viewBox="0 0 300 150" role="img" aria-label="Imagen simple o doble"></svg><div class="nota" id="dip"></div></div>
          <div class="caja"><b>Músculos que trabajan ahora</b><div id="mus"></div></div>
        </div>
      </div>
      <div class="caja"><h3>Qué músculo (y qué par) lleva el ojo a cada dirección</h3><div id="mapa"></div>
        <p class="nota">Según la clase: recto lateral (VI) hacia fuera; recto medial (III) hacia dentro; recto superior (III) arriba y afuera; oblicuo inferior (III) arriba y adentro; recto inferior (III) abajo y afuera; oblicuo superior (IV) abajo y adentro. «Afuera» y «adentro» se miden desde cada ojo. La tabla está desde el punto de vista del paciente (su derecha es tu izquierda).</p></div>`;

    /* ---------- controles ---------- */
    const pc = U.$("#pc", cont), lc = U.$("#lc", cont);
    const dibujaCtrl = () => {
      pc.innerHTML = [[null, "Ninguna"], ["III", "III par"], ["IV", "IV par"], ["VI", "VI par"]].map(([k, t]) => `<button class="chip ${E.par === k ? "act ro" : ""}" data-p="${k}">${t}</button>`).join("");
      U.$$("[data-p]", pc).forEach(b => b.onclick = () => { E.par = b.dataset.p === "null" ? null : b.dataset.p; dibujaCtrl(); mapa(); });
      lc.innerHTML = E.par ? `<span class="nota">Ojo afectado:</span><span class="chips">` + ["D", "I"].map(l => `<button class="chip ${E.lado === l ? "act" : ""}" data-l="${l}">${LADOS[l]}</button>`).join("") + "</span>" : "";
      U.$$("[data-l]", lc).forEach(b => b.onclick = () => { E.lado = b.dataset.l; dibujaCtrl(); });
    };
    dibujaCtrl();

    /* ---------- escena ---------- */
    const sv = U.$("#mov", cont);
    const OX = { D: 175, I: 425 }, OY = 95;   // el ojo derecho del paciente se dibuja a la izquierda
    const ojos = { D: U.ojo(sv, OX.D, OY, 1.15), I: U.ojo(sv, OX.I, OY, 1.15) };
    for (const l of ["D", "I"]) U.el("text", { class: "txt", x: OX[l], y: 170, "text-anchor": "middle" }, sv, "Ojo " + LADOS[l]);
    // campo del dedo
    const FX = 60, FY = 195, FW = 480, FH = 205, cx = FX + FW / 2, cy = FY + FH / 2;
    U.el("rect", { x: FX, y: FY, width: FW, height: FH, rx: 16, fill: "none", stroke: "var(--borde)", "stroke-width": 3 }, sv);
    const linea = (x1, y1, x2, y2) => U.el("line", { x1, y1, x2, y2, stroke: "var(--borde)", "stroke-width": 3, "stroke-dasharray": "6 6" }, sv);
    linea(FX + 30, FY + 30, FX + FW - 30, FY + 30); linea(FX + 30, cy, FX + FW - 30, cy); linea(FX + 30, FY + FH - 30, FX + FW - 30, FY + FH - 30);
    linea(cx, FY + 30, cx, FY + FH - 30); linea(FX + 30, FY + 30, FX + 30, FY + FH - 30); linea(FX + FW - 30, FY + 30, FX + FW - 30, FY + FH - 30);
    U.el("text", { class: "txt2", x: FX + 8, y: FY + 18 }, sv, "← derecha del paciente");
    U.el("text", { class: "txt2", x: FX + FW - 8, y: FY + 18, "text-anchor": "end" }, sv, "izquierda del paciente →");
    const dedo = U.el("g", { style: "cursor:grab" }, sv);
    U.el("circle", { r: 22, fill: "rgba(245,158,11,.35)" }, dedo);
    U.el("circle", { r: 11, fill: "#E2B58D", stroke: "#8a5a3a", "stroke-width": 2.5 }, dedo);
    const ponDedo = (gx, gy) => { E.gx = Math.max(-1, Math.min(1, gx)); E.gy = Math.max(-1, Math.min(1, gy)); dedo.setAttribute("transform", `translate(${cx - E.gx * (FW / 2 - 30)},${cy - E.gy * (FH / 2 - 30)})`); };
    ponDedo(0, 0);
    // la pantalla es la vista del examinador: la derecha del paciente queda a la izquierda de la pantalla
    U.arrastre(sv, (x, y) => { E.auto = false; ponDedo(-(x - cx) / (FW / 2 - 30), -(y - cy) / (FH / 2 - 30)); });
    U.$("#cent", cont).onclick = () => { E.auto = false; ponDedo(0, 0); };
    const rec = [[0, 0], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [0, 0]];
    U.$("#h", cont).onclick = () => { E.auto = true; E.tA = 0; };

    /* ---------- imagen del paciente ---------- */
    const pac = U.$("#pac", cont);
    U.el("rect", { x: 2, y: 2, width: 296, height: 146, rx: 14, fill: "none", stroke: "var(--borde)", "stroke-width": 2 }, pac);
    const imgReal = U.el("circle", { cx: 150, cy: 75, r: 14, fill: "#E2B58D", stroke: "#8a5a3a", "stroke-width": 3 }, pac);
    const imgFalsa = U.el("circle", { cx: 150, cy: 75, r: 14, fill: "rgba(226,181,141,.45)", stroke: "#B91C1C", "stroke-width": 3, "stroke-dasharray": "4 3", style: "display:none" }, pac);

    /* ---------- mapa de músculos ---------- */
    function mapa() {
      let h = '<table><tr><th>La mirada va…</th><th>Ojo derecho</th><th>Ojo izquierdo</th></tr>';
      for (const c of CELDAS) {
        const m = MUSC[c.gx + "," + c.gy];
        const celda = (txt, e) => txt === "—" ? "—" : txt.split("+").map(k => { const par = PARDE[k], mal = E.par && E.lado === e && par === E.par; return `<span style="${mal ? "color:var(--ro);font-weight:700" : ""}">${k} (${par})</span>`; }).join(" + ");
        h += `<tr data-c="${c.gx},${c.gy}"><td>${c.n}</td><td>${celda(m[0], "D")}</td><td>${celda(m[1], "I")}</td></tr>`;
      }
      U.$("#mapa", cont).innerHTML = h + "</table>";
    }
    mapa();

    const NOM = { RL: "Recto lateral", RM: "Recto medial", RS: "Recto superior", OI: "Oblicuo inferior", RI: "Recto inferior", OS: "Oblicuo superior" };
    let ult = "";
    U.loop(dt => {
      if (E.auto) {
        E.tA += dt * 0.45; const i = Math.floor(E.tA), f = E.tA - i;
        if (i >= rec.length - 1) E.auto = false;
        else { const a = rec[i], b = rec[i + 1], s = f * f * (3 - 2 * f); ponDedo(a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s); }
      }
      const par = E.par ? { par: E.par, lado: E.lado } : null, r = P.motilidad(par, E.gx, E.gy), ideal = P.motilidad(null, E.gx, E.gy);
      for (const e of ["D", "I"]) {
        E.px[e] += (r.ojo[e].px - E.px[e]) * Math.min(1, dt * 9); E.py[e] += (r.ojo[e].py - E.py[e]) * Math.min(1, dt * 9);
        const enf = par && par.lado === e;
        ojos[e].set({ d: enf && par.par === "III" ? 7 : 3.5, px: E.px[e], py: E.py[e], ptosis: enf && par.par === "III" ? 2 : 0 });
      }
      // imagen del paciente
      imgReal.setAttribute("cx", 150); imgReal.setAttribute("cy", 75);
      if (r.diplopia && r.fija) {
        const e = otro(r.fija), dx = r.ojo[e].px - r.ojo[r.fija].px, dy = r.ojo[e].py - r.ojo[r.fija].py;
        imgFalsa.style.display = ""; imgFalsa.setAttribute("cx", Math.max(20, Math.min(280, 150 - dx * 70))); imgFalsa.setAttribute("cy", Math.max(20, Math.min(130, 75 + dy * 70)));
      } else imgFalsa.style.display = "none";
      // lo que cambia poco: texto y barras
      const c = CELDAS.reduce((m, k) => (Math.hypot(k.gx - E.gx, k.gy - E.gy) < Math.hypot(m.gx - E.gx, m.gy - E.gy) ? k : m));
      const clave = JSON.stringify([E.par, E.lado, c.gx, c.gy, r.diplopia, r.tipo, Math.round(E.gx * 5), Math.round(E.gy * 5)]);
      if (clave === ult) return;
      ult = clave;
      U.$$("#mapa tr[data-c]", cont).forEach(t => { t.style.background = t.dataset.c === c.gx + "," + c.gy ? "var(--resalte)" : ""; });
      // barras de activación
      const bar = e => `<div style="margin:6px 0"><b>Ojo ${LADOS[e]}</b>` + Object.keys(NOM).map(k => {
        const w = Math.round(r.activ[e][k] * 100), mal = par && par.lado === e && PARDE[k] === par.par;
        return `<div style="display:flex;align-items:center;gap:8px;font-size:14px"><span style="width:130px">${NOM[k]} (${PARDE[k]})</span><span style="flex:1;height:10px;border-radius:5px;background:var(--borde);overflow:hidden"><span style="display:block;height:100%;width:${mal ? 100 : w}%;background:${mal ? "var(--ro)" : "var(--azc)"};opacity:${mal ? .35 : 1}"></span></span><span style="width:60px;font-size:12px;color:var(--tx2)">${mal ? "paralizado" : w + "%"}</span></div>`;
      }).join("") + "</div>";
      U.$("#mus", cont).innerHTML = bar("D") + bar("I");
      // letrero causa → efecto
      const m = MUSC[c.gx + "," + c.gy];
      let h = `<span class="k">Mirada</span> el dedo está ${c.n}: ` + (m[0] === "—" ? "los dos ojos al frente." : `el ojo derecho usa ${m[0]} y el izquierdo ${m[1]}.`);
      if (par) {
        const P0 = P.PARALISIS[par.par], dev = Math.hypot(r.ojo[par.lado].px - ideal.ojo[par.lado].px, r.ojo[par.lado].py - ideal.ojo[par.lado].py);
        if (r.diplopia) h += `<br><b>Aquí falla el ojo ${LADOS[par.lado]} (${par.par} par)</b>: ${P0.donde}. El paciente ve <b>doble (${r.tipo})</b>.`;
        else h += `<br>En esta posición el ojo ${LADOS[par.lado]} (${par.par} par) llega bien: no hay diplopía. Prueba otra dirección (${par.par === "VI" ? "hacia el lado afectado" : par.par === "IV" ? "abajo y hacia adentro" : "hacia adentro o abajo"}).`;
      }
      U.$("#letrero", cont).innerHTML = h;
      U.$("#dip", cont).innerHTML = par ? (r.diplopia ? `Diplopía ${r.tipo}: dos imágenes (la discontinua es la del ojo desviado). ` : "Una sola imagen en esta posición. ") + `<br><b>${P.PARALISIS[par.par].nombre}:</b> ${P.PARALISIS[par.par].signos}<br><span class="nota">${P.PARALISIS[par.par].causa}</span>` : "Sin parálisis: los dos ojos se mueven juntos y el paciente ve una sola imagen.";
    });
  };
})();
