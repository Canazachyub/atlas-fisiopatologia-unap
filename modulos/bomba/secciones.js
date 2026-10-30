/* Frank-Starling e IC — pestañas 2 y 3: bucle presión-volumen y mecanismos compensadores. */
(function () {
  "use strict";
  const B = window.BOMBA, K = B.K, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$, f0 = U.f0, f1 = U.f1;

  /* =====================================================================
     PESTAÑA 2 · Bucle presión-volumen del ventrículo izquierdo
     ===================================================================== */
  SECC.lazo = function (main) {
    main.innerHTML = `<h1>Bucle presión-volumen del VI</h1>
      <p class="lema">Cada latido dibuja un bucle: <b>llenado</b>, <b>contracción isovolumétrica</b>, <b>eyección</b> y <b>relajación isovolumétrica</b>. El ancho del bucle es el volumen sistólico. Mueve los controles y compara con el bucle normal (gris).</p>
      <div class="grid2">
        <div>
          <div class="caja"><svg id="pv" class="lienzo-svg" viewBox="0 0 560 400" role="img" aria-label="Bucle presión-volumen"></svg>
            <div class="btns"><button class="btn sec" id="pausa">⏸ Pausa</button>
              <span class="chips" id="vel"><button class="chip" data-v="0.25">Lento</button><button class="chip act" data-v="0.5">Medio</button><button class="chip" data-v="1">Tiempo real</button></span></div>
            <ol class="pasos" id="fases">
              <li data-f="iso1"><span><b>1→2 Contracción isovolumétrica.</b> Válvulas cerradas: sube la presión sin cambiar el volumen.</span></li>
              <li data-f="eyec"><span><b>2→3 Eyección.</b> Se abre la válvula aórtica; sale el volumen sistólico (ancho del bucle).</span></li>
              <li data-f="iso2"><span><b>3→4 Relajación isovolumétrica.</b> Válvulas cerradas: cae la presión con el volumen residual (VTS).</span></li>
              <li data-f="llen"><span><b>4→1 Llenado.</b> Se abre la mitral; la presión sube según la rigidez del ventrículo.</span></li>
            </ol></div>
          <div class="letrero col" id="letrero" aria-live="polite"></div>
        </div>
        <div>
          <div class="caja"><b>Casos rápidos</b><div id="presets"></div><p class="nota" id="ptexto"></p><div id="sliders"></div></div>
          <div class="caja"><div id="kp"></div><div id="tipo" class="tarj"></div></div>
          <div class="caja"><div id="corazon"></div></div>
        </div>
      </div>
      <h2>Disfunción sistólica vs diastólica</h2>
      <div class="grid3">
        <div class="tarj ro"><b class="t">Sistólica (FE disminuida)</b>Falla la <b>contractilidad</b> (clase 16). La línea de fin de sístole se aplana, el VI no se vacía: sube el VTS, el bucle se ensancha hacia la derecha pero con poco ancho útil, y la FE cae.
          <div class="btns"><button class="btn sec" data-p="Infarto extenso">Ver en el bucle</button></div></div>
        <div class="tarj na"><b class="t">Diastólica (FE conservada)</b>La contractilidad es normal, pero <b>falla el llenado</b> (clase 16: p. ej. estenosis mitral o tricuspídea; también hipertrofia o pericarditis constrictiva). La curva de llenado se empina: el bucle queda chico y a la izquierda, con presión de fin de diástole alta.
          <div class="btns"><button class="btn sec" data-p="IC diastólica">Ver en el bucle</button></div></div>
        <div class="tarj mo"><b class="t">Sobrecarga de poscarga</b>HTA o estenosis aórtica (clases 13 y 16): el bucle se hace alto y angosto; el VI se hipertrofia para vencer la presión y gasta más O₂.
          <div class="btns"><button class="btn sec" data-p="Crisis hipertensiva">Ver en el bucle</button></div></div>
      </div>`;
    const E = U.est, X0 = 56, X1 = 540, Y0 = 18, Y1 = 340, VMAX = 200, PMAX = 200;
    const xo = V => X0 + V / VMAX * (X1 - X0), yo = P => Y1 - Math.min(P, PMAX) / PMAX * (Y1 - Y0);
    const svg = $("#pv"), corazon = U.corazon($("#corazon"));
    svg.innerHTML = `<defs><clipPath id="pvclip"><rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}"/></clipPath></defs>
      <g id="pv-fijo"></g><g id="pv-var" clip-path="url(#pvclip)"></g><g id="pv-etq"></g><g id="pv-dot"></g>`;
    const poly = pts => pts.map((p, i) => (i ? "L" : "M") + xo(p.V).toFixed(1) + " " + yo(p.P).toFixed(1)).join(" ") + " Z";
    const loopNormal = B.lazo(B.NORMAL, 100);
    let fase = 0, pausa = false, trail = [], faseAct = "";

    function estatico() {
      const e = U.est, h = B.hemo(e), lz = B.lazo(e, 140), tip = B.clasificar(e, h);
      let g = "";
      for (let v = 0; v <= 200; v += 50) g += `<line x1="${xo(v)}" y1="${Y0}" x2="${xo(v)}" y2="${Y1}" style="stroke:var(--borde)"/><text x="${xo(v)}" y="${Y1 + 16}" text-anchor="middle" font-size="12" class="t2">${v}</text>`;
      for (let p = 0; p <= 200; p += 50) g += `<line x1="${X0}" y1="${yo(p)}" x2="${X1}" y2="${yo(p)}" style="stroke:var(--borde)"/><text x="${X0 - 6}" y="${yo(p) + 4}" text-anchor="end" font-size="12" class="t2">${p}</text>`;
      g += `<text x="${(X0 + X1) / 2}" y="${Y1 + 36}" text-anchor="middle" font-size="13.5">Volumen del VI (mL)</text><text transform="translate(14 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle" font-size="13.5">Presión del VI (mmHg)</text>`;
      $("#pv-fijo").innerHTML = g;
      // línea de fin de sístole (contractilidad) y curva de llenado (rigidez)
      const ed = []; for (let P = 0; P <= K.P_MAX; P += 1) ed.push({ V: B.edv(P, e.r), P });
      const edN = []; for (let P = 0; P <= K.P_MAX; P += 1) edN.push({ V: B.edv(P, 1), P });
      const lin = (Ees, c) => `<line x1="${xo(K.V0)}" y1="${yo(0)}" x2="${xo(K.V0 + PMAX / Ees)}" y2="${yo(PMAX)}" style="stroke:${c};stroke-width:2.5"/>`;
      const sinPts = (arr) => arr.map((p, i) => (i ? "L" : "M") + xo(p.V).toFixed(1) + " " + yo(p.P).toFixed(1)).join(" ");
      $("#pv-var").innerHTML = `${lin(K.Ees0, "#9CA3AF")}<path d="${sinPts(edN)}" fill="none" style="stroke:#9CA3AF;stroke-width:2.5"/>
        <path d="${poly(loopNormal)}" fill="none" style="stroke:#6B7280;stroke-width:2.5;stroke-dasharray:6 5"/>
        ${lin(h.Ees, "var(--ro)")}<path d="${sinPts(ed)}" fill="none" style="stroke:var(--na);stroke-width:3"/>
        <path d="${poly(lz)}" style="fill:${tip.tipo === "sistolica" ? "#B91C1C" : tip.tipo === "diastolica" ? "#F59E0B" : "#3B82F6"};fill-opacity:.28;stroke:var(--az);stroke-width:3.5;stroke-linejoin:round"/>`;
      const Pmo = Math.max(2, Math.min(e.P, B.pDeV(h.ESV, e.r)));
      const pts = [[1, h.EDV, e.P, "start"], [2, h.EDV, h.Pdia, "end"], [3, h.ESV, h.Pes, "start"], [4, h.ESV, Pmo, "end"]];
      $("#pv-etq").innerHTML = pts.map(p => `<circle cx="${xo(p[1])}" cy="${yo(p[2])}" r="10" style="fill:var(--papel);stroke:var(--az);stroke-width:2"/><text x="${xo(p[1])}" y="${yo(p[2]) + 4}" text-anchor="middle" font-size="12" font-weight="700">${p[0]}</text>`).join("") +
        `<line x1="${xo(h.ESV)}" y1="${yo(h.Pes) - 22}" x2="${xo(h.EDV)}" y2="${yo(h.Pes) - 22}" style="stroke:var(--tx);stroke-width:1.5"/><text x="${(xo(h.ESV) + xo(h.EDV)) / 2}" y="${yo(h.Pes) - 28}" text-anchor="middle" font-size="12.5" font-weight="700">VS ${f0(h.SV)} mL</text>
         <text x="${X1 - 4}" y="${Y0 + 14}" text-anchor="end" font-size="11.5" style="fill:var(--ro)">línea de fin de sístole (contractilidad)</text>
         <text x="${X1 - 4}" y="${Y0 + 28}" text-anchor="end" font-size="11.5" style="fill:var(--na)">curva de llenado (rigidez)</text>
         <text x="${X1 - 4}" y="${Y0 + 42}" text-anchor="end" font-size="11.5" class="t2">gris = valores normales</text>`;
      $("#kp").innerHTML = U.kpis(e, h);
      const col = tip.tipo === "sistolica" ? "ro" : tip.tipo === "diastolica" ? "na" : tip.tipo === "normal" ? "ve" : "mo";
      $("#tipo").className = "tarj " + col;
      $("#tipo").innerHTML = `<b class="t">${tip.tipo === "sistolica" ? "IC sistólica" : tip.tipo === "diastolica" ? "IC diastólica" : tip.tipo === "normal" ? "Sin falla de bomba" : "Estado intermedio"}</b>${tip.texto}
        <span class="nota"> FE = VS / VTD = ${f0(h.SV)} / ${f0(h.EDV)} = ${f0(h.EF)} % (FE &lt; 40 % reducida, ≥ 50 % conservada <span class="lit">literatura</span>).</span>`;
      // letrero causal del bucle
      const L = [];
      if (e.c < 0.95) L.push("<b>Contractilidad ↓</b>: la línea de fin de sístole (roja) se aplana; al mismo nivel de presión el VI termina con más volumen residual (<b>VTS ↑</b>), el bucle pierde ancho y la FE cae.");
      if (e.c > 1.05) L.push("<b>Contractilidad ↑</b>: la línea roja se empina; el VI se vacía más (VTS ↓) y el bucle se ensancha.");
      if (e.a > 1.05) L.push("<b>Poscarga ↑</b>: el punto 3 sube (el VI debe llegar a más presión para vaciarse) y el bucle se hace alto y angosto: VTS ↑ y VS ↓.");
      if (e.a < 0.95) L.push("<b>Poscarga ↓</b>: el punto 3 baja y el VI vacía con menos presión: VS ↑.");
      if (e.P > 10.6) L.push(`<b>Precarga ↑</b>: el punto 1 se desplaza a lo largo de la curva de llenado (naranja) hacia la derecha: el VTD aumenta y el bucle se ensancha (Frank-Starling), pero la presión de fin de diástole sube ${f0(e.P)} mmHg y se transmite a la aurícula y al pulmón.`);
      if (e.P < 9.4) L.push("<b>Precarga ↓</b>: el punto 1 baja y se acerca al origen: bucle chico, VS ↓.");
      if (e.r > 1.1) L.push("<b>Rigidez ↑</b>: la curva de llenado (naranja) se empina: para el mismo volumen la presión es mayor; el bucle queda a la izquierda y arriba. La FE puede seguir normal.");
      if (!L.length) L.push("Bucle normal. Mueve un control para ver cómo se deforma.");
      $("#letrero").innerHTML = L.map(t => `<p>${t}</p>`).join("");
    }
    $("#ptexto").textContent = U.PRESETS[0].t;
    const sl = U.sliders($("#sliders"), [U.SL.P, U.SL.a, U.SL.c, U.SL.r, U.SL.FC], () => { $$("#presets button").forEach(b => b.classList.remove("act")); estatico(); });
    U.chipsPresets($("#presets"), p => { $("#ptexto").textContent = p.t; sl.sync(); estatico(); });
    $$("#presets button")[0].classList.add("act");
    $$("button[data-p]", main).forEach(b => b.onclick = () => {
      const p = U.PRESETS.find(x => x.n === b.dataset.p); U.aplicar(p); $("#ptexto").textContent = p.t;
      $$("#presets button").forEach(x => x.classList.toggle("act", x.textContent === p.n)); sl.sync(); estatico(); window.scrollTo({ top: 0, behavior: "smooth" });
    });
    $("#pausa").onclick = ev => { pausa = !pausa; ev.target.textContent = pausa ? "▶ Seguir" : "⏸ Pausa"; };
    $$("#vel button").forEach(b => b.onclick = () => { U.velocidad = parseFloat(b.dataset.v); $$("#vel button").forEach(x => x.classList.toggle("act", x === b)); });
    estatico();

    const COL = { iso1: "#7C3AED", eyec: "#DC2626", iso2: "#7C3AED", llen: "#2563EB" };
    U.anim((t, dt) => {
      const e = U.est, h = B.hemo(e);
      if (!pausa) fase += dt * e.FC / 60 * U.velocidad;
      const pt = B.punto(fase, e, h);
      corazon.upd(pt, e, h);
      trail.push(pt); if (trail.length > 16) trail.shift();
      $("#pv-dot").innerHTML = trail.map((p, i) => `<circle cx="${xo(p.V).toFixed(1)}" cy="${yo(p.P).toFixed(1)}" r="${(2 + i * 0.25).toFixed(1)}" style="fill:${COL[p.fase]};opacity:${(i / trail.length * 0.6).toFixed(2)}"/>`).join("") +
        `<circle cx="${xo(pt.V).toFixed(1)}" cy="${yo(pt.P).toFixed(1)}" r="8" style="fill:${COL[pt.fase]};stroke:#fff;stroke-width:2.5"/>`;
      if (pt.fase !== faseAct) { faseAct = pt.fase; $$("#fases li").forEach(li => li.classList.toggle("act", li.dataset.f === faseAct)); }
    });
  };

  /* =====================================================================
     PESTAÑA 3 · Mecanismos compensadores y círculo vicioso
     ===================================================================== */
  // Datos de cada mecanismo: lo dice la clase 16 (sns, sraa, hip) o es literatura (adh, bnp)
  const MEC = [
    { k: "sns", corto: "Simpático (βbloqueador)", ico: "⚡", t: "Sistema nervioso simpático", lit: false, bloq: "Betabloqueador",
      est: "Cae el gasto y la PA → los <b>barorreceptores</b> del seno carotídeo y del cayado aórtico liberan <b>adrenalina y noradrenalina</b> sobre los receptores β del corazón.",
      bien: "↑ inotropismo y ↑ cronotropismo: sube el gasto; la vasoconstricción sostiene la PA.",
      mal: "Taquicardia, ↑ poscarga y ↑ consumo de O₂; <b>cardiotoxicidad directa</b> (fibrosis, apoptosis). Piel fría, cianosis y sudor (hiperactividad adrenérgica)." },
    { k: "sraa", corto: "SRAA (IECA)", ico: "💧", t: "Sistema renina-angiotensina-aldosterona", lit: false, bloq: "IECA",
      est: "Cae el flujo renal → el <b>aparato yuxtaglomerular</b> libera <b>renina</b> → angiotensina I → (ECA) angiotensina II → <b>aldosterona</b> (retiene Na⁺ y agua en el túbulo distal).",
      bien: "<b>Hipervolemia compensadora</b>: más retorno, más precarga y más VS (Frank-Starling); la angiotensina II vasoconstriñe y sostiene la PA.",
      mal: "La hipervolemia sostenida produce <b>congestión pulmonar y sistémica</b> (edemas); más poscarga y cardiotoxicidad. Por eso se tratan con IECA, diuréticos y dieta hiposódica." },
    { k: "hip", corto: "Hipertrofia/dilatación", ico: "🫀", t: "Hipertrofia y dilatación ventricular", lit: false, bloq: "Sin remodelado",
      est: "La sobrecarga y el estiramiento crónico hacen crecer y dilatar el ventrículo (<b>Frank-Starling</b>).",
      bien: "Al inicio aumentan la capacidad contráctil y el VS.",
      mal: "Aumentan el <b>consumo de O₂</b> del miocardio; con el tiempo la hipertrofia con dilatación sostenida <b>reduce la contractilidad</b> y endurece el ventrículo." },
    { k: "adh", corto: "ADH", ico: "🚰", t: "Vasopresina (ADH)", lit: true, bloq: "Inactiva",
      est: "La caída de la presión arterial efectiva y la angiotensina II estimulan su liberación.",
      bien: "Retiene agua libre y vasoconstriñe: ayuda a mantener volumen y PA.",
      mal: "Más volumen que congestiona, y dilución del sodio (hiponatremia)." },
    { k: "bnp", corto: "Péptidos natriuréticos", ico: "🧪", t: "Péptidos natriuréticos (ANP, BNP)", lit: true, bloq: "Inactivos",
      est: "El estiramiento de aurículas y ventrículos por la presión de llenado alta los libera.",
      bien: "Natriuresis y vasodilatación: <b>se oponen</b> al SRAA y alivian la congestión.",
      mal: "En la IC avanzada su efecto no alcanza; el BNP elevado sirve como marcador de IC." }
  ];

  SECC.compensa = function (main) {
    const C = { g: 0.7, t: 0, on: { sns: true, sraa: true, hip: true, adh: true, bnp: true }, play: false };
    let ev = B.evolucion(C.g, C.on, 40);
    main.innerHTML = `<h1>Mecanismos compensadores</h1>
      <p class="lema">Un corazón dañado baja el gasto y el cuerpo reacciona. Activa la falla, avanza el tiempo (de días a meses) y mira en cadena <b>qué se activa, qué compensa y qué empeora</b>. Bloquea un mecanismo para ver el efecto de los IECA y los betabloqueadores.</p>
      <div class="grid2">
        <div>
          <div class="caja">
            <div class="sl"><label for="g">Gravedad de la lesión (p. ej. infarto)</label><output id="go"></output><input type="range" id="g" min="0.2" max="1" step="0.05"><small>Cuánta contractilidad pierde el corazón al inicio.</small></div>
            <div class="sl"><label for="tt">Tiempo desde la lesión</label><output id="to"></output><input type="range" id="tt" min="0" max="40" step="1"><small>0 = recién ocurrida · 40 = meses de evolución.</small></div>
            <div class="btns"><button class="btn az" id="play">▶ Avanzar el tiempo</button><button class="btn sec" id="rein">↺ Reiniciar</button></div>
            <p class="nota"><b>Mecanismos activos</b> (toca para bloquear):</p><div class="chips" id="tog"></div>
          </div>
          <div class="cadena" id="cadena"></div>
        </div>
        <div>
          <div class="caja"><svg id="gr" class="lienzo-svg" viewBox="0 0 560 310" role="img" aria-label="Gasto y presión de llenado en el tiempo"></svg></div>
          <div class="letrero col" id="estado" aria-live="polite"></div>
          <div class="caja"><b>El círculo vicioso</b><svg id="ciclo" class="lienzo-svg" viewBox="0 0 400 300" role="img" aria-label="Círculo vicioso de la insuficiencia cardiaca"></svg></div>
        </div>
      </div>`;
    const GCn = B.hemo(B.NORMAL).GC;
    // ---- tarjetas
    $("#cadena").innerHTML = `<div class="nodo on" id="n-gc"><b class="t"><span class="ico">⬇️</span>Cae el gasto cardiaco</b><div class="nv"><i id="v-gc"></i></div><span id="x-gc" class="nota"></span></div>` +
      MEC.map(m => `<div class="nodo" id="n-${m.k}"><b class="t"><span class="ico">${m.ico}</span>${m.t}${m.lit ? ' <span class="lit">literatura</span>' : ""}</b>
        <div class="nv"><i id="v-${m.k}"></i></div><div class="nota"><b>Se activa:</b> ${m.est}</div>
        <div class="bien">✔ Compensa: ${m.bien}</div><div class="malo">✘ Con el tiempo: ${m.mal}</div></div>`).join("");
    $("#tog").innerHTML = MEC.map(m => `<button class="chip act" data-k="${m.k}">${m.ico} ${m.corto}</button>`).join("");
    $$("#tog button").forEach(b => b.onclick = () => { C.on[b.dataset.k] = !C.on[b.dataset.k]; b.classList.toggle("act", C.on[b.dataset.k]); recalcular(); });
    $("#g").value = C.g; $("#tt").value = C.t;
    $("#g").oninput = e => { C.g = parseFloat(e.target.value); recalcular(); };
    $("#tt").oninput = e => { C.t = parseInt(e.target.value, 10); C.play = false; $("#play").textContent = "▶ Avanzar el tiempo"; pintar(); };
    $("#play").onclick = () => { if (C.t >= 40) C.t = 0; C.play = !C.play; $("#play").textContent = C.play ? "⏸ Pausar" : "▶ Avanzar el tiempo"; };
    $("#rein").onclick = () => { C.t = 0; C.play = false; $("#play").textContent = "▶ Avanzar el tiempo"; pintar(); };

    function recalcular() { ev = B.evolucion(C.g, C.on, 40); pintar(); }
    // ---- gráfico
    const X0 = 52, X1 = 540, Y0 = 16, Y1 = 262;
    const xt = t => X0 + t / 40 * (X1 - X0), yg = g => Y1 - g / 6 * (Y1 - Y0), yp = p => Y1 - p / 35 * (Y1 - Y0);
    function pintar() {
      const s = ev[C.t], e = s.e, h = s.h;
      const lin = (fn, c, extra) => `<path d="${ev.map((p, i) => (i ? "L" : "M") + xt(p.t).toFixed(1) + " " + fn(p).toFixed(1)).join(" ")}" fill="none" style="stroke:${c};stroke-width:3.2;${extra || ""}"/>`;
      let g = `<rect x="${X0}" y="${yg(K.GC_BAJO)}" width="${X1 - X0}" height="${Y1 - yg(K.GC_BAJO)}" style="fill:#6B7280;opacity:.2"/>
        <rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${yp(K.PCP_EAP) - Y0}" style="fill:#B91C1C;opacity:.13"/>`;
      for (let v = 0; v <= 6; v += 2) g += `<line x1="${X0}" y1="${yg(v)}" x2="${X1}" y2="${yg(v)}" style="stroke:var(--borde)"/><text x="${X0 - 6}" y="${yg(v) + 4}" text-anchor="end" font-size="12" style="fill:var(--azc)">${v}</text>`;
      for (let p = 0; p <= 30; p += 10) g += `<text x="${X1 + 4}" y="${yp(p) + 4}" font-size="11" style="fill:var(--ro)">${p}</text>`;
      for (let t = 0; t <= 40; t += 10) g += `<text x="${xt(t)}" y="${Y1 + 16}" text-anchor="middle" font-size="12" class="t2">${t}</text>`;
      g += `<text x="${(X0 + X1) / 2}" y="${Y1 + 36}" text-anchor="middle" font-size="13">Tiempo desde la lesión (días → meses)</text>
        <text transform="translate(12 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle" font-size="12.5" style="fill:var(--azc)">Gasto cardiaco (L/min) · azul</text>
        <text x="${X1 - 4}" y="${Y0 + 12}" text-anchor="end" font-size="11.5" style="fill:var(--ro)">presión de llenado (rojo): EAP ≥ 25 mmHg</text>
        <text x="${X0 + 6}" y="${Y1 - 6}" font-size="11.5" class="t2">bajo gasto &lt; 4 L/min (lit.)</text>`;
      g += lin(p => yg(p.GCsin), "var(--azc)", "stroke-dasharray:6 5;opacity:.8") + lin(p => yg(p.h.GC), "var(--azc)") + lin(p => yp(p.e.P), "var(--ro)");
      g += `<line x1="${xt(C.t)}" y1="${Y0}" x2="${xt(C.t)}" y2="${Y1}" style="stroke:var(--tx);stroke-width:1.5"/>
        <circle cx="${xt(C.t)}" cy="${yg(h.GC)}" r="7" style="fill:var(--azc);stroke:#fff;stroke-width:2.5"/><circle cx="${xt(C.t)}" cy="${yp(e.P)}" r="7" style="fill:var(--ro);stroke:#fff;stroke-width:2.5"/>
        <text x="${X0 + 8}" y="${Y0 + 28}" font-size="11.5" class="t2">línea punteada = gasto solo con la lesión, sin compensadores</text>
        <text x="${X1 - 4}" y="${yp(K.PCP_EAP) - 4}" text-anchor="end" font-size="10.5" class="t2">(escala derecha 0-35 mmHg)</text>`;
      $("#gr").innerHTML = g;
      $("#go").textContent = f0(C.g * 100) + " %"; $("#to").textContent = "t = " + C.t; $("#tt").value = C.t;
      // niveles en las tarjetas
      const niv = { sns: s.sns, sraa: s.sraa, hip: s.hip, adh: s.adh, bnp: s.bnp };
      $("#v-gc").style.width = f0(100 * B.clamp(1 - h.GC / GCn, 0, 1)) + "%";
      $("#x-gc").textContent = `GC ${f1(h.GC)} L/min (normal ${f1(GCn)}) · FE ${f0(h.EF)} %`;
      MEC.forEach(m => {
        const v = niv[m.k], n = $("#n-" + m.k);
        $("#v-" + m.k).style.width = f0(100 * B.clamp(v, 0, 1)) + "%";
        n.classList.toggle("on", v > 0.12); n.classList.toggle("off", !C.on[m.k]);
      });
      // estado
      const ganancia = h.GC - s.GCsin, cong = e.P >= K.PCP_CONGESTION;
      let txt, cl;
      if (C.t === 0) { txt = "Recién ocurrida la lesión: el gasto cae, todavía no se activó ningún compensador."; }
      else if (ganancia > 0.15 && !cong) { txt = `<b>Fase compensada.</b> El simpático y el SRAA (y la hipertrofia) hacen que el gasto sea <b>${f1(ganancia)} L/min mayor</b> que el de la lesión sola. El paciente puede estar poco sintomático.`; }
      else if (ganancia > 0 && cong) { txt = `<b>Compensación con costo.</b> El gasto aún se sostiene, pero la retención de sodio y agua ya eleva la presión de llenado a ${f0(e.P)} mmHg: <span class="dato">congestión</span> (disnea, ortopnea, edema).`; }
      else if (ganancia <= 0) { txt = `<b>Descompensación.</b> La cardiotoxicidad de la activación crónica bajó la contractilidad: ahora el gasto es <span class="dato">peor que sin compensadores</span> (${f1(h.GC)} L/min) ${cong ? "y hay <span class=\"dato\">congestión</span> (" + f0(e.P) + " mmHg)" : ""}. Círculo vicioso en marcha.`; }
      else { txt = `El gasto está a ${f1(h.GC)} L/min.`; }
      const alguno = Object.values(C.on).some(Boolean);
      if (!alguno && C.t > 0) txt = "Sin compensadores el gasto queda en el que deja la lesión (línea punteada): menos perfusión, pero tampoco se acumula toxicidad ni congestión.";
      else if (!C.on.sns && !C.on.sraa && C.t > 12) txt += " <span class=\"nota\">Con el simpático y el SRAA bloqueados (betabloqueador + IECA) la cardiotoxicidad avanza mucho más lenta: base del tratamiento (clase 16).</span>";
      $("#estado").innerHTML = `<p>${txt}</p>`;
      cicloPintar(s);
    }
    // ---- círculo vicioso
    const NODOS = [
      { x: 200, y: 36, t: ["↓ Gasto", "cardiaco"], v: s => B.clamp(1 - s.h.GC / GCn, 0, 1) },
      { x: 338, y: 112, t: ["↑ Simpático", "y SRAA"], v: s => Math.max(s.sns, s.sraa) },
      { x: 300, y: 240, t: ["↑ Poscarga, retención", "de Na⁺ y agua"], v: s => Math.max(s.sraa, s.sns * 0.8) },
      { x: 100, y: 240, t: ["Cardiotoxicidad:", "fibrosis, ↑ O₂"], v: s => B.clamp(s.tox / 1.2, 0, 1) },
      { x: 62, y: 112, t: ["↓ Contractilidad", "intrínseca"], v: s => B.clamp(1 - s.cInt / (1 - 0.7 * C.g), 0, 1) }
    ];
    function cicloPintar(s) {
      let o = `<defs><marker id="fl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--ro)"/></marker></defs>`;
      NODOS.forEach((n, i) => {
        const m = NODOS[(i + 1) % 5], v = Math.max(n.v(s), m.v(s)), dx = m.x - n.x, dy = m.y - n.y, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        o += `<line class="fl" x1="${n.x + ux * 52}" y1="${n.y + uy * 30}" x2="${m.x - ux * 56}" y2="${m.y - uy * 32}" marker-end="url(#fl)" style="stroke:var(--ro);stroke-width:${(1.5 + 3 * v).toFixed(1)};opacity:${(0.25 + 0.75 * v).toFixed(2)}"/>`;
      });
      NODOS.forEach(n => {
        const v = n.v(s), a = (0.25 + 0.75 * v).toFixed(2);
        o += `<rect x="${n.x - 58}" y="${n.y - 26}" width="116" height="52" rx="14" style="fill:var(--papel);stroke:var(--ro);stroke-width:${(1.5 + 2.5 * v).toFixed(1)};opacity:${a}"/>
          <text x="${n.x}" y="${n.y - 4}" text-anchor="middle" font-size="12.5" font-weight="600">${n.t[0]}</text><text x="${n.x}" y="${n.y + 13}" text-anchor="middle" font-size="12.5" font-weight="600">${n.t[1]}</text>`;
      });
      o += `<text x="200" y="152" text-anchor="middle" font-size="14" font-weight="700" style="fill:var(--ro)">círculo</text><text x="200" y="170" text-anchor="middle" font-size="14" font-weight="700" style="fill:var(--ro)">vicioso</text>`;
      $("#ciclo").innerHTML = o;
    }
    recalcular();
    let acum = 0;
    U.anim((t, dt) => {
      if (!C.play) return;
      acum += dt * 6;
      if (acum >= 1) { const n = Math.floor(acum); acum -= n; C.t = Math.min(40, C.t + n); pintar(); if (C.t >= 40) { C.play = false; $("#play").textContent = "▶ Avanzar el tiempo"; } }
    });
  };
})();
