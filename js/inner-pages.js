/* =========================================================
   ANANT MEDIA — INNER PAGES (SHARED BOOTSTRAP)
   Loaded by index.html (outgoing transition only) AND by
   every internal page (outgoing + incoming transition, nav,
   mobile menu, text reveals, magnetic buttons, media
   fallback, generic scroll reveals, rhythm-frame parallax).

   Does NOT duplicate homepage-only logic — reuses the
   individually-exposed pieces of AnantAnimations instead of
   calling the homepage's initAll().
   ========================================================= */

(function(){

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isHomepage = !!document.getElementById('loader');

  /* ---------- Cross-page cinematic transition ---------- */
  const AnantTransition = (() => {
    const curtain = document.getElementById('page-curtain');

    function goTo(url){
      if (!curtain || reducedMotion || typeof gsap === 'undefined'){
        window.location.href = url;
        return;
      }
      curtain.classList.add('is-active');
      gsap.set(curtain, { transformOrigin: 'bottom' });
      gsap.to(curtain, {
        scaleY: 1,
        duration: 0.55,
        ease: 'power4.inOut',
        onComplete: () => { window.location.href = url; }
      });
    }

    function revealIn(){
      if (!curtain) return;
      if (reducedMotion || typeof gsap === 'undefined'){
        curtain.classList.remove('is-active');
        return;
      }
      gsap.set(curtain, { scaleY: 1, transformOrigin: 'top' });
      gsap.to(curtain, {
        scaleY: 0,
        duration: 0.7,
        ease: 'power4.inOut',
        delay: 0.05,
        onComplete: () => curtain.classList.remove('is-active')
      });
    }

    function initOutgoing(){
      document.querySelectorAll('a[data-transition]').forEach((link) => {
        link.addEventListener('click', (e) => {
          const url = link.getAttribute('href');
          if (!url || link.target === '_blank' || e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          goTo(url);
        });
      });
    }

    return { initOutgoing, revealIn };
  })();
  window.AnantTransition = AnantTransition;

  /* ---------- Generic scroll reveal ----------
     Any element carrying .reveal or .blur-in (defined in
     animations.css) gets its is-visible class toggled on
     scroll — no per-page JS needed to opt an element in. */
  function initGenericReveals(){
    if (typeof ScrollTrigger === 'undefined') return;
    document.querySelectorAll('.reveal, .blur-in').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: () => el.classList.add('is-visible')
      });
    });
  }

  /* ---------- Rhythm-frame parallax ----------
     Same technique as the homepage gallery: alternating
     speeds on the media layer inside each .rhythm-frame /
     .chamber-media, driven by scroll position.
  function initRhythmParallax(){
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const frames = document.querySelectorAll('.rhythm-frame, .chamber-media');
    frames.forEach((frame, i) => {
      const layer = frame.querySelector('.media-img, .media-fallback');
      if (!layer) return;
      const speed = (i % 3 === 0) ? -22 : (i % 3 === 1) ? 16 : -10;
      gsap.to(frame.querySelectorAll('.media-img, .media-fallback'), {
        yPercent: speed,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  } */

  /* ---------- Page entry timeline ----------
     Runs once per page load (not gated by sessionStorage —
     unlike the homepage loader, brief asks for this every
     visit). Reveals eyebrow -> title -> subtitle -> line,
     then retracts the shared curtain. */
  function initPageEntry(){
    const entry = document.querySelector('.page-entry');
    if (!entry || typeof gsap === 'undefined'){
      AnantTransition.revealIn();
      return;
    }
    const eyebrow = entry.querySelector('.page-entry-eyebrow');
    const title = entry.querySelector('.page-entry-title');
    const subtitle = entry.querySelector('.page-entry-subtitle');
    const line = entry.querySelector('.page-entry-line');

    if (reducedMotion){
      AnantTransition.revealIn();
      return;
    }

    gsap.set([eyebrow, subtitle, line].filter(Boolean), { opacity: 0, y: 16 });
    if (title) gsap.set(title, { opacity: 0, y: 24 });

    const tl = gsap.timeline({ delay: 0.15 });
    if (eyebrow) tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    if (title) tl.to(title, { opacity: 1, y: 0, duration: 0.9, ease: 'power4.out' }, '-=0.25');
    if (subtitle) tl.to(subtitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4');
    if (line) tl.to(line, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3');

    AnantTransition.revealIn();
  }

  /* ---------- Smooth scroll (mirrors main.js's instance, kept
     isolated so internal pages don't depend on main.js) ---------- */
  function initSmoothScroll(){
    if (typeof Lenis === 'undefined' || reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
    lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (typeof gsap !== 'undefined'){
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  /* ---------- Conversation form (contact.html only) ----------
     No backend exists yet. We never pretend the message was
     sent — we show an honest message and reveal the real
     social links instead. Structured so a real endpoint can
     be dropped in later (see the TODO below). */
  function initConversationForm(){
    const form = document.querySelector('.conversation-form');
    if (!form) return;
    const note = form.querySelector('.form-note');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // TODO: once a real endpoint exists, replace this block with
      // an actual fetch(endpoint, { method: 'POST', body: new FormData(form) })
      // and only show the honest fallback below if that request fails.
      form.classList.add('is-submitted');
      if (note) note.classList.add('is-visible');
    });
  }

  /* ---------- Boot ---------- */
  function bootInnerPage(){
    initSmoothScroll();
    if (window.AnantCursor) AnantCursor.init();

    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined'){
      gsap.registerPlugin(ScrollTrigger);
    }

    if (window.AnantAnimations){
      AnantAnimations.initNav();
      AnantAnimations.initMobileMenu();
      AnantAnimations.initTextReveals();
      AnantAnimations.initMagnetic();
      AnantAnimations.initMediaFallback();
    }
    initGenericReveals();
    initRhythmParallax();
    initConversationForm();
    initPageEntry();

    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
  }

  document.addEventListener('DOMContentLoaded', () => {
    AnantTransition.initOutgoing();

    if (isHomepage){
      // Homepage already runs its own loader + AnantAnimations.initAll()
      // via main.js. We only add the outgoing transition here.
      return;
    }
    bootInnerPage();
  });

})();
document.querySelectorAll("[data-media-image]").forEach((img) => {
  const frame = img.closest("[data-media-frame]");

  if (!frame) return;

  const showImage = () => {
    frame.setAttribute("data-media-loaded", "true");
    frame.classList.add("media-loaded");
  };

  const showFallback = () => {
    frame.removeAttribute("data-media-loaded");
    frame.classList.remove("media-loaded");
  };

  img.addEventListener("load", showImage);
  img.addEventListener("error", showFallback);

  if (img.complete) {
    if (img.naturalWidth > 0) {
      showImage();
    } else {
      showFallback();
    }
  }
});