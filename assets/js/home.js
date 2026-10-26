/* Home page engine. Plain JS + WebGL. Optional: GSAP/ScrollTrigger (reveals), three.js (3D demos, lazy-loaded). */
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

  /* ============ HERO: clock + rotating word ============ */
  (function () {
    var clock = $("#hx-clock");
    function tick() { if (clock) clock.textContent = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }) + " IST"; }
    tick(); setInterval(tick, 20000);
    var words = ["verifiable", "searchable", "lendable", "accountable"], el = $("#hx-swap"), i = 0;
    if (!el || reduce) return;
    el.style.display = "inline-block"; el.style.transition = "opacity .35s ease, transform .35s ease, filter .35s ease";
    setInterval(function () {
      if (document.hidden) return;
      el.style.opacity = "0"; el.style.transform = "translateY(-0.18em)"; el.style.filter = "blur(4px)";
      setTimeout(function () {
        i = (i + 1) % words.length; el.textContent = words[i];
        el.style.transition = "none"; el.style.transform = "translateY(0.18em)"; void el.offsetWidth;
        el.style.transition = "opacity .35s ease, transform .35s ease, filter .35s ease";
        el.style.opacity = "1"; el.style.transform = "none"; el.style.filter = "none";
      }, 360);
    }, 2800);
  })();

  /* ============ HERO: WebGL aurora (flowing mesh gradient) ============ */
  (function () {
    var c = $("#aurora"); if (!c) return;
    var gl = c.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) { c.remove(); return; }
    var vs = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
    var fs = [
      "#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\nuniform vec2 r;uniform float t;uniform vec2 m;uniform vec3 bg,c0,c1,c2,c3;uniform float k;",
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}",
      "float fb(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+17.;a*=.5;}return v;}",
      "vec3 blob(vec3 col,vec3 c,vec2 q,vec2 o,float s,float a){float d=length(q-o);return mix(col,c,a*exp(-d*d*s));}",
      "void main(){vec2 uv=gl_FragCoord.xy/r;float as=r.x/r.y;vec2 p=vec2(uv.x*as,uv.y);",
      "vec2 w=vec2(fb(p*1.4+vec2(0.,t*.06)),fb(p*1.4+vec2(5.2,-t*.05)));vec2 q=p+.45*(w-.5);",
      "vec3 col=bg;",
      "col=blob(col,c0,q,vec2(as*(.22+.10*sin(t*.11)),.62+.12*cos(t*.13)),3.2,.95);",
      "col=blob(col,c1,q,vec2(as*(.78+.08*cos(t*.09)),.70+.10*sin(t*.12)),3.0,.9);",
      "col=blob(col,c2,q,vec2(as*(.58+.12*sin(t*.07+1.)),.22+.10*cos(t*.10)),3.4,.85);",
      "col=blob(col,c3,q,vec2(as*mix(.5,m.x,.35),mix(.45,m.y,.35)),5.5,.55);",
      "float v=smoothstep(1.25,.25,length((uv-.5)*vec2(1.,1.2)));col=mix(bg,col,mix(1.,v,k));",
      "col+=(h(gl_FragCoord.xy+t)-.5)/255.*2.;gl_FragColor=vec4(col,1.);}"
    ].join("\n");
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
    var a = sh(gl.VERTEX_SHADER, vs), b = sh(gl.FRAGMENT_SHADER, fs);
    if (!a || !b) { c.remove(); return; }
    var pr = gl.createProgram(); gl.attachShader(pr, a); gl.attachShader(pr, b); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { c.remove(); return; }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {}; ["r", "t", "m", "bg", "c0", "c1", "c2", "c3", "k"].forEach(function (u) { U[u] = gl.getUniformLocation(pr, u); });
    function hex(x) { return [parseInt(x.slice(1, 3), 16) / 255, parseInt(x.slice(3, 5), 16) / 255, parseInt(x.slice(5, 7), 16) / 255]; }
    function palette() {
      var d = isDark();
      var P = d ? ["#000000", "#1F3BD6", "#6A2BE0", "#C2461C", "#1E7BE8", 1.0] : ["#FBFBFD", "#A9BDFF", "#D2B8FF", "#FFCDB2", "#B7E4FF", 0.35];
      ["bg", "c0", "c1", "c2", "c3"].forEach(function (u, i) { gl.uniform3fv(U[u], hex(P[i])); });
      gl.uniform1f(U.k, P[5]);
    }
    var mx = .5, my = .5, tx = .5, ty = .5, running = false, raf = 0, t0 = performance.now(), seen = true;
    function size() {
      var s = 0.5 * Math.min(2, devicePixelRatio || 1); // half-res: it is a soft gradient anyway
      c.width = Math.max(2, Math.round(c.clientWidth * s)); c.height = Math.max(2, Math.round(c.clientHeight * s));
      gl.viewport(0, 0, c.width, c.height); gl.uniform2f(U.r, c.width, c.height);
    }
    function frame(now) {
      mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
      gl.uniform1f(U.t, reduce ? 12.0 : (now - t0) / 1000); gl.uniform2f(U.m, mx * (c.width / c.height), my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (running) raf = requestAnimationFrame(frame);
    }
    function start() { if (running || reduce || !seen || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size(); palette(); frame(performance.now()); start();
    $(".hero2").addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; });
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (!running) frame(performance.now()); }, 120); });
    document.addEventListener("themechange", function () { palette(); if (!running) frame(performance.now()); });
    var mq = matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", function () { palette(); if (!running) frame(performance.now()); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    onVisible(c, function (v) { seen = v; v ? start() : stop(); }, { threshold: 0 });
    c.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); c.remove(); });
  })();

  /* ============ COUNTERS ============ */
  $$(".stat b[data-count]").forEach(function (b) {
    var to = parseFloat(b.dataset.count), dec = +(b.dataset.dec || 0), pre = b.dataset.pre || "", suf = b.dataset.suf || "", done = false;
    onVisible(b, function (v) {
      if (!v || done || reduce) return; done = true; var t0 = performance.now();
      (function step(t) { var k = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - k, 3);
        b.textContent = pre + (to * e).toFixed(dec) + suf; if (k < 1) requestAnimationFrame(step); })(t0);
    }, { threshold: 0.6 });
  });

  /* ============ SCROLL REVEALS (GSAP + ScrollTrigger) ============ */
  (function () {
    var root = document.documentElement;
    if (reduce || !window.gsap || !window.ScrollTrigger) { root.classList.remove("gs"); return; }
    gsap.registerPlugin(ScrollTrigger);
    var hero = $$(".hero2 .rv");
    gsap.to(hero, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.09, delay: 0.1 });
    $$(".rv").forEach(function (el) {
      if (el.closest(".hero2")) return;
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    // hero content drifts up and fades as you leave it
    gsap.to(".hero2-inner", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero2", start: "top top", end: "bottom top", scrub: true } });
    addEventListener("load", function () { ScrollTrigger.refresh(); });
  })();

  /* ============ DEMO SWITCHER ============ */
  (function () {
    var tabs = $$(".seg-b"); if (!tabs.length) return;
    function sel(t, focus) {
      tabs.forEach(function (x) { var on = x === t; x.setAttribute("aria-selected", on); x.tabIndex = on ? 0 : -1; $("#" + x.getAttribute("aria-controls")).hidden = !on; });
      if (focus) t.focus({ preventScroll: true });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { sel(t); });
      t.addEventListener("keydown", function (e) {
        var k = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!k) return;
        e.preventDefault(); sel(tabs[(i + k + tabs.length) % tabs.length], true);
      });
    });
    window.showDemo = function (id, instant) {
      var t = $("#d-" + id); if (!t) return; sel(t);
      $("#demos").scrollIntoView({ behavior: reduce || instant ? "auto" : "smooth", block: "start" });
    };
    $$(".demo-link").forEach(function (b) { b.addEventListener("click", function () { showDemo(b.dataset.demo); }); });
    function fromHash(instant) { var h = (location.hash || "").replace("#demo-", ""); if (h && h !== location.hash && $("#d-" + h)) showDemo(h, instant); }
    addEventListener("hashchange", function () { fromHash(false); });
    // deep link: select now, scroll after load so ScrollTrigger's refresh cannot reset the position
    if (/^#demo-/.test(location.hash)) {
      fromHash(true);
      var land = function () { setTimeout(function () { fromHash(true); }, 60); };
      document.readyState === "complete" ? land() : addEventListener("load", land);
    }
  })();

  /* ============ 3D helpers (three.js loaded only when a 3D demo is first shown) ============ */
  var threeP = null;
  function loadScript(src) { return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function threeReady(cb) {
    if (!threeP) threeP = loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
      .then(function () { return loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js").catch(function () {}); });
    threeP.then(function () { cb(!!window.THREE); }, function () { cb(false); });
  }
  function fallback(box, msg) { if (box.querySelector(".fallback")) return; var f = document.createElement("div"); f.className = "fallback"; f.textContent = msg; box.appendChild(f); }
  function makeRenderer(box) {
    var r;
    try { r = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return null; }
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    box.appendChild(r.domElement); return r;
  }
  function fit(r, cam, box) { var w = box.clientWidth, h = box.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

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
      var c0 = new THREE.Color("#C9D6FF"), c1 = new THREE.Color("#3B5BDB"), c2 = new THREE.Color("#1A2A8A");
      var base = new THREE.Mesh(new THREE.BoxGeometry(st.length * 1.6 + 1, 0.2, 3.2), new THREE.MeshStandardMaterial({ color: isDark() ? 0x1c1c22 : 0xe8e8ef }));
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
      if (ctrl) { ctrl.enableDamping = true; ctrl.enableZoom = false; ctrl.enablePan = false; ctrl.minPolarAngle = .4; ctrl.maxPolarAngle = 1.35; ctrl.autoRotate = !reduce; ctrl.autoRotateSpeed = 0.8; ctrl.target.set(0, 2.5, 0); r.domElement.style.touchAction = "pan-y"; }
      cam.lookAt(0, 2.5, 0);
      var ray = new THREE.Raycaster(), mv = new THREE.Vector2(-9, -9), pick = $("#bar-pick"), hovered = null;
      r.domElement.addEventListener("pointermove", function (e) { var b = r.domElement.getBoundingClientRect(); mv.x = (e.clientX - b.left) / b.width * 2 - 1; mv.y = -(e.clientY - b.top) / b.height * 2 + 1; });
      r.domElement.addEventListener("pointerleave", function () { mv.set(-9, -9); });
      var t0 = performance.now(), running = true, active = true;
      onVisible(box, function (v) { running = v; if (v) fit(r, cam, box); if (v && !active) { active = true; requestAnimationFrame(loop); } }, { threshold: 0 });
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
        if (running) requestAnimationFrame(loop); else active = false;
      }
      requestAnimationFrame(loop);
      addEventListener("resize", function () { fit(r, cam, box); });
      document.addEventListener("themechange", function () { base.material.color.setHex(isDark() ? 0x1c1c22 : 0xe8e8ef); });
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
    var runId = 0;
    function run() {
      var my = ++runId, ts = times(), rows = $$(".race-row", track), late = 0, sorted = ts.slice().sort(function (a, b) { return a - b; });
      rows.forEach(function (row, i) {
        var t = ts[i], isLate = t > PROMISE; if (isLate) late++;
        row.classList.toggle("late", isLate);
        var bar = row.querySelector("i"); bar.style.transition = "none"; bar.style.width = "0";
        void bar.offsetWidth; bar.style.transition = reduce ? "none" : ""; bar.style.transitionDuration = reduce ? "0s" : (0.5 + t / MAX * 1.8) + "s";
        bar.style.width = (t / MAX * 100) + "%"; row.querySelector("b").textContent = t.toFixed(1) + "d";
      });
      var avg = ts.reduce(function (a, b) { return a + b; }, 0) / ts.length, med = (sorted[4] + sorted[5]) / 2;
      setTimeout(function () {
        if (my !== runId) return;
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
    var timer = null, busy = false, gen = 0;
    function add(msg) { var li = document.createElement("li"); li.textContent = msg; log.appendChild(li); log.scrollTop = log.scrollHeight; }
    function clear() {
      gen++; clearInterval(timer); busy = false; log.innerHTML = ""; place(0);
      rungs.forEach(function (r) { r.tm.setAttribute("width", 0); r.st.textContent = "waiting"; r.rect.setAttribute("stroke", "var(--rule)"); r.tm.setAttribute("fill", "var(--teal)"); });
      var id = "CG-1076-" + (Math.floor(Math.random() * 90000) + 10000);
      add("Token " + id + " created (illustrative). Waiting at L1.");
    }
    function animTo(from, to, ms, cb) {
      var g = gen;
      if (reduce) { place(to); return cb(); }
      var t0 = performance.now(), ya = rungs[from].y, yb = rungs[to].y;
      (function st(t) { var k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        tok.setAttribute("transform", "translate(60," + (ya + (yb - ya) * e) + ")"); if (g !== gen) return; if (k < 1) requestAnimationFrame(st); else cb(); })(t0);
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
      var ground = new THREE.Mesh(new THREE.BoxGeometry(30, 0.3, 22), new THREE.MeshStandardMaterial({ color: isDark() ? 0x2a2a30 : 0xd9dbe2, roughness: 1 }));
      ground.position.y = -0.15; scene.add(ground);
      var roofs = [], heroRoof, wallMat = new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: .9 });
      var seed = 5; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var gx = -2; gx <= 2; gx++) for (var gz = -2; gz <= 1; gz++) {
        var hero = gx === 0 && gz === 0;
        if (rnd() < 0.15 && !hero) continue;
        var w = 2.2 + rnd() * 1.6, d = 2.2 + rnd() * 1.6, h = 1.5 + rnd() * 4.5;
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
      if (ctrl) { ctrl.enableDamping = true; ctrl.enableZoom = false; ctrl.enablePan = false; ctrl.maxPolarAngle = 1.3; ctrl.autoRotate = !reduce; ctrl.autoRotateSpeed = .5; ctrl.target.set(0, 2, 0); r.domElement.style.touchAction = "pan-y"; }
      cam.lookAt(0, 2, 0);
      var mode = cool;
      function paint() {
        roofs.forEach(function (rf) { rf.material.color.setHex(mode ? 0xf4f8f7 : 0x3a3a3a); rf.material.emissive.setHex(mode ? 0x22403a : 0x000000); rf.material.emissiveIntensity = mode ? .15 : 0; });
      }
      api = { mode: function (c) { mode = c; paint(); }, size: function (a) { var s = 0.75 + (a - 500) / 19500 * 0.6; heroRoof.scale.set(s, 1, s); } };
      paint(); api.size(+area.value);
      var running = true, active = true; onVisible(box, function (v) { running = v; if (v) fit(r, cam, box); if (v && !active) { active = true; requestAnimationFrame(loop); } }, { threshold: 0 });
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
        if (running) requestAnimationFrame(loop); else active = false;
      }
      requestAnimationFrame(loop);
      addEventListener("resize", function () { fit(r, cam, box); });
      document.addEventListener("themechange", function () { ground.material.color.setHex(isDark() ? 0x2a2a30 : 0xd9dbe2); });
    }
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
      helpline: function () { return "CM Helpline 1076 launched 9 Jun 2026: phone, portal, app, WhatsApp.\nLadder: L1 Block → L2 District → L3 Division/Directorate → L4 Secretary/HoD\nMy part: grievance categories + L1–L4 officer map for Commercial Tax and\nHousing & Environment; departmental point of contact for the portal.\n<a href='#demos' data-demo='helpline'>→ run the escalation demo</a>"; },
      coolroof: function () { return "Status: pitched to Housing & Environment.\nRule: no SRI 78+ roof, no occupancy certificate. 4 checkpoints. State cost: ₹0.\nDeveloper cost: ₹2–4 per sq ft. Benchmark: Telangana 2023.\n<a href='#demos' data-demo='roof'>→ open the 3D simulator</a>"; },
      registries: function () { location.href = "/registries/"; return "opening /registries/ …"; },
      sro: function () { location.href = "/sro-scorecard/"; return "opening /sro-scorecard/ …"; },
      evidence: function () { $("#proof").scrollIntoView({ behavior: "smooth" }); return "scrolling to proof of work …"; },
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
    out.addEventListener("click", function (e) { var a = e.target.closest("a[data-demo]"); if (a && window.showDemo) { e.preventDefault(); showDemo(a.dataset.demo); } });
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
    }
    addEventListener("load", function () { setTimeout(fill, 300); });
    var frames = 0, t0 = 0, fpsEl = $("#pf-fps"), on = false;
    function f(t) { if (!on) return; frames++; if (t - t0 >= 1000) { fpsEl.textContent = Math.round(frames * 1000 / (t - t0)) + " fps"; frames = 0; t0 = t; } requestAnimationFrame(f); }
    onVisible($("#perf"), function (v) { if (v && !on) { on = true; frames = 0; t0 = performance.now(); requestAnimationFrame(f); } else if (!v) on = false; }, { threshold: 0 });
  })();
})();
