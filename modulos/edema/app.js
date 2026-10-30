/* Starling y edema — núcleo: tema, router por #hash, utilidades y la pestaña «Capilar vivo».
   Las demás pestañas están en secciones.js (causas, semiología) y secciones2.js (explicación, ponte a prueba)
   y se registran en window.SECC. El cálculo vive en motor.js (ED) y el catálogo de causas en casos.js (EDC). */
(function () {
  "use strict";
  const E = window.ED, f = E.f, clamp = E.clamp;
  const LIT = '<span class="lit">literatura</span>';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = { gen: 0, E, f, LIT, $, $$, clamp };

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

  /* ---------- animación: un contador de generación; al cambiar de pestaña se invalida ---------- */
  // quien arranca un bucle rAF guarda g = U.gen y se detiene cuando g !== U.gen
  U.detener = () => { U.gen++; U.repintar = null; U.alRedimensionar = null; };
  window.addEventListener("resize", () => U.alRedimensionar && U.alRedimensionar());

  /* ---------- estado compartido entre pestañas: lo que hay en el capilar ---------- */
  U.S = { circ: "sis", p: E.NORMAL(E.CIRC.sis), V: 0, caso: null, pausa: false };
  U.cargar = (caso) => {       // carga una causa en el simulador y salta a «Capilar vivo»
    U.S = { circ: caso.circ, p: Object.assign({}, caso.p), V: 0, caso, pausa: false };
    if (location.hash === "#capilar") ir(); else location.hash = "#capilar";
  };

  /* ---------- utilidades de interfaz ---------- */
  U.chips = (cont, items, activo, alElegir) => {
    cont.innerHTML = items.map(it => `<button class="chip${it.id === activo ? " act" : ""}" data-id="${it.id}">${it.t}</button>`).join("");
    $$(".chip", cont).forEach(b => b.onclick = () => { $$(".chip", cont).forEach(x => x.classList.toggle("act", x === b)); alElegir(b.dataset.id); });
  };
  U.barajar = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- router ---------- */
  const NOMBRES = ["capilar", "causas", "semio", "explicacion", "prueba"];
  function ir() {
    const h = (location.hash || "#capilar").slice(1).split("/")[0];
    const nom = NOMBRES.includes(h) ? h : "capilar";
    U.detener();
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + nom));
    vista.innerHTML = "";
    const sec = document.createElement("section"); sec.className = "seccion ver"; vista.appendChild(sec);
    (SECC[nom] || (() => { sec.textContent = "Sección no disponible."; }))(sec);
    window.scrollTo(0, 0);
  }
  U.ir = ir;
  window.addEventListener("hashchange", ir);
  window.addEventListener("DOMContentLoaded", ir);
  if (document.readyState !== "loading") setTimeout(ir, 0);

  /* =====================================================================
     PESTAÑA 1 · CAPILAR VIVO
     ===================================================================== */
  const W = 640, H = 420, CY = 210, HW = 30, X0 = 40, X1 = 600;      // lienzo lógico y geometría del capilar
  const BX = 440, BY = 112;                                          // boca del linfático
  const nombreFuerza = { Pv: "presión hidrostática capilar", alb: "albúmina (presión oncótica)", perm: "permeabilidad", Pi: "presión del intersticio", pii: "oncótica del intersticio", lin: "drenaje linfático" };

  SECC.capilar = function (sec) {
    sec.innerHTML = `
      <h1>💧 Capilar vivo</h1>
      <p class="lema">Mira el agua cruzar la pared del capilar. En el extremo <b>arterial</b> la presión hidrostática empuja el agua <b>hacia afuera</b>; en el <b>venoso</b>, cuando la presión cae, la oncótica de la albúmina la <b>devuelve</b>. Lo que sobra lo retira el <b>linfático</b>. Si la filtración supera a la linfa, el intersticio se hincha: eso es el edema.</p>
      <details class="caja video-ani"><summary>🎬 Ver el video (animación hecha con Google Flow)</summary>
        <video src="video_fuga.mp4" poster="video_fuga.jpg" muted loop playsinline controls preload="none" aria-label="Animación: el plasma sale del capilar al intersticio y el linfático lo drena"></video>
        <p class="nota">Los glóbulos rojos y la <b style="color:#A16207">albúmina</b> se quedan dentro; el <b style="color:#0284C7">agua del plasma</b> sale por las hendiduras y se acumula en el intersticio; el <b style="color:#15803D">linfático</b> recoge una parte.</p>
      </details>
      <div class="grid2">
        <div>
          <div class="panel caja" style="padding:8px">
            <div class="chips" id="modo" style="margin:0 0 8px"></div>
            <div class="escena" id="esc"><img id="esc-img" src="escena.webp" alt="" draggable="false"><canvas id="cv" role="img" aria-label="Capilar con intersticio y linfático; partículas de agua entrando y saliendo"></canvas><div class="esc-eti" id="esc-eti"></div></div>
            <p class="nota" id="leyenda" style="margin:6px 4px 0"></p></div>
          <div class="panel caja" style="padding:10px 12px"><h3 style="margin:2px 0 8px">⚖️ Tira y afloja de Starling <small class="nota">(mmHg)</small></h3><div class="tira" id="tira"></div></div>
          <div class="panel caja" style="padding:8px"><canvas id="pl" role="img" aria-label="Gráfico de las fuerzas de Starling a lo largo del capilar"></canvas>
            <p class="nota" style="margin:4px 4px 0">Gráfico: <b style="color:#B91C1C">rojo</b> = fuerzas que sacan el agua (presión capilar − presión intersticial); <b style="color:#2563EB">azul</b> = fuerza que la retiene (σ × (oncótica del plasma − oncótica intersticial)). Zona roja: sale; zona verde: vuelve.</p></div>
        </div>
        <div>
          <div class="caja">
            <div class="chips" id="circ"></div>
            <div class="ctrl col" id="sl"></div>
            <div class="ctrl"><button class="btn sec" id="b-norm">↺ Valores normales</button><button class="btn sec" id="b-vacia">🧽 Vaciar el líquido</button>
              <button class="btn sec" id="b-eq">⏭️ Ir al equilibrio</button><button class="btn sec" id="b-pausa">⏸️ Pausar</button></div>
          </div>
          <div class="letrero" id="let" aria-live="polite"></div>
          <div class="caja"><div class="bal" id="bal"></div>
            <div class="nivel" id="niv"><i></i></div><div class="nota" id="nivt"></div>
            <p class="nota" id="notacif"></p></div>
        </div>
      </div>`;
    const S = U.S, gen = U.gen;
    let c = E.CIRC[S.circ];
    const cv = $("#cv", sec), pl = $("#pl", sec), ctx = cv.getContext("2d"), ptx = pl.getContext("2d");
    let escala = 1, dpr = 1, pw = 0;

    /* ---- controles ---- */
    const DEF = k => [
      ["Pv", "Presión hidrostática capilar", c.Pvmin, c.Pvmax, 0.5],
      ["alb", "Albúmina del plasma", 1, 5, 0.1],
      ["perm", "Permeabilidad capilar", 0.5, 3, 0.1],
      ["Pi", "Presión del intersticio", -10, 10, 0.5],
      ["pii", "Oncótica del intersticio", 0, 20, 0.5],
      ["lin", "Drenaje linfático", 0, 1.5, 0.05]
    ];
    function dibujaSliders() {
      $("#sl", sec).innerHTML = DEF().map(d => `<label>${d[1]}<input type="range" id="s_${d[0]}" min="${d[2]}" max="${d[3]}" step="${d[4]}" value="${S.p[d[0]]}"><span class="val" id="s_${d[0]}v"></span></label>`).join("");
      DEF().forEach(d => { $("#s_" + d[0], sec).oninput = e => { S.p[d[0]] = +e.target.value; S.caso = null; actualiza(true); }; });
    }
    function rotulos() {
      const p = S.p, n = E.NORMAL(c);
      const set = (k, t) => { const e = $("#s_" + k + "v", sec); if (e) e.innerHTML = t; };
      set("Pv", `${f(p.Pv + c.caida, 0)}→${f(p.Pv, 0)}<br><small>media ${f(p.Pv + c.caida / 2, 0)} mmHg</small>`);
      set("alb", `${f(p.alb, 1)} g/dL<br><small>π ${f(E.piP(p.alb), 0)} mmHg</small>`);
      set("perm", `×${f(p.perm, 1)}<br><small>σ ${f(E.sigma(p.perm), 2)}</small>`);
      set("Pi", `${f(p.Pi, 1)}<br><small>mmHg</small>`);
      set("pii", `${f(p.pii, 1)}<br><small>mmHg</small>`);
      set("lin", `${f(p.lin * 100, 0)} %<br><small>de lo normal</small>`);
      $$("#sl label", sec).forEach(l => l.style.color = "");
    }
    U.chips($("#circ", sec), [{ id: "sis", t: "🦵 Capilar sistémico" }, { id: "pul", t: "🫁 Capilar pulmonar" }], S.circ, id => {
      U.S = Object.assign(S, { circ: id, p: E.NORMAL(E.CIRC[id]), V: 0, caso: null }); ir();
    });
    if (!S.modo) S.modo = "real";
    const LEY = {
      real: `Ilustración (ChatGPT) con una capa viva encima: <b style="color:#2563EB">●</b> agua que sale, <b style="color:#16A34A">●</b> agua que vuelve, <b style="color:#CA8A04">●</b> albúmina, <b style="color:#9333EA">●</b> linfa, <b style="color:#0EA5E9">●</b> líquido acumulado. Las <b>hendiduras</b> entre células brillan <b style="color:#DC2626">rojo</b> donde sale el agua y <b style="color:#16A34A">verde</b> donde vuelve.`,
      esq: `Esquema: flechas rojas = sale agua, verdes = vuelve; el intersticio se tiñe de azul al llenarse.` };
    function aplicaModo() { $("#esc", sec).classList.toggle("esq", S.modo === "esq"); $("#leyenda", sec).innerHTML = LEY[S.modo]; U.real.nuevo(); medir(); }
    U.chips($("#modo", sec), [{ id: "real", t: "🖼️ Realista" }, { id: "esq", t: "📐 Esquema" }], S.modo, id => { S.modo = id; aplicaModo(); });
    $("#b-norm", sec).onclick = () => { S.p = E.NORMAL(c); S.V = 0; S.caso = null; dibujaSliders(); actualiza(true); };
    $("#b-vacia", sec).onclick = () => { S.V = 0; };
    $("#b-eq", sec).onclick = () => { S.V = E.equilibrio(S.p, c).V; };
    $("#b-pausa", sec).onclick = e => { S.pausa = !S.pausa; e.target.textContent = S.pausa ? "▶️ Reanudar" : "⏸️ Pausar"; };
    if (S.pausa) $("#b-pausa", sec).textContent = "▶️ Reanudar";

    /* ---- tamaños (nítido en celular y escritorio) ---- */
    function medir() {
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(280, $("#esc", sec).clientWidth), real = S.modo !== "esq", LW = real ? U.real.W : W, LH = real ? U.real.H : H;
      cv.style.height = Math.round(w * LH / LW) + "px"; cv.width = Math.round(w * dpr); cv.height = Math.round(w * LH / LW * dpr);
      escala = w / LW * dpr;
      pw = w; pl.style.height = Math.round(Math.max(150, w * 0.34)) + "px"; pl.width = Math.round(w * dpr); pl.height = Math.round(Math.max(150, w * 0.34) * dpr);
    }
    aplicaModo(); U.alRedimensionar = () => { medir(); };

    /* ---- partículas ---- */
    const rbc = [], alb = [], gotas = [], pool = [];
    for (let i = 0; i < 9; i++) rbc.push({ x: X0 + Math.random() * (X1 - X0), y: CY + (Math.random() - .5) * 28, a: Math.random() * 3 });
    let acc = { sale: 0, entra: 0, linfa: 0, prot: 0 };
    const rnd = (a, b) => a + Math.random() * (b - a);
    function cdf(Vn, p) {                        // muestreo de x ∝ NDP positivo (sale) o negativo (entra)
      const N = 48, s = [], e = []; let ss = 0, ee = 0;
      for (let i = 0; i < N; i++) { const v = E.ndp(p, c, (i + 0.5) / N, Vn); ss += Math.max(v, 0); ee += Math.max(-v, 0); s.push(ss); e.push(ee); }
      return { s, e, ss, ee, N };
    }
    function muestra(arr, tot, N) { const r = Math.random() * tot; let i = 0; while (i < N - 1 && arr[i] < r) i++; return (i + Math.random()) / N; }

    /* ---- panel de números + letrero ---- */
    let ult = { txt: "" };
    let memo = { k: "", t: "" };
    function textoCausal() {
      const key = JSON.stringify([S.circ, S.p]); if (memo.k === key) return memo.t;
      memo.k = key; memo.t = calcCausal(); return memo.t;
    }
    function calcCausal() {
      const p = S.p, n = E.NORMAL(c), eq = E.equilibrio(p, c), ap = E.aportes(p, c), fl = E.flujos(p, c, 0), L0 = E.linfa(p, c, 0);
      const al = ap.filter(a => a.alterada && Math.abs(a.dV) > 0.02);
      const Pcm = p.Pv + c.caida / 2, e = E.estado(eq.V, c);
      let causa, efecto;
      if (!al.length) {
        return `<span class="k">todo normal</span> <span>La presión empuja el agua afuera en el extremo arterial (+${f(E.ndp(p, c, 0, 0), 0)} mmHg), la albúmina la hace volver en el venoso (${f(E.ndp(p, c, 1, 0), 0)} mmHg) y la linfa retira el resto: no se acumula líquido.</span>`;
      }
      const a = al[0], k = a.k, subio = p[k] > n[k];
      const T = {
        Pv: subio ? `sube la presión hidrostática capilar (media ${f(Pcm, 0)} mmHg; normal ${f(n.Pv + c.caida / 2, 0)}): la sangre empuja más contra la pared` : `baja la presión hidrostática capilar (media ${f(Pcm, 0)} mmHg): sale menos agua y se reabsorbe más`,
        alb: subio ? `sube la albúmina (${f(p.alb, 1)} g/dL = ${f(E.piP(p.alb), 0)} mmHg): el capilar retiene más agua` : `baja la albúmina (${f(p.alb, 1)} g/dL = ${f(E.piP(p.alb), 0)} mmHg; normal 25): el capilar retiene menos agua`,
        perm: subio ? `sube la permeabilidad: la pared deja pasar agua y proteínas (σ ${f(E.sigma(p.perm), 2)}), la oncótica pierde fuerza` : `baja la permeabilidad: la pared filtra menos`,
        Pi: subio ? `sube la presión del intersticio: se opone a la salida de agua` : `baja la presión del intersticio (${f(p.Pi, 1)} mmHg): el tejido «succiona» líquido`,
        pii: subio ? `sube la oncótica del intersticio (${f(p.pii, 0)} mmHg): el tejido atrae el agua hacia afuera` : `baja la oncótica del intersticio: el tejido atrae menos agua`,
        lin: subio ? `el drenaje linfático aumenta: retira más líquido` : `cae el drenaje linfático (${f(p.lin * 100, 0)} %): no se retira el exceso`
      };
      causa = T[k] + (al.length > 1 ? ` · también: ${al.slice(1, 3).map(x => nombreFuerza[x.k]).join(", ")}` : "");
      if (eq.V < 0.05) efecto = `la linfa alcanza a drenarlo (filtración ${f(fl.filtra, 1)} ≈ linfa ${f(L0, 1)} L/día): <b>no hay edema</b>.`;
      else if (eq.sinTope) efecto = `la filtración (${f(fl.filtra, 1)} L/día) supera a la linfa (${f(L0, 1)}) y ni con el intersticio tenso se frena: el líquido se acumula sin tope (<b>${e.txt}</b>).`;
      else efecto = `la filtración (${f(fl.filtra, 1)} L/día) supera a la linfa (${f(L0, 1)}): el intersticio se llena hasta ≈ <b>${f(eq.V, 1)} L</b> (${e.txt}).`;
      return `<span class="k">causa</span> <span>${causa}</span> <span class="k">efecto</span> <span>${efecto}</span>`;
    }
    function balance() {
      const p = S.p, fl = E.flujos(p, c, S.V), li = E.linfa(p, c, S.V), eq = E.equilibrio(p, c), e = E.estado(S.V, c);
      const acu = fl.filtra - li;
      $("#bal", sec).innerHTML = `
        <div><small>Sale (arterial)</small><b>${f(fl.sale, 1)}</b><small>L/día</small></div>
        <div><small>Vuelve (venoso)</small><b class="bien">${f(fl.entra, 1)}</b><small>L/día</small></div>
        <div><small>Filtración neta</small><b>${f(fl.filtra, 1)}</b><small>L/día</small></div>
        <div><small>Linfa</small><b>${f(li, 1)}</b><small>L/día</small></div>
        <div class="${acu > 0.05 ? "mal" : "bien"}"><small>Se acumula</small><b>${f(acu, 1)}</b><small>L/día</small></div>
        <div class="${S.V >= (c.id === "sis" ? 5 : .6) ? "mal" : ""}"><small>Líquido acumulado</small><b>${f(S.V, c.id === "sis" ? 1 : 2)}</b><small>L · tope ${f(eq.V, c.id === "sis" ? 1 : 2)}</small></div>`;
      const lim = c.id === "sis" ? 5 : .6;
      $("#niv i", sec).style.width = clamp(S.V / (lim * 2) * 100, 0, 100) + "%";
      $("#niv", sec).innerHTML = `<i style="width:${clamp(S.V / (lim * 2) * 100, 0, 100)}%"></i><u style="left:50%"></u>`;
      $("#nivt", sec).innerHTML = `<b>${e.txt}</b>. ` + (c.id === "sis" ? `La marca central es el umbral de la clase: pre-edema &lt; 5 L, edema detectable ≥ 5 L.` : `Pulmón: primero edema intersticial (pre-bronquial), luego intra-alveolar (los umbrales en litros son didácticos).`);
    }
    function actualiza(fuerza) {
      rotulos();
      const t = textoCausal(); if (fuerza || t !== ult.txt) { $("#let", sec).innerHTML = t; ult.txt = t; }
      $("#notacif", sec).innerHTML = c.id === "sis"
        ? `De la clase: albúmina normal 4-5 g/dL, edema con &lt; 2,5 g/dL; presión oncótica del plasma 25 mmHg. Presión capilar 35→15 mmHg, presión y oncótica del intersticio, linfa ≈ 3 L/día y la conversión albúmina→mmHg son ${LIT} (modelo didáctico en «L equivalentes»).`
        : `De la clase (EAP): presión capilar pulmonar normal ≈ 10 mmHg, hasta 25-30 mmHg en el EAP cardiogénico; presión oncótica del plasma 25 mmHg. El resto (presión y oncótica del intersticio pulmonar, tasa linfática) es ${LIT} y está ajustado de forma didáctica.`;
    }

    /* ---- dibujo ---- */
    const col = {};
    function colores() { ["--fondo", "--papel", "--tx", "--tx2", "--borde", "--azc", "--ro", "--ve", "--mo", "--am"].forEach(v => col[v] = U.css(v)); }
    colores(); U.repintar = colores;
    function ondas(x0, x1, y, amp, fase) { ctx.beginPath(); for (let x = x0; x <= x1; x += 8) { const yy = y + Math.sin(x / 38 + fase) * 3; x === x0 ? ctx.moveTo(x, yy + amp) : ctx.lineTo(x, yy + amp); } }
    function cuadro(t, dt) {
      const p = S.p, V = S.V, fl = E.flujos(p, c, V);
      const sw = clamp(V / (c.id === "sis" ? 12 : 2), 0, 1.2), b = 30 * sw;              // hinchazón visual
      const top = 70 - b, bot = 350 + b;
      ctx.setTransform(escala, 0, 0, escala, 0, 0); ctx.clearRect(0, 0, W, H);
      ctx.font = "600 13px Fredoka, Nunito, system-ui, sans-serif"; ctx.textBaseline = "middle";
      // intersticio (se tiñe de azul al acumular agua)
      const tinte = clamp(V / (c.id === "sis" ? 14 : 2.2), 0, .55);
      for (const [y0, y1] of [[top, CY - HW], [CY + HW, bot]]) {
        ctx.fillStyle = col["--papel"]; ctx.fillRect(X0 - 20, y0, X1 - X0 + 40, y1 - y0);
        ctx.fillStyle = `rgba(59,130,246,${tinte})`; ctx.fillRect(X0 - 20, y0, X1 - X0 + 40, y1 - y0);
      }
      // piel / límite del tejido (ondulado: se abomba al hincharse)
      ctx.strokeStyle = col["--tx2"]; ctx.lineWidth = 3;
      for (const y of [top, bot]) { ctx.beginPath(); for (let x = X0 - 20; x <= X1 + 20; x += 6) { const yy = y + Math.sin((x - X0) / (X1 - X0) * Math.PI) * (y < CY ? -1 : 1) * b * .45; x === X0 - 20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); } ctx.stroke(); }
      // células del tejido (se separan al hincharse)
      for (let i = 0; i < 8; i++) for (const lado of [-1, 1]) {
        const fr = ((i * 37 + (lado > 0 ? 17 : 5)) % 50) / 100 + .28, cx = X0 + 25 + i * 72 + (lado > 0 ? 18 : 0);
        const yw = CY + lado * HW, ye = lado < 0 ? top : bot, cy = yw + (ye - yw) * fr;
        if (lado < 0 && cx > BX - 40 && cy < BY + 22 && cy > BY - 22) continue;
        ctx.fillStyle = "rgba(244,114,182,.35)"; ctx.strokeStyle = "rgba(190,24,93,.55)"; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(cx, cy, 17, 12, 0.3 * lado, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(131,24,67,.6)"; ctx.beginPath(); ctx.arc(cx + 2, cy, 3.6, 0, 7); ctx.fill();
      }
      // flechas de presión neta (ahí donde sale o entra el agua)
      for (let i = 0; i < 9; i++) {
        const x = X0 + 30 + i * (X1 - X0 - 60) / 8, v = E.ndp(p, c, (x - X0) / (X1 - X0), V), L = clamp(Math.abs(v) * 1.6, 0, 46);
        if (L < 4) continue;
        for (const lado of [-1, 1]) {
          const ya = CY + lado * (HW + 3), yb = ya + lado * (v > 0 ? L : -L);
          ctx.strokeStyle = v > 0 ? "rgba(185,28,28,.8)" : "rgba(22,163,74,.85)"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 3;
          const y0 = v > 0 ? ya : ya + lado * L, y1 = v > 0 ? yb : ya;
          ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y1 + lado * 0); ctx.lineTo(x - 5, y1 - lado * 8); ctx.lineTo(x + 5, y1 - lado * 8); ctx.closePath(); ctx.fill();
        }
      }
      // linfático (extremo ciego con luz) a la derecha arriba
      ctx.fillStyle = "rgba(124,58,237,.14)"; ctx.strokeStyle = col["--mo"]; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(BX - 14, BY - 12, W - BX + 30, 24, 12) : ctx.rect(BX - 14, BY - 12, W - BX + 30, 24); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col["--mo"]; ctx.fillText("linfático", BX + 70, BY - 24);
      // capilar: luz + pared con poros
      ctx.fillStyle = "rgba(220,38,38,.10)"; ctx.fillRect(X0, CY - HW, X1 - X0, HW * 2);
      const gap = clamp(6 + (p.perm - 1) * 9, 3, 24);
      ctx.strokeStyle = col["--tx"]; ctx.lineWidth = 4;
      for (const lado of [-1, 1]) {
        const y = CY + lado * HW; let x = X0;
        ctx.beginPath();
        for (let k = 0; k < 9; k++) { const xs = X0 + k * (X1 - X0) / 9, xe = xs + (X1 - X0) / 9 - gap; ctx.moveTo(xs + gap / 2, y); ctx.lineTo(xe + gap / 2, y); }
        ctx.stroke();
      }
      // glóbulos y albúmina dentro del capilar
      const v = 62;
      for (const r of rbc) { r.x += v * dt; if (r.x > X1 + 8) r.x = X0 - 8; r.a += dt * 2; const y = r.y + Math.sin(r.a) * 2;
        ctx.fillStyle = "#DC2626"; ctx.strokeStyle = "#7F1D1D"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(r.x, y, 8, 5, 0, 0, 7); ctx.fill(); ctx.stroke(); }
      const nAlb = Math.round(p.alb * 7);
      while (alb.length < nAlb) alb.push({ x: rnd(X0, X1), y: CY + rnd(-HW + 6, HW - 6) });
      while (alb.length > nAlb) alb.pop();
      ctx.fillStyle = col["--am"]; ctx.strokeStyle = "#92400E"; ctx.lineWidth = 1;
      for (const a of alb) { a.x += v * dt; if (a.x > X1 + 4) a.x = X0 - 4; ctx.beginPath(); ctx.arc(a.x, a.y, 3.4, 0, 7); ctx.fill(); ctx.stroke(); }
      // piscina de líquido intersticial acumulado
      const nPool = Math.round(170 * Math.sqrt(V / c.Vmax));
      while (pool.length < nPool) { const lado = Math.random() < .5 ? -1 : 1, yw = CY + lado * (HW + 6), ye = lado < 0 ? top + 6 : bot - 6; pool.push({ x: rnd(X0 - 10, X1 + 10), y: rnd(Math.min(yw, ye), Math.max(yw, ye)), vx: rnd(-6, 6), vy: rnd(-6, 6) }); }
      while (pool.length > nPool) pool.pop();
      ctx.fillStyle = "rgba(59,130,246,.65)";
      for (const q of pool) { q.x += q.vx * dt; q.y += q.vy * dt; if (q.x < X0 - 12 || q.x > X1 + 12) q.vx = -q.vx;
        if ((q.y < top + 4 && q.vy < 0) || (q.y > bot - 4 && q.vy > 0) || (Math.abs(q.y - CY) < HW + 3)) q.vy = -q.vy;
        ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 7); ctx.fill(); }
      // generación de gotas según las fuerzas
      const K = c.id === "sis" ? 20 : 20, cd = cdf(V, p), li = E.linfa(p, c, V);
      const rate = x => clamp(K * x / c.L0, 0, 260);
      acc.sale += rate(fl.sale) * dt; acc.entra += rate(fl.entra) * dt; acc.linfa += rate(li) * 0.6 * dt; acc.prot += clamp((p.perm - 1.2) * 6, 0, 14) * dt;
      while (acc.sale >= 1 && cd.ss > 0 && gotas.length < 520) { acc.sale--; const l = Math.random() < .5 ? -1 : 1; gotas.push({ t: "sale", x: X0 + muestra(cd.s, cd.ss, cd.N) * (X1 - X0), y: CY + l * HW, l, d: rnd(24, 66), y0: CY + l * HW, vy: l * rnd(45, 75), vx: rnd(-8, 8) }); }
      while (acc.entra >= 1 && cd.ee > 0 && gotas.length < 520) { acc.entra--; const l = Math.random() < .5 ? -1 : 1, d = rnd(24, 60); gotas.push({ t: "entra", x: X0 + muestra(cd.e, cd.ee, cd.N) * (X1 - X0), y: CY + l * (HW + d), l, vy: -l * rnd(45, 75), vx: rnd(-6, 6) }); }
      while (acc.linfa >= 1 && gotas.length < 520) { acc.linfa--; gotas.push({ t: "linfa", x: rnd(BX - 130, BX + 30), y: rnd(top + 10, BY + 40), fase: 0 }); }
      while (acc.prot >= 1 && gotas.length < 520) { acc.prot--; const l = Math.random() < .5 ? -1 : 1; gotas.push({ t: "prot", x: X0 + Math.random() * (X1 - X0) * .6, y: CY + l * HW, l, d: rnd(30, 70), y0: CY + l * HW, vy: l * rnd(30, 50), vx: rnd(-6, 6) }); }
      for (let i = gotas.length - 1; i >= 0; i--) {
        const g = gotas[i]; let borrar = false, rad = 3, fill = "rgba(37,99,235,.95)";
        if (g.t === "sale" || g.t === "prot") { g.x += g.vx * dt; g.y += g.vy * dt; if (Math.abs(g.y - g.y0) > g.d) borrar = true; if (g.t === "prot") { fill = col["--am"]; rad = 3.3; } }
        else if (g.t === "entra") { g.x += g.vx * dt; g.y += g.vy * dt; if (Math.abs(g.y - CY) <= HW) borrar = true; fill = "rgba(22,163,74,.95)"; }
        else { fill = "rgba(124,58,237,.95)";
          if (g.fase === 0) { const dx = BX - g.x, dy = BY - g.y, d = Math.hypot(dx, dy); if (d < 6) g.fase = 1; else { g.x += dx / d * 80 * dt; g.y += dy / d * 80 * dt; } }
          else { g.x += 95 * dt; g.y += (BY - g.y) * .2; if (g.x > W + 6) borrar = true; } }
        if (borrar) { gotas.splice(i, 1); continue; }
        ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(g.x, g.y, rad, 0, 7); ctx.fill();
      }
      // rótulos
      ctx.fillStyle = col["--tx"]; ctx.textAlign = "left"; ctx.fillText("ARTERIAL", X0 + 4, CY - HW - 12 - (V > 0 ? 0 : 0));
      ctx.textAlign = "right"; ctx.fillText("VENOSO", X1 - 4, CY + HW + 14);
      ctx.textAlign = "left"; ctx.fillStyle = col["--tx2"]; ctx.fillText("intersticio", X0 - 14, top + 14); ctx.fillText("intersticio", X0 - 14, bot - 14);
      ctx.fillStyle = "#B91C1C"; ctx.fillText("↑ sale " + f(fl.sale, 1), X0 + 4, CY + HW + 14);
      ctx.fillStyle = "#16A34A"; ctx.textAlign = "right"; ctx.fillText("vuelve " + f(fl.entra, 1) + " ↓", X1 - 4, CY - HW - 12);
      ctx.textAlign = "left";
      // leyenda mínima
      ctx.font = "600 11px Fredoka, Nunito, system-ui, sans-serif"; ctx.fillStyle = col["--tx2"];
      ctx.fillText("● agua   ", 14, H - 12); ctx.fillStyle = col["--am"]; ctx.fillText("● albúmina", 70, H - 12);
      ctx.fillStyle = "#DC2626"; ctx.fillText("● glóbulo", 140, H - 12); ctx.fillStyle = col["--mo"]; ctx.fillText("● linfa", 200, H - 12);
      if (S.V >= (c.id === "sis" ? 5 : .6)) { ctx.fillStyle = col["--ro"]; ctx.font = "700 15px Fredoka, Nunito, sans-serif"; ctx.textAlign = "right"; ctx.fillText(c.id === "sis" ? "EDEMA" : "EDEMA ALVEOLAR", W - 14, H - 12); ctx.textAlign = "left"; }
    }
    function grafica() {
      const p = S.p, V = S.V, w = pw, h = pl.height / dpr, ym = c.id === "sis" ? 55 : 40;
      ptx.setTransform(dpr, 0, 0, dpr, 0, 0); ptx.clearRect(0, 0, w, h);
      const L = 40, R = 12, T = 12, B = 26, gx = x => L + x * (w - L - R), gy = v => T + (1 - clamp(v, 0, ym) / ym) * (h - T - B);
      ptx.font = "600 11px Fredoka, Nunito, system-ui, sans-serif"; ptx.textBaseline = "middle";
      ptx.strokeStyle = col["--borde"]; ptx.fillStyle = col["--tx2"]; ptx.lineWidth = 1; ptx.textAlign = "right";
      for (let v = 0; v <= ym; v += 10) { ptx.beginPath(); ptx.moveTo(L, gy(v)); ptx.lineTo(w - R, gy(v)); ptx.stroke(); ptx.fillText(v, L - 5, gy(v)); }
      ptx.textAlign = "center"; ptx.fillText("arterial", gx(0.04), h - 10); ptx.fillText("venoso", gx(0.96), h - 10); ptx.fillText("mmHg", 18, 8);
      const out = x => E.ndp(p, c, x, V) + E.sigma(p.perm) * (E.piP(p.alb) - p.pii);   // = Pc − Pi_efectiva
      const inn = E.sigma(p.perm) * (E.piP(p.alb) - p.pii);
      // zonas
      const N = 90;
      for (let i = 0; i < N; i++) { const x0 = i / N, x1 = (i + 1) / N, m = out((x0 + x1) / 2) - inn;
        ptx.fillStyle = m > 0 ? "rgba(185,28,28,.22)" : "rgba(22,163,74,.25)";
        ptx.beginPath(); ptx.moveTo(gx(x0), gy(out(x0))); ptx.lineTo(gx(x1), gy(out(x1))); ptx.lineTo(gx(x1), gy(inn)); ptx.lineTo(gx(x0), gy(inn)); ptx.closePath(); ptx.fill(); }
      ptx.lineWidth = 3; ptx.strokeStyle = "#B91C1C"; ptx.beginPath(); for (let i = 0; i <= N; i++) { const x = i / N; i ? ptx.lineTo(gx(x), gy(out(x))) : ptx.moveTo(gx(x), gy(out(x))); } ptx.stroke();
      ptx.strokeStyle = "#2563EB"; ptx.beginPath(); ptx.moveTo(gx(0), gy(inn)); ptx.lineTo(gx(1), gy(inn)); ptx.stroke();
      ptx.textAlign = "left"; ptx.fillStyle = "#B91C1C"; ptx.fillText("Pc − Pi = " + f(out(0), 0) + " → " + f(out(1), 0), gx(0.02), gy(out(0)) - 10);
      ptx.fillStyle = "#2563EB"; ptx.fillText("σ·(π plasma − π intersticio) = " + f(inn, 0), gx(0.30), gy(inn) + 12);
      const a = E.ndp(p, c, 0, V), vv = E.ndp(p, c, 1, V);
      ptx.textAlign = "right"; ptx.fillStyle = a > 0 ? "#B91C1C" : "#16A34A"; ptx.fillText("neta " + (a > 0 ? "+" : "") + f(a, 0) + " (sale)", gx(0.5), 8);
      ptx.textAlign = "right"; ptx.fillStyle = vv > 0 ? "#B91C1C" : "#16A34A"; ptx.fillText("neta " + (vv > 0 ? "+" : "") + f(vv, 0) + (vv > 0 ? " (sale)" : " (vuelve)"), w - R, 8);
    }

    /* ---- bucle ---- */
    dibujaSliders(); actualiza(true);
    let tprev = performance.now(), nfr = 0;
    (function bucle(t) {
      if (gen !== U.gen || !cv.isConnected) return;
      const dt = Math.min(0.05, (t - tprev) / 1000); tprev = t;
      if (!S.pausa) S.V = E.paso(S.V, S.p, c, dt * 0.12);       // 1 s ≈ 0,12 día del modelo
      if (S.modo === "esq") cuadro(t, S.pausa ? 0 : dt); else U.real.cuadro(ctx, escala, S, c, S.pausa ? 0 : dt);
      grafica();
      if (++nfr % 5 === 0) { balance(); U.tira($("#tira", sec), S, c); if (S.modo !== "esq") U.real.etiquetas($("#esc-eti", sec), S, c); const tt = textoCausal(); if (tt !== ult.txt) { $("#let", sec).innerHTML = tt; ult.txt = tt; } }
      requestAnimationFrame(bucle);
    })(tprev);
  };
})();
