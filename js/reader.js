/* =========================================================
   ANANT MEDIA — READER LOGIC (read-khwaab.html only)
   Uses PDF.js (CDN, loaded in read-khwaab.html) to render the
   KHWAAB comic page-by-page onto a canvas inside a fixed
   reading stage. Fully isolated: touches nothing outside this
   page. Falls back to an in-page, on-brand error state if
   the selected PDF is missing or fails to load.

   Flow: Intro -> Edition Select -> (transition) -> Reader ->
   Fullscreen available -> Comic Reading -> Ending Section.
   ========================================================= */

(function(){

  /* The actual PDF path is pasted directly in read-khwaab.html
     on each edition button's data-pdf-path="" attribute — look
     for the "PASTE ... PDF LINK" comments in that file. */
  let PDF_PATH = '';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const intro = document.getElementById('reader-intro');
  const editionSelect = document.getElementById('edition-select');
  const editionTransition = document.getElementById('edition-select-transition');
  const stage = document.getElementById('reader-stage');
  const frameEl = document.getElementById('reader-canvas-frame');
  const canvas = document.getElementById('reader-canvas');
  const loadingEl = document.getElementById('reader-loading');
  const fallbackEl = document.getElementById('reader-fallback');
  const retryBtn = document.getElementById('reader-retry');
  const controlsEl = document.getElementById('reader-controls');
  const backBtn = document.getElementById('reader-back');
  const prevBtn = document.getElementById('reader-prev');
  const nextBtn = document.getElementById('reader-next');
  const edgePrev = document.getElementById('reader-edge-prev');
  const edgeNext = document.getElementById('reader-edge-next');
  const fullscreenBtn = document.getElementById('reader-fullscreen');
  const exitMobileBtn = document.getElementById('reader-exit-mobile');
  const currentEl = document.getElementById('reader-current');
  const totalEl = document.getElementById('reader-total');
  const progressFill = document.getElementById('reader-progress-fill');

  if (!stage) return; // safety: nothing to do if the markup isn't present

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let rendering = false;
  let queuedPage = null;
  let renderQueueResolvers = [];

  /* Kicked off the moment an edition is chosen, so the file is
     already (or almost) loaded by the time the "Preparing Your
     Reading Room…" hold finishes — makes the reader feel instant
     instead of waiting for the fetch to start only after reveal. */
  let pendingPdfLoad = null;

  /* ---------- Intro sequence ---------- */
  function runIntro(){
    if (!intro){
      if (window.AnantTransition) AnantTransition.revealIn();
      showEditionSelect();
      return;
    }
    const eyebrow = intro.querySelector('.reader-intro-eyebrow');
    const title = intro.querySelector('.reader-intro-title');
    const subtitle = intro.querySelector('.reader-intro-subtitle');
    const line = intro.querySelector('.reader-intro-line');

    if (reducedMotion || typeof gsap === 'undefined'){
      intro.style.display = 'none';
      if (window.AnantTransition) AnantTransition.revealIn();
      showEditionSelect();
      return;
    }

    if (window.AnantTransition) AnantTransition.revealIn();

    const tl = gsap.timeline({ delay: 0.2, onComplete: () => {
      gsap.to(intro, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => { intro.style.display = 'none'; showEditionSelect(); }
      });
    }});
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(title, { opacity: 1, duration: 0.7, ease: 'power4.out' }, '-=0.2')
      .to(subtitle, { opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.35')
      .to(line, { opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.25')
      .to({}, { duration: 0.9 }); // quiet hold before the fade-out above
  }

  /* ---------- Edition selector ---------- */
  function showEditionSelect(){
    if (!editionSelect){ revealStage(); return; } // fallback if markup is missing

    editionSelect.hidden = false;
    editionSelect.setAttribute('aria-hidden', 'false');
    editionSelect.classList.add('is-visible');

    // The container itself may have been left at opacity:0 by a
    // previous GSAP fade-out (e.g. after picking an edition and
    // then hitting "Change Edition"). Reset it before animating
    // the children back in, or the whole screen stays invisible.
    if (typeof gsap !== 'undefined'){
      gsap.set(editionSelect, { opacity: 1 });
    } else {
      editionSelect.style.opacity = '1';
    }

    const revealTargets = editionSelect.querySelectorAll('.edition-select-eyebrow, .edition-select-title, .edition-card');
    if (typeof gsap !== 'undefined' && !reducedMotion){
      gsap.fromTo(revealTargets, { opacity: 0, y: 16 }, {
        opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08
      });
    } else {
      revealTargets.forEach((el) => { el.style.opacity = '1'; });
    }
  }

  /* Starts fetching + parsing the PDF right away. Returns a promise
     that resolves to the loaded document, or null if it couldn't load
     (loadPdf() decides what the user sees; this just does the fetch). */
  function startPdfLoad(path){
    if (!path || typeof pdfjsLib === 'undefined') return Promise.resolve(null);
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return pdfjsLib.getDocument(path).promise.catch(() => null);
  }

  function hideEditionSelect(chosenPath){
    PDF_PATH = chosenPath;
    pendingPdfLoad = startPdfLoad(PDF_PATH);

    function proceed(){
      editionSelect.classList.remove('is-visible');
      editionSelect.setAttribute('aria-hidden', 'true');
      editionSelect.hidden = true;

      if (editionTransition){
        editionTransition.classList.add('is-visible');
        editionTransition.setAttribute('aria-hidden', 'false');
        setTimeout(() => {
          editionTransition.classList.remove('is-visible');
          editionTransition.setAttribute('aria-hidden', 'true');
          revealStage();
        }, 1000); // cinematic "Preparing Your Reading Room…" hold
      } else {
        revealStage();
      }
    }

    if (typeof gsap !== 'undefined' && !reducedMotion){
      gsap.to(editionSelect, { opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: proceed });
    } else {
      proceed();
    }
  }

  function initEditionSelect(){
    if (!editionSelect) return;
    editionSelect.querySelectorAll('.edition-card-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const chosen = (btn.dataset.pdfPath || '').trim();
        hideEditionSelect(chosen);
      });
    });
  }

  /* ---------- Back to edition select (from the reading stage) ---------- */
  function goBackToEditionSelect(){
    // Exit fullscreen first, if active, so the transition is visible
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (isFullscreen){
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) exit.call(document);
    }

    function proceed(){
      stage.hidden = true;
      stage.style.opacity = '0';

      // Reset reader state so the next edition starts clean
      pdfDoc = null;
      currentPage = 1;
      totalPages = 0;
      rendering = false;
      queuedPage = null;
      renderQueueResolvers = [];
      pendingPdfLoad = null;
      PDF_PATH = '';
      loadingEl.hidden = false;
      fallbackEl.hidden = true;
      prevBtn.disabled = false;
      nextBtn.disabled = false;
      fullscreenBtn.disabled = false;
      currentEl.textContent = '01';
      totalEl.textContent = '—';
      if (progressFill) progressFill.style.width = '0%';
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.opacity = '0';

      showEditionSelect();
    }

    if (typeof gsap !== 'undefined' && !reducedMotion){
      gsap.to(stage, { opacity: 0, duration: 0.5, ease: 'power2.inOut', onComplete: proceed });
    } else {
      proceed();
    }
  }

  /* ---------- Reveal the reading stage ---------- */
  function revealStage(){
    stage.hidden = false;
    if (typeof gsap === 'undefined' || reducedMotion){
      stage.style.opacity = '1';
    } else {
      gsap.to(stage, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }
    loadPdf();
  }

  /* ---------- PDF.js loading ---------- */
  function loadPdf(){
    if (!PDF_PATH || typeof pdfjsLib === 'undefined'){
      showFallback();
      return;
    }

    // Reuse the fetch kicked off in hideEditionSelect() if it's still
    // around (normal flow); otherwise start fresh (e.g. Try Again).
    const loadPromise = pendingPdfLoad || startPdfLoad(PDF_PATH);
    pendingPdfLoad = null;

    loadPromise.then((doc) => {
      if (!doc){ showFallback(); return; }
      pdfDoc = doc;
      totalPages = doc.numPages;
      totalEl.textContent = String(totalPages).padStart(2, '0');
      currentPage = 1;
      fullscreenBtn.disabled = false;
      loadingEl.hidden = true;
      fallbackEl.hidden = true;
      updateControls();
      renderPage(1, true);
    }).catch(() => {
      showFallback();
    });
  }

  function showFallback(){
    loadingEl.hidden = true;
    fallbackEl.hidden = false;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    fullscreenBtn.disabled = true;
  }

  function retryLoad(){
    fallbackEl.hidden = true;
    loadingEl.hidden = false;
    loadPdf();
  }

  /* Warms PDF.js's internal cache for the pages either side of the one
     just shown, so the next/prev tap feels instant instead of waiting
     on a fresh page fetch + parse. Doesn't touch the canvas. */
  function prefetchNeighbors(num){
    if (!pdfDoc) return;
    [num - 1, num + 1].forEach((n) => {
      if (n >= 1 && n <= totalPages) pdfDoc.getPage(n).catch(() => {});
    });
  }

  /* ---------- Render a page (object-fit: contain equivalent) ----------
     Rendering is serialized: if a render is already in flight when a
     new page is requested, the request is queued and the caller's
     promise resolves only once that later page has actually finished
     drawing — this stops the canvas from fading back in on top of a
     stale frame while a queued render is still catching up. */
  function renderPage(num, isFirst){
    if (!pdfDoc) return Promise.resolve();

    if (rendering){
      queuedPage = num;
      return new Promise((resolve) => { renderQueueResolvers.push(resolve); });
    }

    rendering = true;
    return doRender(num, isFirst);
  }

  function doRender(num, isFirst){
    return pdfDoc.getPage(num).then((page) => {
      const unscaled = page.getViewport({ scale: 1 });
      const availW = frameEl.clientWidth;
      const availH = frameEl.clientHeight;
      const scale = Math.min(availW / unscaled.width, availH / unscaled.height) * (window.devicePixelRatio || 1);
      const viewport = page.getViewport({ scale });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = (viewport.width / (window.devicePixelRatio || 1)) + 'px';
      canvas.style.height = (viewport.height / (window.devicePixelRatio || 1)) + 'px';

      const ctx = canvas.getContext('2d');
      return page.render({ canvasContext: ctx, viewport }).promise;
    }).then(() => {
      rendering = false;
      if (isFirst){
        if (typeof gsap !== 'undefined' && !reducedMotion){
          gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
        } else {
          canvas.style.opacity = '1';
        }
      }
      prefetchNeighbors(num);

      if (queuedPage !== null){
        const next = queuedPage;
        queuedPage = null;
        rendering = true;
        return doRender(next, isFirst).then(() => {
          const resolvers = renderQueueResolvers;
          renderQueueResolvers = [];
          resolvers.forEach((r) => r());
        });
      }

      const resolvers = renderQueueResolvers;
      renderQueueResolvers = [];
      resolvers.forEach((r) => r());
    }).catch(() => {
      rendering = false;
      showFallback();
      const resolvers = renderQueueResolvers;
      renderQueueResolvers = [];
      resolvers.forEach((r) => r());
    });
  }

  /* ---------- Navigation ---------- */
  function updateControls(){
    currentEl.textContent = String(currentPage).padStart(2, '0');
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    edgePrev.disabled = currentPage <= 1;
    edgeNext.disabled = currentPage >= totalPages;
    if (progressFill && totalPages > 0){
      const pct = totalPages > 1 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 100;
      progressFill.style.width = pct + '%';
    }
  }

  function goToPage(num){
    if (!pdfDoc || num < 1 || num > totalPages || num === currentPage) return;
    currentPage = num;
    updateControls();

    if (typeof gsap !== 'undefined' && !reducedMotion){
      gsap.to(canvas, {
        opacity: 0, scale: 0.98, duration: 0.18, ease: 'power2.in',
        onComplete: () => {
          renderPage(currentPage).then(() => {
            gsap.fromTo(canvas, { opacity: 0, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.32, ease: 'power2.out' });
          });
        }
      });
    } else {
      renderPage(currentPage).then(() => { canvas.style.opacity = '1'; });
    }
  }

  function initNavControls(){
    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    edgePrev.addEventListener('click', () => goToPage(currentPage - 1));
    edgeNext.addEventListener('click', () => goToPage(currentPage + 1));
    if (retryBtn) retryBtn.addEventListener('click', retryLoad);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
      if (e.key === 'ArrowRight') goToPage(currentPage + 1);
      if (e.key === 'Home') goToPage(1);
      if (e.key === 'End') goToPage(totalPages);
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
      if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen();
    });

    // Touch swipe (horizontal only, so vertical page scroll is untouched)
    let touchStartX = 0, touchStartY = 0;
    frameEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    frameEl.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)){
        if (dx < 0) goToPage(currentPage + 1); else goToPage(currentPage - 1);
      }
    }, { passive: true });
  }

  /* ---------- Fullscreen (cross-browser) ---------- */
  function toggleFullscreen(){
    const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    if (!isFullscreen){
      // Fullscreen the whole page (not just the stage) so elements
      // that live outside #reader-stage — like the custom cursor —
      // stay in the rendered tree and remain visible/functional.
      const el = document.documentElement;
      const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (request) request.call(el);
    } else {
      const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (exit) exit.call(document);
    }
  }

  function initFullscreenSync(){
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach((evt) => {
      document.addEventListener(evt, () => {
        const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        fullscreenBtn.textContent = isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN';
        document.documentElement.classList.toggle('reader-fullscreen-active', !!isFullscreen);
        document.body.classList.toggle('reader-fullscreen-active', !!isFullscreen);
        controlsEl.classList.remove('is-hot');
        if (pdfDoc) renderPage(currentPage, true);
      });
    });
  }

  /* ---------- Fullscreen control-bar hot-zone (desktop) ----------
     In fullscreen the bar is invisible by default — it's just the
     page. Bringing the cursor near the bottom edge (or resting it
     on the bar itself) reveals it; moving away hides it again. On
     mobile the bar is replaced entirely (see CSS), so this is a
     no-op there. */
  function initFullscreenHotzone(){
    const HOT_ZONE_PX = 160;
    window.addEventListener('mousemove', (e) => {
      if (!document.body.classList.contains('reader-fullscreen-active')) return;
      const nearBottom = e.clientY > window.innerHeight - HOT_ZONE_PX;
      controlsEl.classList.toggle('is-hot', nearBottom);
    }, { passive: true });

    // Keep it visible while the cursor is actually resting on the
    // bar, even once it's already fully faded (e.g. after using a
    // keyboard shortcut that snapped the mouse still).
    controlsEl.addEventListener('mouseenter', () => {
      if (document.body.classList.contains('reader-fullscreen-active')) controlsEl.classList.add('is-hot');
    });
  }

  /* ---------- Idle fade for the control bar ---------- */
  function initIdleFade(){
    let idleTimer = null;
    function resetIdle(){
      controlsEl.classList.remove('is-idle');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => controlsEl.classList.add('is-idle'), 2600);
    }
    ['mousemove', 'touchstart', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, resetIdle, { passive: true });
    });
    resetIdle();
  }

  /* ---------- Re-render current page on resize (keeps it contained) ---------- */
  function initResize(){
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (pdfDoc) renderPage(currentPage, true); }, 200);
    }, { passive: true });
  }

  /* ---------- Content protection ----------
     Frontend-only, best-effort. This deters casual saving but
     cannot fully prevent it — canvas rendering is the main
     protection since there is no downloadable PDF object. */
  function initContentProtection(){
    document.addEventListener('contextmenu', (e) => {
      if (e.target.closest('#reader-stage') || e.target.closest('#edition-select')) e.preventDefault();
    });
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (key === 's' || key === 'p')){
        e.preventDefault();
      }
    });
    canvas.setAttribute('draggable', 'false');
    canvas.addEventListener('dragstart', (e) => e.preventDefault());
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNavControls();
    initIdleFade();
    initResize();
    initEditionSelect();
    initFullscreenSync();
    initFullscreenHotzone();
    initContentProtection();
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    if (exitMobileBtn) exitMobileBtn.addEventListener('click', toggleFullscreen);
    if (backBtn) backBtn.addEventListener('click', goBackToEditionSelect);
    runIntro();
  });

})();