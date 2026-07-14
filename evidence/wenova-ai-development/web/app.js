(function () {
  "use strict";

  var data = window.WENOVA_EVIDENCE;
  if (!data) {
    document.body.innerHTML = "<main><p>A mérési adatcsomag nem tölthető be.</p></main>";
    return;
  }

  var number = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 1 });
  var integer = new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 });
  var percent = new Intl.NumberFormat("hu-HU", { style: "percent", maximumFractionDigits: 0 });
  var fmt = function (value, fallback) {
    return value === null || value === undefined ? (fallback || "n/a") : number.format(value);
  };
  var fmtInt = function (value) {
    return value === null || value === undefined ? "n/a" : integer.format(value);
  };
  var compact = function (value) {
    if (value === null || value === undefined) return "n/a";
    if (Math.abs(value) >= 1000000000) return number.format(value / 1000000000) + " mrd";
    if (Math.abs(value) >= 1000000) return number.format(value / 1000000) + " M";
    if (Math.abs(value) >= 1000) return number.format(value / 1000) + " k";
    return number.format(value);
  };
  var escapeHtml = function (value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  function setKpis() {
    var k = data.kpis;
    var items = [
      [fmtInt(k.completed_issues), "lezárt Linear-issue"],
      [fmtInt(k.integration_commits), "integration-ref commit"],
      [compact(k.total_tokens), "mért token, cache-sel"],
      [fmtInt(k.gate_runs), "strukturált gate · " + percent.format(k.gate_pass_rate || 0) + " pass"]
    ];
    document.getElementById("kpis").innerHTML = items.map(function (item) {
      return '<div class="kpi"><strong class="kpi-value">' + escapeHtml(item[0]) +
        '</strong><span class="kpi-label">' + escapeHtml(item[1]) + '</span></div>';
    }).join("");

    var governed = data.phases.find(function (phase) { return phase.id === "governed"; });
    var baseline = data.phases.find(function (phase) { return phase.id === "baseline"; });
    var cycleDirection = "nem teljesen összevethető";
    if (governed.cycle_median_hours !== null && baseline.cycle_median_hours !== null) {
      cycleDirection = governed.cycle_median_hours < baseline.cycle_median_hours ? "rövidebb" : "hosszabb";
    }
    document.getElementById("hero-answer").innerHTML =
      "<strong>Rövid válasz:</strong> a folyamat láthatóan jobban kontrollált, a lezárások sűrűbbek és a review korábban jelenik meg. " +
      "A medián ciklusidő " + escapeHtml(cycleDirection) +
      ", de a rövid és eltérő fázisok miatt ez még <strong>nem okozati bizonyíték</strong>.";
  }

  function setCoverage() {
    document.getElementById("coverage").innerHTML = data.source_inventory.map(function (row) {
      return '<article class="coverage-row"><strong>' + escapeHtml(row.source) +
        '</strong><span>' + escapeHtml(row.records) + " rekord<br>" + escapeHtml(row.coverage) +
        '</span><p><b>Kapcsolás:</b> ' + escapeHtml(row.join_key) +
        '<br><b>Hiány:</b> ' + escapeHtml(row.missingness) + "</p></article>";
    }).join("");
  }

  function svgNode(tag, attributes, text) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes || {}).forEach(function (entry) {
      node.setAttribute(entry[0], entry[1]);
    });
    if (text) node.textContent = text;
    return node;
  }

  function renderDailyChart() {
    var svg = document.getElementById("daily-chart");
    var rows = data.daily;
    var width = 1080;
    var height = 340;
    var margin = { top: 34, right: 28, bottom: 58, left: 42 };
    var innerWidth = width - margin.left - margin.right;
    var innerHeight = height - margin.top - margin.bottom;
    var maxValue = Math.max.apply(null, [1].concat(rows.map(function (row) {
      return Math.max(row.issues_completed, row.commits);
    })));
    var x = function (index) {
      return margin.left + (rows.length <= 1 ? innerWidth / 2 : (index / (rows.length - 1)) * innerWidth);
    };
    var y = function (value) {
      return margin.top + innerHeight - (value / maxValue) * innerHeight;
    };
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.replaceChildren();

    [0, 0.25, 0.5, 0.75, 1].forEach(function (ratio) {
      var lineY = margin.top + innerHeight - ratio * innerHeight;
      svg.appendChild(svgNode("line", {
        x1: margin.left, y1: lineY, x2: width - margin.right, y2: lineY, "class": "grid-line"
      }));
      svg.appendChild(svgNode("text", {
        x: margin.left - 8, y: lineY + 4, "text-anchor": "end", "class": "axis-label"
      }, fmtInt(maxValue * ratio)));
    });
    data.phases.forEach(function (phase) {
      var phaseIndex = rows.findIndex(function (row) { return row.day === phase.start; });
      if (phaseIndex < 0) return;
      var phaseX = x(phaseIndex);
      svg.appendChild(svgNode("line", {
        x1: phaseX, y1: margin.top, x2: phaseX, y2: margin.top + innerHeight,
        "class": "phase-line", "stroke-dasharray": "5 5"
      }));
      svg.appendChild(svgNode("text", {
        x: phaseX + 4, y: margin.top + 12, "class": "axis-label"
      }, phase.label));
    });

    var commitPoints = rows.map(function (row, index) {
      return x(index) + "," + y(row.commits);
    }).join(" ");
    svg.appendChild(svgNode("polyline", {
      points: commitPoints, fill: "none", "class": "series-commit", "stroke-width": 2
    }));
    var barWidth = Math.max(4, Math.min(15, innerWidth / Math.max(rows.length, 1) / 2.4));
    rows.forEach(function (row, index) {
      var barHeight = innerHeight - (y(row.issues_completed) - margin.top);
      svg.appendChild(svgNode("rect", {
        x: x(index) - barWidth / 2, y: y(row.issues_completed), width: barWidth,
        height: Math.max(0, barHeight), rx: 2, "class": "series-issue"
      }));
      svg.appendChild(svgNode("circle", {
        cx: x(index), cy: y(row.commits), r: 3, "class": "series-commit"
      }));
      if (index % Math.max(1, Math.ceil(rows.length / 8)) === 0 || index === rows.length - 1) {
        var label = row.day.slice(5).replace("-", ".");
        svg.appendChild(svgNode("text", {
          x: x(index), y: height - 30, "text-anchor": "end",
          transform: "rotate(-35 " + x(index) + " " + (height - 30) + ")", "class": "axis-label"
        }, label));
      }
    });
    [["series-issue", "lezárt issue"], ["series-commit", "integration commit"]].forEach(function (item, index) {
      var offset = margin.left + index * 155;
      svg.appendChild(svgNode("line", {
        x1: offset, y1: 15, x2: offset + 22, y2: 15, "class": item[0], "stroke-width": 5
      }));
      svg.appendChild(svgNode("text", { x: offset + 30, y: 19, "class": "chart-label" }, item[1]));
    });
    document.getElementById("daily-table").innerHTML =
      '<table><thead><tr><th>Dátum</th><th>Lezárt issue</th><th>Integration commit</th></tr></thead><tbody>' +
      rows.map(function (row) {
        return "<tr><td>" + escapeHtml(row.day) + "</td><td>" + fmtInt(row.issues_completed) +
          "</td><td>" + fmtInt(row.commits) + "</td></tr>";
      }).join("") + "</tbody></table>";
  }

  function renderBarMultiple(containerId, title, unit, rows, valueKey, colorClass) {
    var container = document.getElementById(containerId);
    var section = document.createElement("section");
    section.className = "mini-plot";
    var max = Math.max.apply(null, [1].concat(rows.map(function (row) {
      return Number(row[valueKey] || 0);
    })));
    section.innerHTML = "<h3>" + escapeHtml(title) + '</h3><span class="unit">' +
      escapeHtml(unit) + "</span>" + rows.map(function (row) {
        var label = row.label || row.repository;
        var value = Number(row[valueKey] || 0);
        return '<div class="bar-row"><span>' + escapeHtml(label) +
          '</span><span class="bar-track" aria-hidden="true"><span class="bar-fill ' +
          (colorClass || "") + '" style="display:block;width:' + (value / max) * 100 +
          '%"></span></span><strong>' + escapeHtml(fmt(value)) + "</strong></div>";
      }).join("");
    container.appendChild(section);
  }

  function renderPhaseMultiples() {
    var container = document.getElementById("phase-multiples");
    container.replaceChildren();
    renderBarMultiple("phase-multiples", "Lezárás / aktív nap", "darab", data.phases, "issues_per_active_day", "");
    renderBarMultiple("phase-multiples", "Medián ciklusidő", "óra · csak teljes időbélyeggel", data.phases, "cycle_median_hours", "blue");
    var reviewRows = data.phases.map(function (phase) {
      return Object.assign({}, phase, { review_share_percent: Number(phase.review_proxy_share || 0) * 100 });
    });
    renderBarMultiple("phase-multiples", "Review-proxy részarány", "% a lezárt issue-kból", reviewRows, "review_share_percent", "amber");
  }

  function renderCycleChart() {
    var svg = document.getElementById("cycle-chart");
    var rows = data.cycle_distribution;
    var width = 650;
    var height = 410;
    var margin = { top: 20, right: 60, bottom: 20, left: 105 };
    var max = Math.max.apply(null, [1].concat(rows.map(function (row) { return row.count; })));
    var rowHeight = (height - margin.top - margin.bottom) / rows.length;
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.replaceChildren();
    rows.forEach(function (row, index) {
      var y = margin.top + index * rowHeight + rowHeight * 0.18;
      var barHeight = rowHeight * 0.58;
      var barWidth = ((width - margin.left - margin.right) * row.count) / max;
      svg.appendChild(svgNode("text", {
        x: margin.left - 10, y: y + barHeight * 0.72, "text-anchor": "end", "class": "chart-label"
      }, row.bucket));
      svg.appendChild(svgNode("rect", {
        x: margin.left, y: y, width: barWidth, height: barHeight, rx: 3, "class": "series-issue"
      }));
      svg.appendChild(svgNode("text", {
        x: margin.left + barWidth + 8, y: y + barHeight * 0.72, "class": "chart-value"
      }, fmtInt(row.count)));
    });
  }

  function renderRepos() {
    var container = document.getElementById("repo-multiples");
    container.replaceChildren();
    renderBarMultiple("repo-multiples", "Aktuális kódméret", "cloc kódsor", data.repositories, "code_lines", "");
    renderBarMultiple("repo-multiples", "Integrált aktivitás", "commit az integration refen", data.repositories, "commits", "blue");
    var churn = data.repositories.map(function (row) {
      return Object.assign({}, row, { churn: row.additions + row.deletions });
    });
    renderBarMultiple("repo-multiples", "Történeti churn", "hozzáadás + törlés", churn, "churn", "amber");
  }

  function renderHypotheses() {
    document.getElementById("hypotheses").innerHTML = data.hypotheses.map(function (item) {
      return '<article class="hypothesis"><div class="hypothesis-id">' + escapeHtml(item.id) +
        '</div><div><span class="verdict">' + escapeHtml(item.verdict) + "</span><h3>" +
        escapeHtml(item.title) + '</h3><p class="evidence-for">' + escapeHtml(item.support) +
        "</p><p><strong>Ellenbizonyíték:</strong> " + escapeHtml(item.counter) +
        "</p></div><dl><dt>Minta</dt><dd>" + escapeHtml(item.sample) +
        "</dd><dt>Következő teszt</dt><dd>" + escapeHtml(item.next_test) +
        "</dd></dl></article>";
    }).join("");
  }

  function renderExternalEvidence() {
    document.getElementById("external-evidence").innerHTML = data.external_evidence.map(function (item) {
      return "<tr><td><strong><a href=" + JSON.stringify(item.url) + ">" + escapeHtml(item.title) +
        "</a></strong><br>" + escapeHtml(item.publisher) + " · " + escapeHtml(item.published) +
        "<br><small>" + escapeHtml(item.limitation) + "</small></td><td>" +
        escapeHtml(item.sample) + "<br><small>" + escapeHtml(item.method) + "</small></td><td>" +
        escapeHtml(item.finding) + '</td><td><span class="grade" aria-label="Bizonyítóerő: ' +
        escapeHtml(item.quality) + '">' + escapeHtml(item.quality) + "</span></td><td>" +
        escapeHtml(item.comparability) + "</td></tr>";
    }).join("");
  }

  function renderNotes() {
    document.getElementById("quality-notes").innerHTML = "<ul>" +
      data.data_quality.slice(0, 3).map(function (item) {
        return "<li>" + escapeHtml(item) + "</li>";
      }).join("") + "</ul>";
    document.getElementById("data-quality").innerHTML = data.data_quality.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    document.getElementById("method-notes").innerHTML = data.method_notes.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("");
    document.getElementById("generated").textContent =
      "Adatcsomag generálva: " + new Date(data.generated_at).toLocaleString("hu-HU") +
      " · séma v" + data.schema_version;
  }

  setKpis();
  setCoverage();
  renderDailyChart();
  renderPhaseMultiples();
  renderCycleChart();
  renderRepos();
  renderHypotheses();
  renderExternalEvidence();
  renderNotes();
}());
