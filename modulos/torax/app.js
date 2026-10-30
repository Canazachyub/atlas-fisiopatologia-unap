/* Síndromes pleuropulmonares — núcleo: tema, router, sonido sintetizado (Web Audio), fonoauscultograma,
   vibración vocal y animaciones del mecanismo de cada ruido.
   Las pestañas están en secciones.js y se registran en window.SECC. Todo con "use strict" y sin librerías. */
(function () {
  "use strict";
  const P = window.PULMON, D = window.PULMON_DIB;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { P, D, $, $$ };

  /* ---------- tema y almacenamiento (el mismo del atlas) ---------- */
  const CLAVE = "atlas-semio-v1";
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  const guardar = o => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} };
  U.leer = leer; U.guardar = guardar;
  { const Pr = leer(); if (Pr.tema) document.documentElement.dataset.theme = Pr.tema; }
  $("#tema-btn").onclick = () => {
    const Pr = leer(), osc = matchMedia("(prefers-color-scheme: dark)").matches;
    Pr.tema = (Pr.tema || (osc ? "dark" : "light")) === "dark" ? "light" : "dark"; guardar(Pr);
    document.documentElement.dataset.theme = Pr.tema;
  };
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  U.css = css;

  /* ---------- ciclo de vida: al cambiar de pestaña se detiene todo ---------- */
  U.gen = 0;
  U.detener = function () { U.gen++; SON.parar(); };

  /* =====================================================================
     SONIDO SINTETIZADO. Todo se genera con Web Audio (ruido filtrado, osciladores y clics);
     no hay archivos de audio. Es orientativo: no sustituye a un estetoscopio ni a un paciente real.
     ===================================================================== */
  const SON = U.son = (function () {
    let ctx = null, master = null, buf = null, cur = null, vol = 0.8;
    function ini() {
      if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      try {
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor(); master = ctx.createGain(); master.gain.value = vol;
        master.connect(comp); comp.connect(ctx.destination);
        buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);          // 2 s de ruido blanco reutilizable
        const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ctx = null; }
      return ctx;
    }
    /* Ruido blanco filtrado con compensación: amp 1 ≈ misma sonoridad sea cual sea el ancho de banda */
    function ruido(p, tipo, f, Q, ta, tb) {
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = Q;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(fl); fl.connect(g); g.connect(p.out);
      src.start(ta, Math.random() * 1.5); src.stop(tb); p.fuentes.push(src);
      const bw = tipo === "bandpass" ? f / Q : tipo === "lowpass" ? f : ctx.sampleRate / 2 - f;
      return { g, comp: Math.min(25, Math.sqrt((ctx.sampleRate / 2) / Math.max(bw, 30))) * 0.43 };
    }
    function env(n, pts, t0, k) {                 // pts: [[t, valor]]; k: factor de escala
      n.g.gain.setValueAtTime(pts[0][1] * (k || 1) * (n.comp || 1), t0 + pts[0][0]);
      for (let i = 1; i < pts.length; i++) n.g.gain.linearRampToValueAtTime(Math.max(0.0001, pts[i][1] * (k || 1) * (n.comp || 1)), t0 + pts[i][0]);
    }
    function osc(p, tipo, f, ta, tb) {
      const o = ctx.createOscillator(); o.type = tipo; o.frequency.value = f; o.start(ta); o.stop(tb); p.fuentes.push(o); return o;
    }
    function click(p, t, tipo, f, Q, dur, gain) {   // ráfaga corta de ruido con caída exponencial
      const src = ctx.createBufferSource(); src.buffer = buf;
      const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = f; fl.Q.value = Q;
      const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(fl); fl.connect(g); g.connect(p.out);
      src.start(t, Math.random() * 1.5, dur + 0.01);
    }

    function tocar(capas, nc, seed) {
      const c = ini(); if (!c) return null;
      parar();
      const part = D.compilarSonido(capas, nc, seed), t0 = c.currentTime + 0.08, tb = t0 + part.dur;
      const out = c.createGain(); out.gain.value = 1; out.connect(master);
      const p = { out, fuentes: [] };
      part.cont.forEach(l => {
        if (l.tipo === "ruido") {
          l.f.forEach(fs => { const n = ruido(p, fs[0], fs[1], fs[2], t0, tb); env(n, l.pts, t0, fs[3]); });
        } else if (l.tipo === "roncus") {         // vibración grave y áspera de la pared de un bronquio grueso
          const o = osc(p, "sawtooth", 95, t0, tb), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
          const am = c.createGain(); am.gain.value = 0.5;
          const lfo = osc(p, "sine", 27, t0, tb), lg = c.createGain(); lg.gain.value = 0.4; lfo.connect(lg); lg.connect(am.gain);
          const eg = c.createGain(); eg.gain.value = 0; o.connect(lp); lp.connect(am); am.connect(eg); eg.connect(p.out);
          env({ g: eg, comp: 1 }, l.pts, t0, 0.3);
          const n = ruido(p, "lowpass", 600, 0.7, t0, tb); env(n, l.pts, t0, 0.25);
        } else if (l.tipo === "sibil") {           // silbido agudo, más fuerte en la espiración
          [1, 1.5].forEach((mul, j) => {
            const o = osc(p, "sine", 900 * mul, t0, tb), vib = osc(p, "sine", 5.5, t0, tb), vg = c.createGain(); vg.gain.value = 14 * mul;
            vib.connect(vg); vg.connect(o.frequency);
            for (let i = 0; i < part.nc; i++) {
              const s = t0 + i * part.T;
              o.frequency.setValueAtTime(900 * mul, s); o.frequency.linearRampToValueAtTime(960 * mul, s + part.TI);
              o.frequency.linearRampToValueAtTime(780 * mul, s + part.TI + 0.05); o.frequency.linearRampToValueAtTime(1020 * mul, s + part.T - 0.1);
            }
            const eg = c.createGain(); eg.gain.value = 0; o.connect(eg); eg.connect(p.out); env({ g: eg, comp: 1 }, l.pts, t0, j ? 0.5 : 1);
          });
          const n = ruido(p, "bandpass", 1800, 6, t0, tb); env(n, l.pts, t0, 0.5);
        } else if (l.tipo === "estridor") {        // obstrucción alta: ronco, inspiratorio y fuerte
          const o = osc(p, "sawtooth", 380, t0, tb), bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 900; bp.Q.value = 2;
          const eg = c.createGain(); eg.gain.value = 0; o.connect(bp); bp.connect(eg); eg.connect(p.out); env({ g: eg, comp: 1 }, l.pts, t0, 0.45);
          const n = ruido(p, "bandpass", 1200, 2, t0, tb); env(n, l.pts, t0, 0.8);
        }
      });
      part.ev.forEach(e => {
        const t = t0 + e.t;
        if (e.k === "crepitantes") click(p, t, "bandpass", e.f, 0.9, e.dur, e.amp * 0.9);
        else if (e.k === "frote") click(p, t, "bandpass", e.f, 0.8, e.dur, e.amp * 1.7);
        else if (e.k === "subcrepitantes") {
          click(p, t, "bandpass", e.f, 2.5, e.dur, e.amp * 2.8);
          const o = c.createOscillator(), g = c.createGain(); o.type = "sine";
          o.frequency.setValueAtTime(e.f * 0.8, t); o.frequency.exponentialRampToValueAtTime(e.f * 1.7, t + e.dur);
          g.gain.setValueAtTime(0.12 * e.amp, t); g.gain.exponentialRampToValueAtTime(0.0008, t + e.dur);
          o.connect(g); g.connect(p.out); o.start(t); o.stop(t + e.dur + 0.02); p.fuentes.push(o);
        }
      });
      cur = { p, part, t0, fin: tb };
      return part;
    }
    function parar() {
      if (!cur || !ctx) { cur = null; return; }
      const p = cur.p, now = ctx.currentTime;
      try { p.out.gain.cancelScheduledValues(now); p.out.gain.setTargetAtTime(0, now, 0.015); } catch (e) {}
      p.fuentes.forEach(s => { try { s.stop(now + 0.1); } catch (e) {} });
      setTimeout(() => { try { p.out.disconnect(); } catch (e) {} }, 200);
      cur = null;
    }
    /* Golpe de percusión: cada sonido difiere en tono, duración e intensidad (ver PERC en motor.js) */
    function percutir(tipo) {
      const c = ini(); if (!c) return;
      const t = c.currentTime + 0.02, p = { out: master, fuentes: [] };
      click(p, t, "bandpass", 1500, 1, 0.012, 0.5);                      // el golpe del dedo
      const tono = (f, dur, g, f2) => {
        const o = c.createOscillator(), e = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(f, t);
        if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
        e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0008, t + dur); o.connect(e); e.connect(master); o.start(t); o.stop(t + dur + 0.05);
      };
      if (tipo === "claro") { tono(175, 0.30, 0.55); tono(350, 0.14, 0.14); }
      else if (tipo === "submate") { tono(150, 0.12, 0.5); click(p, t, "lowpass", 300, 0.7, 0.06, 1.4); }
      else if (tipo === "mate") { click(p, t, "lowpass", 220, 0.7, 0.05, 2.2); tono(90, 0.05, 0.4); }
      else if (tipo === "hiper") { tono(118, 0.70, 0.8); tono(236, 0.36, 0.26); }
      else if (tipo === "timp") { tono(330, 0.60, 0.5, 300); tono(660, 0.20, 0.15, 600); }
    }
    return {
      get vol() { return vol; }, set vol(v) { vol = v; if (master) master.gain.value = v; },
      iniciar: ini, tocar, parar, percutir,
      reloj() { return cur && ctx && ctx.currentTime < cur.fin ? Math.max(0, ctx.currentTime - cur.t0) : -1; },
      get part() { return cur && cur.part; }, disponible() { return !!(window.AudioContext || window.webkitAudioContext); }
    };
  })();

  /* ---------- canvas con DPR ---------- */
  function preparar(cv, alto) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || cv.parentNode.clientWidth || 300;
    cv.width = Math.round(w * dpr); cv.height = Math.round(alto * dpr); cv.style.height = alto + "px";
    const c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0); return { c, W: w, H: alto };
  }

  /* ---------- fonoauscultograma: dónde suena cada cosa dentro del ciclo respiratorio ---------- */
  U.fono = function (cv, part) {
    const g = U.gen; let s = preparar(cv, 78);
    const tot = part.dur - 0.2;
    function dibujar() {
      const { c, W, H } = s, tx = css("--tx"), az = css("--azc"), ro = css("--ro");
      c.clearRect(0, 0, W, H);
      for (let i = 0; i < part.nc; i++) {                         // bandas de inspiración / espiración
        const xa = i * part.T / tot * W, xi = part.TI / tot * W, xe = part.TE / tot * W;
        c.fillStyle = "rgba(59,130,246,.14)"; c.fillRect(xa, 0, xi, H);
        c.fillStyle = "rgba(245,158,11,.12)"; c.fillRect(xa + xi, 0, xe, H);
        c.fillStyle = css("--tx2"); c.font = "11px sans-serif"; c.fillText("I", xa + 4, 12); c.fillText("E", xa + xi + 4, 12);
      }
      const base = H - 6, alto = H - 22;                          // envolventes continuas
      c.fillStyle = "rgba(22,163,74,.45)"; c.strokeStyle = "#16A34A"; c.lineWidth = 1;
      part.cont.forEach(l => {
        c.beginPath(); c.moveTo(0, base);
        l.pts.forEach(pt => c.lineTo(pt[0] / tot * W, base - Math.min(1, pt[1] / 1.2) * alto)); c.lineTo(W, base); c.closePath(); c.fill(); c.stroke();
      });
      c.strokeStyle = ro; c.lineWidth = 1.4;                       // sucesos (crepitantes, burbujeo, frote)
      part.ev.forEach(e => { const x = e.t / tot * W, h = Math.max(4, e.amp * alto * 0.8); c.beginPath(); c.moveTo(x, base); c.lineTo(x, base - h); c.stroke(); });
      const t = SON.reloj();
      if (t >= 0) { c.strokeStyle = tx; c.lineWidth = 2; const x = t / tot * W; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    }
    dibujar();
    (function bucle() { if (g !== U.gen || !cv.isConnected) return; if (SON.reloj() >= 0 || s.pendiente) { dibujar(); s.pendiente = SON.reloj() >= 0; } requestAnimationFrame(bucle); })();
    s.pendiente = true;
    return { redibujar: () => { s = preparar(cv, 78); dibujar(); } };
  };

  /* ---------- vibración vocal: cosquilleo bajo la mano (amp 0 = abolida) ---------- */
  U.vibra = function (cv, amp) {
    const g = U.gen, s = preparar(cv, 56);
    if (amp > 0 && navigator.vibrate) { try { navigator.vibrate(amp >= 1 ? [30, 20, 30, 20, 30, 20, 30] : amp > 0.5 ? [25, 40, 25, 40, 25] : [20, 90, 20]); } catch (e) {} }
    (function bucle(ts) {
      if (g !== U.gen || !cv.isConnected) return;
      const { c, W, H } = s; c.clearRect(0, 0, W, H);
      c.strokeStyle = css("--azc"); c.lineWidth = 2.5; c.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const env = Math.sin(Math.PI * x / W) ** 0.6, y = H / 2 + Math.sin(x * 0.22 - ts * 0.03) * amp * 22 * env + Math.sin(x * 0.5 - ts * 0.05) * amp * 4;
        x ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
      c.fillStyle = css("--tx2"); c.font = "12px sans-serif"; c.fillText(amp === 0 ? "sin vibración bajo la mano" : "vibración bajo la palma", 6, 13);
      requestAnimationFrame(bucle);
    })(0);
  };

  /* =====================================================================
     ANIMACIONES DEL MECANISMO (canvas). Una por tipo de ruido; usan el mismo reloj que el audio.
     ===================================================================== */
  U.anim = function (cv, kind) {
    const g = U.gen, s = preparar(cv, 190), TI = D.TI, T = D.T, ui = TI / T;
    let ult = 0, off = 0, col = null, n = 0;
    function colores() { col = { tx: css("--tx"), tx2: css("--tx2"), az: css("--azc"), ro: css("--ro"), ve: css("--ve"), pulm: css("--pulm"), pb: css("--pulm-b"), exud: css("--exud"), liq: css("--liq"), aire: css("--aire"), am: css("--am"), pap: css("--papel") }; }
    colores();
    const tubo = (c, x0, x1, cy, h0, h1) => {
      c.beginPath(); c.moveTo(x0, cy - h0); c.lineTo(x1, cy - h1); c.lineTo(x1, cy + h1); c.lineTo(x0, cy + h0); c.closePath();
      c.fillStyle = col.aire; c.fill(); c.strokeStyle = col.tx2; c.lineWidth = 3; c.stroke();
    };
    const particulas = (c, x0, x1, cy, h, k, rapido) => {                 // aire que entra (→) o sale (←)
      c.fillStyle = col.az;
      for (let i = 0; i < 12; i++) {
        const f = (((i / 12 + off * (rapido || 1)) % 1) + 1) % 1, x = x0 + f * (x1 - x0), y = cy + Math.sin(i * 7.3) * h * 0.6;
        c.globalAlpha = Math.min(1, 0.25 + Math.abs(k) * 0.9); c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
      }
      c.globalAlpha = 1;
    };
    const rotulo = (c, W, txt) => { c.fillStyle = col.tx2; c.font = "13px sans-serif"; c.textAlign = "left"; c.fillText(txt, 8, 16); };
    const ondas = (c, x, y, a, t) => {                                        // ondas de sonido que se alejan
      c.strokeStyle = col.ro; c.lineWidth = 2;
      for (let j = 0; j < 3; j++) { const r = ((t * 36 + j * 16) % 48) + 4; c.globalAlpha = Math.max(0, (1 - r / 52)) * Math.min(1, Math.abs(a) + 0.15); c.beginPath(); c.arc(x, y, r, -0.9, 0.9); c.stroke(); }
      c.globalAlpha = 1;
    };
    const K = {
      vesicular(c, W, H, u, a, lvl, t) {
        const cy = H / 2; tubo(c, 16, W * 0.42, cy, 18, 10); particulas(c, 20, W * 0.6, cy, 8, a);
        const r = 17 * (0.85 + 0.35 * lvl);
        [[0, 0], [-1, -0.6], [1, -0.6], [-1, 0.75], [1, 0.75], [0, -1.35], [0, 1.4]].forEach(o => {
          c.beginPath(); c.arc(W * 0.7 + o[0] * 26, cy + o[1] * 26, r, 0, 7); c.fillStyle = col.pulm; c.fill(); c.strokeStyle = col.pb; c.lineWidth = 2; c.stroke();
        });
        rotulo(c, W, "Aire bronquiolo ↔ alvéolos: suave, «F». Se oye en toda la inspiración y al inicio de la espiración.");
      },
      tubo(c, W, H, u, a, lvl, t) {
        const cy = H / 2; c.fillStyle = col.exud; c.fillRect(W * 0.5, cy - 62, W * 0.46, 124); c.globalAlpha = 0.9;
        c.strokeStyle = col.aire; c.lineWidth = 3; [[-40, -18], [0, 0], [40, 22], [-18, 40]].forEach(o => { c.beginPath(); c.moveTo(W * 0.5, cy); c.lineTo(W * 0.72, cy + o[0]); c.lineTo(W * 0.9, cy + o[1]); c.stroke(); }); c.globalAlpha = 1;
        c.beginPath(); c.moveTo(16, cy - 6); c.lineTo(W * 0.22, cy - 6); c.lineTo(W * 0.34, cy - 22); c.lineTo(W * 0.5, cy - 22); c.lineTo(W * 0.5, cy + 22); c.lineTo(W * 0.34, cy + 22); c.lineTo(W * 0.22, cy + 6); c.lineTo(16, cy + 6); c.closePath();
        c.fillStyle = col.aire; c.fill(); c.strokeStyle = col.tx2; c.lineWidth = 3; c.stroke();
        particulas(c, 20, W * 0.5, cy, 6, a, 1.6); ondas(c, W * 0.74, cy, a, t);
        rotulo(c, W, "Glotis → bronquios → pulmón sólido: el ruido glótico llega intacto hasta la pared (soplo tubárico).");
      },
      caja(c, W, H, u, a, lvl, t) {
        const cy = H / 2; tubo(c, 16, W * 0.4, cy, 12, 9); c.beginPath(); c.arc(W * 0.66, cy, 56, 0, 7); c.fillStyle = col.aire; c.fill(); c.strokeStyle = col.exud; c.lineWidth = 8; c.stroke();
        particulas(c, 20, W * 0.6, cy, 6, a); ondas(c, W * 0.66, cy, a, t * 1.2);
        c.strokeStyle = col.ro; c.lineWidth = 1.5; c.globalAlpha = Math.abs(a); c.beginPath(); c.arc(W * 0.66, cy, 30 + Math.sin(t * 9) * 3, 0, 7); c.stroke(); c.globalAlpha = 1;
        rotulo(c, W, "Cavidad aérea comunicada con un bronquio: actúa como caja de resonancia (cavitario; anfórico si es más amplia).");
      },
      liquido(c, W, H, u, a, lvl, t) {
        const cy = H / 2; c.fillStyle = col.pulm; c.fillRect(16, cy - 50, W * 0.4, 100); c.strokeStyle = col.pb; c.lineWidth = 2; c.strokeRect(16, cy - 50, W * 0.4, 100);
        tubo(c, 16, W * 0.3, cy, 8, 6); c.fillStyle = col.liq; c.globalAlpha = 0.85; c.fillRect(W * 0.46, cy - 50, W * 0.5, 100); c.globalAlpha = 1;
        c.strokeStyle = col.ro; c.lineWidth = 2; c.globalAlpha = Math.min(1, Math.abs(a) + 0.3);
        for (let j = 0; j < 3; j++) { c.beginPath(); for (let x = W * 0.3; x < W * 0.95; x += 4) { const y = cy - 24 + j * 24 + Math.sin(x * 0.12 - t * 8) * 5; x === W * 0.3 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
        c.globalAlpha = 1; rotulo(c, W, "El ruido glótico atraviesa una capa de líquido: soplo pleurítico («E») y voz de cabra (egofonía).");
      },
      crepitantes(c, W, H, u, a, lvl, t) {
        const cy = H / 2 + 8; tubo(c, 16, W * 0.2, cy, 12, 8); c.strokeStyle = col.tx2; c.lineWidth = 3;
        const prog = u < ui ? u / ui : 1;                                     // 0..1 durante la inspiración
        for (let i = 0; i < 8; i++) {
          const x = W * 0.3 + i * (W * 0.64 / 8), abre = 0.5 + 0.45 * (i / 7), pop = u < ui ? prog - abre : -1, abierto = u < ui ? prog > abre : u < ui + 0.18;
          const ry = abierto ? 22 : 7, rx = 15;
          c.beginPath(); c.ellipse(x, cy - 4, rx, ry, 0, 0, 7); c.fillStyle = abierto ? col.pulm : col.exud; c.fill(); c.strokeStyle = col.pb; c.lineWidth = 2; c.stroke();
          if (pop >= 0 && pop < 0.08) { c.strokeStyle = col.am; c.lineWidth = 3; for (let q = 0; q < 6; q++) { const an = q * 1.047; c.beginPath(); c.moveTo(x + Math.cos(an) * 26, cy - 4 + Math.sin(an) * 30); c.lineTo(x + Math.cos(an) * 36, cy - 4 + Math.sin(an) * 40); c.stroke(); } }
        }
        rotulo(c, W, "Alvéolos pegados por exudado se despegan de golpe al final de la inspiración: «clic» fino, no cambia con la tos.");
      },
      burbujas(c, W, H, u, a, lvl, t) {
        const cy = H / 2; tubo(c, 16, W - 16, cy, 38, 38); c.fillStyle = "#D8B84A"; c.globalAlpha = 0.8; c.fillRect(18, cy + 12, W - 36, 24); c.globalAlpha = 1;
        const f = Math.abs(a) > 0.1 ? 1 : 0;
        for (let i = 0; i < 7; i++) {
          const ph = ((t * 0.7 * (0.6 + Math.abs(a)) + i / 7) % 1), x = 40 + (i / 7) * (W - 80), y = cy + 30 - ph * 56, r = 3 + ph * 5;
          c.beginPath(); c.arc(x, y, r, 0, 7); c.strokeStyle = col.tx; c.lineWidth = 1.5; c.globalAlpha = f ? 0.9 : 0.25; c.stroke();
          if (ph > 0.92) { c.strokeStyle = col.ro; c.beginPath(); c.arc(x, cy - 26, 9, 0, 7); c.stroke(); }
        }
        c.globalAlpha = 1; rotulo(c, W, "El aire burbujea la secreción de los bronquiolos: «agua gaseosa». Cambia con la tos porque la secreción se mueve.");
      },
      roncus(c, W, H, u, a, lvl, t) {
        const cy = H / 2, amp = 3 + Math.abs(a) * 6, h = 30;
        c.beginPath(); for (let x = 16; x <= W - 16; x += 4) { const y = cy - h + Math.sin(x * 0.045 - t * 9) * amp; x === 16 ? c.moveTo(x, y) : c.lineTo(x, y); }
        for (let x = W - 16; x >= 16; x -= 4) { const y = cy + h - Math.sin(x * 0.045 - t * 9 + 1) * amp; c.lineTo(x, y); }
        c.closePath(); c.fillStyle = col.aire; c.fill(); c.strokeStyle = col.tx2; c.lineWidth = 3; c.stroke();
        c.fillStyle = "#D8B84A"; [[0.25, -1], [0.55, 1], [0.8, -1]].forEach(m => { c.beginPath(); c.ellipse(W * m[0], cy + m[1] * (h - 5), 20, 7, 0, 0, 7); c.fill(); });
        particulas(c, 20, W - 20, cy, 10, a, 0.9); rotulo(c, W, "Bronquio grueso estrechado por secreción adherida: sus paredes vibran, ronquido grave. La tos lo mueve.");
      },
      sibilancia(c, W, H, u, a, lvl, t) {
        const cy = H / 2, ex = a < 0 ? 1.4 : 0.8, amp = 1.2 * ex;
        c.beginPath(); for (let x = 16; x <= W - 16; x += 3) { const y = cy - 9 + Math.sin(x * 0.4 - t * 40) * amp; x === 16 ? c.moveTo(x, y) : c.lineTo(x, y); }
        for (let x = W - 16; x >= 16; x -= 3) c.lineTo(x, cy + 9 - Math.sin(x * 0.4 - t * 40) * amp);
        c.closePath(); c.fillStyle = col.aire; c.fill(); c.strokeStyle = col.tx2; c.lineWidth = 3; c.stroke();
        c.strokeStyle = col.az; c.lineWidth = 1.5; for (let j = 0; j < 4; j++) { const f = ((off * 2.4 * (j % 2 ? 1 : 1.3) + j / 4) % 1 + 1) % 1; c.beginPath(); c.moveTo(20 + f * (W - 70), cy - 5 + j * 3.3); c.lineTo(50 + f * (W - 70), cy - 5 + j * 3.3); c.stroke(); }
        c.strokeStyle = col.ro; c.lineWidth = 1.5; c.globalAlpha = Math.min(1, Math.abs(a) + 0.2); for (let j = 0; j < 5; j++) { c.beginPath(); c.arc(W * 0.5, cy, 20 + j * 12 + (t * 30 % 12), -0.5, 0.5); c.stroke(); } c.globalAlpha = 1;
        rotulo(c, W, "Luz muy estrecha de un bronquiolo: el aire pasa rápido y silba (agudo, más en la espiración). La tos no lo cambia.");
      },
      frote(c, W, H, u, a, lvl, t) {
        const cy = H / 2, desp = Math.sin(u * Math.PI * 2) * 18, v = Math.abs(Math.cos(u * Math.PI * 2));
        const diente = (y0, dir, dx) => { c.beginPath(); for (let x = 16; x <= W - 16; x += 8) { const yy = y0 + (((x + dx) / 8 | 0) % 2 ? dir * 5 : 0); x === 16 ? c.moveTo(x, yy) : c.lineTo(x, yy); } };
        c.fillStyle = col.pb; c.globalAlpha = 0.5; c.fillRect(16, cy - 62, W - 32, 50); c.globalAlpha = 1; diente(cy - 12, 1, desp); c.strokeStyle = col.exud; c.lineWidth = 4; c.stroke();
        c.fillStyle = col.pulm; c.fillRect(16, cy + 12, W - 32, 50); diente(cy + 12, -1, -desp); c.strokeStyle = col.exud; c.lineWidth = 4; c.stroke();
        c.strokeStyle = col.am; c.lineWidth = 2.5; c.globalAlpha = v; for (let i = 0; i < 9; i++) { const x = 40 + i * ((W - 80) / 8); c.beginPath(); c.moveTo(x, cy - 4); c.lineTo(x + 5, cy + 4); c.stroke(); } c.globalAlpha = 1;
        c.fillStyle = col.tx2; c.font = "12px sans-serif"; c.fillText("pleura parietal (pared)", 22, cy - 66 + 12); c.fillText("pleura visceral (pulmón)", 22, cy + 58);
        rotulo(c, W, "Hojas pleurales inflamadas y ásperas rozan al respirar: cuero nuevo o madera seca. No cambia con la tos.");
      }
    };
    (function bucle(ts) {
      if (g !== U.gen || !cv.isConnected) return;
      const dt = Math.min(0.05, (ts - ult) / 1000 || 0); ult = ts; if ((n++ % 30) === 0) colores();
      const rel = SON.reloj(), t = rel >= 0 ? rel : ts / 1000, u = ((t % T) / T), a = u < ui ? Math.sin(Math.PI * u / ui) : -0.7 * Math.sin(Math.PI * (u - ui) / (1 - ui));
      off += a * dt * 0.5;
      const lvl = u < ui ? Math.sin(Math.PI / 2 * u / ui) : Math.cos(Math.PI / 2 * (u - ui) / (1 - ui));
      const { c, W, H } = s; c.clearRect(0, 0, W, H); c.textBaseline = "alphabetic";
      (K[kind] || K.vesicular)(c, W, H, u, a, lvl, t);
      c.fillStyle = col.tx; c.font = "bold 12px sans-serif"; c.textAlign = "right"; c.fillText(u < ui ? "INSPIRACIÓN →" : "← ESPIRACIÓN", W - 8, H - 8); c.textAlign = "left";
      requestAnimationFrame(bucle);
    })(0);
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "paciente").split("/");
    const f = SECC[id] || SECC.paciente;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "paciente")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: Sotomayor, <i>Semiología General</i>, tema 7 (2020), y lo dicho en clase (wiki 07b-07f; láminas 4, 15, 16 y 17).
      Lo marcado <span class="lit">literatura</span> viene de la fisiología general, no de la clase. <b>Los sonidos son sintetizados por el navegador y orientativos:</b> sirven para reconocer el patrón, no sustituyen la auscultación de un paciente real.</p>`);
  }
  addEventListener("hashchange", ruta);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => U.alRedimensionar && U.alRedimensionar(), 200); });
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
