/* =========================================================
   ANANT MEDIA — THREE.JS SCENES
   Hero: particle field forming an infinity symbol.
   About: small ambient wireframe sphere.
   Both are deliberately calm — slow rotation, mouse
   parallax, scroll-linked depth. No gaming aesthetics.
   ========================================================= */

const AnantScene = (() => {

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let heroRenderer, heroScene, heroCamera, heroParticles, heroPoints;
  let aboutRenderer, aboutScene, aboutCamera, aboutSphere;
  let mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
  let scrollProgress = 0;

  /* ---------- Infinity symbol point generator (lemniscate of Bernoulli) ---------- */
  function buildInfinityGeometry(count){
    const positions = new Float32Array(count * 3);
    const scale = 5.2;
    for (let i = 0; i < count; i++){
      const t = (i / count) * Math.PI * 2;
      const denom = 1 + Math.sin(t) * Math.sin(t);
      const x = (scale * Math.cos(t)) / denom;
      const y = (scale * Math.sin(t) * Math.cos(t)) / denom;
      // scatter particles around the curve for volume/depth
      const jitter = 0.35;
      positions[i * 3]     = x + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 1] = y + (Math.random() - 0.5) * jitter;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }

  function initHero(){
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    heroScene = new THREE.Scene();
    heroCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    heroCamera.position.set(0, 0, 12);

    heroRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    heroRenderer.setSize(window.innerWidth, window.innerHeight);

    const count = isMobile ? 1800 : 5200;
    const geometry = buildInfinityGeometry(count);

    const material = new THREE.PointsMaterial({
      color: 0xEDEBE4,
      size: isMobile ? 0.035 : 0.028,
      transparent: true,
      opacity: 0.75,
      sizeAttenuation: true
    });

    heroPoints = new THREE.Points(geometry, material);
    heroScene.add(heroPoints);

    // A faint secondary layer for depth
    const backGeometry = buildInfinityGeometry(Math.floor(count * 0.4));
    const backMaterial = new THREE.PointsMaterial({
      color: 0x5C63A8,
      size: 0.05,
      transparent: true,
      opacity: 0.22,
      sizeAttenuation: true
    });
    const backPoints = new THREE.Points(backGeometry, backMaterial);
    backPoints.position.z = -3;
    backPoints.scale.set(1.4, 1.4, 1.4);
    heroScene.add(backPoints);
    heroParticles = { front: heroPoints, back: backPoints };

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    heroScene.add(ambient);

    window.addEventListener('resize', onHeroResize, { passive: true });
    if (!isMobile){
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }

    if (!reducedMotion){
      animateHero();
    } else {
      heroRenderer.render(heroScene, heroCamera);
    }
  }

  function onMouseMove(e){
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  }

  function onHeroResize(){
    if (!heroRenderer) return;
    heroCamera.aspect = window.innerWidth / window.innerHeight;
    heroCamera.updateProjectionMatrix();
    heroRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animateHero(){
    requestAnimationFrame(animateHero);

    targetRotY += (mouseX * 0.6 - targetRotY) * 0.03;
    targetRotX += (mouseY * 0.3 - targetRotX) * 0.03;

    if (heroParticles){
      heroParticles.front.rotation.y += 0.0011;
      heroParticles.front.rotation.x = targetRotX * 0.4;
      heroParticles.front.rotation.z = targetRotY * 0.15;

      heroParticles.back.rotation.y -= 0.0007;
      heroParticles.back.rotation.x = targetRotX * 0.2;
    }

    // Scroll pushes the object deeper into the scene
    heroCamera.position.z = 12 + scrollProgress * 9;
    heroCamera.position.y = -scrollProgress * 2.4;
    heroCamera.rotation.z = scrollProgress * 0.05;

    heroRenderer.render(heroScene, heroCamera);
  }

  function setHeroScrollProgress(p){
    scrollProgress = Math.min(Math.max(p, 0), 1);
  }

  /* ---------- About section ambient sphere ---------- */
  function initAbout(){
    const canvas = document.getElementById('about-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const parent = canvas.parentElement;
    aboutScene = new THREE.Scene();
    aboutCamera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 50);
    aboutCamera.position.z = 6;

    aboutRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    aboutRenderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    aboutRenderer.setSize(parent.clientWidth, parent.clientHeight);

    const geo = new THREE.IcosahedronGeometry(2.1, isMobile ? 1 : 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x9A9AA3, wireframe: true, transparent: true, opacity: 0.35 });
    aboutSphere = new THREE.Mesh(geo, mat);
    aboutScene.add(aboutSphere);

    const innerGeo = new THREE.IcosahedronGeometry(1.3, 0);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x5B7CFA, wireframe: true, transparent: true, opacity: 0.25 });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    aboutScene.add(innerMesh);

    window.addEventListener('resize', () => {
      if (!aboutRenderer) return;
      aboutCamera.aspect = parent.clientWidth / parent.clientHeight;
      aboutCamera.updateProjectionMatrix();
      aboutRenderer.setSize(parent.clientWidth, parent.clientHeight);
    }, { passive: true });

    let visible = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => visible = entry.isIntersecting);
    }, { threshold: 0.1 });
    io.observe(parent);

    function animateAbout(){
      requestAnimationFrame(animateAbout);
      if (!visible || reducedMotion) return;
      aboutSphere.rotation.y += 0.0022;
      aboutSphere.rotation.x += 0.0009;
      innerMesh.rotation.y -= 0.0016;
      innerMesh.rotation.x -= 0.0012;
      aboutRenderer.render(aboutScene, aboutCamera);
    }
    animateAbout();
  }

  return { initHero, initAbout, setHeroScrollProgress };
})();
