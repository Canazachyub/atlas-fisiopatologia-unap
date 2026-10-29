/* ECG interactivo — secciones: anatomía, física, fisiología, derivaciones, papel, lectura, patologías y prueba. */
(function () {
  "use strict";
  const E = window.ECG, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$, css = U.css;
  const raf = f => { const g = U._gen || 0, id = requestAnimationFrame(t => { if ((U._gen || 0) === g) f(t); }); U._raf = id; return id; };
  const detenerPrev = U.detener;
  U.detener = () => { U._gen = (U._gen || 0) + 1; detenerPrev(); if (U._raf) cancelAnimationFrame(U._raf); U._raf = null; (U._timers || []).forEach(clearInterval); U._timers = []; };
  const cada = (f, ms) => { const id = setInterval(f, ms); (U._timers = U._timers || []).push(id); return id; };
  const deg = r => r * 180 / Math.PI;

  /* =====================================================================
     ANATOMÍA: el sistema de conducción
     ===================================================================== */
  const ESTRUCT = [
    { k: "sa", n: "Nódulo sinusal", p: U.GEO.sa, e: { sa: 1, aur: 1, aurFrente: 0.15 },
      t: "Masa pequeña de tejido neuromuscular con aspecto de <b>caracol</b>, en la aurícula derecha, en la desembocadura de la <b>vena cava superior</b>. Es el marcapaso normal: fija la FC en <span class=dato>60-100 lpm</span>. Irrigación: <b>55 %</b> coronaria derecha, <b>45 %</b> circunfleja. El simpático lo acelera; el vago lo frena." },
    { k: "aur", n: "Vías internodales y aurículas", p: [650, 300], e: { aur: 1, aurFrente: 0.7 },
      t: "Desde el nódulo sinusal el impulso despolariza primero la <b>aurícula derecha</b> y después la <b>izquierda</b>: por eso la onda P tiene un componente de cada aurícula (se ve bien en V1)." },
    { k: "av", n: "Nódulo auriculoventricular", p: U.GEO.av, e: { av: 1 },
      t: "En el tabique interauricular e interventricular. Aquí el estímulo sufre una <b>lentificación fisiológica</b> (el segmento PR): da tiempo a que las aurículas terminen de llenar los ventrículos. Irrigación: <b>90 %</b> coronaria derecha, 10 % circunfleja. Si el sinusal falla, toma el mando a <span class=dato>40-60 lpm</span>." },
    { k: "his", n: "Haz de His", p: U.GEO.his, e: { his: 1 },
      t: "Simple continuación del nódulo AV que corre a lo largo del tabique interventricular y se divide en dos ramas." },
    { k: "rd", n: "Rama derecha", p: [790, 600], e: { rd: 1 },
      t: "Delgada y de trayecto largo, en el endocardio del lado derecho del tabique. <b>Por ser delgada y larga es la más vulnerable al bloqueo por la enfermedad de Chagas.</b>" },
    { k: "ri", n: "Rama izquierda", p: [880, 620], e: { ri: 1 },
      t: "Relativamente gruesa; atraviesa el lado izquierdo del tabique y se subdivide en ramas anterior, superior, posterior e inferior." },
    { k: "purk", n: "Fibras de Purkinje", p: [990, 780], e: { purk: 1, ri: 1, rd: 1 },
      t: "Terminan ambas ramas y completan la despolarización ventricular (el QRS). Pueden sostener el ritmo a <span class=dato>30-40 lpm</span> si el nódulo AV también falla." },
    { k: "mio", n: "Células miocárdicas", p: [1050, 560], e: { ven: 1, vi: 1, vd: 1 },
      t: "La maquinaria contráctil: ejecutan el trabajo de bombeo. Su despolarización da el QRS y su repolarización la onda T." }
  ];
  SECC.anatomia = function (main) {
    main.innerHTML = `<h1>Anatomía eléctrica del corazón</h1>
      <p class="lema">Desde el punto de vista del ECG el corazón tiene <b>tres tipos de células</b>: las del <b>marcapaso</b> (generan el estímulo), las de <b>conducción</b> (largas como hilos eléctricos: lo transportan rápido) y las <b>miocárdicas</b> (se contraen). Toca cada estructura.</p>
      <div class="grid2"><div id="cz"></div>
      <div><div class="caja info" id="a-info"><h3 style="margin-top:0">Toca un círculo amarillo</h3><p>Sigue el orden de los números: es el camino del impulso.</p></div>
      <div class="caja"><h3 style="margin-top:0">Jerarquía de marcapasos</h3>
        <table><tr><th>Quién manda</th><th>Frecuencia</th><th>Cuándo</th></tr>
        <tr><td>Nódulo sinusal</td><td class="dato">60-100 lpm</td><td>Siempre, si está sano</td></tr>
        <tr><td>Nódulo AV</td><td class="dato">40-60 lpm</td><td>Si el sinusal cesa</td></tr>
        <tr><td>Fibras de Purkinje</td><td class="dato">30-40 lpm</td><td>Si el AV también falla</td></tr></table>
        <p class="nota">El más rápido manda: por eso, normalmente, solo vemos el ritmo sinusal.</p>
        <a class="btn sec" href="#sim">🫀 Verlo funcionar en el simulador</a></div></div></div>`;
    const pintar = U.corazon($("#cz"), { etiquetas: false });
    const S = $("#cz svg");
    S.insertAdjacentHTML("beforeend", ESTRUCT.map((x, i) => `<g class="hit" data-i="${i}" transform="translate(${x.p[0]},${x.p[1]})">
      <circle r="24" class="marcador"/><text text-anchor="middle" dy="9" font-size="26" font-weight="800" fill="#1b1b1b">${i + 1}</text></g>`).join(""));
    S.insertAdjacentHTML("beforeend", `<circle id="a-anillo" r="44" fill="none" stroke="#22d3ee" stroke-width="8" opacity="0"/>`);
    const base = { aur: 0, sa: 0, av: 0, his: 0, rd: 0, ri: 0, purk: 0, ven: 0, vd: 0, vi: 0, rep: 0, bloqueo: 0 };
    let sel = -1;
    function elegir(i) {
      sel = i; const x = ESTRUCT[i];
      $$(".hit", S).forEach(g => g.style.opacity = +g.dataset.i === i ? 1 : 0.45);
      const an = $("#a-anillo", S); an.setAttribute("cx", x.p[0]); an.setAttribute("cy", x.p[1]);
      $("#a-info").innerHTML = `<h3 style="margin-top:0">${i + 1}. ${x.n}</h3><p>${x.t}</p>
        <div class="ctrl">${i > 0 ? `<button class="btn sec" id="ant">← ${ESTRUCT[i - 1].n}</button>` : ""}${i < ESTRUCT.length - 1 ? `<button class="btn" id="sig">${ESTRUCT[i + 1].n} →</button>` : ""}</div>`;
      $("#ant") && ($("#ant").onclick = () => elegir(i - 1)); $("#sig") && ($("#sig").onclick = () => elegir(i + 1));
    }
    $$(".hit", S).forEach(g => g.onclick = () => elegir(+g.dataset.i));
    let fase = 0;
    cada(() => { fase = (fase + 1) % 40; const x = sel >= 0 ? ESTRUCT[sel] : null;
      if (x) { const an = $("#a-anillo", S), u = (fase % 20) / 20; an.setAttribute("r", 30 + 40 * u); an.setAttribute("opacity", 0.9 * (1 - u)); }
      pintar(Object.assign({}, base, x ? x.e : {}, x && fase % 20 > 12 ? { sa: 0, av: 0 } : {}), { tipo: "normal" }); }, 60);
    pintar(base, { tipo: "normal" });
  };

  /* =====================================================================
     FÍSICA: dipolo, proyección y planos
     ===================================================================== */
  /* complejos en columnas: cada derivación en su recuadro, con su propia escala de tiempo (para ampliar el QRS) */
  U.columnas = function (cv, ecg, ders, opc) {
    const w = cv.clientWidth || 600, H = opc.alto || 170, d = Math.min(2, devicePixelRatio || 1);
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(w * d); cv.height = Math.round(H * d); cv.style.height = H + "px"; }
    const c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0);
    c.fillStyle = css("--papel-ecg"); c.fillRect(0, 0, w, H);
    const n = ders.length, colW = w / n, top = 26, bot = H - 10, y0 = top + (bot - top) * (opc.base || 0.62), k = (bot - top) * (opc.mvAlto || 0.32);
    const paso = Math.max(4, k / 10);   // grilla: 1 mm = 0.1 mV en la escala vertical
    c.lineWidth = 1;
    for (let y = y0 % paso; y < H; y += paso) { c.strokeStyle = Math.round((y - y0) / paso) % 5 ? css("--linea-ecg") : css("--linea-ecg2"); c.beginPath(); c.moveTo(0, y + .5); c.lineTo(w, y + .5); c.stroke(); }
    for (let x = 0; x < w; x += paso) { c.strokeStyle = Math.round(x / paso) % 5 ? css("--linea-ecg") : css("--linea-ecg2"); c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); }
    ders.forEach((der, i) => {
      const x0 = i * colW + 8, x1 = (i + 1) * colW - 8, X = t => x0 + (t - opc.t0) / (opc.t1 - opc.t0) * (x1 - x0);
      if (i) { c.strokeStyle = css("--borde"); c.lineWidth = 1.5; c.beginPath(); c.moveTo(i * colW, 4); c.lineTo(i * colW, H - 4); c.stroke(); }
      c.fillStyle = (opc.rojas || []).includes(der) ? css("--ro") : css("--az"); c.font = "700 14px Fredoka, Nunito, sans-serif"; c.fillText(der, x0, 17);
      const traza = (t1, col, ancho, alfa) => { c.globalAlpha = alfa; c.strokeStyle = col; c.lineWidth = ancho; c.lineJoin = "round"; c.beginPath();
        for (let t = opc.t0, j = 0; t <= t1 + 1e-9; t += (opc.t1 - opc.t0) / 260, j++) { const px = X(t), py = Math.max(top - 4, Math.min(bot + 4, y0 - E.valor(ecg, der, t) * k)); j ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.stroke(); c.globalAlpha = 1; };
      if (opc.hasta != null) traza(opc.t1, css("--traza"), 1.5, 0.22);   // silueta completa, tenue
      traza(opc.hasta != null ? Math.min(opc.t1, opc.hasta) : opc.t1, css("--traza"), 2.3, 1);
      if (opc.hasta != null && opc.hasta <= opc.t1) { const px = X(opc.hasta), py = y0 - E.valor(ecg, der, opc.hasta) * k; c.fillStyle = css("--ro"); c.beginPath(); c.arc(px, py, 4.5, 0, 7); c.fill(); }
    });
  };

  SECC.fisica = function (main) {
    main.innerHTML = `<h1>La física del ECG <span class="lit">literatura</span></h1>
      <p class="lema">El ECG no mide el corazón "por dentro": mide desde la piel la <b>diferencia de potencial</b> que crea el frente de activación. Tres ideas bastan para entender todo el trazado.</p>
      <h2>1 · El frente de onda es un dipolo</h2>
      <div class="grid2"><div class="caja" style="padding:8px"><div class="lienzo" id="dp"><img src="img/dipolo.webp" alt="Fibras miocárdicas" style="filter:grayscale(.85) brightness(1.08)">
        <svg class="sobre" viewBox="0 0 1536 1024">
          <defs><marker id="pf" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1E3A8A"/></marker></defs>
          <rect id="dp-act" x="0" y="300" width="0" height="400" fill="#ef4444" opacity=".42" style="mix-blend-mode:multiply"/>
          <rect id="dp-rec" x="0" y="300" width="0" height="400" fill="#3b82f6" opacity=".3" style="mix-blend-mode:multiply"/>
          <g id="dp-carg" font-size="46" font-weight="800" font-family="Fredoka"></g>
          <g id="dp-rayos" stroke-width="6" stroke-dasharray="18 12" fill="none"></g>
          <line id="dp-vec" x1="0" y1="250" x2="0" y2="250" stroke="#1E3A8A" stroke-width="12" marker-end="url(#pf)"/>
          ${[["E1", 1470, 500], ["E2", 66, 500], ["E3", 768, 150]].map(([n, x, y]) => `<g transform="translate(${x},${y})"><circle r="34" fill="#FACC15" stroke="#1b1b1b" stroke-width="4"/><text text-anchor="middle" dy="13" font-size="34" font-weight="800">${n.slice(1)}</text></g>`).join("")}
        </svg></div>
        <div class="ctrl"><button class="btn" id="dp-dep">⚡ Despolarizar</button><button class="btn sec" id="dp-rep">💧 Repolarizar</button><span class="nota" id="dp-est"></span></div>
        <div class="ctrl"><button class="btn sec" id="dp-p">⏸ Pausa</button><button class="btn sec" id="dp-s">Paso ⏭</button>
          <label>Velocidad <input type="range" id="dp-v" min="0.1" max="2" step="0.05" value="1"></label></div></div>
      <div><div class="grid3" style="grid-template-columns:1fr">${[1, 2, 3].map(i => `<div class="caja" style="padding:8px 10px"><b>Electrodo ${i}</b> <span class="nota">${["a la derecha: la onda viene hacia él", "a la izquierda: la onda se aleja", "arriba: la onda pasa de costado"][i - 1]}</span>
          <div id="dp-e${i}" style="font-weight:700;font-size:14.5px;min-height:21px"></div><canvas class="ecg" id="dp-c${i}" style="height:96px"></canvas></div>`).join("")}</div>
        <div class="caja"><p>En reposo la célula es <b>positiva por fuera</b>. Al activarse se vuelve <b>negativa por fuera</b>. En el borde entre las dos zonas hay un dipolo: <b>− detrás, + delante</b>, y su vector apunta hacia donde avanza la onda.</p>
        <ul><li>Si la onda <b>se acerca</b> al electrodo positivo → <b>deflexión positiva</b>.</li><li>Si <b>se aleja</b> → <b>negativa</b>.</li><li>Si pasa <b>perpendicular</b> → <b>bifásica</b> (isodifásica).</li></ul>
        <p class="nota">Al repolarizar, el dipolo se invierte (+ detrás). En esta tira aislada la T sale negativa en el electrodo 1; en el ventrículo real la T es positiva porque la repolarización avanza al revés (del epicardio al endocardio) y los dos signos se compensan.</p></div></div></div>
      <h2>2 · Cada derivación es una proyección del vector</h2>
      <div class="grid2"><div class="caja"><svg id="rueda" viewBox="-330 -330 660 660" style="width:100%;max-width:560px;display:block;margin:auto;touch-action:none"></svg>
        <p class="nota" style="text-align:center">Arrastra la flecha (el eje del QRS) · el lado <b>+</b> de cada derivación está marcado</p></div>
      <div><div class="caja" id="eje-info"></div><div class="caja" style="padding:8px"><canvas class="ecg" id="eje-c" style="height:190px"></canvas></div></div></div>
      <h2>3 · El plano horizontal: de V1 a V6</h2>
      <div class="grid2"><div class="caja" style="padding:8px"><div class="lienzo" id="ch"><img src="img/corte.webp" alt="Corte transversal del tórax a nivel de los ventrículos">
        <svg class="sobre" viewBox="0 0 1536 1024"><g id="ch-rayos"></g><path id="ch-bucle" fill="none" stroke="#1E3A8A" stroke-width="7" stroke-linecap="round"/>
        <line id="ch-vec" stroke="#B91C1C" stroke-width="10" stroke-linecap="round"/><circle id="ch-punta" r="12" fill="#B91C1C"/></svg></div>
        <p class="nota">Corte visto desde los pies (como una tomografía): arriba el esternón, a tu derecha el lado izquierdo del paciente.</p></div>
      <div class="caja"><p>El vector del QRS empieza en el <b>septo</b> (hacia la derecha y adelante: la pequeña <b>r de V1</b> y la <b>q de V6</b>) y luego gira hacia el <b>ventrículo izquierdo</b>, grueso, atrás y a la izquierda: <b>S profunda en V1</b>, <b>R alta en V5-V6</b>. Entre medio está la transición (V3-V4, sobre el tabique).</p>
        <canvas class="ecg" id="ch-c" style="height:200px"></canvas><p class="nota" style="margin:2px 0 0">El QRS está <b>ampliado en el tiempo</b> (unas 6 veces) para ver cómo se forma: en gris el complejo completo; el trazo y el punto rojo avanzan con el vector.</p>
        <div class="ctrl"><button class="btn sec" id="ch-p">⏸ Pausa</button><button class="btn sec" id="ch-s">Paso +5 ms ⏭</button>
          <label>Velocidad <input type="range" id="ch-v" min="0.1" max="2" step="0.05" value="1"></label><b id="ch-t"></b></div>
        <p class="nota">V1-V2 miran el ventrículo derecho · V3-V4 el tabique · V5-V6 el ventrículo izquierdo.</p></div></div>`;

    /* --- 1. dipolo --- */
    // Cada electrodo ve el dipolo del frente: V ∝ (dirección del frente · vector al electrodo) / distancia³, con un
    // "radio" de suavizado para que no se dispare cerca del electrodo. Los electrodos laterales se calculan un poco por
    // fuera de la tira (así el 1 ve la onda acercarse todo el tiempo y el 2 alejarse). La tira se dibuja contra la
    // posición del frente: lo que está a la izquierda del cursor ya pasó, a la derecha todavía no.
    const cvs = [1, 2, 3].map(i => $("#dp-c" + i)), ELS = [[1470, 500], [66, 500], [768, 150]], VIRT = [[2500, 500], [-964, 500], [768, 150]];
    const NB = 260, H = 96, FMAX = 1.14, series = [[], [], []];   // el eje sigue un poco después del final: se ve volver a 0
    let modo = "dep", f = -0.15, corre = true;
    const crudo = (k, xf) => { const dx = VIRT[k][0] - xf, dy = VIRT[k][1] - 500, a = k === 2 ? 260 : 700; return dx / Math.pow(dx * dx + dy * dy + a * a, 1.5); };
    const NORM = VIRT.map((_, k) => { let m = 0; for (let x = 0; x <= 1536; x += 8) m = Math.max(m, Math.abs(crudo(k, x))); return m; });
    // el frente nace y se apaga en los bordes de la tira: la curva entra y sale suave de 0 (sin escalones)
    const borde = xf => { const u = xf / 1536, r = Math.min(1, u / 0.07, (1 - u) / 0.07); return r <= 0 ? 0 : r * r * (3 - 2 * r); };
    const potencial = (k, xf, signo) => signo * crudo(k, xf) / NORM[k] * borde(xf);   // −1 … +1
    function ajustaC() { cvs.forEach(c => { const d = Math.min(2, devicePixelRatio || 1); c.width = c.clientWidth * d; c.height = H * d; c.getContext("2d").setTransform(d, 0, 0, d, 0, 0); }); }
    ajustaC(); U.alRedimensionar = ajustaC;
    function dibujaSerie(c, s, fAct) {
      const x = c.getContext("2d"), w = c.clientWidth, y0 = H / 2, A = H * 0.4, X = b => 34 + b / NB * (w - 44);
      x.fillStyle = css("--papel-ecg"); x.fillRect(0, 0, w, H); x.strokeStyle = css("--linea-ecg"); x.lineWidth = 1;
      for (let i = 34; i < w; i += 10) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
      x.strokeStyle = css("--linea-ecg2"); x.beginPath(); x.moveTo(34, y0); x.lineTo(w, y0); x.stroke();
      x.font = "700 13px Fredoka, Nunito, sans-serif"; x.fillStyle = css("--ve"); x.fillText("+", 14, y0 - A + 8); x.fillStyle = css("--ro"); x.fillText("−", 15, y0 + A); x.fillStyle = css("--tx2"); x.fillText("0", 14, y0 + 4);
      // área bajo la curva: verde si es positiva, roja si es negativa
      for (let b = 1; b < s.length; b++) {
        const v = s[b]; if (v == null || s[b - 1] == null) continue;
        x.fillStyle = v >= 0 ? "rgba(34,197,94,.28)" : "rgba(239,68,68,.28)"; x.fillRect(X(b - 1), Math.min(y0, y0 - v * A), X(b) - X(b - 1) + 0.5, Math.abs(v * A));
      }
      x.strokeStyle = css("--traza"); x.lineWidth = 2.4; x.lineJoin = "round"; x.beginPath(); let prim = true;
      s.forEach((v, b) => { if (v == null) return; const px = X(b), py = y0 - v * A; prim ? x.moveTo(px, py) : x.lineTo(px, py); prim = false; }); x.stroke();
      if (fAct > 0 && fAct < FMAX) {   // cursor: dónde va el frente ahora
        const px = X(fAct / FMAX * NB); x.strokeStyle = css("--azc"); x.setLineDash([4, 4]); x.lineWidth = 1.5; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); x.setLineDash([]);
        const v = s[Math.min(NB, Math.round(fAct / FMAX * NB))] || 0; x.fillStyle = css("--azc"); x.beginPath(); x.arc(px, y0 - v * A, 5, 0, 7); x.fill();
      }
    }
    let pausaD = false, pendiente = 0;
    function cuadroDipolo() {
      const inc = pausaD ? pendiente : (corre ? 0.0042 * +$("#dp-v").value : 0); pendiente = 0;
      f += inc;
      const xf = Math.max(0, Math.min(1536, f * 1536)), act = f > 0 && f < 1, sg = modo === "dep" ? 1 : -1;
      $("#dp-act").setAttribute("width", modo === "dep" ? xf : 1536);
      $("#dp-rec").setAttribute("width", modo === "rep" ? xf : 0);
      $("#dp-vec").setAttribute("x1", xf - 110); $("#dp-vec").setAttribute("x2", xf + 110); $("#dp-vec").setAttribute("opacity", act ? 1 : 0);
      $("#dp-vec").setAttribute("transform", sg < 0 ? `rotate(180 ${xf} 250)` : "");
      $("#dp-carg").innerHTML = act ? [330, 690].map(y => `<text x="${xf - 70}" y="${y}" fill="${sg > 0 ? "#B91C1C" : "#1E3A8A"}">${sg > 0 ? "−" : "+"}</text><text x="${xf + 30}" y="${y}" fill="${sg > 0 ? "#1E3A8A" : "#B91C1C"}">${sg > 0 ? "+" : "−"}</text>`).join("") : "";
      // rayos del frente a cada electrodo, del color de lo que registra
      $("#dp-rayos").innerHTML = act ? ELS.map((el, k) => { const v = potencial(k, xf, sg); return `<line x1="${xf}" y1="500" x2="${el[0]}" y2="${el[1]}" stroke="${v >= 0.05 ? "#16A34A" : v <= -0.05 ? "#DC2626" : "#64748B"}" opacity="${0.35 + 0.6 * Math.min(1, Math.abs(v))}"/>`; }).join("") : "";
      ELS.forEach((el, k) => {
        const s = series[k];
        if (f > 0) { const b = Math.min(NB, Math.round(f / FMAX * NB)); for (let i = s.length; i <= b; i++) { const fi = i / NB * FMAX; s[i] = fi < 1 ? potencial(k, fi * 1536, sg) : 0; } }
        dibujaSerie(cvs[k], s, f);
        const v = act ? potencial(k, xf, sg) : 0, dir = act ? (k === 2 ? (xf < el[0] ? "se acerca" : "se aleja") : k === 0 ? "se acerca" : "se aleja") : "";
        $("#dp-e" + (k + 1)).innerHTML = !act ? (f >= 1 ? `<span style="color:var(--tx2)">${modo === "dep" ? "Todo activado igual" : "Todo en reposo otra vez"} → no hay diferencia → <b>línea en 0</b></span>` : `<span style="color:var(--tx2)">Reposo: no hay frente → 0</span>`)
          : `<span style="color:${v >= 0.05 ? "var(--ve)" : v <= -0.05 ? "var(--ro)" : "var(--tx2)"}">${sg > 0 ? "El + del dipolo" : "El frente de repolarización (− delante)"} ${dir} → ${v >= 0.05 ? "deflexión <b>positiva</b> ↑" : v <= -0.05 ? "deflexión <b>negativa</b> ↓" : "casi 0 (justo enfrente: cambia de signo)"}</span>`;
      });
      $("#dp-est").textContent = !act ? (f >= 1 ? (modo === "dep" ? "Tira toda activada: no hay frente → línea isoeléctrica (como el ST)" : "Tira en reposo otra vez") : "En reposo: no hay frente, no hay corriente") : (modo === "dep" ? "Frente de despolarización avanzando →" : "Frente de repolarización avanzando →");
      if (f > FMAX + 0.02) corre = false;
      raf(cuadroDipolo);
    }
    const reinicia = m => { modo = m; f = -0.06; corre = true; series.forEach(s => s.length = 0); };
    $("#dp-p").onclick = () => { pausaD = !pausaD; $("#dp-p").textContent = pausaD ? "▶ Seguir" : "⏸ Pausa"; };
    $("#dp-s").onclick = () => { pausaD = true; $("#dp-p").textContent = "▶ Seguir"; if (!corre && f > 1.1) return; corre = true; pendiente = 0.04; };
    $("#dp-dep").onclick = () => reinicia("dep");
    $("#dp-rep").onclick = () => reinicia("rep");
    raf(cuadroDipolo);

    /* --- 2. rueda hexaxial --- */
    const R = $("#rueda"), FR = ["DI", "DII", "DIII", "aVR", "aVL", "aVF"];
    let ang = 55, mag = 1;
    const pt = (a, r) => [r * Math.cos(E.rad(a)), r * Math.sin(E.rad(a))];
    R.innerHTML = `<defs><marker id="pr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B91C1C"/></marker></defs>
      <path d="M0,0 L300,0 A300,300 0 0 1 0,300 Z" fill="#16A34A" opacity=".12"/>
      <circle r="300" fill="none" stroke="currentColor" opacity=".25" stroke-width="2"/>
      ${FR.map(d => { const a = E.DER[d].ang, [x, y] = pt(a, 300), [x2, y2] = pt(a + 180, 300), [tx, ty] = pt(a, 318);
        return `<line x1="${x2}" y1="${y2}" x2="${x}" y2="${y}" stroke="var(--azc)" stroke-width="2.5" opacity=".55"/><circle cx="${x}" cy="${y}" r="7" fill="var(--azc)"/>
        <text x="${tx}" y="${ty + 6}" text-anchor="middle" font-family="Fredoka" font-size="20" fill="var(--az)">${d}+</text>`; }).join("")}
      ${[0, 90, 180, -90].map(a => { const [x, y] = pt(a, 268); return `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" fill="var(--tx2)">${a > 0 ? "+" : ""}${a}°</text>`; }).join("")}
      <line id="flecha" x1="0" y1="0" stroke="#B91C1C" stroke-width="9" stroke-linecap="round" marker-end="url(#pr)"/>
      <circle id="agarre" r="22" fill="#FACC15" stroke="#1b1b1b" stroke-width="3" style="cursor:grab"/>`;
    R.style.color = "var(--tx)";
    function cuadrante(I, F) {
      if (I >= 0 && F >= 0) return ["CII · cuadrante inferior izquierdo (0° a +90°)", "Eje normal"];
      if (I < 0 && F >= 0) return ["CID · cuadrante inferior derecho (+90° a ±180°)", "Desviado a la derecha"];
      if (I >= 0 && F < 0) return ["CSI · cuadrante superior izquierdo (−90° a 0°)", "Desviado a la izquierda"];
      return ["CSD · cuadrante superior derecho (180° a −90°)", "Eje extremo"];
    }
    function pintaEje() {
      const [x, y] = pt(ang, 240 * mag);
      $("#flecha").setAttribute("x2", x); $("#flecha").setAttribute("y2", y); $("#agarre").setAttribute("cx", x); $("#agarre").setAttribute("cy", y);
      const v = [Math.cos(E.rad(ang)) * mag, Math.sin(E.rad(ang)) * mag, 0], p = {};
      FR.forEach(d => p[d] = E.dot(v, E.DER[d].eje) * 15);
      const [q, s] = cuadrante(p.DI, p.aVF), iso = FR.slice().sort((a, b) => Math.abs(p[a]) - Math.abs(p[b]))[0];
      const ae = Math.round(((ang + 540) % 360) - 180);
      $("#eje-info").innerHTML = `<h3 style="margin-top:0">Eje del QRS: ${ae > 0 ? "+" : ""}${ae}° · <span style="color:${s === "Eje normal" ? "var(--ve)" : "var(--ro)"}">${s}</span></h3>
        <table><tr><th>Derivación</th><th>QRS neto (mm)</th><th></th></tr>${FR.map(d => `<tr><td><b>${d}</b></td><td>${p[d].toFixed(1)}</td>
          <td style="width:45%"><div style="height:12px;border-radius:6px;background:var(--borde);position:relative"><i style="position:absolute;top:0;bottom:0;${p[d] >= 0 ? "left:50%" : "right:50%"};width:${Math.abs(p[d]) / 15 * 50}%;background:${p[d] >= 0 ? "var(--ve)" : "var(--ro)"};border-radius:6px"></i></div></td></tr>`).join("")}</table>
        <p><b>Paso 1</b>: DI ${p.DI >= 0 ? "+" : "−"} y aVF ${p.aVF >= 0 ? "+" : "−"} → ${q}.<br><b>Paso 2</b>: la más isodifásica es <b>${iso}</b>; el eje es perpendicular a ella.</p>
        <p class="nota">Einthoven: DI + DIII = ${(p.DI + p.DIII).toFixed(1)} = DII (${p.DII.toFixed(1)}) · Wilson: aVR + aVL + aVF = ${(p.aVR + p.aVL + p.aVF).toFixed(1)}</p>`;
      // complejos de las 6 derivaciones frontales con el eje girado
      const ecg = E.construir({ tipo: "normal", fc: 70, rotar: ang - 53, amp: mag }, 3), l = ecg.latidos.find(x => x.tq != null);
      U.columnas($("#eje-c"), ecg, FR, { t0: l.tp - 0.04, t1: l.tq + 0.42, base: 0.58, mvAlto: 0.3, alto: 190, rojas: ["DI", "aVF"] });
    }
    let arrastra = false;
    const mover = ev => { if (!arrastra) return; const b = R.getBoundingClientRect(), x = (ev.clientX - b.left) / b.width * 660 - 330, y = (ev.clientY - b.top) / b.height * 660 - 330;
      ang = deg(Math.atan2(y, x)); mag = Math.max(0.35, Math.min(1.15, Math.hypot(x, y) / 240)); pintaEje(); };
    R.addEventListener("pointerdown", ev => { arrastra = true; R.setPointerCapture(ev.pointerId); mover(ev); });
    R.addEventListener("pointermove", mover); R.addEventListener("pointerup", () => arrastra = false);
    pintaEje();

    /* --- 3. plano horizontal --- */
    const C0 = [800, 380], ELIP = { cx: 768, cy: 530, rx: 610, ry: 470 }, PREC = ["V1", "V2", "V3", "V4", "V5", "V6"];
    function enPared(a) { // rayo desde el corazón con ángulo a (0 = izquierda del paciente, 90 = adelante)
      const dx = Math.cos(E.rad(a)), dy = -Math.sin(E.rad(a)); let lo = 0, hi = 1200;
      for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2, x = C0[0] + dx * m, y = C0[1] + dy * m; ((x - ELIP.cx) ** 2 / ELIP.rx ** 2 + (y - ELIP.cy) ** 2 / ELIP.ry ** 2 < 1) ? lo = m : hi = m; }
      return [C0[0] + dx * lo, C0[1] + dy * lo];
    }
    $("#ch-rayos").innerHTML = PREC.map(v => { const [x, y] = enPared(E.DER[v].ang);
      return `<line x1="${C0[0]}" y1="${C0[1]}" x2="${x}" y2="${y}" stroke="#3B82F6" stroke-width="4" stroke-dasharray="14 10" opacity=".7"/>
      <g transform="translate(${x},${y})"><circle r="30" fill="#FACC15" stroke="#1b1b1b" stroke-width="4"/><text text-anchor="middle" dy="11" font-size="28" font-weight="800">${v}</text></g>`; }).join("");
    const ecgH = E.construir({ tipo: "normal", fc: 60 }, 3), tq = ecgH.latidos[0].tq, Q = E.morfo(ecgH.cfg, ecgH.latidos[0]).Q;
    const vecEn = t => { let x = 0, z = 0; Q.forEach(c => { const g = Math.exp(-0.5 * ((t - c.c) / c.s) ** 2) * c.a; x += g * c.d[0]; z += g * c.d[2]; }); return [x, z]; };
    const esc = 260, aPant = ([x, z]) => [C0[0] + x * esc, C0[1] - z * esc];
    const bucle = []; for (let t = 0; t <= 0.1; t += 0.002) bucle.push(aPant(vecEn(t)));
    $("#ch-bucle").setAttribute("d", "M" + bucle.map(p => p.join(",")).join(" L"));
    const cvh = $("#ch-c"); let th = 0, pausaH = false;
    $("#ch-p").onclick = () => { pausaH = !pausaH; $("#ch-p").textContent = pausaH ? "▶ Seguir" : "⏸ Pausa"; };
    $("#ch-s").onclick = () => { pausaH = true; $("#ch-p").textContent = "▶ Seguir"; th = (th + 0.005) % 0.16; };
    function cuadroH() {
      if (!pausaH) th = (th + 0.0009 * +$("#ch-v").value) % 0.16;
      $("#ch-t").textContent = th <= 0.1 ? `QRS: ${Math.round(th * 1000)} ms` : "QRS terminado"; const t = Math.min(th, 0.1), p = aPant(vecEn(t));
      $("#ch-vec").setAttribute("x1", C0[0]); $("#ch-vec").setAttribute("y1", C0[1]); $("#ch-vec").setAttribute("x2", p[0]); $("#ch-vec").setAttribute("y2", p[1]);
      $("#ch-punta").setAttribute("cx", p[0]); $("#ch-punta").setAttribute("cy", p[1]);
      U.columnas(cvh, ecgH, PREC, { t0: tq - 0.015, t1: tq + 0.115, hasta: tq + Math.min(th, 0.115), base: 0.55, mvAlto: 0.22, alto: 200 });
      raf(cuadroH);
    }
    raf(cuadroH);
  };

  /* =====================================================================
     FISIOLOGÍA: potencial de acción e iones (literatura) + los tres tipos de células
     ===================================================================== */
  // potencial de acción simplificado (mV) en función del tiempo desde el inicio (s)
  function pAventr(t) {
    if (t < 0) return -90;
    if (t < 0.003) return -90 + 110 * t / 0.003;                    // fase 0
    if (t < 0.02) return 20 - 20 * (t - 0.003) / 0.017;             // fase 1
    if (t < 0.2) return 0 - 8 * (t - 0.02) / 0.18;                  // fase 2 meseta
    if (t < 0.3) return -8 - 82 * Math.pow((t - 0.2) / 0.1, 1.4);   // fase 3
    return -90;                                                      // fase 4
  }
  function fasV(t) { return t < 0 || t >= 0.3 ? 4 : t < 0.003 ? 0 : t < 0.02 ? 1 : t < 0.2 ? 2 : 3; }
  function pAnodo(t, ciclo) {  // nódulo sinusal: fase 4 que sube sola
    const u = ((t % ciclo) + ciclo) % ciclo;
    if (u < 0.05) return -40 + 50 * u / 0.05;                       // fase 0 (calcio, lenta)
    if (u < 0.2) return 10 - 70 * (u - 0.05) / 0.15;                // fase 3
    return -60 + 20 * (u - 0.2) / (ciclo - 0.2);                    // fase 4: despolarización diastólica
  }
  function fasN(t, ciclo) { const u = ((t % ciclo) + ciclo) % ciclo; return u < 0.05 ? 0 : u < 0.2 ? 3 : 4; }
  const CANALES = [   // x del canal en img/membrana.webp; dir +1 = entra a la célula
    { x: 195, ion: "Na⁺", col: "#2563EB", dir: 1 }, { x: 578, ion: "Ca²⁺", col: "#EA580C", dir: 1 },
    { x: 960, ion: "K⁺", col: "#7C3AED", dir: -1 }, { x: 1343, ion: "Na⁺/K⁺", col: "#16A34A", dir: 0 }];
  SECC.fisiologia = function (main) {
    main.innerHTML = `<h1>Fisiología: de la célula al trazado</h1>
      <p class="lema">Cada onda del ECG es la suma de millones de <b>potenciales de acción</b>. El ECG de superficie no ve los iones, pero cada fase de la célula ventricular coincide con un tramo del trazado.</p>
      <div class="grid3">
        <div class="tarj na"><b class="t">Células del marcapaso</b>Fuente de la fuerza eléctrica (nódulo sinusal, nódulo AV).</div>
        <div class="tarj"><b class="t">Células de conducción</b>Largas, como hilos eléctricos: transportan la corriente rápido y lejos (His, ramas, Purkinje).</div>
        <div class="tarj ro"><b class="t">Células miocárdicas</b>La maquinaria contráctil que ejecuta el bombeo.</div></div>
      <h2>Potencial de acción y canales iónicos <span class="lit">literatura</span></h2>
      <div class="chips" id="cel"><button class="chip act" data-c="v">Célula ventricular (miocárdica)</button><button class="chip" data-c="n">Célula del nódulo sinusal (marcapaso)</button></div>
      <div class="grid2"><div><div class="caja" style="padding:8px"><div class="lienzo"><img src="img/membrana.webp" alt="Membrana celular con canales iónicos">
        <svg class="sobre" viewBox="0 0 1536 1024" id="mb"><text x="40" y="120" font-size="36" font-family="Fredoka" fill="#1E3A8A">Fuera de la célula</text>
        <text x="40" y="900" font-size="36" font-family="Fredoka" fill="#7f1d1d">Dentro de la célula</text>
        ${CANALES.map((c, i) => `<text class="eti" x="${c.x}" y="${i % 2 ? 330 : 300}" text-anchor="middle" font-size="40" fill="${c.col}">${c.ion}</text>`).join("")}<g id="iones"></g></svg></div></div>
        <div class="letrero"><span class="k" id="f-k">4</span><span id="f-n"></span></div></div>
      <div class="caja"><canvas id="pa" style="width:100%;height:260px;display:block"></canvas>
        <div class="ctrl"><button class="btn sec" id="pa-p">⏸ Pausa</button><button class="btn sec" id="pa-s">Fase siguiente ⏭</button><button class="btn sec" id="pa-f">+10 ms</button>
          <label>Velocidad <input type="range" id="pa-v" min="0.02" max="1" step="0.02" value="0.3"></label></div>
        <p class="nota" id="pa-nota"></p></div></div>`;
    const FASES_V = ["Fase 0 · despolarización rápida: se abren los canales de <b>Na⁺</b> y el sodio entra → coincide con el <b>QRS</b>",
      "Fase 1 · repolarización inicial breve: sale algo de <b>K⁺</b> (la muesca)",
      "Fase 2 · meseta: entra <b>Ca²⁺</b> y sale K⁺ en equilibrio; el calcio dispara la contracción → coincide con el <b>segmento ST</b> (isoeléctrico: todo el ventrículo está igual)",
      "Fase 3 · repolarización: sale <b>K⁺</b> → coincide con la <b>onda T</b>",
      "Fase 4 · reposo (−90 mV): la bomba <b>Na⁺/K⁺</b> devuelve los iones → línea de base (diástole)"];
    const FASES_N = { 0: "Fase 0 · despolarización lenta por entrada de <b>Ca²⁺</b> (no de Na⁺): por eso el nódulo conduce lento",
      3: "Fase 3 · repolarización: sale <b>K⁺</b>", 4: "Fase 4 · <b>despolarización diastólica espontánea</b>: entra Na⁺ por la corriente «funny» y el potencial sube solo hasta el umbral. Es lo que hace marcapaso al nódulo; el simpático la empina (sube la FC) y el vago la aplana (baja la FC)" };
    let cel = "v", t = 0, pausa = false;
    const ecg = E.construir({ tipo: "normal", fc: 75 }, 30), cv = $("#pa");
    const ciclo = 0.8;
    $$("#cel .chip").forEach(b => b.onclick = () => { cel = b.dataset.c; $$("#cel .chip").forEach(x => x.classList.toggle("act", x === b)); });
    $("#pa-p").onclick = () => { pausa = !pausa; $("#pa-p").textContent = pausa ? "▶ Seguir" : "⏸ Pausa"; };
    const faseEn = x => { const tc = ((x % 0.8) + 0.8) % 0.8; return cel === "v" ? fasV(tc - 0.02) : fasN(tc + 0.62, ciclo); };
    $("#pa-s").onclick = () => { pausa = true; $("#pa-p").textContent = "▶ Seguir"; const f0 = faseEn(t); let k = 0; while (faseEn(t) === f0 && k++ < 1000) t += 0.001; t += 0.0005; };
    $("#pa-f").onclick = () => { pausa = true; $("#pa-p").textContent = "▶ Seguir"; t += 0.01; };
    const ionesG = $("#iones"), part = [];
    for (let i = 0; i < 26; i++) { ionesG.insertAdjacentHTML("beforeend", `<circle r="13" opacity="0"/>`); part.push({ el: ionesG.lastChild, c: 0, y: 0, v: 0, vivo: false }); }
    function lanza(c) { const p = part.find(q => !q.vivo); if (!p || c.dir === 0 && Math.random() < 0.5) return;
      // la bomba Na⁺/K⁺ saca 3 Na⁺ (azules, hacia afuera) por cada 2 K⁺ que mete (morados, hacia adentro)
      const naSale = c.dir === 0 && Math.random() < 0.6, dir = c.dir || (naSale ? -1 : 1);
      p.vivo = true; p.c = c; p.x = c.x + (Math.random() - 0.5) * 30; p.y = dir > 0 ? 240 : 760; p.v = dir * (9 + Math.random() * 5);
      p.el.setAttribute("fill", c.dir !== 0 ? c.col : naSale ? "#2563EB" : "#7C3AED"); }
    let ult = performance.now();
    function cuadro() {
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.05, (now - ult) / 1000)); ult = now;
      if (!pausa) t += dt * +$("#pa-v").value;
      const tq = ecg.latidos[0].tq, rr = 0.8, tc = (((t) % rr) + rr) % rr;          // tiempo dentro del ciclo, alineado al QRS
      const fase = cel === "v" ? fasV(tc - 0.02) : fasN(tc + 0.62, ciclo);
      $("#f-k").textContent = fase; $("#f-n").innerHTML = cel === "v" ? FASES_V[fase] : FASES_N[fase];
      // iones según la fase
      const activos = cel === "v" ? { 0: [0], 1: [2], 2: [1, 2], 3: [2], 4: [3] }[fase] : { 0: [1], 3: [2], 4: [0, 3] }[fase];
      if (!pausa && Math.random() < 0.35) activos.forEach(i => lanza(CANALES[i]));
      part.forEach(p => { if (!p.vivo) return; if (!pausa) p.y += p.v; if (p.y < 160 || p.y > 860) { p.vivo = false; p.el.setAttribute("opacity", 0); return; }
        p.el.setAttribute("cx", p.x); p.el.setAttribute("cy", p.y); p.el.setAttribute("opacity", 0.9); });
      // gráfico: potencial de acción arriba, ECG (DII) abajo, con el mismo tiempo
      const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = 260;
      if (cv.width !== Math.round(w * d)) { cv.width = w * d; cv.height = h * d; }
      const c = cv.getContext("2d"); c.setTransform(d, 0, 0, d, 0, 0); c.clearRect(0, 0, w, h);
      c.fillStyle = css("--papel"); c.fillRect(0, 0, w, h);
      const T0 = 0, T1 = rr * 1.6, X = s => 40 + (s - T0) / (T1 - T0) * (w - 50);
      c.strokeStyle = css("--borde"); c.lineWidth = 1; [0, -45, -90].forEach(mv => { const y = 20 + (20 - mv) / 110 * 120; c.beginPath(); c.moveTo(40, y); c.lineTo(w, y); c.stroke(); c.fillStyle = css("--tx2"); c.font = "11px Nunito"; c.fillText(mv + " mV", 2, y + 4); });
      c.strokeStyle = cel === "v" ? "#B91C1C" : "#EA580C"; c.lineWidth = 2.5; c.beginPath();
      for (let s = T0; s <= T1; s += 0.002) { const mv = cel === "v" ? pAventr(((s % rr) + rr) % rr - 0.02) : pAnodo(s + 0.62, ciclo); const y = 20 + (20 - mv) / 110 * 120; s === T0 ? c.moveTo(X(s), y) : c.lineTo(X(s), y); }
      c.stroke();
      c.strokeStyle = css("--traza") === "#7CFC9A" ? "#7CFC9A" : "#111827"; c.lineWidth = 2; c.beginPath();
      for (let s = T0; s <= T1; s += 0.002) { const y = 215 - E.valor(ecg, "DII", tq + s - 0.02 + 0.0) * 30; s === T0 ? c.moveTo(X(s), y) : c.lineTo(X(s), y); }
      c.stroke(); c.fillStyle = css("--tx2"); c.font = "12px Nunito"; c.fillText("ECG (DII)", 2, 205); c.fillText(cel === "v" ? "Potencial de acción ventricular" : "Potencial del nódulo sinusal", 44, 14);
      const xc = X(tc); c.strokeStyle = "#3B82F6"; c.lineWidth = 2; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(xc, 18); c.lineTo(xc, h - 6); c.stroke(); c.setLineDash([]);
      $("#pa-nota").innerHTML = cel === "v" ? "La fase 0 de todas las células ventriculares da el QRS; la meseta, el ST plano; la fase 3, la onda T. Por eso el QT mide la sístole eléctrica del ventrículo." : "La pendiente de la fase 4 decide la frecuencia: el nódulo sinusal es el más empinado (60-100 lpm), por eso manda.";
      raf(cuadro);
    }
    raf(cuadro);
  };

  /* =====================================================================
     DERIVACIONES: triángulo de Einthoven, Wilson y precordiales
     ===================================================================== */
  const ELEC = { RA: [478, 738], LA: [1058, 738], LL: [880, 990], RL: [652, 990] }, CORAZON = [785, 380];
  const BIP = { DI: ["RA", "LA", "Brazo izquierdo (+) menos brazo derecho (−)"], DII: ["RA", "LL", "Pierna izquierda (+) menos brazo derecho (−)"], DIII: ["LA", "LL", "Pierna izquierda (+) menos brazo izquierdo (−)"] };
  const UNI = { aVR: ["RA", "Potencial aumentado del brazo derecho"], aVL: ["LA", "Potencial aumentado del brazo izquierdo"], aVF: ["LL", "Potencial aumentado de la pierna izquierda (foot)"] };
  const PRE = { V1: [[675, 445], "4.º espacio intercostal derecho, línea paraesternal", "Ventrículo derecho"], V2: [[845, 445], "4.º espacio intercostal izquierdo, línea paraesternal", "Ventrículo derecho"],
    V3: [[918, 512], "Punto medio entre V2 y V4", "Tabique interventricular"], V4: [[992, 576], "5.º espacio intercostal izquierdo, línea medioclavicular", "Tabique interventricular"],
    V5: [[1108, 592], "5.º espacio intercostal izquierdo, línea axilar anterior", "Ventrículo izquierdo"], V6: [[1204, 600], "5.º espacio intercostal izquierdo, línea axilar media", "Ventrículo izquierdo"] };
  SECC.derivaciones = function (main) {
    main.innerHTML = `<h1>Las 12 derivaciones: desde dónde mira cada una</h1>
      <p class="lema">Seis derivaciones miran el corazón en el <b>plano frontal</b> (desde los miembros) y seis en el <b>plano horizontal</b> (desde el pecho). Toca cada una.</p>
      <h2>Plano frontal: bipolares y unipolares de los miembros</h2>
      <div class="grid2"><div class="caja" style="padding:8px"><div class="lienzo"><img src="img/torso.webp" alt="Figura humana con el corazón visible">
        <svg class="sobre" viewBox="0 0 1536 1024" id="ts"><defs><marker id="pd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#B91C1C"/></marker></defs>
        <polygon points="${[ELEC.RA, ELEC.LA, ELEC.LL].map(p => p.join(",")).join(" ")}" fill="none" stroke="#3B82F6" stroke-width="4" stroke-dasharray="16 10" opacity=".55"/>
        <line id="ts-l" stroke="#B91C1C" stroke-width="10" stroke-linecap="round" marker-end="url(#pd)" opacity="0"/>
        ${Object.entries(ELEC).map(([k, p]) => `<g transform="translate(${p[0]},${p[1]})"><circle r="30" fill="${{ RA: "#ef4444", LA: "#FACC15", LL: "#22c55e", RL: "#111827" }[k]}" stroke="#fff" stroke-width="5"/>
          <text class="eti" y="-44" text-anchor="middle" font-size="30" fill="#1E3A8A">${{ RA: "Brazo der.", LA: "Brazo izq.", LL: "Pierna izq.", RL: "Tierra" }[k]}</text></g>`).join("")}
        </svg></div><p class="nota">Colores de los electrodos según la norma europea (IEC) <span class="lit">literatura</span>. El de la pierna derecha es la tierra.</p></div>
      <div><div class="chips" id="dfr">${["DI", "DII", "DIII", "aVR", "aVL", "aVF"].map(d => `<button class="chip" data-d="${d}">${d}</button>`).join("")}</div>
        <div class="caja info" id="d-info"></div><div class="caja" style="padding:8px"><canvas class="ecg" id="d-c"></canvas></div>
        <div class="caja"><p><b>Einthoven</b>: DI, DII y DIII forman un triángulo equilátero cuyo centro es el centro eléctrico del corazón; se cumple <b>DI + DIII = DII</b>.<br>
        <b>Wilson</b> unió los tres miembros con una resistencia: <b>aVR + aVL + aVF = 0</b>. Además DI = ⅔ (aVL − aVR) · DII = ⅔ (aVF − aVR) · DIII = ⅔ (aVF − aVL).</p></div></div></div>
      <h2>Plano horizontal: precordiales V1 a V6</h2>
      <div class="grid2"><div class="caja" style="padding:8px"><div class="lienzo"><img src="img/precordial.webp" alt="Pared anterior del tórax con costillas y corazón">
        <svg class="sobre" viewBox="0 0 1536 1024">${Object.entries(PRE).map(([v, [p]]) => `<g class="hit" data-v="${v}" transform="translate(${p[0]},${p[1]})"><circle r="30" class="marcador"/><text text-anchor="middle" dy="10" font-size="27" font-weight="800">${v}</text></g>`).join("")}</svg></div></div>
      <div><div class="caja info" id="v-info"><h3 style="margin-top:0">Toca un electrodo</h3></div><div class="caja" style="padding:8px"><canvas class="ecg" id="v-c"></canvas></div>
        <div class="caja"><table><tr><th>Región</th><th>Derivaciones</th></tr>
        <tr><td>Anteroseptal</td><td>V1, V2, V3, V4</td></tr><tr><td>Anterolateral</td><td>DI, aVL, V4, V5, V6</td></tr><tr><td>Lateral alto</td><td>DI, aVL</td></tr>
        <tr><td>Anterior extenso</td><td>DI, aVL, V1-V6</td></tr><tr><td>Inferior (diafragmática)</td><td>DII, DIII, aVF</td></tr><tr><td>Dorsal</td><td>V7, V8 (espejo en V1-V3)</td></tr></table></div></div></div>`;
    const ecg = E.construir({ tipo: "normal", fc: 72 }, 10);
    function frontal(d) {
      $$("#dfr .chip").forEach(b => b.classList.toggle("act", b.dataset.d === d));
      const L = $("#ts-l"); let a, b, txt;
      if (BIP[d]) { [a, b, txt] = [ELEC[BIP[d][0]], ELEC[BIP[d][1]], BIP[d][2]]; } else { a = CORAZON; b = ELEC[UNI[d][0]]; txt = UNI[d][1] + " frente a la central de Wilson (los otros dos miembros)"; }
      L.setAttribute("x1", a[0]); L.setAttribute("y1", a[1]); L.setAttribute("x2", b[0]); L.setAttribute("y2", b[1]); L.setAttribute("opacity", 0.9);
      const ang = E.DER[d].ang;
      $("#d-info").innerHTML = `<h3 style="margin-top:0">${d} · ${BIP[d] ? "bipolar" : "unipolar aumentada"} · eje ${ang > 0 ? "+" : ""}${ang}°</h3><p>${txt}.</p>
        <p class="nota">${d === "aVR" ? "Mira el corazón desde arriba y a la derecha: la activación se aleja de ella, por eso en el ritmo sinusal <b>P, QRS y T son negativas en aVR</b>." : d === "DII" ? "Va casi en la misma dirección que la activación auricular y ventricular: la P y el QRS se ven grandes y positivos. Es la derivación de la tira de ritmo." : ["DII", "DIII", "aVF"].includes(d) ? "Mira la cara <b>inferior</b> (diafragmática)." : "Mira la cara <b>lateral alta</b> del ventrículo izquierdo."}</p>`;
      U.tira($("#d-c"), ecg, d, 3, 30);
    }
    function precordial(v) {
      const [p, pos, ve] = PRE[v];
      $("#v-info").innerHTML = `<h3 style="margin-top:0">${v}</h3><p><b>Posición:</b> ${pos}.<br><b>Mira:</b> ${ve}.</p>`;
      U.tira($("#v-c"), ecg, v, 3, 34);
    }
    $$("#dfr .chip").forEach(b => b.onclick = () => frontal(b.dataset.d));
    $$("[data-v]").forEach(g => g.onclick = () => precordial(g.dataset.v));
    frontal("DI"); precordial("V1");
    U.alRedimensionar = () => { frontal($("#dfr .chip.act").dataset.d); };
  };

  /* =====================================================================
     PAPEL Y FRECUENCIA CARDÍACA: compás interactivo
     ===================================================================== */
  SECC.papel = function (main) {
    main.innerHTML = `<h1>El papel del ECG y la frecuencia cardíaca</h1>
      <p class="lema">Horizontal = <b>tiempo</b>; vertical = <b>amplitud</b>. A 25 mm/s, un cuadradito mide <b>0.04 s</b> y <b>1 mm</b> (0.1 mV); un cuadrado grande (5 cuadraditos) mide <b>0.20 s</b> y 5 mm. El pulso de calibración (1 mV) sube 10 mm.</p>
      <div class="caja" style="padding:8px"><canvas class="ecg" id="pp" style="cursor:ew-resize"></canvas>
        <div class="ctrl"><span>Arrastra las dos líneas azules hasta dos ondas R seguidas.</span><button class="btn sec" id="nuevo">🔀 Otro trazado</button></div></div>
      <div class="grid2"><div class="caja" id="medida"></div>
      <div class="caja"><h3 style="margin-top:0">¿Cuánto es la FC?</h3><div class="ctrl"><input id="resp" type="number" min="20" max="250" placeholder="lpm" style="width:110px;padding:8px;border-radius:12px;border:2px solid var(--borde);background:var(--papel)"><button class="btn" id="ver">Comprobar</button></div><p id="fb"></p>
        <p class="nota">Lo que se dijo en clase: trabajar siempre con <b>1500 / cuadraditos</b> (más preciso), aunque 300 / cuadrados grandes da lo mismo. Ambas fórmulas valen solo si el ritmo es <b>regular</b>.</p></div></div>`;
    let ecg, P, c1, c2, fc;
    function nuevo() { fc = [48, 55, 60, 68, 75, 83, 94, 100, 115, 125, 150][Math.floor(Math.random() * 11)]; ecg = E.construir({ tipo: fc > 100 ? "taqui" : fc < 60 ? "bradi" : "normal", fc }, 12); $("#fb").textContent = ""; $("#resp").value = "";
      const qs = ecg.latidos.filter(l => l.tq).map(l => l.tq); c1 = qs[1] + 0.04 - 0.3; c2 = c1 + 0.3; dibuja(); }
    function dibuja() {
      P = U.tira($("#pp"), ecg, "DII", 6, 34, { rotulo: true });
      const mm = P.mm, X = s => P.x0 + s * 25 * mm, cx = P.c;
      [c1, c2].forEach(s => { cx.strokeStyle = "#2563EB"; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(X(s), 0); cx.lineTo(X(s), P.H); cx.stroke();
        cx.fillStyle = "#2563EB"; cx.beginPath(); cx.arc(X(s), 10, 8, 0, 7); cx.fill(); });
      const dt = Math.abs(c2 - c1), n = dt / 0.04, N = dt / 0.2;
      $("#medida").innerHTML = `<h3 style="margin-top:0">Lo que mide el compás</h3><p><b>${n.toFixed(1)}</b> cuadraditos = <b>${dt.toFixed(2)} s</b> (${N.toFixed(2)} cuadrados grandes)</p>
        <p>Si es un intervalo RR: <b>1500 / ${n.toFixed(1)} = ${(1500 / n).toFixed(0)} lpm</b> · 300 / ${N.toFixed(2)} = ${(300 / N).toFixed(0)} lpm</p>`;
    }
    let arr = 0; const cv = $("#pp");
    const tDe = ev => { const b = cv.getBoundingClientRect(); return (ev.clientX - b.left - P.x0) / (25 * P.mm); };
    cv.addEventListener("pointerdown", ev => { const t = tDe(ev); arr = Math.abs(t - c1) < Math.abs(t - c2) ? 1 : 2; cv.setPointerCapture(ev.pointerId); });
    cv.addEventListener("pointermove", ev => { if (!arr) return; const t = Math.max(0, Math.min(6, tDe(ev))); arr === 1 ? c1 = t : c2 = t; dibuja(); });
    cv.addEventListener("pointerup", () => arr = 0);
    $("#nuevo").onclick = nuevo;
    $("#ver").onclick = () => { const r = +$("#resp").value; const ok = Math.abs(r - fc) <= Math.max(4, fc * 0.06);
      $("#fb").innerHTML = ok ? `✅ ¡Bien! La FC es <b>${fc} lpm</b> (${fc > 100 ? "taquicardia" : fc < 60 ? "bradicardia" : "normal: 60-100"}).` : `Casi: la FC es <b>${fc} lpm</b>. RR = ${(60 / fc).toFixed(2)} s = ${(60 / fc / 0.04).toFixed(1)} cuadraditos → 1500 / ${(60 / fc / 0.04).toFixed(1)}.`; };
    nuevo(); U.alRedimensionar = dibuja;
  };

  /* =====================================================================
     LECTURA EN 9 PASOS
     ===================================================================== */
  const NUEVE = [
    ["Ritmo", "Sinusal normal: <b>P positiva en DI, DII y aVF</b>, negativa en aVR, siempre antes del QRS, con PR 0.12-0.20 s.", "P", 3],
    ["Frecuencia cardíaca", "<span class=dato>60-100 lpm</span>. 1500 / cuadraditos entre dos R, o 300 / cuadrados grandes (solo si el ritmo es regular).", "RR", 3],
    ["Onda P", "Despolarización auricular. <span class=dato>0.07-0.11 s</span>, &lt; 2.5 mm en DII, redondeada y simétrica.", "P", 1],
    ["Intervalo PR", "Del inicio de la P al inicio del QRS: <span class=dato>0.12-0.20 s</span> (varía con la edad y la FC).", "PRi", 1],
    ["Segmento PR", "Del final de la P al inicio del QRS. Isoeléctrico (hasta 0.5 mm de variación).", "PRs", 1],
    ["Complejo QRS", "Despolarización ventricular, <span class=dato>&lt; 0.12 s</span>. Q ≤ 3 mm y ≤ 0.04 s (salvo DIII); R ≤ 15 mm en estándar y ≤ 25 mm en precordiales; S ≤ 17 mm en precordiales derechas.", "QRS", 1],
    ["Segmento ST", "Del <b>punto J</b> al inicio de la T: isoeléctrico. Un desnivel &gt; 0.5 mm es patológico y orienta a infarto.", "ST", 1],
    ["Onda T", "Repolarización ventricular, <span class=dato>5-10 mm</span>, <b>asimétrica</b>, positiva en DI, DII, aVF, V3-V6 y negativa en aVR.", "T", 1],
    ["Intervalo QT", "Del inicio del QRS al final de la T: <span class=dato>0.34-0.44 s</span>. Varía al revés que la FC: a más FC, menos QT.", "QT", 1]];
  SECC.lectura = function (main) {
    main.innerHTML = `<h1>Lectura del ECG normal en 9 pasos</h1><p class="lema">Siempre en el mismo orden. Toca cada paso y mira qué tramo del trazado mide.</p>
      <div class="grid2"><ol class="pasos" id="nv">${NUEVE.map(([n]) => `<li>${n}</li>`).join("")}</ol>
      <div><div class="caja" style="padding:8px"><canvas class="ecg" id="lc"></canvas></div><div class="caja info" id="l-info"></div></div></div>
      <h2>Las duraciones normales</h2><div class="caja"><table><tr><th>Elemento</th><th>2020 (se usa)</th><th>2018</th></tr>
      <tr><td>Onda P</td><td>0.07-0.11 s</td><td>0.06-0.11 s</td></tr><tr><td>Intervalo PR</td><td>0.12-0.20 s</td><td>0.11 s</td></tr>
      <tr><td>QRS</td><td>&lt; 0.12 s</td><td>&lt; 0.12 s</td></tr><tr><td>Intervalo QT</td><td>0.34-0.44 s</td><td>0.25-0.40 s</td></tr></table>
      <p class="nota">Las dos versiones del apunte no coinciden en el PR y el QT: conviene confirmarlo en clase.</p></div>`;
    const ecg = E.construir({ tipo: "normal", fc: 75 }, 8), L = ecg.latidos, tp = L[1].tp, tq = L[1].tq, qt = 0.4 * Math.sqrt(0.8);
    const ZONAS = { P: [tp, tp + 0.1], PRi: [tp, tq], PRs: [tp + 0.1, tq], QRS: [tq, tq + 0.09], ST: [tq + 0.09, tq + qt - 0.17], T: [tq + qt - 0.17, tq + qt + 0.02], QT: [tq, tq + qt + 0.02], RR: [tq, L[2].tq] };
    let sel = 0;
    function pinta() {
      const [n, txt, z, nb] = NUEVE[sel], seg = nb === 3 ? 2.6 : 2.1, t0 = nb === 3 ? L[0].tp - 0.05 : tp - 0.55;
      // alto fijo (~280 px) en todos los pasos: el lienzo ya no salta de tamaño al cambiar de paso
      const cw = $("#lc").clientWidth || 500, mmPx = (cw - 4) / (seg * 25 + 6), alto = 280 / mmPx;
      const P = U.tira($("#lc"), ecg, "DII", seg, alto, { t0, ancho: 2.4, base: alto * 0.62 });
      const X = s => P.x0 + (s - t0) * 25 * P.mm, [a, b] = ZONAS[z], c = P.c;
      c.fillStyle = "rgba(59,130,246,.18)"; c.fillRect(X(a), 0, X(b) - X(a), P.H);
      c.strokeStyle = "#2563EB"; c.lineWidth = 2; [a, b].forEach(s => { c.beginPath(); c.moveTo(X(s), 0); c.lineTo(X(s), P.H); c.stroke(); });
      const rot = `${(b - a).toFixed(2)} s`; c.font = "700 15px Fredoka, Nunito, sans-serif"; const tw = c.measureText(rot).width, cx = Math.max(4, Math.min(P.W - tw - 14, (X(a) + X(b)) / 2 - tw / 2 - 5));
      c.fillStyle = "#2563EB"; c.beginPath(); c.roundRect ? c.roundRect(cx, P.H - 30, tw + 10, 22, 8) : c.rect(cx, P.H - 30, tw + 10, 22); c.fill(); c.fillStyle = "#fff"; c.fillText(rot, cx + 5, P.H - 14);
      if (z === "ST") { c.fillStyle = "#B91C1C"; c.beginPath(); c.arc(X(a), P.y0, 6, 0, 7); c.fill(); c.fillText("J", X(a) + 8, P.y0 - 10); }
      $("#l-info").innerHTML = `<h3 style="margin-top:0">${sel + 1}. ${n}</h3><p>${txt}</p>`;
      $$("#nv li").forEach((li, i) => li.classList.toggle("act", i === sel));
    }
    $$("#nv li").forEach((li, i) => li.onclick = () => { sel = i; pinta(); });
    pinta(); U.alRedimensionar = pinta;
  };

  /* =====================================================================
     PATOLOGÍAS: 12 derivaciones de cada patrón
     ===================================================================== */
  const RESALTA = { had: ["DII", "DIII", "aVF", "V1"], hai: ["DII", "V1"], hvd: ["V1", "V6", "DI"], hvi: ["V1", "V5", "V6", "DI", "DIII"],
    bcrd: ["V1", "V2", "DI", "V6"], bcri: ["DI", "aVL", "V5", "V6", "V1", "V2"], bav1: ["DII"], mobitz1: ["DII"], mobitz2: ["DII"], bav3: ["DII"], fa: ["DII", "V1"],
    flutter: ["DII", "DIII", "aVF", "V1"], esa: ["DII"], esv: ["DII", "V1", "V6"], bigem: ["DII"], tsv: ["DII"], tv: ["DII", "V1", "V6"], torsades: ["DII"],
    fv: ["DII"], asistolia: ["DII"], wpw: ["DII", "V1", "V4", "V5", "V6"], pericarditis: ["DI", "DII", "aVF", "V2", "V3", "V4", "V5", "V6", "aVR"] };
  SECC.patologia = function (main, arg) {
    const grupos = {};
    Object.entries(E.PATRONES).forEach(([k, p]) => (grupos[p.grupo] = grupos[p.grupo] || []).push([k, p]));
    main.innerHTML = `<h1>Patologías en 12 derivaciones</h1><p class="lema">Elige un patrón: en <span style="color:var(--ro);font-weight:700">rojo</span> las derivaciones donde se ve el criterio.</p>
      <div class="caja">${Object.entries(grupos).map(([g, ls]) => `<span class="nota">${g}</span><div class="chips">${ls.map(([k, p]) => `<button class="chip" data-p="${k}">${p.nombre}</button>`).join("")}</div>`).join("")}
      <div id="pi-opc" class="ctrl" style="display:none"><label>Región <select id="pi-reg">${Object.entries(E.REGIONES).map(([k, r]) => `<option value="${k}">${r.nombre}</option>`).join("")}</select></label>
      <label>Fase <select id="pi-fase">${Object.entries(E.FASES).map(([k, f]) => `<option value="${k}">${f.split(":")[0]}</option>`).join("")}</select></label></div></div>
      <div class="caja" style="padding:8px"><canvas class="ecg" id="p12"></canvas></div>
      <div class="grid2"><div class="caja" id="p-txt"></div><div id="p-extra"></div></div>`;
    let tipo = E.PATRONES[arg] ? arg : "normal", region = "anteroseptal", fase = "les_epi";
    try { const s = JSON.parse(sessionStorage.getItem("ecg-sim") || "{}"); if (arg === tipo && s.tipo === tipo) { region = s.region || region; fase = s.fase || fase; } } catch (e) {}
    function pinta() {
      $$("[data-p]").forEach(b => b.classList.toggle("act", b.dataset.p === tipo));
      $("#pi-opc").style.display = tipo === "iam" ? "" : "none"; $("#pi-reg").value = region; $("#pi-fase").value = fase;
      const ecg = E.construir({ tipo, region, fase, semilla: 11 }, 14), R = tipo === "iam" ? E.REGIONES[region] : null;
      U.doce($("#p12"), ecg, { resaltar: R ? R.ve.concat(R.espejo) : RESALTA[tipo] || [], ritmo: tipo === "fa" ? "V1" : "DII" });
      const tx = U.TEXTOS[tipo] || {};
      $("#p-txt").innerHTML = `<h3 style="margin-top:0">${E.PATRONES[tipo].nombre}</h3><p>${tx.que || ""}</p><ul>${(tx.ecg || []).map(x => `<li>${x}</li>`).join("")}</ul>${tx.causa ? `<p class="nota">${tx.causa}</p>` : ""}
        <a class="btn sec" href="#sim" id="al-sim">🫀 Verlo en el simulador</a>`;
      $("#al-sim").onclick = () => { try { sessionStorage.setItem("ecg-sim", JSON.stringify({ tipo, fc: E.PATRONES[tipo].fc, region, fase, vel: 0.25, der: (RESALTA[tipo] || ["DII"])[0] })); } catch (e) {} };
      $("#p-extra").innerHTML = tipo === "iam" ? `<div class="caja" style="padding:8px"><div class="lienzo"><img src="img/infarto.webp" alt="Corazón con un trombo en la descendente anterior y las zonas de necrosis, lesión e isquemia">
          <svg class="sobre" viewBox="0 0 1536 1024"><text class="eti" x="935" y="505" font-size="30" fill="#7f1d1d">Trombo</text>
          <text class="eti" x="1000" y="700" font-size="30" fill="#4c1d95">Necrosis → Q</text><text class="eti" x="1060" y="780" font-size="30" fill="#B91C1C">Lesión → ST</text><text class="eti" x="1110" y="860" font-size="30" fill="#1d4ed8">Isquemia → T</text></svg></div>
          <p><b>${R.nombre}</b>: lo ven ${R.ve.join(", ")}; imagen en espejo en ${R.espejo.join(", ")}.</p>
          <p class="nota">Secuencia temporal: T negativa (isquemia) → a los 30-90 s ST supradesnivelado (lesión) → onda Q (necrosis, horas o días). La Q queda para siempre; la T puede tardar meses o años en normalizarse. Subendocárdico: T positiva, ST infradesnivelado y Q normal.</p></div>`
        : `<div class="caja"><h3 style="margin-top:0">Qué buscar</h3><ol>${(tx.ecg || []).map(x => `<li>${x}</li>`).join("")}</ol></div>`;
    }
    $$("[data-p]").forEach(b => b.onclick = () => { tipo = b.dataset.p; history.replaceState(null, "", "#patologia/" + tipo); pinta(); });
    $("#pi-reg").onchange = ev => { region = ev.target.value; pinta(); };
    $("#pi-fase").onchange = ev => { fase = ev.target.value; pinta(); };
    pinta(); U.alRedimensionar = pinta; U.repintar = pinta;
  };

  /* =====================================================================
     PONTE A PRUEBA: ¿qué ritmo es?
     ===================================================================== */
  SECC.prueba = function (main) {
    const RITMO = ["normal", "taqui", "bradi", "arritmia", "bav1", "mobitz1", "mobitz2", "bav3", "fa"], MORFO = ["bcrd", "bcri", "had", "hai", "hvd", "hvi", "iam"];
    main.innerHTML = `<h1>Ponte a prueba</h1><p class="lema">10 trazados al azar. Mira, decide y aprende del porqué.</p>
      <div class="ctrl"><span class="chips" id="modo"><button class="chip act" data-m="todo">Todo</button><button class="chip" data-m="ritmo">Solo ritmos y bloqueos AV</button><button class="chip" data-m="morfo">Solo hipertrofias, ramas e infarto</button></span><b id="marcador"></b></div>
      <div class="caja" style="padding:8px"><canvas class="ecg" id="q-c"></canvas></div>
      <p id="q-preg" style="font-weight:700;font-size:18px"></p><div class="opciones" id="q-op"></div><div class="caja info" id="q-fb" style="display:none"></div>
      <div class="ctrl"><button class="btn" id="q-sig" style="display:none">Siguiente →</button></div>`;
    let modo = "todo", n = 0, ok = 0, actual;
    const azar = a => a[Math.floor(Math.random() * a.length)];
    const nombre = x => x.tipo === "iam" ? `Infarto ${E.REGIONES[x.region].nombre.toLowerCase()} · ${E.FASES[x.fase].split(":")[0].toLowerCase()}` : E.PATRONES[x.tipo].nombre;
    function pregunta() {
      if (n >= 10) { $("#q-preg").textContent = `Terminaste: ${ok} de 10 ${ok >= 8 ? "🏆" : ok >= 6 ? "👍" : "📚"}`; $("#q-op").innerHTML = `<button id="otra">🔁 Otra ronda</button>`; $("#otra").onclick = () => { n = ok = 0; pregunta(); }; $("#q-sig").style.display = "none"; $("#q-fb").style.display = "none"; return; }
      const pool = modo === "ritmo" ? RITMO : modo === "morfo" ? MORFO : RITMO.concat(MORFO), tipo = azar(pool);
      actual = { tipo, region: azar(["anteroseptal", "inferior", "lateral", "extenso"]), fase: azar(["les_epi", "necrosis", "isq_epi"]) };
      const ecg = E.construir({ tipo, region: actual.region, fase: actual.fase, fc: E.PATRONES[tipo].fc + Math.round((Math.random() - 0.5) * 8), semilla: 1 + Math.floor(Math.random() * 1e6) }, 14);
      const doce = MORFO.includes(tipo);
      doce ? U.doce($("#q-c"), ecg, { ritmo: tipo === "fa" ? "V1" : "DII" }) : U.tira($("#q-c"), ecg, "DII", 8, 32);
      $("#q-preg").textContent = `${n + 1}/10 · ¿Qué muestra este ${doce ? "ECG de 12 derivaciones" : "trazado en DII"}?`;
      const mismos = doce ? MORFO : RITMO, ops = [actual];
      while (ops.length < 4) { const t = azar(mismos), o = { tipo: t, region: azar(["anteroseptal", "inferior", "lateral", "extenso"]), fase: azar(["les_epi", "necrosis", "isq_epi"]) };
        if (!ops.some(x => nombre(x) === nombre(o)) && !(t === tipo && t !== "iam")) ops.push(o); }
      ops.sort(() => Math.random() - 0.5);
      $("#q-op").innerHTML = ops.map((o, i) => `<button data-i="${i}">${nombre(o)}</button>`).join("");
      $("#q-fb").style.display = "none"; $("#q-sig").style.display = "none";
      $$("#q-op button").forEach(b => b.onclick = () => {
        if ($("#q-sig").style.display !== "none") return;
        const o = ops[+b.dataset.i], bien = nombre(o) === nombre(actual); if (bien) ok++; n++;
        b.classList.add(bien ? "bien" : "mal"); $$("#q-op button").forEach((x, i) => { if (nombre(ops[i]) === nombre(actual)) x.classList.add("bien"); });
        const tx = U.TEXTOS[actual.tipo] || {};
        $("#q-fb").style.display = ""; $("#q-fb").innerHTML = `<b>${bien ? "✅ ¡Exacto!" : "Casi: era " + nombre(actual)}.</b><ul>${(tx.ecg || []).map(x => `<li>${x}</li>`).join("")}</ul>`;
        $("#q-sig").style.display = ""; $("#marcador").textContent = `✓ ${ok} / ${n}`;
      });
    }
    $$("#modo .chip").forEach(b => b.onclick = () => { modo = b.dataset.m; $$("#modo .chip").forEach(x => x.classList.toggle("act", x === b)); n = ok = 0; $("#marcador").textContent = ""; pregunta(); });
    $("#q-sig").onclick = pregunta;
    pregunta();
  };
})();
