(function () {
  var root = document.documentElement;

  // Theme toggle: light / dark, remembered per browser.
  var btn = document.getElementById("theme-toggle");
  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  if (btn) {
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      btn.setAttribute("aria-label", "Switch to " + (next === "dark" ? "light" : "dark") + " theme");
    });
  }

  // Copy helpers
  function copy(text, label, done) {
    function ok() { var o = label.textContent; label.textContent = done; setTimeout(function () { label.textContent = o; }, 1600); }
    try { navigator.clipboard.writeText(text).then(ok, function () { label.textContent = text; }); }
    catch (e) { label.textContent = text; }
  }
  document.querySelectorAll(".copy-email").forEach(function (b) {
    b.addEventListener("click", function () { copy(b.dataset.email, b.querySelector("small"), "Copied"); });
  });
  document.querySelectorAll(".copy-link").forEach(function (b) {
    b.addEventListener("click", function () { copy(b.dataset.url, b, "Link copied"); });
  });

  // Post filters (Posts page). Supports links like /posts/#news
  var filters = document.querySelectorAll(".filters button");
  if (filters.length) {
    var rows = document.querySelectorAll(".post-row");
    var years = document.querySelectorAll("[data-year]");
    var none = document.getElementById("no-match");
    function apply(key) {
      filters.forEach(function (f) { f.setAttribute("aria-pressed", String(f.dataset.filter === key)); });
      var shown = 0;
      rows.forEach(function (r) { var on = key === "all" || r.dataset.cat === key; r.hidden = !on; if (on) shown++; });
      years.forEach(function (y) { y.hidden = !y.querySelector(".post-row:not([hidden])"); });
      if (none) none.hidden = shown > 0;
    }
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
