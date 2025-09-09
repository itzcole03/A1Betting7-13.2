#!/usr/bin/env python3
"""
Test script for analytics integration
"""
import requests
import sqlite3
import json

def test_analytics_integration():
    print("=== Analytics Integration Test ===\n")
    
    # 1. Check database state before API call
    print("1. Checking database before API call...")
    conn = sqlite3.connect('a1betting.db')
    cursor = conn.cursor()
    
    cursor.execute('SELECT COUNT(*) FROM ev_opportunity_history')
    ev_before = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM arbitrage_history')
    arb_before = cursor.fetchone()[0]
    
    print(f"   EV opportunities before: {ev_before}")
    print(f"   Arbitrage opportunities before: {arb_before}")
    
    # 2. Make PropFinder API call
    print("\n2. Making PropFinder API call...")
    try:
        response = requests.get('http://127.0.0.1:8000/api/propfinder/opportunities', timeout=30)
        response.raise_for_status()
        data = response.json()
        
        opportunities = data['data']['opportunities']
        total_opportunities = len(opportunities)
        print(f"   API Response: {response.status_code}")
        print(f"   Total opportunities returned: {total_opportunities}")
        
        # Analyze opportunities for thresholds
        high_ev_count = 0
        arbitrage_count = 0
        
        for opp in opportunities:
            edge = opp.get('edge', 0)
            has_arbitrage = opp.get('hasArbitrage', False)
            arbitrage_profit = opp.get('arbitrageProfitPct', 0)
            
            if edge >= 3.0:
                high_ev_count += 1
            
            if has_arbitrage and arbitrage_profit >= 1.0:
                arbitrage_count += 1
        
        print(f"   Opportunities with edge >= 3%: {high_ev_count}")
        print(f"   Opportunities with arbitrage >= 1%: {arbitrage_count}")
        
        # Show sample edge values
        sample_edges = [opp.get('edge', 0) for opp in opportunities[:5]]
        print(f"   Sample edge values: {sample_edges}")
        
    except Exception as e:
        print(f"   ERROR making API call: {e}")
        return False
    
    # 3. Check database state after API call
    print("\n3. Checking database after API call...")
    
    cursor.execute('SELECT COUNT(*) FROM ev_opportunity_history')
    ev_after = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM arbitrage_history')
    arb_after = cursor.fetchone()[0]
    
    print(f"   EV opportunities after: {ev_after}")
    print(f"   Arbitrage opportunities after: {arb_after}")
    
    ev_added = ev_after - ev_before
    arb_added = arb_after - arb_before
    
    print(f"   EV opportunities added: {ev_added}")
    print(f"   Arbitrage opportunities added: {arb_added}")
    
    # 4. Check recent records if any were added
    if ev_added > 0:
        print("\n4. Recent EV opportunities:")
        cursor.execute('''
            SELECT player, sport, market, line, ev_percent, bookmaker, created_at 
            FROM ev_opportunity_history 
            ORDER BY created_at DESC 
            LIMIT 3
        ''')
        for row in cursor.fetchall():
            print(f"   {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}% | {row[5]} | {row[6]}")
    
    if arb_added > 0:
        print("\nRecent arbitrage opportunities:")
        cursor.execute('''
            SELECT player, sport, market, line, profit_pct, created_at 
            FROM arbitrage_history 
            ORDER BY created_at DESC 
            LIMIT 3
        ''')
        for row in cursor.fetchall():
            print(f"   {row[0]} | {row[1]} | {row[2]} | {row[3]} | {row[4]}% | {row[5]}")
    
    conn.close()
    
    # 5. Test analytics API endpoints
    print("\n5. Testing analytics API endpoints...")
    try:
        # Test EV stats endpoint
        stats_response = requests.get('http://127.0.0.1:8000/api/analytics/ev-stats', timeout=10)
        if stats_response.status_code == 200:
            stats_data = stats_response.json()
            print(f"   EV Stats API: ✅ {stats_data['data']['total_records']} records")
        else:
            print(f"   EV Stats API: ❌ Status {stats_response.status_code}")
            
        # Test arbitrage stats endpoint
        arb_stats_response = requests.get('http://127.0.0.1:8000/api/analytics/arbitrage-stats', timeout=10)
        if arb_stats_response.status_code == 200:
            arb_stats_data = arb_stats_response.json()
            print(f"   Arbitrage Stats API: ✅ {arb_stats_data['data']['total_records']} records")
        else:
            print(f"   Arbitrage Stats API: ❌ Status {arb_stats_response.status_code}")
            
    except Exception as e:
        print(f"   ERROR testing analytics APIs: {e}")
    
    # 6. Summary
    print(f"\n=== Integration Test Summary ===")
    print(f"✅ Backend server: Running")
    print(f"✅ PropFinder API: Working ({total_opportunities} opportunities)")
    print(f"✅ Database tables: Accessible")
    
    if ev_added > 0 or arb_added > 0:
        print(f"✅ Analytics persistence: Working ({ev_added} EV + {arb_added} arbitrage)")
        return True
    else:
        print(f"⚠️  Analytics persistence: No data persisted (thresholds may not be met)")
        print(f"   Expected: Opportunities with edge >= 3% or arbitrage >= 1%")
        return False

if __name__ == "__main__":
    test_analytics_integration()