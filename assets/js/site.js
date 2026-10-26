(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.__reduce = reduce;

  /* ---------- Toast ---------- */
  var toastT;
  window.toast = function (msg) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(toastT);
    toastT = setTimeout(function () { t.hidden = true; }, 1800);
  };
  window.copyText = function (text, msg) {
    try { navigator.clipboard.writeText(text).then(function () { toast(msg || "Copied"); }, function () { toast(text); }); }
    catch (e) { toast(text); }
  };

  /* ---------- Theme ---------- */
  function currentTheme() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  window.toggleTheme = function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange"));
    return next;
  };
  var tbtn = document.getElementById("theme-toggle");
  if (tbtn) tbtn.addEventListener("click", function () { toggleTheme(); });

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll(".copy-email").forEach(function (b) {
    b.addEventListener("click", function () { copyText(b.dataset.email, "Email copied"); });
  });
  document.querySelectorAll(".copy-link").forEach(function (b) {
    b.addEventListener("click", function () { copyText(b.dataset.url, "Link copied"); });
  });

  /* ---------- Scroll progress ---------- */
  var bar = document.querySelector(".progress");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", h > 0 ? Math.min(1, scrollY / h) : 0);
    };
    addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  /* ---------- Command palette (Ctrl/Cmd + K) ---------- */
  var S = window.SITE || { posts: [], email: "" };
  var go = function (u) { return function () { location.href = u; }; };
  var CMDS = [
    { g: "Go to", t: "Home", k: "home start", run: go("/") },
    { g: "Go to", t: "The Next Ten Registries", k: "scorecard registration states", run: go("/registries/") },
    { g: "Go to", t: "Sub-Registrar Performance Scorecard", k: "sro prototype dashboard", run: go("/sro-scorecard/") },
    { g: "Go to", t: "CM Helpline escalation demo", k: "grievance 1076 helpline l1 l4", run: go("/#helpline") },
    { g: "Go to", t: "Cool Roof policy demo", k: "heat housing environment roof sri", run: go("/#coolroof") },
    { g: "Go to", t: "Evidence locker", k: "proof work documents", run: go("/#evidence") },
    { g: "Go to", t: "Terminal", k: "cli shell console", run: go("/#terminal") },
    { g: "Go to", t: "All posts", k: "blog news analysis notes", run: go("/posts/") },
    { g: "Go to", t: "Work", k: "projects portfolio", run: go("/work/") },
    { g: "Go to", t: "About", k: "bio profile", run: go("/about/") },
    { g: "Do", t: "Copy email address", k: "contact mail", run: function () { copyText(S.email, "Email copied"); } },
    { g: "Do", t: "Download CV (PDF)", k: "resume cv", run: go("/files/Ayush_Dewangan_CV.pdf") },
    { g: "Do", t: "Open LinkedIn", k: "social linkedin", run: function () { window.open("https://www.linkedin.com/in/ayush-dewangann/", "_blank", "noopener"); } },
    { g: "Do", t: "Switch light / dark theme", k: "dark light mode theme", run: function () { toast("Theme: " + toggleTheme()); } },
    { g: "Do", t: "Subscribe via RSS", k: "feed rss", run: go("/feed.xml") }
  ];
  (S.posts || []).forEach(function (p) { CMDS.push({ g: "Posts", t: p.t, k: "post", run: go(p.u) }); });

  var box, input, list, items = [], sel = 0, lastFocus;
  function build() {
    box = document.createElement("div"); box.className = "kbar"; box.hidden = true;
    box.innerHTML = '<div class="kbar-box" role="dialog" aria-modal="true" aria-label="Command menu">' +
      '<input id="kbar-q" type="text" placeholder="Type a command or search…" autocomplete="off" spellcheck="false" aria-controls="kbar-list">' +
      '<ul class="kbar-list" id="kbar-list" role="listbox"></ul>' +
      '<div class="kbar-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> move</span><span><span class="kbd">Enter</span> open</span><span><span class="kbd">Esc</span> close</span></div></div>';
    document.body.appendChild(box);
    input = box.querySelector("input"); list = box.querySelector("ul");
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    input.addEventListener("input", render);
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); if (items[sel]) { var c = items[sel]; close(); c.run(); } }
      else if (e.key === "Escape") { close(); }
    });
  }
  function score(c, q) {
    if (!q) return 1;
    var hay = (c.t + " " + c.k + " " + c.g).toLowerCase(), i = 0, j = 0;
    if (hay.indexOf(q) > -1) return 2;
    while (i < hay.length && j < q.length) { if (hay[i] === q[j]) j++; i++; }
    return j === q.length ? 1 : 0;
  }
  function render() {
    var q = input.value.trim().toLowerCase();
    items = CMDS.filter(function (c) { return score(c, q) > 0; }).sort(function (a, b) { return score(b, q) - score(a, q); });
    sel = 0; var html = "", g = null;
    items.forEach(function (c, i) {
      if (c.g !== g) { g = c.g; html += '<li class="grp" role="presentation">' + g + "</li>"; }
      html += '<li role="option" data-i="' + i + '" aria-selected="' + (i === 0) + '"><span>' + c.t.replace(/</g, "&lt;") + "</span><small>" + (c.g === "Posts" ? "Post" : "") + "</small></li>";
    });
    list.innerHTML = html || '<li class="grp">No match</li>';
    list.querySelectorAll("li[data-i]").forEach(function (li) {
      li.addEventListener("mousemove", function () { setSel(+li.dataset.i); });
      li.addEventListener("click", function () { var c = items[+li.dataset.i]; close(); c.run(); });
    });
  }
  function setSel(i) {
    sel = i; list.querySelectorAll("li[data-i]").forEach(function (li) { li.setAttribute("aria-selected", String(+li.dataset.i === sel)); });
    var cur = list.querySelector('li[data-i="' + sel + '"]'); if (cur) cur.scrollIntoView({ block: "nearest" });
  }
  function move(d) { if (items.length) setSel((sel + d + items.length) % items.length); }
  function open() { if (!box) build(); lastFocus = document.activeElement; box.hidden = false; input.value = ""; render(); input.focus(); }
  function close() { if (box) box.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  window.openPalette = open;
  addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); box && !box.hidden ? close() : open(); }
    else if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName) && !document.activeElement.isContentEditable) { e.preventDefault(); open(); }
  });
  var kb = document.getElementById("kbar-open");
  if (kb) {
    if (/Mac|iPhone|iPad/.test(navigator.platform || "")) kb.querySelector("kbd").textContent = "⌘K";
    kb.addEventListener("click", open);
  }

  /* ---------- Post filters (Posts page) ---------- */
  var filters = document.querySelectorAll(".filters button");
  if (filters.length) {
    var rows = document.querySelectorAll(".post-row");
    var years = document.querySelectorAll("[data-year]");
    var none = document.getElementById("no-match");
    var apply = function (key) {
      filters.forEach(function (f) { f.setAttribute("aria-pressed", String(f.dataset.filter === key)); });
      var shown = 0;
      rows.forEach(function (r) { var on = key === "all" || r.dataset.cat === key; r.hidden = !on; if (on) shown++; });
      years.forEach(function (y) { y.hidden = !y.querySelector(".post-row:not([hidden])"); });
      if (none) none.hidden = shown > 0;
    };
    filters.forEach(function (f) {
      f.addEventListener("click", function () {
        apply(f.dataset.filter);
        try { history.replaceState(null, "", f.dataset.filter === "all" ? location.pathname : "#" + f.dataset.filter); } catch (e) {}
      });
    });
    var h = (location.hash || "").slice(1);
    if (h && document.querySelector('.filters button[data-filter="' + h + '"]')) apply(h);
  }
})();
