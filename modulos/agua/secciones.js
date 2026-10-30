/* Agua, sodio y potasio — pestañas «Deshidratación» y «Sodio y potasio». */
(function () {
  "use strict";
  const U = window.UTIL, A = U.A, f = U.f, sg = U.sg, $ = U.$, $$ = U.$$, LIT = U.LIT;
  const SECC = window.SECC;
  const num = (id, v, min, max, paso) => `<input type="number" id="${id}" value="${v}" min="${min}" max="${max}" step="${paso || 1}" inputmode="decimal">`;
  const val = (cont, id) => { const v = parseFloat(String($("#" + id, cont).value).replace(",", ".")); return isFinite(v) ? v : 0; };

  /* mini célula para las tarjetas de tipos de deshidratación */
  function celulaSVG(estado, na) {
    const cx = 70, cy = 62; let r = 34, col = "#93c5fd", bor = "#1d4ed8", d, et;
    if (estado === "arruga") {
      r = 26; col = "#fca5a5"; bor = "#b91c1c"; et = "se arruga"; d = "";
      for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2, rr = r + (i % 2 ? -6 : 1); d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); }
      d += "Z";
    } else {
      if (estado === "hincha") { r = 46; col = "#bae6fd"; bor = "#0369a1"; et = "se hincha"; } else et = "normal";
      d = `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
    }
    const flecha = estado === "hincha" ? `<path d="M128 62 H100" stroke="#0369a1" stroke-width="4" marker-end="url(#pf)"/>` : estado === "arruga" ? `<path d="M100 62 H128" stroke="#b91c1c" stroke-width="4" marker-end="url(#pf)"/>` : "";
    return `<svg viewBox="0 0 240 130" style="width:100%;max-width:300px"><defs><marker id="pf" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0 0L8 4L0 8z" fill="currentColor"/></marker></defs>
      <path d="${d}" fill="${col}" stroke="${bor}" stroke-width="3" stroke-linejoin="round"/><text x="${cx}" y="${cy + 4}" font-size="11" text-anchor="middle" fill="#1f2937">célula</text>
      <rect x="132" y="10" width="100" height="90" rx="12" fill="${na > 145 ? "#fecaca" : na < 135 ? "#bfdbfe" : "#bbf7d0"}" stroke="var(--tx2)" stroke-width="2"/>
      <text x="182" y="40" font-size="12" text-anchor="middle" fill="#1f2937" font-weight="700">Extracelular</text><text x="182" y="62" font-size="20" text-anchor="middle" fill="#1f2937" font-weight="700">Na ${na}</text>
      <text x="182" y="84" font-size="11" text-anchor="middle" fill="#1f2937">mEq/L</text>${flecha}
      <text x="${cx}" y="124" font-size="13" text-anchor="middle" fill="${bor}" font-weight="700">${et}</text></svg>`;
  }

  /* =====================================================================
     PESTAÑA 2 · DESHIDRATACIÓN
     ===================================================================== */
  const TIPOS = {
    iso: { t: "Isotónica", fr: "70-90 % de los casos", na: "135-145", osm: "280-310", nav: 140, cel: "normal", cls: "ve",
      mec: "Se pierden agua y electrolitos en igual proporción: no se forma gradiente osmótico entre compartimientos, por eso la célula no cambia.",
      ej: "Vómitos y diarreas intensas.",
      clin: ["Pérdida de peso, ojos hundidos, disminución de la elasticidad cutánea, mucosas secas, tono muscular disminuido.", "Puede evolucionar a colapso circulatorio (pulso rápido y débil, extremidades frías, cianosis), oliguria (< 400 ml/24 h) o anuria."] },
    hipo: { t: "Hipotónica (hiponatremia)", fr: "8-10 %", na: "< 130", osm: "< 280", nav: 122, cel: "hincha", cls: "ro", grave: true,
      mec: "Se pierde sodio en exceso respecto al agua. La osmolaridad plasmática cae (< 280), se crea un gradiente inverso y el agua pasa al espacio intracelular: riesgo de edema cerebral.",
      ej: "Pérdida excesiva de Na (diuréticos, cólera, Addison) repuesta con agua.",
      clin: ["Es la más grave.", "Agitación, convulsiones, coma. Ausencia de sed, mucosas húmedas, signos neurológicos prominentes."] },
    hiper: { t: "Hipertónica (hipernatremia)", fr: "2-10 %", na: "> 150", osm: "> 310", nav: 158, cel: "arruga", cls: "ro",
      mec: "Se pierde más agua que sodio. Sube la osmolaridad (> 310) y el agua sale de la célula hacia el extracelular: deshidratación intracelular.",
      ej: "Diabetes insípida, diuréticos osmóticos (manitol).",
      clin: ["Sed intensa, irritabilidad, fiebre alta, fotofobia, rigidez de nuca, cefalea.", "Convulsiones y coma."] },
    hh: { t: "Hiperhidratación (intoxicación hídrica)", fr: "exceso de agua", na: "< 135", osm: "baja", nav: 128, cel: "hincha", cls: "ro",
      mec: "Aumenta el volumen hídrico corporal: exceso de líquidos endovenosos, ingestión excesiva o insuficiencia renal con oliguria. Hemodilución: hematocrito disminuido, densidad urinaria baja.",
      ej: "Posoperatorio con sueros de más, IRA/IRC oligúrica.",
      clin: ["Edema facial o generalizado, derrame pleural, disnea, estertores, riesgo de edema agudo de pulmón.", "Desorientación, convulsiones, coma; taquicardia, galope, ingurgitación yugular, PVC > 20 cm H₂O.", "Tratamiento: causa, restricción estricta (~800 ml/24 h) y furosemida parenteral."] }
  };

  SECC.deshid = function (cont) {
    let tipo = "iso", peso = 60, pct = 6;
    cont.innerHTML = `
    <h1>🥵 Deshidratación e hiperhidratación</h1>
    <p class="lema">Dos preguntas ordenan todo: <b>¿cuánto</b> se perdió (grado, % del peso) y <b>¿qué se perdió con el agua?</b> (tipo, según el sodio). La clase se centra en la deshidratación <b>extracelular</b>, la más frecuente.</p>
    <div class="caja"><h2 style="margin-top:0">1 · Tipo según el sodio</h2><div class="chips" id="tp"></div><div class="grid2" id="tpv"></div></div>
    <div class="caja"><h2 style="margin-top:0">2 · Grado según el % de pérdida</h2>
      <div class="ctrl"><label>Peso <input type="range" id="gp" min="3" max="120" value="60"><b id="gpv"></b></label>
      <label>Pérdida de masa <input type="range" id="gq" min="0" max="15" step="0.5" value="6"><b id="gqv"></b></label></div>
      <div id="gr"></div></div>
    <div class="caja"><h2 style="margin-top:0">3 · Calculadora de déficit de agua y de sodio</h2><div id="calc"></div></div>
    <div class="caja"><h2 style="margin-top:0">4 · Balance hídrico de 24 horas</h2><div id="bal"></div></div>
    <div class="caja"><h2 style="margin-top:0">5 · Tratamiento según la clase</h2><div class="grid3">
      <div class="tarj"><b class="t">Leve o moderada</b>Reposición de agua y electrolitos (Na, K, Cl) por <b>vía oral</b> si se tolera; líquidos isotónicos si hubo pérdida de electrolitos.</div>
      <div class="tarj ro"><b class="t">Grave: vía endovenosa</b><ol class="sin"><li><b>Expansión</b>: suero fisiológico (Na 154, Cl 154 mEq/L).</li><li><b>Mantenimiento</b>: 100 ml/kg a 50 ml/kg/h (puede bajar a 25), reevaluando cada hora.</li><li><b>Reposición</b> de pérdidas continuadas: glucosa 5 % + suero fisiológico, 30-60 ml/kg/día.</li></ol></div>
      <div class="tarj mo"><b class="t">Laboratorio y complicaciones</b>Na, K, Cl; <b>hematocrito elevado</b>; urea y creatinina elevadas. Complicaciones: shock hipovolémico, insuficiencia renal (la principal si no se trata) y acidosis metabólica.</div></div></div>`;

    /* ---- 1 · tipos ---- */
    const ids = ["iso", "hipo", "hiper", "hh"];
    function pintaTipo() {
      const T = TIPOS[tipo];
      $("#tpv", cont).innerHTML = `<div class="panel">${celulaSVG(T.cel, T.nav)}</div>
        <div><h3 style="margin-top:0">${T.t} ${T.grave ? '<span class="lit" style="color:var(--ro);border-color:var(--ro)">la más grave</span>' : ""}</h3>
        <div class="kpis"><div><small>Frecuencia</small><b>${T.fr}</b></div><div><small>Na sérico</small><b>${T.na}</b></div><div><small>Osmolaridad</small><b>${T.osm}</b></div></div>
        <p><b>Mecanismo.</b> ${T.mec}</p><p><b>Ejemplo.</b> ${T.ej}</p><ul class="sin">${T.clin.map(c => `<li>${c}</li>`).join("")}</ul></div>`;
    }
    U.chips($("#tp", cont), ids.map(i => ({ id: i, t: TIPOS[i].t })), tipo, id => { tipo = id; pintaTipo(); });
    pintaTipo();

    /* ---- 2 · grados ---- */
    function pintaGrado() {
      $("#gpv", cont).textContent = peso + " kg"; $("#gqv", cont).textContent = f(pct, 1) + " %";
      const g = A.grado(pct), ml = A.perdidaMl(peso, pct);
      const col = id => (g.id === id ? ' class="hl"' : "");
      const G = A.GRADOS.slice(1);
      let tx = "";
      if (g.id === 0) tx = "Por debajo de 2,5 % de pérdida la clase no describe cuadro clínico de deshidratación.";
      else {
        const lo = g.mlkg[0] * peso, hi = g.mlkg[1] * peso;
        tx = `<b>${g.t}</b>: ${g.clin}<br>Déficit estimado según la tabla de la clase: <b>${g.mlkg[0]}${g.id === 3 ? "" : "-" + g.mlkg[1]} ml/kg</b>${g.id === 3 ? " o más" : ""} → ${f(lo / 1000, 1)}${g.id === 3 ? "+" : "-" + f(hi / 1000, 1)} L para ${peso} kg. Pérdida de masa del ${f(pct, 1)} % = <b>${f(ml / 1000, 2)} L</b>.`;
      }
      $("#gr", cont).innerHTML = `<div class="letrero" style="display:block;margin:6px 0">${tx}</div>
        <div class="tw"><table class="tab-res"><tr><th>Parámetro</th>${G.map(x => `<th${col(x.id)}>${x.t}</th>`).join("")}</tr>
        <tr><td>Pérdida de masa</td>${G.map(x => `<td${col(x.id)}>${x.id === 3 ? "> 10 %" : f(x.min, 1) + " - " + x.max + " %"}</td>`).join("")}</tr>
        <tr><td>Déficit (agua)</td>${G.map(x => `<td${col(x.id)}>${x.id === 3 ? "> 100" : x.mlkg[0] + " a " + x.mlkg[1]} ml/kg</td>`).join("")}</tr>
        <tr><td>Frecuencia cardíaca</td>${G.map(x => `<td${col(x.id)}>${x.fc}</td>`).join("")}</tr>
        <tr><td>Presión arterial</td>${G.map(x => `<td${col(x.id)}>${x.pa}</td>`).join("")}</tr>
        <tr><td>Mucosas</td>${G.map(x => `<td${col(x.id)}>${x.muc}</td>`).join("")}</tr>
        <tr><td>Ojos</td>${G.map(x => `<td${col(x.id)}>${x.ojos}</td>`).join("")}</tr>
        <tr><td>Hematocrito</td>${G.map(x => `<td${col(x.id)}>${x.hto}</td>`).join("")}</tr>
        <tr><td>Diuresis horaria</td>${G.map(x => `<td${col(x.id)}>${x.diu}</td>`).join("")}</tr>
        <tr><td>Densidad de orina</td>${G.map(x => `<td${col(x.id)}>${x.dens}</td>`).join("")}</tr></table></div>
        <p class="nota">Con el 10 % de un adulto de 60 kg ya son 6 L. La clase da el rango 2,5-5 / 5-10 / > 10 %; el "grave > 100 ml/kg" no tiene techo.</p>`;
    }
    $("#gp", cont).oninput = e => { peso = +e.target.value; pintaGrado(); pintaCalc(); };
    $("#gq", cont).oninput = e => { pct = +e.target.value; pintaGrado(); };
    pintaGrado();

    /* ---- 3 · calculadora de déficit ---- */
    function pintaCalc(ev) {
      const c = $("#calc", cont);
      if (!c.innerHTML) {
        c.innerHTML = `<div class="ctrl"><label>Peso (kg) ${num("cp", 60, 3, 200)}</label><label>Na hallado (mEq/L) ${num("cn", 160, 100, 200)}</label>
          <label>Na normal <select id="cnn"><option value="135">135</option><option value="140">140</option><option value="145" selected>145</option></select></label>
          <label><input type="checkbox" id="cnrl"> síntomas neurológicos</label></div><div id="calcr"></div>`;
        $$("input,select", c).forEach(e => e.oninput = pintaCalc);
        $("#cp", c).value = peso;
      }
      const p = val(c, "cp") || 60, na = val(c, "cn") || 140, nn = +$("#cnn", c).value, neu = $("#cnrl", c).checked;
      const d = A.deficitAgua(p, na, nn), dna = A.deficitNa(p, na, nn), r = $("#calcr", c);
      let h = `<div class="kpis"><div><small>Agua corporal total</small><span class="num2">${f(d.act, 1)} L</span><small>0,6 × ${f(p, 0)} kg</small></div>
        <div><small>Agua corporal actual</small><span class="num2">${f(d.aca, 1)} L</span><small>${nn} × ${f(d.act, 1)} / ${f(na, 0)}</small></div>`;
      if (na > nn) h += `<div><small>Déficit de agua libre</small><span class="num2">${f(d.deficit, 2)} L</span><small>ACT − ACA</small></div></div>
        <p>Reposición (clase 6): <b>la mitad en 24 h y el resto en 48 h</b> con <b>dextrosa al 5 %</b>, lenta y controlada: ${f(d.deficit / 2, 2)} L en las primeras 24 h. La corrección brusca puede causar edema cerebral (si hay coma o excitación se sospecha y se usa manitol al 20 %).</p>
        <p class="nota">Exceso de sodio ${LIT}: (Na hallado − Na normal) × 0,6 × peso = ${f(A.excesoNa(p, na, nn), 0)} mEq. La clase maneja la hipernatremia como <b>déficit de agua</b>, no como exceso de sodio a eliminar.</p>`;
      else if (na < nn) h += `<div><small>Déficit de sodio</small><span class="num2">${f(dna, 0)} mEq</span><small>(${nn} − ${f(na, 0)}) × 0,6 × ${f(p, 0)}</small></div></div>
        <p>Suero fisiológico (154 mEq/L): ${f(dna / 154, 2)} L aportarían ese sodio. ${neu ? `Con síntomas neurológicos la clase repone <b>la mitad del déficit (${f(dna / 2, 0)} mEq) por vía endovenosa en las primeras 6 horas</b>.` : "Sin síntomas neurológicos y crónica: restricción hídrica y corrección lenta de la causa."} Corregir despacio evita la desmielinización osmótica pontina.</p>`;
      else h += `<div><small>Déficit</small><span class="num2">0</span></div></div><p>Con Na igual al normal no hay déficit de agua por esta fórmula.</p>`;
      h += `<div class="dif"><b>Discrepancia.</b> Clase 4: con 145 y Na 150 en 36 L el docente escribe ACA 34,2 y déficit 1,8 L; con su fórmula (145 × 36 / 150) sale 34,8 y déficit <b>1,2 L</b>. Clase 6: Na 160 en 60 kg, el docente da ACA ≈ 32 y déficit 4 L; con Na normal 145 la fórmula da 32,6 L y <b>${f(A.deficitAgua(60, 160, 145).deficit, 1)} L</b> (con 140 da 4,5 L). El docente no fija el "Na normal": por eso lo puedes elegir arriba. Gana la fórmula; revisa la aritmética antes de memorizar la cifra.</div>`;
      r.innerHTML = h;
    }
    pintaCalc();
    $("#gp", cont).addEventListener("input", () => { const c = $("#calc", cont); if ($("#cp", c)) { $("#cp", c).value = peso; pintaCalc(); } });

    /* ---- 4 · balance hídrico ---- */
    const bal = $("#bal", cont);
    bal.innerHTML = `<div class="ctrl"><label>Peso (kg) ${num("bp", 60, 3, 200)}</label><label>Ingreso oral+parenteral (ml) ${num("bi", 2000, 0, 8000, 50)}</label>
      <label>Orina (ml) ${num("bo", 1300, 0, 8000, 50)}</label><label>Vómito (ml) ${num("bv", 250, 0, 5000, 50)}</label><label>Diarrea (ml) ${num("bd", 300, 0, 8000, 50)}</label>
      <label>T° axilar ${num("bt", 37, 35, 42, 0.1)}</label></div><div id="balr"></div>`;
    function pintaBal() {
      const p = val(bal, "bp"), ing = val(bal, "bi"), egr = val(bal, "bo") + val(bal, "bv") + val(bal, "bd"), t = val(bal, "bt");
      const b = A.balance(p, ing, egr), fiebre = Math.max(0, t - 37), fx = [fiebre * 150, fiebre * 300];
      const dif = b.dif - (fx[0] + fx[1]) / 2;
      bal.querySelector("#balr").innerHTML = `<div class="kpis"><div><small>Pérdidas insensibles</small><b>${f(b.pi, 0)} ml</b><small>peso × 12</small></div><div><small>Agua endógena</small><b>${f(b.ae, 0)} ml</b><small>PI / 3 (ejemplo del docente)</small></div>
        <div><small>Ganancias</small><b>${f(b.ingTot, 0)} ml</b></div><div><small>Pérdidas</small><b>${f(b.egrTot, 0)} ml</b></div>
        <div><small>Diferencia</small><b class="${b.dif < 0 ? "mal" : "ok"}">${sg(b.dif, 0)} ml</b></div></div>
        <p>${b.dif < 0 ? `<b>Balance negativo: debe reponerse ${f(-b.dif, 0)} ml.</b>` : "Balance positivo o equilibrado."} ${fiebre > 0 ? `La fiebre suma <b>${f(fx[0], 0)}-${f(fx[1], 0)} ml</b> más (150-300 ml por °C sobre 37): balance corregido ≈ ${sg(dif, 0)} ml.` : ""}</p>
        <p class="nota">Otras pérdidas extra de la clase: hiperventilación, 100-200 ml/24 h por cada 5 respiraciones sobre 20; ambiente cálido, ≈ 200 ml por °C sobre la temperatura corporal ambiental. Posoperatorio abdominal: evaporación del campo, 6 ml/kg/h. Diuresis mínima: 600 ml/24 h. Necesidad básica: ≈ 30 ml/kg/día (${f(30 * p, 0)} ml).</p>
        <div class="dif"><b>Discrepancia.</b> El texto dice que el agua endógena es el 20 % de las pérdidas insensibles (${f(b.ae20, 0)} ml), pero el ejemplo resuelto usa PI / 3 = <b>${f(b.ae, 0)} ml</b> (balance −330 ml). Se usa la cifra del ejemplo.</div>`;
    }
    $$("input", bal).forEach(e => e.oninput = pintaBal); pintaBal();
  };

  /* =====================================================================
     PESTAÑA 3 · SODIO Y POTASIO
     ===================================================================== */
  const TR = {
    hipona: { t: "Hiponatremia", cls: "ro", umbral: "Na < 135 mEq/L: exceso de agua en relación al sodio. Síntomas neurológicos < 130; cuadro grave < 125; < 120 riesgo de convulsiones, coma y muerte (mortalidad > 50 % en la aguda).",
      mec: ["Baja el Na del extracelular", "Baja la osmolaridad plasmática", "El agua pasa al intracelular", "Edema cerebral y menor volumen sanguíneo efectivo"],
      causas: ["Renales: diuréticos, síndrome nefrótico/nefrítico, tubulopatías", "Digestivas: vómitos, diarrea, aspiración nasogástrica, obstrucción intestinal", "Piel: quemaduras, sudoración excesiva · otras: peritonitis, broncorrea", "Falta de aporte: dieta hiposódica", "Endocrina: Addison (falta de aldosterona)", "Redistribución: hiperglucemia, baja el Na 1,6 mEq/L por cada 100 mg/dL de glucosa", "Hipovolemia relativa: edema de IC o nefrótico (RAA activado, pero la dilución baja el Na)"],
      clin: ["Pérdida rápida: shock hipovolémico (taquicardia, hipotensión, oliguria)", "Pérdida lenta: debilidad, apatía, anorexia, náuseas, cefalea ortostática, calambres, confusión", "Neurológico grave por edema cerebral"],
      lab: "Hematocrito elevado, Na bajo, K elevado (sobre todo en insuficiencia suprarrenal), bicarbonato y cloro bajos, volumen urinario disminuido con densidad normal.",
      trat: "Aguda o sintomática: suero fisiológico (154 mEq/L); en pérdidas severas (cólera) puede requerirse plasma. Déficit = (Na normal − Na hallado) × 0,6 × peso; la mitad en las primeras 6 h si hay síntomas neurológicos. Crónica asintomática: restricción hídrica y corregir la causa, lentamente (riesgo de desmielinización osmótica pontina)." },
    hiperna: { t: "Hipernatremia", cls: "ro", umbral: "Na > 145 mEq/L: deficiencia de agua en relación al sodio; hipertonicidad extracelular y deshidratación celular. Puede llegar a 160-170; > 170 convulsiones tónico-clónicas y coma.",
      mec: ["Sube el Na del extracelular", "Hiperosmolaridad extracelular", "El agua sale de la célula", "Deshidratación celular y síntomas del SNC"],
      causas: ["Pérdida neta de agua: digestiva, renal (diabetes insípida, diuresis osmótica, manitol), piel (insensibles, sudor), respiratoria (hiperventilación)", "Ganancia de sodio: iatrogénica (NaCl o bicarbonato IV en exceso), dietética (agua de mar, sal masiva)", "Endocrina: Cushing (corticoides retienen sodio), hiperaldosteronismo"],
      clin: ["Síntoma guía: sed intensa", "Fatiga, letargo, fiebre, reflejos lentos, agitación, cefalea", "Grave: convulsiones y coma"],
      lab: "Na sérico > 145 mEq/L (puede llegar a 160-170).",
      trat: "Reponer el déficit de agua libre, lenta y controlada: la mitad en 24 h y el resto en 48 h con dextrosa al 5 %. La corrección brusca causa edema cerebral (si hay coma o excitación: manitol al 20 %)." },
    hipok: { t: "Hipopotasemia", cls: "na", umbral: "K < 3,5 mEq/L. Los síntomas suelen aparecer con K < 2,5; la severa puede dar rabdomiólisis y parálisis respiratoria mortal.",
      mec: ["Entra K⁺ a la célula (insulina, β2, alcalosis, T3/T4) o se pierde K⁺ del cuerpo", "Baja el K plasmático", "Se hiperpolariza la membrana: músculo y corazón responden mal", "Debilidad, íleo, arritmias"],
      causas: ["Ingestión reducida: ayuno, alcoholismo", "Pérdidas digestivas: diarreas, fístulas, mala absorción", "Pérdidas renales: diuréticos de asa y tiazidas, acidosis tubular, hiperaldosteronismo, Cushing, corticoides", "Pérdida cutánea: sudoración", "Desplazamiento al interior de la célula: insulina, alcalosis, hipertiroidismo, catecolaminas β"],
      clin: ["Músculo: debilidad desde miembros inferiores, parálisis flácida, arreflexia, rabdomiólisis", "Corazón: extrasístoles ventriculares, fibrilación ventricular, más sensibilidad a digitálicos", "Músculo liso: íleo paralítico", "Riñón: nefropatía hipopotasémica con alcalosis metabólica · neuropsiquiátrico: confusión, depresión"],
      lab: "ECG: onda P aplanada, T aplanada o invertida, onda U, extrasístoles.",
      trat: "Oral si es moderada (banana 20-22 mEq, naranja 8-10 mEq, KCl). Parenteral si es grave: siempre diluido, máximo 150 mEq/24 h, 40-60 mEq en 1 h en dextrosa 5 %, con diuresis. No dar si hay anuria. Prevención con diuréticos de asa o digitálicos: espironolactona, amilorida, triamtereno." },
    hiperk: { t: "Hiperpotasemia", cls: "ro", umbral: "K > 5,0 mEq/L. Rara con función renal normal. Riesgo de fibrilación ventricular y paro, sobre todo con K > 9. Leve: < 6,5 con ECG normal; grave: > 8 con alteraciones ECG.",
      mec: ["Baja la excreción renal, o K⁺ sale de la célula (acidosis, rabdomiólisis, quemaduras)", "Sube el K plasmático", "Se despolariza la membrana", "Bloqueos, arritmias y debilidad"],
      causas: ["Eliminación renal reducida (la más común): IRA o IRC, oliguria, anuria", "Administración excesiva (iatrogénica)", "Desplazamiento del LIC al LEC: acidosis grave, rabdomiólisis, quemaduras extensas"],
      clin: ["Cardíacas (las más peligrosas): trastornos de la conducción, bloqueos, arritmias, FV, paro", "Neuromusculares: parestesias, debilidad generalizada, disnea", "Digestivas: náuseas, vómitos, dolor abdominal"],
      lab: "ECG: T alta, picuda y simétrica (leve-moderada); luego P aplanada, QRS ancho y arritmias (grave). Urea y creatinina elevadas.",
      trat: "Grave con ECG alterado: (1) antagonizar la cardiotoxicidad: gluconato o cloruro de calcio 10 % IV, en minutos; (2) llevar K⁺ a la célula: insulina + glucosa (10 UI + 50 ml de glucosa 50 %), bicarbonato si hay acidosis; (3) eliminar K⁺: diuréticos de asa, resinas de intercambio, diálisis (definitiva en insuficiencia renal). Leve: suspender el aporte, corregir la acidosis, furosemida." }
  };

  SECC.nak = function (cont) {
    let tr = "hipona";
    cont.innerHTML = `
    <h1>🧂 Sodio y potasio</h1>
    <p class="lema">El <b>sodio</b> es el catión del <b>extracelular</b> y decide dónde está el agua; el <b>potasio</b> es el catión del <b>intracelular</b> (98 % del K corporal) y decide cómo late y se contrae el músculo. Una cifra de laboratorio solo dice la <i>concentración</i>, no el contenido total del cuerpo.</p>
    <div class="caja"><div class="chips" id="trs"></div><div id="trv"></div></div>
    <div class="caja"><h2 style="margin-top:0">🔀 Desplazamientos transcelulares del potasio</h2>
      <p>Mueve cada factor y mira el K⁺ plasmático. Cambian la <b>concentración sin cambiar el contenido corporal total</b>. El sentido de cada factor es de la clase 7; las cifras de cuánto mueve cada uno son ${LIT}.</p>
      <div class="grid2"><div class="caja panel" style="padding:8px"><svg id="ksv" viewBox="0 0 520 300" role="img" aria-label="Iones de potasio entre el interior de la célula y el plasma"></svg></div>
      <div><div class="chips" id="kf"></div>
        <div class="ctrl col"><label>pH sangre <input type="range" id="kph" min="7" max="7.7" step="0.01" value="7.4"><b id="kphv"></b></label>
        <label>Balance total de K <input type="range" id="kbal" min="-600" max="300" step="10" value="0"><b id="kbalv"></b></label></div>
        <div class="letrero" id="kl" style="display:block"></div>
        <p class="nota">Balance negativo: pérdidas por diarrea, diuréticos o poco aporte. Positivo: insuficiencia renal o aporte excesivo. Para ver la huella en el trazado: <a href="../ecg/#electrolitos">simulador ECG, pestaña potasio y calcio</a>.</p></div></div></div>
    <div class="caja"><h2 style="margin-top:0">🧮 Calculadora de osmolaridad plasmática</h2><div id="osm"></div></div>`;

    /* ---- trastornos ---- */
    function pintaTr() {
      const T = TR[tr];
      $("#trv", cont).innerHTML = `<h3>${T.t}</h3><div class="letrero" style="display:block">${T.umbral}</div>
        <h3>Mecanismo</h3><ol class="pasos" id="ps">${T.mec.map(m => `<li>${m}</li>`).join("")}</ol>
        <div class="grid3" style="margin-top:10px"><div class="tarj ${T.cls}"><b class="t">Causas</b><ul class="sin">${T.causas.map(c => `<li>${c}</li>`).join("")}</ul></div>
        <div class="tarj ve"><b class="t">Manifestaciones</b><ul class="sin">${T.clin.map(c => `<li>${c}</li>`).join("")}</ul></div>
        <div class="tarj mo"><b class="t">Laboratorio / ECG</b>${T.lab}</div></div>
        <div class="tarj na" style="margin-top:10px"><b class="t">Tratamiento</b>${T.trat}</div>`;
      const ps = $$("#ps li", cont); let i = 0;
      ps.forEach((li, j) => li.onclick = () => { ps.forEach((x, q) => x.classList.toggle("act", q === j)); });
      const g = U.gen; (function paso() { if (g !== U.gen || !ps.length || !ps[0].isConnected) return; ps.forEach((x, q) => x.classList.toggle("act", q === i % ps.length)); i++; setTimeout(paso, 1700); })();
    }
    U.chips($("#trs", cont), Object.keys(TR).map(k => ({ id: k, t: TR[k].t })), tr, id => { tr = id; pintaTr(); });
    pintaTr();

    /* ---- simulador de K transcelular ---- */
    const F = { ins: false, beta: false, tir: false };
    const FD = [{ id: "ins", t: "💉 Insulina (+glucosa)" }, { id: "beta", t: "🫁 β2 / catecolaminas" }, { id: "tir", t: "🦋 T3 / T4 (hipertiroidismo)" }];
    const kf = $("#kf", cont);
    kf.innerHTML = FD.map(d => `<button class="chip" data-id="${d.id}">${d.t}</button>`).join("");
    $$(".chip", kf).forEach(b => b.onclick = () => { F[b.dataset.id] = !F[b.dataset.id]; b.classList.toggle("act", F[b.dataset.id]); kcalc(); });
    $("#kph", cont).oninput = kcalc; $("#kbal", cont).oninput = kcalc;
    const ksv = $("#ksv", cont);
    ksv.innerHTML = `<rect x="20" y="20" width="240" height="240" rx="18" fill="#bfdbfe" stroke="#1d4ed8" stroke-width="3"/><text x="140" y="285" font-size="14" font-weight="700" text-anchor="middle" fill="var(--tx)">Intracelular (140-150 mEq/L)</text>
      <rect x="280" y="20" width="220" height="240" rx="18" fill="#fecaca" stroke="#b91c1c" stroke-width="3"/><text x="390" y="285" font-size="14" font-weight="700" text-anchor="middle" fill="var(--tx)">Plasma (3,5-5,0 mEq/L)</text>
      <text id="kv" x="390" y="60" font-size="30" font-weight="700" text-anchor="middle" fill="#7f1d1d"></text><text x="390" y="82" font-size="12" text-anchor="middle" fill="#7f1d1d">mEq/L de K⁺</text>
      <g id="kpts"></g><path d="M262 140 H278" stroke="var(--tx)" stroke-width="3"/>`;
    const N = 42, pts = [];
    const kg = $("#kpts", ksv);
    for (let i = 0; i < N; i++) {
      const c = U.mk("circle", { r: 8, fill: "#f59e0b", stroke: "#92400e", "stroke-width": 1.5 }); kg.appendChild(c);
      const ci = i % 6, ri = Math.floor(i / 6);
      pts.push({ el: c, ix: 45 + ci * 36, iy: 50 + ri * 28, ex: 305 + (i % 5) * 36, ey: 110 + Math.floor(i / 5) * 18 + (i % 2) * 6, x: 0, y: 0 });
      pts[i].x = pts[i].ix; pts[i].y = pts[i].iy;
    }
    let kObj = 4.2, kVis = 4.2;
    function kcalc() {
      const ph = +$("#kph", cont).value, bal = +$("#kbal", cont).value;
      $("#kphv", cont).textContent = f(ph, 2); $("#kbalv", cont).textContent = sg(bal, 0) + " mEq";
      kObj = A.kPlasma({ bal: bal, ph: ph, insulina: F.ins, beta: F.beta, tiroidea: F.tir });
      const st = A.estadoK(kObj), causas = [];
      if (ph < 7.35) causas.push("la acidosis mete H⁺ a la célula y <b>saca K⁺</b>"); if (ph > 7.45) causas.push("la alcalosis saca H⁺ y <b>mete K⁺</b> a la célula");
      if (F.ins) causas.push("la insulina activa la Na⁺/K⁺-ATPasa y <b>mete K⁺</b>"); if (F.beta) causas.push("los β2 estimulan la bomba y <b>meten K⁺</b>"); if (F.tir) causas.push("T3/T4 estimulan la bomba y <b>meten K⁺</b>");
      if (bal < -30) causas.push("el cuerpo ha <b>perdido K⁺</b> (diarrea, diuréticos, poco aporte)"); if (bal > 30) causas.push("el riñón no lo elimina o se aporta de más: <b>sobra K⁺</b>");
      $("#kl", cont).innerHTML = `<span class="k" style="background:var(--${st.cls})">K ${f(kObj, 1)}</span> <span><b>${st.t}</b>. ${causas.length ? "Porque " + causas.join("; ") + "." : "Todo en equilibrio."}<br>ECG: ${st.ecg}</span>`;
      $("#kv", ksv).textContent = f(kObj, 1);
    }
    kcalc();
    const g0 = U.gen; let t0 = performance.now();
    (function bucle(t) {
      if (g0 !== U.gen) return;
      const dt = Math.min(.05, (t - t0) / 1000); t0 = t; const k = 1 - Math.exp(-dt * 4);
      kVis += (kObj - kVis) * k;
      const nEC = Math.round(A.clamp((kVis - 1.5) / 8 * N * 0.9, 1, N - 4));
      pts.forEach((p, i) => {
        const fuera = i < nEC, tx = fuera ? p.ex : p.ix, ty = fuera ? p.ey : p.iy;
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
        p.el.setAttribute("cx", p.x + Math.sin(t / 500 + i) * 1.5); p.el.setAttribute("cy", p.y + Math.cos(t / 450 + i) * 1.5);
      });
      requestAnimationFrame(bucle);
    })(performance.now());

    /* ---- osmolaridad ---- */
    const od = $("#osm", cont);
    od.innerHTML = `<div class="ctrl"><label>Na (mEq/L) ${num("on", 140, 100, 180)}</label><label>Glucosa (mg/dL) ${num("og", 90, 40, 1200, 5)}</label><label>BUN / urea (mg/dL) ${num("ou", 14, 1, 200)}</label></div><div id="osr"></div>`;
    function pintaOsm() {
      const na = val(od, "on"), glu = val(od, "og"), bun = val(od, "ou");
      const o1 = A.osmSimple(na), o2 = A.osmCompleta(na, glu, bun), oe = A.osmEfectiva(na, glu), nc = A.naCorregido(na, glu);
      const cl = A.claseOsm(o2), pos = A.clamp((o2 - 250) / 120 * 100, 0, 100);
      od.querySelector("#osr").innerHTML = `<div class="kpis"><div><small>Na × 2 + 10 (rápida)</small><span class="num2">${f(o1, 0)}</span><small>mOsm/L</small></div>
        <div><small>2 Na + glu/18 + BUN/2,8</small><span class="num2">${f(o2, 0)}</span><small>mOsm/L</small></div>
        <div><small>Efectiva (sin urea) ${LIT}</small><span class="num2">${f(oe, 0)}</span><small>mOsm/L</small></div>
        <div><small>Na corregido por glucosa</small><span class="num2">${f(nc, 0)}</span><small>+1,6 por cada 100 mg/dL sobre 100</small></div></div>
        <div style="position:relative;height:16px;margin:12px 0 4px;border-radius:8px;background:linear-gradient(90deg,#3b82f6 0 25%,#22c55e 25% 50%,#ef4444 50% 100%)"><div style="position:absolute;left:${pos}%;top:-5px;width:6px;height:26px;background:var(--tx);border-radius:3px;transform:translateX(-3px)"></div></div>
        <div class="nota" style="display:flex;justify-content:space-between"><span>250</span><span>280</span><span>310</span><span>370</span></div>
        <p>Osmolaridad <b>${cl}</b> (normal 280-310 mOsm/L). ${cl === "baja" ? "Baja: el agua entra a la célula (riesgo de edema cerebral)." : cl === "alta" ? "Alta: el agua sale de la célula (deshidratación celular)." : "Normal: sin gradiente."}
        ${glu > 200 ? ` Con glucosa ${f(glu, 0)} el Na medido de ${f(na, 0)} está <i>diluido</i>: la glucosa arrastra agua al extracelular. Si lo corriges serían ${f(nc, 0)}.` : ""}</p>
        <p class="nota">La clase usa Na × 2 + 10 (Na 140 → 290). La fórmula con glucosa y BUN es la de la pregunta de repaso; descontar la urea para la tonicidad efectiva es ${LIT}.</p>`;
    }
    $$("input", od).forEach(e => e.oninput = pintaOsm); pintaOsm();
  };
})();
