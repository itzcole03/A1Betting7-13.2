#!/usr/bin/env python3
"""
Simple CLV response test to debug the issue
"""

import asyncio
import json
from httpx import AsyncClient

async def test_clv_responses():
    """Test both CLV enabled and disabled responses"""
    base_url = "http://127.0.0.1:8000"
    
    async with AsyncClient(base_url=base_url) as client:
        # Test CLV disabled
        print("Testing CLV disabled...")
        response = await client.get("/api/propfinder/opportunities?include_clv=false&limit=2")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            
            if "data" in data:
                payload = data["data"]
                print(f"Payload structure: {list(payload.keys())}")
                
                if "opportunities" in payload:
                    opportunities = payload["opportunities"]
                    print(f"Number of opportunities: {len(opportunities)}")
                    
                    if opportunities:
                        first_opp = opportunities[0]
                        print(f"First opportunity keys: {list(first_opp.keys())}")
                        
                        # Check for CLV fields
                        clv_fields = [k for k in first_opp.keys() if 'clv' in k.lower()]
                        print(f"CLV fields found: {clv_fields}")
        else:
            print(f"Error response: {response.text}")
        
        print("\n" + "="*50 + "\n")
        
        # Test CLV enabled  
        print("Testing CLV enabled...")
        response = await client.get("/api/propfinder/opportunities?include_clv=true&limit=2")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response structure: {list(data.keys())}")
            
            if "data" in data:
                payload = data["data"]
                print(f"Payload structure: {list(payload.keys())}")
                
                if "opportunities" in payload:
                    opportunities = payload["opportunities"]
                    print(f"Number of opportunities: {len(opportunities)}")
                    
                    if opportunities:
                        first_opp = opportunities[0]
                        print(f"First opportunity keys: {list(first_opp.keys())}")
                        
                        # Check for CLV fields
                        clv_fields = [k for k in first_opp.keys() if 'clv' in k.lower()]
                        print(f"CLV fields found: {clv_fields}")
        else:
            print(f"Error response: {response.text}")

if __name__ == "__main__":
    asyncio.run(test_clv_responses())