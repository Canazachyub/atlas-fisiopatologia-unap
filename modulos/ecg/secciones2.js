/* ECG interactivo — secciones nuevas: electrolitos, compás (medir), eje, infarto en el tiempo y prueba ampliada. */
(function () {
  "use strict";
  const E = window.ECG, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$, css = U.css;
  const deg = r => r * 180 / Math.PI;

  /* =====================================================================
     ELECTROLITOS: el potasio y el calcio en vivo
     ===================================================================== */
  SECC.electrolitos = function (main) {
    main.innerHTML = `<h1>Potasio y calcio en el ECG</h1>
      <p class="lema">Mueve el potasio y el calcio y mira cómo cambian las ondas en tres derivaciones. Es lo que el docente pregunta: en la hiperpotasemia la <b>T alta y picuda</b>, en la hipopotasemia la <b>onda U</b>.</p>
      <div class="caja"><div class="ctrl" style="margin:0">
        <label style="flex:1 1 320px">K⁺ <input type="range" id="e-k" min="1.5" max="9.5" step="0.1" style="width:min(100%,360px)"> <b id="e-kv"></b> mEq/L</label>
        <label style="flex:1 1 320px">Ca²⁺ <input type="range" id="e-ca" min="6" max="14" step="0.1" style="width:min(100%,360px)"> <b id="e-cav"></b> mg/dL</label></div>
        <div class="chips" id="e-pre">${[["Normal", 4.2, 9.5], ["Hipo K grave", 2.0, 9.5], ["Hipo K", 3.0, 9.5], ["Hiper K leve", 6.0, 9.5], ["Hiper K moderada", 6.9, 9.5], ["Hiper K grave", 7.8, 9.5], ["Onda sinusoidal", 9.2, 9.5], ["Hipocalcemia", 4.2, 6.8], ["Hipercalcemia", 4.2, 13]]
          .map(([n, k, c]) => `<button class="chip" data-k="${k}" data-c="${c}">${n}</button>`).join("")}</div></div>
      <div class="grid2"><div>
        <div class="caja" style="padding:8px"><canvas class="ecg" id="e-dii"></canvas></div>
        <div class="caja" style="padding:8px"><canvas class="ecg" id="e-v2"></canvas></div>
        <div class="caja" style="padding:8px"><canvas class="ecg" id="e-v5"></canvas></div></div>
      <div><div class="caja info" id="e-txt"></div>
        <div class="caja"><h3 style="margin-top:0">La escalera del potasio</h3>
          <table class="tabla" style="width:100%;border-collapse:collapse;font-size:15px">
            <tr><th style="text-align:left">K⁺ (mEq/L)</th><th style="text-align:left">ECG</th></tr>
            <tr><td>&lt; 2.5</td><td>T casi plana, U grande, ST descendido, riesgo de TV/torsades</td></tr>
            <tr><td>2.5-3.5</td><td><b>P y T aplanadas, onda U</b>, extrasístoles (docente)</td></tr>
            <tr><td>3.5-5.5</td><td>Normal</td></tr>
            <tr><td>5.5-6.5</td><td><b>T alta, picuda y simétrica</b> (docente)</td></tr>
            <tr><td>6.5-8</td><td><b>P aplanada, QRS ancho</b> (docente)</td></tr>
            <tr><td>&gt; 8-9</td><td>Onda sinusoidal → fibrilación ventricular o asistolia (docente: riesgo con K &gt; 9)</td></tr></table>
          <p class="nota">Por qué: el potasio fija el potencial de reposo. Si sube, la célula queda menos negativa y se repolariza más rápido (T picuda), pero conduce peor (P y QRS se aplanan y ensanchan). Si baja, la repolarización se alarga y aparece la U. <span class="lit">literatura</span></p></div></div></div>`;
    const st = { k: 4.2, ca: 9.5 };
    function pinta() {
      $("#e-k").value = st.k; $("#e-ca").value = st.ca; $("#e-kv").textContent = st.k.toFixed(1); $("#e-cav").textContent = st.ca.toFixed(1);
      const ecg = E.construir({ tipo: "normal", fc: 68, k: st.k, ca: st.ca, semilla: 5 }, 10);
      U.tira($("#e-dii"), ecg, "DII", 4, 30); U.tira($("#e-v2"), ecg, "V2", 4, 30); U.tira($("#e-v5"), ecg, "V5", 4, 30);
      $("#e-txt").innerHTML = U.textoElectro(st.k, st.ca) || "<p>🧪 <b>Potasio y calcio normales</b>: K 3.5-5.5 mEq/L · Ca 8.5-10.5 mg/dL. Mueve una perilla.</p>";
      $$("#e-pre .chip").forEach(b => b.classList.toggle("act", +b.dataset.k === st.k && +b.dataset.c === st.ca));
    }
    $("#e-k").oninput = ev => { st.k = +ev.target.value; pinta(); };
    $("#e-ca").oninput = ev => { st.ca = +ev.target.value; pinta(); };
    $$("#e-pre .chip").forEach(b => b.onclick = () => { st.k = +b.dataset.k; st.ca = +b.dataset.c; pinta(); });
    pinta(); U.alRedimensionar = pinta; U.repintar = pinta;
  };

  /* =====================================================================
     COMPÁS: medir intervalos sobre el papel
     ===================================================================== */
  SECC.medir = function (main) {
    const op = Object.entries(E.PATRONES).filter(([k]) => !["fv", "asistolia", "torsades"].includes(k));
    main.innerHTML = `<h1>Compás: mide sobre el papel</h1>
      <p class="lema">Arrastra las dos patas del compás (las líneas rojas) sobre el trazado. Te dice el tiempo entre ellas, cuántos cuadraditos son y, si mides de una R a la siguiente, la frecuencia. Luego ponte a prueba con los retos.</p>
      <div class="caja"><div class="ctrl" style="margin:0"><label>Trazado <select id="m-tipo">${op.map(([k, p]) => `<option value="${k}">${p.nombre}</option>`).join("")}</select></label>
        <label>Derivación <select id="m-der">${E.LISTA12.map(d => `<option>${d}</option>`).join("")}</select></label>
        <span class="chips" id="m-reto"><button class="chip" data-r="PR">🎯 Mide el PR</button><button class="chip" data-r="QRS">🎯 Mide el QRS</button><button class="chip" data-r="QT">🎯 Mide el QT</button><button class="chip" data-r="RR">🎯 Mide un RR y saca la FC</button></span></div></div>
      <div class="caja" style="padding:8px;touch-action:none"><canvas class="ecg" id="m-cv" style="cursor:ew-resize"></canvas></div>
      <div class="grid2"><div class="caja"><div id="m-lect" style="font-size:18px;font-weight:700"></div><div id="m-reto-txt" class="nota" style="margin-top:6px"></div>
        <div class="ctrl"><button class="btn" id="m-ok" style="display:none">✔ Comprobar mi medida</button><button class="btn sec" id="m-nuevo">🔁 Otro trazado</button></div><div id="m-fb"></div></div>
      <div class="caja"><h3 style="margin-top:0">Cómo medir</h3><ul>
        <li>1 cuadradito = <b>0.04 s</b> (1 mm) · 1 cuadrado grande = <b>0.20 s</b> (5 mm).</li>
        <li><b>PR</b>: del inicio de la P al inicio del QRS · normal <span class="dato">0.12-0.20 s</span>.</li>
        <li><b>QRS</b>: del inicio de la Q (o R) al final de la S · normal <span class="dato">&lt; 0.12 s</span>.</li>
        <li><b>QT</b>: del inicio del QRS al final de la T · normal <span class="dato">0.34-0.44 s</span> (se acorta con la FC).</li>
        <li><b>FC</b> = 1500 ÷ cuadraditos entre dos R = 300 ÷ cuadrados grandes = 60 ÷ RR en segundos.</li></ul></div></div>`;
    let tipo = "normal", der = "DII", ecg, P, xa = 0, xb = 0, arr = null, reto = null;
    const t0 = 0.3, seg = 4;
    const tDeX = x => t0 + (x - P.x0) / (25 * P.mm), xDeT = t => P.x0 + (t - t0) * 25 * P.mm;
    function nuevo(semilla) {
      ecg = E.construir({ tipo, fc: E.PATRONES[tipo].fc, semilla: semilla || 1 + Math.floor(Math.random() * 1e6), region: "anteroseptal", fase: "les_epi" }, 12);
      pinta(true);
    }
    function pinta(inicial) {
      P = U.tira($("#m-cv"), ecg, der, seg, 34);
      if ((inicial && !reto) || !xa) { const q = ecg.latidos.filter(l => l.tq != null && l.tq > 0.6); xa = xDeT(q[0] ? q[0].tq : 1); xb = xDeT(q[1] ? q[1].tq : 1.8); }
      const c = P.c;
      [xa, xb].forEach((x, i) => { c.strokeStyle = css("--ro"); c.lineWidth = 2; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, P.H); c.stroke(); c.setLineDash([]);
        c.fillStyle = css("--ro"); c.beginPath(); c.arc(x, P.H - 10, 7, 0, 7); c.fill(); });
      const y = 12, a = Math.min(xa, xb), b = Math.max(xa, xb);
      c.strokeStyle = css("--ro"); c.lineWidth = 2; c.beginPath(); c.moveTo(a, y); c.lineTo(b, y); c.stroke();
      const dt = Math.abs(tDeX(xb) - tDeX(xa)), cu = dt / 0.04;
      $("#m-lect").innerHTML = `Δt = <span class="dato">${dt.toFixed(3)} s</span> (${Math.round(dt * 1000)} ms) · ${cu.toFixed(1)} cuadraditos${dt > 0.25 ? ` · si es un RR: FC ≈ <span class="dato">${Math.round(60 / dt)} lpm</span>` : ""}`;
    }
    const cv = $("#m-cv");
    const pos = ev => { const r = cv.getBoundingClientRect(); return ev.clientX - r.left; };
    cv.addEventListener("pointerdown", ev => { const x = pos(ev); arr = Math.abs(x - xa) < Math.abs(x - xb) ? "a" : "b"; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} mover(ev); });
    const mover = ev => { if (!arr) return; const x = Math.max(P.x0, Math.min(P.W - 4, pos(ev))); if (arr === "a") xa = x; else xb = x; pinta(); };
    cv.addEventListener("pointermove", mover);
    addEventListener("pointerup", () => arr = null);
    function verdad(r) {
      const l = ecg.latidos.find(x => x.tq != null && x.tp != null && x.conduce && x.tq > 0.6) || ecg.latidos.find(x => x.tq != null && x.tq > 0.6);
      const m = l._m || E.morfo(ecg.cfg, l, ecg.el);
      if (r === "PR") return l.tp != null ? l.tq - l.tp : null;
      if (r === "QRS") return m.qrsDur;
      if (r === "QT") return E.qt(l, m) + 0.02;
      if (r === "RR") return l.rr;
    }
    $$("#m-reto .chip").forEach(b => b.onclick = () => {
      reto = b.dataset.r; $$("#m-reto .chip").forEach(x => x.classList.toggle("act", x === b));
      xa = P.W * 0.45; xb = P.W * 0.5; pinta();   // las patas juntas en el centro: la medida la haces tú
      if (reto === "PR" && ["fa", "flutter", "tsv", "tv", "bav3"].includes(tipo)) { tipo = "normal"; $("#m-tipo").value = tipo; nuevo(); }
      $("#m-reto-txt").innerHTML = { PR: "Pon una pata al <b>inicio de la P</b> y la otra al <b>inicio del QRS</b>.", QRS: "Pon una pata al <b>inicio del QRS</b> y la otra al <b>final de la S</b> (donde empieza el ST).", QT: "Del <b>inicio del QRS</b> al <b>final de la T</b> (donde vuelve a la línea de base).", RR: "De la punta de una <b>R</b> a la punta de la <b>R siguiente</b>." }[reto];
      $("#m-ok").style.display = ""; $("#m-fb").innerHTML = "";
    });
    $("#m-ok").onclick = () => {
      const v = verdad(reto), dt = Math.abs(tDeX(xb) - tDeX(xa)); if (v == null) { $("#m-fb").innerHTML = "<p>Este trazado no tiene P medible: elige otro.</p>"; return; }
      const err = Math.abs(dt - v), bien = err <= Math.max(0.02, v * 0.12);
      $("#m-fb").innerHTML = `<p style="font-weight:700">${bien ? "✅ ¡Bien medido!" : "Casi"}: tú ${dt.toFixed(2)} s · valor del trazado ≈ <span class="dato">${v.toFixed(2)} s</span>${reto === "RR" ? ` → FC ${Math.round(60 / v)} lpm` : ""}.</p>
        <p class="nota">${reto === "PR" ? (v > 0.2 ? "PR > 0.20 s: bloqueo AV de 1.er grado." : v < 0.12 ? "PR < 0.12 s: preexcitación (WPW)." : "PR normal.") : reto === "QRS" ? (v >= 0.12 ? "QRS ≥ 0.12 s: ancho (bloqueo de rama, origen ventricular, hiperpotasemia)." : "QRS estrecho: conducción normal por el His-Purkinje.") : reto === "QT" ? (v > 0.44 ? "QT largo: ojo con hipocalcemia, hipopotasemia (QU) y riesgo de torsades." : "QT dentro de lo esperable para esta FC.") : ""}</p>`;
    };
    $("#m-tipo").onchange = ev => { tipo = ev.target.value; nuevo(); };
    $("#m-der").onchange = ev => { der = ev.target.value; pinta(true); };
    $("#m-nuevo").onclick = () => { if (reto) { xa = P.W * 0.45; xb = P.W * 0.5; } const ops = ["normal", "bav1", "taqui", "bradi", "bcrd", "bcri", "wpw", "hvi", "flutter", "fa"]; tipo = ops[Math.floor(Math.random() * ops.length)]; $("#m-tipo").value = tipo; nuevo(); $("#m-fb").innerHTML = ""; };
    $("#m-der").value = der; nuevo(9); U.alRedimensionar = () => pinta(true); U.repintar = () => pinta();
  };

  /* =====================================================================
     EJE: arrastra el vector o calcula con DI y aVF
     ===================================================================== */
  const ejeQRS = cfg => {   // eje real del modelo: área neta del QRS en DI y aVF
    const ecg = E.construir(Object.assign({ tipo: "normal", fc: 60, semilla: 3 }, cfg), 3), l = ecg.latidos.find(x => x.tq != null && x.tq > 0.5);
    let a = 0, b = 0; for (let t = l.tq - 0.02; t < l.tq + 0.2; t += 0.002) { a += E.valor(ecg, "DI", t); b += E.valor(ecg, "aVF", t); }
    return deg(Math.atan2(b, a));
  };
  let EJE0 = null;
  SECC.eje = function (main) {
    if (EJE0 == null) EJE0 = ejeQRS({});
    main.innerHTML = `<h1>El eje eléctrico</h1>
      <p class="lema">Arrastra la flecha sobre el sistema hexaxial y mira cómo cambian los QRS de las seis derivaciones del plano frontal. Truco del examen: <b>DI y aVF</b> te dan el cuadrante; la derivación donde el QRS es <b>isodifásico</b> (tan positivo como negativo) es perpendicular al eje.</p>
      <div class="grid2"><div class="caja" style="display:grid;place-items:center;touch-action:none"><canvas id="x-cv" width="420" height="420" style="width:min(100%,420px);aspect-ratio:1;cursor:grab"></canvas>
        <div id="x-lect" style="font-size:20px;font-weight:700;margin-top:6px"></div><div id="x-clase" class="nota" style="font-size:15px"></div>
        <div class="chips" style="justify-content:center">${[["Normal +60°", 60], ["HVI −30°", -30], ["BCRI −45°", -45], ["HVD +120°", 120], ["BCRD +110°", 110], ["Extremo −120°", -120]].map(([n, a]) => `<button class="chip" data-a="${a}">${n}</button>`).join("")}</div>
        <div class="ctrl"><button class="btn" id="x-reto">🎯 Reto: adivina el eje</button></div><div id="x-fb"></div></div>
      <div><div class="caja" style="padding:8px"><canvas class="ecg" id="x-6"></canvas></div>
        <div class="caja"><ul>
          <li><b>Normal</b>: 0° a +90° según tu clase (otros autores aceptan −30° a +110°): DI y aVF positivos.</li>
          <li><b>Desviado a la izquierda</b> (&lt; −30°): DI positivo, aVF negativo · HVI, BCRI, hemibloqueo anterior, IAM inferior.</li>
          <li><b>Desviado a la derecha</b> (&gt; +90°): DI negativo, aVF positivo · HVD, BCRD, cor pulmonale, EPOC.</li>
          <li><b>Extremo</b> (−90° a ±180°): DI y aVF negativos · origen ventricular, error de electrodos.</li></ul></div></div></div>`;
    let ang = 60, arr = false, reto = null;
    const cv = $("#x-cv"), c = cv.getContext("2d"), R = 170, C = 210;
    const LEADS = [["DI", 0], ["DII", 60], ["DIII", 120], ["aVR", -150], ["aVL", -30], ["aVF", 90]];
    function dib() {
      c.clearRect(0, 0, 420, 420); c.font = "600 15px Fredoka, Nunito, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
      const zonas = [[-30, 90, "rgba(34,197,94,.13)"], [90, 180, "rgba(59,130,246,.12)"], [-90, -30, "rgba(245,158,11,.15)"], [-180, -90, "rgba(239,68,68,.12)"]];
      zonas.forEach(([a, b, col]) => { c.fillStyle = col; c.beginPath(); c.moveTo(C, C); c.arc(C, C, R, a * Math.PI / 180, b * Math.PI / 180); c.closePath(); c.fill(); });
      LEADS.forEach(([n, a]) => { const r = a * Math.PI / 180; c.strokeStyle = css("--borde"); c.lineWidth = 1.5; c.beginPath(); c.moveTo(C - R * Math.cos(r), C - R * Math.sin(r)); c.lineTo(C + R * Math.cos(r), C + R * Math.sin(r)); c.stroke();
        c.fillStyle = css("--az"); c.fillText(n, C + (R + 22) * Math.cos(r), C + (R + 22) * Math.sin(r)); c.fillStyle = css("--tx2"); c.font = "500 11px Nunito, sans-serif"; c.fillText((a > 0 ? "+" : "") + a + "°", C + (R - 16) * Math.cos(r), C + (R - 16) * Math.sin(r)); c.font = "600 15px Fredoka, Nunito, sans-serif"; });
      if (!reto) { const r = ang * Math.PI / 180, x = C + (R - 8) * Math.cos(r), y = C + (R - 8) * Math.sin(r);
        c.strokeStyle = css("--ro"); c.fillStyle = css("--ro"); c.lineWidth = 5; c.beginPath(); c.moveTo(C, C); c.lineTo(x, y); c.stroke();
        c.beginPath(); c.moveTo(x, y); c.lineTo(x - 16 * Math.cos(r - 0.4), y - 16 * Math.sin(r - 0.4)); c.lineTo(x - 16 * Math.cos(r + 0.4), y - 16 * Math.sin(r + 0.4)); c.fill();
        c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }
    }
    const clase = a => a >= -30 && a <= 90 ? (a < 0 ? "Normal para otros autores (−30° a 0°); tu clase dice 0° a +90°" : "Eje normal") : a > 90 && a <= 180 ? "Desviado a la derecha" : a < -30 && a >= -90 ? "Desviado a la izquierda" : "Eje extremo (tierra de nadie)";
    function pinta() {
      dib();
      const ecg = E.construir({ tipo: "normal", fc: 70, rotar: ang - EJE0, semilla: 4 }, 6);
      U.seis($("#x-6"), ecg);
      if (!reto) {
        let iso = LEADS.map(([n, a]) => [n, Math.abs(((ang - a + 540) % 360) - 180)]).sort((p, q) => Math.abs(p[1] - 90) - Math.abs(q[1] - 90))[0][0];
        $("#x-lect").textContent = `Eje ${ang > 0 ? "+" : ""}${Math.round(ang)}°`; $("#x-clase").innerHTML = `${clase(ang)} · isodifásica: <b>${iso}</b>`;
      }
      $$(".chip[data-a]").forEach(b => b.classList.toggle("act", +b.dataset.a === Math.round(ang)));
    }
    const angDe = ev => { const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * 420 / r.width - C, y = (ev.clientY - r.top) * 420 / r.height - C; return deg(Math.atan2(y, x)); };
    cv.addEventListener("pointerdown", ev => { arr = true; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} ang = Math.round(angDe(ev)); if (reto != null) responder(); else pinta(); });
    cv.addEventListener("pointermove", ev => { if (arr && reto == null) { ang = Math.round(angDe(ev)); pinta(); } });
    addEventListener("pointerup", () => arr = false);
    $$(".chip[data-a]").forEach(b => b.onclick = () => { reto = null; ang = +b.dataset.a; $("#x-fb").innerHTML = ""; pinta(); });
    function responder() {
      const err = Math.abs(((ang - reto + 540) % 360) - 180), bien = err <= 25;
      $("#x-fb").innerHTML = `<p style="font-weight:700">${bien ? "✅ ¡Muy bien!" : "Casi"}: tocaste ${Math.round(ang)}° · el eje era <span class="dato">${reto > 0 ? "+" : ""}${reto}°</span> (${clase(reto)}).</p>`;
      const r = reto; reto = null; ang = r; pinta();
    }
    $("#x-reto").onclick = () => {
      reto = [-120, -60, -30, 0, 30, 60, 90, 120, 150][Math.floor(Math.random() * 9)] + Math.round((Math.random() - 0.5) * 20);
      const guardado = ang; ang = reto; const ecg = E.construir({ tipo: "normal", fc: 70, rotar: reto - EJE0, semilla: 4 }, 6); ang = guardado;
      U.seis($("#x-6"), ecg); dib(); $("#x-lect").textContent = "¿Dónde está el eje?"; $("#x-clase").textContent = "Mira las 6 derivaciones y toca el círculo donde crees que apunta el vector.";
      $("#x-fb").innerHTML = "";
    };
    pinta(); U.alRedimensionar = pinta; U.repintar = pinta;
  };
  // seis derivaciones del plano frontal, una por fila corta (2.5 s)
  U.seis = function (cv, ecg) {
    const P = new U.Papel(cv, 1), w = cv.clientWidth || 600; P.mm = (w - 4) / 135; P.H = Math.round(P.mm * 96);
    const dpr = P.dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(P.H * dpr); cv.style.height = P.H + "px"; P.c.setTransform(dpr, 0, 0, dpr, 0, 0); P.W = w;
    P.grilla(); const mm = P.mm;
    [["DI", "aVR"], ["DII", "aVL"], ["DIII", "aVF"]].forEach((fila, r) => fila.forEach((d, k) => {
      const x = 4 * mm + k * 66 * mm, y = (18 + r * 31) * mm; P.trazo(ecg, d, 0.6, 3.0, x, y, d === "DI" || d === "aVF" ? css("--ro") : null, d === "DI" || d === "aVF" ? 2 : 1.6);
      P.texto(d, x + 2, y - 11 * mm, d === "DI" || d === "aVF" ? css("--ro") : css("--az"), Math.max(12, mm * 3.4));
    }));
    return P;
  };

  /* =====================================================================
     INFARTO EN EL TIEMPO: elige la arteria y mueve el reloj
     ===================================================================== */
  const PARADAS = [[0, "0 min · recién ocluida"], [0.05, "3 min"], [0.25, "15 min"], [1, "1 hora"], [3, "3 horas"], [12, "12 horas"], [24, "1 día"], [72, "3 días"], [168, "1 semana"], [720, "1 mes"], [4380, "6 meses"], [17520, "2 años"]];
  function textoTiempo(h) {
    if (h < 0.04) return "La arteria acaba de ocluirse: el ECG todavía puede ser normal. La clínica (dolor) va por delante.";
    if (h < 0.3) return "<b>T hiperaguda</b> (isquemia subendocárdica): T alta, ancha y simétrica en las derivaciones de la zona. Es el primer signo y dura pocos minutos.";
    if (h < 12) return "<b>Lesión subepicárdica</b>: el <b>ST se eleva</b> (a los 30-90 s de la isquemia según el docente) y arrastra la T. Imagen en espejo (ST descendido) en las opuestas. Es la fase en que urge reperfundir.";
    if (h < 48) return "<b>Necrosis</b>: aparece la <b>onda Q patológica</b> (ancha y profunda) mientras el ST empieza a bajar y la T se invierte.";
    if (h < 24 * 30) return "<b>Infarto evolucionado</b>: Q establecida, ST casi en la línea, <b>T negativa, simétrica y puntiaguda</b>.";
    return "<b>Infarto antiguo</b>: la <b>Q queda para siempre</b>; la T puede tardar meses o años en normalizarse (a veces nunca).";
  }
  SECC.evolucion = function (main) {
    main.innerHTML = `<h1>Infarto en el tiempo</h1>
      <p class="lema">Elige la arteria que se tapa y mueve el reloj: verás la secuencia <b>T hiperaguda → ST elevado → onda Q → T invertida</b> en las derivaciones que miran la zona (en rojo), y la imagen en espejo en las opuestas.</p>
      <div class="caja"><div class="chips" id="v-reg">${Object.entries(E.REGIONES).map(([k, r]) => `<button class="chip" data-r="${k}">${r.arteria} → ${r.nombre.toLowerCase()}</button>`).join("")}</div>
        <div class="ctrl"><button class="btn" id="v-play">▶ Reproducir</button><label style="flex:1 1 380px">⏱️ <input type="range" id="v-t" min="0" max="${PARADAS.length - 1}" step="1" style="width:min(100%,520px)"> <b id="v-tv"></b></label></div></div>
      <div class="caja" style="padding:8px"><canvas class="ecg" id="v-12"></canvas></div>
      <div class="grid2"><div class="caja info" id="v-txt"></div><div class="caja" style="padding:8px"><div class="lienzo"><img src="img/infarto.webp" alt="Corazón con un trombo en una coronaria y zonas de necrosis, lesión e isquemia"></div></div></div>`;
    let region = "anteroseptal", i = 0, play = null;
    function pinta() {
      const h = PARADAS[i][0], R = E.REGIONES[region];
      $$("#v-reg .chip").forEach(b => b.classList.toggle("act", b.dataset.r === region));
      $("#v-t").value = i; $("#v-tv").textContent = PARADAS[i][1];
      const ecg = E.construir({ tipo: "iam", region, horas: h, semilla: 11, fc: 84 }, 14);
      U.doce($("#v-12"), ecg, { resaltar: R.ve.concat(region === "posterior" ? R.espejo : []), ritmo: R.ve.includes("DII") ? "DII" : "V2" });
      const p = E.PESOS(h);
      $("#v-txt").innerHTML = `<h3 style="margin-top:0">${R.arteria} · ${R.nombre}</h3><p>${textoTiempo(h)}</p>
        <p>Lo ven: <b>${R.ve.join(", ")}</b> · espejo: ${R.espejo.join(", ")}.</p>
        <div class="chips">${[["T hiperaguda", p.hiper], ["ST elevado", p.st], ["Onda Q", p.q], ["T invertida", p.tinv]].map(([n, w]) => `<span class="chip" style="opacity:${0.35 + 0.65 * w};${w > 0.5 ? "background:var(--ro);color:#fff;border-color:var(--ro)" : ""}">${n}</span>`).join("")}</div>
        ${region === "posterior" ? `<p class="nota">El dorsal no tiene electrodos de frente en el ECG de 12: se ve en espejo en V1-V3 (R alta, ST descendido). Pide V7-V8.</p>` : ""}`;
    }
    $$("#v-reg .chip").forEach(b => b.onclick = () => { region = b.dataset.r; pinta(); });
    $("#v-t").oninput = ev => { i = +ev.target.value; pinta(); };
    $("#v-play").onclick = () => {
      if (play) { clearInterval(play); play = null; $("#v-play").textContent = "▶ Reproducir"; return; }
      if (i >= PARADAS.length - 1) i = 0;
      $("#v-play").textContent = "⏸ Pausa";
      play = setInterval(() => { if (i >= PARADAS.length - 1) { clearInterval(play); play = null; $("#v-play").textContent = "▶ Reproducir"; return; } i++; pinta(); }, 1600);
      (U._timers = U._timers || []).push(play);
    };
    pinta(); U.alRedimensionar = pinta; U.repintar = pinta;
  };

  /* =====================================================================
     PONTE A PRUEBA (ampliada): ritmos, 12 derivaciones, electrolitos y casos clínicos
     ===================================================================== */
  const CASOS = [
    { c: "Varón de 58 años con dolor opresivo retroesternal de 2 horas, sudoroso.", e: { tipo: "iam", region: "inferior", horas: 2 }, r: "IAM inferior agudo (ST elevado en DII, DIII, aVF)", f: ["Pericarditis aguda", "IAM anteroseptal antiguo", "Hipertrofia ventricular izquierda"], x: "ST elevado en las tres inferiores con espejo en DI y aVL: coronaria derecha. La pericarditis eleva el ST en casi todas, sin espejo." },
    { c: "Mujer de 70 años con IRC que no fue a su diálisis; debilidad.", e: { tipo: "normal", k: 7.4 }, r: "Hiperpotasemia grave", f: ["Hipopotasemia", "Hipercalcemia", "Isquemia subendocárdica"], x: "T picudas, P aplanada y QRS ensanchado: potasio alto (la IRC no lo elimina)." },
    { c: "Varón de 30 años que toma diuréticos y tiene calambres.", e: { tipo: "normal", k: 2.3 }, r: "Hipopotasemia", f: ["Hiperpotasemia", "Hipocalcemia", "BAV de 1.er grado"], x: "T aplanada con onda U grande: los diuréticos pierden potasio por la orina." },
    { c: "Joven de 22 años con palpitaciones que empiezan y terminan de golpe.", e: { tipo: "tsv" }, r: "Taquicardia supraventricular paroxística", f: ["Taquicardia sinusal", "Fibrilación auricular", "Taquicardia ventricular"], x: "Muy rápida (~180), regular, QRS estrecho, sin P visible, inicio y fin bruscos." },
    { c: "Mujer de 65 años con estenosis mitral y pulso irregularmente irregular.", e: { tipo: "fa" }, r: "Fibrilación auricular", f: ["Flutter auricular", "Arritmia sinusal", "Extrasístoles auriculares"], x: "Sin P, ondas f y RR totalmente irregular. La estenosis mitral dilata la aurícula izquierda." },
    { c: "Varón de 62 años con EPOC; FC fija en 150.", e: { tipo: "flutter", cond: 2, fc: 150 }, r: "Flutter auricular 2:1", f: ["Taquicardia sinusal", "Fibrilación auricular", "TSV paroxística"], x: "Ondas F en diente de sierra en DII; 300/2 = 150. Una FC fija de 150 sugiere flutter." },
    { c: "Paciente que se desploma en la UCI, sin pulso.", e: { tipo: "fv" }, r: "Fibrilación ventricular", f: ["Asistolia", "Taquicardia ventricular", "Torsades de pointes"], x: "Caos sin QRS: desfibrilar ya." },
    { c: "Paciente posinfarto con salvas de latidos anchos a 170 lpm, hipotenso.", e: { tipo: "tv" }, r: "Taquicardia ventricular", f: ["TSV paroxística", "Flutter 2:1", "Taquicardia sinusal"], x: "QRS ancho y regular con disociación AV: origen ventricular." },
    { c: "Anciano con síncopes y convulsiones breves; FC 36.", e: { tipo: "bav3" }, r: "BAV de 3.er grado (Stokes-Adams)", f: ["Bradicardia sinusal", "BAV Mobitz I", "BAV de 1.er grado"], x: "P y QRS independientes; escape ventricular lento y ancho. Indicación de marcapaso." },
    { c: "Estudiante de 19 años con dolor torácico que mejora al inclinarse adelante, tras un resfrío.", e: { tipo: "pericarditis" }, r: "Pericarditis aguda", f: ["IAM anterior extenso", "Repolarización normal", "Hiperpotasemia leve"], x: "ST elevado cóncavo y difuso, PR descendido, sin Q ni espejo." },
    { c: "Hipertenso de larga data, asintomático, chequeo de rutina.", e: { tipo: "hvi" }, r: "Hipertrofia ventricular izquierda", f: ["Bloqueo de rama izquierda", "IAM lateral", "Hipertrofia ventricular derecha"], x: "Sokolow ≥ 35 mm y T invertida asimétrica en V5-V6 (sobrecarga)." },
    { c: "Joven con episodios de taquicardia; PR muy corto en el control.", e: { tipo: "wpw" }, r: "Wolff-Parkinson-White", f: ["BAV de 1.er grado", "Bloqueo de rama derecha", "Ritmo sinusal normal"], x: "PR corto + onda delta + QRS ancho: haz de Kent." }
  ];
  SECC.prueba = function (main) {
    const RITMO = ["normal", "taqui", "bradi", "arritmia", "esa", "esv", "bigem", "bav1", "mobitz1", "mobitz2", "bav3", "fa", "flutter", "tsv", "tv", "torsades", "fv", "asistolia"];
    const MORFO = ["bcrd", "bcri", "wpw", "had", "hai", "hvd", "hvi", "iam", "pericarditis"];
    const ELEC = [["Hipopotasemia grave", 2.0, 9.5], ["Hipopotasemia", 3.0, 9.5], ["Normal", 4.2, 9.5], ["Hiperpotasemia leve (T picuda)", 6.1, 9.5], ["Hiperpotasemia grave (QRS ancho)", 7.6, 9.5], ["Hipocalcemia (QT largo)", 4.2, 6.7], ["Hipercalcemia (QT corto)", 4.2, 13.2]];
    main.innerHTML = `<h1>Ponte a prueba</h1><p class="lema">10 preguntas al azar. Mira, decide y aprende del porqué.</p>
      <div class="ctrl"><span class="chips" id="modo"><button class="chip act" data-m="todo">Todo</button><button class="chip" data-m="ritmo">Ritmos y arritmias</button><button class="chip" data-m="morfo">12 derivaciones</button><button class="chip" data-m="elec">Electrolitos</button><button class="chip" data-m="caso">🩺 Casos clínicos</button></span><b id="marcador"></b></div>
      <div class="caja" style="padding:8px"><canvas class="ecg" id="q-c"></canvas></div>
      <p id="q-caso" style="font-size:17px;margin:4px 0"></p><p id="q-preg" style="font-weight:700;font-size:18px"></p><div class="opciones" id="q-op"></div><div class="caja info" id="q-fb" style="display:none"></div>
      <div class="ctrl"><button class="btn" id="q-sig" style="display:none">Siguiente →</button><button class="btn sec" id="q-sonar" title="Escuchar el ritmo">🔊 Escuchar</button></div>`;
    let modo = "todo", n = 0, ok = 0, ecgAct = null;
    const azar = a => a[Math.floor(Math.random() * a.length)], mezcla = a => a.sort(() => Math.random() - 0.5);
    const nomI = x => `Infarto ${E.REGIONES[x.region].nombre.toLowerCase()} · ${E.FASES[x.fase].split(":")[0].toLowerCase()}`;
    function hacer() {
      const m = modo === "todo" ? azar(["ritmo", "ritmo", "morfo", "elec", "caso"]) : modo;
      const semilla = 1 + Math.floor(Math.random() * 1e6);
      if (m === "caso") {
        const k = azar(CASOS), ecg = E.construir(Object.assign({ semilla, fc: (E.PATRONES[k.e.tipo] || {}).fc }, k.e), 14);
        return { ecg, doce: true, caso: k.c, bien: k.r, ops: mezcla([k.r, ...k.f]), x: k.x };
      }
      if (m === "elec") {
        const k = azar(ELEC), ecg = E.construir({ tipo: "normal", fc: 70, k: k[1], ca: k[2], semilla }, 14);
        const otros = mezcla(ELEC.filter(x => x !== k)).slice(0, 3).map(x => x[0]);
        return { ecg, doce: false, der: "DII", bien: k[0], ops: mezcla([k[0], ...otros]), x: U.textoElectro(k[1], k[2]).replace(/<[^>]+>/g, "") || "Potasio y calcio normales." };
      }
      if (m === "morfo") {
        const tipo = azar(MORFO), a = { tipo, region: azar(["anteroseptal", "inferior", "lateral", "extenso"]), fase: azar(["les_epi", "necrosis", "isq_epi"]) };
        const nom = x => x.tipo === "iam" ? nomI(x) : E.PATRONES[x.tipo].nombre, ops = [nom(a)];
        while (ops.length < 4) { const t = azar(MORFO), o = { tipo: t, region: azar(["anteroseptal", "inferior", "lateral", "extenso"]), fase: azar(["les_epi", "necrosis", "isq_epi"]) }; if (!ops.includes(nom(o))) ops.push(nom(o)); }
        const ecg = E.construir(Object.assign({ semilla, fc: E.PATRONES[tipo].fc + Math.round((Math.random() - 0.5) * 8) }, a), 14);
        return { ecg, doce: true, bien: ops[0], ops: mezcla(ops), x: ((U.TEXTOS[tipo] || {}).ecg || []).join(" · ").replace(/<[^>]+>/g, "") };
      }
      const tipo = azar(RITMO), ops = [E.PATRONES[tipo].nombre];
      while (ops.length < 4) { const o = E.PATRONES[azar(RITMO)].nombre; if (!ops.includes(o)) ops.push(o); }
      const ecg = E.construir({ tipo, semilla, fc: E.PATRONES[tipo].fc ? E.PATRONES[tipo].fc + Math.round((Math.random() - 0.5) * 8) : 0 }, 14);
      return { ecg, doce: false, der: tipo === "flutter" ? "DII" : "DII", bien: ops[0], ops: mezcla(ops), x: ((U.TEXTOS[tipo] || {}).ecg || []).join(" · ").replace(/<[^>]+>/g, "") };
    }
    function pregunta() {
      if (n >= 10) { $("#q-caso").textContent = ""; $("#q-preg").textContent = `Terminaste: ${ok} de 10 ${ok >= 8 ? "🏆" : ok >= 6 ? "👍" : "📚"}`; $("#q-op").innerHTML = `<button id="otra">🔁 Otra ronda</button>`; $("#otra").onclick = () => { n = ok = 0; pregunta(); }; $("#q-sig").style.display = "none"; $("#q-fb").style.display = "none"; return; }
      const q = hacer(); ecgAct = q.ecg;
      q.doce ? U.doce($("#q-c"), q.ecg, { ritmo: q.ecg.cfg.tipo === "fa" ? "V1" : "DII" }) : U.tira($("#q-c"), q.ecg, q.der || "DII", 8, 32);
      $("#q-caso").innerHTML = q.caso ? `🩺 <b>Caso:</b> ${q.caso}` : "";
      $("#q-preg").textContent = `${n + 1}/10 · ¿Qué muestra este ${q.doce ? "ECG de 12 derivaciones" : "trazado en " + (q.der || "DII")}?`;
      $("#q-op").innerHTML = q.ops.map((o, i) => `<button data-i="${i}">${o}</button>`).join("");
      $("#q-fb").style.display = "none"; $("#q-sig").style.display = "none";
      $$("#q-op button").forEach(b => b.onclick = () => {
        if ($("#q-sig").style.display !== "none") return;
        const bien = q.ops[+b.dataset.i] === q.bien; if (bien) ok++; n++;
        b.classList.add(bien ? "bien" : "mal"); $$("#q-op button").forEach((x, i) => { if (q.ops[i] === q.bien) x.classList.add("bien"); });
        $("#q-fb").style.display = ""; $("#q-fb").innerHTML = `<b>${bien ? "✅ ¡Exacto!" : "Casi: era " + q.bien}.</b><p style="margin:6px 0 0">${q.x}</p>`;
        $("#q-sig").style.display = ""; $("#marcador").textContent = `✓ ${ok} / ${n}`;
      });
    }
    $("#q-sonar").onclick = () => {   // el ritmo como pitidos de monitor (4 s)
      if (!ecgAct) return; U.audio(); const t0 = performance.now();
      ecgAct.latidos.filter(l => l.tq != null && l.tq > 0.5 && l.tq < 4.5).forEach(l => setTimeout(() => U.pitido(l.ectopico ? 660 : 880), (l.tq - 0.5) * 1000));
      if (["fv", "asistolia"].includes(ecgAct.cfg.tipo)) U.pitido(ecgAct.cfg.tipo === "asistolia" ? 520 : 1250, 1.2);
      void t0;
    };
    $$("#modo .chip").forEach(b => b.onclick = () => { modo = b.dataset.m; $$("#modo .chip").forEach(x => x.classList.toggle("act", x === b)); n = ok = 0; $("#marcador").textContent = ""; pregunta(); });
    $("#q-sig").onclick = pregunta;
    pregunta();
  };
})();
