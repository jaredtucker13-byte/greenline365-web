#!/usr/bin/env python3
"""
Backend API Testing for GreenLine365 Waitlist and Newsletter Endpoints
Tests the Next.js API routes for waitlist and newsletter functionality
"""

import requests
import json
import sys
import time
from typing import Dict, Any

# Configuration
BASE_URL = "http://localhost:3000"
WAITLIST_ENDPOINT = f"{BASE_URL}/api/waitlist"
NEWSLETTER_ENDPOINT = f"{BASE_URL}/api/newsletter"

class APITester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, passed: bool, details: str = ""):
        """Log test results"""
        status = "✅ PASS" if passed else "❌ FAIL"
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        print(result)
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "details": details
        })
        
        if not passed:
            self.failed_tests.append(test_name)
    
    def test_waitlist_valid_data(self):
        """Test POST /api/waitlist with valid data"""
        test_name = "Waitlist API - Valid Data"
        
        payload = {
            "email": "apitest@test.com",
            "name": "API Tester",
            "company": "Test Inc",
            "industry": "retail"
        }
        
        try:
            response = requests.post(WAITLIST_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                if "message" in data and "data" in data:
                    self.log_test(test_name, True, f"Status: {response.status_code}, Message: {data.get('message')}")
                else:
                    self.log_test(test_name, False, f"Missing required fields in response: {data}")
            else:
                self.log_test(test_name, False, f"Expected 201, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_waitlist_duplicate_email(self):
        """Test POST /api/waitlist with duplicate email (should return 409)"""
        test_name = "Waitlist API - Duplicate Email"
        
        payload = {
            "email": "apitest@test.com",  # Same email as previous test
            "name": "Another Tester",
            "company": "Another Company",
            "industry": "tech"
        }
        
        try:
            response = requests.post(WAITLIST_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 409:
                data = response.json()
                if "error" in data:
                    self.log_test(test_name, True, f"Status: {response.status_code}, Error: {data.get('error')}")
                else:
                    self.log_test(test_name, False, f"Missing error field in response: {data}")
            else:
                self.log_test(test_name, False, f"Expected 409, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_waitlist_missing_email(self):
        """Test POST /api/waitlist with missing email (should return 400)"""
        test_name = "Waitlist API - Missing Email"
        
        payload = {
            "name": "Test User",
            "company": "Test Company",
            "industry": "tech"
            # Missing email field
        }
        
        try:
            response = requests.post(WAITLIST_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "error" in data and "email" in data["error"].lower():
                    self.log_test(test_name, True, f"Status: {response.status_code}, Error: {data.get('error')}")
                else:
                    self.log_test(test_name, False, f"Error message doesn't mention email: {data}")
            else:
                self.log_test(test_name, False, f"Expected 400, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_newsletter_valid_data(self):
        """Test POST /api/newsletter with valid data"""
        test_name = "Newsletter API - Valid Data"
        
        payload = {
            "email": "newstest@test.com",
            "name": "News Subscriber"
        }
        
        try:
            response = requests.post(NEWSLETTER_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 201:
                data = response.json()
                if "message" in data and "data" in data:
                    self.log_test(test_name, True, f"Status: {response.status_code}, Message: {data.get('message')}")
                else:
                    self.log_test(test_name, False, f"Missing required fields in response: {data}")
            else:
                self.log_test(test_name, False, f"Expected 201, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_newsletter_duplicate_email(self):
        """Test POST /api/newsletter with duplicate email (should return 409)"""
        test_name = "Newsletter API - Duplicate Email"
        
        payload = {
            "email": "newstest@test.com",  # Same email as previous test
            "name": "Another Subscriber"
        }
        
        try:
            response = requests.post(NEWSLETTER_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 409:
                data = response.json()
                if "error" in data:
                    self.log_test(test_name, True, f"Status: {response.status_code}, Error: {data.get('error')}")
                else:
                    self.log_test(test_name, False, f"Missing error field in response: {data}")
            else:
                self.log_test(test_name, False, f"Expected 409, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_newsletter_missing_email(self):
        """Test POST /api/newsletter with missing email (should return 400)"""
        test_name = "Newsletter API - Missing Email"
        
        payload = {
            "name": "Test Subscriber"
            # Missing email field
        }
        
        try:
            response = requests.post(NEWSLETTER_ENDPOINT, json=payload, timeout=10)
            
            if response.status_code == 400:
                data = response.json()
                if "error" in data and "email" in data["error"].lower():
                    self.log_test(test_name, True, f"Status: {response.status_code}, Error: {data.get('error')}")
                else:
                    self.log_test(test_name, False, f"Error message doesn't mention email: {data}")
            else:
                self.log_test(test_name, False, f"Expected 400, got {response.status_code}: {response.text}")
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
    
    def test_server_connectivity(self):
        """Test if the server is accessible"""
        test_name = "Server Connectivity"
        
        try:
            response = requests.get(BASE_URL, timeout=5)
            if response.status_code in [200, 404]:  # 404 is fine, means server is running
                self.log_test(test_name, True, f"Server accessible at {BASE_URL}")
            else:
                self.log_test(test_name, False, f"Unexpected status code: {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Cannot connect to server: {str(e)}")
    
    def run_all_tests(self):
        """Run all API tests"""
        print("=" * 60)
        print("🧪 BACKEND API TESTING - GreenLine365 Waitlist & Newsletter")
        print("=" * 60)
        print(f"Testing endpoints at: {BASE_URL}")
        print()
        
        # Test server connectivity first
        self.test_server_connectivity()
        print()
        
        # Test waitlist endpoints
        print("📝 WAITLIST API TESTS")
        print("-" * 30)
        self.test_waitlist_valid_data()
        time.sleep(0.5)  # Small delay between tests
        self.test_waitlist_duplicate_email()
        time.sleep(0.5)
        self.test_waitlist_missing_email()
        print()
        
        # Test newsletter endpoints
        print("📧 NEWSLETTER API TESTS")
        print("-" * 30)
        self.test_newsletter_valid_data()
        time.sleep(0.5)
        self.test_newsletter_duplicate_email()
        time.sleep(0.5)
        self.test_newsletter_missing_email()
        print()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["passed"])
        failed_tests = total_tests - passed_tests
        
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        
        if self.failed_tests:
            print("\n🚨 FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print("\n" + "=" * 60)
        
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED!")
        else:
            print(f"⚠️  {failed_tests} TEST(S) FAILED")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)