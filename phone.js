/* Scroll-driven iPhone — shared behaviour (2026-09-09). No dependencies, CSP-safe.
   Maps the page's scroll through .ph-track to a screen index inside .ph-strip,
   with a dwell-then-glide easing so each screen holds before the next slides in. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tracks = document.querySelectorAll('[data-ph-track]');
  Array.prototype.forEach.call(tracks, function (track) {
    var sticky = track.querySelector('.ph-sticky');
    var strip = track.querySelector('.ph-strip');
    if (!sticky || !strip) return;
    var shots = strip.querySelectorAll('.ph-shot');
    var n = shots.length;
    var caps = track.querySelectorAll('[data-ph-cap]');
    var dots = track.querySelectorAll('[data-ph-dot]');
    if (reduce || n < 2) {
      track.classList.add('ph-static');
      if (caps[0]) caps[0].classList.add('is-active');
      return;
    }
    track.style.setProperty('--ph-n', String(n));
    var current = -1, ticking = false;

    var head = track.querySelector('.ph-head'), copy = track.querySelector('.ph-copy'), dotsEl = track.querySelector('.ph-dots');
    function fit() {
      // Stacked layout (phones): the device takes whatever height the headline, caption and CTA leave.
      if (window.innerWidth > 860) { track.style.removeProperty('--ph-w'); return; }
      var cs = window.getComputedStyle(sticky);
      var pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      var gaps = 2 * (parseFloat(cs.rowGap) || 0);
      var avail = sticky.clientHeight - pad - gaps - (head ? head.offsetHeight : 0) - (copy ? copy.offsetHeight : 0) - (dotsEl ? dotsEl.offsetHeight + 10 : 0);
      var w = Math.max(150, Math.min(280, avail * 0.478));
      track.style.setProperty('--ph-w', w + 'px');
    }

    function ease(f) { return f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; }   // easeInOutQuad

    function update() {
      ticking = false;
      var rect = track.getBoundingClientRect();
      var range = track.offsetHeight - sticky.offsetHeight;
      var p = range > 0 ? Math.min(1, Math.max(0, -rect.top / range)) : 0;
      var raw = p * (n - 1);
      var i = Math.floor(raw), f = raw - i;
      if (i >= n - 1) { i = n - 1; f = 0; }
      var pos = i + ease(f);
      strip.style.transform = 'translate3d(0,' + (-pos * 100) + '%,0)';
      var idx = Math.round(raw);
      if (idx !== current) {
        current = idx;
        Array.prototype.forEach.call(caps, function (c, k) { c.classList.toggle('is-active', k === idx); });
        Array.prototype.forEach.call(dots, function (d, k) { d.classList.toggle('is-active', k === idx); });
      }
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { fit(); onScroll(); });
    fit(); update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); update(); });
  });
})();
