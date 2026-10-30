/* Starling y edema — vista «Realista»: la ilustración (escena.webp, hecha con ChatGPT) de fondo y, encima, una capa
   viva que sigue el mismo cálculo de motor.js: el agua sale por las hendiduras entre células endoteliales, vuelve en
   el extremo venoso, la linfa la retira y el intersticio se llena. También el gráfico «Tira y afloja» de las fuerzas.
   Coordenadas en píxeles de la ilustración (1672 × 941); el capilar baja un poco de izquierda (arterial) a derecha (venoso). */
(function () {
  "use strict";
  const U = window.UTIL, E = U.E, f = U.f, clamp = U.clamp;
  const W = 1672, H = 941;
  const up = x => 270 + 0.084 * x, lo = x => 505 + 0.10 * x, MEDIA = 28;   // centro de cada pared y su media altura
  const XA = 20, XB = 1652, Xde = s => XA + s * (XB - XA), sDe = X => (X - XA) / (XB - XA);
  // hendiduras visibles en la ilustración (lado −1 = pared de arriba, +1 = de abajo) y poros «virtuales» repartidos
  const HEND = [[507, -1], [987, -1], [1280, -1], [507, 1], [960, 1]];
  const POROS = HEND.map(([x, l]) => ({ x, l, w: 3 }));
  for (let x = 120; x < 1620; x += 130) for (const l of [-1, 1]) if (!HEND.some(h => h[1] === l && Math.abs(h[0] - x) < 70)) POROS.push({ x, l, w: 1 });
  const BOCA = [1133, 152], LINF = [[1133, 152], [1260, 140], [1400, 105], [1560, 60], [1690, 20]];   // boca y luz del linfático
  const pared = (X, l) => l < 0 ? up(X) - MEDIA : lo(X) + MEDIA;            // borde de la pared que da al intersticio
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* sprites: un punto luminoso por color, dibujado una vez (más barato que shadowBlur en cada cuadro) */
  const SPR = {};
  function sprite(col, r) {
    const k = col + r; if (SPR[k]) return SPR[k];
    const c = document.createElement("canvas"), s = r * 4; c.width = c.height = s; const x = c.getContext("2d");
    const g = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.22, col); g.addColorStop(0.55, col.replace(/[\d.]+\)$/, ".35)")); g.addColorStop(1, col.replace(/[\d.]+\)$/, "0)"));
    x.fillStyle = g; x.fillRect(0, 0, s, s); return (SPR[k] = c);
  }
  const AZUL = "rgba(37,99,235,1)", VERDE = "rgba(22,163,74,1)", AMAR = "rgba(234,179,8,1)", MORADO = "rgba(147,51,234,1)";

  /* estado de la capa viva (se reinicia al entrar a la pestaña) */
  let P = null;
  function nuevo() { P = { alb: [], gotas: [], charco: [], acc: { sale: 0, entra: 0, linfa: 0, prot: 0 }, t: 0 }; }

  function region(ctx, l) {   // intersticio de arriba (l = −1) o de abajo (+1), sin el capilar
    ctx.beginPath();
    if (l < 0) { ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, pared(W, -1)); ctx.lineTo(0, pared(0, -1)); }
    else { ctx.moveTo(0, pared(0, 1)); ctx.lineTo(W, pared(W, 1)); ctx.lineTo(W, H); ctx.lineTo(0, H); }
    ctx.closePath();
  }
  function luz(ctx) { ctx.beginPath(); ctx.moveTo(0, up(0) + MEDIA); ctx.lineTo(W, up(W) + MEDIA); ctx.lineTo(W, lo(W) - MEDIA); ctx.lineTo(0, lo(0) - MEDIA); ctx.closePath(); }

  /* elige un poro con probabilidad ∝ presión neta a favor (sale > 0) o en contra (vuelve < 0) */
  function poro(p, c, V, signo) {
    let tot = 0; const w = POROS.map(q => { const v = Math.max(0, signo * E.ndp(p, c, sDe(q.x), V)) * q.w; tot += v; return v; });
    if (tot <= 0) return null; let r = Math.random() * tot, i = 0; while (i < w.length - 1 && (r -= w[i]) > 0) i++; return POROS[i];
  }

  function cuadro(ctx, escala, S, c, dt) {
    if (!P) nuevo();
    const p = S.p, V = S.V, fl = E.flujos(p, c, V), li = E.linfa(p, c, V);
    P.t += dt;
    ctx.setTransform(escala, 0, 0, escala, 0, 0); ctx.clearRect(0, 0, W, H);

    // 1. velos: atenúan lo que la ilustración trae fijo (gotitas, albúmina) para que mande la capa viva
    ctx.fillStyle = "rgba(252,243,230,.30)"; region(ctx, -1); ctx.fill(); region(ctx, 1); ctx.fill();
    ctx.fillStyle = "rgba(127,29,29,.26)"; luz(ctx); ctx.fill();

    // 2. líquido acumulado en el intersticio: un azul que crece desde la pared hacia afuera
    const sw = clamp(V / (c.id === "sis" ? 10 : 1.6), 0, 1), alcance = 70 + 330 * sw;
    if (V > 0.02) for (const l of [-1, 1]) {
      const ya = pared(W / 2, l), g = ctx.createLinearGradient(0, ya, 0, ya + l * alcance);
      g.addColorStop(0, `rgba(56,189,248,${0.18 + 0.42 * sw})`); g.addColorStop(1, "rgba(56,189,248,0)");
      ctx.save(); region(ctx, l); ctx.clip(); ctx.fillStyle = g;
      ctx.beginPath(); for (let X = 0; X <= W; X += 24) { const y = pared(X, l) + l * (alcance + Math.sin(X / 90 + P.t * 1.4) * 14); X ? ctx.lineTo(X, y) : ctx.moveTo(X, y); }
      ctx.lineTo(W, pared(W, l) - l * 40); ctx.lineTo(0, pared(0, l) - l * 40); ctx.closePath(); ctx.fill(); ctx.restore();
    }

    // 3. hendiduras: brillan rojo si por ahí sale el agua, verde si vuelve; más anchas si sube la permeabilidad
    for (const [X, l] of HEND) {
      const v = E.ndp(p, c, sDe(X), V), a = clamp(Math.abs(v) / 25, 0.15, 1), r = (14 + 8 * (p.perm - 1)) * (1 + 0.12 * Math.sin(P.t * 5 + X));
      ctx.globalAlpha = a; ctx.drawImage(sprite(v > 0 ? "rgba(239,68,68,1)" : "rgba(34,197,94,1)", r), X - 2 * r, (l < 0 ? up(X) : lo(X)) - 2 * r, 4 * r, 4 * r);
    }
    ctx.globalAlpha = 1;

    // 4. la sangre corre: albúmina viva (cuántas = cuánta albúmina) y estelas de plasma
    const nAlb = Math.round(p.alb * 10), vel = 150;
    while (P.alb.length < nAlb) P.alb.push({ X: rnd(0, W), f: rnd(0.12, 0.88), e: Math.random() < 0.3 });
    while (P.alb.length > nAlb) P.alb.pop();
    for (const a of P.alb) {
      a.X += vel * (a.e ? 1.6 : 1) * dt; if (a.X > W + 10) { a.X = -10; a.f = rnd(0.12, 0.88); }
      const y = up(a.X) + MEDIA + a.f * (lo(a.X) - up(a.X) - 2 * MEDIA);
      if (a.e) { ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.X - 46, y - 46 * 0.09); ctx.lineTo(a.X, y); ctx.stroke(); }
      else ctx.drawImage(sprite(AMAR, 6), a.X - 12, y - 12, 24, 24);
    }

    // 5. gotas nuevas según las fuerzas (mismas tasas que el esquema)
    const tasa = x => clamp(20 * x / c.L0, 0, 240);
    P.acc.sale += tasa(fl.sale) * dt; P.acc.entra += tasa(fl.entra) * dt; P.acc.linfa += tasa(li) * 0.6 * dt; P.acc.prot += clamp((p.perm - 1.2) * 6, 0, 14) * dt;
    const lleno = () => P.gotas.length > 460;
    while (P.acc.sale >= 1 && !lleno()) { P.acc.sale--; const q = poro(p, c, V, 1); if (!q) break; const X = q.x + rnd(-10, 10); P.gotas.push({ t: "sale", X, y: pared(X, q.l), l: q.l, d: rnd(60, 150 + 200 * sw), y0: pared(X, q.l), vy: q.l * rnd(60, 115), vx: rnd(-55, 55) }); }
    while (P.acc.entra >= 1 && !lleno()) { P.acc.entra--; const q = poro(p, c, V, -1); if (!q) break; const X = q.x + rnd(-40, 40), d = rnd(60, 140); P.gotas.push({ t: "entra", X, y: pared(X, q.l) + q.l * d, l: q.l, vy: -q.l * rnd(70, 110), vx: (q.x - X) / d * 90 }); }
    while (P.acc.linfa >= 1 && !lleno()) { P.acc.linfa--; P.gotas.push({ t: "linfa", X: rnd(700, 1180), y: rnd(40, pared(900, -1) - 20), k: 0 }); }
    while (P.acc.prot >= 1 && !lleno()) { P.acc.prot--; const q = POROS[Math.floor(Math.random() * POROS.length)]; P.gotas.push({ t: "prot", X: q.x, y: pared(q.x, q.l), l: q.l, d: rnd(50, 140), y0: pared(q.x, q.l), vy: q.l * rnd(45, 70), vx: rnd(-10, 10) }); }

    // 6. mover y dibujar las gotas
    for (let i = P.gotas.length - 1; i >= 0; i--) {
      const g = P.gotas[i]; let fin = false, spr, r = 7, alfa = 1;
      if (g.t === "sale" || g.t === "prot") {
        g.X += g.vx * dt; g.y += g.vy * dt; const rec = Math.abs(g.y - g.y0) / g.d;
        if (rec >= 1) { fin = true; if (g.t === "sale" && P.charco.length < 40 + 260 * sw) P.charco.push({ X: g.X, y: g.y, vx: rnd(-8, 8), vy: rnd(-8, 8), l: g.l }); }
        alfa = rec > 0.75 ? (1 - rec) * 4 : 1; spr = g.t === "prot" ? sprite(AMAR, 7) : sprite(AZUL, 7);
      } else if (g.t === "entra") {
        g.X += g.vx * dt; g.y += g.vy * dt; if ((g.l < 0 && g.y >= up(g.X)) || (g.l > 0 && g.y <= lo(g.X))) fin = true; spr = sprite(VERDE, 7);
      } else {                                                   // linfa: va a la boca y corre por el linfático
        spr = sprite(MORADO, 7);
        const dest = g.k === 0 ? BOCA : LINF[g.k] || null;
        if (!dest) fin = true; else { const dx = dest[0] - g.X, dy = dest[1] - g.y, d = Math.hypot(dx, dy), v = g.k ? 170 : 95;
          if (d < 10) g.k++; else { g.X += dx / d * v * dt; g.y += dy / d * v * dt; } }
      }
      if (fin) { P.gotas.splice(i, 1); continue; }
      ctx.globalAlpha = alfa; ctx.drawImage(spr, g.X - 2 * r, g.y - 2 * r, 4 * r, 4 * r);
    }
    ctx.globalAlpha = 1;

    // 7. charco: el agua que se quedó en el intersticio flota (más gotas = más edema); la linfa se lleva algunas
    const objetivo = Math.round(260 * Math.sqrt(clamp(V / c.Vmax * 2.5, 0, 1)));
    while (P.charco.length > objetivo) P.charco.shift();
    for (const q of P.charco) {
      q.X += q.vx * dt; q.y += q.vy * dt;
      if (q.X < 0 || q.X > W) q.vx = -q.vx;
      const yp = pared(q.X, q.l); if ((q.l < 0 && (q.y > yp || q.y < 8)) || (q.l > 0 && (q.y < yp || q.y > H - 8))) q.vy = -q.vy;
      ctx.globalAlpha = 0.75; ctx.drawImage(sprite("rgba(14,165,233,1)", 6), q.X - 12, q.y - 12, 24, 24);
    }
    ctx.globalAlpha = 1;
  }

  /* rótulos HTML sobre la ilustración (texto nítido, se actualizan cada pocos cuadros) */
  function etiquetas(host, S, c) {
    const p = S.p, V = S.V, fl = E.flujos(p, c, V), li = E.linfa(p, c, V), e = E.estado(V, c), ed = V >= (c.id === "sis" ? 5 : 0.6);
    host.innerHTML = `
      <span class="et" style="left:2%;top:41%">ARTERIAL <b class="sa">↑↓ sale ${f(fl.sale, 1)}</b></span>
      <span class="et" style="right:2%;top:61%">VENOSO <b class="vu">vuelve ${f(fl.entra, 1)}</b></span>
      <span class="et mo" style="left:63%;top:3%">linfático <b>${f(li, 1)} L/día</b></span>
      <span class="et cl" style="left:2%;top:3%">intersticio</span>
      <span class="et ${ed ? "ro" : "cl"}" style="left:2%;bottom:3%">${ed ? "🔴 " : ""}${e.txt.split(":")[0]} · ${f(V, c.id === "sis" ? 1 : 2)} L</span>`;
  }

  /* «Tira y afloja»: las fuerzas de Starling como cuerdas, en el extremo arterial y en el venoso.
     A la derecha lo que saca agua del capilar, a la izquierda lo que la retiene o la devuelve. */
  function tira(host, S, c) {
    const p = S.p, V = S.V, s = E.sigma(p.perm), piP = E.piP(p.alb), PiE = p.Pi + c.kPi * V, M = 50;
    const lado = (x, nombre) => {
      const Pc = p.Pv + c.caida * (1 - x), net = E.ndp(p, c, x, V);
      const afuera = [["Presión capilar", Pc, "ro"], ["Oncótica del intersticio", s * p.pii, "na"]];
      const adentro = [["Oncótica del plasma (albúmina)", s * piP, "az"]];
      (PiE >= 0 ? adentro : afuera).push([PiE >= 0 ? "Presión del intersticio" : "Succión del intersticio", Math.abs(PiE), PiE >= 0 ? "gr" : "na"]);
      const barra = ([t, v, k], dir) => `<div class="tb ${dir}"><i class="${k}" style="width:${clamp(v / M * 100, 0, 100)}%"></i><span>${t} <b>${f(v, 0)}</b></span></div>`;
      const sale = net > 0.5, vuelve = net < -0.5;
      return `<div class="tl"><h4>${nombre}</h4>
        <div class="tcols"><div class="tc izq"><small>← retienen / devuelven</small>${adentro.map(b => barra(b, "izq")).join("")}</div>
        <div class="tc der"><small>sacan agua →</small>${afuera.map(b => barra(b, "der")).join("")}</div></div>
        <div class="tnet ${sale ? "sa" : vuelve ? "vu" : ""}"><span class="fl">${sale ? "➜" : vuelve ? "⬅" : "⇄"}</span> neta <b>${net > 0 ? "+" : ""}${f(net, 0)} mmHg</b> · ${sale ? "el agua <b>sale</b> al intersticio" : vuelve ? "el agua <b>vuelve</b> al capilar" : "casi en equilibrio"}</div></div>`;
    };
    host.innerHTML = lado(0, "Extremo arterial") + lado(1, "Extremo venoso");
  }

  U.real = { W, H, cuadro, etiquetas, nuevo };
  U.tira = tira;
})();
