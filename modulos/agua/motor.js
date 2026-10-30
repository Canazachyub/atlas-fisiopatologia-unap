/* Agua, sodio y potasio — modelo numérico (sin DOM). Sale de las clases 4 a 7 de Fisiopatología 2026.
   Convención: los datos de la clase van sin marca; lo que viene de la literatura se declara en LIT. */
(function (root) {
  "use strict";

  /* ---------- constantes de la clase ---------- */
  const C = {
    ACT_PCT: 0.60,        // Clase 4: agua corporal total = 0,6 × peso
    IC_FRAC: 0.60,        // Clase 4: 60 % del agua total es intracelular
    EC_FRAC: 0.40,        // Clase 4: 40 % extracelular
    OSM_NORMAL: [280, 310],
    NA_NORMAL: [135, 145],
    K_NORMAL: [3.5, 5.0],
    SS_NA: 154,           // suero fisiológico 0,9 %: 154 mEq/L de Na y de Cl
    PI_POR_KG: 12,        // pérdidas insensibles = peso × 12
    GLU_NA: 1.6           // −1,6 mEq/L de Na por cada 100 mg/dL de glucosa
  };
  /* ---------- datos de LITERATURA (no están en la clase) ---------- */
  const LIT = {
    PLASMA_DEL_EC: 0.25,  // plasma ≈ 1/4 del extracelular, intersticial ≈ 3/4
    PCT_CAT: { varon: 0.60, mujer: 0.50, lactante: 0.75, anciano: 0.50, obeso: 0.45 },
    SALINA_HIP_OSM: 1026, // NaCl 3 % = 513 mEq/L de Na → ≈ 1026 mOsm/L
    K_POR_PH: 6,          // ≈ 0,6 mEq/L de K+ por 0,1 de pH
    K_POR_MEQ: 150,       // ≈ 1 mEq/L de K+ por 150 mEq de déficit/exceso
    K_INSULINA: -0.6, K_BETA2: -0.4, K_TIROIDEA: -0.3
  };
  const CATEGORIAS = [
    { id: "varon",    t: "Varón adulto",   peso: 70, lit: false },
    { id: "mujer",    t: "Mujer adulta",   peso: 60, lit: true },
    { id: "lactante", t: "Lactante",       peso: 8,  lit: true },
    { id: "anciano",  t: "Anciano",        peso: 65, lit: true },
    { id: "obeso",    t: "Obeso",          peso: 110, lit: true }
  ];

  /* Pérdidas y aportes: vol en L (negativo = pérdida), osmL = mOsm/L efectivos del líquido
     (osmolaridad "al estilo de la clase" = 2 × Na). Composición del líquido: tabla 7 de la clase 4. */
  const ACCIONES = {
    agua:     { t: "Agua libre / dextrosa 5 %", vol: 1,   osmL: 0,                  na: 0,   k: 0,  cl: 0 },
    ss:       { t: "Suero fisiológico 0,9 %",   vol: 1,   osmL: 2 * C.SS_NA,        na: 154, k: 0,  cl: 154 },
    hip:      { t: "Salina hipertónica 3 %",    vol: 0.5, osmL: LIT.SALINA_HIP_OSM, na: 513, k: 0,  cl: 513, lit: true },
    sudor:    { t: "Sudor",                     vol: -1,  osmL: 2 * 50,             na: 50,  k: 5,  cl: 55 },
    diarrea:  { t: "Diarrea",                   vol: -1,  osmL: 2 * 55,             na: 55,  k: 32, cl: 42 },
    vomito:   { t: "Vómito (jugo gástrico)",    vol: -1,  osmL: 2 * 45,             na: 45,  k: 10, cl: 135 },
    insens:   { t: "Pérdida de agua pura",      vol: -1,  osmL: 0,                  na: 0,   k: 0,  cl: 0 },
    tercer:   { t: "Tercer espacio",            vol: -1,  osmL: null,               na: 0,   k: 0,  cl: 0 }
  };

  const redond = (x, d) => { const p = Math.pow(10, d || 0); return Math.round(x * p) / p; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- compartimentos ---------- */
  function crear(peso, cat) {
    const pct = LIT.PCT_CAT[cat] != null ? LIT.PCT_CAT[cat] : C.ACT_PCT;
    const act = pct * peso, osm0 = 290;                 // Na 140 → 140 × 2 + 10
    const s = { peso: peso, cat: cat, pct: pct, act0: act, osm0: osm0, tercer: 0 };
    s.vic = act * C.IC_FRAC; s.vec = act * C.EC_FRAC;
    s.oic = s.vic * osm0;    s.oec = s.vec * osm0;       // mOsm efectivos de cada piso
    s.vic0 = s.vic; s.vec0 = s.vec; s.k = 0; s.nam = 0;
    return derivar(s);
  }
  // reparte por ósmosis: el agua se mueve hasta igualar la osmolaridad de ambos pisos
  function derivar(s) {
    const vt = s.vic + s.vec;
    s.osm = (s.oic + s.oec) / vt;
    s.vic = s.oic / s.osm; s.vec = s.oec / s.osm;
    s.na = (s.osm - 10) / 2;                              // despeja Na de "Na × 2 + 10"
    s.plasma = s.vec * LIT.PLASMA_DEL_EC; s.inters = s.vec - s.plasma;
    return s;
  }
  function aplicar(s, id) {
    const a = ACCIONES[id], n = Object.assign({}, s);
    const antes = { vic: s.vic, vec: s.vec, osm: s.osm, na: s.na };
    if (id === "tercer") {                                // sale líquido isotónico del EC a una cavidad
      const v = Math.min(1, s.vec * 0.5);
      n.vec -= v; n.oec -= v * s.osm; n.tercer += v;
    } else {
      let v = a.vol;
      if (v < 0 && s.vec + v < s.vec0 * 0.25) v = -(s.vec - s.vec0 * 0.25);   // límite de supervivencia del modelo
      n.vec += v; n.oec += v * a.osmL;
      const f = a.vol !== 0 ? v / a.vol : 0;            // fracción realmente aplicada
      if (v < 0) { n.k -= a.k * f; n.nam -= a.na * f; }
      else { n.nam += a.na * v; }
    }
    derivar(n);
    n.antes = antes;
    n.dvic = n.vic - antes.vic;                           // + : entra agua a la célula
    return n;
  }
  function estadoNa(na) {
    if (na < 125) return { id: "hipo3", t: "hiponatremia grave", cls: "ro" };
    if (na < 130) return { id: "hipo2", t: "hiponatremia con síntomas neurológicos", cls: "ro" };
    if (na < 135) return { id: "hipo1", t: "hiponatremia", cls: "na" };
    if (na <= 145) return { id: "norm", t: "sodio normal", cls: "ve" };
    if (na <= 150) return { id: "hiper1", t: "hipernatremia", cls: "na" };
    return { id: "hiper2", t: "hipernatremia", cls: "ro" };
  }

  /* ---------- osmolaridad ---------- */
  const osmSimple = na => na * 2 + 10;                                   // fórmula de la clase 4
  const osmCompleta = (na, glu, bun) => 2 * na + glu / 18 + bun / 2.8;   // la de la pregunta de la clase
  const osmEfectiva = (na, glu) => 2 * na + glu / 18;
  const naCorregido = (na, glu) => na + C.GLU_NA * (glu - 100) / 100;
  function claseOsm(o) { return o < C.OSM_NORMAL[0] ? "baja" : o > C.OSM_NORMAL[1] ? "alta" : "normal"; }

  /* ---------- déficit de agua y sodio (fórmulas de las clases 4 y 6) ---------- */
  function deficitAgua(peso, naEnc, naNorm) {
    naNorm = naNorm || 145;
    const act = C.ACT_PCT * peso, aca = naNorm * act / naEnc;
    return { act: act, aca: aca, deficit: act - aca };
  }
  const deficitNa = (peso, naEnc, naNorm) => ((naNorm || 145) - naEnc) * C.ACT_PCT * peso;   // (Na normal − Na hallado) × 0,6 × peso
  // exceso de sodio: espejo de la fórmula, NO viene en la clase (literatura)
  const excesoNa = (peso, naEnc, naNorm) => (naEnc - (naNorm || 140)) * C.ACT_PCT * peso;

  /* ---------- grados de deshidratación (clase 5) ---------- */
  const GRADOS = [
    { id: 0, t: "Sin deshidratación clínica", min: 0, max: 2.5 },
    { id: 1, t: "1er grado (leve)", min: 2.5, max: 5, mlkg: [25, 50], fc: "~100 lat/min", pa: "normal", muc: "variables", ojos: "normales", hto: "~45 %", diu: "0,6 ml/kg/h", dens: "1020-1025",
      clin: "Sed moderada, irritabilidad discreta, piel seca con turgor conservado, diuresis < 1400 ml/24 h." },
    { id: 2, t: "2do grado (moderada)", min: 5, max: 10, mlkg: [50, 100], fc: "~120 lat/min", pa: "hipotensión postural (110/70 echado, 90/50 de pie)", muc: "secas", ojos: "hundidos", hto: "~50 %", diu: "0,3-0,5 ml/kg/h", dens: "1026-1034",
      clin: "Sed intensa, agitación, piel seca con pérdida de elasticidad, oliguria (< 400 ml/24 h), ojos hundidos." },
    { id: 3, t: "3er grado (grave)", min: 10, max: 100, mlkg: [100, 150], fc: "~130 lat/min", pa: "hipotensión en decúbito", muc: "muy secas", ojos: "muy hundidos", hto: "~60 % (hemoconcentración)", diu: "0,2 ml/kg/h", dens: "> 1034",
      clin: "Todo lo anterior + compromiso neurológico (irritabilidad, postración); riesgo de colapso circulatorio." }
  ];
  function grado(pct) { return GRADOS.filter(g => pct >= g.min && pct < g.max).pop() || GRADOS[3]; }
  // déficit estimado en ml según % de pérdida de masa corporal (1 % de x kg = 10·x ml)
  const perdidaMl = (peso, pct) => peso * pct * 10;
  function tipoPorNa(na) {
    if (na < 130) return "hipotonica";
    if (na >= 135 && na <= 145) return "isotonica";
    if (na > 150) return "hipertonica";
    return "zona";              // 130-134 y 146-150: la clase no da etiqueta [REVISAR] umbral exacto
  }

  /* ---------- balance hídrico (clase 4) ---------- */
  function balance(peso, ing, egr) {
    const pi = peso * C.PI_POR_KG, ae = pi / 3;           // el ejemplo de la clase usa 720 / 3 = 240 ml
    const ingTot = ing + ae, egrTot = egr + pi;
    return { pi: pi, ae: ae, ae20: pi * 0.2, ingTot: ingTot, egrTot: egrTot, dif: ingTot - egrTot };
  }

  /* ---------- potasio (clase 7 + magnitudes de literatura) ---------- */
  function kPlasma(o) {           // o: { bal (mEq), ph, insulina, beta, tiroidea }
    let k = 4.2 + (o.bal || 0) / LIT.K_POR_MEQ - LIT.K_POR_PH * ((o.ph || 7.4) - 7.4);
    if (o.insulina) k += LIT.K_INSULINA;
    if (o.beta) k += LIT.K_BETA2;
    if (o.tiroidea) k += LIT.K_TIROIDEA;
    return clamp(k, 1.5, 9.5);
  }
  function estadoK(k) {
    if (k < 2.5) return { id: "hipoS", t: "hipopotasemia severa", cls: "ro", ecg: "Onda T aplanada o invertida, onda U, extrasístoles; riesgo de parálisis respiratoria y rabdomiólisis." };
    if (k < 3.5) return { id: "hipo", t: "hipopotasemia", cls: "na", ecg: "Onda P aplanada, onda T aplanada o invertida, aparece la onda U, extrasístoles." };
    if (k <= 5.0) return { id: "norm", t: "potasio normal", cls: "ve", ecg: "ECG normal." };
    if (k < 6.5) return { id: "hiper", t: "hiperpotasemia leve", cls: "na", ecg: "Onda T alta, picuda y simétrica." };
    if (k <= 8) return { id: "hiperM", t: "hiperpotasemia moderada-grave", cls: "ro", ecg: "T picuda, P aplanada, QRS ensanchado." };
    return { id: "hiperG", t: "hiperpotasemia grave", cls: "ro", ecg: "P aplanada, QRS muy ancho, fibrilación ventricular y paro (sobre todo > 9 mEq/L)." };
  }

  const API = { C: C, LIT: LIT, CATEGORIAS: CATEGORIAS, ACCIONES: ACCIONES, GRADOS: GRADOS,
    redond: redond, clamp: clamp, crear: crear, aplicar: aplicar, derivar: derivar, estadoNa: estadoNa,
    osmSimple: osmSimple, osmCompleta: osmCompleta, osmEfectiva: osmEfectiva, naCorregido: naCorregido, claseOsm: claseOsm,
    deficitAgua: deficitAgua, deficitNa: deficitNa, excesoNa: excesoNa, grado: grado, perdidaMl: perdidaMl, tipoPorNa: tipoPorNa,
    balance: balance, kPlasma: kPlasma, estadoK: estadoK };
  root.AGUA = API;
  if (typeof module !== "undefined") module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
