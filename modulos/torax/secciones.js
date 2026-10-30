/* Síndromes pleuropulmonares — pestañas: paciente virtual, tabla comparativa, ruidos agregados, explicación y prueba.
   Todo dato sale de PULMON (motor.js), que a su vez sale de la clase (wiki 07b-07f). */
(function () {
  "use strict";
  const U = window.UTIL, P = U.P, D = U.D, SECC = window.SECC, $ = U.$, $$ = U.$$, SON = U.son;
  const SEL = U.sel = { id: "derrame", lado: "D" };            // síndrome elegido, compartido entre pestañas
  const HERR = {
    insp: { ic: "👁️", n: "Inspección", col: "#64748B" }, palp: { ic: "✋", n: "Palpación", col: "#7C3AED" },
    perc: { ic: "🔨", n: "Percusión", col: "#F59E0B" }, ausc: { ic: "🎧", n: "Auscultación", col: "#16A34A" }
  };
  const LADO = { D: "derecho", I: "izquierdo", ambos: "ambos lados" };
  const lit = s => s && s.med && s.med.lit ? ` <span class="lit">literatura</span>` : "";
  const nombreSind = id => P.S[id].nombre;
  const avisoSonido = `<p class="aviso">🔊 <b>Los sonidos son sintetizados</b> por el navegador (ruido filtrado, osciladores y clics): sirven para reconocer el patrón y su momento en el ciclo respiratorio, no sustituyen la auscultación de un paciente real. Si no oyes nada, sube el volumen del dispositivo y toca una zona otra vez.</p>`;

  /* Frases de historia (de 07a/07e/07f) para la pista del examen */
  const HIST = {
    normal: "Sin síntomas respiratorios.",
    condensacion: "Fiebre, tos con expectoración mucopurulenta (a veces hemoptoica), disnea y dolor pleurítico localizado.",
    atelectasia: "Disnea y tos seca; si es aguda, fiebre. Antecedente de obstrucción bronquial (secreción espesa, cuerpo extraño, tumor o ganglios).",
    derrame: "Dolor pleurítico al comienzo que desaparece y se vuelve gravativo, con disnea que se agrava.",
    neumotorax: "Dolor torácico pleurítico, tos seca y disnea de inicio súbito «como una puñalada».",
    enfisema: "Fumador de muchos años con disnea progresiva (de esfuerzo a reposo) y tos seca.",
    caverna: "Tos, vómica y hemoptisis; antecedente de tuberculosis o absceso.",
    congestion: "Disnea de esfuerzo que llega hasta la disnea de decúbito y la paroxística nocturna; cardiópata.",
    pleuritis_aguda: "Dolor torácico que aumenta con la tos y la inspiración, tos seca, disnea y fiebre.",
    pleuritis_cronica: "Antecedente de pleuritis o derrame; dolor menos intenso y disnea a grandes esfuerzos.",
    bronquiectasia: "Tos con expectoración abundante matutina (400 a 600 ml al día) y hemoptisis, con antecedente de tuberculosis."
  };

  /* =====================================================================
     EXPLORADOR: el paciente virtual (se usa en la pestaña libre y en la prueba, con distintos permisos)
     ===================================================================== */
  function Explorador(host, cfg) {
    const libre = !!cfg.libre;
    const E = { id: cfg.id, lado: cfg.lado, fistula: !!cfg.fistula, tension: !!cfg.tension, vista: "pos", herr: "perc", zona: null, log: {}, orden: [], inspHecha: false, corte: libre, tos: false };
    const lefe = () => (E.lado === "ambos" ? "D" : E.lado);
    const S = () => P.S[E.id];

    host.innerHTML = `<div class="grid2"><div>
      ${libre ? `<div class="caja"><div class="ctrl" style="margin:0 0 6px"><label>Síndrome <select id="x-sind">${P.ORDEN.map(k => `<option value="${k}">${nombreSind(k)}</option>`).join("")}</select></label></div>
        <div class="ctrl" style="margin:0"><span>Lado enfermo:</span><span class="chips" id="x-lado"><button class="chip" data-l="D">Derecho</button><button class="chip" data-l="I">Izquierdo</button></span>
        <span id="x-extra"></span></div></div>` : ""}
      <div class="chips" id="x-vista"><button class="chip" data-v="ant">Cara anterior</button><button class="chip" data-v="pos">Cara posterior</button></div>
      <div class="herr" id="x-herr">${Object.keys(HERR).map(k => `<button class="chip" data-h="${k}">${HERR[k].ic} ${HERR[k].n}</button>`).join("")}</div>
      <div class="caja" style="padding:8px"><svg class="torso" id="x-torso" viewBox="0 0 300 310" role="group" aria-label="Tórax con seis zonas de exploración"></svg>
        <p class="nota" id="x-ayuda" style="margin:4px 4px 0"></p></div>
      <div class="ctrl"><label>🔊 Volumen <input type="range" id="x-vol" min="0" max="1" step="0.05"></label>
        <span class="nota">Compara siempre con la zona del otro lado, de arriba hacia abajo.</span></div>
    </div><div>
      <div class="letrero" id="x-let"></div>
      <div id="x-hall"></div>
      <div class="caja" id="x-ccaja" style="${E.corte ? "" : "display:none"}"><h3 style="margin-top:0">Por dentro (corte frontal)</h3>
        <svg id="x-corte" viewBox="0 0 300 330" style="width:100%;max-width:360px;display:block;margin:0 auto" role="img" aria-label="Corte frontal del tórax"></svg>
        <p class="nota" id="x-ctxt" style="margin:6px 0 0"></p></div>
      ${libre ? `<div class="tarj mo" id="x-clave"></div>` : ""}
      <div class="caja" id="x-log"></div>
    </div></div>`;

    const q = s => $(s, host);
    const ladoZona = c => (E.vista === "ant" ? (c === 0 ? "D" : "I") : (c === 0 ? "I" : "D"));
    const nomZona = (c, f) => `${P.FILAS[E.vista][f].split(" (")[0].toLowerCase()} ${E.vista === "ant" ? "anterior" : "posterior"} ${ladoZona(c) === "D" ? "derecha" : "izquierda"}`;

    /* ---- tórax visto desde fuera con sus seis zonas ---- */
    function pintarTorso() {
      const G = P.geom(E.id, lefe(), { tension: E.tension });
      const ver = libre || E.inspHecha;
      const bultos = ver ? { R: 34 - G.R.xo, L: G.L.xo - 266 } : { R: 0, L: 0 };
      let o = D.torsoSVG(E.vista, bultos);
      for (let c = 0; c < 2; c++) for (let f = 0; f < 3; f++) {
        const z = E.zona && E.zona.c === c && E.zona.f === f && E.herr !== "insp";
        o += `<rect class="zona${z ? " sel" : ""}" data-c="${c}" data-f="${f}" x="${D.ZX[c]}" y="${D.ZY[f]}" width="${D.ZW}" height="${D.ZH}" rx="10" tabindex="0" role="button" aria-label="${nomZona(c, f)}"/>`;
        ["palp", "perc", "ausc"].forEach((h, i) => { if (E.log[E.vista + c + f + h]) o += `<circle class="tpunto" cx="${D.ZX[c] + 22 + i * 26}" cy="${D.ZY[f] + 48}" r="6" fill="${HERR[h].col}"/>`; });
      }
      [0, 1, 2].forEach(f => { o += `<text x="3" y="${D.ZY[f] + 34}" font-size="11" fill="var(--tx2)" font-weight="700">${["1", "2", "3"][f]}</text>`; });
      q("#x-torso").innerHTML = o;
      q("#x-ayuda").innerHTML = `Filas: <b>1</b> ${P.FILAS[E.vista][0]} · <b>2</b> ${P.FILAS[E.vista][1]} · <b>3</b> ${P.FILAS[E.vista][2]}. ` +
        `Izquierda de la figura = ${E.vista === "ant" ? "lado <b>derecho</b>" : "lado <b>izquierdo</b>"} del paciente. ` +
        `<span class="nota">Puntos: <span style="color:${HERR.palp.col}">●</span> palpación <span style="color:${HERR.perc.col}">●</span> percusión <span style="color:${HERR.ausc.col}">●</span> auscultación.</span>`;
      $$("[data-c]", q("#x-torso")).forEach(r => {
        const act = () => examinar(+r.dataset.c, +r.dataset.f);
        r.onclick = act; r.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } };
      });
      $$("#x-vista .chip", host).forEach(b => b.classList.toggle("act", b.dataset.v === E.vista));
      $$("#x-herr .chip", host).forEach(b => b.classList.toggle("act", b.dataset.h === E.herr));
    }

    /* ---- corte frontal ---- */
    function pintarCorte() {
      const G = P.geom(E.id, lefe(), { tension: E.tension });
      q("#x-corte").innerHTML = D.corteSVG(G, "x" + Math.floor(Math.random() * 1e4));
      const s = S();
      q("#x-ctxt").innerHTML = `<b>${libre ? nombreSind(E.id) + (s.bilateral ? "" : " " + LADO[E.lado]) : "Radiografía simulada"}.</b> ${G.rotulo}${lit(s)}` +
        (E.id === "neumotorax" && E.tension ? " Con el neumotórax a tensión el diafragma se aplana y los espacios intercostales se ensanchan." : "") +
        (E.id === "derrame" ? " El líquido ocupa la base y sube más en la axila (curva de Damoiseau)." : "");
    }
    function pintarClave() {
      if (!libre) return;
      const s = S();
      q("#x-clave").innerHTML = `<b class="t">En una frase</b>${s.clave}`;
    }

    /* ---- registro de hallazgos ---- */
    function resumen(h, herr) {
      if (herr === "palp") return h.vvTxt.replace("Vibraciones vocales ", "vibraciones ").toLowerCase();
      if (herr === "perc") return h.percTxt.toLowerCase();
      return [h.mvTxt.replace("Murmullo vesicular ", "MV ").toLowerCase()].concat(h.advTxt.map(x => x.toLowerCase())).concat(h.voz !== "nor" ? [h.vozTxt.split(":")[0].toLowerCase()] : []).join(" + ");
    }
    function registrar(clave, txt, herr) {
      if (!E.log[clave]) E.orden.push(clave);
      E.log[clave] = { txt, herr };
      pintarLog();
    }
    function pintarLog() {
      const L = E.orden.slice(-16).reverse().map(k => `<tr><td>${HERR[E.log[k].herr].ic}</td><td>${E.log[k].txt}</td></tr>`).join("");
      q("#x-log").innerHTML = `<h3 style="margin-top:0">📝 Hallazgos registrados (${E.orden.length})</h3>` +
        (L ? `<table class="logt">${L}</table>` : `<p class="nota">Aún no has examinado nada. Elige una herramienta y toca una zona del tórax.</p>`);
    }

    /* ---- tarjetas de hallazgo ---- */
    function capasDe(h, tos) {
      const L = [{ k: "mv", n: h.mv }];
      h.adv.forEach(k => { if (tos && (k === "roncus" || k === "subcrepitantes")) return; L.push({ k }); });
      return L;
    }
    function vozHTML(h) {
      const m = {
        nor: ["tr… …nta …", "filter:blur(2.5px);opacity:.55", ""], dis: ["tr… …", "filter:blur(4px);opacity:.28", ""],
        broncofonia: ["TREINTA Y TRES", "font-weight:700", ""], pectoriloquia: ["treinta y tres", "font-weight:700;letter-spacing:2px", ""],
        egofonia: ["tréééinta y tréés", "color:var(--mo)", "ego"]
      }[h.voz];
      return `<div class="vozv ${m[2]}" style="${m[1]}">${m[0]}</div>`;
    }
    function pintarHall(extra) {
      const z = E.zona, cont = q("#x-hall");
      if (E.herr === "insp") {
        const s = S(), G = P.geom(E.id, lefe(), { tension: E.tension });
        cont.innerHTML = `<div class="hall"><b>${HERR.insp.ic} Inspección y expansibilidad</b>
          <p style="margin:6px 0">${s.id === "normal" ? s.insp : (s.bilateral ? "Ambos hemitórax: " : "Hemitórax " + LADO[E.lado] + ": ") + s.insp}</p>
          ${s.bilateral || s.id === "normal" ? "" : `<p class="nota" style="margin:0 0 6px">El hemitórax ${E.lado === "D" ? "izquierdo" : "derecho"} se ve normal${s.id === "derrame" || s.id === "neumotorax" || s.id === "atelectasia" || s.id === "pleuritis_cronica" ? " (con aumento compensador de su expansibilidad)" : ""}.</p>`}
          <div class="causa">${s.why.insp}</div></div>`;
        q("#x-let").innerHTML = `<span class="k">${HERR.insp.ic}</span> ${s.inspCorto}`;
        return;
      }
      if (!z) {
        q("#x-let").innerHTML = `<span class="k">${HERR[E.herr].ic}</span> Toca una zona del tórax para ${E.herr === "palp" ? "palpar las vibraciones vocales" : E.herr === "perc" ? "percutir" : "auscultar"}.`;
        cont.innerHTML = ""; return;
      }
      const h = z.h, nz = nomZona(z.c, z.f);
      if (E.herr === "palp") {
        const amp = { abol: 0, dis: 0.3, nor: 0.6, aum: 1 }[h.vv];
        q("#x-let").innerHTML = `<span class="k">✋</span> ${nz}: <b>${h.vvTxt}</b>`;
        cont.innerHTML = `<div class="hall"><b>✋ Vibraciones vocales · ${nz}</b><p style="margin:6px 0">Pídele decir «treinta y treinta y tres» y apoya la palma completa, comparando con la zona simétrica: <b>${h.vvTxt}</b>.</p>
          <canvas id="x-cv" class="anim" style="height:56px"></canvas><div class="causa">${h.why.vv}</div></div>`;
        U.vibra(q("#x-cv"), amp);
      } else if (E.herr === "perc") {
        const pm = P.PERC[h.perc];
        q("#x-let").innerHTML = `<span class="k">🔨</span> ${nz}: <b>${pm.n}</b>`;
        cont.innerHTML = `<div class="hall"><b>🔨 Percusión · ${nz}</b><p style="margin:6px 0"><b>${pm.n}</b> — ${pm.d}</p>
          <p class="nota" style="margin:0 0 6px">Tono ${pm.tono} · duración ${pm.dur} · intensidad ${pm.int}</p>
          <button class="btn sec" id="x-rep">🔊 Percutir otra vez</button><div class="causa">${h.why.perc}</div></div>`;
        q("#x-rep").onclick = () => SON.percutir(h.perc);
        SON.percutir(h.perc);
      } else {
        q("#x-let").innerHTML = `<span class="k">🎧</span> ${nz}: <b>${h.mvTxt.replace("Murmullo vesicular ", "MV ")}</b>${h.advTxt.length ? " + " + h.advTxt.join(" + ") : ""}`;
        const tosBtn = h.adv.some(k => ["roncus", "subcrepitantes", "crepitantes", "sibilancias", "frote"].includes(k));
        cont.innerHTML = `<div class="hall"><b>🎧 Auscultación · ${nz}</b>
          <ul style="margin:6px 0;padding-left:20px"><li>${h.mvTxt}</li>${h.advTxt.map(t => `<li><b>${t}</b></li>`).join("")}<li>${h.vozTxt}</li></ul>
          ${vozHTML(h)}<canvas id="x-fono" class="anim" style="height:78px"></canvas>
          <div class="ctrl" style="margin:6px 0"><button class="btn az" id="x-play">▶ Escuchar</button><button class="btn sec" id="x-stop">⏹</button>
            ${tosBtn ? `<button class="btn sec" id="x-tos">😮‍💨 Que tosa</button>` : ""}</div>
          <p class="nota" id="x-tosr" style="margin:0 0 6px">${extra || ""}</p>
          <div class="causa">${h.why.aus}</div></div>`;
        const reproducir = () => {
          const parte = SON.tocar(capasDe(h, E.tos), 2, 7);
          if (parte) U.fono(q("#x-fono"), parte); else q("#x-tosr").textContent = "Este navegador no permite audio; mira el fonoauscultograma.";
          if (!parte) U.fono(q("#x-fono"), D.compilarSonido(capasDe(h, E.tos), 2, 7));
        };
        q("#x-play").onclick = reproducir; q("#x-stop").onclick = () => SON.parar();
        if (tosBtn) q("#x-tos").onclick = () => {
          E.tos = !E.tos;
          const cambian = h.adv.filter(k => k === "roncus" || k === "subcrepitantes").map(k => P.ADV[k]), quedan = h.adv.filter(k => !(k === "roncus" || k === "subcrepitantes")).map(k => P.ADV[k]);
          q("#x-tosr").innerHTML = E.tos ? (cambian.length ? `Después de toser: <b>${cambian.join(", ")}</b> cambian o desaparecen (la secreción se movilizó)` : "Después de toser nada cambia") + (quedan.length ? `; <b>${quedan.join(", ")}</b> NO cambian con la tos.` : ".") : "Sin toser.";
          reproducir();
        };
        E.tos = false; reproducir();
      }
    }

    function examinar(c, f) {
      if (E.herr === "insp") return;
      const lz = ladoZona(c), h = P.hallazgo(E.id, lefe(), E.vista, lz, f, { fistula: E.fistula });
      E.zona = { c, f, h }; E.tos = false;
      registrar(E.vista + c + f + E.herr, `${nomZona(c, f)} — ${HERR[E.herr].n.toLowerCase()}: ${resumen(h, E.herr)}`, E.herr);
      pintarTorso(); pintarHall();
    }
    function elegirHerr(h) {
      E.herr = h; SON.parar(); U.gen++;
      if (h === "insp") { E.inspHecha = true; registrar("insp", `inspección: ${S().inspCorto}`, "insp"); }
      pintarTorso();
      if (h !== "insp" && E.zona) { E.zona.h = P.hallazgo(E.id, lefe(), E.vista, E.vista === "ant" ? (E.zona.c === 0 ? "D" : "I") : (E.zona.c === 0 ? "I" : "D"), E.zona.f, { fistula: E.fistula }); }
      pintarHall();
    }
    $$("#x-herr .chip", host).forEach(b => b.onclick = () => elegirHerr(b.dataset.h));
    $$("#x-vista .chip", host).forEach(b => b.onclick = () => { E.vista = b.dataset.v; E.zona = null; SON.parar(); U.gen++; pintarTorso(); if (E.herr !== "insp") pintarHall(); });
    const vol = q("#x-vol"); vol.value = SON.vol; vol.oninput = () => { SON.vol = +vol.value; };

    /* ---- controles del modo libre ---- */
    function pintarControles() {
      if (!libre) return;
      const s = S();
      q("#x-sind").value = E.id;
      $$("#x-lado .chip", host).forEach(b => { b.classList.toggle("act", !s.bilateral && b.dataset.l === E.lado); b.disabled = s.bilateral; b.style.opacity = s.bilateral ? ".4" : "1"; });
      q("#x-extra").innerHTML = E.id === "neumotorax"
        ? `<label><input type="checkbox" id="x-fis" ${E.fistula ? "checked" : ""}> con fístula broncopleural</label> <label><input type="checkbox" id="x-ten" ${E.tension ? "checked" : ""}> a tensión</label>`
        : s.bilateral ? `<span class="nota">Síndrome bilateral</span>` : "";
      if (q("#x-fis")) { q("#x-fis").onchange = e => { E.fistula = e.target.checked; recargar(false); }; q("#x-ten").onchange = e => { E.tension = e.target.checked; recargar(false); }; }
    }
    function recargar(limpiar) {
      SEL.id = E.id; SEL.lado = E.lado === "ambos" ? SEL.lado : E.lado;
      if (limpiar) { E.log = {}; E.orden = []; E.zona = null; E.inspHecha = false; }
      SON.parar(); U.gen++;
      pintarControles(); pintarTorso(); pintarCorte(); pintarClave(); pintarLog();
      if (E.zona) { E.zona.h = P.hallazgo(E.id, lefe(), E.vista, E.vista === "ant" ? (E.zona.c === 0 ? "D" : "I") : (E.zona.c === 0 ? "I" : "D"), E.zona.f, { fistula: E.fistula }); }
      pintarHall();
    }
    if (libre) {
      q("#x-sind").onchange = e => { E.id = e.target.value; E.lado = P.S[E.id].bilateral ? "ambos" : (SEL.lado || "D"); E.fistula = false; E.tension = false; recargar(true); };
      $$("#x-lado .chip", host).forEach(b => b.onclick = () => { if (P.S[E.id].bilateral) return; E.lado = b.dataset.l; recargar(true); });
    }
    recargar(true);
    return {
      E, mostrarCorte() { E.corte = true; q("#x-ccaja").style.display = ""; pintarCorte(); },
      herramientasUsadas() { return new Set(E.orden.map(k => E.log[k].herr)); },
      entradas() { return E.orden.map(k => E.log[k]); },
      zonas() { return E.orden.filter(k => k !== "insp").length; }
    };
  }

  /* =====================================================================
     1 · PACIENTE VIRTUAL
     ===================================================================== */
  SECC.paciente = function (main) {
    main.innerHTML = `<h1>Paciente virtual: examina el tórax</h1>
      <p class="lema">Elige el síndrome y el lado, y «examina» tocando las zonas con las cuatro herramientas. Cada hallazgo trae su explicación causa → efecto, y el corte muestra qué hay dentro: líquido, aire, exudado, colapso y hacia dónde se mueve el mediastino.</p>
      ${avisoSonido}<div id="expl"></div>
      <div class="caja" style="margin-top:10px;padding:10px 12px"><h3 style="margin:2px 0 8px">🫁 Lo que pasa en el alvéolo <small class="nota">(ilustración + capa viva: cambia con el síndrome que elijas)</small></h3>
        <div class="escena-real" id="alvreal" style="background:#020B22"><canvas role="img" aria-label="Racimo de alvéolos que respira; según el síndrome se llena de exudado, se colapsa, atrapa aire o tiene líquido"></canvas><img class="rot" alt="" src="rot_alveolos.svg"></div>
        <p class="pie-esc nota"></p></div>`;
    const s = P.S[SEL.id];
    Explorador($("#expl", main), { libre: true, id: SEL.id, lado: s.bilateral ? "ambos" : SEL.lado });
    U.alvReal($("#alvreal", main), P);
  };

  /* =====================================================================
     2 · TABLA COMPARATIVA
     ===================================================================== */
  SECC.tabla = function (main) {
    const filas = P.ORDEN.filter(k => P.S[k].enTabla !== false);
    const cols = [["insp", "Inspección"], ["palp", "Palpación (vibraciones vocales)"], ["perc", "Percusión"], ["aus", "Auscultación"], ["med", "Mediastino (Rx)"]];
    let tapar = false; const reveladas = new Set();
    main.innerHTML = `<h1>Tabla comparativa de síndromes</h1>
      <p class="lema">La tabla de la clase (07e y 07f): síndromes × los cuatro métodos de exploración, más el mediastino. Toca una fila para resaltarla y verla en el paciente virtual.</p>
      <div class="caja"><div class="ctrl" style="margin:0"><button class="btn sec" id="t-tapar">🙈 Tapar celdas para estudiar</button><span class="nota">Con las celdas tapadas, recita el síndrome y toca para comprobar.</span></div></div>
      <div class="caja scroll"><table class="cmp"><thead><tr><th>Síndrome</th>${cols.map(c => `<th>${c[1]}</th>`).join("")}</tr></thead><tbody id="t-cuerpo"></tbody></table></div>
      <div class="caja" id="t-det"></div>`;
    function pintar() {
      $("#t-cuerpo", main).innerHTML = filas.map(id => {
        const s = P.S[id];
        return `<tr data-id="${id}" class="${SEL.id === id ? "sel" : ""}"><th>${s.nombre}</th>${cols.map(c => {
          const k = id + c[0], oculto = tapar && !reveladas.has(k);
          return `<td data-k="${k}" class="${oculto ? "tapa" : ""}">${s.tabla[c[0]]}${c[0] === "med" ? lit(s) : ""}</td>`;
        }).join("")}</tr>`;
      }).join("");
      $$("#t-cuerpo tr", main).forEach(tr => tr.onclick = e => {
        const td = e.target.closest("td");
        if (td && td.classList.contains("tapa")) { reveladas.add(td.dataset.k); pintar(); return; }
        SEL.id = tr.dataset.id; if (P.S[SEL.id].bilateral === false && !SEL.lado) SEL.lado = "D"; pintar();
      });
      const s = P.S[SEL.id];
      $("#t-det", main).innerHTML = s.enTabla === false ? "" : `<h3 style="margin-top:0">${s.nombre}</h3><p>${s.clave}</p>
        <div class="cuad"><b>Inspección</b><span>${s.why.insp}</span><b>Palpación</b><span>${s.why.vv}</span><b>Percusión</b><span>${s.why.perc}</span><b>Auscultación</b><span>${s.why.aus}</span><b>Mediastino</b><span>${s.med.txt}${lit(s)}</span></div>
        <p style="margin:10px 0 0"><button class="btn az" id="t-ir">🫁 Examinarlo en el paciente virtual</button></p>`;
      const ir = $("#t-ir", main); if (ir) ir.onclick = () => { location.hash = "#paciente"; };
    }
    $("#t-tapar", main).onclick = e => { tapar = !tapar; reveladas.clear(); e.target.textContent = tapar ? "👁️ Mostrar todo" : "🙈 Tapar celdas para estudiar"; pintar(); };
    pintar();
    main.insertAdjacentHTML("beforeend", `<div class="caja"><h3 style="margin-top:0">Para no confundirlos</h3><ul style="margin:0;padding-left:20px">
      <li><b>Atelectasia vs derrame:</b> mismo apagado (mate, vibraciones y murmullo abolidos). Decide el volumen: la atelectasia <b>retrae</b> y <b>jala</b> el mediastino al lado enfermo; el derrame <b>abomba</b> y lo <b>empuja</b> al lado sano.</li>
      <li><b>Condensación vs caverna:</b> ambas con vibraciones aumentadas; la condensación es mate con soplo tubárico, la caverna es timpánica con soplo cavitario.</li>
      <li><b>Neumotórax vs enfisema:</b> el neumotórax es timpánico, unilateral, con vibraciones abolidas; el enfisema es hipersonoro, bilateral, con espiración prolongada.</li>
      <li><b>Condensación vs congestión:</b> los dos tienen crepitantes; en la congestión son bibasales y el resto del examen es casi normal.</li></ul></div>`);
  };

  /* =====================================================================
     3 · RUIDOS AGREGADOS
     ===================================================================== */
  SECC.ruidos = function (main) {
    let sel = "crepitantes";
    main.innerHTML = `<h1>Ruidos agregados y soplos</h1>
      <p class="lema">Cada ruido nace de un mecanismo distinto. Elige uno, escúchalo y mira la animación: al final aparece el resumen para compararlos.</p>${avisoSonido}
      <div class="chips" id="r-chips">${P.RUIDOS.map(r => `<button class="chip" data-r="${r.id}">${r.n.replace(/ \(.*\)/, "")}</button>`).join("")}</div>
      <div class="grid2"><div class="caja"><canvas id="r-an" class="anim"></canvas><canvas id="r-fono" class="anim" style="margin-top:8px"></canvas>
        <div class="ctrl" style="margin:8px 0 0"><button class="btn az" id="r-play">▶ Escuchar</button><button class="btn sec" id="r-stop">⏹ Parar</button>
        <label>🔊 <input type="range" id="r-vol" min="0" max="1" step="0.05"></label></div></div>
      <div class="caja" id="r-ficha"></div></div>
      <h2>Para compararlos</h2><div class="caja scroll"><table class="cmp" style="min-width:760px"><thead><tr><th>Ruido</th><th>Grupo</th><th>Fase</th><th>¿Cambia con la tos?</th><th>Dónde nace</th></tr></thead><tbody>
      ${P.RUIDOS.map(r => `<tr><th>${r.n}</th><td>${r.grupo}</td><td>${r.fase}</td><td>${r.tos}</td><td>${r.donde}</td></tr>`).join("")}</tbody></table></div>
      <div class="aviso">Relación inspiración/espiración: la clase (2020) da <b>1:2 a 1:1,5</b> como normal y dice que en el asma, el enfisema y el EPOC se <b>prolonga la espiración</b>. Los apuntes de 2018 dan 1:3 y hablan de inversión a 3:1. <b>Discrepancia:</b> se sigue la versión 2020 (más coherente con el atrapamiento aéreo) y el profesor pidió contrastarla en el libro. Los sonidos de este módulo usan I:E = 1:1,6.</div>`;
    const vol = $("#r-vol", main); vol.value = SON.vol; vol.oninput = () => { SON.vol = +vol.value; };
    function mostrar() {
      SON.parar(); U.gen++;
      const r = P.RUIDOS.find(x => x.id === sel);
      $$("#r-chips .chip", main).forEach(b => b.classList.toggle("act", b.dataset.r === sel));
      $("#r-ficha", main).innerHTML = `<h3 style="margin-top:0">${r.n}</h3><div class="pila"><span class="marc">${r.grupo}</span></div>
        <div class="cuad"><b>Suena como</b><span>${r.ono}</span><b>Fase</b><span>${r.fase}</span><b>Con la tos</b><span>${r.tos}</span><b>Dónde</b><span>${r.donde}</span>
        <b>Mecanismo</b><span>${r.mec}</span><b>Aparece en</b><span>${r.enf.join("; ")}</span></div>`;
      const parte = D.compilarSonido(r.capas, 2, 5);
      U.anim($("#r-an", main), r.anim);
      U.fono($("#r-fono", main), parte);
      $("#r-play", main).onclick = () => { SON.tocar(r.capas, 2, 5); };
      $("#r-stop", main).onclick = () => SON.parar();
    }
    $$("#r-chips .chip", main).forEach(b => b.onclick = () => { sel = b.dataset.r; mostrar(); });
    mostrar();
  };

  /* =====================================================================
     4 · EXPLICACIÓN
     ===================================================================== */
  SECC.explicacion = function (main) {
    main.innerHTML = `<h1>Cómo se piensa un síndrome pleuropulmonar</h1>
      <p class="lema">Ningún hallazgo aislado define un síndrome: lo define la combinación de los cuatro métodos. Y cada combinación sale de una pregunta simple: <b>¿qué hay debajo de tu mano?</b></p>
      <div class="grid3">
        <div class="tarj"><b class="t">¿Qué es?</b>Un síndrome pleuropulmonar es un patrón de hallazgos (inspección, palpación, percusión y auscultación) que revela qué ocupa el lugar del aire: exudado, líquido, aire libre, colapso, una cavidad o aire atrapado.</div>
        <div class="tarj ve"><b class="t">¿Cómo se explora?</b>Con el paciente sentado, <b>de arriba hacia abajo, comparando puntos simétricos</b>: inspección de la forma y la expansión; palpación (Rouault y vibraciones vocales con «treinta y tres»); percusión dígito-digital de Gerhardt; auscultación del murmullo, los ruidos agregados y la voz.</div>
        <div class="tarj na"><b class="t">¿Por qué funciona?</b>El sonido y la vibración viajan distinto según el medio: el sólido los conduce, el líquido y el aire libre los apagan o los resuenan, y el aire atrapado los exagera.</div>
        <div class="tarj mo"><b class="t">¿Para qué sirve?</b>Para distinguir cuadros que comparten síntomas (tos, disnea, dolor pleurítico) y decidir qué pedir: radiografía, punción pleural, gasometría o drenaje urgente.</div>
      </div>
      <h2>La regla de las tres preguntas</h2>
      <div class="caja scroll"><table class="cmp" style="min-width:720px"><thead><tr><th>Qué hay bajo la mano</th><th>Vibraciones</th><th>Percusión</th><th>Auscultación</th><th>Ejemplo</th></tr></thead><tbody>
        <tr><th>Pulmón con aire</th><td>Normales</td><td>Sonoro</td><td>Murmullo vesicular</td><td>Sano</td></tr>
        <tr><th>Sólido y bronquio abierto</th><td>Aumentadas</td><td>Mate</td><td>Soplo tubárico, crepitantes, broncofonía</td><td>Condensación</td></tr>
        <tr><th>Sólido o colapso con bronquio tapado</th><td>Disminuidas o abolidas</td><td>Mate</td><td>Silencio respiratorio</td><td>Atelectasia</td></tr>
        <tr><th>Líquido en la pleura</th><td>Disminuidas o abolidas</td><td>Mate con curva de Damoiseau</td><td>Silencio; soplo pleurítico arriba</td><td>Derrame</td></tr>
        <tr><th>Aire libre en la pleura</th><td>Abolidas</td><td>Timpánico</td><td>Silencio (anfórico si hay fístula)</td><td>Neumotórax</td></tr>
        <tr><th>Aire atrapado en los alvéolos</th><td>Disminuidas</td><td>Hipersonoro</td><td>Murmullo disminuido, espiración prolongada, roncus y sibilancias</td><td>Enfisema, asma</td></tr>
        <tr><th>Cavidad aérea</th><td>Aumentadas</td><td>Timpánico</td><td>Soplo cavitario, pectoriloquia</td><td>Caverna, absceso</td></tr></tbody></table></div>
      <ol style="padding-left:22px"><li><b>¿Qué hay debajo de la mano?</b> aire, sólido, líquido o aire libre (vibraciones y percusión lo dicen).</li>
        <li><b>¿El bronquio está abierto?</b> Si lo está, el sólido transmite la voz y suena el soplo; si está tapado, todo se apaga.</li>
        <li><b>¿Hacia dónde está el mediastino?</b> Empujado al lado sano (derrame, neumotórax a tensión) o jalado al lado enfermo (atelectasia, paquipleuritis).</li></ol>
      <h2>Qué hace cada herramienta en el simulador</h2>
      <div class="grid3"><div class="tarj"><b class="t">👁️ Inspección</b>Forma y expansibilidad: abombamiento (derrame, neumotórax), retracción (atelectasia, paquipleuritis), tórax en tonel (enfisema).</div>
        <div class="tarj mo"><b class="t">✋ Palpación</b>Vibraciones vocales: aumentadas donde el sólido las conduce; disminuidas o abolidas donde hay líquido, aire libre o colapso.</div>
        <div class="tarj na"><b class="t">🔨 Percusión</b>Mate, submate, sonoro, hipersonoro (aire atrapado: más grave y duradero) y timpánico (aire libre: agudo y resonante, como un tambor).</div>
        <div class="tarj ve"><b class="t">🎧 Auscultación</b>Murmullo vesicular, soplos, estertores secos y húmedos, frote y voz. Prueba «que tosa» para separar subcrepitantes y roncus de crepitantes, sibilancias y frote.</div></div>
      <h2>Errores frecuentes</h2>
      <ul style="padding-left:22px"><li><b>Hipersonoridad no es timpanismo:</b> la primera exagera el claro por aire atrapado (enfisema, asma); el segundo es un sonido distinto, de aire libre (neumotórax).</li>
        <li><b>Crepitantes no son subcrepitantes:</b> los finos son alveolares, de final de inspiración y no cambian con la tos; los gruesos son bronquiales, en ambos tiempos y sí cambian.</li>
        <li><b>Roncus no son sibilancias:</b> los roncus son graves (bronquios gruesos) y cambian con la tos; las sibilancias son agudas (bronquiolos), más espiratorias, y no cambian.</li>
        <li><b>Zonas que suenan raro sin estar enfermas:</b> el hígado (mate bajo el 5.º espacio derecho), el corazón (submate) y la cámara gástrica (timpánica, espacio de Traube) son normales.</li>
        <li><b>La tos o la inspiración forzada</b> están contraindicadas con dolor torácico intenso, disnea acentuada o hemoptisis.</li></ul>
      <div class="aviso">Datos que la clase no precisa y el simulador completa con la fisiología general están marcados <span class="lit">literatura</span> (por ejemplo, que el mediastino se desvía hacia el lado sano en el neumotórax a tensión). Si la clase y la literatura difieren, manda la clase.</div>
      ${avisoSonido}`;
  };

  /* =====================================================================
     5 · PONTE A PRUEBA
     ===================================================================== */
  SECC.prueba = function (main) {
    const est = () => { const Pr = U.leer(); return Pr.torax_prueba || { n: 0, ok: 0 }; };
    const sumar = acierto => { const Pr = U.leer(), e = est(); e.n++; if (acierto) e.ok++; Pr.torax_prueba = e; U.guardar(Pr); };
    let modo = "examen";
    main.innerHTML = `<h1>🎯 Ponte a prueba</h1>
      <p class="lema">Tres modos: <b>examina y diagnostica</b> a un paciente oculto, <b>reconoce el síndrome</b> por sus hallazgos o <b>escucha y nombra</b> el ruido. Cada respuesta se corrige con su explicación.</p>
      <div class="chips" id="p-modos"><button class="chip" data-m="examen">🩺 Examina y diagnostica</button><button class="chip" data-m="rapida">⚡ Reconoce el síndrome</button><button class="chip" data-m="ruido">🎧 Escucha y nombra</button></div>
      <p class="nota" id="p-est"></p><div id="p-cuerpo"></div>`;
    const cuerpo = $("#p-cuerpo", main);
    const pintarEst = () => { const e = est(); $("#p-est", main).textContent = e.n ? `Tu historial: ${e.ok} aciertos de ${e.n} (${Math.round(100 * e.ok / e.n)} %).` : ""; };
    function cambiar(m) { modo = m; SON.parar(); U.gen++; $$("#p-modos .chip", main).forEach(b => b.classList.toggle("act", b.dataset.m === m)); pintarEst(); ({ examen, rapida, ruido })[m](); }
    $$("#p-modos .chip", main).forEach(b => b.onclick = () => cambiar(b.dataset.m));

    /* --- modo 1: paciente oculto --- */
    function examen() {
      const r = P.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0), caso = P.crearCaso(r), s = P.S[caso.id];
      let hechos = { hist: false, rx: false }, resp = { id: null, lado: null }, cerrado = false;
      cuerpo.innerHTML = `<div class="caja"><div class="ctrl" style="margin:0"><button class="btn sec" id="q-nuevo">🔄 Otro paciente</button>
          <button class="btn sec" id="q-hist">📋 Pedir la historia (pista)</button><button class="btn sec" id="q-rx">🩻 Pedir radiografía (pista)</button></div>
        <div id="q-histtxt" class="nota" style="margin-top:6px"></div></div>
        <div id="q-exp"></div>
        <div class="caja"><h3 style="margin-top:0">Tu diagnóstico</h3><div class="opciones" id="q-ops">${P.POOL.map(k => `<button data-k="${k}">${P.S[k].nombre}</button>`).join("")}</div>
          <div class="ctrl"><span>Lado:</span><span class="chips" id="q-lado"><button class="chip" data-l="D">Derecho</button><button class="chip" data-l="I">Izquierdo</button><button class="chip" data-l="ambos">Ambos / ninguno</button></span>
          <button class="btn az" id="q-resp">✔ Responder</button></div></div><div id="q-res"></div>`;
      const exp = Explorador($("#q-exp", cuerpo), { libre: false, id: caso.id, lado: caso.lado, fistula: caso.fistula, tension: caso.tension });
      $("#q-nuevo", cuerpo).onclick = () => cambiar("examen");
      $("#q-hist", cuerpo).onclick = () => { hechos.hist = true; $("#q-histtxt", cuerpo).innerHTML = `<b>Historia:</b> ${HIST[caso.id]}`; };
      $("#q-rx", cuerpo).onclick = () => { hechos.rx = true; exp.mostrarCorte(); };
      $$("#q-ops button", cuerpo).forEach(b => b.onclick = () => { if (cerrado) return; resp.id = b.dataset.k; $$("#q-ops button", cuerpo).forEach(x => x.classList.toggle("bien", x === b)); });
      $$("#q-lado .chip", cuerpo).forEach(b => b.onclick = () => { if (cerrado) return; resp.lado = b.dataset.l; $$("#q-lado .chip", cuerpo).forEach(x => x.classList.toggle("act", x === b)); });
      $("#q-resp", cuerpo).onclick = () => {
        if (cerrado) return;
        if (!resp.id) { $("#q-res", cuerpo).innerHTML = `<div class="res no">Elige un diagnóstico antes de responder.</div>`; return; }
        cerrado = true; SON.parar();
        const ok = resp.id === caso.id, ladoOk = s.bilateral ? true : resp.lado === caso.lado;
        sumar(ok); pintarEst(); exp.mostrarCorte();
        $$("#q-ops button", cuerpo).forEach(b => { b.classList.remove("bien"); if (b.dataset.k === caso.id) b.classList.add("bien"); else if (b.dataset.k === resp.id) b.classList.add("mal"); });
        const usadas = exp.herramientasUsadas(), faltan = ["insp", "palp", "perc", "ausc"].filter(h => !usadas.has(h)).map(h => HERR[h].ic + " " + HERR[h].n.toLowerCase());
        // lo que encontró, interpretado
        const entradas = exp.entradas().slice(0, 10).map(e => `<li>${HERR[e.herr].ic} ${e.txt}</li>`).join("");
        let porque = "";
        if (!ok) {
          const t = P.S[resp.id].tabla, r = s.tabla;
          porque = `<h3>Por qué no es ${P.S[resp.id].nombre}</h3><div class="cuad"><b>${P.S[resp.id].corto} daría</b><span>${[t.insp, t.palp, t.perc, t.aus].join(" · ")}</span><b>Este paciente</b><span>${[r.insp, r.palp, r.perc, r.aus].join(" · ")}</span></div>`;
        }
        $("#q-res", cuerpo).innerHTML = `<div class="res ${ok ? "ok" : "no"}"><h3 style="margin-top:0">${ok ? "✅ Correcto" : "❌ No era ese"}: ${s.nombre}${s.bilateral || caso.id === "normal" ? "" : " " + LADO[caso.lado]}</h3>
          ${ok && !ladoOk ? `<p>El síndrome está bien, pero el lado era el <b>${LADO[caso.lado]}</b>.</p>` : ""}
          <p><b>Clave:</b> ${s.clave}</p>
          <div class="cuad"><b>Inspección</b><span>${s.tabla.insp}</span><b>Palpación</b><span>${s.tabla.palp}</span><b>Percusión</b><span>${s.tabla.perc}</span><b>Auscultación</b><span>${s.tabla.aus}</span><b>Mediastino</b><span>${s.tabla.med}${lit(s)}</span></div>
          ${porque}
          <h3>Lo que tú encontraste</h3><ul style="padding-left:20px;margin:0">${entradas || "<li>No examinaste ninguna zona.</li>"}</ul>
          <p class="nota">Pistas usadas: ${(hechos.hist ? 1 : 0) + (hechos.rx ? 1 : 0)}.${faltan.length ? " No usaste: " + faltan.join(", ") + "." : " Usaste las cuatro herramientas."}</p>
          <p><button class="btn az" id="q-otro">🔄 Otro paciente</button></p></div>`;
        $("#q-otro", cuerpo).onclick = () => cambiar("examen");
        $("#q-res", cuerpo).scrollIntoView({ block: "nearest", behavior: "smooth" });
      };
    }

    /* --- modo 2: hallazgos escritos → síndrome --- */
    function rapida() {
      const r = P.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0), q = P.preguntaRapida(r), s = P.S[q.id];
      cuerpo.innerHTML = `<div class="caja"><h3 style="margin-top:0">¿Qué síndrome explica estos hallazgos?</h3>
        <div class="cuad">${q.pistas.map(p => `<b>${p[0]}</b><span>${p[1]}</span>`).join("")}</div></div>
        <div class="opciones" id="r-ops">${q.opciones.map(k => `<button data-k="${k}">${P.S[k].nombre}</button>`).join("")}</div><div id="r-res"></div>`;
      let hecho = false;
      $$("#r-ops button", cuerpo).forEach(b => b.onclick = () => {
        if (hecho) return; hecho = true; const ok = b.dataset.k === q.id; sumar(ok); pintarEst();
        $$("#r-ops button", cuerpo).forEach(x => { if (x.dataset.k === q.id) x.classList.add("bien"); else if (x === b) x.classList.add("mal"); });
        $("#r-res", cuerpo).innerHTML = `<div class="res ${ok ? "ok" : "no"}"><h3 style="margin-top:0">${ok ? "✅ Correcto" : "❌ Era"}: ${s.nombre}</h3><p><b>Clave:</b> ${s.clave}</p>
          <div class="cuad"><b>Inspección</b><span>${s.why.insp}</span><b>Palpación</b><span>${s.why.vv}</span><b>Percusión</b><span>${s.why.perc}</span><b>Auscultación</b><span>${s.why.aus}</span></div>
          ${ok ? "" : `<p><b>${P.S[b.dataset.k].nombre}</b> tendría: ${P.S[b.dataset.k].tabla.palp.toLowerCase()} · ${P.S[b.dataset.k].tabla.perc.toLowerCase()} · ${P.S[b.dataset.k].tabla.aus.toLowerCase()}.</p>`}
          <p><button class="btn az" id="r-otro">➡ Otra pregunta</button></p></div>`;
        $("#r-otro", cuerpo).onclick = () => cambiar("rapida");
      });
    }

    /* --- modo 3: sonido → nombre --- */
    function ruido() {
      const r = P.rng((Date.now() ^ (Math.random() * 1e9)) >>> 0), q = P.preguntaRuido(r), R = P.RUIDOS.find(x => x.id === q.id);
      cuerpo.innerHTML = `${avisoSonido}<div class="caja"><h3 style="margin-top:0">Escucha y nombra el ruido</h3>
        <canvas id="s-fono" class="anim"></canvas><div class="ctrl" style="margin:8px 0 0"><button class="btn az" id="s-play">▶ Escuchar</button><button class="btn sec" id="s-stop">⏹</button></div>
        <p class="nota" style="margin:6px 0 0">Fíjate en cuándo suena dentro del ciclo (I = inspiración, E = espiración) y en si es grave, agudo o crepitante.</p></div>
        <div class="opciones" id="s-ops">${q.opciones.map(k => `<button data-k="${k}">${P.RUIDOS.find(x => x.id === k).n}</button>`).join("")}</div><div id="s-res"></div>`;
      const reproducir = () => SON.tocar(R.capas, 2, 9);
      $("#s-play", cuerpo).onclick = reproducir; $("#s-stop", cuerpo).onclick = () => SON.parar();
      // el fonoauscultograma de la prueba solo muestra las fases, sin revelar la forma del ruido
      U.fono($("#s-fono", cuerpo), Object.assign(D.compilarSonido([], 2, 9), {}));
      let hecho = false;
      $$("#s-ops button", cuerpo).forEach(b => b.onclick = () => {
        if (hecho) return; hecho = true; SON.parar(); const ok = b.dataset.k === q.id; sumar(ok); pintarEst();
        $$("#s-ops button", cuerpo).forEach(x => { if (x.dataset.k === q.id) x.classList.add("bien"); else if (x === b) x.classList.add("mal"); });
        const mal = ok ? null : P.RUIDOS.find(x => x.id === b.dataset.k);
        $("#s-res", cuerpo).innerHTML = `<div class="res ${ok ? "ok" : "no"}"><h3 style="margin-top:0">${ok ? "✅ Correcto" : "❌ Era"}: ${R.n}</h3>
          <div class="cuad"><b>Suena como</b><span>${R.ono}</span><b>Fase</b><span>${R.fase}</span><b>Con la tos</b><span>${R.tos}</span><b>Mecanismo</b><span>${R.mec}</span><b>Aparece en</b><span>${R.enf.join("; ")}</span></div>
          ${mal ? `<p><b>${mal.n}</b> se distingue porque suena como «${mal.ono.toLowerCase()}», en ${mal.fase.toLowerCase()}; con la tos: ${mal.tos.toLowerCase()}.</p>` : ""}
          <p><button class="btn az" id="s-otro">➡ Otro sonido</button></p></div>`;
        $("#s-otro", cuerpo).onclick = () => cambiar("ruido");
      });
    }
    cambiar("examen");
  };
})();
