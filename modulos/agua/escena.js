/* Escena realista de la célula (pestaña «Compartimentos»).
   Fondo, citoplasma, núcleo y Na⁺ son recortes de una ilustración de ChatGPT; el simulador los mueve en vivo:
   la célula se arruga o se hincha con el agua intracelular, el Na⁺ de afuera se ve más o menos denso y las gotas
   muestran hacia dónde va el agua. Encima va una capa de rótulos hecha en draw.io (rot_*.svg), una por estado. */
(function () {
  "use strict";
  const W = 1672, H = 940, CX = 832, CY = 452, R = 257, NX = 830, NY = 457, NR = 116;
  let IM = null;
  const carga = () => IM || (IM = Object.fromEntries(["fondo", "cito", "nucleo", "na"].map(n => { const i = new Image(); i.src = `cel_${n}.webp`; return [n, i]; })));
  const listo = i => i.complete && i.naturalWidth > 0;
  const ESTADOS = {
    arrugada: { svg: "rot_arrugada.svg", t: `<b style="color:#B91C1C">Afuera hipertónico</b> (Na⁺ alto): el agua <b>sale</b> y la célula se <b>arruga</b>.` },
    normal: { svg: "rot_normal.svg", t: `<b style="color:#15803D">Isotónico</b>: la misma concentración afuera y adentro; el agua entra y sale por igual.` },
    hinchada: { svg: "rot_hinchada.svg", t: `<b style="color:#1D4ED8">Afuera hipotónico</b> (Na⁺ bajo): el agua <b>entra</b> y la célula se <b>hincha</b>.` } };

  window.UTIL.celReal = function (caja) {
    const cv = caja.querySelector("canvas"), rot = caja.querySelector("img.rot"), pie = caja.parentNode.querySelector(".pie-esc");
    const ctx = cv.getContext("2d"), I = carga();
    let k = 1;
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);

    const na = [], gotas = [];
    const nuevoNa = r => { let x, y; do { x = 30 + Math.random() * (W - 60); y = 30 + Math.random() * (H - 60); } while (Math.hypot(x - CX, y - CY) < r * 1.25 + 40);
      return { x, y, vx: (Math.random() - .5) * 16, vy: (Math.random() - .5) * 16, s: .75 + Math.random() * .5 }; };
    let estado = "", e = 1, acIn = 0, acOut = 0;

    function contorno(r, arr, t) {          // círculo; si se arruga, con espículas (crenación)
      const n = 26; ctx.beginPath();
      for (let i = 0; i <= 180; i++) {
        const a = i / 180 * Math.PI * 2, esp = Math.pow(Math.abs(Math.cos(a * n / 2)), 6);
        const rr = r * (1 + 0.004 * Math.sin(a * 3 + t * 1.3) - arr * (0.03 - 0.11 * esp));
        i ? ctx.lineTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a)) : ctx.moveTo(CX + rr * Math.cos(a), CY + rr * Math.sin(a));
      }
      ctx.closePath();
    }

    /* ratio = agua intracelular / basal; mov = litros que aún faltan por moverse (+ entra); naP = Na plasmático */
    function pintar(ratio, mov, naP, dt, t) {
      // la célula real cambia pocos %, así que el tamaño se exagera ×4 para que se vea (el % exacto está en el esquema)
      const objetivo = Math.max(0.72, Math.min(1.32, 1 + (ratio - 1) * 4));
      e += (objetivo - e) * Math.min(1, dt * 6);
      const r = R * e, arr = Math.max(0, Math.min(1, (0.985 - e) / 0.2)), hin = Math.max(0, Math.min(1, (e - 1.015) / 0.25));
      const est = e < 0.97 ? "arrugada" : e > 1.03 ? "hinchada" : "normal";
      if (est !== estado) {
        estado = est; rot.classList.remove("ve"); void rot.offsetWidth; rot.src = ESTADOS[est].svg; rot.classList.add("ve");
        if (pie) pie.innerHTML = ESTADOS[est].t;
      }
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.clearRect(0, 0, W, H);
      if (listo(I.fondo)) ctx.drawImage(I.fondo, 0, 0, W, H); else { ctx.fillStyle = "#8EC5EC"; ctx.fillRect(0, 0, W, H); }

      // Na⁺ afuera: más sodio, más esferas (exagerado)
      const nNa = Math.round(Math.max(8, Math.min(72, 30 + (naP - 140) * 2.4)));
      while (na.length < nNa) na.push(nuevoNa(r)); if (na.length > nNa) na.length = nNa;
      for (const p of na) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 20 || p.x > W - 20) p.vx *= -1; if (p.y < 20 || p.y > H - 20) p.vy *= -1;
        const d = Math.hypot(p.x - CX, p.y - CY), lim = r * 1.12 + 26;
        if (d < lim) { p.x = CX + (p.x - CX) / d * lim; p.y = CY + (p.y - CY) / d * lim; }
        const s = 44 * p.s; if (listo(I.na)) ctx.drawImage(I.na, p.x - s / 2, p.y - s / 2, s, s);
      }

      // célula: citoplasma recortado y deformado + núcleo de tamaño fijo
      ctx.save(); contorno(r, arr, t); ctx.clip();
      if (listo(I.cito)) ctx.drawImage(I.cito, CX - r, CY - r, 2 * r, 2 * r);
      if (arr > 0) { ctx.fillStyle = `rgba(150,20,70,${0.22 * arr})`; ctx.fillRect(CX - r, CY - r, 2 * r, 2 * r); }
      if (hin > 0) { ctx.fillStyle = `rgba(235,245,255,${0.38 * hin})`; ctx.fillRect(CX - r, CY - r, 2 * r, 2 * r); }
      ctx.restore();
      contorno(r, arr, t); ctx.lineWidth = 3 + 3 * hin; ctx.strokeStyle = `rgba(255,255,255,${0.35 + 0.4 * hin})`; ctx.stroke();
      if (listo(I.nucleo)) ctx.drawImage(I.nucleo, NX - NR, NY - NR, 2 * NR, 2 * NR);

      // gotas de agua: cruzan la membrana hacia donde se mueve el agua (y un goteo parejo en reposo)
      const flujo = Math.min(1, Math.abs(mov) * 4);
      acIn += dt * (2.5 + (mov > 0 ? 45 * flujo : 0)); acOut += dt * (2.5 + (mov < 0 ? 45 * flujo : 0));
      const nace = entra => { const a = Math.random() * Math.PI * 2; gotas.push({ a, entra, u: 0, v: 0.45 + Math.random() * 0.35 }); };
      while (acIn >= 1) { acIn--; nace(true); } while (acOut >= 1) { acOut--; nace(false); }
      for (let i = gotas.length - 1; i >= 0; i--) {
        const g = gotas[i]; g.u += dt * g.v; if (g.u >= 1) { gotas.splice(i, 1); continue; }
        const rr = g.entra ? r * (1.55 - 0.75 * g.u) : r * (0.8 + 0.75 * g.u), x = CX + rr * Math.cos(g.a), y = CY + rr * Math.sin(g.a);
        const al = Math.sin(g.u * Math.PI), gr = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 13);
        gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(0.45, `rgba(56,189,248,${0.85 * al})`); gr.addColorStop(1, `rgba(3,105,161,${0.15 * al})`);
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.3); ctx.fill();
      }
    }
    return { pintar, medir };
  };
})();
