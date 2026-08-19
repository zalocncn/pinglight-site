/* Pinglight — the phone in the sticky rail.
 *
 * The page scrolls normally. Nothing is hijacked: no wheel handler, no scroll
 * trap, no pinned section that swallows a gesture.
 *
 * DESKTOP (>= 900px). Scroll position drives the screens. The right rail is
 * `position: sticky`, so the phone holds its place while the reading sections in
 * the left column slide past it; how far the visitor has come through that
 * stretch — from the moment the whole phone is on screen to the bottom of the
 * page — is split into equal slices, one per screen, and the screens
 * cross-fade as the visitor moves between slices. Scroll back up and it walks
 * back. It is a progress readout, not an animation with a mind of its own.
 *
 * MOBILE (< 900px). Nothing is sticky and the phone sits in the flow, so there
 * is no travel worth reading. It advances itself on a slow timer instead, and
 * a horizontal swipe across the phone moves it by hand.
 *
 * MANUAL CONTROL is permanent, everywhere: click a dot, press an arrow key or
 * swipe once, and scroll position and the timer both stop driving. Once
 * somebody is steering, nothing moves under their hand again.
 *
 * prefers-reduced-motion: one static screen. The dots still work.
 *
 * No inline styles or scripts anywhere: this file is loaded with <script src>
 * and only ever toggles classes and sets text, both of which pass the site's
 * strict CSP (script-src 'self'; style-src 'self').
 */
(function () {
  "use strict";

  var HOLD = 4600;   /* ms per screen on mobile — alive, never frantic */
  var SWIPE = 34;    /* px before a drag counts as a swipe */

  var screenEl = document.getElementById("shots");
  var dotStage = document.getElementById("reel-dots");
  var hintEl = document.getElementById("reel-hint");
  var main = document.getElementById("main");
  var rail = document.getElementById("rail");
  var phone = document.querySelector(".phone");
  if (!screenEl || !dotStage || !main || !rail || !phone) return;

  var shots = Array.prototype.slice.call(screenEl.querySelectorAll(".shot"));
  var n = shots.length;
  if (n < 2) return;

  var reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var deskMq = window.matchMedia("(min-width: 900px)");

  var dots = [];
  var index = -1;
  var manual = false;
  var timer = 0;
  var ticking = false;

  document.documentElement.classList.add("js");

  /* --- the dot rail: manual control, always available -------------------- */

  for (var i = 0; i < n; i++) {
    dots.push(makeDot(i));
  }

  function makeDot(i) {
    var dot = document.createElement("button");
    dot.className = "reel-dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", "Screen " + (i + 1) + " of " + n);
    dot.addEventListener("click", function () {
      takeOver();
      show(i);
    });
    dotStage.appendChild(dot);
    return dot;
  }

  function show(i) {
    i = ((i % n) + n) % n;
    if (i === index) return;
    index = i;
    for (var k = 0; k < n; k++) {
      var on = k === index;
      shots[k].classList.toggle("is-active", on);
      dots[k].classList.toggle("is-active", on);
      dots[k].setAttribute("aria-selected", on ? "true" : "false");
    }
  }

  /* The visitor is driving now: stop reading scroll, stop the timer, and
     retire the hint, which has done its job. */
  function takeOver() {
    if (manual) return;
    manual = true;
    pause();
    document.documentElement.classList.add("is-driving");
  }

  /* --- desktop: scroll position drives the screens ----------------------- */

  /* How far the visitor has scrolled through the two-column block, 0 → 1.

     The window opens the moment the whole phone is on screen — showing a
     screen nobody can see yet would waste it — and closes at the bottom of
     the page. On this layout that is a comfortable stretch of scroll for five screens,
     so each one holds for about a hundred pixels: fast enough to feel driven,
     slow enough to read.

     `main` is measured, not the rail: the rail is sticky, so once it pins its
     own box stops moving with the page and cannot be used as a ruler.

     If the window collapses — a very tall viewport, a very short page — fall
     back to how far the block has crossed the viewport, so the reading never
     gets stuck at one end. */
  function progress() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var top = main.getBoundingClientRect().top;
    var maxY = document.documentElement.scrollHeight - window.innerHeight;

    var start = y + top + phone.offsetHeight + 16 - window.innerHeight;
    if (start < 0) start = 0;
    var p;

    if (maxY - start > 120) {
      p = (y - start) / (maxY - start);
    } else {
      var span = main.offsetHeight + window.innerHeight;
      p = span > 0 ? (window.innerHeight - top) / span : 0;
    }

    return p < 0 ? 0 : p > 1 ? 1 : p;
  }

  function fromScroll() {
    var i = Math.floor(progress() * n);
    if (i > n - 1) i = n - 1;
    show(i);
    document.documentElement.classList.toggle("is-done", i === n - 1);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (manual || reduceMq.matches || !deskMq.matches) return;
      fromScroll();
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* --- mobile: a slow timer, since there is no sticky travel to read ----- */

  function play() {
    if (timer || manual || reduceMq.matches || deskMq.matches) return;
    timer = window.setInterval(function () {
      show(index + 1);
    }, HOLD);
  }

  function pause() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = 0;
  }

  /* --- keyboard: arrows, permanently manual ------------------------------ */

  document.addEventListener("keydown", function (ev) {
    if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (ev.key === "ArrowRight") {
      takeOver();
      show(index + 1);
    } else if (ev.key === "ArrowLeft") {
      takeOver();
      show(index - 1);
    }
  });

  /* --- touch: a horizontal swipe across the phone ------------------------
   * Horizontal only. A vertical drag is the visitor scrolling the page and is
   * never claimed — the page must never fight the thumb. */

  var t0x = 0;
  var t0y = 0;
  var claimed = false;

  phone.addEventListener(
    "touchstart",
    function (ev) {
      var t = ev.changedTouches[0];
      t0x = t.clientX;
      t0y = t.clientY;
      claimed = false;
    },
    { passive: true }
  );

  phone.addEventListener(
    "touchmove",
    function (ev) {
      if (claimed) return;
      var t = ev.changedTouches[0];
      var dx = t.clientX - t0x;
      var dy = t.clientY - t0y;
      if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < SWIPE) return;
      ev.preventDefault();
      claimed = true;
      takeOver();
      show(index + (dx < 0 ? 1 : -1));
    },
    { passive: false }
  );

  /* --- keep the whole thing honest across mode changes ------------------- */

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause();
    else play();
  });

  function sync() {
    if (hintEl) {
      hintEl.textContent = reduceMq.matches
        ? "Tap the dots"
        : deskMq.matches
          ? "Keep scrolling"
          : "Swipe to look around";
    }

    if (reduceMq.matches) {
      pause();
      show(0);
      return;
    }

    if (deskMq.matches) {
      pause();
      if (!manual) fromScroll();
    } else {
      play();
    }
  }

  listen(reduceMq, sync);
  listen(deskMq, sync);

  function listen(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }

  show(0);
  sync();
})();
