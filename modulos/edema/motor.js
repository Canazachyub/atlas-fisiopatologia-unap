/* Starling y edema — MOTOR numérico (sin DOM; también corre en Node).
   Modelo didáctico del intercambio capilar-intersticio:
     presión neta de filtración  NDP(x) = (Pc(x) − Pi) − σ·(πp − πi)         x: 0 = extremo arterial … 1 = extremo venoso
     Pc(x) = Pv + caída·(1 − x)          (la presión capilar baja a lo largo del capilar)
     filtración J = Kf · media(NDP)      (L/día, escala didáctica calibrada para que lo normal = flujo linfático normal)
     linfa    = L0 · drenaje · min(1 + kL·V, 5)   (el flujo linfático sube con el líquido acumulado: «factor de seguridad»)
     Pi_efectiva = Pi + kPi·V            (el intersticio se tensa al llenarse y frena la filtración)
   V = líquido intersticial acumulado (L, equivalente). Si J > linfa, V crece hasta un equilibrio (o hasta el tope).
   CIFRAS: de la CLASE: presión capilar pulmonar normal 10 mmHg y 25-30 en EAP; presión oncótica del plasma 25 mmHg
   (Clase 41); albúmina normal 4-5 g/dL y edema con < 2,5 g/dL; edema detectable ≥ 5 L, pre-edema < 5 L (Clase 02 /
   Semiología 05g). El resto (presión capilar sistémica 35→15, Pi, πi, tasa linfática, gradiente de conversión
   albúmina→mmHg, compliance) es LITERATURA o ajuste didáctico: la interfaz lo marca con la etiqueta «literatura». */
(function (raiz) {
  "use strict";
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const f = (x, d = 0) => (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ",");

  /* Dos circuitos: capilar sistémico (tejido subcutáneo) y capilar pulmonar (Clase 41). */
  const CIRC = {
    sis: {
      id: "sis", nombre: "Capilar sistémico (tejido subcutáneo)",
      Pv0: 15, caida: 20, Pi0: 0, pii0: 3,       // Pc 35→15 mmHg [literatura]; Pi≈0 y πi≈3 [literatura, ajuste didáctico]
      L0: 3, kPi: 1, kL: 0.5, Vmax: 25,           // linfa normal ≈ 3 L/día [literatura]
      Pvmin: 5, Pvmax: 45, unidad: "L"
    },
    pul: {
      id: "pul", nombre: "Capilar pulmonar",
      Pv0: 8, caida: 4, Pi0: -4, pii0: 14,        // Pc media 10 mmHg (CLASE 41); Pi y πi [literatura, ajuste didáctico — REVISAR]
      L0: 0.5, kPi: 8, kL: 2, Vmax: 4,
      Pvmin: 3, Pvmax: 35, unidad: "L"
    }
  };
  const PIP_POR_ALB = 25 / 4.5;                  // mmHg por g/dL: 25 mmHg a 4,5 g/dL (CLASE 41); la proporción es didáctica (literatura)
  const NORMAL = c => ({ Pv: c.Pv0, alb: 4.5, perm: 1, Pi: c.Pi0, pii: c.pii0, lin: 1 });

  const piP = alb => alb * PIP_POR_ALB;                         // presión oncótica del plasma
  const sigma = perm => clamp(1 - 0.25 * (perm - 1), 0.25, 1);  // coeficiente de reflexión: baja si la pared «gotea» proteínas

  /* NDP en el punto x del capilar (V = líquido ya acumulado, que tensa el intersticio) */
  function ndp(p, c, x, V) {
    const Pc = p.Pv + c.caida * (1 - x);
    return (Pc - (p.Pi + c.kPi * (V || 0))) - sigma(p.perm) * (piP(p.alb) - p.pii);
  }
  /* Integra a lo largo del capilar: devuelve media, flujo hacia fuera y flujo de regreso (en L/día) */
  function flujos(p, c, V) {
    const N = 80, Kf = (c.L0 / mediaNormal(c)) * p.perm;
    let s = 0, sal = 0, ent = 0;
    for (let i = 0; i < N; i++) {
      const v = ndp(p, c, (i + 0.5) / N, V); s += v;
      if (v > 0) sal += v; else ent -= v;
    }
    return { media: s / N, filtra: Kf * s / N, sale: Kf * sal / N, entra: Kf * ent / N, Kf };
  }
  const _cm = {};
  function mediaNormal(c) {                       // NDP medio en condiciones normales (calibra Kf para que J normal = linfa normal)
    if (_cm[c.id] === undefined) {
      const p = NORMAL(c); let s = 0; const N = 80;
      for (let i = 0; i < N; i++) s += ndp(p, c, (i + 0.5) / N, 0);
      _cm[c.id] = s / N;
    }
    return _cm[c.id];
  }
  const linfa = (p, c, V) => p.lin * c.L0 * Math.min(1 + c.kL * V, 5);
  const filtracion = (p, c, V) => flujos(p, c, V).filtra;

  /* Equilibrio: V* donde filtración = linfa (bisección; g decrece con V). sinTope: ni con el intersticio lleno se frena */
  function equilibrio(p, c) {
    const g = V => filtracion(p, c, V) - linfa(p, c, V);
    if (g(0) <= 0) return { V: 0, sinTope: false };
    if (g(c.Vmax) > 0) return { V: c.Vmax, sinTope: true };
    let a = 0, b = c.Vmax;
    for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (g(m) > 0) a = m; else b = m; }
    return { V: (a + b) / 2, sinTope: false };
  }
  /* Un paso en el tiempo (dt en días): dV/dt = J − linfa; V nunca baja de 0 */
  function paso(V, p, c, dt) {
    const dV = filtracion(p, c, V) - linfa(p, c, V);
    return clamp(V + dV * dt, 0, c.Vmax);
  }

  /* Nombre de cada fuerza, y qué parámetro la gobierna */
  const FUERZAS = {
    Pv: "presión hidrostática capilar", alb: "presión oncótica del plasma (albúmina)", perm: "permeabilidad capilar",
    Pi: "presión hidrostática intersticial", pii: "presión oncótica intersticial", lin: "drenaje linfático"
  };
  /* Sentido «que favorece edema» para cada parámetro: +1 si subirlo empuja líquido hacia afuera */
  const SENTIDO = { Pv: 1, alb: -1, perm: 1, Pi: -1, pii: 1, lin: -1 };

  /* Cuánto aporta cada parámetro al líquido acumulado: lo devolvemos a lo normal y vemos cuánto cambia V* */
  function aportes(p, c) {
    const n = NORMAL(c), base = equilibrio(p, c).V, r = [];
    for (const k in FUERZAS) {
      const q = Object.assign({}, p); q[k] = n[k];
      const dV = base - equilibrio(q, c).V;
      r.push({ k, nombre: FUERZAS[k], dV, alterada: Math.abs(p[k] - n[k]) > 1e-9 });
    }
    return r.sort((a, b) => Math.abs(b.dV) - Math.abs(a.dV));
  }
  /* Qué fuerzas están claramente alteradas (para el quiz y el letrero) */
  function alteradas(p, c) {
    const n = NORMAL(c), r = [];
    if (p.Pv - n.Pv >= 4) r.push("Pv");
    if (p.alb <= 3.2) r.push("alb");
    if (p.perm >= 1.3) r.push("perm");
    if (p.pii - n.pii >= 4) r.push("pii");
    if (p.lin <= 0.6) r.push("lin");
    if (Math.abs(p.Pi - n.Pi) >= 3) r.push("Pi");
    return r;
  }

  /* Estado clínico según V (umbrales de la clase: pre-edema < 5 L, detectable ≥ 5 L) */
  function estado(V, c) {
    if (c.id === "pul") {
      if (V < 0.1) return { nivel: 0, txt: "alvéolos secos" };
      if (V < 0.6) return { nivel: 1, txt: "edema intersticial (pre-bronquial)" };   // niveles 0,15 / 0,6 L: ajuste didáctico [REVISAR]
      return { nivel: 2, txt: "edema alveolar (intra-alveolar)" };
    }
    if (V < 1) return { nivel: 0, cruces: 0, txt: "sin edema" };
    if (V < 5) return { nivel: 1, cruces: 0, txt: "pre-edema (< 5 L): aún sin fóvea, solo se nota por el peso" };
    const cr = V < 7.5 ? 1 : V < 10 ? 2 : V < 15 ? 3 : 4;                          // cruces según volumen: didáctico (la clase da 1-4 cruces sin litros)
    return { nivel: 2, cruces: cr, txt: "edema clínico (≥ 5 L): fóvea " + "+".repeat(cr) };
  }

  const API = { CIRC, NORMAL, clamp, f, piP, sigma, ndp, flujos, linfa, filtracion, equilibrio, paso, aportes, alteradas, estado, FUERZAS, SENTIDO, PIP_POR_ALB };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.ED = API;
})(typeof window !== "undefined" ? window : globalThis);
