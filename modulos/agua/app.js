/* Agua, sodio y potasio — núcleo: tema, router, utilidades y pestaña «Compartimentos».
   Las demás pestañas viven en secciones.js (deshidratación, sodio y potasio) y secciones2.js (explicación, prueba);
   cada una se registra en window.SECC[nombre] = function (contenedor). */
(function () {
  "use strict";
  const A = window.AGUA;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { gen: 0, A, $, $$ };
  const SV = "http://www.w3.org/2000/svg";

  /* ---------- formato en español: coma decimal ---------- */
  const f = U.f = (x, d) => (isFinite(x) ? Number(x).toFixed(d == null ? 1 : d) : "—").replace(".", ",").replace("-", "−");
  const sg = U.sg = (x, d) => (x > 0 ? "+" : "") + f(x, d);

  /* ---------- tema (el mismo que el atlas) ---------- */
  const CLAVE = "atlas-semio-v1";
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } };
  const guardar = o => { try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} };
  { const P = leer(); if (P.tema) document.documentElement.dataset.theme = P.tema; }
  $("#tema-btn").onclick = () => {
    const P = leer(), osc = matchMedia("(prefers-color-scheme: dark)").matches;
    P.tema = (P.tema || (osc ? "dark" : "light")) === "dark" ? "light" : "dark"; guardar(P);
    document.documentElement.dataset.theme = P.tema; U.repintar && U.repintar();
  };
  U.css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  /* ---------- animación: contador de generación; al cambiar de pestaña se invalida ---------- */
  // quien arranca un bucle rAF guarda g = U.gen y se detiene cuando g !== U.gen
  U.detener = () => { U.gen++; U.repintar = null; };

  /* ---------- utilidades de interfaz ---------- */
  U.chips = (cont, items, activo, alElegir) => {
    cont.innerHTML = items.map(it => `<button class="chip${it.id === activo ? " act" : ""}" data-id="${it.id}">${it.t}</button>`).join("");
    $$(".chip", cont).forEach(b => b.onclick = () => { $$(".chip", cont).forEach(x => x.classList.toggle("act", x === b)); alElegir(b.dataset.id); });
  };
  U.mk = (tag, at) => { const e = document.createElementNS(SV, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
  U.barajar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  U.azar = (a, b) => a + Math.random() * (b - a);
  U.entero = (a, b) => Math.round(U.azar(a, b));
  const LIT = '<span class="lit">literatura</span>';
  U.LIT = LIT;

  /* ---------- router por #hash ---------- */
  const NOMBRES = ["compart", "deshid", "nak", "explicacion", "prueba"];
  function ir() {
    let h = (location.hash || "").replace("#", ""); if (NOMBRES.indexOf(h) < 0) h = "compart";
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + h));
    U.detener(); vista.innerHTML = "";
    const cont = document.createElement("section"); cont.className = "seccion ver"; vista.appendChild(cont);
    try { SECC[h](cont); } catch (e) { cont.innerHTML = "<div class='caja'>No se pudo dibujar esta pestaña: " + e.message + "</div>"; console.error(e); }
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", ir);
  U.ir = ir;

  /* =====================================================================
     PESTAÑA 1 · COMPARTIMENTOS
     ===================================================================== */
  SECC.compart = function (cont) {
    const gen = U.gen;
    let cat = "varon", peso = 70;
    let est = A.crear(peso, cat);          // estado objetivo (el modelo ya está en equilibrio)
    const vis = { vic: est.vic, inters: est.inters, plasma: est.plasma, tercer: 0 };   // lo que se ve (se acerca al objetivo)
    const hist = [];
    let msg = "Empieza pulsando un botón: verás hacia dónde se mueve el agua y por qué.", tono = "";

    cont.innerHTML = `
    <h1>💧 Compartimentos del agua corporal</h1>
    <p class="lema">El agua total es el <b>60 % del peso</b>; de ella <b>60 % está dentro de las células</b> y <b>40 % fuera</b> (plasma + intersticial). El agua cruza la membrana libremente, así que <mark>va hacia donde hay más partículas</mark> (más sodio fuera, menos agua dentro).</p>
    <div class="grid2">
      <div class="caja panel" style="padding:8px"><svg id="sv" viewBox="0 0 640 440" role="img" aria-label="Persona con agua corporal total y tres tanques: intracelular, intersticial y plasma"></svg></div>
      <div>
        <div class="caja">
          <h3>Paciente</h3>
          <div class="chips" id="cats"></div>
          <div class="ctrl"><label>Peso <input type="range" id="peso" min="3" max="150" step="1" value="70"><b id="pesov"></b></label></div>
          <p class="nota" id="notacat"></p>
        </div>
        <div class="caja">
          <h3>Sumar</h3>
          <div class="btns">
            <button class="btn az2" data-a="agua">💧 +1 L agua libre / D5 %</button>
            <button class="btn az2" data-a="ss">🧂 +1 L suero 0,9 %</button>
            <button class="btn az2" data-a="hip">🧂🧂 +0,5 L salina 3 % ${LIT}</button>
          </div>
          <h3>Perder</h3>
          <div class="btns">
            <button class="btn ro" data-a="sudor">🥵 −1 L sudor</button>
            <button class="btn ro" data-a="diarrea">💩 −1 L diarrea</button>
            <button class="btn ro" data-a="vomito">🤮 −1 L vómito</button>
            <button class="btn ro" data-a="insens">🌡️ −1 L agua pura (fiebre, insensibles)</button>
            <button class="btn ro" data-a="tercer">🫃 −1 L a tercer espacio (ascitis, peritonitis)</button>
            <button class="btn sec" id="reset">↺ Restablecer</button>
          </div>
        </div>
      </div>
    </div>
    <div class="grid2" style="margin-top:6px">
      <div>
        <div class="letrero" id="letrero" style="display:block"></div>
        <ol class="hist" id="hist"></ol>
        <div class="dif" id="dif" hidden></div>
      </div>
      <div class="caja">
        <div class="kpis" id="kpis"></div>
        <svg id="celula" viewBox="0 0 240 170" style="width:100%;max-width:340px;display:block;margin:6px auto 0" role="img" aria-label="Célula que se hincha o se arruga"></svg>
        <p class="nota" id="notacel" style="text-align:center;margin:0"></p>
      </div>
    </div>
    <div class="caja"><b>Composición de las pérdidas</b> (clase 4, mEq/L): <span class="nota">sudor Na 45-55, K 5, Cl 50-60 · diarrea Na 50-60, K 30-35, Cl 40-45 · jugo gástrico Na 40-50, K 10, Cl 130-140 · suero 0,9 %: Na 154 y Cl 154. Todos tienen <b>menos sodio que el plasma</b> (140), por eso perderlos concentra el EC. El reparto plasma/intersticial (1/4 y 3/4) y las cifras de mujer, lactante, anciano y obeso son ${LIT}; el 60/40 y el 60 % del peso son del docente.</span></div>`;

    /* ---- controles ---- */
    U.chips($("#cats", cont), A.CATEGORIAS.map(c => ({ id: c.id, t: c.t })), cat, id => {
      cat = id; peso = A.CATEGORIAS.find(c => c.id === id).peso; $("#peso", cont).value = peso; reiniciar();
    });
    $("#peso", cont).oninput = e => { peso = +e.target.value; reiniciar(); };
    $$("[data-a]", cont).forEach(b => b.onclick = () => accion(b.dataset.a));
    $("#reset", cont).onclick = () => reiniciar();

    function reiniciar() {
      est = A.crear(peso, cat); hist.length = 0;
      msg = "Estado normal restablecido."; tono = ""; pintarTexto(); vis.tercer = 0;
    }

    /* ---- letrero causa → efecto ---- */
    function accion(id) {
      const ant = est, nuevo = A.aplicar(est, id), a = A.ACCIONES[id];
      let t = "";
      const naA = f(ant.na, 0), naN = f(nuevo.na, 0), oN = f(nuevo.osm, 0), dic = nuevo.dvic;
      const sentido = dic > 0.05 ? `el agua <b>entra</b> a la célula (${sg(dic, 1)} L) y se <b>hincha</b>`
        : dic < -0.05 ? `el agua <b>sale</b> de la célula (${sg(dic, 1)} L) y se <b>arruga</b>` : `el intracelular casi no cambia`;
      if (id === "agua") t = `+1 L de agua sin sodio → <b>diluye</b> el extracelular: Na ${naA}→<b>${naN}</b>, osmolaridad →${oN} → ${sentido}. Agua libre es lo que causa la hiponatremia por exceso (hiperhidratación).`;
      else if (id === "ss") t = `+1 L de suero 0,9 % (Na 154 ≈ plasma) → es <b>isotónico</b>: no cambia la osmolaridad (${oN}) → el líquido <b>se queda en el extracelular</b> (${sg(nuevo.vec - ant.vec, 1)} L) y ${sentido}. Por eso el suero fisiológico repone el volumen sin mover agua a la célula.`;
      else if (id === "hip") t = `+0,5 L de salina 3 % (Na 513) → <b>sube la tonicidad</b>: Na ${naA}→<b>${naN}</b> → ${sentido}. Expande el EC a costa del agua intracelular.`;
      else if (id === "tercer") t = `−1 L al tercer espacio (ascitis, derrame, peritonitis) → es líquido <b>isotónico</b>: el Na no cambia (${naN}), el EC se vacía (${sg(nuevo.vec - ant.vec, 1)} L) pero queda <b>atrapado</b>: el cuerpo está más seco "por dentro" aunque el peso no baje. ${sentido}.`;
      else if (id === "insens") t = `−1 L de agua pura (fiebre, hiperventilación, diabetes insípida) → sale agua sin sodio: Na ${naA}→<b>${naN}</b>, osmolaridad →${oN} → ${sentido}. Es el mecanismo de la <b>deshidratación hipertónica</b>.`;
      else t = `−1 L de ${a.t.toLowerCase()} (Na ${a.na}, K ${a.k} mEq/L): pierde más agua que sodio, el EC se concentra: Na ${naA}→<b>${naN}</b> → ${sentido}. Se pierden además ${f(a.k, 0)} mEq de K⁺.`;
      est = nuevo; hist.unshift(a.t); if (hist.length > 5) hist.pop();
      tono = A.estadoNa(est.na).cls; msg = t; pintarTexto(id);
    }

    function pintarTexto(id) {
      const st = A.estadoNa(est.na);
      const act = est.vic + est.vec, perdida = (est.act0 - act - est.tercer) / est.peso * 100;   // el líquido del tercer espacio sigue pesando
      const gr = A.grado(perdida);
      $("#letrero", cont).innerHTML = `<span class="k" style="background:var(--${st.cls === "ve" ? "ve" : st.cls === "na" ? "na" : "ro"})">Na ${f(est.na, 0)}</span> ${msg}`;
      $("#hist", cont).innerHTML = hist.map(h => `<li>${h}</li>`).join("");
      let extra = "";
      if (est.na < 130) extra = "Con Na < 130 mEq/L aparecen los síntomas neurológicos (el cerebro se edematiza); < 125 es cuadro grave.";
      else if (est.na > 150) extra = "Con Na > 150 mEq/L la célula se deshidrata: sed intensa, irritabilidad, convulsiones, coma.";
      else if (perdida >= 2.5 && st.id === "norm") extra = "Sodio normal con pérdida de volumen: <b>deshidratación isotónica</b>, la más común (70-90 %).";
      const tipo = A.tipoPorNa(est.na);
      const tipoT = { hipotonica: "hipotónica (la más grave)", isotonica: "isotónica", hipertonica: "hipertónica", zona: "zona intermedia (la clase no la rotula)" }[tipo];
      $("#kpis", cont).innerHTML =
        `<div><small>Agua total</small><span class="num2">${f(act, 1)} L</span><small>basal ${f(est.act0, 1)} L</small></div>
         <div><small>Na plasmático</small><span class="num2">${f(est.na, 0)}</span><small>mEq/L (135-145)</small></div>
         <div><small>Osmolaridad</small><span class="num2">${f(est.osm, 0)}</span><small>mOsm/L (280-310)</small></div>
         <div><small>Peso corporal</small><span class="num2">${sg(-perdida, 1)} %</span><small>${perdida >= 2.5 ? gr.t : perdida <= -2.5 ? "ganancia (hiperhidratación)" : "sin cambio relevante"}</small></div>`;
      const d = $("#dif", cont), perdio = est.vec < est.vec0 - 0.2;
      let dh = "";
      if (perdio && (id === "diarrea" || id === "vomito" || id === "sudor"))
        dh = `<b>Discrepancia.</b> Aquí el modelo pierde solo el líquido de la tabla (Na ≈ 50) y no repone nada, y por eso el Na <b>sube</b>. La clase 5 dice que vómitos y diarrea intensos dan la deshidratación <b>isotónica</b> (70-90 % de casos): en el paciente real también se pierde mucho sodio y el agua que bebe o retiene (ADH) compensa. Prueba: pierde 2 L de diarrea y luego dale +1 L de agua libre → queda <b>hipotónica</b>, la más grave.`;
      if (est.na < 135 && perdio) dh = `Pérdida de volumen con Na bajo = deshidratación <b>${tipoT}</b> (clase 5: agua al IC, riesgo de edema cerebral, sin sed, mucosas húmedas).`;
      d.hidden = !dh; d.innerHTML = dh;
      $("#notacat", cont).innerHTML = `Agua total = ${f(est.pct * 100, 0)} % × ${peso} kg = <b>${f(est.act0, 1)} L</b>. ` +
        (cat === "varon" ? "Es la cifra del docente (0,6 × peso)." : `Porcentaje de ${LIT}: la clase solo dice que la mujer y el obeso tienen <b>menos</b> agua (menos músculo, más grasa) y el recién nacido <b>más</b>.`);
      $("#pesov", cont).textContent = peso + " kg";
      $("#notacel", cont).innerHTML = tipo === "isotonica" && Math.abs(est.vic - est.vic0) < 0.15 ? "Célula normal: el agua de adentro y de afuera está en equilibrio." : "";
    }
    pintarTexto();

    /* ---- SVG principal ---- */
    const sv = $("#sv", cont);
    const X = [250, 380, 510], TOP = 90, ALT = 260, W = 100;
    const cuerpo = "M72 84 Q100 74 128 84 L158 192 L142 198 L127 142 L125 242 L131 384 L111 388 L100 272 L89 388 L69 384 L75 242 L73 142 L58 198 L42 192 Z";
    sv.innerHTML = `
      <defs><clipPath id="clipc"><circle cx="100" cy="46" r="26"/><path d="${cuerpo}"/></clipPath>
      <pattern id="onda" width="20" height="8" patternUnits="userSpaceOnUse"><path d="M0 4 Q5 0 10 4 T20 4" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2"/></pattern></defs>
      <text x="100" y="14" font-size="14" text-anchor="middle" font-weight="700" fill="var(--az)">Agua corporal total</text>
      <g clip-path="url(#clipc)"><rect x="0" y="0" width="200" height="420" fill="var(--borde)" opacity=".35"/>
        <rect id="wic" x="0" width="200" fill="#2563eb"/><rect id="wec" x="0" width="200" fill="#06b6d4"/>
        <rect id="wav" x="0" width="200" height="420" fill="url(#onda)"/></g>
      <circle cx="100" cy="46" r="26" fill="none" stroke="var(--tx)" stroke-width="3"/><path d="${cuerpo}" fill="none" stroke="var(--tx)" stroke-width="3" stroke-linejoin="round"/>
      <text id="tact" x="100" y="414" font-size="20" text-anchor="middle" font-weight="700" fill="var(--tx)"></text>
      <g id="tanques"></g>
      <path d="M${X[1] - 4} 78 h${W + 8 + X[2] - X[1]}" stroke="#06b6d4" stroke-width="5" stroke-linecap="round"/>
      <text x="${(X[1] + X[2] + W) / 2 - 2}" y="68" font-size="14" font-weight="700" text-anchor="middle" fill="#0e7490">EXTRACELULAR (40 %)</text>
      <g id="flechas"></g>`;
    const g = $("#tanques", sv);
    const defs = [
      { id: "ic", t: "Intracelular", c: "#2563eb", x: X[0] }, { id: "in", t: "Intersticial", c: "#06b6d4", x: X[1] }, { id: "pl", t: "Plasma", c: "#ef4444", x: X[2] }];
    defs.forEach(d => {
      g.appendChild(U.mk("rect", { x: d.x, y: TOP, width: W, height: ALT, rx: 8, fill: "var(--papel)", stroke: "var(--tx2)", "stroke-width": 3 }));
      g.appendChild(U.mk("rect", { id: "n_" + d.id, x: d.x + 3, width: W - 6, fill: d.c, opacity: ".9" }));
      g.appendChild(U.mk("line", { id: "b_" + d.id, x1: d.x - 6, x2: d.x + W + 6, stroke: "var(--tx)", "stroke-width": 2, "stroke-dasharray": "5 4" }));
      const t = U.mk("text", { x: d.x + W / 2, y: TOP + ALT + 22, "font-size": 15, "text-anchor": "middle", "font-weight": 700, fill: "var(--tx)" }); t.textContent = d.t; g.appendChild(t);
      g.appendChild(U.mk("text", { id: "v_" + d.id, x: d.x + W / 2, y: TOP + ALT + 42, "font-size": 15, "text-anchor": "middle", fill: "var(--tx)" }));
      g.appendChild(U.mk("text", { id: "p_" + d.id, x: d.x + W / 2, y: TOP + ALT + 60, "font-size": 12.5, "text-anchor": "middle", fill: "var(--tx2)" }));
    });
    // etiqueta del tercer espacio
    g.appendChild(U.mk("text", { id: "t3", x: 560, y: 418, "font-size": 12.5, "text-anchor": "end", fill: "var(--tx2)" }));
    const fl = $("#flechas", sv);
    const f1 = U.mk("path", { id: "fl1", d: `M${X[0] + W + 6} 210 H${X[1] - 6}`, stroke: "var(--ro)", "stroke-width": 6, fill: "none", class: "flujo", opacity: 0 });
    const h1 = U.mk("path", { id: "ph1", d: `M${X[0] + W + 9} 210 l-12 -10 v20 z`, fill: "var(--ro)", opacity: 0 });
    const h2 = U.mk("path", { id: "ph2", d: `M${X[1] - 9} 210 l12 -10 v20 z`, fill: "var(--ro)", opacity: 0 });
    fl.appendChild(f1); fl.appendChild(h1); fl.appendChild(h2);
    const MAXV = () => est.act0 * 0.72;
    const nivel = (id, v, base) => {
      const d = defs.find(q => q.id === id), h = Math.max(0, Math.min(ALT - 4, v / MAXV() * ALT));
      const r = $("#n_" + id, sv); r.setAttribute("y", TOP + ALT - h - 2); r.setAttribute("height", h);
      const hb = base / MAXV() * ALT, b = $("#b_" + id, sv); b.setAttribute("y1", TOP + ALT - hb - 2); b.setAttribute("y2", TOP + ALT - hb - 2);
      $("#v_" + id, sv).textContent = f(v, 1) + " L";
      const dv = v - base;
      $("#p_" + id, sv).textContent = Math.abs(dv) < 0.05 ? "sin cambio" : sg(dv, 1) + " L";
    };

    /* ---- célula ---- */
    const cel = $("#celula", cont);
    function dibujaCelula(ratio) {
      const r0 = 50, cx = 120, cy = 82;
      const r = Math.min(76, r0 * Math.sqrt(Math.max(0.4, ratio)));
      let d = "", etq = "Célula normal", col = "#93c5fd", borde = "#1d4ed8";
      if (ratio < 0.97) {                       // crenada: contorno con picos
        const n = 16, amp = Math.min(10, (1 - ratio) * 70 + 2);
        for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = r + (i % 2 ? -amp : amp * .2); d += (i ? "L" : "M") + (cx + rr * Math.cos(a)).toFixed(1) + " " + (cy + rr * Math.sin(a)).toFixed(1); }
        d += "Z"; etq = "Se arruga (pierde agua)"; col = "#fca5a5"; borde = "#b91c1c";
      } else {
        d = `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
        if (ratio > 1.03) { etq = "Se hincha (gana agua)"; col = "#bae6fd"; borde = "#0369a1"; }
      }
      cel.innerHTML = `<path d="${d}" fill="${col}" stroke="${borde}" stroke-width="${ratio > 1.03 ? 5 : 3}" stroke-linejoin="round"/>
        <circle cx="${cx}" cy="${cy}" r="${Math.min(16, 12 * Math.sqrt(ratio))}" fill="#7c3aed" opacity=".55"/>
        <text x="${cx}" y="${cy + 3}" font-size="9" text-anchor="middle" fill="#fff">núcleo</text>
        <text x="120" y="164" font-size="14" font-weight="700" text-anchor="middle" fill="${borde}">${etq} · ${f(ratio * 100, 0)} %</text>
        <circle cx="${cx}" cy="${cy}" r="${r0}" fill="none" stroke="var(--tx2)" stroke-dasharray="4 4" opacity=".6"/>`;
    }

    /* ---- bucle de animación: lo visible persigue al objetivo ---- */
    let t0 = performance.now(), nrate = 0;
    (function bucle(t) {
      if (gen !== U.gen) return;
      const dt = Math.min(0.05, (t - t0) / 1000); t0 = t;
      const k = 1 - Math.exp(-dt * 3.2);
      vis.vic += (est.vic - vis.vic) * k; vis.inters += (est.inters - vis.inters) * k; vis.plasma += (est.plasma - vis.plasma) * k;
      vis.tercer += (est.tercer - vis.tercer) * k;
      const tot = vis.vic + vis.inters + vis.plasma;
      // persona: nivel de agua total y banda intracelular/extracelular
      const lvl = Math.min(380, 362 * 0.85 * tot / est.act0), base = 388;
      const hic = lvl * (vis.vic / tot), hec = lvl - hic;
      const wic = $("#wic", sv), wec = $("#wec", sv), wav = $("#wav", sv);
      wic.setAttribute("y", base - hic); wic.setAttribute("height", hic);
      wec.setAttribute("y", base - lvl); wec.setAttribute("height", hec);
      wav.setAttribute("y", base - lvl - 2 + Math.sin(t / 400) * 1.5);
      $("#tact", sv).textContent = f(tot, 1) + " L";
      nivel("ic", vis.vic, est.vic0); nivel("in", vis.inters, est.vec0 * (1 - A.LIT.PLASMA_DEL_EC)); nivel("pl", vis.plasma, est.vec0 * A.LIT.PLASMA_DEL_EC);
      $("#p_ic", sv).textContent += "  (" + f(vis.vic / tot * 100, 0) + " % del agua)";
      $("#t3", sv).textContent = est.tercer > 0.05 ? "Tercer espacio: " + f(vis.tercer, 1) + " L atrapados" : "";
      // flecha de ósmosis entre IC e intersticial según se mueva el agua
      const mov = est.vic - vis.vic;                    // + : todavía entra agua a la célula
      const a = Math.min(1, Math.abs(mov) * 4);
      $("#fl1", sv).setAttribute("opacity", a); $("#ph1", sv).setAttribute("opacity", mov < 0 ? a : 0); $("#ph2", sv).setAttribute("opacity", mov > 0 ? a : 0);
      $("#fl1", sv).style.animationDirection = mov > 0 ? "reverse" : "normal";
      if ((nrate++ & 1) === 0) dibujaCelula(vis.vic / est.vic0);
      requestAnimationFrame(bucle);
    })(performance.now());
    U.repintar = () => pintarTexto();
  };

  window.addEventListener("load", ir);
})();
