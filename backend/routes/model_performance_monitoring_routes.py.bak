from fastapi import APIRouter

router = APIRouter()


@router.get('/_ping')
async def ping():
    return {'success': True, 'data': {'service': 'model_performance_monitoring_routes', 'status': 'healthy'}, 'error': None}
