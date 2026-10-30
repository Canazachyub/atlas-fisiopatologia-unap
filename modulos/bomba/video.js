/* Video del simulador (animación hecha con Google Flow a partir de una ilustración de ChatGPT).
   Envuelve la pestaña indicada de window.SECC y le pone el video arriba; solo se reproduce mientras se ve en pantalla. */
(function () {
  "use strict";
  const VIDEOS = [{"seccion": "curva", "src": "video_corazon.mp4", "poster": "video_corazon.jpg", "titulo": "El corazón como bomba", "texto": "Cada latido el ventrículo se llena (diástole) y expulsa sangre (sístole). Lo que expulsa en cada latido es el volumen sistólico; multiplicado por la frecuencia da el gasto cardiaco."}];
  const SECC = window.SECC; if (!SECC) return;
  const css = document.createElement("style");
  css.textContent = `.video-ani{margin:0 0 14px;padding:10px 12px;display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;align-items:center}
.video-ani video{display:block;width:100%;border-radius:12px;background:#000;aspect-ratio:16/9}
.video-ani figcaption{font-size:14.5px;line-height:1.5}.video-ani figcaption b.t{display:block;font-size:16px;margin-bottom:4px}
.video-ani figcaption small{display:block;margin-top:6px;opacity:.7;font-size:12px}
@media (max-width:760px){.video-ani{grid-template-columns:1fr}}`;
  document.head.appendChild(css);
  const vigia = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
    const v = e.target; if (e.isIntersecting) { const p = v.play(); if (p) p.catch(() => {}); } else v.pause();
  }), { threshold: 0.35 }) : null;
  VIDEOS.forEach(cfg => {
    const orig = SECC[cfg.seccion]; if (typeof orig !== "function") return;
    SECC[cfg.seccion] = function (cont) {
      const r = orig.apply(this, arguments);
      const fig = document.createElement("figure"); fig.className = "caja video-ani";
      fig.innerHTML = `<video src="${cfg.src}" poster="${cfg.poster}" muted loop playsinline preload="metadata" aria-label="${cfg.titulo}"></video>
        <figcaption><b class="t">🎬 ${cfg.titulo}</b>${cfg.texto}<small>Animación hecha con IA (ChatGPT + Google Flow): sirve para imaginar el mecanismo; las cifras salen del simulador y de la clase.</small></figcaption>`;
      const h = cont.querySelector("h1, h2"), ref = h && h.parentNode === cont ? h.nextElementSibling : cont.firstElementChild;
      if (ref && ref.classList && ref.classList.contains("lema")) ref.after(fig); else if (h && h.parentNode === cont) h.after(fig); else cont.prepend(fig);
      const v = fig.querySelector("video"); if (vigia) vigia.observe(v); else v.autoplay = true;
      return r;
    };
  });
})();
