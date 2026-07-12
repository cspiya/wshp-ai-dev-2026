/* Page-local progressive enhancement. The shared site shell replaces this file at integration. */
(function () {
  "use strict";

  var search = document.querySelector("#term-search");
  var family = document.querySelector("#family-filter");
  var clear = document.querySelector("#clear-filters");
  var cards = Array.prototype.slice.call(document.querySelectorAll(".term-card"));
  var result = document.querySelector("#result-count");
  var empty = document.querySelector("#empty-state");

  if (!search || !family || !clear || !result || !empty) return;

  function normalize(value) {
    return value.toLocaleLowerCase("hu-HU").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function update() {
    var needle = normalize(search.value.trim());
    var selectedFamily = family.value;
    var visible = 0;

    cards.forEach(function (card) {
      var matchesText = !needle || normalize(card.getAttribute("data-search") || card.textContent).indexOf(needle) !== -1;
      var matchesFamily = !selectedFamily || card.getAttribute("data-family") === selectedFamily;
      var show = matchesText && matchesFamily;
      card.hidden = !show;
      if (show) visible += 1;
    });

    result.textContent = visible + " fogalom látható a(z) " + cards.length + " bejegyzésből.";
    empty.hidden = visible !== 0;
  }

  search.addEventListener("input", update);
  family.addEventListener("change", update);
  clear.addEventListener("click", function () {
    search.value = "";
    family.value = "";
    update();
    search.focus();
  });
  update();
}());
