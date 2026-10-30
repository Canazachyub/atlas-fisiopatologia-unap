/* Pestañas 4 y 5 · Explicación y 🎯 Ponte a prueba. */
(function () {
  "use strict";
  const U = window.UTIL, P = window.PAR, SECC = window.SECC;

  SECC.explicacion = function (cont) {
    // tabla comparativa calculada por el propio modelo (lado derecho para las unilaterales)
    const filas = P.ORDEN.filter(id => id !== "normal").map(id => {
      const L = P.LESIONES[id], p = P.pupila(id, "D", { D: 0, I: 0 }, 0), rD = P.reflejos(id, "D", "D"), rI = P.reflejos(id, "D", "I"), ac = P.acomodacion(id, "D");
      const ojo = L.lat ? "D" : "D";
      const pup = L.lat ? `${U.fmt(p.D.d)} mm (la otra ${U.fmt(p.I.d)} mm)` : `${U.fmt(p.D.d)} mm en los dos`;
      return `<tr><td><b>${L.nombre}</b>${L.lit ? ' <span class="lit">literatura</span>' : ""}</td><td>${pup}</td><td>${U.sem(rD.directo)}</td><td>${U.sem(ac[ojo])}</td><td>${["", "leve", "marcada"][L.ptosis] || "no"}${L.enoftalmos ? ", enoftalmos" : ""}</td></tr>`;
    }).join("");
    cont.innerHTML = `
      <h1>📖 Explicación</h1>
      <p class="lema">Qué es, cómo funciona, por qué pasa y para qué sirve. Todo sale de tus clases 11j, 11d, 11e, 11h y 06a.</p>
      <div class="grid3">
        <div class="tarj"><b class="t">¿Qué es el reflejo pupilar?</b>La pupila se estrecha cuando entra luz y cuando miras de cerca. El simpático dilata la pupila y el parasimpático la contrae: el equilibrio de los dos explica los reflejos.</div>
        <div class="tarj ve"><b class="t">¿Cómo se explora?</b>Con una linterna en cuarto semioscuro: <b>fotomotor</b> (se ilumina una pupila y se contrae), <b>consensual</b> (se contrae la otra, algo menos), <b>acomodación</b> (se pide mirar lejos y luego el dedo a 30 cm: se dilata y se contrae) y <b>cilioespinal</b> (dolor en la piel del cuello dilata la pupila; centro C8-T2).</div>
        <div class="tarj na"><b class="t">¿Por qué pasa?</b>La luz viaja por el II (aferente) y vuelve por el III (eferente parasimpático). Si falla la entrada, el ojo «no ve» la luz; si falla la salida, la pupila no responde aunque la señal llegue. Por eso la pupila ayuda a ubicar la lesión.</div>
        <div class="tarj mo"><b class="t">¿Para qué sirve?</b>Para diferenciar un III de un Horner, un ojo ciego de un ojo con la pupila paralizada y, en el coma, para saber qué nivel del tallo está dañado.</div>
      </div>

      <h2>La vía que el simulador ilumina</h2>
      <div class="caja"><ol class="pasos" style="counter-reset:p">
        <li><span><b>Retina → II par.</b> Recoge la luz. Una lesión aquí es un defecto <b>aferente</b>: siempre es <i>relativo</i>, con los dos ojos por lo demás normales (11j). Lo producen lesiones del nervio óptico o de la retina, afectación macular, ambliopía u opacidad de los medios.</span></li>
        <li><span><b>Quiasma → pretectal → Edinger-Westphal.</b> La señal se reparte a los dos lados: por eso la pupila que no recibe luz también se contrae (consensual).<span class="lit">literatura</span> La clase nombra el reflejo, no los núcleos.</span></li>
        <li><span><b>III par → esfínter del iris.</b> La parte parasimpática del III contrae la pupila. Si el III se lesiona por completo, la pupila queda en midriasis y no reacciona.</span></li>
        <li><span><b>Vía simpática (aparte).</b> Hipotálamo posterior → tallo → C8-T2 → ganglios cervicales → plexo pericarotídeo → rama nasociliar del oftálmico → iris y párpado. Si se corta, aparece el Horner.</span></li>
      </ol></div>

      <h2>Los casos que vas a reconocer</h2>
      <div class="caja" style="overflow-x:auto"><table><tr><th>Cuadro</th><th>Pupila en reposo</th><th>Fotomotor directo</th><th>Acomodación</th><th>Ptosis</th></tr>${filas}</table>
        <p class="nota">Tabla calculada por el simulador con la lesión en el ojo derecho. Diámetros didácticos dentro de los límites de la clase.</p></div>

      <div class="grid2">
        <div class="caja"><h3>III, IV y VI: los pares que mueven el ojo</h3>
          <table><tr><th>Par</th><th>Qué inerva</th><th>Si falla</th></tr>
            <tr><td>III</td><td>Elevador del párpado, recto superior, inferior, medial y oblicuo inferior; pupila</td><td>Ptosis, ojo abajo y afuera, diplopía; pupila afectada si es completo</td></tr>
            <tr><td>IV</td><td>Oblicuo superior (abajo y adentro)</td><td>Diplopía vertical, cabeza inclinada hacia el lado sano</td></tr>
            <tr><td>VI</td><td>Recto lateral (afuera)</td><td>Diplopía horizontal, esotropía</td></tr></table>
          <p>Completo o incompleto el III <b>se distingue por la pupila</b>, no por la ptosis. Y el VI, por ser el más largo, es un <b>falso localizador</b>.</p>
          <p class="nota">Diplopía: la prueba de la lente roja (lente roja en el ojo derecho) muestra una luz blanca (ojo izquierdo) y una roja (ojo derecho) separadas, y el punto de mirada donde se separan indica el músculo afectado.</p></div>
        <div class="caja"><h3>La pupila en el coma (11e)</h3>
          <table><tr><th>Hallazgo</th><th>Significado</th></tr>
            <tr><td>Anisocoria con Horner</td><td>Disfunción hipotalámica o bulbar lateral</td></tr>
            <tr><td>Miosis con fotomotor conservado</td><td>Coma metabólico; herniación central</td></tr>
            <tr><td>Puntiformes, apenas reactivas</td><td>Lesión pontina u opioides</td></tr>
            <tr><td>Midriasis arreactiva e irregular</td><td>Mesencéfalo dorsal</td></tr>
            <tr><td>Fijas en posición media</td><td>Núcleo del tercer par</td></tr></table></div>
      </div>

      <h2>Datos que conviene fijar</h2>
      <div class="grid3">
        <div class="tarj"><b class="t">Tamaño pupilar</b>Normal 2 a 6 mm según la clase 11j. Menos de 2 mm es miosis; más de 6 mm, midriasis. El 5% de las personas tiene anisocoria fisiológica leve.</div>
        <div class="tarj na"><b class="t">Discrepancia entre clases</b>La clase 11j da 2-6 mm (otros autores 2-4, promedio 3). La clase 06a da 2-4 mm y midriasis sobre 4-7 mm. Gana la clase del tema: 2-6 mm, pero ambas dicen miosis bajo 2 mm.</div>
        <div class="tarj ro"><b class="t">Horner</b>Miosis, ptosis y enoftalmos del mismo lado, por lesión del simpático cervical. Causa clásica: tumor del vértice pulmonar. Truco: <b>M</b>iosis, <b>P</b>tosis, <b>E</b>noftalmos.</div>
        <div class="tarj mo"><b class="t">Argyll Robertson <span class="lit">literatura</span></b>Luz no, cerca sí; pupilas pequeñas e irregulares; neurosífilis. Tu clase no lo describe. El banco de preguntas incluye la ptosis en su tríada, pero la ptosis es del Horner.</div>
        <div class="tarj ve"><b class="t">Marcus Gunn <span class="lit">literatura</span></b>Defecto aferente relativo: al pasar la luz del ojo sano al enfermo, las pupilas se dilatan. La clase dice que el defecto aferente es siempre «relativo».</div>
        <div class="tarj"><b class="t">Colirios en el Horner (11h)</b>Hidroxianfetamina: si no hay midriasis, la lesión es de la 3ª neurona; si la hay, la lesión es de la 1ª o 2ª (más central).</div>
      </div>`;
  };

  /* ---------- 🎯 Ponte a prueba ---------- */
  SECC.prueba = function (cont) {
    const S = { cola: [], i: 0, aciertos: 0, errores: [], resp: null };
    const nuevaTanda = tipos => {
      let cs = P.casos(U.azar, tipos ? 80 : 10);
      if (tipos) { const vistos = new Set(); cs = cs.filter(c => tipos.includes(c.resp) && !vistos.has(c.resp + c.lado) && vistos.add(c.resp + c.lado)).slice(0, 10); }
      Object.assign(S, { cola: cs, i: 0, aciertos: 0, errores: [], resp: null });
    };
    nuevaTanda();
    const dibuja = () => {
      if (S.i >= S.cola.length) {
        const errs = [...new Set(S.errores)];
        cont.innerHTML = `<h1>🎯 Ponte a prueba</h1><div class="caja"><h2>${S.aciertos} de ${S.cola.length}</h2>
          <p>${errs.length ? "Fallaste: " + errs.map(k => "<b>" + P.RESP[k] + "</b>").join(", ") + ". Repasa solo esos casos hasta llegar a cero errores." : "Sin errores. Repite otra tanda para fijarlo."}</p>
          <div class="ctrl">${errs.length ? '<button class="btn" id="errs">Repasar mis errores</button>' : ""}<button class="btn sec" id="otra">Nueva tanda</button></div></div>`;
        if (errs.length) U.$("#errs", cont).onclick = () => { nuevaTanda(errs); dibuja(); };
        U.$("#otra", cont).onclick = () => { nuevaTanda(); dibuja(); };
        return;
      }
      const c = S.cola[S.i];
      cont.innerHTML = `<h1>🎯 Ponte a prueba</h1>
        <p class="lema">Caso ${S.i + 1} de ${S.cola.length}. Aciertos: ${S.aciertos}. ¿Qué par o qué vía está lesionado?</p>
        <div class="caja"><p style="font-size:17px">${c.texto}</p>
          <div class="opciones" id="ops">${c.opciones.map(o => `<button data-k="${o.k}">${o.t}</button>`).join("")}</div>
          <div id="fb"></div></div>`;
      U.$$("#ops button", cont).forEach(b => b.onclick = () => responde(c, b));
    };
    function responde(c, b) {
      if (S.resp) return;
      S.resp = b.dataset.k; const bien = S.resp === c.resp;
      if (bien) S.aciertos++; else S.errores.push(c.resp);
      U.$$("#ops button", cont).forEach(x => { x.disabled = true; if (x.dataset.k === c.resp) x.classList.add("bien"); else if (x === b) x.classList.add("mal"); });
      U.$("#fb", cont).innerHTML = `<div class="letrero" style="margin-top:12px"><span class="k">${bien ? "Correcto" : "Incorrecto"}</span> ${bien ? "" : "Era: <b>" + P.RESP[c.resp] + "</b>. "}</div>
        <p>${c.explicacion}${c.lit ? ' <span class="lit">literatura</span>' : ""}</p>
        ${!bien && S.resp ? `<p class="nota">Elegiste «${P.RESP[S.resp]}»: ${P.EXPLICA[S.resp]}</p>` : ""}
        <div class="ctrl"><button class="btn" id="sig">${S.i + 1 < S.cola.length ? "Siguiente caso" : "Ver resultado"}</button></div>`;
      U.$("#sig", cont).onclick = () => { S.i++; S.resp = null; dibuja(); };
    }
    dibuja();
  };
})();
