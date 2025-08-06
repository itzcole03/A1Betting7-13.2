import os

import pytest

from backend.services.real_time_analysis_engine import RealTimeAnalysisEngine


def test_load_business_rules_missing_file(tmp_path, caplog):
    engine = RealTimeAnalysisEngine()
    # Use a non-existent file
    missing_path = os.path.join(tmp_path, "no_such_file.yaml")
    engine._load_business_rules(missing_path)
    assert engine.business_rules == {"forbidden_combos": [], "allowed_stat_types": []}
    assert any("Failed to load business rules" in r for r in caplog.text.splitlines())


def test_load_business_rules_invalid_yaml(tmp_path, caplog):
    # Write invalid YAML
    bad_yaml = tmp_path / "bad.yaml"
    bad_yaml.write_text("not: [valid: yaml: [here]")
    engine = RealTimeAnalysisEngine()
    engine._load_business_rules(str(bad_yaml))
    assert engine.business_rules == {"forbidden_combos": [], "allowed_stat_types": []}
    assert any("Failed to load business rules" in r for r in caplog.text.splitlines())
