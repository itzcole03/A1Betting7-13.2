from fastapi import APIRouter

router = APIRouter()


@router.get('/_ping')
async def ping():
    return {'success': True, 'data': {'service': 'mlb_extras_fixed', 'status': 'healthy'}, 'error': None}
