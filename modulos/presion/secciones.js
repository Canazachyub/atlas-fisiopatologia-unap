/* Presión arterial interactiva — pestañas: clasificación, determinantes, explicación y «Ponte a prueba».
   Usa window.PA (motor.js) y window.UTIL / window.SECC (app.js). */
(function () {
  "use strict";
  const PA = window.PA, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$;
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const num = (id, def) => { const v = parseFloat($(id).value); return isFinite(v) ? v : def; };

  /* =====================================================================================
     PESTAÑA 2 · CLASIFICACIÓN
     ===================================================================================== */
  const EJEMPLOS = [[118, 78, "Ideal"], [127, 82, "Normal"], [135, 87, "Limítrofe"], [150, 95, "Grado I"], [170, 105, "Grado II"], [190, 115, "Grado III"],
    [150, 80, "150/80 anciano"], [170, 70, "Sistólica aislada"], [85, 55, "Hipotensión"], [130, 70, "Ficha: PAM 90"], [140, 70, "Ficha: divergente"]];
  const EDADES = [["Recién nacido", "75/40"], ["Niño de 10 años", "90/60"], ["Adolescente", "100/60"], ["Adulto joven (20-40 años)", "120/80"], ["Adulto medio (40-60 años)", "140/90"], ["Adulto mayor (> 60 años)", "160/90"]];

  SECC.clasificacion = function (main) {
    main.innerHTML = `<h1>📊 Clasificación de la presión</h1>
      <p class="lema">Escribe una presión y mira en qué categoría cae según las tablas de la clase. Se muestran <b>las dos guías lado a lado</b> (Semiología y Fisiopatología) porque difieren en dos casilleros. Debajo se calculan la <b>presión diferencial</b> y la <b>PAM</b> con las fórmulas del docente.</p>
      <div class="caja"><div class="ctrl">
        <label>PAS <input class="entrada" id="s" type="number" inputmode="numeric" value="150" min="40" max="300"></label>
        <label>PAD <input class="entrada" id="d" type="number" inputmode="numeric" value="95" min="20" max="200"></label>
        <span class="nota">mmHg</span></div>
        <div class="ctrl"><label>PAS <input type="range" id="rs" min="60" max="240" value="150"></label><label>PAD <input type="range" id="rd" min="30" max="140" value="95"></label></div>
        <div class="chips" id="ej">${EJEMPLOS.map((e, i) => `<button class="chip" data-i="${i}">${e[0]}/${e[1]} · ${e[2]}</button>`).join("")}</div></div>
      <div id="avisos"></div>
      <div class="grid2" id="guias" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"></div>
      <h2>Presión diferencial y presión arterial media</h2>
      <div class="grid3" id="deriv"></div>
      <h2>Hipotensión postural</h2>
      <div class="caja"><p class="nota" style="margin-top:0">Se mide echado tras <b>5 minutos</b> de reposo y de pie tras <b>3 minutos</b>. Es positiva si la sistólica cae <b>20 mmHg</b> o la diastólica <b>10 mmHg</b>.</p>
        <div class="ctrl"><label>Echado <input class="entrada" id="ps" type="number" value="110"> / <input class="entrada" id="pd" type="number" value="80"></label>
          <label>De pie <input class="entrada" id="qs" type="number" value="85"> / <input class="entrada" id="qd" type="number" value="50"></label></div>
        <div id="post"></div></div>
      <details class="caja"><summary><b>Valores por edad</b> (Fisiopatología, Clase 10, «fines didácticos»)</summary>
        <table><tr><th>Grupo</th><th>PA (mmHg)</th></tr>${EDADES.map(e => `<tr><td>${e[0]}</td><td>${e[1]}</td></tr>`).join("")}</table></details>`;
    const el = { s: $("#s"), d: $("#d"), rs: $("#rs"), rd: $("#rd") };
    function guia(id, pas, pad) {
      const G = PA.GUIAS[id], c = PA.clasificar(pas, pad, id);
      const filas = G.filas.map((f, i) => {
        const marca = i === 6 ? c.aislada : i === c.cat, parcial = i !== 6 && (i === c.porPAS || i === c.porPAD) && !marca;
        return `<tr style="${marca ? "background:var(--resalte);font-weight:700" : ""}"><td>${f[0]}</td><td>${f[1]}${i === c.porPAS && i !== 6 ? " ◀" : ""}</td><td>${f[2]}${i === c.porPAD && i !== 6 ? " ◀" : ""}</td></tr>`;
      }).join("");
      return `<div class="caja" style="margin:0"><h3 style="margin-top:0">${G.nombre}</h3>
        <table><tr><th>Categoría</th><th>PAS</th><th>PAD</th></tr>${filas}</table>
        <p style="margin:8px 0 2px">Resultado: ${U.chipCat(c)} ${c.aislada && !c.hipotension ? `<span class="cat c4" style="background:var(--mo)">sistólica aislada</span>` : ""}</p>
        <p class="nota" style="margin:2px 0">◀ marca la fila que corresponde a cada cifra; manda la <b>más alta</b>. ${c.aislada ? `Aislada: ${G.textoAislada}.` : ""}</p></div>`;
    }
    function act() {
      const pas = Math.round(num("#s", 120)), pad = Math.round(num("#d", 80));
      const a = PA.clasificar(pas, pad, "sem"), b = PA.clasificar(pas, pad, "fis");
      $("#guias").innerHTML = guia("sem", pas, pad) + guia("fis", pas, pad);
      const av = [];
      if (a.aislada !== b.aislada) av.push(`<b>Discrepancia entre clases:</b> con PAS ${pas} y PAD ${pad}, Semiología (05h) lo llama <b>hipertensión sistólica aislada</b> (límite: <b>PAS &gt; 140</b>) y Fisiopatología (Clase 10) no, porque exige <b>PAS ≥ 160</b>; allí queda como ${esc(b.nombre)}. Pregunta al docente cuál usará en el examen.`);
      if (pas === 180 || pad === 110) av.push(`<b>Discrepancia en el límite:</b> Semiología escribe el grado III como «&gt; 180 / &gt; 110» y el grado II como «160-179 / 100-109», así que el valor exacto 180 (o 110) queda sin casilla; Fisiopatología lo escribe «≥ 180 / ≥ 110». Aquí se ubica en el grado III.`);
      if (a.hta) av.push(`La HTA se diagnostica con <b>≥ 140/90 confirmado en dos o más tomas</b> (en dos consultas): una sola cifra alta no basta. Meta de tratamiento: &lt; 140/90 (&lt; 130/80 en diabetes o insuficiencia renal).`);
      if (a.hipotension) av.push(`<b>Hipotensión arterial:</b> PAS sostenida &lt; 90 mmHg. Si además hay pulso filiforme, taquicardia y mala perfusión, piensa en shock.`);
      if (pas < pad + 10) av.push(`La sistólica no debería estar tan cerca de la diastólica: revisa los números.`);
      $("#avisos").innerHTML = av.map(x => `<div class="discrep">${x}</div>`).join("");
      const pp = PA.diferencial(pas, pad), tp = PA.tipoDiferencial(pp), m = PA.pam(pas, pad), nm = PA.nivelPam(m);
      const causas = tp.tipo === "divergente" ? PA.CAUSAS_DIVERGENTE : tp.tipo === "convergente" ? PA.CAUSAS_CONVERGENTE : null;
      $("#deriv").innerHTML = `<div class="tarj ${tp.tipo === "normal" ? "ve" : "na"}"><b class="t">Presión diferencial = PAS − PAD</b>
          ${pas} − ${pad} = <b class="dato">${pp} mmHg</b> · <b>${tp.tipo === "normal" ? "normal" : tp.tipo}</b>
          <p class="nota" style="margin:4px 0 0">Normal 40 (rango 30-50). Mayor de 40: <b>divergente</b>; menor de 30: <b>convergente</b>.${tp.zonaGris ? " <br><b>Discrepancia interna:</b> la clase da 30-50 como rango normal pero llama divergente a todo lo que pasa de 40; entre 41 y 50 es zona límite." : ""}</p>
          ${causas ? `<p style="margin:6px 0 0">Causas: ${causas.map(x => x.toLowerCase()).join(", ")}.</p>` : ""}</div>
        <div class="tarj ${nm === "normal" ? "ve" : nm === "baja" ? "mo" : "ro"}"><b class="t">Presión arterial media (PAM)</b>
          (PAS + 2 × PAD) / 3 = (${pas} + ${2 * pad}) / 3 = <b class="dato">${m.toFixed(1)} mmHg</b><br>
          PAD + (PAS − PAD) / 3 = ${pad} + ${pp} / 3 = ${(pad + pp / 3).toFixed(1)} mmHg
          <p style="margin:4px 0 0">Nivel: <b>${{ baja: "baja (< 60: riesgo de isquemia cerebral)", normal: "normal (60-100)", alta: "por encima de lo normal", "muy alta": "muy alta" }[nm]}</b>.</p>
          <p class="nota" style="margin:4px 0 0">Indica la perfusión tisular real. La diastólica cuenta doble porque la diástole dura más que la sístole. ${m > 130 ? `<br><b>Discrepancia:</b> Semiología advierte riesgo de ACV con PAM &gt; <b>140</b>; Fisiopatología, riesgo de ruptura arterial y hemorragia cerebral en hipertensos con PAM &gt; <b>130</b>.` : ""}</p></div>`;
    }
    function post() {
      const r = PA.postural({ pas: num("#ps", 0), pad: num("#pd", 0) }, { pas: num("#qs", 0), pad: num("#qd", 0) });
      $("#post").innerHTML = `<div class="letrero"><span class="k">${r.positiva ? "SÍ" : "NO"}</span><span>Caída de PAS <b>${r.caidaPAS}</b> y de PAD <b>${r.caidaPAD}</b> mmHg → ${r.positiva ? "<b>hipotensión postural</b>" : "sin hipotensión postural"}. ${r.positiva ? "Causas: comunes (anemia, hemorragia, deshidratación), neurológicas, cardiovasculares, endocrinas." : "Al pararse es normal una discreta baja de la sistólica y ligera subida de la diastólica."}</span></div>`;
    }
    const sync = (de, a) => { a.value = de.value; };
    el.s.oninput = () => { sync(el.s, el.rs); act(); }; el.d.oninput = () => { sync(el.d, el.rd); act(); };
    el.rs.oninput = () => { sync(el.rs, el.s); act(); }; el.rd.oninput = () => { sync(el.rd, el.d); act(); };
    $$("#ej .chip").forEach(b => b.onclick = () => { const e = EJEMPLOS[+b.dataset.i]; el.s.value = el.rs.value = e[0]; el.d.value = el.rd.value = e[1]; act(); });
    ["#ps", "#pd", "#qs", "#qd"].forEach(i => $(i).oninput = post);
    act(); post();
  };

  /* =====================================================================================
     PESTAÑA 3 · DETERMINANTES
     ===================================================================================== */
  const SLIDERS = [
    { k: "vs", t: "Volumen sistólico", u: " mL", min: 30, max: 130, st: 1, ay: "lo que sale en cada latido" },
    { k: "fc", t: "Frecuencia cardiaca", u: " /min", min: 40, max: 180, st: 1, ay: "latidos por minuto" },
    { k: "rvp", t: "Resistencia periférica", u: "", min: 5, max: 40, st: 0.5, ay: "arteriolas: vasoconstricción ↑ / vasodilatación ↓ (mmHg·min/L)" },
    { k: "elast", t: "Elasticidad de la aorta", u: " %", min: 0, max: 100, st: 1, ay: "100 % = joven; baja con arteriosclerosis" },
    { k: "vol", t: "Volemia", u: " %", min: 50, max: 140, st: 1, ay: "50 = hemorragia · 100 = normal · 140 = hipervolemia" },
    { k: "visc", t: "Viscosidad", u: "×", min: 0.6, max: 1.5, st: 0.05, ay: "anemia / fiebre ← → poliglobulia" }
  ];
  const MECANISMOS = [
    { id: "esencial", t: "HTA primaria (esencial)", tag: "> 90 % de los casos", cad: ["Factores genéticos y ambientales", "↑ RVP (arteriolas)", "Sobrecarga del ventrículo izquierdo", "Hipertrofia ventricular izquierda"], x: "Causa desconocida. No modificables: antecedentes familiares, edad, raza negra, resistencia a la insulina. Modificables: sal (10-14 g/día vs &lt; 4 g), obesidad, poco K, Ca y Mg, tabaco, estrés, grasas saturadas, café." },
    { id: "renovascular", t: "Renovascular", tag: "secundaria", cad: ["Estenosis de la arteria renal", "↓ flujo glomerular", "Renina → angiotensina II", "Vasoconstricción + aldosterona (Na y agua)"], x: "El aparato yuxtaglomerular libera renina; el SRAA sube la RVP y la volemia a la vez." },
    { id: "aldosterona", t: "Hiperaldosteronismo primario", tag: "secundaria", cad: ["Adenoma suprarrenal", "↑ aldosterona", "Retiene Na+ y agua, pierde K+", "Hipervolemia + hipopotasemia"], x: "HTA con debilidad muscular, poliuria y polidipsia. Dx: K bajo, aldosterona alta, TAC. Tx: espironolactona o cirugía." },
    { id: "cushing", t: "Síndrome de Cushing", tag: "secundaria", cad: ["Exceso de glucocorticoides", "Retención de Na y H₂O", "↑ volumen", "HTA"], x: "Obesidad central, facies de luna llena, estrías violáceas. Más del 80 % es endógeno; 20 % iatrogénico." },
    { id: "feo", t: "Feocromocitoma", tag: "secundaria · 0,1-0,5 %", cad: ["Tumor de la médula suprarrenal", "Catecolaminas (adrenalina y noradrenalina)", "β: ↑ FC y contractilidad · α: vasoconstricción", "↑ DC y ↑ RVP: crisis paroxísticas"], x: "Cefalea, palpitaciones, sudoración. Dx: catecolaminas o ácido vanilmandélico en orina de 24 h, MAPA. Tx: cirugía; betabloqueadores con precaución." },
    { id: "oliguria", t: "Hipervolemia por oliguria", tag: "secundaria", cad: ["Insuficiencia renal con oliguria (&lt; 400 mL/24 h) o anuria (&lt; 100)", "Sigue ingiriendo líquidos", "↑ volumen intravascular", "HTA"], x: "La volemia es un determinante de la PA: más volumen, más retorno, más débito." }
  ];

  SECC.determinantes = function (main) {
    const g = U.gen, I = Object.assign({}, PA.BASE);
    main.innerHTML = `<h1>⚙️ De qué depende la presión</h1>
      <p class="lema">La presión es <b>bomba por tubo</b>: <b>PA = débito cardiaco × resistencia vascular periférica</b>. Mueve los controles, o elige una situación, y mira cómo se desplazan la sistólica y la diastólica. Debajo están los mecanismos de la hipertensión que enseña la clase de fisiopatología.</p>
      <div class="chips" id="esc">${PA.ESCENARIOS.map(e => `<button class="chip" data-id="${e.id}">${e.t}</button>`).join("")}</div>
      <div class="grid2">
        <div class="caja">${SLIDERS.map(s => `<div class="slid"><label for="sl-${s.k}"><b>${s.t}</b><br><span class="nota">${s.ay}</span></label><input type="range" id="sl-${s.k}" min="${s.min}" max="${s.max}" step="${s.st}" value="${I[s.k]}"><output id="o-${s.k}"></output></div>`).join("")}
          <button class="btn sec" id="reset">↺ Volver al reposo</button></div>
        <div><div class="caja" style="padding:8px"><canvas class="cv" id="tubo"></canvas></div>
          <div class="grid3" style="grid-template-columns:repeat(2,1fr)" id="lect"></div></div>
      </div>
      <div class="letrero" id="nota-esc" style="margin-top:10px"><span class="k">Qué pasa</span><span id="nota-t">Elige una situación o mueve un control.</span></div>
      <div id="efectos" style="margin:8px 0"></div>
      <h2>Mecanismos de la hipertensión</h2>
      <p class="lema" style="margin-top:0">Sea cual sea la causa, la HTA se caracteriza por un <b>aumento de la resistencia vascular periférica</b>; con los años la capa muscular de las arteriolas se engrosa y el ventrículo izquierdo se hipertrofia. Pulsa «Ver» para reproducir el mecanismo arriba.</p>
      <div class="grid3">${MECANISMOS.map(m => `<div class="tarj ro"><b class="t">${m.t}</b><span class="nota">${m.tag}</span>
        <div class="cadena" style="margin:6px 0">${m.cad.map((c, i) => `${i ? '<span class="f">→</span>' : ""}<span class="n">${c}</span>`).join("")}</div>
        <p class="nota" style="margin:4px 0">${m.x}</p><button class="btn sec" data-m="${m.id}" style="min-height:40px">▶ Ver en el simulador</button></div>`).join("")}</div>
      <div class="grid2" style="margin-top:12px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        <div class="caja"><h3 style="margin-top:0">Sistema renina-angiotensina-aldosterona</h3>
          <div class="cadena"><span class="n">↓ volumen / Na+ o ↑ simpático</span><span class="f">→</span><span class="n">riñón libera <b>renina</b></span><span class="f">→</span><span class="n">angiotensinógeno → angiotensina I</span><span class="f">→</span><span class="n">ECA (pulmón) → <b>angiotensina II</b></span></div>
          <div class="cadena" style="margin-top:6px"><span class="n">angiotensina II</span><span class="f">→</span><span class="n">vasoconstricción ↑ RVP</span><span class="f">y</span><span class="n">aldosterona → retiene Na+ y H₂O → ↑ volemia</span><span class="f">→</span><span class="n"><b>↑ PA</b></span></div></div>
        <div class="caja"><h3 style="margin-top:0">Complicaciones (órganos blanco)</h3>
          <p style="margin:0">❤️ <b>Corazón</b>: hipertrofia ventricular izquierda → insuficiencia cardiaca → edema agudo de pulmón.<br>🧠 <b>Cerebro</b>: ACV isquémico o hemorrágico (más de la mitad de los ACV son en hipertensos); encefalopatía hipertensiva.<br>🫘 <b>Riñón</b>: nefroangioesclerosis → insuficiencia renal crónica.<br>👁️ <b>Retina</b>: retinopatía; el fondo de ojo dice si la HTA es reciente o antigua.<br>🩸 <b>Vasos</b>: aterosclerosis acelerada, aneurisma o disección aórtica.</p></div>
      </div>`;
    const cv = $("#tubo"); let C = U.lienzo(cv, 250); U.alRedimensionar = () => { C = U.lienzo(cv, 250); };
    let R = PA.determinantes(I);
    const parts = []; for (let i = 0; i < 60; i++) parts.push({ x: Math.random(), y: Math.random() * 2 - 1, v: 0.7 + Math.random() * 0.6 });
    function leer() { SLIDERS.forEach(s => { I[s.k] = parseFloat($("#sl-" + s.k).value); const v = I[s.k]; $("#o-" + s.k).textContent = (s.k === "visc" ? v.toFixed(2) : s.k === "rvp" ? v.toFixed(1) : Math.round(v)) + s.u; }); }
    function act(nota) {
      leer(); R = PA.determinantes(I);
      const cat = PA.clasificar(Math.round(R.pas), Math.round(R.pad), "sem"), tp = PA.tipoDiferencial(R.pp);
      $("#lect").innerHTML = `<div class="tarj"><b class="t">Presión</b><span class="dato" style="font-size:26px">${Math.round(R.pas)}/${Math.round(R.pad)}</span> mmHg<br>${U.chipCat(cat)}</div>
        <div class="tarj mo"><b class="t">Débito cardiaco</b><span class="dato" style="font-size:26px">${R.dc.toFixed(1)}</span> L/min<br><span class="nota">VS × FC (5-6 en reposo, hasta 30 en ejercicio)</span></div>
        <div class="tarj ${tp.tipo === "normal" ? "ve" : "na"}"><b class="t">Diferencial</b>${Math.round(R.pp)} mmHg · ${tp.tipo}</div>
        <div class="tarj"><b class="t">PAM</b>${Math.round(R.pam)} mmHg · ${PA.nivelPam(R.pam)}</div>`;
      $("#efectos").innerHTML = PA.explicarDeterminantes(I, R).map(e => `<div class="efecto ${e.k === "+" ? "mas" : e.k === "-" ? "menos" : ""}">${e.k === "+" ? "▲" : e.k === "-" ? "▼" : "●"} ${e.t}</div>`).join("");
      if (nota) $("#nota-t").textContent = nota;
    }
    function poner(set, nota, chipId) {
      SLIDERS.forEach(s => { $("#sl-" + s.k).value = set[s.k]; });
      $$("#esc .chip").forEach(c => c.classList.toggle("act", c.dataset.id === chipId)); act(nota);
    }
    SLIDERS.forEach(s => $("#sl-" + s.k).oninput = () => { $$("#esc .chip").forEach(c => c.classList.remove("act")); act("Moviste " + s.t.toLowerCase() + ": mira abajo qué cambia y por qué."); });
    $$("#esc .chip").forEach(b => b.onclick = () => { const e = PA.ESCENARIOS.find(x => x.id === b.dataset.id); poner(e.set, e.nota, e.id); });
    $("#reset").onclick = () => poner(PA.BASE, "Reposo: 120/80, DC 5-6 L/min.", "reposo");
    $$("[data-m]").forEach(b => b.onclick = () => { const e = PA.ESCENARIOS.find(x => x.id === b.dataset.m); poner(e.set, e.nota, e.id); window.scrollTo({ top: 0, behavior: "smooth" }); });
    act();
    // dibujo: corazón (bomba) → tubo con arteriolas → barras de PAS/PAD
    const suave = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    let fase = 0, last = 0;
    function dibuja(ts) {
      if (g !== U.gen) return;
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      const { c, w, h } = C, P = U.P, cy = 62, hf = 26;
      fase += dt * I.fc / 60;                                         // latidos reproducidos
      const lat = fase % 1, pulso = lat < 0.15 ? Math.sin(lat / 0.15 * Math.PI) : 0;
      c.clearRect(0, 0, w, h);
      // tubo: la pared se hincha menos cuanto más rígida es
      const hinch = (I.elast / 100) * 7 * pulso + 1, xa = 58, xb = w - 20;
      const gap = Math.max(4, Math.min(hf, hf * Math.pow(PA.BASE.rvp / I.rvp, 0.8)));
      const ancho = x => hf + hinch - (hf + hinch - gap) * (suave((x - (xb - 120)) / 50) - suave((x - (xb - 30)) / 25));
      const rig = 1 - I.elast / 100;
      c.lineWidth = 3 + rig * 7; c.strokeStyle = rig > 0.4 ? "#6B7280" : "#B9835C";
      c.beginPath(); for (let x = xa; x <= xb; x += 4) x > xa ? c.lineTo(x, cy - ancho(x) - 3) : c.moveTo(x, cy - ancho(x) - 3); c.stroke();
      c.beginPath(); for (let x = xa; x <= xb; x += 4) x > xa ? c.lineTo(x, cy + ancho(x) + 3) : c.moveTo(x, cy + ancho(x) + 3); c.stroke();
      c.fillStyle = `rgba(${Math.round(185 - (I.visc - 1) * 90)},28,${Math.round(28 + (I.visc < 1 ? 60 * (1 - I.visc) : 0)) },${0.1 + 0.18 * Math.min(1.4, I.vol / 100)})`;
      c.beginPath(); for (let x = xa; x <= xb; x += 4) c.lineTo(x, cy - ancho(x)); for (let x = xb; x >= xa; x -= 4) c.lineTo(x, cy + ancho(x)); c.closePath(); c.fill();
      // glóbulos: más número con más volemia, más oscuros y lentos con más viscosidad, más rápidos con más débito
      const n = Math.round(parts.length * Math.min(1, I.vol / 110)), vel = 0.05 + 0.09 * R.dc * (1 / Math.sqrt(I.visc));
      c.fillStyle = I.visc > 1.1 ? "#7F1D1D" : P.ro;
      parts.slice(0, n).forEach(q => {
        q.x += vel * dt * q.v * (0.5 + 1.1 * pulso + 0.3); if (q.x > 1) { q.x = 0; q.y = Math.random() * 2 - 1; }
        const x = xa + q.x * (xb - xa); c.beginPath(); c.arc(x, cy + q.y * (ancho(x) - 3), I.visc > 1.1 ? 3.6 : 2.6, 0, 6.3); c.fill();
      });
      // corazón
      const s = 1 + 0.18 * pulso; c.save(); c.translate(26, cy); c.scale(s, s);
      c.fillStyle = "#DC2626"; c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-26, -6, -14, -26, 0, -10); c.bezierCurveTo(14, -26, 26, -6, 0, 12); c.fill(); c.restore();
      c.fillStyle = P.tx2; c.font = "600 11px Nunito, sans-serif"; c.textAlign = "left";
      c.fillText("BOMBA: " + R.dc.toFixed(1) + " L/min", 4, cy + 48); c.textAlign = "right"; c.fillText("arteriolas (RVP)", xb, cy + 48);
      c.textAlign = "center"; c.fillText(I.elast < 60 ? "aorta rígida" : "aorta elástica", (xa + xb) / 2 - 30, 14);
      // barras de PAS y PAD con el umbral 140/90
      const bx = 64, bw = w - bx - 16, esc = v => bx + v / 260 * bw;
      c.textAlign = "right"; c.font = "700 13px Nunito, sans-serif"; c.fillStyle = P.tx;
      [[R.pas, "PAS", 150, 140], [R.pad, "PAD", 200, 90]].forEach(([v, nom, y, um]) => {
        c.fillText(nom, bx - 8, y - 6); const cat = PA.clasificar(Math.round(R.pas), Math.round(R.pad), "sem");
        c.fillStyle = P.borde; c.fillRect(bx, y - 22, bw, 26);
        c.fillStyle = v >= um ? "#DC2626" : v < (nom === "PAS" ? 90 : 60) ? "#2563EB" : "#16A34A"; c.fillRect(bx, y - 22, Math.max(2, esc(v) - bx), 26);
        c.strokeStyle = P.tx; c.setLineDash([4, 3]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(esc(um), y - 28); c.lineTo(esc(um), y + 10); c.stroke(); c.setLineDash([]);
        c.textAlign = "left"; c.fillStyle = P.tx; c.fillText(Math.round(v), Math.min(esc(v) + 6, w - 40), y - 4);
        c.fillStyle = P.tx2; c.font = "10px Nunito, sans-serif"; c.fillText("umbral " + um, esc(um) + 3, y + 10); c.font = "700 13px Nunito, sans-serif"; c.textAlign = "right"; c.fillStyle = P.tx;
      });
      requestAnimationFrame(dibuja);
    }
    requestAnimationFrame(dibuja);
  };

  /* =====================================================================================
     PESTAÑA 4 · EXPLICACIÓN
     ===================================================================================== */
  SECC.explicacion = function (main) {
    main.innerHTML = `<h1>📖 Explicación</h1>
      <p class="lema">Qué es medir la presión, cómo se hace, por qué suena y para qué sirve. Todo sale de las clases de Semiología (tema 5 y 8) y de Fisiopatología (clases 10 y 11).</p>
      <div class="grid3">
        <div class="tarj"><b class="t">¿Qué es?</b>Medir la presión arterial: la fuerza que ejerce la sangre sobre la pared arterial. La <b>sistólica</b> (la más alta) nace en la contracción del ventrículo y la <b>diastólica</b> (la más baja) en su relajación.</div>
        <div class="tarj ve"><b class="t">¿Cómo?</b>Reposo de 5 minutos, brazo a la altura del corazón, manguito del tamaño justo sobre la piel; se palpa la sistólica, se infla 30 mmHg por encima y se desinfla a 2-3 mmHg/s con el estetoscopio sobre la braquial.</div>
        <div class="tarj mo"><b class="t">¿Por qué suena?</b>Con el manguito por encima de la sistólica la arteria queda cerrada y no suena. Al bajar, la sangre pasa a chorro por la arteria comprimida: el flujo se vuelve <b>turbulento</b> y hace los ruidos de Korotkoff. Cuando la arteria queda abierta el flujo vuelve a ser <b>laminar</b> y el sonido desaparece.</div>
        <div class="tarj na"><b class="t">¿Para qué?</b>Diagnosticar HTA (≥ 140/90 en dos o más tomas) o hipotensión (&lt; 90), calcular diferencial y PAM y buscar daño en corazón, cerebro, riñón y retina.</div></div>
      <h2>Las cinco fases de Korotkoff</h2>
      <div class="caja"><table><tr><th>Fase</th><th>Qué se oye (clase)</th><th>Qué significa</th></tr>
        <tr><td><b>I</b></td><td>Aparece el primer ruido, nítido</td><td><b>Presión sistólica</b></td></tr>
        <tr><td><b>II</b></td><td>Más suaves y prolongados, con soplo intermitente</td><td>La arteria se abre y se cierra con cada latido</td></tr>
        <tr><td><b>III</b></td><td>Más agudos y altos</td><td>Mayor parte del latido pasa</td></tr>
        <tr><td><b>IV</b></td><td>Se apagan</td><td>Casi abierta</td></tr>
        <tr><td><b>V</b></td><td>Desaparecen</td><td><b>Presión diastólica</b></td></tr></table>
        <p class="nota">Los mmHg que ocupa cada fase y el timbre exacto en el simulador son <b>didácticos</b>: la clase describe el carácter de los ruidos, no cifras por fase.</p></div>
      <h2>La técnica, en orden</h2>
      <ol class="pasos" style="counter-reset:p">${["Ambiente tranquilo y buen trato: la ansiedad sube la cifra.", "Reposo de 5 minutos si viene de la calle; sin café, alcohol ni ejercicio previos.", "Paciente echado (o sentado/de pie); arteria braquial a la altura del corazón, en el 4.º espacio intercostal.", "Manguito sin ropa, sobre dos tercios del brazo, borde inferior dos traveses de dedo sobre el pliegue del codo; ni muy apretado ni muy flojo.", "Palpar la braquial/radial e inflar hasta que el pulso desaparezca: sistólica palpatoria (método de Riva-Rocci, 1896; solo da la sistólica).", "Inflar 30 mmHg por encima de esa cifra y colocar el estetoscopio sobre la braquial (método de Korotkov, 1904).", "Desinflar a 2-3 mmHg por segundo: fase I = sistólica; fase V = diastólica.", "Tomarla en ambos brazos y repetirla al final del examen: la segunda o tercera toma suele ser más baja y más fiable."].map(x => `<li style="cursor:default">${x}</li>`).join("")}</ol>
      <p class="nota">El banco de preguntas pone 10 a 15 minutos de reposo; tu docente enseña <b>5</b>. En el examen, responde con el docente y confírmalo.</p>
      <h2>Errores de la medida</h2>
      <div class="grid3"><div class="caja" style="margin:0"><table><tr><th>Condición</th><th>Cifra</th></tr>
        <tr><td>Manómetro por debajo del corazón</td><td>falsamente alta</td></tr><tr><td>Manómetro por encima del corazón</td><td>falsamente baja</td></tr>
        <tr><td>Manguito pequeño</td><td>falsamente alta</td></tr><tr><td>Manguito grande</td><td>falsamente baja</td></tr>
        <tr><td>Manguito flojo</td><td>falsamente alta</td></tr><tr><td>Manguito apretado</td><td>falsamente baja</td></tr><tr><td>Sobre la ropa</td><td>falsamente alta</td></tr></table></div>
        <div class="caja" style="margin:0"><table><tr><th>Manguito</th><th>Uso</th></tr><tr><td>12 × 23 cm</td><td>adulto estándar</td></tr><tr><td>18-20 cm</td><td>obesos o muslo</td></tr><tr><td>6 cm</td><td>preescolares</td></tr><tr><td>2,5 cm</td><td>lactantes</td></tr></table></div>
        <div class="tarj na"><b class="t">Trampas que se ven en el simulador</b><b>Pseudohipertensión del anciano</b>: la arteria rígida necesita más presión para colapsarse; la radial sigue palpable con la braquial ocluida; el aparato marca de más.<br><b>Pozo auscultatorio</b>: los ruidos se callan un tramo y reaparecen; más frecuente en fibrilación auricular o extrasístoles; desinfla con cuidado para no confundir la fase I ni quedarte en el silencio.<br><b>Niño llorando</b>: la PA puede subir hasta 50 mmHg.</div></div>
      <h2>Fórmulas y valores</h2>
      <div class="grid3">
        <div class="tarj"><b class="t">PA = DC × RVP</b>DC = volumen sistólico × FC (5-6 L/min en reposo, hasta 30 en ejercicio). El DC gobierna sobre todo la sistólica; la resistencia, la diastólica. Modulan la elasticidad, la volemia y la viscosidad.</div>
        <div class="tarj mo"><b class="t">Diferencial</b>PAS − PAD. Normal 40 (30-50). &gt; 40 divergente (insuficiencia aórtica, ductus, bloqueo AV total, hipertiroidismo, anemia, fiebre…). &lt; 30 convergente (insuficiencia cardiaca, miocardiopatías, estenosis mitral o aórtica).</div>
        <div class="tarj ve"><b class="t">PAM</b>(PAS + 2 × PAD) / 3 = PAD + (PAS − PAD) / 3. Normal 60-100 mmHg. &lt; 60: isquemia cerebral.</div>
        <div class="tarj ro"><b class="t">HTA</b>≥ 140/90 confirmado en dos o más tomas. Grado I 140-159/90-99 · II 160-179/100-109 · III ≥ 180/110. 90-95 % primaria, 5-10 % secundaria.</div>
        <div class="tarj na"><b class="t">Hipotensión</b>PAS sostenida &lt; 90. Postural: caída de 20 en la sistólica o 10 en la diastólica al pararse (echado 5 min, de pie 3 min).</div>
        <div class="tarj"><b class="t">Variaciones normales</b>Sueño: −20-40 mmHg en la sistólica. Echado: más alta. Entre brazos: hasta &gt; 10 mmHg (el derecho suele ser mayor). Muslo: 10-15 mmHg más alta que en el brazo.</div></div>
      <h2>Qué hace el simulador y qué no</h2>
      <div class="caja"><ul style="margin:0 0 0 18px"><li><b>El sonido es sintetizado y orientativo.</b> Imita la secuencia y el carácter de cada fase (golpe nítido, soplo, agudo, apagado), no es una grabación de un paciente. Si no tienes audio, usa el letrero y el gráfico.</li>
        <li>La oscilación de la aguja está exagerada para que se vea.</li><li>Cuánto falsea cada error de técnica (≈ 6-14 mmHg) es una magnitud didáctica: la clase solo dice si la cifra sale alta o baja.</li>
        <li>Las dos guías de clasificación difieren en la hipertensión sistólica aislada (&gt; 140 en Semiología, ≥ 160 en Fisiopatología) y en el grado III (&gt; 180 / ≥ 180); la pestaña Clasificación te avisa cuando importa.</li>
        <li>El modelo de «Determinantes» es una simplificación: la media sale de DC × RVP y la diferencial del volumen sistólico y de la elasticidad aórtica; los números de referencia (RVP 18,6 mmHg·min/L) son de <span class="lit">literatura</span>.</li></ul></div>`;
  };

  /* =====================================================================================
     PESTAÑA 5 · PONTE A PRUEBA
     ===================================================================================== */
  SECC.prueba = function (main) {
    const N = 10, Q = { i: 0, ok: 0, lista: [], fallos: {} };
    function nueva() { Q.i = 0; Q.ok = 0; Q.fallos = {}; Q.lista = []; const vistos = new Set(); while (Q.lista.length < N) { const q = PA.pregunta(U.rnd); if (vistos.has(q.q)) continue; vistos.add(q.q); Q.lista.push(q); } pinta(); }
    function pinta() {
      if (Q.i >= N) {
        const t = Object.entries(Q.fallos).map(([k, v]) => `${k} (${v})`).join(", ");
        main.innerHTML = `<h1>🎯 Ponte a prueba</h1><div class="caja"><h2 style="margin-top:0">Resultado: ${Q.ok} de ${N}</h2><p>${Q.ok >= 9 ? "Excelente: dominas la presión arterial." : Q.ok >= 7 ? "Bien. Repasa lo que falló." : "Vuelve a la pestaña Explicación y al simulador, y repite."}</p>${t ? `<p>Repasa: <b>${t}</b>.</p>` : ""}
          <div class="ctrl"><button class="btn" id="otra">🔁 Otra ronda</button><a class="btn sec" href="#toma">🩺 Ir al simulador</a></div></div>`;
        $("#otra").onclick = nueva; return;
      }
      const q = Q.lista[Q.i];
      main.innerHTML = `<h1>🎯 Ponte a prueba</h1>
        <p class="nota">Pregunta ${Q.i + 1} de ${N} · aciertos ${Q.ok} · <span class="chip" style="min-height:0;padding:2px 10px;cursor:default">${q.tipo}</span></p>
        <div class="caja"><p style="font-size:18px;margin:0 0 10px"><b>${esc(q.q)}</b></p>
          <div class="opciones" id="ops">${q.op.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join("")}</div>
          <div id="fb"></div></div>`;
      $$("#ops button").forEach(b => b.onclick = () => {
        const i = +b.dataset.i, bien = i === q.ok; $$("#ops button").forEach((x, k) => { x.disabled = true; if (k === q.ok) x.classList.add("bien"); else if (k === i) x.classList.add("mal"); });
        if (bien) Q.ok++; else Q.fallos[q.tipo] = (Q.fallos[q.tipo] || 0) + 1;
        $("#fb").innerHTML = `<div class="letrero" style="margin-top:10px"><span class="k">${bien ? "✔" : "✘"}</span><span>${bien ? "Correcto. " : "Era: <b>" + esc(q.op[q.ok]) + "</b>. "}${esc(q.e)}</span></div><div class="ctrl"><button class="btn" id="sig">${Q.i + 1 < N ? "Siguiente →" : "Ver resultado"}</button></div>`;
        $("#sig").onclick = () => { Q.i++; pinta(); window.scrollTo(0, 0); }; $("#sig").focus();
      });
    }
    nueva();
  };
})();
