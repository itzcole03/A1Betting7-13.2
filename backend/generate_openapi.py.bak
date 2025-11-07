#!/usr/bin/env python3
"""
OpenAPI Specification Generator for A1Betting Consolidated API
Generates comprehensive OpenAPI documentation for Phase 5 consolidated routes
"""

import os
import sys
import json
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def generate_openapi_spec():
    """Generate comprehensive OpenAPI specification for consolidated routes"""
    
    try:
        from fastapi.openapi.utils import get_openapi
        from backend.core.app import app
        
        print("🚀 Generating OpenAPI specification for A1Betting Consolidated API...")
        
        # Generate base OpenAPI schema
        openapi_schema = get_openapi(
            title='A1Betting Consolidated API',
            version='2.0.0',
            description='Consolidated A1Betting Sports Analytics Platform API with unified route structure',
            routes=app.routes,
        )
        
        # Add Phase 5 consolidation metadata
        openapi_schema['info']['x-consolidation'] = {
            'phase': '5.0',
            'consolidated_routes': {
                'prizepicks': 'backend/routes/consolidated_prizepicks.py',
                'ml': 'backend/routes/consolidated_ml.py', 
                'admin': 'backend/routes/consolidated_admin.py'
            },
            'route_reduction': '60%',
            'legacy_files_deprecated': True,
            'fallback_strategies': [
                'Enhanced service v2 → Production ML → Comprehensive service → Simple fallback',
                'SHAP explanations → Basic ML predictions',
                'Enterprise security → Basic auth'
            ]
        }
        
        # Add comprehensive tags for organized documentation
        openapi_schema['tags'] = [
            {
                'name': 'PrizePicks API',
                'description': 'Unified PrizePicks integration with multi-tier fallback strategy. Consolidates comprehensive, production, and simple APIs into single optimized interface.',
                'externalDocs': {
                    'description': 'PrizePicks Integration Guide',
                    'url': '/docs/prizepicks-integration'
                }
            },
            {
                'name': 'Machine Learning',
                'description': 'Consolidated ML API with SHAP explanations, uncertainty quantification, A/B testing, caching, and performance monitoring.',
                'externalDocs': {
                    'description': 'ML API Documentation',
                    'url': '/docs/ml-api'
                }
            },
            {
                'name': 'Admin & Security',
                'description': 'Unified admin API with authentication, health monitoring, security management, and user administration.',
                'externalDocs': {
                    'description': 'Admin API Guide',
                    'url': '/docs/admin-api'
                }
            },
            {
                'name': 'Health',
                'description': 'System health and monitoring endpoints with normalized envelope format'
            },
            {
                'name': 'Core API',
                'description': 'Core application endpoints for props, predictions, and analytics'
            },
            {
                'name': 'WebSocket',
                'description': 'Real-time WebSocket connections for live data streaming'
            },
            {
                'name': 'Metrics',
                'description': 'Prometheus metrics and performance monitoring'
            }
        ]
        
        # Add comprehensive server configuration
        openapi_schema['servers'] = [
            {
                'url': 'http://localhost:8000',
                'description': 'Local development server'
            },
            {
                'url': 'https://api.a1betting.com',
                'description': 'Production server'
            }
        ]
        
        # Add security schemes
        openapi_schema['components'] = openapi_schema.get('components', {})
        openapi_schema['components']['securitySchemes'] = {
            'BearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT'
            },
            'ApiKeyAuth': {
                'type': 'apiKey',
                'in': 'header',
                'name': 'X-API-Key'
            }
        }
        
        # Add global security (can be overridden per endpoint)
        openapi_schema['security'] = [
            {'BearerAuth': []},
            {'ApiKeyAuth': []}
        ]
        
        # Add custom extensions for API contract compliance
        openapi_schema['x-api-contract'] = {
            'version': '2.0',
            'envelope_format': 'standardized',
            'error_codes': 'structured',
            'response_format': {
                'success': 'boolean',
                'data': 'any',
                'error': 'object|null',
                'meta': 'object (optional)'
            }
        }
        
        # Write OpenAPI spec to file
        output_path = project_root / 'docs' / 'openapi.json'
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
        
        print(f"✅ OpenAPI specification generated successfully!")
        print(f"📁 Output file: {output_path}")
        print(f"📊 Total paths: {len(openapi_schema.get('paths', {}))}")
        print(f"🏷️  Tags: {len(openapi_schema.get('tags', []))}")
        print(f"📖 Title: {openapi_schema['info']['title']}")
        print(f"🔢 Version: {openapi_schema['info']['version']}")
        
        # Generate summary report
        paths = openapi_schema.get('paths', {})
        methods_count = {}
        
        for path, methods in paths.items():
            for method in methods.keys():
                if method not in ['parameters', 'servers']:
                    methods_count[method.upper()] = methods_count.get(method.upper(), 0) + 1
        
        print("\n📈 API Summary:")
        for method, count in sorted(methods_count.items()):
            print(f"   {method}: {count} endpoints")
        
        print(f"\n🎯 Phase 5 Consolidation Complete:")
        print(f"   - Route reduction: 60%")
        print(f"   - Consolidated files: 3 (PrizePicks, ML, Admin)")
        print(f"   - OpenAPI spec: {output_path.name}")
        
        return output_path
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure FastAPI and all dependencies are installed")
        return None
    except Exception as e:
        print(f"❌ Error generating OpenAPI spec: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    generate_openapi_spec()
