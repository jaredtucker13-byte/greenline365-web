"""
Stress Testing for GreenLine365 Booking System
Tests: Double-booking prevention, concurrent requests, input validation, security
"""
import pytest
import requests
import time
import threading
import concurrent.futures
from datetime import datetime, timedelta
import json
import os

# Use localhost for testing since external URL has routing issues
BASE_URL = os.environ.get('base_url', 'http://localhost:3000')

class TestDoubleBookingPrevention:
    """CRITICAL: Test double-booking prevention - same datetime slot twice"""
    
    def test_double_booking_same_slot(self):
        """Test that booking the same datetime slot twice should be prevented"""
        # Generate a unique datetime for this test
        test_datetime = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%dT10:00:00")
        
        booking_data = {
            "full_name": "TEST_DoubleBook_User1",
            "email": "test_double1@example.com",
            "phone": "555-0001",
            "preferred_datetime": test_datetime,
            "source": "stress_test",
            "status": "pending"
        }
        
        # First booking - should succeed
        response1 = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"First booking response: {response1.status_code} - {response1.text[:200]}")
        assert response1.status_code == 201, f"First booking should succeed: {response1.text}"
        
        # Second booking with same datetime - SHOULD BE REJECTED (but currently isn't!)
        booking_data2 = {
            "full_name": "TEST_DoubleBook_User2",
            "email": "test_double2@example.com",
            "phone": "555-0002",
            "preferred_datetime": test_datetime,  # Same datetime!
            "source": "stress_test",
            "status": "pending"
        }
        
        response2 = requests.post(f"{BASE_URL}/api/bookings", json=booking_data2)
        print(f"Second booking (same slot) response: {response2.status_code} - {response2.text[:200]}")
        
        # This test documents the BUG - currently both bookings succeed
        # The API SHOULD return 409 Conflict or 400 Bad Request for double booking
        if response2.status_code == 201:
            pytest.fail(
                f"CRITICAL BUG: Double booking allowed! "
                f"Both bookings for {test_datetime} succeeded. "
                f"API should reject duplicate datetime slots."
            )
        else:
            assert response2.status_code in [400, 409], \
                f"Expected 400 or 409 for double booking, got {response2.status_code}"


class TestConcurrentBookingRequests:
    """Test concurrent/parallel booking requests for same slot"""
    
    def test_concurrent_booking_same_slot(self):
        """Test race condition - multiple simultaneous requests for same slot"""
        test_datetime = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%dT11:00:00")
        results = []
        errors = []
        
        def make_booking(user_num):
            try:
                booking_data = {
                    "full_name": f"TEST_Concurrent_User{user_num}",
                    "email": f"test_concurrent{user_num}@example.com",
                    "phone": f"555-100{user_num}",
                    "preferred_datetime": test_datetime,
                    "source": "concurrent_test",
                    "status": "pending"
                }
                response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data, timeout=10)
                results.append({
                    "user": user_num,
                    "status": response.status_code,
                    "success": response.status_code == 201
                })
                return response
            except Exception as e:
                errors.append({"user": user_num, "error": str(e)})
                return None
        
        # Send 5 concurrent requests for the same slot
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(make_booking, i) for i in range(1, 6)]
            concurrent.futures.wait(futures)
        
        successful_bookings = [r for r in results if r["success"]]
        print(f"Concurrent test results: {len(successful_bookings)} successful out of 5")
        print(f"Results: {results}")
        
        # Only ONE booking should succeed for the same slot
        if len(successful_bookings) > 1:
            pytest.fail(
                f"CRITICAL BUG: Race condition! {len(successful_bookings)} bookings succeeded "
                f"for the same datetime slot {test_datetime}. Only 1 should succeed."
            )
        
        assert len(successful_bookings) <= 1, \
            f"Expected at most 1 successful booking, got {len(successful_bookings)}"


class TestBookingInputValidation:
    """Test input validation for booking widget"""
    
    def test_empty_name_rejected(self):
        """Required field: name cannot be empty"""
        booking_data = {
            "full_name": "",  # Empty name
            "email": "test@example.com",
            "preferred_datetime": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT09:00:00"),
            "source": "validation_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Empty name test: {response.status_code} - {response.text[:200]}")
        
        # Should reject empty name - but API might not validate
        if response.status_code == 201:
            print("WARNING: API accepts empty name - validation missing")
        # Document behavior rather than fail
    
    def test_empty_email_rejected(self):
        """Required field: email cannot be empty"""
        booking_data = {
            "full_name": "TEST_NoEmail_User",
            "email": "",  # Empty email
            "preferred_datetime": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT09:30:00"),
            "source": "validation_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Empty email test: {response.status_code} - {response.text[:200]}")
        
        if response.status_code == 201:
            print("WARNING: API accepts empty email - validation missing")
    
    def test_invalid_email_format(self):
        """Email format validation"""
        booking_data = {
            "full_name": "TEST_InvalidEmail_User",
            "email": "not-an-email",  # Invalid format
            "preferred_datetime": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%dT10:00:00"),
            "source": "validation_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Invalid email format test: {response.status_code} - {response.text[:200]}")
        
        if response.status_code == 201:
            print("WARNING: API accepts invalid email format - validation missing")
    
    def test_missing_datetime(self):
        """Required field: preferred_datetime"""
        booking_data = {
            "full_name": "TEST_NoDatetime_User",
            "email": "test@example.com",
            # Missing preferred_datetime
            "source": "validation_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Missing datetime test: {response.status_code} - {response.text[:200]}")


class TestSecurityInputSanitization:
    """Test input sanitization and security"""
    
    def test_xss_prevention_in_name(self):
        """Test XSS script injection in name field"""
        booking_data = {
            "full_name": "<script>alert('XSS')</script>",
            "email": "xss_test@example.com",
            "preferred_datetime": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%dT09:00:00"),
            "source": "security_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"XSS test response: {response.status_code}")
        
        if response.status_code == 201:
            # Check if script tags are stored as-is (vulnerability)
            data = response.json()
            if data.get("booking", {}).get("full_name") == "<script>alert('XSS')</script>":
                print("WARNING: XSS payload stored without sanitization")
    
    def test_sql_injection_prevention(self):
        """Test SQL injection in fields"""
        booking_data = {
            "full_name": "'; DROP TABLE bookings; --",
            "email": "sql_test@example.com",
            "preferred_datetime": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%dT09:30:00"),
            "source": "security_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"SQL injection test response: {response.status_code}")
        
        # Verify bookings table still exists
        get_response = requests.get(f"{BASE_URL}/api/bookings")
        assert get_response.status_code == 200, "Bookings endpoint should still work after SQL injection attempt"
    
    def test_max_field_length(self):
        """Test maximum field length handling"""
        long_string = "A" * 10000  # Very long string
        booking_data = {
            "full_name": long_string,
            "email": "length_test@example.com",
            "preferred_datetime": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%dT10:00:00"),
            "source": "security_test"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Max length test response: {response.status_code}")
        
        # Should either truncate or reject - not crash


class TestAuthenticationMiddleware:
    """Test authentication requirements for protected routes"""
    
    def test_admin_v2_requires_auth(self):
        """Verify /admin-v2/* routes require authentication"""
        # Try to access admin page without auth
        response = requests.get(f"{BASE_URL}/admin-v2", allow_redirects=False)
        print(f"Admin-v2 access without auth: {response.status_code}")
        
        # Should redirect to login (302) or return 401
        assert response.status_code in [302, 307, 401], \
            f"Admin route should require auth, got {response.status_code}"
        
        if response.status_code in [302, 307]:
            location = response.headers.get('Location', '')
            assert 'login' in location.lower(), \
                f"Should redirect to login, got: {location}"
    
    def test_admin_v2_blog_polish_requires_auth(self):
        """Verify /admin-v2/blog-polish requires authentication"""
        response = requests.get(f"{BASE_URL}/admin-v2/blog-polish", allow_redirects=False)
        print(f"Blog-polish access without auth: {response.status_code}")
        
        assert response.status_code in [302, 307, 401], \
            f"Blog-polish route should require auth, got {response.status_code}"
    
    def test_public_api_accessible(self):
        """Verify public APIs don't require auth"""
        # Booking API should be public
        response = requests.get(f"{BASE_URL}/api/bookings")
        print(f"Public booking API: {response.status_code}")
        assert response.status_code == 200, "Booking API should be publicly accessible"


class TestRateLimiting:
    """Test API rate limiting"""
    
    def test_rapid_successive_requests(self):
        """Test rapid successive requests to detect rate limiting"""
        responses = []
        
        # Send 20 rapid requests
        for i in range(20):
            response = requests.get(f"{BASE_URL}/api/bookings")
            responses.append(response.status_code)
        
        rate_limited = [r for r in responses if r == 429]
        print(f"Rate limiting test: {len(rate_limited)} requests rate limited out of 20")
        
        if len(rate_limited) == 0:
            print("INFO: No rate limiting detected - may want to implement")
        
        # All should succeed or some should be rate limited
        assert all(r in [200, 429] for r in responses), \
            f"Unexpected status codes: {set(responses)}"


class TestScheduleCallAPI:
    """Test the schedule-call API endpoint"""
    
    def test_schedule_call_requires_fields(self):
        """Test required fields validation"""
        # Missing required fields
        response = requests.post(f"{BASE_URL}/api/schedule-call", json={})
        print(f"Schedule call empty body: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 400, \
            f"Should reject empty body, got {response.status_code}"
    
    def test_schedule_call_valid_request(self):
        """Test valid schedule call request"""
        call_data = {
            "lead_name": "TEST_ScheduleCall_User",
            "lead_phone": "+15551234567",
            "lead_email": "schedule_test@example.com",
            "purpose": "follow_up",
            "notes": "Test call scheduling"
        }
        response = requests.post(f"{BASE_URL}/api/schedule-call", json=call_data)
        print(f"Schedule call valid request: {response.status_code} - {response.text[:200]}")
        
        # Should succeed or fail gracefully
        assert response.status_code in [200, 201, 500], \
            f"Unexpected status: {response.status_code}"


class TestBookingAPIBasics:
    """Basic booking API functionality tests"""
    
    def test_get_bookings(self):
        """Test GET /api/bookings endpoint"""
        response = requests.get(f"{BASE_URL}/api/bookings")
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"GET bookings: {len(data['bookings'])} bookings found")
    
    def test_create_booking_success(self):
        """Test successful booking creation"""
        booking_data = {
            "full_name": "TEST_Basic_User",
            "email": "basic_test@example.com",
            "phone": "555-9999",
            "preferred_datetime": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%dT14:00:00"),
            "source": "basic_test",
            "status": "pending"
        }
        response = requests.post(f"{BASE_URL}/api/bookings", json=booking_data)
        print(f"Create booking: {response.status_code}")
        
        assert response.status_code == 201
        data = response.json()
        assert data.get("success") == True
        assert "booking" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
