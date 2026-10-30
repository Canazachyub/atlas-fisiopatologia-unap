/* Pestaña 3 · Los 12 pares: tarjeta por par con una cabeza SVG que resalta la zona; modo repaso. */
(function () {
  "use strict";
  const U = window.UTIL, P = window.PAR, SECC = window.SECC;

  // texto extra de la clase por par (11d y 11j)
  const EXTRA = {
    2: "En la pupila, un defecto del II es un defecto aferente. Neuritis óptica: inflamación del nervio por detrás del ojo hasta el quiasma. Neuropatía óptica isquémica: mayores de 40-50 años con diabetes, hipertensión, dislipidemia, obesidad o tabaquismo.",
    3: "Completo: pupila afectada (midriasis arreactiva), más grave por la posibilidad de compresión (aneurisma). Incompleto: pupila respetada. Mira su efecto en <a href='#linterna'>la linterna</a> y en <a href='#motilidad'>la motilidad</a>.",
    4: "Es el único nervio craneal que sale por la cara dorsal del mesencéfalo (de ahí «troclear»). La inclinación compensadora de la cabeza es hacia el lado sano, con el mentón deprimido. <a href='#motilidad'>Probar en la motilidad.</a>",
    5: "Ramas: oftálmica (córnea, conjuntiva, senos), maxilar (senos maxilares, dientes, paladar) y mandibular (mejilla, mandíbula, lengua, músculos de la masticación).",
    6: "Es el par craneal más largo: por eso una parálisis aislada es un falso localizador. <a href='#motilidad'>Probar en la motilidad.</a>",
    7: "Parálisis periférica: se afecta toda la hemicara, incluida la frente (no la puede arrugar). Parálisis central: la frente se respeta porque tiene inervación cortical bilateral y solo se afecta el tercio inferior de la cara contralateral. Signo de Bell: al cerrar el ojo con fuerza, el globo sube.",
    8: "Rinne y Weber con diapasón de 512 a 1024 Hz. Weber: si el sonido va al oído sordo, la pérdida es de conducción; si va al sano, el otro oído tiene sordera neurosensorial. Romberg, Fukuda (giro mayor de 15°) e impulso cefálico para el equilibrio.",
    10: "Voz: el vago inerva la laringe por su rama laríngea (la clase del docente habla de la rama laríngea; que sea el nervio recurrente es literatura).",
    12: "La lengua se desvía hacia el lado paralizado."
  };
  const TIPO = { sensitivo: ["Sensitivo puro", "azc"], motor: ["Motor puro", "ve"], mixto: ["Mixto", "mo"] };

  SECC.pares = function (cont) {
    const E = { sel: 1, rep: false, meta: null, rev: false, msg: "" };
    cont.innerHTML = `
      <h1>🧠 Los 12 pares craneales</h1>
      <p class="lema">Se examinan siempre en orden, del I al XII, de forma bilateral y comparativa. Toca un par (o una zona de la cabeza) para ver su función, cómo se explora y qué pasa si se lesiona.</p>
      <div class="grid2">
        <div class="caja">
          <svg class="dib" id="cab" viewBox="0 0 360 470" role="img" aria-label="Cabeza con las zonas de los pares craneales"></svg>
          <div class="ctrl"><button class="btn sec" id="rep">🎲 Modo repaso</button><span class="nota" id="repn"></span></div>
        </div>
        <div>
          <div class="chips"><span class="chip" style="cursor:default;border-color:var(--azc)">Sensitivos: I, II, VIII</span><span class="chip" style="cursor:default;border-color:var(--ve)">Motores: III, IV, VI, XI, XII</span><span class="chip" style="cursor:default;border-color:var(--mo)">Mixtos: V, VII, IX, X</span></div>
          <div class="parlista caja" id="lista"></div>
          <div class="caja info" id="det"></div>
        </div>
      </div>`;

    /* ---------- cabeza ---------- */
    const sv = U.$("#cab", cont), Z = {};
    const forma = (tag, a, fil) => U.el(tag, Object.assign({ class: "piel", fill: fil || "" }, a), sv);
    // cuello y hombros
    forma("path", { d: "M138 330 L222 330 L232 405 C300 415 345 435 350 470 L10 470 C15 435 60 415 128 405 Z" }, "#EBC59E");
    forma("ellipse", { cx: 84, cy: 200, rx: 14, ry: 26 }, "#F0C9A4"); forma("ellipse", { cx: 276, cy: 200, rx: 14, ry: 26 }, "#F0C9A4");
    forma("ellipse", { cx: 180, cy: 195, rx: 98, ry: 128 });
    U.el("path", { d: "M82 180 C80 90 130 52 180 52 C230 52 280 90 278 180 C262 120 230 92 180 92 C130 92 98 120 82 180 Z", fill: "#3b2f2a" }, sv);
    // cejas, ojos, nariz, boca
    for (const x of [140, 220]) {
      U.el("path", { class: "trazo", d: `M${x - 30} 142 Q${x} 130 ${x + 30} 142`, "stroke-width": 5 }, sv);
      U.el("ellipse", { class: "esclera", cx: x, cy: 168, rx: 27, ry: 14 }, sv);
      U.el("circle", { cx: x, cy: 168, r: 9, fill: "#7A5230" }, sv); U.el("circle", { cx: x, cy: 168, r: 4, fill: "#0b0b0b" }, sv);
    }
    U.el("path", { class: "trazo", d: "M180 178 L172 225 Q180 232 190 225" }, sv);
    U.el("ellipse", { cx: 180, cy: 282, rx: 42, ry: 21, fill: "#4a1d1d" }, sv);
    U.el("path", { d: "M138 282 C150 262 210 262 222 282", fill: "none", stroke: "#8a3b3b", "stroke-width": 5, "stroke-linecap": "round" }, sv); // paladar
    U.el("ellipse", { cx: 180, cy: 276, rx: 5, ry: 8, fill: "#E8A0A0" }, sv);                                                                            // úvula
    U.el("ellipse", { cx: 180, cy: 296, rx: 30, ry: 11, fill: "#D9707A" }, sv);                                                                          // lengua
    U.el("path", { d: "M133 282 C150 322 210 322 227 282", fill: "none", stroke: "#8a3b3b", "stroke-width": 5, "stroke-linecap": "round" }, sv);
    // zonas resaltables
    const zona = (id, tag, a) => { const e = U.el(tag, Object.assign({ class: "zona hit" }, a), sv); e.dataset.z = id; (Z[id] = Z[id] || []).push(e); return e; };
    zona("nariz", "ellipse", { cx: 180, cy: 208, rx: 20, ry: 30 });
    zona("ojos", "ellipse", { cx: 140, cy: 168, rx: 31, ry: 18 }); zona("ojos", "ellipse", { cx: 220, cy: 168, rx: 31, ry: 18 });
    zona("parpados", "ellipse", { cx: 140, cy: 152, rx: 31, ry: 8 }); zona("parpados", "ellipse", { cx: 220, cy: 152, rx: 31, ry: 8 });
    zona("orbitasup", "circle", { cx: 164, cy: 150, r: 8 }); zona("orbitasup", "circle", { cx: 196, cy: 150, r: 8 });
    zona("orbitalat", "ellipse", { cx: 106, cy: 168, rx: 10, ry: 16 }); zona("orbitalat", "ellipse", { cx: 254, cy: 168, rx: 10, ry: 16 });
    zona("frente", "ellipse", { cx: 180, cy: 110, rx: 72, ry: 22 });
    zona("mejilla", "ellipse", { cx: 120, cy: 240, rx: 34, ry: 26 }); zona("mejilla", "ellipse", { cx: 240, cy: 240, rx: 34, ry: 26 });
    zona("mandibula", "path", { d: "M100 275 C105 340 255 340 260 275 C240 335 120 335 100 275 Z" });
    zona("boca", "ellipse", { cx: 134, cy: 283, rx: 12, ry: 11 }); zona("boca", "ellipse", { cx: 226, cy: 283, rx: 12, ry: 11 });
    zona("garganta", "ellipse", { cx: 180, cy: 273, rx: 22, ry: 11 });
    zona("lengua", "ellipse", { cx: 180, cy: 297, rx: 30, ry: 12 });
    zona("oidos", "ellipse", { cx: 84, cy: 200, rx: 18, ry: 30 }); zona("oidos", "ellipse", { cx: 276, cy: 200, rx: 18, ry: 30 });
    zona("cuello", "path", { d: "M118 262 L142 268 L172 405 L146 410 Z" }); zona("cuello", "path", { d: "M242 262 L218 268 L188 405 L214 410 Z" });
    zona("cuello", "ellipse", { cx: 78, cy: 430, rx: 52, ry: 18 }); zona("cuello", "ellipse", { cx: 282, cy: 430, rx: 52, ry: 18 });
    // etiqueta de zona
    sv.addEventListener("click", ev => {
      const z = ev.target.dataset && ev.target.dataset.z; if (!z) return;
      const cand = P.PARES.filter(p => p.zonas.includes(z)), i = cand.findIndex(p => p.n === E.sel);
      elegir(cand[(i + 1) % cand.length].n);
    });

    /* ---------- lista y detalle ---------- */
    const lista = U.$("#lista", cont), det = U.$("#det", cont);
    function pintaLista() {
      lista.innerHTML = P.PARES.map(p => `<button class="tarjpar ${E.sel === p.n && !E.rep ? "act" : ""}" data-n="${p.n}" style="border-left:6px solid var(--${TIPO[p.tipo][1] === "azc" ? "azc" : TIPO[p.tipo][1]})"><b class="num">${E.rep ? "?" : p.rom}</b><br><span class="nota">${E.rep ? "¿cuál?" : p.nombre.split(" (")[0]}</span></button>`).join("");
      U.$$("[data-n]", lista).forEach(b => b.onclick = () => (E.rep ? responder(+b.dataset.n) : elegir(+b.dataset.n)));
    }
    function resalta(par) {
      for (const k in Z) Z[k].forEach(e => e.classList.toggle("on", par.zonas.includes(k)));
    }
    function pintaDetalle() {
      const p = P.PARES.find(x => x.n === (E.rep ? E.meta : E.sel)), t = TIPO[p.tipo];
      const oculto = E.rep && !E.rev;
      resalta(p);
      det.innerHTML = `<h3>${oculto ? '<span class="oculto">Par ' + p.rom + " · " + p.nombre + "</span>" : "Par " + p.rom + " · " + p.nombre}</h3>
        <p><span class="chip act" style="cursor:default">${oculto ? "Tipo oculto" : t[0]}</span></p>
        <p><b>Función:</b> ${p.funcion}</p>
        ${oculto ? "" : `<p><b>Cómo se explora:</b> ${p.explora}</p><p><b>Si se lesiona:</b> ${p.lesion}</p>${EXTRA[p.n] ? `<div class="tarj"><b class="t">Dato de la clase</b>${EXTRA[p.n]}</div>` : ""}`}
        ${E.rep ? `<p class="nota">Mira la zona resaltada y la función. Toca el par que crees que es.</p><div class="letrero" id="fb">${E.msg || "¿Qué par es?"}</div>
          <div class="ctrl"><button class="btn sec" id="rev">${E.rev ? "Ocultar nombre" : "Mostrar nombre"}</button><button class="btn" id="otro">Otro par al azar</button></div>` : ""}`;
      if (E.rep) {
        U.$("#rev", cont).onclick = () => { E.rev = !E.rev; pintaDetalle(); };
        U.$("#otro", cont).onclick = nuevo;
      }
    }
    function elegir(n) { E.sel = n; pintaLista(); pintaDetalle(); }
    function nuevo() {
      let n; do { n = 1 + Math.floor(U.azar() * 12); } while (n === E.meta);
      E.meta = n; E.rev = false; E.msg = ""; pintaLista(); pintaDetalle();
    }
    function responder(n) {
      const p = P.PARES.find(x => x.n === E.meta);
      if (n === E.meta) { E.rev = true; E.msg = `Correcto: es el par ${p.rom}, ${p.nombre}.`; }
      else E.msg = `No es el ${P.PARES.find(x => x.n === n).rom}. Fíjate en la zona resaltada y en la función; vuelve a intentar.`;
      pintaDetalle();
      const fb = U.$("#fb", cont); if (fb) fb.style.background = n === E.meta ? "color-mix(in srgb,var(--ve) 25%,var(--papel))" : "color-mix(in srgb,#EF4444 18%,var(--papel))";
    }
    U.$("#rep", cont).onclick = function () {
      E.rep = !E.rep; this.classList.toggle("az", E.rep); U.$("#repn", cont).textContent = E.rep ? "Se oculta el nombre: adivina el par." : "";
      if (E.rep) nuevo(); else { pintaLista(); pintaDetalle(); }
    };
    pintaLista(); pintaDetalle();
  };
})();
