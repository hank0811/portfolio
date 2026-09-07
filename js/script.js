// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Background: dot grid + 3-line LED chase + floating particles, all on one canvas
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const bgFx = document.querySelector(".bg-fx");
  if (!bgFx) return;

  const canvas = document.createElement("canvas");
  canvas.className = "bg-canvas";
  bgFx.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const GRID = 30;
  const CHASE_SPEED = 0.35; // px/frame — slow, deliberate travel
  const PARTICLE_COLORS = ["111,141,255", "127,230,200", "167,139,250"];

  let width, height, dpr, rows, cols, chaseY, particles;

  function makeParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1 + Math.random() * 1.8,
      speed: 0.18 + Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 0.35,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      alpha: 0.25 + Math.random() * 0.45,
    };
  }

  function init() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rows = Math.ceil(height / GRID) + 3;
    cols = Math.ceil(width / GRID) + 3;
    chaseY = height;
    const count = Math.min(90, Math.max(24, Math.floor((width * height) / 19000)));
    particles = Array.from({ length: count }, makeParticle);
  }

  // exactly one bright peak (the main line) with two 50%-brightness
  // neighbours immediately before/after it, fading to nothing beyond that —
  // always three lines, never more, regardless of grid size or screen height
  function rowIntensity(rowY) {
    const d = Math.abs(rowY - chaseY) / GRID;
    if (d > 1.5) return 0;
    if (d <= 0.5) return 1 - d; // 1 at center, 0.5 at the edge of the main line
    return 0.5 - (d - 0.5) * 0.5; // 0.5 down to 0 across the neighbour line
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let r = 0; r < rows; r++) {
      const y = r * GRID;
      const alpha = 0.05 + rowIntensity(y) * 0.4;
      ctx.fillStyle = `rgba(241,239,236,${alpha})`;
      ctx.beginPath();
      for (let c = 0; c < cols; c++) {
        const x = c * GRID;
        ctx.moveTo(x + 1, y);
        ctx.arc(x, y, 1, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${p.color}, 0.55)`;
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function step() {
    chaseY -= CHASE_SPEED;
    if (chaseY < -GRID * 2) chaseY = height + GRID * 2;

    particles.forEach((p) => {
      p.y -= p.speed;
      p.x += p.drift;
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
    });

    draw();
    if (!reduceMotion) requestAnimationFrame(step);
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      init();
      draw();
    }, 200);
  });

  init();
  draw();
  if (!reduceMotion) requestAnimationFrame(step);
})();

// Hero terminal — types out code snippets across several languages, pauses, erases, loops
(function () {
  const codeEl = document.getElementById("termCode");
  const titleEl = document.getElementById("termTitle");
  if (!codeEl) return;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // each snippet has a filename (shown in the terminal title bar) and an array of
  // lines; each line is an array of [text, tokenClass]
  const SNIPPETS = [
    {
      title: "engineer.js",
      lines: [
        [["const ", "kw"], ["engineer", "var"], [" = {", "punct"]],
        [["  name", "prop"], [": ", "punct"], ["'Shashank Sekhar VS'", "str"], [",", "punct"]],
        [["  builds", "prop"], [": ", "punct"], ["['AI', 'Web', 'UX']", "str"], [",", "punct"]],
        [["  ship", "prop"], [": ", "punct"], ["() => ", "kw"], ["true", "kw"], [",", "punct"]],
        [["};", "punct"]],
      ],
    },
    {
      title: "build.py",
      lines: [
        [["def ", "kw"], ["build", "fn"], ["(idea):", "punct"]],
        [["    research(idea)", "var"]],
        [["    design(idea)", "var"]],
        [["    code(idea)", "var"]],
        [["    return ", "kw"], ["ship(idea)", "fn"]],
      ],
    },
    {
      title: "deploy.ts",
      lines: [
        [["async ", "kw"], ["function ", "kw"], ["deploy", "fn"], ["() {", "punct"]],
        [["  await ", "kw"], ["build", "fn"], ["();", "punct"]],
        [["  await ", "kw"], ["test", "fn"], ["();", "punct"]],
        [["  return ", "kw"], ["ship", "fn"], ["();", "punct"]],
        [["}", "punct"]],
      ],
    },
    {
      title: "query.sql",
      lines: [
        [["SELECT ", "kw"], ["skill, years", "prop"]],
        [["FROM ", "kw"], ["engineer", "prop"]],
        [["WHERE ", "kw"], ["stack", "prop"], [" = ", "punct"], ["'full'", "str"]],
        [["  AND ", "kw"], ["ships", "prop"], [" = ", "punct"], ["true;", "kw"]],
      ],
    },
    {
      title: "deploy.sh",
      lines: [
        [["$ ", "punct"], ["git add -A", "var"]],
        [["$ ", "punct"], ["git commit -m ", "var"], ['"ship it"', "str"]],
        [["$ ", "punct"], ["git push", "var"]],
        [["Deployed ", "fn"], ["✓", "kw"]],
      ],
    },
    {
      title: "App.tsx",
      lines: [
        [["function ", "kw"], ["App", "fn"], ["() {", "punct"]],
        [["  return (", "kw"]],
        [["    <Hero />", "var"]],
        [["  );", "punct"]],
        [["}", "punct"]],
      ],
    },
    {
      title: "agent.py",
      lines: [
        [["agent", "var"], [" = ", "punct"], ["Agent", "fn"], ["(", "punct"]],
        [["  model", "prop"], ["=", "punct"], ['"claude"', "str"], [",", "punct"]],
        [["  tools", "prop"], ["=[search, code]", "punct"]],
        [[")", "punct"]],
        [["agent.run", "fn"], ["(task)", "punct"]],
      ],
    },
    {
      title: "docker-compose.yml",
      lines: [
        [["services:", "kw"]],
        [["  api:", "prop"]],
        [["    build", "prop"], [": .", "punct"]],
        [["    ports:", "prop"]],
        [["      - ", "punct"], ['"8000:8000"', "str"]],
      ],
    },
  ];

  function escapeHtml(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function lineLength(line) {
    return line.reduce((sum, [t]) => sum + t.length, 0);
  }

  function render(lines, upToLine, upToChar) {
    let html = "";
    for (let li = 0; li <= upToLine && li < lines.length; li++) {
      const line = lines[li];
      let remaining = li === upToLine ? upToChar : Infinity;
      let lineHtml = "";
      for (const [text, cls] of line) {
        if (remaining <= 0) break;
        const chunk = text.slice(0, remaining);
        remaining -= chunk.length;
        if (chunk) lineHtml += `<span class="tk-${cls}">${escapeHtml(chunk)}</span>`;
      }
      html += lineHtml + "\n";
    }
    return html;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function typeSnippet(snippet) {
    if (titleEl) titleEl.textContent = snippet.title;
    const lines = snippet.lines;
    for (let li = 0; li < lines.length; li++) {
      const len = lineLength(lines[li]);
      for (let ci = 0; ci <= len; ci++) {
        codeEl.innerHTML = render(lines, li, ci);
        await sleep(22);
      }
      await sleep(140);
    }
    await sleep(1800);
    for (let li = lines.length - 1; li >= 0; li--) {
      const len = lineLength(lines[li]);
      for (let ci = len; ci >= 0; ci--) {
        codeEl.innerHTML = render(lines, li, ci);
        await sleep(10);
      }
    }
    await sleep(400);
  }

  async function loop() {
    if (reduceMotion) {
      const first = SNIPPETS[0];
      if (titleEl) titleEl.textContent = first.title;
      codeEl.innerHTML = render(first.lines, first.lines.length - 1, Infinity);
      return;
    }
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      await typeSnippet(SNIPPETS[i]);
      i = (i + 1) % SNIPPETS.length;
    }
  }

  loop();
})();

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const mobileNav = document.querySelector(".mobile-nav");
if (navToggle && mobileNav) {
  const setNavOpen = (isOpen) => {
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    mobileNav.classList.toggle("open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
  };
  navToggle.addEventListener("click", () => {
    setNavOpen(!navToggle.classList.contains("open"));
  });
  mobileNav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setNavOpen(false));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navToggle.classList.contains("open")) setNavOpen(false);
  });
}

// Scroll-reveal
const revealEls = document.querySelectorAll("[data-reveal]");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
revealEls.forEach((el) => io.observe(el));

// Work tabs
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".tab-panel");

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    const target = tab.dataset.tab;

    tabs.forEach((t) => {
      t.classList.toggle("active", t === tab);
      t.setAttribute("aria-selected", t === tab ? "true" : "false");
    });

    panels.forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.panel === target);
    });

    // replay the entry reveal every time a tab is opened, staggered via CSS transition-delay
    const activePanel = document.querySelector(`.tab-panel[data-panel="${target}"]`);
    if (activePanel) {
      const entries = activePanel.querySelectorAll("[data-reveal]");
      entries.forEach((el) => el.classList.remove("is-visible"));
      // force reflow so the removal is committed before re-adding the class
      void activePanel.offsetWidth;
      entries.forEach((el) => el.classList.add("is-visible"));
    }
  });
});

// Project gallery lightbox — click a screenshot to zoom, arrow keys to browse
const galleryImgs = Array.from(document.querySelectorAll(".proj-gallery img"));
if (galleryImgs.length) {
  const overlay = document.createElement("div");
  overlay.className = "lightbox-overlay";
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">&times;</button>
    <button class="lightbox-prev" aria-label="Previous image">&larr;</button>
    <img class="lightbox-img" src="" alt="">
    <button class="lightbox-next" aria-label="Next image">&rarr;</button>
    <span class="lightbox-count"></span>
  `;
  document.body.appendChild(overlay);

  const lbImg = overlay.querySelector(".lightbox-img");
  const lbCount = overlay.querySelector(".lightbox-count");
  let current = 0;

  function openLightbox(i) {
    current = (i + galleryImgs.length) % galleryImgs.length;
    lbImg.src = galleryImgs[current].getAttribute("src");
    lbImg.alt = galleryImgs[current].getAttribute("alt") || "";
    lbCount.textContent = `${current + 1} / ${galleryImgs.length}`;
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  galleryImgs.forEach((img, i) => {
    img.addEventListener("click", () => openLightbox(i));
  });

  overlay.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
  overlay.querySelector(".lightbox-prev").addEventListener("click", () => openLightbox(current - 1));
  overlay.querySelector(".lightbox-next").addEventListener("click", () => openLightbox(current + 1));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(current - 1);
    if (e.key === "ArrowRight") openLightbox(current + 1);
  });
}
