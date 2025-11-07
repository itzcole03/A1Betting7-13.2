from fastapi import APIRouter

router = APIRouter()


@router.get('/_ping')
async def ping():
    return {'success': True, 'data': {'service': 'meta_cache', 'status': 'healthy'}, 'error': None}
