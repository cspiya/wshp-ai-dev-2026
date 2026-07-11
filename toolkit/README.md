# Take-home toolkit — az agent-ready fejlesztési rendszer alkatrészei

Ez a workshop **elsődleges hazavihető termékének** hordozható alkatrészkészlete: az üres repóból
felépíthető agent-ready működés a spec → build → independent review → verified fix teljes útjához.
Az alkalmazás nem helyettesíti ezt a rendszert; real-life workloadként validálja. A checkpoint-térkép:
[`materials/agent-ready-repo.md`](../materials/agent-ready-repo.md).

A toolkit szándékosan runtime- és modellfüggetlen mag. A spec, standard, RUG-szerepek, finding-formátum és
gate-parancsok maradnak stabilak; csak a subagent-indítás, hook-esemény és modellkonfiguráció kap
termék-specifikus adaptert. Így egy szolgáltatáskiesés, költségváltozás vagy jobb modell megjelenése nem
írja újra a fejlesztési módszert.

Az AI-instrukciók és a futtatható elemek angolul vannak, hogy közvetlenül használhatók legyenek coding agentekkel.

## 10 perces quickstart

1. Másold a `toolkit/AGENTS.md` tartalmát a célrepo gyökérszabályába, és egészítsd ki a repo saját parancsaival.
2. Töltsd ki a `spec-templates/spec.md`, `plan.md`, `tasks.md` és szükséges Given–When–Then forgatókönyveket.
3. A humán tulajdonos futtassa végig a `checklists/spec-gate.md` kaput és hagyja jóvá a specifikációt.
4. Töltsd ki a `standards/engineering-standards.md` projekt-specifikus gate parancsait. Ez maradjon az egyetlen kanonikus szakmai checklist.
5. Kövesd az `orchestrator/README.md` kézi RUG-folyamatát: maker → checks → friss kontextusú reviewer(ek) → dedup/verify → fixer → újraellenőrzés.
6. Másold a `hooks/checks.project.example.json` fájlt nem-example néven, add meg a valódi parancsokat, majd kösd a stop runner és public-content guard parancsokat a választott termék hivatalos hookjába vagy CI-jába.
7. Opcionálisan másold a `skills/rug-review` könyvtárat a választott termék dokumentált skill-könyvtárába, vagy add át a `SKILL.md`-t repo-instrukcióként. Ezután használd a worked skillt a review-kör következetes indításához.

### Mérhető 10 perces minimum — CI-only fallback

Ha a termék-specifikus stop hook bekötése nem fér bele az első 10 percbe, tegyél a CI pipeline-ba egy külön lépést ezzel a már létező toolkit paranccsal:

```powershell
node toolkit/hooks/run-stop-checks.mjs toolkit/hooks/checks.smoke.json
```

A minimum akkor kész, ha ez a lépés tiszta CI-környezetben lefut és zöld, majd a `checks.project.example.json` másolatában a repo valódi gate-jeihez rendelt parancsok következnek. A smoke-parancs a runner, a guard-negatív út, a failure propagation és a timeout mechanizmus működését bizonyítja; önmagában nem helyettesíti a projekt lint/typecheck/test gate-jeit.

Ez **CI-only fallback**, nem lokális stop hook: a CI megakadályozza a hibás változás integrálását, de nem akadályozza meg, hogy a helyi agent a gate-ek futása előtt késznek jelentse a munkát. A helyi stop hookot később a választott termék hivatalos adapterével kell bekötni.

## Tartalom

- `AGENTS.md` — repo-instrukció starter maker/fixer agenteknek.
- `standards/engineering-standards.md` — egyetlen kanonikus standard makernek és reviewernek.
- `orchestrator/` — runtime-semleges Repeat-Until-Good workflow, szerepek és promptok.
- `spec-templates/` — spec, plan, tasks és Given–When–Then sablonok.
- `checklists/` — spec gate, AI-test review, context budget és legacy/adoption minimum.
- `hooks/` — determinisztikus public-content guard és stop-runs-checks parancs.
- `skills/rug-review/` — konkrét, triggerelhető worked skill független review-körhöz.

## Adapterpontok és korlátok

A toolkit nem feltételez közös Claude Code/Codex runtime API-t. Az agent/subagent indítás, hook-esemény neve, payloadja és konfigurációs helye termék- és verziófüggő adapterpont; mindig a telepített verzió hivatalos dokumentációja alapján kösd be. Ha nincs determinisztikus stop hook, ugyanazokat a parancsokat pre-commitban és CI-ban futtasd.

A secret/public guard szándékosan kicsi oktatási példa, nem teljes DLP vagy secrets-scanner. A friss kontextusú review pedig csak akkor független, ha valóban új session/agent kap minimális, tárgyi review packetet.
