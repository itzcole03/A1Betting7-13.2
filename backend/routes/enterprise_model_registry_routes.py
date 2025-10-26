from fastapi import APIRouter

router = APIRouter()


@router.get('/_ping')
async def ping():
    return {'success': True, 'data': {'service': 'enterprise_model_registry_routes', 'status': 'healthy'}, 'error': None}
