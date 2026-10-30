/* Gasometría — pestañas 4 (Lectura en pasos), 5 (Explicación) y 6 (Ponte a prueba). */
(function () {
  "use strict";
  const U = window.UTIL, A = U.A, f = A.f, LIT = A.LIT, $ = U.$, $$ = U.$$, SECC = window.SECC;
  const lista = arr => `<ul class="sin">${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const gasom = (c) => `<div class="gasom">
      <div><small>pH</small><b>${f(c.pH, 2)}</b></div><div><small>PaCO₂ mmHg</small><b>${f(c.pco2)}</b></div><div><small>HCO₃⁻ mEq/L</small><b>${f(c.hco3, 1)}</b></div>
      ${c.na != null ? `<div><small>Na⁺</small><b>${f(c.na)}</b></div><div><small>Cl⁻</small><b>${f(c.cl)}</b></div>` : ""}${c.k != null ? `<div><small>K⁺</small><b>${f(c.k, 1)}</b></div>` : ""}</div>`;

  /* =====================================================================
     PESTAÑA 4 · LECTURA EN PASOS
     ===================================================================== */
  SECC.lectura = function (main) {
    main.innerHTML = `<h1>📋 Lectura de una gasometría en pasos</h1>
      <p class="lema">Siempre el mismo orden: <b>pH → primario → compensación → anión gap → delta</b>. Carga un caso o mueve los valores y ve los pasos uno por uno; intenta adivinar cada paso antes de abrirlo.</p>
      <div class="grid2"><div>
        <div class="caja"><div class="ctrl col">
          ${U.slider("co", "PaCO₂ (mmHg)", 10, 100, 1, 40)}${U.slider("hc", "HCO₃⁻ (mEq/L)", 3, 50, 0.5, 24)}
          ${U.slider("na", "Na⁺ (mEq/L)", 120, 160, 1, 140)}${U.slider("cl", "Cl⁻ (mEq/L)", 80, 130, 1, 104)}${U.slider("al", "Albúmina (g/dL)", 1, 5, 0.1, 4)}</div>
          <div class="ctrl"><label><input type="checkbox" id="usag" checked> incluir Na⁺ y Cl⁻</label><label><input type="checkbox" id="mix"> casos mixtos ${LIT}</label></div>
          <div class="ctrl"><button class="btn az" id="azar">🎲 Caso al azar</button><button class="btn sec" id="rei">↺ Normal</button></div>
          <div id="gs"></div></div>
        <div class="caja nota" id="hist"></div></div>
        <div><div class="ctrl"><button class="btn" id="sig">Siguiente paso ▶</button><button class="btn sec" id="todo">Mostrar todo</button><button class="btn sec" id="ocul">Ocultar</button></div>
          <div id="pasos" style="display:grid;gap:8px"></div></div></div>`;
    let n = 1, hist = "";
    const g = id => $("#" + id, main);
    const vals = () => {
      const o = { pco2: +g("co").value, hco3: +g("hc").value };
      if (g("usag").checked) { o.na = +g("na").value; o.cl = +g("cl").value; o.alb = +g("al").value; }
      return o;
    };
    function act() {
      ["co", "hc", "na", "cl"].forEach(k => g(k + "v").textContent = g(k).value); g("alv").textContent = f(+g("al").value, 1);
      ["na", "cl", "al"].forEach(k => g(k).disabled = !g("usag").checked);
      const v = vals(), L = A.leer(v);
      g("gs").innerHTML = gasom({ pH: L.pH, pco2: v.pco2, hco3: v.hco3, na: v.na, cl: v.cl });
      g("hist").innerHTML = hist;
      g("pasos").innerHTML = L.pasos.map((p, i) => i < n ?
        `<div class="tarj ${p.cls}"><b class="t">${p.t}</b>${p.h}</div>` :
        `<div class="tarj" style="opacity:.55;border-left-color:var(--borde)"><b class="t">${p.t}</b>🔒 ¿Qué crees? Pulsa «Siguiente paso».</div>`).join("");
      g("sig").disabled = n >= 6;
    }
    ["co", "hc", "na", "cl", "al"].forEach(k => g(k).oninput = () => { hist = ""; act(); });
    g("usag").onchange = act;
    g("sig").onclick = () => { n = Math.min(6, n + 1); act(); };
    g("todo").onclick = () => { n = 6; act(); };
    g("ocul").onclick = () => { n = 1; act(); };
    g("rei").onclick = () => { g("co").value = 40; g("hc").value = 24; g("na").value = 140; g("cl").value = 104; g("al").value = 4; hist = ""; n = 1; act(); };
    g("azar").onclick = () => {
      const c = A.generarCaso(Math.random, { mixtos: g("mix").checked });
      g("co").value = c.pco2; g("hc").value = c.hco3; g("na").value = c.na; g("cl").value = c.cl; g("al").value = 4; g("usag").checked = true;
      hist = `<b>Cuadro:</b> ${c.causa.hist}<br><span class="nota">(El diagnóstico aparece en el paso 6.) K⁺ ${c.k != null ? f(c.k, 1) : "—"} mEq/L.</span>`; n = 1; act();
    };
    U.repintar = act; act();
  };

  /* =====================================================================
     PESTAÑA 5 · EXPLICACIÓN
     ===================================================================== */
  SECC.explicacion = function (main) {
    const D = A.DES;
    main.innerHTML = `<h1>💡 Explicación</h1>
      <div class="grid2">
        <div class="tarj"><b class="t">¿Qué es?</b>El equilibrio ácido-base mantiene el <b>pH de la sangre arterial en 7,35-7,45</b> aunque el cuerpo produzca ácidos todo el día: <b>volátiles</b> (el CO₂ del metabolismo, que sale por el pulmón) y <b>fijos</b> (láctico, cetonas, úrico: salen por el riñón). Una gasometría mide tres cosas ligadas entre sí: pH, PaCO₂ y HCO₃⁻.</div>
        <div class="tarj ve"><b class="t">¿Cómo funciona?</b>Tres defensas, de más rápida a más lenta: el <b>tampón bicarbonato</b> (inmediato), el <b>pulmón</b> que cambia cuánto CO₂ saca (minutos) y el <b>riñón</b> que reabsorbe todo el bicarbonato filtrado y genera bicarbonato nuevo botando H⁺ (orina a pH ≈ 4; horas a días). Por eso el HCO₃⁻ está normal en lo agudo y alto en lo crónico.</div>
        <div class="tarj mo"><b class="t">¿Por qué se mueve el pH?</b>Porque el pH depende de la <b>relación</b> HCO₃⁻ / CO₂ ${LIT}: normal 24 / (0,03 × 40) = 20 a 1. Si baja el HCO₃⁻ o sube el CO₂, la relación cae y el pH baja; al revés, sube. La compensación es mover el <i>otro</i> lado para recuperar la relación: nunca corrige del todo, solo acerca. Por eso el primario es el que va en la misma dirección que el pH.</div>
        <div class="tarj na"><b class="t">¿Para qué sirve?</b>Para decidir qué hacer: si es metabólica se busca el ácido o la pérdida de bicarbonato (anión gap); si es respiratoria se ventila y se trata el pulmón o el SNC. El bicarbonato IV solo se da con pH &lt; 7,20 y HCO₃⁻ &lt; 10 (déficit = 0,5 × kg × (24 − HCO₃⁻)); en la acidosis respiratoria casi nunca (pH &lt; 7,10 refractario).</div>
      </div>
      <h2>Los cuatro trastornos de un vistazo</h2>
      <div class="caja" style="overflow-x:auto"><table><tr><th>Trastorno</th><th>pH</th><th>Primario</th><th>Compensa</th><th>Causas (clase)</th></tr>
        ${["AM", "AlM", "AR", "AlR"].map(k => {
          const cs = Object.keys(A.CAUSAS).filter(x => x.indexOf(k === "AM" ? "AM_" : k === "AlM" ? "AlM" : k === "AR" ? "AR_" : "AlR_") === 0).reduce((a, x) => a.concat(A.CAUSAS[x]), []).map(c => c.txt.replace(/ \(.*\)/, ""));
          return `<tr><td><b>${D[k].nombre}</b></td><td>${D[k].sentido === "acid" ? "&lt; 7,35" : "&gt; 7,45"}</td><td>${D[k].prim}</td><td>${D[k].compensa}</td><td>${cs.join(", ")}</td></tr>`;
        }).join("")}</table></div>
      <h2>Valores normales (Clase 8)</h2>
      <div class="caja"><div class="gasom"><div><small>pH</small><b>7,35-7,45</b></div><div><small>PaCO₂</small><b>40</b><small>36-44 (Clase 9: 35-45)</small></div><div><small>HCO₃⁻</small><b>22-26</b><small>media 24</small></div><div><small>BE</small><b>±2,5</b></div><div><small>PaO₂</small><b>80-100</b></div><div><small>SaO₂</small><b>95-98 %</b><small>nivel del mar</small></div></div>
      <div class="dif"><b>Discrepancias entre clases:</b> (1) PaCO₂ normal: 36-44 en la Clase 8 y 35-45 en la Clase 9; se usa la Clase 9 para clasificar. (2) Acidosis: pH &lt; 7,35 en la Clase 8, pero la Clase 9 define la acidosis respiratoria con pH &lt; 7,32. (3) Acidosis metabólica «grave»: pH &lt; 7,22 (descripción) frente a pH &lt; 7,20 (indicación de bicarbonato). (4) En el ejemplo del déficit la clase calcula 450 mEq y luego dice 400 mL.</div></div>
      <h2>El potasio y el pH (Clase 7)</h2>
      <div class="grid2"><div class="tarj ro"><b class="t">Acidosis → hiperpotasemia</b>Sobran H⁺ fuera de la célula: entran H⁺ y salen K⁺ al espacio extracelular. Por eso la acidosis metabólica aguda sube el K⁺. (La diarrea es la excepción visible: pierde K⁺ por las heces, 30-35 mEq/L, Clase 4.)</div>
      <div class="tarj mo"><b class="t">Alcalosis → hipopotasemia</b>Salen H⁺ y entra K⁺. Y a la vez la hipopotasemia hace entrar H⁺, genera alcalosis intracelular y el riñón bota más H⁺: la hipopotasemia <b>mantiene</b> la alcalosis metabólica. Por eso se repone KCl.</div></div>
      <h2>Lámina 41: asma, CO₂ y fatiga</h2>
      <div class="caja"><p>En la crisis de asma el CO₂ cuenta la historia. Elige la fase:</p><div class="chips" id="asma"></div><div id="asr"></div></div>
      <h2>Tratamiento según la clase</h2>
      <div class="caja"><table>${["AM", "AlM", "AR", "AlR"].map(k => `<tr><td><b>${D[k].nombre}</b></td><td>${D[k].tto}</td></tr>`).join("")}</table></div>
      <h2>Trucos para recordar</h2>
      <div class="grid3"><div class="tarj"><b class="t">Primario = el que sigue al pH</b>pH ↓ con HCO₃⁻ ↓ → metabólica. pH ↓ con CO₂ ↑ → respiratoria. Lo demás es compensación.</div>
      <div class="tarj"><b class="t">CLARA</b>Gap aumentado: Cetoacidosis, Láctica, Alcohol, Renal. La diarrea es la excepción (gap normal).</div>
      <div class="tarj"><b class="t">Aguda = HCO₃⁻ normal</b>El riñón tarda días. Crónica = HCO₃⁻ cambiado (alto en la acidosis).</div></div>`;
    const fases = [
      { id: "ini", t: "1 · Crisis inicial", pco2: 28, hco3: 23, txt: "El bronquio se cierra, hay hipoxemia y el paciente <b>hiperventila</b>: PaCO₂ baja y el pH sube (alcalosis respiratoria aguda)." },
      { id: "nor", t: "2 · PaCO₂ «normal»", pco2: 40, hco3: 24, txt: "Parece que mejoró, pero en plena crisis una PaCO₂ normal es <b>ominosa</b>: el paciente empieza a agotarse y ya no compensa con hiperventilación." },
      { id: "fat", t: "3 · Fatiga y paro", pco2: 55, hco3: 25, txt: "La PaCO₂ pasa de 45: hipercapnia con acidosis respiratoria (<b>insuficiencia respiratoria tipo II</b>). La clase la usa: 46 mmHg = fatiga muscular con riesgo de paro." }
    ];
    U.chips($("#asma", main), fases, "", id => {
      const p = fases.find(x => x.id === id), v = { pco2: p.pco2, hco3: p.hco3 }; v.pH = A.ph(v.hco3, v.pco2);
      $("#asr", main).innerHTML = gasom(v) + `<p>${p.txt} <b>${A.leer(v).diag}.</b></p>`;
    });
    $("#asr", main).innerHTML = `<p class="nota">Pulsa una fase.</p>`;
  };

  /* =====================================================================
     PESTAÑA 6 · PONTE A PRUEBA
     ===================================================================== */
  SECC.prueba = function (main) {
    main.innerHTML = `<h1>🎯 Ponte a prueba</h1>
      <p class="lema">Cada caso es una gasometría generada al azar a partir de los trastornos y causas de la clase. Respondes tres preguntas: <b>primario → detalle → causa</b>. Te corrijo al instante y te explico por qué.</p>
      <div class="ctrl"><label><input type="checkbox" id="mix"> incluir trastornos mixtos ${LIT}</label><button class="btn sec" id="nuevo">🎲 Otro caso</button>
        <span class="chip" id="pun">0 / 0</span><span class="chip" id="rac">racha 0</span></div>
      <div class="barra-t"><i id="prog"></i></div>
      <div class="caja" id="caso"></div><div id="preg"></div><div id="fb"></div>`;
    const g = id => $("#" + id, main);
    let cs, qi, st = { ok: 0, tot: 0, racha: 0, mejor: 0 }, respondida;
    function nuevo() { cs = A.generarCaso(Math.random, { mixtos: g("mix").checked }); qi = 0; respondida = false; render(); }
    function marcador() { g("pun").textContent = `${st.ok} / ${st.tot}`; g("rac").textContent = `racha ${st.racha} (mejor ${st.mejor})`; g("prog").style.width = (qi / 3 * 100) + "%"; }
    function render() {
      g("caso").innerHTML = `<h3>Gasometría arterial</h3>${gasom(cs)}<p class="nota" style="margin:6px 0 0">${qi >= 2 ? `<b>Cuadro:</b> ${cs.causa.hist}` : "El cuadro clínico aparece en la pregunta 3."}</p>`;
      const q = cs.preguntas[qi];
      g("preg").innerHTML = `<div class="caja"><h3>Pregunta ${qi + 1} de 3</h3><p><b>${q.q}</b></p><div class="opciones">${q.opts.map((o, i) => `<button data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}</div></div>`;
      g("fb").innerHTML = "";
      $$("#preg .opciones button", main).forEach(b => b.onclick = () => responder(+b.dataset.i));
      respondida = false; marcador();
    }
    function responder(i) {
      if (respondida) return; respondida = true;
      const q = cs.preguntas[qi], bien = i === q.ok;
      st.tot++; if (bien) { st.ok++; st.racha++; st.mejor = Math.max(st.mejor, st.racha); } else st.racha = 0;
      $$("#preg .opciones button", main).forEach((b, k) => { b.classList.toggle("bien", k === q.ok); b.classList.toggle("mal", k === i && !bien); b.disabled = true; });
      const ult = qi === 2;
      g("fb").innerHTML = `<div class="tarj ${bien ? "ve" : "ro"}"><b class="t">${bien ? "✔ Correcto" : "✘ No era esa"}</b>${bien ? "" : `<p>Respuesta: <b>${q.opts[q.ok]}</b>.</p>`}<p>${q.expl}</p></div>` +
        (ult ? `<div class="caja"><h3>Lectura completa de este caso</h3><div style="display:grid;gap:8px">${cs.lectura.pasos.map(p => `<div class="tarj ${p.cls}"><b class="t">${p.t}</b>${p.h}</div>`).join("")}</div></div>` : "") +
        `<div class="ctrl"><button class="btn az" id="sg">${ult ? "🎲 Otro caso" : "Siguiente pregunta ▶"}</button></div>`;
      marcador();
      g("sg").onclick = () => { if (ult) nuevo(); else { qi++; render(); } };
      g("sg").scrollIntoView({ block: "nearest" });
    }
    g("nuevo").onclick = nuevo;
    nuevo();
  };
})();
