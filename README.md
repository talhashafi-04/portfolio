# Talha Shafi · Portfolio

Static site, no build step. Open `index.html` through any static server (`python3 -m http.server`).

- `index.html`, `css/style.css` - page and styles
- `js/avatar.js` - three.js scene: seated avatar, cursor-following head, scroll-driven camera
- `js/main.js` - loader, Lenis smooth scroll, GSAP ScrollTrigger reveals, work track, BowlSense diagram, techstack bubbles
- `js/data.js` - project cards and techstack list (edit content here)
- `assets/avatar.glb` - rigged avatar with clips `typing`, `introAnimation`, `nod`
- `Resume.pdf`, `CV.pdf` - downloads linked from the site

Deploys as-is on Vercel (framework preset: Other, no build command, output directory `.`).
