/* Hero: a lit aerial landscape of land parcels (three.js r128).
   Each parcel is a khasra; every few seconds one is "registered": its boundary lights up and a pin rises.
   Day palette in light mode, night village in dark mode. Falls back to the CSS/WebGL aurora if WebGL or three.js is missing. */
// Shared, lazy three.js loader: nothing 3D is downloaded until it is needed.
window.loadThree = window.loadThree || function () {
  if (!window.__threeP) {
    var ls = function (src) { return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); };
    window.__threeP = (window.THREE && THREE.OrbitControls) ? Promise.resolve() :
      ls("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js")
        .then(function () { return ls("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js").catch(function () {}); });
  }
  return window.__threeP;
};
(function () {
  "use strict";
  var host = document.getElementById("hero3d");
  if (!host) return;
  var force0 = /[?&]hero3d=force/.test(location.search);
  function gpuOK() { // silent probe: no usable GPU -> keep the light aurora and never download three.js
    if (force0) return true;
    var c = document.createElement("canvas"), g = c.getContext("webgl", { failIfMajorPerformanceCaveat: true });
    if (!g) return false;
    var d = g.getExtension("WEBGL_debug_renderer_info"), name = d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : "";
    var l = g.getExtension("WEBGL_lose_context"); if (l) l.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(name);
  }
  // after first paint and idle: probe, then fetch three.js, then build
  var go = function () {
    (window.requestIdleCallback || function (f) { setTimeout(f, 1); })(function () {
      if (!gpuOK()) return;
      window.loadThree().then(function () { if (window.THREE) init(); }, function () {});
    }, { timeout: 1500 });
  };
  if (document.readyState === "complete") go(); else addEventListener("load", go);
  function init() {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = matchMedia("(max-width: 700px)").matches;
  function isDark() { var t = document.documentElement.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }

  var renderer, force = /[?&]hero3d=force/.test(location.search);
  // failIfMajorPerformanceCaveat: machines that would draw WebGL in software keep the light aurora instead
  try { renderer = new THREE.WebGLRenderer({ antialias: !small, alpha: false, powerPreference: "high-performance" }); } catch (e) { return; }

  renderer.setPixelRatio(Math.min(small ? 1.25 : 1.35, devicePixelRatio || 1));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  // colours below are authored in sRGB; convert so they render as designed
  function C(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(30, 1, 1, 900);

  // ---------- deterministic random ----------
  var seed = 7; function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function noise(x, z) { return Math.sin(x * 0.021) * Math.cos(z * 0.017) * 2.2 + Math.sin(x * 0.053 + z * 0.041) * 0.9; }

  // ---------- ground ----------
  var SIZE = 520, groundGeo = new THREE.PlaneGeometry(SIZE, SIZE, 120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  var gp = groundGeo.attributes.position;
  for (var i = 0; i < gp.count; i++) gp.setY(i, noise(gp.getX(i), gp.getZ(i)) - 0.4);
  groundGeo.computeVertexNormals();
  var groundMat = new THREE.MeshStandardMaterial({ color: C(0x7d8c5c), roughness: 1 });
  var ground = new THREE.Mesh(groundGeo, groundMat); ground.receiveShadow = true; scene.add(ground);

  // ---------- parcels: jittered grid of quads, merged into one mesh with vertex colours ----------
  var COLS = small ? 18 : 26, ROWS = small ? 14 : 20, CELL = 13, ox = -COLS * CELL / 2, oz = -ROWS * CELL / 2 - 30;
  var grid = [];
  for (var gx = 0; gx <= COLS; gx++) { grid[gx] = []; for (var gz = 0; gz <= ROWS; gz++) {
    var jx = (gx && gx < COLS) ? (rnd() - .5) * CELL * .55 : 0, jz = (gz && gz < ROWS) ? (rnd() - .5) * CELL * .55 : 0;
    grid[gx][gz] = [ox + gx * CELL + jx, oz + gz * CELL + jz];
  } }
  var DAY = ["#7FA05A", "#94B062", "#B8B26A", "#C9B27A", "#A88B5F", "#6E8F4E", "#9DBB6E", "#B59C6B"];
  var parcels = [], pos = [], col = [], uvs = [], idx = [], lines = [], vi = 0;
  var river = function (x) { return 40 * Math.sin(x * 0.018) + 25; }; // z of river centreline
  for (gx = 0; gx < COLS; gx++) for (gz = 0; gz < ROWS; gz++) {
    var q = [grid[gx][gz], grid[gx + 1][gz], grid[gx + 1][gz + 1], grid[gx][gz + 1]];
    var cx = (q[0][0] + q[2][0]) / 2, cz = (q[0][1] + q[2][1]) / 2;
    if (Math.abs(cz - river(cx)) < 9) continue; // leave room for the river
    var c = new THREE.Color(DAY[Math.floor(rnd() * DAY.length)]); c.offsetHSL(0, (rnd() - .5) * .06, (rnd() - .5) * .06); c.convertSRGBToLinear();
    var inset = 0.55, pts = q.map(function (v) { return [cx + (v[0] - cx) * (1 - inset / CELL * 2), cz + (v[1] - cz) * (1 - inset / CELL * 2)]; });
    var base = vi, ang = Math.floor(rnd() * 4) * Math.PI / 4 + (rnd() - .5) * .3, ca = Math.cos(ang), sa = Math.sin(ang), fallow = rnd() < .18;
    pts.forEach(function (v) { pos.push(v[0], noise(v[0], v[1]) + 0.12, v[1]); col.push(c.r, c.g, c.b);
      var u = (v[0] * ca - v[1] * sa) / 9, w = (v[0] * sa + v[1] * ca) / 9; uvs.push(fallow ? u * .05 : u, fallow ? w * .05 : w); vi++; });
    idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    parcels.push({ pts: pts, cx: cx, cz: cz, color: c.clone(), base: base, kh: (100 + Math.floor(rnd() * 800)) + "/" + (1 + Math.floor(rnd() * 6)) });
    for (var k = 0; k < 4; k++) { var a = q[k], b = q[(k + 1) % 4]; lines.push(a[0], noise(a[0], a[1]) + 0.35, a[1], b[0], noise(b[0], b[1]) + 0.35, b[1]); }
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  pGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  pGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  pGeo.setIndex(idx); pGeo.computeVertexNormals();
  var rows = (function () {
    var c = document.createElement("canvas"); c.width = c.height = 128; var x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, 128, 128);
    for (var r = 0; r < 128; r += 8) { x.fillStyle = "rgba(0,0,0," + (0.10 + Math.random() * 0.06) + ")"; x.fillRect(0, r, 128, 3); }
    for (var n = 0; n < 900; n++) { x.fillStyle = "rgba(0,0,0," + Math.random() * 0.06 + ")"; x.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); }
    var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
  })();
  var pMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95, map: rows });
  var pMesh = new THREE.Mesh(pGeo, pMat); pMesh.receiveShadow = true; scene.add(pMesh);
  var bunds = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(lines, 3)),
    new THREE.LineBasicMaterial({ color: 0xE9E1C8, transparent: true, opacity: .55 }));
  scene.add(bunds);

  // ---------- river ----------
  var rPts = [], rIdx = [], steps = 140;
  for (i = 0; i <= steps; i++) {
    var x = -SIZE / 2 + SIZE * i / steps, z = river(x), w = 6.5 + Math.sin(i * .3) * .8;
    rPts.push(x, -0.05, z - w, x, -0.05, z + w);
    if (i < steps) { var n0 = i * 2; rIdx.push(n0, n0 + 1, n0 + 2, n0 + 1, n0 + 3, n0 + 2); }
  }
  var rGeo = new THREE.BufferGeometry(); rGeo.setAttribute("position", new THREE.Float32BufferAttribute(rPts, 3)); rGeo.setIndex(rIdx); rGeo.computeVertexNormals();
  var waterMat = new THREE.MeshStandardMaterial({ color: 0x5C8DB8, roughness: .12, metalness: .35 });
  scene.add(new THREE.Mesh(rGeo, waterMat));

  // ---------- trees (instanced) along bunds and the river ----------
  var TN = small ? 110 : 190, trunkG = new THREE.CylinderGeometry(.18, .25, 1.6, 5), crownG = new THREE.IcosahedronGeometry(1.15, 1);
  var trunks = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: C(0x6B4E33), roughness: 1 }), TN);
  var crowns = new THREE.InstancedMesh(crownG, new THREE.MeshStandardMaterial({ color: C(0x4F7A3A), roughness: .9, flatShading: true }), TN);
  trunks.castShadow = crowns.castShadow = true;
  var m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), sc = new THREE.Vector3(), pv = new THREE.Vector3(), tc = new THREE.Color();
  for (i = 0; i < TN; i++) {
    var tx, tz;
    if (i % 2 === 0) { tx = -SIZE / 2.6 + rnd() * SIZE / 1.3; tz = river(tx) + (rnd() < .5 ? -1 : 1) * (8 + rnd() * 5); }
    else { var g2 = grid[1 + Math.floor(rnd() * (COLS - 1))][Math.floor(rnd() * ROWS)]; tx = g2[0] + (rnd() - .5) * 2; tz = g2[1] + rnd() * CELL; }
    var s = .55 + rnd() * .55, y = noise(tx, tz);
    m4.compose(pv.set(tx, y + .8 * s, tz), qt, sc.set(s, s, s)); trunks.setMatrixAt(i, m4);
    m4.compose(pv.set(tx, y + 2.2 * s, tz), qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * 6), sc.set(s, s * 1.1, s)); crowns.setMatrixAt(i, m4);
    crowns.setColorAt(i, tc.setHSL(.25 + rnd() * .06, .42 + rnd() * .15, .24 + rnd() * .08).convertSRGBToLinear()); qt.identity();
  }
  scene.add(trunks); scene.add(crowns);

  // ---------- a village: houses with warm windows at night ----------
  var HN = small ? 40 : 70, house = new THREE.BoxGeometry(3, 2.2, 3.6), roof = new THREE.ConeGeometry(2.7, 1.4, 4);
  var houses = new THREE.InstancedMesh(house, new THREE.MeshStandardMaterial({ color: C(0xE8DCC6), roughness: .9, emissive: C(0xFFB45A), emissiveIntensity: 0 }), HN);
  var roofs = new THREE.InstancedMesh(roof, new THREE.MeshStandardMaterial({ color: C(0xA4553A), roughness: .8, flatShading: true }), HN);
  houses.castShadow = roofs.castShadow = true; houses.receiveShadow = true;
  var vx = 70, vz = -60;
  for (i = 0; i < HN; i++) {
    var hx = vx + (rnd() - .5) * 44, hz = vz + (rnd() - .5) * 34, hy = noise(hx, hz), rot = Math.floor(rnd() * 4) * Math.PI / 2 + (rnd() - .5) * .2;
    m4.compose(pv.set(hx, hy + 1.1, hz), qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), sc.set(1, 1, 1)); houses.setMatrixAt(i, m4);
    m4.compose(pv.set(hx, hy + 2.9, hz), qt.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot + Math.PI / 4), sc.set(1, 1, 1.2)); roofs.setMatrixAt(i, m4);
  }
  qt.identity(); scene.add(houses); scene.add(roofs);
  // remove parcels under the village
  // (cheap: lower them below ground so the village sits on earth)
  parcels = parcels.filter(function (p) {
    if (Math.abs(p.cx - vx) < 26 && Math.abs(p.cz - vz) < 20) { for (var k = 0; k < 4; k++) pGeo.attributes.position.setY(p.base + k, -5); return false; }
    return true;
  });
  pGeo.attributes.position.needsUpdate = true;

  // ---------- road ----------
  var road = new THREE.Mesh(new THREE.PlaneGeometry(5, SIZE), new THREE.MeshStandardMaterial({ color: C(0x8C8577), roughness: 1 }));
  road.rotation.x = -Math.PI / 2; road.rotation.z = 0.32; road.position.set(vx - 32, 0.05, 0); road.receiveShadow = true; scene.add(road);

  // ---------- lights & sky ----------
  var hemi = new THREE.HemisphereLight(0xDDE8FF, 0x4A5530, .55); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xFFF1DA, 2.2);
  sun.position.set(-120, 140, 60); sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 1536, small ? 1024 : 1536);
  var sc2 = sun.shadow.camera; sc2.left = -200; sc2.right = 200; sc2.top = 200; sc2.bottom = -200; sc2.near = 10; sc2.far = 500; sun.shadow.bias = -0.0005;
  scene.add(sun);

  // ---------- registration highlight ----------
  var hl = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0x7C9CFF, transparent: true, opacity: 0, linewidth: 2 }));
  var fill = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0x7C9CFF, transparent: true, opacity: 0, depthWrite: false }));
  var pin = new THREE.Group();
  var stick = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 8, 6), new THREE.MeshBasicMaterial({ color: 0x3B5BDB }));
  stick.position.y = 4; pin.add(stick);
  var head = new THREE.Mesh(new THREE.SphereGeometry(.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0x7C4DFF })); head.position.y = 8.4; pin.add(head);
  pin.visible = false; scene.add(hl); scene.add(fill); scene.add(pin);
  var label = small ? null : document.getElementById("hero3d-label");
  var active = null, t0 = 0, done = [];

  function pick() {
    var cand = parcels.filter(function (p) { var v = new THREE.Vector3(p.cx, 0, p.cz).project(cam); return Math.abs(v.x) > .64 && Math.abs(v.x) < .9 && v.y > -.75 && v.y < .55 && v.z < 1; });
    if (!cand.length) return;
    active = cand[Math.floor(Math.random() * cand.length)];
    var y = function (v) { return noise(v[0], v[1]) + .5; };
    hl.geometry.setFromPoints(active.pts.map(function (v) { return new THREE.Vector3(v[0], y(v), v[1]); }));
    var fp = []; [0, 1, 2, 0, 2, 3].forEach(function (k) { var v = active.pts[k]; fp.push(v[0], y(v) - .1, v[1]); });
    fill.geometry.dispose(); fill.geometry = new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(fp, 3));
    pin.position.set(active.cx, noise(active.cx, active.cz), active.cz); pin.visible = true; t0 = performance.now();
    if (label) label.querySelector("b").textContent = "Khasra " + active.kh;
  }
  function tint(p, amt) { // blend the parcel's vertex colours toward the accent
    var acc = C(isDark() ? 0x3F5BFF : 0x6F8FFF), c = p.color.clone().lerp(acc, amt), ca = pGeo.attributes.color;
    for (var k = 0; k < 4; k++) ca.setXYZ(p.base + k, c.r, c.g, c.b); ca.needsUpdate = true;
  }
  var tmpV = new THREE.Vector3();
  function updateHighlight(now) {
    if (!active) return;
    var k = (now - t0) / 1000; // seconds
    var up = Math.min(1, k / .6), out = k > 3.2 ? Math.max(0, 1 - (k - 3.2) / .8) : 1, e = 1 - Math.pow(1 - up, 3);
    hl.material.opacity = e * out; fill.material.opacity = .28 * e * out;
    pin.scale.set(1, Math.max(.001, e), 1); head.material.opacity = out;
    tint(active, .55 * e * out + (out < 1 ? .25 * (1 - out) : 0));
    if (label) {
      tmpV.set(active.cx, noise(active.cx, active.cz) + 9.5, active.cz).project(cam);
      var r = host.getBoundingClientRect();
      var lx = Math.max(120, Math.min(r.width - 120, (tmpV.x * .5 + .5) * r.width)), ly = Math.max(110, (-tmpV.y * .5 + .5) * r.height);
      label.style.transform = "translate(" + lx + "px," + ly + "px) translate(-50%,-110%)";
      label.style.opacity = String(e * out);
    }
    if (k > 4.2) { tint(active, .25); done.push(active); if (done.length > 14) tint(done.shift(), 0); active = null; pin.visible = false; if (label) label.style.opacity = "0"; }
  }

  // ---------- theme ----------
  function theme() {
    var d = isDark();
    var sky = C(d ? 0x070A14 : 0xE3EAF1);
    scene.background = sky; scene.fog = new THREE.FogExp2(sky, d ? 0.0042 : 0.0026);
    sun.color.set(d ? 0x9FB4FF : 0xFFF1DA); sun.intensity = d ? .35 : 2.6;
    hemi.color.set(d ? 0x223055 : 0xDDE8FF); hemi.groundColor.set(d ? 0x0B0F10 : 0x4A5530); hemi.intensity = d ? .45 : .55;
    houses.material.emissiveIntensity = d ? .55 : 0;
    waterMat.color.copy(C(d ? 0x1A2A4A : 0x4F86B8));
    bunds.material.color.copy(C(d ? 0x3A4A6A : 0xEDE6CF)); bunds.material.opacity = d ? .5 : .55;
    renderer.toneMappingExposure = d ? 1.25 : 1.08;
    hl.material.color.set(d ? 0x9DB4FF : 0x3B5BDB); fill.material.color.set(d ? 0x5B7BFF : 0x6F8FFF);
  }
  theme();
  document.addEventListener("themechange", theme);
  var mq = matchMedia("(prefers-color-scheme: dark)"); if (mq.addEventListener) mq.addEventListener("change", theme);

  // ---------- camera drift + pointer parallax ----------
  var px = 0, py = 0, tpx = 0, tpy = 0;
  addEventListener("pointermove", function (e) { tpx = e.clientX / innerWidth - .5; tpy = e.clientY / innerHeight - .5; }, { passive: true });
  function placeCam(t) {
    var a = -0.5 + Math.sin(t * 0.00004) * 0.25 + px * 0.10, r = small ? 150 : 135, h = small ? 190 : 150 - py * 12;
    cam.position.set(Math.sin(a) * r, h, Math.cos(a) * r - 10);
    cam.lookAt(px * 8, 0, -28);
  }
  function size() { var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
  size(); addEventListener("resize", size);

  var running = false, raf = 0, last = 0, nextPick = 900, prev = 0, slow = 0, tier = 0, frozen = false;
  function degrade() {
    tier++;
    if (tier === 1) { renderer.setPixelRatio(.75); renderer.shadowMap.enabled = false; sun.castShadow = false; size(); }
    else { frozen = true; stop(); renderer.render(scene, cam); } // slow device: keep a still image
  }
  function frame(now) {
    if (prev) { var dt = now - prev; slow = dt > 50 ? slow + 1 : Math.max(0, slow - 1); if (slow > 24) { slow = 0; degrade(); if (frozen) return; } }
    prev = now;
    px += (tpx - px) * .03; py += (tpy - py) * .03;
    placeCam(reduce ? 0 : now);
    if (!reduce) {
      if (!active && now - last > nextPick) { pick(); last = now; nextPick = 1400 + Math.random() * 900; }
      updateHighlight(now);
    }
    renderer.render(scene, cam);
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { if (running || reduce || frozen || document.hidden) return; running = true; prev = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }
  // first frame, then reveal
  frame(performance.now());
  host.classList.add("ready");
  document.documentElement.classList.add("hero3d-on");
  document.dispatchEvent(new CustomEvent("hero3d"));
  if (reduce) { document.addEventListener("themechange", function () { frame(0); }); addEventListener("resize", function () { size(); frame(0); }); }
  else {
    start();
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { es[0].isIntersecting ? start() : stop(); }).observe(host);
  }
  renderer.domElement.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); host.classList.remove("ready"); document.documentElement.classList.remove("hero3d-on"); });
  }
})();
