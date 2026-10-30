/* Auscultación cardiaca — núcleo: tema, router, reproductor (audio + reloj), fonocardiograma y corazón animado.
   Las pestañas viven en secciones.js (focos, ciclo) y secciones2.js (soplos, explicación, prueba). */
(function () {
  "use strict";
  const A = window.AUSC, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { gen: 0 };
  U.$ = $; U.$$ = $$;

  /* ---------- tema (el mismo que el atlas) ---------- */
  const CLAVE = "atlas-semio-v1";
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  const guardar = o => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} };
  { const P = leer(); if (P.tema) document.documentElement.dataset.theme = P.tema; }
  $("#tema-btn").onclick = () => {
    const P = leer(), osc = matchMedia("(prefers-color-scheme: dark)").matches;
    P.tema = (P.tema || (osc ? "dark" : "light")) === "dark" ? "light" : "dark"; guardar(P);
    document.documentElement.dataset.theme = P.tema; U.repintar && U.repintar();
  };
  const css = U.css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  U.aviso = `<p class="aviso">🔊 <b>El sonido es sintetizado y orientativo.</b> Se genera en tu dispositivo con Web Audio para mostrar el momento, la forma y el tono de cada ruido y soplo; no reemplaza una grabación real ni el oído entrenado. Con audífonos se notan mejor los graves (R3, R4, ruflar).</p>`;

  /* ---------- audio: contexto y síntesis de los eventos del motor ---------- */
  let ctx = null, maestro = null, ruidoBuf = null;
  U.volumen = 0.8;
  U.audioOK = () => !!(window.AudioContext || window.webkitAudioContext);
  U.activarAudio = function () {
    if (!U.audioOK()) return false;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor(); maestro = ctx.createGain(); maestro.gain.value = U.volumen;
      maestro.connect(comp); comp.connect(ctx.destination);
      ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  };
  U.setVolumen = v => { U.volumen = v; if (maestro) maestro.gain.value = v; };
  const reloj = () => performance.now() / 1000; // un solo reloj para lo visual; el audio se programa con el desfase respecto a ctx.currentTime
  // un golpe (R1, R2, R3…): seno con su armónico, para que se oiga también en parlantes pequeños
  function golpe(e, t) {
    for (const [mul, g] of [[1, 1], [2.4, 0.45]]) {
      const o = ctx.createOscillator(), gn = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(e.f * mul * 1.15, t); o.frequency.exponentialRampToValueAtTime(e.f * mul, t + 0.03);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(e.amp * g * 0.9, t + 0.006); gn.gain.exponentialRampToValueAtTime(0.0001, t + e.dec * 5);
      o.connect(gn); gn.connect(maestro); o.start(t); o.stop(t + e.dec * 5 + 0.05);
    }
  }
  // un soplo/frote: ruido filtrado con la envolvente de su forma
  function ruido(e, t) {
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), gn = ctx.createGain();
    src.buffer = ruidoBuf; src.loop = true;
    f.type = "bandpass"; f.frequency.value = e.f; f.Q.value = e.q;
    const N = Math.min(400, Math.max(8, Math.ceil(e.dur * 600))), cur = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), tm = e.t + u * e.dur;
      let v = A.env(e.forma === "frote" ? "rombo" : e.forma, u);
      if (e.trem) v *= 0.7 + 0.3 * Math.sin(2 * Math.PI * e.trem * tm);
      if (e.forma === "frote") v *= 0.5 + 0.5 * Math.abs(Math.sin(u * 40 + Math.sin(u * 13) * 3));
      cur[i] = v * e.amp * 3.2;
    }
    gn.gain.setValueCurveAtTime(cur, t, Math.max(0.02, e.dur));
    src.connect(f); f.connect(gn); gn.connect(maestro);
    src.start(t, Math.random()); src.stop(t + e.dur + 0.05);
  }
  function programar(lat, t0) { for (const e of lat.ev) (e.tipo === "golpe" ? golpe : ruido)(e, t0 + e.t); }

  /* ---------- reproductor: genera latidos, los programa en el audio (si está activo) y sirve de reloj ---------- */
  // getCfg() se llama en cada latido, así los cambios de control se oyen en el siguiente.
  U.Player = function (getCfg, opc) {
    const P = { beats: [], sonido: !(opc && opc.silencio), activo: false, gen: U.gen };
    let sig = 0, timer = null;
    P.ahora = reloj;
    function tick() {
      if (P.gen !== U.gen) { P.parar(); return; }
      const now = reloj();
      while (sig < now + 0.4) {
        const lat = A.eventos(getCfg());
        P.beats.push({ t0: sig, lat });
        if (P.sonido && ctx && ctx.state === "running") programar(lat, ctx.currentTime + Math.max(0, sig - now));
        sig += lat.T;
      }
      P.beats = P.beats.filter(b => b.t0 + b.lat.T > now - 4);
    }
    P.iniciar = function () { if (P.activo) return; P.activo = true; sig = reloj() + 0.08; P.beats = []; tick(); timer = setInterval(tick, 50); };
    P.parar = function () { P.activo = false; clearInterval(timer); timer = null; };
    // latido actual y tiempo dentro de él
    P.estado = function () {
      const now = reloj();
      for (let i = P.beats.length - 1; i >= 0; i--) { const b = P.beats[i]; if (b.t0 <= now) return { beat: b, tm: Math.min(now - b.t0, b.lat.T), now }; }
      return null;
    };
    return P;
  };
  U.detener = function () { U.gen++; if (U.alSalir) { U.alSalir(); U.alSalir = null; } };

  /* ---------- fonocardiograma (canvas con desplazamiento) ---------- */
  U.preparar = function (cv, alto) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || cv.parentNode.clientWidth || 600;
    cv.width = Math.round(w * dpr); cv.height = Math.round(alto * dpr); cv.style.height = alto + "px";
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, W: w, H: alto };
  };
  const ETQ = { M1: "R1", A2: "R2", P2: "P2", R3: "R3", R4: "R4", "Chasquido de apertura": "Chasq.", "Clic de eyección": "Clic" };
  U.dibujarFono = function (cv, P, opc) {
    opc = opc || {};
    const { c, W, H } = U.preparar(cv, opc.alto || 150), win = opc.ventana || 2.4, est = P.estado();
    c.fillStyle = css("--papel-ecg"); c.fillRect(0, 0, W, H);
    const now = est ? est.now : P.ahora(), t0 = now - win, X = t => (t - t0) / win * W;
    for (const b of P.beats) { // bandas de sístole y diástole
      const s = b.lat.ti.sist;
      c.fillStyle = "rgba(220,38,38,.10)"; c.fillRect(X(b.t0), 0, s / win * W, H);
      c.fillStyle = "rgba(59,130,246,.09)"; c.fillRect(X(b.t0 + s), 0, (b.lat.T - s) / win * W, H);
      c.fillStyle = css("--tx2"); c.font = "600 11px Fredoka, Nunito, sans-serif";
      if (s / win * W > 50) c.fillText("SÍSTOLE", X(b.t0) + 4, 13);
      if ((b.lat.T - s) / win * W > 60) c.fillText("DIÁSTOLE", X(b.t0 + s) + 4, 13);
      c.strokeStyle = css("--linea-ecg2"); c.lineWidth = 1; c.beginPath(); c.moveTo(X(b.t0), 0); c.lineTo(X(b.t0), H); c.stroke();
    }
    c.strokeStyle = css("--linea-ecg2"); c.beginPath(); c.moveTo(0, H / 2); c.lineTo(W, H / 2); c.stroke();
    c.strokeStyle = css("--traza"); c.lineWidth = 1.5; c.lineJoin = "round"; c.beginPath();
    let k = 0, ant = false; const esc = H * 0.4;
    for (let x = 0; x <= W; x += 1) {
      const t = t0 + x / W * win;
      while (k < P.beats.length - 1 && P.beats[k + 1].t0 <= t) k++;
      const b = P.beats[k]; let y = 0;
      if (b && t >= b.t0 && t <= now) y = A.fono(b.lat, t - b.t0); else if (t > now) break;
      const py = H / 2 - A.lim(y, -1.4, 1.4) * esc;
      ant ? c.lineTo(x, py) : c.moveTo(x, py); ant = true;
    }
    c.stroke();
    if (opc.etiquetas !== false) { // nombres de los golpes
      c.font = "600 12px Fredoka, Nunito, sans-serif"; c.textAlign = "center";
      for (const b of P.beats) for (const e of b.lat.ev) {
        if (e.tipo !== "golpe" || !ETQ[e.nom]) continue;
        const t = b.t0 + e.t; if (t > now || t < t0) continue;
        if (e.nom === "P2" && (b.lat.ev.find(q => q.nom === "P2").t - b.lat.ev.find(q => q.nom === "A2").t) < 0.02) continue;
        c.fillStyle = e.nom[0] === "R" || e.nom === "M1" || e.nom === "A2" || e.nom === "P2" ? css("--az") : css("--mo");
        c.fillText(ETQ[e.nom], X(t) + 6, H - 8 - (e.nom === "P2" ? 14 : 0));
      }
      c.textAlign = "left";
    }
    c.fillStyle = css("--ro"); c.fillRect(W - 2, 0, 2, H);
    return est;
  };

  /* ---------- corazón esquemático con válvulas ---------- */
  U.corazonSVG = function () {
    return `<svg viewBox="0 0 300 250" role="img" aria-label="Corazón esquemático: aurículas arriba, ventrículos abajo y las cuatro válvulas" class="corazon">
      <g stroke-linecap="round">
      <path d="M118 62V12M142 62V12" stroke="#2563EB" stroke-width="4" fill="none"/><path d="M158 62V12M182 62V12" stroke="#DC2626" stroke-width="4" fill="none"/>
      <text x="130" y="9" text-anchor="middle" font-size="9" fill="#2563EB" font-family="Fredoka,sans-serif">A. pulmonar</text>
      <text x="170" y="9" text-anchor="middle" font-size="9" fill="#DC2626" font-family="Fredoka,sans-serif">Aorta</text>
      <rect x="50" y="62" width="85" height="62" rx="26" fill="#93C5FD" opacity=".9" id="h-ad"/><rect x="165" y="62" width="85" height="62" rx="26" fill="#FCA5A5" opacity=".9" id="h-ai"/>
      <rect x="52" y="130" width="90" height="100" rx="34" fill="#60A5FA" id="h-vd"/><rect x="158" y="130" width="96" height="104" rx="38" fill="#EF4444" id="h-vi"/>
      </g>
      <g font-family="Fredoka,sans-serif" font-size="11" fill="#fff" text-anchor="middle" font-weight="600">
        <text x="92" y="98">AD</text><text x="207" y="98">AI</text><text x="97" y="188">VD</text><text x="206" y="190">VI</text></g>
      <g font-family="Fredoka,sans-serif" font-size="9.5" fill="currentColor" text-anchor="middle">
        <text x="92" y="146" fill="#fff">Tricúspide</text><text x="207" y="146" fill="#fff">Mitral</text></g>
      <g id="valvs" stroke-width="4" stroke-linecap="round" fill="none">
        <path id="v-tri"/><path id="v-mit"/><path id="v-pul"/><path id="v-aor"/></g>
    </svg>`;
  };
  // abre/cierra las válvulas según el instante tm del latido
  U.actualizarCorazon = function (svg, tm, ti) {
    const V = A.valvulas(tm, ti), $s = id => svg.querySelector(id);
    const av = (id, xl, xr, ab) => { // auriculoventricular: bisagras en la pared, puntas se juntan al cerrar
      const y = 128, xc = (xl + xr) / 2, tipL = xl + (xc - xl) * (1 - ab) + 4 * ab, tipR = xr - (xr - xc) * (1 - ab) - 4 * ab, ty = 128 + 6 + 16 * ab;
      $s(id).setAttribute("d", `M${xl} ${y}L${tipL} ${ty}M${xr} ${y}L${tipR} ${ty}`); $s(id).setAttribute("stroke", ab > 0.5 ? "#16A34A" : "#FACC15");
    };
    const sg = (id, xl, xr, ab) => {
      const y = 62, xc = (xl + xr) / 2, tipL = xc + (xl - xc) * ab + 1, tipR = xc + (xr - xc) * ab - 1, ty = 62 - 4 - 8 * ab;
      $s(id).setAttribute("d", `M${xl} ${y}L${tipL} ${ty}M${xr} ${y}L${tipR} ${ty}`); $s(id).setAttribute("stroke", ab > 0.5 ? "#16A34A" : "#FACC15");
    };
    av("#v-tri", 62, 122, V.tricuspide); av("#v-mit", 178, 238, V.mitral); sg("#v-pul", 118, 142, V.pulmonar); sg("#v-aor", 158, 182, V.aortica);
    // contracción: ventrículos en sístole, aurículas al final de la diástole
    const sis = tm < ti.sist ? Math.sin(Math.PI * Math.min(1, tm / ti.sist) * 0.9) : 0, aur = tm > ti.T - 0.1 ? (tm - (ti.T - 0.1)) / 0.1 : 0;
    const esc = (id, cx, cy, k) => { const e = $s(id); e.style.transformOrigin = cx + "px " + cy + "px"; e.style.transform = `scale(${1 - k})`; };
    esc("#h-vd", 97, 180, 0.07 * sis); esc("#h-vi", 206, 182, 0.09 * sis); esc("#h-ad", 92, 93, 0.08 * aur); esc("#h-ai", 207, 93, 0.08 * aur);
  };

  /* ---------- utilidades de interfaz ---------- */
  U.tarjeta = (t, h, cl) => `<div class="tarj ${cl || ""}"><b class="t">${t}</b>${h}</div>`;
  U.lit = '<span class="lit">literatura</span>';
  U.rotulo = fn => { U.repintar = fn; };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "focos").split("/");
    const f = SECC[id] || SECC.focos;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "focos")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    U.repintar = null; vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: Sotomayor, <i>Semiología General</i>, tema 8 (2020) y SOTITO 2018 — clases «Auscultación cardiaca», «Soplos cardiacos y frote» y «Valvulopatías». Lo marcado <span class="lit">literatura</span> no viene de la clase. Sonido sintetizado y orientativo; el trazado es una simulación didáctica.</p>`);
  }
  addEventListener("hashchange", ruta);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => U.alRedimensionar && U.alRedimensionar(), 200); });
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
