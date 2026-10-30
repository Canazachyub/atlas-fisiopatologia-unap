/* Escena realista del corazón en corte (pestaña «Soplos y valvulopatías»).
   La ilustración es de ChatGPT (la misma del atlas de Fisiopatología); los ventrículos están recortados y se contraen
   con el latido del reproductor. Las válvulas se abren y cierran con AUSC.valvulas() y el chorro turbulento de la
   lesión elegida sale con la MISMA envolvente que el soplo que se oye y se dibuja en el fonocardiograma.
   Rótulos: rot_valvulas.svg (draw.io). */
(function () {
  "use strict";
  const W = 1672, H = 941, V0 = [430, 430, 845, 480], XC = 880;
  const VAL = { mitral: [1010, 418, "M"], aortica: [822, 368, "Ao"], tricuspide: [640, 468, "T"], pulmonar: [905, 228, "P"] };
  // chorros: [desde, hasta] en el sentido normal de la sangre a través de cada válvula o defecto
  const PASO = {
    mitral: [[1040, 300], [1010, 640]], aortica: [[980, 560], [770, 170]], tricuspide: [[590, 320], [690, 640]], pulmonar: [[760, 560], [1040, 140]],
    civ: [[1000, 620], [740, 620]], cia: [[930, 330], [700, 360]], ductus: [[930, 110], [1040, 150]], coar: [[860, 80], [960, 130]] };
  // lesión → chorros: [paso, sentido (+1 normal, -1 reflujo)]
  const LES = {
    em: [["mitral", 1]], im: [["mitral", -1]], ea: [["aortica", 1]], ia: [["aortica", -1]], et: [["tricuspide", 1]], it: [["tricuspide", -1]],
    ep: [["pulmonar", 1]], ip: [["pulmonar", -1]], civ: [["civ", 1]], cia: [["cia", 1]], fallot: [["pulmonar", 1], ["civ", -1]],
    ductus: [["ductus", 1]], coar: [["coar", 1]], frote: [] };
  const VALVDE = { em: "mitral", im: "mitral", ea: "aortica", ia: "aortica", et: "tricuspide", it: "tricuspide", ep: "pulmonar", ip: "pulmonar", fallot: "pulmonar" };
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["cor_fondo", "cor_ventr"].map(n => { const i = new Image(); i.src = n + ".webp"; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;

  window.UTIL.corSoplo = function (caja, A) {
    const cv = caja.querySelector("canvas"), ctx = cv.getContext("2d"), I = carga();
    let k = 1, s = 1, sy = 1, tPrev = 0;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    const sxDe = y => 1 + (s - 1) * Math.min(1, Math.max(0, (y - V0[1]) / V0[3]) * 1.6);
    const deforma = ([x, y]) => y <= V0[1] ? [x, y] : [XC + (x - XC) * sxDe(y), V0[1] + (y - V0[1]) * sy];
    const part = [];   // partículas del chorro

    /* est: P.estado() del reproductor; vid: lesión elegida */
    function pintar(est, vid, nombre) {
      const now = performance.now() / 1000, dt = Math.min(0.1, now - (tPrev || now)); tPrev = now;
      let tm = 0, ti = { T: 0.78, sist: 0.3 }, env = 0, ab = { mitral: 1, tricuspide: 1, aortica: 0, pulmonar: 0 }, frote = 0;
      if (est) {
        tm = est.tm; ti = est.beat.lat.ti; ab = A.valvulas(tm, ti);
        for (const e of est.beat.lat.ev) if (e.tipo === "ruido" && tm >= e.t && tm <= e.t + e.dur) {
          const v = A.env(e.forma === "frote" ? "rombo" : e.forma, (tm - e.t) / e.dur) * Math.min(1, e.amp * 1.4 + .25);
          if (e.nom === "Soplo") env = Math.max(env, v); else frote = Math.max(frote, v);
        }
      }
      // volumen ventricular: se vacía en la sístole y se llena en la primera mitad de la diástole
      const V = tm < ti.sist ? 1 - 0.38 * tm / ti.sist : 0.62 + 0.38 * Math.min(1, (tm - ti.sist) / (0.5 * (ti.T - ti.sist)));
      const kv = Math.cbrt(V); s = 1 + (kv - 1) * 0.5; sy = 1 + (kv - 1) * 0.3;

      ctx.setTransform(k, 0, 0, k, 0, 0);
      if (listo(I.cor_fondo)) ctx.drawImage(I.cor_fondo, 0, 0, W, H); else { ctx.fillStyle = "#01193F"; ctx.fillRect(0, 0, W, H); }
      if (listo(I.cor_ventr)) {
        const N = 48, hs = V0[3] / N;
        for (let i = 0; i < N; i++) {
          const sx = sxDe(V0[1] + (i + .5) * hs);
          ctx.drawImage(I.cor_ventr, 0, i * hs, V0[2], hs, XC + (V0[0] - XC) * sx, V0[1] + i * hs * sy, V0[2] * sx, hs * sy + 0.8);
        }
      }
      // frote: el pericardio «roza» el borde del corazón
      if (frote > 0.02) {
        ctx.save(); ctx.strokeStyle = `rgba(250,204,21,${0.8 * frote})`; ctx.lineWidth = 10; ctx.setLineDash([22, 16]); ctx.lineDashOffset = -now * 220;
        ctx.beginPath(); ctx.moveTo(...deforma([450, 470])); ctx.bezierCurveTo(...deforma([470, 760]), ...deforma([900, 930]), ...deforma([1180, 900]));
        ctx.bezierCurveTo(...deforma([1270, 760]), ...deforma([1260, 520]), ...deforma([1220, 430])); ctx.stroke(); ctx.restore();
      }
      // chorro turbulento con la envolvente del soplo
      const chorros = LES[vid] || [];
      for (const [paso, sentido] of chorros) {
        let [a, b] = PASO[paso]; if (sentido < 0) [a, b] = [b, a];
        if (Math.random() < env * dt * 70) part.push({ a, b, u: 0, v: 1.6 + Math.random() * .8, o: (Math.random() - .5), w: Math.random() * 6.3 });
      }
      for (let i = part.length - 1; i >= 0; i--) {
        const p = part[i]; p.u += dt * p.v; if (p.u >= 1) { part.splice(i, 1); continue; }
        const [ax, ay] = deforma(p.a), [bx, by] = deforma(p.b), dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
        // estrecho al pasar por la válvula (u≈0.45), y se abre en remolinos después
        const ancho = p.u < 0.45 ? 50 * (1 - p.u / 0.45) + 6 : 6 + 120 * (p.u - 0.45), giro = p.u > 0.45 ? Math.sin(p.w + p.u * 14) * 0.6 : 0;
        const x = ax + dx * p.u + nx * ancho * (p.o + giro), y = ay + dy * p.u + ny * ancho * (p.o + giro), al = Math.sin(p.u * Math.PI);
        const g = ctx.createRadialGradient(x, y, 1, x, y, 14);
        g.addColorStop(0, `rgba(255,255,255,${al})`); g.addColorStop(.45, `rgba(250,204,21,${.9 * al})`); g.addColorStop(1, "rgba(250,204,21,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 14, 0, 6.3); ctx.fill();
      }
      // válvulas: verde abierta, roja cerrada; la enferma con anillo amarillo
      const enf = VALVDE[vid];
      ctx.font = "700 21px Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const v in VAL) {
        const [x0, y0, t] = VAL[v], [x, y] = deforma([x0, y0]), o = ab[v] || 0;
        if (v === enf) { ctx.strokeStyle = `rgba(250,204,21,${0.55 + 0.45 * Math.sin(now * 6)})`; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(x, y, 38, 0, 6.3); ctx.stroke(); }
        ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.fillStyle = o > 0.5 ? "#16A34A" : "#DC2626";
        ctx.beginPath(); ctx.arc(x, y, 24, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.fillText(t, x, y + 1);
      }
      // rótulo vivo: lesión y momento del ciclo
      const fase = tm < ti.sist ? "SÍSTOLE" : "DIÁSTOLE";
      ctx.font = "700 34px Helvetica, Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const sub = `${fase}${env > 0.05 ? " · suena el soplo" : frote > 0.05 ? " · suena el frote" : ""}`;
      const w = Math.max(ctx.measureText(nombre).width, 330) + 48;
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(28, 26, w, 98, 22) : ctx.rect(28, 26, w, 98); ctx.fill();
      ctx.fillStyle = "#0F172A"; ctx.fillText(nombre, 52, 70);
      ctx.font = "700 27px Helvetica, Arial, sans-serif"; ctx.fillStyle = tm < ti.sist ? "#B91C1C" : "#1D4ED8"; ctx.fillText(sub, 52, 107);
    }
    return { pintar, medir };
  };
})();
