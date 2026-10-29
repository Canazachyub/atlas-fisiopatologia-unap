/* Motor del ECG: el corazón como un dipolo que gira en el tiempo.
   Cada onda es una suma de componentes (gaussianas en el tiempo) con una dirección en 3D:
   x = izquierda del paciente, y = abajo (inferior), z = adelante (anterior).
   Cada derivación es la proyección de ese vector sobre su eje (producto escalar), así que
   DI + DIII = DII y aVR + aVL + aVF = 0 se cumplen solos, igual que en el papel.
   Sobre cualquier ritmo se pueden aplicar el potasio (cfg.k, mEq/L) y el calcio (cfg.ca, mg/dL),
   y el infarto puede evolucionar en el tiempo (cfg.horas). */
(function () {
  "use strict";
  const rad = g => g * Math.PI / 180;
  const uni = (x, y, z) => { const m = Math.hypot(x, y, z) || 1; return [x / m, y / m, z / m]; };
  const fr = g => [Math.cos(rad(g)), Math.sin(rad(g)), 0];           // eje en el plano frontal
  const ho = g => [Math.cos(rad(g)), 0, Math.sin(rad(g))];           // eje en el plano horizontal
  const DER = {
    DI: { eje: fr(0), g: 1, plano: "f", ang: 0 }, DII: { eje: fr(60), g: 1, plano: "f", ang: 60 },
    DIII: { eje: fr(120), g: 1, plano: "f", ang: 120 }, aVR: { eje: fr(-150), g: 1, plano: "f", ang: -150 },
    aVL: { eje: fr(-30), g: 1, plano: "f", ang: -30 }, aVF: { eje: fr(90), g: 1, plano: "f", ang: 90 },
    V1: { eje: ho(115), g: 1.6, plano: "h", ang: 115 }, V2: { eje: ho(95), g: 1.75, plano: "h", ang: 95 },
    V3: { eje: ho(75), g: 1.7, plano: "h", ang: 75 }, V4: { eje: ho(58), g: 1.65, plano: "h", ang: 58 },
    V5: { eje: ho(30), g: 1.5, plano: "h", ang: 30 }, V6: { eje: ho(0), g: 1.3, plano: "h", ang: 0 },
    V7: { eje: ho(-30), g: 1.0, plano: "h", ang: -30 }, V8: { eje: ho(-60), g: 0.9, plano: "h", ang: -60 }
  };
  const LISTA12 = ["DI", "DII", "DIII", "aVR", "aVL", "aVF", "V1", "V2", "V3", "V4", "V5", "V6"];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const lim = (x, a, b) => Math.max(a, Math.min(b, x));
  // gaussiana asimétrica: s1 antes del pico, s2 después
  const ga = (t, c, s1, s2) => { const d = t - c, s = d < 0 ? s1 : (s2 || s1); return Math.exp(-0.5 * d * d / (s * s)); };

  /* ---------- morfologías (componentes de cada onda) ---------- */
  function pNormal() {
    return [{ c: 0.035, s: 0.017, a: 0.11, d: uni(0.25, 0.9, 0.45) },      // aurícula derecha: abajo y adelante
            { c: 0.062, s: 0.018, a: 0.09, d: uni(0.85, 0.35, -0.5) }];    // aurícula izquierda: a la izquierda y atrás
  }
  function qrsNormal() {
    return [{ c: 0.012, s: 0.006, a: 0.26, d: uni(-0.6, 0.3, 0.75) },        // septo: de izquierda a derecha y adelante
            { c: 0.040, s: 0.011, a: 1.55, d: uni(0.55, 0.75, -0.2) },      // pared libre del VI: abajo, izquierda, atrás
            { c: 0.066, s: 0.008, a: 0.42, d: uni(-0.4, -0.6, -0.65) }];     // bases: arriba, derecha, atrás
  }
  const T_NORMAL = { a: 0.33, d: uni(0.6, 0.62, 0.3) };
  // latido nacido en el ventrículo (extrasístole, taquicardia ventricular): ancho, raro, T opuesta
  function qrsVentricular(signo) {
    const s = signo || 1;
    return [{ c: 0.05, s: 0.025, a: 2.4 * s, d: uni(0.55, -0.6, -0.55) },
            { c: 0.115, s: 0.022, a: 0.75 * s, d: uni(-0.6, 0.45, 0.65) }];
  }

  /* ---------- catálogo de ritmos y patrones ---------- */
  const PATRONES = {
    normal: { nombre: "Ritmo sinusal normal", grupo: "Normal", fc: 75 },
    taqui: { nombre: "Taquicardia sinusal", grupo: "Ritmo sinusal", fc: 125, pr: 0.13 },
    bradi: { nombre: "Bradicardia sinusal", grupo: "Ritmo sinusal", fc: 48, pr: 0.19 },
    arritmia: { nombre: "Arritmia sinusal (respiratoria)", grupo: "Ritmo sinusal", fc: 72 },
    esa: { nombre: "Extrasístoles auriculares", grupo: "Extrasístoles", fc: 78 },
    esv: { nombre: "Extrasístoles ventriculares", grupo: "Extrasístoles", fc: 75 },
    bigem: { nombre: "Bigeminismo ventricular", grupo: "Extrasístoles", fc: 72 },
    bav1: { nombre: "BAV de 1.er grado", grupo: "Bloqueos AV", fc: 70, pr: 0.28 },
    mobitz1: { nombre: "BAV 2.º grado Mobitz I (Wenckebach)", grupo: "Bloqueos AV", fc: 80 },
    mobitz2: { nombre: "BAV 2.º grado Mobitz II", grupo: "Bloqueos AV", fc: 96, pr: 0.16 },
    bav3: { nombre: "BAV de 3.er grado (completo)", grupo: "Bloqueos AV", fc: 80 },
    fa: { nombre: "Fibrilación auricular", grupo: "Taquiarritmias", fc: 115 },
    flutter: { nombre: "Flutter (aleteo) auricular", grupo: "Taquiarritmias", fc: 75 },
    tsv: { nombre: "Taquicardia supraventricular paroxística", grupo: "Taquiarritmias", fc: 180 },
    tv: { nombre: "Taquicardia ventricular", grupo: "Taquiarritmias", fc: 170 },
    torsades: { nombre: "Torsades de pointes", grupo: "Taquiarritmias", fc: 230 },
    fv: { nombre: "Fibrilación ventricular", grupo: "Paro cardiaco", fc: 0 },
    asistolia: { nombre: "Asistolia", grupo: "Paro cardiaco", fc: 0 },
    bcrd: { nombre: "Bloqueo completo de rama derecha", grupo: "Bloqueos de rama", fc: 72 },
    bcri: { nombre: "Bloqueo completo de rama izquierda", grupo: "Bloqueos de rama", fc: 72 },
    wpw: { nombre: "Wolff-Parkinson-White (preexcitación)", grupo: "Bloqueos de rama", fc: 75, pr: 0.1 },
    had: { nombre: "Hipertrofia auricular derecha (P pulmonar)", grupo: "Hipertrofias", fc: 82 },
    hai: { nombre: "Hipertrofia auricular izquierda (P mitrale)", grupo: "Hipertrofias", fc: 74 },
    hvd: { nombre: "Hipertrofia ventricular derecha", grupo: "Hipertrofias", fc: 80 },
    hvi: { nombre: "Hipertrofia ventricular izquierda", grupo: "Hipertrofias", fc: 72 },
    iam: { nombre: "Infarto de miocardio", grupo: "Infarto y pericardio", fc: 84 },
    pericarditis: { nombre: "Pericarditis aguda", grupo: "Infarto y pericardio", fc: 96 }
  };
  // regiones del infarto: derivaciones que miran la zona, las de imagen en espejo y la arteria culpable
  const REGIONES = {
    anteroseptal: { nombre: "Anteroseptal", ve: ["V1", "V2", "V3", "V4"], espejo: ["DII", "DIII", "aVF"], arteria: "Descendente anterior (DA)" },
    anterolateral: { nombre: "Anterolateral", ve: ["DI", "aVL", "V4", "V5", "V6"], espejo: ["DIII", "aVF"], arteria: "DA (diagonal) o circunfleja" },
    lateral: { nombre: "Lateral alto", ve: ["DI", "aVL"], espejo: ["DII", "DIII", "aVF"], arteria: "Circunfleja (Cx)" },
    extenso: { nombre: "Anterior extenso", ve: ["DI", "aVL", "V1", "V2", "V3", "V4", "V5", "V6"], espejo: ["DII", "DIII", "aVF"], arteria: "DA proximal" },
    inferior: { nombre: "Inferior (diafragmático)", ve: ["DII", "DIII", "aVF"], espejo: ["DI", "aVL"], arteria: "Coronaria derecha (CD)" },
    posterior: { nombre: "Dorsal (posterior)", ve: ["V7", "V8"], espejo: ["V1", "V2", "V3"], arteria: "CD o circunfleja" }
  };
  const FASES = {
    isq_epi: "Isquemia subepicárdica: T negativa, simétrica y puntiaguda",
    isq_endo: "Isquemia subendocárdica: T positiva, alta y simétrica",
    les_epi: "Lesión subepicárdica: ST supradesnivelado",
    les_endo: "Lesión subendocárdica: ST infradesnivelado",
    necrosis: "Necrosis: onda Q patológica + T invertida, ST vuelve a la línea",
    antiguo: "Infarto antiguo: queda la onda Q (para siempre)"
  };
  const ANORMALES = ["fv", "asistolia"];   // sin latidos organizados

  /* ---------- electrolitos: cuánto cambia cada onda ---------- */
  function electro(cfg) {
    const K = cfg.k ?? 4.2, Ca = cfg.ca ?? 9.5, r = { pA: 1, prMas: 0, qrsW: 1, tA: 1, tS: 1, u: 0, st: 0, qtF: 1, senoidal: 0 };
    if (K > 5.5) {
      const f = lim((K - 5.5) / 3, 0, 1.3);
      r.tA = 1 + 2.1 * f; r.tS = 1 - 0.45 * Math.min(1, f);                 // T alta, picuda y simétrica
      if (K > 6.5) { r.pA = lim(1 - (K - 6.5) / 1.6, 0, 1); r.prMas = lim(0.035 * (K - 6.5), 0, 0.08); }  // P se aplana, PR se alarga
      if (K > 7) r.qrsW = 1 + 0.42 * (K - 7);                                // QRS se ensancha
      if (K > 8.5) r.senoidal = lim((K - 8.5) / 1, 0, 1);                   // onda sinusoidal: QRS y T se funden
    } else if (K < 3.5) {
      const g = lim((3.5 - K) / 1.8, 0, 1.2);
      r.tA = 1 - 0.8 * Math.min(1, g); r.u = 0.04 + 0.16 * g; r.st = -0.06 * g; r.pA = 1 + 0.25 * g;   // T plana, onda U, ST infra
    }
    r.qtF = lim(1 + (9.5 - Ca) * 0.06, 0.78, 1.3);   // calcio bajo alarga el ST (QT largo); alto lo acorta
    return r;
  }

  /* ---------- construir un ECG: lista de latidos en el tiempo ---------- */
  function construir(cfg, dur) {
    cfg = Object.assign({ tipo: "normal" }, cfg);
    const pat = PATRONES[cfg.tipo] || PATRONES.normal;
    const fc = cfg.fc || pat.fc || 75, rr = 60 / fc, el = electro(cfg);
    const L = [];
    let semilla = cfg.semilla || 7;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    let t = 0.25;
    const prBase = (cfg.pr || pat.pr || 0.16) + el.prMas;
    if (cfg.tipo === "fa") {
      while (t < dur) { L.push({ tq: t, conduce: true }); t += rr * (0.55 + azar() * 0.9); }
    } else if (cfg.tipo === "flutter") {
      // circuito en la aurícula derecha a 300/min (una F cada 0.20 s); el nódulo AV deja pasar 2:1, 3:1 o 4:1
      const cond = cfg.cond || (fc >= 130 ? 2 : fc >= 90 ? 3 : 4); cfg.cond = cond;
      for (let k = 0; t < dur; k++, t += 0.2 * cond) L.push({ tq: t + 0.13, conduce: true });
    } else if (cfg.tipo === "tsv") {
      while (t < dur) { L.push({ tq: t, conduce: true, pOculta: true }); t += rr; }
    } else if (cfg.tipo === "tv" || cfg.tipo === "torsades") {
      while (t < dur) { L.push({ tq: t, conduce: true, ectopico: "v" }); t += rr * (cfg.tipo === "torsades" ? 0.9 + azar() * 0.2 : 1); }
      if (cfg.tipo === "tv") for (let tp = 0.4; tp < dur; tp += 60 / 78) L.push({ tp, conduce: false, sola: true });   // disociación AV
    } else if (ANORMALES.includes(cfg.tipo)) {
      // sin latidos: la actividad la dibuja valor()
    } else if (cfg.tipo === "bav3") {
      const ra = 60 / fc, rv = 60 / (cfg.fcv || 36);
      for (let tp = 0.1; tp < dur; tp += ra) L.push({ tp, conduce: false, sola: true });
      for (let tq = 0.55; tq < dur; tq += rv) L.push({ tq, conduce: true, escape: true });
    } else if (cfg.tipo === "mobitz1") {
      let k = 0, pr = 0.18 + el.prMas;
      while (t < dur) {
        if (k === 3) { L.push({ tp: t, conduce: false, bloqueada: true }); k = 0; pr = 0.18 + el.prMas; }
        else { L.push({ tp: t, tq: t + pr, pr, conduce: true }); pr += 0.07; k++; }
        t += rr;
      }
    } else if (cfg.tipo === "mobitz2") {
      let k = 0;
      while (t < dur) {
        if (k % 2 === 1) L.push({ tp: t, conduce: false, bloqueada: true });
        else L.push({ tp: t, tq: t + prBase, pr: prBase, conduce: true });
        k++; t += rr;
      }
    } else if (cfg.tipo === "esv" || cfg.tipo === "bigem") {
      // la P sinusal sigue a su ritmo; la extrasístole ventricular se adelanta y la P siguiente queda escondida:
      // pausa compensadora completa (dos ciclos)
      for (let k = 0; t < dur; k++, t += rr) {
        const ect = cfg.tipo === "bigem" ? k % 2 === 1 : k % 5 === 3;
        if (ect) { L.push({ tq: t + prBase - 0.38 * rr, conduce: true, ectopico: "v" }); L.push({ tp: t, conduce: false, oculta: true }); }
        else L.push({ tp: t, tq: t + prBase, pr: prBase, conduce: true });
      }
    } else if (cfg.tipo === "esa") {
      // la extrasístole auricular se adelanta con otra P y reinicia el nódulo sinusal: pausa no compensadora
      for (let k = 0; t < dur; k++) {
        if (k % 4 === 3) { const te = t - 0.35 * rr; L.push({ tp: te, tq: te + prBase, pr: prBase, conduce: true, pEct: true }); t = te + rr; }
        else { L.push({ tp: t, tq: t + prBase, pr: prBase, conduce: true }); t += rr; }
      }
    } else {
      while (t < dur) {
        let r = rr;
        if (cfg.tipo === "arritmia") r = rr * (1 - 0.22 * Math.sin(2 * Math.PI * t / 5));
        L.push({ tp: t, tq: t + prBase, pr: prBase, conduce: true, delta: cfg.tipo === "wpw" });
        t += r;
      }
    }
    L.sort((a, b) => (a.tp ?? a.tq) - (b.tp ?? b.tq));
    const qs = L.filter(x => x.tq != null).map(x => x.tq);
    L.forEach(x => { if (x.tq != null) { const i = qs.indexOf(x.tq); x.rr = i > 0 ? qs[i] - qs[i - 1] : (qs[1] - qs[0]) || rr; } });
    const fw = [];
    if (cfg.tipo === "fa") for (let i = 0; i < 6; i++) fw.push({ f: 5.5 + azar() * 3, ph: azar() * 6.28, a: 0.025 + azar() * 0.03 });
    if (cfg.tipo === "fv") for (let i = 0; i < 7; i++) fw.push({ f: 3.2 + azar() * 4, ph: azar() * 6.28, a: 0.12 + azar() * 0.18, d: uni(azar() - 0.5, azar() - 0.5, azar() - 0.5) });
    return { cfg, pat, latidos: L, fw, dur, el };
  }

  /* ---------- morfología de un latido según el patrón ---------- */
  function morfo(cfg, lat, el) {
    const tipo = cfg.tipo;
    el = el || electro(cfg);
    let P = pNormal(), Q = qrsNormal(), T = Object.assign({}, T_NORMAL), qrsDur = 0.09;
    if (tipo === "had") { P[0].a = 0.27; P[0].s = 0.015; }
    if (tipo === "hai") { P[1].a = 0.14; P[1].c = 0.092; P[1].s = 0.022; P[0].c = 0.03; }
    if (lat.pEct) P = [{ c: 0.045, s: 0.02, a: 0.13, d: uni(0.3, -0.75, 0.4) }];   // P de otro foco: distinta (aquí negativa en DII)
    if (tipo === "hvi") { Q[1].a = 2.6; Q[1].d = uni(0.85, 0.15, -0.5); Q[2].a = 0.3; T = { a: 0.28, d: uni(-0.7, 0.3, 0.2), strain: true }; }
    if (tipo === "hvd") { Q[1].a = 0.9; Q[1].d = uni(0.2, 0.9, -0.3); Q.push({ c: 0.055, s: 0.013, a: 1.4, d: uni(-0.55, 0.55, 0.65) }); T = { a: 0.25, d: uni(0.6, 0.6, -0.55) }; }
    if (tipo === "bcrd") {
      qrsDur = 0.14; Q[1].a = 1.3;
      Q.push({ c: 0.105, s: 0.018, a: 0.75, d: uni(-0.6, 0.15, 0.8) });
      T = { a: 0.2, d: uni(0.7, 0.4, -0.6) };
    }
    if (tipo === "bcri" || lat.escape) {
      qrsDur = 0.15;
      Q = [{ c: 0.03, s: 0.016, a: 0.5, d: uni(0.6, 0.2, -0.75) },
           { c: 0.075, s: 0.022, a: 1.7, d: uni(0.75, -0.05, -0.65) },
           { c: 0.11, s: 0.016, a: 0.6, d: uni(0.8, -0.15, -0.3) }];
      T = { a: 0.32, d: uni(-0.7, 0.1, 0.65) };
    }
    if (lat.delta) {   // haz de Kent: una parte del ventrículo se activa antes y lento → onda delta, PR corto, QRS ancho
      Q = Q.map(k => Object.assign({}, k, { c: k.c + 0.03 }));
      Q.unshift({ c: 0.022, s: 0.02, a: 0.42, d: uni(0.65, 0.55, -0.35) });
      qrsDur = 0.125; T = { a: 0.22, d: uni(0.2, 0.7, 0.55) };
    }
    if (lat.ectopico === "v") {
      let s = 1;
      if (tipo === "torsades") { const fase = Math.sin(2 * Math.PI * (lat.tq || 0) / 2.4); s = fase; }
      Q = qrsVentricular(s); qrsDur = 0.16;
      T = { a: 0.42 * (tipo === "torsades" ? 0.5 : 1), d: uni(-0.45, 0.65, 0.6) };
      if (tipo === "torsades") T.a *= Math.abs(s);
    }
    if (cfg.rotar) {
      const a = rad(cfg.rotar), c = Math.cos(a), s = Math.sin(a);
      const gira = d => [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]];
      Q = Q.map(k => Object.assign({}, k, { d: gira(k.d) })); T = Object.assign({}, T, { d: gira(T.d) });
    }
    if (cfg.amp) Q = Q.map(k => Object.assign({}, k, { a: k.a * cfg.amp }));
    // electrolitos
    if (el.pA !== 1) P = P.map(k => Object.assign({}, k, { a: k.a * el.pA }));
    if (el.qrsW !== 1) { Q = Q.map(k => Object.assign({}, k, { c: k.c * el.qrsW, s: k.s * el.qrsW })); qrsDur *= el.qrsW; }
    T = Object.assign({}, T, { a: T.a * el.tA, sF: el.tS });
    return { P, Q, T, qrsDur, u: el.u, stE: el.st, qtF: el.qtF, sen: el.senoidal };
  }
  const qtDe = (lat, m) => Math.min(0.56, Math.max(0.26, 0.4 * Math.sqrt(lat.rr || 0.8) * (m ? m.qtF : 1) + (m && m.qrsDur > 0.1 ? (m.qrsDur - 0.09) * 0.6 : 0)));

  /* ---------- valor de una derivación en el tiempo t (mV) ---------- */
  function valor(ecg, der, t) {
    const D = DER[der], cfg = ecg.cfg; let v = 0;
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq;
      if (t0 > t + 0.05) break;
      if ((lat.tq ?? t0) < t - 1.3 && (lat.tp ?? -9) < t - 0.3) continue;
      const m = lat._m || (lat._m = morfo(cfg, lat, ecg.el));
      if (lat.tp != null && cfg.tipo !== "fa" && cfg.tipo !== "flutter") {
        const dt = t - lat.tp;
        if (dt > -0.05 && dt < 0.25) for (const c of m.P) v += c.a * ga(dt, c.c, c.s) * dot(c.d, D.eje);
        if (cfg.tipo === "pericarditis" && lat.tq != null && dt > 0.1 && t < lat.tq) v -= 0.05 * Math.max(0, dot(uni(0.4, 0.8, 0.4), D.eje));   // PR descendido
      }
      if (lat.tq != null) {
        const dt = t - lat.tq;
        if (dt > -0.05 && dt < 1.0) {
          let q = 0;
          for (const c of m.Q) q += c.a * ga(dt, c.c, c.s) * dot(c.d, D.eje);
          const qt = qtDe(lat, m);
          const tPico = qt - 0.1 + (m.sen ? -0.06 * m.sen : 0), tm = m.T, sF = tm.sF || 1;
          let tv = tm.a * ga(dt, tPico, 0.055 * sF * (sF < 1 ? 0.75 : 1), 0.032 * (sF < 1 ? 1.05 : 1)) * dot(tm.d, D.eje);
          let st = 0;
          if (cfg.tipo === "iam") ({ q, tv, st } = cfg.horas != null ? evolucion(cfg, der, dt, q, tv, m.qrsDur, tPico) : infarto(cfg, der, dt, q, tv, m.qrsDur, tPico));
          if (tm.strain) st += -0.06 * Math.max(0, dot(uni(0.9, 0.1, -0.4), D.eje)) * ventanaST(dt, m.qrsDur, tPico);
          if (cfg.tipo === "pericarditis") {   // ST elevado cóncavo y difuso (todas menos aVR y V1), sin imagen en espejo ni Q
            const dd = dot(uni(0.45, 0.75, 0.45), D.eje);
            st += 0.17 * (dd > -0.2 ? Math.max(0.35, dd) : dd) * ventanaST(dt, m.qrsDur, tPico);
          }
          if (m.stE) st += m.stE * Math.max(0, dot(T_NORMAL.d, D.eje)) * ventanaST(dt, m.qrsDur, tPico);
          if (m.u) v += m.u * ga(dt, qt + 0.07, 0.04, 0.05) * dot(T_NORMAL.d, D.eje);   // onda U (hipopotasemia)
          if (m.sen) {   // K muy alto: el complejo se vuelve una onda sinusoidal lenta
            const ondaS = Math.sin(Math.PI * lim(dt / (qt + 0.05), 0, 1) * 2) * 0.9 * dot(uni(0.5, 0.75, 0.1), D.eje);
            q = q * (1 - m.sen) + ondaS * m.sen; tv *= 1 - m.sen;
          }
          v += q + tv + st;
        }
      }
    }
    if (cfg.tipo === "fa") for (const f of ecg.fw) v += f.a * Math.sin(2 * Math.PI * f.f * t + f.ph) * (0.4 + 0.6 * Math.abs(dot(uni(0.3, 0.8, 0.5), D.eje)));
    if (cfg.tipo === "flutter") {   // ondas F en diente de sierra: negativas en DII, DIII y aVF
      const fr = (t % 0.2) / 0.2, saw = fr < 0.72 ? -fr / 0.72 : -(1 - (fr - 0.72) / 0.28);
      v += 0.3 * (saw + 0.5) * dot(uni(0.15, 0.9, -0.35), D.eje);
    }
    if (cfg.tipo === "fv") { const env = 0.75 + 0.25 * Math.sin(2 * Math.PI * t / 3.3); for (const f of ecg.fw) v += env * f.a * Math.sin(2 * Math.PI * f.f * t + f.ph) * (0.5 + 0.8 * Math.abs(dot(f.d, D.eje))); }
    if (cfg.tipo === "asistolia") v += 0.012 * Math.sin(2 * Math.PI * 0.7 * t) + 0.006 * Math.sin(2 * Math.PI * 3.1 * t + 1);
    return v * D.g;
  }
  function ventanaST(dt, qrsDur, tPico) {
    if (dt < qrsDur - 0.01) return 0;
    if (dt < qrsDur + 0.01) return (dt - qrsDur + 0.01) / 0.02;
    return dt < tPico ? 1 : Math.max(0, 1 - (dt - tPico) / 0.09);
  }
  function infarto(cfg, der, dt, q, tv, qrsDur, tPico) {
    const R = REGIONES[cfg.region || "anteroseptal"], f = cfg.fase || "les_epi";
    const mira = R.ve.includes(der), esp = R.espejo.includes(der);
    let st = 0;
    if (!mira && !esp) return { q, tv, st };
    const s = mira ? 1 : -1, w = ventanaST(dt, qrsDur, tPico);
    const tSim = Math.exp(-0.5 * Math.pow((dt - tPico) / 0.045, 2));
    if (f === "isq_epi") tv = (mira ? -0.42 : 0.3) * tSim;
    if (f === "isq_endo") tv = (mira ? 0.6 : -0.15) * tSim;
    if (f === "les_epi") { st = s * 0.28 * w; tv = mira ? Math.max(tv, 0.12 * tSim) : tv * 0.5; }
    if (f === "les_endo") { st = -s * 0.2 * w; }
    if (f === "necrosis" || f === "antiguo") {
      if (mira) {
        const Qp = -0.45 * ga(dt, 0.022, 0.012, 0.014);
        q = q * 0.45 + Qp;
        tv = f === "necrosis" ? -0.32 * tSim : tv * 0.6;
        if (f === "necrosis") st = 0.05 * w;
      } else if (f === "necrosis") tv = 0.25 * tSim;
    }
    if (cfg.region === "posterior" && esp) {
      q += 0.6 * ga(dt, 0.04, 0.012) * (f === "necrosis" || f === "antiguo" ? 1 : 0.3);
      if (f === "les_epi") st = -0.22 * w;
    }
    return { q, tv, st };
  }
  /* infarto que evoluciona: cfg.horas desde la oclusión (0 = recién ocluida) */
  const PESOS = h => ({
    hiper: h < 0.25 ? lim(h / 0.05, 0, 1) : lim(1 - (h - 0.25) / 1.5, 0, 1),            // T hiperaguda: minutos
    st: h < 0.25 ? lim((h - 0.08) / 0.17, 0, 1) : h < 12 ? 1 : lim(1 - (h - 12) / 120, 0, 1),   // ST: desde minutos, baja en días
    q: lim((h - 6) / 30, 0, 1),                                                           // Q: desde horas; queda para siempre
    tinv: h < 24 ? 0 : h < 24 * 14 ? lim((h - 24) / 96, 0, 1) : lim(1 - (h - 24 * 14) / (24 * 365), 0.25, 1)   // T invertida: días a meses
  });
  function evolucion(cfg, der, dt, q, tv, qrsDur, tPico) {
    const R = REGIONES[cfg.region || "anteroseptal"], mira = R.ve.includes(der), esp = R.espejo.includes(der);
    let st = 0;
    if (!mira && !esp) return { q, tv, st };
    const p = PESOS(cfg.horas), w = ventanaST(dt, qrsDur, tPico), tSim = Math.exp(-0.5 * Math.pow((dt - tPico) / 0.05, 2));
    const s = mira ? 1 : -1;
    st = s * 0.32 * p.st * w;
    const tNueva = mira ? 0.55 * p.hiper * tSim - 0.38 * p.tinv * tSim : -0.12 * p.hiper * tSim + 0.22 * p.tinv * tSim;
    tv = tv * Math.max(0, 1 - p.hiper - p.tinv) + tNueva;
    if (mira) { q = q * (1 - 0.55 * p.q) - 0.45 * p.q * ga(dt, 0.022, 0.012, 0.014); }
    if (cfg.region === "posterior" && esp) q += 0.6 * p.q * ga(dt, 0.04, 0.012);
    return { q, tv, st };
  }

  /* ---------- momentos del ciclo (para animar el corazón) ---------- */
  function estado(ecg, t) {
    const cfg = ecg.cfg, tipo = cfg.tipo;
    const e = { aur: 0, sa: 0, av: 0, his: 0, rd: 0, ri: 0, purk: 0, ven: 0, vd: 0, vi: 0, rep: 0, bloqueo: 0, fa: tipo === "fa", escape: 0, aurFrente: 0, venFrente: 0, kent: 0 };
    if (tipo === "flutter") e.flutter = (t % 0.2) / 0.2;
    if (tipo === "fv") { e.fv = 1; return e; }
    if (tipo === "asistolia") return e;
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq; if (t0 > t + 0.02) break;
      const m = lat._m || (lat._m = morfo(cfg, lat, ecg.el));
      if (lat.tp != null && tipo !== "fa" && tipo !== "flutter") {
        const dt = t - lat.tp;
        if (dt >= 0 && dt < 0.03 && !lat.pEct) e.sa = 1;
        if (dt >= 0 && dt < 0.11) { e.aur = Math.max(e.aur, 1); e.aurFrente = dt / 0.1; e.pOn = 1; e.pEct = lat.pEct ? 1 : 0; }
        else if (dt >= 0.11 && dt < 0.3) e.aur = Math.max(e.aur, 1 - (dt - 0.11) / 0.19);
        const fin = lat.conduce && lat.tq != null ? lat.tq - lat.tp : 0.22;
        if (dt >= 0.07 && dt < fin) e.av = Math.max(e.av, 1);
        if (!lat.conduce && !lat.oculta && dt >= 0.12 && dt < 0.32) e.bloqueo = 1;
      }
      if (lat.tq != null) {
        const dt = t - lat.tq, ect = lat.ectopico === "v";
        if ((tipo === "fa" || tipo === "flutter" || tipo === "tsv") && dt >= -0.03 && dt < 0.01) e.av = 1;
        if ((lat.escape || ect) && dt >= -0.02 && dt < 0.04) e.escape = 1;
        if (lat.delta && dt >= -0.01 && dt < 0.05) e.kent = 1;
        if (!ect && dt >= -0.01 && dt < 0.02) e.his = 1;
        const lento = m.qrsDur > 0.12;
        if (!ect && dt >= 0 && dt < 0.035) { e.rd = tipo === "bcrd" ? 0 : 1; e.ri = tipo === "bcri" || lat.escape ? 0 : 1; }
        if (!ect && dt >= 0.015 && dt < 0.06) e.purk = 1;
        const dq = m.qrsDur;
        if (dt >= 0 && dt < dq) {
          e.ven = 1; e.venFrente = dt / dq;
          e.vi = tipo === "bcri" || lat.escape ? Math.max(0, (dt - 0.04) / (dq - 0.04)) : ect ? Math.min(1, dt / dq) : Math.min(1, dt / 0.06);
          e.vd = tipo === "bcrd" ? Math.max(0, (dt - 0.05) / (dq - 0.05)) : ect ? Math.max(0, (dt - 0.03) / (dq - 0.03)) : Math.min(1, dt / 0.05);
          if (lento) e.lento = 1;
        } else if (dt >= dq && dt < 0.42) { e.ven = 1; e.vi = e.vd = 1; e.meseta = 1; }
        const qt = qtDe(lat, m);
        if (dt >= qt - 0.17 && dt < qt + 0.05) { e.rep = Math.min(1, (dt - (qt - 0.17)) / 0.2); e.vi = e.vd = 1 - e.rep; e.ven = 1 - e.rep; }
      }
    }
    return e;
  }

  // ¿qué onda se está dibujando en t? (para el letrero del simulador)
  function onda(ecg, t) {
    const tipo = ecg.cfg.tipo;
    if (tipo === "fv") return { n: "Fibrilación ventricular: ondas caóticas, sin QRS — paro cardiaco", k: "FV" };
    if (tipo === "asistolia") return { n: "Asistolia: no hay actividad eléctrica — paro cardiaco", k: "0" };
    let r = { n: "Línea de base (diástole)", k: "base" };
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq; if (t0 > t + 0.01) break;
      const m = lat._m || (lat._m = morfo(ecg.cfg, lat, ecg.el));
      if (lat.tp != null && tipo !== "fa" && tipo !== "flutter") {
        const dt = t - lat.tp;
        if (dt >= 0 && dt < 0.105) r = lat.pEct ? { n: "P adelantada y distinta: extrasístole auricular", k: "P'" } : lat.oculta ? { n: "P sinusal escondida en la extrasístole", k: "P" } : { n: "Onda P: despolarización auricular", k: "P" };
        else if (dt >= 0.105 && lat.tq != null && t < lat.tq) r = { n: lat.delta ? "PR corto: el haz de Kent se salta el nódulo AV" : "Segmento PR: el impulso se frena en el nódulo AV", k: "PR" };
        else if (dt >= 0.105 && dt < 0.3 && !lat.conduce && !lat.sola && !lat.oculta) r = { n: "Onda P bloqueada: no pasa del nódulo AV (no hay QRS)", k: "BL" };
      }
      if (lat.tq != null) {
        const dt = t - lat.tq, qt = qtDe(lat, m);
        if (dt >= 0 && dt < m.qrsDur) r = lat.ectopico === "v" ? { n: tipo === "esv" || tipo === "bigem" ? "Extrasístole ventricular: QRS ancho, adelantado y sin P" : "QRS ancho de origen ventricular", k: "QRS'" }
          : lat.delta && dt < 0.04 ? { n: "Onda delta: el ventrículo se activa antes por la vía accesoria", k: "δ" } : { n: "Complejo QRS: despolarización ventricular", k: "QRS" };
        else if (dt >= m.qrsDur && dt < qt - 0.17) r = { n: "Segmento ST: ventrículos despolarizados (meseta)", k: "ST" };
        else if (dt >= qt - 0.17 && dt < qt + 0.02) r = { n: "Onda T: repolarización ventricular", k: "T" };
        else if (m.u && dt >= qt + 0.02 && dt < qt + 0.14) r = { n: "Onda U: típica de la hipopotasemia", k: "U" };
      }
    }
    if (tipo === "fa" && r.k === "base") r = { n: "Ondas f: aurículas fibrilando a 400-600 lpm", k: "f" };
    if (tipo === "flutter" && r.k !== "QRS" && r.k !== "T" && r.k !== "ST") r = { n: "Ondas F en diente de sierra: circuito auricular a 300/min", k: "F" };
    return r;
  }

  window.ECG = { DER, LISTA12, PATRONES, REGIONES, FASES, PESOS, qt: qtDe, construir, valor, estado, onda, morfo, electro, uni, dot, rad };
})();
