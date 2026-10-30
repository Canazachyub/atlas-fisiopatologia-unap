/* Escena realista de los dos ojos (pestaña «Linterna»).
   Los ojos salen de una sola fotografía de ChatGPT (el derecho es el espejo del izquierdo). El iris viene en 9
   fotogramas calculados por remapeo radial (pupila de 1 a 9 mm, sin IA, así no cambia el estilo); el simulador
   pone encima la pupila exacta, mueve la mirada, baja el párpado en la ptosis y enciende la luz.
   El lienzo usa las mismas coordenadas que el SVG #cara (600 × 300): la linterna del SVG queda encima. */
(function () {
  "use strict";
  const W = 600, H = 300, CY = 150, CX = { D: 170, I: 430 };
  const F = 0.25;                       // unidades del SVG por píxel de la foto original
  const PC = [627, 442], C = [628, 446], CROP = [60, 120, 1060, 680], FR = 232;   // FR: lado de cada fotograma (px del sprite = 2 px de la foto)
  const PXMM = 226 / 6;                 // iris de 12 mm = 452 px de la foto
  const INF = [[1120, 525], [1030, 525], [980, 578], [900, 628], [800, 660], [700, 672], [600, 672], [500, 660], [400, 640], [300, 615], [220, 597], [150, 585], [60, 590]];
  const L = (x, y) => [(x - PC[0]) * F, (y - PC[1]) * F];
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["iris_hoja", "ojo_fondo", "ojo_piel", "ojo_parpado"].map(n => { const i = new Image(); i.src = n + ".webp"; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;

  window.UTIL.carasReal = function (caja) {
    const cv = caja.querySelector("canvas"), ctx = cv.getContext("2d"), I = carga();
    let k = 1;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    const sobreLid = new Path2D();       // todo lo que está por encima del párpado inferior (ahí puede bajar el superior)
    INF.forEach(([x, y], i) => { const [a, b] = L(x, y); i ? sobreLid.lineTo(a, b) : sobreLid.moveTo(a, b); });
    [[60, 0], [1120, 0]].forEach(([x, y]) => sobreLid.lineTo(...L(x, y))); sobreLid.closePath();
    const pt = { D: 0, I: 0 };

    function ojo(e, o, luz, dt) {
      const sx = e === "D" ? -1 : 1, gx = -(o.px || 0) * 27, gy = -(o.py || 0) * 15;
      const [ox, oy] = L(CROP[0], CROP[1]), cw = CROP[2] * F, ch = CROP[3] * F;
      pt[e] += ([0, 35, 59][o.ptosis || 0] - pt[e]) * Math.min(1, dt * 5);
      ctx.save(); ctx.translate(CX[e], CY); ctx.scale(sx, 1);
      if (listo(I.ojo_fondo)) ctx.drawImage(I.ojo_fondo, ox, oy, cw, ch);
      // iris: el fotograma con la pupila inmediatamente menor, y encima la pupila exacta
      const d = Math.max(1, Math.min(9, o.d || 4)), en = o.enof ? 0.93 : 1;
      const ix = sx * gx + (C[0] - PC[0]) * F, iy = gy + (C[1] - PC[1]) * F, lado = FR * 0.5 * en;
      if (listo(I.iris_hoja)) ctx.drawImage(I.iris_hoja, (Math.floor(d) - 1) * FR, 0, FR, FR, ix - lado / 2, iy - lado / 2, lado, lado);
      const rp = d / 2 * PXMM * F * en, px0 = sx * gx, py0 = gy;
      ctx.fillStyle = "#08080C"; ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const a = i / 40 * Math.PI * 2, f = o.irregular ? 1 + .16 * Math.sin(3 * a + 1) + .09 * Math.sin(5 * a + 2) : 1;
        const x = px0 + rp * f * Math.cos(a), y = py0 + rp * f * Math.sin(a); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.fill();
      if (listo(I.ojo_piel)) ctx.drawImage(I.ojo_piel, ox, oy, cw, ch);
      if (pt[e] > 0.5 && listo(I.ojo_parpado)) { ctx.save(); ctx.clip(sobreLid); ctx.drawImage(I.ojo_parpado, ox, oy + pt[e], cw, ch); ctx.restore(); }
      if (o.enof) { const g = ctx.createRadialGradient(0, -52, 4, 0, -52, 70); g.addColorStop(0, "rgba(20,8,4,.45)"); g.addColorStop(1, "rgba(20,8,4,0)"); ctx.fillStyle = g; ctx.fillRect(-80, -100, 160, 80); }
      ctx.restore();
      // reflejo de la córnea (siempre del mismo lado: viene de la lámpara) y luz de la linterna
      const cx = CX[e] + gx, cy = CY + gy;
      if (pt[e] < 40) {
        const r = luz ? 9 : 5, g = ctx.createRadialGradient(cx - 20, cy - 12, 0, cx - 20, cy - 12, r);
        g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx - 20, cy - 12, r, 0, 6.3); ctx.fill();
      }
      if (luz) {
        ctx.save(); ctx.globalCompositeOperation = "lighter";
        const g = ctx.createRadialGradient(cx, cy, 6, cx, cy, 120); g.addColorStop(0, "rgba(255,236,170,.42)"); g.addColorStop(1, "rgba(255,236,170,0)");
        ctx.fillStyle = g; ctx.fillRect(cx - 130, cy - 130, 260, 260); ctx.restore();
      }
    }

    /* est: { D: {d, px, py, ptosis, enof, irregular}, I: {...}, luz: {D, I} } */
    function pintar(est, dt) {
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const g = ctx.createRadialGradient(W / 2, CY, 60, W / 2, CY, 360); g.addColorStop(0, "#6E4A3B"); g.addColorStop(1, "#3F2921");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ojo("D", est.D, est.luz.D, dt); ojo("I", est.I, est.luz.I, dt);
      const b = ctx.createLinearGradient(0, 238, 0, 262); b.addColorStop(0, "rgba(15,10,8,0)"); b.addColorStop(1, "rgba(15,10,8,.72)");
      ctx.fillStyle = b; ctx.fillRect(0, 238, W, H - 238);
    }
    return { pintar, medir };
  };
})();
