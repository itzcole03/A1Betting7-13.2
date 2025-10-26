import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Request

from ..core.exceptions import BusinessLogicException

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/debug/batch-test", response_model=StandardAPIResponse[Dict[str, Any]])
async def debug_batch_test(request: Request):
    """Simple debug endpoint to see what the frontend is sending.

    This endpoint is intentionally permissive and used for local debugging.
    It safely parses the request body and returns a small summary payload.
    """
    try:
        body_bytes = await request.body()
        body_text = (
            body_bytes.decode("utf-8")
            if isinstance(body_bytes, (bytes, bytearray))
            else body_bytes
        )
        logger.info(f"[DEBUG] Raw body: {body_text!r}")

        if body_text:
            try:
                data = json.loads(body_text)
            except json.JSONDecodeError:
                # Return the raw text when JSON parsing fails
                payload = {
                    "status": "success",
                    "received_type": str(type(body_text)),
                    "received_length": len(body_text),
                    "sample": body_text,
                }
                return ResponseBuilder.success(payload)

            logger.info(f"[DEBUG] Parsed data type: {type(data)}")
            length = len(data) if isinstance(data, (list, dict)) else 0
            sample = data[0] if isinstance(data, list) and len(data) > 0 else data

            payload = {
                "status": "success",
                "received_type": str(type(data)),
                "received_length": length,
                "sample": sample,
            }
            return ResponseBuilder.success(payload)

        else:
            logger.warning("[DEBUG] Empty body received")
            return ResponseBuilder.success({"status": "error", "message": "Empty body"})

    except BusinessLogicException as be:
        logger.error(f"[DEBUG] BusinessLogicException: {be}")
        return ResponseBuilder.fail(str(be))
    except Exception as e:
        logger.error(f"[DEBUG] Error: {e}")
        return ResponseBuilder.fail(str(e))
