# Wenova AI-assisted development evidence

This isolated package builds an internal evidence lake, an auditable metric model,
and a portable static HTML report. Raw Linear, usage, Git, and validation data never
belongs in this public repository.

## Boundaries

- Repository scope: `evidence/wenova-ai-development/**` only.
- Default internal lake: `C:\Zulu\git_we\.evidence\wenova-ai-development`.
- Committed fixtures are invented. Real snapshots and generated reports stay in the
  internal lake and the training Drive folder.
- The generated site has relative paths, no runtime service, no secrets, and no
  network dependency. Upload the `outputs/site/` directory to any static host.

## Run

```powershell
python src/pipeline.py collect --config config/local.example.json
python src/pipeline.py analyze --config config/local.example.json
python src/pipeline.py build-site --config config/local.example.json
python src/pipeline.py validate --config config/local.example.json
python -m unittest discover -s tests -v
```

Copy `config/local.example.json` outside the repository and adapt paths if needed.
The Linear snapshot is created separately through the authenticated Linear connector
and placed at `<lake>/raw/linear/issues.json`.

## Measurement contract

- Calendar phases are evidence-backed interventions, not causal treatment groups.
- Issue lead time is `createdAt -> completedAt`; cycle time is
  `startedAt -> completedAt`.
- Churn is Git additions + deletions on the integration ref. Generated and binary
  files do not contribute numeric lines.
- Token totals include cache traffic because it is real model consumption, but the
  report also exposes input/output tokens separately.
- Review and rework are title/trace proxies. They are never presented as defects.
- Every comparison reports its sample and a comparability warning.
