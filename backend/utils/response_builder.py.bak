from typing import Any, Dict, Optional


class ResponseBuilder:
    @staticmethod
    def success(data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
        # If a route sets a private marker to force a flat baseline on
        # opportunities, apply a last-mile mutation to the payload here.
        try:
            if isinstance(data, dict) and data.pop("_force_flat_baseline", False):
                # Support shapes: {opportunities: [...]}, {data: {opportunities: [...]}}, or list
                opps = None
                if isinstance(data.get("opportunities"), list):
                    opps = data["opportunities"]
                elif isinstance(data.get("data"), dict) and isinstance(
                    data["data"].get("opportunities"), list
                ):
                    opps = data["data"]["opportunities"]
                elif isinstance(data.get("data"), list):
                    opps = data["data"]

                if isinstance(opps, list):
                    for resp in opps:
                        try:
                                if isinstance(resp, dict):
                                    resp["movementDirection"] = "flat"
                                    lm = resp.get("lineMovement")
                                    if isinstance(lm, dict):
                                        lm["direction"] = "flat"
                                        if lm.get("open") is None:
                                            lm["open"] = lm.get("current", 0)
                                        if lm.get("current") is None:
                                            lm["current"] = lm.get("open", 0)
                                    # Only default numeric deltas when absent
                                    try:
                                        if resp.get("lineChange") is None:
                                            resp["lineChange"] = 0.0
                                    except Exception:
                                        pass
                                    try:
                                        if resp.get("oddsChange") is None:
                                            resp["oddsChange"] = 0
                                    except Exception:
                                        pass
                            else:
                                try:
                                    setattr(resp, "movementDirection", "flat")
                                except Exception:
                                    pass
                                try:
                                    # Only set attribute if missing/None to avoid
                                    # overwriting computed deltas
                                    try:
                                        if getattr(resp, "lineChange", None) is None:
                                            try:
                                                setattr(resp, "lineChange", 0.0)
                                            except Exception:
                                                d = getattr(resp, "__dict__", None)
                                                if isinstance(d, dict):
                                                    d["lineChange"] = 0.0
                                    except Exception:
                                        pass
                                except Exception:
                                    try:
                                        d = getattr(resp, "__dict__", None)
                                        if isinstance(d, dict):
                                            d["lineChange"] = 0.0
                                    except Exception:
                                        pass
                        except Exception:
                            continue
        except Exception:
            # Best-effort mutation only
            pass

        return {"success": True, "data": data, "message": message}

    @staticmethod
    def error(
        message: str = "An error occurred", detail: Any = None, status: int = 500
    ) -> Dict[str, Any]:
        payload = {"success": False, "error": message}
        if detail is not None:
            payload["detail"] = detail
        return payload
