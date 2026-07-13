# Workshop setup command surface

A résztvevő közvetlenül csak a minimális bootstrap-kivételt végzi: szükség esetén a Scoop telepítését,
Claude Code vagy Codex első indítását és a munkakönyvtár létrehozását/kiválasztását. Az aktív agentet
természetes nyelven kérd meg az alábbi doctor- és bootstrap-szkriptek futtatására, a C0 evidence
összegyűjtésére, valamint megállásra minden engedély- vagy fiókdöntésnél. A pontos szintaxis
**agent által futtatott technikai szerződés**, nem résztvevői input.

These scripts are the canonical Windows entry point for the participant setup journey. They never create accounts, store tokens, delete an existing workspace, or silently install project dependencies.

## 1. Install the local tools

A bootstrap-kivétel részeként, hiányzó eszközöknél normál felhasználóként indítsd a
`scoop-telepito.cmd` fájlt. A szkript a Scooppal telepíti a Git, GitHub CLI, Node.js LTS,
Claude Code és Codex eszközöket, majd látható hibával leáll, ha egy szükséges parancs még hiányzik.

## 2. Diagnose the environment

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-doctor.ps1 `
  -Agent Both `
  -WorkspacePath participant-starter
```

The stable final line is one of:

- `DOCTOR_STATUS=PASS`: the requested local path is ready.
- `DOCTOR_STATUS=REPLAY`: an optional lane may use the pack validated from `-ReplayPath` (`replay-manifest.json` plus every listed file).
- `DOCTOR_STATUS=BLOCKED`: a core prerequisite is missing. The process exits with code `2`.

Use `-Agent Claude`, `-Agent Codex`, or `-Agent Auto` when both tools are not required. The doctor checks command availability and versions, but never reads credentials or environment-variable values.

## 3. Create the participant workspace and C0 evidence

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-bootstrap.ps1 `
  -Destination ..\participant-repo `
  -Agent Both `
  -InstallDependencies
```

The bootstrap:

1. runs the doctor;
2. copies only Git-tracked `participant-starter/` files, excluding local secrets and build artifacts;
3. refuses to overwrite a non-empty directory it does not own;
4. initializes Git when required;
5. installs dependencies only when `-InstallDependencies` is explicitly present;
6. runs typecheck and tests;
7. reruns the doctor against the created repo and writes `../workshop-evidence/C0-setup.md`.

The second run reuses a schema- and destination-validated marker. It never resets participant work. `BOOTSTRAP_STATUS=PASS` means the bootstrap operation succeeded; `C0_STATUS=PENDING` remains until dependencies were verified and the user reruns with `-AgentConfirmed` plus `-BrowserMode Connected` or `Manual`.

## Verification

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File toolkit/setup/workshop-setup.test.ps1
```

The test covers PASS, BLOCKED, validated REPLAY, PENDING, failed version probes, tracked-only copying, corrupt-marker refusal, and two-run idempotency.
