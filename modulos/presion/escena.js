/* Escena realista del brazo (pestaña «Toma la presión»).
   El brazo con manguito es una ilustración de ChatGPT; el simulador la anima en vivo: el manguito se hincha con la
   presión, el estetoscopio aparece sobre la braquial y «suena» con el color de la fase, el pulso viaja hacia la radial
   cuando la sangre pasa bajo el manguito y el brazo sube o baja respecto del corazón. Rótulos: rot_brazo.svg (draw.io). */
(function () {
  "use strict";
  const W = 1672, H = 941, Y_COR = 535;                             // línea del corazón = eje del brazo bien colocado
  const MANG = [69, 236, 399, 403], MANGA = [23, 208, 492, 434];     // recortes manguito.webp y manga.webp (x, y, ancho, alto)
  const EST = { x: 616, y: 548, esc: 0.56, cy: 216 };                // diafragma sobre el pliegue del codo
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["brazo", "esteto", "manguito", "manga"].map(n => { const i = new Image(); i.src = n + ".webp"; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;

  window.UTIL.brazoReal = function (caja) {
    const cv = caja.querySelector("canvas"), rot = caja.querySelector("img.rot"), ctx = cv.getContext("2d"), I = carga();
    let k = 1, dyV = 0;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);

    /* o: { p, maxP, est, pal, pulsoRadial, tBeat, t, abre, sonido (0-1), colSonido, nivel, ropa, ajuste } */
    function pintar(o, dt) {
      const dyObj = o.nivel === "abajo" ? 80 : o.nivel === "arriba" ? -80 : 0;
      dyV += (dyObj - dyV) * Math.min(1, dt * 5);
      rot.style.transform = `translateY(${dyV / H * 100}%)`;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.fillStyle = "#CDD0D4"; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(0, dyV);
      if (listo(I.brazo)) ctx.drawImage(I.brazo, 0, 0, W, H);
      if (dyV < 0) { ctx.fillStyle = "#ECECEC"; ctx.fillRect(0, H, W, -dyV + 2); }

      // ropa bajo el manguito (error de técnica)
      const [mx, my, mw, mh] = MANG;
      if (o.ropa && listo(I.manga)) ctx.drawImage(I.manga, ...MANGA);
      // el manguito se hincha con la presión (se redibuja ampliado desde la propia ilustración)
      const inf = Math.min(1, o.p / 300), sy = 1 + 0.13 * inf + (o.ajuste === "flojo" ? 0.06 : 0), sx = 1 + 0.025 * inf;
      if (listo(I.manguito) && (inf > 0.005 || o.ajuste === "flojo" || o.ropa)) {
        const cx = mx + mw / 2, cy = my + mh / 2;
        ctx.drawImage(I.manguito, cx - mw * sx / 2, cy - mh * sy / 2, mw * sx, mh * sy);
      }
      // onda de pulso: cada latido que pasa bajo el manguito viaja hasta la muñeca
      const x = o.t - o.tBeat;
      if (o.abre && x >= 0 && x < 0.5) {
        const px = mx + mw + x * 2200;
        if (px < 1320) { const g = ctx.createRadialGradient(px, 515, 4, px, 515, 70); g.addColorStop(0, `rgba(239,68,68,${0.55 * (1 - x * 2)})`); g.addColorStop(1, "rgba(239,68,68,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, 515, 90, 40, 0, 0, 6.3); ctx.fill(); }
      }
      // dedos en la radial: se iluminan con cada pulso que llega
      if (o.pal) {
        const on = o.pulsoRadial; ctx.lineWidth = 5;
        [[1270, 478], [1318, 470]].forEach(([fx, fy]) => { ctx.fillStyle = on ? "rgba(239,68,68,.85)" : "rgba(245,158,11,.75)"; ctx.strokeStyle = "#7C2D12";
          ctx.beginPath(); ctx.ellipse(fx, fy, 22, 30, -0.2, 0, 6.3); ctx.fill(); ctx.stroke(); });
        if (on) { ctx.strokeStyle = "rgba(239,68,68,.6)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1294, 474, 62, 0, 6.3); ctx.stroke(); }
      }
      // estetoscopio sobre la braquial + ondas del ruido (color de la fase)
      if (o.est && listo(I.esteto)) {
        const w = I.esteto.naturalWidth * EST.esc, h = I.esteto.naturalHeight * EST.esc, top = EST.y - EST.cy * EST.esc;
        ctx.strokeStyle = "#111"; ctx.lineWidth = 16; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(EST.x, top + 4); ctx.bezierCurveTo(EST.x, top - 120, EST.x + 160, top - 150, EST.x + 230, -dyV - 20); ctx.stroke();
        ctx.drawImage(I.esteto, EST.x - w / 2, top, w, h);
        if (o.sonido > 0) {
          ctx.strokeStyle = o.colSonido; ctx.lineWidth = 7;
          for (let i = 1; i <= 3; i++) { ctx.globalAlpha = Math.max(0, o.sonido - i * 0.18); ctx.beginPath(); ctx.arc(EST.x, EST.y, 90 + i * 34 + (1 - o.sonido) * 60, -2.6, -0.5); ctx.stroke(); }
          ctx.globalAlpha = 1;
        }
      }
      ctx.restore();
      // línea del corazón (no se mueve con el brazo)
      ctx.setLineDash([18, 14]); ctx.strokeStyle = "rgba(185,28,28,.75)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, Y_COR); ctx.lineTo(W, Y_COR); ctx.stroke(); ctx.setLineDash([]);
      const txt = "♥ nivel del corazón" + (dyObj ? (dyObj > 0 ? " · brazo por DEBAJO" : " · brazo por ENCIMA") : "");
      ctx.font = "700 28px Helvetica, Arial, sans-serif"; ctx.textAlign = "left";
      const tw = ctx.measureText(txt).width, tx = 760, ty = Y_COR - 22;
      ctx.fillStyle = "rgba(255,255,255,.88)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(tx - 12, ty - 30, tw + 24, 42, 21) : ctx.rect(tx - 12, ty - 30, tw + 24, 42); ctx.fill();
      ctx.fillStyle = "#B91C1C"; ctx.fillText(txt, tx, ty);
    }
    return { pintar, medir };
  };
})();
