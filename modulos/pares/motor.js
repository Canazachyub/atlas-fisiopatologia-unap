/* Pupilas y pares craneales — motor numérico (sin DOM, probado en Node con _test.js).
   Fuentes: clases 11j (oculomotores, pupila), 11d (12 pares), 11e (pupila en coma), 11h (Horner), 06a (ojo).
   Todo lo que no sale de la clase va marcado lit:true (literatura) o [REVISAR]. */
(function (root) {
  "use strict";
  const PAR = {};
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* =========================================================
     1 · PUPILA
     Diámetros en mm. La clase da 2-6 mm como normal (otros 2-4, promedio 3);
     miosis < 2 mm, midriasis > 6 mm (11j).
     [REVISAR] 4 mm en reposo y 2,5 mm con luz/cerca son valores didácticos dentro de 2-6; la clase no da
     el diámetro bajo luz.
     ========================================================= */
  const CONSENSUAL = 0.8;          // la pupila no iluminada se contrae "en menor grado" (11j)
  PAR.LATENCIA_S = 0.25;           // [REVISAR] latencia fotomotora típica ~0,2-0,3 s (literatura)
  PAR.TAU_CONTRAE = 0.18;          // constante de tiempo al contraerse (s), didáctica
  PAR.TAU_DILATA = 0.55;           // dilatación más lenta (s), didáctica

  // Ojo "sano" por defecto: aII = fracción de la señal que pasa el nervio óptico; pr = vía pretectal;
  // gan = ganancia global; eff = eferente parasimpático (III + esfínter); cerca = conserva la acomodación.
  const OJO0 = () => ({ rest: 4, dmin: 2.5, dcerca: 2.5, aII: 1, pr: 1, gan: 1, eff: 1, cerca: true, irregular: false });
  const otro = l => (l === "D" ? "I" : "D");
  const par2 = f => { const o = { D: OJO0(), I: OJO0() }; f(o); return o; };

  /* Lesiones. `lat`: true si hay que elegir lado; `ojos(lado)` devuelve la especificación de cada ojo;
     `corte`: nodo de la vía donde está el daño (para el diagrama). */
  const LES = {};
  const def = (id, o) => { LES[id] = Object.assign({ id, lat: true, lit: false, ptosis: 0, enoftalmos: false, mirada: null }, o); };

  def("normal", { nombre: "Normal", lat: false, corte: null,
    ojos: () => par2(() => {}),
    via: "Vía íntegra: retina → II → quiasma → pretectal → Edinger-Westphal → III → esfínter del iris.",
    efecto: "Las dos pupilas son iguales; la luz contrae la iluminada (fotomotor) y la otra (consensual, algo menos); mirar de cerca las contrae (acomodación)." });

  def("ii_parcial", { nombre: "II par: defecto aferente relativo", corte: "II", lit: true,
    ojos: l => par2(o => { o[l].aII = 0.35; }),
    via: "Lesión del nervio óptico (o retina/mácula): llega menos señal desde ese ojo. La parte eferente (III) está sana.",
    efecto: "Las dos pupilas son iguales en reposo. Iluminar el ojo enfermo contrae poco ambas pupilas; iluminar el sano las contrae bien. Al oscilar la linterna del sano al enfermo, las pupilas se dilatan (prueba de la linterna oscilante, signo de Marcus Gunn: literatura)." });

  def("ii_total", { nombre: "II par: ceguera total de un ojo", corte: "II",
    ojos: l => par2(o => { o[l].aII = 0; }),
    via: "Sin señal aferente desde ese ojo: la luz sobre él no llega al mesencéfalo.",
    efecto: "Iluminar el ojo ciego no contrae ninguna pupila (ni directo ni consensual). Iluminar el sano contrae las dos, también la del ojo ciego (consensual): el eferente está sano." });

  def("iii", { nombre: "III par completo", corte: "III",
    ojos: l => par2(o => { Object.assign(o[l], { rest: 7, dmin: 7, dcerca: 7, eff: 0, cerca: false }); }),
    ptosis: 2, mirada: { abd: 0.55, y: -0.35 },
    via: "Lesión del III (fibras motoras y parasimpáticas). La señal aferente llega, pero no sale por el III.",
    efecto: "Ptosis, ojo desviado abajo y afuera (quedan el recto lateral y el oblicuo superior) y pupila en midriasis que no reacciona a la luz ni de cerca. Iluminar el ojo contrario sí contrae la otra pupila; el ojo afectado no responde al consensual." });

  def("iii_inc", { nombre: "III par incompleto (pupila respetada)", corte: "III",
    ojos: () => par2(() => {}),
    ptosis: 1, mirada: { abd: 0.35, y: -0.2 },
    via: "Lesión del III que respeta la vía eferente parasimpática: la pupila funciona.",
    efecto: "Ptosis y alteración de la motilidad con pupila normal y reactiva. Lo que separa completa de incompleta es la pupila, no la ptosis (11j)." });

  def("horner", { nombre: "Síndrome de Horner (Claude Bernard Horner)", corte: "simp",
    ojos: l => par2(o => { Object.assign(o[l], { rest: 1.8, dmin: 1.5, dcerca: 1.5 }); }),
    ptosis: 1, enoftalmos: true,
    via: "Lesión de la vía simpática: hipotálamo posterior → tallo → C8-T2 → ganglio cervical → plexo pericarotídeo → iris y párpado. Causa clásica: tumor del vértice pulmonar.",
    efecto: "Falta el dilatador del iris y el músculo del párpado: miosis, ptosis y enoftalmos del mismo lado. La vía de la luz está sana, por eso la pupila aún reacciona." });

  def("argyll", { nombre: "Argyll Robertson", lat: false, corte: "pret", lit: true,
    ojos: () => par2(o => { for (const l of ["D", "I"]) Object.assign(o[l], { rest: 1.9, dmin: 1.9, dcerca: 1.5, pr: 0, irregular: true }); }),
    via: "Se corta el camino de la luz a nivel pretectal; el camino de la acomodación queda libre. (La clase no lo describe: es literatura.)",
    efecto: "Pupilas pequeñas e irregulares, sin fotomotor y con acomodación conservada: «luz no, cerca sí». Es típica de neurosífilis. La ptosis no forma parte de su tríada: es del Horner." });

  def("aniso_fis", { nombre: "Anisocoria fisiológica", corte: null,
    ojos: l => par2(o => { Object.assign(o[l], { rest: 4.8, dmin: 3, dcerca: 3 }); }),
    via: "No hay lesión: el 5% de la población tiene una anisocoria leve (11j).",
    efecto: "Una pupila algo mayor, pero ambas reaccionan a la luz y a la cercanía, sin ptosis ni otros signos. Antes de investigar, descarta un midriático instilado en un solo ojo." });

  def("midriatico", { nombre: "Midriático instilado en un ojo (p. ej. mydriacyl)", corte: "fármaco",
    ojos: l => par2(o => { Object.assign(o[l], { rest: 7, dmin: 7, dcerca: 7, eff: 0, cerca: false }); }),
    via: "Fármaco que bloquea el esfínter del iris: no hay lesión de la vía.",
    efecto: "Midriasis arreactiva igual a la del III, pero sin ptosis y con motilidad ocular normal." });

  def("coma_meta", { nombre: "Coma metabólico (miosis con fotomotor conservado)", lat: false, corte: "difuso",
    ojos: () => par2(o => { for (const l of ["D", "I"]) Object.assign(o[l], { rest: 1.9, dmin: 1.5, dcerca: 1.5 }); }),
    via: "Disfunción cerebral difusa: el tallo con sus reflejos está indemne (11e).",
    efecto: "Pupilas pequeñas, simétricas y reactivas. También es el marcador de una herniación central por masa supratentorial (11e)." });

  def("opioide", { nombre: "Pupilas puntiformes (lesión pontina u opioides)", lat: false, corte: "pons",
    ojos: () => par2(o => { for (const l of ["D", "I"]) Object.assign(o[l], { rest: 1, dmin: 0.9, dcerca: 0.9, gan: 0.15 }); }),
    via: "Lesión pontina o intoxicación por opioides (11e).",
    efecto: "Pupilas puntiformes, apenas reactivas, en los dos ojos." });

  def("mesenc", { nombre: "Mesencéfalo dorsal (midriasis arreactiva bilateral)", lat: false, corte: "EW",
    ojos: () => par2(o => { for (const l of ["D", "I"]) Object.assign(o[l], { rest: 6.5, dmin: 6.5, dcerca: 6.5, pr: 0, irregular: true, cerca: false }); }),
    via: "Disfunción mesencefálica dorsal (11e).",
    efecto: "Midriasis con fotomotor ausente y pupilas irregulares, en los dos ojos." });

  def("nucleo3", { nombre: "Núcleo del III par (pupilas fijas en posición media)", lat: false, corte: "EW",
    ojos: () => par2(o => { for (const l of ["D", "I"]) Object.assign(o[l], { rest: 5, dmin: 5, dcerca: 5, eff: 0, cerca: false }); }),
    via: "Disfunción a nivel del núcleo del tercer par (11e).",
    efecto: "Pupilas fijas en posición media, sin reacción a luz ni a cercanía." });

  PAR.LESIONES = LES;
  PAR.ORDEN = ["normal", "ii_parcial", "ii_total", "iii", "iii_inc", "horner", "argyll", "aniso_fis", "midriatico", "coma_meta", "opioide", "mesenc", "nucleo3"];

  /* Estado estacionario de las dos pupilas.
     luz = {D,I} intensidad 0..1 sobre cada ojo; cerca = 0..1 (objeto acercándose). */
  PAR.pupila = function (id, lado, luz, cerca) {
    const L = LES[id], sp = L.ojos(lado || "D"), out = {};
    luz = luz || { D: 0, I: 0 }; cerca = clamp(cerca || 0, 0, 1);
    const sII = {}; // señal que sale del nervio óptico de cada ojo
    for (const e of ["D", "I"]) sII[e] = clamp(luz[e], 0, 1) * sp[e].aII;
    for (const e of ["D", "I"]) {
      const s = sp[e];
      const drive = clamp(sII[e] + CONSENSUAL * sII[otro(e)], 0, 1) * s.pr * s.gan;
      const cl = drive * s.eff;
      const dLuz = s.rest + (Math.min(s.dmin, s.rest) - s.rest) * cl;
      const dCerca = s.rest + (Math.min(s.dcerca, s.rest) - s.rest) * cerca * (s.cerca ? 1 : 0) * s.eff;
      out[e] = { d: Math.min(dLuz, dCerca), rest: s.rest, drive, cl, irregular: s.irregular, eff: s.eff };
    }
    return out;
  };

  /* Clasifica una respuesta según la fracción de la señal que llega y sale. */
  const nivel = c => (c >= 0.7 ? "presente" : c > 0.12 ? "disminuida" : "ausente");
  PAR.nivel = nivel;

  /* Reflejos al iluminar un ojo: fotomotor directo (ojo iluminado) y consensual (el otro). */
  PAR.reflejos = function (id, lado, ojoIlum) {
    const luz = { D: 0, I: 0 }; luz[ojoIlum] = 1;
    const p = PAR.pupila(id, lado, luz, 0);
    return { directo: nivel(p[ojoIlum].cl), consensual: nivel(p[otro(ojoIlum)].cl), pupilas: p };
  };

  /* Acomodación: ¿se contrae la pupila de cada ojo al acercar el objeto? */
  PAR.acomodacion = function (id, lado) {
    const sp = LES[id].ojos(lado || "D"), o = {};
    for (const e of ["D", "I"]) o[e] = nivel(sp[e].cerca ? sp[e].eff : 0);
    return o;
  };

  /* Linterna oscilante: pasa la luz del ojo sano al enfermo y compara el diámetro del ojo enfermo. */
  PAR.oscilante = function (id, lado) {
    const sano = otro(lado),
      a = PAR.pupila(id, lado, { D: sano === "D" ? 1 : 0, I: sano === "I" ? 1 : 0 }, 0),
      b = PAR.pupila(id, lado, { D: lado === "D" ? 1 : 0, I: lado === "I" ? 1 : 0 }, 0);
    const dSano = a[lado].d, dEnf = b[lado].d;
    return { dSano, dEnf, positivo: dEnf - dSano > 0.3 };
  };

  /* Estado de la vía (0..1 por tramo) para iluminar el diagrama. */
  PAR.via = function (id, lado, luz) {
    const L = LES[id], sp = L.ojos(lado || "D"), v = {};
    luz = luz || { D: 0, I: 0 };
    const sII = {};
    for (const e of ["D", "I"]) { v["ret" + e] = clamp(luz[e], 0, 1); sII[e] = v["ret" + e] * sp[e].aII; v["n2" + e] = sII[e]; }
    v.quiasma = clamp(sII.D + sII.I, 0, 1);
    for (const e of ["D", "I"]) {
      const drive = clamp(sII[e] + CONSENSUAL * sII[otro(e)], 0, 1);
      v["q" + e] = drive;                                // señal que sale del quiasma hacia ese lado
      v["pre" + e] = drive * sp[e].pr * sp[e].gan;      // pretectal
      v["EW" + e] = v["pre" + e];                        // Edinger-Westphal
      v["n3" + e] = v["EW" + e] * sp[e].eff;            // III y esfínter del iris
    }
    return v;
  };

  /* Lo que se ve en reposo: ptosis (0/1/2) y enoftalmos por ojo + desviación del globo. */
  PAR.signosReposo = function (id, lado) {
    const L = LES[id], r = { ptosis: { D: 0, I: 0 }, enoftalmos: { D: false, I: false }, mirada: { D: null, I: null } };
    if (L.lat) {
      r.ptosis[lado] = L.ptosis; r.enoftalmos[lado] = L.enoftalmos; r.mirada[lado] = L.mirada;
    }
    return r;
  };

  /* =========================================================
     2 · MOTILIDAD OCULAR (11j)
     Coordenadas de la mirada en términos del paciente: gx > 0 = hacia su derecha, gy > 0 = arriba. Rango -1..1.
     Músculos (11j): recto lateral (VI) abduce; recto medial (III) aduce; recto superior (III) arriba y afuera;
     oblicuo inferior (III) arriba y adentro; recto inferior (III) abajo y afuera; oblicuo superior (IV) abajo y adentro.
     ========================================================= */
  PAR.MUSCULOS = [
    { id: "RL", nombre: "Recto lateral", par: "VI", accion: "afuera (abducción)" },
    { id: "RM", nombre: "Recto medial", par: "III", accion: "adentro (aducción)" },
    { id: "RS", nombre: "Recto superior", par: "III", accion: "arriba y afuera" },
    { id: "OI", nombre: "Oblicuo inferior", par: "III", accion: "arriba y adentro" },
    { id: "RI", nombre: "Recto inferior", par: "III", accion: "abajo y afuera" },
    { id: "OS", nombre: "Oblicuo superior", par: "IV", accion: "abajo y adentro" }
  ];

  // desviación en reposo por el músculo antagonista que queda sin oposición (abd: + hacia afuera; y: + arriba)
  const DESV = { III: { abd: 0.55, y: -0.35 }, IV: { abd: 0, y: 0.12 }, VI: { abd: -0.5, y: 0 } };

  /* paralisis = { par: "III"|"IV"|"VI"|null, lado: "D"|"I" }.
     Devuelve la posición de cada ojo en coordenadas del paciente (px: derecha +, py: arriba +). */
  PAR.motilidad = function (paralisis, gx, gy) {
    gx = clamp(gx, -1, 1); gy = clamp(gy, -1, 1);
    const res = { ojo: {}, activ: {} };
    for (const e of ["D", "I"]) {
      const enf = paralisis && paralisis.par && paralisis.lado === e ? paralisis.par : null;
      const a = e === "D" ? gx : -gx;                 // a > 0: este ojo debe abducir; a < 0: aducir
      const w = { RL: 1, RM: 1, RS: 1, OI: 1, RI: 1, OS: 1 };
      if (enf === "III") { w.RM = 0; w.RS = 0; w.OI = 0; w.RI = 0; }
      if (enf === "IV") w.OS = 0;
      if (enf === "VI") w.RL = 0;
      const aa = Math.abs(a);
      // horizontal
      const abd = a > 0 ? a * w.RL : a * w.RM;
      // vertical: arriba, el recto superior rinde más en abducción y el oblicuo inferior en aducción
      const fAbd = clamp(0.5 + 0.5 * a, 0, 1), fAdd = 1 - fAbd;
      let vy = 0;
      if (gy > 0) vy = gy * (w.RS * fAbd + w.OI * fAdd);
      else if (gy < 0) vy = gy * (w.RI * fAbd + w.OS * fAdd);
      // activación de cada músculo (para mostrar cuáles trabajan)
      res.activ[e] = {
        RL: a > 0 ? a : 0, RM: a < 0 ? aa : 0,
        RS: gy > 0 ? gy * fAbd : 0, OI: gy > 0 ? gy * fAdd : 0,
        RI: gy < 0 ? -gy * fAbd : 0, OS: gy < 0 ? -gy * fAdd : 0
      };
      // desviación en reposo por el músculo que queda sin oposición
      const dz = enf ? DESV[enf] : { abd: 0, y: 0 };
      const absX = clamp(abd + dz.abd, -1, 1), py = clamp(vy + dz.y, -1, 1);
      res.ojo[e] = { px: e === "D" ? absX : -absX, py, enf };
    }
    // diplopía: diferencia entre las dos líneas de mirada
    const dx = res.ojo.D.px - res.ojo.I.px, dy = res.ojo.D.py - res.ojo.I.py;
    res.dx = dx; res.dy = dy;
    res.diplopia = Math.hypot(dx, dy) > 0.12;
    res.tipo = !res.diplopia ? null : Math.abs(dx) >= Math.abs(dy) ? "horizontal" : "vertical";
    // el ojo que fija es el sano; el otro es el desviado
    res.fija = paralisis && paralisis.par ? (paralisis.lado === "D" ? "I" : "D") : null;
    return res;
  };

  /* Resumen clínico por par (11j). */
  PAR.PARALISIS = {
    III: { nombre: "III par (motor ocular común)", signos: "ptosis, ojo abajo y afuera, diplopía horizontal; con pupila afectada (midriasis arreactiva) si es completo.", donde: "no puede aducir, subir ni bajar bien el ojo",
           causa: "Lo más frecuente es la microangiopatía del espacio subaracnoideo o del seno cavernoso; menos, un infarto mesencefálico; y rara vez un aneurisma de la comunicante posterior (por eso, con pupila afectada, se descarta compresión)." },
    IV:  { nombre: "IV par (troclear o patético)", signos: "diplopía vertical, ve los objetos inclinados, le cuesta leer; inclina la cabeza hacia el lado sano con el mentón deprimido.", donde: "el ojo no baja bien cuando está hacia adentro (oblicuo superior)",
           causa: "La causa más frecuente es traumática; también infartos." },
    VI:  { nombre: "VI par (motor ocular externo)", signos: "diplopía horizontal que empeora al mirar al lado afectado y es peor de lejos; esotropía del ojo afectado; gira la cabeza hacia el lado sano.", donde: "el ojo no abduce (recto lateral)",
           causa: "Es la parálisis oculomotora aislada más frecuente; por ser el par más largo, es un falso localizador." }
  };

  /* =========================================================
     3 · LOS 12 PARES (11d, 11j) — datos de la tabla de la clase
     ========================================================= */
  PAR.PARES = [
    { n: 1, rom: "I", nombre: "Olfatorio", tipo: "sensitivo", zonas: ["nariz"],
      funcion: "Sensitivo: la olfación.", explora: "Cada fosa nasal por separado, con los ojos cerrados, con sustancias no irritantes (menta, café, canela, clavo).", lesion: "Anosmia." },
    { n: 2, rom: "II", nombre: "Óptico", tipo: "sensitivo", zonas: ["ojos"],
      funcion: "Sensitivo: la visión.", explora: "Agudeza visual lejana y cercana, visión de colores, campos visuales por confrontación y oftalmoscopia de papila y retina.", lesion: "Defecto campimétrico, papiledema; en la pupila, un defecto aferente (la luz llega poco al mesencéfalo)." },
    { n: 3, rom: "III", nombre: "Motor ocular común", tipo: "motor", zonas: ["ojos", "parpados"],
      funcion: "Motor y parasimpático: eleva el párpado, mueve el ojo (recto superior, inferior, medial y oblicuo inferior) y contrae la pupila.", explora: "Movimientos oculares, posición del párpado y reactividad pupilar.", lesion: "Ptosis, midriasis arreactiva y ojo abajo y afuera." },
    { n: 4, rom: "IV", nombre: "Troclear", tipo: "motor", zonas: ["orbitasup"],
      funcion: "Motor: oblicuo superior (mueve el ojo abajo y adentro). Es el nervio craneal más pequeño y el único que sale por detrás del mesencéfalo.", explora: "Movimiento del ojo hacia abajo y adentro.", lesion: "Diplopía vertical e inclinación compensadora de la cabeza." },
    { n: 5, rom: "V", nombre: "Trigémino", tipo: "mixto", zonas: ["frente", "mejilla", "mandibula"],
      funcion: "Mixto: sensibilidad de la cara (ramas oftálmica, maxilar y mandibular) y músculos de la masticación.", explora: "Sensibilidad facial en las tres ramas (tacto, dolor, temperatura), vibración y fuerza de la masticación.", lesion: "Hipoestesia facial y desviación mandibular." },
    { n: 6, rom: "VI", nombre: "Motor ocular externo (abducens)", tipo: "motor", zonas: ["orbitalat"],
      funcion: "Motor: recto lateral (abduce el ojo). Es el nervio craneal más largo.", explora: "Abducción del ojo.", lesion: "Diplopía horizontal y esotropía. Es un falso localizador." },
    { n: 7, rom: "VII", nombre: "Facial", tipo: "mixto", zonas: ["frente", "ojos", "boca"],
      funcion: "Mixto: músculos de la expresión, parasimpático de lágrima y glándulas salivales y gusto de los 2/3 anteriores de la lengua.", explora: "Simetría facial en reposo y al gesticular, fuerza del orbicular, gusto de los 2/3 anteriores de la lengua.", lesion: "Parálisis facial. Si la frente se arruga, la lesión es central; si no, periférica." },
    { n: 8, rom: "VIII", nombre: "Vestibulococlear", tipo: "sensitivo", zonas: ["oidos"],
      funcion: "Sensitivo: audición (coclear) y equilibrio (vestibular).", explora: "Audición con Rinne y Weber; equilibrio con Romberg, Fukuda y nistagmus.", lesion: "Hipoacusia, vértigo y nistagmus patológico." },
    { n: 9, rom: "IX", nombre: "Glosofaríngeo", tipo: "mixto", zonas: ["garganta"],
      funcion: "Mixto: sensibilidad del tercio posterior de la lengua, paladar blando y faringe, y su gusto; estilofaríngeo; barorreceptores del seno carotídeo.", explora: "Reflejo nauseoso y gusto del tercio posterior de la lengua.", lesion: "Ausencia del reflejo nauseoso." },
    { n: 10, rom: "X", nombre: "Vago", tipo: "mixto", zonas: ["garganta"],
      funcion: "Mixto: paladar blando, faringe y laringe (voz, deglución).", explora: "Elevación del paladar y la úvula al decir «a», deglución y calidad de la voz.", lesion: "Desviación de la úvula, disfonía y disfagia." },
    { n: 11, rom: "XI", nombre: "Espinal accesorio", tipo: "motor", zonas: ["cuello"],
      funcion: "Motor: esternocleidomastoideo y fibras superiores del trapecio.", explora: "Fuerza del ECM (girar la cabeza contra resistencia al lado opuesto) y del trapecio (elevar los hombros contra resistencia).", lesion: "Debilidad para girar la cabeza o elevar el hombro." },
    { n: 12, rom: "XII", nombre: "Hipogloso", tipo: "motor", zonas: ["lengua"],
      funcion: "Motor: musculatura intrínseca y extrínseca de la lengua.", explora: "Inspección en reposo (atrofia, fasciculaciones), movimientos, fuerza y palpación.", lesion: "Al sacar la lengua, se desvía hacia el lado paralizado." }
  ];

  /* =========================================================
     4 · CASOS PARA PONERTE A PRUEBA (generados a partir del propio modelo)
     ========================================================= */
  const LADO = { D: "derecho", I: "izquierdo" }, LADOF = { D: "derecha", I: "izquierda" };
  const fmt = x => (Math.round(x * 10) / 10).toString().replace(".", ",");

  // Opciones de respuesta: id de lesión o par oculomotor. Texto breve en `RESP`.
  PAR.RESP = {
    normal: "Pupilas normales", ii_parcial: "Nervio óptico (II): defecto aferente", ii_total: "Nervio óptico (II): ceguera de ese ojo",
    iii: "III par completo (pupila afectada)", iii_inc: "III par incompleto (pupila respetada)", horner: "Síndrome de Horner (simpático)",
    argyll: "Argyll Robertson (pretectal)", aniso_fis: "Anisocoria fisiológica", midriatico: "Midriático instilado",
    coma_meta: "Coma metabólico", opioide: "Opioides o lesión pontina", mesenc: "Mesencéfalo dorsal", nucleo3: "Núcleo del III",
    IV: "IV par (troclear)", VI: "VI par (abducens)"
  };

  PAR.EXPLICA = {
    ii_parcial: "La pupila del ojo enfermo se contrae poco porque llega poca señal por el nervio óptico, pero el eferente (III) está sano: por eso el otro ojo la contrae bien (consensual). Se reconoce porque al pasar la luz del sano al enfermo ambas pupilas se dilatan.",
    ii_total: "Sin señal aferente no hay fotomotor directo ni consensual desde ese ojo. Como el III de ese lado está sano, la pupila se contrae cuando se ilumina el ojo sano (consensual).",
    iii: "El III lleva el parasimpático al esfínter del iris y la motricidad al párpado y a cuatro músculos. Si falla, la pupila queda en midriasis arreactiva, hay ptosis y el ojo queda abajo y afuera (actúan el recto lateral y el oblicuo superior). La pupila afectada obliga a descartar compresión, por ejemplo un aneurisma.",
    iii_inc: "Hay ptosis y alteración de la motilidad, pero la pupila reacciona: se respetó la vía parasimpática. Completo o incompleto se distingue por la pupila.",
    horner: "La lesión de la vía simpática quita el dilatador del iris (miosis), el músculo del párpado (ptosis) y empuja el ojo hacia atrás (enoftalmos). El fotomotor se conserva porque la vía parasimpática está sana. En un fumador con síntomas pulmonares, piensa en un tumor del vértice pulmonar.",
    argyll: "Se pierde el camino de la luz y se conserva el de la cercanía: luz no, cerca sí. Pupilas pequeñas e irregulares; neurosífilis. Es literatura: tu clase no lo describe. La ptosis no es de esta tríada, es del Horner.",
    aniso_fis: "Pupilas de distinto tamaño pero ambas reactivas y sin otros signos: anisocoria fisiológica, presente en el 5% de la población.",
    midriatico: "Midriasis arreactiva sin ptosis ni alteración de la motilidad: el ojo se mueve normal, así que no es el III. Hay que preguntar por colirios (p. ej. mydriacyl).",
    coma_meta: "Miosis con fotomotor conservado es el marcador típico del coma metabólico (y de la herniación central por masa supratentorial).",
    opioide: "Pupilas puntiformes apenas reactivas: lesión pontina o uso de opioides.",
    mesenc: "Midriasis con fotomotor ausente y pupilas irregulares: disfunción mesencefálica dorsal.",
    nucleo3: "Pupilas fijas en posición media: disfunción a nivel del núcleo del tercer par.",
    IV: "El oblicuo superior (IV) baja el ojo cuando está hacia adentro. Si falla hay diplopía vertical, sobre todo al leer o bajar la mirada, y el paciente inclina la cabeza hacia el lado sano. La causa más frecuente es traumática.",
    VI: "El recto lateral (VI) abduce. Si falla, el ojo queda hacia adentro (esotropía) y la diplopía horizontal empeora al mirar al lado enfermo; el paciente gira la cabeza al lado sano. Es el par más largo: falso localizador."
  };

  /* Describe en prosa los signos del caso a partir del modelo, para que texto y simulador no discrepen. */
  function textoCaso(id, lado) {
    const L = LES[id], p0 = PAR.pupila(id, lado, { D: 0, I: 0 }, 0), s = [];
    const ref = e => PAR.reflejos(id, lado, e);
    const pupilas = e => `pupila ${LADOF[e]} de ${fmt(p0[e].d)} mm`;
    if (id === "ii_parcial" || id === "ii_total") {
      s.push(`Las pupilas miden ${fmt(p0.D.d)} mm y ${fmt(p0.I.d)} mm en reposo.`);
      const r = ref(lado), o = ref(otro(lado));
      s.push(`Al iluminar el ojo ${LADO[lado]}: fotomotor ${r.directo} y consensual ${r.consensual}. Al iluminar el ${LADO[otro(lado)]}: fotomotor ${o.directo} y consensual ${o.consensual}.`);
      if (id === "ii_parcial") s.push(`Al pasar la linterna del ojo ${LADO[otro(lado)]} al ${LADO[lado]}, ambas pupilas se dilatan.`);
      s.push("Sin ptosis; los ojos se mueven bien.");
    } else if (id === "iii" || id === "iii_inc") {
      s.push(`Ptosis del ojo ${LADO[lado]}${id === "iii" ? " (marcada)" : ""}, ${id === "iii" ? "con el ojo desviado hacia abajo y afuera" : "con alteración de la motilidad y diplopía"}.`);
      s.push(`${pupilas(lado)}; fotomotor ${ref(lado).directo}.`);
    } else if (id === "horner") {
      s.push(`Ptosis, ojo hundido y ${pupilas(lado)} (la otra mide ${fmt(p0[otro(lado)].d)} mm), solo del lado ${LADO[lado]}.`);
      s.push(`Fotomotor ${ref(lado).directo}. Es fumador con síntomas pulmonares.`);
    } else if (id === "argyll") {
      s.push(`Pupilas pequeñas (${fmt(p0.D.d)} mm) e irregulares en los dos ojos. Con la linterna no se contraen (fotomotor ${ref("D").directo}); al seguir un dedo que se acerca, sí (acomodación ${PAR.acomodacion(id, lado).D}). Antecedente de sífilis sin tratar.`);
    } else if (id === "aniso_fis") {
      s.push(`Pupila ${LADOF[lado]} de ${fmt(p0[lado].d)} mm y la otra de ${fmt(p0[otro(lado)].d)} mm. Ambas reaccionan a la luz y a la cercanía. Sin ptosis, sin diplopía, asintomático.`);
    } else if (id === "midriatico") {
      s.push(`Pupila ${LADOF[lado]} de ${fmt(p0[lado].d)} mm sin respuesta a la luz; la otra normal. No hay ptosis y los movimientos oculares son normales. Fue atendido en una consulta de oftalmología hace unas horas.`);
    } else if (id === "coma_meta") {
      s.push(`Paciente en coma. Pupilas de ${fmt(p0.D.d)} mm, simétricas; con la linterna se contraen (fotomotor ${ref("D").directo}). Glucemia muy baja.`);
    } else if (id === "opioide") {
      s.push(`Paciente en coma con frecuencia respiratoria baja. Pupilas de ${fmt(p0.D.d)} mm, simétricas; apenas se contraen con la luz (fotomotor ${ref("D").directo}).`);
    } else if (id === "mesenc") {
      s.push(`Paciente en coma. Pupilas de ${fmt(p0.D.d)} mm, irregulares y sin fotomotor (${ref("D").directo}).`);
    } else if (id === "nucleo3") {
      s.push(`Paciente en coma. Pupilas de ${fmt(p0.D.d)} mm, fijas en posición media, sin respuesta a la luz ni a la cercanía.`);
    } else s.push("Pupilas simétricas y reactivas.");
    return s.join(" ");
  }

  const CASOS_BASE = [
    "ii_parcial", "ii_total", "iii", "iii_inc", "horner", "argyll", "aniso_fis", "midriatico",
    "coma_meta", "opioide", "mesenc", "nucleo3", "IV", "VI"
  ];
  PAR.CASOS_BASE = CASOS_BASE;

  /* Genera n casos con rng() -> [0,1). Cada caso: {resp, lado, texto, opciones[], explicacion}. */
  PAR.casos = function (rng, n) {
    const out = [], pool = CASOS_BASE.slice();
    for (let i = 0; i < n; i++) {
      if (!pool.length) pool.push(...CASOS_BASE);
      const resp = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      const lado = rng() < 0.5 ? "D" : "I";
      let texto;
      if (resp === "IV") texto = `Diplopía vertical que empeora al leer y al bajar escaleras. Inclina la cabeza hacia el lado ${LADO[otro(lado)]} con el mentón deprimido. Tuvo un traumatismo craneal hace un mes. Pupilas normales y reactivas; sin ptosis.`;
      else if (resp === "VI") texto = `Diplopía horizontal que empeora al mirar hacia el lado ${LADO[lado]} y es peor de lejos. El ojo ${LADO[lado]} está desviado hacia adentro (esotropía) y gira la cabeza hacia el lado ${LADO[otro(lado)]}. Pupilas normales y reactivas.`;
      else texto = textoCaso(resp, lado);
      // opciones: la correcta + distractores cercanos
      const cerca = {
        ii_parcial: ["ii_total", "normal", "iii_inc"], ii_total: ["ii_parcial", "iii", "midriatico"], iii: ["midriatico", "iii_inc", "nucleo3"],
        iii_inc: ["iii", "VI", "IV"], horner: ["aniso_fis", "coma_meta", "iii_inc"], argyll: ["opioide", "coma_meta", "horner"],
        aniso_fis: ["horner", "midriatico", "iii"], midriatico: ["iii", "aniso_fis", "mesenc"], coma_meta: ["opioide", "argyll", "horner"],
        opioide: ["coma_meta", "argyll", "mesenc"], mesenc: ["nucleo3", "midriatico", "opioide"], nucleo3: ["mesenc", "iii", "opioide"],
        IV: ["VI", "iii_inc", "ii_parcial"], VI: ["IV", "iii_inc", "horner"]
      }[resp].slice();
      const opc = [resp, ...cerca].map(x => ({ k: x, t: PAR.RESP[x] }));
      for (let j = opc.length - 1; j > 0; j--) { const k = Math.floor(rng() * (j + 1)); [opc[j], opc[k]] = [opc[k], opc[j]]; }
      out.push({ resp, lado, texto, opciones: opc, explicacion: PAR.EXPLICA[resp], lit: resp === "argyll" || resp === "ii_parcial" });
    }
    return out;
  };

  if (typeof module !== "undefined" && module.exports) module.exports = PAR;
  else root.PAR = PAR;
})(typeof window !== "undefined" ? window : globalThis);
