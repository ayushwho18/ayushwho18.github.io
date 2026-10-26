/* Work section: five animated charts that play once when scrolled into view (GSAP), plus the fellowship tenure bar.
   Without GSAP or with reduced motion, every chart renders in its final state. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = !reduce && window.gsap && window.ScrollTrigger ? window.gsap : null;
  if (G) { G.registerPlugin(ScrollTrigger); G.ticker.lagSmoothing(0); } // time-accurate: charts finish on time even if frames are slow
  var NS = "http://www.w3.org/2000/svg";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var PAINT = { fill: 1, stroke: 1, "stop-color": 1 };
  function el(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) { if (PAINT[k] && /var\(/.test(attrs[k])) e.style.setProperty(k, attrs[k]); else e.setAttribute(k, attrs[k]); }
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svg(fig, w, h) { var s = el("svg", { viewBox: "0 0 " + w + " " + h, class: "wchart", role: "presentation" }); fig.insertBefore(s, fig.firstChild); return s; }
  function whenSeen(trigger, build) {
    if (!G) { build(null); return; }
    var tl = G.timeline({ paused: true });
    build(tl);
    ScrollTrigger.create({ trigger: trigger, start: "top 72%", once: true, onEnter: function () { tl.play(); } });
  }
  function count(tl, node, to, dec, pre, suf, at, dur) {
    var o = { v: 0 }; node.textContent = pre + (0).toFixed(dec) + suf;
    tl.to(o, { v: to, duration: dur || 1.1, ease: "power2.out", onUpdate: function () { node.textContent = pre + o.v.toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suf; } }, at);
  }
  function drawLine(tl, path, at, dur) {
    var L = path.getTotalLength ? path.getTotalLength() : 200;
    path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
    tl.to(path, { strokeDashoffset: 0, duration: dur || .8, ease: "power2.inOut" }, at);
  }

  /* ---------- tenure ---------- */
  (function () {
    var fill = $("#tenure-fill"), txt = $("#tenure-txt"), now = $("#tenure-now"); if (!fill) return;
    var p = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric", month: "numeric" }).formatToParts(new Date());
    var y = +p.find(function (x) { return x.type === "year"; }).value, m = +p.find(function (x) { return x.type === "month"; }).value;
    var TOTAL = 20, cur = (y - 2025) * 12 + (m - 8) + 1, frac = Math.max(0, Math.min(1, cur / TOTAL));
    txt.textContent = cur > TOTAL ? "Completed" : "Month " + Math.max(1, cur) + " of " + TOTAL + " (tentative)";
    now.style.left = (frac * 100) + "%";
    if (frac > .86 || frac < .14) now.style.display = "none";
    if (!G) { fill.style.width = (frac * 100) + "%"; return; }
    G.fromTo(fill, { width: "0%" }, { width: (frac * 100) + "%", duration: 1.6, ease: "power3.out", scrollTrigger: { trigger: fill, start: "top 85%", once: true } });
  })();

  /* ---------- 01 reforms: 10 states -> 30 reforms -> 2 directed ---------- */
  (function () {
    var fig = $("#chart-reforms"); if (!fig) return;
    var s = svg(fig, 560, 340);
    var states = ["KA", "TS", "MH", "GJ", "", "", "", "", "", ""], sN = [];
    el("text", { x: 34, y: 22, class: "wc-lab", "text-anchor": "middle" }, s, "10 states");
    states.forEach(function (c, i) {
      var g = el("g", { class: "wc-pop" }, s), yy = 46 + i * 28;
      el("circle", { cx: 34, cy: yy, r: 11, fill: c ? "var(--teal)" : "var(--rule-2)" }, g);
      if (c) el("text", { x: 34, y: yy + 3.5, class: "wc-tiny inv", "text-anchor": "middle" }, g, c);
      sN.push({ g: g, y: yy });
    });
    var flows = sN.map(function (n) { return el("path", { d: "M46," + n.y + " C96," + n.y + " 104,170 150,170", fill: "none", stroke: "var(--rule-2)", "stroke-width": 1.2 }, s); });
    // 30 reforms grid
    var cells = [], X0 = 160, Y0 = 54, S = 26, GAP = 8;
    for (var i = 0; i < 30; i++) {
      var c = i % 6, r = Math.floor(i / 6), policy = i < 13;
      var rect = el("rect", { x: X0 + c * (S + GAP), y: Y0 + r * (S + GAP), width: S, height: S, rx: 7, fill: policy ? "var(--stamp)" : "var(--teal)", class: "wc-cell" }, s);
      cells.push(rect);
    }
    el("text", { x: X0, y: 34, class: "wc-lab" }, s, "30 reforms catalogued");
    var lgY = Y0 + 5 * (S + GAP) + 18;
    var l1 = el("text", { x: X0, y: lgY, class: "wc-sm" }, s); el("tspan", { class: "dot-p" }, l1, "■ "); var n13 = el("tspan", {}, l1, "13"); el("tspan", {}, l1, " policy");
    var l2 = el("text", { x: X0 + 96, y: lgY, class: "wc-sm" }, s); el("tspan", { class: "dot-t" }, l2, "■ "); var n17 = el("tspan", {}, l2, "17"); el("tspan", {}, l2, " technical");
    // the two directed: one policy (counters), one technical (SRO analytics)
    var picks = [{ i: 4, t: "Counters for women and", t2: "senior citizens" }, { i: 21, t: "Sub-Registrar performance", t2: "analytics" }];
    var cards = [], links = [];
    el("text", { x: 388, y: 34, class: "wc-lab" }, s, "Directed by the Secretary");
    picks.forEach(function (p, k) {
      var cell = cells[p.i], cx = +cell.getAttribute("x") + S / 2, cy = +cell.getAttribute("y") + S / 2, cyCard = 82 + k * 92, CX = 388;
      links.push(el("path", { d: "M" + (cx + S / 2) + "," + cy + " C" + (cx + 50) + "," + cy + " " + (CX - 30) + "," + (cyCard + 22) + " " + CX + "," + (cyCard + 22), fill: "none", stroke: "var(--teal)", "stroke-width": 2 }, s));
      var g = el("g", { class: "wc-card" }, s);
      el("rect", { x: CX, y: cyCard, width: 166, height: 64, rx: 12, fill: "var(--surface)", stroke: "var(--teal)", "stroke-width": 1.5 }, g);
      el("text", { x: CX + 12, y: cyCard + 27, class: "wc-sm b" }, g, p.t);
      el("text", { x: CX + 12, y: cyCard + 45, class: "wc-sm b" }, g, p.t2);
      cards.push(g);
    });
    var big = el("text", { x: 388, y: 300, class: "wc-big" }, s, "2"); el("text", { x: 414, y: 289, class: "wc-sm" }, s, "of 30 directed"); el("text", { x: 414, y: 305, class: "wc-sm" }, s, "for implementation");
    whenSeen(fig, function (tl) {
      if (!tl) return;
      tl.from(sN.map(function (n) { return n.g; }), { opacity: 0, scale: .3, transformOrigin: "50% 50%", duration: .35, stagger: .05, ease: "back.out(2)" });
      flows.forEach(function (f, i) { drawLine(tl, f, .25 + i * .03, .6); });
      tl.from(cells, { opacity: 0, scale: .2, transformOrigin: "50% 50%", duration: .35, stagger: .025, ease: "back.out(2)" }, .7);
      count(tl, n13, 13, 0, "", "", 1.1, .8); count(tl, n17, 17, 0, "", "", 1.1, .8);
      tl.to(cells.filter(function (c, i) { return i !== 4 && i !== 21; }), { opacity: .28, duration: .5 }, 2.0);
      tl.to([cells[4], cells[21]], { scale: 1.18, transformOrigin: "50% 50%", duration: .4, ease: "back.out(3)" }, 2.0);
      links.forEach(function (l, i) { drawLine(tl, l, 2.3 + i * .15, .7); });
      tl.from(cards, { opacity: 0, x: 18, duration: .5, stagger: .15, ease: "power3.out" }, 2.6);
      tl.from(big, { opacity: 0, y: 10, duration: .4 }, 3.0);
    });
  })();

  /* ---------- 02 office race (synthetic) ---------- */
  (function () {
    var track = $("#race"), btn = $("#race-go"), out = $("#race-out"); if (!track) return;
    var MAX = 12, PROMISE = 5, offices = "ABCDEFGHIJ".split(""), runId = 0;
    function times() { return offices.map(function () { var u = Math.random() || .5, v = Math.random(); var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); return Math.max(1.5, Math.min(MAX, Math.exp(1.3 + 0.45 * z))); }); }
    track.innerHTML = offices.map(function (o) { return '<div class="race-row"><span>Office ' + o + '</span><div class="lane"><i></i></div><b>—</b></div>'; }).join("") +
      '<div class="promise" style="left:calc(80px + (100% - 142px) * ' + (PROMISE / MAX) + ')"><span>State promise: ' + PROMISE + ' days</span></div>';
    function run() {
      var my = ++runId, ts = times(), rows = Array.prototype.slice.call(track.querySelectorAll(".race-row")), late = 0, sorted = ts.slice().sort(function (a, b) { return a - b; });
      rows.forEach(function (row, i) {
        var t = ts[i], isLate = t > PROMISE; if (isLate) late++;
        row.classList.toggle("late", isLate);
        var bar = row.querySelector("i"); bar.style.transition = "none"; bar.style.width = "0"; void bar.offsetWidth;
        bar.style.transition = reduce ? "none" : "width " + (0.5 + t / MAX * 1.8) + "s cubic-bezier(.2,.7,.2,1)";
        bar.style.width = (t / MAX * 100) + "%"; row.querySelector("b").textContent = t.toFixed(1) + "d";
      });
      var avg = ts.reduce(function (a, b) { return a + b; }, 0) / ts.length, med = (sorted[4] + sorted[5]) / 2;
      out.innerHTML = "";
      setTimeout(function () {
        if (my !== runId) return;
        out.innerHTML = "Average <b>" + avg.toFixed(1) + " days</b> looks fine. <span class='warn'>" + late + " of 10 offices miss the promise.</span>";
      }, reduce ? 0 : 1700);
    }
    btn.addEventListener("click", run);
    if (!G || !("IntersectionObserver" in window)) { run(); return; }
    ScrollTrigger.create({ trigger: track, start: "top 75%", once: true, onEnter: run });
  })();

  /* ---------- 03 DPR: 107 offices -> registry, then the sequence ---------- */
  (function () {
    var fig = $("#chart-dpr"); if (!fig) return;
    var s = svg(fig, 560, 340), HX = 160, HY = 172, rings = [[62, 24], [96, 36], [130, 47]], nodes = [], spokes = [];
    var spokeG = el("g", {}, s), nodeG = el("g", {}, s);
    rings.forEach(function (rg, ri) {
      for (var i = 0; i < rg[1]; i++) {
        var a = (i / rg[1]) * Math.PI * 2 + ri * .2, x = HX + Math.cos(a) * rg[0], y = HY + Math.sin(a) * rg[0];
        spokes.push(el("line", { x1: HX, y1: HY, x2: x, y2: y, stroke: "var(--teal)", "stroke-width": .6, opacity: .35 }, spokeG));
        nodes.push(el("circle", { cx: x, cy: y, r: 3.4, fill: "var(--teal)" }, nodeG));
      }
    });
    var hub = el("g", {}, s);
    el("circle", { cx: HX, cy: HY, r: 34, fill: "var(--ink)" }, hub);
    el("text", { x: HX, y: HY - 2, class: "wc-sm b inv", "text-anchor": "middle" }, hub, "State");
    el("text", { x: HX, y: HY + 13, class: "wc-sm b inv", "text-anchor": "middle" }, hub, "registry");
    var n107 = el("text", { x: HX, y: 330, class: "wc-sm", "text-anchor": "middle" }, s, "107 Sub-Registrar offices");
    var money = el("text", { x: 330, y: 58, class: "wc-big" }, s, "₹3.24 Cr");
    el("text", { x: 330, y: 80, class: "wc-sm" }, s, "programme in the DPR");
    var steps = ["Scan and clean records", "Link deed to land record", "Tamper-evident hashes", "Distributed ledger"], bars = [];
    steps.forEach(function (t, i) {
      var y = 118 + i * 52;
      el("text", { x: 330, y: y, class: "wc-sm b" }, s, (i + 1) + "  " + t);
      el("rect", { x: 330, y: y + 9, width: 210, height: 10, rx: 5, fill: "var(--sunk)" }, s);
      bars.push(el("rect", { x: 330, y: y + 9, width: 210, height: 10, rx: 5, fill: i === 3 ? "var(--stamp)" : "var(--teal)" }, s));
    });
    el("text", { x: 330, y: 330, class: "wc-tiny" }, s, "The sequencing principle, not the DPR's schedule.");
    whenSeen(fig, function (tl) {
      if (!tl) return;
      tl.from(hub, { scale: 0, transformOrigin: "50% 50%", duration: .6, ease: "back.out(2)" });
      tl.from(spokes, { opacity: 0, duration: .25, stagger: .006 }, .3);
      tl.from(nodes, { scale: 0, transformOrigin: "50% 50%", duration: .3, stagger: .006, ease: "back.out(3)" }, .3);
      tl.from(n107, { opacity: 0, duration: .4 }, .9);
      count(tl, money, 3.24, 2, "₹", " Cr", .8, 1.2);
      bars.forEach(function (b, i) { tl.from(b, { attr: { width: 0 }, duration: .55, ease: "power2.out" }, 1.4 + i * .45); });
    });
  })();

  /* ---------- 04 cool roof: who pays, and how much cooler ---------- */
  (function () {
    var fig = $("#chart-roof"); if (!fig) return;
    var s = svg(fig, 560, 340), W = 300, X = 150;
    function row(y, label, sub) { el("text", { x: 20, y: y + 4, class: "wc-sm b" }, s, label); if (sub) el("text", { x: 20, y: y + 20, class: "wc-tiny" }, s, sub); }
    el("text", { x: 20, y: 30, class: "wc-lab" }, s, "Who pays ₹2–4 per sq ft?");
    el("text", { x: X, y: 58, class: "wc-tiny" }, s, "State budget");
    el("text", { x: X + W / 2 + 10, y: 58, class: "wc-tiny" }, s, "Developer, once");
    row(88, "A subsidy", "the alternative");
    row(150, "My rule", "OC condition");
    var b1s = el("rect", { x: X, y: 76, width: W / 2, height: 24, rx: 6, fill: "var(--amber)" }, s);
    var t1s = el("text", { x: X + 8, y: 92, class: "wc-sm b inv" }, s, "₹2–4 / sq ft");
    el("rect", { x: X + W / 2 + 10, y: 76, width: W / 2, height: 24, rx: 6, fill: "var(--sunk)" }, s);
    el("text", { x: X + W / 2 + 18, y: 92, class: "wc-sm" }, s, "₹0");
    var b2s = el("rect", { x: X, y: 138, width: W / 2, height: 24, rx: 6, fill: "var(--sunk)" }, s);
    var t2s = el("text", { x: X + 8, y: 154, class: "wc-sm b" }, s, "₹0");
    var b2d = el("rect", { x: X + W / 2 + 10, y: 138, width: W / 2, height: 24, rx: 6, fill: "var(--teal)" }, s);
    el("text", { x: X + W / 2 + 18, y: 154, class: "wc-sm b inv" }, s, "₹2–4 / sq ft");
    // cooling band
    el("text", { x: 20, y: 222, class: "wc-lab" }, s, "Indoor air under a cool roof");
    var AX = 20, AW = 520, sc = function (v) { return AX + v / 5 * AW; };
    el("rect", { x: AX, y: 240, width: AW, height: 16, rx: 8, fill: "var(--sunk)" }, s);
    var band = el("rect", { x: sc(2.1), y: 240, width: sc(4.3) - sc(2.1), height: 16, rx: 8, fill: "var(--teal)" }, s);
    [0, 1, 2, 3, 4, 5].forEach(function (v) { el("text", { x: sc(v), y: 276, class: "wc-tiny", "text-anchor": "middle" }, s, v + " °C"); });
    var bt = el("text", { x: (sc(2.1) + sc(4.3)) / 2, y: 232, class: "wc-sm b", "text-anchor": "middle" }, s, "2.1–4.3 °C cooler");
    el("text", { x: 20, y: 318, class: "wc-tiny" }, s, "Range cited for Telangana's 2023 policy (NRDC). Pitched, not yet adopted.");
    whenSeen(fig, function (tl) {
      if (!tl) return;
      tl.from(b1s, { attr: { width: 0 }, duration: .7, ease: "power2.out" });
      tl.from(t1s, { opacity: 0, duration: .3 }, .5);
      tl.from(b2d, { attr: { width: 0 }, duration: .7, ease: "power2.out" }, .9);
      tl.from([b2s, t2s], { opacity: 0, duration: .4 }, 1.3);
      tl.from(band, { attr: { width: 0 }, duration: .9, ease: "power3.out" }, 1.7);
      tl.from(bt, { opacity: 0, y: 6, duration: .4 }, 2.3);
    });
  })();

  /* ---------- 05 CM Helpline: the ladder, and the scale ---------- */
  (function () {
    var fig = $("#chart-help"); if (!fig) return;
    var s = svg(fig, 560, 340), lv = [["L1", "Block"], ["L2", "District"], ["L3", "Division / Directorate"], ["L4", "Secretary / HoD"]], rungs = [];
    el("line", { x1: 40, y1: 40, x2: 40, y2: 300, stroke: "var(--rule-2)", "stroke-width": 2 }, s);
    lv.forEach(function (l, i) {
      var y = 290 - i * 78, g = el("g", {}, s);
      el("rect", { x: 60, y: y - 26, width: 190, height: 52, rx: 12, fill: "var(--surface)", stroke: "var(--rule)", "stroke-width": 1.4 }, g);
      el("text", { x: 76, y: y + 6, class: "wc-lv" }, g, l[0]);
      el("text", { x: 112, y: y + 5, class: "wc-sm b" }, g, l[1]);
      rungs.push({ g: g, y: y });
    });
    var tok = el("g", {}, s); el("circle", { cx: 0, cy: 0, r: 13, fill: "var(--teal)" }, tok); el("text", { x: 0, y: 4, class: "wc-tiny inv b", "text-anchor": "middle" }, tok, "1076");
    tok.setAttribute("transform", "translate(40," + rungs[0].y + ")");
    var stats = [[42, "", "departments on the helpline"], [1195, "", "complaint categories with deadlines"], [8000, "~", "officials working on it"]], nums = [];
    stats.forEach(function (st, i) {
      var y = 70 + i * 86;
      nums.push({ n: el("text", { x: 300, y: y, class: "wc-big" }, s, st[1] + st[0].toLocaleString("en-IN")), st: st });
      el("text", { x: 300, y: y + 22, class: "wc-sm" }, s, st[2]);
    });
    el("text", { x: 300, y: 318, class: "wc-tiny" }, s, "Launch figures, The Hitavada, 10 Jun 2026.");
    var mine = el("g", {}, s);
    el("rect", { x: 60, y: 6, width: 190, height: 22, rx: 11, fill: "var(--stamp-soft)" }, mine);
    el("text", { x: 155, y: 21, class: "wc-tiny b", "text-anchor": "middle", fill: "var(--stamp)" }, mine, "My map: 2 departments, L1–L4");
    whenSeen(fig, function (tl) {
      if (!tl) return;
      tl.from(rungs.map(function (r) { return r.g; }), { opacity: 0, x: -16, duration: .4, stagger: .12, ease: "power3.out" });
      nums.forEach(function (o, i) { count(tl, o.n, o.st[0], 0, o.st[1], "", .3 + i * .2, 1.2); });
      tl.from(mine, { opacity: 0, y: -6, duration: .4 }, .9);
      // token climbs, then keeps looping gently
      var climb = G.timeline({ repeat: -1, repeatDelay: 1.2, paused: true });
      rungs.forEach(function (r, i) { if (i) climb.to(tok, { attr: { transform: "translate(40," + r.y + ")" }, duration: .7, ease: "power2.inOut" }, "+=0.7"); });
      climb.to(tok, { opacity: 0, duration: .3 }, "+=0.8").set(tok, { attr: { transform: "translate(40," + rungs[0].y + ")" } }).to(tok, { opacity: 1, duration: .3 });
      var seen = false;
      tl.add(function () { seen = true; climb.play(); }, 1.0);
      ScrollTrigger.create({ trigger: fig, start: "top bottom", end: "bottom top", onLeave: function () { climb.pause(); }, onLeaveBack: function () { climb.pause(); }, onEnter: function () { if (seen) climb.play(); }, onEnterBack: function () { if (seen) climb.play(); } });
    });
  })();
})();
