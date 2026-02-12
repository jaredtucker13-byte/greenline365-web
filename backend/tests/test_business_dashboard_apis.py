"""
Business Dashboard API Tests
Tests for the new business owner dashboard feature:
- /api/directory/my-listing (GET, PATCH) - Get/update user's claimed listings
- /api/directory/claim (POST) - Claim an existing listing
- /api/directory/stats - Verify still returns valid data
- /api/directory?limit=N - Verify returns tier and is_claimed fields
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://florida-tourism-crm.preview.emergentagent.com').rstrip('/')


class TestUnauthenticatedAccess:
    """Test that protected endpoints return 401 when not authenticated"""
    
    def test_get_my_listing_returns_401_unauthenticated(self):
        """GET /api/directory/my-listing should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/directory/my-listing")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
        print("✅ GET /api/directory/my-listing returns 401 when unauthenticated")
    
    def test_post_claim_returns_401_unauthenticated(self):
        """POST /api/directory/claim should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/directory/claim",
            json={"listing_id": "test-123"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
        print("✅ POST /api/directory/claim returns 401 when unauthenticated")
    
    def test_patch_my_listing_returns_401_unauthenticated(self):
        """PATCH /api/directory/my-listing should return 401 without auth"""
        response = requests.patch(
            f"{BASE_URL}/api/directory/my-listing",
            json={"listing_id": "test-123", "business_name": "Test Business"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "error" in data
        assert data["error"] == "Unauthorized"
        print("✅ PATCH /api/directory/my-listing returns 401 when unauthenticated")


class TestPublicAPIs:
    """Test public directory APIs"""
    
    def test_stats_endpoint_returns_valid_data(self):
        """GET /api/directory/stats should return valid stats with totalBusinesses > 0"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify required fields exist
        assert "totalBusinesses" in data
        assert "totalDestinations" in data
        assert "totalCategories" in data
        
        # Verify totalBusinesses > 0
        assert isinstance(data["totalBusinesses"], int)
        assert data["totalBusinesses"] > 0, f"Expected totalBusinesses > 0, got {data['totalBusinesses']}"
        print(f"✅ GET /api/directory/stats returns valid data: {data['totalBusinesses']} businesses")
    
    def test_directory_returns_tier_and_is_claimed_fields(self):
        """GET /api/directory?limit=2 should return listings with tier and is_claimed fields"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=2")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert isinstance(data, list), "Expected list response"
        assert len(data) >= 1, "Expected at least 1 listing"
        
        for listing in data:
            # Check required fields
            assert "id" in listing, "Listing missing 'id' field"
            assert "business_name" in listing, "Listing missing 'business_name' field"
            
            # Check tier field
            assert "tier" in listing, "Listing missing 'tier' field"
            assert listing["tier"] in ["free", "pro", "premium"], f"Invalid tier: {listing['tier']}"
            
            # Check is_claimed field  
            assert "is_claimed" in listing, "Listing missing 'is_claimed' field"
            assert isinstance(listing["is_claimed"], bool), f"is_claimed should be boolean, got {type(listing['is_claimed'])}"
        
        print(f"✅ GET /api/directory?limit=2 returns listings with tier and is_claimed fields")
        print(f"   Sample: {data[0]['business_name']} - tier: {data[0]['tier']}, is_claimed: {data[0]['is_claimed']}")
    
    def test_directory_listing_has_expected_structure(self):
        """Verify directory listing response has expected fields"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=1")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 1
        listing = data[0]
        
        expected_fields = [
            "id", "business_name", "slug", "industry", "phone", "website",
            "city", "state", "tier", "is_claimed", "trust_score"
        ]
        
        for field in expected_fields:
            assert field in listing, f"Missing expected field: {field}"
        
        print(f"✅ Directory listing has all expected fields")


class TestStatsAPIReliability:
    """Additional tests for stats API to ensure it's working correctly"""
    
    def test_stats_returns_all_required_fields(self):
        """Stats API should return all 4 required fields"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["totalBusinesses", "totalDestinations", "totalCategories", "totalLeads"]
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            assert isinstance(data[field], int), f"{field} should be integer"
        
        print(f"✅ Stats API returns all required fields: {data}")
    
    def test_stats_values_are_reasonable(self):
        """Stats values should be reasonable (>0 for active directory)"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        assert response.status_code == 200
        data = response.json()
        
        # For an active directory, these should all be positive
        assert data["totalBusinesses"] > 0, "totalBusinesses should be > 0"
        assert data["totalDestinations"] > 0, "totalDestinations should be > 0"
        assert data["totalCategories"] > 0, "totalCategories should be > 0"
        
        print(f"✅ Stats values are reasonable: {data['totalBusinesses']} businesses, {data['totalDestinations']} destinations, {data['totalCategories']} categories")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
