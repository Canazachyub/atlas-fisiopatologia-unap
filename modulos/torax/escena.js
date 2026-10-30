/* Escena realista del acino pulmonar (pestaña «Paciente virtual»).
   El racimo de alvéolos es una ilustración de ChatGPT recortada; el simulador lo hace respirar y le aplica lo que
   cada síndrome cambia por dentro: exudado, colapso, aire atrapado, líquido, moco o bronquio estrecho.
   Rótulos fijos: rot_alveolos.svg (draw.io); la explicación del síndrome sale de PULMON (why.aus), de la clase. */
(function () {
  "use strict";
  const W = 1672, H = 941, ANC = [380, 0];                 // la escala crece desde donde entra el bronquio
  const BRONQ = [[300, -10], [420, 120], [520, 230], [600, 330]];
  // esc: tamaño, amp: cuánto respira, capa: qué se pinta dentro, txt: qué hay en el alvéolo
  const EST = {
    normal: { esc: 1, amp: .035, txt: "Alvéolos con aire: se inflan y desinflan" },
    condensacion: { esc: .98, amp: .008, capa: "exudado", txt: "Alvéolos llenos de exudado (sin aire)" },
    bronconeumonia: { esc: 1, amp: .025, capa: "focos", txt: "Focos de exudado salpicados" },
    atelectasia: { esc: .78, amp: 0, capa: "colapso", tapon: true, txt: "Alvéolos colapsados: el bronquio está obstruido" },
    derrame: { esc: .86, amp: .012, capa: "liquido", txt: "Pulmón comprimido por el líquido de la pleura" },
    neumotorax: { esc: .74, amp: 0, capa: "aire", txt: "Pulmón colapsado por aire en la pleura" },
    enfisema: { esc: 1.12, amp: .01, capa: "claro", txt: "Alvéolos dilatados y rotos: aire atrapado" },
    caverna: { esc: 1, amp: .03, capa: "cavidad", txt: "Una cavidad con aire dentro del pulmón" },
    congestion: { esc: 1, amp: .03, capa: "edema", txt: "Líquido en los alvéolos de las bases" },
    pleuritis_aguda: { esc: 1, amp: .02, capa: "pleura", txt: "Pleura inflamada; los alvéolos tienen aire" },
    pleuritis_cronica: { esc: .96, amp: .015, capa: "pleura", txt: "Pleura engrosada que limita la expansión" },
    asma: { esc: 1.06, amp: .015, estrecho: true, txt: "Bronquio estrecho: el aire queda atrapado" },
    bronquiectasia: { esc: 1, amp: .03, moco: true, ancho: true, txt: "Bronquio dilatado con secreciones" },
    bronquitis_cronica: { esc: 1, amp: .028, moco: true, txt: "Bronquio con moco" },
    bronquitis_aguda: { esc: 1, amp: .03, moco: true, txt: "Bronquio inflamado con secreción" } };
  let IM = null;
  const carga = () => IM || (IM = (() => { const i = new Image(); i.src = "alv_racimo.webp"; return i; })());
  const listo = i => i.complete && i.naturalWidth > 0;

  window.UTIL.alvReal = function (caja, P) {
    const cv = caja.querySelector("canvas"), ctx = cv.getContext("2d"), img = carga(), pie = caja.parentNode.querySelector(".pie-esc");
    const off = document.createElement("canvas"), oc = off.getContext("2d");
    let k = 1, esc = 1, tPrev = 0, ult = "";
    function medir() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.max(260, caja.clientWidth);
      cv.width = off.width = Math.round(w * dpr); cv.height = off.height = Math.round(w * H / W * dpr); k = cv.width / W;
    }
    medir();
    if ("ResizeObserver" in window) new ResizeObserver(medir).observe(caja);
    const burb = [];

    function pintar(id, t, dt) {
      const e = EST[id] || EST.normal, s = P.S[id];
      if (id !== ult) { ult = id; if (pie) pie.innerHTML = `<b>${s.nombre}.</b> ${(s.why && s.why.aus) || ""}`; }
      const resp = Math.sin(t * 2 * Math.PI / 4);           // un ciclo cada 4 s
      esc += (e.esc - esc) * Math.min(1, dt * 3);
      const f = esc * (1 + e.amp * resp);
      const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 950); g.addColorStop(0, "#0B2550"); g.addColorStop(1, "#020B22");
      ctx.setTransform(k, 0, 0, k, 0, 0); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (e.capa === "liquido") {            // líquido pleural que empuja desde abajo
        const y0 = 700 + 10 * Math.sin(t * 1.3);
        const lg = ctx.createLinearGradient(0, y0, 0, H); lg.addColorStop(0, "rgba(125,211,252,.75)"); lg.addColorStop(1, "rgba(14,116,144,.85)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, y0); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, y0 + 8 * Math.sin(x / 90 + t * 2)); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
      }
      if (e.capa === "aire") {               // aire en la pleura alrededor del pulmón colapsado
        ctx.strokeStyle = "rgba(186,230,253,.35)"; ctx.lineWidth = 4; ctx.setLineDash([10, 14]);
        ctx.beginPath(); ctx.ellipse(860, 520, 560, 400, 0, 0, 6.3); ctx.stroke(); ctx.setLineDash([]);
      }
      // racimo en un lienzo aparte para teñir solo lo que es pulmón
      oc.setTransform(k, 0, 0, k, 0, 0); oc.clearRect(0, 0, W, H);
      if (listo(img)) oc.drawImage(img, ANC[0] - ANC[0] * f, ANC[1] - ANC[1] * f, W * f, H * f);
      oc.globalCompositeOperation = "source-atop";
      const P2 = (x, y) => [ANC[0] + (x - ANC[0]) * f, ANC[1] + (y - ANC[1]) * f];
      const mancha = (x, y, r, col) => { const [a, b] = P2(x, y), q = oc.createRadialGradient(a, b, 0, a, b, r * f); q.addColorStop(0, col); q.addColorStop(1, col.replace(/[\d.]+\)$/, "0)")); oc.fillStyle = q; oc.fillRect(a - r * f, b - r * f, 2 * r * f, 2 * r * f); };
      if (e.capa === "exudado") { mancha(900, 600, 520, "rgba(250,230,160,.78)"); }
      if (e.capa === "focos") [[700, 520], [1020, 430], [880, 720], [1160, 640], [560, 650]].forEach(([x, y]) => mancha(x, y, 120, "rgba(250,230,160,.8)"));
      if (e.capa === "colapso") { oc.fillStyle = "rgba(110,20,45,.42)"; oc.fillRect(0, 0, W, H); }
      if (e.capa === "liquido" || e.capa === "aire") { oc.fillStyle = "rgba(90,30,50,.22)"; oc.fillRect(0, 0, W, H); }
      if (e.capa === "claro") { oc.fillStyle = "rgba(255,240,240,.3)"; oc.fillRect(0, 0, W, H); }
      if (e.capa === "edema") { const [, yb] = P2(0, 560), lg = oc.createLinearGradient(0, yb, 0, yb + 340 * f); lg.addColorStop(0, "rgba(56,189,248,0)"); lg.addColorStop(.35, "rgba(56,189,248,.55)"); lg.addColorStop(1, "rgba(14,116,144,.7)"); oc.fillStyle = lg; oc.fillRect(0, yb, W, H); }
      if (e.capa === "pleura") { oc.globalCompositeOperation = "source-atop"; mancha(860, 520, 700, "rgba(239,68,68,0)"); const [a, b] = P2(860, 520), q = oc.createRadialGradient(a, b, 250 * f, a, b, 560 * f); q.addColorStop(0, "rgba(239,68,68,0)"); q.addColorStop(1, "rgba(239,68,68,.55)"); oc.fillStyle = q; oc.fillRect(0, 0, W, H); }
      if (e.capa === "cavidad") { const [a, b] = P2(930, 560); oc.fillStyle = "rgba(20,10,20,.85)"; oc.beginPath(); oc.ellipse(a, b, 150 * f, 115 * f, -.3, 0, 6.3); oc.fill(); oc.strokeStyle = "rgba(255,220,200,.7)"; oc.lineWidth = 10; oc.stroke(); }
      oc.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(off, 0, 0); ctx.setTransform(k, 0, 0, k, 0, 0);
      // bronquio: tapón, moco, estrechez o dilatación
      const bp = BRONQ.map(([x, y]) => [ANC[0] + (x - ANC[0]) * f, ANC[1] + (y - ANC[1]) * f]);
      if (e.estrecho) [1, 2].forEach(i => { const [x, y] = bp[i]; ctx.strokeStyle = "rgba(127,29,29,.9)"; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(x, y, 62, 22, .85, 0, 6.3); ctx.stroke(); });
      if (e.ancho) { const [x, y] = bp[2]; ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 6; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.ellipse(x, y, 110, 70, .85, 0, 6.3); ctx.stroke(); ctx.setLineDash([]); }
      if (e.moco || e.tapon) { const [x, y] = bp[e.tapon ? 2 : 1]; const q = ctx.createRadialGradient(x, y, 4, x, y, e.tapon ? 70 : 46); q.addColorStop(0, "rgba(234,220,140,.95)"); q.addColorStop(1, "rgba(200,180,90,0)"); ctx.fillStyle = q; ctx.beginPath(); ctx.arc(x, y, e.tapon ? 70 : 46, 0, 6.3); ctx.fill(); }
      // burbujas de aire que entran al inspirar y salen al espirar (no pasan si el bronquio está tapado o el pulmón colapsado)
      const flujo = Math.cos(t * 2 * Math.PI / 4) * (e.amp > 0 && !e.tapon ? 1 : 0) * (e.estrecho ? .45 : 1);
      if (Math.abs(flujo) > .2 && Math.random() < dt * 14 * Math.abs(flujo)) burb.push({ u: flujo > 0 ? 0 : 1, d: Math.sign(flujo), o: (Math.random() - .5) * 30 });
      for (let i = burb.length - 1; i >= 0; i--) {
        const b = burb[i]; b.u += b.d * dt * .55; if (b.u < 0 || b.u > 1) { burb.splice(i, 1); continue; }
        const seg = Math.min(2, Math.floor(b.u * 3)), fr = b.u * 3 - seg, [x0, y0] = bp[seg], [x1, y1] = bp[seg + 1];
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(x0 + (x1 - x0) * fr + b.o, y0 + (y1 - y0) * fr, 7, 0, 6.3); ctx.fill();
      }
      // qué hay en el alvéolo
      ctx.font = "700 34px Helvetica, Arial, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const l2 = e.txt; ctx.font = "600 27px Helvetica, Arial, sans-serif"; const w = Math.max(ctx.measureText(l2).width, 300) + 48;
      ctx.fillStyle = "rgba(255,255,255,.93)"; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(W - w - 28, 26, w, 98, 22) : ctx.rect(W - w - 28, 26, w, 98); ctx.fill();
      ctx.font = "700 34px Helvetica, Arial, sans-serif"; ctx.fillStyle = "#0F172A"; ctx.fillText(s.corto || s.nombre, W - w - 4, 70);
      ctx.font = "600 27px Helvetica, Arial, sans-serif"; ctx.fillStyle = "#475569"; ctx.fillText(l2, W - w - 4, 107);
    }
    (function bucle(t) {
      if (!cv.isConnected) return;
      const dt = Math.min(.1, (t - (tPrev || t)) / 1000); tPrev = t; pintar(window.UTIL.sel.id, t / 1000, dt); requestAnimationFrame(bucle);
    })(performance.now());
    return { medir };
  };
})();
