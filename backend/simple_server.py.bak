#!/usr/bin/env python3
"""
Simple Backend Server for A1Betting Phase 3 Integration
Provides basic API endpoints to support frontend integration
"""

import json
import time
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import threading

class A1BettingHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler for A1Betting API endpoints"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        print(f"GET request for: {self.path}")
        self.send_cors_headers()

        if self.path == '/api/health' or self.path == '/health':
            self.handle_health_check()
        elif self.path.startswith('/api/v1/predictions'):
            self.handle_predictions()
        elif self.path.startswith('/api/v1/data'):
            self.handle_data()
        elif self.path.startswith('/api/v1/analytics'):
            self.handle_analytics()
        elif self.path.startswith('/api/v1/integration'):
            self.handle_integration()
        elif self.path.startswith('/api/v1/optimization'):
            self.handle_optimization()
        else:
            self.handle_not_found()
    
    def do_POST(self):
        """Handle POST requests"""
        self.send_cors_headers()
        
        # Read request body
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            request_data = json.loads(body) if body.strip() else {}
        except json.JSONDecodeError:
            request_data = {}
        
        if self.path.startswith('/api/v1/predictions'):
            self.handle_prediction_post(request_data)
        elif self.path.startswith('/api/v1/optimization'):
            self.handle_optimization_post(request_data)
        else:
            self.handle_not_found()
    
    def send_cors_headers(self):
        """Send CORS headers for all responses"""
        pass  # Headers will be sent with response
    
    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        self.end_headers()
        
        response = json.dumps(data, indent=2, default=str)
        self.wfile.write(response.encode('utf-8'))
    
    def handle_health_check(self):
        """Handle health check endpoint"""
        health_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0-phase3",
            "domains": {
                "prediction": {"status": "healthy"},
                "data": {"status": "healthy"},
                "analytics": {"status": "healthy"},
                "integration": {"status": "healthy"},
                "optimization": {"status": "healthy"}
            },
            "infrastructure": {
                "database": {"status": "healthy", "optimized_schema": True},
                "cache": {"status": "healthy", "hit_rate_percent": 95.2},
                "performance": {"memory_usage_mb": 128.5, "cpu_usage_percent": 15.3}
            },
            "phase": "Phase 3 - Frontend Integration",
            "consolidation_stats": {
                "original_routes": 57,
                "consolidated_domains": 5,
                "route_reduction_percent": 91.2,
                "original_services": 151,
                "consolidated_services": 5,
                "service_reduction_percent": 96.7,
                "complexity_reduction_percent": 73
            }
        }
        self.send_json_response(health_data)
    
    def handle_predictions(self):
        """Handle predictions GET endpoint"""
        predictions_data = {
            "predictions": [
                {
                    "prediction_id": "pred_aaron_judge_hr_001",
                    "player_name": "Aaron Judge",
                    "sport": "mlb",
                    "prop_type": "home_runs",
                    "line_score": 0.5,
                    "prediction": {
                        "recommended_bet": "over",
                        "confidence": 0.78,
                        "probability": 0.65,
                        "expected_value": 0.12
                    },
                    "model_info": {
                        "model_type": "ensemble",
                        "version": "v2.1.0",
                        "accuracy": 0.751
                    },
                    "explanation": {
                        "reasoning": "Judge is hitting .285 vs RHP with 35 HRs this season. Fenway Park favors left-handed power.",
                        "key_factors": [
                            {"factor": "Recent form", "impact": 0.25, "value": "5 HRs in last 10 games"},
                            {"factor": "Venue", "impact": 0.18, "value": "Fenway Park (HR friendly)"},
                            {"factor": "Pitcher matchup", "impact": 0.22, "value": "vs RHP (career .312 BA)"}
                        ]
                    },
                    "betting_recommendation": {
                        "recommendation": "STRONG BET",
                        "kelly_percentage": 0.055,
                        "suggested_unit_size": 2.5,
                        "expected_roi": "12.4%"
                    }
                }
            ],
            "total": 1,
            "page": 1,
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(predictions_data)
    
    def handle_prediction_post(self, request_data):
        """Handle prediction POST endpoint"""
        prediction_response = {
            "prediction_id": f"pred_{int(time.time())}",
            "player_name": request_data.get("player_name", "Unknown Player"),
            "sport": request_data.get("sport", "mlb"),
            "prop_type": request_data.get("prop_type", "points"),
            "line_score": request_data.get("line_score", 0.5),
            "prediction": {
                "recommended_bet": "over",
                "confidence": 0.82,
                "probability": 0.68,
                "expected_value": 0.15
            },
            "model_info": {
                "model_type": "ensemble",
                "version": "v2.1.0",
                "accuracy": 0.751,
                "training_date": "2024-01-15T10:00:00Z"
            },
            "explanation": {
                "reasoning": f"Based on recent performance and matchup analysis for {request_data.get('player_name', 'player')}",
                "shap_values": {"recent_form": 0.25, "matchup_history": 0.18, "venue": 0.15},
                "feature_importance": {"batting_avg": 0.35, "recent_form": 0.25, "opponent": 0.20}
            },
            "betting_recommendation": {
                "recommendation": "STRONG BET",
                "kelly_percentage": 0.065,
                "suggested_unit_size": 3.0,
                "expected_roi": "15.2%",
                "risk_level": "medium"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(prediction_response)
    
    def handle_data(self):
        """Handle data GET endpoint"""
        data_response = {
            "sports_data": {
                "mlb": {
                    "games_today": 15,
                    "live_games": 3,
                    "upcoming_games": 12
                },
                "nba": {
                    "games_today": 8,
                    "live_games": 1,
                    "upcoming_games": 7
                }
            },
            "data_sources": ["Sportradar", "ESPN", "The Odds API", "Baseball Savant"],
            "last_updated": datetime.utcnow().isoformat(),
            "data_quality": {
                "completeness": 98.5,
                "accuracy": 99.2,
                "freshness": 95.8
            }
        }
        self.send_json_response(data_response)
    
    def handle_analytics(self):
        """Handle analytics GET endpoint"""
        analytics_response = {
            "system_performance": {
                "avg_response_time_ms": 85.3,
                "p95_response_time_ms": 150.2,
                "requests_per_minute": 245.7,
                "error_rate_percent": 0.3,
                "uptime_percent": 99.9
            },
            "model_performance": {
                "ensemble_accuracy": 0.751,
                "predictions_today": 1247,
                "successful_predictions": 937,
                "accuracy_trend": "improving"
            },
            "user_metrics": {
                "active_users": 1523,
                "new_users_today": 89,
                "total_predictions_requested": 5847
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(analytics_response)
    
    def handle_integration(self):
        """Handle integration GET endpoint"""
        integration_response = {
            "sportsbook_status": {
                "total_integrated": 15,
                "active_connections": 14,
                "inactive_connections": 1
            },
            "odds_data": {
                "live_odds_count": 2347,
                "arbitrage_opportunities": 12,
                "best_lines_available": 891
            },
            "api_health": {
                "sportradar": "healthy",
                "draftkings": "healthy",
                "fanduel": "healthy",
                "betmgm": "degraded",
                "caesars": "healthy"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(integration_response)
    
    def handle_optimization(self):
        """Handle optimization GET endpoint"""
        optimization_response = {
            "portfolio_metrics": {
                "total_bankroll": 50000,
                "allocated_amount": 12500,
                "available_amount": 37500,
                "current_roi": 12.8,
                "win_rate": 68.5
            },
            "risk_assessment": {
                "risk_level": "moderate",
                "kelly_criterion_avg": 0.045,
                "max_allocation_percent": 5.0,
                "diversification_score": 8.5
            },
            "recommendations": [
                {
                    "type": "portfolio_rebalancing",
                    "priority": "high",
                    "description": "Consider reducing exposure to MLB props"
                },
                {
                    "type": "opportunity",
                    "priority": "medium", 
                    "description": "NBA props showing strong value this week"
                }
            ],
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(optimization_response)
    
    def handle_optimization_post(self, request_data):
        """Handle optimization POST endpoint"""
        optimization_result = {
            "optimization_id": f"opt_{int(time.time())}",
            "input_parameters": request_data,
            "optimized_portfolio": {
                "total_allocation": request_data.get("bankroll", 10000) * 0.25,
                "number_of_bets": 5,
                "expected_roi": 14.5,
                "risk_score": 6.8
            },
            "recommended_bets": [
                {
                    "prediction_id": "pred_001",
                    "allocation_amount": 1250,
                    "allocation_percent": 2.5,
                    "kelly_percentage": 0.055,
                    "expected_value": 0.12
                }
            ],
            "risk_metrics": {
                "value_at_risk": 0.15,
                "sharpe_ratio": 1.82,
                "max_drawdown": 0.08
            },
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(optimization_result)
    
    def handle_not_found(self):
        """Handle 404 not found"""
        error_response = {
            "error": "Not Found",
            "message": "The requested endpoint was not found",
            "timestamp": datetime.utcnow().isoformat(),
            "available_endpoints": [
                "/api/health",
                "/api/v1/predictions",
                "/api/v1/data", 
                "/api/v1/analytics",
                "/api/v1/integration",
                "/api/v1/optimization"
            ]
        }
        self.send_json_response(error_response, 404)

def run_server(port=8000):
    """Run the simple backend server"""
    server = HTTPServer(('localhost', port), A1BettingHandler)
    print(f"🚀 A1Betting Phase 3 Backend Server starting on port {port}")
    print(f"📊 Health check: http://localhost:{port}/api/health")
    print(f"📖 API endpoints: http://localhost:{port}/api/v1/")
    print("="*60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server shutting down...")
        server.shutdown()

if __name__ == "__main__":
    run_server()
