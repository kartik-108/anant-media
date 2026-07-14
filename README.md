# Anant Media — Website

A dark, cinematic, single-page site for Anant Media, built with plain HTML/CSS/JS plus Three.js, GSAP + ScrollTrigger, and Lenis (all loaded from CDN, no build step, no framework).

> **Creativity has no final frame.**

---

## 1. Creative direction (short version)

- **Palette:** near-black surfaces (`#050505` / `#0B0B0D` / `#111114`), soft white/silver ink, and a single muted violet–indigo glow used only in two places (the Khwaab section background and the closing CTA) so it reads as a rare accent, not a theme color.
- **Type:** Space Grotesk (with a Neue Montreal-style fallback) for structure and headings, Fraunces (serif, italic) for anything emotional — quotes, taglines, the "creativity has no final frame" line.
- **Signature moment:** the hero's Three.js particle field, which is built from a lemniscate (infinity curve) equation rather than a stock geometry, so the infinity motif is literally the geometry of the brand mark, not a decoration on top of it.
- **Motion language per section:** the hero uses scroll-linked camera depth; Khwaab uses 3D poster tilt + a draggable horizontal filmstrip; Stories uses scale/depth entrances; Visuals uses per-image parallax speeds + a keyboard-navigable lightbox; Experiments uses mouse-driven 3D card perspective; the marquee is a pure CSS loop. Nothing relies on a single repeated "fade up" animation.

## 2. Project structure

```
anant-media/
├── index.html
├── css/
│   ├── style.css         → tokens, layout, every component
│   ├── animations.css    → keyframes + reveal utility classes
│   └── responsive.css    → tablet/mobile breakpoints
├── js/
│   ├── main.js            → loader sequence + Lenis smooth scroll + boot order
│   ├── three-scene.js     → hero infinity particle field + about-section sphere
│   ├── animations.js      → GSAP/ScrollTrigger: text reveals, cards, lightbox, nav
│   └── cursor.js          → custom cursor with contextual labels
├── assets/
│   ├── images/            → gallery + founder photo
│   ├── videos/            → reserved for future motion assets
│   ├── fonts/             → reserved for self-hosted fonts (site currently uses Google Fonts)
│   ├── icons/             → reserved for favicon / UI icons
│   └── projects/          → poster art and story frames
└── README.md
```

## 3. Where to put your assets

The site currently renders elegant placeholder blocks (with the expected filename printed on them) anywhere a real asset is missing, so it's fully functional as-is. Drop in files with these exact names and they'll be picked up automatically once you wire the CSS `background-image` / `<img>` tags in:

| Asset | Expected path | Used in |
|---|---|---|
| Khwaab poster | `assets/projects/khwaab-poster.jpg` | Featured Release section |
| Khwaab story frames | `assets/projects/khwaab-frame-01.jpg` … `05.jpg` | Horizontal filmstrip |
| Story thumbnails | `assets/projects/khwaab.jpg`, `dashavatar.jpg`, `untitled.jpg` | Stories section cards |
| Gallery photography | `assets/images/visual-01.jpg` … `visual-06.jpg` | Visuals / lightbox |
| Founder photo | `assets/images/founder.jpg` | Behind Anant section |
| Favicon / UI marks | `assets/icons/` | `<head>` (add a `<link rel="icon">` once you have one) |

To actually swap a placeholder for a real image, replace the relevant `.g-placeholder`, `.poster-placeholder`, `.story-image`, or `.founder-placeholder` `<div>` in `index.html` with an `<img>` tag pointing at the asset path, and remove the matching placeholder CSS gradient if you want the raw photo showing edge-to-edge.

## 4. Running it locally

No build step is required — but you do need a local server (not `file://`) because ES-module-style fetches and some browsers' security rules for canvas/CORS behave oddly over `file://`.

**Option A — VS Code:** install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".

**Option B — Python (built into most systems):**
```bash
cd anant-media
python3 -m http.server 5500
```
Then open `http://localhost:5500`.

**Option C — Node:**
```bash
npx serve .
```

## 5. Notes on behavior

- The cinematic loader runs **once per browser session** (via `sessionStorage`). Clear session storage or open a new tab to see it again.
- The custom cursor, magnetic buttons, and mouse-parallax effects are automatically disabled on touch devices and under `prefers-reduced-motion`.
- Particle counts and pixel ratio are reduced on screens ≤768px to keep frame rate smooth on mobile GPUs.
- All animation code lives in three files by responsibility: `three-scene.js` (WebGL only), `cursor.js` (pointer only), `animations.js` (GSAP/ScrollTrigger/DOM). `main.js` only orchestrates load order — it doesn't contain animation logic itself.

## 6. Known implementation review (self-QA pass)

- Verified every element referenced by `getElementById` / `querySelector` in the JS exists in `index.html` with a matching id/class.
- Verified `ScrollTrigger` and `Lenis` are registered/synced before any `ScrollTrigger.create` calls run (loader boots the app only after its own timeline completes, so libraries are already parsed).
- Three.js scenes dispose of nothing explicitly (single-page, non-SPA-routed site — scenes live for the page's lifetime), but both hero and about scenes cap `devicePixelRatio` and particle count for mobile GPUs.
- `prefers-reduced-motion` is respected in three places independently: the loader (skips straight to content), `three-scene.js` (skips the render loop after one static frame for hero, freezes about-sphere rotation), and global CSS (collapses all transition/animation durations).
