from typing import Any, Dict, Optional


class ResponseBuilder:
    @staticmethod
    def success(data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
        return {"success": True, "data": data, "message": message}

    @staticmethod
    def error(message: str = "An error occurred", detail: Any = None, status: int = 500) -> Dict[str, Any]:
        payload = {"success": False, "error": message}
        if detail is not None:
            payload["detail"] = detail
        return payload
