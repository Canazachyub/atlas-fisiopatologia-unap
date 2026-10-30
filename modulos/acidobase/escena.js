/* Escena realista alvéolo-capilar (pestaña «Simulador de gasometría»).
   El fondo es una ilustración de ChatGPT sin sus esferas; el simulador pone las moléculas según la gasometría:
   CO₂ en la sangre según la PaCO₂ (y cuánto sale al alvéolo según la ventilación: PaCO₂ baja = hiperventila),
   HCO₃⁻ según el bicarbonato, y el plasma se tiñe según el pH. Rótulos: rot_gas.svg (draw.io). */
(function () {
  "use strict";
  const W = 1672, H = 941;
  const CAP = [1000, 1230], ALV = [60, 820, 60, 760];       // franja de plasma del capilar (x) y luz del alvéolo (x0, x1, y0, y1)
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["gas_fondo", "gas_co2", "gas_o2"].map(n => { const i = new Image(); i.src = n + ".webp"; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;
  const az = (a, b) => a + Math.random() * (b - a);

  window.UTIL.gasReal = function (caja) {
    const cv = caja.querySelector("canvas"), ctx = cv.getContext("2d"), I = carga();
    let k = 1, v = { pH: 7.4, pco2: 40, hco3: 24 }, tPrev = 0, acSale = 0, acO2 = 0;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    const sangre = [], bic = [], viaje = [], aire = [], o2 = [];
    const enSangre = () => ({ x: az(CAP[0], CAP[1]), y: az(-40, H + 40), s: az(.75, 1.05) });
    for (let i = 0; i < 12; i++) o2.push({ x: az(ALV[0], ALV[1] - 80), y: az(ALV[2], ALV[3]), vx: az(-12, 12), vy: az(-12, 12) });

    function pintar(dt, t) {
      const nCO2 = Math.round(Math.max(3, Math.min(40, v.pco2 / 40 * 14))), nHC = Math.round(Math.max(2, Math.min(36, v.hco3 / 24 * 12)));
      const vent = Math.max(.25, Math.min(3.2, 40 / v.pco2));       // ventilación alveolar relativa (inversa de la PaCO₂)
      while (sangre.length < nCO2) sangre.push(enSangre()); sangre.length = nCO2;
      while (bic.length < nHC) bic.push(enSangre()); bic.length = nHC;
      const nAire = Math.round(nCO2 * .45); while (aire.length < nAire) aire.push({ x: az(ALV[0] + 300, ALV[1]), y: az(ALV[2], ALV[3]), vx: az(-10, 10), vy: az(-10, 10) }); aire.length = nAire;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      if (listo(I.gas_fondo)) ctx.drawImage(I.gas_fondo, 0, 0, W, H); else { ctx.fillStyle = "#F4C9C9"; ctx.fillRect(0, 0, W, H); }
      // el plasma se tiñe con el pH
      const ac = Math.max(0, Math.min(1, (7.4 - v.pH) / .25)), al = Math.max(0, Math.min(1, (v.pH - 7.4) / .2));
      if (ac > .05 || al > .05) {
        ctx.fillStyle = ac > al ? `rgba(234,88,12,${.28 * ac})` : `rgba(109,40,217,${.26 * al})`;
        ctx.fillRect(960, 0, W - 960, H);
      }
      const bola = (img, x, y, s) => { if (listo(img)) { const w = img.naturalWidth * s, h = img.naturalHeight * s; ctx.drawImage(img, x - w / 2, y - h / 2, w, h); } };
      // sangre que baja por el capilar
      for (const p of sangre) { p.y += dt * 60; if (p.y > H + 40) Object.assign(p, enSangre(), { y: -40 }); bola(I.gas_co2, p.x, p.y, .62 * p.s); }
      for (const p of bic) {
        p.y += dt * 60; if (p.y > H + 40) Object.assign(p, enSangre(), { y: -40 });
        ctx.fillStyle = "#10B981"; ctx.strokeStyle = "#065F46"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - 15); ctx.lineTo(p.x + 13, p.y); ctx.lineTo(p.x, p.y + 15); ctx.lineTo(p.x - 13, p.y); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      // CO₂ que difunde al alvéolo y se espira (más rápido cuanto más se ventila)
      acSale += dt * 1.6 * vent * nCO2 / 14;
      while (acSale >= 1) { acSale--; const y = az(120, 820); viaje.push({ u: 0, y0: y, y1: y + az(-80, 80), v: .45 * Math.sqrt(vent) }); }
      for (let i = viaje.length - 1; i >= 0; i--) {
        const p = viaje[i]; if (p.o2) continue; p.u += dt * p.v; if (p.u >= 1) { viaje.splice(i, 1); continue; }
        // tramo 1: cruza la membrana (u<.35); tramo 2: sube y sale con el aire espirado
        let x, y;
        if (p.u < .35) { const f = p.u / .35; x = 1010 - 260 * f; y = p.y0 + (p.y1 - p.y0) * f; }
        else { const f = (p.u - .35) / .65; x = 750 - 520 * f; y = p.y1 - (p.y1 + 60) * f * f; }
        ctx.globalAlpha = Math.min(1, (1 - p.u) * 4); bola(I.gas_co2, x, y, .55); ctx.globalAlpha = 1;
      }
      for (const p of aire) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < ALV[0] + 250 || p.x > ALV[1]) p.vx *= -1; if (p.y < ALV[2] || p.y > ALV[3]) p.vy *= -1; ctx.globalAlpha = .7; bola(I.gas_co2, p.x, p.y, .45); ctx.globalAlpha = 1; }
      // O₂: del aire a la sangre (constante)
      for (const p of o2) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < ALV[0] || p.x > ALV[1] - 60) p.vx *= -1; if (p.y < ALV[2] || p.y > ALV[3]) p.vy *= -1; bola(I.gas_o2, p.x, p.y, .8); }
      acO2 += dt * 1.2; if (acO2 >= 1) { acO2--; viaje.push({ o2: true, u: 0, y0: az(150, 750), v: .5 }); }
      for (let i = viaje.length - 1; i >= 0; i--) {
        const p = viaje[i]; if (!p.o2) continue; p.u += dt * p.v; if (p.u >= 1) { viaje.splice(i, 1); continue; }
        const x = 760 + 360 * p.u, y = p.y0 + 40 * p.u; bola(I.gas_o2, x, y, .7);
      }
      // gasometría viva
      const est = v.pH < 7.35 ? ["ACIDOSIS", "#C2410C"] : v.pH > 7.45 ? ["ALCALOSIS", "#6D28D9"] : ["pH normal", "#15803D"];
      const fmt = (x, d) => x.toFixed(d).replace(".", ",");
      ctx.font = "700 36px Helvetica, Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const l1 = `pH ${fmt(v.pH, 2)} · ${est[0]}`, l2 = `PaCO₂ ${Math.round(v.pco2)} · HCO₃⁻ ${fmt(v.hco3, 1)} · ventilación ${vent > 1.15 ? "alta" : vent < .87 ? "baja" : "normal"}`;
      ctx.font = "600 26px Helvetica, Arial, sans-serif"; const w2 = ctx.measureText(l2).width;
      ctx.fillStyle = "rgba(255,255,255,.93)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(470, 24, Math.max(w2, 360) + 48, 100, 22) : ctx.rect(470, 24, Math.max(w2, 360) + 48, 100); ctx.fill();
      ctx.font = "700 36px Helvetica, Arial, sans-serif"; ctx.fillStyle = est[1]; ctx.fillText(l1, 494, 68);
      ctx.font = "600 26px Helvetica, Arial, sans-serif"; ctx.fillStyle = "#334155"; ctx.fillText(l2, 494, 106);
    }
    (function bucle(t) {
      if (!cv.isConnected) return;
      const dt = Math.min(.1, (t - (tPrev || t)) / 1000); tPrev = t; pintar(dt, t / 1000); requestAnimationFrame(bucle);
    })(performance.now());
    return { set(o) { v = o; }, medir };
  };
})();
