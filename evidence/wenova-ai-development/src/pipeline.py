#!/usr/bin/env python3
"""Build the private Wenova engineering evidence lake and portable report."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import re
import shutil
import sqlite3
import statistics
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Iterable


ROOT = Path(__file__).resolve().parents[1]
ISSUE_RE = re.compile(r"\bWEN-\d+\b", re.IGNORECASE)
REVIEW_RE = re.compile(
    r"\b(review|qa|rug|bounce[- ]?back|integration gate|remediation|finding|fix)\b",
    re.IGNORECASE,
)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def run(command: list[str], cwd: Path | None = None) -> str:
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if result.returncode:
        raise RuntimeError(
            f"Command failed ({result.returncode}): {' '.join(command)}\n"
            f"{result.stderr.strip()}"
        )
    return result.stdout


def iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def day_of(value: str | None) -> str | None:
    parsed = parse_iso(value)
    return parsed.date().isoformat() if parsed else None


def hours_between(start: str | None, end: str | None) -> float | None:
    left, right = parse_iso(start), parse_iso(end)
    if not left or not right:
        return None
    return max(0.0, (right - left).total_seconds() / 3600)


def percentile(values: Iterable[float], probability: float) -> float | None:
    data = sorted(values)
    if not data:
        return None
    if len(data) == 1:
        return data[0]
    position = (len(data) - 1) * probability
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return data[lower]
    return data[lower] + (data[upper] - data[lower]) * (position - lower)


def integration_ref(repo: Path) -> str:
    symbolic = subprocess.run(
        ["git", "symbolic-ref", "--short", "refs/remotes/origin/HEAD"],
        cwd=repo,
        text=True,
        encoding="utf-8",
        errors="replace",
        capture_output=True,
        check=False,
    )
    if symbolic.returncode == 0 and symbolic.stdout.strip():
        return symbolic.stdout.strip()
    for candidate in ("origin/main", "main", "HEAD"):
        probe = subprocess.run(
            ["git", "rev-parse", "--verify", candidate],
            cwd=repo,
            capture_output=True,
            check=False,
        )
        if probe.returncode == 0:
            return candidate
    raise RuntimeError(f"No integration ref found in {repo}")


def collect_git_repo(name: str, repo: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    if not (repo / ".git").exists():
        raise FileNotFoundError(f"Repository not found: {repo}")
    ref = integration_ref(repo)
    marker = "@@@"
    log = run(
        [
            "git",
            "log",
            ref,
            "--date=iso-strict",
            "--numstat",
            "--format=" + marker + "%H%x1f%aI%x1f%cI%x1f%P%x1f%s",
        ],
        cwd=repo,
    )
    commits: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for raw in log.splitlines():
        if raw.startswith(marker):
            if current:
                commits.append(current)
            parts = raw[len(marker) :].split("\x1f", 4)
            current = {
                "repository": name,
                "integration_ref": ref,
                "commit": parts[0],
                "author_time": parts[1],
                "commit_time": parts[2],
                "parent_count": len(parts[3].split()) if parts[3] else 0,
                "subject": parts[4] if len(parts) > 4 else "",
                "issue_ids": sorted(set(ISSUE_RE.findall(parts[4] if len(parts) > 4 else ""))),
                "additions": 0,
                "deletions": 0,
                "files_changed": 0,
                "binary_files": 0,
            }
            continue
        if current and raw.strip():
            parts = raw.split("\t", 2)
            if len(parts) == 3:
                current["files_changed"] += 1
                if parts[0] == "-" or parts[1] == "-":
                    current["binary_files"] += 1
                else:
                    current["additions"] += int(parts[0])
                    current["deletions"] += int(parts[1])
    if current:
        commits.append(current)

    cloc_raw = run(
        [
            "cloc",
            "--vcs=git",
            "--json",
            "--quiet",
            "--exclude-dir=.git,node_modules,.state,.next,dist,build,coverage,.turbo",
            str(repo),
        ]
    )
    cloc = json.loads(cloc_raw)
    languages = []
    for language, values in cloc.items():
        if language in {"header", "SUM"} or not isinstance(values, dict):
            continue
        languages.append(
            {
                "language": language,
                "files": int(values.get("nFiles", 0)),
                "blank": int(values.get("blank", 0)),
                "comment": int(values.get("comment", 0)),
                "code": int(values.get("code", 0)),
            }
        )
    summary = {
        "repository": name,
        "path": str(repo),
        "integration_ref": ref,
        "head_branch": run(["git", "branch", "--show-current"], cwd=repo).strip(),
        "head_commit": run(["git", "rev-parse", "HEAD"], cwd=repo).strip(),
        "integration_commit": run(["git", "rev-parse", ref], cwd=repo).strip(),
        "commit_count": len(commits),
        "first_commit": commits[-1]["author_time"] if commits else None,
        "last_commit": commits[0]["author_time"] if commits else None,
        "cloc": {
            "files": int(cloc.get("SUM", {}).get("nFiles", 0)),
            "code": int(cloc.get("SUM", {}).get("code", 0)),
            "comment": int(cloc.get("SUM", {}).get("comment", 0)),
            "blank": int(cloc.get("SUM", {}).get("blank", 0)),
            "languages": sorted(languages, key=lambda item: item["code"], reverse=True),
        },
    }
    return commits, summary


def snapshot_usage_db(source: Path, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        destination.unlink()
    source_db = sqlite3.connect(f"file:{source.as_posix()}?mode=ro", uri=True)
    target_db = sqlite3.connect(destination)
    try:
        source_db.backup(target_db)
    finally:
        target_db.close()
        source_db.close()


def collect_usage(state_root: Path, lake: Path) -> dict[str, Any]:
    source_db = state_root / "metrics" / "usage.db"
    snapshot_db = lake / "raw" / "usage" / "usage.sqlite"
    snapshot_usage_db(source_db, snapshot_db)
    connection = sqlite3.connect(snapshot_db)
    connection.row_factory = sqlite3.Row
    events = [dict(row) for row in connection.execute("select * from usage_events order by ts_ms")]
    docs = [dict(row) for row in connection.execute("select * from schema_docs order by table_name,column_name")]
    connection.close()
    for event in events:
        event["timestamp"] = datetime.fromtimestamp(
            event["ts_ms"] / 1000, timezone.utc
        ).isoformat()
        event["day"] = event["timestamp"][:10]
    usage_fields = [
        "id",
        "ts_ms",
        "timestamp",
        "day",
        "env",
        "source",
        "persona",
        "target",
        "issue_id",
        "model",
        "subtype",
        "num_turns",
        "duration_ms",
        "cost_usd",
        "input_tokens",
        "output_tokens",
        "cache_read_tokens",
        "cache_creation_tokens",
        "is_error",
        "limit_hit",
    ]
    write_csv(lake / "normalized" / "usage_events.csv", events, usage_fields)
    write_json(lake / "normalized" / "usage_schema_docs.json", docs)

    gates: list[dict[str, Any]] = []
    steps: list[dict[str, Any]] = []
    raw_gate_root = lake / "raw" / "usage" / "gates"
    for result_path in sorted((state_root / "gate-logs").rglob("validation-result.json")):
        payload = read_json(result_path)
        relative_run = result_path.parent.name
        raw_copy = raw_gate_root / relative_run / "validation-result.json"
        raw_copy.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(result_path, raw_copy)
        gates.append(
            {
                "run_id": relative_run,
                "schema_version": payload.get("schemaVersion"),
                "job_id": payload.get("jobId"),
                "issue_id": payload.get("issueId"),
                "branch": payload.get("branch"),
                "target": payload.get("target"),
                "timestamp": payload.get("timestamp"),
                "day": day_of(payload.get("timestamp")),
                "overall": payload.get("overall"),
                "step_count": len(payload.get("steps") or []),
            }
        )
        for step in payload.get("steps") or []:
            steps.append(
                {
                    "run_id": relative_run,
                    "issue_id": payload.get("issueId"),
                    "timestamp": payload.get("timestamp"),
                    "day": day_of(payload.get("timestamp")),
                    "name": step.get("name"),
                    "status": step.get("status"),
                    "exit_code": step.get("exitCode"),
                    "duration_ms": step.get("durationMs"),
                }
            )
    write_csv(
        lake / "normalized" / "gate_runs.csv",
        gates,
        [
            "run_id",
            "schema_version",
            "job_id",
            "issue_id",
            "branch",
            "target",
            "timestamp",
            "day",
            "overall",
            "step_count",
        ],
    )
    write_csv(
        lake / "normalized" / "gate_steps.csv",
        steps,
        [
            "run_id",
            "issue_id",
            "timestamp",
            "day",
            "name",
            "status",
            "exit_code",
            "duration_ms",
        ],
    )

    ci_source = state_root / ".ci-events.jsonl"
    ci_rows: list[dict[str, Any]] = []
    if ci_source.exists():
        shutil.copy2(ci_source, lake / "raw" / "usage" / "ci-events.jsonl")
        for line in ci_source.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            event = json.loads(line)
            timestamp = datetime.fromtimestamp(
                event.get("ts_ms", 0) / 1000, timezone.utc
            ).isoformat()
            ci_rows.append(
                {
                    "ts_ms": event.get("ts_ms"),
                    "timestamp": timestamp,
                    "day": timestamp[:10],
                    "kind": event.get("kind"),
                    "severity": event.get("severity"),
                    "branch": event.get("branch"),
                    "target": event.get("target"),
                    "issue_id": event.get("issue_id"),
                    "divergence": bool(event.get("divergence")),
                    "failed_check_count": len(event.get("failed_checks") or []),
                    "smoke_failed_count": len(event.get("smoke_failed") or []),
                }
            )
    write_csv(
        lake / "normalized" / "ci_events.csv",
        ci_rows,
        [
            "ts_ms",
            "timestamp",
            "day",
            "kind",
            "severity",
            "branch",
            "target",
            "issue_id",
            "divergence",
            "failed_check_count",
            "smoke_failed_count",
        ],
    )
    return {
        "usage_events": len(events),
        "gate_runs": len(gates),
        "gate_steps": len(steps),
        "ci_events": len(ci_rows),
    }


def collect(config: dict[str, Any]) -> None:
    lake = Path(config["lake_root"]).resolve()
    lake.mkdir(parents=True, exist_ok=True)
    for relative in ("raw/linear", "raw/usage", "raw/git", "normalized", "derived", "outputs", "manifests"):
        (lake / relative).mkdir(parents=True, exist_ok=True)
    usage_summary = collect_usage(Path(config["state_root"]).resolve(), lake)
    all_commits: list[dict[str, Any]] = []
    repo_summaries: list[dict[str, Any]] = []
    for item in config["repositories"]:
        commits, summary = collect_git_repo(item["name"], Path(item["path"]).resolve())
        all_commits.extend(commits)
        repo_summaries.append(summary)
        write_json(lake / "raw" / "git" / f"{item['name']}-summary.json", summary)
    write_csv(
        lake / "normalized" / "git_commits.csv",
        [
            {**row, "issue_ids": ";".join(row["issue_ids"])}
            for row in sorted(all_commits, key=lambda value: value["author_time"])
        ],
        [
            "repository",
            "integration_ref",
            "commit",
            "author_time",
            "commit_time",
            "parent_count",
            "subject",
            "issue_ids",
            "additions",
            "deletions",
            "files_changed",
            "binary_files",
        ],
    )
    write_json(lake / "normalized" / "repositories.json", repo_summaries)
    manifest = build_manifest(lake)
    manifest["collection"] = {
        "generated_at": iso_now(),
        "usage": usage_summary,
        "git_commits": len(all_commits),
        "repositories": len(repo_summaries),
        "linear_snapshot_present": (lake / "raw" / "linear" / "issues.json").exists(),
    }
    write_json(lake / "manifests" / "collection.json", manifest)
    print(json.dumps(manifest["collection"], indent=2))


def build_manifest(lake: Path) -> dict[str, Any]:
    rows = []
    for path in sorted(lake.rglob("*")):
        if not path.is_file() or path.parent == lake / "manifests":
            continue
        rows.append(
            {
                "path": path.relative_to(lake).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": sha256(path),
                "modified_at": datetime.fromtimestamp(
                    path.stat().st_mtime, timezone.utc
                ).isoformat(),
            }
        )
    dataset_specs = {
        "normalized/usage_events.csv": ("usage SQLite snapshot", "usage-event/v1"),
        "normalized/git_commits.csv": ("Git integration refs", "git-commit/v1"),
        "normalized/gate_runs.csv": ("structured validation results", "gate-run/v1"),
        "normalized/gate_steps.csv": ("structured validation results", "gate-step/v1"),
        "normalized/ci_events.csv": ("squad CI event log", "ci-event/v1"),
        "normalized/repositories.json": ("Git and cloc snapshots", "repository-snapshot/v1"),
        "raw/linear/issues.json": ("authenticated Linear export", "linear-issue/v1"),
        "derived/report-data.json": ("normalized evidence model", "report-data/v1"),
    }
    datasets = []
    by_path = {row["path"]: row for row in rows}
    for relative, (source, schema) in dataset_specs.items():
        path = lake / relative
        if not path.exists():
            continue
        if path.suffix == ".csv":
            records = len(read_csv(path))
        else:
            payload = read_json(path)
            records = len(payload) if isinstance(payload, list) else len(payload.get("issues", [])) or 1
        datasets.append({
            "path": relative,
            "source_identity": source,
            "extracted_at": by_path[relative]["modified_at"],
            "dataset_schema": schema,
            "records": records,
            "sha256": by_path[relative]["sha256"],
        })
    return {"schema_version": 2, "files": rows, "datasets": datasets}


def phase_for(day: str | None, phases: list[dict[str, Any]]) -> str | None:
    if not day:
        return None
    for phase in phases:
        if phase["start"] <= day <= phase["end"]:
            return phase["id"]
    return None


def numeric(row: dict[str, str], key: str) -> float:
    value = row.get(key)
    if value in (None, ""):
        return 0.0
    return float(value)


def aggregate_daily(
    issues: list[dict[str, Any]],
    commits: list[dict[str, str]],
    usage: list[dict[str, str]],
    gates: list[dict[str, str]],
) -> list[dict[str, Any]]:
    days: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "issues_created": 0,
            "issues_started": 0,
            "issues_completed": 0,
            "review_proxy_completed": 0,
            "commits": 0,
            "merge_commits": 0,
            "additions": 0,
            "deletions": 0,
            "files_changed": 0,
            "token_events": 0,
            "tokens": 0,
            "input_output_tokens": 0,
            "usage_errors": 0,
            "duration_hours": 0,
            "gate_runs": 0,
            "gate_passes": 0,
        }
    )
    for issue in issues:
        created = day_of(issue.get("createdAt"))
        started = day_of(issue.get("startedAt"))
        completed = day_of(issue.get("completedAt"))
        if created:
            days[created]["issues_created"] += 1
        if started:
            days[started]["issues_started"] += 1
        if completed:
            days[completed]["issues_completed"] += 1
            if REVIEW_RE.search(issue.get("title") or ""):
                days[completed]["review_proxy_completed"] += 1
    for commit in commits:
        day = day_of(commit.get("author_time"))
        if not day:
            continue
        days[day]["commits"] += 1
        days[day]["merge_commits"] += int(numeric(commit, "parent_count") > 1)
        for key in ("additions", "deletions", "files_changed"):
            days[day][key] += int(numeric(commit, key))
    for event in usage:
        day = event.get("day")
        if not day:
            continue
        days[day]["token_events"] += 1
        total = sum(
            int(numeric(event, key))
            for key in (
                "input_tokens",
                "output_tokens",
                "cache_read_tokens",
                "cache_creation_tokens",
            )
        )
        days[day]["tokens"] += total
        days[day]["input_output_tokens"] += int(numeric(event, "input_tokens")) + int(
            numeric(event, "output_tokens")
        )
        days[day]["usage_errors"] += int(numeric(event, "is_error"))
        days[day]["duration_hours"] += numeric(event, "duration_ms") / 3_600_000
    for gate in gates:
        day = gate.get("day")
        if not day:
            continue
        days[day]["gate_runs"] += 1
        overall = (gate.get("overall") or "").lower()
        days[day]["gate_passes"] += int(overall in {"pass", "passed", "success", "ok"})
    if days:
        current = date.fromisoformat(min(days))
        finish = date.fromisoformat(max(days))
        while current <= finish:
            days[current.isoformat()]
            current = date.fromordinal(current.toordinal() + 1)
    return [{"day": key, **days[key]} for key in sorted(days)]


def compute_peak_wip(
    issues: list[dict[str, Any]], start: str, end: str
) -> tuple[int, float]:
    current = date.fromisoformat(start)
    finish = date.fromisoformat(end)
    samples = []
    while current <= finish:
        point = current.isoformat()
        count = 0
        for issue in issues:
            started = day_of(issue.get("startedAt"))
            completed = day_of(issue.get("completedAt"))
            canceled = day_of(issue.get("canceledAt"))
            stop = completed or canceled
            if started and started <= point and (not stop or stop > point):
                count += 1
        samples.append(count)
        current = date.fromordinal(current.toordinal() + 1)
    return (max(samples) if samples else 0, statistics.mean(samples) if samples else 0)


def summarize_phases(
    phases: list[dict[str, Any]],
    issues: list[dict[str, Any]],
    commits: list[dict[str, str]],
    usage: list[dict[str, str]],
    gates: list[dict[str, str]],
) -> list[dict[str, Any]]:
    result = []
    for phase in phases:
        phase_id = phase["id"]
        completed = [
            issue
            for issue in issues
            if phase_for(day_of(issue.get("completedAt")), phases) == phase_id
        ]
        cycle = [
            value
            for value in (
                hours_between(issue.get("startedAt"), issue.get("completedAt"))
                for issue in completed
            )
            if value is not None
        ]
        lead = [
            value
            for value in (
                hours_between(issue.get("createdAt"), issue.get("completedAt"))
                for issue in completed
            )
            if value is not None
        ]
        phase_commits = [
            commit
            for commit in commits
            if phase_for(day_of(commit.get("author_time")), phases) == phase_id
        ]
        phase_usage = [
            event for event in usage if phase_for(event.get("day"), phases) == phase_id
        ]
        worker_usage = [event for event in phase_usage if event.get("source") == "worker"]
        phase_gates = [
            gate for gate in gates if phase_for(gate.get("day"), phases) == phase_id
        ]
        linked_usage_issues = {
            event.get("issue_id")
            for event in phase_usage
            if event.get("issue_id") and event.get("source") == "worker"
        }
        tokens = sum(
            sum(
                int(numeric(event, key))
                for key in (
                    "input_tokens",
                    "output_tokens",
                    "cache_read_tokens",
                    "cache_creation_tokens",
                )
            )
            for event in phase_usage
        )
        worker_tokens = sum(
            sum(
                int(numeric(event, key))
                for key in (
                    "input_tokens",
                    "output_tokens",
                    "cache_read_tokens",
                    "cache_creation_tokens",
                )
            )
            for event in worker_usage
        )
        worker_io_tokens = sum(
            int(numeric(event, "input_tokens"))
            + int(numeric(event, "output_tokens"))
            for event in worker_usage
        )
        peak_wip, mean_wip = compute_peak_wip(issues, phase["start"], phase["end"])
        days = date.fromisoformat(phase["end"]).toordinal() - date.fromisoformat(
            phase["start"]
        ).toordinal() + 1
        active_days = len(
            {
                *(day_of(item.get("completedAt")) for item in completed),
                *(day_of(item.get("author_time")) for item in phase_commits),
                *(item.get("day") for item in phase_usage),
            }
            - {None}
        )
        passes = sum(
            (gate.get("overall") or "").lower() in {"pass", "passed", "success", "ok"}
            for gate in phase_gates
        )
        result.append(
            {
                **phase,
                "calendar_days": days,
                "active_days": active_days,
                "issues_completed": len(completed),
                "issues_per_active_day": round(len(completed) / active_days, 2)
                if active_days
                else None,
                "issues_per_calendar_day": round(len(completed) / days, 2),
                "review_proxy_completed": sum(
                    bool(REVIEW_RE.search(issue.get("title") or ""))
                    for issue in completed
                ),
                "review_proxy_share": round(
                    sum(bool(REVIEW_RE.search(issue.get("title") or "")) for issue in completed)
                    / len(completed),
                    4,
                )
                if completed
                else None,
                "cycle_n": len(cycle),
                "cycle_median_hours": round(statistics.median(cycle), 2)
                if cycle
                else None,
                "cycle_p80_hours": round(percentile(cycle, 0.8), 2) if cycle else None,
                "lead_n": len(lead),
                "lead_median_hours": round(statistics.median(lead), 2) if lead else None,
                "commits": len(phase_commits),
                "commits_per_completed_issue": round(
                    len(phase_commits) / len(completed), 2
                )
                if completed
                else None,
                "additions": sum(int(numeric(item, "additions")) for item in phase_commits),
                "deletions": sum(int(numeric(item, "deletions")) for item in phase_commits),
                "files_changed": sum(
                    int(numeric(item, "files_changed")) for item in phase_commits
                ),
                "churn_per_completed_issue": round(
                    sum(
                        int(numeric(item, "additions"))
                        + int(numeric(item, "deletions"))
                        for item in phase_commits
                    )
                    / len(completed),
                    1,
                )
                if completed
                else None,
                "files_per_completed_issue": round(
                    sum(int(numeric(item, "files_changed")) for item in phase_commits)
                    / len(completed),
                    1,
                )
                if completed
                else None,
                "tokens": tokens,
                "usage_events": len(phase_usage),
                "usage_errors": sum(int(numeric(item, "is_error")) for item in phase_usage),
                "usage_error_rate": round(
                    sum(int(numeric(item, "is_error")) for item in phase_usage)
                    / len(phase_usage),
                    4,
                )
                if phase_usage
                else None,
                "worker_issue_n": len(linked_usage_issues),
                "worker_tokens": worker_tokens,
                "worker_io_tokens": worker_io_tokens,
                "tokens_per_worker_issue": round(
                    worker_tokens / len(linked_usage_issues)
                )
                if linked_usage_issues
                else None,
                "io_tokens_per_worker_issue": round(
                    worker_io_tokens / len(linked_usage_issues)
                )
                if linked_usage_issues
                else None,
                "gate_runs": len(phase_gates),
                "gate_pass_rate": round(passes / len(phase_gates), 4)
                if phase_gates
                else None,
                "wip_peak": peak_wip,
                "wip_mean": round(mean_wip, 2),
            }
        )
    return result


def repository_summary(
    repositories: list[dict[str, Any]], commits: list[dict[str, str]]
) -> list[dict[str, Any]]:
    result = []
    for repo in repositories:
        repo_commits = [row for row in commits if row["repository"] == repo["repository"]]
        issue_ids = {
            issue
            for row in repo_commits
            for issue in (row.get("issue_ids") or "").split(";")
            if issue
        }
        active_days = {day_of(row.get("author_time")) for row in repo_commits} - {None}
        result.append(
            {
                "repository": repo["repository"],
                "integration_ref": repo["integration_ref"],
                "first_commit": repo["first_commit"],
                "last_commit": repo["last_commit"],
                "commits": len(repo_commits),
                "non_merge_commits": sum(
                    int(numeric(row, "parent_count") <= 1) for row in repo_commits
                ),
                "active_days": len(active_days),
                "issue_linked_commits": sum(bool(row.get("issue_ids")) for row in repo_commits),
                "linked_issue_count": len(issue_ids),
                "additions": sum(int(numeric(row, "additions")) for row in repo_commits),
                "deletions": sum(int(numeric(row, "deletions")) for row in repo_commits),
                "files_changed": sum(
                    int(numeric(row, "files_changed")) for row in repo_commits
                ),
                "code_lines": repo["cloc"]["code"],
                "code_files": repo["cloc"]["files"],
                "top_languages": repo["cloc"]["languages"][:5],
            }
        )
    return result


def build_cycle_distribution(issues: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets = [
        ("<1 óra", 0, 1),
        ("1–4 óra", 1, 4),
        ("4–12 óra", 4, 12),
        ("12–24 óra", 12, 24),
        ("1–3 nap", 24, 72),
        ("3–7 nap", 72, 168),
        (">7 nap", 168, math.inf),
    ]
    counts = Counter()
    for issue in issues:
        value = hours_between(issue.get("startedAt"), issue.get("completedAt"))
        if value is None:
            continue
        for label, lower, upper in buckets:
            if lower <= value < upper:
                counts[label] += 1
                break
    return [{"bucket": label, "count": counts[label]} for label, _, _ in buckets]


def hypothesis_results(phases: list[dict[str, Any]]) -> list[dict[str, Any]]:
    lookup = {phase["id"]: phase for phase in phases}
    baseline = lookup["baseline"]
    governed = lookup["governed"]
    instrumented = lookup["instrumented"]

    def change(old: float | None, new: float | None) -> float | None:
        if old in (None, 0) or new is None:
            return None
        return round((new - old) / old * 100, 1)

    cycle_delta = change(
        baseline.get("cycle_median_hours"), governed.get("cycle_median_hours")
    )
    closure_delta = change(
        baseline.get("issues_per_calendar_day"), governed.get("issues_per_calendar_day")
    )
    review_delta = change(
        baseline.get("review_proxy_share"), governed.get("review_proxy_share")
    )
    p80_delta = change(
        baseline.get("cycle_p80_hours"), governed.get("cycle_p80_hours")
    )
    churn_per_issue_delta = change(
        baseline.get("churn_per_completed_issue"),
        governed.get("churn_per_completed_issue"),
    )
    token_delta = change(
        instrumented.get("tokens_per_worker_issue"),
        governed.get("tokens_per_worker_issue"),
    )
    return [
        {
            "id": "H1",
            "title": "A szabályozottabb működés mellett rövidülhet és kiszámíthatóbbá válhat az átfutási idő.",
            "verdict": "vegyes" if cycle_delta is not None and p80_delta is not None else "nem mérhető",
            "support": (
                f"A medián ciklusidő változása a korai és a szabályozott fázis között "
                f"{cycle_delta:+.1f}%, a 80. percentilisé {p80_delta:+.1f}%." if cycle_delta is not None and p80_delta is not None else
                "A két fázis ciklusideje nem hasonlítható össze teljesen."
            ),
            "counter": "A fázisokban eltérnek a feladattípusok, a repository-k érettsége és az adatok lefedettsége, ezért oksági kapcsolat nem állapítható meg.",
            "sample": f"n={baseline['cycle_n']} és n={governed['cycle_n']} lezárt issue, ismert kezdési idővel",
            "next_test": "Harmincnapos ismételt mérés azonos feladattípusokkal és előre rögzített méretkategóriákkal.",
        },
        {
            "id": "H2",
            "title": "A több lezárás nem pusztán a nagyobb kódváltozás következménye.",
            "verdict": "nem mérhető",
            "support": (
                f"A naptári napra jutó lezárások száma {closure_delta:+.1f}%-kal változott; "
                f"közben az egy lezárásra jutó kódváltozás {churn_per_issue_delta:+.1f}%."
                if closure_delta is not None and churn_per_issue_delta is not None
                else "A lezárási ütem és a kódváltozás nem hasonlítható össze teljesen."
            ),
            "counter": "Az issue-k utólagos, tömeges lezárása felfújhatja ezt az értéket. Az issue-k méretét és üzleti eredményét nem pontoztuk, ezért a tényleges teljesítményváltozás nem állapítható meg.",
            "sample": f"{governed['commits']} commit az integrációs ágakon a szabályozott fázisban",
            "next_test": "Minden issue-hoz előre rögzített bonyolultsági és eredménypontszám, majd ezekkel korrigált lezárási ütem.",
        },
        {
            "id": "H3",
            "title": "Ha a review korábbra kerül, csökkenhet a későbbi javítások száma.",
            "verdict": "vegyes" if review_delta is not None else "nem mérhető",
            "support": (
                f"A review-ra vagy visszajavításra utaló címek aránya {review_delta:+.1f}%-kal változott."
                if review_delta is not None
                else "Csak a későbbi fázisban áll rendelkezésre elegendő review-ra utaló adat."
            ),
            "counter": "A címekből képzett mutató azt is jelezheti, hogy a review-k dokumentálása javult. A kiadás utáni hibák és újranyitások története nem teljes.",
            "sample": f"{baseline['review_proxy_completed']} és {governed['review_proxy_completed']} review-ra utaló lezárás",
            "next_test": "Kötelező kapcsolat a findingek és az újranyitások között, valamint 7 és 30 napos utánkövetés minden lezárásnál.",
        },
        {
            "id": "H4",
            "title": "A párhuzamos munka eredményessége függhet a folyamatban lévő feladatok számától.",
            "verdict": "nem mérhető",
            "support": f"A szabályozott fázisban naponta átlagosan {governed['wip_mean']:.1f}, legfeljebb {governed['wip_peak']} issue volt folyamatban.",
            "counter": "Nincs megbízható korábbi viszonyítási alap, és a worktree-foglalások kezdete és vége sem áll rendelkezésre egységes adatsorként.",
            "sample": f"{governed['calendar_days']} naptári nap",
            "next_test": "A worktree-foglalások kezdő- és végidőpontjának, valamint sávonként a várakozási és aktív időnek a kötelező naplózása.",
        },
        {
            "id": "H5",
            "title": "Kevesebb token kell egy issue ellenőrzött lezárásához.",
            "verdict": (
                "támogatott jel" if token_delta is not None and token_delta <= -10
                else "nem támogatott" if token_delta is not None and token_delta >= 10
                else "vegyes" if token_delta is not None
                else "nem mérhető"
            ),
            "support": (
                f"Az issue-hoz kapcsolt ágensfuttatások tokenfelhasználása issue-nként {token_delta:+.1f}%-kal változott a mért "
                "és a szabályozott fázis között. A negatív érték a hipotézis szempontjából kedvező, a pozitív kedvezőtlen irányt jelez."
                if token_delta is not None
                else "Az issue-hoz kötött worker-eseményekből nem számítható megbízható összehasonlítás."
            ),
            "counter": "A gyorsítótár tokenjei adják a forgalom nagy részét, közben megváltozott az események összetétele, és a tokenmennyiség nem azonos az elkészült értékkel.",
            "sample": f"n={instrumented['worker_issue_n']} és n={governed['worker_issue_n']} worker-eseményhez kapcsolt issue",
            "next_test": "Egységes eredménymérték, a gyorsítótár és a közvetlen tokenek külön kezelése, valamint azonos feladattípusok összevetése.",
        },
    ]


def source_inventory(
    issues: list[dict[str, Any]],
    commits: list[dict[str, str]],
    usage: list[dict[str, str]],
    gates: list[dict[str, str]],
    repositories: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    completed = [row for row in issues if row.get("completedAt")]
    return [
        {
            "source": "Linear",
            "records": len(issues),
            "coverage": f"{min(row['createdAt'] for row in issues)} – {max(row['updatedAt'] for row in issues)}",
            "join_key": "WEN-n issue-azonosító",
            "missingness": f"{len(completed)} lezárt; {sum(not row.get('startedAt') for row in completed)} lezárt sornál hiányzik a startedAt",
            "privacy": "A belső címek, felelősök és URL-ek a belső adattárban maradnak.",
        },
        {
            "source": "Használati adatok",
            "records": len(usage),
            "coverage": f"{min(row['timestamp'] for row in usage)} – {max(row['timestamp'] for row in usage)}" if usage else "nincs adat",
            "join_key": "issue_id, ha az esemény forrása worker",
            "missingness": f"{sum(not row.get('issue_id') for row in usage)} eseményhez nincs issue_id; vannak naptári hézagok",
            "privacy": "A modell, persona, költség és issue-kapcsolat belső adat.",
        },
        {
            "source": "Git integrációs ágak",
            "records": len(commits),
            "coverage": f"{min(row['author_time'] for row in commits)} – {max(row['author_time'] for row in commits)}",
            "join_key": "A commit tárgyából kinyert WEN-n",
            "missingness": f"{sum(not row.get('issue_ids') for row in commits)} commit tárgyában nincs issue-azonosító",
            "privacy": "A commit tárgya belső marad; a riport csak aggregátumot használ.",
        },
        {
            "source": "Strukturált ellenőrzések",
            "records": len(gates),
            "coverage": f"{min((row.get('timestamp') or '') for row in gates)} – {max((row.get('timestamp') or '') for row in gates)}" if gates else "nincs adat",
            "join_key": "issue_id / branch, ahol elérhető",
            "missingness": f"{sum(not row.get('issue_id') for row in gates)} gate futásnál hiányzik az issue_id",
            "privacy": "A nyers branch-, job- és parancsadat belső marad.",
        },
        {
            "source": "cloc pillanatfelvételek",
            "records": len(repositories),
            "coverage": "Aktuális pillanatfelvétel repónként, módosítatlan munkafából",
            "join_key": "repository-név",
            "missingness": "Csak az aktuális állapotot mutatja; a generált és a Git által nem követett fájlok kimaradnak.",
            "privacy": "Csak nyelv-, fájl- és soraggregátum kerül a riportba.",
        },
    ]


def analyze(config: dict[str, Any]) -> None:
    lake = Path(config["lake_root"]).resolve()
    linear_payload = read_json(lake / "raw" / "linear" / "issues.json")
    issues = linear_payload["issues"]
    commits = read_csv(lake / "normalized" / "git_commits.csv")
    usage = read_csv(lake / "normalized" / "usage_events.csv")
    gates = read_csv(lake / "normalized" / "gate_runs.csv")
    repositories = read_json(lake / "normalized" / "repositories.json")
    phases = read_json(ROOT / "config" / "phases.json")
    external = read_json(ROOT / "config" / "external-evidence.json")

    daily = aggregate_daily(issues, commits, usage, gates)
    phase_rows = summarize_phases(phases, issues, commits, usage, gates)
    repo_rows = repository_summary(repositories, commits)
    completed = [issue for issue in issues if issue.get("completedAt")]
    tokens = sum(
        sum(
            int(numeric(row, key))
            for key in (
                "input_tokens",
                "output_tokens",
                "cache_read_tokens",
                "cache_creation_tokens",
            )
        )
        for row in usage
    )
    cache_tokens = sum(
        int(numeric(row, "cache_read_tokens"))
        + int(numeric(row, "cache_creation_tokens"))
        for row in usage
    )
    gate_passes = sum(
        (row.get("overall") or "").lower() in {"pass", "passed", "success", "ok"}
        for row in gates
    )
    report = {
        "schema_version": 1,
        "generated_at": iso_now(),
        "title": "Wenova AI-fejlesztés: mérhetőbb lett-e a működés?",
        "subtitle": "Belső mérések és külső kutatási eredmények",
        "kpis": {
            "linear_issues": len(issues),
            "completed_issues": len(completed),
            "repositories": len(repositories),
            "integration_commits": len(commits),
            "code_lines": sum(row["cloc"]["code"] for row in repositories),
            "usage_events": len(usage),
            "total_tokens": tokens,
            "cache_share": round(cache_tokens / tokens, 4) if tokens else None,
            "gate_runs": len(gates),
            "gate_pass_rate": round(gate_passes / len(gates), 4) if gates else None,
        },
        "coverage": {
            "linear": {
                "start": min(row["createdAt"] for row in issues),
                "end": max(row["updatedAt"] for row in issues),
            },
            "usage": {
                "start": min(row["timestamp"] for row in usage),
                "end": max(row["timestamp"] for row in usage),
                "active_days": len({row["day"] for row in usage}),
            }
            if usage
            else None,
            "git": {
                "start": min(row["author_time"] for row in commits),
                "end": max(row["author_time"] for row in commits),
            },
        },
        "phases": phase_rows,
        "daily": daily,
        "repositories": repo_rows,
        "cycle_distribution": build_cycle_distribution(issues),
        "hypotheses": hypothesis_results(phase_rows),
        "external_evidence": external,
        "source_inventory": source_inventory(
            issues, commits, usage, gates, repositories
        ),
        "data_quality": [
            "A fázisok naptári időszakok, nem randomizált kísérleti csoportok; közben a repository-k és a feladattípusok összetétele is változik.",
            f"A használati adatok csak {len({row['day'] for row in usage})} aktív napot fednek le, ezért a tokenek időbeli alakulása hiányos.",
            f"A {len(usage)} használati eseményből {sum(not row.get('issue_id') for row in usage)} nem kapcsolható issue-hoz.",
            f"A gyorsítótár tokenjei a teljes tokenforgalom {cache_tokens / tokens:.1%}-át adják, ezért ezeket külön kell értelmezni a közvetlen be- és kimeneti tokenektől.",
            "A címekből képzett review-mutató a dokumentálás javulását is jelezheti, nem csak a hibák számának változását.",
            "A cloc a jelenlegi állapotot mutatja, a Git pedig a történeti sorváltozásokat; a kettő nem adható össze.",
        ],
        "method_notes": [
            "Megfigyelt együttjárásokat mutatunk be, nem állítunk oksági kapcsolatot.",
            "Csak az integrációs ágak commitjait mérjük; a még nem integrált branchek változásai kimaradnak.",
            "A bináris fájlokat érintett fájlként számoljuk, módosított sorként nem.",
            "A nyilvános kutatások más feladatokat, résztvevőket és AI-használatot vizsgálnak, ezért csak összehasonlítási keretet adnak.",
        ],
    }
    write_json(lake / "derived" / "report-data.json", report)
    manifest = build_manifest(lake)
    manifest["analysis"] = {
        "generated_at": report["generated_at"],
        "issues": len(issues),
        "commits": len(commits),
        "usage_events": len(usage),
        "gate_runs": len(gates),
        "external_sources": len(external),
    }
    write_json(lake / "manifests" / "analysis.json", manifest)
    print(json.dumps(manifest["analysis"], indent=2))


def build_site(config: dict[str, Any]) -> None:
    lake = Path(config["lake_root"]).resolve()
    report = read_json(lake / "derived" / "report-data.json")
    destination = lake / "outputs" / "site"
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    for name in ("index.html", "styles.css", "app.js"):
        shutil.copy2(ROOT / "web" / name, destination / name)
    data_js = "window.WENOVA_EVIDENCE = " + json.dumps(
        report, ensure_ascii=False, separators=(",", ":")
    ) + ";\n"
    (destination / "data.js").write_text(data_js, encoding="utf-8")
    write_json(
        destination / "manifest.json",
        {
            "schema_version": 1,
            "generated_at": iso_now(),
            "files": ["index.html", "styles.css", "app.js", "data.js"],
            "deployment": "Upload this directory unchanged to any static host.",
        },
    )
    print(str(destination))


def validate(config: dict[str, Any]) -> None:
    """Reconcile normalized sources, report aggregates, and the portable site."""
    lake = Path(config["lake_root"]).resolve()
    issues_payload = read_json(lake / "raw" / "linear" / "issues.json")
    issues = issues_payload["issues"]
    usage = read_csv(lake / "normalized" / "usage_events.csv")
    commits = read_csv(lake / "normalized" / "git_commits.csv")
    gates = read_csv(lake / "normalized" / "gate_runs.csv")
    repositories = read_json(lake / "normalized" / "repositories.json")
    report = read_json(lake / "derived" / "report-data.json")
    site = lake / "outputs" / "site"

    errors: list[str] = []

    def check(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    kpis = report["kpis"]
    check(kpis["linear_issues"] == len(issues), "Linear issue count mismatch")
    check(
        kpis["completed_issues"] == sum(bool(row.get("completedAt")) for row in issues),
        "Completed issue count mismatch",
    )
    check(kpis["usage_events"] == len(usage), "Usage event count mismatch")
    check(kpis["integration_commits"] == len(commits), "Git commit count mismatch")
    check(kpis["gate_runs"] == len(gates), "Gate run count mismatch")
    check(kpis["repositories"] == len(repositories), "Repository count mismatch")
    check(
        kpis["code_lines"] == sum(row["cloc"]["code"] for row in repositories),
        "cloc total mismatch",
    )
    check(
        len(commits)
        == sum(int(row["commits"]) for row in report["repositories"]),
        "Repository commit subtotals do not reconcile",
    )
    check(
        len(issues_payload.get("issues", [])) == issues_payload.get("row_count"),
        "Linear snapshot row_count mismatch",
    )
    raw_db = lake / "raw" / "usage" / "usage.sqlite"
    with sqlite3.connect(raw_db) as connection:
        raw_usage_count = connection.execute("SELECT COUNT(*) FROM usage_events").fetchone()[0]
    check(raw_usage_count == len(usage), "Raw SQLite and normalized usage counts differ")
    normalized_tokens = sum(
        int(numeric(row, key))
        for row in usage
        for key in ("input_tokens", "output_tokens", "cache_read_tokens", "cache_creation_tokens")
    )
    check(normalized_tokens == kpis["total_tokens"], "Token components do not reconcile")
    check(
        sum(int(phase["issues_completed"]) for phase in report["phases"])
        == kpis["completed_issues"],
        "Phase completion subtotals do not reconcile",
    )
    check(
        sum(int(phase["gate_runs"]) for phase in report["phases"]) == len(gates),
        "Phase gate subtotals do not reconcile",
    )
    check(
        len(list((lake / "raw" / "usage" / "gates").glob("*/validation-result.json")))
        == len(gates),
        "Raw validation files and normalized gate runs differ",
    )
    direct_git_count = 0
    for repository in config["repositories"]:
        repo = Path(repository["path"])
        ref = integration_ref(repo)
        direct_git_count += int(run(["git", "rev-list", "--count", ref], cwd=repo).strip())
    check(direct_git_count == len(commits), "Direct Git ref counts do not reconcile")
    analysis_manifest = read_json(lake / "manifests" / "analysis.json")
    linear_dataset = next(
        row for row in analysis_manifest["datasets"] if row["path"] == "raw/linear/issues.json"
    )
    check(
        linear_dataset["sha256"] == sha256(lake / "raw" / "linear" / "issues.json"),
        "Linear export checksum differs from the analysis manifest",
    )

    required_site_files = {"index.html", "styles.css", "app.js", "data.js", "manifest.json"}
    check(site.is_dir(), "Portable site directory is missing")
    if site.is_dir():
        actual = {path.name for path in site.iterdir() if path.is_file()}
        check(required_site_files.issubset(actual), "Portable site file set is incomplete")
        html = (site / "index.html").read_text(encoding="utf-8")
        check('src="./data.js"' in html, "Site does not reference relative data.js")
        check('src="./app.js"' in html, "Site does not reference relative app.js")
        check('href="./styles.css"' in html, "Site does not reference relative styles.css")
        check("http://" not in html and "https://" not in html, "Site shell has a remote runtime dependency")

    result = {
        "validated_at": iso_now(),
        "status": "pass" if not errors else "fail",
        "checks": 22,
        "errors": errors,
        "reconciled": {
            "linear_issues": len(issues),
            "usage_events": len(usage),
            "integration_commits": len(commits),
            "gate_runs": len(gates),
            "repositories": len(repositories),
        },
    }
    write_json(lake / "manifests" / "validation.json", result)
    print(json.dumps(result, indent=2))
    if errors:
        raise RuntimeError("Evidence validation failed")


def load_config(path: str) -> dict[str, Any]:
    return read_json(Path(path).resolve())


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    for command in ("collect", "analyze", "build-site", "validate"):
        child = subparsers.add_parser(command)
        child.add_argument("--config", required=True)
    args = parser.parse_args()
    config = load_config(args.config)
    if args.command == "collect":
        collect(config)
    elif args.command == "analyze":
        analyze(config)
    elif args.command == "build-site":
        build_site(config)
    elif args.command == "validate":
        validate(config)
    return 0


if __name__ == "__main__":
    sys.exit(main())
