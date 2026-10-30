/* Presión arterial — modelo numérico (sin DOM). Se usa en el navegador (window.PA) y en Node (_test.js).
   Fuentes: SEMIOLOGIA 05d (técnica, Korotkoff, diferencial, PAM), 05h (valores, HTA, hipotensión),
   08g (HTA clínica) y FISIOPATOLOGIA Clase 10 (determinantes) y Clase 11 (mecanismos de HTA).
   Lo que la clase no cuantifica (cuánto falsea cada error, tiempos de los ruidos) se marca [REVISAR]: es didáctico. */
(function (root) {
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const R = x => Math.round(x);
  const ent = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));          // entero en [a, b]
  const elegir = (rng, v) => v[Math.floor(rng() * v.length)];
  const mezclar = (rng, v) => { const a = v.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* =====================  1 · CLASIFICACIÓN (dos guías de la clase)  ===================== */
  // Cortes comunes a ambas: PAS 120/130/140/160/180 y PAD 80/85/90/100/110. La categoría es la MÁS ALTA entre PAS y PAD.
  const CORTE_PAS = [120, 130, 140, 160, 180], CORTE_PAD = [80, 85, 90, 100, 110];
  const GUIAS = {
    sem: {
      id: "sem", nombre: "Semiología · 05h (Sotomayor 2020)",
      cats: ["Ideal", "Normal", "Limítrofe", "HTA grado I", "HTA grado II", "HTA grado III"],
      filas: [["Ideal", "< 120", "< 80"], ["Normal", "< 130", "< 85"], ["Limítrofe", "130-139", "85-89"], ["HTA grado I", "140-159", "90-99"],
        ["HTA grado II", "160-179", "100-109"], ["HTA grado III", "> 180", "> 110"], ["Hipertensión sistólica aislada", "> 140", "< 90"]],
      aislada: (s, d) => s > 140 && d < 90, textoAislada: "PAS > 140 con PAD < 90"
    },
    fis: {
      id: "fis", nombre: "Fisiopatología · Clase 10",
      cats: ["Ideal", "Normal", "Prehipertensión (límite)", "HTA estadio 1 (leve)", "HTA estadio 2 (moderada)", "HTA estadio 3 (grave)"],
      filas: [["Ideal", "< 120", "< 80"], ["Normal", "< 130", "< 85"], ["Prehipertensión (límite)", "130-139", "85-89"], ["HTA estadio 1 (leve)", "140-159", "90-99"],
        ["HTA estadio 2 (moderada)", "160-179", "100-109"], ["HTA estadio 3 (grave)", "≥ 180", "≥ 110"], ["HTA sistólica aislada", "≥ 160", "< 90"]],
      aislada: (s, d) => s >= 160 && d < 90, textoAislada: "PAS ≥ 160 con PAD < 90"
    }
  };
  // [REVISAR] Semiología escribe grado II «160-179» y grado III «> 180»: el 180 exacto queda sin casilla. Se asigna al grado III
  // (Fisiopatología lo dice con ≥ 180) y la interfaz avisa de la discrepancia.
  function categoria(v, cortes) { for (let i = 0; i < cortes.length; i++) if (v < cortes[i]) return i; return cortes.length; }
  function clasificar(pas, pad, guia) {
    const g = GUIAS[guia || "sem"];
    const cp = categoria(pas, CORTE_PAS), cd = categoria(pad, CORTE_PAD), cat = Math.max(cp, cd);
    const aislada = g.aislada(pas, pad);
    return { cat, nombre: g.cats[cat], porPAS: cp, porPAD: cd, aislada, hta: cat >= 3, hipotension: pas < 90,
      etiqueta: aislada ? g.cats[Math.max(cat, 3)] + " · patrón sistólico aislado" : g.cats[cat] };
  }
  const diferencial = (pas, pad) => pas - pad;
  // La clase da 40 como normal (rango 30-50) y llama divergente a > 40 y convergente a < 30.
  function tipoDiferencial(pp) {
    return { tipo: pp > 40 ? "divergente" : pp < 30 ? "convergente" : "normal", rangoNormal: pp >= 30 && pp <= 50, zonaGris: pp > 40 && pp <= 50 };
  }
  const pam = (pas, pad) => (pas + 2 * pad) / 3;                    // = PAD + (PAS - PAD) / 3
  function nivelPam(m) { return m < 60 ? "baja" : m <= 100 ? "normal" : m <= 130 ? "alta" : "muy alta"; }
  function postural(sup, pie) {                                      // 05h §5: caída ≥ 20 en PAS o ≥ 10 en PAD
    const cs = sup.pas - pie.pas, cd = sup.pad - pie.pad;
    return { caidaPAS: cs, caidaPAD: cd, positiva: cs >= 20 || cd >= 10 };
  }
  const CAUSAS_DIVERGENTE = ["Insuficiencia aórtica", "Ductus arterioso", "Bloqueo AV total", "Hipertiroidismo", "Ateroesclerosis", "Anemia", "Fiebre", "Fístula arteriovenosa"];
  const CAUSAS_CONVERGENTE = ["Insuficiencia cardiaca congestiva", "Miocardiopatías", "Estenosis mitral", "Estenosis aórtica"];

  /* =====================  2 · KOROTKOFF Y TÉCNICA  ===================== */
  // Fases según la clase: I primer ruido (PAS) · II suaves y prolongados con soplo · III más agudos y altos · IV se apagan · V desaparecen (PAD).
  // Los límites en fracción de la presión de pulso son didácticos [REVISAR]: la clase no da mmHg por fase.
  const FASES = [
    { id: "I", hasta: 0.14, nombre: "aparece el primer ruido: PAS", desc: "golpe nítido que va ganando fuerza" },
    { id: "II", hasta: 0.42, nombre: "ruidos más suaves y prolongados, con soplo intermitente", desc: "suaves, largos, con soplo" },
    { id: "III", hasta: 0.78, nombre: "ruidos más agudos y altos", desc: "agudos, altos y nítidos" },
    { id: "IV", hasta: 1.0, nombre: "los ruidos se apagan", desc: "apagados, como a través de una almohada" }
  ];
  // Estado de la arteria según la presión del manguito p (sis y dia = lo que marca el aparato en este paciente)
  function faseKorotkoff(p, sis, dia) {
    if (p >= sis) return { estado: "cerrada", fase: null, f: 0 };
    if (p <= dia) return { estado: "abierta", fase: "V", f: 1 };
    const f = (sis - p) / (sis - dia);
    for (const F of FASES) if (f <= F.hasta) return { estado: "ruidos", fase: F.id, f };
    return { estado: "ruidos", fase: "IV", f };
  }
  const enPozo = (f, pozo) => !!pozo && f >= pozo.f0 && f <= pozo.f1;
  // Parámetros del sonido sintetizado por fase (amplitud 0-1, frecuencias en Hz, duraciones en s)
  function sonidoParams(fase, f) {
    f = clamp(f || 0, 0, 1);
    switch (fase) {
      case "I": return { amp: 0.45 + 0.30 * clamp(f / 0.14, 0, 1), f0: 85, dur: 0.09, rF: 240, rQ: 1.2, rDur: 0.07, rAmp: 0.6, lento: false };
      case "II": return { amp: 0.30, f0: 70, dur: 0.12, rF: 380, rQ: 0.8, rDur: 0.26, rAmp: 0.9, lento: true };   // soplo: ruido largo y de ataque lento
      case "III": return { amp: 0.85, f0: 125, dur: 0.07, rF: 650, rQ: 1.6, rDur: 0.06, rAmp: 0.8, lento: false };
      case "IV": return { amp: 0.28, f0: 70, dur: 0.14, rF: 120, rQ: 0.7, rDur: 0.1, rAmp: 0.3, lento: false };
      default: return null;
    }
  }
  // Cuánto falsea la lectura cada error de técnica. La clase da solo el sentido (alta/baja); las magnitudes son didácticas [REVISAR].
  const MAG = { chico: [10, 8], chico2: [14, 11], grande: [-8, -6], flojo: [8, 6], apretado: [-8, -6], ropa: [8, 6], abajo: [8, 8], arriba: [-8, -8], sinReposo: [10, 4] };
  function sesgoTecnica(c, grosor) {
    const o = { sis: 0, dia: 0, lista: [] }, suma = (k, txt) => { o.sis += MAG[k][0]; o.dia += MAG[k][1]; o.lista.push({ txt, alta: MAG[k][0] > 0, mag: MAG[k][0] }); };
    if (!c.reposo) suma("sinReposo", "Sin los 5 minutos de reposo (actividad reciente): cifra falsamente alta");
    const m = c.manguito, ok = grosor === "grueso" ? "18" : "12";
    if (m !== ok) {
      if (m === "18") suma("grande", "Manguito demasiado grande para este brazo: cifra falsamente baja");
      else suma(m === "2.5" ? "chico2" : "chico", "Manguito demasiado pequeño para este brazo: cifra falsamente alta");
    }
    if (c.ajuste === "flojo") suma("flojo", "Manguito demasiado flojo: cifra falsamente alta");
    if (c.ajuste === "apretado") suma("apretado", "Manguito demasiado ajustado: cifra falsamente baja");
    if (c.ropa) suma("ropa", "Medido sobre la ropa (doble cámara neumática): cifra falsamente alta");
    if (c.nivel === "abajo") suma("abajo", "Manómetro por debajo del nivel del corazón: cifra falsamente alta");
    if (c.nivel === "arriba") suma("arriba", "Manómetro por encima del nivel del corazón: cifra falsamente baja");
    return o;
  }
  const PSEUDO = { sis: 25, dia: 8 };                                  // pseudohipertensión del anciano [REVISAR magnitud]
  const CONDICION_OK = { reposo: true, manguito: "12", ajuste: "bien", ropa: false, nivel: "corazon", brazo: "der" };
  // Lo que marca el aparato: valor real del brazo + diferencia entre brazos + pseudohipertensión + errores de técnica
  function lectura(pac, c) {
    const izq = c.brazo === "izq", s = sesgoTecnica(c, pac.grosor);
    let sis = pac.sis - (izq ? pac.difBrazos : 0) + (pac.pseudo ? PSEUDO.sis : 0) + s.sis;
    let dia = pac.dia - (izq ? Math.round(pac.difBrazos / 2) : 0) + (pac.pseudo ? PSEUDO.dia : 0) + s.dia;
    sis = R(clamp(sis, 60, 260)); dia = R(clamp(dia, 30, sis - 18));
    return { sis, dia, sesgo: s, pseudo: pac.pseudo, difBrazos: izq ? pac.difBrazos : 0 };
  }
  // Instante y fuerza de cada latido (rng para la arritmia). Devuelve el intervalo hasta el siguiente latido y el pico que alcanza.
  function siguienteLatido(pac, lect, rng) {
    if (pac.ritmo === "fa") {
      return { dt: (60 / pac.hr) * (0.45 + 1.0 * rng()), pico: lect.dia + (lect.sis - lect.dia) * (0.62 + 0.38 * rng()) };
    }
    return { dt: (60 / pac.hr) * (0.985 + 0.03 * rng()), pico: lect.sis };
  }

  /* =====================  3 · PACIENTES ALEATORIOS  ===================== */
  const PERFILES = [
    { id: "ideal", s: [104, 119], d: [64, 79], w: 2 }, { id: "normal", s: [120, 129], d: [80, 84], w: 2 }, { id: "limite", s: [130, 139], d: [85, 89], w: 2 },
    { id: "g1", s: [140, 159], d: [90, 99], w: 3 }, { id: "g2", s: [160, 179], d: [100, 109], w: 2 }, { id: "g3", s: [182, 205], d: [111, 126], w: 1 },
    { id: "hsa", s: [150, 172], d: [66, 86], w: 1 }, { id: "hipo", s: [78, 89], d: [48, 58], w: 1 }
  ];
  function paciente(rng, esc) {
    esc = esc || "azar";
    let perf;
    if (esc === "anciano") perf = { s: [118, 138], d: [68, 84] };                          // real normal; el aparato marcará de más
    else if (esc === "simple") perf = elegir(rng, PERFILES.filter(p => ["normal", "limite", "g1", "g2"].includes(p.id)));
    else { const bolsa = []; PERFILES.forEach(p => { for (let i = 0; i < p.w; i++) bolsa.push(p); }); perf = elegir(rng, bolsa); }
    let sis = ent(rng, perf.s[0], perf.s[1]), dia = ent(rng, perf.d[0], perf.d[1]);
    if (sis - dia < 26) dia = sis - ent(rng, 26, 34);
    const fa = esc === "fa", pozo = esc === "pozo" || (esc === "azar" && rng() < 0.12) || (fa && rng() < 0.6);
    const grueso = esc === "grueso" || (esc === "azar" && rng() < 0.22);
    const pseudo = esc === "anciano" || (esc === "azar" && rng() < 0.05);
    const grande = esc === "azar" && rng() < 0.1;
    const ancian = pseudo || fa;
    const pac = {
      sis, dia, grosor: grueso ? "grueso" : "normal", ritmo: fa ? "fa" : "regular", hr: fa ? ent(rng, 78, 118) : ent(rng, 58, 98),
      pozo: pozo ? { f0: 0.16, f1: Math.min(0.72, 0.16 + (ent(rng, 16, 24)) / Math.max(30, sis - dia)) } : null,
      pseudo, difBrazos: grande ? ent(rng, 12, 22) : ent(rng, 0, 7), edad: ancian ? ent(rng, 72, 88) : ent(rng, 24, 66), sexo: rng() < 0.5 ? "varón" : "mujer"
    };
    pac.contexto = `${pac.sexo === "varón" ? "Varón" : "Mujer"} de ${pac.edad} años` + (grueso ? ", obeso (brazo de perímetro grande)" : ", contextura normal")
      + (fa ? ", con fibrilación auricular conocida" : "") + (pseudo ? ", arteriosclerosis marcada" : "") + ".";
    return pac;
  }

  /* =====================  4 · DETERMINANTES (bomba por tubo)  ===================== */
  // PAM = DC × RVP × viscosidad (Clase 10: PA = DC × RVP; la viscosidad y la volemia modulan).
  // La diferencial sale del volumen sistólico y de la distensibilidad de la aorta: PP = VS / C. Valores de referencia [REVISAR, literatura]:
  // RVP normal ≈ 18,6 mmHg·min/L (con VS 70 mL y FC 72 da 120/80); C = 1,75 mL/mmHg (aorta joven).
  const BASE = { vs: 70, fc: 72, rvp: 18.6, elast: 100, vol: 100, visc: 1 };
  function determinantes(i) {
    const vol = i.vol / 100, vsEf = Math.max(15, i.vs * (1 + (vol - 1)));
    const dc = vsEf * i.fc / 1000, pamM = dc * i.rvp * i.visc;
    const C = 1.75 * (0.25 + 0.75 * i.elast / 100), pp0 = vsEf / C;
    let pad = pamM - pp0 / 3, pas;
    pad = clamp(pad, 15, 200); pas = clamp(pad + pp0, pad + 8, 300);
    return { dc, vsEf, pas, pad, pp: pas - pad, pam: pam(pas, pad), C };
  }
  // Lectura en vivo: qué cambió respecto al reposo y qué efecto tiene (causa → efecto, con las palabras de la clase)
  function explicarDeterminantes(i, r) {
    const b = determinantes(BASE), o = [];
    const rDC = r.dc / b.dc, rR = i.rvp / BASE.rvp, rV = i.vol / 100;
    if (rDC > 1.15) o.push({ k: "+", t: `Débito cardiaco ${r.dc.toFixed(1)} L/min (↑): bombea más sangre por minuto → sube la presión, sobre todo la sistólica (ejercicio y emociones).` });
    if (rDC < 0.85) o.push({ k: "-", t: `Débito cardiaco ${r.dc.toFixed(1)} L/min (↓): el corazón empuja poco → baja la sistólica (miocardiopatías, insuficiencia cardiaca).` });
    if (i.vs > 85 && rDC <= 1.15) o.push({ k: "+", t: "Volumen sistólico ↑: cada latido eyecta más sangre → ↑ presión de pulso (diferencial)." });
    if (i.vs < 55 && rDC >= 0.85) o.push({ k: "-", t: "Volumen sistólico ↓: cada latido eyecta poco → presión de pulso pequeña (convergente)." });
    if (rR > 1.12) o.push({ k: "+", t: "Resistencia periférica ↑ (vasoconstricción de las arteriolas): es el factor clave de la diastólica → sube la PAD. Es el mecanismo central de la HTA." });
    if (rR < 0.88) o.push({ k: "-", t: "Resistencia periférica ↓ (vasodilatación): cae la diastólica → la diferencial se ensancha (divergente)." });
    if (i.elast < 85) o.push({ k: "+", t: "Aorta rígida (arteriosclerosis): la sangre del latido no tiene dónde \"estirar\" la pared → sube la PAS sin subir la PAD (el 150/80 del anciano)." });
    if (rV > 1.08) o.push({ k: "+", t: "Volemia ↑ (aldosterona, glomerulonefritis aguda, oliguria con ingesta de líquidos): más retorno y más débito → hipertensión." });
    if (rV < 0.92) o.push({ k: "-", t: "Volemia ↓ (hemorragia, deshidratación): baja el retorno y el débito → cae la presión." });
    if (i.visc > 1.1) o.push({ k: "+", t: "Viscosidad ↑ (poliglobulia): la sangre espesa cuesta más de mover → sube la presión." });
    if (i.visc < 0.9) o.push({ k: "-", t: "Viscosidad ↓ (anemia grave, fiebre): puede disminuir la presión." });
    if (!o.length) o.push({ k: "=", t: "Todo en reposo: DC 5-6 L/min × RVP normal → 120/80. Mueve un control y mira qué se desplaza." });
    return o;
  }
  // Escenarios (palancas) para demostrar cada mecanismo de la Clase 11 y de la Clase 10
  const ESCENARIOS = [
    { id: "reposo", t: "Reposo", set: { ...BASE }, nota: "Referencia: 120/80, DC 5-6 L/min." },
    { id: "ejercicio", t: "Ejercicio", set: { vs: 110, fc: 150, rvp: 6.5, elast: 100, vol: 100, visc: 1 }, nota: "El DC sube hasta 30 L/min en el ejercicio máximo; la vasodilatación muscular baja la RVP y la sistólica sube más que la diastólica." },
    { id: "hemorragia", t: "Hemorragia", set: { vs: 70, fc: 110, rvp: 15, elast: 100, vol: 55, visc: 1 }, nota: "Volemia ↓ → retorno ↓ → hipotensión con pulso filiforme y taquicardia." },
    { id: "anciano", t: "Anciano rígido", set: { vs: 70, fc: 72, rvp: 20, elast: 35, vol: 100, visc: 1 }, nota: "La aorta pierde elasticidad: sube la PAS sin subir la PAD (150/80)." },
    { id: "esencial", t: "HTA esencial", set: { vs: 70, fc: 72, rvp: 22.5, elast: 80, vol: 100, visc: 1 }, nota: "Más del 90 % de las HTA. Sea cual sea la causa: ↑ RVP; con los años hipertrofia ventricular izquierda." },
    { id: "renovascular", t: "Renovascular", set: { vs: 70, fc: 72, rvp: 21, elast: 100, vol: 108, visc: 1 }, nota: "Estenosis de la arteria renal → ↓ flujo → renina → angiotensina II (vasoconstricción) + aldosterona (retiene Na y agua)." },
    { id: "aldosterona", t: "Hiperaldosteronismo", set: { vs: 70, fc: 72, rvp: 19, elast: 100, vol: 118, visc: 1 }, nota: "Aldosterona ↑ → retiene Na+ y agua, pierde K+ → hipervolemia e hipopotasemia." },
    { id: "cushing", t: "Cushing", set: { vs: 70, fc: 72, rvp: 19.5, elast: 100, vol: 115, visc: 1 }, nota: "Exceso de glucocorticoides → retención de Na y H₂O → hipertensión (obesidad central, facies de luna llena)." },
    { id: "feo", t: "Feocromocitoma", set: { vs: 80, fc: 95, rvp: 20, elast: 100, vol: 100, visc: 1 }, nota: "Catecolaminas: efecto β (↑ FC y contractilidad) + α (vasoconstricción) → ↑ DC y ↑ RVP; crisis paroxísticas." },
    { id: "oliguria", t: "Oliguria + líquidos", set: { vs: 70, fc: 72, rvp: 18.6, elast: 100, vol: 135, visc: 1 }, nota: "Insuficiencia renal con oliguria/anuria que sigue bebiendo: hipervolemia → hipertensión." },
    { id: "poliglobulia", t: "Poliglobulia", set: { vs: 70, fc: 72, rvp: 18.6, elast: 100, vol: 100, visc: 1.25 }, nota: "Viscosidad ↑ (p. ej. de altura): la sangre espesa sube la presión." },
    { id: "tiroides", t: "Hipertiroidismo", set: { vs: 85, fc: 105, rvp: 11, elast: 100, vol: 100, visc: 1 }, nota: "Hipermetabolismo: DC ↑ y vasodilatación → sistólica alta, diastólica baja: presión divergente." },
    { id: "aortica", t: "Insuf. aórtica", set: { vs: 130, fc: 75, rvp: 9.5, elast: 100, vol: 100, visc: 1 }, nota: "Gran volumen sistólico y fuga diastólica hacia el ventrículo (RVP efectiva ↓): sistólica alta, diastólica baja, divergente." },
    { id: "ic", t: "Insuf. cardiaca", set: { vs: 40, fc: 85, rvp: 24, elast: 100, vol: 100, visc: 1 }, nota: "Corazón que empuja poco: volumen sistólico ↓ → presión convergente." },
    { id: "anemia", t: "Anemia grave", set: { vs: 75, fc: 100, rvp: 18.6, elast: 100, vol: 100, visc: 0.6 }, nota: "Viscosidad ↓: tiende a bajar la presión (taquicardia compensadora)." }
  ];

  /* =====================  5 · BANCO DE PREGUNTAS  ===================== */
  const ETQ_ERR = [
    { c: "Manguito demasiado pequeño para el brazo", r: "alta" }, { c: "Manguito demasiado grande para el brazo", r: "baja" },
    { c: "Manguito demasiado flojo", r: "alta" }, { c: "Manguito demasiado ajustado", r: "baja" },
    { c: "Manómetro por debajo del nivel del corazón", r: "alta" }, { c: "Manómetro por encima del nivel del corazón", r: "baja" },
    { c: "Medir con el manguito sobre la ropa", r: "alta" }
  ];
  const TXT_ERR = { alta: "Cifras falsamente altas", baja: "Cifras falsamente bajas", igual: "No altera la lectura" };
  const FRASE_FASE = { I: "Aparece el primer ruido, nítido", II: "Los ruidos se hacen más suaves y prolongados, con un soplo intermitente", III: "Los ruidos se vuelven más agudos y altos", IV: "Los ruidos se apagan", V: "Los ruidos desaparecen" };
  const CASOS_HTA = [
    { q: "Mujer de 45 años con HTA de difícil control, debilidad muscular, poliuria y polidipsia; el potasio está bajo. ¿Qué mecanismo explica su HTA?", ok: "Exceso de aldosterona: retiene Na+ y agua, pierde K+ (hipervolemia)", mal: ["Catecolaminas que vasoconstriñen y aceleran el corazón", "Exceso de glucocorticoides con obesidad central", "Isquemia renal que libera renina"], e: "Hiperaldosteronismo primario (adenoma suprarrenal): ↑ aldosterona → retención de Na+ y H₂O, excreción de K+ → hipervolemia e hipopotasemia. Tratamiento: espironolactona o cirugía." },
    { q: "Varón de 30 años con episodios de cefalea intensa, palpitaciones y sudoración, con crisis hipertensivas bruscas. ¿Qué mecanismo?", ok: "Catecolaminas: efecto β (↑ FC y contractilidad) y α (vasoconstricción)", mal: ["Retención de sodio por aldosterona", "Estenosis de la arteria renal con renina alta", "Viscosidad sanguínea aumentada"], e: "Feocromocitoma: tumor de la médula suprarrenal que libera catecolaminas de forma paroxística → ↑ gasto cardiaco y ↑ RVP." },
    { q: "Mujer de 40 años con obesidad central, cara de luna llena, estrías violáceas e HTA. ¿Cuál es el mecanismo de la HTA?", ok: "Exceso de glucocorticoides: retención de Na y H₂O", mal: ["Exceso de catecolaminas", "Estenosis de la arteria renal", "Déficit de aldosterona"], e: "Síndrome de Cushing: el exceso de glucocorticoides retiene Na y agua (más de 80 % es endógeno, 20 % iatrogénico por corticoides)." },
    { q: "Paciente de 55 años, fumador, HTA y un soplo abdominal. Sospechas estenosis de la arteria renal. ¿Cómo produce HTA?", ok: "↓ flujo glomerular → renina → angiotensina II y aldosterona", mal: ["Aumento directo de las catecolaminas circulantes", "Pérdida de potasio por aldosterona suprarrenal", "Retención de líquido por oliguria con ingesta"], e: "Hipertensión renovascular: la estenosis disminuye el flujo, el aparato yuxtaglomerular libera renina y se activa el SRAA: angiotensina II vasoconstriñe y la aldosterona retiene Na+ y agua." },
    { q: "Paciente con insuficiencia renal y oliguria (< 400 mL/24 h) que sigue tomando abundantes líquidos y presenta HTA. ¿Mecanismo?", ok: "Hipervolemia: aumenta el volumen intravascular", mal: ["Vasoconstricción por catecolaminas", "Aumento de la viscosidad", "Rigidez de la aorta"], e: "Oliguria/anuria + ingesta de líquidos → hiperhidratación → ↑ volumen intravascular → HTA (la volemia es uno de los determinantes de la PA)." },
    { q: "¿Cuál es la alteración hemodinámica común a la mayoría de las HTA, sea cual sea su causa?", ok: "Aumento de la resistencia vascular periférica", mal: ["Disminución del volumen sistólico", "Disminución de la viscosidad sanguínea", "Aumento de la elasticidad aórtica"], e: "Clase 11: independientemente de la causa, la HTA se caracteriza por ↑ RVP; con el tiempo hay hipertrofia ventricular izquierda por sobrecarga de presión." }
  ];
  const ESTATICAS = [
    { q: "¿Qué componente de la presión gobierna sobre todo la diastólica?", ok: "La resistencia vascular periférica", mal: ["El débito cardiaco", "La frecuencia respiratoria", "La volemia únicamente"], e: "PA = DC × RVP. El débito cardiaco gobierna sobre todo la sistólica; la RVP (arteriolas) es el factor clave de la diastólica." },
    { q: "Anciano con 150/80 mmHg. ¿Qué mecanismo explica el aumento aislado de la sistólica?", ok: "Pérdida de elasticidad de los grandes vasos", mal: ["Vasoconstricción arteriolar", "Hipervolemia", "Disminución del débito cardiaco"], e: "La rigidez arterial (arteriosclerosis) eleva la PAS sin elevar la PAD." },
    { q: "Con el método auscultatorio, ¿a cuánto se infla el manguito y a qué velocidad se desinfla?", ok: "30 mmHg sobre la sistólica palpatoria; 2-3 mmHg por segundo", mal: ["10 mmHg sobre la diastólica; 10 mmHg por segundo", "Hasta 300 mmHg siempre; lo más rápido posible", "Hasta que desaparezca el pulso; 20 mmHg por segundo"], e: "Primero se palpa para estimar la sistólica, se infla 30 mmHg por encima y se desinfla lento (2-3 mmHg/s) para no perder la fase I." },
    { q: "En un anciano con arteriosclerosis marcada, la radial sigue palpable aunque el manguito ya ocluye la braquial. ¿Qué sospechas?", ok: "Pseudohipertensión: la cifra del aparato está sobrestimada", mal: ["Hipotensión postural", "Pozo auscultatorio", "Coartación de aorta"], e: "La arteria rígida no se colapsa: el manguito necesita más presión que la real, y marca, por ejemplo, 160/80 sin hipertensión verdadera de esa magnitud." },
    { q: "Durante el desinflado los ruidos desaparecen un tramo y luego reaparecen. ¿Qué es y qué conviene hacer?", ok: "Pozo auscultatorio: desinflar con cuidado para no confundirlo con la fase I real", mal: ["Fase V: ya es la diastólica", "Error del estetoscopio: repetir sin ropa", "Pseudohipertensión: ignorar la cifra"], e: "El pozo o hueco auscultatorio se vuelve más frecuente en la fibrilación auricular o extrasístoles; si se desinfla deprisa se puede perder la fase I real." },
    { q: "¿Cuál es el valor de la fase que se toma como presión diastólica en el adulto?", ok: "Fase V: desaparición de los ruidos", mal: ["Fase I: primer ruido", "Fase II: soplo intermitente", "Fase IV: ruidos que se apagan"], e: "Fase I = sistólica; fase V = diastólica (en el adulto, según la clase)." },
    { q: "¿Qué tamaño de manguito corresponde a un adulto obeso?", ok: "18-20 cm de ancho", mal: ["12 cm de ancho × 23 cm de largo", "6 cm de ancho", "2,5 cm de ancho"], e: "Estándar adulto 12 × 23 cm; obesos o muslo 18-20 cm; preescolares 6 cm; lactantes 2,5 cm." },
    { q: "Un niño llora durante la toma de la presión. ¿Qué pasa con la cifra?", ok: "Puede elevarse hasta 50 mmHg", mal: ["Disminuye unos 10 mmHg", "No cambia", "Solo cambia la diastólica"], e: "Se debe evitar medir con el niño llorando: la PA puede subir hasta 50 mmHg." },
    { q: "¿Qué dos años y qué autores marcan el método palpatorio y el auscultatorio?", ok: "Riva-Rocci 1896 (palpatorio) y Korotkov 1904 (auscultatorio)", mal: ["Korotkov 1896 (palpatorio) y Riva-Rocci 1904 (auscultatorio)", "Riva-Rocci 1904 y Korotkov 1896, ambos auscultatorios", "Ambos métodos nacen en 1950"], e: "Riva-Rocci creó el esfigmomanómetro con método palpatorio (1896) y Nikolai Korotkov introdujo el auscultatorio (1904)." },
    { q: "Una diferencia de presión entre ambos brazos mayor de 10 mmHg ¿cuándo orienta a patología?", ok: "Cuando es claramente mayor: sugiere coartación de la aorta o estenosis de la subclavia del lado de menor presión", mal: ["Siempre, aun con 3 mmHg", "Nunca: es normal", "Solo si el brazo izquierdo es el mayor"], e: "Hasta más de 10 mmHg se ve en una quinta parte de los sanos (el brazo derecho suele ser el mayor); diferencias mayores sugieren coartación o estenosis de la subclavia/axilar del lado de menor presión." },
    { q: "Sueño profundo: ¿cuánto desciende fisiológicamente la presión?", ok: "20-40 mmHg la sistólica y 10-15 mmHg la diastólica", mal: ["Nada, es constante", "Solo 2-3 mmHg", "Sube 20 mmHg"], e: "Durante el sueño la PA cae 20-40 mmHg en la sistólica y 10-15 en la diastólica." }
  ];

  function opciones(rng, ok, mal) {                                   // devuelve {op, ok}
    const todas = mezclar(rng, [ok].concat(mal));
    return { op: todas, ok: todas.indexOf(ok) };
  }
  function unicas(v) { return v.filter((x, i) => v.indexOf(x) === i); }

  const GEN = {
    clasificar(rng) {
      for (let n = 0; n < 60; n++) {
        const perf = elegir(rng, PERFILES.filter(p => p.id !== "hipo"));
        let s = ent(rng, perf.s[0], perf.s[1]), d = ent(rng, perf.d[0], perf.d[1]);
        if (s - d < 20) d = s - 30;
        if (s === 180 || s === 140 || d === 110) continue;                       // evita los bordes ambiguos
        const a = clasificar(s, d, "sem"), b = clasificar(s, d, "fis");
        if (a.nombre !== b.nombre || a.aislada !== b.aislada) continue;
        const etiquetas = ["Ideal", "Normal", "Limítrofe", "HTA grado I", "HTA grado II", "HTA grado III"];
        const ok = a.aislada ? "HTA sistólica aislada" : a.nombre;
        const mal = mezclar(rng, etiquetas.filter(x => x !== a.nombre).concat(a.aislada ? [] : ["HTA sistólica aislada"])).slice(0, 3);
        const o = opciones(rng, ok, mal);
        return { tipo: "Clasificación", q: `Paciente con PA ${s}/${d} mmHg, confirmada en dos tomas. ¿Cómo se clasifica?`, op: o.op, ok: o.ok,
          e: `PAS ${s} cae en «${GUIAS.sem.cats[a.porPAS]}» y PAD ${d} en «${GUIAS.sem.cats[a.porPAD]}»: manda la categoría más alta.` + (a.aislada ? ` Como la PAD es < 90, el patrón es de hipertensión sistólica aislada.` : "") };
      }
      return GEN.pam(rng);
    },
    pam(rng) {
      const d = ent(rng, 5, 12) * 10, pp = elegir(rng, [30, 39, 45, 54, 60, 72]), s = d + pp, m = d + pp / 3;
      const mal = unicas([String(R((s + d) / 2)), String(R(d + pp / 2)), String(pp), String(R((2 * s + d) / 3))]).filter(x => x !== String(R(m)));
      const o = opciones(rng, String(R(m)), mal.slice(0, 3));
      return { tipo: "Cálculo", q: `Presión de ${s}/${d} mmHg. ¿Cuál es la presión arterial media (PAM)?`, op: o.op.map(x => x + " mmHg"), ok: o.ok,
        e: `PAM = (PAS + 2 × PAD) / 3 = (${s} + ${2 * d}) / 3 = ${R(m)} mmHg (equivale a PAD + diferencial/3). La diastólica cuenta doble porque la diástole dura más que la sístole.` };
    },
    diferencial(rng) {
      const tipo = elegir(rng, ["divergente", "convergente", "normal"]);
      const pp = tipo === "divergente" ? ent(rng, 55, 100) : tipo === "convergente" ? ent(rng, 15, 27) : ent(rng, 32, 40), d = ent(rng, 45, 85), s = d + pp;
      const ok = { divergente: "Divergente (diferencial > 40)", convergente: "Convergente (diferencial < 30)", normal: "Normal (diferencial 30-50)" }[tipo];
      const mal = ["Divergente (diferencial > 40)", "Convergente (diferencial < 30)", "Normal (diferencial 30-50)"].filter(x => x !== ok);
      const o = opciones(rng, ok, mal);
      return { tipo: "Diferencial", q: `PA ${s}/${d} mmHg. Calcula la presión diferencial y di qué patrón es.`, op: o.op, ok: o.ok,
        e: `Diferencial = ${s} - ${d} = ${pp} mmHg. Normal 40 (rango 30-50); mayor de 40 es divergente, menor de 30 convergente.` };
    },
    causaDif(rng) {
      const div = rng() < 0.5, pp = div ? ent(rng, 60, 100) : ent(rng, 15, 26), d = ent(rng, 45, 80), s = d + pp;
      const ok = elegir(rng, div ? CAUSAS_DIVERGENTE : CAUSAS_CONVERGENTE);
      const mal = mezclar(rng, div ? CAUSAS_CONVERGENTE : CAUSAS_DIVERGENTE).slice(0, 3);
      const o = opciones(rng, ok, mal);
      return { tipo: "Diferencial", q: `PA ${s}/${d} mmHg (diferencial ${pp}). ¿Cuál de estas causas es compatible?`, op: o.op, ok: o.ok,
        e: div ? `Diferencial ${pp} > 40: presión divergente. Causas: ${CAUSAS_DIVERGENTE.join(", ").toLowerCase()}.` : `Diferencial ${pp} < 30: presión convergente. Causas: ${CAUSAS_CONVERGENTE.join(", ").toLowerCase()}.` };
    },
    korotkoff(rng) {
      const s = ent(rng, 11, 17) * 10 + ent(rng, 0, 4) * 2; let d = ent(rng, 6, 9) * 10 + ent(rng, 0, 4) * 2; d = Math.min(d, s - 34); const pp = s - d;
      const a = R(d + pp * 0.72), b = R(d + pp * 0.35), c = R(d + 4);
      const ok = `${s}/${d}`, mal = unicas([`${s}/${c}`, `${a}/${d}`, `${b}/${c}`]).filter(x => x !== ok).slice(0, 3);
      while (mal.length < 3) mal.push(`${s + 10}/${d + 10 + mal.length}`);
      const o = opciones(rng, ok, mal);
      return { tipo: "Korotkoff", q: `Al desinflar a 2-3 mmHg/s: el primer ruido se oye a ${s} mmHg; hacia ${a} los ruidos son suaves con soplo; hacia ${b} son más agudos y altos; a ${c} se apagan y a ${d} desaparecen. ¿Cuál es la presión?`, op: o.op, ok: o.ok,
        e: `Fase I (primer ruido) = sistólica = ${s}. Fase V (desaparición) = diastólica = ${d}. La fase IV (${c}, ruidos apagados) no es la diastólica en el adulto.` };
    },
    fase(rng) {
      const f = elegir(rng, ["I", "II", "III", "IV", "V"]);
      const o = opciones(rng, "Fase " + f, ["I", "II", "III", "IV", "V"].filter(x => x !== f).map(x => "Fase " + x).slice(0, 3));
      return { tipo: "Korotkoff", q: `${FRASE_FASE[f]}. ¿Qué fase de Korotkoff es?`, op: o.op, ok: o.ok,
        e: `Fases: I primer ruido (PAS) · II suaves y prolongados con soplo · III más agudos y altos · IV se apagan · V desaparecen (PAD). Esta es la fase ${f}.` };
    },
    error(rng) {
      const x = elegir(rng, ETQ_ERR), ok = TXT_ERR[x.r], mal = Object.values(TXT_ERR).filter(t => t !== ok);
      const o = opciones(rng, ok, mal);
      return { tipo: "Técnica", q: `${x.c}. ¿Cómo falsea la lectura?`, op: o.op, ok: o.ok,
        e: `${x.c}: ${ok.toLowerCase()}. Regla: manguito pequeño o flojo, manómetro bajo el corazón o toma sobre la ropa suben la cifra; manguito grande o apretado y manómetro alto la bajan.` };
    },
    postural(rng) {
      const pos = rng() < 0.5, ps = ent(rng, 10, 13) * 10, pd = ent(rng, 7, 8) * 10;
      const cs = pos ? ent(rng, 20, 35) : ent(rng, 0, 12), cd = pos ? ent(rng, 8, 22) : ent(rng, -4, 6);
      const s2 = ps - cs, d2 = pd - cd, r = postural({ pas: ps, pad: pd }, { pas: s2, pad: d2 });
      const ok = r.positiva ? "Hipotensión postural" : "Variación fisiológica, sin hipotensión postural";
      const o = opciones(rng, ok, [r.positiva ? "Variación fisiológica, sin hipotensión postural" : "Hipotensión postural", "Hipertensión sistólica aislada", "Pseudohipertensión"]);
      return { tipo: "Hipotensión", q: `Paciente en decúbito tras 5 minutos de reposo: ${ps}/${pd} mmHg. De pie, tras 3 minutos: ${s2}/${d2} mmHg. ¿Qué concluyes?`, op: o.op, ok: o.ok,
        e: `Caída de PAS ${r.caidaPAS} y de PAD ${r.caidaPAD} mmHg. El criterio es caída de ≥ 20 en la sistólica o ≥ 10 en la diastólica.` + (r.positiva ? "" : " Al pararse es normal una discreta baja de la sistólica y una ligera subida de la diastólica.") };
    },
    hta(rng) { const c = elegir(rng, CASOS_HTA), o = opciones(rng, c.ok, c.mal); return { tipo: "Mecanismo de HTA", q: c.q, op: o.op, ok: o.ok, e: c.e }; },
    fija(rng) { const c = elegir(rng, ESTATICAS), o = opciones(rng, c.ok, c.mal); return { tipo: "Concepto", q: c.q, op: o.op, ok: o.ok, e: c.e }; }
  };
  const PESOS = ["clasificar", "clasificar", "pam", "diferencial", "causaDif", "korotkoff", "fase", "error", "error", "postural", "hta", "hta", "fija", "fija", "fija"];
  function pregunta(rng) { return GEN[elegir(rng, PESOS)](rng); }

  const API = { clamp, GUIAS, clasificar, diferencial, tipoDiferencial, pam, nivelPam, postural, CAUSAS_DIVERGENTE, CAUSAS_CONVERGENTE,
    FASES, faseKorotkoff, enPozo, sonidoParams, MAG, sesgoTecnica, PSEUDO, CONDICION_OK, lectura, siguienteLatido, PERFILES, paciente,
    BASE, determinantes, explicarDeterminantes, ESCENARIOS, GEN, pregunta, FRASE_FASE, TXT_ERR };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.PA = API;
})(typeof window !== "undefined" ? window : globalThis);
