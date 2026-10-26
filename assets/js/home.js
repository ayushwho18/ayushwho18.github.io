/* Home page engine. Plain JS + WebGL. Optional: GSAP (chart timelines), three.js (3D, lazy-loaded). */
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
    el.style.display = "inline-block"; el.style.transition = "opacity .35s ease, transform .35s ease";
    setInterval(function () {
      if (document.hidden) return;
      el.style.opacity = "0"; el.style.transform = "translateY(-0.18em)";
      setTimeout(function () {
        i = (i + 1) % words.length; el.textContent = words[i];
        el.style.transition = "none"; el.style.transform = "translateY(0.18em)"; void el.offsetWidth;
        el.style.transition = "opacity .35s ease, transform .35s ease";
        el.style.opacity = "1"; el.style.transform = "none";
      }, 360);
    }, 2800);
  })();

  /* ============ HERO: WebGL aurora (flowing mesh gradient) ============ */
  (function () {
    var c = $("#aurora"); if (!c) return;
    if (document.documentElement.classList.contains("hero3d-on")) { c.remove(); return; }
    var soft = false; // software WebGL: draw one still frame instead of animating
    var gl = c.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "low-power" });
    if (!gl) { c.remove(); return; }
    try { var dbgi = gl.getExtension("WEBGL_debug_renderer_info"); soft = !!dbgi && /swiftshader|llvmpipe|software|basic render/i.test(String(gl.getParameter(dbgi.UNMASKED_RENDERER_WEBGL))) && !/[?&]hero3d=force/.test(location.search); } catch (e) {}
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
    function start() { if (running || reduce || soft || !seen || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    size(); palette(); frame(performance.now()); start();
    $(".hero2").addEventListener("pointermove", function (e) { var r = c.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; });
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (!running) frame(performance.now()); }, 120); });
    document.addEventListener("themechange", function () { palette(); if (!running) frame(performance.now()); });
    var mq = matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", function () { palette(); if (!running) frame(performance.now()); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    onVisible(c, function (v) { seen = v; v ? start() : stop(); }, { threshold: 0 });
    c.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); c.remove(); });
    document.addEventListener("hero3d", function () { stop(); setTimeout(function () { c.remove(); }, 1500); }); // the 3D hero took over
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
    window.__revealReady = true;
    if (reduce || !("IntersectionObserver" in window)) { root.classList.remove("gs"); return; }
    // reveals: one IntersectionObserver + CSS transitions (compositor-friendly, no scroll listeners)
    // "reached or passed" (not "is visible"), so a fast fling can never leave a section hidden
    var pend = $$(".rv").filter(function (el) { return !el.closest(".hero2"); });
    function sweep() { for (var i = pend.length - 1; i >= 0; i--) if (pend[i].getBoundingClientRect().top < innerHeight * .9) { pend[i].classList.add("in"); pend.splice(i, 1); } }
    sweep(); addEventListener("load", sweep); addEventListener("resize", sweep);
    $$(".seg-b").forEach(function (b) { b.addEventListener("click", function () { setTimeout(sweep, 50); }); });
    // hero content drifts up and fades as you leave it (one passive listener, rAF-throttled)
    var inner = $(".hero2-inner"), hero = $(".hero2"), tick = false;
    addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false; if (pend.length) sweep(); var p = Math.max(0, Math.min(1, scrollY / (hero.offsetHeight || 1)));
        inner.style.transform = p ? "translateY(" + (-12 * p) + "%)" : ""; inner.style.opacity = p ? String(1 - .8 * p) : "";
      });
    }, { passive: true });
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
    // deep link: select now, and again after load so late layout shifts cannot move the position
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
    if (window.THREE && THREE.OrbitControls) { cb(true); return; } // already on the page: never load a second copy
    if (window.loadThree) { window.loadThree().then(function () { cb(!!window.THREE); }, function () { cb(false); }); return; }
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

  /* ============ Interactive 3D stage (shared by both 3D demos) ============ */
  function makeLabel(text, o) {
    o = o || {};
    var fs = o.size || 44, pad = 18, c = document.createElement("canvas"), x = c.getContext("2d");
    x.font = (o.weight || 700) + " " + fs + "px Inter, system-ui, sans-serif";
    var w = Math.ceil(x.measureText(text).width) + pad * 2, h = fs + pad * 1.4;
    c.width = w; c.height = h;
    x.font = (o.weight || 700) + " " + fs + "px Inter, system-ui, sans-serif";
    if (o.bg) { x.fillStyle = o.bg; var r = h / 2; x.beginPath(); x.moveTo(r, 0); x.lineTo(w - r, 0); x.arc(w - r, r, r, -Math.PI / 2, Math.PI / 2); x.lineTo(r, h); x.arc(r, r, r, Math.PI / 2, Math.PI * 1.5); x.fill(); }
    x.fillStyle = o.color || "#111"; x.textBaseline = "middle"; x.fillText(text, pad, h / 2 + 1);
    var tex = new THREE.CanvasTexture(c); tex.anisotropy = 4;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: o.depthTest !== false }));
    var k = (o.scale || 1) / 90; sp.scale.set(w * k, h * k, 1); sp.renderOrder = 5;
    return sp;
  }
  function stage3d(box, opt) {
    var r = makeRenderer(box); if (!r) return null;
    // linear output + no tone mapping: colours render exactly as authored (brand blues stay saturated)
    if (opt.shadows) { r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; }
    var scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(opt.fov || 38, 1, 0.1, 500);
    var home = { pos: opt.pos.clone(), target: opt.target.clone() };
    cam.position.copy(home.pos); fit(r, cam, box);
    var ctrl = THREE.OrbitControls ? new THREE.OrbitControls(cam, r.domElement) : null;
    var wrap = box.parentElement, spinBtn = wrap.querySelector('[data-act="spin"]'), spin = !reduce;
    if (ctrl) {
      ctrl.target.copy(home.target); ctrl.enableDamping = true; ctrl.dampingFactor = .08;
      ctrl.enablePan = true; ctrl.screenSpacePanning = true; ctrl.enableZoom = false;
      ctrl.minDistance = opt.minD || 6; ctrl.maxDistance = opt.maxD || 60; ctrl.maxPolarAngle = opt.maxPolar || 1.45;
      ctrl.autoRotate = spin; ctrl.autoRotateSpeed = opt.spinSpeed || .7; ctrl.update();
      r.domElement.style.touchAction = "pan-y";
      var idle;
      ctrl.addEventListener("start", function () { ctrl.autoRotate = false; clearTimeout(idle); fly = null; });
      ctrl.addEventListener("end", function () { clearTimeout(idle); if (spin) idle = setTimeout(function () { ctrl.autoRotate = true; }, 5000); });
    } else cam.lookAt(home.target);
    // zoom only after the visitor engages, so the page wheel still scrolls the page
    box.addEventListener("pointerdown", function () { if (ctrl) ctrl.enableZoom = true; box.classList.add("live"); });
    box.addEventListener("pointerleave", function (e) { if (e.pointerType !== "mouse") return; if (ctrl && !document.fullscreenElement) ctrl.enableZoom = false; box.classList.remove("live"); });
    // camera flights
    var fly = null;
    function flyTo(pos, target, ms) {
      if (!ctrl) return;
      fly = { p0: cam.position.clone(), t0: ctrl.target.clone(), p1: pos.clone(), t1: target.clone(), s: performance.now(), d: reduce ? 1 : (ms || 900) };
      ctrl.autoRotate = false;
    }
    function reset() { flyTo(home.pos, home.target, 1000); if (spin) setTimeout(function () { if (ctrl && spin) ctrl.autoRotate = true; }, 1100); }
    $$("[data-act]", wrap).forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.dataset.act;
        if (a === "reset") { reset(); if (api.onReset) api.onReset(); }
        else if (a === "spin") { spin = !spin; b.setAttribute("aria-pressed", spin); if (ctrl) ctrl.autoRotate = spin; }
        else if (a === "full") {
          if (document.fullscreenElement) document.exitFullscreen();
          else { var rf = wrap.requestFullscreen || wrap.webkitRequestFullscreen; if (rf) { var pr = rf.call(wrap); if (pr && pr.catch) pr.catch(function () {}); } }
        }
      });
    });
    if (spinBtn) spinBtn.setAttribute("aria-pressed", spin);
    var fsb = wrap.querySelector('[data-act="full"]'); if (fsb && !wrap.requestFullscreen && !wrap.webkitRequestFullscreen) fsb.hidden = true; // iPhone Safari
    document.addEventListener("fullscreenchange", function () {
      var on = document.fullscreenElement === wrap; wrap.classList.toggle("fs", on);
      if (ctrl) ctrl.enableZoom = on; setTimeout(function () { fit(r, cam, box); }, 60);
    });
    var running = true, active = true, hooks = [];
    function loop(now) {
      if (fly) {
        var k = Math.min(1, (now - fly.s) / fly.d), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        cam.position.lerpVectors(fly.p0, fly.p1, e); ctrl.target.lerpVectors(fly.t0, fly.t1, e);
        if (k >= 1) fly = null;
      }
      hooks.forEach(function (h) { h(now); });
      if (ctrl) ctrl.update(); r.render(scene, cam);
      if (running) requestAnimationFrame(loop); else active = false;
    }
    onVisible(box, function (v) { running = v; if (v) fit(r, cam, box); if (v && !active) { active = true; requestAnimationFrame(loop); } }, { threshold: 0 });
    addEventListener("resize", function () { fit(r, cam, box); });
    requestAnimationFrame(loop);
    // pointer helpers: hover + click that ignores drags
    var mouse = new THREE.Vector2(-9, -9), down = null, ray = new THREE.Raycaster();
    r.domElement.addEventListener("pointermove", function (e) { var b = r.domElement.getBoundingClientRect(); mouse.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1); });
    r.domElement.addEventListener("pointerleave", function () { mouse.set(-9, -9); });
    r.domElement.addEventListener("pointerdown", function (e) { down = [e.clientX, e.clientY]; });
    r.domElement.addEventListener("pointerup", function (e) {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
      var b = r.domElement.getBoundingClientRect(); mouse.set((e.clientX - b.left) / b.width * 2 - 1, -(e.clientY - b.top) / b.height * 2 + 1);
      if (api.onClick) api.onClick(mouse);
    });
    var api = { r: r, scene: scene, cam: cam, ctrl: ctrl, flyTo: flyTo, reset: reset, mouse: mouse, ray: ray, hook: function (f) { hooks.push(f); } };
    return api;
  }

  /* ============ 3D BARS: ten states, three metrics ============ */
  (function () {
    var box = $("#bars3d"); if (!box) return;
    var started = false;
    onVisible(box, function (v) { if (v && !started) { started = true; threeReady(go); } }, { threshold: 0.05 });
    function go(ok) {
      if (!ok) return fallback(box, "3D view needs WebGL. The full table is in the scorecard.");
      fetch("/api/registries.json").then(function (r) { return r.json(); }).then(build).catch(function () { fallback(box, "Could not load /api/registries.json."); });
    }
    function build(data) {
      var st = data.states, N = st.length, GAP = 2.3, X0 = -(N - 1) * GAP / 2;
      var S = stage3d(box, { pos: new THREE.Vector3(13, 11, 19), target: new THREE.Vector3(0, 2.6, 0), minD: 5, maxD: 55, spinSpeed: .55 });
      if (!S) return fallback(box, "3D view needs WebGL.");
      var scene = S.scene;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, .62));
      var key = new THREE.DirectionalLight(0xffffff, .72); key.position.set(8, 16, 10); scene.add(key);
      var rim = new THREE.DirectionalLight(0xb9c6ff, .3); rim.position.set(-10, 6, -8); scene.add(rim);
      var plate = new THREE.Mesh(new THREE.BoxGeometry(N * GAP + 2.4, .3, 6.5), new THREE.MeshStandardMaterial({ color: 0xe9ebf2, roughness: .7, metalness: .05 }));
      plate.position.y = -.15; scene.add(plate);
      var grid = new THREE.GridHelper(40, 40, 0xb9bfd3, 0xd8dce8); grid.position.y = -.3; scene.add(grid);
      // back wall with reference lines
      var wall = new THREE.Group(); scene.add(wall);
      var wallLines = [], wallLabels = [];
      for (var g = 1; g <= 4; g++) {
        var ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(X0 - 1, 0, -2.6), new THREE.Vector3(-X0 + 1, 0, -2.6)]), new THREE.LineBasicMaterial({ color: 0xa8b0c8, transparent: true, opacity: .55 }));
        wall.add(ln); wallLines.push(ln);
      }
      var COL = { market: new THREE.Color("#3B5BDB"), access: new THREE.Color("#7C4DFF"), white: new THREE.Color("#FF8A4C"), budget: new THREE.Color("#2F6BFF"), growth: new THREE.Color("#18A47A") };
      var segGeo = new THREE.BoxGeometry(1.35, 1, 1.35); segGeo.translate(0, .5, 0);
      var bars = st.map(function (s, i) {
        var grp = new THREE.Group(); grp.position.x = X0 + i * GAP; scene.add(grp);
        var segs = ["market", "access", "white"].map(function (k) {
          var m = new THREE.Mesh(segGeo, new THREE.MeshStandardMaterial({ color: COL[k].clone(), roughness: .38, metalness: .12, emissive: 0x000000 }));
          m.scale.y = .001; m.userData.i = i; grp.add(m); return m;
        });
        var code = makeLabel(s.code, { size: 40, color: "#1D1D1F", scale: .9 }); code.position.set(0, .55, 1.9); grp.add(code);
        var val = makeLabel("0", { size: 36, color: "#fff", bg: "rgba(29,29,31,.82)", scale: .8 }); grp.add(val);
        return { s: s, grp: grp, segs: segs, cur: [0, 0, 0], tgt: [0, 0, 0], val: val, code: code, delay: i * 70 };
      });
      var metric = "score", t0 = performance.now(), maxG = 1e-6;
      st.forEach(function (s) { var gr = s.stamps_registration_cr.be_2026_27 / s.stamps_registration_cr.actual_2024_25 - 1; if (gr > maxG) maxG = gr; });
      var lo = Math.log10(500), hi = Math.log10(50000);
      function targets(s) {
        var b = s.stamps_registration_cr;
        if (metric === "score") return [s.market / 12, s.access / 12, s.white_space / 12];
        if (metric === "budget") return [.4 + 6.6 * (Math.log10(b.be_2026_27) - lo) / (hi - lo), 0, 0];
        var gr = b.be_2026_27 / b.actual_2024_25 - 1; return [Math.max(.12, 7 * Math.max(0, gr) / maxG), 0, 0];
      }
      function valueText(s) {
        var b = s.stamps_registration_cr;
        if (metric === "score") return s.score.toFixed(1);
        if (metric === "budget") return "₹" + b.be_2026_27.toLocaleString("en-IN") + " Cr";
        return "+" + Math.round((b.be_2026_27 / b.actual_2024_25 - 1) * 100) + "%";
      }
      function relabel(bar) {
        var old = bar.val; bar.grp.remove(old); old.material.map.dispose(); old.material.dispose();
        bar.val = makeLabel(valueText(bar.s), { size: 36, color: "#fff", bg: "rgba(29,29,31,.82)", scale: metric === "budget" ? .72 : .8 }); bar.grp.add(bar.val);
      }
      var legend = $("#bars-legend");
      function setLegend() {
        legend.innerHTML = metric === "score"
          ? "<span><i style='background:#3B5BDB'></i>Market size (40)</span><span><i style='background:#7C4DFF'></i>Online access (40)</span><span><i style='background:#FF8A4C'></i>Competitor white space (20)</span>"
          : metric === "budget" ? "<span><i style='background:#2F6BFF'></i>2026–27 budget estimate, stamps &amp; registration (log scale)</span>"
          : "<span><i style='background:#18A47A'></i>Budget 2026–27 vs actual 2024–25</span>";
      }
      function setMetric(m) {
        metric = m; t0 = performance.now();
        bars.forEach(function (bar, i) {
          bar.tgt = targets(bar.s); relabel(bar); bar.delay = i * 50;
          bar.segs[0].material.color.copy(m === "score" ? COL.market : m === "budget" ? COL.budget : COL.growth);
        });
        setLegend(); hover = -1;
        if (selected >= 0) showCard(selected);
      }
      $$("#dp-states [data-metric]").forEach(function (b) {
        b.addEventListener("click", function () {
          $$("#dp-states [data-metric]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
          setMetric(b.dataset.metric);
        });
      });
      // card
      var card = $("#bar-card"), selected = -1;
      function tick(v) { return v ? "<b class='y'>✓</b>" : "<b class='n'>✕</b>"; }
      function showCard(i) {
        var s = st[i], b = s.stamps_registration_cr, f = s.features || {};
        card.innerHTML = "<button type='button' class='x' aria-label='Close'>×</button><p class='k'>#" + s.rank + " of 10</p><h4>" + s.name + "</h4>" +
          "<p class='big'>" + s.score.toFixed(1) + "<small>/100</small></p>" +
          "<div class='brk'><span>Market</span><i style='--w:" + (s.market / 40 * 100) + "%;--c:#3B5BDB'></i><em>" + s.market + "/40</em>" +
          "<span>Access</span><i style='--w:" + (s.access / 40 * 100) + "%;--c:#7C4DFF'></i><em>" + s.access + "/40</em>" +
          "<span>White space</span><i style='--w:" + (s.white_space / 20 * 100) + "%;--c:#FF8A4C'></i><em>" + s.white_space + "/20</em></div>" +
          "<ul class='ft'><li>" + tick(f.search) + "Deed search online</li><li>" + tick(f.ec) + "Encumbrance certificate</li><li>" + tick(f.cc) + "Certified copy</li><li>" + tick(f.am) + "Auto-mutation</li></ul>" +
          "<p class='bud'>Budget 2026–27: <b>₹" + b.be_2026_27.toLocaleString("en-IN") + " Cr</b> · actual 2024–25 ₹" + b.actual_2024_25.toLocaleString("en-IN") + " Cr</p>";
        card.hidden = false;
        card.querySelector(".x").addEventListener("click", function () { card.hidden = true; selected = -1; S.reset(); });
      }
      S.onReset = function () { card.hidden = true; selected = -1; };
      // hover + click
      var hover = -1, allSegs = [];
      bars.forEach(function (b) { allSegs = allSegs.concat(b.segs); });
      S.onClick = function (m) {
        S.ray.setFromCamera(m, S.cam); var hit = S.ray.intersectObjects(allSegs.filter(function (q) { return q.visible; }))[0];
        if (!hit) return;
        focusBar(hit.object.userData.i);
      };
      function focusBar(i) {
        var bar = bars[i], h = bar.cur[0] + bar.cur[1] + bar.cur[2], x = bar.grp.position.x;
        selected = i; showCard(i);
        S.flyTo(new THREE.Vector3(x + 7.5, h + 5.5, 13.5), new THREE.Vector3(x, h * .5, 0), 1000);
      }
      // keyboard: arrows step through states, Enter opens, Escape resets
      box.tabIndex = 0; box.setAttribute("aria-label", "3D bar chart of ten states. Use left and right arrow keys to step through states.");
      box.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); var n = selected < 0 ? 0 : (selected + (e.key === "ArrowRight" ? 1 : -1) + N) % N; focusBar(n); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusBar(selected < 0 ? 0 : selected); }
        else if (e.key === "Escape") { card.hidden = true; selected = -1; S.reset(); }
      });
      var lastT = 0;
      S.hook(function (now) {
        var el = now - t0, dt = lastT ? Math.min(100, now - lastT) : 16.7; lastT = now;
        var ease = reduce ? 1 : 1 - Math.pow(1 - .085, dt / 16.7); // frame-rate independent
        bars.forEach(function (bar) {
          var go = el > bar.delay, sum = 0;
          for (var k = 0; k < 3; k++) {
            var tg = go ? bar.tgt[k] : bar.cur[k];
            bar.cur[k] += (tg - bar.cur[k]) * ease;
            var seg = bar.segs[k]; seg.scale.y = Math.max(.001, bar.cur[k]); seg.position.y = sum; sum += bar.cur[k];
            seg.visible = bar.cur[k] > .01;
          }
          bar.val.position.set(0, sum + .7, 0);
        });
        S.ray.setFromCamera(S.mouse, S.cam);
        var hit = S.ray.intersectObjects(allSegs.filter(function (q) { return q.visible; }))[0], hi2 = hit ? hit.object.userData.i : -1;
        if (hi2 !== hover) {
          if (hover >= 0) bars[hover].segs.forEach(function (sg) { sg.material.emissive.setHex(0); });
          hover = hi2; if (hover >= 0) bars[hover].segs.forEach(function (sg) { sg.material.emissive.setHex(0x222244); });
          S.r.domElement.style.cursor = hover >= 0 ? "pointer" : "";
        }
        var sc = Math.max(...bars.map(function (b) { return b.cur[0] + b.cur[1] + b.cur[2]; }), 1);
        wallLines.forEach(function (l, j) { l.position.y = sc * j / 4; });
      });
      function themeFix() { var d = isDark(); plate.material.color.setHex(d ? 0x1d1f27 : 0xe9ebf2); grid.visible = !d;
        bars.forEach(function (b) { var old = b.code; b.grp.remove(old); old.material.map.dispose(); old.material.dispose(); b.code = makeLabel(b.s.code, { size: 40, color: d ? "#F5F5F7" : "#1D1D1F", scale: .9 }); b.code.position.set(0, .55, 1.9); b.grp.add(b.code); }); }
      themeFix(); document.addEventListener("themechange", themeFix);
      var mqd = matchMedia("(prefers-color-scheme: dark)"); if (mqd.addEventListener) mqd.addEventListener("change", themeFix);
      setMetric("score");
    }
  })();

  /* ============ COOL ROOF: lit 3D city with a moving sun ============ */
  (function () {
    var box = $("#cr-3d"), area = $("#cr-area"), aout = $("#cr-area-out"), cost = $("#cr-cost"), bDark = $("#cr-dark"), bCool = $("#cr-cool"),
      sunIn = $("#cr-sun"), sunOut = $("#cr-sun-out"), gates = $$("#gates li");
    if (!box) return;
    var cool = true, api = null;
    var readout = document.createElement("div"); readout.className = "cr-readout"; box.parentElement.appendChild(readout);
    function setReadout() {
      readout.innerHTML = cool ? "<span>Indoor air vs a dark roof</span><b class='cool'>2.1–4.3 °C cooler</b><span>range cited for Telangana's policy</span>"
        : "<span>Conventional roof</span><b class='hot'>absorbs most sunlight</b><span>heat flows into the floor below</span>";
    }
    function money() { var a = +area.value; aout.textContent = a.toLocaleString("en-IN") + " sq ft"; cost.textContent = INR(a * 2) + " – " + INR(a * 4); }
    function hourTxt(h) { var hh = Math.floor(h), mm = Math.round((h - hh) * 60), ap = hh >= 12 ? "pm" : "am", h12 = ((hh + 11) % 12) + 1; return h12 + ":" + (mm < 10 ? "0" : "") + mm + " " + ap; }
    var gt = [];
    function lightGates() {
      gates.forEach(function (g) { g.classList.remove("lit", "blocked"); });
      gt.forEach(clearTimeout); gt = [];
      gates.forEach(function (g, i) { gt.push(setTimeout(function () { if (i === 3 && !cool) g.classList.add("blocked"); else g.classList.add("lit"); }, reduce ? 0 : 260 * (i + 1))); });
      gates[3].lastChild.textContent = cool ? "Occupancy certificate: SRI 78+ verified, OC issued" : "Occupancy certificate: no SRI 78+, no OC";
    }
    function setMode(c) { cool = c; bCool.setAttribute("aria-pressed", c); bDark.setAttribute("aria-pressed", !c); setReadout(); lightGates(); if (api) api.mode(c); }
    area.addEventListener("input", function () { money(); if (api) api.size(+area.value); });
    sunIn.addEventListener("input", function () { sunOut.textContent = hourTxt(+sunIn.value); if (api) api.sun(+sunIn.value); });
    bDark.addEventListener("click", function () { setMode(false); });
    bCool.addEventListener("click", function () { setMode(true); });
    money(); setReadout(); sunOut.textContent = hourTxt(+sunIn.value);
    var lit = false; onVisible($("#gates"), function (v) { if (v && !lit) { lit = true; lightGates(); } }, { threshold: 0 });

    var started = false;
    onVisible(box, function (v) { if (v && !started) { started = true; threeReady(build); } }, { threshold: 0.05 });
    function windowTex() {
      var c = document.createElement("canvas"); c.width = 64; c.height = 64; var x = c.getContext("2d");
      x.fillStyle = "#EDE6DA"; x.fillRect(0, 0, 64, 64);
      x.fillStyle = "#6F7F94"; x.fillRect(10, 14, 18, 22); x.fillRect(36, 14, 18, 22);
      x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(10, 14, 18, 5); x.fillRect(36, 14, 18, 5);
      x.fillStyle = "#D9D0C0"; x.fillRect(0, 44, 64, 4);
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
    }
    function build(ok) {
      if (!ok) return fallback(box, "3D view needs WebGL.");
      var S = stage3d(box, { pos: new THREE.Vector3(26, 22, 30), target: new THREE.Vector3(0, 3, 0), minD: 10, maxD: 90, shadows: true, maxPolar: 1.38, spinSpeed: .35, fov: 36 });
      if (!S) return fallback(box, "3D view needs WebGL.");
      var scene = S.scene;
      var hemi = new THREE.HemisphereLight(0xEAF0FF, 0x8a8170, .45); scene.add(hemi);
      var sun = new THREE.DirectionalLight(0xFFF1D6, 1); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      var sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 160; sun.shadow.bias = -.0004;
      scene.add(sun); scene.add(sun.target);
      var sunBall = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 20), new THREE.MeshBasicMaterial({ color: 0xFFD27A }));
      scene.add(sunBall);
      var ground = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: 0xB9BCB1, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
      var asphalt = new THREE.MeshStandardMaterial({ color: 0x55575c, roughness: .95 });
      [-13.5, -4.5, 4.5, 13.5].forEach(function (p) {
        var a = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 120), asphalt); a.rotation.x = -Math.PI / 2; a.position.set(p, .02, 0); a.receiveShadow = true; scene.add(a);
        var b = new THREE.Mesh(new THREE.PlaneGeometry(120, 3.2), asphalt); b.rotation.x = -Math.PI / 2; b.position.set(0, .021, p); b.receiveShadow = true; scene.add(b);
      });
      var tex = windowTex(), roofs = [], buildings = [], hero = null, seed = 5;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var gx = -2; gx <= 2; gx++) for (var gz = -2; gz <= 2; gz++) {
        var isHero = gx === 0 && gz === 0;
        if (!isHero && rnd() < .12) continue;
        var w = isHero ? 5 : 3.2 + rnd() * 2.2, d = isHero ? 5 : 3.2 + rnd() * 2.2, h = isHero ? 4.2 : 2.5 + rnd() * 7;
        var t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(w / 1.6)), Math.max(1, Math.round(h / 1.4)));
        var wall = new THREE.MeshStandardMaterial({ map: t, roughness: .85 });
        var bx = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wall);
        var px = gx * 9, pz = gz * 9; // one building per block; roads run at ±4.5 and ±13.5
        bx.position.set(px, h / 2, pz); bx.castShadow = bx.receiveShadow = true; scene.add(bx);
        var parapet = new THREE.Mesh(new THREE.BoxGeometry(w + .14, .22, d + .14), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: .7 }));
        parapet.position.set(px, h + .11, pz); parapet.castShadow = true; parapet.receiveShadow = true; scene.add(parapet);
        var bld = { bx: bx, roof: parapet, h: h, w: w, d: d }; roofs.push(parapet); buildings.push(bld);
        if (isHero) hero = bld;
      }
      // trees
      var tg = new THREE.IcosahedronGeometry(.9, 0), tm = new THREE.MeshStandardMaterial({ color: 0x4f7a3a, roughness: .9, flatShading: true });
      for (var i = 0; i < 36; i++) { var tr = new THREE.Mesh(tg, tm), a = rnd() * 6.28, rr = 27 + rnd() * 9; tr.position.set(Math.cos(a) * rr, 1, Math.sin(a) * rr); tr.scale.setScalar(.8 + rnd() * .8); tr.castShadow = true; scene.add(tr); }
      // rays and heat
      var rays = [], N = 30;
      for (i = 0; i < N; i++) {
        var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        var ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb53c, transparent: true, opacity: .9 }));
        scene.add(ln); rays.push({ ln: ln, t: Math.random() * 2, off: new THREE.Vector3((Math.random() - .5), 0, (Math.random() - .5)) });
      }
      var heats = buildings.map(function (b) {
        var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff6a2a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
        m.rotation.x = -Math.PI / 2; m.position.set(b.roof.position.x, b.h + .3, b.roof.position.z); m.scale.set(b.w, b.d, 1); scene.add(m); b.heat = m; return m;
      });
      var tag = null;
      function setTag() {
        if (tag) { scene.remove(tag); tag.material.map.dispose(); tag.material.dispose(); }
        tag = makeLabel(mode ? "Cool roof: reflects sunlight" : "Dark roof: heat into the top floor", { size: 34, color: "#fff", bg: mode ? "rgba(59,91,219,.94)" : "rgba(217,98,43,.94)", scale: 2.1, depthTest: false });
        tag.position.set(0, hero.h + 4.2, 0); scene.add(tag);
      }
      var mode = cool;
      function paint() {
        roofs.forEach(function (rf) { rf.material.color.setHex(mode ? 0xF4F7FA : 0x2f2f31); rf.material.roughness = mode ? .35 : .8; });
        setTag();
      }
      var sunPos = new THREE.Vector3();
      function placeSun(hh) {
        var a = (hh - 6) / 12 * Math.PI, el = Math.sin(a);
        sunPos.set(-Math.cos(a) * 46, 4 + el * 42, 14);
        sun.position.copy(sunPos); sunBall.position.copy(sunPos).multiplyScalar(.92);
        var warm = 1 - Math.min(1, el * 1.6);
        sun.color.setRGB(1, .93 - warm * .25, .82 - warm * .45); sun.intensity = .3 + el * .75;
        sunBall.material.color.setRGB(1, .82 - warm * .3, .45 - warm * .3);
        hemi.intensity = .28 + el * .3;
        var d = isDark(), top = d ? [14, 20, 48] : [190 - warm * 60, 210 - warm * 70, 245 - warm * 90], bot = d ? [21, 21, 24] : [247, 236 - warm * 30, 222 - warm * 60];
        box.style.background = "linear-gradient(to bottom, rgb(" + top.map(Math.round) + "), rgb(" + bot.map(Math.round) + "))";
      }
      api = {
        mode: function (c) { mode = c; paint(); },
        size: function (a) { var s = .75 + (a - 500) / 19500 * .55; hero.bx.scale.set(s, 1, s); hero.roof.scale.set(s, 1, s); hero.heat.scale.set(hero.w * s, hero.d * s, 1); },
        sun: placeSun
      };
      paint(); api.size(+area.value); placeSun(+sunIn.value);
      var roofTheme = function () { placeSun(+sunIn.value); ground.material.color.setHex(isDark() ? 0x4a4c52 : 0xB9BCB1); };
      document.addEventListener("themechange", roofTheme);
      var mqr = matchMedia("(prefers-color-scheme: dark)"); if (mqr.addEventListener) mqr.addEventListener("change", roofTheme);
      if (isDark()) ground.material.color.setHex(0x4a4c52);
      var rLast = 0;
      S.hook(function (now) {
        var rdt = rLast ? Math.min(6, (now - rLast) / 16.7) : 1; rLast = now;
        var top = hero.h + .25, sx = hero.bx.scale.x;
        rays.forEach(function (ry) {
          ry.t += reduce ? 0 : .011 * rdt; if (ry.t > 2) ry.t -= 2;
          var hit = new THREE.Vector3(ry.off.x * hero.w * sx, top, ry.off.z * hero.d * sx), p = ry.ln.geometry.attributes.position, src = sunBall.position;
          if (ry.t <= 1) { var a = src.clone().lerp(hit, Math.max(0, ry.t - .3) / .7), b2 = src.clone().lerp(hit, ry.t);
            p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b2.x, b2.y, b2.z); ry.ln.material.color.setHex(0xffb53c); ry.ln.material.opacity = .85; }
          else if (mode) { var k = ry.t - 1, out = new THREE.Vector3(hit.x - (src.x - hit.x) * .9, src.y + 8, hit.z - (src.z - hit.z) * .9), a2 = hit.clone().lerp(out, Math.max(0, k - .3)), b3 = hit.clone().lerp(out, k);
            p.setXYZ(0, a2.x, a2.y, a2.z); p.setXYZ(1, b3.x, b3.y, b3.z); ry.ln.material.color.setHex(0x8fb0ff); ry.ln.material.opacity = .9 * (1 - k); }
          else { var kk = ry.t - 1, dn = hit.clone(); dn.y = top - kk * 3.4; p.setXYZ(0, hit.x, top, hit.z); p.setXYZ(1, dn.x, dn.y, dn.z); ry.ln.material.color.setHex(0xff5a1f); ry.ln.material.opacity = .85 * (1 - kk); }
          p.needsUpdate = true;
        });
        var pulse = .5 + .5 * Math.sin(now / 380);
        heats.forEach(function (hm) { var tgt = mode ? 0 : .22 + .14 * pulse; hm.material.opacity += (tgt - hm.material.opacity) * .08; });
      });
    }
  })();

  /* ============ CM HELPLINE ESCALATION ============ */
  (function () {
    var svg = $("#esc-svg"); if (!svg) return;
    var NS = "http://www.w3.org/2000/svg", log = $("#esc-log"), play = $("#esc-play"), reset = $("#esc-reset"), caseSel = $("#esc-case"), endSel = $("#esc-end");
    var LV = [["L1", "Block"], ["L2", "District"], ["L3", "Division / Directorate"], ["L4", "Secretary / HoD"]];
    var CASES = ["Certified copy of a sale deed not issued", "Occupancy certificate application stuck", "Wrong name after registration not corrected"];
    function el(t, a, p) { var e = document.createElementNS(NS, t); for (var k in a) { if ((k === "fill" || k === "stroke") && /var\(/.test(a[k])) e.style.setProperty(k, a[k]); else e.setAttribute(k, a[k]); } (p || svg).appendChild(e); return e; }
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
      rungs.forEach(function (r) { r.tm.setAttribute("width", 0); r.st.textContent = "waiting"; r.rect.style.stroke = "var(--rule)"; r.tm.style.fill = "var(--teal)"; });
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
      var r = rungs[i]; r.rect.style.stroke = "var(--teal)"; r.st.textContent = "deadline running";
      add(LV[i][0] + " · " + LV[i][1] + " officer assigned.");
      var w = 0, finalHere = i === end - 1;
      timer = setInterval(function () {
        w += reduce ? 130 : 4; r.tm.setAttribute("width", Math.min(130, w));
        if (finalHere && w >= 80) {
          clearInterval(timer); r.st.textContent = "resolved"; r.rect.style.stroke = "var(--teal)";
          add("Resolved at " + LV[i][0] + ". Citizen confirms closure. Dashboard updated.");
          if (i === 3) add("This is where the Secretary's dashboard comes in.");
          busy = false; play.textContent = "Play again";
        } else if (!finalHere && w >= 130) {
          clearInterval(timer); r.tm.style.fill = "var(--amber)"; r.st.textContent = "escalated";
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

  /* ============ NAME MATCHER (Hindi/English, transparent steps) ============ */
  var NM = (function () {
    var V = { "अ": "a", "आ": "aa", "इ": "i", "ई": "ii", "उ": "u", "ऊ": "uu", "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au" };
    var M = { "ा": "aa", "ि": "i", "ी": "ii", "ु": "u", "ू": "uu", "ृ": "ri", "े": "e", "ै": "ai", "ो": "o", "ौ": "au" };
    var C = { "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n", "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n", "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
      "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n", "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
      "क़": "q", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f" };
    function translit(str) {
      var out = "", ch, nx;
      str = str.normalize ? str.normalize("NFC") : str;
      for (var i = 0; i < str.length; i++) {
        ch = str[i]; nx = str[i + 1];
        if (nx === "\u093C" && C[ch + nx]) { ch = ch + nx; i++; nx = str[i + 1]; }
        if (C[ch]) {
          out += C[ch];
          if (nx === "\u094D") { i++; continue; }            // virama: no vowel
          if (M[nx]) { out += M[nx]; i++; continue; }       // vowel sign
          if (nx && !/[\s.,]/.test(nx)) out += "a";          // inherent vowel; dropped at word end (schwa deletion)
        } else if (V[ch]) out += V[ch];
        else if (ch === "\u0902" || ch === "\u0901") out += "n"; // anusvara / chandrabindu
        else if (ch === "\u0903") out += "h";
        else out += ch;
      }
      return out;
    }
    var HON = /^(sri|srimati|smt|mr|mrs|ms|mis|dr|kumari|km|late|susri|kum)$/;
    var SOFT = /^(bai|devi|bi)$/;
    function fold(t) {
      return t.replace(/aa+/g, "a").replace(/ee|ii/g, "i").replace(/oo|uu/g, "u").replace(/w/g, "v").replace(/ph/g, "f").replace(/sh/g, "s")
        .replace(/z/g, "j").replace(/ck/g, "k").replace(/q/g, "k").replace(/([bcdfghjklmnprstvy])\1+/g, "$1").replace(/(?!^)h(?=[^aeiou]|$)/g, "").replace(/y$/, "i");
    }
    function jw(a, b) {
      if (a === b) return 1; var la = a.length, lb = b.length; if (!la || !lb) return 0;
      var md = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1), am = [], bm = [], m = 0, t = 0, i, j, k;
      for (i = 0; i < la; i++) for (j = Math.max(0, i - md); j < Math.min(lb, i + md + 1); j++) if (!bm[j] && a[i] === b[j]) { am[i] = bm[j] = 1; m++; break; }
      if (!m) return 0;
      for (i = 0, k = 0; i < la; i++) if (am[i]) { while (!bm[k]) k++; if (a[i] !== b[k]) t++; k++; }
      var jaro = (m / la + m / lb + (m - t / 2) / m) / 3, p = 0;
      while (p < 4 && a[p] === b[p]) p++;
      return jaro + p * .1 * (1 - jaro);
    }
    function schwa(t) { return t.replace(/^([^aeiou]*[aeiou][^aeiou])a(?=[^aeiou][aeiou])/, "$1"); } // kamala -> kamla
    function sim(a, b) { var ra = schwa(a), rb = schwa(b); return Math.max(jw(a, b), jw(ra, rb), jw(ra, b), jw(a, rb)); }
    function run(A, B) {
      var steps = [], a = A, b = B, dev = /[\u0900-\u097F]/;
      var ta = dev.test(a) ? translit(a) : a, tb = dev.test(b) ? translit(b) : b;
      steps.push(["Script", ta, tb, dev.test(A) || dev.test(B) ? "Devanagari transliterated to Latin" : "both already Latin"]);
      var ca = ta.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim(), cb = tb.toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
      steps.push(["Clean", ca, cb, "lower case, punctuation out"]);
      var xa = ca.split(" ").filter(function (w) { return w && !HON.test(fold(w)); }), xb = cb.split(" ").filter(function (w) { return w && !HON.test(fold(w)); });
      var soft = 0, ya = xa.filter(function (w) { if (SOFT.test(fold(w))) { soft++; return false; } return true; }), yb = xb.filter(function (w) { if (SOFT.test(fold(w))) { soft++; return false; } return true; });
      if (!ya.length) ya = xa; if (!yb.length) yb = xb;
      steps.push(["Titles", ya.join(" "), yb.join(" "), "honorifics removed" + (soft ? ", suffix like ‘bai’ or ‘devi’ set aside" : "")]);
      var fa = ya.map(fold), fb = yb.map(fold);
      steps.push(["Sound", fa.join(" "), fb.join(" "), "spelling variants folded: aa→a, ee→i, w→v, sh→s; short vowels inside Hindi names allowed"]);
      fa.sort(); fb.sort();
      steps.push(["Order", fa.join(" "), fb.join(" "), "tokens sorted, so word order cannot matter"]);
      // best one-to-one token assignment (greedy on score), initials allowed
      var short = fa.length <= fb.length ? fa : fb, long = short === fa ? fb : fa, used = [], total = 0, weak = false, initials = 0;
      short.forEach(function (t) {
        var best = 0, bi = -1;
        long.forEach(function (u, j) {
          if (used[j]) return;
          var s = (t.length === 1 || u.length === 1) ? (t[0] === u[0] ? .86 : 0) : sim(t, u);
          if (s > best) { best = s; bi = j; }
        });
        if (bi >= 0) used[bi] = 1;
        if (t.length === 1 || (bi >= 0 && long[bi].length === 1)) initials++;
        else if (best < .92) weak = true;
        total += best;
      });
      var score = long.length ? total / long.length : 0;
      var verdict = score >= .92 && !weak && !initials ? "Match" : score >= .8 ? "Send for review" : "No match";
      var why = verdict === "Match" ? "same person, high confidence" : initials ? "initials only, needs a human check" : weak ? "a name token differs" : score >= .8 ? "close but not certain" : "different people";
      steps.push(["Score", "Jaro–Winkler per token", Math.round(score * 100) + "%", why]);
      return { score: score, verdict: verdict, why: why, steps: steps };
    }
    return { run: run, translit: translit };
  })();

  (function () {
    var A = $("#nm-a"), B = $("#nm-b"); if (!A) return;
    var ring = $("#nm-ring"), pct = $("#nm-pct"), ver = $("#nm-verdict"), list = $("#nm-steps"), CIRC = 2 * Math.PI * 50, shown = 0;
    ring.style.strokeDasharray = CIRC; ring.style.strokeDashoffset = CIRC;
    function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function render() {
      var r = NM.run(A.value, B.value), target = r.score;
      list.innerHTML = r.steps.map(function (s, i) {
        return "<li style='--d:" + (i * 70) + "ms'><span class='sn'>" + esc(s[0]) + "</span><code>" + esc(s[1]) + "</code><code>" + esc(s[2]) + "</code><small>" + esc(s[3]) + "</small></li>";
      }).join("");
      ver.textContent = r.verdict; ver.className = r.verdict === "Match" ? "ok" : r.verdict === "No match" ? "no" : "rv";
      ring.className.baseVal = "val " + ver.className;
      var from = shown, t0 = performance.now();
      (function step(t) {
        var k = reduce ? 1 : Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3), v = from + (target - from) * e;
        ring.style.strokeDashoffset = CIRC * (1 - v); pct.textContent = Math.round(v * 100) + "%";
        if (k < 1) requestAnimationFrame(step); else shown = target;
      })(t0);
    }
    var tm; [A, B].forEach(function (i) { i.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(render, 140); }); });
    $$("#nm-ex .chip").forEach(function (c) { c.addEventListener("click", function () { A.value = c.dataset.a; B.value = c.dataset.b; render(); }); });
    var once = false; onVisible($("#dp-match"), function (v) { if (v && !once) { once = true; render(); } }, { threshold: 0 });
  })();

  /* ============ PARCEL API PLAYGROUND (synthetic) ============ */
  var PARCEL = (function () {
    function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
    var OWN = [["गीता बाई साहू", "Geeta Sahu"], ["रमेश कुमार वर्मा", "R. K. Verma"], ["आयुष देवांगन", "Aayush Devangan"], ["सुनीता यादव", "Sunil Yadav"], ["मोहन लाल पटेल", "Mohan Lal Patel"], ["कमला देवी निषाद", "Kamla Nishad"]];
    var USE = ["agricultural", "agricultural", "residential (diverted)", "agricultural"];
    function mask(n) { return n.split(" ").map(function (w) { return w[0] + "•••"; }).join(" "); }
    function get(dist, kh) {
      kh = (kh || "").trim();
      if (!/^\d{1,4}(\/\d{1,3})?$/.test(kh)) return { status: 422, body: { error: { code: "invalid_khasra", message: "Khasra must look like 214 or 214/3.", field: "khasra" } } };
      var h = hash(dist + "|" + kh), o = OWN[h % OWN.length], m = NM.run(o[0], o[1]);
      var area = ((h >>> 3) % 900 + 40) / 1000, enc = (h >>> 7) % 3, mut = (h >>> 11) % 5 ? "completed" : "pending";
      var y = 2019 + (h >>> 13) % 7, mo = 1 + (h >>> 17) % 12, dd = 1 + (h >>> 19) % 27, date = y + "-" + (mo < 10 ? "0" : "") + mo + "-" + (dd < 10 ? "0" : "") + dd;
      var flags = [];
      if (m.verdict !== "Match") flags.push("owner_name_mismatch");
      if (mut === "pending") flags.push("mutation_pending");
      if (enc) flags.push("active_encumbrance");
      return { status: 200, body: {
        _synthetic: true,
        parcel_id: "CG-" + dist.slice(0, 3).toUpperCase() + "-" + kh.replace("/", "-") + "-" + (h % 9000 + 1000),
        khasra: kh, district: dist, state: "CG",
        area_hectare: +area.toFixed(3), land_use: USE[h % USE.length],
        record_of_rights: { owner: mask(o[0]), owner_script: "Devanagari", last_updated: date },
        last_deed: { type: "sale", registered_on: date, party_name: mask(o[1]) },
        mutation: { status: mut, auto: mut === "completed" },
        encumbrances: Array.apply(null, Array(enc)).map(function (_, i) { return { type: "mortgage", holder: "Bank " + "ABC"[i] + " (synthetic)", since: (y - 1 - i) + "-04-01" }; }),
        checks: { owner_name_match: { score: +m.score.toFixed(2), verdict: m.verdict.toLowerCase().replace(/ /g, "_") }, flags: flags },
        lendable: flags.length === 0
      } };
    }
    return { get: get };
  })();

  (function () {
    var send = $("#api-send"); if (!send) return;
    var dist = $("#api-dist"), kh = $("#api-kh"), url = $("#api-url"), out = $("#api-json"), ms = $("#api-ms"), busy = false;
    function u() { return "/v1/parcels?state=CG&district=" + dist.value.toLowerCase().replace(/ /g, "-") + "&khasra=" + encodeURIComponent(kh.value.trim()); }
    function hl(json) {
      return json.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; })
        .replace(/("(?:\\.|[^"\\])*")(\s*:)?/g, function (m0, s, colon) { return colon ? "<span class='jk'>" + s + "</span>" + colon : "<span class='js'>" + s + "</span>"; })
        .replace(/\b(true|false|null)\b/g, "<span class='jb'>$1</span>").replace(/(:\s*)(-?\d+(?:\.\d+)?)/g, "$1<span class='jn'>$2</span>");
    }
    function upd() { url.textContent = u(); }
    dist.addEventListener("change", upd); kh.addEventListener("input", upd);
    kh.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); send.click(); } });
    send.addEventListener("click", function () {
      if (busy) return; busy = true; upd();
      var t = 140 + Math.round(Math.random() * 220); out.classList.add("loading"); out.textContent = "…"; ms.textContent = "";
      setTimeout(function () {
        var r = PARCEL.get(dist.value, kh.value);
        out.classList.remove("loading");
        out.innerHTML = "<span class='st s" + r.status + "'>HTTP " + r.status + "</span>\n" + hl(JSON.stringify(r.body, null, 2));
        ms.textContent = r.status + " · " + t + " ms"; busy = false;
      }, reduce ? 0 : t);
    });
    upd();
  })();

  /* ============ TERMINAL ============ */
  (function () {
    var out = $("#term-out"), form = $("#term-form"), q = $("#term-q"); if (!out) return;
    var hist = [], hi = 0;
    function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
    function w(html, cls) { var d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
    var C = {
      help: function () { return "<span class='h'>commands</span>\n  whoami      who I am\n  match A | B compare two names (Hindi or English)\n  parcel 214/3  call the synthetic parcel API\n  work        what I did, by department\n  helpline    CM Helpline 1076 work\n  coolroof    the Cool Roof pitch\n  registries  open the ten-state scorecard\n  sro         open the SRO prototype\n  curl api    fetch /api/profile.json\n  evidence    proof of work\n  cv          download my CV\n  contact     how to reach me\n  theme       switch light / dark\n  clear       clear the screen\n<span class='m'>tip: Tab completes, ↑ recalls. There is also one hidden command.</span>"; },
      whoami: function () { return "Ayush Dewangan · Raipur, India\nCM Good Governance Fellow, Govt of Chhattisgarh · Aug 2025 – Mar 2027 (tentative)\nMBA Public Policy & Governance, IIM Raipur ('27)\nB.Com (Hons); ex site accountant, AJ Constructions"; },
      work: function () { return "<span class='c'>[registration]</span> 30 reforms / 10 states benchmarked; Secretary directed 2 for implementation\n<span class='c'>[registration]</span> DPR: ₹3.24 Cr across 107 Sub-Registrar offices\n<span class='c'>[housing-env]</span> Cool Roof pitch: SRI 78+ as an OC condition, ₹2–4/sq ft paid by developer\n<span class='c'>[good-gov]</span>    CM Helpline 1076: L1–L4 escalation map for 2 departments"; },
      helpline: function () { return "CM Helpline 1076 launched 9 Jun 2026: phone, portal, app, WhatsApp.\nLadder: L1 Block → L2 District → L3 Division/Directorate → L4 Secretary/HoD\nMy part: grievance categories + L1–L4 officer map for Commercial Tax and\nHousing & Environment; departmental point of contact for the portal.\n<a href='#demos' data-demo='helpline'>→ run the escalation demo</a>"; },
      coolroof: function () { return "Status: pitched to Housing & Environment.\nRule: no SRI 78+ roof, no occupancy certificate. 4 checkpoints. State cost: ₹0.\nDeveloper cost: ₹2–4 per sq ft. Benchmark: Telangana 2023.\n<a href='#demos' data-demo='roof'>→ open the 3D simulator</a>"; },
      registries: function () { location.href = "/registries/"; return "opening /registries/ …"; },
      sro: function () { location.href = "/sro-scorecard/"; return "opening /sro-scorecard/ …"; },
      evidence: function () { $("#proof").scrollIntoView({ behavior: "smooth" }); return "scrolling to proof of work …"; },
      cv: function () { location.href = "/files/Ayush_Dewangan_CV.pdf"; return "downloading Ayush_Dewangan_CV.pdf …"; },
      contact: function () { return "email     " + (window.SITE && SITE.email) + "\nlinkedin  <a href='https://www.linkedin.com/in/ayush-dewangann/' target='_blank' rel='noopener'>linkedin.com/in/ayush-dewangann</a>\nstatus    available from April 2027"; },
      theme: function () { return "theme → " + toggleTheme(); },
      clear: function () { out.innerHTML = ""; return null; },
      ls: function () { return "registries/  sro-scorecard/  posts/  api/profile.json  api/registries.json  files/Ayush_Dewangan_CV.pdf"; },
      date: function () { return new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"; },
      "sudo hire-me": function () { copyText(SITE.email, "Email copied"); return "<span class='c'>permission granted.</span> Email copied to your clipboard. I can start in April 2027."; },
      "curl api": function () {
        fetch("/api/profile.json").then(function (r) { return r.text(); }).then(function (t) { w(t.replace(/</g, "&lt;").slice(0, 1600) + (t.length > 1600 ? "\n…" : ""), "m"); })
          .catch(function () { w("curl: could not fetch /api/profile.json", "m"); });
        return "<span class='m'>GET /api/profile.json</span>";
      }
    };
    var NAMES = Object.keys(C).concat(["match", "parcel"]);
    function exec(raw) {
      var cmd = raw.trim().toLowerCase().replace(/\s+/g, " "); if (!cmd) return;
      if (cmd.length > 300) return w("input too long", "m");
      w("<span class='c'>ayush@raipur:~$</span> " + raw.replace(/</g, "&lt;"));
      if (cmd === "sudo") return w("usage: sudo hire-me", "m");
      if (cmd.indexOf("curl") === 0) cmd = "curl api";
      if (cmd.indexOf("match") === 0) {
        var parts = raw.trim().slice(5).split("|");
        if (parts.length !== 2 || !parts[0].trim() || !parts[1].trim()) return w("usage: match NAME ONE | NAME TWO", "m");
        var res = NM.run(parts[0].trim(), parts[1].trim());
        return w(res.steps.map(function (s) { return "<span class='c'>" + s[0].padEnd(7) + "</span>" + esc(s[1]) + "  ·  " + esc(s[2]); }).join("\n") + "\n<span class='h'>" + res.verdict + "</span> (" + res.why + ")");
      }
      if (cmd.indexOf("parcel") === 0) {
        var kh = raw.trim().slice(6).trim() || "214/3", rr = PARCEL.get("Raipur", kh);
        return w("<span class='m'>GET /v1/parcels?state=CG&amp;district=raipur&amp;khasra=" + esc(encodeURIComponent(kh)) + " → " + rr.status + "</span>\n" + esc(JSON.stringify(rr.body, null, 2)));
      }
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
