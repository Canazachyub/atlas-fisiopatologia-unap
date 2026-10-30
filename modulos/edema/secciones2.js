/* Starling y edema — pestañas «Explicación» y «🎯 Ponte a prueba». */
(function () {
  "use strict";
  const U = window.UTIL, E = U.E, f = U.f, LIT = U.LIT, $ = U.$, $$ = U.$$, SECC = window.SECC;
  const { CASOS, FUERZA_TXT } = window.EDC;
  const NOM = { Pv: "presión hidrostática capilar", alb: "presión oncótica del plasma", perm: "permeabilidad capilar", Pi: "presión hidrostática intersticial", pii: "presión oncótica intersticial", lin: "drenaje linfático" };

  /* =====================================================================
     PESTAÑA 4 · EXPLICACIÓN (qué, cómo, por qué, para qué)
     ===================================================================== */
  SECC.explicacion = function (sec) {
    sec.innerHTML = `
      <h1>💡 Explicación</h1>
      <div class="grid3">
        <div class="tarj"><b class="t">¿Qué es el edema?</b>Acumulación de líquido en el espacio intersticial (o dentro de las células): en el tejido subcutáneo, en órganos (pulmón, cerebro, mucosa intestinal) y en cavidades serosas. Se llama <b>anasarca</b> cuando es generalizado (&gt; 5 L); el <b>pre-edema</b> es menor de 5 L (o &lt; 10 % del peso) y aún no deja fóvea.</div>
        <div class="tarj"><b class="t">¿Cómo se forma?</b>Entre el capilar y el intersticio el agua cruza según las <b>fuerzas de Starling</b>. Lo que sale se compara con lo que vuelve y con lo que retira el linfático. Cuando sale más de lo que se puede devolver y drenar, el intersticio se llena.</div>
        <div class="tarj"><b class="t">¿Por qué?</b>El docente enumera cinco factores: ↑ presión hidrostática intravascular, ↓ presión oncótica del plasma, ↑ permeabilidad capilar, ↑ presión oncótica intersticial y obstrucción linfática. Cada enfermedad rompe uno (o varios).</div>
        <div class="tarj"><b class="t">¿Para qué sirve saberlo?</b>Para deducir la causa por la clínica (dónde, cuándo, qué consistencia, qué acompaña) y para elegir el tratamiento: bajar la presión (diuréticos, vasodilatadores), subir la oncótica, tratar la inflamación o liberar el drenaje.</div>
      </div>
      <h2>La balanza en una línea</h2>
      <div class="caja">
        <p style="font-size:18px;text-align:center"><b>Filtración neta ∝ (Pc − Pi) − σ · (π<sub>plasma</sub> − π<sub>intersticio</sub>)</b></p>
        <ul class="sin">
          <li><b>Pc</b>, presión hidrostática capilar: empuja el agua <b>hacia afuera</b>. Baja de la arteriola a la vénula.</li>
          <li><b>π plasma</b>, presión oncótica (la hace sobre todo la <b>albúmina</b>): retiene el agua <b>dentro</b>. En la clase vale <b>25 mmHg</b> y la albúmina normal es 4-5 g/dL.</li>
          <li><b>σ</b>, qué tan bien retiene proteínas la pared (baja si sube la permeabilidad). <b>Pi</b> y <b>π intersticio</b> son las fuerzas del tejido.</li>
          <li><b>Linfa</b>: devuelve a la sangre lo que sobra. Si no alcanza, hay edema.</li>
        </ul>
        <p class="nota">Cifras de la clase: presión capilar pulmonar normal ≈ 10 mmHg (25-30 en EAP cardiogénico), oncótica del plasma 25 mmHg, albúmina &lt; 2,5 g/dL para edema. Presión capilar sistémica 35→15 mmHg, Pi, π intersticial, linfa y conversión albúmina→mmHg: ${LIT}. La visión moderna (capa de glicocálix) matiza que la reabsorción venosa es mínima: en la clase se usa el esquema clásico.</p>
      </div>
      <h2>Los cinco factores y sus enfermedades</h2>
      <div class="caja"><table>
        <tr><th>Factor</th><th>Qué pasa</th><th>Ejemplos de la clase</th></tr>
        <tr><td>↑ Presión hidrostática</td><td>El aumento de presión venosa se transmite hacia atrás al capilar; la retención de Na+ y H2O suma volumen</td><td>Insuficiencia cardiaca, TVP, esclavina, nefrítico, cirrosis (portal), embarazo, postural, Cushing, EAP cardiogénico</td></tr>
        <tr><td>↓ Presión oncótica</td><td>Falta albúmina (&lt; 2,5 g/dL): el agua ya no es retenida</td><td>Nefrótico, cirrosis, desnutrición, enteropatías con pérdida de proteínas</td></tr>
        <tr><td>↑ Permeabilidad</td><td>El endotelio deja pasar agua y proteínas</td><td>Alergia (histamina, cininas), celulitis, hipoxia, sepsis/SDRA, EAP de altura</td></tr>
        <tr><td>↑ Oncótica intersticial</td><td>El tejido atrae agua (mucopolisacáridos o proteínas atrapadas)</td><td>Mixedema (sin fóvea)</td></tr>
        <tr><td>Obstrucción linfática</td><td>No se retira el exceso</td><td>Linfedema, filariasis, ganglios tumorales, ligadura quirúrgica (edema duro, sin fóvea)</td></tr>
        <tr><td>↓ Presión intersticial</td><td>El tejido «succiona» el líquido</td><td>Edema neurológico (atrofia muscular de la hemiplejía)</td></tr></table></div>
      <h2>Cómo sacarle partido al simulador</h2>
      <div class="caja"><ol class="sin">
        <li>En <b>Capilar vivo</b>, sube la presión venosa y mira cómo el agua deja de volver en el extremo venoso.</li>
        <li>Baja la albúmina: el edema aparece aunque la presión sea normal. Súbela y el líquido vuelve.</li>
        <li>Sube la permeabilidad: aparecen proteínas amarillas fuera del capilar y la oncótica pierde fuerza.</li>
        <li>Baja el drenaje linfático: la presión es normal y aun así el líquido se acumula.</li>
        <li>Cambia a <b>capilar pulmonar</b> y sube la presión a 25-30 mmHg: el edema pasa de intersticial a alveolar.</li>
      </ol></div>
      <h2>Repasa de memoria</h2>
      <div id="fc"></div>`;
    const FC = [
      ["¿Qué fuerzas de Starling tiene la clase como causas del edema?", "Aumento de la presión hidrostática intravascular, disminución de la presión oncótica plasmática, aumento de la permeabilidad capilar, aumento de la presión oncótica intersticial y obstrucción linfática."],
      ["¿Cuál es el mecanismo del edema cardiaco?", "1) Presión retrógrada: hipertensión venosa → ↑ presión hidrostática capilar. 2) Menos flujo renal → SRAA → retención de Na+ y H2O → hipervolemia."],
      ["¿Qué distingue el edema nefrótico del nefrítico?", "Nefrótico: pérdida de albúmina (↓ oncótica), anasarca, proteinuria &gt; 3,5 g/24 h. Nefrítico: retención de Na+ y H2O por ↓ TFG (↑ hidrostática), edema discreto, hematuria e hipertensión; la albúmina es normal."],
      ["¿Qué fuerza falla en la cirrosis?", "Oncótica (falla de síntesis de albúmina), hidrostática (hipertensión portal) y retención de Na+ y H2O (hiperaldosteronismo secundario): ascitis."],
      ["¿Por qué el mixedema no deja fóvea?", "Por depósito de mucopolisacáridos en el intersticio (↑ oncótica local): edema elástico, no depresible."],
      ["¿Cómo se diferencia el EAP cardiogénico del de altura?", "En el cardiogénico la presión capilar pulmonar sube (de 10 a 25-30 mmHg); en el de altura la presión capilar es normal y falla la permeabilidad (hipoxia, vasoconstricción desigual, histamina); el oxígeno lo revierte."],
      ["¿Dónde y cómo se busca la fóvea?", "Con el dedo índice sobre un plano óseo (cara anterior de la tibia, maléolo o sacro), nunca sobre la pantorrilla. Se informa de 1 a 4 cruces según la profundidad."],
      ["¿Qué pasa con el edema unilateral de miembro inferior?", "En el 80-90 % es TVP (Virchow: estasis, lesión endotelial, hipercoagulabilidad); se confirma con Doppler. Riesgo: tromboembolia pulmonar."]
    ];
    $("#fc", sec).innerHTML = FC.map(q => `<details class="caja" style="cursor:pointer"><summary><b>${q[0]}</b></summary><p>${q[1]}</p></details>`).join("");
  };

  /* =====================================================================
     PESTAÑA 5 · 🎯 PONTE A PRUEBA
     ===================================================================== */
  SECC.prueba = function (sec) {
    sec.innerHTML = `
      <h1>🎯 Ponte a prueba</h1>
      <p class="lema">Lee el caso. Paso 1: ¿qué fuerza de Starling se alteró? Paso 2: ¿qué esperas ver en el paciente? Corrige al instante y explica por qué.</p>
      <div class="caja"><span class="nota" id="marc"></span></div>
      <div id="q"></div>`;
    let cola = [], n1 = 0, n2 = 0, tot = 0;
    function marcador() { $("#marc", sec).innerHTML = `Casos: <b>${tot}</b> · Fuerza acertada: <b class="${n1 ? "ok" : ""}">${n1}</b> · Hallazgo acertado: <b class="${n2 ? "ok" : ""}">${n2}</b>`; }
    function siguiente() {
      if (!cola.length) cola = U.barajar(CASOS);
      const c = cola.pop(); paso1(c);
    }
    function paso1(c) {
      const op = U.barajar(["Pv", "alb", "perm", "pii", "lin", "Pi"]);
      $("#q", sec).innerHTML = `
        <div class="caja"><span class="chip act" style="cursor:default">Caso · ${c.circ === "pul" ? "pulmón" : "paciente"}</span>
          <p style="font-size:17px;margin:8px 0">${c.vineta}</p>
          <h3>1 · ¿Qué fuerza de Starling se alteró primero?</h3>
          <div class="opciones" id="op">${op.map(k => `<button data-k="${k}">${FUERZA_TXT[k]}</button>`).join("")}</div>
          <div id="fb"></div></div>`;
      $$("#op button", sec).forEach(b => b.onclick = () => {
        const k = b.dataset.k, ok = k === c.prin;
        $$("#op button", sec).forEach(x => { x.disabled = true; if (x.dataset.k === c.prin) x.classList.add("bien"); });
        if (!ok) b.classList.add("mal"); else n1++;
        marcador();
        const C = E.CIRC[c.circ], nn = E.NORMAL(C);
        let porque = "";
        if (!ok) {
          const alt = E.alteradas(c.p, C).includes(k);
          porque = alt ? `La ${NOM[k]} también está alterada en este caso, pero es secundaria: no es lo que lo desencadena.` : `En este caso la ${NOM[k]} está normal${k === "Pv" ? "" : ""}: no explica el cuadro.`;
        }
        $("#fb", sec).innerHTML = `<div class="dif" style="border-left-color:${ok ? "var(--ve)" : "var(--ro)"}"><b>${ok ? "Correcto." : "No."}</b> Falla: <b>${FUERZA_TXT[c.prin]}</b>${c.sec.length ? ` (y también ${c.sec.map(s => NOM[s]).join(", ")})` : ""}. ${porque}<br>${c.explica}</div>
          <div class="ctrl"><button class="btn az" id="sig">Paso 2 →</button></div>`;
        $("#sig", sec).onclick = () => paso2(c);
      });
    }
    function paso2(c) {
      const cand = CASOS.filter(x => x.prin !== c.prin);
      const otros = U.barajar(cand.filter(x => x.circ === c.circ)).concat(U.barajar(cand.filter(x => x.circ !== c.circ))).slice(0, 3);
      const opc = U.barajar([c].concat(otros));
      $("#q", sec).insertAdjacentHTML("beforeend", `
        <div class="caja" id="p2"><h3>2 · ¿Qué esperas ver?</h3>
          <div class="opciones" id="op2">${opc.map(x => `<button data-id="${x.id}">${x.hallazgo}</button>`).join("")}</div><div id="fb2"></div></div>`);
      $("#p2", sec).scrollIntoView({ behavior: "smooth", block: "nearest" });
      $$("#op2 button", sec).forEach(b => b.onclick = () => {
        const ok = b.dataset.id === c.id;
        $$("#op2 button", sec).forEach(x => { x.disabled = true; if (x.dataset.id === c.id) x.classList.add("bien"); });
        if (!ok) b.classList.add("mal"); else n2++;
        tot++; marcador();
        const elegido = CASOS.find(x => x.id === b.dataset.id);
        const C = E.CIRC[c.circ], eq = E.equilibrio(c.p, C);
        $("#fb2", sec).innerHTML = `<div class="dif" style="border-left-color:${ok ? "var(--ve)" : "var(--ro)"}"><b>${ok ? "Correcto." : "No."}</b>
          ${ok ? "" : `Eso es lo que verías en <b>${elegido.nombre}</b> (falla: ${FUERZA_TXT[elegido.prin]}). `}En <b>${c.nombre}</b>: ${c.hallazgo.toLowerCase()}.</div>
          <p><b>Lo que dijo la clase.</b> ${c.clase}</p>
          <p class="nota">En el modelo: el intersticio llega a ≈ ${f(eq.V, C.id === "sis" ? 1 : 2)} L · ${E.estado(eq.V, C).txt}.</p>
          <div class="ctrl"><button class="btn az" id="ver">💧 Verlo en el capilar</button><button class="btn" id="otro">Otro caso →</button></div>`;
        $("#ver", sec).onclick = () => U.cargar(c);
        $("#otro", sec).onclick = siguiente;
      });
    }
    marcador(); siguiente();
  };
})();
