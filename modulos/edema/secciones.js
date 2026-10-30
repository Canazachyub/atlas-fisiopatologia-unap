/* Starling y edema — pestañas «Causas de edema» y «Semiología del edema». */
(function () {
  "use strict";
  const U = window.UTIL, E = U.E, f = U.f, LIT = U.LIT, $ = U.$, $$ = U.$$, SECC = window.SECC;
  const { CASOS, FUERZA_TXT } = window.EDC;
  const NOM = { Pv: "Presión hidrostática capilar", alb: "Presión oncótica del plasma", perm: "Permeabilidad capilar", Pi: "Presión del intersticio", pii: "Oncótica del intersticio", lin: "Drenaje linfático" };
  const ICO = { Pv: "🩸", alb: "🥚", perm: "🕳️", Pi: "🧲", pii: "🧽", lin: "🧵" };

  /* =====================================================================
     PESTAÑA 2 · CAUSAS DE EDEMA
     ===================================================================== */
  SECC.causas = function (sec) {
    const grupos = ["Todas", "Sistémicas", "Localizadas", "Pulmón"];
    sec.innerHTML = `
      <h1>🧩 Causas de edema</h1>
      <p class="lema">Toca una causa: el simulador ajusta las seis fuerzas y te dice cuál falla según lo que enseñó el docente. Después ábrela en el <b>capilar vivo</b> para verla funcionar.</p>
      <div class="chips" id="gr"></div>
      <div class="grid3" id="tj"></div>
      <div id="det"></div>
      <h2>Para no confundir</h2>
      <div id="comp"></div>`;
    let filtro = "Todas", actual = (U.S.caso && U.S.caso.id) || null;
    U.chips($("#gr", sec), grupos.map(g => ({ id: g, t: g })), filtro, id => { filtro = id; lista(); });
    function lista() {
      const L = CASOS.filter(c => filtro === "Todas" || c.grupo === filtro);
      $("#tj", sec).innerHTML = L.map(c => `<button class="tarj ${c.circ === "pul" ? "mo" : c.local ? "na" : ""}${c.id === actual ? " sel" : ""}" data-id="${c.id}" style="text-align:left;cursor:pointer;border:0;background:var(--papel);color:var(--tx)">
          <b class="t">${c.ico} ${c.nombre}</b><span class="nota">Falla: ${FUERZA_TXT[c.prin]}</span></button>`).join("");
      $$("#tj .tarj", sec).forEach(b => b.onclick = () => { actual = b.dataset.id; lista(); detalle(); $("#det", sec).scrollIntoView({ behavior: "smooth", block: "start" }); });
    }
    function detalle() {
      const c = CASOS.find(x => x.id === actual); if (!c) { $("#det", sec).innerHTML = ""; return; }
      const C = E.CIRC[c.circ], n = E.NORMAL(C), eq = E.equilibrio(c.p, C), fl = E.flujos(c.p, C, 0), li = E.linfa(c.p, C, 0);
      const al = E.alteradas(c.p, C), est = E.estado(eq.V, C);
      const estTxt = c.sinFovea ? "edema sin fóvea (no depresible)" : est.txt;
      const fuerzas = ["Pv", "alb", "perm", "Pi", "pii", "lin"].map(k => {
        const v = c.p[k], v0 = n[k], alt = al.includes(k), sube = v > v0;
        const val = { Pv: `${f(v + C.caida / 2, 0)} mmHg (media)`, alb: `${f(v, 1)} g/dL = ${f(E.piP(v), 0)} mmHg`, perm: `×${f(v, 1)}`, Pi: `${f(v, 0)} mmHg`, pii: `${f(v, 0)} mmHg`, lin: `${f(v * 100, 0)} %` }[k];
        return `<div class="tarj ${k === c.prin ? "ro" : alt ? "na" : "ve"}"><b class="t">${ICO[k]} ${NOM[k]}</b>
          <span class="${alt ? "mal" : "ok"}">${alt ? (sube ? "↑ " : "↓ ") : "normal "}${val}</span>${k === c.prin ? '<br><span class="nota"><b>fuerza principal</b></span>' : ""}</div>`;
      }).join("");
      $("#det", sec).innerHTML = `
        <div class="caja">
          <h2 style="margin-top:4px">${c.ico} ${c.nombre}</h2>
          <div class="flujo">${c.pasos.map((t, i) => `${i ? "<i>→</i>" : ""}<span${i === c.pasos.length - 1 ? ' class="ult"' : ""}>${t}</span>`).join("")}</div>
          <div class="grid3" style="margin-top:8px">${fuerzas}</div>
          <p><b>Lo que dijo la clase.</b> ${c.clase}</p>
          <div class="bal">
            <div><small>Sale</small><b>${f(fl.sale, 1)}</b><small>L/día</small></div>
            <div><small>Vuelve</small><b>${f(fl.entra, 1)}</b><small>L/día</small></div>
            <div><small>Linfa</small><b>${f(li, 1)}</b><small>L/día</small></div>
            <div class="mal"><small>Líquido acumulado</small><b>${f(eq.V, C.id === "sis" ? 1 : 2)}</b><small>L</small></div>
          </div>
          <p class="nota">Resultado del modelo: <b>${estTxt}</b>. ${c.local ? "Causa localizada: los litros son los del territorio afectado." : ""} ${c.circ === "pul" ? `Presión capilar pulmonar media: ${f(c.p.Pv + C.caida / 2, 0)} mmHg (normal 10).` : ""}</p>
          ${c.sinFovea ? '<div class="dif"><b>Ojo:</b> aunque se acumula líquido, este edema es <b>duro o elástico y no deja fóvea</b> (la clase lo distingue por eso).</div>' : ""}
          ${c.id === "eapaltura" ? `<div class="dif"><b>Discrepancia dentro de la clase 30.</b> El esquema de mecanismo dice «aumento de presión hidrostática capilar» tras la vasoconstricción, pero el cateterismo descrito como clave diagnóstica muestra <b>presión capilar pulmonar normal</b>. Se modela lo segundo (permeabilidad aumentada); la presión arterial pulmonar sí sube. La clase da «sistólica 18 y diastólica 22 mmHg» (invertidas: no se usan).</div>` : ""}
          ${c.id === "nefritico" ? `<div class="dif"><b>Discrepancia entre fuentes.</b> La clase 27 pone como mecanismo principal el ↑ de la presión hidrostática por retención de Na+ y H2O (aquí). La Semiología 05g lo resume como «retención de sodio y agua con descenso de la TFG»: es la misma idea. Edema «discreto» (2-3 cruces) en la clase 02.</div>` : ""}
          <div class="ctrl"><button class="btn az" id="ver">💧 Verlo en el capilar vivo</button></div>
          <p class="nota">Qué esperas ver: <b>${c.hallazgo}</b>.</p>
        </div>`;
      $("#ver", sec).onclick = () => U.cargar(c);
    }
    lista(); detalle();

    /* tablas de comparación que la clase pide distinguir */
    $("#comp", sec).innerHTML = `
      <div class="caja"><h3>Nefrótico vs nefrítico (clases 02, 27, 28)</h3>
      <table><tr><th></th><th>Nefrótico</th><th>Nefrítico</th></tr>
        <tr><td>Fuerza que falla</td><td>Oncótica del plasma ↓ (pierde albúmina)</td><td>Hidrostática ↑ (retiene Na+ y H2O) + permeabilidad</td></tr>
        <tr><td>Albúmina</td><td>&lt; 3 g/dL (hasta &lt; 2)</td><td>Normal</td></tr>
        <tr><td>Proteinuria</td><td>&gt; 3,5 g/24 h</td><td>Leve a moderada (&lt; 3,5 g/24 h)</td></tr>
        <tr><td>Edema</td><td>Intenso, anasarca, cavidades serosas</td><td>Discreto a moderado, periorbitario</td></tr>
        <tr><td>Acompaña</td><td>Hiperlipidemia, orina espumosa; sin hematuria</td><td>Hematuria, hipertensión, oliguria (&lt; 400 mL/24 h)</td></tr></table></div>
      <div class="caja"><h3>Tres edemas de pulmón (clases 30 y 41)</h3>
      <table><tr><th></th><th>EAP cardiogénico</th><th>EAP no cardiogénico</th><th>EAP de altura</th></tr>
        <tr><td>Fuerza que falla</td><td>Presión hidrostática capilar ↑</td><td>Permeabilidad ↑ (o oncótica ↓)</td><td>Permeabilidad ↑ por hipoxia</td></tr>
        <tr><td>Presión capilar pulmonar</td><td>25-30 mmHg (normal 10)</td><td>Normal</td><td>Normal (vasoconstricción arteriolar)</td></tr>
        <tr><td>Líquido</td><td>Trasudado</td><td>Exudado, rico en proteínas</td><td>Rico en proteínas</td></tr>
        <tr><td>Causas</td><td>Falla del VI, estenosis/insuficiencia mitral, estenosis aórtica, HTA</td><td>Sepsis, SDRA, aspiración, gases tóxicos, anafilaxia, pancreatitis grave, uremia; hipoalbuminemia (nefrótico, cirrosis)</td><td>Ascenso rápido ≥ 2 700 msnm (Puno 3 820)</td></tr>
        <tr><td>Revierte con</td><td>Diuréticos, vasodilatadores, bajar la precarga</td><td>Tratar la causa; soporte</td><td>Oxígeno (reversión espectacular)</td></tr></table></div>`;
  };

  /* =====================================================================
     PESTAÑA 3 · SEMIOLOGÍA DEL EDEMA
     ===================================================================== */
  // Grados de fóvea (cruces 1-4 de la clase). Profundidad y tiempo de rebote: literatura (la clase solo da los grados).
  const GRADOS = [
    { g: 0, t: "Sin fóvea", mm: 0, seg: 0, txt: "No queda hoyo. Con menos de 5 L (pre-edema) todavía no hay fóvea: solo se detecta por el peso. También sin fóvea el mixedema y el linfedema." },
    { g: 1, t: "+", mm: 2, seg: 1, txt: "Leve: hoyo apenas visible que se borra al instante. Es el mínimo que se anota con una cruz." },
    { g: 2, t: "++", mm: 4, seg: 12, txt: "Hoyo claro que tarda unos segundos en recuperarse. Edema postural (hasta 2 cruces) y edema discreto." },
    { g: 3, t: "+++", mm: 6, seg: 60, txt: "Hoyo profundo, tarda cerca de un minuto. Típico del carencial y del nefrítico (2-3 cruces según la clase)." },
    { g: 4, t: "++++", mm: 8, seg: 180, txt: "Hoyo muy profundo, tarda minutos: anasarca (nefrótico, insuficiencia cardiaca o hepática avanzadas)." }
  ];
  const TIPOS = [
    { id: "blando", t: "Blando", piel: "#F2C9A8", temp: "Temperatura normal", causa: "Edema reciente: piel lisa y brillante, deja fóvea.", clase: "«Cuál fue su consistencia inicial: blando, edema reciente».", g: 2 },
    { id: "duro", t: "Duro (cáscara de naranja)", piel: "#E8B58E", temp: "Temperatura normal", causa: "Edema crónico: la piel se engrosa y se ve «en cáscara de naranja»; la fóvea es menos profunda.", clase: "«Duro sugiere edema crónico… duros, como cáscara de naranja».", g: 2, textura: true, rigido: .6 },
    { id: "frio", t: "Frío y cianótico", piel: "#B9A6D6", temp: "Frío al dorso de los dedos", causa: "Edema cardiaco u obstrucción venosa (cianosis); el calor local no aumenta.", clase: "«Cianosis: insuficiencia cardiaca u obstrucción venosa». Frío salvo en los inflamatorios.", g: 3 },
    { id: "palido", t: "Frío y pálido", piel: "#EFE0D0", temp: "Frío", causa: "Edema renal (síndrome nefrótico/nefrítico) o por obstrucción linfática.", clase: "«Palidez: causa renal o linfedema».", g: 3 },
    { id: "caliente", t: "Caliente, rojo y doloroso", piel: "#E88A7C", temp: "Caliente", causa: "Inflamatorio o infeccioso (celulitis por Streptococcus β hemolítico o Staphylococcus aureus): ↑ permeabilidad. Hay dolor, calor y rubor, a veces fiebre.", clase: "«Eritema (rojez): causa inflamatoria/infecciosa… caliente en procesos inflamatorios».", g: 2, dolor: true },
    { id: "nodeprime", t: "No depresible", piel: "#E9DDB8", temp: "Frío", causa: "Mixedema (acúmulo de mucopolisacáridos, piel áspera) o linfedema duro y pálido: el dedo no deja hoyo.", clase: "«Edema elástico, no depresible (sin signo de fóvea)». «Linfedema (edema duro, sin fóvea)».", g: 0, rigido: 0 }
  ];
  const DIST = [
    { id: "declive", t: "Declive (de pie o sentado)", zonas: ["tobillos"], caso: "Edema cardiaco, venoso, postural, carencial", txt: "La gravedad suma presión hidrostática: el edema cardiaco es simétrico, vespertino y predomina en los declives. Postural: aparece al estar de pie o viajar sentado y desaparece con el decúbito." },
    { id: "acostado", t: "Declive (acostado)", zonas: ["sacro"], caso: "Paciente encamado", txt: "En un paciente encamado el declive es la región sacra: el edema se busca ahí y no en los tobillos (por eso se explora también el sacro)." },
    { id: "palpebral", t: "Palpebral matutino", zonas: ["parpados"], caso: "Nefrótico, nefrítico, alérgico", txt: "Edema renal: matutino en los párpados y luego se generaliza (periódico). Alérgico/angioneurótico: párpados y labios, de inicio brusco." },
    { id: "unilateral", t: "Localizado (unilateral)", zonas: ["pantorrilla"], caso: "TVP, celulitis, linfedema, edema neurológico", txt: "El edema unilateral de miembro inferior es TVP en el 80-90 % de los casos (Doppler); si es caliente y rojo, celulitis; si es duro y pálido, linfedema." },
    { id: "general", t: "Generalizado (anasarca)", zonas: ["tobillos", "abdomen", "parpados", "sacro", "brazos"], caso: "Nefrótico, cirrosis, insuficiencia cardiaca avanzada", txt: "Anasarca: más de 5 L, compromete piel, vísceras y cavidades serosas (ascitis, derrame pleural y pericárdico, hidrocele)." },
    { id: "esclavina", t: "En esclavina", zonas: ["cuello", "brazos", "parpados"], caso: "Obstrucción de vena cava superior", txt: "Cara, cuello, tórax y brazos, con circulación colateral e ingurgitación yugular; causa tumoral o aneurisma. Es una urgencia por el riesgo de edema de glotis o cerebral." }
  ];

  SECC.semio = function (sec) {
    const gen = U.gen;
    let gr = 2, tipo = "blando", dist = "declive";
    const cruSim = (() => { const c = E.CIRC[U.S.circ]; const e = E.estado(U.S.V, c); return U.S.circ === "sis" ? e.cruces : null; })();
    sec.innerHTML = `
      <h1>🦵 Semiología del edema</h1>
      <p class="lema">El signo de la <b>fóvea</b> (Godet) se busca comprimiendo con el dedo índice contra un plano óseo —cara anterior de la tibia, maléolo o región sacra— <b>nunca sobre la pantorrilla</b>. Mantén presionado el dedo sobre la pierna (o el botón) y suéltalo: mira cuánto tarda el hoyo en recuperarse.</p>
      <div class="grid2">
        <div class="caja panel" style="padding:8px">
          <svg id="pierna" viewBox="0 0 360 420" role="img" aria-label="Pierna vista de lado con el dedo presionando sobre la tibia" style="touch-action:none;display:block;width:100%;height:auto;max-height:560px"></svg>
          <div class="ctrl" style="justify-content:center"><button class="btn az" id="pres" style="user-select:none;touch-action:none">👆 Mantén para presionar</button>
            <span class="nota" id="reloj"></span></div>
        </div>
        <div>
          <div class="caja"><h3>Grado de fóvea (cruces)</h3><div class="chips" id="gr"></div><p id="grt" class="info"></p>
            <p class="nota">Cruces de la clase: 1 (leve) a 4 (anasarca). Profundidad y tiempo de rebote ${LIT}; el reloj va acelerado ×15.</p>
            <div id="simlig"></div></div>
          <div class="caja"><h3>Cómo es el edema</h3><div class="chips" id="tp"></div><div id="tpt" class="info"></div></div>
        </div>
      </div>
      <h2>¿Dónde está el edema?</h2>
      <div class="grid2">
        <div class="caja panel" style="padding:8px"><svg id="cuerpo" viewBox="0 0 420 270" role="img" aria-label="Cuerpo de frente y acostado con las zonas del edema" style="display:block;width:100%;height:auto"></svg></div>
        <div class="caja"><div class="chips" id="ds"></div><div id="dst" class="info"></div></div>
      </div>
      <h2>Las seis cosas que se examinan (Semiología 05g)</h2>
      <div class="grid3">
        <div class="tarj"><b class="t">1 · Localización</b>MMII, cara, párpados, sacro. El cardiaco es simétrico y de declive.</div>
        <div class="tarj"><b class="t">2 · Intensidad</b>Cruces de 1 a 4; también peso diario o perímetro.</div>
        <div class="tarj"><b class="t">3 · Consistencia</b>Blando (reciente), liso y brillante, o duro (crónico).</div>
        <div class="tarj"><b class="t">4 · Temperatura</b>Caliente si es inflamatorio; frío en el resto.</div>
        <div class="tarj"><b class="t">5 · Sensibilidad</b>Doloroso si es inflamatorio (calor, rubor, tumor).</div>
        <div class="tarj"><b class="t">6 · Piel y acompañantes</b>Cianosis, palidez o rubor; diarrea crónica, disnea, ascitis, orina espumosa.</div>
      </div>`;

    /* ---- pierna ---- */
    const svg = $("#pierna", sec), SV = "http://www.w3.org/2000/svg";
    const mk = (tag, at, par) => { const e = document.createElementNS(SV, tag); for (const k in at) e.setAttribute(k, at[k]); (par || svg).appendChild(e); return e; };
    const XB = 120, YC = 210;
    svg.innerHTML = "";
    const tejido = mk("path", { stroke: "#7C4A2D", "stroke-width": 3, "stroke-linejoin": "round" });
    const gotasG = mk("g", {});
    const hueso = mk("rect", { x: XB - 26, y: 6, width: 26, height: 408, rx: 12, fill: "#E5E1D8", stroke: "#8B8578", "stroke-width": 3 });
    const etiH = mk("text", { x: XB - 13, y: 365, "text-anchor": "middle", "font-size": 13, "font-weight": 700, fill: "#6B665A", transform: `rotate(-90 ${XB - 13} 365)` }); etiH.textContent = "tibia (plano óseo)";
    const dedo = mk("g", {});
    mk("rect", { x: 0, y: -15, width: 130, height: 30, rx: 15, fill: "#F0B997", stroke: "#8B5A3C", "stroke-width": 3 }, dedo);
    mk("rect", { x: 5, y: -14, width: 24, height: 10, rx: 5, fill: "#FFF", opacity: .6 }, dedo);   // uña, junto a la punta que presiona
    // pierna pequeña de referencia (vista de lado, el frente a la derecha): dónde se presiona
    mk("path", { d: "M282 244 L318 244 C322 274 320 322 314 362 L313 372 C326 375 342 380 348 386 L348 394 L280 394 C277 386 279 375 284 368 C270 322 268 274 282 244 Z", fill: "#F0C4A6", stroke: "#8B5A3C", "stroke-width": 2 });
    mk("circle", { cx: 319, cy: 300, r: 6, fill: "#FACC15", stroke: "#1b1b1b", "stroke-width": 2 });
    mk("text", { x: 314, y: 238, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "var(--tx2)" }).textContent = "aquí: cara anterior de la tibia";
    mk("text", { class: "eti", x: XB + 4, y: 22, "font-size": 11, fill: "#7C4A2D" }).textContent = "corte: piel y subcutáneo sobre la tibia";
    const calor = mk("text", { x: 340, y: 64, "text-anchor": "end", "font-size": 15, "font-weight": 700, fill: "var(--tx)" });
    const marca = mk("text", { x: 250, y: 414, "text-anchor": "end", "font-size": 13, fill: "var(--tx2)" });

    let st = { pulsa: false, d: 0, d0: 0, f: -30, tliberado: null };
    const tpo = () => TIPOS.find(t => t.id === tipo), gro = () => GRADOS[gr];
    function geom() {                       // espesor del tejido según el grado de edema
      const swell = gr === 0 && tipo !== "nodeprime" ? 4 : 0;
      const th = 22 + gr * 15 + swell + (tipo === "nodeprime" ? 28 : 0);
      return { xs: XB + th, th };
    }
    function pintar() {
      const { xs, th } = geom(), T = tpo(), G = gro();
      const d = Math.min(st.d, th - 4);
      tejido.setAttribute("fill", T.piel);
      const y0 = 10, y1 = 410, w = 30;
      const dd = Math.max(d, 0);
      tejido.setAttribute("d", `M ${XB} ${y0} L ${xs} ${y0} L ${xs} ${YC - w - 20} C ${xs} ${YC - 16}, ${xs - dd} ${YC - 22}, ${xs - dd} ${YC} C ${xs - dd} ${YC + 22}, ${xs} ${YC + 16}, ${xs} ${YC + w + 20} L ${xs} ${y1} L ${XB} ${y1} Z`);
      // dedo: st.f = posición suavizada de la punta (positivo = ya dentro del tejido)
      dedo.setAttribute("transform", `translate(${xs - st.f},${YC})`);
      // líquido (gotas dentro del tejido) y textura
      gotasG.innerHTML = "";
      const n = gr * 7 + (tipo === "nodeprime" ? 8 : 0);
      for (let i = 0; i < n; i++) { const a = (i * 53 % 100) / 100, b = (i * 29 % 97) / 97; const x = XB + 4 + a * (th - 8), y = 24 + b * 372; if (Math.abs(y - YC) < 26 && x > xs - dd - 4) continue;
        mk("circle", { cx: x, cy: y, r: 2.4, fill: "rgba(37,99,235,.55)" }, gotasG); }
      if (T.textura) for (let i = 0; i < 90; i++) { const x = XB + 6 + ((i * 41) % 100) / 100 * (th - 8), y = 16 + ((i * 67) % 100) / 100 * 388; mk("circle", { cx: x, cy: y, r: 1.2, fill: "rgba(120,53,15,.55)" }, gotasG); }
      if (T.dolor) mk("text", { x: xs + 8, y: YC - 40, "font-size": 20, fill: "#B91C1C" }, gotasG).textContent = "⚡ dolor";
      calor.textContent = (T.temp.startsWith("Caliente") ? "🔥 " : T.temp.startsWith("Frío") ? "❄️ " : "") + T.temp;
      calor.setAttribute("fill", T.temp.startsWith("Caliente") ? "#B91C1C" : "var(--tx)");
      marca.textContent = dd > 0.3 ? `hoyo: ${f(dd / 4, 1)} mm` : "";
    }
    function paso(t) {
      if (gen !== U.gen || !svg.isConnected) return;
      const dt = Math.min(0.05, (t - (paso.t || t)) / 1000); paso.t = t;
      const G = gro(), T = tpo(), { th } = geom();
      const dmax = Math.min(G.mm * 4 * (T.rigido === undefined ? 1 : T.rigido), th - 4);
      if (st.pulsa) { st.d += (dmax - st.d) * Math.min(1, dt * 8) + 0; st.d0 = st.d; st.tliberado = null; }
      else if (st.d > 0.05) {
        st.tliberado = (st.tliberado === null ? 0 : st.tliberado) + dt;
        const Tt = Math.max(G.seg, .3) / 15;                  // tiempo de rebote acelerado ×15
        st.d = Math.max(0, st.d0 * (1 - st.tliberado / Tt));
        $("#reloj", sec).textContent = `rebote: ${f(Math.min(st.tliberado * 15, G.seg), 0)} s de ${G.seg} s`;
      } else { st.d = 0; if (st.tliberado !== null) { $("#reloj", sec).textContent = G.mm ? `El hoyo tardó ${G.seg < 2 ? "menos de 2" : G.seg} s en recuperarse.` : "Sin hoyo: no hay fóvea."; st.tliberado = null; } }
      const ft = st.pulsa ? Math.max(st.d, 2) : -30;
      st.f += (ft - st.f) * Math.min(1, dt * (st.pulsa ? 14 : 10));
      pintar(); requestAnimationFrame(paso);
    }
    const pres = $("#pres", sec);
    const empieza = e => { e.preventDefault(); st.pulsa = true; $("#reloj", sec).textContent = "presionando…"; };
    const termina = () => { if (st.pulsa) { st.pulsa = false; st.tliberado = 0; } };
    [pres, svg].forEach(el => { el.addEventListener("pointerdown", empieza); });
    window.addEventListener("pointerup", termina); window.addEventListener("pointercancel", termina);
    pres.addEventListener("keydown", e => { if (e.key === " " || e.key === "Enter") empieza(e); });
    pres.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") termina(); });

    /* ---- selectores ---- */
    function textoGrado() {
      const G = gro(); $("#grt", sec).innerHTML = `<b>${G.t === "Sin fóvea" ? "Sin fóvea" : G.t + " · " + G.mm + " mm · rebote ≈ " + (G.seg < 2 ? "< 2 s" : G.seg >= 60 ? f(G.seg / 60, 0) + " min" : G.seg + " s")}</b><br>${G.txt}`;
    }
    function elegirGrado(g) { gr = g; st.d = 0; st.pulsa = false; $("#reloj", sec).textContent = ""; textoGrado(); }
    U.chips($("#gr", sec), GRADOS.map(g => ({ id: String(g.g), t: g.t })), String(gr), id => elegirGrado(+id));
    if (cruSim !== null) {
      $("#simlig", sec).innerHTML = `<p class="nota">Tu simulación del capilar tiene <b>${f(U.S.V, 1)} L</b> acumulados: ${cruSim === 0 ? "sin fóvea todavía" : "fóvea " + "+".repeat(cruSim)}. <button class="btn sec" id="usa" style="min-height:34px;padding:2px 12px">Usar ese grado</button></p>`;
      $("#usa", sec).onclick = () => { elegirGrado(cruSim); U.chips($("#gr", sec), GRADOS.map(g => ({ id: String(g.g), t: g.t })), String(gr), id => elegirGrado(+id)); };
    }
    function elegirTipo(id) {
      tipo = id; const T = tpo(); st.d = 0;
      if (id === "nodeprime") gr = 0; else if (gr === 0) gr = T.g;
      else if (T.g && id !== "blando") gr = T.g;
      U.chips($("#gr", sec), GRADOS.map(g => ({ id: String(g.g), t: g.t })), String(gr), id2 => elegirGrado(+id2));
      textoGrado();
      $("#tpt", sec).innerHTML = `<p><b>${T.t}.</b> ${T.causa}</p><p class="nota">Temperatura: <b>${T.temp}</b>.</p><p class="nota">Clase: ${T.clase}</p>`;
    }
    U.chips($("#tp", sec), TIPOS.map(t => ({ id: t.id, t: t.t })), tipo, elegirTipo);
    elegirTipo("blando"); textoGrado();

    /* ---- cuerpo: zonas de edema ---- */
    const cu = $("#cuerpo", sec);
    function zonas() {
      const D = DIST.find(d => d.id === dist), on = z => D.zonas.includes(z);
      const rojo = z => on(z) ? "rgba(37,99,235,.55)" : "none", ctr = z => on(z) ? "#1D4ED8" : "transparent";
      const piel = "#F2C9A8", cont = "#8B5A3C";
      cu.innerHTML = `
        <!-- figura de frente -->
        <g stroke="${cont}" stroke-width="2.5" fill="${piel}">
          <ellipse cx="100" cy="34" rx="20" ry="24"/>
          <rect x="92" y="54" width="16" height="16" rx="4"/>
          <path d="M66 74 Q100 66 134 74 L140 160 Q100 170 60 160 Z"/>
          <rect x="40" y="76" width="18" height="86" rx="9"/><rect x="142" y="76" width="18" height="86" rx="9"/>
          <rect x="70" y="160" width="26" height="92" rx="12"/><rect x="104" y="160" width="26" height="92" rx="12"/>
        </g>
        <ellipse cx="90" cy="30" rx="7" ry="${on("parpados") ? 7 : 3.5}" fill="${on("parpados") ? "rgba(37,99,235,.6)" : "#6B4F3A"}" stroke="${ctr("parpados")}"/>
        <ellipse cx="110" cy="30" rx="7" ry="${on("parpados") ? 7 : 3.5}" fill="${on("parpados") ? "rgba(37,99,235,.6)" : "#6B4F3A"}" stroke="${ctr("parpados")}"/>
        <rect x="90" y="52" width="20" height="20" rx="6" fill="${rojo("cuello")}" stroke="${ctr("cuello")}" stroke-width="2.5"/>
        <ellipse cx="100" cy="128" rx="30" ry="${on("abdomen") ? 28 : 0}" fill="${rojo("abdomen")}" stroke="${ctr("abdomen")}" stroke-width="2.5"/>
        <rect x="40" y="76" width="18" height="86" rx="9" fill="${rojo("brazos")}" stroke="${ctr("brazos")}" stroke-width="2.5"/>
        <rect x="142" y="76" width="18" height="86" rx="9" fill="${rojo("brazos")}" stroke="${ctr("brazos")}" stroke-width="2.5"/>
        <rect x="68" y="232" width="30" height="26" rx="10" fill="${rojo("tobillos")}" stroke="${ctr("tobillos")}" stroke-width="2.5"/>
        <rect x="102" y="232" width="30" height="26" rx="10" fill="${on("tobillos") && dist !== "general" ? rojo("tobillos") : on("tobillos") ? rojo("tobillos") : "none"}" stroke="${ctr("tobillos")}" stroke-width="2.5"/>
        <rect x="70" y="190" width="26" height="40" rx="10" fill="${rojo("pantorrilla")}" stroke="${ctr("pantorrilla")}" stroke-width="2.5"/>
        <text x="100" y="268" font-size="11" text-anchor="middle" fill="var(--tx2)">de pie</text>
        <!-- figura acostada -->
        <g transform="translate(180,150)" stroke="${cont}" stroke-width="2.5" fill="${piel}">
          <ellipse cx="14" cy="30" rx="22" ry="18"/>
          <rect x="34" y="14" width="96" height="32" rx="14"/>
          <rect x="128" y="18" width="90" height="12" rx="6"/><rect x="128" y="32" width="90" height="12" rx="6"/>
          <rect x="30" y="46" width="230" height="10" rx="4" fill="#CBD5E1" stroke="#94A3B8"/>
        </g>
        <ellipse cx="${180 + 128}" cy="${150 + 52}" rx="26" ry="${on("sacro") ? 11 : 0}" fill="${on("sacro") ? "rgba(37,99,235,.7)" : "none"}" stroke="${ctr("sacro")}" stroke-width="2.5"/>
        <text x="${180 + 128}" y="${150 + 80}" font-size="11" text-anchor="middle" fill="${on("sacro") ? "#1D4ED8" : "var(--tx2)"}">${on("sacro") ? "región sacra" : "acostado"}</text>
        <text x="330" y="40" font-size="12" fill="var(--tx2)">azul = zona con edema</text>`;
    }
    function elegirDist(id) { dist = id; zonas(); const D = DIST.find(d => d.id === id); $("#dst", sec).innerHTML = `<p><b>${D.t}.</b> ${D.txt}</p><p class="nota">Se ve en: ${D.caso}.</p>`; }
    U.chips($("#ds", sec), DIST.map(d => ({ id: d.id, t: d.t })), dist, elegirDist);
    elegirDist("declive");
    pintar(); requestAnimationFrame(paso);
  };
})();
