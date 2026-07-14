/* =========================================================
   ANANT MEDIA — READER LOGIC (read-khwaab.html only)
   Uses PDF.js (CDN, loaded in read-khwaab.html) to render the
   KHWAAB comic page-by-page onto a canvas inside a fixed
   reading stage. Fully isolated: touches nothing outside this
   page. Falls back to an in-page, on-brand error state if
   assets/comics/khwaab.pdf is missing or fails to load.
   ========================================================= */

(function(){

  const PDF_PATH = 'assets/comics/khwaab.pdf';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const intro = document.getElementById('reader-intro');
  const stage = document.getElementById('reader-stage');
  const frameEl = document.getElementById('reader-canvas-frame');
  const canvas = document.getElementById('reader-canvas');
  const loadingEl = document.getElementById('reader-loading');
  const fallbackEl = document.getElementById('reader-fallback');
  const controlsEl = document.getElementById('reader-controls');
  const prevBtn = document.getElementById('reader-prev');
  const nextBtn = document.getElementById('reader-next');
  const edgePrev = document.getElementById('reader-edge-prev');
  const edgeNext = document.getElementById('reader-edge-next');
  const fullscreenBtn = document.getElementById('reader-fullscreen');
  const currentEl = document.getElementById('reader-current');
  const totalEl = document.getElementById('reader-total');
  const progressFill = document.getElementById('reader-progress-fill');

  if (!stage) return; // safety: nothing to do if the markup isn't present

  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let rendering = false;
  let queuedPage = null;

  /* ---------- Intro sequence ---------- */
  function runIntro(){
    if (!intro){
      if (window.AnantTransition) AnantTransition.revealIn();
      revealStage();
      return;
    }
    const eyebrow = intro.querySelector('.reader-intro-eyebrow');
    const title = intro.querySelector('.reader-intro-title');
    const subtitle = intro.querySelector('.reader-intro-subtitle');
    const line = intro.querySelector('.reader-intro-line');

    if (reducedMotion || typeof gsap === 'undefined'){
      intro.style.display = 'none';
      if (window.AnantTransition) AnantTransition.revealIn();
      revealStage();
      return;
    }

    if (window.AnantTransition) AnantTransition.revealIn();

    const tl = gsap.timeline({ delay: 0.2, onComplete: () => {
      gsap.to(intro, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => { intro.style.display = 'none'; revealStage(); }
      });
    }});
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(title, { opacity: 1, duration: 0.7, ease: 'power4.out' }, '-=0.2')
      .to(subtitle, { opacity: 1, duration: 0.5, ease: 'power3.out' }, '-=0.35')
      .to(line, { opacity: 1, duration: 0.6, ease: 'power3.out' }, '-=0.25')
      .to({}, { duration: 0.9 }); // quiet hold before the fade-out above
  }

  function revealStage(){
    if (typeof gsap === 'undefined' || reducedMotion){
      stage.style.opacity = '1';
    } else {
      gsap.to(stage, { opacity: 1, duration: 0.7, ease: 'power2.out' });
    }
    loadPdf();
  }

  /* ---------- PDF.js loading ---------- */
  function loadPdf(){
    if (typeof pdfjsLib === 'undefined'){
      showFallback();
      return;
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    pdfjsLib.getDocument(PDF_PATH).promise
      .then((doc) => {
        pdfDoc = doc;
        totalPages = doc.numPages;
        totalEl.textContent = String(totalPages).padStart(2, '0');
        loadingEl.hidden = true;
        renderPage(1, true);
      })
      .catch(() => {
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

  /* ---------- Render a page (object-fit: contain equivalent) ---------- */
  function renderPage(num, isFirst){
    if (!pdfDoc) return Promise.resolve();
    if (rendering){ queuedPage = num; return Promise.resolve(); }
    rendering = true;

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
      if (queuedPage !== null){
        const next = queuedPage;
        queuedPage = null;
        renderPage(next);
      }
    }).catch(() => {
      rendering = false;
      showFallback();
    });
  }

  /* ---------- Navigation ---------- */
  function updateControls(){
    currentEl.textContent = String(currentPage).padStart(2, '0');
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    if (progressFill && totalPages > 0){
      progressFill.style.width = ((currentPage / totalPages) * 100) + '%';
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

    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goToPage(currentPage - 1);
      if (e.key === 'ArrowRight') goToPage(currentPage + 1);
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

  function toggleFullscreen(){
    if (!document.fullscreenElement){
      if (stage.requestFullscreen) stage.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
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

  document.addEventListener('DOMContentLoaded', () => {
    initNavControls();
    initIdleFade();
    initResize();
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    runIntro();
  });

})();