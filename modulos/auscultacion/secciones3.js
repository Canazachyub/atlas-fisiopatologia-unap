/* Auscultación cardiaca — pestañas 4 y 5: Explicación y Ponte a prueba. */
(function () {
  "use strict";
  const A = window.AUSC, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$;

  /* ====================== 4 · EXPLICACIÓN ====================== */
  SECC.explicacion = function (cont) {
    const filas = A.ORDEN_VALV.map(id => { const v = A.VALV[id];
      return `<tr><td><b>${v.n}</b></td><td>${U.MOMENTOS[v.momento]}</td><td>${v.timbre}</td><td>${v.puntoLit ? "—" + U.lit : A.FOCOS[v.punto].n}</td><td>${v.irrTxt}${v.irrLit ? U.lit : ""}</td></tr>`; }).join("");
    cont.innerHTML = `<h1>📖 Explicación</h1><p class="lema">Auscultar es oír <b>qué válvula suena y cuándo</b>. Con cuatro preguntas se reconstruye casi toda lesión: ¿cuándo?, ¿cómo suena?, ¿dónde se oye más? y ¿hacia dónde se va?</p>${U.aviso}
      <div class="grid3">
        ${U.tarjeta("¿Qué es?", "Un <b>ruido</b> nace del cierre de una válvula: R1 (mitral y tricúspide, «lub») y R2 (aórtica y pulmonar, «dub»). Un <b>soplo</b> nace de la <b>turbulencia</b> de la sangre al pasar por una válvula alterada, o por un flujo más rápido o más aguado (soplo funcional: ejercicio, fiebre, hipertiroidismo, anemia). Se compara con un fuelle.", "az")}
        ${U.tarjeta("¿Cómo se ausculta?", "Siempre en el mismo orden: <b>mitral → tricuspídeo → pulmonar → aórtico</b>, con el diafragma para R1 y R2 y la campana para R3 y R4. El pulso carotídeo coincide con R1: lo que suena con el pulso es sístole.", "ve")}
        ${U.tarjeta("¿Por qué suena así?", "<b>Estenosis</b>: la válvula no abre y la sangre pasa a chorro; en sigmoideas es soplo de <b>eyección</b> (rombo), en AV es <b>llenado</b> (ruflar). <b>Insuficiencia</b>: no cierra y la sangre vuelve; en AV es <b>holosistólico</b>, en sigmoideas es <b>diastólico decreciente</b> que empieza tras R2.", "ro")}
        ${U.tarjeta("¿Para qué sirve?", "Para ubicar la lesión sin esperar al ecocardiograma: el momento y el foco dicen la válvula; el timbre y la irradiación lo confirman. Un soplo que se atenúa en una cardiopatía avanzada puede indicar descompensación.", "na")}</div>
      <h2>Ciclo cardiaco en una línea</h2>
      <div class="caja"><p>Sístole ≈ 0.30 s: R1 → <i>contracción isovolumétrica</i> → <i>eyección</i> (sigmoideas abiertas) → R2. Diástole ≈ 0.48 s: relajación → llenado rápido (aquí R3) → sístole auricular (aquí R4) → R1. Entre R1 y R2 está la <b>sístole</b>; el soplo sistólico cae ahí, el diastólico entre R2 y el siguiente R1.</p>
      <p class="nota">Con otra frecuencia cardiaca la sístole se acorta; ese ajuste del simulador es didáctico ${U.lit}</p></div>
      <h2>Los ruidos</h2><div class="caja"><table><thead><tr><th>Ruido</th><th>Origen</th><th>Dónde</th></tr></thead><tbody>
        <tr><td><b>R1</b></td><td>Cierre mitral (primero) y tricuspídeo</td><td>Foco mitral (punta); coincide con el choque de la punta</td></tr>
        <tr><td><b>R2</b></td><td>Cierre aórtico (primero) y pulmonar</td><td>Focos de base</td></tr>
        <tr><td><b>R3</b></td><td>Llenado ventricular, protodiastólico; 30 % de sanos</td><td>Ápex, campana. Patológico = galope ventricular</td></tr>
        <tr><td><b>R4</b></td><td>Contracción auricular contra desaceleración brusca del flujo; normal en niños y jóvenes</td><td>Punta. Patológico = galope auricular</td></tr>
        <tr><td>Chasquido de apertura ${U.lit}</td><td>Apertura de una mitral estenosada</td><td>Punta</td></tr>
        <tr><td>Clic de eyección</td><td>Nombrado en la CIV</td><td>Borde esternal izquierdo</td></tr>
        <tr><td>Frote pericárdico</td><td>Roce de las hojas inflamadas (no es flujo)</td><td>Precordio; desaparece con el derrame</td></tr></tbody></table></div>
      <div class="disc" style="margin-top:8px"><b>Discrepancia:</b> la clase ubica el R4 «en la finalización de la sístole»; la literatura lo sitúa al final de la diástole, justo antes de R1. El simulador lo dibuja presistólico ${U.lit}.</div>
      <h2>Alteraciones de intensidad (clase)</h2><div class="caja"><table><tbody>
        <tr><th>R1 reforzado</th><td>Estenosis mitral (brillante), hipertiroidismo, pared delgada, extrasístoles</td></tr>
        <tr><th>R1 debilitado</th><td>Insuficiencia mitral, enfisema, obesidad, derrame pericárdico, carditis aguda, BAV</td></tr>
        <tr><th>R1 retardado</th><td>Estenosis mitral</td></tr>
        <tr><th>R2 reforzado</th><td>HTA sistémica (2.º EIC derecho), HTA pulmonar (2.º EIC izquierdo)</td></tr>
        <tr><th>R2 debilitado</th><td>Insuficiencia cardiaca, shock, insuficiencia aórtica</td></tr>
        <tr><th>R2 desdoblado</th><td>Bloqueo AV, respiración forzada</td></tr></tbody></table></div>
      <h2>Los soplos y sus cinco parámetros</h2>
      <div class="caja"><p><b>Situación en el ciclo</b> (proto, meso, tele u holo) · <b>localización</b> (foco de máxima intensidad) · <b>irradiación</b> (en el sentido de la corriente; a mayor intensidad, más irradiación) · <b>intensidad</b> (Freeman-Levine) · <b>timbre</b>.</p>
      <table><thead><tr><th>Grado</th><th>Descripción</th></tr></thead><tbody><tr><td>I</td><td>Muy débil, solo en silencio</td></tr><tr><td>II</td><td>Débil</td></tr><tr><td>III</td><td>Moderado</td></tr><tr><td>IV</td><td>Fuerte (con frémito)</td></tr><tr><td>V</td><td>Fuertísimo (con frémito)</td></tr><tr><td>VI</td><td>El más fuerte: se oye sin apoyar el diafragma</td></tr></tbody></table>
      <p class="nota">Timbre: aspirativo = insuficiencia aórtica · rudo = estenosis aórtica · áspero = estenosis mitral · musical = ruptura valvular. Un soplo funcional (anemia, fiebre, ejercicio) es sistólico, débil, localizado y sin frémito.</p></div>
      <h2>Las 14 lesiones del simulador</h2><div class="caja" style="overflow-x:auto"><table><thead><tr><th>Lesión</th><th>Momento</th><th>Timbre</th><th>Foco</th><th>Irradiación</th></tr></thead><tbody>${filas}</tbody></table></div>
      <h2>Cómo estudiarlo</h2><div class="caja"><p>1) Primero el <b>momento</b> (sístole o diástole) con el pulso. 2) Luego la <b>forma</b>: rombo = eyección (estenosis de sigmoidea); parejo = regurgitación AV; decreciente tras R2 = regurgitación de sigmoidea; ruflar = estenosis AV. 3) El <b>foco</b> dice la válvula. 4) La <b>irradiación</b> desempata. Después practica a ciegas en «Ponte a prueba».</p></div>`;
  };

  /* ====================== 5 · PONTE A PRUEBA ====================== */
  // además de las 14 lesiones, dos ruidos agregados sin soplo
  const EXTRA = {
    r3: { id: "r3", n: "Ritmo de galope ventricular (R3 patológico)", momento: "ninguno", forma: "extra", cfg: { s3: true, fc: 100, foco: "mitral" }, foco: ["mitral"], expl: "Un tercer ruido protodiastólico, grave, que se oye mejor con la campana en la punta y casi siempre con taquicardia: forma un ritmo de tres tiempos «como un galope». No hay soplo.", pista: "R3 = llenado ventricular. En un sano joven sería fisiológico; en insuficiencia cardiaca es galope." },
    r4: { id: "r4", n: "Ritmo de galope auricular (R4)", momento: "ninguno", forma: "extra", cfg: { s4: true, fc: 90, foco: "mitral" }, foco: ["mitral"], expl: "Un cuarto ruido grave justo antes de R1 (contracción auricular contra un ventrículo rígido). No hay soplo.", pista: "R4 = sístole auricular; la clase lo ubica al final de la sístole, la literatura lo pone presistólico.", lit: true }
  };
  const FOCO_N = k => A.FOCOS[k].n;
  const barajar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  SECC.prueba = function (cont) {
    const st = { modo: "completo", caso: null, resp: {}, hecho: false, ok: 0, tot: 0, ult: null, foco: "mitral", visual: true };
    const POOL = A.ORDEN_VALV.concat(["r3", "r4"]);
    cont.innerHTML = `<h1>🎯 Ponte a prueba</h1><p class="lema">Suena un caso sin mostrar el nombre. Escúchalo (puedes moverte de foco) y responde: <b>momento, forma, foco y lesión</b>.</p>${U.aviso}
      <div class="ctrl"><b>Modo:</b><div class="chips" id="modo"></div></div>
      <div class="caja" id="aud"></div><div id="preg"></div><div id="res"></div>
      <p class="nota" id="marc"></p>`;
    const nombre = id => EXTRA[id] ? EXTRA[id].n : A.VALV[id].n;
    const cfgCaso = () => {
      const c = st.caso, base = EXTRA[c.id] ? Object.assign({}, EXTRA[c.id].cfg) : { valv: c.id, grado: c.grado, fc: 77 };
      base.foco = st.foco; if (!EXTRA[c.id] && c.id === "frote") base.frote = true; return base;
    };
    const P = U.Player(() => cfgCaso(), {});
    let anim = 0, gen = U.gen;
    U.alSalir = () => { P.parar(); cancelAnimationFrame(anim); };
    const info = id => { // respuestas correctas de un caso
      if (EXTRA[id]) return { momento: "ninguno", forma: "extra", focos: EXTRA[id].foco, libre: false };
      const v = A.VALV[id]; return { momento: v.momento === "frote" ? "frote" : v.momento, forma: v.forma, focos: U.focosValidos(v), libre: !!v.puntoLit };
    };
    function nuevo() {
      let id; do { id = POOL[Math.floor(Math.random() * POOL.length)]; } while (id === st.ult && POOL.length > 1);
      st.ult = id; st.caso = { id, grado: 3 + Math.floor(Math.random() * 3) }; st.resp = {}; st.hecho = false;
      st.foco = EXTRA[id] ? "mitral" : U.focoDe(A.VALV[id]); if (!EXTRA[id] && info(id).focos.length) st.foco = barajar(["mitral", "tricuspideo", "pulmonar", "aortico", "erb"].filter(k => k !== info(id).focos[0]))[0]; // empieza en un foco que no delata
      const vis = info(id); st.opLes = barajar([id].concat(barajar(POOL.filter(x => x !== id && (info(x).momento === vis.momento || Math.random() < 0.15))).slice(0, 4)).slice(0, 5));
      if (!st.opLes.includes(id)) st.opLes[0] = id; st.opLes = barajar(st.opLes);
      pintar(); if (P.activo) {} else P.iniciar(); P.sonido = true;
    }
    function pintarModo() {
      $("#modo").innerHTML = [["completo", "Con fonocardiograma"], ["escuchar", "Solo escuchar"]].map(([k, n]) => `<button class="chip ${st.modo === k ? "act" : ""}" data-m="${k}">${n}</button>`).join("");
      $$("#modo .chip").forEach(b => b.onclick = () => { st.modo = b.dataset.m; pintarModo(); pintar(); });
    }
    function pintarAud() {
      $("#aud").innerHTML = `<div class="ctrl"><button class="btn" id="oir">🔊 Escuchar</button><button class="btn sec" id="stop">⏹ Silenciar</button><label>Volumen <input type="range" id="vol" min="0.2" max="1" step="0.05" value="${U.volumen}"></label></div>
        <div class="ctrl"><b>Auscultar en:</b><div class="chips" id="fo">${A.ORDEN_FOCOS.concat("erb").map(k => `<button class="chip ${k === st.foco ? "act" : ""}" data-f="${k}">${FOCO_N(k)}</button>`).join("")}</div></div>
        ${st.modo === "completo" ? `<canvas class="ecg" id="fono"></canvas>` : `<p class="nota">Modo «solo escuchar»: sin imagen. Apóyate en el pulso carotídeo imaginario: ¿suena con R1 o entre un ciclo y otro?</p>`}`;
      $("#oir").onclick = () => { U.activarAudio(); P.sonido = true; P.iniciar(); };
      $("#stop").onclick = () => { P.sonido = false; };
      $("#vol").oninput = e => U.setVolumen(+e.target.value);
      $$("#fo .chip").forEach(b => b.onclick = () => { st.foco = b.dataset.f; $$("#fo .chip").forEach(x => x.classList.toggle("act", x === b)); });
    }
    const grupo = (k, tit, ops) => `<div class="caja"><h3 style="margin-top:0">${tit}</h3><div class="opciones" data-k="${k}">${ops.map(([v, t]) => `<button data-v="${v}">${t}</button>`).join("")}</div></div>`;
    function pintar() {
      pintarAud();
      const vis = info(st.caso.id), v = EXTRA[st.caso.id] ? null : A.VALV[st.caso.id];
      $("#preg").innerHTML = grupo("momento", "1 · ¿En qué momento del ciclo está el soplo?", [["sistole", "Sístole (entre R1 y R2)"], ["diastole", "Diástole (después de R2)"], ["continuo", "Continuo (cubre R1 y R2)"], ["frote", "Roce áspero (no es flujo)"], ["ninguno", "Sin soplo: hay un ruido agregado"]])
        + grupo("forma", "2 · ¿Qué forma tiene?", Object.entries(U.FORMAS).concat([["extra", "Sin soplo: golpe grave extra (galope)"]]))
        + (vis.libre ? "" : grupo("foco", "3 · ¿En qué foco se oye más fuerte?", A.ORDEN_FOCOS.concat("erb").map(k => [k, FOCO_N(k)])))
        + grupo("lesion", (vis.libre ? "3" : "4") + " · ¿Cuál es la lesión?", st.opLes.map(id => [id, nombre(id)]))
        + `<div class="ctrl"><button class="btn az" id="chk">✔ Comprobar</button><button class="btn sec" id="sig">➡ Otro caso</button></div>`;
      $$("#preg .opciones").forEach(g => $$("button", g).forEach(b => b.onclick = () => {
        if (st.hecho) return; st.resp[g.dataset.k] = b.dataset.v; $$("button", g).forEach(x => x.classList.toggle("sel", x === b));
      }));
      $("#chk").onclick = comprobar; $("#sig").onclick = nuevo; $("#res").innerHTML = ""; marcador();
    }
    function marcador() { $("#marc").textContent = st.tot ? `Casos resueltos: ${st.tot} · Aciertos completos: ${st.ok}` : ""; }
    function comprobar() {
      if (st.hecho) return;
      const id = st.caso.id, vis = info(id), pasos = ["momento", "forma"].concat(vis.libre ? [] : ["foco"], ["lesion"]);
      if (pasos.some(p => !st.resp[p])) { $("#res").innerHTML = `<div class="disc">Responde todas las preguntas antes de comprobar.</div>`; return; }
      st.hecho = true; st.tot++;
      const buenas = { momento: vis.momento, forma: vis.forma, lesion: id }, bien = {};
      bien.momento = st.resp.momento === vis.momento; bien.forma = st.resp.forma === vis.forma; bien.lesion = st.resp.lesion === id;
      if (!vis.libre) bien.foco = vis.focos.includes(st.resp.foco);
      pasos.forEach(p => $$(`#preg .opciones[data-k="${p}"] button`).forEach(b => {
        const correcto = p === "foco" ? vis.focos.includes(b.dataset.v) : b.dataset.v === buenas[p];
        if (correcto) b.classList.add("bien"); else if (b.classList.contains("sel")) b.classList.add("mal");
      }));
      const todo = pasos.every(p => bien[p]); if (todo) st.ok++;
      const E = EXTRA[id], v = E ? null : A.VALV[id];
      const exp = E ? `${E.expl}<br><i>${E.pista}</i>${E.lit ? U.lit : ""}` :
        `<b>${v.n}.</b> ${v.resumen}<br><b>Momento:</b> ${U.MOMENTOS[v.momento]}. <b>Forma:</b> ${U.FORMAS[v.forma]}. <b>Timbre:</b> ${v.timbre}.<br><b>Foco:</b> ${v.puntoLit ? "la clase no precisa el foco" + U.lit : vis.focos.map(FOCO_N).join(" o ")}. <b>Irradiación:</b> ${v.irrTxt}${v.irrLit ? U.lit : ""}<br><i>${v.pista}</i>`;
      const falla = pasos.filter(p => !bien[p]).map(p => ({ momento: "el momento", forma: "la forma", foco: "el foco", lesion: "la lesión" }[p]));
      $("#res").innerHTML = `<div class="caja" style="border-left:6px solid ${todo ? "var(--ve)" : "var(--ro)"}"><h3 style="margin-top:0">${todo ? "Correcto: lo identificaste completo" : "Revisa " + falla.join(", ")}</h3><p>${exp}</p>
        ${v ? `<p class="nota">Cómo razonarlo: ${v.momento === "sistole" ? (v.forma === "rombo" ? "soplo sistólico en rombo = eyección por una sigmoidea estrecha (estenosis aórtica/pulmonar) o flujo aumentado" : "soplo sistólico parejo en toda la sístole = regurgitación por una válvula AV (o CIV)") : v.momento === "diastole" ? (v.forma === "decre" ? "diastólico que empieza justo tras R2 y decrece = sigmoidea que no cierra (insuficiencia aórtica o pulmonar)" : "diastólico grave en ruflar = llenado a través de una AV estenosada") : v.momento === "continuo" ? "continuo que cubre R1 y R2 = comunicación arteriovenosa persistente (ductus)" : "roce sin relación con el flujo = pericardio inflamado"}.</p>` : ""}</div>`;
      marcador();
    }
    pintarModo(); nuevo();
    (function bucle() {
      if (gen !== U.gen) return;
      const cv = $("#fono"); if (cv && st.modo === "completo" && P.activo) U.dibujarFono(cv, P, { alto: 150, etiquetas: st.hecho });
      anim = requestAnimationFrame(bucle);
    })();
    U.alRedimensionar = () => {};
  };
})();
