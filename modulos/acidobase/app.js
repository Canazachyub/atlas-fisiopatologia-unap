/* Gasometría y ácido-base — núcleo: tema, router, panel pH + balanza + pulmón/riñón y pestaña Simulador.
   Las demás pestañas están en secciones.js y secciones2.js y se registran en window.SECC. */
(function () {
  "use strict";
  const A = window.AB, f = A.f, LIT = A.LIT;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { gen: 0, A, $, $$ };

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
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  U.css = css;

  /* ---------- animación: un contador de generación; al cambiar de pestaña se invalida ---------- */
  // quien arranca un bucle rAF guarda g = U.gen y se detiene cuando g !== U.gen
  U.detener = () => { U.gen++; U.repintar = null; U.alRedimensionar = null; if (U.audio) { try { U.audio.suspend(); } catch (e) {} } };

  /* ---------- utilidades de interfaz ---------- */
  U.chips = (cont, items, activo, alElegir) => {
    cont.innerHTML = items.map(it => `<button class="chip${it.id === activo ? " act" : ""}" data-id="${it.id}">${it.t}</button>`).join("");
    $$(".chip", cont).forEach(b => b.onclick = () => { $$(".chip", cont).forEach(x => x.classList.toggle("act", x === b)); alElegir(b.dataset.id); });
  };
  U.slider = (id, rot, min, max, paso, val) => `<label>${rot}<input type="range" id="${id}" min="${min}" max="${max}" step="${paso}" value="${val}"><span class="val" id="${id}v"></span></label>`;
  U.esc = s => s;

  /* =====================================================================
     PANEL: medidor de pH + balanza (base ↔ ácido) + riñón y pulmón
     ===================================================================== */
  const SV = "http://www.w3.org/2000/svg";
  U.panel = function (cont) {
    const X0 = 30, AN = 540, PHMIN = 6.8, PHMAX = 7.8;
    const px = p => X0 + (A.clamp(p, PHMIN, PHMAX) - PHMIN) / (PHMAX - PHMIN) * AN;
    const zonas = [[6.8, 7.2, "#7f1d1d"], [7.2, 7.35, "#dc2626"], [7.35, 7.45, "#16a34a"], [7.45, 7.6, "#3b82f6"], [7.6, 7.8, "#1e3a8a"]];
    const marcas = [7.0, 7.2, 7.35, 7.45, 7.6];
    const PV = { x: 300, y: 205, L: 190 };   // pivote y semilargo del brazo
    cont.innerHTML = `<div class="panel caja" style="padding:10px"><svg viewBox="0 0 600 500" role="img" aria-label="Medidor de pH, balanza entre bicarbonato y CO2, riñón y pulmón">
      <g id="medidor">
        ${zonas.map(z => `<rect x="${px(z[0])}" y="46" width="${px(z[1]) - px(z[0])}" height="24" fill="${z[2]}" opacity=".9"/>`).join("")}
        ${marcas.map(m => `<line x1="${px(m)}" x2="${px(m)}" y1="70" y2="76" stroke="currentColor"/><text x="${px(m)}" y="89" font-size="11" text-anchor="middle" fill="currentColor">${f(m, m === 7.35 || m === 7.45 ? 2 : 1)}</text>`).join("")}
        <text x="${X0}" y="108" font-size="12" fill="#dc2626" font-weight="700">◀ ÁCIDO (H⁺ ↑)</text>
        <text x="${X0 + AN}" y="108" font-size="12" fill="#3b82f6" font-weight="700" text-anchor="end">ÁLCALI (H⁺ ↓) ▶</text>
        <text x="300" y="108" font-size="11" fill="#16a34a" font-weight="700" text-anchor="middle">normal</text>
        <g id="aguja" class="agua"><polygon points="-8,-4 8,-4 0,12" transform="translate(0,36)" fill="var(--tx)"/><text id="agv" x="0" y="20" font-size="16" font-weight="700" text-anchor="middle" fill="var(--tx)"></text></g>
      </g>
      <g id="balanza">
        <polygon points="${PV.x},${PV.y} ${PV.x - 30},${PV.y + 70} ${PV.x + 30},${PV.y + 70}" fill="var(--borde)"/>
        <rect x="${PV.x - 60}" y="${PV.y + 70}" width="120" height="8" rx="4" fill="var(--borde)"/>
        <line id="brazo" stroke="var(--tx)" stroke-width="7" stroke-linecap="round"/>
        <circle cx="${PV.x}" cy="${PV.y}" r="9" fill="var(--am)" stroke="var(--tx)" stroke-width="2"/>
        <g id="panI"></g><g id="panD"></g>
      </g>
      <g id="rinon" transform="translate(110,392)">
        <path d="M0,-34 C28,-34 40,-12 34,12 C28,36 8,40 -4,30 C-14,24 -4,14 -6,6 C-8,-2 -18,-4 -22,-12 C-26,-24 -14,-34 0,-34 Z" id="rinp" fill="#f59e0b" fill-opacity=".35" stroke="#b45309" stroke-width="3"/>
        <text x="0" y="62" font-size="13" text-anchor="middle" font-weight="700" fill="currentColor">RIÑÓN</text>
        <text id="rinr" x="0" y="78" class="rol" text-anchor="middle"></text>
      </g>
      <g id="pulmon" transform="translate(490,392)"><g id="pulg">
        <line x1="0" y1="-44" x2="0" y2="-22" stroke="#64748b" stroke-width="4"/>
        <path d="M-6,-30 C-34,-28 -50,10 -46,38 C-44,52 -24,52 -14,40 C-8,30 -6,0 -6,-30 Z" fill="#60a5fa" fill-opacity=".45" stroke="#1d4ed8" stroke-width="3" id="pulp1"/>
        <path d="M6,-30 C34,-28 50,10 46,38 C44,52 24,52 14,40 C8,30 6,0 6,-30 Z" fill="#60a5fa" fill-opacity=".45" stroke="#1d4ed8" stroke-width="3" id="pulp2"/></g>
        <text x="0" y="62" font-size="13" text-anchor="middle" font-weight="700" fill="currentColor">PULMÓN</text>
        <text id="pulr" x="0" y="78" class="rol" text-anchor="middle"></text>
      </g>
      <text x="300" y="494" font-size="11" text-anchor="middle" fill="var(--tx2)">pH = 6,1 + log [ HCO₃⁻ / (0,03 × PaCO₂) ]  (Henderson-Hasselbalch)</text>
    </svg></div>`;
    const S = $("svg", cont), g = id => $("#" + id, S);
    const mk = (tag, at) => { const e = document.createElementNS(SV, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
    let respiro = { f: .4, a: .04 }, t0 = performance.now();
    const gen = U.gen;
    (function bucle(t) {
      if (gen !== U.gen || !S.isConnected) return;
      const s = 1 + respiro.a * Math.sin((t - t0) / 1000 * 2 * Math.PI * respiro.f);
      g("pulg").setAttribute("transform", `scale(${s.toFixed(4)},${(1 + (s - 1) * 1.4).toFixed(4)})`);
      requestAnimationFrame(bucle);
    })(t0);

    function pan(grp, cx, cy, etiqueta, valor, alto, color) {
      grp.innerHTML = "";
      grp.appendChild(mk("line", { x1: cx - 55, y1: cy, x2: cx, y2: cy - 42, stroke: "var(--tx2)", "stroke-width": 2 }));
      grp.appendChild(mk("line", { x1: cx + 55, y1: cy, x2: cx, y2: cy - 42, stroke: "var(--tx2)", "stroke-width": 2 }));
      grp.appendChild(mk("rect", { x: cx - 58, y: cy, width: 116, height: 8, rx: 4, fill: "var(--tx)" }));
      grp.appendChild(mk("rect", { x: cx - 36, y: cy - alto, width: 72, height: alto, rx: 6, fill: color, "fill-opacity": .85, stroke: color }));
      const t = mk("text", { x: cx, y: cy - alto / 2 + 5, "font-size": 15, "font-weight": 700, "text-anchor": "middle", fill: "#fff" }); t.textContent = valor; grp.appendChild(t);
      const e = mk("text", { x: cx, y: cy + 24, "font-size": 12, "font-weight": 700, "text-anchor": "middle", fill: "currentColor" }); e.textContent = etiqueta; grp.appendChild(e);
    }
    const rolTxt = { causa: ["CAUSA", "#dc2626"], compensa: ["COMPENSA", "#16a34a"], aun: ["COMPENSARÁ (días)", "#d97706"], normal: ["normal", "#64748b"], agrega: ["TAMBIÉN ALTERADO", "#7c3aed"] };
    // v = {pH,pco2,hco3}; L = A.leer(...)
    function pintar(v, L) {
      const ag = g("aguja"); ag.setAttribute("transform", `translate(${px(v.pH)},0)`);
      g("agv").textContent = "pH " + f(v.pH, 2);
      // balanza: brazo inclinado según el pH (relación HCO3 / CO2)
      const th = A.clamp((7.4 - v.pH) * 50, -24, 24), r = th * Math.PI / 180, L2 = PV.L;
      const xi = PV.x - L2 * Math.cos(r), yi = PV.y - L2 * Math.sin(r), xd = PV.x + L2 * Math.cos(r), yd = PV.y + L2 * Math.sin(r);
      const b = g("brazo"); b.setAttribute("x1", xi); b.setAttribute("y1", yi); b.setAttribute("x2", xd); b.setAttribute("y2", yd);
      // el bloque de cada plato es proporcional a su peso en la fórmula: base = HCO3; ácido = 0,6 × PaCO2 (0,03 × 20)
      const bi = A.clamp(v.hco3 / 24 * 34, 8, 78), bd = A.clamp(0.6 * v.pco2 / 24 * 34, 8, 78);
      pan(g("panI"), xi, yi + 62, "BASE · HCO₃⁻", f(v.hco3, 1), bi, "#2563eb");
      pan(g("panD"), xd, yd + 62, "ÁCIDO · CO₂", f(v.pco2), bd, "#dc2626");
      // roles
      let rp = "normal", rr = "normal";
      if (L.prim !== "NORMAL") {
        const M = L.prim === "AM" || L.prim === "AlM";
        rr = M ? "causa" : (L.comp && L.comp.crono === "aguda" ? "aun" : "compensa");
        rp = M ? "compensa" : "causa";
        if (L.agregados.length) {
          const a = L.agregados[0];
          if (a === "AR" || a === "AlR") rp = "agrega"; else rr = "agrega";
        }
      }
      const rt = (id, k) => { const el = g(id); el.textContent = rolTxt[k][0]; el.setAttribute("fill", rolTxt[k][1]); };
      rt("rinr", rr); rt("pulr", rp);
      g("rinp").setAttribute("stroke", rolTxt[rr][1]); g("rinp").setAttribute("fill", rolTxt[rr][1]); g("rinp").setAttribute("stroke-width", rr === "normal" ? 3 : 5);
      [g("pulp1"), g("pulp2")].forEach(p => { p.setAttribute("stroke", rolTxt[rp][1]); p.setAttribute("fill", rolTxt[rp][1]); p.setAttribute("stroke-width", rp === "normal" ? 3 : 5); });
      // respiración: más rápida y profunda si la PaCO2 baja; lenta y corta si sube
      const V = 40 / A.clamp(v.pco2, 10, 120);
      respiro.f = A.clamp(0.4 * V, 0.15, 1.1); respiro.a = V >= 1 ? 0.04 + 0.05 * A.clamp(V - 1, 0, 2) : 0.03;
    }
    return { pintar };
  };

  /* texto causal «en vivo» a partir de la lectura */
  U.vivo = function (L, v) {
    const M = L.prim === "AM" || L.prim === "AlM";
    const etq = L.estado === "acidemia" ? "ro" : L.estado === "alcalemia" ? "mo" : "ve";
    let causa;
    if (L.prim === "NORMAL") causa = "Los tres valores están en rango: el pulmón saca el CO₂ que el metabolismo produce y el riñón mantiene el bicarbonato.";
    else if (L.prim === "AM") causa = `El <b>HCO₃⁻ cayó a ${f(v.hco3, 1)}</b> (ácidos fijos de más o bicarbonato perdido) → baja la relación HCO₃⁻/CO₂ → el pH baja. <b>Pulmón compensa:</b> hiperventila (Kussmaul) y la PaCO₂ queda en ${f(v.pco2)} (esperada ${f(L.comp.lo)}-${f(L.comp.hi)} ${LIT}).`;
    else if (L.prim === "AlM") causa = `El <b>HCO₃⁻ subió a ${f(v.hco3, 1)}</b> (pierde H⁺ por vómitos o diuréticos, o recibe bases) → sube la relación HCO₃⁻/CO₂ → el pH sube. <b>Pulmón compensa:</b> hipoventila y retiene CO₂: PaCO₂ ${f(v.pco2)} (esperada ${f(L.comp.lo)}-${f(L.comp.hi)} ${LIT}).`;
    else if (L.prim === "AR") causa = `La <b>PaCO₂ subió a ${f(v.pco2)}</b> (el pulmón hipoventila y el CO₂ se acumula) → baja la relación HCO₃⁻/CO₂ → el pH baja. <b>Riñón compensa</b> generando HCO₃⁻: ` + (L.comp.crono === "aguda" ? `todavía no lo hizo (HCO₃⁻ ${f(v.hco3, 1)}, normal): cuadro agudo.` : L.comp.crono === "crónica" ? `ya lo hizo (HCO₃⁻ ${f(v.hco3, 1)} aumentado): cuadro crónico.` : `en parte (HCO₃⁻ ${f(v.hco3, 1)}).`);
    else causa = `La <b>PaCO₂ cayó a ${f(v.pco2)}</b> (el pulmón hiperventila y lava el CO₂) → sube la relación HCO₃⁻/CO₂ → el pH sube. <b>Riñón compensa</b> botando HCO₃⁻ (leve): ${f(v.hco3, 1)}.`;
    let extra = "";
    if (L.agregados.length) extra = ` <b>Pero la compensación no es la esperada:</b> se agrega ${L.agregados.map(k => A.NOMBRES[k]).join(" y ")}.`;
    const clin = L.prim !== "NORMAL" ? `<br><span class="nota">Clínica (clase): ${A.DES[L.prim].clinica.slice(0, 3).join("; ")}. K⁺: ${L.estado === "acidemia" ? "acidosis → H⁺ entra y K⁺ sale → tendencia a hiperpotasemia" : L.estado === "alcalemia" ? "alcalosis → K⁺ entra → tendencia a hipopotasemia" : "sin desplazamiento neto"} (Clase 7).</span>` : "";
    return `<span class="k" style="background:var(--${etq === "mo" ? "mo" : etq === "ro" ? "ro" : "ve"})">${f(v.pH, 2)}</span><div><b>${L.diag}.</b> ${causa}${extra}${clin}</div>`;
  };

  /* =====================================================================
     PESTAÑA 1 · SIMULADOR
     ===================================================================== */
  SECC.sim = function (main) {
    main.innerHTML = `<h1>⚗️ Simulador de gasometría</h1>
      <p class="lema">Mueve la <b>PaCO₂</b> (pulmón) o el <b>HCO₃⁻</b> (riñón) y el <b>pH se recalcula</b> con Henderson-Hasselbalch ${LIT}. También puedes mover el pH: entonces se ajusta el otro valor. El letrero dice quién causa el trastorno y quién compensa.</p>
      <div class="grid2"><div id="pan"></div>
      <div><div class="caja"><h3>Controles</h3>
        <div class="ctrl col" id="ctl">
          ${U.slider("s-ph", "pH", 6.8, 7.8, 0.01, 7.4)}${U.slider("s-co", "PaCO₂ (mmHg)", 10, 100, 1, 40)}${U.slider("s-hc", "HCO₃⁻ (mEq/L)", 3, 50, 0.5, 24)}
        </div>
        <div class="ctrl"><label>Al mover el pH, se ajusta el
          <select id="s-fija"><option value="hco3">HCO₃⁻ (metabólico)</option><option value="pco2">PaCO₂ (respiratorio)</option></select></label>
          <button class="btn sec" id="s-norm">↺ Normal</button></div>
        <h3>Casos para cargar</h3><div class="chips" id="pre"></div>
        <p class="nota">Normales de la clase: pH 7,35-7,45 · PaCO₂ 40 (35-45) · HCO₃⁻ 22-26 (media 24) · BE ±2,5.</p>
        <div class="dif" id="dis"></div>
      </div></div></div>
      <div class="letrero" id="liv" style="margin-top:10px"></div>`;
    const P = U.panel($("#pan", main));
    const st = { pco2: 40, hco3: 24 };
    const presets = [
      { id: "norm", t: "Normal", pco2: 40, hco3: 24 },
      { id: "cad", t: "Cetoacidosis", pco2: 26, hco3: 12 },
      { id: "diar", t: "Diarrea grave", pco2: 29, hco3: 14 },
      { id: "sin", t: "Acidosis metabólica sin compensar", pco2: 40, hco3: 12 },
      { id: "epoc", t: "EPOC crónico", pco2: 65, hco3: 33 },
      { id: "ar", t: "Acidosis resp. aguda", pco2: 70, hco3: 25 },
      { id: "vom", t: "Vómitos incoercibles", pco2: 48, hco3: 36 },
      { id: "ans", t: "Crisis de ansiedad", pco2: 24, hco3: 21 }
    ];
    U.chips($("#pre", main), presets, "", id => { const p = presets.find(x => x.id === id); st.pco2 = p.pco2; st.hco3 = p.hco3; act(); });
    const sph = $("#s-ph", main), sco = $("#s-co", main), shc = $("#s-hc", main);
    function act() {
      st.pco2 = A.clamp(st.pco2, 10, 100); st.hco3 = A.clamp(st.hco3, 3, 50);
      const v = { pco2: st.pco2, hco3: st.hco3, pH: A.ph(st.hco3, st.pco2) };
      sph.value = v.pH; sco.value = v.pco2; shc.value = v.hco3;
      $("#s-phv", main).textContent = f(v.pH, 2); $("#s-cov", main).textContent = f(v.pco2); $("#s-hcv", main).textContent = f(v.hco3, 1);
      const L = A.leer(v);
      P.pintar(v, L);
      $("#liv", main).innerHTML = U.vivo(L, v);
      // discrepancias y avisos de la clase
      const av = [];
      if ((v.pco2 >= 35 && v.pco2 < 36) || (v.pco2 > 44 && v.pco2 <= 45)) av.push(`<b>Discrepancia:</b> la Clase 8 da PaCO₂ 40 (36-44); la Clase 9 corta en &lt; 35 y &gt; 45. Aquí se clasifica con la Clase 9.`);
      if (v.pH < 7.35 && v.pH >= 7.32 && L.prim === "AR") av.push(`<b>Discrepancia:</b> la Clase 9 define la acidosis respiratoria con pH &lt; 7,32; la Clase 8 llama acidosis a todo pH &lt; 7,35.`);
      if (v.pH < 7.20 && v.hco3 < 10 && L.prim === "AM") av.push(`Clase 8: pH &lt; 7,20 y HCO₃⁻ &lt; 10 → <b>indicado el bicarbonato IV</b>; déficit = 0,5 × kg × (24 − ${f(v.hco3, 0)}).`);
      if (v.pH < 7.10 && L.prim === "AR") av.push(`Clase 9: en acidosis respiratoria el bicarbonato solo se considera con pH &lt; 7,10 y refractaria a la ventilación.`);
      if (v.pco2 < 20) av.push(`Clase 9: PaCO₂ &lt; 20 mmHg puede reducir el flujo cerebral hasta un tercio.`);
      $("#dis", main).style.display = av.length ? "" : "none"; $("#dis", main).innerHTML = av.join("<br>");
    }
    sph.oninput = () => { const pH = +sph.value; if ($("#s-fija", main).value === "hco3") st.hco3 = A.hco3De(pH, st.pco2); else st.pco2 = A.pco2De(pH, st.hco3); act(); };
    sco.oninput = () => { st.pco2 = +sco.value; act(); };
    shc.oninput = () => { st.hco3 = +shc.value; act(); };
    $("#s-norm", main).onclick = () => { st.pco2 = 40; st.hco3 = 24; act(); };
    U.repintar = act; act();
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "sim").split("/");
    const fn = SECC[id] || SECC.sim;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "sim")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    vista.innerHTML = ""; fn(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Contenido: Clases 4, 7, 8 y 9 de Fisiopatología (el docente manda) y láminas 7, 8 y 41 del atlas. Lo marcado <span class="lit">literatura</span> (Henderson-Hasselbalch, fórmulas de compensación, cifra del anión gap, delta) no lo da la clase y viene de la fisiología general. Simulación didáctica, no para decidir tratamientos.</p>`);
  }
  addEventListener("hashchange", ruta);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => U.alRedimensionar && U.alRedimensionar(), 200); });
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
