import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / "src" / "pipeline.py"
SPEC = importlib.util.spec_from_file_location("evidence_pipeline", MODULE_PATH)
PIPELINE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(PIPELINE)


class PipelineUnitTests(unittest.TestCase):
    def test_percentile_interpolates(self):
        self.assertEqual(PIPELINE.percentile([1, 2, 3, 4, 5], 0.8), 4.2)

    def test_phase_boundaries_are_inclusive(self):
        phases = [
            {"id": "first", "start": "2026-01-01", "end": "2026-01-02"},
            {"id": "second", "start": "2026-01-03", "end": "2026-01-04"},
        ]
        self.assertEqual(PIPELINE.phase_for("2026-01-02", phases), "first")
        self.assertEqual(PIPELINE.phase_for("2026-01-03", phases), "second")
        self.assertIsNone(PIPELINE.phase_for("2025-12-31", phases))

    def test_cycle_distribution_uses_completed_started_rows_only(self):
        issues = [
            {
                "startedAt": "2026-01-01T00:00:00Z",
                "completedAt": "2026-01-01T00:30:00Z",
            },
            {
                "startedAt": "2026-01-01T00:00:00Z",
                "completedAt": "2026-01-02T12:00:00Z",
            },
            {"startedAt": None, "completedAt": "2026-01-01T01:00:00Z"},
        ]
        result = {row["bucket"]: row["count"] for row in PIPELINE.build_cycle_distribution(issues)}
        self.assertEqual(result["<1 óra"], 1)
        self.assertEqual(result["1–3 nap"], 1)
        self.assertEqual(sum(result.values()), 2)

    def test_manifest_hashes_only_lake_relative_paths(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "raw").mkdir()
            (root / "raw" / "sample.json").write_text(
                json.dumps({"invented": True}), encoding="utf-8"
            )
            manifest = PIPELINE.build_manifest(root)
            self.assertEqual(manifest["files"][0]["path"], "raw/sample.json")
            self.assertEqual(len(manifest["files"][0]["sha256"]), 64)


class StaticSiteContractTests(unittest.TestCase):
    def setUp(self):
        self.web = Path(__file__).resolve().parents[1] / "web"

    def test_site_uses_only_relative_local_assets(self):
        html = (self.web / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="./styles.css"', html)
        self.assertIn('src="./data.js"', html)
        self.assertIn('src="./app.js"', html)
        self.assertNotIn("http://", html)
        self.assertNotIn("https://", html)

    def test_required_visual_targets_exist(self):
        html = (self.web / "index.html").read_text(encoding="utf-8")
        for target in (
            'id="daily-chart"',
            'id="cycle-chart"',
            'id="phase-multiples"',
            'id="repo-multiples"',
            'id="hypotheses"',
            'id="external-evidence"',
        ):
            self.assertIn(target, html)


if __name__ == "__main__":
    unittest.main()
