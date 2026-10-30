/* Motor ácido-base — la parte que calcula (sin DOM). Exportable a Node para probarlo (_test.js).
   Fuentes: Clase 8 (ácido-base, acidosis metabólica), Clase 9 (acidosis respiratoria, alcalosis metabólica y
   respiratoria), Clase 7 (K y pH), Clase 4 (pérdidas digestivas) y las fichas 7, 8 y 41 del atlas.
   Lo que la clase NO da (Henderson-Hasselbalch, fórmulas de compensación, cifra del anión gap, delta) se usa
   como literatura y se marca con LIT en la interfaz. */
(function (root) {
  "use strict";

  const LIT = '<span class="lit">literatura</span>';

  /* ---------- valores de la clase ---------- */
  // pH 7,35-7,45 (Clase 8). PaCO2: 40 (36-44) en la Clase 8, pero la Clase 9 corta en <35 y >45: se usa la Clase 9.
  // HCO3 22-26, media 24 (Clase 8). BE ±2,5.
  const N = { pH: [7.35, 7.45], pco2: [35, 45], pco2Ref: 40, hco3: [22, 26], hco3Ref: 24, ag: [8, 12], agRef: 10 };

  const f = (x, d = 0) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ",");
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- Henderson-Hasselbalch (literatura) ---------- */
  // pH = 6,1 + log10( HCO3 / (0,03 × PaCO2) )
  const ph = (hco3, pco2) => 6.1 + Math.log10(hco3 / (0.03 * pco2));
  const hco3De = (pH, pco2) => 0.03 * pco2 * Math.pow(10, pH - 6.1);
  const pco2De = (pH, hco3) => hco3 / (0.03 * Math.pow(10, pH - 6.1));

  /* ---------- los cuatro trastornos según la clase ---------- */
  const DES = {
    AM: {
      nombre: "Acidosis metabólica", corto: "acidosis metabólica", sentido: "acid", prim: "HCO₃⁻ ↓",
      criterios: "pH &lt; 7,35 (grave &lt; 7,22) y HCO₃⁻ &lt; 24 (grave &lt; 9-10). Primario = HCO₃⁻; la PaCO₂ baja es la respuesta.",
      mecanismo: "Aumentan los ácidos fijos (láctico, cetonas, úrico, alcohol) o cae el bicarbonato (diarrea, riñón que no lo fabrica). El HCO₃⁻ se gasta o se pierde, la relación HCO₃⁻/CO₂ cae y el pH baja.",
      compensa: "Pulmón: hiperventila (respiración de Kussmaul) y la PaCO₂ baja.",
      clinica: ["Kussmaul (hiperventilación compensatoria)", "vasoconstricción de la arteria pulmonar e hipertensión pulmonar", "menos contractilidad, arritmias, vasodilatación e hipotensión", "confusión, somnolencia, estupor, coma", "hiperpotasemia", "desmineralización ósea"],
      tto: "Tratar la causa. Bicarbonato IV solo si pH &lt; 7,20 y HCO₃⁻ &lt; 10: déficit = 0,5 × kg × (24 − HCO₃⁻).",
      formula: "PaCO₂ esperada = 1,5 × HCO₃⁻ + 8 (± 2)  (fórmula de Winter)", lit: true
    },
    AlM: {
      nombre: "Alcalosis metabólica", corto: "alcalosis metabólica", sentido: "alc", prim: "HCO₃⁻ ↑",
      criterios: "pH &gt; 7,45, HCO₃⁻ &gt; 26 y PaCO₂ normal o ligeramente aumentada (compensación).",
      mecanismo: "Se genera por pérdida de H⁺ (vómitos, diuréticos) o ganancia de HCO₃⁻, y se mantiene por hipovolemia, hipopotasemia o mineralocorticoides que impiden al riñón botar el bicarbonato.",
      compensa: "Pulmón: hipoventila para retener CO₂ y la PaCO₂ sube un poco.",
      clinica: ["hipoventilación compensatoria", "arritmias (sobre todo con hipopotasemia)", "desorientación, letargo, tetania (Ca²⁺ ionizado ↓)", "debilidad y astenia"],
      tto: "Suspender diuréticos, tratar los vómitos, suero salino 0,9 %, KCl, espironolactona si hay exceso de mineralocorticoides.",
      formula: "PaCO₂ esperada = 40 + 0,7 × (HCO₃⁻ − 24) (± 5)", lit: true
    },
    AR: {
      nombre: "Acidosis respiratoria", corto: "acidosis respiratoria", sentido: "acid", prim: "PaCO₂ ↑",
      criterios: "pH &lt; 7,32 y PaCO₂ &gt; 45 mmHg. HCO₃⁻ normal si es aguda; aumentado si es crónica.",
      mecanismo: "El pulmón hipoventila y el CO₂ (ácido volátil) se acumula: la relación HCO₃⁻/CO₂ cae y el pH baja. El riñón compensa lento, en horas a días.",
      compensa: "Riñón: genera más HCO₃⁻ (en lo agudo todavía no lo ha hecho).",
      clinica: ["disnea", "desorientación, confusión, cefalea", "coma en casos extremos", "predominan los síntomas de la enfermedad de base"],
      tto: "Corregir la hipoventilación y la causa; oxígeno con cuidado en EPOC; ventilación mecánica si es grave. Bicarbonato en general NO: solo si pH &lt; 7,10 y refractario.",
      formula: "Aguda: HCO₃⁻ sube 1 por cada 10 mmHg de PaCO₂ · Crónica: sube 3,5 por cada 10", lit: true
    },
    AlR: {
      nombre: "Alcalosis respiratoria", corto: "alcalosis respiratoria", sentido: "alc", prim: "PaCO₂ ↓",
      criterios: "pH &gt; 7,45 y PaCO₂ &lt; 35 mmHg. HCO₃⁻ normal o ligeramente disminuido.",
      mecanismo: "El pulmón hiperventila y lava el CO₂: la relación HCO₃⁻/CO₂ sube y el pH sube. El riñón compensa botando bicarbonato (la clase dice «leve y rápida»).",
      compensa: "Riñón: elimina HCO₃⁻ (leve).",
      clinica: ["mareos, parestesias, desorientación", "calambres y tetania (Ca²⁺ ionizado ↓): signos de Chvostek y Trousseau", "palpitaciones y riesgo de arritmias", "PaCO₂ &lt; 20: el flujo cerebral baja hasta un tercio"],
      tto: "Tratar la causa; ansiolíticos si es psicógena; bolsa de papel en casos leves; en ventilación mecánica mantener PaCO₂ ≈ 30; reponer K⁺.",
      formula: "Aguda: HCO₃⁻ baja 2 por cada 10 mmHg de PaCO₂ · Crónica: baja 4 por cada 10", lit: true
    }
  };

  /* ---------- clasificar el trastorno primario ---------- */
  function clasificar(pH, pco2, hco3) {
    const p = Math.round(pH * 100) / 100;
    const acid = p < N.pH[0], alc = p > N.pH[1];
    const hB = hco3 < N.hco3[0], hA = hco3 > N.hco3[1], cA = pco2 > N.pco2[1], cB = pco2 < N.pco2[0];
    // desviación relativa para desempatar
    const dM = (24 - hco3) / 24, dR = (pco2 - 40) / 40;
    if (acid) {
      if (hB && cA) return dM >= dR ? "AM" : "AR";
      if (hB) return "AM";
      if (cA) return "AR";
      return dM >= dR ? "AM" : "AR";
    }
    if (alc) {
      if (hA && cB) return -dM >= -dR ? "AlM" : "AlR";
      if (hA) return "AlM";
      if (cB) return "AlR";
      return -dM >= -dR ? "AlM" : "AlR";
    }
    // pH normal: compensado o normal
    if (hB && cB) return p <= 7.40 ? "AM" : "AlR";
    if (hA && cA) return p < 7.40 ? "AR" : "AlM";
    if (hB) return "AM";
    if (hA) return "AlM";
    if (cA) return "AR";
    if (cB) return "AlR";
    return "NORMAL";
  }

  /* ---------- compensación esperada (literatura) y trastornos agregados ---------- */
  function compensar(prim, pco2, hco3) {
    const o = { prim, lit: true };
    if (prim === "AM") {
      const c = 1.5 * hco3 + 8;
      Object.assign(o, { variable: "PaCO₂", centro: c, lo: c - 2, hi: c + 2, real: pco2, formula: "PaCO₂ = 1,5 × HCO₃⁻ + 8 (± 2)" });
      o.agregado = pco2 > o.hi ? "AR" : pco2 < o.lo ? "AlR" : null;
    } else if (prim === "AlM") {
      const c = 40 + 0.7 * (hco3 - 24);
      Object.assign(o, { variable: "PaCO₂", centro: c, lo: c - 5, hi: c + 5, real: pco2, formula: "PaCO₂ = 40 + 0,7 × (HCO₃⁻ − 24) (± 5)" });
      o.agregado = pco2 > o.hi ? "AR" : pco2 < o.lo ? "AlR" : null;
    } else if (prim === "AR") {
      const d = (pco2 - 40) / 10, ag = 24 + d, cr = 24 + 3.5 * d;
      Object.assign(o, { variable: "HCO₃⁻", real: hco3, agudo: ag, cronico: cr, formula: "HCO₃⁻ = 24 + 1 × ΔPaCO₂/10 (aguda) · 24 + 3,5 × ΔPaCO₂/10 (crónica)" });
      if (hco3 < Math.min(ag - 2, N.hco3[0])) o.agregado = "AM";   // la clase: en lo agudo el HCO₃⁻ queda normal (22-26)
      else if (hco3 <= ag + 2) o.crono = "aguda";
      else if (hco3 < cr - 2) o.crono = "subaguda";
      else if (hco3 <= cr + 2) o.crono = "crónica";
      else o.agregado = "AlM";
      o.centro = o.crono === "crónica" ? cr : ag; o.lo = o.crono === "crónica" ? cr - 2 : ag - 2; o.hi = o.crono === "crónica" ? cr + 2 : ag + 2;
    } else if (prim === "AlR") {
      const d = (40 - pco2) / 10, ag = 24 - 2 * d, cr = 24 - 4 * d;
      Object.assign(o, { variable: "HCO₃⁻", real: hco3, agudo: ag, cronico: cr, formula: "HCO₃⁻ = 24 − 2 × ΔPaCO₂/10 (aguda) · 24 − 4 × ΔPaCO₂/10 (crónica)" });
      if (hco3 > ag + 2) o.agregado = "AlM";
      else if (hco3 >= ag - 2) o.crono = "aguda";
      else if (hco3 > cr + 2) o.crono = "subaguda";
      else if (hco3 >= cr - 2) o.crono = "crónica";
      else o.agregado = "AM";
      o.centro = o.crono === "crónica" ? cr : ag; o.lo = o.crono === "crónica" ? cr - 2 : ag - 2; o.hi = o.crono === "crónica" ? cr + 2 : ag + 2;
    }
    return o;
  }

  /* ---------- anión gap (literatura: la clase no da la cifra) ---------- */
  const ag = (na, cl, hco3) => na - cl - hco3;
  const agCorr = (a, alb) => a + 2.5 * (4 - alb);   // corrección por albúmina (literatura)
  function delta(a, hco3) {                          // delta-delta, referencia AG normal 10 y HCO3 24
    const dAG = a - N.agRef, dH = N.hco3Ref - hco3;
    if (dH <= 0) return null;
    const r = dAG / dH;   // [REVISAR] cortes 0,8 y 2: en la literatura varían (0,4-0,8 mixta; 1-2 pura)
    let txt;
    if (r < 0.8) txt = "ΔAG/ΔHCO₃⁻ menor de ≈ 0,8: además hay una acidosis de anión gap normal (hiperclorémica).";
    else if (r <= 2) txt = "ΔAG/ΔHCO₃⁻ entre 1 y 2 (aprox.): acidosis de anión gap alto «pura».";
    else txt = "ΔAG/ΔHCO₃⁻ &gt; 2: el HCO₃⁻ bajó menos de lo que predice el anión gap: hay además una alcalosis metabólica (p. ej. vómitos).";
    return { dAG, dH, r, txt, agregado: r < 0.8 ? "AMn" : r > 2 ? "AlM" : null };
  }

  const NOMBRES = { AM: "acidosis metabólica", AlM: "alcalosis metabólica", AR: "acidosis respiratoria", AlR: "alcalosis respiratoria", AMn: "acidosis metabólica de anión gap normal" };

  /* ---------- lectura completa en pasos ---------- */
  function leer(v) {
    const pco2 = v.pco2, hco3 = v.hco3, pH = v.pH != null ? v.pH : ph(hco3, pco2);
    const hay = v.na != null && v.cl != null;
    const A = hay ? ag(v.na, v.cl, hco3) : null;
    const Ac = hay ? (v.alb != null ? agCorr(A, v.alb) : A) : null;
    const alto = Ac != null && Ac > N.ag[1], bajo = Ac != null && Ac < N.ag[0];
    let prim = clasificar(pH, pco2, hco3);
    // pH casi normal con HCO3 bajo, PaCO2 baja y AG alto: el AG delata la acidosis metabólica como primaria (p. ej. salicilatos)
    if (prim === "AlR" && alto && hco3 < N.hco3[0] && Math.round(pH * 100) / 100 <= N.pH[1]) prim = "AM";
    const comp = prim === "NORMAL" ? null : compensar(prim, pco2, hco3);
    const dl = alto && prim !== "NORMAL" ? delta(Ac, hco3) : null;

    const agregados = [];
    if (comp && comp.agregado) agregados.push(comp.agregado);
    if (dl && dl.agregado && (prim === "AM" || prim === "AlR" || prim === "AlM" || prim === "AR")) {
      if (!agregados.includes(dl.agregado) && dl.agregado !== prim) agregados.push(dl.agregado);
    }
    if (alto && prim !== "AM" && !agregados.includes("AM")) { /* AG alto sin acidosis metabólica evidente */ }
    const p = Math.round(pH * 100) / 100;
    const estado = p < N.pH[0] ? "acidemia" : p > N.pH[1] ? "alcalemia" : "pH normal";

    const pasos = [];
    // 1 · pH
    pasos.push({
      t: "1 · ¿Qué dice el pH?", cls: p < 7.35 ? "ro" : p > 7.45 ? "mo" : "ve",
      h: `pH <b>${f(pH, 2)}</b>: ` + (p < 7.35 ? `menor de 7,35 → <b>acidemia</b>.` : p > 7.45 ? `mayor de 7,45 → <b>alcalemia</b>.` : `dentro de 7,35-7,45 (clase). Puede ser todo normal o un trastorno compensado: mira igual PaCO₂ y HCO₃⁻.`) +
        (p < 7.22 ? ` Grave: la clase llama grave a pH &lt; 7,22.` : "")
    });
    // 2 · primario
    let h2;
    const hd = hco3 < 22 ? "bajo ↓" : hco3 > 26 ? "alto ↑" : "normal", cd = pco2 > 45 ? "alta ↑" : pco2 < 35 ? "baja ↓" : "normal";
    if (prim === "NORMAL") h2 = `PaCO₂ ${f(pco2)} (${cd}) y HCO₃⁻ ${f(hco3, 1)} (${hd}): <b>gasometría normal</b>. No hay trastorno primario.`;
    else {
      const M = prim === "AM" || prim === "AlM";
      h2 = `PaCO₂ ${f(pco2)} mmHg (<b>${cd}</b>) y HCO₃⁻ ${f(hco3, 1)} mEq/L (<b>${hd}</b>). `;
      h2 += `El que se mueve en la <b>misma dirección que el pH</b> es el primario: <b>${DES[prim].prim}</b> → <b>${NOMBRES[prim]}</b> (${M ? "metabólica: el primario es el HCO₃⁻" : "respiratoria: el primario es el CO₂"}). `;
      h2 += M ? `La PaCO₂ solo es la respuesta del pulmón.` : `El HCO₃⁻ solo es la respuesta del riñón.`;
    }
    pasos.push({ t: "2 · ¿Quién es el primario?", cls: "az", h: h2 });
    // 3 · compensación
    let h3;
    if (!comp) h3 = "Sin trastorno primario no hay compensación que evaluar.";
    else if (prim === "AM" || prim === "AlM") {
      const veredicto = comp.agregado === "AR" ? `real <b>${f(pco2)}</b> está <b>por encima</b>: el pulmón no compensa lo suficiente → se agrega <b>acidosis respiratoria</b>.` :
        comp.agregado === "AlR" ? `real <b>${f(pco2)}</b> está <b>por debajo</b>: el pulmón hiperventila de más → se agrega <b>alcalosis respiratoria</b>.` :
          `real <b>${f(pco2)}</b> cae dentro del rango → <b>compensación adecuada</b>.`;
      h3 = `Esperada ${LIT}: ${comp.formula} = <b>${f(comp.centro, 1)}</b> (${f(comp.lo)}-${f(comp.hi)}) mmHg; ${veredicto}` +
        (prim === "AM" ? ` La clase solo dice que el pulmón compensa con hiperventilación (Kussmaul).` : ` La clase dice «PaCO₂ normal o ligeramente aumentada».`);
    } else {
      const ca = comp.crono, nm = ca ? ` Cuadro <b>${ca}</b>.` : "";
      let ver;
      if (comp.agregado === "AM") ver = `el HCO₃⁻ real <b>${f(hco3, 1)}</b> es <b>menor</b> que el esperado → se agrega <b>acidosis metabólica</b>.`;
      else if (comp.agregado === "AlM") ver = `el HCO₃⁻ real <b>${f(hco3, 1)}</b> es <b>mayor</b> que el esperado → se agrega <b>alcalosis metabólica</b>.`;
      else if (ca === "aguda") ver = `el HCO₃⁻ real <b>${f(hco3, 1)}</b> encaja con lo agudo: <b>el riñón aún no compensó</b> (la clase: «aguda → HCO₃⁻ normal»).`;
      else if (ca === "crónica") ver = `el HCO₃⁻ real <b>${f(hco3, 1)}</b> encaja con lo crónico: <b>el riñón ya compensó</b> (la clase: «crónica → HCO₃⁻ ${prim === "AR" ? "aumentado" : "algo bajo"}»).`;
      else ver = `el HCO₃⁻ real <b>${f(hco3, 1)}</b> queda entre lo agudo y lo crónico: <b>subaguda</b> o aguda sobre crónica.`;
      h3 = `Esperado ${LIT}: aguda ≈ <b>${f(comp.agudo, 1)}</b>, crónica ≈ <b>${f(comp.cronico, 1)}</b> mEq/L (${comp.formula}); ${ver}${nm}`;
    }
    pasos.push({ t: "3 · ¿La compensación es la esperada?", cls: comp && comp.agregado ? "ro" : "ve", h: h3 });
    // 4 · AG
    let h4;
    if (!hay) h4 = `Sin Na⁺ y Cl⁻ no se calcula. Fórmula ${LIT}: AG = Na⁺ − (Cl⁻ + HCO₃⁻); normal ≈ 8-12 mEq/L (la clase no da la cifra).`;
    else {
      h4 = `AG = ${f(v.na)} − (${f(v.cl)} + ${f(hco3, 1)}) = <b>${f(A, 1)}</b> mEq/L ${LIT}` + (v.alb != null && v.alb !== 4 ? `; corregido por albúmina ${f(v.alb, 1)} g/dL = <b>${f(Ac, 1)}</b>` : "") + ". ";
      if (alto) h4 += `<b>AG alto (&gt; 12)</b>: hay ácidos que dejan un anión no medido. Con la clase: cetoacidosis, láctica (shock), alcohol, insuficiencia renal; y ${LIT}: metanol, etilenglicol, salicilatos.` + (prim !== "AM" ? ` Con un primario que no es acidosis metabólica, un AG alto delata una acidosis metabólica oculta.` : "");
      else if (bajo) h4 += `AG bajo (&lt; 8): ${LIT} piensa en hipoalbuminemia o error de laboratorio.`;
      else h4 += prim === "AM" ? `<b>AG normal</b>: se perdió bicarbonato y el cloro lo reemplazó (hiperclorémica): diarrea grave, acidosis tubular renal.` : `<b>AG normal</b>.`;
    }
    pasos.push({ t: "4 · Anión gap", cls: alto ? "ro" : "ve", h: h4 });
    // 5 · delta
    let h5;
    if (dl) h5 = `${LIT} ΔAG = ${f(Ac, 1)} − 10 = <b>${f(dl.dAG, 1)}</b>; ΔHCO₃⁻ = 24 − ${f(hco3, 1)} = <b>${f(dl.dH, 1)}</b>; cociente = <b>${f(dl.r, 2)}</b>. ${dl.txt}`;
    else if (alto) h5 = `El HCO₃⁻ no está por debajo de 24: no se puede calcular el cociente ΔAG/ΔHCO₃⁻ ${LIT} (con AG alto y HCO₃⁻ normal o alto sospecha además una alcalosis metabólica).`;
    else h5 = `Solo se calcula el delta si el AG está alto. Aquí no hace falta. ${LIT} La clase no trae el delta-delta.`;
    pasos.push({ t: "5 · Delta (solo si el AG está alto)", cls: "mo", h: h5 });
    // 6 · conclusión
    let diag;
    if (prim === "NORMAL") diag = "Gasometría normal";
    else {
      diag = NOMBRES[prim][0].toUpperCase() + NOMBRES[prim].slice(1);
      if (comp && comp.crono) diag += " " + comp.crono;
      if (agregados.length) diag += " + " + agregados.map(k => NOMBRES[k]).join(" + ");
      else if (comp) diag += " con compensación " + (comp.crono === "aguda" ? "renal aún ausente" : "adecuada");
    }
    let h6 = `<b>${diag}.</b> `;
    if (prim !== "NORMAL") {
      h6 += `<br>Clínica en la clase: ${DES[prim].clinica.slice(0, 4).join("; ")}.`;
      h6 += `<br>K⁺ (Clase 7): ` + (estado === "acidemia" ? "la acidosis hace entrar H⁺ y salir K⁺ de la célula → tendencia a <b>hiperpotasemia</b>." : estado === "alcalemia" ? "la alcalosis hace entrar K⁺ a la célula → tendencia a <b>hipopotasemia</b> (y la hipopotasemia mantiene la alcalosis metabólica)." : "con pH normal no hay desplazamiento neto de K⁺.");
    }
    pasos.push({ t: "6 · Conclusión", cls: "na", h: h6 });

    return { pH, prim, comp, estado, ag: A, agc: Ac, agAlto: alto, delta: dl, agregados, diag, pasos, hd, cd };
  }

  /* ---------- catálogo de causas (de la clase) para los casos al azar ---------- */
  const CAUSAS = {
    AM_alto: [
      { id: "cad", txt: "Cetoacidosis diabética", hist: "Joven con diabetes tipo 1 que dejó la insulina: respiración profunda y rítmica, somnolencia y deshidratación." },
      { id: "lac", txt: "Acidosis láctica por shock", hist: "Paciente en shock: hipotensión, piel fría y mala perfusión, confuso." },
      { id: "etoh", txt: "Intoxicación por alcohol etílico", hist: "Hombre hallado somnoliento, con aliento etílico, tras una ingesta masiva." },
      { id: "ir", txt: "Insuficiencia renal (uremia)", hist: "Paciente con insuficiencia renal avanzada: oliguria, náuseas y respiración profunda." }
    ],
    AM_normal: [
      { id: "diar", txt: "Diarrea grave (pérdida intestinal de bicarbonato)", hist: "Niño con diarrea profusa de tres días, deshidratado." },
      { id: "atr", txt: "Acidosis tubular renal", hist: "Adulto con debilidad crónica; el riñón no regenera bicarbonato, sin otra fuente de ácido." }
    ],
    AlM: [
      { id: "vom", txt: "Vómitos incoercibles (pérdida de H⁺ y Cl⁻)", hist: "Paciente con vómitos incoercibles desde hace varios días." },
      { id: "diu", txt: "Diuréticos (asa o tiazídicos)", hist: "Hipertenso en tratamiento con furosemida a dosis altas, con calambres." },
      { id: "aldo", txt: "Hiperaldosteronismo", hist: "Hipertensa con debilidad muscular; aldosterona elevada." },
      { id: "bic", txt: "Sobredosis de bicarbonato de sodio", hist: "Paciente que recibió bicarbonato IV en exceso tras un paro." }
    ],
    AR_aguda: [
      { id: "snc", txt: "Depresión del SNC por drogas", hist: "Joven hallado casi inconsciente tras consumo de sedantes; respira muy lento." },
      { id: "cuerpo", txt: "Obstrucción de vía aérea (cuerpo extraño)", hist: "Niño que se atragantó con un fruto seco hace minutos; estridor." },
      { id: "neumo", txt: "Neumotórax", hist: "Joven alto con dolor torácico súbito y disnea; murmullo vesicular abolido." },
      { id: "eap", txt: "Edema agudo de pulmón", hist: "Paciente con disnea intensa, ortopnea y crepitantes difusos." }
    ],
    AR_cronica: [
      { id: "epoc", txt: "EPOC (enfisema, bronquitis crónica)", hist: "Fumador de 68 años con tos crónica y disnea de años; ahora algo somnoliento." },
      { id: "obes", txt: "Síndrome de obesidad-hipoventilación", hist: "Mujer con obesidad mórbida y somnolencia diurna; cefalea matutina." }
    ],
    AlR_aguda: [
      { id: "ans", txt: "Crisis de ansiedad", hist: "Mujer joven con palpitaciones, hormigueo en manos y boca, respira rápido tras una discusión." },
      { id: "hip", txt: "Hipoxemia (asma grave, altura)", hist: "Escalador recién llegado a gran altura, con taquipnea y mareo." },
      { id: "fie", txt: "Fiebre / sepsis", hist: "Paciente con fiebre alta y taquipnea, foco infeccioso en estudio." },
      { id: "sal", txt: "Salicilatos (drogas)", hist: "Paciente que ingirió muchas pastillas de aspirina; taquipnea y tinnitus." },
      { id: "snc2", txt: "Alteración del SNC (ACV, meningitis)", hist: "Paciente con cefalea, fiebre y rigidez de nuca; respira rápido." }
    ],
    AlR_cronica: [
      { id: "alt", txt: "Hipoxemia sostenida de altura", hist: "Residente de altura con hiperventilación mantenida durante semanas." }
    ]
  };

  // trastornos mixtos (literatura): para el nivel avanzado
  const MIXTOS = [
    { id: "m1", prim: "AM", agr: "AR", txt: "Acidosis láctica por shock en un paciente con EPOC agotado", hist: "Paciente EPOC en shock séptico, ahora con respiración superficial y cansada.", cuerpo: "AM+AR" },
    { id: "m2", prim: "AM", agr: "AlM", txt: "Cetoacidosis diabética con vómitos incoercibles", hist: "Diabético tipo 1 descompensado con vómitos repetidos desde hace dos días.", cuerpo: "AM+AlM" },
    { id: "m3", prim: "AM", agr: "AlR", txt: "Intoxicación por salicilatos (AG alto + alcalosis respiratoria)", hist: "Adulto que ingirió gran cantidad de aspirina: taquipnea, tinnitus, vómitos.", cuerpo: "AM+AlR" }
  ];

  /* ---------- generador de gasometrías al azar ---------- */
  function mk(rand) {
    const U = (a, b) => a + (b - a) * rand();
    const I = (a, b) => Math.round(U(a, b));
    const pick = arr => arr[Math.floor(rand() * arr.length) % arr.length];
    return { U, I, pick };
  }
  function shuffle(a, rand) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function generarCaso(rand, opc) {
    rand = rand || Math.random; opc = opc || {};
    const { U, I, pick } = mk(rand);
    const tipos = ["AM_alto", "AM_alto", "AM_normal", "AlM", "AR_aguda", "AR_cronica", "AlR_aguda", "AlR_cronica"];
    let grupo = opc.grupo || (opc.mixtos && rand() < 0.35 ? "MIX" : pick(tipos));
    const na = I(136, 142);
    let c, causa, prim, crono = null, agAlto = false, hco3, pco2, cl, k, agregado = null;
    if (grupo === "MIX") {
      causa = pick(MIXTOS); prim = causa.prim; agregado = causa.agr; agAlto = true;
      if (causa.id === "m1") { hco3 = I(8, 12); pco2 = Math.round(1.5 * hco3 + 8 + U(7, 12)); const AGv = 10 + (24 - hco3) * U(0.9, 1.1); cl = Math.round(na - hco3 - AGv); k = +U(5.0, 5.8).toFixed(1); }
      else if (causa.id === "m2") { hco3 = I(16, 19); pco2 = Math.round(1.5 * hco3 + 8 + U(-1, 1)); const AGv = 10 + (24 - hco3) * U(2.4, 3.0); cl = Math.round(na - hco3 - AGv); k = +U(3.0, 3.6).toFixed(1); }
      else { hco3 = I(10, 12); pco2 = Math.round(1.5 * hco3 + 8 - U(4, 6.5)); const AGv = 10 + (24 - hco3) * U(0.9, 1.1); cl = Math.round(na - hco3 - AGv); k = +U(3.6, 4.2).toFixed(1); }
    } else {
      c = pick(CAUSAS[grupo]); causa = c;
      if (grupo === "AM_alto") { prim = "AM"; agAlto = true; hco3 = I(6, 16); pco2 = Math.round(1.5 * hco3 + 8 + U(-1.5, 1.5)); const AGv = 10 + (24 - hco3) * U(0.95, 1.15); cl = Math.round(na - hco3 - AGv); k = +U(5.0, 6.2).toFixed(1); }
      else if (grupo === "AM_normal") { prim = "AM"; hco3 = I(8, 17); pco2 = Math.round(1.5 * hco3 + 8 + U(-1.5, 1.5)); cl = Math.round(na - hco3 - U(8, 11)); k = c.id === "diar" ? +U(3.0, 3.5).toFixed(1) : null; }
      else if (grupo === "AlM") { prim = "AlM"; hco3 = I(35, 46); pco2 = Math.round(40 + 0.7 * (hco3 - 24) + U(-2.5, 2.5)); cl = Math.round(na - hco3 - U(8, 11)); k = c.id === "bic" ? +U(3.8, 4.4).toFixed(1) : +U(2.6, 3.3).toFixed(1); }
      else if (grupo === "AR_aguda") { prim = "AR"; crono = "aguda"; pco2 = I(52, 90); hco3 = Math.round((24 + (pco2 - 40) / 10 + U(-1, 1)) * 10) / 10; cl = Math.round(na - hco3 - U(8, 11)); k = +U(4.8, 5.5).toFixed(1); }
      else if (grupo === "AR_cronica") { prim = "AR"; crono = "crónica"; pco2 = I(58, 80); hco3 = Math.round((24 + 3.5 * (pco2 - 40) / 10 + U(-1.5, 1.5)) * 10) / 10; cl = Math.round(na - hco3 - U(8, 11)); k = +U(4.0, 4.8).toFixed(1); }
      else if (grupo === "AlR_aguda") { prim = "AlR"; crono = "aguda"; pco2 = I(18, 30); hco3 = Math.round((24 - 2 * (40 - pco2) / 10 + U(-1, 1)) * 10) / 10; cl = Math.round(na - hco3 - U(8, 11)); k = +U(3.2, 3.8).toFixed(1); }
      else { prim = "AlR"; crono = "crónica"; pco2 = I(18, 24); hco3 = Math.round((24 - 4 * (40 - pco2) / 10 + U(-1, 1)) * 10) / 10; cl = Math.round(na - hco3 - U(8, 11)); k = +U(3.4, 4.0).toFixed(1); }
    }
    const pH = ph(hco3, pco2);
    const caso = { grupo, prim, crono, agAlto, agregado, causa, pH, pco2, hco3, na, cl, k, alb: 4 };
    caso.lectura = leer({ pco2, hco3, na, cl });
    caso.preguntas = armarPreguntas(caso, rand);
    return caso;
  }

  /* ---------- preguntas del caso (3 por caso) ---------- */
  function armarPreguntas(cs, rand) {
    const L = cs.lectura, esMix = cs.grupo === "MIX";
    const Q = [];
    // Q1: primario
    const base = ["Acidosis metabólica", "Alcalosis metabólica", "Acidosis respiratoria", "Alcalosis respiratoria"];
    const o1 = esMix || cs.opcMix ? base.concat(["Trastorno mixto (dos o más)"]) : base;
    const okT = esMix ? "Trastorno mixto (dos o más)" : DES[cs.prim].nombre;
    const ex1 = esMix ?
      `<b>Mixto.</b> ${L.pasos[1].h}<br>${L.pasos[2].h}<br>Si la compensación no es la esperada (o el delta no cuadra), hay un segundo trastorno.` :
      `${L.pasos[0].h}<br>${L.pasos[1].h}`;
    Q.push({ q: "¿Cuál es el trastorno primario?", opts: o1, ok: o1.indexOf(okT), expl: ex1 });
    // Q2
    if (esMix) {
      const o = ["Acidosis respiratoria agregada", "Alcalosis respiratoria agregada", "Alcalosis metabólica agregada", "Acidosis metabólica de AG normal agregada"];
      const okk = { AR: 0, AlR: 1, AlM: 2, AMn: 3 }[cs.agregado];
      Q.push({ q: "Se agrega un segundo trastorno: ¿cuál?", opts: o, ok: okk, expl: `${L.pasos[2].h}<br>${L.pasos[4].h}` });
    } else if (cs.prim === "AM") {
      const o = ["Anión gap aumentado", "Anión gap normal"];
      Q.push({ q: `Con Na⁺ ${cs.na}, Cl⁻ ${cs.cl} y HCO₃⁻ ${f(cs.hco3, 0)}: ¿cómo es el anión gap?`, opts: o, ok: cs.agAlto ? 0 : 1, expl: L.pasos[3].h });
    } else if (cs.prim === "AlM") {
      const o = shuffle(["Hipoventila: la PaCO₂ sube un poco", "Hiperventila: la PaCO₂ baja", "No hay respuesta respiratoria"], rand);
      Q.push({ q: "¿Qué hace el pulmón para compensar esta alcalosis?", opts: o, ok: o.indexOf("Hipoventila: la PaCO₂ sube un poco"), expl: `La clase: «hipoventilación compensatoria» para retener CO₂. ${L.pasos[2].h}` });
    } else {
      const o = ["Aguda (el riñón aún no compensó)", "Crónica (el riñón ya compensó)"];
      Q.push({ q: "¿La alteración es aguda o crónica? (mira el HCO₃⁻)", opts: o, ok: cs.crono === "aguda" ? 0 : 1, expl: L.pasos[2].h });
    }
    // Q3: causa
    const todas = [];
    Object.keys(CAUSAS).forEach(g => CAUSAS[g].forEach(x => todas.push({ g, x })));
    MIXTOS.forEach(m => todas.push({ g: "MIX", x: m }));
    const corr = cs.causa;
    const mismos = shuffle(todas.filter(t => t.x.id !== corr.id && (cs.grupo === "MIX" ? t.g === "MIX" : t.g.split("_")[0] === cs.grupo.split("_")[0])), rand);
    const otros = shuffle(todas.filter(t => t.x.id !== corr.id && !mismos.includes(t) && (cs.grupo === "MIX" ? t.g !== "MIX" : true)), rand);
    const distr = mismos.slice(0, 1).concat(otros).slice(0, 3).map(t => t.x);
    const opts = shuffle([corr].concat(distr), rand);
    Q.push({
      q: `Cuadro: ${corr.hist} ¿Cuál es la causa más probable?`, opts: opts.map(o => o.txt), ok: opts.indexOf(corr),
      expl: `<b>${corr.txt}.</b> ` + (esMix ? `${LIT} Combinación frecuente en la práctica.` : `Es una de las causas que da la clase para la ${DES[cs.prim].corto}.`) + ` K⁺ ${cs.k != null ? f(cs.k, 1) : "—"} mEq/L.`
    });
    return Q;
  }

  /* ---------- trayectoria de un trastorno (para animar) ---------- */
  // devuelve {primario:{pco2,hco3}, comp:{pco2,hco3}} desde normal (40, 24); inten 1..3
  function trayecto(key, crono, inten) {
    const i = clamp(inten, 1, 3) - 1;
    if (key === "AM") { const h = [18, 12, 7][i]; return { p: { pco2: 40, hco3: h }, c: { pco2: 1.5 * h + 8, hco3: h } }; }
    if (key === "AlM") { const h = [32, 38, 44][i]; return { p: { pco2: 40, hco3: h }, c: { pco2: 40 + 0.7 * (h - 24), hco3: h } }; }
    if (key === "AR") { const c = [55, 70, 90][i], d = (c - 40) / 10; return { p: { pco2: c, hco3: 24 }, c: { pco2: c, hco3: 24 + (crono === "crónica" ? 3.5 : 1) * d } }; }
    const c = [32, 26, 20][i], d = (40 - c) / 10;
    return { p: { pco2: c, hco3: 24 }, c: { pco2: c, hco3: 24 - (crono === "crónica" ? 4 : 2) * d } };
  }

  /* ---------- déficit de bicarbonato (Clase 8) ---------- */
  function deficit(peso, hco3) {
    const meq = 0.5 * peso * (24 - hco3);
    return { meq, ml: meq, indicado: null };
  }

  const API = { N, DES, LIT, CAUSAS, MIXTOS, NOMBRES, f, clamp, ph, hco3De, pco2De, clasificar, compensar, ag, agCorr, delta, leer, generarCaso, armarPreguntas, trayecto, deficit, shuffle };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.AB = API;
})(typeof window !== "undefined" ? window : globalThis);
