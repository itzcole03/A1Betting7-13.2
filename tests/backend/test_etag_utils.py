import copy

from backend.utils.etag import compute_etag_for_compact_list


def test_compute_etag_stable_for_timestamp_variation():
    base_payload = {
        "opportunities": [
            {"id": "a1", "player": "P1", "lastUpdated": "2025-10-27T00:00:00Z"},
            {"id": "b2", "player": "P2", "lastUpdated": "2025-10-27T00:00:01Z"},
        ],
        "summary": {"total": 2},
    }

    p1 = copy.deepcopy(base_payload)
    p2 = copy.deepcopy(base_payload)
    # mutate timestamps
    p2["opportunities"][0]["lastUpdated"] = "2025-10-27T01:00:00Z"
    p2["opportunities"][1]["lastUpdated"] = "2025-10-27T01:00:01Z"

    etag1 = compute_etag_for_compact_list(p1)
    etag2 = compute_etag_for_compact_list(p2)

    assert etag1 == etag2, "ETag should be stable despite per-item timestamp changes"


def test_compute_etag_changes_on_content_change():
    payload = {
        "opportunities": [{"id": "x1", "player": "Alpha"}],
        "summary": {"total": 1},
    }
    payload2 = copy.deepcopy(payload)
    payload2["opportunities"][0]["player"] = "Beta"

    etag_a = compute_etag_for_compact_list(payload)
    etag_b = compute_etag_for_compact_list(payload2)

    assert etag_a != etag_b
