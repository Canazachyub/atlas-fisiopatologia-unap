/* Motor del ECG: el corazón como un dipolo que gira en el tiempo.
   Cada onda es una suma de componentes (gaussianas en el tiempo) con una dirección en 3D:
   x = izquierda del paciente, y = abajo (inferior), z = adelante (anterior).
   Cada derivación es la proyección de ese vector sobre su eje (producto escalar), así que
   DI + DIII = DII y aVR + aVL + aVF = 0 se cumplen solos, igual que en el papel. */
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

  /* ---------- catálogo de ritmos y patrones (según la teoría del docente) ---------- */
  const PATRONES = {
    normal: { nombre: "Ritmo sinusal normal", grupo: "Normal", fc: 75 },
    taqui: { nombre: "Taquicardia sinusal", grupo: "Ritmo sinusal", fc: 125, pr: 0.13 },
    bradi: { nombre: "Bradicardia sinusal", grupo: "Ritmo sinusal", fc: 48, pr: 0.19 },
    arritmia: { nombre: "Arritmia sinusal (respiratoria)", grupo: "Ritmo sinusal", fc: 72 },
    bav1: { nombre: "BAV de 1.er grado", grupo: "Bloqueos AV", fc: 70, pr: 0.28 },
    mobitz1: { nombre: "BAV 2.º grado Mobitz I (Wenckebach)", grupo: "Bloqueos AV", fc: 80 },
    mobitz2: { nombre: "BAV 2.º grado Mobitz II", grupo: "Bloqueos AV", fc: 96, pr: 0.16 },
    bav3: { nombre: "BAV de 3.er grado (completo)", grupo: "Bloqueos AV", fc: 80 },
    fa: { nombre: "Fibrilación auricular", grupo: "Arritmias", fc: 115 },
    bcrd: { nombre: "Bloqueo completo de rama derecha", grupo: "Bloqueos de rama", fc: 72 },
    bcri: { nombre: "Bloqueo completo de rama izquierda", grupo: "Bloqueos de rama", fc: 72 },
    had: { nombre: "Hipertrofia auricular derecha (P pulmonar)", grupo: "Hipertrofias", fc: 82 },
    hai: { nombre: "Hipertrofia auricular izquierda (P mitrale)", grupo: "Hipertrofias", fc: 74 },
    hvd: { nombre: "Hipertrofia ventricular derecha", grupo: "Hipertrofias", fc: 80 },
    hvi: { nombre: "Hipertrofia ventricular izquierda", grupo: "Hipertrofias", fc: 72 },
    iam: { nombre: "Infarto de miocardio", grupo: "Infarto", fc: 84 }
  };
  // regiones del infarto: derivaciones que miran la zona y las de imagen en espejo
  const REGIONES = {
    anteroseptal: { nombre: "Anteroseptal", ve: ["V1", "V2", "V3", "V4"], espejo: ["DII", "DIII", "aVF"] },
    anterolateral: { nombre: "Anterolateral", ve: ["DI", "aVL", "V4", "V5", "V6"], espejo: ["DIII", "aVF"] },
    lateral: { nombre: "Lateral alto", ve: ["DI", "aVL"], espejo: ["DII", "DIII", "aVF"] },
    extenso: { nombre: "Anterior extenso", ve: ["DI", "aVL", "V1", "V2", "V3", "V4", "V5", "V6"], espejo: ["DII", "DIII", "aVF"] },
    inferior: { nombre: "Inferior (diafragmático)", ve: ["DII", "DIII", "aVF"], espejo: ["DI", "aVL"] },
    posterior: { nombre: "Dorsal (posterior)", ve: ["V7", "V8"], espejo: ["V1", "V2", "V3"] }
  };
  const FASES = {
    isq_epi: "Isquemia subepicárdica: T negativa, simétrica y puntiaguda",
    isq_endo: "Isquemia subendocárdica: T positiva, alta y simétrica",
    les_epi: "Lesión subepicárdica: ST supradesnivelado",
    les_endo: "Lesión subendocárdica: ST infradesnivelado",
    necrosis: "Necrosis: onda Q patológica + T invertida, ST vuelve a la línea",
    antiguo: "Infarto antiguo: queda la onda Q (para siempre)"
  };

  /* ---------- construir un ECG: lista de latidos en el tiempo ---------- */
  // devuelve {latidos:[{tp,tq,conduce,pr,...}], fwaves, dur}
  function construir(cfg, dur) {
    cfg = Object.assign({ tipo: "normal" }, cfg);
    const pat = PATRONES[cfg.tipo] || PATRONES.normal;
    const fc = cfg.fc || pat.fc, rr = 60 / fc;
    const L = [];
    let semilla = cfg.semilla || 7;
    const azar = () => { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; };
    let t = 0.25;
    if (cfg.tipo === "fa") {
      // sin P: el nódulo AV deja pasar estímulos de forma irregular
      while (t < dur) { L.push({ tq: t, conduce: true }); t += rr * (0.55 + azar() * 0.9); }
    } else if (cfg.tipo === "bav3") {
      // aurículas y ventrículos con marcapasos independientes
      const ra = 60 / fc, rv = 60 / (cfg.fcv || 36);
      for (let tp = 0.1; tp < dur; tp += ra) L.push({ tp, conduce: false, sola: true });
      for (let tq = 0.55; tq < dur; tq += rv) L.push({ tq, conduce: true, escape: true });
    } else if (cfg.tipo === "mobitz1") {
      let k = 0, pr = 0.18;
      while (t < dur) {
        if (k === 3) { L.push({ tp: t, conduce: false, bloqueada: true }); k = 0; pr = 0.18; }
        else { L.push({ tp: t, tq: t + pr, pr, conduce: true }); pr += 0.07; k++; }
        t += rr;
      }
    } else if (cfg.tipo === "mobitz2") {
      let k = 0; const pr = pat.pr;
      while (t < dur) {   // 2:1 → dos P por cada QRS (frecuencia ventricular ≈ 48)
        if (k % 2 === 1) L.push({ tp: t, conduce: false, bloqueada: true });
        else L.push({ tp: t, tq: t + pr, pr, conduce: true });
        k++; t += rr;
      }
    } else {
      const pr = cfg.pr || pat.pr || 0.16;
      while (t < dur) {
        let r = rr;
        if (cfg.tipo === "arritmia") r = rr * (1 - 0.22 * Math.sin(2 * Math.PI * t / 5)); // inspira: sube la FC
        L.push({ tp: t, tq: t + pr, pr, conduce: true });
        t += r;
      }
    }
    L.sort((a, b) => (a.tp ?? a.tq) - (b.tp ?? b.tq));
    // intervalo RR de cada QRS (para el QT, que se acorta con la FC)
    const qs = L.filter(x => x.tq != null).map(x => x.tq);
    L.forEach(x => { if (x.tq != null) { const i = qs.indexOf(x.tq); x.rr = i > 0 ? qs[i] - qs[i - 1] : (qs[1] - qs[0]) || rr; } });
    const fw = [];   // ondas f de la fibrilación auricular
    if (cfg.tipo === "fa") for (let i = 0; i < 6; i++) fw.push({ f: 5.5 + azar() * 3, ph: azar() * 6.28, a: 0.025 + azar() * 0.03 });
    return { cfg, pat, latidos: L, fw, dur };
  }

  /* ---------- morfología de un latido según el patrón ---------- */
  function morfo(cfg, lat) {
    const tipo = cfg.tipo;
    let P = pNormal(), Q = qrsNormal(), T = Object.assign({}, T_NORMAL), qrsDur = 0.09;
    if (tipo === "had") { P[0].a = 0.27; P[0].s = 0.015; }
    if (tipo === "hai") { P[1].a = 0.14; P[1].c = 0.092; P[1].s = 0.022; P[0].c = 0.03; }
    if (tipo === "hvi") { Q[1].a = 2.6; Q[1].d = uni(0.85, 0.15, -0.5); Q[2].a = 0.3; T = { a: 0.28, d: uni(-0.7, 0.3, 0.2), strain: true }; }
    if (tipo === "hvd") { Q[1].a = 0.9; Q[1].d = uni(0.2, 0.9, -0.3); Q.push({ c: 0.055, s: 0.013, a: 1.4, d: uni(-0.55, 0.55, 0.65) }); T = { a: 0.25, d: uni(0.6, 0.6, -0.55) }; }
    if (tipo === "bcrd") {
      qrsDur = 0.14; Q[1].a = 1.3;
      Q.push({ c: 0.105, s: 0.018, a: 0.75, d: uni(-0.6, 0.15, 0.8) });   // VD activado tarde: R' en V1, S ancha en DI y V6
      T = { a: 0.2, d: uni(0.7, 0.4, -0.6) };
    }
    if (tipo === "bcri" || lat.escape) {
      qrsDur = 0.15;
      Q = [{ c: 0.03, s: 0.016, a: 0.5, d: uni(0.6, 0.2, -0.75) },          // sin septo normal: no hay q en V6 ni r en V1
           { c: 0.075, s: 0.022, a: 1.7, d: uni(0.75, -0.05, -0.65) },      // R ancha y mellada en DI, aVL, V5, V6
           { c: 0.11, s: 0.016, a: 0.6, d: uni(0.8, -0.15, -0.3) }];
      T = { a: 0.32, d: uni(-0.7, 0.1, 0.65) };                               // T opuesta al QRS
    }
    if (cfg.rotar) {   // girar el QRS y la T en el plano frontal (para ver cómo cambia el eje)
      const a = rad(cfg.rotar), c = Math.cos(a), s = Math.sin(a);
      const gira = d => [d[0] * c - d[1] * s, d[0] * s + d[1] * c, d[2]];
      Q = Q.map(k => Object.assign({}, k, { d: gira(k.d) })); T = Object.assign({}, T, { d: gira(T.d) });
    }
    if (cfg.amp) Q = Q.map(k => Object.assign({}, k, { a: k.a * cfg.amp }));
    return { P, Q, T, qrsDur };
  }

  /* ---------- valor de una derivación en el tiempo t (mV) ---------- */
  function valor(ecg, der, t) {
    const D = DER[der], cfg = ecg.cfg; let v = 0;
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq;
      if (t0 > t + 0.05) break;
      if ((lat.tq ?? t0) < t - 1.1 && (lat.tp ?? -9) < t - 0.3) continue;
      const m = lat._m || (lat._m = morfo(cfg, lat));
      if (lat.tp != null && cfg.tipo !== "fa") {
        const dt = t - lat.tp;
        if (dt > -0.05 && dt < 0.25) for (const c of m.P) v += c.a * ga(dt, c.c, c.s) * dot(c.d, D.eje);
      }
      if (lat.tq != null) {
        const dt = t - lat.tq;
        if (dt > -0.05 && dt < 0.8) {
          let q = 0;
          for (const c of m.Q) q += c.a * ga(dt, c.c, c.s) * dot(c.d, D.eje);
          const qt = Math.min(0.46, Math.max(0.3, 0.4 * Math.sqrt(lat.rr || 0.8)));
          const tPico = qt - 0.1, tm = m.T;
          let tv = tm.a * ga(dt, tPico, 0.055, 0.032) * dot(tm.d, D.eje);
          let st = 0;
          if (cfg.tipo === "iam") ({ q, tv, st } = infarto(cfg, der, dt, q, tv, m.qrsDur, tPico, D));
          if (tm.strain) st += -0.06 * Math.max(0, dot(uni(0.9, 0.1, -0.4), D.eje)) * ventanaST(dt, m.qrsDur, tPico);
          v += q + tv + st;
        }
      }
    }
    if (cfg.tipo === "fa") for (const f of ecg.fw) v += f.a * Math.sin(2 * Math.PI * f.f * t + f.ph) * (0.4 + 0.6 * Math.abs(dot(uni(0.3, 0.8, 0.5), D.eje)));
    return v * D.g;
  }
  // el ST va del punto J al final de la T: sube rápido y se funde con la T
  function ventanaST(dt, qrsDur, tPico) {
    if (dt < qrsDur - 0.01) return 0;
    if (dt < qrsDur + 0.01) return (dt - qrsDur + 0.01) / 0.02;
    return dt < tPico ? 1 : Math.max(0, 1 - (dt - tPico) / 0.09);
  }
  function infarto(cfg, der, dt, q, tv, qrsDur, tPico, D) {
    const R = REGIONES[cfg.region || "anteroseptal"], f = cfg.fase || "les_epi";
    const mira = R.ve.includes(der), esp = R.espejo.includes(der);
    let st = 0;
    if (!mira && !esp) return { q, tv, st };
    const s = mira ? 1 : -1, w = ventanaST(dt, qrsDur, tPico);
    const tSim = Math.exp(-0.5 * Math.pow((dt - tPico) / 0.045, 2));   // T simétrica
    if (f === "isq_epi") tv = (mira ? -0.42 : 0.3) * tSim;
    if (f === "isq_endo") tv = (mira ? 0.6 : -0.15) * tSim;
    if (f === "les_epi") { st = s * 0.28 * w; tv = mira ? Math.max(tv, 0.12 * tSim) : tv * 0.5; }
    if (f === "les_endo") { st = -s * 0.2 * w; }
    if (f === "necrosis" || f === "antiguo") {
      if (mira) {   // tejido muerto: el electrodo "ve" a través de una ventana → onda Q ancha y profunda
        const Qp = -0.45 * ga(dt, 0.022, 0.012, 0.014);
        q = q * 0.45 + Qp;
        tv = f === "necrosis" ? -0.32 * tSim : tv * 0.6;
        if (f === "necrosis") st = 0.05 * w;
      } else if (f === "necrosis") tv = 0.25 * tSim;
    }
    if (cfg.region === "posterior" && esp) {   // imagen en espejo en V1-V3: R alta, ST infra, T normal
      q += 0.6 * ga(dt, 0.04, 0.012) * (f === "necrosis" || f === "antiguo" ? 1 : 0.3);
      if (f === "les_epi") st = -0.22 * w;
    }
    return { q, tv, st };
  }

  /* ---------- momentos del ciclo (para animar el corazón) ---------- */
  // devuelve la lista de eventos visibles en t: qué estructura está activa
  function estado(ecg, t) {
    const cfg = ecg.cfg, e = { aur: 0, sa: 0, av: 0, his: 0, rd: 0, ri: 0, purk: 0, ven: 0, vd: 0, vi: 0, rep: 0, bloqueo: 0, fa: cfg.tipo === "fa", escape: 0, aurFrente: 0, venFrente: 0 };
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq; if (t0 > t + 0.02) break;
      const m = lat._m || (lat._m = morfo(cfg, lat));
      if (lat.tp != null && cfg.tipo !== "fa") {
        const dt = t - lat.tp;
        if (dt >= 0 && dt < 0.03) e.sa = 1;
        if (dt >= 0 && dt < 0.11) { e.aur = Math.max(e.aur, 1); e.aurFrente = dt / 0.1; e.pOn = 1; }
        else if (dt >= 0.11 && dt < 0.3) e.aur = Math.max(e.aur, 1 - (dt - 0.11) / 0.19);
        const fin = lat.conduce && lat.tq != null ? lat.tq - lat.tp : 0.22;
        if (dt >= 0.07 && dt < fin) e.av = Math.max(e.av, 1);
        if (!lat.conduce && dt >= 0.12 && dt < 0.32) e.bloqueo = 1;
      }
      if (lat.tq != null) {
        const dt = t - lat.tq;
        if (cfg.tipo === "fa" && dt >= -0.03 && dt < 0.01) e.av = 1;
        if (lat.escape && dt >= -0.02 && dt < 0.03) e.escape = 1;
        if (dt >= -0.01 && dt < 0.02) e.his = 1;
        const lento = m.qrsDur > 0.12;
        if (dt >= 0 && dt < 0.035) { e.rd = cfg.tipo === "bcrd" ? 0 : 1; e.ri = cfg.tipo === "bcri" || lat.escape ? 0 : 1; }
        if (dt >= 0.015 && dt < 0.06) e.purk = 1;
        const dq = m.qrsDur;
        if (dt >= 0 && dt < dq) {
          e.ven = 1; e.venFrente = dt / dq;
          // con bloqueo de rama un ventrículo se activa tarde (llega por el músculo, lento)
          e.vi = cfg.tipo === "bcri" || lat.escape ? Math.max(0, (dt - 0.04) / (dq - 0.04)) : Math.min(1, dt / 0.06);
          e.vd = cfg.tipo === "bcrd" ? Math.max(0, (dt - 0.05) / (dq - 0.05)) : Math.min(1, dt / 0.05);
          if (lento) e.lento = 1;
        } else if (dt >= dq && dt < 0.42) { e.ven = 1; e.vi = e.vd = 1; e.meseta = 1; }
        const qt = Math.min(0.46, Math.max(0.3, 0.4 * Math.sqrt(lat.rr || 0.8)));
        if (dt >= qt - 0.17 && dt < qt + 0.05) { e.rep = Math.min(1, (dt - (qt - 0.17)) / 0.2); e.vi = e.vd = 1 - e.rep; e.ven = 1 - e.rep; }
      }
    }
    return e;
  }

  // ¿qué onda se está dibujando en t? (para el letrero del simulador)
  function onda(ecg, t) {
    let r = { n: "Línea de base (diástole)", k: "base" };
    for (const lat of ecg.latidos) {
      const t0 = lat.tp ?? lat.tq; if (t0 > t + 0.01) break;
      const m = lat._m || (lat._m = morfo(ecg.cfg, lat));
      if (lat.tp != null && ecg.cfg.tipo !== "fa") {
        const dt = t - lat.tp;
        if (dt >= 0 && dt < 0.105) r = { n: "Onda P: despolarización auricular", k: "P" };
        else if (dt >= 0.105 && lat.tq != null && t < lat.tq) r = { n: "Segmento PR: el impulso se frena en el nódulo AV", k: "PR" };
        else if (dt >= 0.105 && dt < 0.3 && !lat.conduce && !lat.sola) r = { n: "Onda P bloqueada: no pasa del nódulo AV (no hay QRS)", k: "BL" };
      }
      if (lat.tq != null) {
        const dt = t - lat.tq;
        const qt = Math.min(0.46, Math.max(0.3, 0.4 * Math.sqrt(lat.rr || 0.8)));
        if (dt >= 0 && dt < m.qrsDur) r = { n: "Complejo QRS: despolarización ventricular", k: "QRS" };
        else if (dt >= m.qrsDur && dt < qt - 0.17) r = { n: "Segmento ST: ventrículos despolarizados (meseta)", k: "ST" };
        else if (dt >= qt - 0.17 && dt < qt + 0.02) r = { n: "Onda T: repolarización ventricular", k: "T" };
      }
    }
    if (ecg.cfg.tipo === "fa" && r.k === "base") r = { n: "Ondas f: aurículas fibrilando a 400-600 lpm", k: "f" };
    return r;
  }

  window.ECG = { DER, LISTA12, PATRONES, REGIONES, FASES, construir, valor, estado, onda, morfo, uni, dot, rad };
})();
