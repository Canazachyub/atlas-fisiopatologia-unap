/* Frank-Starling e IC — núcleo: tema, router, utilidades (sliders, animación, corazón SVG) y la pestaña «Curva».
   Las demás pestañas están en secciones.js y secciones2.js y se registran en window.SECC. */
(function () {
  "use strict";
  const B = window.BOMBA, K = B.K;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { $, $$ };

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

  /* ---------- estado compartido entre pestañas (precarga, poscarga, contractilidad…) ---------- */
  U.est = Object.assign({}, B.NORMAL);
  U.velocidad = 0.5;   // 1 = tiempo real; más lento para poder ver las fases
  const f0 = x => Math.round(x).toString(), f1 = x => x.toFixed(1);
  U.f0 = f0; U.f1 = f1;
  U.PRESETS = [
    { n: "Normal", e: { c: 1, a: 1, P: 10, r: 1, FC: 70 }, t: "Corazón sano en reposo: PCP ≈ 10 mmHg (clase), VS ≈ 75 mL, FE ≈ 60 %." },
    { n: "Ejercicio", e: { c: 1.4, a: 0.8, P: 12, r: 1, FC: 110 }, t: "El simpático sube contractilidad y frecuencia y baja la poscarga: la curva sube y el gasto se duplica." },
    { n: "Hemorragia", e: { c: 1, a: 1, P: 2, r: 1, FC: 100 }, t: "Pierde volumen: precarga baja, el VS cae y el simpático acelera el corazón para compensar." },
    { n: "Hipervolemia", e: { c: 1, a: 1, P: 22, r: 1, FC: 70 }, t: "Sobrecarga de volumen: un corazón sano la tolera (la curva es plana arriba), pero la presión de llenado sube hacia el pulmón." },
    { n: "Infarto extenso", e: { c: 0.35, a: 1.2, P: 22, r: 1, FC: 95 }, t: "IC sistólica: contractilidad muy baja, FE baja, curva plana. El gasto cae y la presión de llenado sube: congestión." },
    { n: "Crisis hipertensiva", e: { c: 0.9, a: 2, P: 16, r: 1, FC: 85 }, t: "Poscarga muy alta: el VI no puede vaciarse; clase 41: el aumento brusco de poscarga puede dar un EAP." },
    { n: "Estenosis aórtica", e: { c: 0.9, a: 1.8, P: 18, r: 1.3, FC: 75 }, t: "Sobrecarga de presión: el VI vence una válvula cerrada (poscarga alta) y se hipertrofia (más rigidez)." },
    { n: "IC diastólica", e: { c: 1, a: 1, P: 20, r: 2.5, FC: 75 }, t: "FE conservada, pero el ventrículo rígido solo se llena con presión alta: congestión con contractilidad normal." },
    { n: "Infarto tratado", e: { c: 0.4, a: 0.7, P: 14, r: 1, FC: 80 }, t: "Mismo corazón dañado con diuréticos (precarga baja) y IECA o vasodilatadores (poscarga baja): mejora el gasto y baja la congestión." }
  ];
  U.aplicar = p => { Object.assign(U.est, B.NORMAL, p.e); };

  /* ---------- detener animaciones al cambiar de pestaña ---------- */
  let gen = 0;
  U.detener = () => { gen++; U.alRedimensionar = null; };
  // Bucle de animación: fn(t en segundos, dt) mientras no cambie la pestaña
  U.anim = fn => {
    const g = gen; let t0 = null, tp = 0;
    const paso = ts => {
      if (g !== gen) return;
      if (t0 === null) { t0 = ts; tp = ts; }
      fn((ts - t0) / 1000, Math.min(0.1, (ts - tp) / 1000)); tp = ts;
      requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };
  U.vivo = () => gen;

  /* ---------- sliders ---------- */
  // defs: [{k, nombre, min, max, step, sal(e,h), nota}] ; devuelve {sync}
  U.sliders = (cont, defs, onchange) => {
    cont.innerHTML = defs.map(d => `<div class="sl"><label for="sl-${d.k}">${d.nombre}</label><output id="so-${d.k}"></output>
      <input type="range" id="sl-${d.k}" min="${d.min}" max="${d.max}" step="${d.step}"><small>${d.nota || ""}</small></div>`).join("");
    const sync = () => {
      const h = B.hemo(U.est);
      defs.forEach(d => { $("#sl-" + d.k, cont).value = U.est[d.k]; $("#so-" + d.k, cont).textContent = d.sal(U.est, h); });
    };
    defs.forEach(d => { $("#sl-" + d.k, cont).oninput = ev => { U.est[d.k] = parseFloat(ev.target.value); sync(); onchange(); }; });
    sync(); return { sync };
  };
  U.SL = {
    P: { k: "P", nombre: "Precarga · presión de llenado", min: 0, max: 35, step: 0.5, sal: e => e.P.toFixed(1) + " mmHg", nota: "Cuánto se llena y se estira el ventrículo antes de contraerse (volumen que vuelve). En la clase: PCP normal ≈ 10 mmHg." },
    a: { k: "a", nombre: "Poscarga · resistencia que vence", min: 0.5, max: 2.2, step: 0.05, sal: (e, h) => "×" + e.a.toFixed(2) + " · PAS≈" + f0(h.PAS), nota: "Presión contra la que eyecta el VI (HTA, estenosis aórtica, vasoconstricción)." },
    c: { k: "c", nombre: "Contractilidad · inotropismo", min: 0.2, max: 1.6, step: 0.05, sal: e => "×" + e.c.toFixed(2), nota: "Fuerza de contracción a un mismo estiramiento (isquemia, miocardiopatía, catecolaminas, digital)." },
    FC: { k: "FC", nombre: "Frecuencia cardiaca", min: 40, max: 150, step: 1, sal: e => f0(e.FC) + " lpm", nota: "Cronotropismo. GC = VS × FC." },
    r: { k: "r", nombre: "Rigidez del ventrículo (lusitropismo)", min: 1, max: 3, step: 0.1, sal: e => e.r <= 1.05 ? "normal" : "×" + e.r.toFixed(1), nota: "Distensibilidad al llenarse: hipertrofia, isquemia, pericarditis constrictiva la endurecen (IC diastólica)." }
  };
  U.chipsPresets = (cont, onsel) => {
    cont.innerHTML = `<div class="chips">${U.PRESETS.map((p, i) => `<button class="chip" data-i="${i}">${p.n}</button>`).join("")}</div>`;
    $$("button", cont).forEach(b => b.onclick = () => {
      const p = U.PRESETS[+b.dataset.i]; U.aplicar(p); $$("button", cont).forEach(x => x.classList.toggle("act", x === b)); onsel(p);
    });
  };

  /* ---------- indicadores (FE, GC…) con color de alarma ---------- */
  U.kpis = (e, h) => {
    const z = B.zona(e, h);
    const cFE = h.EF < K.FE_BAJA ? "mal" : h.EF < K.FE_NORMAL ? "med" : "ok";
    const cGC = h.GC < K.GC_BAJO ? "mal" : h.GC < 4.6 ? "med" : "ok";
    const cP = z.cong === "eap" ? "mal" : z.cong === "congestion" ? "med" : "ok";
    return `<div class="kpis">
      <div class="kpi ${cFE}"><b>${f0(h.EF)} %</b><span>Fracción de eyección</span></div>
      <div class="kpi"><b>${f0(h.SV)} mL</b><span>Volumen sistólico</span></div>
      <div class="kpi ${cGC}"><b>${f1(h.GC)} L/min</b><span>Gasto cardiaco</span></div>
      <div class="kpi ${cP}"><b>${f0(e.P)} mmHg</b><span>Presión de llenado</span></div>
      <div class="kpi"><b>${f0(h.PAS)}/${f0(h.PAD)}</b><span>PA aprox. (didáctica)</span></div></div>`;
  };

  /* ---------- explicación causal en vivo según lo que se movió ---------- */
  U.explicar = (e, h) => {
    const N = B.NORMAL, L = [], z = B.zona(e, h), tip = B.clasificar(e, h);
    const bajaC = e.c < 0.95, planaTxt = " Con la contractilidad baja la curva es <b>plana</b>: casi no gana volumen sistólico y la presión sube de balde.";
    if (e.P > N.P + 0.6) L.push(`<b>Precarga ↑ (${f1(e.P)} mmHg)</b>: el ventrículo se llena más y sus fibras se estiran; por la <b>ley de Frank-Starling</b> se contrae con más fuerza y el VS sube.${bajaC ? planaTxt : (e.P > 24 ? " Pero arriba la curva se aplana: más presión ya no da más gasto, solo congestión." : "")}`);
    if (e.P < N.P - 0.6) L.push(`<b>Precarga ↓ (${f1(e.P)} mmHg)</b>: llega menos sangre, el ventrículo se estira menos y el VS cae (hipovolemia, hemorragia, diuréticos, nitratos).`);
    if (e.a > 1.05) L.push(`<b>Poscarga ↑ (×${e.a.toFixed(2)})</b>: el VI debe vencer más presión (HTA, estenosis aórtica, vasoconstricción simpática y por angiotensina II). Eyecta menos, le sobra volumen al final (VTS ↑) y consume más O₂.`);
    if (e.a < 0.95) L.push(`<b>Poscarga ↓ (×${e.a.toFixed(2)})</b>: vasodilatación; el VI vacía mejor con el mismo esfuerzo (efecto de los IECA y vasodilatadores).`);
    if (e.c < 0.95) L.push(`<b>Contractilidad ↓ (×${e.c.toFixed(2)})</b>: a igual estiramiento el músculo empuja menos; la curva <b>se desplaza hacia abajo y se aplana</b>, la FE cae (IC sistólica).`);
    if (e.c > 1.05) L.push(`<b>Contractilidad ↑ (×${e.c.toFixed(2)})</b>: la curva sube y se desplaza hacia arriba (catecolaminas, ejercicio, digitálicos: inotropismo positivo).`);
    if (e.r > 1.1) L.push(`<b>Ventrículo rígido (×${e.r.toFixed(1)})</b>: con la misma presión entra menos sangre (VTD menor); la FE puede ser normal pero hace falta presión alta para llenarlo.`);
    if (e.FC > 80) L.push(`<b>FC ↑ (${f0(e.FC)} lpm)</b>: sube el gasto (GC = VS × FC) aunque el VS no cambie.`);
    if (e.FC < 60) L.push(`<b>FC ↓ (${f0(e.FC)} lpm)</b>: baja el gasto aunque el VS no cambie.`);
    if (!L.length) L.push("Todo en valores de reposo. Mueve un control y mira qué se desplaza.");
    let fin;
    if (z.cong !== "normal" && z.bajo) fin = `<span class="dato">Bajo gasto con congestión</span>: falla de bomba descompensada (cae el gasto hacia adelante y se congestiona hacia atrás).`;
    else if (z.cong === "eap") fin = `<span class="dato">Zona de EAP</span>: presión capilar ≥ 25 mmHg (clase 41: llega a 25-30), el líquido trasuda al alvéolo.`;
    else if (z.cong === "congestion") fin = `<span class="dato">Congestión pulmonar</span> (presión ≥ 18 mmHg <span class="lit">literatura</span>): disnea, ortopnea, crepitantes.`;
    else if (z.bajo) fin = `<span class="dato">Bajo gasto</span> (GC < 4 L/min <span class="lit">literatura</span>) sin congestión: fatiga, hipoperfusión, hipotensión.`;
    else fin = `Gasto adecuado y sin congestión.`;
    return L.map(t => `<p>${t}</p>`).join("") + `<p>${fin} <span class="nota">${tip.texto}</span></p>`;
  };

  /* ---------- corazón esquemático que late con el volumen del ciclo ---------- */
  const NS = "http://www.w3.org/2000/svg";
  U.corazon = cont => {
    cont.innerHTML = `<svg class="lienzo-svg" viewBox="0 0 360 270" role="img" aria-label="Corazón izquierdo que late con su volumen">
      <defs><clipPath id="clipP"><path d="M62 40 C22 50 10 110 14 180 C16 205 52 208 58 195 Z"/><path d="M66 40 C106 50 116 110 112 180 C110 205 76 208 68 195 Z"/></clipPath></defs>
      <text x="62" y="26" text-anchor="middle" font-size="13" class="t2">Pulmón</text>
      <path d="M62 40 C22 50 10 110 14 180 C16 205 52 208 58 195 Z" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2"/>
      <path d="M66 40 C106 50 116 110 112 180 C110 205 76 208 68 195 Z" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2"/>
      <rect id="h-liq" x="0" y="205" width="130" height="0" clip-path="url(#clipP)" style="fill:#3B82F6;opacity:.55"/>
      <g id="h-crep" style="opacity:0;stroke:var(--tx);stroke-width:1.6"><path d="M30 150l6 5M42 165l6 5M82 150l6 5M94 168l6 5M50 185l6 4M84 186l6 4" fill="none"/></g>
      <line id="h-vp" x1="112" y1="100" x2="300" y2="62" style="stroke:var(--azc);stroke-width:5;stroke-linecap:round;stroke-dasharray:3 9"/>
      <ellipse cx="170" cy="175" rx="30" ry="46" style="fill:var(--borde)"/>
      <text x="170" y="178" text-anchor="middle" font-size="13" class="t2">VD</text>
      <ellipse id="h-ref" cx="255" cy="172" rx="40" ry="49" style="fill:none;stroke:var(--tx2);stroke-width:1.5;stroke-dasharray:4 4"/>
      <ellipse id="h-mus" cx="255" cy="172" rx="52" ry="63" style="fill:#9F3B44"/>
      <ellipse id="h-cav" cx="255" cy="172" rx="40" ry="49" style="fill:#EF5350;opacity:.88"/>
      <circle id="h-ai" cx="306" cy="62" r="18" style="fill:var(--azc);stroke:var(--tx2);stroke-width:2"/>
      <text x="306" y="66" text-anchor="middle" font-size="12" style="fill:#fff">AI</text>
      <path id="h-ao" d="M232 118 C228 70 250 36 292 30 L350 30" fill="none" style="stroke:var(--ro);stroke-width:10;stroke-linecap:round"/>
      <text x="330" y="20" text-anchor="middle" font-size="12" class="t2">Aorta</text>
      <text id="h-vi" x="255" y="176" text-anchor="middle" font-size="16" style="fill:#fff;font-weight:700">VI</text>
      <text id="h-vol" x="180" y="262" text-anchor="middle" font-size="13" class="t2"></text>
    </svg>`;
    const s = id => $("#" + id, cont);
    const liq = s("h-liq"), crep = s("h-crep"), vp = s("h-vp"), ref = s("h-ref"), mus = s("h-mus"), cav = s("h-cav"), ai = s("h-ai"), ao = s("h-ao"), vol = s("h-vol");
    const rIn = V => 40 * Math.cbrt(V / 123.4);
    return {
      // pt: punto del ciclo {V,P,fase,flujo}; e: estado; h: hemodinamia
      upd(pt, e, h) {
        const r = rIn(pt.V), pared = 12 + 7 * (e.r - 1), ry = r * 1.22;
        cav.setAttribute("rx", r.toFixed(1)); cav.setAttribute("ry", ry.toFixed(1));
        mus.setAttribute("rx", (r + pared).toFixed(1)); mus.setAttribute("ry", (ry + pared).toFixed(1));
        const r0 = rIn(h.EDV); ref.setAttribute("rx", r0.toFixed(1)); ref.setAttribute("ry", (r0 * 1.22).toFixed(1));
        const nivel = B.clamp((e.P - 12) / 20, 0, 1);
        liq.setAttribute("y", (205 - 165 * nivel).toFixed(1)); liq.setAttribute("height", (165 * nivel).toFixed(1));
        crep.style.opacity = e.P >= K.PCP_CONGESTION ? 1 : 0;
        const col = e.P >= K.PCP_EAP ? "#B91C1C" : e.P >= K.PCP_CONGESTION ? "#F59E0B" : "#3B82F6";
        ai.style.fill = col; vp.style.stroke = col; ai.setAttribute("r", (14 + e.P * 0.32).toFixed(1));
        ao.style.strokeWidth = (4 + 11 * (pt.flujo || 0) * B.clamp(h.SV / 75, 0.2, 1.4)).toFixed(1);
        ao.style.opacity = pt.fase === "eyec" ? 1 : 0.45;
        cav.style.fill = pt.fase === "eyec" ? "#EF5350" : "#C62828";
        vol.textContent = `VTD ${f0(h.EDV)} mL · VTS ${f0(h.ESV)} mL · VS ${f0(h.SV)} mL (línea punteada = VTD normal)`;
      }
    };
  };

  /* =====================================================================
     PESTAÑA 1 · Curva de Frank-Starling
     ===================================================================== */
  SECC.curva = function (main) {
    main.innerHTML = `<h1>Curva de Frank-Starling</h1>
      <p class="lema">Mueve precarga, poscarga y contractilidad. La curva (volumen sistólico según la presión de llenado) se <b>desplaza sola</b>; el punto es tu corazón. A la derecha, la zona de <b>congestión</b>; abajo, la de <b>bajo gasto</b>.</p>
      <div class="grid2">
        <div>
          <div class="caja"><svg id="cv" class="lienzo-svg" viewBox="0 0 560 360" role="img" aria-label="Curva de Frank-Starling"></svg></div>
          <div class="letrero col" id="letrero" aria-live="polite"></div>
        </div>
        <div>
          <div class="caja"><b>Casos rápidos</b><div id="presets"></div><p class="nota" id="ptexto"></p>
            <div id="sliders"></div></div>
          <div class="caja"><div id="kp"></div><div id="corazon"></div></div>
        </div>
      </div>
      <div class="caja" style="padding:10px 12px"><h3 style="margin:2px 0 8px">❤️ El corazón por dentro <small class="nota">(ilustración + capa viva: late, se llena y expulsa con tu modelo)</small></h3>
        <div class="escena-real" id="correal" style="background:#01193F"><canvas role="img" aria-label="Corazón en corte: los ventrículos se llenan y se contraen, la sangre pasa por las válvulas abiertas"></canvas><img class="rot" alt="" src="rot_corazon.svg"></div>
        <p class="pie-esc nota"></p></div>`;
    const cv = $("#cv"), W = 560, X0 = 58, X1 = 540, Y0 = 22, Y1 = 300, SVMAX = 160;
    const xo = P => X0 + P / K.P_MAX * (X1 - X0), yo = v => Y1 - v / SVMAX * (Y1 - Y0);
    const path = pts => pts.map((p, i) => (i ? "L" : "M") + xo(p.P).toFixed(1) + " " + yo(p.SV).toFixed(1)).join(" ");
    const corazon = U.corazon($("#corazon")), real = U.corReal($("#correal"), B);
    let disp = null, traza = [], fase = 0;

    function estatico() {   // lo que cambia solo al mover un control
      const e = U.est, h = B.hemo(e), nor = B.hemo(B.NORMAL);
      const svBajo = K.GC_BAJO * 1000 / e.FC;
      let s = `<rect x="${xo(K.PCP_CONGESTION)}" y="${Y0}" width="${xo(K.PCP_EAP) - xo(K.PCP_CONGESTION)}" height="${Y1 - Y0}" style="fill:#F59E0B;opacity:.18"/>
        <rect x="${xo(K.PCP_EAP)}" y="${Y0}" width="${X1 - xo(K.PCP_EAP)}" height="${Y1 - Y0}" style="fill:#B91C1C;opacity:.18"/>
        <rect x="${X0}" y="${yo(svBajo)}" width="${X1 - X0}" height="${Y1 - yo(svBajo)}" style="fill:#6B7280;opacity:.22"/>`;
      for (let P = 0; P <= 35; P += 5) s += `<line x1="${xo(P)}" y1="${Y0}" x2="${xo(P)}" y2="${Y1}" style="stroke:var(--borde)"/><text x="${xo(P)}" y="${Y1 + 16}" text-anchor="middle" font-size="12" class="t2">${P}</text>`;
      for (let v = 0; v <= 160; v += 40) s += `<line x1="${X0}" y1="${yo(v)}" x2="${X1}" y2="${yo(v)}" style="stroke:var(--borde)"/><text x="${X0 - 6}" y="${yo(v) + 4}" text-anchor="end" font-size="12" class="t2">${v}</text>`;
      s += `<text x="${(X0 + X1) / 2}" y="${Y1 + 36}" text-anchor="middle" font-size="13.5">Presión de llenado (PTDVI ≈ presión capilar pulmonar), mmHg → precarga</text>
        <text transform="translate(14 ${(Y0 + Y1) / 2}) rotate(-90)" text-anchor="middle" font-size="13.5">Volumen sistólico (mL)</text>
        <text x="${xo(21.5)}" y="${Y0 + 14}" text-anchor="middle" font-size="11.5" class="t2">congestión</text>
        <text x="${xo(30)}" y="${Y0 + 14}" text-anchor="middle" font-size="11.5" style="fill:var(--ro)">EAP ≥ 25</text>
        <text x="${xo(18)}" y="${Y0 + 28}" text-anchor="middle" font-size="10.5" class="t2">≥18 lit.</text>
        <text x="${X0 + 8}" y="${Y1 - 6}" font-size="11.5" class="t2">bajo gasto (GC &lt; 4 L/min, lit.)</text>`;
      s += `<path d="${path(B.curva(B.NORMAL))}" fill="none" style="stroke:var(--tx2);stroke-width:2.5;stroke-dasharray:6 5"/>
        <text x="${xo(33)}" y="${yo(nor.SV) - 16}" text-anchor="end" font-size="12" class="t2">curva normal</text>
        <path d="${path(B.curva(e))}" fill="none" style="stroke:var(--az);stroke-width:4;stroke-linecap:round"/>
        <circle cx="${xo(10)}" cy="${yo(nor.SV)}" r="6" style="fill:none;stroke:var(--tx2);stroke-width:2"/>
        <text x="${xo(10) + 9}" y="${yo(nor.SV) + 18}" font-size="11.5" class="t2">reposo normal</text>`;
      $("#cv-fijo").innerHTML = s;
      $("#kp").innerHTML = U.kpis(e, h);
      $("#letrero").innerHTML = U.explicar(e, h);
    }
    cv.innerHTML = `<g id="cv-fijo"></g><g id="cv-traza"></g><line id="cv-lx" style="stroke:var(--az);stroke-dasharray:4 4;stroke-width:1.5"/><line id="cv-ly" style="stroke:var(--az);stroke-dasharray:4 4;stroke-width:1.5"/>
      <circle id="cv-pt" r="9" style="fill:var(--am);stroke:#1b1b1b;stroke-width:3"/><text id="cv-et" font-size="13" font-weight="700" text-anchor="middle"></text>`;
    function cambio() { estatico(); sliders.sync(); }
    $("#ptexto").textContent = U.PRESETS[0].t;
    U.chipsPresets($("#presets"), p => { $("#ptexto").textContent = p.t; cambio(); });
    $$("#presets button")[0].classList.add("act");
    const sliders = U.sliders($("#sliders"), [U.SL.P, U.SL.a, U.SL.c, U.SL.FC], () => { $$("#presets button").forEach(b => b.classList.remove("act")); estatico(); });
    estatico();

    U.anim((t, dt) => {
      const e = U.est, h = B.hemo(e);
      fase += dt * e.FC / 60 * U.velocidad;
      const pt = B.punto(fase, e, h);
      corazon.upd(pt, e, h);
      real.pintar(pt, e, h, dt, U.velocidad);
      const tx = xo(e.P), ty = yo(h.SV);
      if (!disp) disp = { x: tx, y: ty };
      disp.x += (tx - disp.x) * Math.min(1, dt * 6); disp.y += (ty - disp.y) * Math.min(1, dt * 6);
      traza.push({ x: disp.x, y: disp.y }); if (traza.length > 22) traza.shift();
      $("#cv-traza").innerHTML = traza.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(2 + i * 0.12).toFixed(1)}" style="fill:var(--azc);opacity:${(i / traza.length * 0.5).toFixed(2)}"/>`).join("");
      const pul = 9 + 3 * Math.sin(Math.PI * Math.min(1, ((fase % 1) / 0.4)));
      const p = $("#cv-pt"); p.setAttribute("cx", disp.x); p.setAttribute("cy", disp.y); p.setAttribute("r", pul.toFixed(1));
      const lx = $("#cv-lx"), ly = $("#cv-ly");
      lx.setAttribute("x1", disp.x); lx.setAttribute("x2", disp.x); lx.setAttribute("y1", disp.y); lx.setAttribute("y2", Y1);
      ly.setAttribute("x1", X0); ly.setAttribute("x2", disp.x); ly.setAttribute("y1", disp.y); ly.setAttribute("y2", disp.y);
      const et = $("#cv-et"); et.setAttribute("x", Math.min(W - 70, Math.max(100, disp.x))); et.setAttribute("y", disp.y - 16);
      et.textContent = `VS ${f0(h.SV)} mL · GC ${f1(h.GC)} L/min`;
    });
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "curva").split("/");
    const f = SECC[id] || SECC.curva;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "curva")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: clases 13 a 17, 33 y 41 de Fisiopatología 2026 (Dr. Sotito) y las láminas 13, 14, 23 y 26 del atlas.
      Lo marcado <span class="lit">literatura</span> viene de la fisiología general, no de la clase. El modelo es una simulación didáctica: sirve para entender el sentido de los cambios, no para calcular dosis ni diagnosticar.</p>`);
  }
  addEventListener("hashchange", ruta);
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
