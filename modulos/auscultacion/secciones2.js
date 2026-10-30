/* Auscultación cardiaca — pestaña 3: Soplos y valvulopatías. */
(function () {
  "use strict";
  const A = window.AUSC, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$;

  // foco de auscultación más cercano al punto donde se oye la lesión
  U.focoDe = function (v) {
    let mejor = null, d0 = 1e9; for (const k of A.ORDEN_FOCOS.concat("erb")) { const d = A.gananciaFoco(v, k); if (1 - d < d0) { d0 = 1 - d; mejor = k; } } return mejor;
  };
  // focos aceptados como correctos en la autoevaluación (los que están casi tan cerca como el mejor)
  U.focosValidos = function (v) {
    const ds = A.ORDEN_FOCOS.concat("erb").map(k => [k, Math.hypot(A.puntoDe(v).x - A.FOCOS[k].x, A.puntoDe(v).y - A.FOCOS[k].y)]), m = Math.min(...ds.map(x => x[1]));
    return ds.filter(x => x[1] <= Math.max(15, m + 3)).map(x => x[0]);
  };
  const FORMAS = { rombo: "En rombo (crece y decrece): crescendo-decrescendo", holo: "Holosistólico: intensidad pareja en toda la sístole", decre: "Decreciente desde R2 (aspirativo)", ruflar: "Ruflar: grave, mesodiastólico, se refuerza al final", cont: "Continuo en maquinaria", frote: "Roce áspero (cuero nuevo)" };
  const MOMENTOS = { sistole: "Sístole", diastole: "Diástole", continuo: "Continuo (sístole y diástole)", frote: "Roce pericárdico" };
  U.FORMAS = FORMAS; U.MOMENTOS = MOMENTOS;
  const GRUPOS = [["Mitral", ["em", "im"]], ["Aórtica", ["ea", "ia"]], ["Tricuspídea", ["et", "it"]], ["Pulmonar", ["ep", "ip"]], ["Congénitas", ["civ", "cia", "fallot", "ductus", "coar"]], ["Pericardio", ["frote"]]];
  const MAN = [["ninguna", "Reposo"], ["pachon", "Decúbito izq. (Pachón)"], ["inclinado", "Sentado e inclinado"], ["insp", "Apnea inspiratoria"], ["esp", "Apnea espiratoria"], ["ejercicio", "Ejercicio"]];
  const ROMANO = ["", "I", "II", "III", "IV", "V", "VI"];

  SECC.soplos = function (cont) {
    const st = { v: "em", grado: 3, man: "ninguna", foco: null, fc: 77, sonido: false };
    cont.innerHTML = `<h1>🌬️ Soplos y valvulopatías</h1>
      <p class="lema">Elige una lesión y <b>escucha cómo suena</b>: el fonocardiograma muestra su momento y su forma; el tórax, dónde se oye más fuerte y hacia dónde se irradia. Prueba las maniobras que la clase dice que lo modifican.</p>${U.aviso}
      <div id="grupos"></div>
      <div class="caja"><canvas class="ecg" id="fono"></canvas>
        <div class="ctrl"><button class="btn" id="play">▶ Escuchar</button><label>Volumen <input type="range" id="vol" min="0.2" max="1" step="0.05" value="${U.volumen}"></label>
        <label>Grado <input type="range" id="gr" min="1" max="6" value="3"><b id="grv">III/VI</b></label><label>FC <input type="range" id="fc" min="55" max="120" value="77"><b id="fcv">77</b></label></div>
        <div class="letrero" id="let"></div></div>
      <div class="grid2"><div class="caja"><div id="torso"></div><p class="nota" style="text-align:center">Disco amarillo: donde se oye más fuerte. Flechas rojas: irradiación. <b>Toca otro foco</b> para auscultar ahí y ver cómo cambia la intensidad.</p></div>
        <div><h3 style="margin-top:0">Maniobras</h3><div class="chips" id="man"></div><div class="letrero" id="manLet"></div>
          <div class="caja info" id="ficha"></div></div></div>`;
    $("#grupos").innerHTML = GRUPOS.map(([g, ids]) => `<div class="chips"><b style="min-width:92px;align-self:center">${g}</b>${ids.map(i => `<button class="chip ${i === st.v ? "act" : ""}" data-v="${i}">${A.VALV[i].n}</button>`).join("")}</div>`).join("");
    const cfg = () => {
      const v = A.VALV[st.v];
      return { valv: st.v, grado: st.grado, man: st.man, foco: st.foco || U.focoDe(v), fc: st.man === "ejercicio" ? Math.max(st.fc, 110) : st.fc, insp: st.man === "insp" };
    };
    const P = U.Player(cfg, { silencio: true });
    let anim = 0, gen = U.gen;
    U.alSalir = () => { P.parar(); cancelAnimationFrame(anim); };
    function torso() {
      const v = A.VALV[st.v], p = A.puntoDe(v), foco = st.foco || U.focoDe(v);
      $("#torso").innerHTML = U.torsoSVG({ focos: true, sel: foco, marca: { x: p.x, y: p.y, r: 11 }, irr: v.irr, ox: p.x, oy: p.y });
      $$("#torso [data-foco]").forEach(g => { const f = () => { st.foco = g.dataset.foco; torso(); live(); }; g.onclick = f; g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }; });
    }
    U.repintar = torso;
    function manTxt(v) {
      const m = st.man;
      if (m === "ninguna") return "En reposo, con respiración normal.";
      if (m === "pachon") return v.zona === "punta" ? "El decúbito lateral izquierdo acerca el corazón a la pared y <b>refuerza</b> este soplo de la punta (clase)." : "Sin efecto descrito en la clase: el Pachón refuerza los focos de la punta (mitral y tricuspídeo).";
      if (m === "inclinado") return v.zona === "base" ? "Sentado e inclinado hacia adelante <b>pone de manifiesto</b> este soplo de la base (clase)." : "Sin efecto descrito en la clase: esta maniobra es para los soplos de la base (aórtico y pulmonar).";
      if (m === "insp") return v.insp ? "<b>Aumenta con la inspiración</b> (signo de Rivero-Carvallo en la estenosis tricuspídea; también la insuficiencia tricuspídea, clase)." : "La clase no describe cambio con la inspiración para este soplo.";
      if (m === "esp") return v.insp ? "Sin la inspiración el soplo <b>disminuye</b>." : "La clase no describe cambio con la espiración para este soplo.";
      return "El ejercicio acelera la corriente sanguínea (FC ≥ 110): puede <b>intensificar</b> un soplo que en reposo pasa inadvertido (clase).";
    }
    function fichaHTML() {
      const v = A.VALV[st.v], foco = A.FOCOS[st.foco || U.focoDe(v)];
      $("#ficha").innerHTML = `<h3 style="margin-top:0">${v.n}</h3><table><tbody>
        <tr><th>Momento</th><td>${MOMENTOS[v.momento]}</td></tr><tr><th>Forma</th><td>${FORMAS[v.forma]}</td></tr><tr><th>Timbre</th><td>${v.timbre}</td></tr>
        <tr><th>Dónde se oye más</th><td>${v.puntoLit ? "Zona de la lesión" : A.FOCOS[v.punto].n}${v.punto2 && !v.puntoLit ? " (" + (v.id === "fallot" ? "3.er-4.º espacio izquierdo" : v.id === "cia" ? "2.º-3.er espacio izquierdo" : "borde esternal izquierdo") + ")" : ""}${v.puntoLit ? U.lit : ""}</td></tr>
        <tr><th>Irradiación</th><td>${v.irrTxt}${v.irrLit ? U.lit : ""}</td></tr><tr><th>Se acompaña de</th><td>${v.resumen}</td></tr>
        <tr><th>Para recordar</th><td>${v.pista}</td></tr></tbody></table><p class="nota">Clase: ${v.fuente}</p>`;
      $("#manLet").innerHTML = `<span class="k">Efecto</span><span>${manTxt(v)}</span>`;
    }
    function live() {
      const v = A.VALV[st.v], c = cfg(), amp = A.GRADO(st.grado) * (v.amp || 1) * A.gananciaFoco(v, c.foco) * A.mult(v, c.man, c.insp);
      const nivel = amp < 0.12 ? "casi inaudible" : amp < 0.3 ? "débil" : amp < 0.6 ? "moderado" : "fuerte";
      $("#let").innerHTML = `<span class="k">${A.FOCOS[c.foco].n}</span><span>Auscultando aquí el soplo se oye <b>${nivel}</b> (${Math.round(amp * 100)} % de la escala).${c.foco === (v.punto2 ? U.focoDe(v) : v.punto) ? " Es su foco de máxima intensidad." : ""}${st.grado >= 4 ? " Grado ≥ IV: <b>frémito</b> palpable (clase)." : ""}</span>`;
      $("#grv").textContent = ROMANO[st.grado] + "/VI"; $("#fcv").textContent = c.fc; fichaHTML();
    }
    function pintarMan() {
      $("#man").innerHTML = MAN.map(([k, n]) => `<button class="chip ${k === st.man ? "act" : ""}" data-m="${k}">${n}</button>`).join("");
      $$("#man .chip").forEach(b => b.onclick = () => { st.man = b.dataset.m; pintarMan(); live(); });
    }
    $$("#grupos .chip").forEach(b => b.onclick = () => { st.v = b.dataset.v; st.foco = null; $$("#grupos .chip").forEach(x => x.classList.toggle("act", x === b)); torso(); live(); });
    $("#gr").oninput = e => { st.grado = +e.target.value; live(); };
    $("#fc").oninput = e => { st.fc = +e.target.value; live(); };
    $("#vol").oninput = e => U.setVolumen(+e.target.value);
    $("#play").onclick = () => {
      st.sonido = !st.sonido; P.sonido = st.sonido; $("#play").textContent = st.sonido ? "⏹ Silenciar" : "▶ Escuchar"; if (st.sonido) U.activarAudio();
    };
    pintarMan(); torso(); live(); P.iniciar();
    (function bucle() { if (gen !== U.gen) return; U.dibujarFono($("#fono"), P, { alto: 160, ventana: 2.4 }); anim = requestAnimationFrame(bucle); })();
    U.alRedimensionar = torso;
  };
})();
