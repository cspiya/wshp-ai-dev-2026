#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CSP =
  "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'";
export function parseArgs(argv) {
  const out = { source: ".", site: ".site", phase: "foundation" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--source") out.source = argv[++i];
    else if (argv[i] === "--site") out.site = argv[++i];
    else if (argv[i] === "--phase") out.phase = argv[++i];
    else throw new Error(`unknown argument: ${argv[i]}`);
  }
  if (!["foundation", "incremental", "final"].includes(out.phase))
    throw new Error("--phase must be foundation, incremental, or final");
  return out;
}
function walk(dir) {
  return fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .flatMap((e) =>
          e.isDirectory()
            ? [".git", ".site", "node_modules"].includes(e.name)
              ? []
              : walk(path.join(dir, e.name))
            : [path.join(dir, e.name)],
        )
    : [];
}
function sha(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}
function normalized(file) {
  return fs
    .readFileSync(file, "utf8")
    .replaceAll("\r\n", "\n")
    .replace(/<!--\s*(?:Generated|generator|created)[\s\S]*?-->/gi, "");
}
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
function diagramsOf(json) {
  return Array.isArray(json) ? json : json.diagrams;
}
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"));
  return m?.[1] ?? m?.[2];
}
function selectorId(selector) {
  return typeof selector === "string" && /^#[A-Za-z][\w:.-]*$/.test(selector)
    ? selector.slice(1)
    : null;
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function elementById(html, tag, id) {
  if (!id) return null;
  const safe = escapeRegex(id);
  return (
    html.match(
      new RegExp(
        `<${tag}\\b(?=[^>]*\\bid=(?:"${safe}"|'${safe}'))[^>]*>[\\s\\S]*?<\\/${tag}>`,
        "i",
      ),
    )?.[0] ?? null
  );
}
function inlineSvgFromFigure(html, figureSelector, svgSelector) {
  const figureId = selectorId(figureSelector);
  if (!figureId || svgSelector !== `${figureSelector} svg`) return null;
  const figure = elementById(html, "figure", figureId);
  return figure?.match(/<svg\b[\s\S]*?<\/svg>/i)?.[0] ?? null;
}
function elementWithId(html, id) {
  if (!id) return null;
  const safe = escapeRegex(id);
  return (
    html.match(
      new RegExp(
        `<([a-z][\\w:-]*)\\b(?=[^>]*\\bid=(?:"${safe}"|'${safe}'))[^>]*>[\\s\\S]*?<\\/\\1>`,
        "i",
      ),
    )?.[0] ?? null
  );
}
function svgNavigationLinks(svg) {
  return [...svg.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => {
    const opening = `<a ${match[1]}>`;
    const href = attr(opening, "href");
    const labelledBy = attr(opening, "aria-labelledby") ?? "";
    const referencedLabel = labelledBy
      .split(/\s+/)
      .filter(Boolean)
      .map((id) =>
        (elementWithId(svg, id) ?? "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(Boolean)
      .join(" ");
    const labelled = attr(opening, "aria-label") || referencedLabel;
    const title =
      match[2].match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const visibleText = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const tabIndex = attr(opening, "tabindex");
    const excludedFromTabOrder =
      tabIndex !== undefined && Number.parseInt(tabIndex, 10) < 0;
    const hasSemanticHoverShape = [
      ...match[2].matchAll(/<(?:rect|circle|ellipse|path|polygon)\b[^>]*>/gi),
    ].some((shapeMatch) => {
      const classes = new Set(
        (attr(shapeMatch[0], "class") ?? "").split(/\s+/).filter(Boolean),
      );
      return (
        classes.has("node-shape") &&
        ["human", "agent", "machine", "artifact", "evidence", "risk"].some(
          (role) => classes.has(`node-${role}`),
        )
      );
    });
    return {
      href,
      name: `${labelled} ${title} ${visibleText}`.trim(),
      excludedFromTabOrder,
      hasSemanticHoverShape,
    };
  });
}
export function normalizedInlineSvg(svg) {
  return (
    svg
      .replaceAll("\r\n", "\n")
      .replace(/<!--\s*(?:Generated|generator|created)[\s\S]*?-->/gi, "")
      // build-site.mjs exposes the viewBox design width as an inline custom
      // property so the stylesheet can cap rendered size; this marker is the
      // only sanctioned build-time SVG mutation and is ignored when hashing.
      .replace(/ style="--svg-w:\d+(?:\.\d+)?px"/g, "")
      .replace(/>\s+</g, "><")
      .trim()
  );
}
function inlineFigureIds(html) {
  const ids = [];
  for (const figure of html.match(/<figure\b[\s\S]*?<\/figure>/gi) ?? []) {
    if (!/<svg\b/i.test(figure)) continue;
    const opening = figure.match(/<figure\b[^>]*>/i)?.[0] ?? "";
    const id = attr(opening, "id");
    if (id) ids.push(id);
  }
  return ids;
}
const COMPLEX_TYPES = new Set([
  "process",
  "cycle",
  "structure",
  "relationship",
  "decision",
  "timeline",
  "quantitative-data",
]);
// Exact current-base debt owned by the preparation lane. Remove this ratchet
// exception during final composed-main integration once that lane has landed.
const LEGACY_LINK_HOVER_HOOK_DEBT = new Set([
  "/materials/felkeszules/#fig-preparation-milyen-sorrendben-epulnek-egymasra-az",
]);
const DIAGRAM_TYPES = {
  "key-concept": new Set([
    "concept-map",
    "relationship-map",
    "component-map",
    "annotated-diagram",
  ]),
  process: new Set(["flowchart", "sequence-diagram", "activity-diagram"]),
  cycle: new Set(["cycle-diagram", "state-diagram"]),
  structure: new Set([
    "component-diagram",
    "architecture-diagram",
    "class-diagram",
    "hierarchy",
  ]),
  relationship: new Set([
    "relationship-map",
    "concept-map",
    "entity-relationship",
  ]),
  decision: new Set(["decision-tree", "state-diagram"]),
  timeline: new Set(["timeline", "sequence-diagram"]),
  "quantitative-data": new Set([
    "bar-chart",
    "line-chart",
    "scatter-plot",
    "pie-chart",
  ]),
};
function readRoutes(source) {
  const file = path.join(source, "toolkit/material-site/site-manifest.json");
  if (!fs.existsSync(file)) return [];
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return Array.isArray(json) ? json : (json.routes ?? []);
}
function readGlossarySlugs(source) {
  const file = path.join(source, "materials/fogalomtar/glossary.json");
  if (!fs.existsSync(file)) return null;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  return new Set(
    (json.terms ?? json.entries ?? json.records ?? []).map(
      (record) => record.slug,
    ),
  );
}
function readGlossaryVisualCoverage(source) {
  const file = path.join(source, "materials/fogalomtar/glossary.json");
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")).visualCoverage ?? null;
}
function expectedGlossarySlugs(question, canonicalSlugs) {
  if (question?.glossaryCoverage === "all") return [...(canonicalSlugs ?? [])];
  return question?.glossarySlugs ?? [];
}
function pageDirForRoute(route) {
  const dir = path.dirname(route.source).replaceAll("\\", "/");
  return dir === "." ? "" : dir;
}
function diagramManifestForRoute(source, route) {
  return route.source === "index.html"
    ? path.join(source, "index-media/diagrams.json")
    : path.join(source, pageDirForRoute(route), "media/diagrams.json");
}
function generatedForRoute(site, route) {
  return path.join(site, route.output.replace(/^\.site[\\/]/, ""));
}
function resolveShared(page, href, site) {
  const [raw, fragment] = href.split("#", 2);
  let target = path.resolve(path.dirname(page), raw);
  if (raw.endsWith("/") || !path.extname(target))
    target = path.join(target, "index.html");
  return { target, fragment, inside: target.startsWith(`${site}${path.sep}`) };
}
function isNegativeFixture(file) {
  return file.replaceAll("\\", "/").includes("/fixtures/");
}

export function shouldValidateRouteRegistry({
  phase,
  routeId,
  renderedRealRoutes,
  isToolReference = false,
}) {
  if (isToolReference || phase === "final" || !routeId) return true;
  return renderedRealRoutes?.has(routeId) === true;
}

export function validateDiagrams({ source, site, phase }) {
  const failures = [];
  const htmlFiles = walk(site).filter((f) => f.toLowerCase().endsWith(".html"));
  const svgFiles = walk(site).filter((f) => f.toLowerCase().endsWith(".svg"));
  const outputReferenced = new Set();
  let routes = [];
  let glossarySlugs = null;
  let glossaryVisualCoverage = null;
  let renderedRealRoutes = null;
  try {
    routes = readRoutes(source);
    glossarySlugs = readGlossarySlugs(source);
    glossaryVisualCoverage = readGlossaryVisualCoverage(source);
  } catch (error) {
    failures.push(`visual contract input is invalid: ${error.message}`);
  }
  if (!routes.length)
    failures.push("site manifest with visual-question declarations is missing");
  if (phase !== "final") {
    const dispositionFile = path.join(site, "assets", "route-disposition.json");
    try {
      const disposition = JSON.parse(fs.readFileSync(dispositionFile, "utf8"));
      if (
        disposition.phase !== phase ||
        !Array.isArray(disposition.real) ||
        !Array.isArray(disposition.substituted)
      )
        throw new Error("invalid shape or phase");
      renderedRealRoutes = new Set(disposition.real);
      const all = [...disposition.real, ...disposition.substituted];
      if (
        all.length !== routes.length ||
        new Set(all).size !== routes.length ||
        routes.some((route) => !all.includes(route.id))
      )
        throw new Error("route coverage differs from site manifest");
    } catch (error) {
      failures.push(
        `${phase} route disposition is missing or invalid: ${error.message}`,
      );
      renderedRealRoutes = new Set();
    }
  }
  const configFile = path.join(
    source,
    "toolkit/material-site/mermaid.config.json",
  );
  let mermaidConfig = null;
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
    mermaidConfig = config;
    if (config.securityLevel !== "strict")
      failures.push("mermaid config securityLevel must be strict");
    if (
      config.deterministicIds !== true ||
      config.deterministicIDSeed !== "wshp-ai-dev-2026-v2"
    )
      failures.push("mermaid deterministic ID contract is not frozen");
    if (config.htmlLabels !== false)
      failures.push("mermaid htmlLabels must be false");
  } else if (phase === "final") failures.push("mermaid.config.json missing");
  for (const manifestFile of walk(source).filter(
    (f) =>
      !isNegativeFixture(f) &&
      /\/(?:index-)?media\/diagrams\.json$/.test(f.replaceAll("\\", "/")),
  )) {
    const pageRelative = path
      .relative(source, path.dirname(path.dirname(manifestFile)))
      .replaceAll("\\", "/");
    const route = routes.find(
      (candidate) => pageDirForRoute(candidate) === pageRelative,
    );
    const isToolReference = path
      .relative(source, manifestFile)
      .replaceAll("\\", "/")
      .startsWith("toolkit/material-site/diagram/");
    if (!route && !isToolReference)
      failures.push(
        `${path.relative(source, manifestFile)}: no canonical route owns this page-local diagram manifest`,
      );
    if (
      !shouldValidateRouteRegistry({
        phase,
        routeId: route?.id,
        renderedRealRoutes,
        isToolReference,
      })
    )
      continue;
    let diagrams;
    try {
      diagrams = diagramsOf(JSON.parse(fs.readFileSync(manifestFile, "utf8")));
    } catch (error) {
      failures.push(
        `${path.relative(source, manifestFile)}: invalid JSON: ${error.message}`,
      );
      continue;
    }
    if (!Array.isArray(diagrams)) {
      failures.push(
        `${path.relative(source, manifestFile)}: diagrams array missing`,
      );
      continue;
    }
    const declaredQuestions = new Map(
      (route?.visualQuestions ?? []).map((question) => [question.id, question]),
    );
    const dispositions = new Map();
    const ids = new Set();
    const registeredInlineFigures = new Set();
    for (const [index, diagram] of diagrams.entries()) {
      const label = `${path.relative(source, manifestFile)}[${index}]`;
      for (const key of [
        "visualQuestionId",
        "question",
        "type",
        "disposition",
        "takeaway",
      ])
        if (typeof diagram[key] !== "string" || !diagram[key].trim())
          failures.push(`${label}: missing ${key}`);
      if (
        !Array.isArray(diagram.glossarySlugs) ||
        !diagram.glossarySlugs.length
      )
        failures.push(`${label}: canonical glossarySlugs are required`);
      for (const slug of diagram.glossarySlugs ?? [])
        if (glossarySlugs && !glossarySlugs.has(slug))
          failures.push(`${label}: unknown glossary slug ${slug}`);
      if (
        !diagram.visualQuestionId ||
        (route && !declaredQuestions.has(diagram.visualQuestionId))
      )
        failures.push(
          `${label}: decorative or undeclared visual has no matching visual question`,
        );
      if (dispositions.has(diagram.visualQuestionId))
        failures.push(
          `${label}: duplicate disposition for ${diagram.visualQuestionId}`,
        );
      else dispositions.set(diagram.visualQuestionId, diagram);
      const declared = declaredQuestions.get(diagram.visualQuestionId);
      if (declared) {
        if (diagram.type !== declared.type)
          failures.push(
            `${label}: visual type does not match manifest question`,
          );
        if (diagram.question !== declared.question)
          failures.push(`${label}: learner question does not match manifest`);
        if (diagram.takeaway !== declared.takeaway)
          failures.push(`${label}: takeaway does not match manifest`);
        const actualSlugs = [...(diagram.glossarySlugs ?? [])].sort().join("|");
        const expectedSlugs = expectedGlossarySlugs(declared, glossarySlugs)
          .sort()
          .join("|");
        if (actualSlugs !== expectedSlugs)
          failures.push(`${label}: glossary coverage does not match manifest`);
      }
      if (diagram.disposition === "decorative-only")
        failures.push(`${label}: decorative-only disposition is forbidden`);
      if (
        glossaryVisualCoverage &&
        glossaryVisualCoverage.diagramId === diagram.id
      ) {
        const coverageSlugs = Object.keys(
          glossaryVisualCoverage.termToLearningArea ?? {},
        ).sort();
        const frozenSlugs = [...(glossarySlugs ?? [])].sort();
        if (coverageSlugs.join("|") !== frozenSlugs.join("|"))
          failures.push(
            `${label}: glossary visual coverage must disposition every frozen term exactly once`,
          );
        for (const [slug, area] of Object.entries(
          glossaryVisualCoverage.termToLearningArea ?? {},
        )) {
          if (!/^(?:0[1-8]|support)$/.test(area))
            failures.push(
              `${label}: invalid learning area ${area} for glossary term ${slug}`,
            );
        }
        if (
          [...(diagram.glossarySlugs ?? [])].sort().join("|") !==
          frozenSlugs.join("|")
        )
          failures.push(
            `${label}: glossary overview registry must include every frozen term slug`,
          );
      }
      if (diagram.disposition === "prose-only") {
        if (
          COMPLEX_TYPES.has(diagram.type) ||
          diagram.atomicGlossaryTerm !== true
        )
          failures.push(
            `${label}: prose-only cannot disposition a complex or non-atomic visual question`,
          );
        continue;
      }
      if (diagram.disposition === "shared") {
        if (declared?.coverage !== "shared")
          failures.push(
            `${label}: shared disposition is not allowed by manifest`,
          );
        for (const key of ["sharedDiagramId", "sharedHref"])
          if (typeof diagram[key] !== "string" || !diagram[key].trim())
            failures.push(`${label}: shared disposition missing ${key}`);
        if (
          declared &&
          (diagram.sharedDiagramId !== declared.diagramId ||
            diagram.sharedHref !== declared.sharedHref)
        )
          failures.push(
            `${label}: shared canonical target does not match manifest`,
          );
        const generatedPage = route ? generatedForRoute(site, route) : null;
        if (
          generatedPage &&
          fs.existsSync(generatedPage) &&
          diagram.sharedHref
        ) {
          const shared = resolveShared(generatedPage, diagram.sharedHref, site);
          if (
            !shared.inside ||
            !fs.existsSync(shared.target) ||
            shared.fragment !== diagram.sharedDiagramId ||
            !new RegExp(`id=["']${shared.fragment}["']`, "i").test(
              fs.readFileSync(shared.target, "utf8"),
            )
          )
            failures.push(`${label}: broken shared canonical figure link`);
        }
        continue;
      }
      if (diagram.disposition !== "page-local") {
        failures.push(`${label}: invalid disposition ${diagram.disposition}`);
        continue;
      }
      for (const key of ["id", "diagramType", "textFallbackSelector"])
        if (typeof diagram[key] !== "string" || !diagram[key].trim())
          failures.push(`${label}: missing ${key}`);
      if (
        route &&
        (declared?.coverage !== "page-local" ||
          diagram.id !== declared.diagramId)
      )
        failures.push(
          `${label}: page-local figure does not match declared diagramId/coverage`,
        );
      if (!DIAGRAM_TYPES[diagram.type]?.has(diagram.diagramType))
        failures.push(
          `${label}: invalid diagram type ${diagram.diagramType} for ${diagram.type}`,
        );
      const isChart = /-chart$|^scatter-plot$/.test(diagram.diagramType ?? "");
      if (
        isChart &&
        (diagram.type !== "quantitative-data" ||
          typeof diagram.quantitativeSource !== "string" ||
          !diagram.quantitativeSource.trim())
      )
        failures.push(
          `${label}: chart requires a declared quantitative source`,
        );
      if (
        diagram.type === "quantitative-data" &&
        diagram.quantitativeSource !== declared?.quantitativeSource
      )
        failures.push(`${label}: quantitative source does not match manifest`);
      if (diagram.animation != null) {
        const animation = diagram.animation;
        for (const key of [
          "id",
          "triggerSelector",
          "pauseSelector",
          "restartSelector",
          "staticFallbackSelector",
        ])
          if (typeof animation[key] !== "string" || !animation[key].trim())
            failures.push(`${label}: animation missing ${key}`);
        for (const key of [
          "userInitiated",
          "keyboardOperable",
          "pausable",
          "restartable",
          "reducedMotionDisabled",
          "printDisabled",
          "noJsStatic",
        ])
          if (animation[key] !== true)
            failures.push(`${label}: animation contract requires ${key}=true`);
        if (animation.autoplay !== false)
          failures.push(`${label}: animation autoplay must be false`);
      }
      if (ids.has(diagram.id))
        failures.push(`${label}: duplicate diagram id ${diagram.id}`);
      else ids.add(diagram.id);
      const generatedPage = route
        ? generatedForRoute(site, route)
        : path.join(site, pageRelative, "index.html");
      const sourcePage = route
        ? path.join(source, route.source)
        : path.join(source, pageRelative, "index.html");
      if (diagram.rendering === "inline-svg") {
        for (const key of ["figureSelector", "svgSelector", "inlineSvgHash"])
          if (typeof diagram[key] !== "string" || !diagram[key].trim())
            failures.push(`${label}: inline SVG missing ${key}`);
        const figureId = selectorId(diagram.figureSelector);
        if (
          !figureId ||
          diagram.id !== figureId ||
          diagram.svgSelector !== `${diagram.figureSelector} svg`
        )
          failures.push(
            `${label}: inline SVG selectors must identify the registered figure exactly`,
          );
        if (!/^[a-f0-9]{64}$/.test(diagram.inlineSvgHash ?? ""))
          failures.push(`${label}: invalid inlineSvgHash`);
        if (figureId) registeredInlineFigures.add(figureId);
        const sourceHtml = fs.existsSync(sourcePage)
          ? fs.readFileSync(sourcePage, "utf8")
          : "";
        const sourceSvg = inlineSvgFromFigure(
          sourceHtml,
          diagram.figureSelector,
          diagram.svgSelector,
        );
        if (!sourceSvg)
          failures.push(
            `${label}: registered inline SVG is absent from source page`,
          );
        else if (sha(normalizedInlineSvg(sourceSvg)) !== diagram.inlineSvgHash)
          failures.push(`${label}: stale or changed inline SVG hash`);
        if (fs.existsSync(generatedPage)) {
          const generatedHtml = fs.readFileSync(generatedPage, "utf8");
          const generatedSvg = inlineSvgFromFigure(
            generatedHtml,
            diagram.figureSelector,
            diagram.svgSelector,
          );
          if (!generatedSvg)
            failures.push(
              `${label}: registered inline SVG is absent from generated page`,
            );
          else {
            const generatedHash = sha(normalizedInlineSvg(generatedSvg));
            const expectedGeneratedHash =
              diagram.generatedInlineSvgHash ?? diagram.inlineSvgHash;
            if (generatedHash !== expectedGeneratedHash)
              failures.push(
                `${label}: generated inline SVG integrity differs from source/registry`,
              );
            if (
              generatedHash !== diagram.inlineSvgHash &&
              !/^[a-f0-9]{64}$/.test(diagram.generatedInlineSvgHash ?? "")
            )
              failures.push(
                `${label}: route-resolved inline SVG requires generatedInlineSvgHash`,
              );
            const navigationLinks = svgNavigationLinks(generatedSvg);
            if (navigationLinks.length) {
              const fallbackId = selectorId(diagram.textFallbackSelector);
              const fallback = elementWithId(generatedHtml, fallbackId) ?? "";
              const fallbackTargets = new Set(
                [
                  ...fallback.matchAll(
                    /<a\b[^>]*\bhref=(?:"([^"]+)"|'([^']+)')[^>]*>/gi,
                  ),
                ].map((match) => match[1] ?? match[2]),
              );
              for (const link of navigationLinks) {
                if (
                  !link.href ||
                  /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link.href)
                )
                  failures.push(
                    `${label}: diagram navigation link must use a resolved internal href`,
                  );
                if (!link.name)
                  failures.push(
                    `${label}: diagram navigation link lacks an accessible name`,
                  );
                if (link.excludedFromTabOrder)
                  failures.push(
                    `${label}: diagram navigation link is removed from sequential keyboard navigation`,
                  );
                const hoverDebtKey = `${route?.id ?? ""}#${diagram.id}`;
                if (
                  !link.hasSemanticHoverShape &&
                  !LEGACY_LINK_HOVER_HOOK_DEBT.has(hoverDebtKey)
                )
                  failures.push(
                    `${label}: diagram navigation link lacks a semantic node-shape hover/focus hook`,
                  );
                if (link.href && !fallbackTargets.has(link.href))
                  failures.push(
                    `${label}: diagram navigation target is missing from the HTML fallback: ${link.href}`,
                  );
              }
            }
          }
        }
      } else {
        if (diagram.rendering != null && diagram.rendering !== "external-svg")
          failures.push(`${label}: invalid rendering ${diagram.rendering}`);
        for (const key of ["source", "output", "sourceHash", "outputHash"])
          if (typeof diagram[key] !== "string" || !diagram[key].trim())
            failures.push(`${label}: external SVG missing ${key}`);
        if (!/^[a-f0-9]{64}$/.test(diagram.sourceHash ?? ""))
          failures.push(`${label}: invalid sourceHash`);
        if (!/^[a-f0-9]{64}$/.test(diagram.outputHash ?? ""))
          failures.push(`${label}: invalid outputHash`);
        const dir = path.dirname(manifestFile);
        const mmd = path.resolve(dir, diagram.source ?? "");
        const svg = path.resolve(dir, diagram.output ?? "");
        if (
          !mmd.startsWith(`${dir}${path.sep}`) ||
          !svg.startsWith(`${dir}${path.sep}`)
        ) {
          failures.push(`${label}: diagram path escapes media directory`);
          continue;
        }
        if (!fs.existsSync(mmd))
          failures.push(`${label}: Mermaid source missing`);
        else if (mermaidConfig) {
          const expectedSourceHash = sha(
            `${normalized(mmd)}\n${canonicalJson(mermaidConfig)}\n11.16.0`,
          );
          if (expectedSourceHash !== diagram.sourceHash)
            failures.push(`${label}: stale Mermaid source/config/version hash`);
        }
        if (!fs.existsSync(svg)) failures.push(`${label}: SVG output missing`);
        else {
          outputReferenced.add(
            path.relative(source, svg).replaceAll("\\", "/").toLowerCase(),
          );
          if (sha(normalized(svg)) !== diagram.outputHash)
            failures.push(`${label}: stale or changed SVG output hash`);
        }
      }
      if (
        fs.existsSync(generatedPage) &&
        typeof diagram.textFallbackSelector === "string"
      ) {
        const generatedHtml = fs.readFileSync(generatedPage, "utf8");
        if (
          diagram.textFallbackSelector.startsWith("#") &&
          !new RegExp(
            `id=["']${diagram.textFallbackSelector.slice(1)}["']`,
            "i",
          ).test(generatedHtml)
        )
          failures.push(
            `${label}: text fallback selector is absent from generated page`,
          );
        if (
          diagram.rendering !== "inline-svg" &&
          diagram.output &&
          !generatedHtml.includes(diagram.output)
        )
          failures.push(
            `${label}: generated page does not reference diagram output`,
          );
        if (diagram.animation?.id) {
          const id = diagram.animation.id;
          if (
            !new RegExp(`data-animation=["']${id}["']`, "i").test(generatedHtml)
          )
            failures.push(
              `${label}: animation root is absent from generated page`,
            );
          for (const action of ["start", "pause", "restart"])
            if (
              !new RegExp(`data-animation-${action}=["']${id}["']`, "i").test(
                generatedHtml,
              )
            )
              failures.push(
                `${label}: animation ${action} control is absent from generated page`,
              );
          if (
            !new RegExp(`data-animation-fallback=["']${id}["']`, "i").test(
              generatedHtml,
            )
          )
            failures.push(
              `${label}: animation static fallback is absent from generated page`,
            );
        }
      }
    }
    if (route) {
      const sourcePage = path.join(source, route.source);
      const generatedPage = generatedForRoute(site, route);
      for (const page of [sourcePage, generatedPage].filter(fs.existsSync)) {
        for (const id of inlineFigureIds(fs.readFileSync(page, "utf8")))
          if (!registeredInlineFigures.has(id))
            failures.push(
              `${path.relative(source, manifestFile)}: undeclared pedagogical inline SVG figure: ${id}`,
            );
      }
    }
    for (const question of route?.visualQuestions ?? [])
      if (!dispositions.has(question.id))
        failures.push(
          `${path.relative(source, manifestFile)}: visual question has no disposition: ${question.id}`,
        );
    if (route) {
      const overview = dispositions.get(
        route.visualQuestions.find(
          (question) => question.diagramId === route.overviewDiagramId,
        )?.id,
      );
      if (
        !overview ||
        overview.disposition !== "page-local" ||
        overview.id !== route.overviewDiagramId ||
        !overview.takeaway
      )
        failures.push(
          `${path.relative(source, manifestFile)}: required big-picture overview figure/takeaway missing`,
        );
      if (/^MODULE-/.test(route.owner)) {
        const locals = diagrams.filter(
          (diagram) => diagram.disposition === "page-local",
        );
        if (locals.length < 2)
          failures.push(
            `${path.relative(source, manifestFile)}: module needs overview plus at least one detailed page-local visual`,
          );
        if (
          !locals.some(
            (diagram) =>
              diagram.id !== route.overviewDiagramId &&
              COMPLEX_TYPES.has(diagram.type),
          )
        )
          failures.push(
            `${path.relative(source, manifestFile)}: module lacks a detailed process/structure/relationship visual`,
          );
      }
    }
  }
  for (const route of routes) {
    if (phase !== "final" && !renderedRealRoutes?.has(route.id)) continue;
    const sourcePage = path.join(source, route.source);
    const generatedPage = generatedForRoute(site, route);
    if (
      phase === "foundation"
        ? !fs.existsSync(sourcePage)
        : !fs.existsSync(sourcePage) && !fs.existsSync(generatedPage)
    )
      continue;
    const diagramManifest = diagramManifestForRoute(source, route);
    if (!fs.existsSync(diagramManifest))
      failures.push(
        `${route.id}: page has no media/diagrams.json visual dispositions`,
      );
  }
  for (const file of [...walk(source), ...svgFiles].filter(
    (f) => !isNegativeFixture(f) && f.toLowerCase().endsWith(".svg"),
  )) {
    const svg = fs.readFileSync(file, "utf8");
    if (
      /<(?:script|foreignObject)\b|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)/i.test(
        svg,
      )
    )
      failures.push(`${path.relative(source, file)}: unsafe SVG content`);
  }
  const inlineIds = new Set();
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, "utf8");
    const cspTag =
      (html.match(
        /<meta\b[^>]*http-equiv=(?:"Content-Security-Policy"|'Content-Security-Policy')[^>]*>/i,
      ) ?? [])[0] ?? "";
    const csp = attr(cspTag, "content");
    if (csp !== CSP)
      failures.push(
        `${path.relative(site, htmlFile)}: exact CSP meta policy missing`,
      );
    if (/<script\b(?![^>]*\bsrc=)[^>]*>|\son[a-z]+\s*=|\beval\s*\(/i.test(html))
      failures.push(
        `${path.relative(site, htmlFile)}: inline executable script/event/eval is forbidden`,
      );
    for (const tag of html.match(/<img\b[^>]*\.svg[^>]*>/gi) ?? []) {
      for (const key of ["src", "alt", "width", "height"])
        if (!attr(tag, key))
          failures.push(
            `${path.relative(site, htmlFile)}: SVG image missing ${key}`,
          );
      const start = html.lastIndexOf("<figure", html.indexOf(tag));
      const end = html.indexOf("</figure>", html.indexOf(tag));
      if (
        start < 0 ||
        end < 0 ||
        !/<figcaption\b/i.test(html.slice(start, end))
      )
        failures.push(
          `${path.relative(site, htmlFile)}: SVG image must be in a figure with caption`,
        );
    }
    for (const svg of html.match(/<svg\b[\s\S]*?<\/svg>/gi) ?? []) {
      const labelled =
        svg.match(/aria-labelledby=["']([^"']+)["']/i)?.[1]?.split(/\s+/) ?? [];
      if (!/role=["']img["']/i.test(svg) || labelled.length < 2)
        failures.push(
          `${path.relative(site, htmlFile)}: inline SVG needs role=img and title+desc aria-labelledby`,
        );
      for (const id of labelled) {
        if (
          !new RegExp(`<(?:title|desc)\\b[^>]*id=["']${id}["']`, "i").test(svg)
        )
          failures.push(
            `${path.relative(site, htmlFile)}: inline SVG label target missing: ${id}`,
          );
        if (inlineIds.has(id))
          failures.push(
            `${path.relative(site, htmlFile)}: duplicate inline SVG title/desc id: ${id}`,
          );
        else inlineIds.add(id);
      }
    }
  }
  if (phase === "final") {
    for (const svg of walk(source).filter(
      (f) =>
        !isNegativeFixture(f) &&
        f.replaceAll("\\", "/").includes("/media/") &&
        f.toLowerCase().endsWith(".svg"),
    )) {
      const relative = path
        .relative(source, svg)
        .replaceAll("\\", "/")
        .toLowerCase();
      if (!outputReferenced.has(relative))
        failures.push(
          `generated SVG is absent from diagrams.json: ${relative}`,
        );
    }
  }
  return failures;
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));
    const failures = validateDiagrams({
      ...opts,
      source: path.resolve(opts.source),
      site: path.resolve(opts.site),
    });
    if (failures.length) {
      console.error(failures.map((x) => `FAIL: ${x}`).join("\n"));
      process.exitCode = 1;
    } else console.log(`diagrams: PASS (${opts.phase})`);
  } catch (error) {
    console.error(`diagrams: ${error.message}`);
    process.exitCode = 2;
  }
}
if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  main();
export { CSP };
