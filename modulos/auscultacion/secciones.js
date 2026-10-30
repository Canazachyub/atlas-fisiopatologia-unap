/* Auscultación cardiaca — pestañas 1 y 2: Focos y Ciclo cardiaco. */
(function () {
  "use strict";
  const A = window.AUSC, U = window.UTIL, SECC = window.SECC, $ = U.$, $$ = U.$$;

  /* ---------- tórax en SVG (compartido con Soplos) ---------- */
  // opc.focos: dibuja los discos de los focos; opc.irr: [{x,y,t}] flechas de irradiación desde (ox,oy); opc.punto: marcador del soplo
  U.torsoSVG = function (opc) {
    opc = opc || {};
    let s = `<svg viewBox="0 0 300 340" class="torso" role="img" aria-label="Tórax anterior con los focos de auscultación" style="max-width:520px;margin:0 auto">
      <defs><marker id="pta" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#B91C1C"/></marker></defs>
      <path d="M62 36Q150 12 238 36Q286 60 288 130Q282 250 262 322H38Q18 250 12 130Q14 60 62 36Z" fill="#FDE3D0" stroke="#C99A7A" stroke-width="2.5"/>
      <path d="M58 44Q104 62 144 68M242 44Q196 62 156 68" stroke="#C99A7A" stroke-width="3" fill="none"/>`;
    for (let n = 1; n <= 6; n++) { const y = 53 + 26 * n; // costillas (la n-ésima limita por arriba el espacio n)
      s += `<path d="M142 ${y}Q82 ${y - 6} 34 ${y + 24}M158 ${y}Q218 ${y - 6} 266 ${y + 24}" stroke="#D9AE90" stroke-width="3" fill="none" stroke-linecap="round"/>`; }
    s += `<path d="M142 74H158V226L150 244L142 226Z" fill="#F3CDB2" stroke="#C99A7A" stroke-width="2"/>
      <text x="150" y="258" text-anchor="middle" font-size="9.5" fill="#8a6a55" font-family="Fredoka,sans-serif">apéndice xifoides</text>
      <path d="M215 70V300" stroke="#8a6a55" stroke-width="1.4" stroke-dasharray="4 4"/><text x="215" y="312" text-anchor="middle" font-size="9.5" fill="#8a6a55" font-family="Fredoka,sans-serif">línea medioclavicular</text>`;
    for (let n = 1; n <= 5; n++) s += `<text x="24" y="${66 + 26 * n + 4}" font-size="11" font-weight="700" fill="#8a6a55" font-family="Fredoka,sans-serif">${n}.º</text>`;
    s += `<text x="40" y="332" font-size="10" fill="#8a6a55" font-family="Fredoka,sans-serif">derecha del paciente</text><text x="262" y="332" text-anchor="end" font-size="10" fill="#8a6a55" font-family="Fredoka,sans-serif">izquierda del paciente</text>`;
    if (opc.irr) for (const [x, y, t] of opc.irr) {
      s += `<path d="M${opc.ox} ${opc.oy}L${x} ${y}" stroke="#B91C1C" stroke-width="3.4" stroke-dasharray="7 4" marker-end="url(#pta)" fill="none"/>`;
      if (t) s += `<text class="eti" x="${x}" y="${y - 7}" text-anchor="middle" font-size="10.5" fill="#B91C1C">${t}</text>`;
    }
    // rótulo de cada foco: hacia afuera del esternón para que no tape al vecino
    const ET = { aortico: [-17, 4, "end"], pulmonar: [17, 4, "start"], erb: [17, 4, "start"], mitral: [0, -19, "middle"], tricuspideo: [-17, 4, "end"] };
    if (opc.focos) for (const k of A.ORDEN_FOCOS.concat("erb")) {
      const f = A.FOCOS[k], sel = opc.sel === k;
      s += `<g class="hit" data-foco="${k}" tabindex="0" role="button" aria-label="Foco ${f.n}"><circle cx="${f.x}" cy="${f.y}" r="26" fill="transparent"/>
        <circle cx="${f.x}" cy="${f.y}" r="${sel ? 15 : 12}" fill="${f.color}" stroke="${sel ? "#FACC15" : "#fff"}" stroke-width="${sel ? 4 : 2.5}" opacity="${opc.sel && !sel ? .7 : 1}"/>
        <text class="eti" x="${f.x + ET[k][0]}" y="${f.y + ET[k][1]}" text-anchor="${ET[k][2]}" font-size="10.5" fill="${f.color}">${k === "erb" ? "Accesorio" : f.n}</text></g>`;
    }
    if (opc.marca) s += `<circle cx="${opc.marca.x}" cy="${opc.marca.y}" r="${opc.marca.r || 13}" fill="#FACC15" stroke="#1b1b1b" stroke-width="3"/><circle cx="${opc.marca.x}" cy="${opc.marca.y}" r="4" fill="#1b1b1b"/>`;
    return s + "</svg>";
  };

  /* ====================== 1 · FOCOS ====================== */
  SECC.focos = function (cont) {
    const st = { foco: null, sonido: true, recorrido: false, t0: 0 };
    cont.innerHTML = `<h1>📍 Focos de auscultación</h1>
      <p class="lema">Toca un foco del tórax para <b>oír y ver qué ruido predomina ahí</b>. Cada foco es el punto donde mejor se oye una válvula: las de entrada (mitral y tricúspide) hacen R1 y se oyen en la punta; las de salida (aórtica y pulmonar) hacen R2 y se oyen en la base.</p>
      ${U.aviso}
      <div class="grid2"><div class="caja"><div id="torso"></div><p class="nota" style="text-align:center">Toca un disco. Secuencia de la clase: <b>mitral → tricuspídeo → pulmonar → aórtico</b>.</p></div>
      <div><div class="caja info" id="info"></div>
        <div class="ctrl"><button class="btn" id="rec">🔁 Recorrido M-T-P-A</button><button class="btn sec" id="sil">🔊 Sonido: sí</button><label>Volumen <input type="range" id="vol" min="0.2" max="1" step="0.05" value="${U.volumen}"></label></div>
        <canvas class="ecg" id="fono"></canvas>
        <div class="caja" id="barras"></div></div></div>
      <h2>Qué se oye en cada foco</h2><div class="caja"><table><thead><tr><th>Foco</th><th>Ubicación (clase)</th><th>Predomina</th></tr></thead><tbody id="tab"></tbody></table></div>
      <div class="grid3">
        ${U.tarjeta("Posiciones", "<b>Decúbito lateral izquierdo (Pachón)</b>: intensifica ruidos y soplos de la punta (mitral y tricuspídeo). <b>Sentado e inclinado hacia adelante</b>: pone de manifiesto la base (aórtico y pulmonar).", "az")}
        ${U.tarjeta("Receptor", "<b>Diafragma</b> (3-3.5 cm): alta frecuencia, R1 y R2. <b>Campana</b> (2.5 cm): baja frecuencia, R3 y R4; apoyada con suavidad.", "ve")}
        ${U.tarjeta("Truco de clase", "Palpa el pulso carotídeo mientras auscultas: lo que suena junto al pulso es sístole; lo que suena entre un pulso y el siguiente es diástole.", "na")}</div>`;
    const cfg = () => {
      let foco = st.foco || "mitral";
      if (st.recorrido) foco = A.ORDEN_FOCOS[Math.floor((performance.now() - st.t0) / 3300) % 4];
      st.focoAct = foco; return { fc: 77, foco };
    };
    const P = U.Player(cfg);
    let anim = 0, gen = U.gen;
    U.alSalir = () => { P.parar(); cancelAnimationFrame(anim); };
    function pintarTorso() {
      $("#torso").innerHTML = U.torsoSVG({ focos: true, sel: st.recorrido ? st.focoAct : st.foco });
      $$("#torso [data-foco]").forEach(g => {
        g.onclick = () => elegir(g.dataset.foco); g.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); elegir(g.dataset.foco); } };
      });
    }
    U.repintar = pintarTorso;
    function info() {
      const k = st.recorrido ? st.focoAct : st.foco, f = k && A.FOCOS[k];
      $("#info").innerHTML = f ? `<h3 style="margin-top:0">${f.n}</h3><p style="margin:2px 0"><b>Dónde:</b> ${f.esp}.${f.lit ? ` <span class="lit">literatura</span>` : ""}</p>
        <p style="margin:2px 0"><b>Predomina:</b> <span class="dato">${f.pred}</span></p>${f.lit ? `<p class="nota">${f.lit}</p>` : ""}
        <p class="nota" style="margin:2px 0">${k === "mitral" ? "Coincide con el choque de la punta. R1 coincide con el pulso carotídeo." : k === "tricuspideo" ? "Se ausculta en la base del apéndice xifoides." : k === "erb" ? "Zona donde R1 y R2 suenan parecidos." : "En la base, R2 es el ruido más fuerte."}</p>`
        : `<p style="margin:0"><b>Toca un foco</b> en el tórax para escucharlo, o pulsa «Recorrido» para oírlos en el orden de la clase.</p>`;
      const g1 = f ? f.g1 : 0, g2 = f ? f.g2 : 0, b = (n, g, c) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><b style="width:30px">${n}</b><div style="flex:1;background:var(--borde);border-radius:8px;height:18px"><div style="width:${Math.round(g * 100)}%;height:100%;background:${c};border-radius:8px;transition:width .3s"></div></div></div>`;
      $("#barras").innerHTML = `<b>Intensidad relativa en este foco</b>${b("R1", g1, "var(--azc)")}${b("R2", g2, "var(--ro)")}<span class="nota">${f ? (g1 > g2 ? "Predomina R1: foco de la punta." : g2 > g1 ? "Predomina R2: foco de la base." : "Parecidos.") : ""}</span>`;
      $$("#tab tr").forEach(tr => tr.style.background = tr.dataset.k === k ? "var(--resalte)" : "");
    }
    $("#tab").innerHTML = A.ORDEN_FOCOS.concat("erb").map(k => { const f = A.FOCOS[k]; return `<tr data-k="${k}"><td><b style="color:${f.color}">${f.n}</b></td><td>${f.esp}</td><td>${f.pred}</td></tr>`; }).join("");
    function elegir(k) {
      st.recorrido = false; st.foco = k; U.activarAudio(); P.sonido = st.sonido; P.iniciar(); pintarTorso(); info();
    }
    $("#rec").onclick = () => {
      st.recorrido = !st.recorrido; $("#rec").textContent = st.recorrido ? "⏹ Detener recorrido" : "🔁 Recorrido M-T-P-A";
      if (st.recorrido) { st.t0 = performance.now(); U.activarAudio(); P.sonido = st.sonido; P.iniciar(); } else if (!st.foco) P.parar();
      pintarTorso(); info();
    };
    $("#sil").onclick = () => { st.sonido = !st.sonido; P.sonido = st.sonido; $("#sil").textContent = "🔊 Sonido: " + (st.sonido ? "sí" : "no"); U.activarAudio(); };
    $("#vol").oninput = e => U.setVolumen(+e.target.value);
    let ult = null;
    (function bucle() {
      if (gen !== U.gen) return;
      if (P.activo) {
        U.dibujarFono($("#fono"), P, { alto: 150 });
        if (st.recorrido && st.focoAct !== ult) { ult = st.focoAct; pintarTorso(); info(); }
      } else { const x = U.preparar($("#fono"), 150); x.c.fillStyle = U.css("--papel-ecg"); x.c.fillRect(0, 0, x.W, 150); x.c.fillStyle = U.css("--tx2"); x.c.font = "600 14px Nunito, sans-serif"; x.c.fillText("El fonocardiograma aparece al tocar un foco", 12, 80); }
      anim = requestAnimationFrame(bucle);
    })();
    U.alRedimensionar = pintarTorso; pintarTorso(); info();
  };

  /* ====================== 2 · CICLO CARDIACO ====================== */
  const PRESETS = [
    { id: "normal", n: "Normal: R1 y R2", cfg: {}, txt: "Dos ruidos: <b>R1</b> (lub) por el cierre de la mitral y la tricúspide, al empezar la sístole; <b>R2</b> (dub) por el cierre de la aórtica y la pulmonar, al terminar la sístole. En la clase: sístole ≈ 0.30 s y diástole ≈ 0.48 s." },
    { id: "desd", n: "Desdoblamiento de R2", cfg: { foco: "pulmonar", resp: "auto" }, txt: "El componente aórtico (A2) precede al pulmonar (P2). En el foco pulmonar, con la <b>inspiración</b> los dos componentes se separan y con la espiración se funden. <span class='lit'>literatura</span> La clase solo lista el desdoblamiento de R2 en el bloqueo AV y con la respiración forzada." },
    { id: "r3", n: "R3 (galope ventricular)", cfg: { s3: true, foco: "mitral" }, txt: "Vibración del llenado ventricular rápido, <b>protodiastólico</b>, de baja frecuencia: mejor con la campana en el ápex. Se oye en el 30 % de sanos (más tras el ejercicio); si es patológico, con taquicardia, forma el <b>ritmo de galope ventricular</b>." },
    { id: "r4", n: "R4 (galope auricular)", cfg: { s4: true, foco: "mitral" }, txt: "Desaceleración brusca del flujo por la <b>contracción auricular</b>; puede ser normal en niños y jóvenes. Si es patológico, es el <b>ritmo de galope auricular</b>.", disc: "Discrepancia: la clase (Sotomayor 2020) ubica R4 «en la finalización de la sístole» y aclara que su mecanismo no está esclarecido; la literatura lo sitúa al final de la <b>diástole</b>, justo antes de R1 (presistólico). Aquí se dibuja presistólico <span class='lit'>literatura</span>." },
    { id: "ap", n: "Chasquido de apertura", cfg: { apertura: true, foco: "mitral" }, txt: "Golpe seco, agudo, poco después de R2, cuando se abre la válvula mitral estenosada. <span class='lit'>literatura</span> La clase aclara que el chasquido de apertura no figura en sus fuentes." },
    { id: "clic", n: "Clic de eyección", cfg: { clic: true, foco: "pulmonar" }, txt: "Chasquido agudo, <b>protosistólico</b>, justo después de R1. La clase solo lo nombra en la <b>CIV</b>, junto al cierre pulmonar palpable en el borde esternal izquierdo." },
    { id: "frote", n: "Frote pericárdico", cfg: { frote: true, foco: "erb" }, txt: "Roce de dos pedazos de cuero nuevo por la fricción de las hojas pericárdicas inflamadas: <b>no depende del flujo</b>. Los tres tiempos (sístole, diástole precoz, presístole) son <span class='lit'>literatura</span>. Si aparece un derrame, el frote desaparece y los ruidos se apagan." }
  ];
  SECC.ciclo = function (cont) {
    const st = { pre: PRESETS[0], fc: 77, resp: "esp", foco: "mitral", marcha: true };
    cont.innerHTML = `<h1>❤️ Ciclo cardiaco y fonocardiograma</h1>
      <p class="lema">Mira cómo cada ruido nace del <b>cierre de una válvula</b>. El fonocardiograma se mueve sincronizado con el corazón: verde = válvula abierta, amarillo = válvula cerrada. Fondo rojo = sístole; azul = diástole.</p>${U.aviso}
      <div class="caja"><canvas class="ecg" id="fono"></canvas><div class="letrero" id="let" style="margin-top:8px"><span class="k" id="k">—</span><span id="txt"></span></div></div>
      <div class="grid2"><div class="caja"><div class="lienzo" id="cor" style="max-width:420px;margin:0 auto"></div><p class="nota" style="text-align:center">Aurículas arriba, ventrículos abajo. Los ventrículos se contraen en sístole; las aurículas, al final de la diástole.</p></div>
      <div><h3 style="margin-top:0">Elige el ruido</h3><div class="chips" id="pre"></div>
        <div class="caja info" id="expl"></div><div id="disc"></div>
        <div class="ctrl"><button class="btn" id="play">⏸ Pausa</button><button class="btn sec" id="son">🔊 Sonido: no</button></div>
        <div class="ctrl"><label>Frecuencia <input type="range" id="fc" min="50" max="130" value="77"><b id="fcv">77</b> lpm</label><label>Volumen <input type="range" id="vol" min="0.2" max="1" step="0.05" value="${U.volumen}"></label></div>
        <div class="ctrl"><b>Respiración:</b><div class="chips" id="resp"></div></div>
        <div class="ctrl"><label>Foco <select id="foco">${A.ORDEN_FOCOS.concat("erb").map(k => `<option value="${k}">${A.FOCOS[k].n}</option>`).join("")}</select></label></div>
        <div class="letrero" id="split"></div></div></div>`;
    $("#cor").innerHTML = U.corazonSVG();
    const cfg = () => {
      const c = Object.assign({ fc: st.fc, foco: st.foco, insp: false }, { s3: false, s4: false, apertura: false, clic: false, frote: false }, st.pre.cfg);
      c.foco = st.foco; c.fc = st.fc;
      c.insp = st.resp === "insp" || (st.resp === "auto" && Math.floor(performance.now() / 2500) % 2 === 0); st.inspAct = c.insp; return c;
    };
    const P = U.Player(cfg, { silencio: true });
    let anim = 0, gen = U.gen, tmUlt = 0;
    U.alSalir = () => { P.parar(); cancelAnimationFrame(anim); };
    function pintarPre() {
      $("#pre").innerHTML = PRESETS.map(p => `<button class="chip ${p === st.pre ? "act" : ""}" data-p="${p.id}">${p.n}</button>`).join("");
      $$("#pre .chip").forEach(b => b.onclick = () => {
        st.pre = PRESETS.find(p => p.id === b.dataset.p); if (st.pre.cfg.foco) { st.foco = st.pre.cfg.foco; $("#foco").value = st.foco; }
        if (st.pre.cfg.resp) st.resp = st.pre.cfg.resp; pintarPre(); pintarResp(); texto();
      });
    }
    function pintarResp() {
      $("#resp").innerHTML = [["esp", "Espiración"], ["insp", "Inspiración"], ["auto", "Respirar solo"]].map(([k, n]) => `<button class="chip ${st.resp === k ? "act" : ""}" data-r="${k}">${n}</button>`).join("");
      $$("#resp .chip").forEach(b => b.onclick = () => { st.resp = b.dataset.r; pintarResp(); });
    }
    function texto() { $("#expl").innerHTML = st.pre.txt; $("#disc").innerHTML = st.pre.disc ? `<div class="disc">${st.pre.disc}</div>` : ""; }
    // qué ocurre en este instante del latido
    function ahora(tm, ti, lat) {
      const e = lat.ev, cerca = (n, w) => e.some(x => x.nom === n && tm >= x.t && tm < x.t + (w || 0.07));
      if (cerca("M1", 0.07)) return ["R1", "Se cierran la <b>mitral</b> y la <b>tricúspide</b>: primer ruido («lub»). Empieza la sístole."];
      if (cerca("Clic de eyección", 0.06)) return ["Clic", "Chasquido protosistólico: se abren las sigmoideas."];
      if (cerca("A2", 0.07)) return ["R2", "Se cierran la <b>aórtica</b> y la <b>pulmonar</b>: segundo ruido («dub»). Empieza la diástole." + (lat.ev.find(x => x.nom === "P2").t - lat.ev.find(x => x.nom === "A2").t > 0.02 ? " Primero A2 y después P2: desdoblado." : "")];
      if (cerca("Chasquido de apertura", 0.05)) return ["Chasq.", "Se abre la mitral estenosada: chasquido de apertura."];
      if (cerca("R3", 0.1)) return ["R3", "Llenado ventricular rápido: la sangre vibra al entrar al ventrículo."];
      if (cerca("R4", 0.1)) return ["R4", "La aurícula se contrae contra un ventrículo rígido: cuarto ruido."];
      if (tm < ti.sist) return ["Sístole", tm < 0.07 ? "Contracción isovolumétrica: todas las válvulas cerradas." : "Eyección: las sigmoideas están abiertas y la sangre sale a la aorta y a la pulmonar."];
      return ["Diástole", tm < ti.sist + 0.07 ? "Relajación isovolumétrica." : tm > ti.T - 0.1 ? "Sístole auricular: la aurícula termina de llenar el ventrículo." : "Llenado ventricular: mitral y tricúspide abiertas."];
    }
    $("#play").onclick = () => { st.marcha = !st.marcha; if (st.marcha) { P.iniciar(); } else P.parar(); $("#play").textContent = st.marcha ? "⏸ Pausa" : "▶ Seguir"; };
    $("#son").onclick = () => { P.sonido = !P.sonido; if (P.sonido) U.activarAudio(); $("#son").textContent = "🔊 Sonido: " + (P.sonido ? "sí" : "no"); };
    $("#vol").oninput = e => U.setVolumen(+e.target.value);
    $("#fc").oninput = e => { st.fc = +e.target.value; $("#fcv").textContent = st.fc; };
    $("#foco").onchange = e => { st.foco = e.target.value; };
    pintarPre(); pintarResp(); texto(); P.iniciar();
    (function bucle() {
      if (gen !== U.gen) return;
      if (P.activo) {
        const est = U.dibujarFono($("#fono"), P, { alto: 170 });
        if (est) {
          const { beat, tm } = est; U.actualizarCorazon($("#cor svg"), tm, beat.lat.ti);
          const [k, t] = ahora(tm, beat.lat.ti, beat.lat); $("#k").textContent = k; $("#txt").innerHTML = t;
          const ev = beat.lat.ev, a = ev.find(x => x.nom === "A2"), p = ev.find(x => x.nom === "P2"), d = Math.round((p.t - a.t) * 1000);
          $("#split").innerHTML = `<span class="k">R2</span><span>${st.inspAct ? "Inspiración" : "Espiración"}: A2–P2 = <b>${d} ms</b> ${d >= 25 ? "· se oyen dos componentes" : "· un solo ruido"}</span>`;
        }
      }
      anim = requestAnimationFrame(bucle);
    })();
    U.alRedimensionar = () => {};
  };
})();
