from fastapi import FastAPI
from backend.data_pipeline import data_pipeline, DataSourceType, DataRequest
from datetime import datetime
import uvicorn

app = FastAPI(title="A1Betting Health API", description="Health endpoints for diagnostics", version="1.0.0")

@app.get("/api/health")
async def basic_health():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/health/data-sources")
async def data_sources_health():
    results = []
    for source in data_pipeline.connectors.keys():
        connector = data_pipeline.connectors[source]
        try:
            if source == DataSourceType.SPORTRADAR:
                endpoint = "nba/trial/v8/en/games/live.json"
            elif source == DataSourceType.ODDS_API:
                endpoint = "v4/sports/basketball_nba/odds"
            elif source == DataSourceType.PRIZEPICKS:
                endpoint = "projections"
            else:
                endpoint = "health"
            req = DataRequest(source=source, endpoint=endpoint, timeout=5, retry_count=0)
            response = await connector.fetch_data(req)
            status = response.status.value
            last_success = response.timestamp.isoformat() if response.status == response.status.SUCCESS else None
            last_error = response.error if response.status != response.status.SUCCESS else None
            latency = response.latency
        except Exception as e:
            status = "error"
            last_success = None
            last_error = str(e)
            latency = None
        results.append({
            "data_source": source.value,
            "status": status,
            "last_success": last_success,
            "last_error": last_error,
            "latency": latency,
            "api_key_present": bool(getattr(connector, 'api_key', None)),
        })
    return {"data_sources": results, "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    uvicorn.run("backend.health_api:app", host="0.0.0.0", port=8010, reload=True) 