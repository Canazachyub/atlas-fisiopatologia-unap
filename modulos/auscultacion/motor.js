/* Motor de la auscultación cardiaca: datos de la clase + modelo del latido.
   No toca el DOM ni el audio: devuelve una lista de EVENTOS sonoros (golpes y ruidos filtrados) que
   app.js convierte en Web Audio y en fonocardiograma. Se puede probar en Node (ver _test.js).
   Fuentes: wiki/SEMIOLOGIA/clases 08c (focos y ruidos), 08d (soplos) y 08h (valvulopatías).
   Lo que NO sale de la clase va marcado lit:true (se muestra como «literatura»). */
(function () {
  "use strict";
  const lim = (x, a, b) => Math.max(a, Math.min(b, x));

  /* ---------- focos (coordenadas del tórax SVG 300x340; el esternón está en x=150;
     el lado izquierdo del paciente queda a la derecha de la imagen) ---------- */
  const FOCOS = {
    aortico:    { n: "Aórtico", x: 128, y: 118, esp: "2.º espacio intercostal derecho, línea paraesternal", g1: 0.35, g2: 1.0, pred: "R2 (cierre aórtico, A2)", color: "#B91C1C" },
    pulmonar:   { n: "Pulmonar", x: 172, y: 118, esp: "2.º espacio intercostal izquierdo, línea paraesternal", g1: 0.35, g2: 1.0, pred: "R2 (cierre pulmonar, P2)", color: "#1D4ED8" },
    erb:        { n: "Accesorio aórtico (Erb)", x: 172, y: 144, esp: "3.er espacio intercostal izquierdo, línea paraesternal", g1: 0.7, g2: 0.9, pred: "R1 y R2 casi parejos", color: "#B45309", lit: "El nombre «de Erb» es de la literatura; la clase lo llama foco accesorio aórtico." },
    tricuspideo:{ n: "Tricuspídeo", x: 152, y: 238, esp: "base del apéndice xifoides", g1: 0.9, g2: 0.4, pred: "R1 (cierre tricuspídeo)", color: "#15803D" },
    mitral:     { n: "Mitral", x: 214, y: 196, esp: "5.º espacio intercostal izquierdo, línea medioclavicular (choque de la punta)", g1: 1.0, g2: 0.45, pred: "R1 (cierre mitral, M1)", color: "#CA8A04" }
  };
  const ORDEN_FOCOS = ["mitral", "tricuspideo", "pulmonar", "aortico"]; // secuencia de la clase

  /* ---------- lesiones (soplos) ---------- */
  // forma: rombo (crescendo-decrescendo, eyección), holo (holosistólico), decre (protodiastólico decreciente),
  // ruflar (mesodiastólico con refuerzo final), cont (continuo en maquinaria)
  const VALV = {
    em: { id: "em", n: "Estenosis mitral", momento: "diastole", forma: "ruflar", f: 120, q: 1.2, trem: 26, timbre: "Ruflar grave (retumbo); el texto además la llama «áspera»", zona: "punta", punto: "mitral",
          irr: [], irrTxt: "No especificada en la clase: queda localizada en la punta.",
          mods: { r1: 1.5, r1retraso: 0.03, apertura: true }, aperturaLit: true,
          resumen: "R1 brillante y retardado, y un ruflar mesodiastólico que se refuerza al final.",
          pista: "Fiebre reumática (75-85 %), fibrilación auricular, aurícula izquierda dilatada.",
          man: "Decúbito de Pachón (lateral izquierdo): refuerza el soplo de la punta.", fuente: "08d §4, §8; 08h §2-3; 08c §5" },
    im: { id: "im", n: "Insuficiencia mitral", momento: "sistole", forma: "holo", f: 300, q: 0.8, timbre: "Soplante, uniforme", zona: "punta", punto: "mitral",
          irr: [[262, 150, "axila"], [282, 196, "dorso"], [268, 232, "hemitórax izq. y región posterior"]], irrTxt: "Axila, dorso y hemitórax izquierdo (región posterior).",
          mods: { r1: 0.5 }, resumen: "R1 debilitado y soplo holosistólico que ocupa toda la sístole con intensidad pareja.",
          pista: "Reflujo del ventrículo a la aurícula izquierda en sístole.",
          man: "Decúbito de Pachón: refuerza el soplo de la punta.", fuente: "08d §3, §8; 08h §2; 08c §5" },
    ea: { id: "ea", n: "Estenosis aórtica", momento: "sistole", forma: "rombo", f: 230, q: 0.9, timbre: "Rudo", zona: "base", punto: "aortico",
          irr: [[128, 54, "vasos del cuello"], [160, 48, ""]], irrTxt: "Hacia los vasos de la base del cuello, hacia arriba.",
          mods: {}, resumen: "Soplo mesosistólico de eyección en rombo (crece y decrece), rudo.",
          pista: "Tríada: angina, síncope de esfuerzo y disnea. Pulso parvus.",
          man: "Sentado e inclinado hacia adelante: pone de manifiesto los soplos de la base.", fuente: "08d §3, §7, §8; 08h §2, §4" },
    ia: { id: "ia", n: "Insuficiencia aórtica", momento: "diastole", forma: "decre", f: 520, q: 1.4, timbre: "Aspirativo, agudo (alta frecuencia)", zona: "base", punto: "aortico",
          irr: [[214, 196, "hacia el ápex"]], irrTxt: "Hacia el ápex.",
          mods: { r2: 0.5 }, resumen: "R2 debilitado y soplo diastólico que empieza justo tras R2 y decrece (aspirativo).",
          pista: "Presión divergente, pulso de Corrigan, Quincke, Musset, Duroziez en la femoral.",
          man: "Sentado e inclinado hacia adelante: pone de manifiesto los soplos de la base.", fuente: "08d §4, §7, §8; 08h §2, §4" },
    et: { id: "et", n: "Estenosis tricuspídea", momento: "diastole", forma: "ruflar", f: 110, q: 1.2, trem: 24, amp: 0.6, timbre: "Ruflar diastólico poco intenso, con refuerzo presistólico", zona: "punta", punto: "tricuspideo",
          irr: [], irrTxt: "No especificada en la clase.", mods: {}, insp: 1.7,
          resumen: "Ruflar diastólico débil con refuerzo presistólico; se intensifica con la inspiración.",
          pista: "Signo de Rivero-Carvallo. Congestión hepática, ascitis, edema. Fiebre reumática (3-5 %).",
          man: "Inspiración: intensifica el soplo (Rivero-Carvallo). Pachón para los focos de la punta.", fuente: "08h §2, §5; 08d §9" },
    it: { id: "it", n: "Insuficiencia tricuspídea", momento: "sistole", forma: "holo", f: 280, q: 0.8, timbre: "Soplante, sistólico de regurgitación", zona: "punta", punto: "tricuspideo",
          irr: [], irrTxt: "No especificada en la clase.", mods: {}, insp: 1.7,
          resumen: "Soplo sistólico de regurgitación en el xifoides que aumenta con la inspiración.",
          pista: "Ingurgitación yugular, hepatomegalia, ascitis; a menudo funcional por dilatación del ventrículo derecho.",
          man: "Inspiración: aumenta el soplo. Pachón para los focos de la punta.", fuente: "08h §2, §5; 08d §9" },
    ep: { id: "ep", n: "Estenosis pulmonar", momento: "sistole", forma: "rombo", f: 240, q: 0.9, timbre: "Rudo, de eyección", zona: "base", punto: "pulmonar",
          irr: [[196, 70, "hacia clavícula izq."]], irrTxt: "Hacia la clavícula izquierda.", irrLit: true,
          mods: {}, resumen: "Soplo mesosistólico de eyección en el foco pulmonar.",
          pista: "Es el componente de la tetralogía de Fallot; la clase la nombra como causa de soplo de eyección.",
          man: "Sentado e inclinado hacia adelante: pone de manifiesto los soplos de la base (equivalentes pulmonares).", fuente: "08d §3, §9; 08h §6" },
    ip: { id: "ip", n: "Insuficiencia pulmonar", momento: "diastole", forma: "decre", f: 480, q: 1.4, timbre: "Aspirativo, agudo", zona: "base", punto: "pulmonar",
          irr: [[165, 192, "borde esternal inferior"]], irrTxt: "Hacia el borde esternal izquierdo inferior.", irrLit: true,
          mods: {}, resumen: "Soplo diastólico de regurgitación que empieza tras R2 y decrece.",
          pista: "La clase la agrupa con la aórtica como regurgitación de sigmoideas.",
          man: "Sentado e inclinado hacia adelante (equivalentes pulmonares).", fuente: "08d §4, §9" },
    civ: { id: "civ", n: "Comunicación interventricular (CIV)", momento: "sistole", forma: "holo", f: 320, q: 0.8, timbre: "Holosistólico de regurgitación (cortocircuito izq.-der.)", zona: "otro", punto: "tricuspideo",
          irr: [[60, 222, ""], [250, 222, "en faja"]], irrTxt: "En faja, hacia los lados del tórax.",
          mods: { clic: true }, resumen: "Soplo holosistólico más audible en el apéndice xifoides, con clic de eyección y frémito en el borde esternal izquierdo.",
          pista: "La cardiopatía congénita más frecuente. Roger: orificio pequeño, benigno. Cianosis solo tardía.",
          man: "No hay maniobra específica en la clase.", fuente: "08d §3, §8; 08h §6" },
    cia: { id: "cia", n: "Comunicación interauricular (CIA)", momento: "sistole", forma: "rombo", f: 210, q: 0.8, amp: 0.7, timbre: "Eyección suave, transmisión pobre", zona: "otro", punto: "pulmonar",
          punto2: [172, 131], irr: [], irrTxt: "Transmisión pobre; frémito casi siempre ausente.",
          mods: { r1: 1.35, split: 0.05 }, resumen: "R1 acentuado, R2 desdoblado en el foco pulmonar y soplo de eyección en el 2.º-3.er espacio izquierdo.",
          pista: "Shunt izq.-der. por foramen oval; hiperflujo pulmonar; cianosis solo tardía.",
          man: "No hay maniobra específica en la clase.", fuente: "08h §6" },
    fallot: { id: "fallot", n: "Tetralogía de Fallot", momento: "sistole", forma: "rombo", f: 260, q: 0.9, timbre: "Áspero, en crescendo-decrescendo", zona: "otro", punto: "erb", punto2: [172, 157],
          irr: [], irrTxt: "No especificada; frémito sistólico en el 2.º espacio izquierdo.",
          mods: { r2: 1.3, split: 0 }, resumen: "Soplo sistólico de eyección áspero en el 3.er-4.º espacio izquierdo y R2 único y acentuado.",
          pista: "CIV + estenosis pulmonar + hipertrofia del ventrículo derecho + aorta cabalgada. Cianosis desde el nacimiento.",
          man: "Posición de cuclillas alivia la disnea (signo compensador, ver anamnesis).", fuente: "08h §6" },
    ductus: { id: "ductus", n: "Ductus (conducto arterioso persistente)", momento: "continuo", forma: "cont", f: 200, q: 0.7, timbre: "En maquinaria; el componente sistólico es más rudo", zona: "otro", punto: "pulmonar",
          punto2: [180, 100], puntoLit: true, irr: [], irrTxt: "La clase no la precisa.", irrLit: true,
          mods: {}, resumen: "Soplo continuo que cubre R1 y R2, más intenso en sístole («en maquinaria»).",
          pista: "Único ejemplo que da la clase de soplo continuo. La localización de este simulador es de literatura.",
          man: "No hay maniobra específica en la clase.", fuente: "08d §5" },
    coar: { id: "coar", n: "Coartación de la aorta", momento: "sistole", forma: "rombo", f: 250, q: 0.9, timbre: "Sistólico de eyección; además soplo continuo en el dorso", zona: "otro", punto: "erb", punto2: [165, 165],
          irr: [[282, 130, "dorso (continuo)"]], irrTxt: "Soplo continuo en el dorso por la circulación colateral.",
          mods: {}, resumen: "Soplo sistólico de eyección en el borde esternal izquierdo; a veces ruflar mesodiastólico en el ápex.",
          pista: "Pulsos femorales débiles, HTA en brazos e hipotensión en piernas.",
          man: "No hay maniobra específica en la clase.", fuente: "08h §6" },
    frote: { id: "frote", n: "Frote pericárdico", momento: "frote", forma: "frote", f: 1100, q: 0.7, timbre: "Roce de dos pedazos de cuero nuevo", zona: "otro", punto: "erb", punto2: [170, 185], puntoLit: true,
          irr: [], irrTxt: "Se ausculta localizado; no depende del flujo sanguíneo.",
          mods: {}, resumen: "Roce áspero por fricción de las hojas del pericardio inflamado; desaparece si se forma derrame.",
          pista: "Fiebre reumática, neumonía, TBC, uremia. Si desaparece en una pericarditis: sospechar derrame (ruidos apagados).",
          man: "No hay maniobra específica en la clase. Los tres componentes (sistólico, diastólico, presistólico) son literatura.", fuente: "08d §10" }
  };
  const ORDEN_VALV = ["em", "im", "ea", "ia", "et", "it", "ep", "ip", "civ", "cia", "fallot", "ductus", "coar", "frote"];
  // punto donde se ausculta (x,y) de cada lesión
  function puntoDe(v) { return v.punto2 ? { x: v.punto2[0], y: v.punto2[1] } : { x: FOCOS[v.punto].x, y: FOCOS[v.punto].y }; }

  /* ---------- tiempos del latido (T en s) ---------- */
  // La clase da la sístole ≈ 0.30 y la diástole ≈ 0.48 (FC ≈ 77). Con otra FC se acorta la sístole ∝ √T [REVISAR: ajuste didáctico, literatura].
  function tiempos(fc) {
    const T = 60 / lim(fc, 40, 180), sist = 0.30 * Math.sqrt(T / 0.78);
    return { T, sist, dia: T - sist };
  }

  /* ---------- envolvente de un soplo según su forma (u en 0..1) ---------- */
  function env(forma, u) {
    if (u < 0 || u > 1) return 0;
    switch (forma) {
      case "rombo": return Math.pow(Math.sin(Math.PI * u), 1.1);
      case "holo": return Math.min(1, u / 0.07, (1 - u) / 0.07) * (0.92 + 0.08 * Math.sin(5 * u));
      case "decre": return Math.min(1, u / 0.03) * Math.pow(1 - u, 1.25);
      case "ruflar": return 0.55 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 1.2) * (1 - u) + 0.9 * Math.pow(u, 5);
      case "cont": return 0.55 + 0.45 * Math.cos(2 * Math.PI * (u - 0.38)); // máximo hacia el final de la sístole, nunca cero
      default: return 0;
    }
  }
  // ventana [a,b] del soplo dentro del latido
  function ventana(forma, ti) {
    const { T, sist } = ti;
    switch (forma) {
      case "rombo": return [0.07, sist - 0.03];
      case "holo": return [0.02, sist + 0.01];
      case "decre": return [sist + 0.012, sist + 0.012 + 0.5 * (T - sist)];
      case "ruflar": return [sist + 0.10, T - 0.012];
      case "cont": return [0, T];
      default: return [0, T];
    }
  }

  /* ---------- ganancia de un soplo según foco, grado y maniobra ---------- */
  const GRADO = g => 0.1 + 0.15 * lim(g, 1, 6); // Freeman-Levine I..VI → 0.25..1.0
  function distFoco(v, foco) {
    const p = puntoDe(v), f = FOCOS[foco]; return Math.hypot(p.x - f.x, p.y - f.y);
  }
  function gananciaFoco(v, foco) { return lim(1 - distFoco(v, foco) / 100, 0.08, 1); }
  function mult(v, man, insp) {
    let m = 1;
    if (man === "pachon" && v.zona === "punta") m *= 1.6;
    if (man === "inclinado" && v.zona === "base") m *= 1.6;
    if (man === "ejercicio") m *= 1.25;
    if (v.insp) m *= insp ? v.insp : 1 / v.insp * 0.8;
    return m;
  }

  /* ---------- el latido: lista de eventos ----------
     cfg: { fc, insp (bool), valv (id|null), grado 1..6, man, foco, s3, s4, apertura, clic, frote }
     evento golpe: {tipo:"golpe", t, f, amp, dec, nom}
     evento ruido: {tipo:"ruido", t, dur, f, q, amp, forma, trem, nom} */
  function eventos(cfg) {
    const c = Object.assign({ fc: 77, insp: false, valv: null, grado: 3, man: "ninguna", foco: "mitral", s3: false, s4: false, apertura: false, clic: false, frote: false }, cfg);
    const ti = tiempos(c.fc), { T, sist } = ti, v = c.valv ? VALV[c.valv] : null, M = v ? v.mods : {};
    const F = FOCOS[c.foco], ev = [];
    const g1 = F.g1 * (M.r1 || 1), g2 = F.g2 * (M.r2 || 1);
    const ret = M.r1retraso || 0;
    // R1: cierre mitral y, un poco después, tricuspídeo (el mitral antecede al tricuspídeo)
    ev.push({ tipo: "golpe", t: ret, f: 62, amp: 0.9 * g1, dec: 0.055, nom: "M1" });
    ev.push({ tipo: "golpe", t: ret + 0.028, f: 80, amp: 0.6 * g1, dec: 0.045, nom: "T1" });
    // R2: cierre aórtico y luego pulmonar; el desdoblamiento crece en inspiración (fisiológico: literatura)
    const split = M.split != null ? M.split : (c.insp ? 0.04 : 0.008);
    ev.push({ tipo: "golpe", t: sist, f: 125, amp: 0.8 * g2, dec: 0.04, nom: "A2" });
    ev.push({ tipo: "golpe", t: sist + split, f: 105, amp: 0.55 * g2 * (c.foco === "pulmonar" ? 1.2 : 1), dec: 0.04, nom: "P2" });
    // ruidos agregados
    if (c.s3) ev.push({ tipo: "golpe", t: sist + 0.15, f: 38, amp: 0.55 * (c.foco === "mitral" ? 1.2 : 0.8), dec: 0.09, nom: "R3" });
    if (c.s4) ev.push({ tipo: "golpe", t: T - 0.10, f: 34, amp: 0.5 * (c.foco === "mitral" ? 1.2 : 0.8), dec: 0.09, nom: "R4" });
    if (c.apertura || M.apertura) ev.push({ tipo: "golpe", t: sist + 0.09, f: 190, amp: 0.55, dec: 0.022, nom: "Chasquido de apertura" });
    if (c.clic || M.clic) ev.push({ tipo: "golpe", t: 0.06, f: 250, amp: 0.5, dec: 0.02, nom: "Clic de eyección" });
    if (c.frote || (v && v.forma === "frote")) {
      const a = 0.85 * (v ? gananciaFoco(v, c.foco) : 0.7);
      [[0.02, 0.13, "presistólico/sístole"], [sist + 0.07, 0.15, "diastólico precoz"], [T - 0.15, 0.11, "presistólico"]].forEach(([t, d, n]) =>
        ev.push({ tipo: "ruido", t, dur: d, f: 1100, q: 0.7, amp: a, forma: "frote", nom: "Frote" }));
    }
    // soplo
    if (v && v.forma !== "frote") {
      const [a, b] = ventana(v.forma, ti);
      const amp = GRADO(c.grado) * (v.amp || 1) * gananciaFoco(v, c.foco) * mult(v, c.man, c.insp);
      ev.push({ tipo: "ruido", t: a, dur: b - a, f: v.f, q: v.q, amp: lim(amp, 0, 1.4), forma: v.forma, trem: v.trem || 0, nom: "Soplo" });
    }
    ev.sort((x, y) => x.t - y.t);
    return { ev, ti, T };
  }

  /* ---------- fonocardiograma: valor de la onda en el tiempo t (s) para un latido repetido ---------- */
  const hash = n => { let x = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  function fono(lat, t) {
    const T = lat.T; let tm = t - Math.floor(t / T) * T, y = 0;
    for (const e of lat.ev) {
      if (e.tipo === "golpe") {
        for (const d of [tm - e.t, tm - e.t + T]) if (d >= 0 && d < e.dec * 3) y += e.amp * Math.sin(2 * Math.PI * e.f * d * 0.35) * Math.exp(-d / (e.dec * 0.5));   // dibujo: decae más rápido que el audio para que el ruido no parezca soplo // f*0.35: se dibuja más lento que el audio para verse
      } else if (e.amp > 0 && tm >= e.t && tm <= e.t + e.dur) {
        const u = (tm - e.t) / e.dur;
        const mod = e.trem ? 0.75 + 0.25 * Math.sin(2 * Math.PI * e.trem * tm) : 1;
        const h = e.forma === "frote" ? hash(Math.floor(tm * 700)) * (0.6 + 0.4 * Math.sin(u * 22)) : hash(Math.floor(tm * 900));
        y += 0.8 * e.amp * env(e.forma === "frote" ? "rombo" : e.forma, u) * mod * h;
      }
    }
    return y;
  }

  /* ---------- estado de las válvulas en el latido (para el corazón animado) ---------- */
  // devuelve apertura 0..1 de cada válvula en el instante tm (0..T)
  function valvulas(tm, ti) {
    const { T, sist } = ti, ab = (a, b, x, r) => lim((x - a) / r, 0, 1) * lim((b - x) / r, 0, 1);
    const sig = ab(0.05, sist, tm, 0.025);            // sigmoideas: abiertas en la eyección
    const faseAV = tm >= sist + 0.07 ? lim((tm - (sist + 0.07)) / 0.03, 0, 1) : (tm < 0.02 ? 1 - tm / 0.02 : 0);
    return { mitral: faseAV, tricuspide: faseAV, aortica: sig, pulmonar: sig };
  }
  function fase(tm, ti) { return tm < ti.sist ? "sístole" : "diástole"; }

  const API = { FOCOS, ORDEN_FOCOS, VALV, ORDEN_VALV, puntoDe, tiempos, env, ventana, GRADO, gananciaFoco, mult, eventos, fono, valvulas, fase, lim };
  if (typeof module !== "undefined") module.exports = API;
  if (typeof window !== "undefined") window.AUSC = API;
})();
