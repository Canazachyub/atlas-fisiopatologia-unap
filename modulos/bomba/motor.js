/* Corazón como bomba — modelo numérico (didáctico, sin DOM).
   Se usa en el navegador (window.BOMBA) y en Node (_test.js).

   Idea del modelo (relación presión-volumen del VI, la misma que enseña la fisiología):
     · Llenado (precarga):   EDV = Vz + Vm·(1 − e^(−cE·P/r))     P = presión de llenado (PTDVI ≈ PCP), r = rigidez
     · Contractilidad:       Ees = Ees0·c        (pendiente de la línea de fin de sístole, ESPVR)
     · Poscarga:             Ea  = Ea0·a         (elastancia arterial = resistencia que enfrenta el VI)
     · Volumen sistólico:    VS  = (EDV − V0) / (1 + Ea/Ees)
   Así la curva de Frank-Starling NO está dibujada a mano: sale de estas tres ecuaciones y se aplana o se
   desplaza sola cuando cambia la contractilidad, la poscarga o la rigidez.
   Las constantes numéricas son de la fisiología estándar (marcadas «literatura» en la interfaz);
   los umbrales de congestión usan lo dicho en la clase (PCP normal ≈ 10; EAP 25-30 mmHg). */
(function (root) {
  "use strict";
  const K = {
    V0: 10,      // volumen no estresado del VI (mL)               [literatura]
    Vz: 30, Vm: 140, cE: 0.11,   // curva de llenado diastólico (EDPVR); calibrada para EDV ≈ 123 mL con P = 10 mmHg
    Ees0: 3.0,   // mmHg/mL, pendiente ESPVR normal                [literatura]
    Ea0: 1.6,    // mmHg/mL, elastancia arterial normal (PAS ≈ 120 con VS ≈ 75) [literatura]
    PCP_NORMAL: 10,         // clase 41 (Dr. Sotito): presión capilar pulmonar normal ≈ 10 mmHg
    PCP_EAP: 25,            // clase 41: en el EAP cardiogénico llega a 25-30 mmHg
    PCP_CONGESTION: 18,     // [literatura] congestión intersticial desde ≈ 18 mmHg
    GC_BAJO: 4.0,           // [literatura] L/min; por debajo se habla de bajo gasto
    FE_BAJA: 40, FE_NORMAL: 50,   // [literatura] FE < 40 % reducida; ≥ 50 % conservada
    P_MAX: 35
  };
  const NORMAL = { c: 1, a: 1, P: 10, r: 1, FC: 70 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function edv(P, r) { return K.Vz + K.Vm * (1 - Math.exp(-K.cE * Math.max(0, P) / r)); }
  // inversa: presión diastólica a un volumen dado (EDPVR)
  function pDeV(V, r) {
    const x = clamp((V - K.Vz) / K.Vm, 0, 0.9995);
    return -(r / K.cE) * Math.log(1 - x);
  }

  // Hemodinamia en equilibrio para un estado {c,a,P,r,FC}
  function hemo(e) {
    const EDV = edv(e.P, e.r), Ees = K.Ees0 * e.c, Ea = K.Ea0 * e.a;
    const SV = Math.max(0, (EDV - K.V0) / (1 + Ea / Ees));
    const ESV = EDV - SV, Pes = Ea * SV, Pdia = 0.68 * Pes;
    const EF = 100 * SV / EDV, GC = SV * e.FC / 1000;
    return { EDV, ESV, SV, EF, GC, Pes, Pdia, Ees, Ea, PAS: Pes, PAD: Pdia };
  }

  // Curva de Frank-Starling: VS en función de la presión de llenado, con c, a, r, FC del estado
  function curva(e, n) {
    n = n || 36; const pts = [];
    for (let i = 0; i <= n; i++) { const P = K.P_MAX * i / n; pts.push({ P, SV: hemo(Object.assign({}, e, { P })).SV }); }
    return pts;
  }

  // Zona según presión de llenado y gasto
  function zona(e, h) {
    h = h || hemo(e);
    const cong = e.P >= K.PCP_EAP ? "eap" : e.P >= K.PCP_CONGESTION ? "congestion" : "normal";
    const bajo = h.GC < K.GC_BAJO;
    return { cong, bajo };
  }

  // Tipo de disfunción
  function clasificar(e, h) {
    h = h || hemo(e);
    const z = zona(e, h);
    if (h.EF < K.FE_BAJA) return { tipo: "sistolica", texto: "Disfunción sistólica: FE disminuida (contractilidad baja)." };
    if (e.r >= 1.4 && (z.cong !== "normal" || z.bajo))
      return { tipo: "diastolica", texto: "Disfunción diastólica: FE conservada, pero el llenado exige presión alta." };
    if (z.cong !== "normal" && h.EF >= K.FE_NORMAL) return { tipo: "sobrecarga", texto: "FE conservada con presión de llenado alta: sobrecarga de volumen." };
    if (h.EF < K.FE_NORMAL) return { tipo: "limite", texto: "FE entre 40 % y 50 %: disfunción sistólica leve." };
    return { tipo: "normal", texto: z.bajo ? "Gasto bajo con FE conservada: falta de llenado (precarga baja)." : "Bomba sin falla." };
  }

  /* ---- ciclo cardiaco: punto (V,P) en cada fase φ ∈ [0,1) ---- */
  const FASES = [
    { id: "iso1", nombre: "Contracción isovolumétrica", a: 0, b: 0.10 },
    { id: "eyec", nombre: "Eyección", a: 0.10, b: 0.38 },
    { id: "iso2", nombre: "Relajación isovolumétrica", a: 0.38, b: 0.46 },
    { id: "llen", nombre: "Llenado", a: 0.46, b: 1 }
  ];
  function punto(phi, e, h) {
    h = h || hemo(e); phi = phi - Math.floor(phi);
    const Pmo = Math.max(2, Math.min(e.P, pDeV(h.ESV, e.r)));
    if (phi < 0.10) { const s = phi / 0.10; return { V: h.EDV, P: e.P + (h.Pdia - e.P) * s, fase: "iso1", flujo: 0 }; }
    if (phi < 0.38) {
      const s = (phi - 0.10) / 0.28, u = 1 - (1 - s) * (1 - s);
      const P = h.Pdia + (h.Pes - h.Pdia) * Math.sqrt(s) + 0.05 * h.Pes * Math.sin(Math.PI * s);
      return { V: h.EDV - h.SV * u, P, fase: "eyec", flujo: Math.sin(Math.PI * s) };
    }
    if (phi < 0.46) { const s = (phi - 0.38) / 0.08; return { V: h.ESV, P: h.Pes + (Pmo - h.Pes) * s, fase: "iso2", flujo: 0 }; }
    const w = (phi - 0.46) / 0.54, V = h.ESV + h.SV * (1 - (1 - w) * (1 - w));
    return { V, P: Math.max(Pmo, pDeV(V, e.r)), fase: "llen", flujo: 0 };
  }
  function lazo(e, n) {
    const h = hemo(e), out = []; n = n || 120;
    for (let i = 0; i < n; i++) out.push(punto(i / n, e, h));
    return out;
  }

  /* ---- evolución con mecanismos compensadores (didáctica, unidades relativas) ----
     g: gravedad de la lesión 0.1-1 · on: {sns, sraa, hip, adh, bnp} · N pasos ("días → meses").
     Cada paso: déficit de gasto → activa simpático (rápido), SRAA (lento: retiene Na y agua → sube la
     presión de llenado), hipertrofia/dilatación (muy lento). Mientras más tiempo activos, más cardiotoxicidad
     (fibrosis, apoptosis: clase 16) que baja la contractilidad intrínseca: círculo vicioso. */
  function evolucion(g, on, N) {
    N = N || 40; on = on || {};
    const sinComp = hemo(Object.assign({}, NORMAL, { c: 1 - 0.7 * g }));
    const GCn = hemo(NORMAL).GC;
    let sns = 0, sraa = 0, hip = 0, vol = 0, tox = 0, adh = 0, bnp = 0;
    const out = [];
    for (let t = 0; t <= N; t++) {
      const cInt = Math.max(0.12, (1 - 0.7 * g) - 0.25 * tox);
      const c = cInt * (1 + 0.35 * sns) + 0.15 * hip * Math.max(0, 1 - tox / 2);
      const a = 1 + 0.45 * sns + 0.35 * sraa;
      const P = clamp(NORMAL.P + 26 * vol, 0, K.P_MAX);
      const FC = 70 + 30 * sns;
      const e = { c, a, P, r: 1 + 0.5 * hip, FC };
      const h = hemo(e);
      out.push({ t, e, h, sns, sraa, hip, vol, tox, adh, bnp, cInt, GCsin: sinComp.GC });
      // actualización para el siguiente paso
      const def = clamp(1 - h.GC / GCn, 0, 1);
      const meta = clamp(def * 2.5, 0, 1);
      sns += (on.sns ? 0.35 * (meta - sns) : -sns);
      sraa += (on.sraa ? 0.12 * (meta - sraa) : -sraa);
      adh += (on.adh ? 0.10 * (meta - adh) : -adh);
      bnp += (on.bnp ? 0.10 * (clamp(P / 25, 0, 1) - bnp) : -bnp);
      hip += (on.hip ? 0.04 * (meta - hip) : -hip);
      const volMeta = clamp(1.0 * sraa + 0.25 * adh - 0.35 * bnp, 0, 1);
      vol += 0.08 * (volMeta - vol);
      tox += 0.032 * (sns + sraa + 0.5 * hip + 0.2 * adh);
    }
    return out;
  }

  const API = { K, NORMAL, clamp, edv, pDeV, hemo, curva, zona, clasificar, FASES, punto, lazo, evolucion };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.BOMBA = API;
})(typeof window !== "undefined" ? window : globalThis);
