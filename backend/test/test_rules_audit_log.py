import json
import os

import pytest

from backend.services.real_time_analysis_engine import RealTimeAnalysisEngine


def test_audit_log_append_and_schema(tmp_path):
    # Setup: use a temp audit log file
    audit_log = tmp_path / "rules_audit_log.jsonl"
    engine = RealTimeAnalysisEngine()
    # Patch audit path
    engine._audit_log_path = str(audit_log)
    old = {"rules": [{"id": "test-rule", "value": 1}]}
    new = {"rules": [{"id": "test-rule", "value": 2}]}
    # Call audit
    engine._audit_rule_changes(
        old, new, user_id="admin_test", reason="unit test", request_ip="127.0.0.1"
    )
    # Check file exists and has at least one correct update entry
    assert audit_log.exists()
    lines = audit_log.read_text().splitlines()
    found = False
    for line in lines:
        entry = json.loads(line)
        if (
            entry["user_id"] == "admin_test"
            and entry["action"] == "update"
            and entry["rule_id"] == "test-rule"
            and entry["reason"] == "unit test"
            and entry["request_ip"] == "127.0.0.1"
            and "hash" in entry
            and entry["before"]["value"] == 1
            and entry["after"]["value"] == 2
        ):
            found = True
            break
    assert found, "No correct update entry found in audit log."


@pytest.mark.asyncio
def test_reload_business_rules_audits(monkeypatch, tmp_path):
    # Setup: patch audit log path and business rules
    audit_log = tmp_path / "rules_audit_log.jsonl"
    engine = RealTimeAnalysisEngine()
    engine._audit_log_path = str(audit_log)

    # Patch _load_business_rules to simulate a change
    def fake_load():
        engine.business_rules = {"rules": [{"id": "r1", "value": 10}]}

    monkeypatch.setattr(engine, "_load_business_rules", fake_load)
    # Set old rules
    engine.business_rules = {"rules": [{"id": "r1", "value": 5}]}
    # Reload (should audit change)
    engine.reload_business_rules(
        user_id="admin_reload", reason="reload", request_ip="1.2.3.4"
    )
    # Check audit log
    assert audit_log.exists()
    lines = audit_log.read_text().splitlines()
    assert any("admin_reload" in l for l in lines)
    assert any("reload" in l for l in lines)
    assert any("update" in l for l in lines)
