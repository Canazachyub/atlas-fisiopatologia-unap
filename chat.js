/* Asistente de consulta rápida del atlas: busca en el contenido del propio atlas (índice BM25 en el navegador)
   y, si hay una clave de API guardada en este navegador, le pide a Claude o a DeepSeek que responda SOLO con esos
   fragmentos, citándolos [n] con enlace a la lámina. Sin clave, muestra lo que encontró. La clave nunca sale del
   navegador salvo hacia la API elegida. */
(function () {
  const A = window.ATLAS;
  if (!A) return;
  const $ = (s, r = document) => r.querySelector(s);
  const CLAVE = "atlas-ia";
  const PROV = {
    haiku: { nombre: "Claude Haiku 5.5 · rápido y barato", modelo: "claude-haiku-5-5", tipo: "claude" },
    sonnet: { nombre: "Claude Sonnet 5.5 · más profundo", modelo: "claude-sonnet-5-5", tipo: "claude" },
    deepseek: { nombre: "DeepSeek", modelo: "deepseek-chat", tipo: "deepseek" },
  };
  let cfg = {};
  try { cfg = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) {}
  cfg.prov = cfg.prov || "haiku";
  const guardarCfg = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cfg)); } catch (e) {} };

  /* ---------- índice ---------- */
  const dec = document.createElement("textarea");
  const plano = h => { if (!h) return ""; dec.innerHTML = String(h).replace(/<[^>]+>/g, " "); return dec.value.replace(/\s+/g, " ").trim(); };
  const VACIAS = new Set("el la los las un una unos unas de del al a y o u e en por para con sin se su sus que es son lo le les como mas pero si no ya muy cuando donde cual cuales esta este estos estas ese esa eso entre sobre tambien hay ser fue era sea porque desde hasta cada otro otra otros otras mismo misma puede pueden tiene tienen".split(" "));
  const raiz = w => w.length > 5 && w.endsWith("es") ? w.slice(0, -2) : w.length > 4 && w.endsWith("s") ? w.slice(0, -1) : w;
  const tokens = t => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/)
    .filter(w => w && (w.length > 1 || /\d/.test(w)) && !VACIAS.has(w)).map(raiz);
  let IDX = null;
  function construir() {
    const docs = [];
    const add = (lam, donde, ref, titulo, texto) => { texto = plano(texto); if (texto.length > 25) docs.push({ lam, donde, ref, titulo: plano(titulo), texto }); };
    for (const l of A.laminas) {
      const n = l.n, base = `#/l/${n}`, tl = plano(l.titulo);
      add(n, "Idea de la lámina", base + "/imagen", tl, [l.lema, ...(l.lado.parrafos || []), l.lado.recordar].join(" "));
      (l.diapos || []).forEach((d, k) => add(n, `Imagen ${k + 1}`, base + "/imagen", d.titulo || tl, d.texto + " " + (d.etiquetas || []).map(x => [x.t, x.s].filter(Boolean).join(": ")).join(" · ")));
      (l.numeros || []).forEach(x => add(n, "Números clave", base + "/imagen", tl, x.html));
      const e = l.entender;
      if (e) {
        add(n, "Entiéndelo · antes de leer", base + "/entender", tl, [e.objetivo, e.trata, (e.divide || []).join(", ")].join(" "));
        (e.bloques || []).forEach((b, k) => add(n, `Entiéndelo · bloque ${k + 1}`, base + "/entender", b.t, [b.q, ...(b.txt || []), b.ej && "Ejemplo: " + b.ej, b.ojo && "Ojo: " + b.ojo].filter(Boolean).join(" ")));
        add(n, "Entiéndelo · en 30 segundos", base + "/entender", tl, (e.piezas || []).map(p => p[1]).join(" ") + " " + (e.feynman || ""));
        (e.guia || []).forEach(g => add(n, "Guía de preguntas", base + "/entender", tl, g.q + " → " + g.r));
      }
      if (l.cadena) add(n, "Cadena " + plano(l.cadena.titulo), base + "/cadena", tl, l.cadena.pasos.map(p => `${p.t}: ${p.m} ${p.pr_tit} ${p.pr}`).join(" · ") + " " + (l.cadena.extra || []).map(x => x.html).join(" "));
      (l.memoria || []).forEach(m => add(n, "Cómo recordarlo", base + "/memoria", m.tipo, [m.dato, m.tecnica, m.escena, m.pregunta && m.pregunta + " → " + m.resp].join(" ")));
      if (l.tabla) { const cab = l.tabla.cab.map(plano); l.tabla.filas.forEach(f => add(n, "Tabla comparativa", base + "/tabla", plano(f[0]), f.map((c, k) => (cab[k] ? cab[k] + ": " : "") + plano(c)).join(" · "))); }
      (l.preguntas || []).forEach(q => {
        const op = (q.opciones || []).map((o, k) => "abcde"[k] + ") " + plano(o).replace(/^[a-e][.)]\s*/i, "")).join(" ");
        add(n, `Pregunta ${q.n}`, `${base}/q${q.n}`, tl, [q.pregunta, op, q.letra && "Clave: " + q.letra, q.r && "Respuesta: " + q.r, q.clave, q.x, q.aviso && "Aviso: " + q.aviso].filter(Boolean).join(" "));
      });
    }
    for (const [k, v] of Object.entries(A.conceptos || {})) add(0, "Glosario", "", k, k + ": " + (typeof v === "string" ? v : [v.def || v.d, v.clave, v.ejemplo && "Ejemplo: " + v.ejemplo].filter(Boolean).join(" ")));
    for (const [k, v] of Object.entries(A.siglas || {})) add(0, "Siglas", "", k, k + " = " + (typeof v === "string" ? v : JSON.stringify(v)));
    const df = new Map(), lens = [];
    docs.forEach((d, i) => {
      const tf = new Map();
      for (const w of tokens(d.titulo)) tf.set(w, (tf.get(w) || 0) + 2);
      for (const w of tokens(d.texto)) tf.set(w, (tf.get(w) || 0) + 1);
      d.tf = tf; lens[i] = [...tf.values()].reduce((a, b) => a + b, 0);
      for (const w of tf.keys()) df.set(w, (df.get(w) || 0) + 1);
    });
    IDX = { docs, df, prom: lens.reduce((a, b) => a + b, 0) / Math.max(1, docs.length), lens };
  }
  function buscar(preg, k = 8) {
    if (!IDX) construir();
    const q = [...new Set(tokens(preg))], N = IDX.docs.length, aqui = (location.hash.match(/^#\/l\/(\d+)/) || [])[1];
    const pts = IDX.docs.map((d, i) => {
      let s = 0;
      for (const w of q) {
        const f = d.tf.get(w); if (!f) continue;
        const idf = Math.log(1 + (N - IDX.df.get(w) + .5) / (IDX.df.get(w) + .5));
        s += idf * f * 2.2 / (f + 1.2 * (.25 + .75 * IDX.lens[i] / IDX.prom));
      }
      if (s && aqui && d.lam === +aqui) s *= 1.25;          // la lámina abierta pesa un poco más
      if (s && /^Entiéndelo|^Cadena|^Tabla/.test(d.donde)) s *= 1.1;   // explicaciones antes que enunciados sueltos
      return [s, d];
    }).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]);
    const out = [], vistos = new Set();
    for (const [, d] of pts) { const key = d.lam + d.donde; if (vistos.has(key)) continue; vistos.add(key); out.push(d); if (out.length >= k) break; }
    return out;
  }

  /* ---------- IA ---------- */
  const SISTEMA = `Eres el tutor del «${plano(A.titulo)}» (Medicina, UNA Puno). Respondes SOLO con la información de los fragmentos numerados que acompañan cada pregunta, que vienen del atlas del estudiante.
Reglas:
1. Cita cada dato con el número de su fragmento entre corchetes, por ejemplo [2].
2. La teoría del docente manda. Si un fragmento marca una discrepancia (⚠️, «Ojo», 📚 literatura), menciónala.
3. Si los fragmentos no alcanzan para responder, dilo claramente («El atlas no lo cubre») y sugiere la lámina más cercana; nunca inventes cifras ni datos.
4. Primero la respuesta directa en 1-2 frases; luego el porqué (el mecanismo) con palabras sencillas, como un buen profesor; si ayuda, una lista corta.
5. Unas 200 palabras como máximo, salvo que pidan más. En español, sin saludos.`;
  async function* sse(resp) {
    const rd = resp.body.getReader(), td = new TextDecoder(); let buf = "";
    for (;;) {
      const { value, done } = await rd.read(); if (done) break;
      buf += td.decode(value, { stream: true });
      let i; while ((i = buf.indexOf("\n")) >= 0) { const linea = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (linea.startsWith("data:")) yield linea.slice(5).trim(); }
    }
  }
  async function preguntarIA(msgs, alTexto) {
    const p = PROV[cfg.prov];
    if (p.tipo === "claude") {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": cfg.kc, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: p.modelo, max_tokens: 2000, stream: true, system: SISTEMA, output_config: { effort: "low" }, messages: msgs }),
      });
      if (!r.ok) throw new Error(await errorDe(r));
      for await (const d of sse(r)) {
        let ev; try { ev = JSON.parse(d); } catch (e) { continue; }
        if (ev.type === "content_block_delta" && ev.delta && ev.delta.type === "text_delta") alTexto(ev.delta.text);
        else if (ev.type === "error") throw new Error(ev.error && ev.error.message || "error de la API");
      }
    } else {
      const r = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: "Bearer " + cfg.kd },
        body: JSON.stringify({ model: p.modelo, stream: true, max_tokens: 2000, messages: [{ role: "system", content: SISTEMA }, ...msgs] }),
      });
      if (!r.ok) throw new Error(await errorDe(r));
      for await (const d of sse(r)) {
        if (d === "[DONE]") break;
        let ev; try { ev = JSON.parse(d); } catch (e) { continue; }
        const t = ev.choices && ev.choices[0] && ev.choices[0].delta && ev.choices[0].delta.content; if (t) alTexto(t);
      }
    }
  }
  async function errorDe(r) {
    let m = ""; try { const j = await r.json(); m = (j.error && (j.error.message || j.error)) || JSON.stringify(j); } catch (e) {}
    if (r.status === 401) return "La clave no es válida (401). Revísala en ⚙️.";
    if (r.status === 402) return "Saldo insuficiente en la cuenta de la API (402).";
    if (r.status === 429) return "Demasiadas consultas seguidas (429). Espera unos segundos.";
    return `Error ${r.status}: ${m}`;
  }

  /* ---------- interfaz ---------- */
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  function md(t, fuentes) {   // markdown mínimo + [n] → enlace a la fuente
    let h = esc(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>");
    h = h.replace(/\[(\d+(?:\s*[,\-–]\s*\d+)*)\]/g, (m, g) => g.split(/\s*[,\-–]\s*/).map(x => { const f = fuentes[+x - 1];
      return f ? `<a class="ia-cita" href="${f.ref || "#"}" title="${esc(f.etq)}">${x}</a>` : `[${x}]`; }).join(""));
    const lineas = h.split("\n"); let out = "", enLista = false;
    for (const ln of lineas) {
      const li = ln.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)/);
      if (li) { if (!enLista) { out += "<ul>"; enLista = true; } out += `<li>${li[1]}</li>`; continue; }
      if (enLista) { out += "</ul>"; enLista = false; }
      out += ln.trim() ? `<p>${ln}</p>` : "";
    }
    return out + (enLista ? "</ul>" : "");
  }
  const etq = d => (d.lam ? `Lámina ${d.lam} · ` : "") + d.donde + (d.titulo && !d.donde.startsWith("Pregunta") ? ` — ${d.titulo}` : "");

  const css = document.createElement("style");
  css.textContent = `
.ia-btn{position:fixed;right:16px;bottom:16px;z-index:250;border:0;border-radius:999px;padding:12px 18px;background:var(--azc,#2f6db0);color:#fff;font-weight:800;font-size:15px;box-shadow:0 6px 18px rgba(0,0,0,.25);cursor:pointer}
.ia-pan{position:fixed;right:16px;bottom:16px;z-index:260;width:min(460px,calc(100vw - 32px));height:min(680px,calc(100vh - 32px));background:var(--papel,#fff);color:var(--tx,#222);border-radius:18px;box-shadow:0 12px 40px rgba(0,0,0,.35);display:flex;flex-direction:column;overflow:hidden}
.ia-pan[hidden],.ia-btn[hidden]{display:none}
.ia-cab{display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--az,#1d4f63);color:#fff}
.ia-cab b{flex:1;font-size:15.5px}.ia-cab small{display:block;font-weight:500;opacity:.8;font-size:12px}
.ia-cab button{border:0;background:rgba(255,255,255,.15);color:#fff;border-radius:10px;width:36px;height:36px;font-size:17px;cursor:pointer}
.ia-log{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px;font-size:15px;line-height:1.55}
.ia-u{align-self:flex-end;background:var(--azc,#2f6db0);color:#fff;padding:8px 12px;border-radius:14px 14px 4px 14px;max-width:85%}
.ia-r{align-self:flex-start;background:color-mix(in srgb,var(--azc,#2f6db0) 8%,var(--papel,#fff));border:1px solid var(--borde,#ddd);padding:8px 12px;border-radius:14px 14px 14px 4px;max-width:95%}
.ia-r p{margin:4px 0}.ia-r ul{margin:4px 0;padding-left:20px}
.ia-cita{display:inline-block;min-width:18px;padding:0 5px;margin:0 1px;border-radius:7px;background:#e91e63;color:#fff!important;font-size:12px;font-weight:800;text-align:center;text-decoration:none;vertical-align:1px}
.ia-fu{margin-top:6px;font-size:12.5px;color:var(--tx2,#666)}.ia-fu a{color:inherit}.ia-fu div{margin:2px 0}
.ia-err{color:var(--mal,#c62828);font-weight:600}
.ia-pie{display:flex;gap:8px;padding:10px;border-top:1px solid var(--borde,#ddd)}
.ia-pie textarea{flex:1;resize:none;height:44px;max-height:120px;border:2px solid var(--borde,#ddd);border-radius:12px;padding:9px 10px;font:inherit;font-size:15px;background:var(--papel,#fff);color:inherit}
.ia-pie button{border:0;border-radius:12px;background:var(--azc,#2f6db0);color:#fff;font-weight:800;padding:0 16px;cursor:pointer}
.ia-cfg{padding:12px;border-bottom:1px solid var(--borde,#ddd);font-size:14px;display:grid;gap:8px;background:color-mix(in srgb,var(--am,#f2b705) 10%,var(--papel,#fff))}
.ia-cfg label{display:grid;gap:3px;font-weight:700}.ia-cfg input,.ia-cfg select{font:inherit;padding:7px 9px;border-radius:9px;border:2px solid var(--borde,#ddd);background:var(--papel,#fff);color:inherit}
.ia-cfg small{color:var(--tx2,#666);font-weight:500}.ia-cfg .fila{display:flex;gap:8px;flex-wrap:wrap}
.ia-cfg button{border:0;border-radius:9px;padding:7px 12px;font-weight:700;cursor:pointer;background:var(--azc,#2f6db0);color:#fff}.ia-cfg button.sec{background:var(--borde,#ddd);color:var(--tx,#222)}
.ia-sug{display:flex;flex-wrap:wrap;gap:6px}.ia-sug button{border:1px solid var(--borde,#ccc);background:var(--papel,#fff);color:inherit;border-radius:999px;padding:5px 10px;font-size:13.5px;cursor:pointer}
.ia-escribe::after{content:"▍";animation:iaParp 1s steps(2) infinite}@keyframes iaParp{50%{opacity:0}}
@media (max-width:640px){.ia-pan{right:0;bottom:0;width:100vw;height:100dvh;border-radius:0}.ia-btn{right:12px;bottom:12px;padding:11px 15px}}
body:has(.vis) .ia-btn{display:none}`;
  document.head.appendChild(css);

  const btn = document.createElement("button"); btn.className = "ia-btn"; btn.textContent = "💬 Pregunta al atlas"; btn.title = "Asistente: busca en todo el atlas";
  const pan = document.createElement("div"); pan.className = "ia-pan"; pan.hidden = true;
  pan.innerHTML = `<div class="ia-cab"><b>💬 Pregunta al atlas<small id="ia-modo"></small></b><button id="ia-bcfg" title="Configurar la IA">⚙️</button><button id="ia-cerrar" title="Cerrar">✕</button></div>
    <div class="ia-cfg" id="ia-cfg" hidden>
      <label>Modelo <select id="ia-prov">${Object.entries(PROV).map(([k, p]) => `<option value="${k}">${p.nombre}</option>`).join("")}</select></label>
      <label>Clave de Claude (Anthropic) <input id="ia-kc" type="password" autocomplete="off" placeholder="sk-ant-…"></label>
      <label>Clave de DeepSeek <input id="ia-kd" type="password" autocomplete="off" placeholder="sk-…"></label>
      <small>Las claves se guardan solo en este navegador y solo se envían a la API que elijas. No las uses en una computadora compartida. Sin clave, el asistente igual busca en el atlas y te muestra lo que encontró.</small>
      <div class="fila"><button id="ia-guardar">Guardar</button><button class="sec" id="ia-borrar">Borrar claves</button></div>
    </div>
    <div class="ia-log" id="ia-log"></div>
    <div class="ia-pie"><textarea id="ia-txt" placeholder="Escribe tu duda… (Enter para enviar)"></textarea><button id="ia-env">➤</button></div>`;
  document.body.append(btn, pan);
  const log = $("#ia-log", pan), txt = $("#ia-txt", pan);
  const tieneClave = () => PROV[cfg.prov].tipo === "claude" ? !!cfg.kc : !!cfg.kd;
  const modo = () => { $("#ia-modo", pan).textContent = tieneClave() ? PROV[cfg.prov].nombre : "solo búsqueda en el atlas · configura una clave en ⚙️"; };
  const historia = [];
  function bienvenida() {
    if (log.children.length) return;
    const aqui = (location.hash.match(/^#\/l\/(\d+)/) || [])[1], l = aqui && A.laminas.find(x => x.n === +aqui);
    const ej = (A.ejemplos || "").split("|").map(s => s.trim()).filter(Boolean);
    const sug = l ? [`¿Qué es lo más importante de ${plano(l.titulo).split(":")[0].toLowerCase()}?`, `Explícame la cadena de la lámina ${l.n}`] : ej.slice(0, 3);
    log.innerHTML = `<div class="ia-r"><p>Pregúntame cualquier cosa del atlas: busco en las láminas, explicaciones, tablas y preguntas, y te respondo citando dónde está cada dato.</p>
      ${sug.length ? `<div class="ia-sug">${sug.map(s => `<button>${esc(s)}</button>`).join("")}</div>` : ""}</div>`;
    log.querySelectorAll(".ia-sug button").forEach(b => b.onclick = () => { txt.value = b.textContent; enviar(); });
  }
  const abrir = () => { pan.hidden = false; btn.hidden = true; modo(); bienvenida(); if (!tieneClave() && !cfg.visto) { $("#ia-cfg", pan).hidden = false; cfg.visto = 1; guardarCfg(); } setTimeout(() => txt.focus(), 50); };
  btn.onclick = abrir;
  $("#ia-cerrar", pan).onclick = () => { pan.hidden = true; btn.hidden = false; };
  $("#ia-bcfg", pan).onclick = () => { const c = $("#ia-cfg", pan); c.hidden = !c.hidden; $("#ia-prov", pan).value = cfg.prov; $("#ia-kc", pan).value = cfg.kc || ""; $("#ia-kd", pan).value = cfg.kd || ""; };
  $("#ia-guardar", pan).onclick = () => { cfg.prov = $("#ia-prov", pan).value; cfg.kc = $("#ia-kc", pan).value.trim(); cfg.kd = $("#ia-kd", pan).value.trim(); guardarCfg(); $("#ia-cfg", pan).hidden = true; modo(); };
  $("#ia-borrar", pan).onclick = () => { delete cfg.kc; delete cfg.kd; guardarCfg(); $("#ia-kc", pan).value = $("#ia-kd", pan).value = ""; modo(); };
  $("#ia-env", pan).onclick = () => enviar();
  txt.addEventListener("keydown", ev => { ev.stopPropagation(); if (ev.key === "Enter" && !ev.shiftKey) { ev.preventDefault(); enviar(); } if (ev.key === "Escape") $("#ia-cerrar", pan).click(); });
  log.addEventListener("click", ev => { const a = ev.target.closest("a[href^='#/']"); if (a && matchMedia("(max-width:640px)").matches) { pan.hidden = true; btn.hidden = false; } });

  let ocupado = false;
  async function enviar() {
    const q = txt.value.trim(); if (!q || ocupado) return;
    txt.value = ""; ocupado = true;
    log.insertAdjacentHTML("beforeend", `<div class="ia-u">${esc(q)}</div>`);
    // la pregunta anterior ayuda a buscar los seguimientos («¿y en la derecha?»)
    const prev = historia.length ? historia[historia.length - 2].busca : "";
    const fuentes = buscar(q + " " + prev, 8).map(d => ({ ...d, etq: etq(d) }));
    const r = document.createElement("div"); r.className = "ia-r"; log.appendChild(r);
    const listaF = () => fuentes.length ? `<div class="ia-fu">${fuentes.map((f, i) => `<div><b>[${i + 1}]</b> ${f.ref ? `<a href="${f.ref}">${esc(f.etq)}</a>` : esc(f.etq)}</div>`).join("")}</div>` : "";
    if (!tieneClave()) {
      r.innerHTML = fuentes.length ? `<p>🔎 Esto es lo que encontré en el atlas (configura una clave en ⚙️ para que la IA te lo explique):</p>
        ${fuentes.slice(0, 5).map((f, i) => `<p><b>[${i + 1}] ${f.ref ? `<a href="${f.ref}">${esc(f.etq)}</a>` : esc(f.etq)}</b><br>${esc(f.texto.slice(0, 260))}${f.texto.length > 260 ? "…" : ""}</p>`).join("")}`
        : "<p>No encontré nada sobre eso en el atlas. Prueba con otras palabras (el nombre del signo, la enfermedad o la sigla).</p>";
      ocupado = false; log.scrollTop = log.scrollHeight; return;
    }
    const contexto = fuentes.length ? fuentes.map((f, i) => `[${i + 1}] (${f.etq}) ${f.texto.slice(0, 900)}`).join("\n\n") : "(no hay fragmentos relacionados)";
    const msgs = [...historia.slice(-4).map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: `Fragmentos del atlas:\n${contexto}\n\nPregunta: ${q}` }];
    let acum = ""; r.classList.add("ia-escribe");
    try {
      await preguntarIA(msgs, t => { acum += t; r.innerHTML = md(acum, fuentes); log.scrollTop = log.scrollHeight; });
      r.classList.remove("ia-escribe");
      r.innerHTML = md(acum || "(sin respuesta)", fuentes) + listaF();
      historia.push({ role: "user", content: q, busca: q }, { role: "assistant", content: acum });
    } catch (e) {
      r.classList.remove("ia-escribe");
      const red = /Failed to fetch|NetworkError|Load failed/i.test(e.message);
      r.innerHTML = `<p class="ia-err">${esc(red ? "No se pudo conectar con la API (sin internet o bloqueo del navegador)." : e.message)}</p>${listaF()}`;
    }
    ocupado = false; log.scrollTop = log.scrollHeight;
  }
})();
