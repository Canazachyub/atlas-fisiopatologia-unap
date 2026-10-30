/* Gasometría — pestañas 2 (Trastornos) y 3 (Anión gap). */
(function () {
  "use strict";
  const U = window.UTIL, A = U.A, f = A.f, LIT = A.LIT, $ = U.$, $$ = U.$$, SECC = window.SECC;
  const lista = arr => `<ul class="sin">${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
  const ease = x => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* =====================================================================
     PESTAÑA 2 · TRASTORNOS: primario y luego compensación
     ===================================================================== */
  SECC.trastornos = function (main) {
    const OPC = [
      { id: "AM", t: "Acidosis metabólica", key: "AM", cr: "aguda" },
      { id: "AlM", t: "Alcalosis metabólica", key: "AlM", cr: "aguda" },
      { id: "ARa", t: "Acidosis respiratoria aguda", key: "AR", cr: "aguda" },
      { id: "ARc", t: "Acidosis respiratoria crónica", key: "AR", cr: "crónica" },
      { id: "AlRa", t: "Alcalosis respiratoria aguda", key: "AlR", cr: "aguda" },
      { id: "AlRc", t: "Alcalosis respiratoria crónica", key: "AlR", cr: "crónica" }
    ];
    main.innerHTML = `<h1>🎬 Los cuatro trastornos y su compensación</h1>
      <p class="lema">Elige un trastorno. Primero se mueve el <b>primario</b> (el pH se desvía) y después aparece la <b>compensación</b> (el pH se acerca, pero no vuelve del todo). Las fórmulas de compensación no las da la clase: van marcadas ${LIT}.</p>
      <div class="chips" id="op"></div>
      <div class="grid2"><div id="pan"></div>
      <div>
        <div class="caja"><div class="ctrl"><button class="btn" id="play">▶ Reproducir</button>
          <label>Intensidad <input type="range" id="int" min="1" max="3" step="1" value="2"><span class="val" id="intv"></span></label></div>
          <label class="nota" style="display:block">Línea de tiempo: <input type="range" id="tm" min="0" max="200" step="1" value="0" style="width:100%"></label>
          <ol class="pasos" id="fases"></ol></div>
        <div class="caja"><table id="tab"></table></div>
      </div></div>
      <div class="letrero" id="liv" style="margin-top:10px"></div>
      <div class="grid2" style="margin-top:8px"><div class="caja" id="ficha"></div><div class="caja" id="calc"></div></div>`;
    const P = U.panel($("#pan", main));
    let cur = OPC[0], inten = 2, t = 0, anim = 0, tok = 0;
    U.chips($("#op", main), OPC, cur.id, id => { cur = OPC.find(o => o.id === id); parar(); t = 0; dibujar(); ficha(); });
    const play = $("#play", main), tm = $("#tm", main), it = $("#int", main);

    function estado() {
      const tr = A.trayecto(cur.key, cur.cr, inten), N0 = { pco2: 40, hco3: 24 };
      let v;
      if (t <= 1) { const e = ease(t); v = { pco2: lerp(N0.pco2, tr.p.pco2, e), hco3: lerp(N0.hco3, tr.p.hco3, e) }; }
      else { const e = ease(t - 1); v = { pco2: lerp(tr.p.pco2, tr.c.pco2, e), hco3: lerp(tr.p.hco3, tr.c.hco3, e) }; }
      v.pH = A.ph(v.hco3, v.pco2);
      return { v, tr };
    }
    function dibujar() {
      const { v, tr } = estado();
      const base = t < 0.02 ? { pco2: 40, hco3: 24 } : t <= 1.5 ? tr.p : tr.c;
      const L = A.leer(base);
      // la balanza y el medidor siguen los valores interpolados; los roles, la fase
      P.pintar(v, L);
      $("#intv", main).textContent = ["leve", "moderada", "grave"][inten - 1];
      tm.value = Math.round(t * 100);
      $$("#fases li", main).forEach((li, i) => li.classList.toggle("act", i === (t <= 0.02 ? -1 : t <= 1.02 ? 0 : 1)));
      const D = A.DES[cur.key], M = cur.key === "AM" || cur.key === "AlM";
      let txt;
      if (t < 0.02) txt = `<span class="k" style="background:var(--ve)">7,40</span><div><b>Equilibrio normal.</b> HCO₃⁻ 24 y PaCO₂ 40: la relación es 20 a 1 y el pH queda en 7,40. Pulsa «Reproducir» o mueve la línea de tiempo.</div>`;
      else if (t <= 1.02) txt = `<span class="k" style="background:var(--ro)">${f(v.pH, 2)}</span><div><b>① Trastorno primario: ${D.nombre.toLowerCase()}.</b> ${D.mecanismo} Primario = <b>${D.prim}</b>; criterios de la clase: ${D.criterios}</div>`;
      else if (t < 1.98) txt = `<span class="k">${f(v.pH, 2)}</span><div><b>② La compensación va llegando…</b> ${M ? `El pulmón responde en minutos: ${D.compensa}` : (cur.cr === "aguda" ? "El riñón tarda horas a días en generar o botar bicarbonato: de momento el HCO₃⁻ casi no se mueve." : "Pasan días y el riñón ya compensa: " + D.compensa)}</div>`;
      else txt = U.vivo(L, v).replace("</div>", ` <b>El pH se acerca a lo normal pero no vuelve del todo: la compensación nunca corrige, solo amortigua.</b></div>`);
      $("#liv", main).innerHTML = txt;
      const row = (n, a, b, c, d) => `<tr><td>${n}</td><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
      const pHp = A.ph(tr.p.hco3, tr.p.pco2), pHc = A.ph(tr.c.hco3, tr.c.pco2);
      $("#tab", main).innerHTML = `<tr><th></th><th>Normal</th><th>① Primario</th><th>② Compensado</th></tr>` +
        row("pH", "7,40", f(pHp, 2), f(pHc, 2)) + row("PaCO₂", "40", f(tr.p.pco2), f(tr.c.pco2)) + row("HCO₃⁻", "24", f(tr.p.hco3, 1), f(tr.c.hco3, 1));
    }
    function ficha() {
      const D = A.DES[cur.key];
      const causas = Object.keys(A.CAUSAS).filter(g => g.indexOf(cur.key === "AM" ? "AM_" : cur.key === "AlM" ? "AlM" : cur.key === "AR" ? "AR_" : "AlR_") === 0).reduce((a, g) => a.concat(A.CAUSAS[g]), []);
      $("#fases", main).innerHTML = `<li><div><b>Primario.</b> ${D.prim} → ${D.sentido === "acid" ? "el pH baja" : "el pH sube"}.</div></li><li><div><b>Compensación.</b> ${D.compensa}<br><span class="nota">${D.formula} ${LIT}</span></div></li>`;
      $$("#fases li", main).forEach((li, i) => li.onclick = () => { parar(); t = i === 0 ? 1 : 2; dibujar(); });
      $("#ficha", main).innerHTML = `<h3>${D.nombre}</h3><p><b>Criterios (clase):</b> ${D.criterios}</p>
        <p><b>Causas (clase):</b></p>${lista(causas.map(c => c.txt))}
        <p><b>Clínica (clase):</b></p>${lista(D.clinica)}
        <p><b>Tratamiento (clase):</b> ${D.tto}</p>` + (cur.key === "AM" ? `<div class="dif"><b>Pregunta de examen:</b> el Kussmaul es un pulmón <i>sano</i> compensando, no una alcalosis respiratoria.</div>` : "") +
        (cur.key === "AR" ? `<div class="dif"><b>Clase:</b> aguda → HCO₃⁻ normal (el riñón aún no compensó); crónica → HCO₃⁻ aumentado. Es la diferencia que más se pregunta.</div>` : "") +
        (cur.key === "AlM" ? `<div class="dif"><b>Clase 7 y 9:</b> la hipopotasemia hace entrar H⁺ a la célula (alcalosis intracelular), estimula al riñón a botar H⁺ y por eso <b>mantiene</b> la alcalosis.</div>` : "") +
        (cur.key === "AlR" ? `<div class="dif"><b>Tetania:</b> el pH alto baja el Ca²⁺ ionizado → Chvostek y Trousseau. Causa más frecuente: crisis de ansiedad.</div>` : "");
    }
    // calculadora del déficit de bicarbonato (Clase 8)
    $("#calc", main).innerHTML = `<h3>🧮 Déficit de bicarbonato (Clase 8)</h3>
      <p class="nota">Indicado cuando <b>pH &lt; 7,20 y HCO₃⁻ &lt; 10</b>. Fórmula: 0,5 × peso (kg) × (24 − HCO₃⁻).</p>
      <div class="ctrl col">${U.slider("pe", "Peso (kg)", 30, 120, 1, 60)}${U.slider("bh", "HCO₃⁻ actual", 3, 20, 1, 9)}</div>
      <div id="cres" class="letrero"></div>
      <div class="dif"><b>Discrepancia en la clase:</b> el ejemplo (60 kg, HCO₃⁻ 9) da 0,5 × 60 × 15 = <b>450 mEq</b>, pero luego dice «se administrarían 400 mL». Con la ampolla 8,4 % (1 mEq/mL) serían 450 mL; aquí se usa 450. <!-- [REVISAR] cifra 400 mL de la clase --></div>
      <p class="nota">Se pasa en 3-4 horas. En la acidosis respiratoria el bicarbonato casi nunca se da (solo pH &lt; 7,10 refractario).</p>`;
    const cal = () => {
      const pe = +$("#pe", main).value, bh = +$("#bh", main).value, r = A.deficit(pe, bh), pco2 = 1.5 * bh + 8, pH = A.ph(bh, pco2);
      $("#pev", main).textContent = pe; $("#bhv", main).textContent = bh;
      const ind = pH < 7.20 && bh < 10;
      $("#cres", main).innerHTML = `<span class="k">${f(r.meq)}</span><div><b>${f(r.meq)} mEq</b> = ${f(r.ml)} mL de bicarbonato 8,4 %. Con compensación respiratoria esperada ${LIT}, pH ≈ ${f(pH, 2)}: ` + (ind ? `<span class="ok">cumple pH &lt; 7,20 y HCO₃⁻ &lt; 10: indicado</span>.` : `<span class="mal">no cumple los dos criterios: la clase no lo indica</span>.`) + `</div>`;
    };
    $("#pe", main).oninput = cal; $("#bh", main).oninput = cal;

    function parar() { anim = 0; tok++; play.textContent = "▶ Reproducir"; }
    play.onclick = () => {
      if (anim) { parar(); return; }
      if (t >= 1.99) t = 0;
      const gen = ++tok, g0 = U.gen; anim = 1; play.textContent = "⏸ Pausa";
      let ult = performance.now();
      (function paso(ahora) {
        if (gen !== tok || g0 !== U.gen) return;
        t = Math.min(2, t + (ahora - ult) / 3200); ult = ahora; dibujar();
        if (t >= 2) { anim = 0; play.textContent = "▶ Reproducir"; return; }
        requestAnimationFrame(paso);
      })(ult);
    };
    tm.oninput = () => { parar(); t = +tm.value / 100; dibujar(); };
    it.oninput = () => { inten = +it.value; dibujar(); };
    U.repintar = dibujar; ficha(); cal(); dibujar();
  };

  /* =====================================================================
     PESTAÑA 3 · ANIÓN GAP (gamblegrama)
     ===================================================================== */
  SECC.gap = function (main) {
    main.innerHTML = `<h1>📊 Anión gap</h1>
      <p class="lema">En el plasma los cationes y los aniones se igualan. Solo medimos Na⁺, Cl⁻ y HCO₃⁻; lo que falta son los <b>aniones no medidos</b>. Si en una acidosis metabólica ese hueco crece, hay un ácido nuevo (lactato, cetoácidos…); si no, se perdió bicarbonato y el cloro lo reemplazó. La clase lo pregunta como «gap aumentado» o «gap normal»; la fórmula y la cifra normal vienen de la literatura ${LIT}.</p>
      <div class="grid2"><div class="caja"><svg id="gm" viewBox="0 0 520 360" style="width:100%;height:auto" role="img" aria-label="Gamblegrama: sodio frente a cloro, bicarbonato y anión gap"></svg></div>
      <div><div class="caja"><h3>Datos del laboratorio</h3><div class="ctrl col" id="ctl">
        ${U.slider("na", "Na⁺ (mEq/L)", 120, 160, 1, 140)}${U.slider("cl", "Cl⁻ (mEq/L)", 80, 130, 1, 104)}${U.slider("hc", "HCO₃⁻ (mEq/L)", 3, 40, 1, 24)}${U.slider("al", "Albúmina (g/dL)", 1, 5, 0.1, 4)}
        </div><div class="chips" id="pre"></div>
        <p class="nota">Electrolitos de la Clase 4: Na⁺ 135-145 · Cl⁻ 97-105 · HCO₃⁻ 24-26 mEq/L (la Clase 8 da 22-26).</p></div>
        <div class="letrero" id="res"></div><div class="caja" id="det"></div></div></div>
      <div class="grid2"><div class="tarj ro"><b class="t">Gap AUMENTADO (acidosis por ácidos fijos)</b>
        <p class="nota" style="margin:2px 0">Se gasta HCO₃⁻ neutralizando un ácido y el anión de ese ácido queda en la sangre, sin medir. El Cl⁻ no cambia.</p>
        ${lista(["<b>C</b>etoacidosis (diabetes tipo 1)", "<b>L</b>áctica (shock)", "<b>A</b>lcohol etílico", "<b>R</b>enal (insuficiencia renal)"])}
        <p class="nota">Acrónimo de la ficha: <b>CLARA</b>. Se suman, ${LIT}: metanol, etilenglicol, salicilatos.</p></div>
      <div class="tarj ve"><b class="t">Gap NORMAL (acidosis hiperclorémica)</b>
        <p class="nota" style="margin:2px 0">Se pierde HCO₃⁻ y el riñón retiene Cl⁻ para mantener la electroneutralidad. No aparece ningún anión nuevo.</p>
        ${lista(["Diarrea grave (pierde bicarbonato; es la excepción que más se pregunta)", "Acidosis tubular renal", `Suero salino masivo ${LIT}`])}
        <p class="nota">Clase 4: la diarrea pierde Na⁺ 50-60, K⁺ 30-35 y Cl⁻ 40-45 mEq/L. Los vómitos hacen lo contrario: pierden Cl⁻ y H⁺ y dan alcalosis hipoclorémica.</p></div></div>`;
    const pre = [
      { id: "n", t: "Normal", na: 140, cl: 104, hc: 24 }, { id: "cad", t: "Cetoacidosis", na: 140, cl: 104, hc: 10 },
      { id: "lac", t: "Láctica (shock)", na: 140, cl: 100, hc: 10 }, { id: "ir", t: "Insuficiencia renal", na: 140, cl: 102, hc: 14 },
      { id: "dia", t: "Diarrea grave", na: 138, cl: 114, hc: 12 }, { id: "vom", t: "Vómitos", na: 140, cl: 92, hc: 38 }
    ];
    U.chips($("#pre", main), pre, "n", id => { const p = pre.find(x => x.id === id); $("#na", main).value = p.na; $("#cl", main).value = p.cl; $("#hc", main).value = p.hc; $("#al", main).value = 4; act(); });
    const SV = "http://www.w3.org/2000/svg", gm = $("#gm", main);
    function rect(x, y, w, h, fill, txt, op) {
      return `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(h, 0)}" fill="${fill}" fill-opacity="${op || .9}" stroke="var(--papel)" stroke-width="2"/>` +
        (txt && h > 16 ? `<text x="${x + w / 2}" y="${y + h / 2 + 5}" font-size="14" font-weight="700" fill="#fff" text-anchor="middle">${txt}</text>` : "");
    }
    function act() {
      const na = +$("#na", main).value, cl = +$("#cl", main).value, hc = +$("#hc", main).value, al = +$("#al", main).value;
      ["na", "cl", "hc"].forEach(k => $("#" + k + "v", main).textContent = $("#" + k, main).value); $("#alv", main).textContent = f(al, 1);
      const AG = A.ag(na, cl, hc), AGc = A.agCorr(AG, al);
      // gamblegrama: la altura es proporcional a mEq/L
      const base = 330, esc = 1.9, W = 130;
      let s = `<line x1="20" x2="500" y1="${base}" y2="${base}" stroke="var(--borde)" stroke-width="2"/>`;
      s += rect(70, base - na * esc, W, na * esc, "#2563eb", `Na⁺ ${na}`);
      s += `<text x="${70 + W / 2}" y="${base + 20}" font-size="13" text-anchor="middle" fill="currentColor" font-weight="700">CATIONES</text>`;
      s += `<text x="${70 + W / 2}" y="${base - na * esc - 6}" font-size="11" text-anchor="middle" fill="var(--tx2)">(K⁺, Ca²⁺, Mg²⁺ no se cuentan)</text>`;
      const x2 = 290; let y = base;
      s += rect(x2, y - hc * esc, W, hc * esc, "#0d9488", `HCO₃⁻ ${hc}`); y -= hc * esc;
      s += rect(x2, y - cl * esc, W, cl * esc, "#7c3aed", `Cl⁻ ${cl}`); y -= cl * esc;
      const colAG = AGc > 12 ? "#dc2626" : AGc < 8 ? "#64748b" : "#16a34a";
      if (AG >= 0) s += rect(x2, y - AG * esc, W, AG * esc, colAG, `AG ${f(AG, 0)}`); else s += `<text x="${x2 + W / 2}" y="${y - 6}" font-size="12" text-anchor="middle" fill="var(--ro)">AG negativo: revisa los datos</text>`;
      // franja del AG normal 8-12 (literatura) sobre Cl + HCO3
      const yN = base - (hc + cl) * esc;
      s += `<rect x="${x2 + W + 8}" y="${yN - 12 * esc}" width="14" height="${4 * esc}" fill="none" stroke="#16a34a" stroke-dasharray="3 3" stroke-width="2"/><text x="${x2 + W + 26}" y="${yN - 10 * esc + 4}" font-size="11" fill="#16a34a">AG normal 8-12</text>`;
      s += `<text x="${x2 + W / 2}" y="${base + 20}" font-size="13" text-anchor="middle" fill="currentColor" font-weight="700">ANIONES</text>`;
      s += `<text x="${x2 + W / 2}" y="${Math.min(y - Math.max(AG, 0) * esc, base) - 6}" font-size="11" text-anchor="middle" fill="var(--tx2)">AG = aniones no medidos</text>`;
      s += `<line x1="${70 + W}" x2="${x2}" y1="${base - na * esc}" y2="${base - na * esc}" stroke="var(--tx2)" stroke-dasharray="4 4"/>`;
      gm.innerHTML = s;
      const alto = AGc > 12, bajo = AGc < 8;
      let causa;
      if (alto) causa = `Gap <b>aumentado</b>: piensa en <b>CLARA</b> (cetoacidosis, láctica, alcohol, renal) y, ${LIT}, metanol, etilenglicol y salicilatos.`;
      else if (bajo) causa = `Gap bajo: ${LIT} suele ser hipoalbuminemia o error de laboratorio.`;
      else if (hc < 22) causa = `Gap <b>normal</b> con HCO₃⁻ bajo y Cl⁻ ${cl > 105 ? "alto" : "normal"}: se perdió bicarbonato (diarrea grave, acidosis tubular renal).`;
      else if (hc > 26) causa = `HCO₃⁻ alto con gap normal${cl < 97 ? " y Cl⁻ bajo" : ""}: alcalosis metabólica (${cl < 97 ? "alcalosis hipoclorémica: vómitos o diuréticos, Clases 4 y 9" : "vómitos, diuréticos, hiperaldosteronismo, bicarbonato"}).`;
      else causa = "Todo en rango: no hay trastorno metabólico visible.";
      $("#res", main).innerHTML = `<span class="k" style="background:var(--${alto ? "ro" : bajo ? "mo" : "ve"})">${f(AG, 0)}</span><div><b>AG = ${na} − (${cl} + ${hc}) = ${f(AG, 0)} mEq/L</b> ${LIT}<br>${causa}</div>`;
      let det = "";
      if (Math.abs(al - 4) > 0.05) det += `<p><b>Corregido por albúmina</b> ${LIT}: AG + 2,5 × (4 − ${f(al, 1)}) = <b>${f(AGc, 1)}</b>. Cada g/dL de albúmina que falta oculta ≈ 2,5 mEq/L de gap.</p>`;
      if (alto && hc < 24) { const d = A.delta(AGc, hc); det += `<p><b>Delta</b> ${LIT}: ΔAG ${f(d.dAG, 1)} / ΔHCO₃⁻ ${f(d.dH, 1)} = <b>${f(d.r, 2)}</b>. ${d.txt}</p>`; }
      det += `<p class="nota">El gap se calcula sobre la gasometría venosa o arterial junto al ionograma. La clase no da la cifra normal ni el delta: por eso están marcados.</p>`;
      $("#det", main).innerHTML = det;
    }
    ["na", "cl", "hc", "al"].forEach(k => $("#" + k, main).oninput = act);
    act();
  };
})();
