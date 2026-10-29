/* ECG interactivo — núcleo: tema, router, papel milimetrado, corazón animado y simulador.
   Las demás secciones están en secciones.js y se registran en window.SECC. */
(function () {
  "use strict";
  const E = window.ECG, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const vista = $("#vista");
  const SECC = window.SECC = window.SECC || {};
  const U = window.UTIL = {};

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
  U.css = css; U.$ = $; U.$$ = $$;

  /* ---------- papel del ECG en un canvas ---------- */
  // mm: píxeles por milímetro; 25 mm/s y 10 mm/mV como en el electrocardiógrafo
  class Papel {
    constructor(cv, altoMm) { this.cv = cv; this.altoMm = altoMm; this.ajustar(); }
    ajustar() {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = this.cv.clientWidth || this.cv.parentNode.clientWidth || 600;
      this.mm = Math.max(2.2, Math.min(5, w / 160));
      this.W = w; this.H = Math.round(this.altoMm * this.mm);
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(this.H * dpr); this.cv.style.height = this.H + "px";
      this.c = this.cv.getContext("2d"); this.c.setTransform(dpr, 0, 0, dpr, 0, 0); this.dpr = dpr;
    }
    grilla(x0 = 0, x1 = this.W) {
      const c = this.c, mm = this.mm;
      c.save(); c.beginPath(); c.rect(x0, 0, x1 - x0, this.H); c.clip();
      c.fillStyle = css("--papel-ecg"); c.fillRect(x0, 0, x1 - x0, this.H);
      c.lineWidth = 1;
      for (let k = Math.floor(x0 / mm); k * mm <= x1; k++) {
        c.strokeStyle = k % 5 ? css("--linea-ecg") : css("--linea-ecg2"); c.beginPath(); c.moveTo(k * mm + .5, 0); c.lineTo(k * mm + .5, this.H); c.stroke();
      }
      for (let k = 0; k * mm <= this.H; k++) {
        c.strokeStyle = k % 5 ? css("--linea-ecg") : css("--linea-ecg2"); c.beginPath(); c.moveTo(x0, k * mm + .5); c.lineTo(x1, k * mm + .5); c.stroke();
      }
      c.restore();
    }
    // dibuja una derivación entre t0 y t1 desde la posición x (px) con línea de base y (px)
    trazo(ecg, der, t0, t1, x, y, color, ancho) {
      const c = this.c, mm = this.mm; c.strokeStyle = color || css("--traza"); c.lineWidth = ancho || 1.7; c.lineJoin = "round";
      c.beginPath();
      for (let t = t0, i = 0; t <= t1 + 1e-9; t += 0.002, i++) {
        const px = x + (t - t0) * 25 * mm, py = y - E.valor(ecg, der, t) * 10 * mm;
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    }
    calibracion(x, y) { // pulso de 1 mV = 10 mm
      const c = this.c, mm = this.mm; c.strokeStyle = css("--traza"); c.lineWidth = 1.5; c.beginPath();
      c.moveTo(x, y); c.lineTo(x + 2 * mm, y); c.lineTo(x + 2 * mm, y - 10 * mm); c.lineTo(x + 7 * mm, y - 10 * mm); c.lineTo(x + 7 * mm, y); c.lineTo(x + 9 * mm, y); c.stroke();
    }
    texto(t, x, y, color, tam) { const c = this.c; c.fillStyle = color || css("--az"); c.font = `600 ${tam || 13}px Fredoka, Nunito, sans-serif`; c.fillText(t, x, y); }
  }
  U.Papel = Papel;

  // 12 derivaciones en 3 filas de 4 columnas (2.5 s cada una) + tira de ritmo en DII (10 s)
  U.doce = function (cv, ecg, opc = {}) {
    const P = new Papel(cv, 1); const w = cv.clientWidth || 800;
    P.mm = (w - 4) / 262; P.H = Math.round(P.mm * 158);
    const dpr = P.dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(P.H * dpr); cv.style.height = P.H + "px"; P.c.setTransform(dpr, 0, 0, dpr, 0, 0); P.W = w;
    P.grilla();
    const L = [["DI", "aVR", "V1", "V4"], ["DII", "aVL", "V2", "V5"], ["DIII", "aVF", "V3", "V6"]], mm = P.mm, t0 = opc.t0 || 0.6;
    P.calibracion(2, 20 * mm);
    L.forEach((fila, r) => fila.forEach((d, k) => {
      const x = 12 * mm + k * 62.5 * mm, y = (20 + r * 36) * mm, a = t0 + k * 2.5;
      P.trazo(ecg, d, a, a + 2.5, x, y, (opc.resaltar || []).includes(d) ? css("--ro") : null, (opc.resaltar || []).includes(d) ? 2.2 : 1.5);
      P.texto(d, x + 3, y - 12 * mm, (opc.resaltar || []).includes(d) ? css("--ro") : css("--az"), Math.max(11, mm * 3.2));
      if (k) { P.c.strokeStyle = css("--traza"); P.c.lineWidth = 1; P.c.beginPath(); P.c.moveTo(x, y - 4 * mm); P.c.lineTo(x, y + 4 * mm); P.c.stroke(); }
    }));
    const y = 136 * mm; P.trazo(ecg, opc.ritmo || "DII", t0, t0 + 10, 12 * mm, y); P.texto((opc.ritmo || "DII") + " · tira de ritmo", 12 * mm + 3, y - 12 * mm, null, Math.max(11, mm * 3.2));
    return P;
  };
  // una tira simple de una derivación
  U.tira = function (cv, ecg, der, seg, altoMm, opc = {}) {
    const P = new Papel(cv, altoMm || 30), mm = (cv.clientWidth - 4) / (seg * 25 + 6);
    P.mm = mm; P.H = Math.round((altoMm || 30) * mm); const dpr = P.dpr;
    cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(P.H * dpr); cv.style.height = P.H + "px"; P.c.setTransform(dpr, 0, 0, dpr, 0, 0); P.W = cv.clientWidth;
    P.grilla(); const y = (opc.base || (altoMm || 30) * 0.6) * mm;
    P.trazo(ecg, der, opc.t0 || 0.3, (opc.t0 || 0.3) + seg, 5 * mm, y, null, opc.ancho || 1.8);
    if (opc.rotulo !== false) P.texto(der, 5 * mm + 4, 4 * mm + 6, null, Math.max(12, mm * 3.4));
    P.y0 = y; P.x0 = 5 * mm;
    return P;
  };

  /* ---------- el corazón animado (sobre la ilustración de ChatGPT) ---------- */
  // coordenadas en píxeles de img/corazon.webp (1536 × 1024)
  const GEO = {
    sa: [590, 248], av: [718, 372], his: [780, 432], escape: [800, 600],
    internodal: "M590,248 C628,292 690,330 718,372", bachmann: "M598,252 C700,238 820,272 905,330",
    hisP: "M718,372 L780,432",
    rd: "M780,432 C786,520 792,610 795,700", kent: "M1000,440 C1010,470 1016,500 1020,530",
    ri: "M786,436 C832,522 882,632 930,730 C950,770 975,795 1005,805",
    purkD: ["M795,640 C760,650 700,660 650,650", "M795,690 C760,720 720,752 690,782", "M797,700 C800,760 820,800 852,832"],
    purkI: ["M930,730 C980,720 1030,700 1062,690", "M962,772 C992,802 1020,830 1042,842", "M936,742 C930,800 942,852 962,902", "M902,652 C952,632 1002,604 1052,592"],
    RA: "495,270 560,232 640,262 720,300 735,420 650,470 530,485 480,400",
    LA: "830,300 900,252 1010,266 1060,330 1066,420 960,452 860,432",
    RV: "470,492 640,482 760,470 800,560 822,700 872,862 760,822 600,702 500,602",
    LV: "820,420 1062,402 1112,472 1122,622 1082,782 1022,902 962,962 902,902 862,762 832,602 802,482"
  };
  U.GEO = GEO;
  U.corazon = function (cont, opc = {}) {
    const u = "z" + (U._nz = (U._nz || 0) + 1);   // ids únicos por si hay varios corazones en la página
    cont.innerHTML = `<div class="lienzo"><img src="img/corazon.webp" alt="Corte frontal del corazón con el sistema de conducción" width="1536" height="1024">
      <svg class="sobre" viewBox="0 0 1536 1024" aria-hidden="true">
        <defs><filter id="${u}brillo" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
          <filter id="${u}suave"><feGaussianBlur stdDeviation="16"/></filter>
          <radialGradient id="${u}gA" gradientUnits="userSpaceOnUse" cx="${GEO.sa[0]}" cy="${GEO.sa[1]}" r="1"><stop offset="0" stop-color="#ffd60a" stop-opacity=".95"/><stop offset=".8" stop-color="#ffd60a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd60a" stop-opacity="0"/></radialGradient>
          <radialGradient id="${u}gR" gradientUnits="userSpaceOnUse" cx="1000" cy="560" r="1"><stop offset="0" stop-color="#3b82f6" stop-opacity=".9"/><stop offset=".8" stop-color="#3b82f6" stop-opacity=".6"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient></defs>
        <g id="h-aur" opacity="0" filter="url(#${u}suave)"><polygon points="${GEO.RA}" fill="url(#${u}gA)"/><polygon points="${GEO.LA}" fill="url(#${u}gA)"/></g>
        <g id="h-fa" filter="url(#${u}suave)"></g>
        <polygon id="h-vd" points="${GEO.RV}" fill="#ff2d20" opacity="0" filter="url(#${u}suave)"/>
        <polygon id="h-vi" points="${GEO.LV}" fill="#ff2d20" opacity="0" filter="url(#${u}suave)"/>
        <g id="h-rep" opacity="0" filter="url(#${u}suave)"><polygon points="${GEO.RV}" fill="url(#${u}gR)"/><polygon points="${GEO.LV}" fill="url(#${u}gR)"/></g>
        <g id="h-vias" fill="none" stroke-linecap="round">
          ${[["internodal", GEO.internodal], ["bachmann", GEO.bachmann], ["hisP", GEO.hisP], ["rd", GEO.rd], ["ri", GEO.ri], ["kent", GEO.kent]]
            .map(([k, d]) => `<path id="h-${k}" d="${d}" stroke="#ffe066" stroke-width="18" opacity="0" filter="url(#${u}brillo)"/><path id="h-${k}2" d="${d}" stroke="#fff4b0" stroke-width="6" opacity="0"/>`).join("")}
          ${GEO.purkD.map((d, i) => `<path class="h-pd" d="${d}" stroke="#ffe066" stroke-width="9" opacity="0" filter="url(#${u}brillo)"/>`).join("")}
          ${GEO.purkI.map((d, i) => `<path class="h-pi" d="${d}" stroke="#ffe066" stroke-width="9" opacity="0" filter="url(#${u}brillo)"/>`).join("")}
        </g>
        <circle id="h-sa" cx="${GEO.sa[0]}" cy="${GEO.sa[1]}" r="16" fill="#ffd60a" opacity=".25" filter="url(#${u}brillo)"/>
        <circle id="h-av" cx="${GEO.av[0]}" cy="${GEO.av[1]}" r="15" fill="#ff9f0a" opacity=".25" filter="url(#${u}brillo)"/>
        <circle id="h-esc" cx="${GEO.escape[0]}" cy="${GEO.escape[1]}" r="18" fill="#ff453a" opacity="0" filter="url(#${u}brillo)"/>
        <circle id="h-punto" r="9" fill="#fff" stroke="#ff9f0a" stroke-width="4" opacity="0"/>
        <g id="h-x" opacity="0" stroke="#d00000" stroke-width="10" stroke-linecap="round"><line x1="-20" y1="-20" x2="20" y2="20"/><line x1="20" y1="-20" x2="-20" y2="20"/></g>
        <g id="h-eti" font-size="30">${opc.etiquetas === false ? "" : `
          <text class="eti" x="${GEO.sa[0] - 150}" y="${GEO.sa[1] - 40}" fill="#9a6b00">Nódulo sinusal</text>
          <text class="eti" x="${GEO.av[0] - 225}" y="${GEO.av[1] + 12}" fill="#b45309">Nódulo AV →</text>
          <text class="eti" x="1110" y="300" fill="#7c2d12">Aurícula izq.</text><text class="eti" x="270" y="300" fill="#7c2d12">Aurícula der.</text>
          <text class="eti" x="250" y="650" fill="#7f1d1d">Ventrículo der.</text><text class="eti" x="1150" y="650" fill="#7f1d1d">Ventrículo izq.</text>`}</g>
      </svg></div>`;
    const S = cont.querySelector("svg"), g = id => S.querySelector("#" + id);
    const paths = {}; ["internodal", "bachmann", "hisP", "rd", "ri", "kent"].forEach(k => paths[k] = g("h-" + k));
    const sparks = g("h-fa");
    for (let i = 0; i < 14; i++) sparks.insertAdjacentHTML("beforeend", `<circle r="20" fill="#ffd60a" opacity="0"/>`);
    const punto = g("h-punto"), X = g("h-x");
    const ilum = (k, v) => { g("h-" + k).setAttribute("opacity", v * 0.95); g("h-" + k + "2").setAttribute("opacity", v); };
    const enPath = (k, f) => { const p = paths[k], L = p.getTotalLength(), q = p.getPointAtLength(L * Math.max(0, Math.min(1, f))); return [q.x, q.y]; };
    return function pintar(e, cfg) {
      const tipo = cfg.tipo;
      g("h-sa").setAttribute("opacity", ["fa", "flutter", "fv", "asistolia", "tv", "torsades"].includes(tipo) ? 0.12 : 0.25 + e.sa * 0.75); g("h-sa").setAttribute("r", 16 + e.sa * 10);
      S.querySelector("#" + u + "gA").setAttribute("r", e.aur ? 60 + (e.pOn ? e.aurFrente : 1) * 560 : 1);
      g("h-aur").setAttribute("opacity", tipo === "fa" ? 0 : e.aur * 0.6);
      ilum("internodal", e.pOn ? 1 : e.aur * 0.4); ilum("bachmann", e.pOn ? 0.9 : e.aur * 0.3);
      g("h-av").setAttribute("opacity", 0.25 + e.av * 0.75); g("h-av").setAttribute("r", 15 + e.av * 8);
      ilum("hisP", e.his || (e.ven && e.venFrente < 0.4) ? 1 : 0);
      ilum("rd", e.rd); ilum("ri", e.ri); ilum("kent", e.kent ? 1 : tipo === "wpw" ? 0.25 : 0);
      $$(".h-pd", S).forEach(p => p.setAttribute("opacity", tipo === "bcrd" ? 0 : e.purk * 0.9));
      $$(".h-pi", S).forEach(p => p.setAttribute("opacity", tipo === "bcri" || e.escape ? 0 : e.purk * 0.9));
      S.querySelector("#" + u + "gR").setAttribute("r", e.rep ? 80 + e.rep * 640 : 1); g("h-rep").setAttribute("opacity", e.rep ? 0.45 * (1 - Math.max(0, e.rep - 0.7) / 0.3) : 0);
      g("h-esc").setAttribute("opacity", e.escape ? 0.95 : 0);
      // fibrilación: chispas al azar en las paredes auriculares
      [...sparks.children].forEach((c, i) => {
        if (tipo === "fa" && Math.random() < 0.5) {
          const enDer = Math.random() < 0.5, x = enDer ? 540 + Math.random() * 170 : 880 + Math.random() * 160, y = 300 + Math.random() * 130;
          c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("opacity", 0.3 + Math.random() * 0.5); c.setAttribute("fill", "#ffd60a");
        } else if (e.fv && Math.random() < 0.6) {   // fibrilación ventricular: chispas caóticas en los ventrículos
          const x = 560 + Math.random() * 500, y = 520 + Math.random() * 330;
          c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("opacity", 0.35 + Math.random() * 0.5); c.setAttribute("fill", "#ff453a");
        } else if (e.flutter != null && i < 5) {   // flutter: un frente que gira en círculo dentro de la aurícula derecha
          const a = 2 * Math.PI * (e.flutter - i * 0.035);
          c.setAttribute("cx", 600 + 85 * Math.cos(a)); c.setAttribute("cy", 360 + 60 * Math.sin(a)); c.setAttribute("opacity", 0.85 - i * 0.15); c.setAttribute("fill", "#ffd60a");
        } else c.setAttribute("opacity", 0);
      });
      g("h-vd").setAttribute("opacity", e.fv ? 0.15 + Math.random() * 0.2 : e.vd * 0.42); g("h-vi").setAttribute("opacity", e.fv ? 0.15 + Math.random() * 0.2 : e.vi * 0.42);
      // el punto blanco: el impulso viajando
      let pt = null;
      if (tipo !== "fa" && e.pOn && !e.pEct) pt = enPath("internodal", e.aurFrente * 1.1);
      else if (e.his && !e.escape) pt = GEO.his;
      punto.setAttribute("opacity", pt ? 1 : 0); if (pt) { punto.setAttribute("cx", pt[0]); punto.setAttribute("cy", pt[1]); }
      // la X roja: dónde se corta el impulso
      let xp = null;
      if (e.bloqueo || tipo === "bav3") xp = [GEO.av[0] + 22, GEO.av[1] + 26];
      if (tipo === "bcrd") xp = enPath("rd", 0.3);
      if (tipo === "bcri") xp = enPath("ri", 0.2);
      X.setAttribute("opacity", xp ? (tipo === "bav3" || tipo.startsWith("bc") ? 0.9 : e.bloqueo) : 0);
      if (xp) X.setAttribute("transform", `translate(${xp[0]},${xp[1]})`);
    };
  };

  /* ---------- textos de cada patrón (teoría del docente, Sotomayor 2020) ---------- */
  U.TEXTOS = {
    normal: { que: "El estímulo nace en el <b>nódulo sinusal</b>, despolariza las aurículas (onda P), se frena en el <b>nódulo AV</b> (segmento PR), baja por el <b>haz de His</b>, sus ramas y las <b>fibras de Purkinje</b> (QRS) y los ventrículos se repolarizan (onda T).",
      ecg: ["FC <span class=dato>60-100 lpm</span>, ritmo regular", "P positiva en DI, DII y aVF, negativa en aVR, antes de cada QRS", "PR <span class=dato>0.12-0.20 s</span> · QRS <span class=dato>&lt; 0.12 s</span> · QT <span class=dato>0.34-0.44 s</span>", "Eje entre 0° y +90°"] },
    taqui: { que: "El nódulo sinusal descarga más rápido: más tono simpático o menos tono vagal.", ecg: ["FC <span class=dato>&gt; 100 lpm</span> (hasta 150 en el adulto, 180 en el niño)", "Cada P sigue conduciendo; PR acortado", "El QT se acorta (a mayor FC, menor QT)"],
      causa: "Fisiológica (niño, esfuerzo, emoción), fármacos (atropina, noradrenalina, aerosoles del asma), patológica (fiebre, hipoxia, hemorragia, anemia, hipertiroidismo, IC, shock: compensa el débito)." },
    bradi: { que: "El nódulo sinusal descarga más lento: más tono vagal o menos simpático; el ciclo se alarga a expensas de la diástole.", ecg: ["FC <span class=dato>&lt; 60 lpm</span> (40-60); severa: 30-40", "P normal; PR alargado"],
      causa: "Atletas, sueño, ancianos; digitálicos, betabloqueadores, verapamilo, diltiazem; IAM inferior, hipotiroidismo, hipertensión endocraneana." },
    arritmia: { que: "La FC cambia con la respiración por variaciones del tono vagal: <b>sube al inspirar</b> y baja al espirar.", ecg: ["Ritmo sinusal (P normal antes de cada QRS) pero RR variable", "Desaparece con el ejercicio o con apnea"], causa: "Fisiológica en niños y adolescentes; no necesita tratamiento." },
    bav1: { que: "Toda P conduce, pero el impulso se <b>retarda en el nódulo AV</b>.", ecg: ["PR <span class=dato>&gt; 0.20 s</span> y <b>constante</b> (aquí 0.28 s)", "Una P por cada QRS"], causa: "Degenerativas, calcificación del nódulo AV, IAM, Chagas, digitálicos, betabloqueadores, verapamilo/diltiazem." },
    mobitz1: { que: "<b>Fenómeno de Wenckebach</b> (nódulo AV): cada impulso pasa con más retardo que el anterior hasta que uno no pasa.", ecg: ["PR se <b>alarga progresivamente</b>", "Hasta que una P <b>no va seguida de QRS</b>", "Luego el ciclo vuelve a empezar"] },
    mobitz2: { que: "Bloqueo <b>infranodal</b>: el PR no cambia pero de pronto una P no conduce.", ecg: ["PR <b>constante y normal</b>", "2 a 4 P por cada QRS (aquí 2:1)", "FC ventricular <span class=dato>40-60 lpm</span>"], causa: "Se asocia a bloqueo de rama y tiende a progresar al bloqueo total." },
    bav3: { que: "<b>Disociación AV total</b>: ningún impulso auricular cruza; aurículas y ventrículos laten con marcapasos independientes (el de escape está abajo).", ecg: ["Más P que QRS, <b>sin relación</b> entre ellas", "Frecuencia auricular ~80 lpm, ventricular <span class=dato>30-40 lpm</span>", "QRS ancho (morfología de bloqueo de rama)"],
      causa: "Chagas, miocardioesclerosis. Clínica: síncope con convulsiones (<b>Stokes-Adams</b>). Tratamiento: atropina; si no responde, marcapaso definitivo." },
    fa: { que: "El nódulo sinusal deja de mandar: la pared auricular descarga en caos a <span class=dato>400-600 lpm</span>. El nódulo AV hace de <b>barrera</b> y deja pasar solo algunos estímulos, irregularmente.", ecg: ["<b>No hay onda P</b>: ondas f irregulares", "RR <b>irregular</b>", "Respuesta ventricular alta si &gt; 100 lpm"],
      causa: "Estenosis mitral, Chagas, cardiopatía coronaria, hipertiroidismo, sepsis, alcohol. Clínica: pulso irregular, <b>déficit de pulso</b>, riesgo de trombos y embolias." },
    bcrd: { que: "La <b>rama derecha</b> (delgada y larga, la más vulnerable al Chagas) no conduce: el VD se activa tarde, a través del músculo.", ecg: ["QRS <span class=dato>&gt; 0.12 s</span>", "V1-V2: <b>M (RSR')</b> con T invertida", "S ancha en DI, aVL, V5, V6", "Eje +90° a +120°"], causa: "Personas normales, HTA, cardiopatía reumática; Chagas en zonas endémicas." },
    bcri: { que: "La <b>rama izquierda</b> no conduce: el septo y el VI se activan desde la derecha, tarde y lento.", ecg: ["QRS ancho", "DI, aVL, V5, V6: R ancha/mellada (M) con T invertida", "V1-V2: S ancha y profunda", "Eje −30° a −45°"], causa: "Cardiopatía isquémica: obliga a vigilar por riesgo de infarto." },
    had: { que: "La aurícula derecha agrandada aumenta el primer componente de la P.", ecg: ["<b>P pulmonar</b>: alta y picuda, <span class=dato>&gt; 2.5 mm</span> en DII, DIII, aVF", "Duración normal", "V1: componente inicial mayor que el terminal"], causa: "Cor pulmonar crónico, hipertensión pulmonar, valvulopatía tricuspídea." },
    hai: { que: "La aurícula izquierda agrandada se activa tarde y más tiempo.", ecg: ["<b>P mitrale</b>: bimodal, <span class=dato>&gt; 0.12 s</span> en DII", "V1: componente terminal lento, &gt; 0.04 s y &gt; 1 mm"], causa: "Estenosis e insuficiencia mitral." },
    hvd: { que: "El VD hipertrofiado gana peso al vector del QRS (normalmente el VI tiene 3-4 veces más masa).", ecg: ["Eje a la derecha (&gt; +90°)", "V1: R &gt; S; V6: S &gt; R", "T invertida V1-V4", "Cabrera R/(R+S) en V1 &gt; 0.5"], causa: "Cor pulmonar crónico, hipertensión pulmonar; en la altura, por hipoxia crónica." },
    hvi: { que: "Más masa del VI: QRS de mayor voltaje, eje a la izquierda.", ecg: ["<b>Sokolow-Lyon</b>: S V1 + R V5/V6 <span class=dato>≥ 35 mm</span>", "R DI + S DIII ≥ 25 mm", "T invertida y asimétrica en V5-V6 (sobrecarga)", "Eje −30°"], causa: "Presión: HTA, estenosis aórtica. Volumen: insuficiencia mitral o aórtica." },
    esa: { que: "Un foco de la aurícula, distinto del nódulo sinusal, dispara antes de tiempo. La P adelantada tiene otra forma y el QRS es normal, porque baja por la vía de siempre.", ecg: ["P <b>prematura y distinta</b> (aquí negativa en DII)", "QRS estrecho, igual a los demás", "Pausa <b>no compensadora</b>: el foco reinicia al nódulo sinusal"], causa: "Café, tabaco, alcohol, estrés, cardiopatías con aurícula dilatada. Casi siempre benignas. <span class=lit>literatura</span>" },
    esv: { que: "Un foco del ventrículo dispara antes del latido sinusal. El impulso no usa el His-Purkinje: viaja lento por el músculo, por eso el QRS es <b>ancho y raro</b>.", ecg: ["QRS <b>adelantado, ancho (&gt; 0.12 s) y sin P</b> delante", "T <b>opuesta</b> al QRS", "Pausa <b>compensadora completa</b>: la P sinusal siguiente queda escondida"], causa: "Docente: aparecen en la hipopotasemia y tras el infarto, donde pueden pasar a taquicardia ventricular y fibrilación. También café, estrés, digitálicos." },
    bigem: { que: "Cada latido sinusal va seguido de una extrasístole ventricular: <b>normal-extrasístole, normal-extrasístole</b>. Al tomar el pulso se nota el <b>pulso bigeminado</b>.", ecg: ["Alternan un QRS normal y uno ancho adelantado", "Pausa compensadora después de cada extrasístole"], causa: "Típico de la intoxicación digitálica y de la hipopotasemia. <span class=lit>literatura</span>" },
    flutter: { que: "Un circuito de reentrada gira en la aurícula derecha a unos <span class=dato>300 por minuto</span>. El nódulo AV no deja pasar todos: conduce 2:1, 3:1 o 4:1.", ecg: ["Ondas <b>F en diente de sierra</b>, sin línea de base, mejor vistas en DII, DIII y aVF", "QRS estrecho y regular", "FC ventricular = 300 ÷ conducción (2:1 → 150, 4:1 → 75)"], causa: "Cardiopatías con aurícula dilatada, EPOC, posoperatorio cardiaco. Una FC fija de 150 debe hacer pensar en flutter 2:1. <span class=lit>literatura</span>" },
    tsv: { que: "Un circuito de reentrada en el nódulo AV (o por una vía accesoria) dispara de golpe: empieza y termina bruscamente (paroxística).", ecg: ["FC <span class=dato>150-250 lpm</span>, muy regular", "QRS <b>estrecho</b>", "P escondida dentro del QRS o justo después"], causa: "Jóvenes sin cardiopatía; palpitaciones súbitas. Maniobras vagales (Valsalva, masaje carotídeo) o adenosina la cortan. <span class=lit>literatura</span>" },
    tv: { que: "Un foco ventricular dispara en salvas: tres o más extrasístoles ventriculares seguidas. Los ventrículos laten rápido y llenan mal.", ecg: ["FC <span class=dato>&gt; 100 lpm</span> (aquí 170), regular", "QRS <b>ancho y monomorfo</b>", "Disociación AV: P sueltas que no se relacionan con el QRS"], causa: "Docente: tras el infarto las extrasístoles ventriculares pueden pasar a taquicardia ventricular y de ahí a fibrilación (muerte en 24-48 h). También hipopotasemia y cardiopatías dilatadas." },
    torsades: { que: "Taquicardia ventricular <b>polimorfa</b>: el eje del QRS gira y la amplitud crece y decrece, como si el trazado se retorciera sobre la línea de base.", ecg: ["QRS ancho cuya amplitud y polaridad cambian cada pocos latidos", "Aparece sobre un <b>QT largo</b>"], causa: "QT largo: hipopotasemia, hipomagnesemia, hipocalcemia, fármacos (antiarrítmicos, macrólidos). Se trata con sulfato de magnesio. <span class=lit>literatura</span>" },
    fv: { que: "Miles de focos ventriculares descargan en caos: el ventrículo <b>tiembla y no bombea</b>. No hay pulso: es un <b>paro cardiaco</b>.", ecg: ["Ondas <b>irregulares y caóticas</b>, sin P, QRS ni T", "No se puede medir FC"], causa: "Docente: infarto (arritmias, la principal causa de muerte precoz), hiperpotasemia grave (riesgo con K &gt; 9 mEq/L). Tratamiento: desfibrilación inmediata." },
    asistolia: { que: "No hay actividad eléctrica: el corazón está parado. Es la forma más grave de paro cardiaco.", ecg: ["Línea casi plana", "Comprobar en dos derivaciones y que los electrodos estén bien puestos"], causa: "Docente: la hiperpotasemia aguda severa puede terminar en paro (asistolia). No se desfibrila: RCP y adrenalina. <span class=lit>literatura</span>" },
    wpw: { que: "Existe un <b>haz de Kent</b>, una vía accesoria que une aurícula y ventrículo saltándose el nódulo AV. Parte del ventrículo se activa antes (preexcitación).", ecg: ["PR <b>corto</b> (&lt; 0.12 s)", "<b>Onda delta</b>: empastamiento inicial del QRS", "QRS ancho (≈ 0.12 s)"], causa: "Predispone a taquicardias por reentrada; con fibrilación auricular puede ser peligroso. <span class=lit>literatura</span>" },
    pericarditis: { que: "La inflamación del pericardio irrita el epicardio de <b>todo</b> el corazón, no de un territorio: por eso el ST sube en casi todas las derivaciones.", ecg: ["ST supradesnivelado <b>cóncavo y difuso</b> (todas menos aVR y V1)", "<b>PR descendido</b>", "Sin onda Q ni imagen en espejo (eso la distingue del infarto)"], causa: "Virus, posinfarto, uremia, tuberculosis. Dolor que mejora al sentarse e inclinarse hacia adelante. <span class=lit>literatura</span>" },
    iam: { que: "Una coronaria se ocluye: el territorio pasa por <b>isquemia</b> (onda T) → <b>lesión</b> (ST) → <b>necrosis</b> (onda Q). Las derivaciones que miran la zona muestran el cambio; las opuestas, la imagen en espejo.", ecg: ["Isquemia → T · Lesión → ST · Necrosis → Q", "La Q persiste para siempre", "Isquemia y lesión son reversibles"] }
  };

  /* ---------- sonido del monitor (sintetizado, sin archivos) ---------- */
  let ac = null;
  U.audio = () => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === "suspended") ac.resume(); } catch (e) {} return ac; };
  U.pitido = (f = 880, dur = 0.07) => {
    const c = U.audio(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = "sine"; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  };
  /* ---------- qué le pasa al ECG con el potasio y el calcio ---------- */
  U.textoElectro = function (K, Ca) {
    const p = [];
    if (K >= 8.5) p.push(`<b>K ${K.toFixed(1)}: hiperpotasemia gravísima.</b> El QRS se ensancha tanto que se funde con la T en una <b>onda sinusoidal</b>; inminente fibrilación ventricular o asistolia (docente: riesgo de FV con K &gt; 9).`);
    else if (K >= 7) p.push(`<b>K ${K.toFixed(1)}: hiperpotasemia grave.</b> Docente: <b>P aplanada</b>, <b>QRS ancho</b> y T picuda; luego complejos ventriculares y arritmias.`);
    else if (K >= 6.5) p.push(`<b>K ${K.toFixed(1)}: hiperpotasemia moderada.</b> T alta y picuda; la P empieza a aplanarse y el PR se alarga.`);
    else if (K > 5.5) p.push(`<b>K ${K.toFixed(1)}: hiperpotasemia leve.</b> Docente: onda <b>T alta, picuda y simétrica</b> (en tienda de campaña).`);
    else if (K < 2.5) p.push(`<b>K ${K.toFixed(1)}: hipopotasemia grave.</b> T casi plana, <b>onda U grande</b> (puede parecer un QT largo), ST descendido; riesgo de extrasístoles, TV y torsades.`);
    else if (K < 3.5) p.push(`<b>K ${K.toFixed(1)}: hipopotasemia.</b> Docente: <b>P y T aplanadas</b>, aparece la <b>onda U</b>, extrasístoles.`);
    if (Ca < 8.5) p.push(`<b>Ca ${Ca.toFixed(1)}: hipocalcemia.</b> El <b>ST se alarga</b> → QT largo. <span class=lit>literatura</span>`);
    else if (Ca > 10.5) p.push(`<b>Ca ${Ca.toFixed(1)}: hipercalcemia.</b> El ST se acorta → <b>QT corto</b>. <span class=lit>literatura</span>`);
    return p.map(x => `<p style="margin:4px 0">🧪 ${x}</p>`).join("");
  };

  /* ---------- simulador ---------- */
  let anim = null;
  U.detener = () => { if (anim) cancelAnimationFrame(anim); anim = null; U.alRedimensionar = null; };
  SECC.sim = function (main) {
    const grupos = {};
    Object.entries(E.PATRONES).forEach(([k, p]) => (grupos[p.grupo] = grupos[p.grupo] || []).push([k, p]));
    main.innerHTML = `<h1>Simulador: el corazón y su electrocardiograma</h1>
      <p class="lema">Mira cómo el impulso nace en el nódulo sinusal y recorre el corazón mientras el trazado se dibuja en el papel a <b>25 mm/s</b>. Elige un ritmo o una patología, cámbiale la velocidad y mira dónde se frena o se corta el impulso.</p>
      <div class="grid2"><div><div id="corazon"></div>
        <div class="letrero" id="letrero"><span class="k" id="onda-k">—</span><span><span id="onda-n">…</span><span class="nota" id="onda-d" style="display:block;font-weight:500"></span></span></div>
        <div class="caja" style="padding:10px 12px"><div class="ctrl" style="margin:0">
          <button class="btn sec" id="atras" title="Etapa anterior (←)">⏮ Etapa anterior</button>
          <button class="btn" id="pausa" title="Pausa / seguir (barra espaciadora)">⏸ Pausa</button>
          <button class="btn sec" id="adelante" title="Etapa siguiente (→)">Etapa siguiente ⏭</button>
          <button class="btn sec" id="fino" title="Avanzar 0.02 s (Shift + →)">+0.02 s</button></div>
          <div class="ctrl" style="margin:6px 0 0"><label>Velocidad <input type="range" id="vel-r" min="0" max="100" step="1"> <b id="vel-v"></b></label>
          <span class="nota">Atajos: <span class="kbd">espacio</span> pausa · <span class="kbd">→</span> <span class="kbd">←</span> etapa · <span class="kbd">Shift</span>+<span class="kbd">→</span> avance fino</span></div></div>
        <div class="caja" style="padding:10px"><canvas class="ecg" id="monitor"></canvas>
        <div class="ctrl" style="justify-content:space-between;margin-bottom:0"><span class="nota">Cuadradito: <b>0.04 s</b> × <b>1 mm</b> (0.1 mV) · cuadrado grande: <b>0.20 s</b> × <b>5 mm</b></span>
          <a class="btn sec" href="#patologia" id="ver12">📄 Ver las 12 derivaciones</a></div></div></div>
      <div><div class="caja"><h3 style="margin-top:0">Ritmo o patología</h3>
        ${Object.entries(grupos).map(([g, ls]) => `<div class="nota">${g}</div><div class="chips">${ls.map(([k, p]) => `<button class="chip" data-tipo="${k}">${p.nombre.replace(/ \(.*\)$/, "")}</button>`).join("")}</div>`).join("")}
        <div id="iam-opc" style="display:none"><div class="ctrl"><label>Región <select id="iam-reg">${Object.entries(E.REGIONES).map(([k, r]) => `<option value="${k}">${r.nombre}</option>`).join("")}</select></label>
          <label>Fase <select id="iam-fase">${Object.entries(E.FASES).map(([k, f]) => `<option value="${k}">${f.split(":")[0]}</option>`).join("")}</select></label></div></div>
        <div class="ctrl"><span class="chips" id="vel">${[[0.05, "🐢 ×0.05"], [0.1, "×0.1"], [0.25, "×0.25"], [0.5, "×0.5"], [1, "×1 real"]].map(([v, n]) => `<button class="chip" data-v="${v}">${n}</button>`).join("")}</span></div>
        <div class="ctrl"><label id="fc-l">FC <input type="range" id="fc" min="30" max="180" step="1"> <b id="fc-v"></b> lpm</label>
          <label>Derivación <select id="der">${E.LISTA12.map(d => `<option>${d}</option>`).join("")}</select></label>
</div>
        <div class="ctrl"><label title="Potasio sérico">K⁺ <input type="range" id="k" min="1.5" max="9.5" step="0.1"> <b id="k-v"></b> mEq/L</label>
          <label title="Calcio sérico">Ca²⁺ <input type="range" id="ca" min="6" max="14" step="0.1"> <b id="ca-v"></b> mg/dL</label>
          <button class="chip" id="elec-0" title="Volver a K 4.2 y Ca 9.5">↺ Normales</button>
          <button class="chip" id="sonido" title="Pitido del monitor en cada QRS">🔇 Sonido</button></div>
      </div>
      <div class="caja info" id="explica"></div></div></div>`;
    const st = { tipo: "normal", fc: 75, vel: 0.25, der: "DII", region: "anteroseptal", fase: "les_epi", pausa: false, k: 4.2, ca: 9.5, sonido: false };
    try { Object.assign(st, JSON.parse(sessionStorage.getItem("ecg-sim") || "{}")); } catch (e) {}
    const pintar = U.corazon($("#corazon"));
    const cv = $("#monitor"); let P = new Papel(cv, 34);
    let ecg, T = 0, tEcg = 0, xPrev = 0, ultimo = performance.now();
    const ventana = () => P.W / P.mm / 25;  // segundos que caben en el monitor
    function armar() {
      const cfg = { tipo: st.tipo, fc: st.fc, region: st.region, fase: st.fase, k: st.k, ca: st.ca, semilla: 1 + Math.floor(Math.random() * 1e6) };
      ecg = E.construir(cfg, 600); tEcg = 0; T = 0; BORDES = etapas();
      try { sessionStorage.setItem("ecg-sim", JSON.stringify(st)); } catch (e) {}
      $$("[data-tipo]").forEach(b => b.classList.toggle("act", b.dataset.tipo === st.tipo));
      pintaVel();
      $("#iam-opc").style.display = st.tipo === "iam" ? "" : "none";
      const pat = E.PATRONES[st.tipo], fcLibre = ["normal", "taqui", "bradi", "fa", "bav3", "flutter", "tsv", "tv", "torsades", "esa", "esv", "bigem", "wpw", "pericarditis", "bav1"].includes(st.tipo);
      $("#fc-l").style.opacity = fcLibre ? 1 : .45; $("#fc").disabled = !fcLibre; $("#fc").value = st.fc; $("#fc-v").textContent = st.fc;
      $("#der").value = st.der; $("#iam-reg").value = st.region; $("#iam-fase").value = st.fase;
      $("#k").value = st.k; $("#k-v").textContent = st.k.toFixed(1); $("#ca").value = st.ca; $("#ca-v").textContent = st.ca.toFixed(1);
      $("#sonido").textContent = st.sonido ? "🔊 Sonido" : "🔇 Sonido"; $("#sonido").classList.toggle("act", st.sonido);
      const tx = U.TEXTOS[st.tipo] || {};
      let extra = "";
      if (st.tipo === "iam") { const R = E.REGIONES[st.region]; extra = `<p><b>${E.FASES[st.fase]}</b>.<br>Lo ven: <b>${R.ve.join(", ")}</b> · espejo en ${R.espejo.join(", ")} · arteria: ${R.arteria}.</p>`; }
      if (st.tipo === "flutter") extra += `<p>Conducción actual: <b>${ecg.cfg.cond}:1</b> → FC ventricular ≈ ${Math.round(300 / ecg.cfg.cond)} lpm (mueve la FC para cambiarla).</p>`;
      const el = U.textoElectro(st.k, st.ca); if (el) extra += `<div class="caja" style="margin:8px 0;background:color-mix(in srgb,var(--am) 14%,var(--papel))">${el}</div>`;
      $("#explica").innerHTML = `<h3 style="margin-top:0">${pat.nombre}</h3><p>${tx.que || ""}</p>${extra}<ul>${(tx.ecg || []).map(x => `<li>${x}</li>`).join("")}</ul>${tx.causa ? `<p class="nota">${tx.causa}</p>` : ""}`;
      $("#ver12").href = "#patologia/" + st.tipo;
    }
    function inicio() { P = new Papel(cv, 34); P.grilla(); xPrev = 0; T = tEcg; }
    // velocidad en escala logarítmica: 0 → ×0.02 · 100 → ×1
    const aVel = r => +(0.02 * Math.pow(50, r / 100)).toFixed(3), deVel = v => Math.round(100 * Math.log(v / 0.02) / Math.log(50));
    function pintaVel() {
      $("#vel-r").value = deVel(st.vel); $("#vel-v").textContent = "×" + st.vel.toFixed(st.vel < 0.1 ? 3 : 2).replace(/0+$/, "").replace(/\.$/, "");
      $$("#vel [data-v]").forEach(b => b.classList.toggle("act", Math.abs(+b.dataset.v - st.vel) < 1e-3));
    }
    function pintaPausa() { $("#pausa").textContent = st.pausa ? "▶ Seguir" : "⏸ Pausa"; }
    $$("[data-tipo]").forEach(b => b.onclick = () => { st.tipo = b.dataset.tipo; st.fc = E.PATRONES[st.tipo].fc; armar(); inicio(); });
    const guarda = () => { try { sessionStorage.setItem("ecg-sim", JSON.stringify(st)); } catch (e) {} };
    $$("#vel [data-v]").forEach(b => b.onclick = () => { st.vel = +b.dataset.v; pintaVel(); guarda(); });
    $("#vel-r").oninput = ev => { st.vel = aVel(+ev.target.value); pintaVel(); guarda(); };
    $("#fc").oninput = ev => { st.fc = +ev.target.value; $("#fc-v").textContent = st.fc; };
    $("#fc").onchange = () => { armar(); inicio(); };
    $("#der").onchange = ev => { st.der = ev.target.value; armar(); inicio(); };
    $("#iam-reg").onchange = ev => { st.region = ev.target.value; armar(); inicio(); };
    $("#iam-fase").onchange = ev => { st.fase = ev.target.value; armar(); inicio(); };
    $("#pausa").onclick = () => { st.pausa = !st.pausa; pintaPausa(); };
    $("#k").oninput = ev => { st.k = +ev.target.value; $("#k-v").textContent = st.k.toFixed(1); };
    $("#ca").oninput = ev => { st.ca = +ev.target.value; $("#ca-v").textContent = st.ca.toFixed(1); };
    $("#k").onchange = $("#ca").onchange = () => { armar(); inicio(); };
    $("#elec-0").onclick = () => { st.k = 4.2; st.ca = 9.5; armar(); inicio(); };
    $("#sonido").onclick = () => { st.sonido = !st.sonido; U.audio(); armar(); };
    /* --- paso a paso: las etapas del ciclo son los bordes de cada onda --- */
    function etapas() {
      const b = [];
      for (const l of ecg.latidos) {
        const m = l._m || (l._m = E.morfo(ecg.cfg, l, ecg.el)), qt = E.qt(l, m);
        if (l.tp != null && !["fa", "flutter"].includes(ecg.cfg.tipo)) b.push(l.tp, l.tp + 0.105);
        if (l.tq != null) b.push(l.tq, l.tq + m.qrsDur, l.tq + qt - 0.17, l.tq + qt + 0.02);
      }
      return b.sort((x, y) => x - y);
    }
    let BORDES = [];
    const vecino = dir => {
      const t = tEcg; if (dir > 0) return BORDES.find(x => x > t + 0.004) ?? t + 0.2;
      for (let i = BORDES.length - 1; i >= 0; i--) if (BORDES[i] < t - 0.004) return BORDES[i];
      return 0;
    };
    function irA(t) {   // salto hacia atrás: se redibuja la página del monitor hasta t
      tEcg = Math.max(0, t); T = tEcg; const W = ventana(), ini = tEcg - (tEcg % W);
      P.grilla(); xPrev = 0; dibujar(ini, tEcg, true);
    }
    function avanzaA(t) { if (t - tEcg > ventana() * 0.9) return irA(t); const a = tEcg; tEcg = t; T += t - a; dibujar(a, tEcg); }
    const detener = () => { st.pausa = true; pintaPausa(); };
    $("#adelante").onclick = () => { detener(); avanzaA(vecino(1) + 0.001); };
    $("#atras").onclick = () => { detener(); irA(vecino(-1) + 0.001); };
    $("#fino").onclick = () => { detener(); avanzaA(tEcg + 0.02); };
    document.onkeydown = ev => {
      if ((ev.target.closest && ev.target.closest("input,select")) || ev.ctrlKey || ev.altKey || ev.metaKey) return;
      if (ev.key === " ") { ev.preventDefault(); $("#pausa").click(); }
      else if (ev.key === "ArrowRight") { ev.preventDefault(); (ev.shiftKey ? $("#fino") : $("#adelante")).click(); }
      else if (ev.key === "ArrowLeft") { ev.preventDefault(); $("#atras").click(); }
    };
    armar(); inicio(); pintaPausa();
    U.alRedimensionar = inicio; U.repintar = inicio;
    // monitor de barrido: dibuja el tramo [t0, t1] y borra solo por delante de la pluma
    function dibujar(t0, t1, sinBorrar) {
      const W = ventana(), mm = P.mm, base = P.H * 0.62, c = P.c, X = t => (T - (t1 - t)) % W * 25 * mm, x1 = X(t1);
      if (!sinBorrar) {
        const b0 = x1 + 3, b1 = x1 + 18;
        if (b1 > P.W) { if (b0 < P.W) P.grilla(b0, P.W); P.grilla(0, b1 - P.W); } else P.grilla(b0, b1);
      }
      c.strokeStyle = css("--traza"); c.lineWidth = 2; c.lineJoin = "round"; c.beginPath();
      let prim = true;
      for (let t = t0; t <= t1 + 1e-9; t += 0.002) {
        const x = X(t), y = base - E.valor(ecg, st.der, t) * 10 * mm;
        if (prim || x < xPrev - 5) c.moveTo(x, y); else c.lineTo(x, y);
        prim = false; xPrev = x;
      }
      c.lineTo(x1, base - E.valor(ecg, st.der, t1) * 10 * mm); c.stroke();
    }
    const DETALLE = {
      P: "El nódulo sinusal dispara. El frente recorre primero la aurícula derecha y luego la izquierda; como avanza hacia abajo y a la izquierda, en DII la P es positiva.",
      PR: "El impulso cruza el nódulo AV, que lo frena a propósito para que las aurículas terminen de llenar los ventrículos. El trazado queda plano: el nódulo es demasiado pequeño para verse desde la piel.",
      QRS: "His → ramas → Purkinje. Primero se activa el septo (de izquierda a derecha) y luego las paredes libres, del endocardio al epicardio. Es la masa más grande: por eso es la onda más alta.",
      ST: "Todo el ventrículo está despolarizado a la vez (meseta, fase 2): no hay diferencia de potencial entre zonas y el trazado vuelve a la línea. El ventrículo se contrae.",
      T: "Los ventrículos se repolarizan (fase 3). Empieza por el epicardio, al revés que la activación; por eso la T sale del mismo lado que el QRS.",
      BL: "La P llegó al nódulo AV pero no pasa: en este ciclo no hay QRS ni contracción ventricular.",
      f: "No hay P: las aurículas fibrilan sin contraerse. El nódulo AV deja pasar solo algunos estímulos, al azar: RR irregular.",
      base: "Diástole: reposo eléctrico y llenado. El nódulo sinusal se va cargando solo (fase 4) hasta el próximo disparo."
    };
    function paso() {
      const now = performance.now();
      const dt = Math.max(0, Math.min(0.05, (now - ultimo) / 1000)); ultimo = now;
      if (!st.pausa) {
        const t0 = tEcg; tEcg += dt * st.vel; T += dt * st.vel;
        dibujar(t0, tEcg);
        if (st.sonido) {
          for (const l of ecg.latidos) { if (l.tq == null || l.tq <= t0) continue; if (l.tq > tEcg) break; U.pitido(l.ectopico ? 660 : 880); }
          if (["fv", "asistolia", "tv", "torsades"].includes(st.tipo) && Math.floor(tEcg / 1.2) !== Math.floor(t0 / 1.2)) U.pitido(st.tipo === "asistolia" ? 520 : 1250, 0.28);
        }
        if (tEcg > ecg.dur - 2) { armar(); inicio(); }
      }
      pintar(E.estado(ecg, tEcg), ecg.cfg);
      const o = E.onda(ecg, tEcg); $("#onda-k").textContent = o.k === "base" ? "—" : o.k; $("#onda-n").textContent = o.n;
      $("#onda-d").textContent = st.pausa || st.vel <= 0.1 ? DETALLE[o.k] || "" : "";
      anim = requestAnimationFrame(paso);
    }
    anim = requestAnimationFrame(paso);
  };

  /* ---------- router ---------- */
  function ruta() {
    U.detener();
    const [id, arg] = (location.hash.replace(/^#/, "") || "sim").split("/");
    const f = SECC[id] || SECC.sim;
    $$("#tabs a").forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + (SECC[id] ? id : "sim")));
    const act = $("#tabs a.act"); if (act) act.scrollIntoView({ block: "nearest", inline: "center" });
    vista.innerHTML = ""; f(vista, arg); window.scrollTo(0, 0);
    vista.insertAdjacentHTML("beforeend", `<p class="pie">Módulo compartido con el Atlas de Semiología: contenido de Sotomayor, <i>Semiología General</i>, tema 8 (2020), que coincide con las clases 18-24 de Fisiopatología (EKG, eje, hipertrofias, bloqueos, bradicardia e infarto); potasio y calcio según la clase 7.
      Lo marcado <span class="lit">literatura</span> viene de la fisiología general, no de la clase. Ilustraciones generadas con ChatGPT; el trazado es una simulación didáctica.</p>`);
  }
  addEventListener("hashchange", ruta);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => U.alRedimensionar && U.alRedimensionar(), 200); });
  addEventListener("DOMContentLoaded", ruta);
  if (document.readyState !== "loading") setTimeout(ruta, 0);
})();
