// Shared site shell behavior. Classic script, loaded with defer.
// Consumes window.WorkshopSearchIndex (generated assets/search-index.js).
// Progressive enhancement only: without JS the static navigation is the
// full experience; the search form stays hidden. No fetch/XHR/worker/
// module/eval — works from file:// with zero network requests.
// Copy-to-clipboard on every command/prompt block. Progressive enhancement:
// without JS the block stays plain selectable text. navigator.clipboard needs
// a secure context (https/localhost); from file:// the selection+execCommand
// fallback keeps the button working offline.
(function () {
  "use strict";
  var blocks = document.querySelectorAll("main pre");
  if (!blocks.length) return;

  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, done) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        function () { done(true); },
        function () { done(fallbackCopy(text)); }
      );
    } else {
      done(fallbackCopy(text));
    }
  }

  for (var i = 0; i < blocks.length; i++) {
    (function (pre) {
      // Blocks marked as non-executable examples must not invite copying.
      if (pre.closest && pre.closest("section.example")) return;
      // Horizontal-scroll wrappers (e.g. .code-scroll) rely on child
      // selectors and clip overlays; anchor the bar before the wrapper.
      var anchor = pre;
      var parent = pre.parentElement;
      if (parent && /(^|\s)(code-scroll|scroll-surface)(\s|$)/.test(parent.className)) {
        anchor = parent;
      }
      var bar = document.createElement("div");
      bar.className = "copy-bar";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "📋 Másolás";
      btn.setAttribute("aria-label", "A blokk tartalmának másolása a vágólapra");
      btn.addEventListener("click", function () {
        copyText(pre.textContent.replace(/\s+$/, ""), function (ok) {
          btn.textContent = ok ? "✅ Másolva" : "Nem sikerült — jelöld ki kézzel";
          window.setTimeout(function () {
            btn.textContent = "📋 Másolás";
          }, 2000);
        });
      });
      bar.appendChild(btn);
      anchor.parentNode.insertBefore(bar, anchor);
    })(blocks[i]);
  }
})();

(function () {
  "use strict";

  // Sidebar ships expanded (full experience without JS); on narrow
  // viewports collapse it so content stays first.
  var sidebar = document.querySelector(".sidebar-toggle");
  if (sidebar && window.matchMedia && window.matchMedia("(max-width: 63.99rem)").matches) {
    sidebar.open = false;
  }

  var form = document.querySelector(".site-search");
  var input = document.getElementById("site-search-input");
  var results = document.getElementById("site-search-results");
  var index = window.WorkshopSearchIndex;
  if (!form || !input || !results || !index || !index.pages) return;

  var siteRoot = document.body.getAttribute("data-site-root") || "";
  form.hidden = false;

  var HUN = { "á": "a", "é": "e", "í": "i", "ó": "o", "ö": "o", "ő": "o", "ú": "u", "ü": "u", "ű": "u" };
  function norm(s) {
    return s.toLowerCase().replace(/[áéíóöőúüű]/g, function (c) { return HUN[c]; });
  }

  // Precompute a flat searchable list: page titles + section headings.
  var entries = [];
  for (var i = 0; i < index.pages.length; i++) {
    var page = index.pages[i];
    entries.push({ label: page.title, page: page.title, href: siteRoot + page.path, key: norm(page.title) });
    for (var j = 0; j < page.headings.length; j++) {
      var h = page.headings[j];
      entries.push({
        label: h.t,
        page: page.title,
        href: siteRoot + page.path + "#" + h.a,
        key: norm(h.t) + " " + norm(page.title)
      });
    }
  }
  // Glossary terms live ONLY on the canonical glossary route: the preferred
  // Hungarian term, the retained English term and every alias resolve to
  // that single page with the term slug as the exact anchor.
  if (index.glossary && index.glossary.terms) {
    for (var g = 0; g < index.glossary.terms.length; g++) {
      var term = index.glossary.terms[g];
      var names = [term.preferred, term.english].concat(term.aliases || []);
      var key = "";
      for (var n = 0; n < names.length; n++) {
        if (names[n]) key += norm(names[n]) + " ";
      }
      entries.push({
        label: term.preferred + (term.english && term.english !== term.preferred ? " (" + term.english + ")" : ""),
        page: "Fogalomtár",
        href: siteRoot + index.glossary.path + "#" + term.slug,
        key: key
      });
    }
  }

  function render(list) {
    while (results.firstChild) results.removeChild(results.firstChild);
    if (list.length === 0) {
      results.hidden = true;
      return;
    }
    for (var i = 0; i < list.length && i < 12; i++) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = list[i].href;
      a.textContent = list[i].label;
      var small = document.createElement("small");
      small.textContent = " — " + list[i].page;
      li.appendChild(a);
      li.appendChild(small);
      results.appendChild(li);
    }
    results.hidden = false;
  }

  input.addEventListener("input", function () {
    var q = norm(input.value.trim());
    if (q.length < 2) {
      render([]);
      return;
    }
    var hits = [];
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].key.indexOf(q) !== -1) hits.push(entries[i]);
    }
    render(hits);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var first = results.querySelector("a");
    if (first) first.click();
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      input.value = "";
      render([]);
    }
  });
})();
