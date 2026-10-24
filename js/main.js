// Page choreography: loader, smooth scroll, scroll-driven camera, reveals, work track,
// counters, the BowlSense arm diagram and the techstack bubbles.
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- build work cards ---------- */
  const track = $("#work-track");
  PROJECTS.forEach((p, i) => {
    const el = document.createElement("article");
    el.className = "card";
    el.style.setProperty("--h", p.hue);
    el.innerHTML = `
      <div class="card-top">
        <span class="card-num">${String(i + 1).padStart(2, "0")}</span>
        <div class="card-name"><h3>${p.name}</h3><p>${p.cat}</p></div>
      </div>
      <div class="cover"><div class="cover-stat">${p.stat}<small>${p.statNote}</small></div><div class="cover-code"></div></div>
      <h4>Tools and features</h4>
      <p class="tools">${p.tools}</p>
      <p class="blurb">${p.blurb}</p>
      <a class="go" href="${p.link}" target="_blank" rel="noopener">${p.link.endsWith("talhashafi-04") ? "More on GitHub ↗" : "View repo ↗"}</a>`;
    $(".cover-code", el).textContent = p.code;
    track.appendChild(el);
  });
  const end = document.createElement("article");
  end.className = "card end";
  end.innerHTML = `<h3 class="big-title" style="font-size:clamp(34px,3.4vw,52px)">And <em>more</em></h3><p>24 public repos, from routing labs to a Java delivery system.</p><a class="btn ghost" href="https://github.com/talhashafi-04" target="_blank" rel="noopener">All repos ↗</a>`;
  track.appendChild(end);
  $("#stack-list").innerHTML = STACK.map((s) => `<li>${s}</li>`).join("");

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const t = id === "#top" ? 0 : $(id);
    if (t === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(t, { duration: 1.4 });
    else (t === 0 ? scrollTo({ top: 0 }) : t.scrollIntoView());
  }));

  /* ---------- cursor ---------- */
  const cursor = $("#cursor");
  if (fine) {
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
    addEventListener("pointermove", (e) => { pos.x = e.clientX; pos.y = e.clientY; xTo(pos.x); yTo(pos.y); cursor.style.opacity = 1; });
    document.addEventListener("pointerleave", () => { cursor.style.opacity = 0; });
    document.addEventListener("pointerover", (e) => cursor.classList.toggle("big", !!e.target.closest("a, button, .do-card")));
  }

  /* ---------- copy email ---------- */
  const toast = $("#toast");
  function say(msg) { toast.textContent = msg; toast.classList.add("on"); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove("on"), 1800); }
  $("#copy-mail").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("m.talhashafi2004@gmail.com"); say("Email copied"); }
    catch (_) { location.href = "mailto:m.talhashafi2004@gmail.com"; }
  });

  /* ---------- split words for reveals ---------- */
  $$(".split, .big-title").forEach((el) => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains("w")) walk(n);
      });
    };
    walk(el);
  });

  /* ---------- hero roles ---------- */
  const roles = $$(".role");
  let ri = 0;
  function nextRole() {
    const a = roles[ri], b = roles[(ri + 1) % roles.length];
    gsap.to(a, { yPercent: -110, duration: 0.7, ease: "power3.in" });
    gsap.fromTo(b, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: "power3.out", delay: 0.45 });
    ri = (ri + 1) % roles.length;
  }
  roles.forEach((r, i) => gsap.set(r, { y: 0, yPercent: i === 0 ? 0 : 110 }));

  /* ---------- loader + intro ---------- */
  const num = $("#loader-num");
  let shown = 0, target = 0;
  const counter = setInterval(() => {
    shown += Math.max(0.6, (target - shown) * 0.18);
    shown = Math.min(shown, target);
    num.textContent = Math.round(shown);
  }, 30);

  const minWait = new Promise((r) => setTimeout(r, reduce ? 0 : 1200));
  const loaded = Avatar.load((f) => { target = Math.max(target, Math.round(f * 92)); })
    .catch((err) => { console.warn(err); $("#loader-note").textContent = "3D scene unavailable, carrying on"; });
  // never hold the page hostage to a slow model
  const cap = new Promise((r) => setTimeout(r, 15000));
  Promise.race([Promise.all([loaded, minWait]), cap]).then(start);

  function start() {
    target = 100;
    const done = () => {
      clearInterval(counter); num.textContent = "100";
      document.body.classList.remove("is-loading");
      if (lenis) lenis.start();
      const tl = gsap.timeline();
      tl.to("#loader", { clipPath: "circle(0% at 50% 50%)", duration: reduce ? 0 : 1.1, ease: "power4.inOut", onComplete: () => $("#loader").remove() })
        .fromTo(".hero-name .line > span", { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "power4.out", stagger: 0.08 }, "-=0.45")
        .fromTo(".hero .reveal-up", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, "<0.1")
        .fromTo(".roles", { opacity: 0 }, { opacity: 1, duration: 0.6 }, "<0.2")
        .fromTo(".nav, .socials, .resume-fab", { opacity: 0 }, { opacity: 1, duration: 0.8 }, "<");
      const camIntro = { v: 1 };
      Avatar.play(reduce ? "typing" : "intro");
      gsap.to(camIntro, { v: 0, duration: reduce ? 0 : 2.4, ease: "power3.out", onUpdate: () => Avatar.setIntro(camIntro.v) });
      if (!reduce) setInterval(nextRole, 2600);
      ScrollTrigger.refresh();
    };
    gsap.set("#loader", { clipPath: "circle(150% at 50% 50%)" });
    setTimeout(done, reduce ? 0 : 450);
  }

  /* ---------- scroll: camera + stage visibility ---------- */
  // one camera value across three sections: 0 hero close-up, 1 about (he slides left), 2 wide shot at the desk
  const cam = { a: 0, b: 0 };
  const pushCam = () => Avatar.setProgress(cam.a + cam.b);
  ScrollTrigger.create({ trigger: "#about", start: "top bottom", end: "center center", scrub: true, onUpdate: (s) => { cam.a = s.progress; pushCam(); } });
  ScrollTrigger.create({ trigger: "#whatido", start: "top 95%", end: "top 10%", scrub: true, onUpdate: (s) => { cam.b = s.progress; pushCam(); } });
  Avatar.setGazeTarget($(".about-inner"));
  let nodded = false;
  ScrollTrigger.create({ trigger: "#about", start: "top 40%", onEnter: () => { if (!nodded) { nodded = true; Avatar.play("nod"); } } });
  // he stays put through What I do, then rides up and out with the page as Career arrives
  gsap.fromTo(["#stage", ".glow-a"], { y: 0 }, {
    y: () => -innerHeight, ease: "none", immediateRender: false,
    scrollTrigger: {
      trigger: "#career", start: "top bottom", end: "top top", scrub: true, invalidateOnRefresh: true,
      onLeave: () => Avatar.setRunning(false), onEnterBack: () => Avatar.setRunning(true)
    }
  });
  gsap.to(".about-inner", {
    opacity: 0, y: -40, filter: "blur(6px)", ease: "none",
    scrollTrigger: { trigger: "#about", start: "bottom 75%", end: "bottom 30%", scrub: true }
  });
  gsap.to(".hero-left, .hero-right, .scroll-hint", {
    opacity: 0, y: -60, filter: "blur(8px)", ease: "none",
    scrollTrigger: { trigger: "#about", start: "top 95%", end: "top 45%", scrub: true }
  });

  /* ---------- generic reveals ---------- */
  if (!reduce) {
    $$(".big-title, .split").forEach((el) => {
      gsap.from($$(".w > span", el), {
        yPercent: 110, duration: 1, ease: "power4.out", stagger: 0.05,
        scrollTrigger: { trigger: el, start: "top 85%" }
      });
    });
    gsap.from([".about .kicker", ".about-body", ".facts li"], {
      y: 30, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out",
      scrollTrigger: { trigger: ".about-inner", start: "top 70%" }
    });
    $$(".do-card, .tl-item, .pipeline li, .feature-stats li, .num-grid li, .contact-grid > div, .feature-lead, .feature-note").forEach((el) => {
      gsap.from(el, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
    });
  }

  gsap.to(".tl-fill", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 60%", end: "bottom 60%", scrub: true } });

  /* ---------- counters ---------- */
  $$("[data-count]").forEach((el) => {
    const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
    const pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
    const fmt = (v) => pre + v.toFixed(dec) + suf;
    if (reduce) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const o = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: to, duration: 1.6, ease: "power2.out", onUpdate: () => (el.textContent = fmt(o.v)) })
    });
  });

  ScrollTrigger.create({ trigger: "#contact", start: "top 70%", onToggle: (st) => document.body.classList.toggle("chrome-off", st.isActive) });

  /* ---------- horizontal work track ---------- */
  const mm = gsap.matchMedia();
  // on phones the about text sits over the avatar, so let him fade back
  mm.add("(max-width: 820px)", () => {
    gsap.fromTo("#stage", { filter: "brightness(1)" }, { filter: "brightness(0.28)", ease: "none", scrollTrigger: { trigger: "#about", start: "top 70%", end: "top 20%", scrub: true } });
  });
  mm.add("(min-width: 821px)", () => {
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: ".work", pin: ".work-pin", start: "top top", end: () => "+=" + dist(), scrub: 0.6, invalidateOnRefresh: true }
    });
  });

  /* ---------- BowlSense arm diagram ---------- */
  (function arm() {
    const svg = $("#arm-svg");
    const dots = $(".grid-dots", svg);
    for (let x = 20; x <= 300; x += 28) for (let y = 20; y <= 300; y += 28) {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 1.2); dots.appendChild(c);
    }
    const S = { x: 110, y: 205 };
    const L1 = 82, L2 = 76;
    const set = (id, attrs) => { const el = $("#" + id, svg); for (const k in attrs) el.setAttribute(k, attrs[k]); };
    let t0 = performance.now(), visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(draw); }).observe(svg);
    function draw(now) {
      // one delivery every 3.2 s: the arm swings over while the elbow flexes and re-straightens a little
      const t = reduce ? 0.62 : ((now - t0) / 3200) % 1;
      const swing = -200 + t * 250; // shoulder angle, degrees
      const flex = 158 + 10 * Math.sin(Math.min(t, 0.75) / 0.75 * Math.PI); // elbow angle, near straight
      const a1 = swing * Math.PI / 180;
      const E = { x: S.x + Math.cos(a1) * L1, y: S.y + Math.sin(a1) * L1 };
      const a2 = a1 + (180 - flex) * Math.PI / 180;
      const W = { x: E.x + Math.cos(a2) * L2, y: E.y + Math.sin(a2) * L2 };
      set("upper", { x1: S.x, y1: S.y, x2: E.x, y2: E.y });
      set("fore", { x1: E.x, y1: E.y, x2: W.x, y2: W.y });
      set("j-sh", { cx: S.x, cy: S.y }); set("j-el", { cx: E.x, cy: E.y }); set("j-wr", { cx: W.x, cy: W.y });
      const released = t > 0.75;
      const bt = released ? (t - 0.75) / 0.25 : 0;
      set("ball", { cx: released ? W.x + bt * 160 : W.x, cy: released ? W.y + bt * 40 : W.y, opacity: released ? 1 - bt * 0.6 : 1 });
      // wedge for the interior elbow angle, swept from the upper arm (pointing back at the shoulder) to the forearm
      const r = 26, s1 = a1 + Math.PI, span = -flex * Math.PI / 180;
      let d = `M${E.x},${E.y}`;
      for (let k = 0; k <= 16; k++) { const a = s1 + span * k / 16; d += ` L${E.x + Math.cos(a) * r},${E.y + Math.sin(a) * r}`; }
      set("arc", { d: d + " Z" });
      const out = s1 + span / 2 + Math.PI;
      set("deg", { x: E.x + Math.cos(out) * 44 - 22, y: E.y + Math.sin(out) * 44 + 6 });
      $("#deg", svg).textContent = Math.round(flex) + "°";
      const ext = Math.max(0, flex - 158);
      $("#verdict").textContent = "extension " + ext.toFixed(1) + "° · " + (ext <= 15 ? "legal" : "flag");
      if (visible && !reduce) requestAnimationFrame(draw);
    }
    draw(performance.now());
  })();

  /* ---------- techstack bubbles ---------- */
  (function bubbles() {
    const cv = $("#bubbles");
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, balls = [], active = false, dropped = false;
    const mouse = { x: -999, y: -999 };
    function fit() {
      dpr = Math.min(devicePixelRatio, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make() {
      const base = Math.max(30, Math.min(54, W / 22));
      balls = STACK.map((label, i) => {
        const r = base * (0.8 + ((i * 37) % 10) / 22);
        return { label, r, x: r + Math.random() * (W - 2 * r), y: -Math.random() * H * 1.4 - r, vx: (Math.random() - 0.5) * 2, vy: 0, hot: i % 5 === 0 };
      });
    }
    addEventListener("resize", () => { fit(); balls.forEach((b) => { b.x = Math.min(Math.max(b.x, b.r), W - b.r); }); });
    cv.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
    function step() {
      const g = 0.32;
      for (const b of balls) {
        b.vy += g; b.vx *= 0.995; b.vy *= 0.995;
        const dx = b.x - mouse.x, dy = b.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < b.r + 70 && d > 0.1) { const f = (b.r + 70 - d) * 0.045; b.vx += dx / d * f; b.vy += dy / d * f; }
        b.x += b.vx; b.y += b.vy;
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.6; }
        if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.6; }
        if (b.y > H - b.r) { b.y = H - b.r; b.vy *= -0.45; b.vx *= 0.92; }
      }
      for (let k = 0; k < 3; k++) for (let i = 0; i < balls.length; i++) for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i], c = balls[j];
        const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), m = a.r + c.r;
        if (d < m && d > 0.01) {
          const o = (m - d) / 2, nx = dx / d, ny = dy / d;
          a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
          const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
          if (rv < 0) { const imp = -rv * 0.55; a.vx -= nx * imp; a.vy -= ny * imp; c.vx += nx * imp; c.vy += ny * imp; }
        }
      }
    }
    function paint() {
      ctx.clearRect(0, 0, W, H);
      for (const b of balls) {
        const grd = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, b.x, b.y, b.r);
        if (b.hot) { grd.addColorStop(0, "#e9dcff"); grd.addColorStop(1, "#7b4fd6"); }
        else { grd.addColorStop(0, "#2c2433"); grd.addColorStop(1, "#151017"); }
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = b.hot ? "rgba(233,220,255,.6)" : "rgba(194,160,255,.25)"; ctx.stroke();
        ctx.fillStyle = b.hot ? "#0b080c" : "#ece8f2";
        const fs = Math.max(11, Math.min(16, b.r / 3.3));
        ctx.font = `600 ${fs}px "JetBrains Mono", monospace`;
        const tw = ctx.measureText(b.label).width;
        if (tw > b.r * 1.7) ctx.font = `600 ${fs * b.r * 1.7 / tw}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(b.label, b.x, b.y);
      }
    }
    function loop() { if (!active) return; step(); paint(); requestAnimationFrame(loop); }
    fit(); make();
    if (reduce) {
      // settle instantly instead of falling
      for (let i = 0; i < 600; i++) step();
      paint();
      return;
    }
    new IntersectionObserver(([e]) => {
      active = e.isIntersecting;
      if (active) { if (!dropped) { dropped = true; fit(); make(); } requestAnimationFrame(loop); }
    }, { threshold: 0.15 }).observe(cv);
  })();
})();
