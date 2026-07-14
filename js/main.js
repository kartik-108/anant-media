/* =========================================================
   ANANT MEDIA — MAIN
   Boots the loader, smooth scroll, cursor, 3D scenes and
   animations in the correct order.
   ========================================================= */

(function(){

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Smooth scroll (Lenis + GSAP ScrollTrigger) ---------- */
  function initSmoothScroll(){
    if (typeof Lenis === 'undefined' || reducedMotion) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });

    lenis.on('scroll', () => {
      if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });

    function raf(time){
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (typeof gsap !== 'undefined'){
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- App bootstrap (runs once loader clears) ---------- */
  function bootApp(){
    initSmoothScroll();
    if (window.AnantCursor) AnantCursor.init();
    if (window.AnantScene){
      AnantScene.initHero();
      AnantScene.initAbout();
    }
    if (window.AnantAnimations) AnantAnimations.initAll();
  }

  /* ---------- Cinematic loader (once per session) ---------- */
  function runLoader(){
    const loader = document.getElementById('loader');
    const countEl = document.getElementById('loader-count');
    const mark = document.querySelector('.loader-mark');
    const word = document.getElementById('loader-word');
    const sub = document.querySelector('.loader-sub');
    const curtain = document.getElementById('loader-curtain');

    const alreadySeen = sessionStorage.getItem('anant_loaded') === 'true';

    if (alreadySeen || reducedMotion){
      loader.style.display = 'none';
      document.body.classList.add('loaded');
      bootApp();
      return;
    }

    document.body.style.overflow = 'hidden';

    if (typeof gsap === 'undefined'){
      // Fallback: no GSAP available, just remove loader
      loader.style.display = 'none';
      document.body.style.overflow = '';
      sessionStorage.setItem('anant_loaded', 'true');
      bootApp();
      return;
    }

    const counter = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('anant_loaded', 'true');
        document.body.style.overflow = '';
        loader.remove();
        bootApp();
      }
    });

    tl.to(counter, {
      val: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate: () => {
        countEl.textContent = String(Math.floor(counter.val)).padStart(2, '0');
      }
    })
    .to(countEl, { opacity: 0, duration: 0.35 }, '-=0.1')
    .to(mark, { opacity: 1, duration: 0.5 }, '-=0.1')
    .to(word, { opacity: 1, letterSpacing: '0.35em', duration: 0.6 }, '-=0.1')
    .to(sub, { opacity: 1, duration: 0.5 }, '-=0.2')
    .to({}, { duration: 0.5 }) // brief hold so the mark can be read
    .to(curtain, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power4.inOut'
    });
  }

  document.addEventListener('DOMContentLoaded', runLoader);

})();
/* ========================================
   MEDIA IMAGE LOADER
======================================== */

document.querySelectorAll("[data-media-image]").forEach((img) => {
  const frame = img.closest("[data-media-frame]");

  if (!frame) return;

  const imageLoaded = () => {
    frame.classList.add("media-loaded");
    frame.classList.remove("media-error");
  };

  const imageError = () => {
    frame.classList.remove("media-loaded");
    frame.classList.add("media-error");

    console.error("Image failed to load:", img.src);
  };

  img.addEventListener("load", imageLoaded);
  img.addEventListener("error", imageError);

  if (img.complete) {
    if (img.naturalWidth > 0) {
      imageLoaded();
    } else {
      imageError();
    }
  }
});