/* ==========================================================
   charlotte song — interactions
   1. hero: the cloud image as a live dot matrix (cursor scatters it)
   2. dither bands + footer cloud strip
   3. about: dotted bunnies hopping around a ring
   4. desktop: folders you double-click; files burst out
   5. file windows that zoom out of the icon you opened
   ========================================================== */
(() => {
  "use strict";

  const S = window.SITE;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const BLUE = "#6188C5";

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // [bracketed] text is a placeholder: show it dashed so it's easy to spot.
  const ph = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
  const isPlaceholder = (s) => /\[[^\]]+\]/.test(s || "");

  function fitCanvas(canvas, w, h) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function onVisible(el, cb) {
    if (!("IntersectionObserver" in window)) return cb(true);
    new IntersectionObserver((es) => es.forEach((e) => cb(e.isIntersecting)), { rootMargin: "80px" }).observe(el);
  }

  /* ─────────────────────────── cloud dot data ─────────────────────────── */
  const CLOUD = (() => {
    const { w, h, bits } = window.CLOUD_DOTS;
    const bytes = Uint8Array.from(atob(bits), (c) => c.charCodeAt(0));
    const cols = [], rows = [];
    for (let i = 0; i < w * h; i++) {
      if (bytes[i >> 3] & (0x80 >> (i & 7))) { cols.push(i % w); rows.push((i / w) | 0); }
    }
    return { w, h, n: cols.length, cols: Int16Array.from(cols), rows: Int16Array.from(rows) };
  })();
  const dc = $("#dot-count");
  if (dc) dc.textContent = CLOUD.n.toLocaleString();

  /* ─────────────────────────── 1. hero ─────────────────────────── */
  // How zoomed-in the hero clouds are. 1 = the image just covers the screen;
  // lower = smaller dots and more sky (the pattern is mirrored past the image's edges).
  const HERO_ZOOM = 0.78;

  function hero() {
    const section = $(".hero");
    const canvas = $("#clouds");
    // Mask lookup with parity-preserving mirroring, so the checker pattern never seams.
    const mask = new Uint8Array(CLOUD.w * CLOUD.h);
    for (let i = 0; i < CLOUD.n; i++) mask[CLOUD.rows[i] * CLOUD.w + CLOUD.cols[i]] = 1;
    const mirror = (v, n) => { const p = 2 * n - 2, m = ((v % p) + p) % p; return m < n ? m : p - m; };

    let N = 0, bx, by, ox, oy, vx, vy, delay;
    let ctx, W, H, s, d, R;
    const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, in: false };
    let t0 = performance.now(), running = false, visible = true, introDone = reduced;
    const GLYPHS = ["·", ":", "+", "*"];

    function layout() {
      W = section.clientWidth; H = section.clientHeight;
      ctx = fitCanvas(canvas, W, H);
      s = Math.max(1.8, Math.max(W / CLOUD.w, H / CLOUD.h) * HERO_ZOOM);
      d = Math.max(1, s * 0.8);
      R = Math.min(150, Math.max(80, W * 0.085));
      // image stays centered; cells outside it are mirrored copies
      const offX = (W - CLOUD.w * s) / 2, offY = (H - CLOUD.h * s) / 2;
      const c0 = Math.floor(-offX / s) - 1, c1 = Math.ceil((W - offX) / s) + 1;
      const r0 = Math.floor(-offY / s) - 1, r1 = Math.ceil((H - offY) / s) + 1;
      const xs = [], ys = [];
      for (let r = r0; r < r1; r++) {
        const mr = (r < 0 ? mirror(r, 14) : mirror(r, CLOUD.h)) * CLOUD.w; // above the image: plain sky only
        for (let c = c0; c < c1; c++) {
          if (mask[mr + mirror(c, CLOUD.w)]) { xs.push(offX + c * s); ys.push(offY + r * s); }
        }
      }
      const fresh = N === 0;
      N = xs.length;
      bx = Float32Array.from(xs); by = Float32Array.from(ys);
      ox = new Float32Array(N); oy = new Float32Array(N); vx = new Float32Array(N); vy = new Float32Array(N);
      delay = new Float32Array(N);
      if (fresh && !reduced) {
        for (let i = 0; i < N; i++) {
          delay[i] = Math.max(0, bx[i] / W) * 0.9 + Math.random() * 0.35;
          oy[i] = -(10 + Math.random() * 22);
        }
      } else t0 = performance.now() - 2000; // on resize: no replay of the intro
      draw(performance.now());
    }

    function step(now) {
      const t = (now - t0) / 1000;
      let energy = 0;
      const R2 = R * R, k = 0.055, damp = 0.84, h = s / 2;
      for (let i = 0; i < N; i++) {
        if (t < delay[i]) { energy += 1; continue; }
        if (ptr.in) {
          const dx = bx[i] + h + ox[i] - ptr.x, dy = by[i] + h + oy[i] - ptr.y, dd = dx * dx + dy * dy;
          if (dd < R2 && dd > 0.01) {
            const dist = Math.sqrt(dd), f = (1 - dist / R) ** 2 * 2.4;
            vx[i] += (dx / dist) * f + ptr.vx * 0.05 * f;
            vy[i] += (dy / dist) * f + ptr.vy * 0.05 * f;
          }
        }
        if (ox[i] === 0 && oy[i] === 0 && vx[i] === 0 && vy[i] === 0) continue;
        vx[i] = (vx[i] - ox[i] * k) * damp;
        vy[i] = (vy[i] - oy[i] * k) * damp;
        ox[i] += vx[i]; oy[i] += vy[i];
        const e = Math.abs(ox[i]) + Math.abs(oy[i]) + Math.abs(vx[i]) + Math.abs(vy[i]);
        if (e < 0.02) { ox[i] = oy[i] = vx[i] = vy[i] = 0; }
        energy += e;
      }
      ptr.vx *= 0.8; ptr.vy *= 0.8;
      if (!introDone && t > 1.4) introDone = true;
      return energy;
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BLUE;
      const glyphs = [];
      for (let i = 0; i < N; i++) {
        if (t < delay[i]) continue;
        const x = bx[i] + ox[i], y = by[i] + oy[i];
        if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
        const m = Math.abs(ox[i]) + Math.abs(oy[i]);
        if (introDone && m > 7) glyphs.push(x, y, m);
        else ctx.fillRect(x, y, d, d);
      }
      if (glyphs.length) {
        ctx.font = `500 ${Math.max(9, s * 3.6)}px "JetBrains Mono", monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        for (let j = 0; j < glyphs.length; j += 3) {
          const g = GLYPHS[Math.min(3, ((glyphs[j + 2] - 7) / 9) | 0)];
          ctx.fillText(g, glyphs[j] + d / 2, glyphs[j + 1] + d / 2);
        }
      }
    }

    function frame(now) {
      if (!visible) { running = false; return; }
      const e = step(now);
      draw(now);
      if (e > 0.5 || ptr.in) requestAnimationFrame(frame);
      else running = false;
    }
    const kick = () => { if (!running && visible) { running = true; requestAnimationFrame(frame); } };

    section.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (ptr.in) { ptr.vx = x - ptr.x; ptr.vy = y - ptr.y; }
      ptr.x = x; ptr.y = y; ptr.in = true;
      if (!reduced) kick();
    });
    section.addEventListener("pointerleave", () => { ptr.in = false; ptr.x = ptr.y = -1e4; });
    section.addEventListener("pointercancel", () => { ptr.in = false; });

    onVisible(section, (v) => { visible = v; if (v) kick(); });
    addEventListener("resize", layout);
    layout();
    kick();
    if (document.fonts) document.fonts.ready.then(() => draw(performance.now()));

    // name: letters rise in; tagline types out
    const nameEl = $("#hero-name");
    nameEl.setAttribute("aria-label", S.name);
    nameEl.innerHTML = [...S.name].map((c, i) =>
      `<span class="ch" aria-hidden="true" style="animation-delay:${200 + i * 45}ms">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("");
    const tagEl = $("#hero-tag");
    if (reduced) tagEl.textContent = S.tagline;
    else {
      tagEl.textContent = "";
      let i = 0;
      setTimeout(function type() {
        tagEl.textContent = S.tagline.slice(0, ++i);
        if (i < S.tagline.length) setTimeout(type, 28 + Math.random() * 30);
      }, 1100);
    }
  }

  /* ─────────────────────────── 2. dither bands + footer strip ─────────────────────────── */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bands() {
    $$(".dither-band").forEach((c) => {
      const W = c.clientWidth, H = c.clientHeight;
      const ctx = fitCanvas(c, W, H);
      const cell = 4, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
      ctx.fillStyle = c.dataset.from; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.dataset.to;
      for (let y = 0; y < rows; y++) {
        const t = (y + 0.5) / rows;
        for (let x = 0; x < cols; x++) {
          if (BAYER[(y & 3) * 4 + (x & 3)] / 16 < t) ctx.fillRect(x * cell, y * cell, cell, cell);
        }
      }
    });
    // footer: the bottom of the cloud image, as a bookend
    const fc = $("#foot-clouds");
    const W = fc.clientWidth, s = W / CLOUD.w, startRow = 150;
    const H = Math.round((CLOUD.h - startRow) * s);
    fc.style.height = H + "px";
    const ctx = fitCanvas(fc, W, H);
    ctx.fillStyle = BLUE;
    const dd = Math.max(1, s * 0.8);
    for (let i = 0; i < CLOUD.n; i++) {
      if (CLOUD.rows[i] >= startRow) ctx.fillRect(CLOUD.cols[i] * s, (CLOUD.rows[i] - startRow) * s, dd, dd);
    }
  }

  /* ─────────────────────────── 3. about + bunnies ─────────────────────────── */
  function about() {
    $("#about-text").innerHTML = S.about.map((p) => `<p>${ph(p)}</p>`).join("");

    const section = $(".about"), canvas = $("#bunnies"), copy = $("#about-copy");
    const B = window.BUNNY_DOTS, SRC_W = 392, COUNT = 8, LOOP = 46;
    let ctx, W, H, cx, cy, bw, path = [], total = 0, visible = false, running = false;
    const jumps = new Float32Array(COUNT).fill(-1);
    const ptr = { x: -1e4, y: -1e4 };

    function layout() {
      W = section.clientWidth; H = section.clientHeight;
      ctx = fitCanvas(canvas, W, H);
      const r = copy.getBoundingClientRect(), sr = section.getBoundingClientRect();
      cx = r.left - sr.left + r.width / 2; cy = r.top - sr.top + r.height / 2;
      const mobile = W < 720;
      bw = mobile ? 74 : Math.max(118, Math.min(170, W * 0.11));
      const a = mobile ? W / 2 - 30 : Math.min(W * 0.4, r.width / 2 + bw * 1.6);
      const b = mobile ? r.height / 2 + bw * 0.9 : Math.max(r.height / 2 + bw * 0.75, 230);
      const n = mobile ? 5 : 2.3; // superellipse: squarer on phones so the text stays clear
      path = []; total = 0;
      let px, py;
      for (let i = 0; i <= 1200; i++) {
        const t = (i / 1200) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
        const x = cx + a * Math.sign(c) * Math.abs(c) ** (2 / n);
        const y = cy + b * Math.sign(sn) * Math.abs(sn) ** (2 / n);
        if (i) total += Math.hypot(x - px, y - py);
        path.push([x, y, total]); px = x; py = y;
      }
      draw(performance.now());
    }

    function at(u) {
      const target = (((u % 1) + 1) % 1) * total;
      let lo = 0, hi = path.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (path[m][2] < target) lo = m + 1; else hi = m; }
      const p = path[lo], q = path[Math.min(lo + 1, path.length - 1)], o = path[Math.max(lo - 1, 0)];
      return { x: p[0], y: p[1], ang: Math.atan2(q[1] - o[1], q[0] - o[0]) };
    }

    function draw(now) {
      const t = reduced ? 0 : now / 1000;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      const sc = bw / SRC_W, r = Math.max(1.25, 3.3 * sc);
      for (let i = 0; i < COUNT; i++) {
        const p = at(i / COUNT + t / LOOP);
        const ph = (t * 2.4 + i * 0.83) % Math.PI;
        let hop = reduced ? 0 : Math.sin(ph) * bw * 0.1, tilt = reduced ? 0 : -Math.cos(ph) * 0.13;
        if (jumps[i] >= 0) {
          const j = (now - jumps[i]) / 750;
          if (j > 1) jumps[i] = -1; else { hop += Math.sin(Math.PI * j) * bw * 0.55; tilt -= Math.cos(Math.PI * j) * 0.25; }
        }
        // outward normal (path runs clockwise, so outward is the tangent turned left)
        const nx = Math.sin(p.ang), ny = -Math.cos(p.ang);
        const bx = p.x + nx * hop, by = p.y + ny * hop;
        if (!reduced && jumps[i] < 0 && Math.hypot(ptr.x - bx, ptr.y - by) < bw * 0.55) jumps[i] = now;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(p.ang + tilt);
        ctx.beginPath();
        for (const [x, y] of B) { ctx.moveTo(x * sc + r, y * sc); ctx.arc(x * sc, y * sc, r, 0, Math.PI * 2); }
        ctx.fill();
        ctx.restore();
      }
    }

    function frame(now) {
      if (!visible) { running = false; return; }
      draw(now);
      requestAnimationFrame(frame);
    }
    section.addEventListener("pointermove", (e) => {
      const r = section.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
    });
    section.addEventListener("pointerleave", () => { ptr.x = ptr.y = -1e4; });
    onVisible(section, (v) => {
      visible = v;
      if (v && !reduced && !running) { running = true; requestAnimationFrame(frame); }
    });
    addEventListener("resize", layout);
    if (document.fonts) document.fonts.ready.then(layout);
    layout();
  }

  /* ─────────────────────────── dot-matrix icons ─────────────────────────── */
  const ICONS = {
    note: [
      "............", "....#######.", "....#######.", "....#.....#.", "....#.....#.", "....#.....#.",
      "....#.....#.", "..###...###.", ".####..####.", ".####..####.", "..##....##..", "............"],
    star: [
      ".....##.....", ".....##.....", "....####....", "############", ".##########.", "..########..",
      "...######...", "...######...", "..###..###..", "..##....##..", ".#........#.", "............"],
    globe: [
      "....####....", "..##.##.##..", ".#..#..#..#.", ".#.#....#.#.", "############", "#..#....#..#",
      "#..#....#..#", "############", ".#.#....#.#.", ".#..#..#..#.", "..##.##.##..", "....####...."],
    cloud: [
      "............", "............", "............", ".....###....", "....#####...", "..#########.",
      ".##########.", "############", "############", ".##########.", "............", "............"],
  };
  function dotIcon(name, cssSize, color = "#fff") {
    const c = document.createElement("canvas");
    const ctx = fitCanvas(c, cssSize, cssSize);
    const g = ICONS[name], n = g.length, cell = cssSize / n;
    ctx.fillStyle = color;
    g.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === "#") { ctx.beginPath(); ctx.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2); ctx.fill(); }
    }));
    return c;
  }
  function artFor(item, size, cls = "") {
    if (item.logo) {
      const img = new Image();
      img.src = item.logo; img.alt = "";
      if (item.logoStyle === "round") img.className = "round";
      return img;
    }
    return dotIcon(item.icon || "star", size);
  }

  /* ─────────────────────────── 4. desktop + folders ─────────────────────────── */
  const desk = {};
  function desktop() {
    const stage = $("#stage"), back = $("#back-btn"), pathEl = $("#desk-path"), hint = $("#desk-hint");
    let lastPointer = "mouse", open = null, selected = null;
    const icons = [];
    const items = {};

    // folders
    S.folders.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "icon"; b.dataset.folder = f.id;
      b.setAttribute("aria-label", `${f.label} folder, ${f.items.length} items`);
      b.innerHTML = `<span class="folder" aria-hidden="true"><span class="folder-back"></span><span class="folder-front"></span></span>
                     <span class="icon-label">${esc(f.label)}</span>`;
      stage.appendChild(b); icons.push(b);
      items[f.id] = f.items.map((it, i) => {
        const el = document.createElement("button");
        el.type = "button"; el.className = "item"; el.tabIndex = -1;
        el.setAttribute("aria-label", `${it.name}: ${it.role}. open file`);
        const art = document.createElement("span"); art.className = "item-art"; art.appendChild(artFor(it, 104));
        el.appendChild(art);
        el.insertAdjacentHTML("beforeend", `<span class="item-name">${esc(it.name)}</span><span class="item-when">${esc(it.when)}</span>`);
        el.addEventListener("click", () => openWindow({ type: "item", folder: f, index: i }, el));
        stage.appendChild(el);
        return el;
      });
    });

    // resume file
    const rb = document.createElement("button");
    rb.type = "button"; rb.className = "icon"; rb.dataset.resume = "1";
    rb.setAttribute("aria-label", "resume.pdf");
    rb.innerHTML = `<span class="doc" aria-hidden="true"></span><span class="icon-label">resume.pdf</span>`;
    const docC = document.createElement("canvas");
    rb.querySelector(".doc").appendChild(docC);
    stage.appendChild(rb); icons.push(rb);
    requestAnimationFrame(() => {
      const w = 64, h = 68, ctx = fitCanvas(docC, w, h);
      ctx.fillStyle = BLUE;
      const lens = [0.55, 1, 0.9, 0.7, 0, 1, 0.85, 0.95, 0.6, 0, 0.9, 0.75];
      lens.forEach((l, row) => { for (let x = 0; x < Math.round(l * 14); x++) { ctx.beginPath(); ctx.arc(2 + x * 4.4, 3 + row * 5.6, row === 0 ? 1.8 : 1.2, 0, 7); ctx.fill(); } });
    });

    const place = (el, x, y, scale = 1) => {
      el.style.transform = `translate(${x - el.offsetWidth / 2}px, ${y - el.offsetHeight / 2}px) scale(${scale})`;
    };

    function layout(animateItems = false) {
      const W = stage.clientWidth, mobile = W < 640;
      if (!open) {
        if (mobile) {
          stage.style.height = "470px";
          place(icons[0], W * 0.27, 120); place(icons[1], W * 0.73, 120); place(icons[2], W / 2, 340);
        } else {
          stage.style.height = "380px";
          const gap = Math.min(270, W * 0.28);
          icons.forEach((ic, i) => place(ic, W / 2 + (i - 1) * gap, 180));
        }
        icons.forEach((ic) => ic.classList.remove("is-hidden"));
        return;
      }
      const fi = icons.find((ic) => ic.dataset.folder === open);
      const list = items[open];
      let fx, fy, targets;
      if (mobile) {
        fx = W / 2; fy = 130;
        const rowH = 178, rows = Math.ceil(list.length / 2);
        stage.style.height = 290 + rows * rowH + "px";
        targets = list.map((_, i) => {
          const lastAlone = list.length % 2 && i === list.length - 1;
          return [lastAlone ? W / 2 : i % 2 ? W * 0.75 : W * 0.25, 300 + ((i / 2) | 0) * rowH];
        });
      } else {
        stage.style.height = "660px";
        fx = W / 2; fy = 330;
        const rx = Math.min(W * 0.36, 400), ry = 205;
        const angs = list.length === 4 ? [-150, -30, 150, 30] : list.length === 3 ? [-90, 10, 170] : list.map((_, i) => -90 + (360 / list.length) * i);
        targets = angs.map((a) => [fx + Math.cos((a * Math.PI) / 180) * rx, fy + Math.sin((a * Math.PI) / 180) * ry]);
      }
      icons.forEach((ic) => { if (ic !== fi) ic.classList.add("is-hidden"); });
      place(fi, fx, fy);
      list.forEach((el, i) => {
        if (animateItems) {
          el.style.transition = "none";
          place(el, fx, fy, 0.25);
          el.offsetWidth; // reflow
          el.style.transition = "";
          el.style.transitionDelay = reduced ? "0ms" : `${120 + i * 70}ms`;
        }
        el.classList.add("is-out"); el.tabIndex = 0;
        place(el, targets[i][0], targets[i][1]);
      });
    }

    function openFolder(id) {
      if (open === id) return;
      if (open) closeFolder(true);
      open = id; select(null);
      const fi = icons.find((ic) => ic.dataset.folder === id);
      fi.classList.add("is-open");
      fi.setAttribute("aria-expanded", "true");
      const f = S.folders.find((x) => x.id === id);
      pathEl.textContent = `~/charlotte/desktop/${f.label.replace(/\s*&\s*/g, "-and-").replace(/\s+/g, "-")}`;
      hint.innerHTML = `<span class="hint-fine">click a file to open it · esc to go back</span><span class="hint-touch">tap a file to open it</span>`;
      back.hidden = false;
      layout(true);
      syncNav();
    }

    function closeFolder(instant = false) {
      if (!open) return;
      const fi = icons.find((ic) => ic.dataset.folder === open);
      const r = fi.style.transform;
      items[open].forEach((el) => {
        el.style.transitionDelay = "0ms";
        el.classList.remove("is-out"); el.tabIndex = -1;
        el.style.transform = r + " scale(.25)";
      });
      fi.classList.remove("is-open");
      fi.setAttribute("aria-expanded", "false");
      open = null;
      pathEl.textContent = "~/charlotte/desktop";
      hint.innerHTML = `<span class="hint-fine">double-click a folder to open it</span><span class="hint-touch">tap a folder to open it</span>`;
      back.hidden = true;
      if (!instant) { layout(); fi.focus({ preventScroll: true }); }
      syncNav();
    }

    function select(ic) {
      if (selected) selected.classList.remove("is-selected");
      selected = ic;
      if (ic) ic.classList.add("is-selected");
    }

    function activate(ic) {
      if (ic.dataset.resume) return openWindow({ type: "resume" }, ic);
      const id = ic.dataset.folder;
      open === id ? closeFolder() : openFolder(id);
    }

    icons.forEach((ic) => {
      ic.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType; });
      ic.addEventListener("click", (e) => {
        e.stopPropagation();
        if (e.detail === 0 || lastPointer !== "mouse") return activate(ic); // keyboard / touch / pen
        if (ic.classList.contains("is-open")) return; // already open: dblclick closes
        select(ic);
      });
      ic.addEventListener("dblclick", (e) => { e.preventDefault(); activate(ic); });
    });
    stage.addEventListener("click", () => select(null));
    back.addEventListener("click", (e) => { e.stopPropagation(); closeFolder(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && open && $("#win-layer").hidden) closeFolder(); });
    addEventListener("resize", () => layout());
    if (document.fonts) document.fonts.ready.then(() => layout());
    layout();

    Object.assign(desk, { openFolder, closeFolder, getOpen: () => open });
  }

  /* ─────────────────────────── 5. file window ─────────────────────────── */
  const layer = $("#win-layer"), win = $("#win"), body = $("#win-body"), foot = $("#win-foot"), wpath = $("#win-path");
  let origin = null, current = null;

  function renderItem(f, i) {
    const it = f.items[i];
    const folderSlug = f.label.replace(/\s*&\s*/g, "-and-").replace(/\s+/g, "-");
    wpath.textContent = `~/desktop/${folderSlug}/${it.id}.txt`;
    body.innerHTML = `
      <div class="win-head">
        <div class="win-art"></div>
        <div>
          <h3 class="win-title" id="win-title">${esc(it.name)}</h3>
          <p class="win-role">${ph(it.role)}</p>
          <p class="win-meta">${ph(it.when)}${it.where ? " · " + ph(it.where) : ""}</p>
        </div>
      </div>
      ${it.summary ? `<p class="win-summary">${ph(it.summary)}</p>` : ""}
      ${it.bullets && it.bullets.length ? `<p class="rule" aria-hidden="true">── highlights ${"─".repeat(80)}</p>
        <ul class="win-list">${it.bullets.map((b) => `<li>${ph(b)}</li>`).join("")}</ul>` : ""}
      ${it.tags && it.tags.length ? `<div class="tags">${it.tags.map((t) => `<span class="tag">[ ${ph(t)} ]</span>`).join("")}</div>` : ""}
      ${it.link ? `<div class="win-cta"><a class="pill pill-solid" href="${esc(it.link.href)}" target="_blank" rel="noopener">[ ${esc(it.link.label)} ↗ ]</a></div>` : ""}`;
    const wa = $(".win-art", body);
    wa.appendChild(artFor(it, 84));
    if (it.logo && it.tile !== "blue") wa.classList.add("light");
    foot.innerHTML = `
      <button type="button" data-step="-1" ${i === 0 ? "disabled" : ""}>← prev</button>
      <span>${i + 1} / ${f.items.length}</span>
      <button type="button" data-step="1" ${i === f.items.length - 1 ? "disabled" : ""}>next →</button>`;
    foot.hidden = false;
  }

  function renderResume() {
    const L = S.links;
    wpath.textContent = "~/desktop/resume.pdf";
    const work = S.folders.find((f) => f.id === "work");
    const proj = S.folders.find((f) => f.id === "projects");
    body.innerHTML = `
      <div class="win-head">
        <div class="win-art"></div>
        <div>
          <h3 class="win-title" id="win-title">resume</h3>
          <p class="win-role">charlotte song</p>
          <p class="win-meta">usc viterbi · b.s. computer science & business administration · 2028</p>
        </div>
      </div>
      <p class="win-summary">the one-page version of everything on this desktop.</p>
      <p class="rule" aria-hidden="true">── at a glance ${"─".repeat(80)}</p>
      <ul class="win-list">
        ${work ? `<li><b>experience:</b> ${work.items.map((x) => esc(x.name)).join(", ")}</li>` : ""}
        ${proj ? `<li><b>projects & leadership:</b> ${proj.items.map((x) => esc(x.name)).join(", ")}</li>` : ""}
      </ul>
      <div class="win-cta">
        <a class="pill pill-solid" href="${esc(L.resume)}" target="_blank" rel="noopener">[ open resume.pdf ↗ ]</a>
        <button type="button" class="pill" data-copy-email>[ copy email ]</button>
        <a class="pill" href="${esc(L.linkedin)}" target="_blank" rel="noopener">[ linkedin ↗ ]</a>
      </div>
      <p class="win-meta" style="margin-top:6px">${esc(L.email)}</p>`;
    const art = $(".win-art", body);
    const c = document.createElement("canvas"); art.appendChild(c);
    const ctx = fitCanvas(c, 84, 84);
    ctx.fillStyle = "#fff";
    [0.5, 1, 0.85, 0.7, 0, 1, 0.9, 0.95, 0, 0.8, 0.6].forEach((l, row) => {
      for (let x = 0; x < Math.round(l * 12); x++) { ctx.beginPath(); ctx.arc(8 + x * 6.2, 10 + row * 6.6, row === 0 ? 2.2 : 1.6, 0, 7); ctx.fill(); }
    });
    foot.hidden = true;
  }

  function openWindow(what, from) {
    const wasOpen = !layer.hidden;
    current = what;
    if (!wasOpen) origin = from;
    what.type === "resume" ? renderResume() : renderItem(what.folder, what.index);
    if (wasOpen) return;
    layer.hidden = false;
    document.body.style.overflow = "hidden";
    win.focus({ preventScroll: true });
    if (reduced || !from) return;
    const a = from.getBoundingClientRect(), b = win.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    win.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0, borderRadius: "40px" },
       { transform: "none", opacity: 1, borderRadius: "16px" }],
      { duration: 460, easing: "cubic-bezier(.2,.9,.25,1.08)" });
    $(".win-backdrop").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
  }

  function closeWindow() {
    if (layer.hidden) return;
    const done = () => {
      layer.hidden = true; document.body.style.overflow = "";
      if (origin && document.contains(origin)) origin.focus({ preventScroll: true });
      origin = null; current = null;
    };
    if (reduced || !origin) return done();
    const a = origin.getBoundingClientRect(), b = win.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    $(".win-backdrop").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: "forwards" }).onfinish = function () { this.cancel(); };
    win.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0 }],
      { duration: 300, easing: "cubic-bezier(.5,0,.75,0)" }).onfinish = done;
  }

  function step(dir) {
    if (!current || current.type !== "item") return;
    const n = current.folder.items.length, i = current.index + dir;
    if (i < 0 || i >= n) return;
    current.index = i;
    renderItem(current.folder, i);
    body.animate([{ opacity: 0, transform: `translateX(${dir * 18}px)` }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" });
  }

  layer.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeWindow();
    const s = e.target.closest("[data-step]");
    if (s) step(+s.dataset.step);
    if (e.target.closest("[data-copy-email]")) copyEmail();
  });
  addEventListener("keydown", (e) => {
    if (layer.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeWindow(); }
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "Tab") { // keep focus inside the window
      const f = $$("button:not([disabled]), a[href], [tabindex='0']", win);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === win)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ─────────────────────────── contact + nav ─────────────────────────── */
  const toastEl = $("#toast");
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }
  async function copyEmail() {
    const email = S.links.email;
    if (isPlaceholder(email)) return toast("add your email in content.js first");
    try { await navigator.clipboard.writeText(email); toast(`copied ✓  ${email}`); }
    catch { toast(email); }
  }

  function contact() {
    $("#copy-email").addEventListener("click", copyEmail);
    $("#link-linkedin").href = S.links.linkedin;
    const gh = $("#link-github");
    if (isPlaceholder(S.links.github)) gh.remove(); // shows up once you add your handle in content.js
    else gh.href = S.links.github;
    const line = $("#email-line");
    if (isPlaceholder(S.links.email)) line.innerHTML = ph(S.links.email);
    else line.innerHTML = `<a href="mailto:${esc(S.links.email)}">${esc(S.links.email)}</a>`;
  }

  const navLinks = $$(".nav-links a");
  let inView = "top";
  function syncNav() {
    navLinks.forEach((a) => {
      let on = false;
      if (inView === "about") on = a.dataset.nav === "about";
      if (inView === "desktop") on = a.dataset.open === (desk.getOpen() || "work");
      if (inView === "contact") on = a.dataset.nav === "contact";
      a.classList.toggle("is-active", on);
    });
  }
  function nav() {
    $$("[data-open]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      const id = a.dataset.open, target = $("#desktop");
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
      const go = () => desk.openFolder(id);
      const r = target.getBoundingClientRect();
      if (Math.abs(r.top) < 40) go(); else setTimeout(go, reduced ? 0 : 650);
    }));
    $$("[data-open-resume]").forEach((b) => b.addEventListener("click", () => openWindow({ type: "resume" }, b)));
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { inView = e.target.id; syncNav(); } }), { rootMargin: "-45% 0px -45% 0px" });
      ["top", "about", "desktop", "contact"].forEach((id) => io.observe(document.getElementById(id)));
    }
  }

  /* ─────────────────────────── go ─────────────────────────── */
  hero();
  bands();
  about();
  desktop();
  contact();
  nav();
  let rz;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(bands, 120); });
})();
