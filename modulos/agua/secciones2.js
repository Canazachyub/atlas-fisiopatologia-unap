/* Agua, sodio y potasio — pestañas «Explicación» y «Ponte a prueba» (casos con ionograma generado). */
(function () {
  "use strict";
  const U = window.UTIL, A = U.A, f = U.f, $ = U.$, $$ = U.$$, LIT = U.LIT;
  const SECC = window.SECC;

  /* =====================================================================
     PESTAÑA 4 · EXPLICACIÓN
     ===================================================================== */
  SECC.explicacion = function (cont) {
    cont.innerHTML = `
    <h1>💡 Explicación</h1>
    <p class="lema">Tres ideas que lo explican todo: (1) el agua <b>sigue a las partículas</b>; (2) el <b>sodio</b> manda fuera de la célula y el <b>potasio</b> dentro; (3) una cifra de laboratorio es una <b>concentración</b>, no una cantidad.</p>
    <div class="grid3">
      <div class="tarj"><b class="t">¿Qué es?</b>El cuerpo es 60 % agua. Esa agua tiene dos pisos: 60 % dentro de las células (intracelular) y 40 % fuera (extracelular: plasma + intersticial). Existe además un «tercer espacio» patológico (ascitis, derrame pleural o pericárdico, peritonitis) donde el líquido queda atrapado.</div>
      <div class="tarj ve"><b class="t">¿Cómo funciona?</b>La membrana celular deja pasar el agua libremente, así que el agua cruza hasta igualar la osmolaridad de ambos lados (≈ 280-310 mOsm/L). Fuera de la célula, la osmolaridad la fija el sodio: <mark>Na × 2 + 10</mark>. Si el Na de afuera baja, el agua entra a la célula; si sube, la célula pierde agua. El K⁺ vive dentro porque la bomba Na⁺/K⁺-ATPasa lo mete y expulsa Na⁺.</div>
      <div class="tarj ro"><b class="t">¿Por qué importa?</b>Porque la <b>célula que más sufre es la neurona</b>: hinchada (hiponatremia, edema cerebral) o arrugada (hipernatremia) da convulsiones y coma; y corregir demasiado rápido la daña (desmielinización osmótica, edema cerebral). El K⁺ manda sobre el ritmo del corazón: la hiperpotasemia mata por arritmia.</div>
      <div class="tarj mo"><b class="t">¿Para qué sirve saberlo?</b>Para decidir qué suero poner y cómo de rápido: <b>suero 0,9 %</b> se queda fuera de la célula y repone volumen; el <b>agua libre / dextrosa 5 %</b> reparte entre los dos pisos; el <b>ClK</b> nunca va rápido ni sin diuresis; la hiperpotasemia con ECG alterado empieza con <b>calcio</b>.</div>
    </div>
    <div class="caja"><h2 style="margin-top:0">Tabla para memorizar</h2><div class="tw"><table>
      <tr><th></th><th>Na sérico</th><th>Osm</th><th>Agua se mueve…</th><th>Célula</th><th>Clínica guía</th></tr>
      <tr><td><b>Isotónica</b> (70-90 %)</td><td>135-145</td><td>280-310</td><td>no hay gradiente</td><td>igual</td><td>colapso, oliguria, mucosas secas</td></tr>
      <tr><td><b>Hipotónica</b> (8-10 %, la más grave)</td><td>&lt; 130</td><td>&lt; 280</td><td>al intracelular</td><td>se hincha</td><td>convulsiones, coma, sin sed</td></tr>
      <tr><td><b>Hipertónica</b> (2-10 %)</td><td>&gt; 150</td><td>&gt; 310</td><td>fuera de la célula</td><td>se arruga</td><td>sed intensa, irritabilidad, coma</td></tr>
      <tr><td><b>Hiperhidratación</b></td><td>&lt; 135</td><td>baja</td><td>a todos los pisos</td><td>se hincha</td><td>edema, estertores, yugulares, Hto bajo</td></tr></table></div>
      <p class="nota">Fíjate en el hematocrito: <b>sube</b> en la deshidratación (45 → 50 → 60 % según grado) y <b>baja</b> en la hiperhidratación.</p></div>
    <div class="caja"><h2 style="margin-top:0">Cómo se razona un caso (pasos)</h2><ol class="pasos" id="pz">
      <li><b>¿Qué volumen hay?</b> Peso, FC, PA postural, mucosas, ojos, diuresis, hematocrito → grado (2,5-5 / 5-10 / &gt; 10 %) o exceso (edema, yugulares).</li>
      <li><b>¿Cómo está el sodio?</b> Define el tipo y hacia dónde se mueve el agua: Na normal = isotónica; bajo = hipotónica; alto = hipertónica.</li>
      <li><b>¿Y la glucosa?</b> Cada 100 mg/dL sobre lo normal baja ≈ 1,6 el Na medido: corrige antes de rotular.</li>
      <li><b>¿Y el potasio?</b> ¿Hay pérdida del cuerpo o solo movimiento (acidosis, alcalosis, insulina, β2)? ¿Hay diuresis? ¿Cambios en el ECG?</li>
      <li><b>¿Cómo reponer?</b> Gravedad y tipo deciden vía y suero; el déficit de agua o de Na se calcula con las fórmulas; la corrección es <b>lenta</b>.</li></ol></div>
    <div class="caja"><h2 style="margin-top:0">Fórmulas de la clase</h2><div class="grid3">
      <div class="tarj"><b class="t">Osmolaridad</b>Na × 2 + 10 (Na 140 → 290). Con glucosa y BUN: 2 Na + glu/18 + BUN/2,8.</div>
      <div class="tarj"><b class="t">Déficit de agua</b>ACT = 0,6 × peso; ACA = Na normal × ACT / Na hallado; déficit = ACT − ACA.</div>
      <div class="tarj"><b class="t">Déficit de sodio</b>(Na normal − Na hallado) × 0,6 × peso. Mitad en 6 h si hay síntomas neurológicos.</div>
      <div class="tarj"><b class="t">Balance</b>Insensibles = peso × 12; endógena ≈ PI/3; diuresis mínima 600 ml/24 h; agua ≈ 30 ml/kg/día.</div>
      <div class="tarj"><b class="t">Pérdidas extra</b>+150-300 ml por °C de fiebre; 100-200 ml por cada 5 respiraciones sobre 20; ≈ 200 ml por °C de calor ambiental.</div>
      <div class="tarj"><b class="t">Ampollas</b>ClNa 20 %: 73 mEq de Na por 21 ml · ClK: 68 mEq por 20 ml (siempre diluido y lento) · SS 0,9 %: 154 mEq/L.</div></div></div>
    <div class="caja"><h2 style="margin-top:0">Potasio en una frase</h2>
      <p>Es el catión intracelular (98 %); el plasma tiene solo 3,5-5,0. Entra a la célula con <b>insulina, β2, T3/T4 y alcalosis</b> (→ hipopotasemia) y sale con la <b>acidosis</b> (→ hiperpotasemia). Se elimina por el <b>riñón</b> (aldosterona: reabsorbe Na⁺ y excreta K⁺), por eso la insuficiencia renal es la causa más común de hiperpotasemia. Su huella en el ECG está en el <a href="../ecg/#electrolitos">simulador ECG</a>.</p></div>`;
    const ps = $$("#pz li", cont); ps.forEach((li, i) => li.onclick = () => ps.forEach((x, q) => x.classList.toggle("act", q === i)));
  };

  /* =====================================================================
     PESTAÑA 5 · PONTE A PRUEBA
     ===================================================================== */
  const R = { Na: [135, 145], K: [3.5, 5.0], Cl: [97, 105], HCO3: [24, 26] };   // rangos de la tabla de la clase 4
  const DX = {
    iso: "Deshidratación isotónica", hipo: "Deshidratación hipotónica (hiponatremia)", hiper: "Deshidratación hipertónica (hipernatremia)",
    hh: "Hiperhidratación (intoxicación hídrica)", hipoK: "Hipopotasemia", hiperK: "Hiperpotasemia", gluc: "Hiponatremia por redistribución (hiperglucemia)"
  };
  const ri = (a, b) => U.entero(a, b), rf = (a, b, d) => +U.azar(a, b).toFixed(d == null ? 1 : d);
  const opciones = (ok, mal) => { const o = [{ t: ok, ok: true }].concat(mal.map(t => ({ t: t, ok: false }))); return U.barajar(o); };
  const L = x => f(x, 1);

  /* cada generador devuelve: titulo, hist, signos, lab, dx, comp{q,opts,expl}, cond{q,opts,expl}, calc? {q,opts,expl}, resumen */
  const CASOS = [
    /* 1 · isotónica por vómito y diarrea (moderada o grave) */
    function () {
      const peso = ri(50, 80), grave = Math.random() < 0.4, pct = grave ? rf(11, 14) : rf(6, 9);
      const gr = A.grado(pct), na = ri(136, 143), k = rf(3.0, 3.8), cl = ri(98, 104), hc = ri(16, 21);
      const mlkg = gr.mlkg, tolera = !grave;
      return {
        titulo: "Gastroenteritis", dx: "iso",
        hist: `Varón de ${ri(20, 45)} años, ${peso} kg, con vómitos y diarreas profusas desde hace ${ri(2, 4)} días. ${grave ? "Llega postrado, irritable, con extremidades frías y casi sin orinar." : "Tiene sed intensa, está agitado, orina poco (< 400 ml/24 h) y tolera sorbos de líquido."}`,
        signos: `FC ${grave ? 130 : 120} lat/min · PA ${grave ? "80/50 mmHg en decúbito" : "110/70 echado y 90/50 de pie"} · mucosas ${grave ? "muy secas" : "secas"} · ojos ${grave ? "muy hundidos" : "hundidos"} · pérdida de peso estimada ${f(pct, 1)} %`,
        lab: { Na: na, K: k, Cl: cl, HCO3: hc, Hto: grave ? ri(58, 62) : ri(49, 52) },
        comp: { q: "¿Qué compartimento está afectado y por qué?",
          opts: opciones("El extracelular: pierde agua y sodio en igual proporción, no hay gradiente y la célula no cambia",
            ["El intracelular: el agua entra a la célula y la hincha", "El intracelular: el agua sale de la célula y la arruga", "Ambos pisos aumentan de volumen (hemodilución)"]),
          expl: "Vómitos y diarrea pierden agua y electrolitos <b>en igual proporción</b> (clase 5): el Na sérico es normal, la osmolaridad también y por eso no se forma gradiente osmótico. Se contrae el extracelular (hematocrito alto, hipotensión) y la célula queda igual." },
        cond: { q: "¿Cuál es la conducta según la clase?",
          opts: opciones(grave ? "Vía endovenosa en tres fases: expansión con suero fisiológico, mantenimiento (100 ml/kg a 50 ml/kg/h) y reposición de pérdidas" : "Reposición de agua y electrolitos (Na, K, Cl) por vía oral con líquidos isotónicos, porque tolera",
            [grave ? "Solo vía oral con agua y reevaluar mañana" : "Vía endovenosa inmediata en tres fases porque es grado 3", "Dextrosa al 5 % pura en cantidad suficiente", "Restricción de líquidos (~800 ml/24 h) y furosemida"]),
          expl: grave ? "Más de 10 % de pérdida es 3er grado (grave) con compromiso neurológico: la clase manda la <b>vía parenteral</b> en tres fases (reparación/expansión con suero fisiológico, mantenimiento y reposición de pérdidas continuadas con glucosa 5 % + suero)." : "Con 5-10 % (2do grado) y tolerancia digestiva la clase indica la <b>vía oral</b>; la parenteral queda para el grado grave." },
        calc: { q: `¿Qué déficit de agua estima la tabla de la clase para este grado (${gr.t}) en ${peso} kg?`,
          opts: opciones(`${L(mlkg[0] * peso / 1000)} a ${L(mlkg[1] * peso / 1000)} L (${mlkg[0]}-${mlkg[1]} ml/kg)`,
            [grave ? `${L(50 * peso / 1000)} a ${L(100 * peso / 1000)} L (50-100 ml/kg)` : `${L(100 * peso / 1000)} a ${L(150 * peso / 1000)} L (más de 100 ml/kg)`, `${L(25 * peso / 1000)} a ${L(50 * peso / 1000)} L (25-50 ml/kg)`, `${L(10 * peso / 1000)} L (10 ml/kg)`]),
          expl: `Grado y déficit: 1er grado 25-50 ml/kg, 2do 50-100, 3er &gt; 100. Con ${f(pct, 1)} % de pérdida el grado es <b>${gr.t}</b>: ${mlkg[0]}-${mlkg[1]} ml/kg × ${peso} kg.` },
        resumen: `Na normal + hematocrito alto + hipotensión postural = isotónica, extracelular. El grado sale del % de peso perdido.`
      };
    },
    /* 2 · hipertónica (diabetes insípida / pérdidas de agua libre) */
    function () {
      const peso = ri(50, 85), na = ri(152, 168), k = rf(3.8, 4.6), cl = ri(110, 122), hc = ri(24, 27), nn = 145;
      const d = A.deficitAgua(peso, na, nn);
      const dd = d.deficit;
      return {
        titulo: "Sed intensa y poliuria", dx: "hiper",
        hist: `Mujer de ${ri(25, 60)} años, ${peso} kg, con diabetes insípida central. Hace 2 días dejó su tratamiento; orina mucho, tiene sed intensa, fiebre alta, cefalea e irritabilidad. Hoy está somnolienta.`,
        signos: `Mucosas secas · piel con pliegue lento · temperatura 38,6 °C · diuresis aumentada de orina muy diluida`,
        lab: { Na: na, K: k, Cl: cl, HCO3: hc },
        comp: { q: "¿Hacia dónde se mueve el agua y qué le pasa a la célula?",
          opts: opciones("Sale de la célula hacia el extracelular: la célula se arruga (deshidratación intracelular)",
            ["Entra a la célula: se hincha y hay riesgo de edema cerebral", "No se mueve: la osmolaridad es igual en los dos pisos", "Sale del plasma hacia el tercer espacio"]),
          expl: "Se pierde más agua que sodio: sube la osmolaridad (&gt; 310), el agua sale de la célula para igualar y aparece <b>deshidratación intracelular</b>; de ahí sed intensa, irritabilidad, cefalea, convulsiones y coma (SNC)." },
        cond: { q: "¿Cómo se repone?",
          opts: opciones("Déficit de agua libre con dextrosa 5 %: la mitad en 24 h y el resto en 48 h, lento y controlado",
            ["Suero hipertónico 3 % para subir el volumen rápidamente", "Dextrosa 5 % en bolo para normalizar el Na en 2 horas", "Suero fisiológico en bolo y restricción de agua"]),
          expl: "La clase 6 repone el déficit de agua libre con <b>dextrosa al 5 %</b>, mitad en 24 h y el resto en 48 h. La corrección brusca causa <b>edema cerebral</b> (agua entrando a una neurona hiperosmolar)." },
        calc: { q: `¿Cuál es el déficit de agua libre? (peso ${peso} kg, Na hallado ${na}, Na normal 145)`,
          opts: opciones(`${L(dd)} L`, [`${L(dd * 2)} L`, `${L(dd / 2)} L`, `${L(d.act)} L (el agua corporal total)`]),
          expl: `ACT = 0,6 × ${peso} = <b>${L(d.act)} L</b>. ACA = 145 × ${L(d.act)} / ${na} = <b>${L(d.aca)} L</b>. Déficit = ${L(d.act)} − ${L(d.aca)} = <b>${L(dd)} L</b>. Se da ${L(dd / 2)} L en las primeras 24 h.` },
        resumen: "Na alto + sed intensa + irritabilidad = hipertónica: agua libre, lento."
      };
    },
    /* 3 · hipotónica */
    function () {
      const peso = ri(50, 80), na = ri(116, 128), k = rf(4.6, 5.6), cl = ri(84, 92), hc = ri(18, 22), nn = 145;
      const dna = A.deficitNa(peso, na, nn);
      return {
        titulo: "Convulsión tras la diarrea", dx: "hipo",
        hist: `Mujer de ${ri(30, 70)} años, ${peso} kg, en tratamiento con diuréticos, con vómitos y diarrea por cólera; durante 3 días solo tomó agua. Hoy está agitada, tuvo una convulsión y no tiene sed. Tiene debilidad y calambres previos.`,
        signos: `Mucosas húmedas · hipotensión y taquicardia · oliguria`,
        lab: { Na: na, K: k, Cl: cl, HCO3: hc, Hto: ri(52, 56) },
        comp: { q: "¿Qué ocurre con el agua y qué órgano sufre?",
          opts: opciones("El agua pasa al intracelular: la célula se hincha y el cerebro se edematiza",
            ["El agua sale de la célula: la neurona se arruga", "El agua queda en el tercer espacio y no hay efecto celular", "No hay gradiente: el cuadro es solo hipovolemia"]),
          expl: "Se pierde Na en exceso respecto al agua: cae la osmolaridad (&lt; 280) y se crea un <b>gradiente inverso</b> que manda agua al intracelular. El <b>edema cerebral</b> explica agitación, convulsiones y coma; es la forma más grave." },
        cond: { q: "¿Qué conducta es la correcta?",
          opts: opciones("Reponer sodio con suero fisiológico (154 mEq/L): con síntomas neurológicos la mitad del déficit en las primeras 6 h, corrigiendo con cuidado",
            ["Dextrosa al 5 % abundante para reponer el volumen", "Restringir sodio y dar furosemida", "Corregir el Na lo más rápido posible hasta 140 en 2 horas"]),
          expl: "La reposición es con <b>suero fisiológico</b> (en pérdidas severas, plasma). Con síntomas neurológicos se repone la mitad del déficit calculado en 6 h; una corrección demasiado rápida produce <b>desmielinización osmótica pontina</b>." },
        calc: { q: `¿Cuál es el déficit de sodio? (peso ${peso} kg, Na ${na}, Na normal 145)`,
          opts: opciones(`${f(dna, 0)} mEq`, [`${f(dna / 2, 0)} mEq`, `${f((145 - na) * peso, 0)} mEq`, `${f(dna * 2, 0)} mEq`]),
          expl: `Déficit de Na = (Na normal − Na hallado) × 0,6 × peso = (145 − ${na}) × 0,6 × ${peso} = <b>${f(dna, 0)} mEq</b>. Con síntomas neurológicos se repone la mitad (${f(dna / 2, 0)} mEq) en 6 h. (La clase usa (145 − 125) × 0,6 × 60 = 720 mEq.)` },
        resumen: "Na bajo + sin sed + signos neurológicos = hipotónica, la más grave: sodio, y despacio."
      };
    },
    /* 4 · hiperhidratación */
    function () {
      const peso = ri(55, 80), na = ri(124, 131), k = rf(5.2, 6.0), hc = ri(18, 21);
      return {
        titulo: "Posoperatorio con sueros de más", dx: "hh",
        hist: `Varón de ${ri(45, 75)} años, ${peso} kg, con insuficiencia renal aguda oligúrica (< 400 ml/24 h). Recibió ${ri(4, 6)} L de suero endovenoso en 24 h. Ahora tiene la cara hinchada, disnea y está desorientado.`,
        signos: `Estertores en ambas bases · ingurgitación yugular · ritmo de galope · PVC 22 cm H₂O · densidad de orina baja`,
        lab: { Na: na, K: k, Cl: ri(88, 96), HCO3: hc, Hto: ri(28, 33) },
        comp: { q: "¿Qué ha ocurrido en los compartimentos?",
          opts: opciones("Aumento del agua corporal (hemodilución): se hinchan el extracelular y las células, con edema y riesgo de edema agudo de pulmón",
            ["El extracelular está contraído y el hematocrito alto", "Solo el intracelular pierde agua", "Solo hay un desplazamiento del potasio"]),
          expl: "Hay <b>exceso de agua</b> por aporte excesivo y riñón que no la elimina: el Na baja por dilución, el hematocrito disminuye (hemodilución) y aparecen edema, derrame, estertores y yugulares. El volumen sobrecarga el ventrículo izquierdo." },
        cond: { q: "¿Cuál es el tratamiento?",
          opts: opciones("Tratar la causa, restricción estricta de líquidos (~800 ml/24 h) y diurético de asa parenteral (furosemida)",
            ["Más suero fisiológico para diluir la urea", "Suero salino hipertónico en bolo", "Dextrosa 5 % para mantener la diuresis"]),
          expl: "La clase indica: tratar la causa subyacente, <b>restricción estricta</b> (≈ 800 ml/24 h) y <b>diuréticos de asa</b> por vía parenteral. El dato que lo distingue de la deshidratación es el hematocrito: bajo aquí, alto allá." },
        resumen: "Hto bajo + Na bajo + yugulares y estertores = hiperhidratación: restringir y furosemida."
      };
    },
    /* 5 · hiperpotasemia */
    function () {
      const grave = Math.random() < 0.6, k = grave ? rf(7.0, 8.9) : rf(5.6, 6.3), hc = ri(11, 16), peso = ri(55, 80);
      return {
        titulo: "Insuficiencia renal y debilidad", dx: "hiperK",
        hist: `Varón de ${ri(40, 75)} años, ${peso} kg, con insuficiencia renal ${grave ? "aguda con anuria" : "crónica con oliguria"}, que acude con ${grave ? "debilidad generalizada, parestesias y palpitaciones" : "náuseas y leve debilidad"}. Toma suplementos de potasio.`,
        signos: grave ? "ECG: onda P aplanada y QRS ensanchado" : "ECG: sin alteraciones",
        lab: { Na: ri(134, 140), K: k, Cl: ri(100, 108), HCO3: hc, "Urea/creat.": "elevadas" },
        comp: { q: "¿Por qué sube el potasio plasmático?",
          opts: opciones("El riñón no lo elimina (aldosterona/túbulo no funcionan) y la acidosis saca K⁺ de la célula a cambio de H⁺",
            ["Entra K⁺ a la célula por la insulina y la alcalosis", "El K⁺ se pierde por diarrea y queda en el plasma", "El agua sale de la célula y concentra el potasio solamente"]),
          expl: "La causa más común es la <b>eliminación renal reducida</b> (IRA/IRC, oliguria, anuria). Se suma la acidosis (HCO₃ bajo): los H⁺ entran a la célula y sacan K⁺ (desplazamiento LIC → LEC)." },
        cond: { q: "¿Cuál es la conducta según la clase?",
          opts: opciones(grave ? "Gluconato de calcio 10 % IV de inmediato, luego insulina + glucosa y bicarbonato, y eliminar K⁺ (asa, resinas, diálisis)" : "Suspender el aporte de K⁺, corregir la acidosis y usar un diurético de asa",
            [grave ? "Solo suspender el aporte y dar furosemida" : "Gluconato de calcio, insulina y diálisis urgente por ser K &gt; 8", "Administrar más ClK diluido", "Dar espironolactona para eliminar K⁺"]),
          expl: grave ? "Con ECG alterado (P aplanada, QRS ancho): primero <b>antagonizar la toxicidad cardiaca</b> (calcio, en minutos), luego <b>desplazar K⁺ al LIC</b> (insulina + glucosa, bicarbonato) y por último <b>eliminarlo</b> (asa, resinas, diálisis, definitiva en insuficiencia renal)." : "Leve (&lt; 6,5, ECG normal): suspender el aporte, corregir la acidosis y diuréticos de asa. El calcio, insulina y diálisis son para la forma grave con alteraciones del ECG." },
        resumen: "Riñón que no elimina + acidosis = K alto. ECG alterado: calcio primero."
      };
    },
    /* 6 · hipopotasemia */
    function () {
      const sev = Math.random() < 0.5, k = sev ? rf(2.0, 2.4) : rf(2.8, 3.3), peso = ri(55, 80);
      return {
        titulo: "Diurético, vómitos y debilidad", dx: "hipoK",
        hist: `Mujer de ${ri(40, 75)} años, ${peso} kg, en tratamiento con furosemida, con vómitos repetidos. Refiere debilidad en las piernas, ${sev ? "distensión abdominal sin ruidos y palpitaciones" : "calambres y cansancio"}.`,
        signos: `Reflejos osteotendinosos ${sev ? "ausentes (arreflexia)" : "disminuidos"} · ECG: ${sev ? "T aplanada, onda U y extrasístoles" : "T aplanada"}`,
        lab: { Na: ri(134, 140), K: k, Cl: ri(84, 92), HCO3: ri(30, 34) },
        comp: { q: "¿Qué mecanismos explican el potasio bajo?",
          opts: opciones("Pérdida renal y digestiva de K⁺ (diurético, vómitos) más desplazamiento al interior de la célula por la alcalosis metabólica",
            ["Acidosis que saca K⁺ de la célula", "Exceso de aporte oral de potasio", "Insuficiencia renal que retiene potasio"]),
          expl: "Furosemida (pérdida renal), vómitos (pérdida digestiva y alcalosis hipoclorémica) y la <b>alcalosis</b> (K⁺ entra a la célula a cambio de H⁺) bajan el K plasmático. La alcalosis metabólica acompaña a la nefropatía hipopotasémica." },
        cond: { q: "¿Qué conducta es la correcta?",
          opts: opciones(sev ? "Reposición parenteral diluida (máx. 150 mEq/24 h), lenta, comprobando que hay diuresis" : "Reposición oral: alimentos ricos en K⁺ (banana 20-22 mEq, naranja 8-10 mEq) o suplemento de KCl",
            [sev ? "Una ampolla de ClK en bolo para corregir ya" : "Gluconato de calcio e insulina con glucosa", "Restringir el potasio de la dieta", "Dar más furosemida para rehidratar"]),
          expl: (sev ? "Con K &lt; 2,5 y síntomas graves la vía es <b>parenteral</b>: siempre diluido, máximo 150 mEq/24 h y velocidad controlada (40-60 mEq en 1 h en dextrosa 5 %). Un bolo puede producir hiperpotasemia con fibrilación ventricular o asistolia." : "En hipopotasemia moderada la clase indica <b>vía oral</b>.") + " Nunca dar potasio si hay anuria. Para prevenir con diuréticos de asa: espironolactona, amilorida o triamtereno." },
        resumen: "Diurético + vómitos + alcalosis = K bajo: reponer con cuidado, nunca rápido ni sin diuresis."
      };
    },
    /* 7 · hiperglucemia → Na falsamente bajo */
    function () {
      const glu = ri(450, 800), nam = ri(122, 131), k = rf(5.2, 6.0), peso = ri(55, 80), nc = A.naCorregido(nam, glu);
      return {
        titulo: "Diabético con sodio bajo", dx: "gluc",
        hist: `Mujer de ${ri(20, 60)} años, ${peso} kg, con diabetes mellitus, poliuria y sed intensa desde hace días, aliento afrutado y respiración profunda. El laboratorio informa un sodio bajo.`,
        signos: `Mucosas secas · taquicardia`,
        lab: { Na: nam, K: k, Cl: ri(92, 100), HCO3: ri(8, 14), Glucosa: glu },
        comp: { q: "¿Cómo se explica el sodio bajo y dónde está el agua?",
          opts: opciones("La hiperglucemia atrae agua desde la célula al extracelular y diluye el Na (redistribución); no es una pérdida real de sodio",
            ["El agua entra a la célula porque el Na se perdió por la orina solamente", "Hay hiperhidratación por exceso de líquidos", "El sodio bajo es por exceso de insulina"]),
          expl: "La glucosa es osmóticamente activa: arrastra agua del IC al EC y <b>diluye el Na</b>. La clase lo cuantifica: baja ≈ 1,6 mEq/L por cada 100 mg/dL de glucosa. Por eso el K sale (acidosis) y el paciente está además deshidratado por la diuresis osmótica." },
        cond: { q: "¿Qué conducta es la correcta?",
          opts: opciones("Corregir primero la hiperglucemia y reponer volumen; interpretar el Na corregido, sin tratar la «hiponatremia» como verdadera",
            ["Dar sodio hipertónico para subir el Na rápidamente", "Restringir el agua por hiponatremia dilucional", "Dar potasio porque el K es normal-alto"]),
          expl: "Al bajar la glucosa el agua vuelve a la célula y el Na sube solo. Tratar el Na medido como una hiponatremia verdadera llevaría a una sobrecorrección peligrosa." },
        calc: { q: `¿Cuál es el Na corregido por glucosa? (Na ${nam}, glucosa ${glu} mg/dL)`,
          opts: opciones(`${f(nc, 0)} mEq/L`, [`${f(nam + 1.6 * glu / 100, 0)} mEq/L`, `${f(nam - 1.6 * (glu - 100) / 100, 0)} mEq/L`, `${nam} mEq/L (no hay que corregir)`]),
          expl: `Na corregido = ${nam} + 1,6 × (${glu} − 100) / 100 = <b>${f(nc, 0)}</b> mEq/L.` },
        resumen: "Glucosa muy alta: corrige el Na (+1,6 por cada 100 mg/dL) antes de rotular."
      };
    }
  ];

  SECC.prueba = function (cont) {
    let racha = 0, ok = 0, tot = 0, ultimo = -1;
    cont.innerHTML = `<h1>🎯 Ponte a prueba</h1>
      <p class="lema">Cada caso trae un ionograma generado al azar. Contesta en orden: <b>trastorno</b>, <b>compartimento</b>, <b>conducta</b> y, si hay, el <b>cálculo</b>. Corrección inmediata con la explicación según la clase.</p>
      <div class="caja"><div class="letrero" id="pun" style="display:block"></div></div><div id="caso"></div>
      <div class="btns"><button class="btn az" id="sig">Otro caso ➜</button></div>`;
    $("#sig", cont).onclick = nuevo;
    function marcador() { $("#pun", cont).innerHTML = `Aciertos <b>${ok}</b> de <b>${tot}</b> respuestas · racha <b>${racha}</b>`; }
    function nuevo() {
      let i; do { i = Math.floor(Math.random() * CASOS.length); } while (i === ultimo && CASOS.length > 1); ultimo = i;
      const c = CASOS[i](), cc = $("#caso", cont);
      const fila = (n, v, r, u) => { const fuera = r && typeof v === "number" && (v < r[0] || v > r[1]);
        return `<tr><td>${n}</td><td><b class="${fuera ? "mal" : ""}">${typeof v === "number" ? (Number.isInteger(v) ? v : f(v, 1)) : v}${fuera ? (v < r[0] ? " ↓" : " ↑") : ""}</b></td><td class="nota">${r ? r[0] + " - " + r[1] : "—"} ${u || ""}</td></tr>`; };
      const Lb = c.lab;
      cc.innerHTML = `<div class="caja"><h3 style="margin-top:0">${c.titulo}</h3><p>${c.hist}</p><p class="nota">${c.signos}</p>
        <div class="tw"><table style="max-width:520px"><tr><th>Ionograma</th><th>Valor</th><th>Normal (clase)</th></tr>
        ${fila("Na (mEq/L)", Lb.Na, R.Na)}${fila("K (mEq/L)", Lb.K, R.K)}${fila("Cl (mEq/L)", Lb.Cl, R.Cl)}${fila("HCO₃ (mEq/L)", Lb.HCO3, R.HCO3)}
        ${Lb.Glucosa != null ? fila("Glucosa (mg/dL)", Lb.Glucosa, [70, 110]) : ""}${Lb.Hto != null ? fila("Hematocrito (%)", Lb.Hto, [40, 50]) : ""}${Lb["Urea/creat."] ? fila("Urea / creatinina", Lb["Urea/creat."]) : ""}
        ${fila("Osmolaridad (Na × 2 + 10)", A.osmSimple(Lb.Na), A.C.OSM_NORMAL, "mOsm/L")}</table></div>
        <p class="nota">Rangos de la tabla de la clase 4; glucosa y hematocrito ${LIT}.</p></div>
        <div id="preg"></div><div id="fin"></div>`;
      const dxKeys = U.barajar(Object.keys(DX).filter(k => k !== c.dx)).slice(0, 3);
      const dxOpts = U.barajar([{ t: DX[c.dx], ok: true }].concat(dxKeys.map(k => ({ t: DX[k], ok: false }))));
      const pasos = [{ q: "¿Cuál es el trastorno?", opts: dxOpts, expl: `<b>${DX[c.dx]}.</b> ${c.resumen}` }, c.comp, c.cond]; if (c.calc) pasos.push(c.calc);
      let paso = 0, fallos = 0;
      function mostrar() {
        const p = pasos[paso], pg = $("#preg", cc);
        pg.innerHTML = `<div class="caja"><b>${paso + 1}/${pasos.length} · ${p.q}</b><div class="opciones" style="margin-top:8px">${p.opts.map((o, j) => `<button data-j="${j}">${o.t}</button>`).join("")}</div><div id="fb"></div></div>`;
        $$("button", pg).forEach(b => b.onclick = () => {
          if (b.dataset.hecho) return; const o = p.opts[+b.dataset.j]; tot++;
          if (o.ok) { ok++; racha++; } else { racha = 0; fallos++; }
          $$("button", pg).forEach((x, j) => { x.dataset.hecho = 1; if (p.opts[j].ok) x.classList.add("bien"); else if (x === b) x.classList.add("mal"); });
          $("#fb", pg).innerHTML = `<div class="letrero" style="display:block;margin-top:10px"><b>${o.ok ? "Correcto." : "No es esa."}</b> ${p.expl}</div><div class="btns"><button class="btn az" id="nx">${paso + 1 < pasos.length ? "Siguiente pregunta ➜" : "Terminar el caso"}</button></div>`;
          marcador();
          $("#nx", pg).onclick = () => { paso++; if (paso < pasos.length) mostrar(); else { pg.innerHTML = ""; $("#fin", cc).innerHTML = `<div class="caja"><b>Caso terminado: ${pasos.length - fallos} de ${pasos.length} bien.</b> ${c.resumen}</div>`; } };
        });
      }
      mostrar();
    }
    marcador(); nuevo();
  };
})();
