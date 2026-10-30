/* Atlas del banco · Semiología — lógica de la app (sin dependencias). Datos: window.ATLAS (datos.js). */
(function () {
  "use strict";
  const A = window.ATLAS, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  if ("scrollRestoration" in history) history.scrollRestoration = "manual"; // al recargar manda la ruta, no la posición vieja
  document.title = A.titulo; { const m = $(".marca span"); if (m) m.textContent = A.marca; }
  const CIRC = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳㉑㉒㉓㉔㉕㉖㉗㉘㉙㉚㉛㉜㉝㉞㉟㊱㊲㊳㊴㊵㊶㊷㊸㊹㊺㊻㊼㊽㊾㊿";
  const numCirc = ch => CIRC.indexOf(ch) + 1;
  const porN = Object.fromEntries(A.laminas.map(l => [l.n, l]));

  document.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest(".mem-ver"); if (!b) return;
    const r = b.parentNode.querySelector(".mem-resp"); r.hidden = !r.hidden; b.textContent = r.hidden ? "Ver respuesta" : "Ocultar";
  });
  /* ---------- progreso (localStorage, con respaldo en memoria) ---------- */
  const CLAVE = "atlas-semio-v1"; let mem = {};
  function leer() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return mem; } }
  function guardar(o) { mem = o; try { localStorage.setItem(CLAVE, JSON.stringify(o)); } catch (e) {} }
  let P = leer();
  const marca = id => (P.q || {})[id];
  function marcar(id, v) { P.q = P.q || {}; if (P.q[id] === v) delete P.q[id]; else P.q[id] = v; guardar(P); }

  /* ---------- tema ---------- */
  function aplicaTema() { if (P.tema) document.documentElement.dataset.theme = P.tema; }
  aplicaTema();
  { const nav = $(".barra nav"), b = document.createElement("button"); b.id = "son-btn";
    const pinta = () => { b.textContent = P.sonido === false ? "🔇" : "🔊"; b.title = P.sonido === false ? "Activar sonidos" : "Silenciar sonidos"; };
    b.onclick = () => { P.sonido = P.sonido === false; guardar(P); pinta(); if (SON.activo()) { SON.despertar(); SON.bien(); } };
    pinta(); nav.insertBefore(b, $("#tema-btn")); }
  document.addEventListener("pointerdown", () => SON.despertar(), { once: true });
  $("#tema-btn").onclick = () => { SON.click();
    const osc = matchMedia("(prefers-color-scheme: dark)").matches;
    const actual = P.tema || (osc ? "dark" : "light");
    P.tema = actual === "dark" ? "light" : "dark"; guardar(P); aplicaTema();
  };

  /* ---------- sonidos (Web Audio, sintetizados; sin archivos) ---------- */
  const SON = (() => {
    let ctx = null, ultimo = 0;
    const activo = () => P.sonido !== false;
    function c() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ctx.state === "suspended") ctx.resume(); return ctx; }
    // nota: frecuencia, inicio (s), duración, tipo de onda, volumen, deslizamiento final
    function nota(f, t0 = 0, dur = .12, tipo = "sine", vol = .12, fFin = null) {
      if (!activo()) return; const ac = c(); if (!ac) return;
      const t = ac.currentTime + t0, o = ac.createOscillator(), g = ac.createGain();
      o.type = tipo; o.frequency.setValueAtTime(f, t); if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .03);
    }
    function ruido(t0 = 0, dur = .18, vol = .06, desde = 1800, hasta = 600) {
      if (!activo()) return; const ac = c(); if (!ac) return;
      const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime + t0;
      fl.type = "bandpass"; fl.frequency.setValueAtTime(desde, t); fl.frequency.exponentialRampToValueAtTime(hasta, t + dur); fl.Q.value = 1.2;
      g.gain.value = vol; s.buffer = b; s.connect(fl).connect(g).connect(ac.destination); s.start(t);
    }
    const limitar = (ms, f) => (...x) => { const ahora = performance.now(); if (ahora - ultimo < ms) return; ultimo = ahora; f(...x); };
    return {
      activo,
      pop: () => { nota(660, 0, .07, "triangle", .14, 990); },                       // tocar etiqueta / letra
      tick: limitar(40, () => nota(1500, 0, .035, "square", .035)),                  // mover carrusel, pasos
      giro: () => { ruido(0, .2, .07, 900, 2600); nota(520, .04, .08, "sine", .05, 780); }, // voltear ficha
      bien: () => { nota(784, 0, .1, "triangle", .13); nota(1175, .09, .18, "triangle", .13); },      // acierto / la sé
      mal: () => { nota(220, 0, .16, "sawtooth", .07, 160); nota(196, .1, .2, "sawtooth", .06, 140); }, // error
      repasar: () => { nota(440, 0, .1, "sine", .1); nota(392, .1, .16, "sine", .09); },              // marcar para repasar
      swish: () => ruido(0, .25, .06, 600, 3000),                                     // cambiar de imagen
      blip: i => nota(392 * Math.pow(2, (i % 8) / 7), 0, .11, "triangle", .1),        // paso a paso (sube)
      fanfarria: () => [523, 659, 784, 1047].forEach((f, i) => nota(f, i * .11, i === 3 ? .45 : .14, "triangle", .13)),
      click: () => nota(880, 0, .04, "square", .04),
      despertar: () => c(),
    };
  })();
  // celebración: estrellas que saltan desde un elemento (respeta «reducir movimiento»)
  function chispas(el, n = 14) {
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span"), a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      s.className = "chispa"; s.textContent = ["⭐", "✨", "🌟"][i % 3];
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d - 30 + "px"); s.style.setProperty("--rot", (Math.random() * 360 | 0) + "deg");
      document.body.appendChild(s); setTimeout(() => s.remove(), 950);
    }
  }
  function toast(t, cls = "") { const el = $("#toast"); el.textContent = t; el.className = cls; void el.offsetWidth; el.classList.add("ver"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("ver"), 1800); }

  /* ---------- utilidades ---------- */
  const norm = s => (s || "").replace(/<[^>]+>/g, " ").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const badge = v => v >= 3 ? '<span class="badge b3">🔥 3 veces</span>' : v === 2 ? '<span class="badge b2">🔁 2 veces</span>' : "";
  const exBadge = q => (q.ex || []).length ? `<span class="badge bx" title="${q.ex.join(" · ")}">📝 Examen${q.ex.length > 1 ? " ×" + q.ex.length : ""}</span>` : "";
  function grupoDe(l) { return A.grupos.find(g => g.id === l.grupo) || A.grupos[0]; }
  function progresoLamina(l) { const ok = l.preguntas.filter(q => marca(q.id) === "ok").length; return [ok, l.preguntas.length]; }
  // convierte ① en enlaces a preguntas y prepara las letras amarillas
  function enlazar(root, l) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodos = []; while (w.nextNode()) if (/[①-⑳㉑-㉟㊱-㊿]/.test(w.currentNode.nodeValue) && !w.currentNode.parentElement.closest(".et")) nodos.push(w.currentNode);
    for (const t of nodos) {
      const frag = document.createDocumentFragment();
      for (const ch of t.nodeValue) {
        const n = numCirc(ch);
        if (n > 0) { const a = document.createElement("a"); a.className = "ref"; a.textContent = n; a.dataset.n = n; a.title = "Ver la pregunta " + n; frag.appendChild(a); }
        else frag.appendChild(document.createTextNode(ch));
      }
      t.parentNode.replaceChild(frag, t);
    }
    $$(".ref", root).forEach(a => a.onclick = ev => { ev.preventDefault(); irPregunta(l, +a.dataset.n); });
    $$(".lt2,.lt", root).forEach(s => { s.dataset.l = s.textContent.trim(); s.onclick = () => { SON.pop(); brillaLetra(s.dataset.l); }; });
  }
  // siglas: la primera vez que aparece cada una en la vista va con su significado; las demás, con el significado al pasar el cursor
  const SIG = A.siglas || {}, reSig = Object.keys(SIG).length ? new RegExp("(^|[^\\wÁÉÍÓÚÑáéíóúñ])(" + Object.keys(SIG).sort((a, b) => b.length - a.length).map(x => x.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")).join("|") + ")(?![\\wÁÉÍÓÚÑáéíóúñ])", "g") : null;
  function siglas(root) {
    if (!reSig) return;
    const vistas = new Set(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      n.parentElement.closest("a,.et,.mk,.pin,script,style,svg,abbr,.regla-box,button,.badge") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodos = []; while (w.nextNode()) { reSig.lastIndex = 0; if (reSig.test(w.currentNode.nodeValue)) nodos.push(w.currentNode); }
    for (const t of nodos) {
      const txt = t.nodeValue, frag = document.createDocumentFragment(); let i = 0; reSig.lastIndex = 0; let m;
      while ((m = reSig.exec(txt))) {
        const ini = m.index + m[1].length, s = m[2];
        // «grado IV a VI», «V fortísimo, VI audible»: si el texto trae otros números romanos, VI es un grado, no el ventrículo
        if (/^[IVX]+$/.test(s) && /(^|[^\wÁÉÍÓÚ])(I{1,3}|IV|V)(?![\wÁÉÍÓÚ])/.test(txt.slice(0, ini) + " " + txt.slice(ini + s.length))) continue;
        frag.appendChild(document.createTextNode(txt.slice(i, ini)));
        const ab = document.createElement("abbr"); ab.className = "sigla"; ab.setAttribute("aria-label", s + ": " + SIG[s]); ab.tabIndex = 0; ab.textContent = s; frag.appendChild(ab);
        // ya explicada si el texto que sigue la desarrolla entre paréntesis o si antes vino el nombre completo
        const yaDicho = txt.slice(Math.max(0, ini - SIG[s].length - 4), ini).toLowerCase().includes(SIG[s].toLowerCase().slice(0, 12));
        if (t.parentElement.closest("h1,h2,h3")) { i = ini + s.length; continue; }  // en títulos, solo la sigla con su significado al pasar
        if (!vistas.has(s) && !yaDicho && !/^\s*\(/.test(txt.slice(ini + s.length))) {
          const e = document.createElement("span"); e.className = "sig-exp"; e.textContent = ` (${SIG[s]})`; frag.appendChild(e);
        }
        vistas.add(s); i = ini + s.length;
      }
      frag.appendChild(document.createTextNode(txt.slice(i))); t.parentNode.replaceChild(frag, t);
    }
  }
  /* ---------- conceptos tipo Wikipedia: tarjeta al pasar el cursor o al tocar ---------- */
  const CON = A.conceptos || {}, aliasDe = {};
  for (const [k, c] of Object.entries(CON)) for (const al of [k, ...(c.alias || [])]) { aliasDe[al] = k; aliasDe[al[0].toUpperCase() + al.slice(1)] ??= k; }
  const escRe = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const reCon = Object.keys(aliasDe).length ? new RegExp("(^|[^\\wÁÉÍÓÚÑáéíóúñ-])(" + Object.keys(aliasDe).sort((a, b) => b.length - a.length).map(escRe).join("|") + ")(?![\\wÁÉÍÓÚÑáéíóúñ-])", "g") : null;
  const BLOQUE = ".lema,.caja,.paso,.extra>div,.esc,.ncard,.recordar,.cara.atras,.mc-res,.porq,td,.dcap,.escala,.qmini,p";
  function conceptos(root) {
    if (!reCon) return;
    const usados = new Map(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n =>
      n.parentElement.closest(".et,.mk,.pin,script,style,svg,abbr,button,.badge,a,h1,h2,h3,.cara.frente,.mcq>.h,.opc,.con,.pista") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
    const nodos = []; while (w.nextNode()) { reCon.lastIndex = 0; if (reCon.test(w.currentNode.nodeValue)) nodos.push(w.currentNode); }
    for (const t of nodos) {
      const bloque = t.parentElement.closest(BLOQUE) || root; if (!usados.has(bloque)) usados.set(bloque, new Set());
      const ya = usados.get(bloque), txt = t.nodeValue, frag = document.createDocumentFragment(); let i = 0, m, cambio = false; reCon.lastIndex = 0;
      while ((m = reCon.exec(txt))) {
        const ini = m.index + m[1].length, k = aliasDe[m[2]];
        if (!k || ya.has(k)) continue;              // una vez por bloque, como un enlace de Wikipedia
        ya.add(k); cambio = true;
        frag.appendChild(document.createTextNode(txt.slice(i, ini)));
        const sp = document.createElement("span"); sp.className = "con"; sp.dataset.k = k; sp.tabIndex = 0; sp.textContent = m[2]; frag.appendChild(sp);
        i = ini + m[2].length;
      }
      if (!cambio) continue;
      frag.appendChild(document.createTextNode(txt.slice(i))); t.parentNode.replaceChild(frag, t);
    }
  }
  const pop = document.createElement("div"); pop.id = "pop"; pop.setAttribute("role", "tooltip"); document.body.appendChild(pop);
  let popEl = null, popT = 0, fijo = false;
  function popHTML(el) {
    if (el.classList.contains("sigla")) return `<div class="ph"><b>${el.textContent}</b><span class="pt-tipo">sigla</span><button class="pcerrar" aria-label="Cerrar">✕</button></div><p>${SIG[el.textContent] || ""}</p>`;
    const c = CON[el.dataset.k]; if (!c) return "";
    return `<div class="ph"><b>${el.dataset.k}</b><button class="pcerrar" aria-label="Cerrar">✕</button></div><p>${c.def}</p>
      ${c.clave ? `<p class="pclave">🔑 ${c.clave}</p>` : ""}${c.ejemplo ? `<p class="pej">🩺 <i>Ejemplo:</i> ${c.ejemplo}</p>` : ""}
      ${c.lit ? `<p class="plit">📚 Dato de literatura; tu teoría no lo detalla.</p>` : ""}`;
  }
  function mostrar(el, fijar) {
    const h = popHTML(el); if (!h) return;
    popEl = el; fijo = !!fijar; pop.innerHTML = h; pop.classList.add("ver"); pop.classList.toggle("fijo", fijo);
    if (innerWidth < 820) { pop.classList.add("hoja"); pop.style.left = pop.style.top = ""; return; }
    pop.classList.remove("hoja");
    const r = el.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    let x = Math.min(innerWidth - pw - 10, Math.max(10, r.left + r.width / 2 - pw / 2)), y = r.bottom + 8;
    if (y + ph > innerHeight - 10) y = r.top - ph - 8;
    pop.style.left = x + "px"; pop.style.top = y + "px";
  }
  function ocultar() { pop.classList.remove("ver", "fijo"); popEl = null; fijo = false; }
  document.addEventListener("mouseover", ev => {
    const el = ev.target.closest(".con,abbr.sigla"); clearTimeout(popT);
    if (el && el !== popEl) popT = setTimeout(() => mostrar(el), 220);
    else if (!el && !fijo && !ev.target.closest("#pop")) popT = setTimeout(ocultar, 180);
  });
  document.addEventListener("click", ev => {
    clearTimeout(popT);
    const el = ev.target.closest(".con,abbr.sigla");
    if (el && el.closest("a,button")) return;
    if (el) { ev.preventDefault(); ev.stopPropagation(); SON.pop(); if (popEl === el && fijo) ocultar(); else mostrar(el, true); return; }
    if (ev.target.closest(".pcerrar") || !ev.target.closest("#pop")) ocultar();
  }, true);
  document.addEventListener("focusin", ev => { const el = ev.target.closest && ev.target.closest(".con,abbr.sigla"); if (el) mostrar(el); });
  addEventListener("scroll", () => { if (popEl && !fijo && innerWidth >= 820) ocultar(); }, { passive: true });
  document.addEventListener("keydown", ev => { if (ev.key === "Escape") ocultar(); });

  function irPregunta(l, n) {
    const f = $(`.ficha[data-n="${n}"]`);
    if (!f) return;
    if (f.style.display === "none") { const b0 = $("#filtros button"); if (b0) b0.click(); }
    // el carrusel se centra en horizontal y la página baja en vertical (scrollIntoView falla con el carrusel)
    const c = f.parentElement;
    if (c.classList.contains("pista-c")) c.scrollTo({ left: f.offsetLeft - (c.clientWidth - f.offsetWidth) / 2, behavior: "smooth" });
    const baja = () => window.scrollTo({ top: f.getBoundingClientRect().top + scrollY - Math.max(90, (innerHeight - f.offsetHeight) / 2), behavior: "smooth" });
    baja(); setTimeout(baja, 700);
    if (!f.classList.contains("mc")) f.classList.add("vuelta");
    f.classList.add("resalta"); setTimeout(() => f.classList.remove("resalta"), 2200);
  }
  function brillaLetra(L) {
    const m = $(`.mk[data-l="${L}"]`); if (!m) return;
    $("#lienzo").scrollIntoView({ behavior: "smooth", block: "center" });
    m.classList.remove("brilla"); void m.offsetWidth; m.classList.add("brilla");
    const li = $(`.ncard[data-l="${L}"]`); if (li) { li.classList.add("brilla"); setTimeout(() => li.classList.remove("brilla"), 2000); }
  }


  /* ---------- regla de un rango numérico: barra con zonas rotuladas + tablita ---------- */
  function regla(r) {
    const W = 400, X0 = 12, X1 = W - 12, x = v => X0 + (v - r.min) / (r.max - r.min) * (X1 - X0);
    const col = { n: "#2e7d32", b: "#1565c0", a: "#c62828", m: "#d08a00" }, nom = { n: "Normal", b: "Bajo", a: "Alto", m: "Intermedio" };
    const fmt = v => String(v).replace(".", ",");
    const zonas = r.zonas || [];
    // barra
    let svg = `<rect x="${X0}" y="22" width="${X1 - X0}" height="20" rx="10" fill="#9aa" opacity=".25"/>`;
    zonas.forEach(([a0, b0, c, et], k) => {
      const xa = x(a0), xb = x(b0), w = Math.max(1, xb - xa), r0 = k === 0 ? 10 : 0, r1 = k === zonas.length - 1 ? 10 : 0;
      svg += `<path d="M${xa + r0} 22 H${xb - r1} ${r1 ? `A10 10 0 0 1 ${xb} 32 A10 10 0 0 1 ${xb - r1} 42` : `V42`} H${xa + r0} ${r0 ? `A10 10 0 0 1 ${xa} 32 A10 10 0 0 1 ${xa + r0} 22` : `V22`} Z" fill="${col[c] || "#888"}"/>`;
      const txt = et || nom[c] || "";
      if (w > txt.length * 7.4 + 8) svg += `<text x="${(xa + xb) / 2}" y="36" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">${txt}</text>`;
    });
    // marcas: debajo, alternando altura si están muy juntas
    const ms = (r.marcas || []).slice().sort((p, q) => p - q);
    let ult = -99, nivel = 0, hmax = 58;
    ms.forEach(v => {
      const xv = x(v); nivel = xv - ult < 30 ? (nivel ? 0 : 1) : 0; ult = xv;
      const y = 58 + nivel * 13; hmax = Math.max(hmax, y);
      svg += `<line x1="${xv}" y1="20" x2="${xv}" y2="${y - 10}" stroke="currentColor" stroke-width="1.3" opacity=".75"/>
        <text x="${xv}" y="${y}" font-size="14" font-weight="700" text-anchor="middle" fill="currentColor">${fmt(v)}</text>`;
    });
    // valor señalado arriba
    if (r.valor !== undefined) {
      const xv = x(r.valor);
      svg += `<path d="M${xv - 7} 6 L${xv + 7} 6 L${xv} 18 Z" fill="#f2b705" stroke="#1b1b1b" stroke-width="1"/>
        <text x="${Math.min(X1 - 30, Math.max(X0 + 30, xv))}" y="5" font-size="10.5" font-weight="700" text-anchor="middle" fill="currentColor" dy="-1"></text>`;
    }
    const alto = hmax + 6;
    // tablita
    const rango = (a0, b0, k) => k === 0 && a0 === r.min && zonas.length > 1 ? `&lt; ${fmt(b0)}` : k === zonas.length - 1 && b0 === r.max && zonas.length > 1 ? `&gt; ${fmt(a0)}` : `${fmt(a0)}–${fmt(b0)}`;
    const filas = zonas.map(([a0, b0, c, et], k) => `<tr><td><i style="background:${col[c] || "#888"}"></i></td><td><b>${rango(a0, b0, k)}</b> ${r.unidad || ""}</td><td>${et || nom[c] || ""}</td></tr>`).join("");
    return `<div class="regla-box"><svg class="regla" viewBox="0 0 ${W} ${alto}" role="img" aria-label="rango ${r.min} a ${r.max} ${r.unidad || ""}">${svg}</svg>
      ${r.valor !== undefined ? `<div class="rvalor">▼ marcado: <b>${fmt(r.valor)} ${r.unidad || ""}</b></div>` : ""}
      ${filas ? `<table class="rtabla">${filas}</table>` : ""}</div>`;
  }
  /* ---------- tarjeta de escala clínica: tabla de ítems y tabla de interpretación ---------- */
  function escalaHTML(s) {
    const sem = { N: ["sn", "🟢"], L: ["sl", "🟡"], M: ["sm", "🟠"], G: ["sg", "🔴"] };
    // «4 espontánea · 3 al sonido» → filas puntaje | respuesta; si no empieza con puntaje, va como texto
    const filasItem = txt => {
      const partes = txt.split(" · ");
      const conPunt = partes.every(p => /^([0-9]+|[IVX]+|[+]+|[0-9]+[+])\s/.test(p));
      if (!conPunt) return `<tr><td colspan="2" class="e-libre">${partes.join(" · ")}</td></tr>`;
      return partes.map(p => { const m = p.match(/^(\S+)\s+(.*)$/); return `<tr><td class="pz">${m[1]}</td><td>${m[2]}</td></tr>`; }).join("");
    };
    const items = s.items.map(([a, b]) => `<tbody><tr class="sub"><th colspan="2">${a}</th></tr>${filasItem(b)}</tbody>`).join("");
    const interp = s.interp.map(([v, t, c]) => `<tr class="${(sem[c] || sem.N)[0]}"><td class="pz">${v}</td><td>${(sem[c] || sem.N)[1]} ${t}</td></tr>`).join("");
    return `<div class="escala"><div class="eh"><span class="ei">${s.icono}</span><div><b>${s.nombre}</b><small>${s.mide}</small></div></div>
      ${items ? `<table class="etab"><colgroup><col style="width:78px"><col></colgroup><thead><tr>${/class="pz"/.test(items) ? `<th class="pz">Puntaje</th><th>Respuesta / hallazgo</th>` : `<th colspan="2">Hallazgos por grado</th>`}</tr></thead>${items}</table>` : ""}
      ${interp ? `<div class="etit">Interpretación</div><table class="etab itp"><colgroup><col style="width:78px"><col></colgroup>${interp}</table>` : ""}
      ${s.perla ? `<p class="perla">💡 ${s.perla}</p>` : ""}${s.lit ? `<p class="litn">📚 ${s.lit}</p>` : ""}</div>`;
  }

  /* ---------- router ---------- */
  function ruta() {
    const h = location.hash.replace(/^#\/?/, "").split("/");
    $$(".barra nav a").forEach(a => a.classList.toggle("act", (h[0] || "inicio") === a.dataset.nav || (h[0] === "" && a.dataset.nav === "inicio")));
    detenerTodo();
    if (h[0] === "l" && porN[+h[1]]) vistaLamina(porN[+h[1]], h[2]);
    else if (h[0] === "repaso") vistaRepaso(h[1]);
    else if (h[0] === "examen" && (A.resueltos || []).some(x => x.id === h[1])) vistaResuelto(A.resueltos.find(x => x.id === h[1]));
    else vistaInicio();
    if (h[0] !== "l" || !h[2]) window.scrollTo(0, 0);
  }
  addEventListener("hashchange", ruta);
  let timers = [];
  let teclas = [];
  function detenerTodo() { timers.forEach(clearTimeout); timers = []; teclas = []; document.onkeydown = null; ocultar();
    if (window.__espia) { removeEventListener("scroll", window.__espia); window.__espia = null; } }
  // los atajos no deben pisar Ctrl+C, Alt+←, escribir en el buscador ni el espacio sobre un botón enfocado
  const sinAtajo = ev => ev.ctrlKey || ev.metaKey || ev.altKey || ev.target.tagName === "INPUT" ||
    (ev.key === " " && ev.target.closest && !!ev.target.closest("button,a,[tabindex]"));
  const luego = (f, ms) => timers.push(setTimeout(f, ms));

  /* ---------- inicio ---------- */
  const unicas = () => { const vistos = new Set(); return A.laminas.flatMap(l => l.preguntas.map(q => ({ q, l }))).filter(x => !vistos.has(x.q.id) && vistos.add(x.q.id)); };
  function vistaInicio() {
    const todas = unicas();
    const ok = todas.filter(x => marca(x.q.id) === "ok").length, fuego = todas.filter(x => x.q.veces >= 3).length, hayRep = todas.some(x => x.q.veces >= 2);
    const nEx = todas.filter(x => (x.q.ex || []).length).length;
    let h = `<section class="portada"><div class="hola"><h1>${A.titulo}</h1>
      <p>${A.laminas.length} láminas ilustradas que explican ${A.descripcion} (<b>${todas.length} preguntas</b>).
      Toca las etiquetas, reproduce la fisiopatología y voltea las preguntas.</p>
      <a class="btn" href="#/repaso">${hayRep ? "🔥 Repaso: primero las que más salen" : "🔀 Repaso de todas las preguntas"}</a>
      ${nEx ? `<a class="btn ex" href="#/repaso/examen">📝 Simulacro: solo las ${nEx} que vinieron en exámenes</a>` : ""}</div>
      <div class="stats"><div class="stat"><b>${todas.length}</b><span>preguntas</span></div>
      ${hayRep ? `<div class="stat"><b>${fuego}</b><span>🔥 salieron 3 veces</span></div>` : `<div class="stat"><b>${A.laminas.reduce((s, l) => s + l.diapos.length, 0)}</b><span>🖼️ imágenes anotadas</span></div>`}
      ${nEx ? `<div class="stat"><b>${nEx}</b><span>📝 vinieron en exámenes</span></div>` : ""}
      <div class="stat"><b>${ok}</b><span>ya dominas</span><div class="barra-prog"><i style="width:${(ok / todas.length * 100).toFixed(1)}%"></i></div></div></div></section>
      <input class="buscar" id="buscar" placeholder="🔎 Busca en las ${todas.length} preguntas (p. ej. ${A.ejemplos || "«Damoiseau», «galope», «facies»"})…" autocomplete="off">
      <div class="resultados" id="resultados"></div>`;
    if ((A.resueltos || []).length) {
      h += `<h2>📝 Exámenes resueltos</h2><div class="grid-exr">`;
      for (const x of A.resueltos) {
        const ok = x.preguntas.filter(q => marca(q.id) === "ok").length;
        h += `<a class="tarj exr" href="#/examen/${x.id}"><div class="cuerpo"><b>${x.icono} ${x.titulo}</b>
          <div class="meta"><span>❓ ${x.preguntas.length} preguntas</span><span>✓ ${ok}</span></div>
          <div class="barra-prog"><i style="width:${(ok / x.preguntas.length * 100).toFixed(0)}%"></i></div></div></a>`;
      }
      h += "</div>";
    }
    if ((A.modulos || []).length) {   // módulos interactivos (simuladores) del curso
      h += `<h2>🧪 Módulos interactivos</h2><div class="grid-lam">`;
      for (const m of A.modulos)
        h += `<a class="tarj" href="${m.href}">${m.mini ? `<div class="mini" style="background-image:url('${m.mini}')">` : `<div class="mini sin"><i>${m.icono}</i>`}<span>${m.icono} Simulador</span></div>
          <div class="cuerpo"><b>${m.icono} ${m.titulo}</b><div class="meta" style="display:block">${m.descripcion}</div></div></a>`;
      h += "</div>";
    }
    for (const g of A.grupos) {
      const ls = A.laminas.filter(l => l.grupo === g.id); if (!ls.length) continue;
      h += `<h2>${g.icono} ${g.nombre}</h2><div class="grid-lam">`;
      for (const l of ls) {
        const [o, t] = progresoLamina(l), f3 = l.preguntas.filter(q => q.veces >= 3).length, fx = l.preguntas.filter(q => (q.ex || []).length).length;
        h += `<a class="tarj" href="#/l/${l.n}"><div class="mini" style="background-image:url('${l.mini || l.img}')"><span>Lámina ${l.n}</span></div>
          <div class="cuerpo"><b>${l.titulo}</b><div class="meta"><span>❓ ${t} preguntas</span>${f3 ? `<span>🔥 ${f3}</span>` : ""}${fx ? `<span>📝 ${fx}</span>` : ""}<span>✓ ${o}</span></div>
          <div class="barra-prog"><i style="width:${(o / t * 100).toFixed(0)}%"></i></div></div></a>`;
      }
      h += "</div>";
    }
    vista.innerHTML = h;
    const inp = $("#buscar"), res = $("#resultados");
    inp.oninput = () => {
      const t = norm(inp.value.trim()); if (t.length < 3) { res.innerHTML = ""; return; }
      const hs = todas.filter(x => norm(x.q.pregunta + " " + x.q.r + " " + x.q.x).includes(t)).slice(0, 30);
      res.innerHTML = hs.map(x => `<a href="#/l/${x.l.n}/q${x.q.n}"><b>${x.q.pregunta}</b><br><small>Lámina ${x.l.n} · ${x.l.titulo} ${x.q.veces >= 3 ? "· 🔥" : x.q.veces === 2 ? "· 🔁" : ""}${(x.q.ex || []).length ? " · 📝 " + x.q.ex.join(", ") : ""}</small></a>`).join("")
        || "<small>Sin resultados.</small>";
    };
  }

  /* ---------- lámina ---------- */
  /* ---------- «Entiéndelo»: prelectura, bloques ACERO, 4 piezas, Feynman, guía de preguntas, comprensiómetro ---------- */
  const PIEZA = { que: "¿Qué es?", como: "¿Cómo ocurre?", porque: "¿Por qué importa?", paraque: "¿Para qué sirve saberlo?" };
  const TIPO_G = { directa: "", inversa: "↩️ al revés", caso: "🩺 caso" };
  function entenderHTML(l) {
    const x = l.entender, comp = (P.comp || {})[l.n] || 0;
    return `<h2 id="entender">📖 Entiéndelo <small style="font-size:14px;color:var(--tx2);font-weight:500">léelo antes de memorizar: primero el porqué</small></h2>
      <div class="ent-pre"><div class="ent-pre-t">🧭 Antes de leer</div>
        ${x.objetivo ? `<p><b>Cómo te lo preguntan:</b> ${x.objetivo}</p>` : ""}${x.trata ? `<p><b>De qué trata:</b> ${x.trata}</p>` : ""}
        ${x.divide.length ? `<div class="ent-div"><b>Cómo se divide:</b> ${x.divide.map((d, k) => `<a href="#" data-b="${k}"><i>${k + 1}</i>${d}</a>`).join("")}</div>` : ""}</div>
      <div class="ent-bloques">${x.bloques.map((b, k) => `<article class="ent-b" id="ent-b${k}"><div class="ent-t">${b.t}</div>
        ${b.q ? `<div class="ent-q">${b.q}</div>` : ""}${b.txt.map(p => `<p>${p}</p>`).join("")}
        ${b.ej ? `<div class="ent-ej">💡 ${b.ej}</div>` : ""}${b.ojo ? `<div class="ent-ojo">⚠️ ${b.ojo}</div>` : ""}</article>`).join("")}</div>
      ${x.piezas.length ? `<div class="ent-piezas"><div class="ent-pre-t">⏱️ En 30 segundos</div><div class="ent-pz">${x.piezas.map(([k, v]) => `<div><b>${PIEZA[k]}</b>${v}</div>`).join("")}</div></div>` : ""}
      ${x.feynman ? `<div class="ent-fey"><div class="ent-pre-t">👵 Explícaselo a tu abuela</div><p>${x.feynman}</p></div>` : ""}
      ${x.guia.length ? `<div class="ent-guia"><div class="ent-pre-t">❓ Guía de preguntas <small>respóndelas en voz alta, sin mirar; luego destapa</small></div>
        ${x.guia.map(g => `<div class="ent-g"><div class="ent-gq">${g.q}${TIPO_G[g.tipo] ? ` <span class="ent-tipo">${TIPO_G[g.tipo]}</span>` : ""}</div>
          <button class="btn chico sec ent-ver">Ver respuesta</button><div class="ent-gr" hidden>${g.r}</div></div>`).join("")}</div>` : ""}
      <div class="ent-comp"><div class="ent-pre-t">🌡️ Comprensiómetro <small>¿cuánto lo entiendes, del 1 al 10? Explícalo sin mirar y sé honesto</small></div>
        <div class="ent-esc">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => `<button data-v="${v}" class="${v <= comp ? "on" : ""}">${v}</button>`).join("")}</div>
        <div class="ent-msg" id="ent-msg">${compMsg(comp)}</div></div>`;
  }
  function compMsg(v) {
    if (!v) return "";
    if (v >= 10) return "✅ Ya lo puedes explicar. Pasa a 🧠 Cómo recordarlo y a las preguntas.";
    if (v >= 7) return "Casi: con 9 todavía hay ilusión de saber. Explica en voz alta el bloque que más te costó y vuelve a puntuar.";
    return "Vuelve a los bloques, lee solo lo que no supiste explicar y mira el esquema; luego explícalo otra vez.";
  }
  function montarEntender(l) {
    $$(".ent-div a").forEach(a => a.onclick = ev => { ev.preventDefault(); SON.tick(); const b = document.getElementById("ent-b" + a.dataset.b);
      if (b) { b.scrollIntoView({ behavior: "smooth", block: "center" }); b.classList.remove("brilla"); void b.offsetWidth; b.classList.add("brilla"); } });
    $$(".ent-ver").forEach(b => b.onclick = () => { SON.tick(); const r = b.nextElementSibling; r.hidden = !r.hidden; b.textContent = r.hidden ? "Ver respuesta" : "Ocultar"; });
    $$(".ent-esc button").forEach(b => b.onclick = () => { SON.tick(); const v = +b.dataset.v; P.comp = P.comp || {}; P.comp[l.n] = v; guardar(P);
      $$(".ent-esc button").forEach(x => x.classList.toggle("on", +x.dataset.v <= v)); $("#ent-msg").innerHTML = compMsg(v); if (v >= 10) chispas(b); });
  }
  /* ---------- esquema draw.io del tema completo (imagen con zoom + PDF vectorial) ---------- */
  function esquemaHTML(l) {
    const x = l.esquema;
    return `<h2 id="esquema">🗺️ Esquema del tema <small style="font-size:14px;color:var(--tx2);font-weight:500">todo el razonamiento en un mapa; tócalo para ampliarlo</small></h2>
      <div class="esq-cab"><span class="esq-ley"><i class="k-causa"></i>causa <i class="k-mec"></i>mecanismo <i class="k-sig"></i>síntoma o signo <i class="k-dx"></i>diagnóstico <i class="k-comp"></i>complicación <i class="k-des"></i>desenlace · borde dorado = alto rendimiento · <b class="esq-f">F#</b> = pregunta n.º # de esta lámina</span>
        ${x.pdf ? `<a class="btn chico sec" href="${x.pdf}" target="_blank" rel="noopener">📄 PDF para imprimir</a>` : ""}</div>
      <div class="esq-marco" id="esq-marco"><img src="${x.img}" alt="Esquema: ${x.titulo}" loading="lazy"><span class="esq-abrir">⤢ Abrir y ampliar</span></div>
      ${x.fc.length ? `<div class="esq-fc">Preguntas que responde el esquema: ${x.fc.map(n => `<a href="#/l/${l.n}/q${n}">${n}</a>`).join("")}</div>` : ""}`;
  }
  function montarEsquema(l) {
    $("#esq-marco").onclick = () => abrirVisor(l.esquema.img, l.esquema.titulo);
  }
  // visor a pantalla completa: arrastrar = mover · pellizcar / rueda / ± = zoom · doble toque = ampliar ahí · Esc o ✕ = cerrar
  function abrirVisor(src, titulo) {
    SON.tick();
    const ov = document.createElement("div"); ov.className = "vis";
    ov.innerHTML = `<div class="vis-lienzo"><img src="${src}" alt="" draggable="false"></div>
      <div class="vis-top"><span class="vis-tit">${titulo || ""}</span><button class="vis-b" data-a="x" title="Cerrar (Esc)">✕</button></div>
      <div class="vis-ctl"><button class="vis-b" data-a="-" title="Alejar (−)">−</button><span class="vis-pct" id="vis-pct">100%</span>
        <button class="vis-b" data-a="+" title="Acercar (+)">+</button><button class="vis-b" data-a="0" title="Ver todo (0)">⤢</button>
        ${document.fullscreenEnabled ? `<button class="vis-b" data-a="f" title="Pantalla completa">⛶</button>` : ""}</div>
      <canvas class="vis-mapa" width="150" height="100"></canvas>
      <div class="vis-ayuda">Arrastra para moverte · pellizca o usa la rueda para el zoom · doble toque para ampliar</div>`;
    document.body.appendChild(ov); document.body.style.overflow = document.documentElement.style.overflow = "hidden";
    const lz = ov.querySelector(".vis-lienzo"), img = lz.querySelector("img"), mapa = ov.querySelector(".vis-mapa"), cx = mapa.getContext("2d");
    let s = 1, x = 0, y = 0, base = 1, W = 0, H = 0;
    const MAXZ = 8;
    const limitar = () => {   // el dibujo nunca se escapa de la pantalla: si es más chico que ella, queda centrado
      const vw = lz.clientWidth, vh = lz.clientHeight, w = W * s, h = H * s;
      x = w <= vw ? (vw - w) / 2 : Math.min(0, Math.max(vw - w, x));
      y = h <= vh ? (vh - h) / 2 : Math.min(0, Math.max(vh - h, y));
    };
    const pintar = () => {
      limitar(); img.style.transform = `translate(${x}px,${y}px) scale(${s})`;
      $("#vis-pct").textContent = Math.round(s / base * 100) + "%";
      // minimapa: el rectángulo rojo es la parte que estás viendo
      const k = Math.min(mapa.width / W, mapa.height / H), mw = W * k, mh = H * k, ox = (mapa.width - mw) / 2, oy = (mapa.height - mh) / 2;
      cx.clearRect(0, 0, mapa.width, mapa.height); cx.drawImage(img, ox, oy, mw, mh);
      const vx = -x / s * k, vy = -y / s * k, vw = lz.clientWidth / s * k, vh = lz.clientHeight / s * k;
      cx.strokeStyle = "#e91e63"; cx.lineWidth = 2; cx.strokeRect(ox + Math.max(0, vx), oy + Math.max(0, vy), Math.min(mw, vw), Math.min(mh, vh));
      mapa.hidden = s <= base * 1.05;
    };
    const zoomEn = (ns, px, py) => {   // zoom manteniendo fijo el punto (px, py) de la pantalla
      ns = Math.min(base * MAXZ, Math.max(base, ns));
      x = px - (px - x) * ns / s; y = py - (py - y) * ns / s; s = ns; pintar();
    };
    const ajustar = () => { base = Math.min(lz.clientWidth / W, lz.clientHeight / H); s = base; x = y = 0; pintar(); };
    const centro = () => [lz.clientWidth / 2, lz.clientHeight / 2];
    const iniciar = () => { W = img.naturalWidth; H = img.naturalHeight; ajustar(); };
    if (img.complete && img.naturalWidth) iniciar(); else img.onload = iniciar;
    // gestos con punteros: un dedo o el ratón arrastran, dos dedos pellizcan
    const ptr = new Map(); let pinch = null, ult = 0, mov = false;
    lz.addEventListener("pointerdown", ev => { try { lz.setPointerCapture(ev.pointerId); } catch (e) {} ptr.set(ev.pointerId, [ev.clientX, ev.clientY]); mov = false;
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s }; }
      ov.querySelector(".vis-ayuda").classList.add("fuera"); });
    lz.addEventListener("pointermove", ev => {
      if (!ptr.has(ev.pointerId)) return;
      const [px, py] = ptr.get(ev.pointerId); ptr.set(ev.pointerId, [ev.clientX, ev.clientY]);
      const r = lz.getBoundingClientRect();
      if (ptr.size === 2 && pinch) { const [a, b] = [...ptr.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]), mx = (a[0] + b[0]) / 2 - r.left, my = (a[1] + b[1]) / 2 - r.top;
        x += (ev.clientX - px) / 2; y += (ev.clientY - py) / 2; zoomEn(pinch.s * d / pinch.d, mx, my); mov = true; }
      else if (ptr.size === 1) { const dx = ev.clientX - px, dy = ev.clientY - py; if (Math.abs(dx) + Math.abs(dy) > 2) mov = true; x += dx; y += dy; pintar(); }
    });
    const soltar = ev => { ptr.delete(ev.pointerId); if (ptr.size < 2) pinch = null;
      if (ev.type === "pointerup" && !mov && ptr.size === 0) {   // doble toque: amplía ×2.5 ahí; si ya está ampliado, vuelve a ver todo
        const ahora = Date.now(), r = lz.getBoundingClientRect();
        if (ahora - ult < 320) { s > base * 1.5 ? ajustar() : zoomEn(base * 2.5, ev.clientX - r.left, ev.clientY - r.top); ult = 0; } else ult = ahora; } };
    lz.addEventListener("pointerup", soltar); lz.addEventListener("pointercancel", soltar);
    lz.addEventListener("wheel", ev => { ev.preventDefault(); const r = lz.getBoundingClientRect();
      if (ev.ctrlKey || Math.abs(ev.deltaY) >= Math.abs(ev.deltaX)) zoomEn(s * Math.exp(-ev.deltaY * (ev.ctrlKey ? .01 : .0018)), ev.clientX - r.left, ev.clientY - r.top);
      else { x -= ev.deltaX; pintar(); } }, { passive: false });
    // minimapa: tocarlo lleva a esa zona
    mapa.onpointerdown = ev => { ev.stopPropagation(); const r = mapa.getBoundingClientRect(), k = Math.min(mapa.width / W, mapa.height / H),
      ox = (mapa.width - W * k) / 2, oy = (mapa.height - H * k) / 2, fx = ((ev.clientX - r.left) * mapa.width / r.width - ox) / k, fy = ((ev.clientY - r.top) * mapa.height / r.height - oy) / k;
      x = lz.clientWidth / 2 - fx * s; y = lz.clientHeight / 2 - fy * s; pintar(); };
    const cerrar = () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); ov.remove(); document.body.style.overflow = document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", tecla, true); removeEventListener("resize", ajustar); };
    const accion = a => { const [mx, my] = centro();
      if (a === "x") cerrar(); else if (a === "+") zoomEn(s * 1.5, mx, my); else if (a === "-") zoomEn(s / 1.5, mx, my); else if (a === "0") ajustar();
      else if (a === "f") document.fullscreenElement ? document.exitFullscreen() : ov.requestFullscreen().catch(() => {}); };
    ov.querySelectorAll("[data-a]").forEach(b => b.onclick = ev => { ev.stopPropagation(); SON.tick(); accion(b.dataset.a); });
    const tecla = ev => { const k = { Escape: "x", "+": "+", "=": "+", "-": "-", "0": "0" }[ev.key];
      const fl = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }[ev.key];
      if (k) { ev.preventDefault(); ev.stopPropagation(); accion(k); } else if (fl) { ev.preventDefault(); ev.stopPropagation(); x += fl[0]; y += fl[1]; pintar(); } };
    document.addEventListener("keydown", tecla, true); addEventListener("resize", ajustar);
    document.addEventListener("fullscreenchange", () => ov.isConnected && setTimeout(ajustar, 120));
  }

  function vistaLamina(l, sub) {
    const g = grupoDe(l);
    let h = `<div class="migas"><a href="#/">← Láminas</a> · ${g.icono} ${g.nombre}</div>
      <h1>Lámina ${l.n} · ${l.titulo} <small>${l.subtitulo}</small></h1><div class="lema">${l.lema}</div>
      <nav class="pestanas"><a href="#/l/${l.n}/imagen">🖼️ Imagen</a>${l.entender ? `<a href="#/l/${l.n}/entender">📖 Entiéndelo</a>` : ""}${l.cadena ? `<a href="#/l/${l.n}/cadena">⚙️ ${l.cadena.titulo}</a>` : ""}${l.esquema ? `<a href="#/l/${l.n}/esquema">🗺️ Esquema</a>` : ""}${l.memoria && l.memoria.length ? `<a href="#/l/${l.n}/memoria">🧠 Recordarlo</a>` : ""}
      <a href="#/l/${l.n}/preguntas">❓ Preguntas <span class="prog" id="prog-l">${progresoLamina(l)[0]}/${l.preguntas.length} ✓</span></a>${l.escalas && l.escalas.length ? `<a href="#/l/${l.n}/escalas">📏 Escalas (${l.escalas.length})</a>` : ""}${l.tabla ? `<a href="#/l/${l.n}/tabla">📋 Tabla</a>` : ""}${(A.modulos || []).filter(m => (m.laminas || []).includes(l.n)).map(m => `<a href="${m.href}">${m.enlace}</a>`).join("")}
      ${l.n > 1 && porN[l.n - 1] ? `<a class="nav-l" href="#/l/${l.n - 1}" title="${porN[l.n - 1].titulo}">← ${l.n - 1}</a>` : ""}${porN[l.n + 1] ? `<a class="nav-l" href="#/l/${l.n + 1}" title="${porN[l.n + 1].titulo}">${l.n + 1} →</a>` : ""}</nav>
      <section id="imagen" class="zona"><div><div class="marco">
        <div class="controles"><button class="btn chico" id="b-tour">▶ Recorrer</button><button class="btn chico sec" id="b-quiz">🎯 ¿Dónde está?</button>
        <button class="btn chico sec" id="b-ocultar">👁️ Ocultar etiquetas</button><span class="quiz-msg" id="quiz-msg"></span></div>
        ${l.diapos.length > 1 ? `<div class="dtabs" id="dtabs">${l.diapos.map((d, k) => `<button data-k="${k}"><b>${k + 1}</b> ${d.titulo || "Imagen " + (k + 1)}</button>`).join("")}</div>` : ""}
        <div class="lienzo" id="lienzo"><img src="${l.diapos[0].img}" alt="${l.titulo}"><svg id="lineas" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
        ${l.diapos.length > 1 ? `<button class="dflecha prev" id="d-prev" title="Imagen anterior">‹</button><button class="dflecha next" id="d-next" title="Imagen siguiente">›</button><span class="dcont" id="dcont"></span>` : ""}</div>
        <div class="dcap" id="dcap"></div>
      </div><div class="fuente">${l.fuente} ${A.credito}</div></div>
      <aside class="lado"><div id="info"></div><div class="caja"><h3>${l.lado.titulo}</h3>${l.lado.parrafos.map(p => `<p>${p}</p>`).join("")}</div>
      </aside></section>
      ${l.lado.recordar || l.numeros.length ? `<section class="claves${l.lado.recordar && l.numeros.length ? "" : " una"}" id="claves">
        ${l.lado.recordar ? `<div class="recordar"><div class="ic">🧠</div><div><h3>Para recordar</h3><p>${l.lado.recordar}</p></div></div>` : ""}
        ${l.numeros.length ? `<div class="nums"><h3>🔢 Números clave <small>toca una letra para verla en la imagen</small></h3>
          <div class="numgrid">${l.numeros.map(x => `<div class="ncard" data-l="${x.l}"><span class="lt grande">${x.l}</span><div class="ntx">${x.html}${x.rango ? regla(x.rango) : ""}</div></div>`).join("")}</div></div>` : ""}
      </section>` : ""}
      ${l.escalas && l.escalas.length ? `<h2 id="escalas">📏 Escalas que se aplican</h2><div class="escgrid">${l.escalas.map(escalaHTML).join("")}</div>` : ""}`;
    if (l.entender) h += entenderHTML(l);
    if (l.cadena) {
      const c = l.cadena;
      h += `<h2 id="cadena">⚙️ ${c.titulo} <small style="font-size:14px;color:var(--tx2);font-weight:500">${c.subtitulo}</small></h2>
        <div class="lema">${c.lema}</div><div class="cad-ctl"><button class="btn chico" id="b-play">▶ Reproducir paso a paso</button>
        <button class="btn chico sec" id="b-todo">Ver todo</button></div>
        <div class="pasos" id="pasos">${c.pasos.map((p, i) => (i ? `<div class="flecha" data-i="${i}">➜</div>` : "") +
          `<div class="paso ${p.color}" data-i="${i}"><div class="t">${p.t}</div><div class="m">${p.m}</div>
           <div class="pr"><b>${p.pr_tit}</b> ${p.pr}${p.rf ? `<span class="rf">${p.rf}</span>` : ""}</div></div>`).join("")}</div>
        ${c.extra.length ? `<div class="extra">${c.extra.map(x => `<div class="${x.k}">${x.html}</div>`).join("")}</div>` : ""}
        ${c.escaleras.map(s => `<div class="esc ${s.c}"><div class="et2">${s.t}</div><div class="esl">${s.pasos.map((p, j) =>
          (j ? "<i>›</i>" : "") + `<span class="e${j === s.pasos.length - 1 ? " fin" : ""}">${p}</span>`).join("")}</div></div>`).join("")}
        ${c.html ? `<div class="libre">${c.html}</div>` : ""}<div class="fuente">${c.fuente}</div>`;
    }
    if (l.esquema) h += esquemaHTML(l);
    h += `${l.memoria && l.memoria.length ? `<h2 id="memoria">🧠 Cómo recordarlo <small style="font-size:14px;color:var(--tx2);font-weight:500">primero entiéndelo; esto es solo para los datos duros</small></h2>
        <div class="mem-grid">${l.memoria.map(m => `<div class="mem-card"><div class="mem-cab"><span class="mem-ic">${m.icono}</span><b>${m.tipo}</b></div>
          <div class="mem-dato">${m.dato}</div>${m.tecnica ? `<div class="mem-tec">${m.tecnica}</div>` : ""}
          ${m.escena ? `<div class="mem-esc">🎬 ${m.escena}</div>` : ""}
          ${m.pregunta ? `<div class="mem-prueba"><span>❓ ${m.pregunta}</span><button class="btn chico sec mem-ver">Ver respuesta</button><div class="mem-resp" hidden>${m.resp || m.dato}</div></div>` : ""}</div>`).join("")}</div>` : ""}`;
    h += `<h2 id="preguntas">❓ Las preguntas del banco que responde</h2>
      <div class="filtros" id="filtros"><button data-f="todas" class="on">Todas</button><button data-f="fuego">🔥 3 veces</button>
      <button data-f="rep">🔁 2+ veces</button><button data-f="exa">📝 De examen</button><button data-f="pend">Pendientes</button><button data-f="mal">✗ Para repasar</button>
      <button data-f="voltear">↻ Voltear todas</button><span class="cuenta" id="cuenta"></span></div>
      <div class="carrusel"><button class="cnav prev" id="c-prev" title="Anterior (←)">‹</button>
      <div class="pista-c" id="fichas">${l.preguntas.map(fichaHTML).join("")}</div>
      <button class="cnav next" id="c-next" title="Siguiente (→)">›</button></div>
      <div class="c-pie"><span id="c-pos"></span><div class="puntos" id="puntos"></div><span class="kbd">← → mover · espacio voltear · a–e elegir alternativa · 1 la sé · 2 repasar</span></div>`;
    // tabla: cada celda lleva el nombre de su columna (data-th) para verse como tarjetas en el celular
    const thTxt = x => x.replace(/<[^>]+>/g, "").replace(/"/g, "&quot;");
    if (l.tabla) h += `<h2 id="tabla">📋 Tabla comparativa <small style="font-size:14px;color:var(--tx2);font-weight:500">toca una fila para resaltarla</small></h2>
      <div class="tabla-wrap"><table class="tabla t2"><thead><tr>${l.tabla.cab.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>
      ${l.tabla.filas.map((f, i) => `<tr class="f${i % 6}${/^\s*(<[^>]+>)*\s*🔑/.test(f[0]) ? " clave-fila" : ""}">${f.map((x, k) => `<td data-th="${thTxt(l.tabla.cab[k] || "")}">${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    vista.innerHTML = h;
    montarLienzo(l);
    if (l.cadena) montarCadena();
    montarFichas(l);
    if (l.entender) montarEntender(l);
    if (l.esquema) montarEsquema(l);
    enlazar(vista, l);
    vista.normalize(); siglas(vista); conceptos(vista);
    $$(".tabla.t2 tbody tr").forEach(tr => tr.onclick = () => { SON.tick(); const on = tr.classList.contains("sel"); $$(".tabla.t2 tr.sel").forEach(x => x.classList.remove("sel")); if (!on) tr.classList.add("sel"); });
    document.onkeydown = ev => { if (sinAtajo(ev)) return; for (const h of teclas) if (h(ev)) return; };
    $$(".pestanas a[href*='/" + l.n + "/']").forEach(a => a.onclick = ev => {
      const id = a.getAttribute("href").split("/").pop(); const el = document.getElementById(id);
      if (el) { ev.preventDefault(); el.scrollIntoView({ behavior: "smooth" }); history.replaceState(null, "", a.getAttribute("href")); }
    });
    // la pestaña de la sección que se está leyendo queda marcada
    const secs = $$(".pestanas a[href*='/" + l.n + "/']").map(a => [a, document.getElementById(a.getAttribute("href").split("/").pop())]).filter(x => x[1])
      .sort((p, q) => p[1].compareDocumentPosition(q[1]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
    const espia = () => { let act = secs[0]; for (const x of secs) if (x[1].getBoundingClientRect().top < 160) act = x;
      secs.forEach(x => x[0].classList.toggle("act", x === act)); };
    removeEventListener("scroll", window.__espia || (() => {})); window.__espia = espia; addEventListener("scroll", espia, { passive: true }); espia();
    if (sub) setTimeout(() => {
      if (/^q\d+$/.test(sub)) irPregunta(l, +sub.slice(1));
      else { const el = document.getElementById(sub); if (el) { el.scrollIntoView({ behavior: "smooth" }); setTimeout(() => el.scrollIntoView(), 900); } }
    }, 350);
  }

  function montarLienzo(l) {
    const lz = $("#lienzo"), svg = $("#lineas"), img = $("img", lz);
    let k = 0;
    const trazar = () => {
      const b = lz.getBoundingClientRect(), W = b.width, H = b.height; if (!W || !H) return;
      let out = "";
      $$(".et", lz).forEach(el => {
        const e = l.etiquetas[+el.dataset.i]; if (!e || e.ax === undefined) return;
        const r = el.getBoundingClientRect();
        const x0 = (r.left - b.left) / W * 100, x1 = (r.right - b.left) / W * 100, y0 = (r.top - b.top) / H * 100, y1 = (r.bottom - b.top) / H * 100;
        const px = Math.min(Math.max(e.ax, x0), x1), py = Math.min(Math.max(e.ay, y0), y1), dl = (0.15 + (+el.dataset.i) * 0.07 + 0.3) + "s";
        out += `<line data-i="${el.dataset.i}" x1="${px}" y1="${py}" x2="${e.ax}" y2="${e.ay}" stroke="#fff" vector-effect="non-scaling-stroke" style="stroke-width:3.4px;animation-delay:${dl}"/>` +
          `<line data-i="${el.dataset.i}" x1="${px}" y1="${py}" x2="${e.ax}" y2="${e.ay}" stroke="#1b1b1b" vector-effect="non-scaling-stroke" style="stroke-width:1.3px;animation-delay:${dl}"/>` +
          (e.d ? "" : `<ellipse cx="${e.ax}" cy="${e.ay}" rx="${0.45 * H / W}" ry="0.45" fill="#1b1b1b" stroke="#fff" stroke-width="0.15"/>`);
      });
      svg.innerHTML = out;
    };
    let primera = true;
    function pintar(nk) {
      if (!primera) SON.swish(); primera = false;
      k = (nk + l.diapos.length) % l.diapos.length;
      const d = l.diapos[k];
      timers.forEach(clearTimeout); timers = []; salirQuiz(lz); lz.classList.remove("dim");
      const tb = $("#b-tour"); if (tb) tb.textContent = "▶ Recorrer";
      $$(".et,.mk,.pin", lz).forEach(x => x.remove()); svg.innerHTML = "";
      l.etiquetas = d.etiquetas;
      lz.classList.remove("cambia"); void lz.offsetWidth; lz.classList.add("cambia");
      if (img.getAttribute("src") !== d.img) img.src = d.img;
      l.etiquetas.forEach((e, i) => {
        const el = document.createElement("div");
        el.className = "et " + (e.c || "g"); el.dataset.i = i;
        el.style.left = e.x + "%"; el.style.top = e.y + "%";
        el.style.transform = e.al === "r" ? "translate(-100%,-50%)" : e.al === "l" ? "translate(0,-50%)" : "translate(-50%,-50%)";
        el.style.animationDelay = (0.15 + i * 0.07) + "s";
        el.innerHTML = (e.n ? `<span class="n">${e.n}</span>` : "") + e.t + (e.s ? `<span class="s">${e.s}</span>` : "");
        el.onclick = () => { SON.pop(); infoEtiqueta(l, i); };
        lz.appendChild(el);
        if (e.d && e.ax !== undefined) {
          const m = document.createElement("div"); m.className = "mk"; m.textContent = e.d; m.dataset.l = e.d;
          m.style.left = e.ax + "%"; m.style.top = e.ay + "%"; m.title = "Número clave " + e.d;
          m.onclick = () => { const li = $(`.ncard[data-l="${e.d}"]`); if (li) { li.scrollIntoView({ behavior: "smooth", block: "center" }); li.classList.add("brilla"); setTimeout(() => li.classList.remove("brilla"), 2000); } };
          lz.appendChild(m);
        }
        if (e.ax !== undefined) { // pin para móvil
          const p = document.createElement("div"); p.className = "pin movil"; p.textContent = i + 1;
          p.style.left = e.ax + "%"; p.style.top = e.ay + "%"; p.onclick = () => { SON.pop(); infoEtiqueta(l, i); }; lz.appendChild(p);
        }
      });
      const cap = $("#dcap");
      if (cap) { cap.innerHTML = (d.titulo && l.diapos.length > 1 ? `<b>${k + 1}. ${d.titulo}</b> ` : "") + (d.texto || ""); cap.style.display = cap.innerHTML ? "" : "none"; enlazar(cap, l); }
      if (cap) { siglas(cap); conceptos(cap); }
      $$("#dtabs button").forEach(b => b.classList.toggle("on", +b.dataset.k === k));
      const dc = $("#dcont"); if (dc) dc.textContent = `${k + 1} / ${l.diapos.length}`;
      const listo = () => requestAnimationFrame(() => requestAnimationFrame(trazar));
      (img.complete && img.naturalWidth ? Promise.resolve() : img.decode()).then(listo, () => { img.onload = listo; });
      setTimeout(trazar, 700); // respaldo por si la imagen ya estaba en caché
    }
    l.irDiapo = pintar;
    pintar(0);
    if (l.diapos.length > 1) {
      $("#d-prev").onclick = () => pintar(k - 1); $("#d-next").onclick = () => pintar(k + 1);
      $$("#dtabs button").forEach(b => b.onclick = () => pintar(+b.dataset.k));
      let x0 = null; // deslizar con el dedo
      lz.addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
      lz.addEventListener("touchend", e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) pintar(k + (dx < 0 ? 1 : -1)); x0 = null; });
      teclas.push(ev => {
        const r = lz.getBoundingClientRect(); if (r.bottom < 80 || r.top > innerHeight * .6) return false;
        if (ev.key === "ArrowRight") { ev.preventDefault(); pintar(k + 1); return true; }
        if (ev.key === "ArrowLeft") { ev.preventDefault(); pintar(k - 1); return true; }
        return false;
      });
    }
    let rz; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(trazar, 150); });
    // recorrido guiado (por la imagen visible)
    $("#b-tour").onclick = () => {
      salirQuiz(lz);
      const ets = $$(".et", lz); let i = 0;
      const paso = () => {
        $$(".et.foco", lz).forEach(x => x.classList.remove("foco")); $$("line.foco", lz).forEach(x => x.classList.remove("foco"));
        if (i >= ets.length) {
          lz.classList.remove("dim"); $("#b-tour").textContent = "▶ Recorrer";
          if (k < l.diapos.length - 1) luego(() => { pintar(k + 1); luego(() => $("#b-tour").click(), 1200); }, 900); // sigue con la próxima imagen
          return;
        }
        lz.classList.add("dim"); ets[i].classList.add("foco"); $$(`line[data-i="${ets[i].dataset.i}"]`, lz).forEach(x => x.classList.add("foco"));
        infoEtiqueta(l, +ets[i].dataset.i, true); $("#b-tour").textContent = `⏭ ${i + 1}/${ets.length}` + (l.diapos.length > 1 ? ` · img ${k + 1}` : "");
        SON.pop(); i++; luego(paso, 3800);
      };
      timers.forEach(clearTimeout); timers = []; paso();
    };
    $("#b-ocultar").onclick = ev => { const on = ev.target.classList.toggle("on"); lz.classList.toggle("sin-et", on); ev.target.textContent = on ? "👁️ Mostrar etiquetas" : "👁️ Ocultar etiquetas"; };
    $("#b-quiz").onclick = () => lz.classList.contains("quiz") ? salirQuiz(lz) : quiz(l, lz);
  }

  function infoEtiqueta(l, i, auto) {
    const e = l.etiquetas[i], lz = $("#lienzo");
    if (!auto) { lz.classList.remove("dim"); $$(".et.foco", lz).forEach(x => x.classList.remove("foco")); const el = $(`.et[data-i="${i}"]`, lz); if (el) el.classList.add("foco"); luego(() => el && el.classList.remove("foco"), 2500); }
    const ns = [...(e.n || "")].map(numCirc).filter(n => n > 0);
    const qs = ns.map(n => l.preguntas.find(q => q.n === n)).filter(Boolean);
    const num = e.d ? l.numeros.find(x => x.l === e.d) : null;
    const box = $("#info");
    box.innerHTML = `<div class="caja info"><h3>${e.t}</h3>${e.s ? `<p>${e.s.replace(/<br>/g, " · ")}</p>` : ""}
      ${num ? `<p><span class="lt">${num.l}</span> ${num.html}</p>` : ""}
      ${qs.map(q => `<div class="qmini"><a class="ref" data-n="${q.n}">${q.n}</a> <b>${q.pregunta}</b> ${badge(q.veces)}<br><span class="r${q.sin_banco ? " sb" : ""}">${q.r}</span></div>`).join("")}</div>`; siglas(box); conceptos(box);
    enlazar(box, l); $$(".ref", box).forEach(a => a.onclick = () => irPregunta(l, +a.dataset.n));
    if (innerWidth < 1100 && !auto) box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* ---------- quiz «¿Dónde está?» ---------- */
  function quiz(l, lz) {
    timers.forEach(clearTimeout); timers = []; lz.classList.remove("dim");
    const con = l.etiquetas.map((e, i) => ({ e, i })).filter(x => x.e.ax !== undefined);
    if (!con.length) return;
    lz.classList.add("quiz"); $("#b-quiz").classList.add("on"); $("#b-quiz").textContent = "✖ Salir del juego";
    con.forEach((x, k) => {
      const p = document.createElement("div"); p.className = "pin quizpin"; p.textContent = "?"; p.dataset.i = x.i;
      p.style.left = x.e.ax + "%"; p.style.top = x.e.ay + "%"; lz.appendChild(p);
    });
    let orden = con.map(x => x.i).sort(() => Math.random() - .5), aciertos = 0, intentos = 0;
    const msg = $("#quiz-msg");
    const pide = () => {
      if (!orden.length) { SON.fanfarria(); msg.textContent = `🎉 ${aciertos}/${con.length} al primer intento`; toast(`Terminaste: ${aciertos} de ${con.length}`); return; }
      const e = l.etiquetas[orden[0]]; msg.innerHTML = `Toca: <span style="color:var(--tx)">${e.t}</span>`;
    };
    let fallo = false;
    $$(".quizpin", lz).forEach(p => p.onclick = () => {
      if (!orden.length || p.classList.contains("bien")) return;
      const i = +p.dataset.i; intentos++;
      if (i === orden[0]) {
        p.classList.add("bien"); p.textContent = "✓"; if (!fallo) aciertos++; fallo = false; if (orden.length > 1) SON.bien();
        const et = $(`.et[data-i="${i}"]`, lz); if (et) { et.classList.add("revelada"); et.style.animation = "none"; et.style.opacity = 1; }
        orden.shift(); pide();
      } else { fallo = true; SON.mal(); p.classList.remove("malo"); void p.offsetWidth; p.classList.add("malo"); }
    });
    pide();
  }
  function salirQuiz(lz) {
    lz.classList.remove("quiz"); $$(".quizpin", lz).forEach(p => p.remove()); $$(".et.revelada", lz).forEach(e => e.classList.remove("revelada"));
    const b = $("#b-quiz"); if (b) { b.classList.remove("on"); b.textContent = "🎯 ¿Dónde está?"; } const m = $("#quiz-msg"); if (m) m.textContent = "";
  }

  /* ---------- cadena animada ---------- */
  function montarCadena() {
    const ps = $("#pasos"), escs = $$(".esc");
    const todo = () => { ps.classList.remove("oculto"); $$(".paso.activo", ps).forEach(x => x.classList.remove("activo")); escs.forEach(s => s.classList.remove("anim")); };
    $("#b-todo").onclick = () => { timers.forEach(clearTimeout); timers = []; todo(); };
    $("#b-play").onclick = () => {
      timers.forEach(clearTimeout); timers = [];
      ps.classList.add("oculto"); escs.forEach(s => s.classList.add("anim")); $$(".visto").forEach(x => x.classList.remove("visto", "activo")); $$(".paso.activo").forEach(x => x.classList.remove("activo"));
      const pasos = $$(".paso", ps); let t = 200;
      pasos.forEach((p, i) => {
        const fl = $(`.flecha[data-i="${i}"]`, ps);
        if (fl) luego(() => fl.classList.add("visto"), t), t += 500;
        luego(() => { $$(".paso.activo", ps).forEach(x => x.classList.remove("activo")); SON.blip(i); p.classList.add("visto", "activo"); p.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); }, t);
        t += 2600;
      });
      luego(() => { $$(".paso.activo", ps).forEach(x => x.classList.remove("activo")); ps.classList.remove("oculto"); }, t);
      escs.forEach(s => $$("span.e", s).forEach((e, j) => { luego(() => { SON.blip(j); e.classList.add("visto"); }, t); t += 700; }));
    };
    $$(".paso", ps).forEach(p => p.onclick = () => { $$(".paso.activo", ps).forEach(x => x.classList.remove("activo")); p.classList.add("activo", "visto"); });
  }

  /* ---------- fichas de preguntas ---------- */
  const sinLetra = o => o.replace(/^[a-eA-E][.)]\s*/, "");
  const marcarBtns = m => `<div class="marcar"><button class="si${m === "ok" ? " on" : ""}" data-v="ok">✓ La sé</button><button class="no${m === "mal" ? " on" : ""}" data-v="mal">✗ Repasar</button></div>`;
  const exHTML = q => (q.ex || []).length ? `<div class="exs">📝 <b>Salió en:</b> ${q.ex.join(" · ")}${q.nex ? `<br>${q.nex}` : ""}</div>` : "";
  // opción múltiple: se elige una alternativa, se corrige y cada alternativa muestra su porqué debajo
  function mcHTML(q) {
    const m = marca(q.id), L = "abcde";
    return `<div class="ficha mc ${q.c}${m === "ok" ? " estado-ok" : ""}" data-n="${q.n}" data-id="${q.id}" data-v="${q.veces}" data-x="${(q.ex || []).length}" data-letra="${q.letra}">
      <div class="mcq"><div class="h"><span class="num">${q.n}</span><span>${q.pregunta}</span><span class="badges">${exBadge(q)}${badge(q.veces)}</span></div>
      <div class="ops">${q.opciones.map((o, i) => `<div class="opw${L[i] === q.letra ? " es" : ""}" data-k="${L[i]}">
        <button class="opc"><span class="ltr">${L[i]}</span><span class="otx">${sinLetra(o)}</span><span class="ico"></span></button>
        ${(q.porq || {})[L[i]] ? `<div class="porq">${q.porq[L[i]]}</div>` : ""}</div>`).join("")}</div>
      <div class="pista">Elige una alternativa · <a href="#" class="ver-r">ver la respuesta</a></div>
      <div class="mc-res">${q.clave ? `<div class="clave-mc">🎯 <b>Para resolverla:</b> ${q.clave}</div>` : ""}
        ${q.aviso ? `<div class="aviso">⚠️ ${q.aviso}</div>` : ""}<div class="r${q.sin_banco ? " sb" : ""}">${q.r}</div>${q.ok ? `<div class="ok">${q.ok}</div>` : ""}
        ${q.porq ? "" : `<div class="x">${q.x}</div>`}${exHTML(q)}${q.truco ? `<div class="truco">${q.truco}</div>` : ""}
        <div class="mc-pie"><button class="reint">↺ Intentar de nuevo</button>${marcarBtns(m)}</div></div></div></div>`;
  }
  function fichaHTML(q) {
    if (q.opciones.length && q.letra) return mcHTML(q);
    const m = marca(q.id);
    return `<div class="ficha ${q.c}${m === "ok" ? " estado-ok" : ""}" data-n="${q.n}" data-id="${q.id}" data-v="${q.veces}" data-x="${(q.ex || []).length}">
      <div class="giro"><div class="cara frente"><div class="h"><span class="num">${q.n}</span><span>${q.pregunta}</span><span class="badges">${exBadge(q)}${badge(q.veces)}</span></div>
        ${q.opciones.length ? `<ol class="op" type="a">${q.opciones.map(o => `<li>${sinLetra(o)}</li>`).join("")}</ol>` : ""}<div class="pista">Toca para ver la respuesta ↻</div></div>
      <div class="cara atras"><div class="h"><span class="num">${q.n}</span><span style="font-weight:600;font-size:14px">${q.pregunta}</span></div>
                <div class="r${q.sin_banco ? " sb" : ""}">${q.r}</div>${q.ok ? `<div class="ok">${q.ok}</div>` : ""}<div class="x">${q.x}</div>
        ${exHTML(q)}${q.truco ? `<div class="truco">${q.truco}</div>` : ""}
        ${marcarBtns(m)}</div></div></div>`;
  }
  function montarFichas(l) {
    const cont = $("#fichas"), filtros = $("#filtros"), carr = cont.classList.contains("pista-c");
    const visibles = () => $$(".ficha", cont).filter(f => f.style.display !== "none");
    const cuenta = () => { const c = $("#cuenta"); if (c) c.textContent = `${visibles().length} de ${l.preguntas.length}`; };
    let actual = null;
    const fijar = (id, v) => { P.q = P.q || {}; P.q[id] = v; guardar(P); progChip(); };
    const progChip = () => { const c = $("#prog-l"); if (c) c.textContent = `${progresoLamina(l)[0]}/${l.preguntas.length} ✓`; };
    function responder(f, k) {
      if (f.classList.contains("respondida")) return;
      const ok = k === f.dataset.letra;
      f.classList.add("respondida");
      if (k) { const w = $(`.opw[data-k="${k}"]`, f); w.classList.add("elegida", ok ? "bien" : "malo"); }
      if (k) { fijar(f.dataset.id, ok ? "ok" : "mal"); const m = marca(f.dataset.id);
        $$(".marcar button", f).forEach(x => x.classList.toggle("on", x.dataset.v === m)); f.classList.toggle("estado-ok", ok);
        if (ok) { SON.bien(); toast("⭐ ¡Correcta!", "bien"); chispas($(`.opw[data-k="${k}"] .opc`, f)); }
        else { SON.repasar(); toast(`Casi: era la ${f.dataset.letra}). Lee el porqué de cada una 👇`, "casi"); }
        pintaPuntos(); }
      else SON.giro();
    }
    cont.onclick = ev => {
      const b = ev.target.closest(".marcar button"), f = ev.target.closest(".ficha");
      if (!f) return;
      if (carr && f !== actual) { ev.preventDefault(); SON.tick(); centrar(f); return; }
      if (f.classList.contains("mc")) {
        const o = ev.target.closest(".opc");
        if (o) { ev.stopPropagation(); responder(f, o.parentElement.dataset.k); return; }
        if (ev.target.closest(".ver-r")) { ev.preventDefault(); responder(f, ""); return; }
        if (ev.target.closest(".reint")) { f.classList.remove("respondida"); $$(".opw", f).forEach(w => w.classList.remove("elegida", "bien", "malo")); SON.click(); return; }
        if (!b) return;
      }
      if (ev.target.closest("a")) return;
      if (b) { ev.stopPropagation(); marcar(f.dataset.id, b.dataset.v); const m = marca(f.dataset.id);
        $$(".marcar button", f).forEach(x => x.classList.toggle("on", x.dataset.v === m)); f.classList.toggle("estado-ok", m === "ok");
        if (m === "ok") SON.bien(); else if (m === "mal") SON.repasar(); else SON.click();
        if (m === "ok" && l.preguntas.every(q => marca(q.id) === "ok")) { setTimeout(() => SON.fanfarria(), 250); toast("🎉 ¡Dominaste todas las preguntas de esta lámina!"); }
        else toast(m === "ok" ? "✓ Marcada como sabida" : m === "mal" ? "📌 Queda para repasar" : "Marca quitada", m === "ok" ? "bien" : "");
        if (m === "ok") chispas(b, 10);
        pintaPuntos(); progChip(); if (carr && m) setTimeout(() => mover(1), 650); return; }
      SON.giro(); f.classList.toggle("vuelta");
    };
    function centrar(f, suave = true) { if (!f) return; cont.scrollTo({ left: f.offsetLeft - (cont.clientWidth - f.offsetWidth) / 2, behavior: suave ? "smooth" : "auto" }); }
    function mover(d) { const v = visibles(); if (!v.length) return; SON.tick(); let k = v.indexOf(actual); k = Math.min(v.length - 1, Math.max(0, (k < 0 ? 0 : k) + d)); centrar(v[k]); }
    function detectar() {
      const v = visibles(), mid = cont.scrollLeft + cont.clientWidth / 2;
      let mejor = null, dist = 1e9;
      v.forEach(f => { const d = Math.abs(f.offsetLeft + f.offsetWidth / 2 - mid); if (d < dist) { dist = d; mejor = f; } });
      if (mejor !== actual) { if (actual) actual.classList.remove("actual"); actual = mejor; if (actual) actual.classList.add("actual"); }
      pintaPuntos();
    }
    function pintaPuntos() {
      if (!carr) return; const v = visibles(), k = v.indexOf(actual), pos = $("#c-pos");
      if (pos) pos.textContent = v.length ? `Pregunta ${k + 1} de ${v.length}` : "Ninguna con este filtro";
      const p = $("#puntos"); if (!p) return;
      p.innerHTML = v.map((f, i) => { const m = marca(f.dataset.id), vz = +f.dataset.v;
        return `<button class="pt${i === k ? " on" : ""}${m === "ok" ? " ok" : m === "mal" ? " mal" : ""}${vz >= 3 ? " fuego" : ""}" data-k="${i}" title="Pregunta ${f.dataset.n}"></button>`; }).join("");
      $$(".pt", p).forEach(b => b.onclick = () => centrar(v[+b.dataset.k]));
      const prev = $("#c-prev"), next = $("#c-next"); if (prev) prev.disabled = k <= 0; if (next) next.disabled = k >= v.length - 1;
    }
    if (carr) {
      let t; cont.addEventListener("scroll", () => { cancelAnimationFrame(t); t = requestAnimationFrame(detectar); });
      $("#c-prev").onclick = () => mover(-1); $("#c-next").onclick = () => mover(1);
      let x0 = null, s0 = 0, movio = false;
      cont.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" || e.target.closest("button,a")) return; x0 = e.clientX; s0 = cont.scrollLeft; movio = false; });
      addEventListener("pointermove", e => { if (x0 === null) return; const dx = e.clientX - x0; if (Math.abs(dx) > 6) { movio = true; cont.classList.add("arrastra"); cont.scrollLeft = s0 - dx; } });
      addEventListener("pointerup", () => { if (x0 === null) return; x0 = null; if (movio) { cont.classList.remove("arrastra"); detectar(); centrar(actual); setTimeout(() => movio = false, 0); } });
      cont.addEventListener("click", e => { if (movio) { e.stopPropagation(); e.preventDefault(); movio = false; } }, true);
      teclas.push(ev => {
        const r = cont.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return false;
        if (ev.key === "ArrowRight") { ev.preventDefault(); mover(1); }
        else if (ev.key === "ArrowLeft") { ev.preventDefault(); mover(-1); }
        else if (ev.key === " " && actual) { ev.preventDefault(); if (actual.classList.contains("mc")) responder(actual, ""); else { SON.giro(); actual.classList.toggle("vuelta"); } }
        else if (/^[a-e]$/i.test(ev.key) && actual && actual.classList.contains("mc") && $(`.opw[data-k="${ev.key.toLowerCase()}"]`, actual)) { ev.preventDefault(); responder(actual, ev.key.toLowerCase()); }
        else if ((ev.key === "1" || ev.key === "2") && actual) { actual.classList.add("vuelta"); const b = $(`.marcar button[data-v="${ev.key === "1" ? "ok" : "mal"}"]`, actual); if (b) b.click(); }
        else return false;
        return true;
      });
      requestAnimationFrame(() => { centrar(visibles()[0], false); detectar(); });
    }
    if (filtros) filtros.onclick = ev => {
      const b = ev.target.closest("button"); if (!b) return;
      if (b.dataset.f === "voltear") { const alguna = $$(".ficha:not(.mc):not(.vuelta)", cont).length || $$(".ficha.mc:not(.respondida)", cont).length;
        $$(".ficha:not(.mc)", cont).forEach(f => f.classList.toggle("vuelta", !!alguna)); $$(".ficha.mc", cont).forEach(f => f.classList.toggle("respondida", !!alguna)); return; }
      $$("#filtros button").forEach(x => x.classList.toggle("on", x === b));
      $$(".ficha", cont).forEach(f => {
        const v = +f.dataset.v, m = marca(f.dataset.id);
        const ver = { todas: 1, fuego: v >= 3, rep: v >= 2, exa: +f.dataset.x > 0, pend: !m, mal: m === "mal" }[b.dataset.f];
        f.style.display = ver ? "" : "none";
      });
      cuenta(); if (carr) { if (actual) actual.classList.remove("actual"); actual = null; centrar(visibles()[0], false); detectar(); }
    };
    cuenta();
    return { responder };
  }

  /* ---------- repaso global ---------- */
  function vistaRepaso(modo) {
    const exa = modo === "examen";
    const todas = exa ? unicas().filter(x => (x.q.ex || []).length) : unicas();
    const peso = x => (marca(x.q.id) === "ok" ? 100 : marca(x.q.id) === "mal" ? -10 : 0) - x.q.veces * 10 - (x.q.ex || []).length * 10 + Math.random() * 6;
    let mazo = todas.slice().sort((a, b) => peso(a) - peso(b)), k = 0, api = null;
    const pinta = () => {
      const x = mazo[k], q = x.q;
      vista.innerHTML = `<div class="repaso"><h1>${exa ? "📝 Simulacro de examen <small>solo preguntas que vinieron en exámenes anteriores, con sus alternativas</small>" : "🔥 Repaso <small>primero las que más salen y las que marcaste para repasar</small>"}</h1>
        <div class="filtros"><span class="cuenta" style="margin-left:0">Pregunta ${k + 1} de ${mazo.length} · Lámina ${x.l.n}: <a href="#/l/${x.l.n}/q${q.n}">${x.l.titulo}</a></span></div>
        <div class="fichas" id="fichas" style="grid-template-columns:1fr">${fichaHTML(q)}</div>
        <div class="nav"><button class="btn sec" id="ant">← Anterior</button><a class="btn sec" href="#/l/${x.l.n}/imagen">🖼️ Ver la lámina</a><button class="btn" id="sig">Siguiente →</button></div>
        <div class="kbd">Teclado: espacio = voltear o ver la respuesta · a–e = elegir alternativa · → siguiente · ← anterior · 1 = la sé · 2 = repasar</div></div>`;
      ocultar(); api = montarFichas(x.l); enlazar(vista, x.l); vista.normalize(); siglas(vista); conceptos(vista);
      $$(".ref", vista).forEach(a => a.onclick = ev => { ev.preventDefault(); location.hash = `#/l/${x.l.n}/q${a.dataset.n}`; });
      $("#ant").onclick = () => { SON.tick(); k = (k - 1 + mazo.length) % mazo.length; pinta(); };
      $("#sig").onclick = () => { SON.tick(); k = (k + 1) % mazo.length; pinta(); };
    };
    pinta();
    document.onkeydown = ev => {
      if (sinAtajo(ev)) return;
      const f = $(".repaso .ficha"); if (!f) return;
      const mc = f.classList.contains("mc");
      if (ev.key === " ") { ev.preventDefault(); if (mc) api.responder(f, ""); else { SON.giro(); f.classList.toggle("vuelta"); } }
      else if (mc && /^[a-e]$/i.test(ev.key) && $(`.opw[data-k="${ev.key.toLowerCase()}"]`, f)) { ev.preventDefault(); api.responder(f, ev.key.toLowerCase()); }
      else if (ev.key === "ArrowRight") $("#sig").click(); else if (ev.key === "ArrowLeft") $("#ant").click();
      else if (ev.key === "1" || ev.key === "2") { f.classList.add("vuelta"); const b = $(`.marcar button[data-v="${ev.key === "1" ? "ok" : "mal"}"]`, f); b && b.click(); }
    };
  }

  /* ---------- exámenes resueltos: todas las preguntas en lista, con puntaje ---------- */
  function vistaResuelto(x) {
    const n = x.preguntas.filter(q => q.opciones.length && q.letra).length;   // las abiertas no suman puntaje
    vista.innerHTML = `<div class="migas"><a href="#/">← Láminas</a> · Exámenes resueltos</div>
      <section class="exr-cab"><h1>${x.icono} ${x.titulo}</h1><p>${x.nota}</p>
      <div class="exr-marcador"><span id="exr-pts">0 de ${n} respondidas</span><button class="btn sec" id="exr-reset">↺ Empezar de nuevo</button></div></section>
      <div class="filtros" id="filtros"><button class="on" data-f="todas">Todas</button><button data-f="pend">Sin marcar</button><button data-f="mal">✗ Para repasar</button><button data-f="voltear">👁️ Ver todas las respuestas</button><span class="cuenta" id="cuenta"></span></div>
      <div class="fichas exr-lista" id="fichas">${x.preguntas.map(fichaHTML).join("")}</div>`;
    const api = montarFichas(x), cont = $("#fichas");
    const puntaje = () => {
      const rs = $$(".ficha.mc.respondida", cont), bien = $$(".opw.elegida.bien", cont).length, eleg = $$(".opw.elegida", cont).length;
      $("#exr-pts").innerHTML = eleg ? `<b>${bien}</b> correctas de ${eleg} respondidas · ${n - rs.length} por responder${rs.length === n ? ` · nota <b>${Math.round(bien / n * 20)}</b>/20` : ""}` : `0 de ${n} respondidas`;
      if (rs.length === n && eleg === n && !puntaje.fin) { puntaje.fin = true; SON.fanfarria(); toast(`🎉 Terminaste: ${bien} de ${n}`, "bien"); }
    };
    cont.addEventListener("click", () => setTimeout(puntaje, 0));
    $("#exr-reset").onclick = () => { $$(".ficha", cont).forEach(f => { f.classList.remove("respondida"); $$(".opw", f).forEach(w => w.classList.remove("elegida", "bien", "malo")); }); puntaje.fin = false; puntaje(); SON.click(); window.scrollTo(0, 0); };
    vista.normalize(); siglas(vista); conceptos(vista);
    document.onkeydown = null; void api;
  }

  ruta();
})();
