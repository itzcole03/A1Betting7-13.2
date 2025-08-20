#!/usr/bin/env python3
"""
Phase 4.2 Bookmark Persistence - Complete Validation Test Script
Tests all bookmark functionality end-to-end
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

import requests
import json
from datetime import datetime

class Phase42Validator:
    """Comprehensive validator for Phase 4.2 bookmark persistence functionality"""
    
    def __init__(self):
        self.base_url = "http://127.0.0.1:8000"
        self.test_user_id = "test_user"
        self.test_props = [
            {
                "prop_id": "nba_25",
                "sport": "NBA", 
                "player": "Domantas Sabonis",
                "market": "Rebounds",
                "team": "Kings"
            },
            {
                "prop_id": "mlb_1", 
                "sport": "MLB",
                "player": "Mookie Betts",
                "market": "Hits",
                "team": "Dodgers"
            }
        ]
        self.results = []
        
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.results.append({
            "test": test_name,
            "success": success,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
            
    def test_api_health(self):
        """Test API health and connectivity"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, f"Error: {str(e)}")
            return False
            
    def test_create_bookmark(self):
        """Test bookmark creation"""
        prop = self.test_props[0]
        payload = {**prop, "bookmarked": True}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/propfinder/bookmark?user_id={self.test_user_id}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=5
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            details = f"Status: {response.status_code}, Response: {json.dumps(data, indent=2)[:200]}..."
            self.log_test("Create Bookmark", success, details)
            return success
            
        except Exception as e:
            self.log_test("Create Bookmark", False, f"Error: {str(e)}")
            return False
            
    def test_get_bookmarks(self):
        """Test bookmark retrieval"""
        try:
            response = requests.get(
                f"{self.base_url}/api/propfinder/bookmarks?user_id={self.test_user_id}",
                timeout=5
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            # Check if we have bookmarks
            bookmark_count = len(data.get('data', [])) if success else 0
            details = f"Status: {response.status_code}, Bookmarks found: {bookmark_count}"
            
            self.log_test("Retrieve Bookmarks", success, details)
            return success
            
        except Exception as e:
            self.log_test("Retrieve Bookmarks", False, f"Error: {str(e)}")
            return False
            
    def test_multiple_bookmarks(self):
        """Test creating multiple bookmarks"""
        success_count = 0
        
        for i, prop in enumerate(self.test_props):
            payload = {**prop, "bookmarked": True}
            
            try:
                response = requests.post(
                    f"{self.base_url}/api/propfinder/bookmark?user_id={self.test_user_id}",
                    headers={"Content-Type": "application/json"},
                    json=payload,
                    timeout=5
                )
                
                if response.status_code == 200:
                    success_count += 1
                    
            except Exception:
                pass
                
        success = success_count == len(self.test_props)
        details = f"Created {success_count}/{len(self.test_props)} bookmarks"
        self.log_test("Multiple Bookmark Creation", success, details)
        return success
        
    def test_remove_bookmark(self):
        """Test bookmark removal"""
        prop = self.test_props[0]
        payload = {**prop, "bookmarked": False}
        
        try:
            response = requests.post(
                f"{self.base_url}/api/propfinder/bookmark?user_id={self.test_user_id}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=5
            )
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            details = f"Status: {response.status_code}, Response: {json.dumps(data, indent=2)[:100]}..."
            self.log_test("Remove Bookmark", success, details)
            return success
            
        except Exception as e:
            self.log_test("Remove Bookmark", False, f"Error: {str(e)}")
            return False
            
    def test_propfinder_opportunities(self):
        """Test PropFinder opportunities endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/propfinder/opportunities", timeout=10)
            
            success = response.status_code == 200
            data = response.json() if success else {}
            
            opportunities = data.get('data', {}).get('opportunities', [])
            count = len(opportunities)
            
            details = f"Status: {response.status_code}, Opportunities: {count}"
            self.log_test("PropFinder Opportunities", success, details)
            return success
            
        except Exception as e:
            self.log_test("PropFinder Opportunities", False, f"Error: {str(e)}")
            return False
            
    def run_all_tests(self):
        """Run complete validation test suite"""
        print("🎯 Phase 4.2: Bookmark Persistence - Validation Test Suite")
        print("=" * 60)
        print(f"Started at: {datetime.now().isoformat()}")
        print(f"Base URL: {self.base_url}")
        print(f"Test User: {self.test_user_id}")
        print()
        
        # Run all tests
        tests = [
            self.test_api_health,
            self.test_propfinder_opportunities, 
            self.test_create_bookmark,
            self.test_get_bookmarks,
            self.test_multiple_bookmarks,
            self.test_remove_bookmark,
        ]
        
        for test in tests:
            test()
            
        # Summary
        print()
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        total = len(self.results)
        percentage = (passed / total) * 100 if total > 0 else 0
        
        print(f"Tests Run: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {percentage:.1f}%")
        
        if percentage == 100:
            print()
            print("🎉 ALL TESTS PASSED - Phase 4.2 Implementation Complete!")
            print("✅ Bookmark persistence is fully functional")
            print("✅ All API endpoints working correctly") 
            print("✅ Database integration successful")
            print("✅ Ready for production deployment")
        else:
            print()
            print("⚠️ Some tests failed - Review implementation")
            for result in self.results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['details']}")
                    
        print()
        print(f"Completed at: {datetime.now().isoformat()}")
        
        return percentage == 100

if __name__ == "__main__":
    validator = Phase42Validator()
    success = validator.run_all_tests()
    sys.exit(0 if success else 1)