/* =========================================================
   ANANT MEDIA — CUSTOM CURSOR
   Dot follows instantly, outline lags smoothly.
   Contextual labels via [data-cursor] attribute.
   Disabled entirely on touch devices.
   ========================================================= */

const AnantCursor = (() => {

  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  function init(){
    if (isTouch){
      document.body.classList.add('touch');
      return;
    }

    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');
    const label = document.getElementById('cursor-text');
    if (!dot || !outline) return;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let ox = mx, oy = my;

    window.addEventListener('mousemove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    }, { passive: true });

    function loop(){
      ox += (mx - ox) * 0.16;
      oy += (my - oy) * 0.16;
      outline.style.left = ox + 'px';
      outline.style.top = oy + 'px';
      requestAnimationFrame(loop);
    }
    loop();

    // Contextual states
    const interactive = document.querySelectorAll('a, button, .story-card, .g-item, .exp-card, [data-cursor]');
    interactive.forEach(el => {
      el.addEventListener('mouseenter', () => {
        const text = el.getAttribute('data-cursor');
        if (text){
          outline.style.width = '84px';
          outline.style.height = '84px';
          label.textContent = text;
          label.style.opacity = '1';
        } else {
          outline.style.width = '60px';
          outline.style.height = '60px';
        }
      });
      el.addEventListener('mouseleave', () => {
        outline.style.width = '40px';
        outline.style.height = '40px';
        label.style.opacity = '0';
        label.textContent = '';
      });
    });

    // Drag cursor for the horizontal filmstrip
    const strip = document.getElementById('khwaab-strip');
    if (strip){
      strip.addEventListener('mouseenter', () => {
        label.textContent = 'DRAG';
        label.style.opacity = '1';
        outline.style.width = '84px';
        outline.style.height = '84px';
      });
      strip.addEventListener('mouseleave', () => {
        label.textContent = '';
        label.style.opacity = '0';
        outline.style.width = '40px';
        outline.style.height = '40px';
      });
    }
  }

  return { init };
})();
window.AnantCursor = AnantCursor;