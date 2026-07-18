/* =========================================================
   ANANT MEDIA — ANIMATIONS
   Text splitting, scroll-triggered reveals, magnetic
   buttons, card interactions, and the gallery lightbox.
   Each section gets its own animation language rather
   than a single repeated fade-up.
   ========================================================= */

const AnantAnimations = (() => {

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  /* ---------- Lightweight text splitting (no external plugin) ---------- */
  function splitChars(el){
    const text = el.textContent;
    el.textContent = '';
    text.split('').forEach(ch => {
      const span = document.createElement('span');
      span.className = 'split-char';
      span.textContent = ch === ' ' ? '\u00A0' : ch;
      el.appendChild(span);
    });
    return el.querySelectorAll('.split-char');
  }

  function splitLines(el){
    // Content authored with <br> tags marks intentional line breaks
    const html = el.innerHTML;
    const lines = html.split(/<br\s*\/?>/i);
    el.innerHTML = '';
    lines.forEach(line => {
      const wrap = document.createElement('span');
      wrap.className = 'split-line-wrap';
      wrap.style.display = 'block';
      wrap.style.overflow = 'hidden';
      const inner = document.createElement('span');
      inner.className = 'split-line';
      inner.innerHTML = line.trim();
      wrap.appendChild(inner);
      el.appendChild(wrap);
    });
    return el.querySelectorAll('.split-line');
  }

  function initTextReveals(){
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll('[data-split]').forEach(el => {
      const chars = splitChars(el);
      gsap.set(chars, { yPercent: 110, opacity: 0 });
      gsap.to(chars, {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.02,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    document.querySelectorAll('[data-split-lines]').forEach(el => {
      const lines = splitLines(el);
      gsap.set(lines, { yPercent: 100, opacity: 0 });
      gsap.to(lines, {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        stagger: 0.09,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  }

  /* ---------- Generic reveal for paragraphs / cards ---------- */
  function initReveals(){
    document.querySelectorAll('.exp-card, .g-item, .strip-frame, .meta-grid > div, .khwaab-buttons').forEach(el => {
      el.classList.add('reveal');
      ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        onEnter: () => el.classList.add('is-visible'),
      });
    });
  }

  /* ---------- Navigation show/hide + blur on scroll ---------- */
  function initNav(){
    const nav = document.getElementById('site-nav');
    if (!nav) return;
    let lastY = window.scrollY;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        nav.classList.toggle('scrolled', self.scroll() > 40);
        const goingDown = self.direction === 1;
        nav.classList.toggle('hide-nav', goingDown && self.scroll() > 200);
      }
    });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu(){
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-menu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      menu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic(){
    if (isMobile) return;
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(btn, { x: x * 0.35, y: y * 0.45, duration: 0.4, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
      });
    });
  }

  /* ---------- Hero: scroll-linked type + 3D depth ---------- */
  function initHeroScroll(){
    const hero = document.getElementById('hero');
    if (!hero) return;

    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        if (window.AnantScene) AnantScene.setHeroScrollProgress(self.progress);
      }
    });

    gsap.to('.hero-anant', {
      yPercent: -30,
      letterSpacing: '0.04em',
      opacity: 0.15,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.hero-media', {
      yPercent: -60,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- Khwaab: poster tilt, background fade, title move, strip scroll ---------- */
  function initKhwaab(){
    const section = document.querySelector('.khwaab');
    const poster = document.getElementById('khwaab-poster');
    const bg = document.getElementById('khwaab-bg');
    const title = document.getElementById('khwaab-title');
    const strip = document.getElementById('khwaab-strip');
    const track = document.getElementById('strip-track');
    if (!section) return;

    gsap.fromTo(bg, { opacity: 0.3 }, {
      opacity: 1,
      scrollTrigger: { trigger: section, start: 'top 70%', end: 'top 20%', scrub: true }
    });

    gsap.fromTo(poster, { scale: 0.82, y: 60 }, {
      scale: 1, y: 0,
      ease: 'power3.out',
      scrollTrigger: { trigger: poster, start: 'top 85%', end: 'top 40%', scrub: true }
    });

    gsap.to(title, {
      xPercent: -6,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
    });

    if (!isMobile){
      poster.addEventListener('mousemove', (e) => {
        const r = poster.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(poster, { rotateY: px * 14, rotateX: -py * 14, duration: 0.5, ease: 'power2.out', transformPerspective: 800 });
        const shine = poster.querySelector('.poster-shine');
        gsap.to(shine, { xPercent: px * 60 + 30, duration: 0.5 });
      });
      poster.addEventListener('mouseleave', () => {
        gsap.to(poster, { rotateY: 0, rotateX: 0, duration: 0.6, ease: 'power3.out' });
      });
    }

    // Horizontal strip driven by vertical scroll
    if (strip && track){
      let dragging = false, startX = 0, scrollX = 0, currentX = 0;

      ScrollTrigger.create({
        trigger: strip,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          if (dragging) return;
          const maxScroll = track.scrollWidth - strip.clientWidth;
          currentX = -self.progress * maxScroll;
          gsap.set(track, { x: currentX });
        }
      });

      strip.addEventListener('mousedown', (e) => { dragging = true; startX = e.clientX; scrollX = currentX; });
      window.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const maxScroll = track.scrollWidth - strip.clientWidth;
        currentX = Math.min(0, Math.max(-maxScroll, scrollX + (e.clientX - startX)));
        gsap.set(track, { x: currentX });
      });
      window.addEventListener('mouseup', () => dragging = false);
    }
  }

  /* ---------- Stories: entrance depth/scale ---------- */
  function initStories(){
    document.querySelectorAll('.story-card').forEach((card) => {
      gsap.fromTo(card, { scale: 0.94, opacity: 0 }, {
        scale: 1, opacity: 1,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 85%' }
      });
    });
  }

  /* ---------- Experiments: 3D perspective cards react to mouse ---------- */
  function initExperiments(){
    const container = document.getElementById('exp-cards');
    if (!container || isMobile) return;
    container.addEventListener('mousemove', (e) => {
      const r = container.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      container.querySelectorAll('.exp-card').forEach((card, i) => {
        const depth = (i % 2 === 0) ? 1 : 1.4;
        gsap.to(card, {
          rotateY: px * 10 * depth,
          rotateX: -py * 10 * depth,
          duration: 0.6,
          ease: 'power2.out',
          transformPerspective: 900
        });
      });
    });
    container.addEventListener('mouseleave', () => {
      container.querySelectorAll('.exp-card').forEach(card => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'power3.out' });
      });
    });
  }

  /* ---------- Gallery parallax + lightbox ---------- */
  function initGallery(){
    const items = document.querySelectorAll('.g-item');
    items.forEach((item, i) => {
      const speed = (i % 3 === 0) ? -30 : (i % 3 === 1) ? 20 : -12;
      gsap.to(item.querySelectorAll('.g-placeholder, .media-img'), {
        yPercent: speed,
        ease: 'none',
        scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    const lightbox = document.getElementById('lightbox');
    const lbImageFrame = document.getElementById('lb-image');
    const lbImg = document.getElementById('lb-img');
    const lbFilename = document.getElementById('lb-filename');
    const lbTitle = document.getElementById('lb-title');
    const lbFrame = document.getElementById('lb-frame');
    const images = Array.from(items);
    let currentIndex = 0;

function openLightbox(index){
  currentIndex = index;

  const item = images[currentIndex];
  const src = item.dataset.src;

  lbFilename.textContent = src.split('/').pop();
  lbTitle.textContent = item.dataset.title;
  lbFrame.textContent = item.dataset.frame;
  lbImg.alt = `${item.dataset.title} — ${item.dataset.frame}`;

  // Reset lightbox media state
  lbImageFrame.removeAttribute('data-media-loaded');

  // Handle dynamically loaded lightbox image
  lbImg.onload = () => {
    lbImageFrame.setAttribute('data-media-loaded', 'true');
  };

  lbImg.onerror = () => {
    lbImageFrame.removeAttribute('data-media-loaded');
    console.error('Lightbox image failed to load:', src);
  };

  // Set image source
  lbImg.src = src;

  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');

  gsap.fromTo(
    '#lb-image',
    {
      scale: 0.92,
      opacity: 0
    },
    {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'power3.out'
    }
  );
}
    function closeLightbox(){
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    function nav(dir){
      currentIndex = (currentIndex + dir + images.length) % images.length;
      openLightbox(currentIndex);
    }

    images.forEach((item, i) => item.addEventListener('click', () => openLightbox(i)));
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.getElementById('lb-prev').addEventListener('click', () => nav(-1));
    document.getElementById('lb-next').addEventListener('click', () => nav(1));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    window.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
    });
  }

  /* ---------- Reusable media fallback system ----------
     Any <img data-media-image> inside an element carrying
     [data-media-frame] is watched here. On success the frame
     gets data-media-loaded="true" (CSS fades the image in and
     the .media-fallback out). On failure — or if no asset has
     been placed yet — the attribute is left off, so the frame
     keeps its exact original geometry and shows the existing
     cinematic placeholder instead of a broken-image icon.
     Works for every current and future media slot on the site
     without a bespoke handler per image. */
  function initMediaFallback(){
    const mediaImages = document.querySelectorAll('img[data-media-image]');
    mediaImages.forEach((img) => {
      const frame = img.closest('[data-media-frame]');
      if (!frame) return;

      const markLoaded = () => frame.setAttribute('data-media-loaded', 'true');
      const markError = () => frame.removeAttribute('data-media-loaded');

      if (img.complete){
        // Image tag was already parsed and resolved (or has no src yet,
        // as with the lightbox <img>) before this script ran.
        if (img.naturalWidth > 0) markLoaded(); else markError();
      } else {
        img.addEventListener('load', markLoaded);
        img.addEventListener('error', markError);
      }
    });
  }

  /* ---------- Collab glow reacts to scroll proximity ---------- */
  function initCollab(){
    const section = document.querySelector('.collab');
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 60%',
      end: 'bottom top',
      onUpdate: (self) => {
        gsap.set('.collab-glow', { opacity: 0.4 + self.progress * 0.5 });
      }
    });
  }

  function initAll(){
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    initNav();
    initMobileMenu();
    initTextReveals();
    initReveals();
    initMagnetic();
    initHeroScroll();
    initKhwaab();
    initStories();
    initExperiments();
    initGallery();
    initCollab();
    initMediaFallback();
    ScrollTrigger.refresh();
  }

  return { initAll, initNav, initMobileMenu, initTextReveals, initMagnetic, initMediaFallback };
})();

// Expose animations module to main.js bootstrap
window.AnantAnimations = AnantAnimations;
