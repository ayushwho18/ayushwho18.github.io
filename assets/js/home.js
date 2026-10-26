/* Home page engine. Plain JS. Optional libraries: three.js (WebGL), d3-delaunay (Voronoi). */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t) return t === "dark";
    return matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function onVisible(el, cb, opts) {
    if (!el) return;
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, opts || { threshold: 0.15 });
    io.observe(el);
  }
  var INR = function (n) { return "₹" + Math.round(n).toLocaleString("en-IN"); };

  /* ============ HERO: status, swap words, two-script name ============ */
  (function () {
    var clock = $("#hx-clock"), day = $("#hx-day");
    function tick() {
      var now = new Date();
      if (clock) clock.textContent = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) + " IST";
      if (day) {
        var p = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric" }).formatToParts(now);
        var y = +p.find(function (x) { return x.type === "year"; }).value, m = +p.find(function (x) { return x.type === "month"; }).value;
        day.textContent = Math.max(1, (y - 2025) * 12 + (m - 8) + 1);
      }
    }
    tick(); setInterval(tick, 20000);

    var words = ["searchable", "verifiable", "lendable", "accountable", "faster"];
    var el = $("#hx-swap");
    if (el && !reduce) {
      var wi = 0, ci = words[0].length, del = true;
      setInterval(function () {
        var w = words[wi];
        if (del) { ci--; if (ci <= 0) { del = false; wi = (wi + 1) % words.length; } }
        else { ci++; if (ci >= words[wi].length) { del = true; ci = words[wi].length + 14; } }
        el.textContent = words[wi].slice(0, Math.max(0, Math.min(ci, words[wi].length)));
      }, 85);
    }
    var nm = $(".hx-name");
    if (nm && !reduce) setInterval(function () { nm.classList.toggle("show-hi"); }, 4200);

    // magnetic buttons
    if (!reduce && matchMedia("(pointer:fine)").matches) $$(".mag").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18) + "px," + ((e.clientY - r.top - r.height / 2) * 0.28) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  })();

  /* ============ HERO CANVAS: live cadastral map ============ */
  (function () {
    var c = $("#hx-canvas"); if (!c) return;
    var ctx = c.getContext("2d"), W = 0, H = 0, dpr = 1;
    var cells = [], packets = [], mouse = { x: -999, y: -999 }, running = false, raf = 0, col = {};
    var seed = 11; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function colors() {
      var d = isDark();
      col = { line: d ? "rgba(69,187,164,.20)" : "rgba(10,117,100,.20)", fill: d ? "rgba(69,187,164,.16)" : "rgba(10,117,100,.10)",
        hot: d ? "rgba(185,147,219,.30)" : "rgba(107,58,147,.14)", dot: d ? "#8FDCCB" : "#0A7564", dot2: d ? "#B993DB" : "#6B3A93",
        lab: d ? "rgba(227,236,234,.75)" : "rgba(18,33,40,.7)" };
    }
    function polyFallback(pts) { // jittered grid polygons when d3-delaunay is unavailable
      var out = [], cols = 12, rows = 8, cw = W / cols, rh = H / rows, g = [];
      for (var i = 0; i <= cols; i++) { g[i] = []; for (var j = 0; j <= rows; j++) g[i][j] = [i * cw + (i && i < cols ? (rnd() - .5) * cw * .6 : 0), j * rh + (j && j < rows ? (rnd() - .5) * rh * .6 : 0)]; }
      for (i = 0; i < cols; i++) for (j = 0; j < rows; j++) out.push({ poly: [g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]], nb: [] });
      for (i = 0; i < out.length; i++) { var a = i % rows, b = Math.floor(i / rows); [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(function (o) { var aa = a + o[0], bb = b + o[1]; if (aa >= 0 && aa < rows && bb >= 0 && bb < cols) out[i].nb.push(bb * rows + aa); }); }
      return out;
    }
    function build() {
      dpr = Math.min(2, devicePixelRatio || 1); W = c.clientWidth; H = c.clientHeight;
      c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed = 11; var n = Math.round(Math.min(170, Math.max(60, W * H / 7000))), pts = [];
      for (var i = 0; i < n; i++) { var x = Math.pow(rnd(), 0.55) * W; pts.push([x, rnd() * H]); }
      if (window.d3 && d3.Delaunay) {
        var del = d3.Delaunay.from(pts), vor = del.voronoi([0, 0, W, H]); cells = [];
        for (i = 0; i < n; i++) { var poly = vor.cellPolygon(i); if (!poly) continue; cells.push({ poly: poly, nb: Array.from(del.neighbors(i)), idx: i }); }
        // re-map neighbour indices to cells array
        var map = {}; cells.forEach(function (cl, k) { map[cl.idx] = k; });
        cells.forEach(function (cl) { cl.nb = cl.nb.map(function (j) { return map[j]; }).filter(function (j) { return j !== undefined; }); });
      } else cells = polyFallback(pts);
      cells.forEach(function (cl) {
        var sx = 0, sy = 0; cl.poly.forEach(function (p) { sx += p[0]; sy += p[1]; });
        cl.cx = sx / cl.poly.length; cl.cy = sy / cl.poly.length; cl.reg = rnd() < 0.18 ? 1 : 0; cl.flash = 0;
        cl.kh = (100 + Math.floor(rnd() * 880)) + "/" + (1 + Math.floor(rnd() * 5));
      });
      packets = [];
    }
    function spawn() {
      if (!cells.length) return;
      var a = cells[Math.floor(Math.random() * cells.length)]; if (!a.nb.length) return;
      var path = [a], cur = a;
      for (var k = 0; k < 3 + Math.floor(Math.random() * 4); k++) { var nx = cells[cur.nb[Math.floor(Math.random() * cur.nb.length)]]; if (!nx) break; path.push(nx); cur = nx; }
      packets.push({ path: path, seg: 0, t: 0, sp: 0.012 + Math.random() * 0.018, alt: Math.random() < 0.25 });
    }
    function draw(dt) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < cells.length; i++) {
        var cl = cells[i], p = cl.poly, dx = cl.cx - mouse.x, dy = cl.cy - mouse.y, near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 170);
        ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]); for (var j = 1; j < p.length; j++) ctx.lineTo(p[j][0], p[j][1]); ctx.closePath();
        if (cl.reg || cl.flash > 0 || near > 0) {
          ctx.globalAlpha = Math.min(1, cl.reg * 0.9 + cl.flash + near * 1.2);
          ctx.fillStyle = cl.flash > 0.05 || near > .55 ? col.hot : col.fill; ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = col.line; ctx.lineWidth = 1; ctx.stroke();
        if (near > 0.55) { ctx.fillStyle = col.lab; ctx.font = "600 11px Hind, sans-serif"; ctx.fillText("खसरा " + cl.kh, cl.cx - 22, cl.cy + 4); }
        if (cl.flash > 0) cl.flash = Math.max(0, cl.flash - dt * 0.0011);
      }
      for (i = packets.length - 1; i >= 0; i--) {
        var pk = packets[i], a = pk.path[pk.seg], b = pk.path[pk.seg + 1];
        if (!b) { pk.path[pk.seg].reg = 1; pk.path[pk.seg].flash = 1; packets.splice(i, 1); continue; }
        pk.t += pk.sp * dt / 16; if (pk.t >= 1) { pk.t = 0; pk.seg++; continue; }
        var x = a.cx + (b.cx - a.cx) * pk.t, y = a.cy + (b.cy - a.cy) * pk.t;
        ctx.strokeStyle = pk.alt ? col.dot2 : col.dot; ctx.globalAlpha = .35; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(a.cx, a.cy); ctx.lineTo(x, y); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = pk.alt ? col.dot2 : col.dot; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 6.283); ctx.fill();
      }
      if (packets.length < 14 && Math.random() < 0.08) spawn();
      // slowly forget registrations so the map keeps breathing
      if (Math.random() < 0.02) { var r = cells[Math.floor(Math.random() * cells.length)]; if (r) r.reg = 0; }
    }
    var last = 0;
    function loop(t) { var dt = Math.min(48, t - (last || t)); last = t; draw(dt); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (running || reduce) return; running = true; last = 0; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function init() { colors(); build(); if (reduce) { for (var k = 0; k < 8; k++) spawn(); draw(16); } else start(); }
    c.addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    $(".hx").addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; if (reduce) draw(16); });
    $(".hx").addEventListener("pointerleave", function () { mouse.x = mouse.y = -999; });
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { build(); if (reduce) draw(16); }, 150); });
    document.addEventListener("themechange", function () { colors(); if (reduce) draw(16); });
    matchMedia("(prefers-color-scheme: dark)").addEventListener && matchMedia("(prefers-color-scheme: dark)").addEventListener("change", colors);
    onVisible(c, function (v) { v ? start() : stop(); }, { threshold: 0 });
    if (document.readyState === "complete") init(); else addEventListener("load", init);
  })();

  /* ============ COUNTERS ============ */
  $$(".num b[data-count]").forEach(function (b) {
    var to = parseFloat(b.dataset.count), dec = +(b.dataset.dec || 0), pre = b.dataset.pre || "", suf = b.dataset.suf || "", done = false;
    onVisible(b, function (v) {
      if (!v || done || reduce) return; done = true; var t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3);
        b.textContent = pre + (to * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
    }, { threshold: 0.6 });
  });

  /* ============ DEED JOURNEY (scroll-driven SVG) ============ */
  (function () {
    var sec = $("#journey"), svg = $("#dj-svg"); if (!sec || !svg) return;
    var NS = "http://www.w3.org/2000/svg", steps = $$("#dj-steps li");
    function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
    var nodes = [[90, 60], [300, 70], [430, 170], [280, 260], [110, 330], [260, 430], [440, 500]];
    var names = ["Slot", "Stamp duty", "Sub-Registrar", "Certified copy", "Auto-mutation", "Lender", "1076"];
    var d = "M" + nodes.map(function (n) { return n.join(","); }).join(" L");
    el("path", { d: d, fill: "none", stroke: "var(--rule-2)", "stroke-width": 2, "stroke-dasharray": "6 6" });
    var prog = el("path", { d: d, fill: "none", stroke: "url(#djg)", "stroke-width": 4, "stroke-linecap": "round" });
    var defs = el("defs", {}); var lg = el("linearGradient", { id: "djg", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0", "stop-color": "var(--teal)" }, lg); el("stop", { offset: "1", "stop-color": "var(--stamp)" }, lg);
    var L = prog.getTotalLength(); prog.style.strokeDasharray = L; prog.style.strokeDashoffset = L;
    var circles = nodes.map(function (n, i) {
      var g = el("g", {});
      var mine = steps[i] && steps[i].classList.contains("mine");
      el("circle", { cx: n[0], cy: n[1], r: 26, fill: "var(--surface)", stroke: mine ? "var(--stamp)" : "var(--rule-2)", "stroke-width": 2 }, g);
      var t = el("text", { x: n[0], y: n[1] + 5, "text-anchor": "middle", "font-size": 14, "font-weight": 700, fill: "var(--muted)" }, g); t.textContent = i + 1;
      var lb = el("text", { x: n[0], y: n[1] + 46, "text-anchor": "middle", "font-size": 13, "font-weight": 600, fill: "var(--ink-2)" }, g); lb.textContent = names[i];
      return g;
    });
    // the deed
    var deed = el("g", {});
    el("rect", { x: -18, y: -23, width: 36, height: 46, rx: 4, fill: "var(--paper)", stroke: "var(--teal)", "stroke-width": 2 }, deed);
    [-11, -4, 3].forEach(function (yy) { el("line", { x1: -10, x2: 10, y1: yy, y2: yy, stroke: "var(--teal)", "stroke-width": 1.6, opacity: .7 }, deed); });
    el("circle", { cx: 7, cy: 13, r: 5, fill: "var(--stamp)" }, deed);
    function set(p) {
      p = Math.max(0, Math.min(1, p));
      prog.style.strokeDashoffset = L * (1 - p);
      var pt = prog.getPointAtLength(L * p); deed.setAttribute("transform", "translate(" + pt.x + "," + pt.y + ")");
      var active = Math.min(nodes.length - 1, Math.floor(p * nodes.length * 0.999));
      steps.forEach(function (s, i) { s.classList.toggle("on", i === active); s.classList.toggle("done", i < active); });
      circles.forEach(function (g, i) { var cc = g.querySelector("circle"); cc.setAttribute("fill", i <= active ? (i === active ? "var(--teal)" : "var(--teal-soft)") : "var(--surface)");
        g.querySelector("text").setAttribute("fill", i === active ? "var(--paper)" : (i < active ? "var(--teal-deep)" : "var(--muted)")); });
    }
    var sticky = matchMedia("(min-width: 861px)");
    function onScroll() {
      if (!sticky.matches) return;
      var r = sec.getBoundingClientRect(), total = sec.offsetHeight - innerHeight;
      set(total > 0 ? -r.top / total : 0);
    }
    if (reduce || !sticky.matches) {
      // no scroll-jacking: show the whole journey and let steps be tapped
      set(1); steps.forEach(function (s, i) { s.classList.remove("on"); s.classList.add("done"); s.addEventListener("click", function () { set((i + .5) / nodes.length); }); });
    } else { addEventListener("scroll", onScroll, { passive: true }); onScroll(); }
  })();

  /* ============ DEPARTMENT TABS ============ */
  (function () {
    var tabs = $$(".dtab"); if (!tabs.length) return;
    function sel(t) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { sel(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!k) return;
        var n = tabs[(i + k + tabs.length) % tabs.length]; sel(n); n.focus();
      });
    });
  })();

  /* ============ 3D helpers ============ */
  function threeReady(cb) {
    var tries = 0;
    (function wait() { if (window.THREE) return cb(); if (++tries > 60) return cb(false); setTimeout(wait, 100); })();
  }
  function fallback(box, msg) { var f = document.createElement("div"); f.className = "fallback"; f.textContent = msg; box.appendChild(f); }
  function makeRenderer(box) {
    var r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    box.appendChild(r.domElement); return r;
  }
  function fit(r, cam, box) { var w = box.clientWidth, h = box.clientHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

  /* ============ 3D BARS: ten states ============ */
  (function () {
    var box = $("#bars3d"); if (!box) return;
    var started = false;
    onVisible(box, function (v) { if (v && !started) { started = true; threeReady(go); } }, { threshold: 0.05 });
    function go(ok) {
      if (ok === false || !window.THREE) return fallback(box, "3D view needs WebGL. The full table is in the scorecard.");
      fetch("/api/registries.json").then(function (r) { return r.json(); }).then(build).catch(function () { fallback(box, "Could not load /api/registries.json."); });
    }
    function build(data) {
      var r = makeRenderer(box); if (!r) return fallback(box, "3D view needs WebGL.");
      var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
      cam.position.set(9, 10, 16); fit(r, cam, box);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.85));
      var sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(6, 14, 8); scene.add(sun);
      var st = data.states, lo = Math.log10(600), hi = Math.log10(45000);
      var c0 = new THREE.Color("#BFE6DC"), c1 = new THREE.Color("#3FA48F"), c2 = new THREE.Color("#064A40");
      var base = new THREE.Mesh(new THREE.BoxGeometry(st.length * 1.6 + 1, 0.2, 3.2), new THREE.MeshStandardMaterial({ color: isDark() ? 0x1b2a2e : 0xdfe7e4 }));
      base.position.y = -0.1; scene.add(base);
      var bars = [], grp = new THREE.Group(); scene.add(grp);
      st.forEach(function (s, i) {
        var t = (Math.log10(s.stamps_registration_cr.be_2026_27) - lo) / (hi - lo); t = Math.max(0, Math.min(1, t));
        var colr = t < .5 ? c0.clone().lerp(c1, t * 2) : c1.clone().lerp(c2, (t - .5) * 2);
        var h = s.score / 12;
        var m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: colr, roughness: .55, metalness: .05 }));
        m.position.set((i - (st.length - 1) / 2) * 1.6, 0, 0); m.scale.set(1, 0.001, 1); m.userData = { s: s, h: h, col: colr.clone() };
        grp.add(m); bars.push(m);
      });
      var ctrl = THREE.OrbitControls ? new THREE.OrbitControls(cam, r.domElement) : null;
      if (ctrl) { ctrl.enableDamping = true; ctrl.enableZoom = false; ctrl.enablePan = false; ctrl.minPolarAngle = .4; ctrl.maxPolarAngle = 1.35; ctrl.autoRotate = !reduce; ctrl.autoRotateSpeed = 0.8; ctrl.target.set(0, 2.5, 0); }
      cam.lookAt(0, 2.5, 0);
      var ray = new THREE.Raycaster(), mv = new THREE.Vector2(-9, -9), pick = $("#bar-pick"), hovered = null;
      r.domElement.addEventListener("pointermove", function (e) { var b = r.domElement.getBoundingClientRect(); mv.x = (e.clientX - b.left) / b.width * 2 - 1; mv.y = -(e.clientY - b.top) / b.height * 2 + 1; });
      r.domElement.addEventListener("pointerleave", function () { mv.set(-9, -9); });
      var t0 = performance.now(), running = true;
      onVisible(box, function (v) { running = v; if (v) requestAnimationFrame(loop); }, { threshold: 0 });
      function loop(t) {
        var k = reduce ? 1 : Math.min(1, (t - t0) / 1400);
        bars.forEach(function (m, i) { var kk = Math.max(0, Math.min(1, k * 1.6 - i * .06)), e = 1 - Math.pow(1 - kk, 3), h = m.userData.h * e;
          m.scale.y = Math.max(0.001, h); m.position.y = h / 2; });
        ray.setFromCamera(mv, cam); var hit = ray.intersectObjects(bars)[0];
        var now = hit ? hit.object : null;
        if (now !== hovered) {
          if (hovered) hovered.material.emissive.setHex(0);
          hovered = now;
          if (hovered) { hovered.material.emissive.setHex(0x553377); var s = hovered.userData.s;
            pick.textContent = "#" + s.rank + " " + s.name + " · score " + s.score + " · ₹" + s.stamps_registration_cr.be_2026_27.toLocaleString("en-IN") + " Cr budgeted 2026–27"; }
        }
        if (ctrl) ctrl.update(); r.render(scene, cam);
        if (running) requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      addEventListener("resize", function () { fit(r, cam, box); });
      document.addEventListener("themechange", function () { base.material.color.setHex(isDark() ? 0x1b2a2e : 0xdfe7e4); });
      pick.textContent = "Hover or tap a bar. Top: #1 " + st[0].name + " (" + st[0].score + ").";
    }
  })();

  /* ============ OFFICE RACE ============ */
  (function () {
    var track = $("#race"), btn = $("#race-go"), out = $("#race-out"); if (!track) return;
    var MAX = 12, PROMISE = 5, offices = "ABCDEFGHIJ".split("");
    function times() { // synthetic, right-skewed working days
      return offices.map(function () { var u = Math.random(), v = Math.random(); var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); return Math.max(1.5, Math.min(MAX, Math.exp(1.25 + 0.42 * z))); });
    }
    track.innerHTML = offices.map(function (o) { return '<div class="race-row"><span>Office ' + o + '</span><div class="lane"><i></i></div><b>—</b></div>'; }).join("") +
      '<div class="promise" style="left:calc(80px + (100% - 142px) * ' + (PROMISE / MAX) + ')"><span>State promise: ' + PROMISE + ' days</span></div>';
    function run() {
      var ts = times(), rows = $$(".race-row", track), late = 0, sorted = ts.slice().sort(function (a, b) { return a - b; });
      rows.forEach(function (row, i) {
        var t = ts[i], isLate = t > PROMISE; if (isLate) late++;
        row.classList.toggle("late", isLate);
        var bar = row.querySelector("i"); bar.style.transition = "none"; bar.style.width = "0";
        void bar.offsetWidth; bar.style.transition = reduce ? "none" : ""; bar.style.transitionDuration = reduce ? "0s" : (0.5 + t / MAX * 1.8) + "s";
        bar.style.width = (t / MAX * 100) + "%"; row.querySelector("b").textContent = t.toFixed(1) + "d";
      });
      var avg = ts.reduce(function (a, b) { return a + b; }, 0) / ts.length, med = (sorted[4] + sorted[5]) / 2;
      setTimeout(function () {
        out.innerHTML = "Average " + avg.toFixed(1) + " days, median " + med.toFixed(1) + ". <span style='color:var(--amber)'>" + late + " of 10 offices miss the " + PROMISE + "-day promise</span>, so one state number misleads.";
      }, reduce ? 0 : 1600);
    }
    btn.addEventListener("click", run);
    var once = false; onVisible(track, function (v) { if (v && !once) { once = true; run(); } }, { threshold: 0.5 });
  })();

  /* ============ CM HELPLINE ESCALATION ============ */
  (function () {
    var svg = $("#esc-svg"); if (!svg) return;
    var NS = "http://www.w3.org/2000/svg", log = $("#esc-log"), play = $("#esc-play"), reset = $("#esc-reset"), caseSel = $("#esc-case"), endSel = $("#esc-end");
    var LV = [["L1", "Block"], ["L2", "District"], ["L3", "Division / Directorate"], ["L4", "Secretary / HoD"]];
    var CASES = ["Certified copy of a sale deed not issued", "Occupancy certificate application stuck", "Wrong name after registration not corrected"];
    function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) e.setAttribute(k, a[k]); (p || svg).appendChild(e); return e; }
    var rungs = [], y0 = 360, gap = 92;
    el("line", { x1: 60, x2: 60, y1: 30, y2: 400, stroke: "var(--rule-2)", "stroke-width": 3 });
    el("line", { x1: 470, x2: 470, y1: 30, y2: 400, stroke: "var(--rule-2)", "stroke-width": 3 });
    LV.forEach(function (lv, i) {
      var y = y0 - i * gap, g = el("g", {});
      var rect = el("rect", { x: 80, y: y - 30, width: 370, height: 60, rx: 12, fill: "var(--surface)", stroke: "var(--rule)", "stroke-width": 1.5 }, g);
      var tag = el("text", { x: 100, y: y + 6, "font-size": 20, "font-weight": 800, fill: "var(--stamp)" }, g); tag.textContent = lv[0];
      var nm = el("text", { x: 146, y: y + 6, "font-size": 15, "font-weight": 600, fill: "var(--ink)" }, g); nm.textContent = lv[1];
      el("rect", { x: 300, y: y + 12, width: 130, height: 6, rx: 3, fill: "var(--sunk)" }, g);
      var tm = el("rect", { x: 300, y: y + 12, width: 0, height: 6, rx: 3, fill: "var(--teal)" }, g);
      var st = el("text", { x: 430, y: y - 6, "text-anchor": "end", "font-size": 12, "font-weight": 600, fill: "var(--muted)" }, g); st.textContent = "waiting";
      rungs.push({ rect: rect, tm: tm, st: st, y: y });
    });
    var tok = el("g", {}); el("circle", { r: 16, fill: "var(--teal)" }, tok);
    var tt = el("text", { y: 5, "text-anchor": "middle", "font-size": 12, "font-weight": 800, fill: "var(--paper)" }, tok); tt.textContent = "1076";
    function place(i) { tok.setAttribute("transform", "translate(60," + rungs[i].y + ")"); }
    place(0);
    var timer = null, busy = false;
    function add(msg) { var li = document.createElement("li"); li.textContent = msg; log.appendChild(li); log.scrollTop = log.scrollHeight; }
    function clear() {
      clearInterval(timer); busy = false; log.innerHTML = ""; place(0);
      rungs.forEach(function (r) { r.tm.setAttribute("width", 0); r.st.textContent = "waiting"; r.rect.setAttribute("stroke", "var(--rule)"); r.tm.setAttribute("fill", "var(--teal)"); });
      var id = "CG-1076-" + (Math.floor(Math.random() * 90000) + 10000);
      add("Token " + id + " created (illustrative). Waiting at L1.");
    }
    function animTo(from, to, ms, cb) {
      if (reduce) { place(to); return cb(); }
      var t0 = performance.now(), ya = rungs[from].y, yb = rungs[to].y;
      (function st(t) { var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        tok.setAttribute("transform", "translate(60," + (ya + (yb - ya) * e) + ")"); if (k < 1) requestAnimationFrame(st); else cb(); })(t0);
    }
    function runLevel(i, end) {
      var r = rungs[i]; r.rect.setAttribute("stroke", "var(--teal)"); r.st.textContent = "deadline running";
      add(LV[i][0] + " · " + LV[i][1] + " officer assigned.");
      var w = 0, finalHere = i === end - 1;
      timer = setInterval(function () {
        w += reduce ? 130 : 4; r.tm.setAttribute("width", Math.min(130, w));
        if (finalHere && w >= 80) {
          clearInterval(timer); r.st.textContent = "resolved"; r.rect.setAttribute("stroke", "var(--teal)");
          add("Resolved at " + LV[i][0] + ". Citizen confirms closure. Dashboard updated.");
          if (i === 3) add("This is where the Secretary's dashboard comes in.");
          busy = false; play.textContent = "Play again";
        } else if (!finalHere && w >= 130) {
          clearInterval(timer); r.tm.setAttribute("fill", "var(--amber)"); r.st.textContent = "escalated";
          add((i % 2 ? "Citizen not satisfied" : "Deadline passed") + ": auto-escalated to " + LV[i + 1][0] + ".");
          animTo(i, i + 1, 650, function () { runLevel(i + 1, end); });
        }
      }, 30);
    }
    play.addEventListener("click", function () {
      if (busy) return; clear(); busy = true;
      add("Complaint: " + CASES[+caseSel.value] + ".");
      runLevel(0, +endSel.value);
    });
    reset.addEventListener("click", function () { clear(); play.textContent = "Play"; });
    clear();
  })();

  /* ============ COOL ROOF: 3D city ============ */
  (function () {
    var box = $("#cr-3d"), area = $("#cr-area"), aout = $("#cr-area-out"), cost = $("#cr-cost"), bDark = $("#cr-dark"), bCool = $("#cr-cool"), gates = $$("#gates li");
    if (!box) return;
    var cool = true, api = null;
    var readout = document.createElement("div"); readout.className = "cr-readout";
    box.parentElement.appendChild(readout);
    function setReadout() {
      readout.innerHTML = cool ? "<span>Indoor air vs dark roof</span><b class='cool'>up to 2.1–4.3 °C cooler</b><span>range cited for Telangana's policy</span>"
        : "<span>Conventional roof</span><b class='hot'>absorbs most sunlight</b><span>heat flows into the floor below</span>";
    }
    function money() {
      var a = +area.value; aout.textContent = a.toLocaleString("en-IN") + " sq ft";
      cost.textContent = INR(a * 2) + " – " + INR(a * 4);
    }
    function lightGates() {
      gates.forEach(function (g) { g.classList.remove("lit", "blocked"); });
      gates.forEach(function (g, i) {
        setTimeout(function () {
          if (i === 3 && !cool) g.classList.add("blocked"); else g.classList.add("lit");
        }, reduce ? 0 : 260 * (i + 1));
      });
      gates[3].lastChild.textContent = cool ? "Occupancy certificate: SRI 78+ verified, OC issued" : "Occupancy certificate: no SRI 78+, no OC";
    }
    function setMode(c) {
      cool = c; bCool.setAttribute("aria-pressed", c); bDark.setAttribute("aria-pressed", !c);
      setReadout(); lightGates(); if (api) api.mode(c);
    }
    area.addEventListener("input", function () { money(); if (api) api.size(+area.value); });
    bDark.addEventListener("click", function () { setMode(false); });
    bCool.addEventListener("click", function () { setMode(true); });
    money(); setReadout();
    var lit = false; onVisible($("#gates"), function (v) { if (v && !lit) { lit = true; lightGates(); } }, { threshold: .4 });

    var started = false;
    onVisible(box, function (v) { if (v && !started) { started = true; threeReady(build); } }, { threshold: 0.05 });
    function build(ok) {
      if (ok === false || !window.THREE) return fallback(box, "3D view needs WebGL.");
      var r = makeRenderer(box); if (!r) return fallback(box, "3D view needs WebGL.");
      var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(36, 1, 0.1, 300);
      cam.position.set(18, 16, 22); fit(r, cam, box);
      scene.add(new THREE.HemisphereLight(0xfff4e0, 0x556677, 0.7));
      var sun = new THREE.DirectionalLight(0xfff1d0, 1.0); sun.position.set(-10, 22, 6); scene.add(sun);
      var sunBall = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffc35a }));
      sunBall.position.set(-10, 15, 4); scene.add(sunBall);
      var ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 22), new THREE.MeshStandardMaterial({ color: 0xc9d3cf, roughness: 1 }));
      ground.position.y = -0.15; scene.add(ground);
      var roofs = [], heroRoof, wallMat = new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: .9 });
      var seed = 5; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var gx = -2; gx <= 2; gx++) for (var gz = -2; gz <= 1; gz++) {
        if (rnd() < 0.15) continue;
        var w = 2.2 + rnd() * 1.6, d = 2.2 + rnd() * 1.6, h = 1.5 + rnd() * 4.5, hero = gx === 0 && gz === 0;
        if (hero) { w = 3.6; d = 3.6; h = 3.2; }
        var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat); b.position.set(gx * 5, h / 2, gz * 5); scene.add(b);
        var roof = new THREE.Mesh(new THREE.BoxGeometry(w + .1, 0.18, d + .1), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: .8 }));
        roof.position.set(gx * 5, h + .09, gz * 5); scene.add(roof); roofs.push(roof); if (hero) heroRoof = roof;
      }
      // rays: incoming from sun to hero roof, then reflected or absorbed
      var rays = [], N = 26;
      for (var i = 0; i < N; i++) {
        var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        var ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb53c, transparent: true, opacity: .9 }));
        scene.add(ln); rays.push({ ln: ln, t: Math.random(), off: new THREE.Vector3((Math.random() - .5) * 3, 0, (Math.random() - .5) * 3) });
      }
      var heat = new THREE.Mesh(new THREE.BoxGeometry(3.4, 3.0, 3.4), new THREE.MeshBasicMaterial({ color: 0xff5a1f, transparent: true, opacity: 0 }));
      heat.position.set(0, 1.55, 0); scene.add(heat);
      var ctrl = THREE.OrbitControls ? new THREE.OrbitControls(cam, r.domElement) : null;
      if (ctrl) { ctrl.enableDamping = true; ctrl.enableZoom = false; ctrl.enablePan = false; ctrl.maxPolarAngle = 1.3; ctrl.autoRotate = !reduce; ctrl.autoRotateSpeed = .5; ctrl.target.set(0, 2, 0); }
      cam.lookAt(0, 2, 0);
      var mode = true, target = 1;
      function paint() {
        roofs.forEach(function (rf) { rf.material.color.setHex(mode ? 0xf4f8f7 : 0x3a3a3a); rf.material.emissive.setHex(mode ? 0x22403a : 0x000000); rf.material.emissiveIntensity = mode ? .15 : 0; });
      }
      api = { mode: function (c) { mode = c; paint(); }, size: function (a) { var s = 0.75 + (a - 500) / 19500 * 0.6; heroRoof.scale.set(s, 1, s); } };
      paint(); api.size(+area.value);
      var running = true; onVisible(box, function (v) { running = v; if (v) requestAnimationFrame(loop); }, { threshold: 0 });
      var top = heroRoof.position.y + .1, src = sunBall.position;
      function loop() {
        rays.forEach(function (ry) {
          ry.t += reduce ? 0 : 0.012; if (ry.t > 2) ry.t -= 2;
          var hit = new THREE.Vector3(ry.off.x * heroRoof.scale.x, top, ry.off.z * heroRoof.scale.z), p = ry.ln.geometry.attributes.position;
          if (ry.t <= 1) { var a = src.clone().lerp(hit, Math.max(0, ry.t - .25) / .75), b2 = src.clone().lerp(hit, ry.t);
            p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b2.x, b2.y, b2.z); ry.ln.material.color.setHex(0xffb53c); ry.ln.material.opacity = .9; }
          else if (mode) { var k = ry.t - 1, out = new THREE.Vector3(hit.x * 1.8 + 9, top + 14, hit.z * 1.8 - 4), a2 = hit.clone().lerp(out, Math.max(0, k - .25)), b3 = hit.clone().lerp(out, k);
            p.setXYZ(0, a2.x, a2.y, a2.z); p.setXYZ(1, b3.x, b3.y, b3.z); ry.ln.material.color.setHex(0x7fe0cc); ry.ln.material.opacity = .9 * (1 - k); }
          else { var kk = ry.t - 1, dn = hit.clone(); dn.y = top - kk * 2.6; p.setXYZ(0, hit.x, top, hit.z); p.setXYZ(1, dn.x, dn.y, dn.z); ry.ln.material.color.setHex(0xff5a1f); ry.ln.material.opacity = .8 * (1 - kk); }
          p.needsUpdate = true;
        });
        heat.material.opacity += ((mode ? 0 : 0.28) - heat.material.opacity) * 0.06;
        if (ctrl) ctrl.update(); r.render(scene, cam);
        if (running) requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);
      addEventListener("resize", function () { fit(r, cam, box); });
    }
  })();

  /* ============ EVIDENCE LOCKER ============ */
  (function () {
    var fs = $$(".lk-filter button"), items = $$(".lk");
    fs.forEach(function (b) { b.addEventListener("click", function () {
      fs.forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      items.forEach(function (it) { it.hidden = !(b.dataset.f === "all" || it.dataset.k === b.dataset.f); });
    }); });
    if (!reduce && matchMedia("(pointer:fine)").matches) items.forEach(function (it) {
      it.addEventListener("mousemove", function (e) { var r = it.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        it.style.transform = "perspective(700px) rotateY(" + (x * 7) + "deg) rotateX(" + (-y * 7) + "deg) translateY(-2px)"; });
      it.addEventListener("mouseleave", function () { it.style.transform = ""; });
    });
  })();

  /* ============ TERMINAL ============ */
  (function () {
    var out = $("#term-out"), form = $("#term-form"), q = $("#term-q"); if (!out) return;
    var hist = [], hi = 0;
    function w(html, cls) { var d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
    var C = {
      help: function () { return "<span class='h'>commands</span>\n  whoami      who I am\n  work        what I did, by department\n  helpline    CM Helpline 1076 work\n  coolroof    the Cool Roof pitch\n  registries  open the ten-state scorecard\n  sro         open the SRO prototype\n  curl api    fetch /api/profile.json\n  evidence    proof of work\n  cv          download my CV\n  contact     how to reach me\n  theme       switch light / dark\n  clear       clear the screen\n<span class='m'>tip: Tab completes, ↑ recalls. There is also one hidden command.</span>"; },
      whoami: function () { return "Ayush Dewangan · Raipur, India\nCM Good Governance Fellow, Govt of Chhattisgarh (since Aug 2025)\nMBA Public Policy & Governance, IIM Raipur ('27)\nB.Com (Hons); ex site accountant, AJ Constructions"; },
      work: function () { return "<span class='c'>[registration]</span> 30 reforms / 10 states benchmarked; Secretary directed 2 for implementation\n<span class='c'>[registration]</span> DPR: ₹3.24 Cr across 107 Sub-Registrar offices\n<span class='c'>[housing-env]</span> Cool Roof pitch: SRI 78+ as an OC condition, ₹2–4/sq ft paid by developer\n<span class='c'>[good-gov]</span>    CM Helpline 1076: L1–L4 escalation map for 2 departments"; },
      helpline: function () { return "CM Helpline 1076 launched 9 Jun 2026: phone, portal, app, WhatsApp.\nLadder: L1 Block → L2 District → L3 Division/Directorate → L4 Secretary/HoD\nMy part: grievance categories + L1–L4 officer map for Commercial Tax and\nHousing & Environment; departmental point of contact for the portal.\n<a href='#helpline'>→ run the escalation demo</a>"; },
      coolroof: function () { return "Status: pitched to Housing & Environment.\nRule: no SRI 78+ roof, no occupancy certificate. 4 checkpoints. State cost: ₹0.\nDeveloper cost: ₹2–4 per sq ft. Benchmark: Telangana 2023.\n<a href='#coolroof'>→ open the 3D simulator</a>"; },
      registries: function () { location.href = "/registries/"; return "opening /registries/ …"; },
      sro: function () { location.href = "/sro-scorecard/"; return "opening /sro-scorecard/ …"; },
      evidence: function () { location.hash = "evidence"; return "jumping to the evidence locker …"; },
      cv: function () { location.href = "/files/Ayush_Dewangan_CV.pdf"; return "downloading Ayush_Dewangan_CV.pdf …"; },
      contact: function () { return "email     " + (window.SITE && SITE.email) + "\nlinkedin  <a href='https://www.linkedin.com/in/ayush-dewangann/' target='_blank' rel='noopener'>linkedin.com/in/ayush-dewangann</a>\nstatus    open to roles from May 2027"; },
      theme: function () { return "theme → " + toggleTheme(); },
      clear: function () { out.innerHTML = ""; return null; },
      ls: function () { return "registries/  sro-scorecard/  posts/  api/profile.json  api/registries.json  files/Ayush_Dewangan_CV.pdf"; },
      date: function () { return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"; },
      "sudo hire-me": function () { copyText(SITE.email, "Email copied"); return "<span class='c'>permission granted.</span> Email copied to your clipboard. I start in May 2027."; },
      "curl api": function () {
        fetch("/api/profile.json").then(function (r) { return r.text(); }).then(function (t) { w(t.replace(/</g, "&lt;").slice(0, 1600) + (t.length > 1600 ? "\n…" : ""), "m"); })
          .catch(function () { w("curl: could not fetch /api/profile.json", "m"); });
        return "<span class='m'>GET /api/profile.json</span>";
      }
    };
    var NAMES = Object.keys(C);
    function exec(raw) {
      var cmd = raw.trim().toLowerCase().replace(/\s+/g, " "); if (!cmd) return;
      w("<span class='c'>ayush@raipur:~$</span> " + raw.replace(/</g, "&lt;"));
      if (cmd === "sudo") return w("usage: sudo hire-me", "m");
      if (cmd.indexOf("curl") === 0) cmd = "curl api";
      var f = C[cmd]; if (!f) return w("command not found: " + cmd.replace(/</g, "&lt;") + ". Type <b>help</b>.", "m");
      var r = f(); if (r) w(r);
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); var v = q.value; if (v.trim()) { hist.push(v); hi = hist.length; } q.value = ""; exec(v); });
    q.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp") { if (hi > 0) { hi--; q.value = hist[hi]; } e.preventDefault(); }
      else if (e.key === "ArrowDown") { if (hi < hist.length - 1) { hi++; q.value = hist[hi]; } else { hi = hist.length; q.value = ""; } e.preventDefault(); }
      else if (e.key === "Tab") { var m = NAMES.filter(function (n) { return n.indexOf(q.value.toLowerCase()) === 0 && n.indexOf("sudo") !== 0; }); if (m.length) { e.preventDefault(); q.value = m[0]; } }
    });
    $("#term").addEventListener("click", function (e) { if (!e.target.closest("a")) q.focus({ preventScroll: true }); });
    var boot = ["Welcome. This terminal is part of the site, not a gimmick: every answer comes from the page.", "Type <b>help</b> to begin, or try <b>work</b>."];
    var started = false;
    onVisible($("#term"), function (v) {
      if (!v || started) return; started = true;
      if (reduce) { boot.forEach(function (b) { w(b, "m"); }); return; }
      var i = 0; (function next() { if (i < boot.length) { w(boot[i++], "m"); setTimeout(next, 450); } })();
    }, { threshold: .4 });
  })();

  /* ============ PERFORMANCE PANEL ============ */
  (function () {
    if (!$("#perf")) return;
    function fill() {
      var nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      var res = performance.getEntriesByType ? performance.getEntriesByType("resource") : [];
      var bytes = (nav && nav.transferSize || 0) + res.reduce(function (a, r) { return a + (r.transferSize || 0); }, 0);
      $("#pf-load").textContent = nav ? Math.round(nav.loadEventEnd > 0 ? nav.loadEventEnd : nav.domContentLoadedEventEnd) + " ms" : "n/a";
      $("#pf-kb").textContent = bytes ? (bytes / 1024).toFixed(0) + " KB" : "cached";
      $("#pf-req").textContent = res.length + 1;
      $("#pf-dom").textContent = document.getElementsByTagName("*").length.toLocaleString("en-IN");
    }
    addEventListener("load", function () { setTimeout(fill, 300); });
    var frames = 0, t0 = performance.now(), fpsEl = $("#pf-fps");
    (function f(t) { frames++; if (t - t0 >= 1000) { fpsEl.textContent = Math.round(frames * 1000 / (t - t0)) + " fps"; frames = 0; t0 = t; } requestAnimationFrame(f); })(t0);
  })();
})();
