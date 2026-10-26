/* Hindi / English toggle. Dictionary is keyed by the English HTML of each text block, so any block without a
   translation simply stays in English; nothing can break when copy changes. Choice is remembered per visitor. */
(function () {
  "use strict";
  var SEL = "main :is(h1,h2,h3,h4,p,dt,dd,summary,label,figcaption,.kicker,.seg-b,.chip,.btn2,.demo-link,.state,.dept-tag,li>b,li>span,.plist span,.plist b,.note,.src,.fine-cap,.pdr dt,.d3-tools button,.cr-toggle button,.more), .site-header .nv, .site-header .nav-cta, .site-header .menu-btn, .site-footer p, .site-footer a";
  var root = document.documentElement, btn = document.getElementById("lang-toggle"), dict = null, saved = [], on = false;
  function norm(h) { return h.replace(/\s+/g, " ").trim(); }
  function load() { return dict ? Promise.resolve(dict) : fetch("/assets/i18n/hi.json").then(function (r) { return r.json(); }).then(function (d) { dict = d; return d; }); }
  function apply(hi) {
    if (hi) {
      saved = [];
      document.querySelectorAll(SEL).forEach(function (el) {
        if (el.closest("[data-no-i18n]") || el.classList.contains("hero2-line") || el.querySelector(SEL.split(",")[0].replace("main ", ""))) return;
        var k = norm(el.innerHTML), t = dict[k];
        if (t) { saved.push([el, el.innerHTML]); el.innerHTML = t; }
      });
      var line = document.querySelector(".hero2-line"); if (line && dict.__hero_line) { saved.push([line, line.innerHTML]); line.innerHTML = dict.__hero_line; }
      window.__swapWords = dict.__swap || null;
      root.lang = "hi"; root.classList.add("lang-hi");
    } else {
      for (var i = saved.length - 1; i >= 0; i--) saved[i][0].innerHTML = saved[i][1]; saved = []; // reverse: innermost/last change undone first
      window.__swapWords = null; root.lang = "en-IN"; root.classList.remove("lang-hi");
    }
    on = hi; if (btn) { btn.setAttribute("aria-pressed", hi); btn.textContent = hi ? "EN" : "हिं"; btn.setAttribute("aria-label", hi ? "Switch to English" : "हिन्दी में देखें"); }
    document.dispatchEvent(new CustomEvent("langchange", { detail: { hi: hi } }));
  }
  function set(hi) {
    if (hi === on) return; try { localStorage.setItem("lang", hi ? "hi" : "en"); } catch (e) {} if (!hi) return apply(false); load().then(function () { apply(true); }).catch(function () {}); }
  if (btn) btn.addEventListener("click", function () { set(!on); });
  window.setLang = set;
  var pref = null; try { pref = localStorage.getItem("lang"); } catch (e) {}
  if (pref === "hi" || /[?&]lang=hi/.test(location.search)) set(true);
})();
