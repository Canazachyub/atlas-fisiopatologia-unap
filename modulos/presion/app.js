/* Presión arterial interactiva — núcleo: tema, router, sonido sintetizado y la pestaña «Toma la presión».
   Las demás pestañas (clasificación, determinantes, explicación, prueba) están en secciones.js y se registran en window.SECC.
   El modelo numérico vive en motor.js (window.PA). */
(function () {
  "use strict";
  const PA = window.PA, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = {};

  /* ---------- tema (el mismo que el atlas) ---------- */
  const CLAVE = "atlas-semio-v1";
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  const guardar = o => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} };
  { const P = leer(); if (P.tema) document.documentElement.dataset.theme = P.tema; }
  $("#tema-btn").onclick = () => {
    const P = leer(), osc = matchMedia("(prefers-color-scheme: dark)").matches;
    P.tema = (P.tema || (osc ? "dark" : "light")) === "dark" ? "light" : "dark"; guardar(P);
    document.documentElement.dataset.theme = P.tema; U.paleta(); U.repintar && U.repintar();
  };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  U.css = css; U.$ = $; U.$$ = $$;
  U.paleta = () => { U.P = { az: css("--az"), azc: css("--azc"), ro: css("--ro"), ve: css("--ve"), na: css("--na"), mo: css("--mo"), am: css("--am"), tx: css("--tx"), tx2: css("--tx2"), borde: css("--borde"), papel: css("--papel") }; };
  U.paleta();
  U.gen = 0;                                  // contador de generación: cada pestaña lo incrementa y sus bucles se detienen si cambió
  let anim = null;
  U.detener = () => { U.gen++; if (anim) cancelAnimationFrame(anim); anim = null; U.alRedimensionar = null; U.repintar = null; if (U.alSalir) { const f = U.alSalir; U.alSalir = null; f(); } };
  const rnd = Math.random;
  U.rnd = rnd;
  // categoría → chip de color
  U.chipCat = (c, texto) => c.hipotension ? `<span class="cat hipo">Hipotensión (PAS &lt; 90)</span>` : `<span class="cat c${c.cat}">${texto || c.etiqueta}</span>`;
  // prepara un canvas a su ancho real con devicePixelRatio; devuelve el contexto y el tamaño CSS
  U.lienzo = (cv, alto) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(200, cv.clientWidth || cv.parentNode.clientWidth || 600);
    cv.width = Math.round(w * dpr); cv.height = Math.round(alto * dpr); cv.style.height = alto + "px";
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, w, h: alto };
  };

  /* ---------- sonido de Korotkoff (sintetizado con Web Audio; nada de archivos) ---------- */
  // Golpe grave (sinusoide con armónicos) + ruido filtrado: la fase cambia amplitud, timbre y duración.
  // ORIENTATIVO: no es una grabación; en la vida real los ruidos son de baja frecuencia y se oyen con estetoscopio.
  let ac = null, bufRuido = null;
  U.audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} return ac; };
  U.korotkoff = (fase, f, vol) => {
    const c = U.audio(), s = PA.sonidoParams(fase, f); if (!c || !s) return;
    const t = c.currentTime + 0.005, master = c.createGain(); master.gain.value = vol == null ? 0.9 : vol; master.connect(c.destination);
    [[1, 0.55], [2, 0.3], [3, 0.2]].forEach(([k, a]) => {
      const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
      o.frequency.setValueAtTime(s.f0 * k * 1.5, t); o.frequency.exponentialRampToValueAtTime(s.f0 * k, t + 0.04);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(s.amp * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);
      o.connect(g).connect(master); o.start(t); o.stop(t + s.dur + 0.03);
    });
    if (!bufRuido) { bufRuido = c.createBuffer(1, Math.round(c.sampleRate * 0.5), c.sampleRate); const d = bufRuido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const n = c.createBufferSource(); n.buffer = bufRuido;
    const bp = c.createBiquadFilter(); bp.type = fase === "IV" ? "lowpass" : "bandpass"; bp.frequency.value = s.rF; bp.Q.value = s.rQ;
    const g2 = c.createGain(), ata = s.lento ? 0.07 : 0.004;                       // fase II: ataque lento = «soplo»
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(Math.max(0.001, s.amp * s.rAmp * 0.8), t + ata); g2.gain.exponentialRampToValueAtTime(0.0001, t + s.rDur);
    n.connect(bp).connect(g2).connect(master); n.start(t); n.stop(t + s.rDur + 0.05);
  };

  /* =====================================================================================
     PESTAÑA 1 · TOMA LA PRESIÓN
     ===================================================================================== */
  // Estado que sobrevive al cambio de pestaña (paciente y técnica); lo demás se reinicia al entrar.
  const ST = { esc: "azar", pac: null, cond: Object.assign({}, PA.CONDICION_OK), aciertos: 0, intentos: 0 };
  const ESCENAS = [["azar", "Paciente al azar"], ["simple", "Simple (sin trampas)"], ["pozo", "Con pozo auscultatorio"], ["fa", "Fibrilación auricular"], ["anciano", "Anciano rígido"], ["grueso", "Obeso (brazo grueso)"]];
  const COL_FASE = { I: "#F59E0B", II: "#EA580C", III: "#DC2626", IV: "#7C3AED" };
  const MAX_P = 300, ANG = p => -135 + 0.9 * p;                    // aguja: 0-300 mmHg en 270°

  function escalaManometro() {
    let s = "";
    for (let p = 0; p <= MAX_P; p += 10) {
      const a = ANG(p) * Math.PI / 180, mayor = p % 20 === 0, r1 = 128, r2 = mayor ? 114 : 121;
      s += `<line class="${mayor ? "tk" : "tkm"}" x1="${150 + r1 * Math.sin(a)}" y1="${150 - r1 * Math.cos(a)}" x2="${150 + r2 * Math.sin(a)}" y2="${150 - r2 * Math.cos(a)}"/>`;
      if (mayor) s += `<text x="${150 + 98 * Math.sin(a)}" y="${150 - 98 * Math.cos(a)}">${p}</text>`;
    }
    return s;
  }

  SECC.toma = function (main) {
    const g = U.gen;
    const pa = ST.pac || (ST.pac = PA.paciente(rnd, ST.esc));
    main.innerHTML = `<h1>🩺 Toma la presión</h1>
      <p class="lema">Prepara el brazo, infla el manguito y desínflalo despacio mientras escuchas la braquial. El <b>primer ruido</b> (fase I) marca la <b>sistólica</b>; cuando los ruidos <b>desaparecen</b> (fase V), la <b>diastólica</b>. Anota tus cifras y el simulador te corrige.</p>
      <div class="grid3">
        <div class="caja" style="margin:0"><h3 style="margin-top:0">👤 Paciente</h3>
          <div class="ctrl"><label>Caso <select id="esc">${ESCENAS.map(([k, t]) => `<option value="${k}"${k === ST.esc ? " selected" : ""}>${t}</option>`).join("")}</select></label>
          <button class="btn az" id="nuevo">🎲 Nuevo paciente</button></div>
          <p id="ctx" style="margin:6px 0 0"></p>
          <p class="nota" style="margin:4px 0 0">La presión del paciente está oculta. Aciertos: <b id="marc">0 / 0</b></p></div>
        <div class="caja" style="margin:0"><h3 style="margin-top:0">1 · Prepara la toma <span class="lit">orden de la clase</span></h3>
          <div class="ctrl prep" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))">
          <label>Reposo <select id="c-reposo"><option value="1">Reposó 5 minutos</option><option value="0">Acaba de llegar de la calle</option></select></label>
          <label>Manguito <select id="c-mang"><option value="12">12 × 23 cm (adulto estándar)</option><option value="18">18-20 cm (obesos, muslo)</option><option value="6">6 cm (preescolar)</option><option value="2.5">2,5 cm (lactante)</option></select></label>
          <label>Ajuste <select id="c-aj"><option value="bien">Bien ajustado, 2 traveses sobre el pliegue</option><option value="flojo">Demasiado flojo</option><option value="apretado">Demasiado apretado</option></select></label>
          <label>Colocación <select id="c-ropa"><option value="0">Sobre la piel, sin ropa</option><option value="1">Sobre la manga</option></select></label>
          <label>Nivel del brazo <select id="c-niv"><option value="corazon">A la altura del corazón (4.º espacio)</option><option value="abajo">Manómetro por debajo del corazón</option><option value="arriba">Manómetro por encima del corazón</option></select></label>
          <label>Brazo <select id="c-brazo"><option value="der">Derecho</option><option value="izq">Izquierdo</option></select></label></div></div>
      </div>
      <div class="grid2" style="margin-top:6px">
        <div>
          <div class="caja"><h3 style="margin-top:0">2 · Infla y desinfla</h3>
            <svg class="manometro" id="man" viewBox="0 0 300 300" role="img" aria-label="Manómetro aneroide de 0 a 300 mmHg">
              <circle class="cara" cx="150" cy="150" r="144"/>${escalaManometro()}
              <text x="150" y="196" style="font-size:13px;fill:var(--tx2)">mmHg</text><text x="150" y="214" style="font-size:10px;fill:var(--tx2)">ANEROIDE</text>
              <g id="aguja"><line class="aguja" x1="150" y1="150" x2="150" y2="42"/><line class="aguja" x1="150" y1="150" x2="150" y2="168" style="stroke-width:5"/></g><circle class="hub" cx="150" cy="150" r="9"/>
            </svg>
            <p style="text-align:center;margin:2px 0 8px"><span class="k" style="font-family:var(--f-tit);font-size:22px">Aguja: <b id="dig">0</b> mmHg</span></p>
            <div class="ctrl" style="justify-content:center">
              <button class="btn grande" id="bomba">🫳 Apretar la perilla (mantén)</button>
              <button class="btn sec" id="vaciar">↺ Desinflar del todo</button></div>
            <div class="ctrl"><label style="flex:1 1 260px">Válvula
              <input type="range" id="valv" class="largo" min="0" max="12" step="0.5" value="0" aria-label="Velocidad de desinflado">
              <output id="valv-v" style="min-width:120px;font-family:var(--f-tit)">cerrada</output></label></div>
            <p class="nota" style="margin:0 0 6px">La clase pide desinflar a <b>2-3 mmHg por segundo</b>. Con la válvula en 0 el manguito queda inflado.</p>
            <div class="chips"><button class="chip" id="t-pal" aria-pressed="false">🖐️ Palpar la radial</button><button class="chip" id="t-est" aria-pressed="false">🩺 Estetoscopio en la braquial</button><button class="chip act" id="t-snd" aria-pressed="true">🔊 Sonido</button></div>
            <p class="lamp"><i id="lamp"></i> Pulso radial bajo los dedos</p>
            <p class="aviso-snd" style="margin:4px 0 0">🔈 El sonido es <b>sintetizado y orientativo</b>: imita el carácter de cada fase (golpe nítido, soplo, agudo, apagado), no es una grabación real. Sin audio, la fase y la cadencia se ven en el letrero y en el gráfico.</p></div>
        </div>
        <div>
          <div class="caja" style="padding:8px 10px"><svg id="escena" viewBox="0 0 640 220" style="width:100%;height:auto;display:block" role="img" aria-label="Brazo con manguito, estetoscopio y pulso radial"></svg>
            <canvas class="cv" id="art"></canvas>
            <div class="letrero" id="letrero" style="margin-top:8px"><span class="k" id="l-k">—</span><span id="l-t">Manguito vacío: la arteria está abierta, el flujo es laminar y no se oye nada.</span></div>
            <div class="fases" id="fases">${["I", "II", "III", "IV", "V"].map(f => `<span data-f="${f}" title="Fase ${f}">${f}</span>`).join("")}</div>
            <canvas class="cv" id="traza"></canvas></div>
        </div>
      </div>
      <div class="caja"><h3 style="margin-top:0">3 · Anota lo que oíste</h3>
        <div class="ctrl">
          <button class="btn sec" id="cap-s">⏱ Oí el primer ruido (fase I)</button>
          <button class="btn sec" id="cap-d">⏱ Ya no oigo nada (fase V)</button></div>
        <div class="ctrl"><label>PAS palpatoria (opcional) <input class="entrada" id="i-pal" type="number" inputmode="numeric" min="0" max="300"></label>
          <label>Sistólica <input class="entrada" id="i-s" type="number" inputmode="numeric" min="0" max="300"></label>
          <label>Diastólica <input class="entrada" id="i-d" type="number" inputmode="numeric" min="0" max="300"></label>
          <button class="btn" id="comprobar">✅ Comprobar</button></div>
        <p class="nota">Los botones ⏱ copian el valor de la aguja <i>en el momento en que los pulsas</i>: si desinflas deprisa llegarás tarde, igual que en la vida real.</p>
        <div id="resultado"></div></div>`;

    /* ----- referencias y estado de la simulación ----- */
    const ctxE = $("#ctx"), marc = $("#marc");
    const sim = { p: 0, t: 0, prox: 0.6, tBeat: -9, pico: 0, bomba: false, valv: 0, pal: false, est: false, snd: true, maxP: 0, zonaDP: 0, zonaDT: 0,
      lampHasta: -1, traza: [], turb: 0, partic: [], ultimoSnd: -9, mostrarValores: false, fase: null, ult: null, capS: null, capD: null };
    let L = null;                                                     // lo que marca el aparato (según paciente + técnica)
    const recalc = () => { L = PA.lectura(ST.pac, ST.cond); };
    function pintaPaciente() {
      ctxE.innerHTML = "<b>" + ST.pac.contexto + "</b>";
      $("#c-mang").value = ST.cond.manguito; $("#c-reposo").value = ST.cond.reposo ? "1" : "0"; $("#c-aj").value = ST.cond.ajuste;
      $("#c-ropa").value = ST.cond.ropa ? "1" : "0"; $("#c-niv").value = ST.cond.nivel; $("#c-brazo").value = ST.cond.brazo;
      marc.textContent = ST.aciertos + " / " + ST.intentos;
    }
    function reiniciarMedida() {
      Object.assign(sim, { p: 0, maxP: 0, zonaDP: 0, zonaDT: 0, traza: [], t: 0, prox: 0.6, tBeat: -9, turb: 0, capS: null, capD: null, fase: null, mostrarValores: false });
      $("#resultado").innerHTML = ""; ["#i-s", "#i-d", "#i-pal"].forEach(s => $(s).value = "");
    }
    recalc(); pintaPaciente();
    const lee = () => {
      const o = ST.cond; o.reposo = $("#c-reposo").value === "1"; o.manguito = $("#c-mang").value; o.ajuste = $("#c-aj").value;
      o.ropa = $("#c-ropa").value === "1"; o.nivel = $("#c-niv").value; o.brazo = $("#c-brazo").value; recalc(); dibujaEscena();
    };
    ["#c-reposo", "#c-mang", "#c-aj", "#c-ropa", "#c-niv", "#c-brazo"].forEach(s => $(s).onchange = () => { lee(); reiniciarMedida(); });
    $("#esc").onchange = () => { ST.esc = $("#esc").value; $("#nuevo").click(); };
    $("#nuevo").onclick = () => { ST.pac = PA.paciente(rnd, ST.esc); ST.cond = Object.assign({}, PA.CONDICION_OK); recalc(); pintaPaciente(); reiniciarMedida(); dibujaEscena(); };

    /* ----- controles ----- */
    const bomba = $("#bomba");
    const ini = e => { e.preventDefault(); U.audio(); sim.bomba = true; if (sim.valv <= 0) sim.p = Math.min(MAX_P, sim.p + 5); try { bomba.setPointerCapture(e.pointerId); } catch (x) {} };
    const fin = () => { sim.bomba = false; };
    bomba.addEventListener("pointerdown", ini); bomba.addEventListener("pointerup", fin); bomba.addEventListener("pointercancel", fin); bomba.addEventListener("pointerleave", fin);
    bomba.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); sim.bomba = true; } });
    bomba.addEventListener("keyup", fin); bomba.addEventListener("blur", fin);
    $("#vaciar").onclick = () => { reiniciarMedida(); };
    const textoValv = () => { const v = sim.valv; $("#valv-v").innerHTML = v <= 0 ? "cerrada" : v + " mmHg/s" + (v >= 2 && v <= 3 ? " ✔ ideal" : v > 3 ? " (rápido)" : " (lento)"); };
    $("#valv").oninput = e => { sim.valv = +e.target.value; textoValv(); };
    const chip = (id, clave) => { const b = $(id); b.onclick = () => { sim[clave] = !sim[clave]; b.classList.toggle("act", sim[clave]); b.setAttribute("aria-pressed", sim[clave]); if (clave !== "pal") U.audio(); dibujaEscena(); }; };
    chip("#t-pal", "pal"); chip("#t-est", "est"); chip("#t-snd", "snd");
    $("#cap-s").onclick = () => { sim.capS = Math.round(shown); $("#i-s").value = sim.capS; };
    $("#cap-d").onclick = () => { sim.capD = Math.round(shown); $("#i-d").value = sim.capD; };

    /* ----- escena del brazo (SVG) ----- */
    const esc = $("#escena");
    function dibujaEscena() {
      const g2 = ST.pac.grosor === "grueso", top = g2 ? 52 : 66, bot = g2 ? 166 : 154, cy = (top + bot) / 2;
      const desv = ST.cond.nivel === "abajo" ? 26 : ST.cond.nivel === "arriba" ? -26 : 0;
      const inf = sim.p / MAX_P * 14, cx0 = 150, cx1 = 300;
      esc.innerHTML = `<line x1="14" y1="${cy}" x2="626" y2="${cy}" stroke="var(--tx2)" stroke-dasharray="3 5" opacity=".35"/>
        <text x="16" y="${cy - 6}" style="font-size:11px;fill:var(--tx2)">♥ nivel del corazón (4.º espacio intercostal)</text>
        <g transform="translate(0 ${desv})">
          <path d="M30 ${top} Q30 ${cy} 30 ${bot} L372 ${bot} L372 ${top} Z" fill="#E8B88F" stroke="#B9835C" stroke-width="2"/>
          <path d="M372 ${top + 6} L560 ${cy - 22} Q600 ${cy - 24} 604 ${cy} Q600 ${cy + 26} 560 ${cy + 24} L372 ${bot - 4} Z" fill="#E8B88F" stroke="#B9835C" stroke-width="2"/>
          <path d="M30 ${cy} L372 ${cy} L560 ${cy - 2}" fill="none" stroke="#B91C1C" stroke-width="2.5" opacity=".55"/>
          <path d="M${cx0} ${cy} L${cx1} ${cy}" fill="none" stroke="#B91C1C" stroke-width="${sim.p > (L ? L.sis : 999) ? 1 : 4}" opacity=".7"/>
          ${ST.cond.ropa ? `<rect x="${cx0 - 18}" y="${top - 2}" width="${cx1 - cx0 + 36}" height="${bot - top + 4}" rx="8" fill="#9CA3AF"/>` : ""}
          <rect x="${cx0 - (ST.cond.ajuste === "flojo" ? 6 : 0)}" y="${top - 5 - inf}" width="${cx1 - cx0 + (ST.cond.ajuste === "flojo" ? 12 : 0)}" height="${bot - top + 10 + 2 * inf}" rx="9" fill="#3B82F6" opacity=".86" stroke="#1E3A8A" stroke-width="2"/>
          ${[0, 1, 2, 3].map(i => `<line x1="${cx0 + 20 + i * 40}" y1="${top - 3 - inf}" x2="${cx0 + 20 + i * 40}" y2="${bot + 3 + inf}" stroke="#fff" opacity=".25"/>`).join("")}
          <text x="${(cx0 + cx1) / 2}" y="${cy + 4}" text-anchor="middle" style="font-size:13px;font-family:var(--f-tit);fill:#fff">MANGUITO</text>
          <line x1="${cx1}" y1="${top - 14}" x2="${cx1 + 66}" y2="${top - 14}" stroke="var(--ro)" stroke-width="1.5"/><text x="${cx1 + 4}" y="${top - 18}" style="font-size:10.5px;fill:var(--tx2)">≈ 2 traveses de dedo</text>
          <text x="372" y="${top - 4}" text-anchor="middle" style="font-size:11px;fill:var(--tx2)">pliegue del codo</text>
          <g id="est-g" transform="${sim.est ? "translate(0 0)" : "translate(150 -40)"}" opacity="${sim.est ? 1 : 0.45}">
            <path d="M356 ${cy} Q356 ${top - 30} 330 ${top - 36}" fill="none" stroke="#374151" stroke-width="3"/>
            <circle cx="356" cy="${cy}" r="12" fill="#9CA3AF" stroke="#374151" stroke-width="3"/><circle cx="356" cy="${cy}" r="5" fill="#E5E7EB"/>
            <circle id="sonda" cx="356" cy="${cy}" r="14" fill="none" stroke="var(--ro)" stroke-width="3" opacity="0"/>
            <path d="M330 ${top - 36} Q312 ${top - 44} 300 ${top - 30}" fill="none" stroke="#374151" stroke-width="3"/></g>
          <circle id="dedo" cx="530" cy="${cy - 1}" r="${sim.pal ? 11 : 6}" fill="${sim.pal ? "var(--am)" : "none"}" stroke="${sim.pal ? "#1b1b1b" : "var(--tx2)"}" stroke-width="2" stroke-dasharray="${sim.pal ? "" : "3 3"}"/>
          <text x="530" y="${cy + 30}" text-anchor="middle" style="font-size:11px;fill:var(--tx2)">arteria radial</text>
        </g>`;
    }
    dibujaEscena();

    /* ----- lienzos: arteria y trazado ----- */
    const cvA = $("#art"), cvT = $("#traza");
    let A = U.lienzo(cvA, 150), T = U.lienzo(cvT, 140);
    U.alRedimensionar = () => { A = U.lienzo(cvA, 150); T = U.lienzo(cvT, 140); };
    U.repintar = () => {};
    for (let i = 0; i < 90; i++) sim.partic.push({ x: Math.random(), y: Math.random() * 2 - 1, v: 0.75 + Math.random() * 0.5, o: Math.random() * 0.1 });

    const suave = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    function dibujaArteria(open, turb, lam, estado) {
      const { c, w, h } = A, P = U.P, cy = h / 2 + 4, H = 34, cx0 = w * 0.33, cx1 = w * 0.62, rampa = 26;
      c.clearRect(0, 0, w, h);
      const lo = Math.max(0.05, open);
      const hl = x => H * (1 - (1 - lo) * (suave((x - (cx0 - rampa)) / rampa) - suave((x - cx1) / rampa)));
      // manguito (arriba y abajo) comprimiendo la pared
      const hc = hl((cx0 + cx1) / 2), bloque = (y, alto) => { c.beginPath(); c.roundRect ? c.roundRect(cx0 - 4, y, cx1 - cx0 + 8, alto, 8) : c.rect(cx0 - 4, y, cx1 - cx0 + 8, alto); c.fill(); c.stroke(); };
      c.fillStyle = "rgba(59,130,246,.85)"; c.strokeStyle = "#1E3A8A"; c.lineWidth = 2;
      bloque(6, cy - hc - 11); bloque(cy + hc + 5, h - 6 - (cy + hc + 5));
      // luz del vaso
      c.beginPath(); for (let x = 0; x <= w; x += 4) c.lineTo(x, cy - hl(x)); for (let x = w; x >= 0; x -= 4) c.lineTo(x, cy + hl(x)); c.closePath();
      c.fillStyle = "rgba(185,28,28,.12)"; c.fill();
      c.strokeStyle = "#B9835C"; c.lineWidth = 4; c.beginPath(); for (let x = 0; x <= w; x += 4) x ? c.lineTo(x, cy - hl(x) - 2) : c.moveTo(x, cy - hl(x) - 2); c.stroke();
      c.beginPath(); for (let x = 0; x <= w; x += 4) x ? c.lineTo(x, cy + hl(x) + 2) : c.moveTo(x, cy + hl(x) + 2); c.stroke();
      // partículas de sangre
      c.fillStyle = P.ro;
      for (const q of sim.partic) {
        const x = q.x * w, yy = cy + q.y * hl(x) * 0.92;
        c.globalAlpha = x > cx1 && turb > 0.2 ? 0.95 : 0.8; c.beginPath(); c.arc(x, yy, 2.8, 0, 6.3); c.fill();
      }
      c.globalAlpha = 1;
      // remolinos aguas abajo del manguito cuando el flujo es turbulento
      if (turb > 0.25) {
        c.strokeStyle = "rgba(185,28,28,.55)"; c.lineWidth = 2;
        for (let k = 0; k < 5; k++) { const x0 = cx1 + 14 + k * 26, ph = sim.t * 18 + k * 1.9; c.beginPath(); c.arc(x0, cy + Math.sin(ph) * 10, 6 + 4 * Math.abs(Math.cos(ph * .7)), ph, ph + 4.2); c.stroke(); }
      }
      // estetoscopio y ondas de sonido
      const ex = cx1 + 56, ey = cy - H - 14;
      if (sim.est) {
        c.fillStyle = "#9CA3AF"; c.strokeStyle = "#374151"; c.lineWidth = 3; c.beginPath(); c.arc(ex, ey + 6, 10, 0, 6.3); c.fill(); c.stroke();
        const dt = sim.t - sim.ultimoSnd;
        if (dt < 0.35 && sim.ult) { c.strokeStyle = COL_FASE[sim.ult] || P.tx; c.lineWidth = 2.5; for (let k = 1; k <= 3; k++) { c.globalAlpha = Math.max(0, 1 - dt / 0.35 - k * .12); c.beginPath(); c.arc(ex, ey + 6, 12 + k * 7 + dt * 40, -2.3, -0.84); c.stroke(); } c.globalAlpha = 1; }
      }
      c.fillStyle = P.tx2; c.font = "600 11px Nunito, sans-serif"; c.textAlign = "center";
      c.fillText("MANGUITO", (cx0 + cx1) / 2, 17); c.textAlign = "left"; c.fillText("arteria braquial →", 8, 16);
      c.fillStyle = P.az; c.font = "700 12px Nunito, sans-serif"; c.fillText(estado, 8, h - 8);
    }
    function dibujaTraza(ahora) {
      const { c, w, h } = T, P = U.P, vent = 50, mx = 36, ymax = Math.max(260, sim.maxP + 20);
      c.clearRect(0, 0, w, h);
      const X = t => mx + (t - (ahora - vent)) / vent * (w - mx - 6), Y = p => h - 14 - p / ymax * (h - 24);
      c.strokeStyle = P.borde; c.fillStyle = P.tx2; c.font = "10px Nunito, sans-serif"; c.textAlign = "right"; c.lineWidth = 1;
      for (let p = 0; p <= ymax; p += 50) { c.beginPath(); c.moveTo(mx, Y(p)); c.lineTo(w - 6, Y(p)); c.stroke(); c.fillText(p, mx - 4, Y(p) + 3); }
      if (sim.mostrarValores && L) {
        c.setLineDash([5, 4]); c.lineWidth = 1.6;
        [[L.sis, "PAS", P.ro], [L.dia, "PAD", P.azc]].forEach(([v, n, col]) => { c.strokeStyle = col; c.fillStyle = col; c.beginPath(); c.moveTo(mx, Y(v)); c.lineTo(w - 6, Y(v)); c.stroke(); c.textAlign = "left"; c.fillText(n + " " + v, mx + 4, Y(v) - 3); });
        c.setLineDash([]);
      }
      c.strokeStyle = P.az; c.lineWidth = 2; c.beginPath(); let prim = true;
      for (const q of sim.traza) { if (q.t < ahora - vent || q.k !== "p") continue; prim ? c.moveTo(X(q.t), Y(q.p)) : c.lineTo(X(q.t), Y(q.p)); prim = false; }
      c.stroke();
      for (const q of sim.traza) {
        if (q.t < ahora - vent || q.k !== "b") continue;
        if (q.fase) { c.fillStyle = COL_FASE[q.fase]; c.beginPath(); c.arc(X(q.t), Y(q.p), 5, 0, 6.3); c.fill(); }
        else if (q.abre) { c.strokeStyle = P.tx2; c.lineWidth = 1.5; c.beginPath(); c.arc(X(q.t), Y(q.p), 4, 0, 6.3); c.stroke(); }
      }
      c.fillStyle = P.tx2; c.textAlign = "left"; c.font = "10.5px Nunito, sans-serif";
      c.fillText("● ruido por latido (color = fase)   ○ la arteria se abre pero no suena", mx + 2, 10);
    }

    /* ----- bucle principal ----- */
    let last = 0, shown = 0, acumDig = 0, acumTr = 0;
    function letrero(est, fase) {
      const k = $("#l-k"), t = $("#l-t");
      if (est === "cerrada") { k.textContent = "—"; t.textContent = sim.p <= 1 ? "Manguito vacío: la arteria está abierta, el flujo es laminar y no se oye nada." : "Presión del manguito mayor que la sistólica: la arteria queda comprimida, no pasa sangre y no hay ruido. Ahora desinfla despacio (2-3 mmHg/s)."; }
      else if (est === "abierta") { k.textContent = "V"; t.textContent = sim.p <= 1 ? "Manguito vacío: la arteria está abierta, el flujo es laminar y no se oye nada." : "Fase V · los ruidos desaparecieron: la arteria quedó abierta y el flujo vuelve a ser laminar (silencioso). Esa presión es la diastólica."; }
      else { k.textContent = fase; t.textContent = `Fase ${fase} · ${PA.FASES.find(x => x.id === fase).nombre}. La sangre pasa a chorro por la arteria comprimida y el flujo turbulento hace ruido.` + (fase === "I" ? " Ese valor es la sistólica." : ""); }
      $$("#fases span").forEach(s => s.classList.toggle("act", est !== "cerrada" && s.dataset.f === fase));
    }
    function latido() {
      const b = PA.siguienteLatido(ST.pac, L, rnd);
      sim.prox = sim.t + b.dt; sim.tBeat = sim.t; sim.pico = b.pico;
      const abre = b.pico > sim.p + 0.3, f = PA.faseKorotkoff(sim.p, L.sis, L.dia);
      let fase = null, pozo = false;
      if (abre && f.estado === "ruidos") { pozo = PA.enPozo(f.f, ST.pac.pozo); if (!pozo) fase = f.fase; }
      sim.pozoAhora = pozo;
      if (fase && sim.est) { sim.ultimoSnd = sim.t; sim.ult = fase; if (sim.snd) U.korotkoff(fase, f.f); const s = $("#sonda"); if (s) { s.setAttribute("opacity", 1); setTimeout(() => s && s.setAttribute("opacity", 0), 120); } }
      if (sim.p > 3) sim.traza.push({ t: sim.t, p: sim.p, k: "b", fase: sim.est ? fase : null, abre: abre && f.estado !== "cerrada" });
      if (sim.pal && b.pico + (ST.pac.pseudo ? 45 : 0) > sim.p) sim.lampHasta = sim.t + 0.14;
    }
    function paso(ts) {
      if (g !== U.gen) return;
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      sim.t += dt;
      const antes = sim.p;
      if (sim.bomba && sim.p < MAX_P) sim.p += 32 * dt;
      if (sim.valv > 0 && sim.p > 0) sim.p -= sim.valv * dt;
      sim.p = Math.max(0, Math.min(MAX_P, sim.p));
      sim.maxP = Math.max(sim.maxP, sim.p);
      acumTr += dt; if (acumTr >= 0.1) { acumTr = 0; sim.traza.push({ t: sim.t, p: sim.p, k: "p" }); while (sim.traza.length && sim.traza[0].t < sim.t - 60) sim.traza.shift(); }
      // velocidad media de desinflado dentro de la zona de ruidos
      if (sim.p < antes && sim.p < L.sis + 2 && sim.p > L.dia - 2) { sim.zonaDP += antes - sim.p; sim.zonaDT += dt; }
      const f = PA.faseKorotkoff(sim.p, L.sis, L.dia);
      if (sim.t >= sim.prox) latido();
      // forma de la onda de presión en la arteria
      const x = sim.t - sim.tBeat, w = x < 0.1 ? Math.sin(x / 0.1 * Math.PI / 2) : Math.exp(-(x - 0.1) / 0.22);
      const pArt = L.dia + (sim.pico - L.dia) * (sim.tBeat < 0 ? 0 : w);
      const open = f.estado === "abierta" ? 1 : Math.max(0, Math.min(1, (pArt - sim.p) / 5));
      const turbObj = sim.p > L.dia + 0.5 && open > 0.02 && sim.p < L.sis ? 1 : 0;
      sim.turb = Math.max(turbObj, sim.turb * Math.exp(-dt * 7));
      // aguja: la presión del manguito + la pequeña oscilación de cada pulso (exagerada para verla)
      const pamM = PA.pam(L.sis, L.dia), pp = L.sis - L.dia, k = Math.exp(-Math.pow((sim.p - pamM) / (0.9 * pp), 2));
      const kick = (sim.p > 12 ? (0.5 + 2.6 * k) * (f.estado === "cerrada" ? 0.25 : 1) : 0) * (x < 0.5 ? Math.exp(-x / 0.08) : 0);
      shown = sim.p + kick;
      $("#aguja").setAttribute("transform", `rotate(${ANG(shown)} 150 150)`);
      acumDig += dt; if (acumDig > 0.1) { $("#dig").textContent = Math.round(shown); acumDig = 0; }
      // partículas: con la arteria cerrada se amontonan antes del manguito; abierta, avanzan (más rápido y caóticas si hay chorro)
      const vx = (open < 0.02 ? 0 : (f.estado === "abierta" ? 70 + 90 * w : 120 + 330 * Math.sqrt(open))) * (A.w / 640);
      const cx0 = 0.33, cx1 = 0.62;
      for (const q of sim.partic) {
        if (open >= 0.02) q.x += vx * dt * q.v / A.w;
        else if (q.x < cx0 - 0.015) q.x = Math.min(q.x + 0.25 * dt, cx0 - 0.015 - q.o);
        else q.x += 0.12 * dt;                                      // lo que ya había pasado sigue su camino despacio
        if (q.x > cx1 && sim.turb > 0.2) { q.y += (Math.random() - 0.5) * 0.7 * sim.turb; q.y = Math.max(-1, Math.min(1, q.y)); }
        if (q.x > 1.01) { q.x = -0.02; q.y = Math.random() * 2 - 1; }
      }
      // letrero y lámpara
      const estado = f.estado === "cerrada" ? "Arteria cerrada: no pasa sangre" : f.estado === "abierta" ? "Arteria abierta: flujo laminar, silencio" : sim.pozoAhora ? "Pozo auscultatorio: la arteria se abre pero no se oye" : "Chorro turbulento: ruido audible con el estetoscopio";
      if (!sim.pozoAhora || f.estado !== "ruidos") letrero(f.estado, f.fase, f.f);
      else { $("#l-k").textContent = "—"; $("#l-t").textContent = "Silencio entre ruidos: ¿ya acabó? Todavía no. Es un pozo auscultatorio (frecuente en fibrilación auricular o extrasístoles): los ruidos reaparecen más abajo. Sigue desinflando despacio."; $$("#fases span").forEach(s => s.classList.remove("act")); }
      $("#lamp").classList.toggle("on", sim.t < sim.lampHasta);
      const dedo = $("#dedo"); if (dedo && sim.pal) dedo.setAttribute("fill", sim.t < sim.lampHasta ? "#EF4444" : "var(--am)");
      // la escena (manguito que se hincha) se redibuja solo si cambió la presión
      if (Math.abs(sim.p - (sim.pEsc || -9)) > 1.5) { sim.pEsc = sim.p; dibujaEscena(); }
      dibujaArteria(open, sim.turb, 0, estado);
      dibujaTraza(sim.t);
      anim = requestAnimationFrame(paso);
    }
    anim = requestAnimationFrame(paso);

    /* ----- comprobar ----- */
    $("#comprobar").onclick = () => {
      const s = parseFloat($("#i-s").value), d = parseFloat($("#i-d").value), pal = parseFloat($("#i-pal").value);
      const R = $("#resultado");
      if (!isFinite(s) || !isFinite(d)) { R.innerHTML = `<p class="nota">Escribe la sistólica y la diastólica (o pulsa los botones ⏱ mientras desinflas).</p>`; return; }
      const pac = ST.pac, tol = 4, oks = Math.abs(s - L.sis) <= tol, okd = Math.abs(d - L.dia) <= tol;
      ST.intentos++; if (oks && okd) ST.aciertos++; marc.textContent = ST.aciertos + " / " + ST.intentos; sim.mostrarValores = true;
      const real = ST.cond.brazo === "izq" ? `${pac.sis - pac.difBrazos}/${pac.dia - Math.round(pac.difBrazos / 2)}` : `${pac.sis}/${pac.dia}`;
      const vel = sim.zonaDT > 0.5 ? sim.zonaDP / sim.zonaDT : null, c = PA.clasificar(pac.sis, pac.dia, "sem");
      const n = [];
      {
        if (vel !== null && vel > 4) n.push(`Desinflaste a unos <b>${vel.toFixed(1)} mmHg/s</b> en la zona de ruidos. La clase pide <b>2-3 mmHg/s</b>: con prisa llegas tarde al primer ruido y al último, y puedes perder la fase I real.`);
        else if (vel !== null && vel >= 1.5) n.push(`Velocidad de desinflado correcta (≈ ${vel.toFixed(1)} mmHg/s).`);
        if (sim.maxP < L.sis + 8) n.push(`Solo inflaste hasta <b>${Math.round(sim.maxP)} mmHg</b>: la arteria no llegó a cerrarse del todo. Se infla <b>30 mmHg por encima de la sistólica palpatoria</b> (aquí ≈ ${L.sis + 30}).`);
        else if (sim.maxP > L.sis + 70) n.push(`Inflaste hasta ${Math.round(sim.maxP)} mmHg: sobra y molesta al paciente; basta con 30 mmHg sobre la sistólica palpatoria (≈ ${L.sis + 30}).`);
        if (isFinite(pal)) n.push(Math.abs(pal - L.sis) <= 10 ? `Tu palpatoria (${pal}) cayó cerca de la sistólica: el método palpatorio solo da la sistólica.` : `Tu palpatoria (${pal}) se aleja de ${L.sis}: se anota donde reaparece el pulso al desinflar despacio.`);
        else n.push(`No anotaste la sistólica palpatoria: primero se palpa, luego se infla 30 mmHg por encima y se ausculta.`);
        if (!sim.est) n.push(`No pusiste el estetoscopio sobre la braquial: sin él no hay método auscultatorio.`);
      }
      const tec = L.sesgo.lista.map(x => `<li>${x.txt} <span class="nota">(≈ ${x.mag > 0 ? "+" : ""}${x.mag} mmHg; magnitud orientativa)</span></li>`).join("");
      const dif = pac.difBrazos > 10 ? `Entre ambos brazos hay <b>${pac.difBrazos} mmHg</b> de diferencia: es mucho; sugiere coartación de la aorta o estenosis de la subclavia/axilar del lado de menor presión.` : `Diferencia entre brazos: ${pac.difBrazos} mmHg (hasta más de 10 puede ser normal; el derecho suele ser mayor). Por eso se toma en ambos brazos.`;
      R.innerHTML = `<div class="grid3"><div class="tarj ${oks ? "ve" : "ro"}"><b class="t">Sistólica ${oks ? "✔" : "✘"}</b>Tu cifra: <b>${s}</b> · el manómetro marcaba <b>${L.sis}</b> (${s - L.sis >= 0 ? "+" : ""}${s - L.sis})</div>
        <div class="tarj ${okd ? "ve" : "ro"}"><b class="t">Diastólica ${okd ? "✔" : "✘"}</b>Tu cifra: <b>${d}</b> · el manómetro marcaba <b>${L.dia}</b> (${d - L.dia >= 0 ? "+" : ""}${d - L.dia})</div>
        <div class="tarj mo"><b class="t">Presión real del paciente</b>${real} mmHg en ese brazo → ${U.chipCat(c)}<br><span class="nota">Se acepta ±${tol} mmHg respecto a lo que marca el aparato.</span></div></div>
        ${tec ? `<div class="tarj ro" style="margin-top:8px"><b class="t">Tu técnica falseó la lectura</b><ul style="margin:4px 0 0 18px">${tec}</ul>El aparato marcó ${L.sis}/${L.dia} en lugar de ${real}.</div>` : `<div class="tarj ve" style="margin-top:8px"><b class="t">Técnica sin errores de colocación</b>Reposo, manguito, ajuste, nivel y colocación fueron correctos para este paciente.</div>`}
        ${pac.pseudo ? `<div class="tarj na" style="margin-top:8px"><b class="t">Pseudohipertensión del anciano</b>Este paciente tiene las arterias endurecidas: el manguito necesita más presión que la real para colapsarlas y el aparato marcó de más. Pista: la radial seguía palpable aunque la braquial ya estaba ocluida (activa 🖐️ «Palpar la radial» e infla por encima de la sistólica).</div>` : ""}
        ${pac.pozo ? `<div class="tarj na" style="margin-top:8px"><b class="t">Había un pozo auscultatorio</b>Los ruidos se callaron entre ≈ ${Math.round(L.sis - pac.pozo.f0 * (L.sis - L.dia))} y ${Math.round(L.sis - pac.pozo.f1 * (L.sis - L.dia))} mmHg y luego reaparecieron. Si hubieras tomado ese silencio por el final, habrías anotado una diastólica falsamente alta.</div>` : ""}
        ${pac.ritmo === "fa" ? `<div class="tarj na" style="margin-top:8px"><b class="t">Fibrilación auricular</b>Los latidos tienen distinta fuerza: unos abren la arteria y otros no, así que los ruidos aparecen y se pierden. Desinfla con más cuidado y promedia (déficit de pulso).</div>` : ""}
        <div style="margin-top:8px">${n.map(x => `<p style="margin:3px 0">• ${x}</p>`).join("")}<p style="margin:3px 0">• ${dif}</p></div>
        <div class="ctrl"><button class="btn az" id="otro">🎲 Otro paciente</button></div>`;
      $("#otro").onclick = () => $("#nuevo").click();
    };
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "toma").split("/");
    const f = SECC[id] || SECC.toma;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "toma")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    U.paleta(); vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: Sotomayor, <i>Semiología General</i>, tema 5 (2020) «Pulso arterial y presión arterial» y «Presión arterial: valores, hipertensión e hipotensión», tema 8 «Hipertensión arterial», y Fisiopatología, clases 10 y 11. Lo marcado <span class="lit">literatura</span> no viene de la clase.
      Los sonidos de Korotkoff son <b>sintetizados y orientativos</b>; cuánto falsea cada error de técnica es una magnitud didáctica (la clase solo da el sentido). Simulación educativa, no sustituye la práctica con un paciente.</p>`);
  }
  addEventListener("hashchange", ruta);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => U.alRedimensionar && U.alRedimensionar(), 200); });
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
