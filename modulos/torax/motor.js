/* Síndromes pleuropulmonares — MOTOR (datos y lógica; sin DOM, se prueba en Node).
   Fuente: wiki/SEMIOLOGIA/clases/07b-07f (Sotomayor 2020 + lo dicho en clase) y fichas 04, 15, 16, 17.
   El docente manda: todo hallazgo de la tabla sale de 07e/07f. Lo que no está en la clase lleva lit:true
   y la interfaz lo rotula «literatura».
   Qué hace:
     · SIND: un registro por síndrome con sus hallazgos de inspección, palpación, percusión y auscultación.
     · hallazgo(): qué encuentra el examinador en una zona concreta (vista, lado, fila) con una herramienta.
     · geom(): geometría del corte coronal (qué hay dentro: líquido, aire, consolidación, colapso, mediastino).
     · RUIDOS: catálogo de ruidos con su mecanismo y su "receta" de síntesis.
     · generadores de casos para «Ponte a prueba». */
(function (root) {
  "use strict";

  /* ---------- nombres de zona ---------- */
  const FILAS = {
    ant: ["Vértice (supra e infraclavicular)", "Zona media (3.º-5.º espacio)", "Base (debajo del 5.º espacio)"],
    pos: ["Vértice (supraespinoso)", "Zona escapular e interescapular", "Base (infraescapular)"]
  };

  /* ---------- vocabulario de hallazgos ---------- */
  const VV = {
    nor: "Vibraciones vocales normales", aum: "Vibraciones vocales AUMENTADAS",
    dis: "Vibraciones vocales DISMINUIDAS", abol: "Vibraciones vocales ABOLIDAS"
  };
  const PERC = {
    claro: { n: "Sonoro (claro pulmonar)", tono: "medio", dur: "media", int: "media", d: "Sonido claro normal: alvéolos con aire." },
    submate: { n: "Submate", tono: "medio-grave", dur: "corta", int: "baja", d: "Menos aire y más tejido que el pulmón normal: sonido apagado, pero aún con algo de resonancia." },
    mate: { n: "Mate (matidez)", tono: "grave", dur: "muy corta", int: "baja", d: "Sin aire bajo el dedo: golpe seco, sordo, como percutir un muslo." },
    timp: { n: "Timpánico", tono: "agudo", dur: "larga", int: "alta", d: "Aire libre en una cámara: sonido agudo, resonante, como un tambor." },
    hiper: { n: "Hipersonoro", tono: "grave", dur: "larga", int: "alta", d: "Exageración del claro: más intenso, más grave y más duradero, por aire atrapado." }
  };
  const MV = {
    nor: "Murmullo vesicular normal", dis: "Murmullo vesicular DISMINUIDO", abol: "Murmullo vesicular ABOLIDO (silencio respiratorio)",
    aum: "Murmullo vesicular AUMENTADO (compensador)", dis_esp: "Murmullo vesicular disminuido con ESPIRACIÓN PROLONGADA"
  };
  const ADV = {
    tubarico: "Soplo tubárico", cavitario: "Soplo cavitario", anforico: "Soplo anfórico", pleuritico: "Soplo pleurítico",
    crepitantes: "Estertores crepitantes", subcrepitantes: "Estertores subcrepitantes", roncus: "Roncus", sibilancias: "Sibilancias",
    frote: "Frote pleural"
  };
  const VOZ = {
    nor: "Voz confusa y lejana (normal): no se distingue ninguna sílaba",
    dis: "Resonancia vocal DISMINUIDA",
    broncofonia: "BRONCOFONÍA: «treinta y tres» se oye con nitidez",
    pectoriloquia: "PECTORILOQUIA: la voz llega articulada con claridad",
    egofonia: "EGOFONÍA: voz de cabra, temblorosa y chillona"
  };

  /* ---------- síndromes ----------
     perfil: por fila (0 vértice, 1 media, 2 base) → 0 sano, 1 afectada, "e" borde.
     a / e: hallazgos de la zona afectada / del borde.
     why: causa → efecto por método.
     med: dirección del mediastino ("sano", "enfermo", "ninguno"). */
  const S = {}, ORDEN = [];
  const def = o => { S[o.id] = o; ORDEN.push(o.id); };

  def({
    id: "normal", nombre: "Tórax sano (sin síndrome)", corto: "Sano", bilateral: true, enTabla: false, enPrueba: true,
    perfil: { ant: [0, 0, 0], pos: [0, 0, 0] }, a: {},
    insp: "Tórax simétrico, expansibilidad conservada y simétrica.", inspCorto: "simétrico, expansibilidad normal",
    why: { insp: "Ambos pulmones se llenan por igual: los hemitórax se mueven a la par.", vv: "", perc: "", aus: "" },
    med: { dir: "ninguno", txt: "Mediastino central." },
    tabla: { insp: "Simétrica", palp: "Normales", perc: "Claro pulmonar", aus: "Murmullo vesicular", med: "Central" },
    clave: "Todo simétrico: sonoro, murmullo vesicular y vibraciones iguales en puntos homólogos."
  });

  def({
    id: "condensacion", nombre: "Condensación neumónica", corto: "Condensación", bilateral: false, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, 1, 1] },
    a: { vv: "aum", perc: "mate", mv: "abol", adv: ["tubarico", "crepitantes"], voz: "broncofonia" },
    insp: "Expansibilidad torácica disminuida, sobre todo en la zona afectada.", inspCorto: "expansibilidad disminuida en la zona",
    why: {
      insp: "El segmento lleno de exudado no se airea: se mueve menos con la inspiración profunda.",
      vv: "El tejido sólido (exudado) conduce mejor que el pulmón aireado la vibración de las cuerdas vocales: la mano la siente aumentada.",
      perc: "El aire alveolar fue reemplazado por exudado: con menos aire que vibre, el golpe suena mate o submate.",
      aus: "Los alvéolos llenos no dejan pasar el murmullo vesicular, pero el bronquio sigue permeable y transmite el ruido glótico: soplo tubárico. Los alvéolos con exudado se despegan al inspirar: crepitantes. La voz llega nítida: broncofonía."
    },
    med: { dir: "ninguno", txt: "Sin desviación: el pulmón no pierde ni gana volumen.", lit: true },
    tabla: { insp: "Expansibilidad disminuida, sobre todo en la zona afectada", palp: "Aumentadas", perc: "Submatidez o matidez, según el segmento o lóbulo", aus: "Murmullo vesicular abolido; crepitantes, soplo tubárico, broncofonía, pectoriloquia", med: "Sin desviación" },
    clave: "Vibraciones AUMENTADAS + matidez + soplo tubárico con crepitantes: pulmón sólido pero con el bronquio abierto. Para dar el patrón completo el foco debe tocar la pleura y medir más de 6 cm."
  });

  def({
    id: "atelectasia", nombre: "Atelectasia", corto: "Atelectasia", bilateral: false, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, 1, 1] },
    a: { vv: "abol", perc: "mate", mv: "abol", adv: [], voz: "dis" },
    insp: "Expansibilidad disminuida, retracción de los espacios intercostales y asimetría.", inspCorto: "RETRACCIÓN del hemitórax y de los espacios intercostales",
    why: {
      insp: "El pulmón colapsado pierde volumen y jala la pared: el hemitórax se retrae.",
      vv: "El bronquio está tapado y el segmento colapsado: la vibración no llega a la pared (disminuidas o abolidas según el tamaño).",
      perc: "Alvéolos colapsados, sin aire: submatidez o matidez.",
      aus: "No entra aire al segmento: el murmullo vesicular está disminuido o abolido (silencio respiratorio) y la voz no llega."
    },
    med: { dir: "enfermo", txt: "El mediastino se desvía HACIA el lado enfermo: el pulmón perdió volumen y lo atrae." },
    tabla: { insp: "Expansibilidad disminuida, retracción de espacios intercostales, asimetría", palp: "Disminuidas o abolidas, según el tamaño", perc: "Submatidez o matidez", aus: "Murmullo vesicular disminuido o abolido; silencio respiratorio", med: "Hacia el lado enfermo (jala)" },
    clave: "Igual que el derrame en palpación, percusión y auscultación; la diferencia es el volumen: la atelectasia RETRAE el hemitórax y JALA el mediastino al lado enfermo, el derrame ABOMBA y lo EMPUJA al lado sano."
  });

  def({
    id: "derrame", nombre: "Derrame pleural", corto: "Derrame pleural", bilateral: false, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, "e", 1] },
    a: { vv: "abol", perc: "mate", mv: "abol", adv: [], voz: "dis" },
    e: { vv: "dis", perc: "mate", mv: "dis", adv: ["pleuritico"], voz: "egofonia" },
    insp: "Abombamiento del hemitórax comprometido y expansibilidad disminuida.", inspCorto: "ABOMBAMIENTO del hemitórax",
    why: {
      insp: "El líquido ocupa espacio dentro del tórax: aumenta el diámetro del hemitórax y el pulmón comprimido casi no se expande.",
      vv: "El líquido amortigua la vibración antes de que llegue a la mano: disminuidas o abolidas según el volumen.",
      perc: "El líquido en la pleura no vibra como el aire: matidez intensa. Su límite superior dibuja la curva parabólica de Damoiseau, con el triángulo de Garland (hipersonoro) por encima y el de Grocco (mate, contralateral) por debajo.",
      aus: "El líquido separa el pulmón de la pared y el murmullo no llega (abolido). En el borde superior, donde el pulmón comprimido queda bajo una capa fina de líquido, pasa el ruido glótico: soplo pleurítico (letra E) y egofonía."
    },
    med: { dir: "sano", txt: "Si el derrame es voluminoso, el mediastino se desvía hacia el lado SANO: el líquido empuja." },
    tabla: { insp: "Abombamiento del hemitórax, expansibilidad disminuida", palp: "Disminuidas o abolidas, según el volumen", perc: "Matidez intensa; curva parabólica de Damoiseau", aus: "Murmullo vesicular abolido; soplo pleurítico o tubárico en el borde superior", med: "Al lado sano si es voluminoso (empuja)" },
    clave: "Todo apagado (vibraciones, murmullo, sonoridad) con ABOMBAMIENTO. El soplo pleurítico en el borde superior y el mediastino al lado sano lo separan de la atelectasia."
  });

  def({
    id: "neumotorax", nombre: "Neumotórax", corto: "Neumotórax", bilateral: false, enPrueba: true,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "abol", perc: "timp", mv: "abol", adv: [], voz: "dis" },
    insp: "Abombamiento del hemitórax, expansibilidad disminuida.", inspCorto: "ABOMBAMIENTO del hemitórax",
    why: {
      insp: "El aire libre en la pleura infla el hemitórax y deja el pulmón colapsado: casi no se mueve.",
      vv: "El aire libre no conduce la vibración de la voz: abolidas.",
      perc: "Aire libre en la cavidad pleural: sonido agudo y resonante como un tambor, timpánico (no es la hipersonoridad del enfisema).",
      aus: "El pulmón colapsado queda separado de la pared por aire: silencio respiratorio. Si hay fístula broncopleural abierta, la cavidad actúa como caja de resonancia: soplo anfórico."
    },
    med: { dir: "sano", txt: "En el neumotórax hipertensivo el mediastino se desvía, el diafragma se aplana y los espacios intercostales se ensanchan.", lit: true, litTxt: "hacia el lado sano" },
    tabla: { insp: "Abombamiento del hemitórax, expansibilidad disminuida", palp: "Abolidas", perc: "Hipersonoridad o timpanismo", aus: "Silencio respiratorio; soplo anfórico si hay fístula broncopleural", med: "Desviado en el hipertensivo (el lado, literatura: al sano)" },
    clave: "Dolor y disnea súbitos, tórax TIMPÁNICO con vibraciones y murmullo abolidos. El soplo anfórico indica fístula broncopleural."
  });

  def({
    id: "enfisema", nombre: "Enfisema pulmonar", corto: "Enfisema", bilateral: true, enPrueba: true,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "dis", perc: "hiper", mv: "dis_esp", adv: ["roncus", "sibilancias"], voz: "dis" },
    insp: "Tórax en tonel en fases avanzadas; expansibilidad disminuida.", inspCorto: "tórax EN TONEL, expansibilidad disminuida",
    why: {
      insp: "Los alvéolos destruidos atrapan aire: el diámetro anteroposterior crece (tórax en tonel) y el tórax apenas se expande más.",
      vv: "Hay más aire y menos parénquima que transmita la vibración: disminuidas.",
      perc: "Aire atrapado en exceso: el sonido es más intenso, más grave y más duradero que el claro normal (hipersonoridad).",
      aus: "Hay poco flujo útil en los alvéolos destruidos (murmullo disminuido) y el aire sale lento por bronquios estrechados (espiración prolongada), que vibran y silban: roncus y sibilancias diseminados."
    },
    med: { dir: "ninguno", txt: "Mediastino central; diafragma descendido y aplanado, silueta cardíaca alargada y estrecha." },
    tabla: { insp: "Tórax en tonel en fases avanzadas, expansibilidad disminuida", palp: "Disminuidas", perc: "Normal o hipersonoridad", aus: "Murmullo vesicular disminuido, espiración prolongada, roncus y sibilancias diseminados", med: "Central" },
    clave: "Hipersonoridad BILATERAL con vibraciones y murmullo disminuidos y espiración prolongada, en un tórax en tonel. No confundir con el neumotórax: allí es timpánico y unilateral."
  });

  def({
    id: "caverna", nombre: "Caverna / absceso pulmonar", corto: "Caverna", bilateral: false, enPrueba: true,
    perfil: { ant: [1, 1, 0], pos: [1, 0, 0] },
    a: { vv: "aum", perc: "timp", mv: "dis", adv: ["cavitario"], voz: "pectoriloquia" },
    insp: "Expansibilidad disminuida en la región afectada.", inspCorto: "expansibilidad disminuida en la región",
    why: {
      insp: "La zona necrosada y fibrosa que rodea la cavidad se mueve poco.",
      vv: "La pared condensada de la cavidad, comunicada con un bronquio, conduce bien la vibración: aumentadas (igual que en la neumonía).",
      perc: "Una cavidad aérea cerca de la periferia (al menos 4 cm) suena timpánica o hipersonora, a diferencia de la matidez de la neumonía.",
      aus: "El ruido glótico resuena en la cavidad de paredes gruesas y sin líquido: soplo cavitario, más grave que el tubárico. La voz se oye articulada: pectoriloquia."
    },
    med: { dir: "ninguno", txt: "Sin desviación.", lit: true },
    tabla: { insp: "Expansibilidad disminuida en la región afectada", palp: "Aumentadas (no confundir con la neumonía)", perc: "Timpanismo o hipersonoridad", aus: "Murmullo vesicular disminuido, soplo cavitario", med: "Sin desviación" },
    clave: "Vibraciones AUMENTADAS como la neumonía, pero la percusión es TIMPÁNICA (no mate) y el soplo es cavitario. Debe estar cerca de la periferia y medir al menos 4 cm."
  });

  def({
    id: "congestion", nombre: "Congestión pulmonar", corto: "Congestión", bilateral: true, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, 0, 1] },
    a: { vv: "nor", perc: "submate", mv: "nor", adv: ["crepitantes", "sibilancias"], voz: "nor" },
    insp: "Expansibilidad normal.", inspCorto: "expansibilidad normal",
    why: {
      insp: "El líquido está en el intersticio, no ocupa espacio ni cambia la mecánica de la pared.",
      vv: "El pulmón conserva su aire: la transmisión de la vibración es normal.",
      perc: "Normal o submatidez en las bases, donde el líquido se acumula por gravedad.",
      aus: "La insuficiencia ventricular izquierda eleva la presión venocapilar y el líquido llena el intersticio: los alvéolos de las bases se despegan al final de la inspiración (crepitantes bilaterales). Si el edema broncoespasma la mucosa: sibilancias (asma cardiaco)."
    },
    med: { dir: "ninguno", txt: "Mediastino central; en la radiografía, cardiomegalia." },
    tabla: { insp: "Expansibilidad normal", palp: "Normales", perc: "Normal o submatidez en las bases", aus: "Crepitantes en las bases; sibilancias de asma cardiaco", med: "Central (cardiomegalia en la Rx)" },
    clave: "Inspección, vibraciones y casi la percusión NORMALES; lo único alterado son los crepitantes bibasales (los mismos de la neumonía, pero bilaterales y de origen cardiaco)."
  });

  def({
    id: "pleuritis_aguda", nombre: "Pleuritis aguda", corto: "Pleuritis aguda", bilateral: false, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, 0, 1] },
    a: { vv: "dis", perc: "claro", mv: "nor", adv: ["frote"], voz: "dis" },
    insp: "Expansibilidad disminuida.", inspCorto: "expansibilidad disminuida (dolor al inspirar)",
    why: {
      insp: "El dolor pleurítico impide inspirar a fondo: el hemitórax se expande menos.",
      // [REVISAR] la clase da el dato (disminuidas) pero no el mecanismo; la frase siguiente es una glosa didáctica.
      vv: "La pleura inflamada y la respiración superficial por el dolor reducen la transmisión: disminuidas.",
      perc: "El pulmón conserva su aire: la percusión es normal o con submatidez discreta.",
      aus: "Las dos hojas pleurales inflamadas se rozan y el deslizamiento se vuelve audible: frote pleural, en ambos tiempos, que no cambia con la tos y aumenta al presionar con el estetoscopio."
    },
    med: { dir: "ninguno", txt: "Sin desviación.", lit: true },
    tabla: { insp: "Expansibilidad disminuida", palp: "Disminuidas", perc: "Normal o submatidez discreta", aus: "Frote pleural", med: "Sin desviación" },
    clave: "Dolor pleurítico y FROTE pleural (se oye en inspiración y espiración, no cambia con la tos). Cuando evoluciona a derrame el dolor desaparece y se vuelve gravativo."
  });

  def({
    id: "pleuritis_cronica", nombre: "Pleuritis crónica (paquipleuritis)", corto: "Pleuritis crónica", bilateral: false, enPrueba: true,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "dis", perc: "submate", mv: "dis", adv: [], voz: "dis" },
    insp: "Retracción del hemitórax afectado y expansibilidad disminuida.", inspCorto: "RETRACCIÓN del hemitórax",
    why: {
      insp: "El engrosamiento fibroso de ambas hojas pleurales encoge el hemitórax y lo fija.",
      vv: "La pleura engrosada es una capa fibrosa que amortigua la vibración: disminuidas.",
      perc: "Submatidez o matidez: el pulmón subyacente se ventila poco bajo la coraza fibrosa.",
      aus: "La coraza limita la expansión del pulmón: entra menos aire y el murmullo vesicular está disminuido."
    },
    med: { dir: "enfermo", txt: "Retracción del mediastino hacia el mismo lado, con discreta elevación del hemidiafragma (paquipleuritis)." },
    tabla: { insp: "Retracción del hemitórax, expansibilidad disminuida", palp: "Disminuidas", perc: "Submatidez o matidez", aus: "Murmullo vesicular disminuido", med: "Retraído hacia el lado enfermo" },
    clave: "Hemitórax RETRAÍDO con submatidez y murmullo disminuido, sin ruidos agregados; la Rx muestra pleura engrosada y calcificada."
  });

  def({
    id: "asma", nombre: "Obstrucción bronquial (asma)", corto: "Asma", bilateral: true, enPrueba: false,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "nor", perc: "hiper", mv: "dis_esp", adv: ["roncus", "sibilancias"], voz: "nor" },
    insp: "Expansibilidad disminuida; tórax en tonel en formas avanzadas.", inspCorto: "expansibilidad disminuida",
    why: {
      insp: "El aire atrapado mantiene el tórax insuflado y limita su excursión.",
      vv: "Normales o disminuidas: el parénquima es el mismo, solo hay más aire atrapado.",
      perc: "El aire entra con facilidad pero le cuesta salir en la espiración: queda atrapado y suena hipersonoro.",
      aus: "El estrechamiento difuso y reversible de los bronquiolos (edema, broncoespasmo, secreción) alarga la espiración y el aire silba (sibilancias, más en espiración) o vibra en bronquios gruesos (roncus)."
    },
    med: { dir: "ninguno", txt: "Central." },
    tabla: { insp: "Expansibilidad disminuida; tórax en tonel en formas avanzadas", palp: "Normales o disminuidas", perc: "Normal o hipersonoridad", aus: "Murmullo vesicular disminuido, espiración prolongada, roncus y sibilancias diseminados", med: "Central" },
    clave: "Cuadro idéntico al enfisema en el examen; lo distingue la historia: obstrucción REVERSIBLE de los bronquiolos, de base alérgica (IgE)."
  });

  def({
    id: "bronquiectasia", nombre: "Síndrome bronquiectásico", corto: "Bronquiectasia", bilateral: false, enPrueba: true,
    perfil: { ant: [0, 0, 1], pos: [0, 0, 1] },
    a: { vv: "nor", perc: "claro", mv: "nor", adv: ["subcrepitantes"], voz: "nor" },
    insp: "Expansibilidad disminuida.", inspCorto: "expansibilidad disminuida",
    why: {
      insp: "Las bronquiectasias y las infecciones repetidas dejan fibrosis y la región se mueve menos.",
      vv: "Normales o disminuidas: el parénquima conserva su aire.",
      perc: "Normal o submatidez localizada.",
      aus: "La secreción acumulada en las dilataciones bronquiales se burbujea al paso del aire: subcrepitantes LOCALIZADOS (a diferencia del patrón difuso de las bronquitis), que cambian con la tos."
    },
    med: { dir: "ninguno", txt: "Sin desviación.", lit: true },
    tabla: { insp: "Expansibilidad disminuida", palp: "Normales o disminuidas", perc: "Normal o submatidez localizada", aus: "Subcrepitantes localizados", med: "—" },
    clave: "Examen casi normal salvo SUBCREPITANTES LOCALIZADOS; la historia aporta la broncorrea matutina (400-600 ml/día) y la hemoptisis."
  });

  def({
    id: "bronquitis_cronica", nombre: "Bronquitis crónica", corto: "Bronquitis crónica", bilateral: true, enPrueba: false,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "nor", perc: "claro", mv: "nor", adv: ["subcrepitantes", "roncus", "sibilancias"], voz: "nor" },
    insp: "Normal, puede estar disminuida.", inspCorto: "normal",
    why: {
      insp: "Normal o levemente disminuida.",
      vv: "Normales o disminuidas.",
      perc: "Normal o disminuida, sobre todo en casos avanzados.",
      aus: "Secreción mucopurulenta en las vías aéreas de ambos pulmones: subcrepitantes bilaterales; el estrechamiento de los bronquios añade roncus y sibilancias."
    },
    med: { dir: "ninguno", txt: "Central." },
    tabla: { insp: "Normal, puede estar disminuida", palp: "Normales o disminuidas", perc: "Normal o disminuida, sobre todo en casos avanzados", aus: "Subcrepitantes bilaterales; roncus y sibilancias frecuentes", med: "Central" },
    clave: "Examen casi normal; lo decisivo son los subcrepitantes bilaterales y la historia: tos con expectoración más de 3 meses por año durante al menos 2 años."
  });

  def({
    id: "bronquitis_aguda", nombre: "Bronquitis aguda", corto: "Bronquitis aguda", bilateral: true, enPrueba: false,
    perfil: { ant: [1, 1, 1], pos: [1, 1, 1] },
    a: { vv: "nor", perc: "claro", mv: "nor", adv: ["subcrepitantes"], voz: "nor" },
    insp: "Normal, puede estar disminuida.", inspCorto: "normal",
    why: {
      insp: "Normal o levemente disminuida.",
      vv: "Normales o disminuidas.",
      perc: "Normal, rara vez disminuida.",
      aus: "La inflamación (casi siempre viral) aumenta la secreción en ambos campos: subcrepitantes; roncus y sibilancias aparecen en fases avanzadas."
    },
    med: { dir: "ninguno", txt: "Central." },
    tabla: { insp: "Normal, puede estar disminuida", palp: "Normales o disminuidas", perc: "Normal, rara vez disminuida", aus: "Subcrepitantes en ambos campos; roncus y sibilancias en fases avanzadas", med: "Central" },
    clave: "Examen casi normal con subcrepitantes en ambos campos; fiebre y tos de origen casi siempre viral. La radiografía es aparentemente normal."
  });

  def({
    id: "bronconeumonia", nombre: "Bronconeumonía", corto: "Bronconeumonía", bilateral: true, enPrueba: false,
    perfil: { ant: [0, 0, 1], pos: [0, 1, 1] },
    a: { vv: "nor", perc: "claro", mv: "nor", adv: ["subcrepitantes", "crepitantes"], voz: "nor" },
    insp: "Normal.", inspCorto: "normal",
    why: {
      insp: "Los focos son pequeños y dispersos: la mecánica del tórax no cambia.",
      vv: "Normales: los focos no forman un bloque sólido.",
      perc: "Normal: los focos pequeños y múltiples no apagan la percusión.",
      aus: "Focos múltiples que llegan hasta el alvéolo: subcrepitantes (bronquiolos) y crepitantes (alvéolos)."
    },
    med: { dir: "ninguno", txt: "Central." },
    tabla: { insp: "Normal", palp: "Normales", perc: "Normal", aus: "Subcrepitantes y crepitantes", med: "Central" },
    clave: "Inspección, palpación y percusión normales: solo se oyen subcrepitantes y crepitantes (focos múltiples, a diferencia de la condensación lobar)."
  });

  /* ---------- percusión fisiológica (mapa normal del 07c) ---------- */
  function percNormal(vista, ladoZona, fila) {
    if (vista === "pos") return fila === 1
      ? { c: "submate", t: "Submate fisiológico: la masa muscular de la escápula y la región hiliar." }
      : { c: "claro", t: fila === 0 ? "Sonoro: vértice con alvéolos llenos de aire." : "Sonoro: base pulmonar con aire." };
    if (ladoZona === "D" && fila === 2) return { c: "mate", t: "Mate fisiológico: por debajo del 5.º espacio derecho empieza el borde superior del hígado." };
    if (ladoZona === "I" && fila === 1) return { c: "submate", t: "Submate fisiológico: el corazón queda cubierto por el pulmón." };
    if (ladoZona === "I" && fila === 2) return { c: "timp", t: "Timpánico fisiológico: espacio semilunar de Traube (cámara gástrica)." };
    return { c: "claro", t: "Sonoro: alvéolos con aire." };
  }

  /* ---------- hallazgo de una zona ----------
     id: síndrome; ladoEnf: "D"|"I"; vista: "ant"|"pos"; ladoZona: "D"|"I"; fila: 0..2; op: {fistula} */
  function hallazgo(id, ladoEnf, vista, ladoZona, fila, op) {
    op = op || {};
    const s = S[id];
    const afLado = s.bilateral || ladoZona === ladoEnf;
    const p = afLado ? s.perfil[vista][fila] : 0;
    const tipo = p === "e" ? "e" : p ? "a" : "n";
    const pn = percNormal(vista, ladoZona, fila);
    let h;
    if (tipo === "n") {
      const comp = id === "derrame" && ladoZona === ladoEnf;     // zona sana sobre el líquido: compensa
      h = { vv: "nor", perc: pn.c, mv: comp ? "aum" : "nor", adv: [], voz: "nor" };
      h.why = {
        vv: "Parénquima aireado: transmite la vibración de forma moderada y simétrica con el lado opuesto.",
        perc: pn.t,
        aus: comp ? "Zona sana por encima del líquido: ventila más para compensar el pulmón comprimido (aumento localizado del murmullo). Percute algo más clara (zona de Skoda)." : "Murmullo vesicular normal: aire pasando de los bronquios finos a los alvéolos (onomatopeya de la letra F)."
      };
    } else {
      const base = tipo === "e" ? s.e : s.a;
      h = Object.assign({}, base, { adv: base.adv.slice() });
      if (h.perc === "claro") h.perc = pn.c;
      if (id === "neumotorax" && op.fistula) { h.adv = ["anforico"]; }
      h.why = { vv: s.why.vv, perc: s.why.perc, aus: s.why.aus };
      if (id === "neumotorax" && !op.fistula) h.why.aus = "El pulmón colapsado queda separado de la pared por aire libre: silencio respiratorio (si hubiera fístula broncopleural abierta se oiría un soplo anfórico).";
    }
    h.tipo = tipo;
    h.vvTxt = VV[h.vv]; h.percTxt = PERC[h.perc].n; h.mvTxt = MV[h.mv];
    h.advTxt = h.adv.map(k => ADV[k]); h.vozTxt = VOZ[h.voz];
    h.fila = FILAS[vista][fila];
    h.afectada = tipo !== "n";
    return h;
  }

  /* ---------- geometría del corte coronal ----------
     Paciente de frente: su derecha ("R") queda a la izquierda de la figura. */
  function geom(id, ladoEnf, op) {
    op = op || {};
    const s = S[id], sk = ladoEnf === "D" ? "R" : "L", ok = sk === "R" ? "L" : "R";
    const G = {
      R: { xo: 34, xi: 146, yT: 38, yB: 246, dome: 30 },
      L: { xo: 266, xi: 154, yT: 38, yB: 254, dome: 30 },
      m: 0, tension: false, contenido: [], rotulo: s.med.txt
    };
    const sgn = k => (k === "R" ? 1 : -1);               // +1 = hacia dentro del tórax
    const haciaSano = sk === "R" ? 1 : -1;   // signo del desplazamiento hacia el lado sano (+x si el enfermo es el derecho)
    const ps = G[sk];
    switch (id) {
      case "condensacion": G.contenido.push({ t: "consolidacion", lado: sk }); break;
      case "atelectasia":
        ps.xo += sgn(sk) * 16; ps.yB -= 24; G.m = -haciaSano * 14; G.contenido.push({ t: "colapso", lado: sk }); break;
      case "derrame":
        ps.xo -= sgn(sk) * 6; G.m = haciaSano * (op.masivo === false ? 0 : 16); G.contenido.push({ t: "liquido", lado: sk }); break;
      case "neumotorax":
        ps.xo -= sgn(sk) * 6; G.contenido.push({ t: "aire", lado: sk });
        if (op.tension) { G.tension = true; G.m = haciaSano * 18; ps.dome = 6; ps.yB += 8; }
        break;
      case "enfisema":
        G.R.xo -= 8; G.L.xo += 8; G.R.yB += 10; G.L.yB += 10; G.R.dome = 10; G.L.dome = 10; G.contenido.push({ t: "hiperinsuflado", lado: "ambos" }); break;
      case "caverna": G.contenido.push({ t: "caverna", lado: sk }); break;
      case "congestion": G.contenido.push({ t: "edema", lado: "ambos" }); break;
      case "pleuritis_aguda": G.contenido.push({ t: "pleura_inflamada", lado: sk }); break;
      case "pleuritis_cronica":
        ps.xo += sgn(sk) * 12; ps.yB -= 14; G.m = -haciaSano * 8; G.contenido.push({ t: "pleura_gruesa", lado: sk }); break;
      case "asma":
        G.R.xo -= 5; G.L.xo += 5; G.R.yB += 6; G.L.yB += 6; G.R.dome = 18; G.L.dome = 18;
        G.contenido.push({ t: "bronquios_estrechos", lado: "ambos" }); break;
      case "bronquiectasia": G.contenido.push({ t: "bronquiectasias", lado: sk }); break;
      case "bronquitis_cronica": case "bronquitis_aguda": G.contenido.push({ t: "bronquios_inflamados", lado: "ambos" }); break;
      case "bronconeumonia": G.contenido.push({ t: "focos", lado: "ambos" }); break;
      default: break;
    }
    return G;
  }

  /* ---------- tipos de percusión: ayuda para el sonido ---------- */
  const PERC_ORDEN = ["claro", "submate", "mate", "timp", "hiper"];

  /* ---------- ruidos agregados y soplos ----------
     capas: receta de síntesis (la interpreta app.js con Web Audio). anim: dibujo del mecanismo. */
  const RUIDOS = [
    { id: "mv", n: "Murmullo vesicular", grupo: "Ruido normal", ono: "Aspirar suave con los labios como para decir «F»", fase: "Toda la inspiración y solo el inicio de la espiración",
      tos: "—", donde: "Todo el pulmón; máximo en bases, cara anterosuperior y regiones interescapulares",
      mec: "El aire pasa de los bronquios finos a los sacos alveolares y vuelve, alternadamente, con la inspiración y la espiración.",
      enf: ["Normal. Disminuye en enfisema, obesidad, neumonía, atelectasia, derrame y neumotórax"], capas: [{ k: "mv", n: "nor" }], anim: "vesicular" },
    { id: "bronquial", n: "Respiración bronquial", grupo: "Ruido normal", ono: "Soplo hueco, más intenso y agudo que el murmullo", fase: "Inspiración y espiración",
      tos: "—", donde: "Normal solo sobre laringe y tráquea (sonido laringotraqueal)",
      mec: "El aire pasa de conductos estrechos (glotis) a otros más amplios (laringe, tráquea, bronquios). Oírla en otra zona ya es patológico.",
      enf: ["Normal en tráquea; fuera de ella anuncia un soplo glótico"], capas: [{ k: "tubarico", suave: true }], anim: "tubo" },
    { id: "tubarico", n: "Soplo tubárico (glótico patológico)", grupo: "Soplo", ono: "Como soplar a través de un tubo", fase: "Inspiración y espiración",
      tos: "—", donde: "Sobre la condensación, donde debería haber murmullo vesicular",
      mec: "Una condensación superficial y extensa con el árbol bronquial permeable transmite el ruido glótico hasta la pared.",
      enf: ["Neumonía (siempre acompañado de crepitantes)"], capas: [{ k: "tubarico" }], anim: "tubo" },
    { id: "cavitario", n: "Soplo cavitario", grupo: "Soplo", ono: "Soplo más grave que el tubárico", fase: "Inspiración y espiración",
      tos: "—", donde: "Sobre la caverna",
      mec: "El ruido glótico se modifica al pasar por una cavidad sin líquido, de paredes gruesas, comunicada con un bronquio permeable.",
      enf: ["Caverna tuberculosa", "Absceso pulmonar"], capas: [{ k: "cavitario" }], anim: "caja" },
    { id: "anforico", n: "Soplo anfórico", grupo: "Soplo", ono: "Como soplar dentro de una garrafa vacía", fase: "Inspiración y espiración",
      tos: "—", donde: "Hemitórax con neumotórax",
      mec: "Variante del cavitario: la cavidad es más amplia y actúa como caja de resonancia.",
      enf: ["Neumotórax con fístula broncopleural abierta"], capas: [{ k: "anforico" }], anim: "caja" },
    { id: "pleuritico", n: "Soplo pleurítico", grupo: "Soplo", ono: "Parecido a pronunciar la letra «E»", fase: "Mejor en la inspiración",
      tos: "—", donde: "Parte alta del derrame; mejor debajo de la axila",
      mec: "Soplo glótico auscultado a través de una capa de líquido.",
      enf: ["Derrame pleural"], capas: [{ k: "pleuritico" }], anim: "liquido" },
    { id: "crepitantes", n: "Estertores crepitantes (finos)", grupo: "Estertor húmedo", ono: "Frotar un mechón de cabello junto al oído; sal fina sobre brasas; pisar nieve", fase: "Final de la inspiración",
      tos: "NO cambian con la tos", donde: "Sobre todo en las bases (gravedad)",
      mec: "Origen alveolar: se despegan los sacos alveolares que la trasudación o el exudado mantenían adosados entre sí. No es una secreción que la tos pueda mover.",
      enf: ["Neumonía", "Edema agudo de pulmón", "Congestión por insuficiencia cardiaca izquierda", "Fibrosis pulmonar"], capas: [{ k: "mv", n: "nor" }, { k: "crepitantes" }], anim: "crepitantes" },
    { id: "subcrepitantes", n: "Estertores subcrepitantes (gruesos)", grupo: "Estertor húmedo", ono: "Burbujeo del agua gaseosa", fase: "Ambos tiempos",
      tos: "SÍ cambian con la tos", donde: "Bronquios y bronquiolos",
      mec: "Secreciones acumuladas en los bronquiolos: el aire las burbujea al pasar. Al toser se movilizan y el ruido cambia.",
      enf: ["Bronconeumonía", "Bronquitis aguda y crónica", "Bronquiectasias", "Tuberculosis pulmonar"], capas: [{ k: "mv", n: "nor" }, { k: "subcrepitantes" }], anim: "burbujas" },
    { id: "roncus", n: "Roncus", grupo: "Estertor seco", ono: "Ronquido: sonido grave", fase: "Ambos tiempos",
      tos: "SÍ cambian (disminuyen o desaparecen)", donde: "Bronquios gruesos",
      mec: "Vibración de las paredes de un bronquio grueso estrechado por espasmo, edema o secreción adherida.",
      enf: ["Bronquitis aguda y crónica", "Bronconeumonía", "Bronquiectasias", "Asma y enfisema"], capas: [{ k: "mv", n: "nor" }, { k: "roncus" }], anim: "roncus" },
    { id: "sibilancias", n: "Sibilancias", grupo: "Estertor seco", ono: "Silbido o piar de ave (piantes): sonido agudo", fase: "Ambos tiempos, más intensas en la espiración",
      tos: "NO cambian con la tos", donde: "Bronquios pequeños y bronquiolos terminales",
      mec: "El aire, al salir por una vía estrechada de pequeño calibre, silba: la resistencia a la salida es mayor en la espiración. Localizadas en una sola región sugieren obstrucción focal (cuerpo extraño, neoplasia).",
      enf: ["Asma bronquial (signo cardinal)", "Asma cardiaco (insuficiencia cardiaca izquierda)", "Enfisema"], capas: [{ k: "mv", n: "dis_esp" }, { k: "sibilancias" }], anim: "sibilancia" },
    { id: "estridor", n: "Estridor", grupo: "Estertor seco", ono: "Ronquido intenso, audible sin estetoscopio", fase: "Sobre todo inspiratorio",
      tos: "—", donde: "Laringe, tráquea o bronquios gruesos",
      mec: "Obstrucción de la vía aérea alta: el aire pasa turbulento por una luz muy estrecha.",
      enf: ["Obstrucción de la vía aérea alta"], capas: [{ k: "estridor" }], anim: "sibilancia" },
    { id: "frote", n: "Frote pleural", grupo: "Pleural", ono: "Frotar cuero nuevo o madera seca", fase: "Ambos tiempos",
      tos: "NO cambia con la tos; aumenta al presionar el estetoscopio", donde: "Regiones axilares inferiores (el pulmón se mueve más)",
      mec: "Pleuritis: las dos hojas pleurales inflamadas, ásperas por el exudado, rozan entre sí y el deslizamiento silencioso se vuelve audible.",
      enf: ["Pleuritis aguda"], capas: [{ k: "mv", n: "nor" }, { k: "frote" }], anim: "frote" }
  ];

  /* ---------- números aleatorios con semilla ---------- */
  function rng(seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  function mezclar(r, a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const POOL = ORDEN.filter(k => S[k].enPrueba !== false);

  /* Caso para «examina y diagnostica» */
  function crearCaso(r) {
    const id = pick(r, POOL), s = S[id];
    return {
      id, lado: s.bilateral ? "ambos" : pick(r, ["D", "I"]),
      fistula: id === "neumotorax" && r() < 0.35, tension: id === "neumotorax" && r() < 0.4
    };
  }
  const ladoEf = c => (c.lado === "ambos" ? "D" : c.lado);

  /* Las 4 pistas escritas de un síndrome (para la pregunta rápida) */
  function pistas(id) {
    const s = S[id], t = s.tabla;
    const l = [["Inspección", t.insp], ["Palpación", t.palp], ["Percusión", t.perc], ["Auscultación", t.aus]];
    if (s.med.dir !== "ninguno" || id === "neumotorax") l.push(["Mediastino (Rx)", t.med]);
    return l;
  }
  function firma(id) { return pistas(id).map(p => p[1]).join("|"); }

  function preguntaRapida(r) {
    const id = pick(r, POOL.filter(k => k !== "normal"));
    const otros = mezclar(r, POOL.filter(k => k !== id && k !== "normal" && firma(k) !== firma(id))).slice(0, 4);
    return { id, pistas: pistas(id), opciones: mezclar(r, [id].concat(otros)) };
  }
  function preguntaRuido(r) {
    const q = pick(r, RUIDOS);
    const otros = mezclar(r, RUIDOS.filter(x => x.id !== q.id)).slice(0, 3);
    return { id: q.id, opciones: mezclar(r, [q.id].concat(otros.map(x => x.id))) };
  }

  const api = { FILAS, VV, PERC, MV, ADV, VOZ, S, ORDEN, POOL, RUIDOS, PERC_ORDEN, hallazgo, geom, rng, pick, mezclar, crearCaso, ladoEf, pistas, firma, preguntaRapida, preguntaRuido, percNormal };
  root.PULMON = api;
  if (typeof module !== "undefined") module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
