#!/usr/bin/env python3
"""
Quick test script for CLV endpoints to validate Step 3 implementation.
"""
import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

async def test_endpoint(session: aiohttp.ClientSession, url: str, method: str = "GET", data: Dict[Any, Any] = None) -> Dict[str, Any]:
    """Test a single endpoint and return results."""
    start_time = time.time()
    try:
        if method == "GET":
            async with session.get(url) as response:
                response_data = await response.json()
                return {
                    "url": url,
                    "status": response.status,
                    "success": response.status < 400,
                    "data": response_data,
                    "response_time_ms": round((time.time() - start_time) * 1000, 2)
                }
        elif method == "POST":
            async with session.post(url, json=data) as response:
                response_data = await response.json()
                return {
                    "url": url,
                    "status": response.status,
                    "success": response.status < 400,
                    "data": response_data,
                    "response_time_ms": round((time.time() - start_time) * 1000, 2)
                }
    except Exception as e:
        return {
            "url": url,
            "status": 0,
            "success": False,
            "error": str(e),
            "response_time_ms": round((time.time() - start_time) * 1000, 2)
        }

async def main():
    """Test CLV endpoints quickly."""
    base_url = "http://127.0.0.1:8000"
    
    # Test endpoints
    test_cases = [
        # Basic health check
        {"url": f"{base_url}/health", "method": "GET"},
        
        # CLV status endpoint (Step 2)
        {"url": f"{base_url}/api/propfinder/clv-status", "method": "GET"},
        
        # CLV history endpoints (Step 3)
        {"url": f"{base_url}/api/propfinder/clv-history", "method": "GET"},
        {"url": f"{base_url}/api/propfinder/clv-history?limit=5", "method": "GET"},
        {"url": f"{base_url}/api/propfinder/clv-history?sport=MLB", "method": "GET"},
        {"url": f"{base_url}/api/propfinder/opportunities/clv-history-summary", "method": "GET"},
        
        # Test opportunities endpoint with CLV enabled
        {"url": f"{base_url}/api/propfinder/opportunities?clv_enabled=true", "method": "GET"},
    ]
    
    print("🧪 Testing CLV Step 3 Implementation")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        results = []
        
        for test_case in test_cases:
            print(f"Testing: {test_case['url']}")
            result = await test_endpoint(session, **test_case)
            results.append(result)
            
            if result["success"]:
                print(f"  ✅ Status: {result['status']} ({result['response_time_ms']}ms)")
                
                # Show relevant data for CLV endpoints
                if "clv-status" in result["url"]:
                    data = result["data"].get("data", {})
                    print(f"  📊 CLV Status: enabled={data.get('enabled')}, processing_time_ms={data.get('last_processing_time_ms')}")
                    
                elif "clv-history" in result["url"] and "summary" not in result["url"]:
                    data = result["data"].get("data", {})
                    records = data.get("history", [])
                    print(f"  📜 History Records: {len(records)} found")
                    if records:
                        latest = records[0]
                        print(f"    Latest: {latest.get('player')} {latest.get('market')} (CLV: {latest.get('clv_percent')}%)")
                        
                elif "summary" in result["url"]:
                    data = result["data"].get("data", {})
                    print(f"  📈 Summary: total_records={data.get('total_records')}, avg_clv={data.get('average_clv_percent')}%")
                    
                elif "opportunities" in result["url"]:
                    data = result["data"].get("data", {})
                    opportunities = data.get("opportunities", [])
                    print(f"  🎯 Opportunities: {len(opportunities)} found")
                    clv_opportunities = [o for o in opportunities if o.get("clv_percent")]
                    print(f"  📊 CLV Enhanced: {len(clv_opportunities)} opportunities")
                    
            else:
                print(f"  ❌ Status: {result['status']} - {result.get('error', 'Unknown error')}")
            
            print()
            
        # Summary
        print("=" * 50)
        print("🏁 Test Summary")
        print("=" * 50)
        
        successful = [r for r in results if r["success"]]
        failed = [r for r in results if not r["success"]]
        
        print(f"✅ Successful: {len(successful)}/{len(results)}")
        print(f"❌ Failed: {len(failed)}/{len(results)}")
        
        if failed:
            print("\nFailed endpoints:")
            for result in failed:
                print(f"  - {result['url']}: {result.get('error', f'Status {result['status']}')}")
        
        print(f"\nAverage response time: {sum(r['response_time_ms'] for r in successful) / len(successful) if successful else 0:.1f}ms")

if __name__ == "__main__":
    asyncio.run(main())