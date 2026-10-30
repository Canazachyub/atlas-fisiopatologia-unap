/* Frank-Starling e IC — pestañas 4, 5 y 6: IC izquierda vs derecha (maniquí), explicación y Ponte a prueba. */
(function () {
  "use strict";
  const B = window.BOMBA, K = B.K, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$, f0 = U.f0;

  /* =====================================================================
     PESTAÑA 4 · IC izquierda vs derecha en un maniquí
     ===================================================================== */
  // Signos: pin = posición en el maniquí (viewBox 300x540); fuente = clase de la que sale el dato
  const SIGNOS = {
    disnea: { t: "Disnea", pin: [128, 160], q: "Disnea de esfuerzo → pequeños esfuerzos → reposo", m: "El VI falla, sube la presión en la aurícula izquierda y en el capilar pulmonar; el líquido pasa al intersticio y al alvéolo: edema pulmonar e hipoxemia. Es el primer síntoma (clases 16 y 17)." },
    ortopnea: { t: "Ortopnea y DPN", pin: [172, 130], q: "Dificultad al acostarse y disnea paroxística nocturna", m: "En decúbito aumenta el retorno venoso desde los miembros inferiores y se agrava la congestión pulmonar (clase 16). Por eso duerme con varias almohadas." },
    crep: { t: "Estertores crepitantes", pin: [112, 198], q: "Crepitantes en las bases pulmonares", m: "Aire que abre alvéolos con líquido: «pisar nieve». En la ICI aparecen en las bases (clase 16); en el EAP suben como «marea montante» (clase 41)." },
    asma: { t: "Asma cardiaca", pin: [190, 160], q: "Disnea con sibilancias", m: "Edema de la mucosa bronquiolar, hipersecreción y broncoespasmo por la congestión; no es asma bronquial (clases 16, 17 y 41)." },
    tos: { t: "Tos nocturna", pin: [150, 118], q: "Tos seca, peor de noche", m: "El decúbito aumenta el retorno venoso y la congestión. En el EAP la expectoración es espumosa y rosada (hemoptoica)." },
    s3: { t: "Ritmo de galope (S3)", pin: [170, 238], q: "Tercer ruido: ritmo de galope", m: "Es el signo auscultatorio de mayor valor en la IC (clases 16 y 17); indica sobredilatación ventricular por presión de llenado alta (clase 41)." },
    fatiga: { t: "Fatiga y confusión", pin: [208, 62], q: "Fatiga, intolerancia al esfuerzo; confusión en fases avanzadas", m: "Forma anterógrada: el gasto no alcanza a la musculatura periférica ni al cerebro (clase 16)." },
    oliguria: { t: "Nicturia y oliguria", pin: [150, 345], q: "Nicturia (precoz) y oliguria (< 400 mL/día)", m: "Nicturia: en decúbito se reabsorbe el edema acumulado en el día. Oliguria: bajo gasto, hipotensión y vasoconstricción por el SRAA (clase 17)." },
    pulso: { t: "Pulso alternante y PA convergente", pin: [58, 250], q: "Pulso alternante; PA convergente (ej. 100/80)", m: "Latidos fuertes y débiles alternados: grave compromiso del VI. PA convergente: baja la sistólica (menos fuerza) y sube la diastólica (vasoconstricción adrenérgica) (clase 17)." },
    frio: { t: "Piel fría, cianosis, sudor", pin: [240, 250], q: "Extremidades frías, cianosis periférica, diaforesis", m: "Vasoconstricción por hiperactividad adrenérgica y bajo gasto (clases 16, 17 y 41)." },
    ciano: { t: "Cianosis central", pin: [150, 56], q: "Cianosis central y esputo espumoso rosado", m: "Congestión pulmonar grave: la sangre sale mal oxigenada (EAP). Extremidades frías en el EAP cardiogénico (clase 41)." },
    yugular: { t: "Ingurgitación yugular", pin: [128, 86], q: "Yugulares turgentes a 45°", m: "Hipertensión venosa sistémica por el territorio de la vena cava superior (clase 16). Su ausencia no excluye ICD si el paciente está deshidratado." },
    higado: { t: "Hepatomegalia y reflujo hepatoyugular", pin: [100, 280], q: "Hígado doloroso; reflujo hepatoyugular", m: "Hipertensión en la vena cava inferior: hígado congestivo que distiende la cápsula de Glisson; precede al edema. El reflujo hepatoyugular (compresión ≈ 1 min) indica presión venosa alta (clases 16 y 17)." },
    ascitis: { t: "Ascitis", pin: [196, 322], q: "Aumento del perímetro abdominal", m: "Presión alta en venas hepáticas y peritoneo; es más voluminosa en la valvulopatía tricuspídea y la pericarditis constrictiva (clase 17)." },
    edema: { t: "Edema de miembros inferiores", pin: [186, 450], q: "Blando, simétrico, de predominio vespertino", m: "Hipertensión venosa + permeabilidad capilar + retención de Na⁺ por aldosterona. Bilateral (la TVP es unilateral). En fases avanzadas, anasarca (clases 16 y 17)." },
    derrame: { t: "Derrame pleural", pin: [102, 218], q: "Derrame pleural, de predominio derecho", m: "Hipertensión capilar sistémica y pulmonar; suele ser bilateral y más frecuente en el hemitórax derecho (clases 16 y 17)." },
    hap: { t: "HAP e hipertrofia del VD", pin: [138, 190], q: "Hipertensión arterial pulmonar → hipertrofia y dilatación del VD", m: "Hipoxia crónica (vasoconstricción y fibrosis arterial), destrucción del lecho vascular y poliglobulia aumentan la resistencia pulmonar; el VD se sobrecarga, se hipertrofia, se dilata y claudica (clase 33)." },
    fibrosis: { t: "Pulmón enfermo de base", pin: [100, 150], q: "Enfermedad pulmonar: EPOC, secuelas de TBC, fibrosis, TEP", m: "En el cor pulmonale la lesión primaria está en el pulmón (clase 33); el pulmón no está congestionado como en la ICI." }
  };
  // Modos: qué signos muestra y cómo se dibuja el maniquí (valores 0-1)
  const MODOS = {
    izqR: { n: "IC izquierda · congestión (retrógrada)", s: ["disnea", "ortopnea", "crep", "asma", "tos", "s3"], pulm: 0.55, yug: 0, hig: 0, asc: 0, ede: 0, der: 0, vi: 1, vd: 0,
      cad: ["Falla el VI (isquemia, HTA, valvulopatía)", "↑ Presión telediastólica del VI", "↑ Presión en la aurícula izquierda", "↑ Presión en las venas pulmonares", "↑ Presión capilar pulmonar (10 → 25-30 mmHg)", "Líquido al intersticio y al alvéolo: edema pulmonar", "Hipoxemia: disnea, ortopnea, crepitantes"],
      txt: "Origen: <b>hipertensión veno-capilar pulmonar</b>. Manifestaciones <b>subjetivas y audibles</b>: disnea, estertores (clase 16)." },
    izqA: { n: "IC izquierda · bajo gasto (anterógrada)", s: ["fatiga", "oliguria", "pulso", "frio", "s3"], pulm: 0, yug: 0, hig: 0, asc: 0, ede: 0, der: 0, vi: 1, vd: 0,
      cad: ["Falla el VI", "↓ Volumen sistólico y gasto cardiaco", "Hipoperfusión de músculo, cerebro y riñón", "Activación del simpático y el SRAA", "Fatiga, confusión, oliguria, extremidades frías"],
      txt: "Caída del débito <b>hacia adelante</b>: fatiga e intolerancia al ejercicio; en fases avanzadas confusión y alteración de conciencia (clase 16)." },
    der: { n: "IC derecha", s: ["yugular", "higado", "ascitis", "edema", "derrame"], pulm: 0, yug: 1, hig: 1, asc: 0.8, ede: 1, der: 0.6, vi: 0, vd: 1,
      cad: ["Falla el VD", "↑ Presión en la aurícula derecha", "↑ Presión en la vena cava superior → yugulares", "↑ Presión en la vena cava inferior → hígado, abdomen, piernas", "Hepatomegalia, ascitis, edema de MMII"],
      txt: "Origen: <b>hipertensión venosa sistémica</b>. Manifestaciones <b>objetivas y visibles</b>: edema, ascitis, ingurgitación yugular, hepatomegalia (clase 16)." },
    icc: { n: "ICC · ambos ventrículos", s: ["disnea", "ortopnea", "crep", "s3", "yugular", "higado", "ascitis", "edema", "derrame"], pulm: 0.55, yug: 1, hig: 1, asc: 0.6, ede: 1, der: 0.7, vi: 1, vd: 1,
      cad: ["Falla el VI (casi siempre primero)", "↑ Presión de la arteria pulmonar", "Falla secundaria del VD", "Congestión pulmonar + congestión sistémica", "Insuficiencia cardiaca congestiva (ICC)"],
      txt: "Falla biventricular: coexisten síntomas de ICI e ICD. Habitualmente falla primero el VI y secundariamente el VD por hipertensión de la arteria pulmonar (clase 16). Es la presentación más frecuente en la IC de larga evolución." },
    cor: { n: "Cor pulmonale crónico", s: ["fibrosis", "hap", "yugular", "higado", "edema"], pulm: 0, fib: 1, yug: 1, hig: 0.8, asc: 0.3, ede: 0.9, der: 0, vi: 0, vd: 1.4,
      cad: ["Enfermedad pulmonar (EPOC, secuelas de TBC, fibrosis, TEP) o hipoxia de altura", "Vasoconstricción arteriolar + pérdida del lecho vascular + poliglobulia", "↑ Resistencia vascular pulmonar: HAP", "Sobrecarga de presión del VD: hipertrofia", "Dilatación y falla del VD: cor pulmonale", "Yugulares, hepatomegalia, edema, ↓ gasto"],
      txt: "Hipertrofia y dilatación del VD secundarias a HAP por enfermedad <b>pulmonar</b> (se excluyen las causas primarias del lado izquierdo y las cardiopatías congénitas). En Puno (3820 msnm) es una causa muy frecuente: ≈ 40 % de las IC del hospital (clase 33)." },
    eap: { n: "Edema agudo de pulmón", s: ["disnea", "crep", "tos", "ciano", "s3", "frio"], pulm: 1, yug: 0, hig: 0, asc: 0, ede: 0, der: 0.3, vi: 1, vd: 0,
      cad: ["Falla aguda del VI (IAM, emergencia hipertensiva, arritmia, valvulopatía descompensada)", "Presión capilar pulmonar 25-30 mmHg (el triple de lo normal)", "Se desborda el drenaje linfático: trasudado al alvéolo", "Hematosis alterada: hipoxemia, cianosis", "Disnea intensa, crepitantes en «marea montante», esputo rosado espumoso"],
      txt: "Acúmulo <b>súbito</b> de líquido en intersticio y alvéolos; emergencia (clase 41). Cardiogénico: extremidades <b>frías</b>; no cardiogénico: calientes." }
  };

  SECC.lados = function (main, arg) {
    let modo = MODOS[arg] ? arg : "izqR", pinAct = null;
    main.innerHTML = `<h1>IC izquierda vs derecha</h1>
      <p class="lema">Elige el tipo de falla: el maniquí muestra <b>dónde se congestiona</b> y qué signos esperas. Toca un punto del cuerpo para ver el mecanismo.</p>
      <div class="chips" id="modos">${Object.keys(MODOS).map(k => `<button class="chip${k === modo ? " act" : ""}" data-k="${k}">${MODOS[k].n}</button>`).join("")}</div>
      <div class="grid2">
        <div class="caja"><svg id="mn" class="lienzo-svg" viewBox="0 0 300 540" style="max-width:420px;margin:auto" role="img" aria-label="Maniquí con la congestión de la insuficiencia cardiaca"></svg></div>
        <div>
          <div class="caja" id="resumen"></div>
          <div class="caja"><b>De la falla al signo</b><ol class="pasos" id="cadena"></ol></div>
          <div class="caja info" id="info"><p class="nota">Toca un punto del maniquí o una tarjeta de signo.</p></div>
        </div>
      </div>
      <h2>Signos de este cuadro</h2><div class="grid3" id="signos"></div>
      <h2>ICI vs ICD de un vistazo (clase 16)</h2>
      <div class="caja"><table><tr><th>IC izquierda (subjetiva y audible)</th><th>IC derecha (objetiva y visible)</th></tr>
        <tr><td>Origen: hipertensión veno-capilar pulmonar</td><td>Origen: hipertensión venosa sistémica</td></tr>
        <tr><td>Disnea, ortopnea, DPN</td><td>Edema en MMII (bilateral, vespertino)</td></tr>
        <tr><td>Estertores crepitantes bibasales</td><td>Ingurgitación yugular</td></tr>
        <tr><td>EAP; asma cardiaca (sibilancias)</td><td>Hepatomegalia dolorosa; ascitis</td></tr>
        <tr><td>Confusión mental (hipoperfusión cerebral)</td><td>Derrame pleural (predominio derecho)</td></tr></table></div>`;
    const svg = $("#mn");
    // --- dibujo del maniquí (estático) ---
    svg.innerHTML = `<defs>
        <clipPath id="clL"><path d="M147 112 C118 108 100 130 96 178 C94 205 110 222 142 218 Z"/></clipPath>
        <clipPath id="clR"><path d="M153 112 C182 108 200 130 204 178 C206 205 190 222 158 218 Z"/></clipPath>
        <pattern id="pitting" width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" style="fill:#3B82F6;opacity:.7"/></pattern></defs>
      <circle cx="150" cy="46" r="28" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/>
      <path id="m-lab" d="M140 58 Q150 64 160 58" fill="none" style="stroke:var(--tx2);stroke-width:3;stroke-linecap:round"/>
      <text id="m-conf" x="184" y="20" font-size="20" font-weight="700" style="fill:var(--ro);opacity:0">?!</text>
      <rect x="138" y="72" width="24" height="30" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2"/>
      <path id="m-yug" d="M141 98 C138 86 138 76 141 68" fill="none" style="stroke:#3B82F6;stroke-width:3;stroke-linecap:round"/>
      <path d="M95 102 Q150 90 205 102 L214 232 Q210 300 206 384 L94 384 Q90 300 86 232 Z" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/>
      <path d="M92 108 L62 230 L74 236 L100 140" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/><path d="M208 108 L238 230 L226 236 L200 140" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/>
      <path d="M147 112 C118 108 100 130 96 178 C94 205 110 222 142 218 Z" style="fill:#F9A8D4;fill-opacity:.35;stroke:var(--tx2);stroke-width:2"/>
      <path d="M153 112 C182 108 200 130 204 178 C206 205 190 222 158 218 Z" style="fill:#F9A8D4;fill-opacity:.35;stroke:var(--tx2);stroke-width:2"/>
      <rect id="m-liqL" x="90" y="230" width="60" height="0" clip-path="url(#clL)" style="fill:#3B82F6;opacity:.6"/>
      <rect id="m-liqR" x="150" y="230" width="60" height="0" clip-path="url(#clR)" style="fill:#3B82F6;opacity:.6"/>
      <g id="m-fib" style="opacity:0;stroke:var(--tx2);stroke-width:2"><path d="M108 140l14 10M104 165l16 8M112 190l14-6M178 140l14 10M182 168l16 8M176 192l14-6" fill="none"/></g>
      <g id="m-crep" style="opacity:0;stroke:var(--tx);stroke-width:1.8"><path d="M108 188l6 5M120 200l6 5M174 190l6 5M188 200l6 5M130 208l6 4M166 208l6 4" fill="none"/></g>
      <rect id="m-der" x="92" y="228" width="58" height="0" rx="4" style="fill:#94A3B8;opacity:.75"/>
      <ellipse id="m-vd" cx="143" cy="170" rx="17" ry="25" style="fill:#60A5FA;stroke:var(--tx);stroke-width:2"/>
      <ellipse id="m-vi" cx="166" cy="176" rx="18" ry="27" style="fill:#F87171;stroke:var(--tx);stroke-width:2"/>
      <text x="143" y="173" text-anchor="middle" font-size="10" style="fill:#fff">VD</text><text x="166" y="180" text-anchor="middle" font-size="10" style="fill:#fff">VI</text>
      <ellipse id="m-hig" cx="118" cy="268" rx="38" ry="20" style="fill:#92400E;opacity:.85;stroke:var(--tx);stroke-width:2"/>
      <text x="118" y="272" text-anchor="middle" font-size="10.5" style="fill:#fff">hígado</text>
      <ellipse id="m-asc" cx="150" cy="320" rx="46" ry="34" style="fill:#FDE68A;opacity:.55;stroke:#D97706;stroke-width:2;stroke-dasharray:5 4"/>
      <rect id="m-lgL" x="96" y="384" width="46" height="130" rx="18" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/>
      <rect id="m-lgR" x="158" y="384" width="46" height="130" rx="18" style="fill:var(--papel);stroke:var(--tx2);stroke-width:2.5"/>
      <rect id="m-peL" x="96" y="420" width="46" height="94" rx="18" fill="url(#pitting)" style="opacity:0"/>
      <rect id="m-peR" x="158" y="420" width="46" height="94" rx="18" fill="url(#pitting)" style="opacity:0"/>
      <g id="m-pins"></g>`;
    const set = (id, o) => { const el = $("#" + id, svg); for (const k in o) el.setAttribute(k, o[k]); return el; };
    // valores animados (suavizados hacia el objetivo)
    const cur = { pulm: 0, fib: 0, yug: 0, hig: 0, asc: 0, ede: 0, der: 0, vi: 0.6, vd: 0.6 };
    function objetivo() { const m = MODOS[modo]; return { pulm: m.pulm || 0, fib: m.fib || 0, yug: m.yug || 0, hig: m.hig || 0, asc: m.asc || 0, ede: m.ede || 0, der: m.der || 0, vi: m.vi, vd: m.vd }; }
    function dibujar(t) {
      const c = cur, m = MODOS[modo];
      const lv = 218 - 106 * c.pulm; // el líquido sube desde la base
      ["L", "R"].forEach(s => { set("m-liq" + s, { y: lv.toFixed(1), height: (230 - lv).toFixed(1) }); });
      set("m-crep", { style: `opacity:${c.pulm > 0.2 ? 1 : 0};stroke:var(--tx);stroke-width:1.8` });
      set("m-fib", { style: `opacity:${c.fib};stroke:var(--tx2);stroke-width:2` });
      set("m-der", { y: (218 - 34 * c.der).toFixed(1), height: (34 * c.der).toFixed(1) });
      const lat = 1 + 0.06 * Math.sin(t * 7);
      set("m-vi", { rx: (18 * (1 + 0.28 * c.vi) * lat).toFixed(1), ry: (27 * (1 + 0.28 * c.vi) * lat).toFixed(1), style: `fill:${c.vi > 0.5 ? "#B91C1C" : "#F87171"};stroke:var(--tx);stroke-width:2` });
      set("m-vd", { rx: (17 * (1 + 0.3 * c.vd) * lat).toFixed(1), ry: (25 * (1 + 0.3 * c.vd) * lat).toFixed(1), style: `fill:${c.vd > 0.5 ? "#1D4ED8" : "#60A5FA"};stroke:var(--tx);stroke-width:2` });
      set("m-yug", { style: `stroke:#3B82F6;stroke-width:${(3 + 7 * c.yug * (1 + 0.15 * Math.sin(t * 6))).toFixed(1)};stroke-linecap:round` });
      set("m-hig", { rx: (38 + 14 * c.hig).toFixed(1), ry: (20 + 9 * c.hig).toFixed(1) });
      set("m-asc", { rx: (46 + 30 * c.asc).toFixed(1), ry: (34 + 20 * c.asc).toFixed(1), style: `fill:#FDE68A;opacity:${(0.25 + 0.6 * c.asc).toFixed(2)};stroke:#D97706;stroke-width:2;stroke-dasharray:5 4` });
      const w = 46 + 18 * c.ede;
      set("m-lgL", { x: (119 - w / 2).toFixed(1), width: w.toFixed(1) }); set("m-lgR", { x: (181 - w / 2).toFixed(1), width: w.toFixed(1) });
      set("m-peL", { x: (119 - w / 2).toFixed(1), width: w.toFixed(1), style: `opacity:${c.ede.toFixed(2)}` }); set("m-peR", { x: (181 - w / 2).toFixed(1), width: w.toFixed(1), style: `opacity:${c.ede.toFixed(2)}` });
      const conf = m.s.includes("fatiga");
      set("m-conf", { style: `fill:var(--ro);opacity:${conf ? 1 : 0}` });
      set("m-lab", { d: m.s.includes("ciano") ? "M140 58 Q150 64 160 58" : "M140 58 Q150 64 160 58", style: `stroke:${m.s.includes("ciano") ? "#2563EB" : "var(--tx2)"};stroke-width:${m.s.includes("ciano") ? 6 : 3};stroke-linecap:round;fill:none` });
    }
    function pines() {
      $("#m-pins", svg).innerHTML = MODOS[modo].s.map((id, i) => { const p = SIGNOS[id].pin; return `<g class="hit" data-id="${id}"><circle cx="${p[0]}" cy="${p[1]}" r="12" style="fill:var(--am);stroke:#1b1b1b;stroke-width:2.5"/><text x="${p[0]}" y="${p[1] + 4.5}" text-anchor="middle" font-size="12.5" font-weight="700" style="fill:#1b1b1b">${"ABCDEFGHIJ"[i]}</text></g>`; }).join("");
      $$("#m-pins .hit", svg).forEach(g => g.onclick = () => mostrar(g.dataset.id));
    }
    function mostrar(id) {
      pinAct = id; const s = SIGNOS[id], i = MODOS[modo].s.indexOf(id) + 1;
      $("#info").innerHTML = `<h3>${i ? "ABCDEFGHIJ"[i - 1] + ". " : ""}${s.t}</h3><p><b>Qué verás:</b> ${s.q}</p><p><b>Por qué:</b> ${s.m}</p>`;
      $$("#signos .tarj").forEach(t => t.style.outline = t.dataset.id === id ? "3px solid var(--azc)" : "none");
    }
    function pintarModo() {
      const m = MODOS[modo];
      $$("#modos button").forEach(b => b.classList.toggle("act", b.dataset.k === modo));
      $("#resumen").innerHTML = `<h3>${m.n}</h3><p>${m.txt}</p>`;
      $("#cadena").innerHTML = m.cad.map(c => `<li style="cursor:default"><span>${c}</span></li>`).join("");
      $("#signos").innerHTML = m.s.map((id, i) => `<div class="tarj ${modo === "izqR" || modo === "izqA" || modo === "eap" ? "" : "ro"}" data-id="${id}" style="cursor:pointer"><b class="t">${"ABCDEFGHIJ"[i]}. ${SIGNOS[id].t}</b>${SIGNOS[id].q}</div>`).join("");
      $$("#signos .tarj").forEach(t => t.onclick = () => mostrar(t.dataset.id));
      pines(); $("#info").innerHTML = `<p class="nota">Toca un punto del maniquí o una tarjeta de signo.</p>`;
    }
    $$("#modos button").forEach(b => b.onclick = () => { modo = b.dataset.k; pintarModo(); });
    pintarModo(); dibujar(0);
    U.anim((t, dt) => {
      const o = objetivo(), k = Math.min(1, dt * 3);
      for (const key in cur) cur[key] += (o[key] - cur[key]) * k;
      dibujar(t);
    });
  };

  /* =====================================================================
     PESTAÑA 5 · Explicación
     ===================================================================== */
  SECC.explica = function (main) {
    main.innerHTML = `<h1>Explicación</h1>
      <p class="lema">Qué es la insuficiencia cardiaca, cómo la describe la curva de Frank-Starling, por qué el cuerpo la empeora al compensarla y para qué sirve cada tratamiento.</p>
      <div class="grid3">
        <div class="tarj"><b class="t">¿Qué es?</b>La <b>IC</b> es la incapacidad del corazón de mantener el <mark>débito cardiaco</mark> adecuado a las necesidades metabólicas de los tejidos (clase 16). Gasto cardiaco = volumen sistólico × frecuencia.</div>
        <div class="tarj ve"><b class="t">¿Cómo funciona la bomba?</b>El volumen sistólico depende de tres cosas: <b>precarga</b> (cuánto se llena y estira el ventrículo), <b>poscarga</b> (contra qué presión eyecta) y <b>contractilidad</b> (fuerza a igual estiramiento). A más estiramiento, más fuerza: <mark>ley de Frank-Starling</mark>.</div>
        <div class="tarj na"><b class="t">¿Por qué se llega a la falla?</b>Cardiopatía isquémica e HTA son las causas más frecuentes; también valvulopatías, miocardiopatías, arritmias, pericarditis constrictiva y tóxicos (alcohol, cocaína, quimioterápicos). En altura, el cor pulmonale (clase 33).</div>
        <div class="tarj mo"><b class="t">¿Para qué sirve saberlo?</b>Porque cada tratamiento mueve un determinante: diuréticos y nitratos bajan la precarga, los IECA bajan la poscarga y el remodelado, los digitálicos suben la contractilidad, y los betabloqueadores frenan la activación adrenérgica dañina.</div>
      </div>
      <h2>La curva de Frank-Starling en palabras</h2>
      <div class="caja"><ul>
        <li>Eje horizontal: <b>presión de llenado</b> (precarga). Eje vertical: <b>volumen sistólico</b>.</li>
        <li>Corazón sano: al subir la precarga sube el volumen sistólico, y arriba la curva se aplana (no rinde más estirar).</li>
        <li>Más contractilidad (ejercicio, simpático, digital): la curva <b>sube</b>. Menos contractilidad (infarto, miocardiopatía): la curva <b>baja y se aplana</b>.</li>
        <li>Más poscarga: la curva <b>baja</b> (el VI vacía menos); menos poscarga: sube.</li>
        <li>Corazón insuficiente: para sacar un volumen aceptable necesita presión de llenado alta, y esa presión se transmite hacia atrás: <b>congestión</b>. Por eso coexisten <b>bajo gasto</b> (hacia adelante) y <b>congestión</b> (hacia atrás).</li>
        <li>Umbral de congestión: la clase da la presión capilar pulmonar normal ≈ 10 mmHg y la del EAP de 25-30 mmHg (clase 41); la congestión intersticial desde ≈ 18 mmHg es dato de <span class="lit">literatura</span>.</li></ul></div>
      <h2>Sistólica y diastólica (clase 16)</h2>
      <div class="caja"><table><tr><th></th><th>IC sistólica</th><th>IC diastólica</th></tr>
        <tr><td><b>Qué falla</b></td><td>Contractilidad miocárdica</td><td>Llenado ventricular</td></tr>
        <tr><td><b>Fracción de eyección</b></td><td>Disminuida</td><td>Conservada</td></tr>
        <tr><td><b>Ejemplos</b></td><td>Infarto extenso, miocardiopatía dilatada, HTA crónica</td><td>Estenosis mitral y tricuspídea (clase 16); ventrículo hipertrófico o rígido y pericarditis constrictiva <span class="lit">literatura</span></td></tr>
        <tr><td><b>En el bucle P-V</b></td><td>Línea de fin de sístole aplanada; VTS ↑</td><td>Curva de llenado empinada; presión de llenado alta</td></tr></table></div>
      <h2>Sobrecarga de volumen y de presión (clases 13 a 15)</h2>
      <div class="caja"><table><tr><th>Lesión</th><th>Qué se mueve</th><th>Qué dice la clase</th></tr>
        <tr><td>Estenosis aórtica</td><td>Poscarga ↑ (presión)</td><td>Impide el vaciamiento del VI; su descompensación aguda puede dar EAP (clase 41).</td></tr>
        <tr><td>Insuficiencia aórtica</td><td>Precarga ↑ (volumen), luego presión</td><td>Reflujo diastólico: sobrecarga de volumen, dilatación e hipertrofia del VI; en la aguda, aumento brusco de presión y EAP (clase 15). PA típica 140/20 en la crónica.</td></tr>
        <tr><td>Insuficiencia mitral</td><td>Precarga ↑ (volumen en AI y VI)</td><td>La forma aguda sube bruscamente la presión de la AI y congestiona el pulmón; la crónica se compensa con dilatación y los síntomas aparecen tras años (clase 14).</td></tr>
        <tr><td>Estenosis mitral</td><td>Llenado ↓ (presión AI 10-12 → 25-35 mmHg)</td><td>Congestión pulmonar y dilatación de la AI con fibrilación auricular en 30-40 % (clase 13). Ejemplo de IC diastólica (clase 16).</td></tr></table></div>
      <h2>Por qué compensar también daña (clase 16)</h2>
      <div class="caja"><p>Cuando cae el gasto se activan <b>simpático</b>, <b>SRAA</b> y la <b>hipertrofia y dilatación</b>. Al inicio sostienen el gasto; sostenidos producen <mark>cardiotoxicidad directa</mark> (fibrosis, apoptosis), más poscarga, hipervolemia que congestiona y más consumo de O₂: un círculo vicioso. Por eso el tratamiento bloquea esos sistemas (IECA, betabloqueadores). La ADH y los péptidos natriuréticos completan el cuadro, pero no están en la clase <span class="lit">literatura</span>.</p></div>
      <h2>Factores que descompensan (clase 16)</h2>
      <div class="caja"><p>Exceso de sal o líquidos, suspender medicamentos, infecciones, tromboembolia pulmonar, fármacos cardiodepresores (betabloqueadores, verapamilo, antineoplásicos, anestésicos, algunos antiarrítmicos), <b>corticoides y AINES</b> (retienen sal y agua), y enfermedades asociadas (diabetes, insuficiencia renal, anemia, tirotoxicosis).</p></div>
      <h2>Tratamiento y qué determinante mueve</h2>
      <div class="caja"><table><tr><th>Medida</th><th>Determinante</th><th>Notas de la clase</th></tr>
        <tr><td>Dieta hiposódica, diuréticos (furosemida)</td><td>Precarga ↓</td><td>Reducen la sobrecarga de volumen y la presión capilar pulmonar (clases 16 y 41).</td></tr>
        <tr><td>Sentar al paciente con las piernas colgando; morfina; nitroglicerina</td><td>Precarga ↓</td><td>En el EAP: baja el retorno venoso y mejora la mecánica ventilatoria (clase 41).</td></tr>
        <tr><td>IECA (captopril, enalapril)</td><td>Poscarga ↓, remodelado</td><td>Efecto adverso frecuente: tos seca (clase 16).</td></tr>
        <tr><td>Digitálicos (digoxina)</td><td>Contractilidad ↑</td><td>Por vía parenteral en fases agudas (el edema intestinal dificulta la absorción). Náuseas y vómitos también pueden ser intoxicación digitálica.</td></tr></table></div>
      <h2>Clasificación y diagnóstico (clases 16 y 17)</h2>
      <div class="grid3">
        <div class="tarj"><b class="t">NYHA</b>I sin limitación · II limitación discreta · III limitación acentuada, síntomas con menos de la actividad habitual · IV síntomas en reposo.</div>
        <div class="tarj"><b class="t">Framingham</b>2 criterios mayores = ICC confirmada · 1 mayor + 2 menores = probable. Mayores: DPN, ortopnea, yugulares, crepitantes, cardiomegalia, EAP, reflujo hepatoyugular, galope, PVC &gt; 16 cm H₂O.</div>
        <div class="tarj na"><b class="t">Discrepancia entre clases</b><span class="nota">[REVISAR] Capacidad vital disminuida: la clase 16 dice «1/3 del máximo» y la clase 17 «2/3». La literatura (criterio menor de Framingham) habla de una disminución de un tercio del máximo registrado.</span></div>
      </div>
      <h2>Qué es didáctico en este simulador</h2>
      <div class="caja"><p class="nota">El modelo usa la relación presión-volumen estándar del ventrículo izquierdo (cifras de reposo de la fisiología general <span class="lit">literatura</span>) para que las curvas salgan de las tres variables y no estén dibujadas a mano. Los umbrales de la clase son: presión capilar pulmonar normal ≈ 10 mmHg y 25-30 mmHg en el EAP cardiogénico (Dr. Sotito). Las cifras de presión arterial, FE y gasto son aproximadas y sirven para entender el sentido de los cambios.</p></div>`;
  };

  /* =====================================================================
     PESTAÑA 6 · Ponte a prueba
     ===================================================================== */
  const OPC_MOV = {
    pre_up: "Precarga ↑", pre_down: "Precarga ↓", pos_up: "Poscarga ↑", pos_down: "Poscarga ↓",
    con_down: "Contractilidad ↓", con_up: "Contractilidad ↑", dis_down: "Llenado ↓ (rigidez, distensibilidad ↓)"
  };
  const OPC_LADO = { izq: "IC izquierda (congestión pulmonar)", der: "IC derecha (congestión sistémica)", ambos: "ICC: ambos ventrículos", nada: "No es falla de bomba" };
  const CASOS = [
    { p: "Varón de {e} años, hipertenso, con un infarto extenso hace 2 semanas. Consulta porque la falta de aire lo despierta de noche y duerme con 3 almohadas.",
      mov: "con_down", lado: "izq", signo: "Estertores crepitantes en las bases pulmonares",
      e1: "El infarto destruye miocardio: cae la <b>contractilidad</b> (IC sistólica, FE disminuida). La causa más frecuente de IC es la cardiopatía isquémica (clase 16).",
      e2: "El infarto extenso conduce a falla del <b>VI</b>: la presión sube hacia la aurícula izquierda y el pulmón (ortopnea, DPN).", e3: "Congestión pulmonar retrógrada: líquido en alvéolos, crepitantes en las bases («pisar nieve»).",
      est: "Infarto extenso", ir: "curva" },
    { p: "Mujer de {e} años, con PA de 230/130 mmHg, disnea súbita, taquipnea y tos con esputo rosado y espumoso.",
      mov: "pos_up", lado: "izq", signo: "Crepitantes que suben en «marea montante» y esputo rosado espumoso",
      e1: "Aumento brusco de la <b>poscarga</b>: una emergencia hipertensiva puede causar el EAP (clase 41).", e2: "El VI no logra vaciarse contra esa presión: falla izquierda con presión capilar de 25-30 mmHg.",
      e3: "En el edema alveolar los crepitantes ascienden de las bases al tercio medio y superior (marea montante) y el esputo es espumoso y rosado (clase 41).", est: "Crisis hipertensiva", ir: "curva" },
    { p: "Varón de {e} años con soplo sistólico, angina y disnea progresiva de esfuerzo; en una infección respiratoria presenta edema agudo de pulmón.",
      mov: "pos_up", lado: "izq", signo: "Disnea de esfuerzo progresiva (grandes → pequeños esfuerzos)",
      e1: "La <b>estenosis aórtica</b> impone una sobrecarga de presión (poscarga alta) al VI; su descompensación aguda puede dar EAP (clase 41).", e2: "El obstáculo está a la salida del VI: congestión pulmonar (lado izquierdo).",
      e3: "La disnea es el primer síntoma y progresa de grandes a pequeños esfuerzos hasta el reposo (clase 17).", est: "Estenosis aórtica", ir: "curva" },
    { p: "Mujer de {e} años con ruptura aguda de cuerda tendinosa: insuficiencia mitral aguda. Disnea intensa de inicio brusco.",
      mov: "pre_up", lado: "izq", signo: "Congestión pulmonar rápida: disnea súbita y crepitantes",
      e1: "En la insuficiencia mitral, parte del volumen regresa a la AI: <b>sobrecarga de volumen</b> en AI y VI (precarga ↑) (clase 14).", e2: "El aumento brusco de presión en la AI se transmite a las venas y capilares pulmonares: congestión pulmonar.",
      e3: "Como la AI no tuvo tiempo de dilatarse, la presión sube de golpe y la congestión pulmonar es rápida (clase 14). La forma crónica se compensa por dilatación y los síntomas tardan años.", est: "Hipervolemia", ir: "curva" },
    { p: "Varón de {e} años, PA 140/20 mmHg, choque de la punta desplazado hacia abajo y hacia la axila, disnea de esfuerzo tras años de evolución.",
      mov: "pre_up", lado: "izq", signo: "Presión diferencial amplia y choque de la punta desplazado",
      e1: "<b>Insuficiencia aórtica crónica</b>: el reflujo diastólico crea una sobrecarga de volumen (precarga ↑) que dilata e hipertrofia el VI (clase 15).", e2: "Se afecta el VI; la congestión pulmonar llega tardíamente.",
      e3: "Por el reflujo, la diastólica cae (140/20) y la presión diferencial se ensancha; el VI dilatado desplaza el choque de la punta (clase 15).", est: "Hipervolemia", ir: "curva" },
    { p: "Mujer de {e} años con antecedente de fiebre reumática. Disnea con palpitaciones; el ecocardiograma muestra aurícula izquierda dilatada y FE conservada.",
      mov: "dis_down", lado: "izq", signo: "Disnea con FE conservada por hipertensión veno-capilar pulmonar",
      e1: "<b>Estenosis mitral</b>: el problema es el llenado del VI, no la contractilidad (ejemplo de IC diastólica, clase 16).", e2: "La presión de la AI sube de 10-12 a 25-35 mmHg y se transmite al pulmón (clase 13).",
      e3: "La FE se conserva, pero la presión retrógrada produce congestión pulmonar. La dilatación de la AI favorece la fibrilación auricular (30-40 %) (clase 13).", est: "IC diastólica", ir: "lazo" },
    { p: "Varón de {e} años, vive a 3820 msnm, con secuelas fibróticas de TBC y poliglobulia. Tiene yugulares ingurgitadas, hígado doloroso y edema de piernas; los pulmones no tienen crepitantes.",
      mov: "pos_up", lado: "der", signo: "Ingurgitación yugular, hepatomegalia y edema de miembros inferiores",
      e1: "La hipoxia crónica, la pérdida de lecho vascular y la poliglobulia elevan la resistencia pulmonar: HAP y <b>poscarga del VD ↑</b> (clase 33).", e2: "Cor pulmonale crónico = falla del <b>VD</b> por enfermedad pulmonar; no hay congestión pulmonar izquierda.",
      e3: "Hipertensión venosa sistémica: yugulares (VCS), hígado y edema de MMII (VCI) (clases 16 y 33).", ir: "lados/cor" },
    { p: "Paciente de {e} años con pericarditis tuberculosa antigua: ascitis voluminosa, yugulares ingurgitadas, hepatomegalia y pulmones limpios.",
      mov: "dis_down", lado: "der", signo: "Ascitis voluminosa",
      e1: "La <b>pericarditis constrictiva</b> impide el llenado ventricular (falla diastólica); es una de las causas de IC listadas en la clase 16.", e2: "El cuadro es de hipertensión venosa sistémica: falla derecha.",
      e3: "La ascitis es más voluminosa en la valvulopatía tricuspídea y en la pericarditis constrictiva (clase 17).", ir: "lados/der" },
    { p: "Mujer de {e} años con IC estable toma AINES por artrosis. En 10 días aumenta de peso, tiene más disnea y edema en las piernas.",
      mov: "pre_up", lado: "ambos", signo: "Aumento de peso, edema de MMII y más disnea",
      e1: "Los AINES y corticoides inducen <b>retención hidrosalina</b>: sube el volumen circulante y la precarga (clase 16).", e2: "Empeoran la congestión pulmonar y el edema periférico (clase 16): cuadro congestivo.",
      e3: "La sobrecarga de volumen se expresa como edema bilateral y disnea.", est: "Hipervolemia", ir: "curva" },
    { p: "Varón alcohólico de {e} años, con disnea, ortopnea, yugulares ingurgitadas, hepatomegalia, edema y una radiografía con cardiomegalia («corazón bovino»).",
      mov: "con_down", lado: "ambos", signo: "Ritmo de galope (S3) y cardiomegalia",
      e1: "El alcohol causa miocardiopatía dilatada: cae la <b>contractilidad</b> (clase 16).", e2: "Hay signos de congestión pulmonar y de congestión sistémica a la vez: ICC.",
      e3: "El ritmo de galope es el signo auscultatorio de mayor valor diagnóstico en la IC (clases 16 y 17).", est: "Infarto extenso", ir: "lados/icc" },
    { p: "Varón joven de {e} años, 3 días de diarrea. PA 80/50 mmHg, FC 120 lpm, yugulares planas y pulmones limpios.",
      mov: "pre_down", lado: "nada", signo: "Hipotensión con taquicardia, sin congestión",
      e1: "La pérdida de volumen baja la <b>precarga</b>: llega menos sangre, el estiramiento es menor y cae el volumen sistólico.", e2: "No hay congestión pulmonar ni sistémica: no es una falla de bomba. La ausencia de ingurgitación yugular no excluye ICD si hay deshidratación (clase 16).",
      e3: "Bajo gasto por falta de llenado: hipotensión y taquicardia compensadora. <span class=\"lit\">literatura</span>", est: "Hemorragia", ir: "curva" },
    { p: "En un edema agudo de pulmón se sienta al paciente con las piernas colgando y se administran furosemida, morfina y nitroglicerina. ¿Qué determinante buscan modificar?",
      mov: "pre_down", lado: null, signo: "Alivio de la disnea al bajar la presión capilar pulmonar",
      e1: "Sentado con piernas colgando, diuréticos, morfina y nitroglicerina <b>reducen la precarga</b> (retorno venoso y volemia) y con ella la presión capilar pulmonar (clase 41).", e3: "Al bajar la presión hidrostática capilar cede el trasudado y mejora la hematosis (clase 41).", est: "Infarto tratado", ir: "curva" },
    { p: "A un paciente con IC se le indica captopril. ¿Qué determinante busca modificar principalmente?",
      mov: "pos_down", lado: null, signo: "Tos seca como efecto adverso frecuente",
      e1: "Los IECA <b>disminuyen la poscarga</b> y revierten el remodelado cardiaco; además bloquean el SRAA, que es cardiotóxico a largo plazo (clase 16).", e3: "La tos seca es un efecto adverso frecuente de captopril y enalapril; no hay que confundirla con un EAP (clases 16 y 17).", est: "Infarto tratado", ir: "compensa" },
    { p: "Se indica digoxina a un paciente con IC sistólica. ¿Qué determinante busca modificar?",
      mov: "con_up", lado: null, signo: "Náuseas y vómitos si hay intoxicación digitálica",
      e1: "Los digitálicos son <b>inotrópicos positivos</b>: aumentan la contractilidad (clase 16).", e3: "Los síntomas digestivos (anorexia, náuseas, vómitos) también pueden indicar intoxicación digitálica (clases 16 y 17).", est: { c: 0.8, a: 1, P: 14, r: 1, FC: 80 }, ir: "curva" },
    { p: "Mujer de {e} años con IC que consulta por «piernas hinchadas»: edema blando, bilateral y simétrico, peor por la tarde, con hígado doloroso.",
      mov: "pre_up", lado: "der", signo: "Edema bilateral, simétrico y vespertino",
      e1: "La retención de sodio y agua (aldosterona) y la hipertensión venosa elevan la presión hidrostática: sobrecarga de <b>volumen</b>.", e2: "El edema de miembros inferiores en la IC expresa hipertensión en la vena cava inferior: territorio derecho (clase 16).",
      e3: "A diferencia de la TVP (casi siempre unilateral), el edema de la IC es bilateral y simétrico, más pronunciado por la tarde (clases 16 y 17).", ir: "lados/der" }
  ];

  SECC.prueba = function (main) {
    const N = 8;
    let orden, i, q, aciertos, total, hechas;
    const barajar = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [a[k], a[j]] = [a[j], a[k]]; } return a; };
    function inicio() {
      orden = barajar(CASOS.map((_, k) => k)).slice(0, N); i = 0; aciertos = 0; total = 0; caso();
    }
    function preguntasDe(c) {
      const qs = [];
      qs.push({ t: c.q1 || (c.lado === null ? "¿Qué determinante se busca modificar y en qué sentido?" : "¿Qué determinante se movió primero y en qué sentido?"), ops: Object.keys(OPC_MOV).map(k => [k, OPC_MOV[k]]), ok: c.mov, ex: c.e1 });
      if (c.lado !== null) qs.push({ t: "¿Qué lado del corazón falla (o dónde se congestiona)?", ops: Object.keys(OPC_LADO).map(k => [k, OPC_LADO[k]]), ok: c.lado, ex: c.e2 });
      // distractores: signos de casos con otro lado/determinante
      const pool = CASOS.filter(o => o !== c && o.lado !== c.lado && o.mov !== c.mov).map(o => o.signo);
      const dis = barajar([...new Set(pool)]).slice(0, 3);
      const ops = barajar([c.signo, ...dis]).map(s => [s, s]);
      qs.push({ t: c.lado === null ? "¿Qué efecto o resultado esperas?" : "¿Qué signo o hallazgo esperas?", ops, ok: c.signo, ex: c.e3 });
      return qs;
    }
    function caso() {
      if (i >= orden.length) return fin();
      const c = CASOS[orden[i]]; q = 0; hechas = preguntasDe(c);
      const edad = 30 + Math.floor(Math.random() * 45);
      main.innerHTML = `<h1>Ponte a prueba</h1><p class="lema">${N} casos al azar. En cada uno decides qué se movió, qué lado falla y qué signo esperas. La corrección explica el porqué.</p>
        <div class="caja"><div class="barra-pr"><i style="width:${i / orden.length * 100}%"></i></div>
        <p class="nota">Caso ${i + 1} de ${orden.length} · aciertos ${aciertos}/${total}</p>
        <p class="caso">${c.p.replace("{e}", edad)}</p><div id="qbox"></div></div>`;
      pregunta(c);
    }
    function pregunta(c) {
      const Q = hechas[q];
      $("#qbox").innerHTML = `<h3>${q + 1}. ${Q.t}</h3><div class="opciones">${Q.ops.map(o => `<button data-k="${o[0].replace(/"/g, "&quot;")}">${o[1]}</button>`).join("")}</div><div class="res" id="res"></div>`;
      $$("#qbox .opciones button").forEach(b => b.onclick = () => {
        $$("#qbox .opciones button").forEach(x => { x.disabled = true; if (x.dataset.k === Q.ok) x.classList.add("bien"); });
        const bien = b.dataset.k === Q.ok; total++; if (bien) aciertos++; else b.classList.add("mal");
        const ult = q === hechas.length - 1;
        $("#res").innerHTML = `<p><b>${bien ? "Correcto." : "No era esa."}</b> ${Q.ex}</p><div class="btns">${ult && c.ir ? `<button class="btn sec" id="ver">Verlo en el simulador</button>` : ""}<button class="btn" id="sig">${ult ? (i + 1 >= orden.length ? "Ver resultado" : "Siguiente caso") : "Siguiente pregunta"}</button></div>`;
        $("#res").classList.add("ver");
        $("#sig").onclick = () => { if (ult) { i++; caso(); } else { q++; pregunta(c); } };
        const v = $("#ver"); if (v) v.onclick = () => {
          if (c.est) { const p = typeof c.est === "string" ? U.PRESETS.find(x => x.n === c.est) : { e: c.est }; U.aplicar(p); }
          location.hash = "#" + c.ir;
        };
      });
    }
    function fin() {
      const pct = total ? Math.round(100 * aciertos / total) : 0;
      main.innerHTML = `<h1>Resultado</h1><div class="caja"><p class="caso"><b>${aciertos} de ${total}</b> respuestas correctas (${pct} %).</p>
        <div class="barra-pr"><i style="width:${pct}%"></i></div>
        <p>${pct >= 85 ? "Dominas los tres determinantes y los lados de la IC." : pct >= 60 ? "Vas bien. Repasa en el simulador qué mueve cada determinante y vuelve a intentar." : "Conviene volver a la curva de Frank-Starling y al maniquí: primero qué se movió, después de qué lado se congestiona."}</p>
        <div class="btns"><button class="btn" id="otra">Otra ronda</button><a class="btn sec" href="#curva">Ir a la curva</a><a class="btn sec" href="#lados">Ir al maniquí</a></div></div>`;
      $("#otra").onclick = inicio;
    }
    inicio();
  };

  // Expone los casos para el test en Node (no se usa en el navegador)
  window.BOMBA_CASOS = CASOS;
})();
