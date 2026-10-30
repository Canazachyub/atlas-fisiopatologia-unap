/* Pestaña 1 · Linterna: reflejos pupilares sobre dos ojos, lesiones y diagrama de la vía. */
(function () {
  "use strict";
  const U = window.UTIL, P = window.PAR, SECC = window.SECC;
  const LADOS = { D: "derecho", I: "izquierdo" };
  const otro = l => (l === "D" ? "I" : "D");

  SECC.linterna = function (cont) {
    const E = { les: "normal", lado: "D", cerca: 0, pos: null, oscila: false, tSw: 0 };
    cont.innerHTML = `
      <h1>🔦 Linterna: reflejos pupilares</h1>
      <p class="lema">Arrastra la linterna sobre un ojo (o toca un botón). Mira cómo responde cada pupila y por dónde pasa la señal. Elige una lesión y repite.</p>
      <div class="grid2">
        <div>
          <div class="caja">
            <svg class="dib" id="cara" viewBox="0 0 600 300" role="img" aria-label="Dos ojos y una linterna que se arrastra"></svg>
            <div class="ctrl">
              <button class="btn sec" data-l="D">🔦 Ojo derecho</button><button class="btn sec" data-l="I">🔦 Ojo izquierdo</button>
              <button class="btn sec" id="osc">↔️ Oscilar</button><button class="btn sec" id="apaga">Apagar</button>
            </div>
            <div class="ctrl">
              <label>Objeto: lejos <input type="range" id="cerca" min="0" max="100" value="0"> cerca</label>
              <button class="btn sec" id="acerca">👆 Acercar y alejar</button>
            </div>
          </div>
          <div class="caja">
            <div class="ctrl">
              <label>Lesión <select id="les"></select></label>
              <span id="lados" class="chips"></span>
            </div>
            <div id="tabla"></div>
          </div>
        </div>
        <div>
          <div class="letrero" id="letrero"></div>
          <div class="caja info" id="info"></div>
          <div class="caja"><b>Vía de la señal</b> <span class="nota">(se ilumina por donde pasa; la X roja marca la lesión)</span>
            <svg class="dib" id="via" viewBox="0 0 720 430" role="img" aria-label="Vía del reflejo pupilar"></svg></div>
        </div>
      </div>`;

    /* ---------- selector de lesiones ---------- */
    const sel = U.$("#les", cont);
    P.ORDEN.forEach(id => { const o = document.createElement("option"); o.value = id; o.textContent = P.LESIONES[id].nombre + (P.LESIONES[id].lit ? " (literatura)" : ""); sel.appendChild(o); });
    sel.onchange = () => { E.les = sel.value; lados(); resumen(); };
    const lados = () => {
      const w = U.$("#lados", cont), L = P.LESIONES[E.les];
      w.innerHTML = L.lat ? `<span class="nota">Lado:</span>` + ["D", "I"].map(l => `<button class="chip ${E.lado === l ? "act" : ""}" data-lado="${l}">Ojo ${LADOS[l]}</button>`).join("") : `<span class="nota">Afecta a los dos ojos o no tiene lado.</span>`;
      U.$$("[data-lado]", w).forEach(b => b.onclick = () => { E.lado = b.dataset.lado; lados(); resumen(); });
    };
    lados();

    /* ---------- cara con dos ojos ---------- */
    const cara = U.$("#cara", cont);
    const CX = { D: 170, I: 430 }, CY = 150, ESC = 1.3;   // el ojo derecho del paciente queda a la izquierda de la pantalla
    for (const l of ["D", "I"]) {
      U.el("path", { class: "trazo", d: `M${CX[l] - 90} ${CY - 70} Q${CX[l]} ${CY - 100} ${CX[l] + 90} ${CY - 70}`, "stroke-width": 7, opacity: .5 }, cara);
    }
    const ojos = { D: U.ojo(cara, CX.D, CY, ESC), I: U.ojo(cara, CX.I, CY, ESC) };
    const rotulo = {};
    for (const l of ["D", "I"]) {
      U.el("text", { class: "txt", x: CX[l], y: 258, "text-anchor": "middle" }, cara, "Ojo " + LADOS[l] + " del paciente");
      rotulo[l] = U.el("text", { class: "txt2", x: CX[l], y: 278, "text-anchor": "middle" }, cara, "");
    }
    // objeto que se acerca (dedo)
    const dedo = U.el("circle", { cx: 300, cy: 150, r: 6, fill: "#E2B58D", stroke: "#8a5a3a", "stroke-width": 2 }, cara);
    // linterna
    const lint = U.el("g", { id: "lint", style: "display:none" }, cara);
    const glow = U.el("circle", { class: "luz", r: 74 }, lint);
    const haz = U.el("polygon", { fill: "rgba(250,204,21,.25)" }, lint);
    const cuerpo = U.el("g", null, lint);
    U.el("rect", { x: 0, y: -9, width: 78, height: 18, rx: 6, fill: "#374151", stroke: "#111827", "stroke-width": 2 }, cuerpo);
    U.el("rect", { x: -6, y: -12, width: 14, height: 24, rx: 4, fill: "#FACC15", stroke: "#111827", "stroke-width": 2 }, cuerpo);
    cuerpo.setAttribute("transform", "translate(0,0)");
    const mover = (x, y) => {
      E.pos = [Math.max(10, Math.min(590, x)), Math.max(20, Math.min(240, y))];
      lint.style.display = "";
      const [px, py] = E.pos;
      glow.setAttribute("cx", px); glow.setAttribute("cy", py);
      haz.setAttribute("points", `${px},${py - 40} ${px},${py + 40} ${px + 110},${py + 78} ${px + 110},${py + 30}`);
      cuerpo.setAttribute("transform", `translate(${px + 104},${py + 56}) rotate(20)`);
    };
    U.arrastre(cara, (x, y) => { E.oscila = false; U.$("#osc", cont).classList.remove("az"); mover(x, y); });
    U.$$("[data-l]", cont).forEach(b => b.onclick = () => { E.oscila = false; mover(CX[b.dataset.l], CY); });
    U.$("#apaga", cont).onclick = () => { E.oscila = false; E.pos = null; lint.style.display = "none"; };
    U.$("#osc", cont).onclick = function () { E.oscila = !E.oscila; E.tSw = 0; this.classList.toggle("az", E.oscila); if (!E.oscila) return; mover(CX[otro(E.lado)], CY); };
    const rng = U.$("#cerca", cont);
    rng.oninput = () => { E.cerca = rng.value / 100; E.auto = false; };
    U.$("#acerca", cont).onclick = () => { E.auto = true; E.tA = 0; };

    /* ---------- diagrama de la vía ---------- */
    const via = U.$("#via", cont);
    const N = { // posiciones de los nodos
      retD: [50, 70], retI: [50, 270], q: [215, 170],
      preD: [340, 70], preI: [340, 270], EWD: [455, 70], EWI: [455, 270], n3D: [570, 70], n3I: [570, 270], irD: [675, 70], irI: [675, 270]
    };
    const seg = {}; // segmentos: [desde, hasta, clave del estado]
    const SEGS = [
      ["retD", "q", "n2D"], ["retI", "q", "n2I"], ["q", "preD", "qD"], ["q", "preI", "qI"],
      ["preD", "EWD", "preD"], ["preI", "EWI", "preI"], ["EWD", "n3D", "EWD"], ["EWI", "n3I", "EWI"], ["n3D", "irD", "n3D"], ["n3I", "irI", "n3I"]
    ];
    SEGS.forEach(([a, b, k]) => {
      const A = N[a], B = N[b];
      U.el("line", { class: "tubo", x1: A[0], y1: A[1], x2: B[0], y2: B[1] }, via);
      seg[k] = U.el("line", { class: "senal", x1: A[0], y1: A[1], x2: B[0], y2: B[1], "stroke-width": 8 }, via);
    });
    const nodo = {};
    const ETI = { retD: "Retina D", retI: "Retina I", q: "Quiasma", preD: "Pretectal", preI: "Pretectal", EWD: "Edinger-Westphal", EWI: "Edinger-Westphal", n3D: "III par", n3I: "III par", irD: "Esfínter D", irI: "Esfínter I" };
    for (const k in N) {
      nodo[k] = U.el("circle", { class: "nodo", cx: N[k][0], cy: N[k][1], r: 17 }, via);
      U.el("text", { class: "txt", x: N[k][0], y: N[k][1] + (k.endsWith("D") ? -26 : 36), "text-anchor": "middle" }, via, ETI[k]);
    }
    U.el("text", { class: "txt2", x: 130, y: 100, "text-anchor": "middle" }, via, "II par");
    U.el("text", { class: "txt2", x: 130, y: 250, "text-anchor": "middle" }, via, "II par");
    // vía simpática (dilata la pupila): fila inferior
    U.el("text", { class: "txt", x: 20, y: 342 }, via, "Vía simpática (dilata la pupila y eleva el párpado)");
    const SIMP = ["Hipotálamo post.", "Tallo cerebral", "C8-T2", "Ganglio cervical", "Plexo pericarotídeo", "Iris y párpado"];
    const simp = [];
    SIMP.forEach((t, i) => {
      const x = 60 + i * 118;
      if (i) U.el("line", { class: "tubo", x1: x - 118, y1: 385, x2: x, y2: 385 }, via), simp.push(U.el("line", { class: "senal", x1: x - 118, y1: 385, x2: x, y2: 385, "stroke-width": 8, stroke: "#10B981", "stroke-opacity": .85 }, via));
      U.el("circle", { class: "nodo", cx: x, cy: 385, r: 13 }, via);
      U.el("text", { class: "txt2", x, y: 420, "text-anchor": "middle" }, via, t);
    });
    // marcas de lesión
    const cortes = [];
    const X = (x, y) => { const g = U.el("g", { style: "display:none" }, via); U.el("path", { class: "corte", d: `M${x - 11} ${y - 11} L${x + 11} ${y + 11} M${x + 11} ${y - 11} L${x - 11} ${y + 11}` }, g); return g; };
    const marca = { II_D: X(132, 120), II_I: X(132, 220), pret_D: X(340, 100), pret_I: X(340, 240), III_D: X(570, 100), III_I: X(570, 240), EW_D: X(455, 100), EW_I: X(455, 240), farm_D: X(675, 100), farm_I: X(675, 240), simp: X(296, 385) };

    /* ---------- estado dinámico ---------- */
    const dia = { D: 4, I: 4 }, hist = [[0, { D: 0, I: 0 }]];
    let tt = 0;
    const luzIn = () => {
      if (!E.pos) return { D: 0, I: 0 };
      const dD = Math.hypot(E.pos[0] - CX.D, E.pos[1] - CY), dI = Math.hypot(E.pos[0] - CX.I, E.pos[1] - CY);
      return { D: dD < 85 ? 1 : 0, I: dI < 85 ? 1 : 0 };
    };
    const luzEf = () => { // la luz tarda en producir efecto (latencia)
      let r = hist[0][1];
      for (const [t, l] of hist) if (t <= tt - P.LATENCIA_S) r = l;
      while (hist.length > 2 && hist[1][0] <= tt - P.LATENCIA_S) hist.shift();
      return r;
    };
    let ult = "";

    function resumen() {
      const L = P.LESIONES[E.les], lado = E.lado;
      const nom = L.lat ? `${L.nombre}, ojo ${LADOS[lado]}` : L.nombre;
      U.$("#info", cont).innerHTML = `<h3>${nom}${L.lit ? ' <span class="lit">literatura</span>' : ""}</h3>
        <p><b>Dónde está el daño:</b> ${L.via}</p><p><b>Qué se ve:</b> ${L.efecto}</p>
        ${E.les === "argyll" ? '<div class="tarj na"><b class="t">Discrepancia con el banco</b>El banco de preguntas incluye la ptosis en la tríada de Argyll Robertson, pero la ptosis es del síndrome de Horner. La tríada de Argyll Robertson es miosis, pupilas irregulares y fotomotor abolido con acomodación conservada. Tu clase no la describe: es literatura.</div>' : ""}
        ${E.les === "ii_parcial" ? '<div class="tarj"><b class="t">Prueba de la linterna oscilante</b>Pulsa «Oscilar»: la linterna pasa de un ojo al otro cada 2 segundos. Al pasar del ojo sano al enfermo, las dos pupilas se dilatan, porque llega menos señal. La clase solo dice que el defecto aferente es «relativo»; el nombre de Marcus Gunn y la prueba son literatura.</div>' : ""}
        ${E.les === "horner" ? '<div class="tarj"><b class="t">Del vértice pulmonar al ojo</b>El caso de clase: fumador con síntomas pulmonares y Horner. El tumor del vértice comprime la cadena simpática cervical (ver la vía verde de abajo).</div>' : ""}`;
      // tabla de reflejos calculada por el modelo
      const rD = P.reflejos(E.les, lado, "D"), rI = P.reflejos(E.les, lado, "I"), ac = P.acomodacion(E.les, lado);
      U.$("#tabla", cont).innerHTML = `<table><tr><th></th><th>Ojo derecho</th><th>Ojo izquierdo</th></tr>
        <tr><td>Fotomotor directo</td><td>${U.sem(rD.directo)}</td><td>${U.sem(rI.directo)}</td></tr>
        <tr><td>Consensual (luz en el otro ojo)</td><td>${U.sem(rI.consensual)}</td><td>${U.sem(rD.consensual)}</td></tr>
        <tr><td>Acomodación</td><td>${U.sem(ac.D)}</td><td>${U.sem(ac.I)}</td></tr></table>
        <p class="nota">Diámetro normal de la clase: 2 a 6 mm; menos de 2 mm es miosis y más de 6 mm, midriasis (otros autores dan 2-4 mm).</p>`;
      // marcas de lesión
      Object.values(marca).forEach(m => m.style.display = "none");
      const c = L.corte, ls = L.lat ? [lado] : ["D", "I"];
      if (c === "II") marca["II_" + lado].style.display = "";
      if (c === "pret") ls.forEach(l => marca["pret_" + l].style.display = "");
      if (c === "III") marca["III_" + lado].style.display = "";
      if (c === "EW") ls.forEach(l => marca["EW_" + l].style.display = "");
      if (c === "fármaco") marca["farm_" + lado].style.display = "";
      if (c === "simp") marca.simp.style.display = "";
      ult = "";
    }
    resumen();

    function letrero(luz) {
      const L = P.LESIONES[E.les], lado = E.lado, pu = P.pupila(E.les, lado, luz, E.cerca);
      const ilum = ["D", "I"].filter(l => luz[l] > 0);
      let h;
      if (ilum.length) {
        const e = ilum[0], r = P.reflejos(E.les, lado, e);
        h = `<span class="k">Luz</span> en el ojo ${LADOS[e]} → fotomotor directo ${U.sem(r.directo)} · consensual en el ${LADOS[otro(e)]} ${U.sem(r.consensual)}`;
      } else if (E.cerca > 0.3) {
        const a = P.acomodacion(E.les, lado);
        h = `<span class="k">Cerca</span> el objeto se acerca → convergencia y acomodación: contracción pupilar derecha ${U.sem(a.D)}, izquierda ${U.sem(a.I)}`;
      } else h = `<span class="k">Reposo</span> sin luz: la pupila se dilata. Mueve la linterna a un ojo.`;
      const tam = e => { const d = pu[e].d; return `${U.fmt(d)} mm${d < 2 ? " (miosis)" : d > 6 ? " (midriasis)" : ""}`; };
      return h + `<br><span class="nota">Meta del modelo: OD ${tam("D")} · OI ${tam("I")}</span>`;
    }

    /* ---------- bucle ---------- */
    let cerca0 = -1;
    U.loop((dt) => {
      tt += dt;
      // oscilación automática
      if (E.oscila) {
        E.tSw += dt;
        const idx = Math.floor(E.tSw / 2) % 2, objetivo = idx === 0 ? otro(E.lado) : E.lado, P0 = E.pos || [300, CY];
        mover(P0[0] + (CX[objetivo] - P0[0]) * Math.min(1, dt * 6), P0[1] + (CY - P0[1]) * Math.min(1, dt * 6));
      }
      if (E.auto) { E.tA += dt; const f = E.tA / 4; E.cerca = f < .5 ? f * 2 : Math.max(0, 2 - f * 2); rng.value = Math.round(E.cerca * 100); if (f >= 1) { E.auto = false; E.cerca = 0; rng.value = 0; } }
      // luz con latencia
      const li = luzIn(), last = hist[hist.length - 1][1];
      if (li.D !== last.D || li.I !== last.I) hist.push([tt, li]);
      const le = luzEf(), pu = P.pupila(E.les, E.lado, le, E.cerca), sr = P.signosReposo(E.les, E.lado);
      for (const e of ["D", "I"]) {
        const tg = pu[e].d, tau = tg < dia[e] ? P.TAU_CONTRAE : P.TAU_DILATA;
        dia[e] += (tg - dia[e]) * (1 - Math.exp(-dt / tau));
        // la mirada: convergencia al acercar el objeto (el III la hace) y desviación del III paralizado
        const m = sr.mirada[e], noConv = E.les === "iii" && E.lado === e;
        let px = (e === "D" ? -1 : 1) * 0.5 * E.cerca * (noConv ? 0 : 1), py = 0;
        if (m) { px += (e === "D" ? 1 : -1) * m.abd; py += m.y; }
        ojos[e].set({ d: dia[e], px, py, ptosis: sr.ptosis[e], enof: sr.enoftalmos[e], irregular: pu[e].irregular });
        rotulo[e].textContent = `${U.fmt(dia[e])} mm`;
      }
      dedo.setAttribute("r", (5 + E.cerca * 22).toFixed(1)); dedo.setAttribute("cy", (150 + E.cerca * 10).toFixed(1));
      // diagrama (con la luz sin retraso: muestra la señal que se envía)
      const v = P.via(E.les, E.lado, le);
      const col = k => "rgba(245,158,11," + Math.min(1, v[k] * 1) + ")";
      for (const k in seg) { seg[k].setAttribute("stroke-opacity", Math.max(0, Math.min(1, v[k])).toFixed(2)); seg[k].setAttribute("stroke", "#F59E0B"); }
      const mapa = { retD: "retD", retI: "retI", q: "quiasma", preD: "preD", preI: "preI", EWD: "EWD", EWI: "EWI", n3D: "n3D", n3I: "n3I", irD: "n3D", irI: "n3I" };
      for (const k in nodo) nodo[k].style.fill = v[mapa[k]] > 0.05 ? col(mapa[k]) : "";
      // la vía simpática: verde si está sana; apagada si hay Horner
      simp.forEach(s => s.setAttribute("stroke-opacity", E.les === "horner" ? .12 : .85));
      // letrero (solo cuando cambia)
      const clave = JSON.stringify([le, E.les, E.lado, Math.round(E.cerca * 3)]);
      if (clave !== ult) { ult = clave; U.$("#letrero", cont).innerHTML = letrero(le); }
    });
  };
})();
