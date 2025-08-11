"""
Data Export Routes
Phase 3: Advanced UI Features - API endpoints for comprehensive data export

Features:
- Multiple format export endpoints
- Progress tracking for large exports
- Export templates management
- Async export processing
- File download endpoints
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import io

from ..services.export_service import (
    get_export_service,
    DataExportService,
    ExportField,
    ExportOptions,
    ExportProgress
)
from ..services.core.unified_cache_service import get_cache

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/export", tags=["Data Export"])

# Pydantic models for API
class ExportRequest(BaseModel):
    data_type: str  # 'bets', 'players', 'odds', 'props', etc.
    options: ExportOptions
    async_export: bool = False  # For large datasets

class ExportTemplate(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    data_type: str
    options: ExportOptions
    is_public: bool = False

class BulkExportRequest(BaseModel):
    exports: List[ExportRequest]
    combine_files: bool = False
    zip_output: bool = True

@router.post("/start")
async def start_export(
    request: ExportRequest,
    background_tasks: BackgroundTasks,
    export_service: DataExportService = Depends(get_export_service)
) -> Dict[str, str]:
    """Start a data export process"""
    
    try:
        # Get data based on data_type
        data, available_fields = await get_export_data(request.data_type, request.options)
        
        if not data:
            raise HTTPException(status_code=404, detail="No data found for export")
        
        # For small datasets, export immediately
        if len(data) <= 1000 and not request.async_export:
            file_content = await generate_immediate_export(data, available_fields, request.options)
            
            # Return download URL or base64 data
            return {
                "export_id": "immediate",
                "status": "completed",
                "download_url": f"/api/v1/export/download/immediate",
                "message": "Export completed immediately"
            }
        
        # For large datasets, use async export
        export_id = await export_service.create_export(data, available_fields, request.options)
        
        return {
            "export_id": export_id,
            "status": "pending", 
            "message": f"Export started for {len(data)} records. Check progress with export_id."
        }
        
    except Exception as e:
        logger.error(f"Failed to start export: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/progress/{export_id}")
async def get_export_progress(
    export_id: str,
    export_service: DataExportService = Depends(get_export_service)
) -> ExportProgress:
    """Get export progress by ID"""
    
    progress = await export_service.get_export_progress(export_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Export not found")
    
    return progress

@router.get("/download/{export_id}")
async def download_export(
    export_id: str,
    export_service: DataExportService = Depends(get_export_service)
):
    """Download completed export file"""
    
    if export_id == "immediate":
        # Handle immediate exports stored in cache
        cache = await get_cache()
        file_data = await cache.get("immediate_export")
        if not file_data:
            raise HTTPException(status_code=404, detail="Export file not found")
        
        return StreamingResponse(
            io.BytesIO(file_data["content"]),
            media_type=file_data["media_type"],
            headers={"Content-Disposition": f"attachment; filename={file_data['filename']}"}
        )
    
    progress = await export_service.get_export_progress(export_id)
    if not progress:
        raise HTTPException(status_code=404, detail="Export not found")
    
    if progress.status != "completed":
        raise HTTPException(status_code=400, detail=f"Export not ready. Status: {progress.status}")
    
    file_content = await export_service.get_export_file(export_id)
    if not file_content:
        raise HTTPException(status_code=404, detail="Export file not found")
    
    # Determine media type based on format
    media_types = {
        "csv": "text/csv",
        "json": "application/json",
        "pdf": "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xml": "application/xml"
    }
    
    # Extract format from filename or use default
    format_ext = progress.file_path.split('.')[-1] if progress.file_path else "csv"
    media_type = media_types.get(format_ext, "application/octet-stream")
    
    filename = f"export_{export_id}.{format_ext}"
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/immediate")
async def immediate_export(
    request: ExportRequest,
    export_service: DataExportService = Depends(get_export_service)
):
    """Perform immediate export for small datasets"""
    
    try:
        # Get data
        data, available_fields = await get_export_data(request.data_type, request.options)
        
        if len(data) > 5000:
            raise HTTPException(
                status_code=400, 
                detail="Dataset too large for immediate export. Use async export instead."
            )
        
        # Generate export
        if request.options.format == "csv":
            content = await generate_csv_export(data, available_fields, request.options)
            media_type = "text/csv"
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        elif request.options.format == "json":
            content = await generate_json_export(data, available_fields, request.options)
            media_type = "application/json"
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        elif request.options.format == "pdf":
            content = await generate_pdf_export(data, available_fields, request.options)
            media_type = "application/pdf"
            filename = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        else:
            raise HTTPException(status_code=400, detail=f"Format {request.options.format} not supported for immediate export")
        
        # Return file stream
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        return StreamingResponse(
            io.BytesIO(content),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Immediate export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/fields/{data_type}")
async def get_available_fields(data_type: str) -> Dict[str, List[ExportField]]:
    """Get available fields for a data type"""
    
    field_definitions = {
        "bets": [
            ExportField(key="id", label="Bet ID", type="string", required=True),
            ExportField(key="player_name", label="Player", type="string", defaultIncluded=True),
            ExportField(key="prop_type", label="Prop Type", type="string", defaultIncluded=True),
            ExportField(key="line", label="Line", type="number", defaultIncluded=True),
            ExportField(key="odds", label="Odds", type="number", defaultIncluded=True),
            ExportField(key="amount", label="Bet Amount", type="number", defaultIncluded=True),
            ExportField(key="status", label="Status", type="string", defaultIncluded=True),
            ExportField(key="created_at", label="Bet Date", type="date", defaultIncluded=True),
            ExportField(key="settled_at", label="Settled Date", type="date"),
            ExportField(key="sportsbook", label="Sportsbook", type="string"),
            ExportField(key="sport", label="Sport", type="string"),
            ExportField(key="game_id", label="Game ID", type="string"),
            ExportField(key="payout", label="Payout", type="number"),
            ExportField(key="profit", label="Profit/Loss", type="number")
        ],
        "players": [
            ExportField(key="id", label="Player ID", type="string", required=True),
            ExportField(key="name", label="Player Name", type="string", defaultIncluded=True),
            ExportField(key="team", label="Team", type="string", defaultIncluded=True),
            ExportField(key="position", label="Position", type="string", defaultIncluded=True),
            ExportField(key="sport", label="Sport", type="string", defaultIncluded=True),
            ExportField(key="age", label="Age", type="number"),
            ExportField(key="height", label="Height", type="string"),
            ExportField(key="weight", label="Weight", type="number"),
            ExportField(key="salary", label="Salary", type="number"),
            ExportField(key="is_active", label="Active", type="boolean"),
            ExportField(key="injury_status", label="Injury Status", type="string"),
            ExportField(key="last_updated", label="Last Updated", type="date")
        ],
        "props": [
            ExportField(key="id", label="Prop ID", type="string", required=True),
            ExportField(key="player_name", label="Player", type="string", defaultIncluded=True),
            ExportField(key="prop_type", label="Prop Type", type="string", defaultIncluded=True),
            ExportField(key="line", label="Line", type="number", defaultIncluded=True),
            ExportField(key="prediction", label="Prediction", type="number", defaultIncluded=True),
            ExportField(key="confidence", label="Confidence", type="number", defaultIncluded=True),
            ExportField(key="expected_value", label="Expected Value", type="number", defaultIncluded=True),
            ExportField(key="sportsbook", label="Sportsbook", type="string"),
            ExportField(key="odds", label="Odds", type="number"),
            ExportField(key="sport", label="Sport", type="string"),
            ExportField(key="game_date", label="Game Date", type="date"),
            ExportField(key="created_at", label="Created", type="date")
        ],
        "odds": [
            ExportField(key="id", label="Odds ID", type="string", required=True),
            ExportField(key="sportsbook", label="Sportsbook", type="string", defaultIncluded=True),
            ExportField(key="sport", label="Sport", type="string", defaultIncluded=True),
            ExportField(key="market_type", label="Market", type="string", defaultIncluded=True),
            ExportField(key="odds_value", label="Odds", type="number", defaultIncluded=True),
            ExportField(key="line", label="Line", type="number"),
            ExportField(key="team_home", label="Home Team", type="string"),
            ExportField(key="team_away", label="Away Team", type="string"),
            ExportField(key="game_date", label="Game Date", type="date"),
            ExportField(key="last_updated", label="Last Updated", type="date")
        ]
    }
    
    fields = field_definitions.get(data_type, [])
    return {"fields": fields}

@router.post("/templates")
async def save_export_template(
    template: ExportTemplate,
    cache = Depends(get_cache)
) -> Dict[str, str]:
    """Save an export template"""
    
    try:
        # Generate ID if not provided
        if not template.id:
            template.id = f"template_{int(datetime.now().timestamp())}"
        
        # Save template to cache (in production, save to database)
        template_data = template.dict()
        template_data["created_at"] = datetime.now().isoformat()
        
        await cache.set(f"export_template:{template.id}", template_data, ttl=86400 * 365)  # 1 year
        
        return {"template_id": template.id, "message": "Template saved successfully"}
        
    except Exception as e:
        logger.error(f"Failed to save export template: {e}")
        raise HTTPException(status_code=500, detail="Failed to save template")

@router.get("/templates")
async def get_export_templates(
    data_type: Optional[str] = Query(None),
    cache = Depends(get_cache)
) -> Dict[str, List[Dict]]:
    """Get available export templates"""
    
    try:
        # Mock templates - in production, query database
        mock_templates = [
            {
                "id": "betting_history",
                "name": "Betting History Report",
                "description": "Complete betting history with performance metrics",
                "data_type": "bets",
                "options": {
                    "format": "excel",
                    "fields": ["player_name", "prop_type", "line", "odds", "amount", "status", "created_at", "profit"],
                    "formatting": {"include_headers": True, "include_metadata": True}
                },
                "is_public": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "player_analysis",
                "name": "Player Analysis",
                "description": "Detailed player statistics and information",
                "data_type": "players",
                "options": {
                    "format": "csv",
                    "fields": ["name", "team", "position", "sport", "age", "is_active"],
                    "formatting": {"include_headers": True}
                },
                "is_public": True,
                "created_at": "2024-01-01T00:00:00Z"
            },
            {
                "id": "prop_opportunities",
                "name": "Prop Opportunities",
                "description": "High-value prop betting opportunities",
                "data_type": "props",
                "options": {
                    "format": "pdf",
                    "fields": ["player_name", "prop_type", "line", "prediction", "confidence", "expected_value"],
                    "filters": {"confidence": {"min": 0.8}, "expected_value": {"min": 0.05}},
                    "formatting": {"include_headers": True, "include_metadata": True}
                },
                "is_public": True,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
        
        # Filter by data type if specified
        if data_type:
            mock_templates = [t for t in mock_templates if t["data_type"] == data_type]
        
        return {"templates": mock_templates}
        
    except Exception as e:
        logger.error(f"Failed to get export templates: {e}")
        return {"templates": []}

@router.post("/bulk")
async def bulk_export(
    request: BulkExportRequest,
    background_tasks: BackgroundTasks,
    export_service: DataExportService = Depends(get_export_service)
) -> Dict[str, Any]:
    """Start bulk export of multiple data types"""
    
    try:
        export_ids = []
        
        for export_request in request.exports:
            data, available_fields = await get_export_data(export_request.data_type, export_request.options)
            
            if data:
                export_id = await export_service.create_export(data, available_fields, export_request.options)
                export_ids.append({
                    "export_id": export_id,
                    "data_type": export_request.data_type,
                    "record_count": len(data)
                })
        
        return {
            "bulk_export_id": f"bulk_{int(datetime.now().timestamp())}",
            "exports": export_ids,
            "total_exports": len(export_ids),
            "message": "Bulk export started successfully"
        }
        
    except Exception as e:
        logger.error(f"Bulk export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Bulk export failed: {str(e)}")

# Helper functions
async def get_export_data(data_type: str, options: ExportOptions) -> tuple[List[Dict[str, Any]], List[ExportField]]:
    """Get data and field definitions for export"""
    
    # Get field definitions
    field_response = await get_available_fields(data_type)
    available_fields = field_response["fields"]
    
    # Mock data generation - in production, query actual database
    if data_type == "bets":
        mock_data = generate_mock_bets_data(100)
    elif data_type == "players":
        mock_data = generate_mock_players_data(50)
    elif data_type == "props":
        mock_data = generate_mock_props_data(200)
    elif data_type == "odds":
        mock_data = generate_mock_odds_data(150)
    else:
        mock_data = []
    
    return mock_data, available_fields

def generate_mock_bets_data(count: int) -> List[Dict[str, Any]]:
    """Generate mock betting data"""
    import random
    from datetime import timedelta
    
    players = ["LeBron James", "Stephen Curry", "Aaron Judge", "Josh Allen", "Connor McDavid"]
    prop_types = ["Points", "Assists", "Rebounds", "Strikeouts", "Passing Yards"]
    statuses = ["won", "lost", "pending"]
    sportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars"]
    
    data = []
    for i in range(count):
        bet = {
            "id": f"bet_{i}",
            "player_name": random.choice(players),
            "prop_type": random.choice(prop_types),
            "line": round(random.uniform(10, 50), 1),
            "odds": random.choice([-110, -105, +100, +105, +110]),
            "amount": round(random.uniform(25, 200), 2),
            "status": random.choice(statuses),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
            "sportsbook": random.choice(sportsbooks),
            "sport": random.choice(["NBA", "MLB", "NFL", "NHL"]),
            "payout": round(random.uniform(0, 400), 2),
            "profit": round(random.uniform(-200, 200), 2)
        }
        data.append(bet)
    
    return data

def generate_mock_players_data(count: int) -> List[Dict[str, Any]]:
    """Generate mock player data"""
    import random
    
    first_names = ["Michael", "LeBron", "Stephen", "Kevin", "James", "Aaron", "Josh", "Connor"]
    last_names = ["Johnson", "Smith", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson"]
    teams = ["LAL", "GSW", "BOS", "MIA", "CHI", "NYY", "BUF", "EDM"]
    positions = ["PG", "SG", "SF", "PF", "C", "QB", "RB", "WR"]
    
    data = []
    for i in range(count):
        player = {
            "id": f"player_{i}",
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "team": random.choice(teams),
            "position": random.choice(positions),
            "sport": random.choice(["NBA", "NFL", "MLB", "NHL"]),
            "age": random.randint(20, 40),
            "height": f"{random.randint(5, 7)}'{random.randint(0, 11)}\"",
            "weight": random.randint(170, 280),
            "salary": random.randint(500000, 50000000),
            "is_active": random.choice([True, False]),
            "injury_status": random.choice(["Healthy", "Questionable", "Out", "Day-to-Day"]),
            "last_updated": datetime.now().isoformat()
        }
        data.append(player)
    
    return data

def generate_mock_props_data(count: int) -> List[Dict[str, Any]]:
    """Generate mock props data"""
    import random
    
    players = ["LeBron James", "Stephen Curry", "Aaron Judge", "Josh Allen", "Connor McDavid"]
    prop_types = ["Points", "Assists", "Rebounds", "Strikeouts", "Passing Yards"]
    sportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars"]
    
    data = []
    for i in range(count):
        line = round(random.uniform(10, 50), 1)
        prediction = line + random.uniform(-5, 10)
        
        prop = {
            "id": f"prop_{i}",
            "player_name": random.choice(players),
            "prop_type": random.choice(prop_types),
            "line": line,
            "prediction": round(prediction, 1),
            "confidence": round(random.uniform(0.6, 0.95), 3),
            "expected_value": round(random.uniform(-0.1, 0.3), 3),
            "sportsbook": random.choice(sportsbooks),
            "odds": random.choice([-110, -105, +100, +105]),
            "sport": random.choice(["NBA", "MLB", "NFL", "NHL"]),
            "game_date": (datetime.now() + timedelta(days=random.randint(0, 7))).isoformat(),
            "created_at": datetime.now().isoformat()
        }
        data.append(prop)
    
    return data

def generate_mock_odds_data(count: int) -> List[Dict[str, Any]]:
    """Generate mock odds data"""
    import random
    
    sportsbooks = ["DraftKings", "FanDuel", "BetMGM", "Caesars", "PointsBet"]
    markets = ["moneyline", "spread", "total", "player_props"]
    teams = ["Lakers", "Warriors", "Celtics", "Heat", "Yankees", "Dodgers"]
    
    data = []
    for i in range(count):
        odds = {
            "id": f"odds_{i}",
            "sportsbook": random.choice(sportsbooks),
            "sport": random.choice(["NBA", "MLB", "NFL", "NHL"]),
            "market_type": random.choice(markets),
            "odds_value": random.choice([-110, -105, +100, +105, +110, +120]),
            "line": round(random.uniform(-10, 10), 1) if random.choice([True, False]) else None,
            "team_home": random.choice(teams),
            "team_away": random.choice(teams),
            "game_date": (datetime.now() + timedelta(days=random.randint(0, 7))).isoformat(),
            "last_updated": datetime.now().isoformat()
        }
        data.append(odds)
    
    return data

async def generate_immediate_export(data: List[Dict[str, Any]], available_fields: List[ExportField], options: ExportOptions) -> bytes:
    """Generate immediate export for small datasets"""
    export_service = await get_export_service()
    
    # Use the export service to generate content
    if options.format == "csv":
        content = export_service._generate_csv(data, available_fields, options)
        return content.encode('utf-8')
    elif options.format == "json":
        content = export_service._generate_json(data, available_fields, options)
        return content.encode('utf-8')
    elif options.format == "pdf":
        return export_service._generate_pdf(data, available_fields, options)
    else:
        raise ValueError(f"Format {options.format} not supported for immediate export")

async def generate_csv_export(data: List[Dict[str, Any]], available_fields: List[ExportField], options: ExportOptions) -> str:
    """Generate CSV export content"""
    export_service = await get_export_service()
    return export_service._generate_csv(data, available_fields, options)

async def generate_json_export(data: List[Dict[str, Any]], available_fields: List[ExportField], options: ExportOptions) -> str:
    """Generate JSON export content"""
    export_service = await get_export_service()
    return export_service._generate_json(data, available_fields, options)

async def generate_pdf_export(data: List[Dict[str, Any]], available_fields: List[ExportField], options: ExportOptions) -> bytes:
    """Generate PDF export content"""
    export_service = await get_export_service()
    return export_service._generate_pdf(data, available_fields, options)
