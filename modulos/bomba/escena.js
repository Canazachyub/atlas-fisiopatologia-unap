/* Escena realista del corazón en corte (pestaña «Curva de Frank-Starling»).
   La ilustración es de ChatGPT; los ventrículos están recortados y el simulador los contrae y los llena con el
   volumen del modelo (VTD → VTS), mueve la sangre por las válvulas que están abiertas en cada fase y, si la presión
   de llenado sube, muestra la sangre represada en las venas pulmonares. Rótulos: rot_corazon*.svg (draw.io). */
(function () {
  "use strict";
  const W = 1672, H = 941;
  const V0 = [430, 430, 845, 480], XC = 880;             // recorte de los ventrículos (x, y, ancho, alto) y eje de la contracción
  const VAL = { mitral: [1010, 418, "M"], aortica: [822, 368, "Ao"] };
  const VIAS = {                                         // recorridos de la sangre (coordenadas de la ilustración)
    viEyec: { c: "239,68,68", p: [[1010, 660], [960, 500], [860, 400], [790, 300], [765, 180], [800, 85], [900, 70], [955, 130]] },
    vdEyec: { c: "59,130,246", p: [[700, 660], [745, 530], [800, 420], [850, 300], [940, 200], [1060, 130]] },
    viLlen: { c: "239,68,68", p: [[1290, 280], [1150, 290], [1040, 340], [1010, 430], [1012, 560], [1030, 700]] },
    vdLlen: { c: "59,130,246", p: [[580, 40], [590, 220], [615, 380], [650, 480], [690, 620]] } };
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["cor_fondo", "cor_ventr"].map(n => { const i = new Image(); i.src = n + ".webp"; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;

  window.UTIL.corReal = function (caja, B) {
    const cv = caja.querySelector("canvas"), rot = caja.querySelector("img.rot"), pie = caja.parentNode.querySelector(".pie-esc");
    const ctx = cv.getContext("2d"), I = carga();
    let k = 1, s = 1, sy = 1, cong = null;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    const sxDe = y => 1 + (s - 1) * Math.min(1, Math.max(0, (y - V0[1]) / V0[3]) * 1.6);
    const deforma = ([x, y]) => y <= V0[1] ? [x, y] : [XC + (x - XC) * sxDe(y), V0[1] + (y - V0[1]) * sy];
    const largo = {}, gotas = {};
    for (const n in VIAS) {
      const p = VIAS[n].p; let L = 0; for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      largo[n] = L; gotas[n] = { lista: [], ac: 0 };
    }
    const punto = (n, u) => {           // posición a lo largo del recorrido (u 0-1)
      const p = VIAS[n].p; let d = u * largo[n];
      for (let i = 1; i < p.length; i++) {
        const l = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
        if (d <= l) { const f = d / l; return deforma([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f]); }
        d -= l;
      }
      return deforma(p[p.length - 1]);
    };

    /* pt: {V, P, fase, flujo}; e: estado del modelo; h: hemodinamia; vel: velocidad de la animación */
    function pintar(pt, e, h, dt, vel) {
      const kv = Math.cbrt(Math.max(20, pt.V) / 123.4);
      s = 1 + (kv - 1) * 0.5; sy = 1 + (kv - 1) * 0.3;
      const c = e.P >= B.K.PCP_CONGESTION ? (e.P >= B.K.PCP_EAP ? "eap" : "cong") : "no";
      if (c !== cong) {
        cong = c; rot.classList.remove("ve"); void rot.offsetWidth; rot.src = c === "no" ? "rot_corazon.svg" : "rot_corazon_cong.svg"; rot.classList.add("ve");
        if (pie) pie.innerHTML = c === "no" ? "Aurícula izquierda → válvula mitral → ventrículo izquierdo → válvula aórtica → aorta. Verde = válvula abierta; roja = cerrada."
          : `<b style="color:#B91C1C">Presión de llenado alta (${Math.round(e.P)} mmHg)</b>: la sangre se represa en las venas pulmonares${c === "eap" ? " y el líquido pasa al alvéolo (edema agudo de pulmón)" : " (congestión pulmonar)"}.`;
      }
      ctx.setTransform(k, 0, 0, k, 0, 0);
      if (listo(I.cor_fondo)) ctx.drawImage(I.cor_fondo, 0, 0, W, H); else { ctx.fillStyle = "#01193F"; ctx.fillRect(0, 0, W, H); }
      // venas pulmonares cargadas cuando la presión de llenado sube
      if (c !== "no") {
        const a = (c === "eap" ? .55 : .35) * (0.75 + 0.25 * Math.sin(performance.now() / 260));
        const g = ctx.createRadialGradient(1230, 270, 10, 1230, 270, 190); g.addColorStop(0, `rgba(245,158,11,${a})`); g.addColorStop(1, "rgba(245,158,11,0)");
        ctx.fillStyle = g; ctx.fillRect(1030, 70, 400, 400);
      }
      // ventrículos: se dibujan en franjas, más estrechos hacia la punta cuanto menor es el volumen
      if (listo(I.cor_ventr)) {
        const N = 48, hs = V0[3] / N;
        for (let i = 0; i < N; i++) {
          const y = V0[1] + (i + .5) * hs, sx = sxDe(y);
          ctx.drawImage(I.cor_ventr, 0, i * hs, V0[2], hs, XC + (V0[0] - XC) * sx, V0[1] + i * hs * sy, V0[2] * sx, hs * sy + 0.8);
        }
      }
      if (pt.fase === "eyec") {
        const [x, y] = deforma([1010, 620]), g = ctx.createRadialGradient(x, y, 10, x, y, 170);
        g.addColorStop(0, `rgba(255,80,80,${0.35 * pt.flujo})`); g.addColorStop(1, "rgba(255,80,80,0)"); ctx.fillStyle = g; ctx.fillRect(x - 180, y - 180, 360, 360);
      }
      // sangre que pasa por las válvulas abiertas
      const act = { viEyec: pt.fase === "eyec" ? pt.flujo * B.clamp(h.SV / 75, .25, 1.5) : 0, vdEyec: pt.fase === "eyec" ? pt.flujo : 0,
        viLlen: pt.fase === "llen" ? 1 : 0, vdLlen: pt.fase === "llen" ? 1 : 0 };
      for (const n in VIAS) {
        const G = gotas[n], v = 2.2 * Math.max(.35, vel) * (e.FC / 70);
        G.ac += dt * 38 * act[n] * Math.max(.35, vel) * (e.FC / 70);
        while (G.ac >= 1) { G.ac--; G.lista.push({ u: 0, o: (Math.random() - .5) * 26 }); }
        for (let i = G.lista.length - 1; i >= 0; i--) {
          const q = G.lista[i]; q.u += dt * v * 0.5; if (q.u >= 1) { G.lista.splice(i, 1); continue; }
          const [x, y] = punto(n, q.u), al = Math.sin(q.u * Math.PI);
          const g = ctx.createRadialGradient(x + q.o, y, 1, x + q.o, y, 15);
          g.addColorStop(0, `rgba(255,255,255,${.9 * al})`); g.addColorStop(.4, `rgba(${VIAS[n].c},${.85 * al})`); g.addColorStop(1, `rgba(${VIAS[n].c},0)`);
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + q.o, y, 15, 0, 6.3); ctx.fill();
        }
      }
      // válvulas: verde abierta, roja cerrada
      const abierta = { mitral: pt.fase === "llen", aortica: pt.fase === "eyec" };
      ctx.font = "700 22px Helvetica, Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (const v in VAL) {
        const [x, y, t] = VAL[v];
        ctx.lineWidth = 5; ctx.strokeStyle = "#fff"; ctx.fillStyle = abierta[v] ? "#16A34A" : "#DC2626";
        ctx.beginPath(); ctx.arc(x, y, 24, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.fillText(t, x, y + 1);
      }
      // fase actual
      const F = B.FASES.find(f => f.id === pt.fase), txt = F ? F.nombre : "", sub = `VI: ${Math.round(pt.V)} mL`;
      ctx.font = "700 34px Helvetica, Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const w = Math.max(ctx.measureText(txt).width, 200) + 48;
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(28, 26, w, 98, 22) : ctx.rect(28, 26, w, 98); ctx.fill();
      ctx.fillStyle = "#0F172A"; ctx.fillText(txt, 52, 70); ctx.font = "600 27px Helvetica, Arial, sans-serif"; ctx.fillStyle = "#475569"; ctx.fillText(sub, 52, 107);
    }
    return { pintar, medir };
  };
})();
