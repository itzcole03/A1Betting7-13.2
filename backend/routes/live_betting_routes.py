from fastapi import APIRouter

router = APIRouter()


@router.get('/_ping')
async def ping():
    return {'success': True, 'data': {'service': 'live_betting_routes', 'status': 'healthy'}, 'error': None}
