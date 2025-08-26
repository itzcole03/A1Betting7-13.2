import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, Request

# Contract compliance imports
from ..core.response_models import ResponseBuilder, StandardAPIResponse
from ..core.exceptions import BusinessLogicException

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/debug/batch-test", response_model=StandardAPIResponse[Dict[str, Any]])
async def debug_batch_test(request: Request):
    """Simple debug endpoint to see what the frontend is sending"""
    try:
        body = await request.body()
        logger.info(f"[DEBUG] Raw body: {body}")

        if body:
            data = json.loads(body)
            logger.info(f"[DEBUG] Parsed data type: {type(data)}")
            logger.info(
                f"[DEBUG] Data length: {len(data) if isinstance(data, (list, dict)) else 'N/A'}"
            )
            logger.info(
                f"[DEBUG] First item: {data[0] if isinstance(data, list) and len(data) > 0 else data}"
            )

            return ResponseBuilder.success({
                "status": "success",
                "received_type": str(type(data)),
                "received_length": len(data) if isinstance(data, (list, dict)) else 0,
                "sample": data[0] if isinstance(data, list) and len(data) > 0 else data,
            })
        else:
            logger.warning("[DEBUG] Empty body received")
            return ResponseBuilder.success({"status": "error", "message": "Empty body"})

    except Exception as e:
        logger.error(f"[DEBUG] Error: {e}")
        return ResponseBuilder.success({"status": "error", "message": str(e)})
