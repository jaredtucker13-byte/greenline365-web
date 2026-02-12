"""
GL365 Phase 1 Directory Rebuild Tests
Tests for:
- 9 categories with subcategory filtering
- API returns has_property_intelligence and search_weight
- Industry filtering works correctly
"""

import pytest
import requests
import os

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'http://localhost:3000').rstrip('/')


class TestDirectoryAPI:
    """Tests for /api/directory endpoint - Phase 1 features"""
    
    def test_directory_endpoint_returns_200(self):
        """Basic health check - endpoint responds"""
        response = requests.get(f"{BASE_URL}/api/directory")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Directory API returns 200")
    
    def test_directory_returns_list(self):
        """Endpoint returns a list of listings"""
        response = requests.get(f"{BASE_URL}/api/directory")
        data = response.json()
        assert isinstance(data, list), "Expected list response"
        print(f"✓ Returns list with {len(data)} listings")
    
    def test_listing_has_required_fields(self):
        """Each listing has the required Phase 1 fields"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        
        required_fields = [
            'id', 'business_name', 'slug', 'industry', 
            'has_property_intelligence', 'search_weight'
        ]
        
        for listing in data:
            for field in required_fields:
                assert field in listing, f"Missing field: {field}"
        
        print(f"✓ All listings have required fields including has_property_intelligence and search_weight")
    
    def test_has_property_intelligence_is_boolean(self):
        """has_property_intelligence field is boolean"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        
        for listing in data:
            assert isinstance(listing.get('has_property_intelligence'), bool), \
                f"has_property_intelligence should be boolean, got {type(listing.get('has_property_intelligence'))}"
        
        print(f"✓ has_property_intelligence is boolean for all listings")
    
    def test_search_weight_is_integer(self):
        """search_weight field is integer"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        
        for listing in data:
            assert isinstance(listing.get('search_weight'), int), \
                f"search_weight should be int, got {type(listing.get('search_weight'))}"
        
        print(f"✓ search_weight is integer for all listings")


class TestIndustryFiltering:
    """Tests for industry/category filtering"""
    
    def test_services_industry_filter(self):
        """Filter by services industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=services")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Services industry filter returns {len(data)} listings")
        
        # Verify all returned listings are services
        if data:
            for listing in data:
                assert listing.get('industry') == 'services', \
                    f"Expected services, got {listing.get('industry')}"
    
    def test_dining_industry_filter(self):
        """Filter by dining industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=dining")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Dining industry filter returns {len(data)} listings")
    
    def test_health_wellness_industry_filter(self):
        """Filter by health-wellness industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=health-wellness")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Health & Wellness industry filter returns {len(data)} listings")
    
    def test_nightlife_industry_filter(self):
        """Filter by nightlife industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=nightlife")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Nightlife industry filter returns {len(data)} listings")
    
    def test_destinations_industry_filter(self):
        """Filter by destinations industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=destinations")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Destinations industry filter returns {len(data)} listings")
    
    def test_family_entertainment_industry_filter(self):
        """Filter by family-entertainment industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=family-entertainment")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Family Entertainment industry filter returns {len(data)} listings")
    
    def test_style_shopping_industry_filter(self):
        """Filter by style-shopping industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=style-shopping")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Style & Shopping industry filter returns {len(data)} listings")


class TestSearchFunctionality:
    """Tests for search within directory"""
    
    def test_search_returns_results(self):
        """Search with keyword returns results"""
        response = requests.get(f"{BASE_URL}/api/directory?search=plumbing")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search 'plumbing' returns {len(data)} results")
    
    def test_search_with_industry(self):
        """Search within specific industry works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=services&search=electrical")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Search 'electrical' in services returns {len(data)} results")
        
        # Verify all results are services industry
        for listing in data:
            assert listing.get('industry') == 'services'
    
    def test_empty_search_returns_all(self):
        """Empty search returns all listings"""
        response = requests.get(f"{BASE_URL}/api/directory")
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0, "Expected at least some listings"
        print(f"✓ Empty search returns {len(data)} listings")


class TestLimitParameter:
    """Tests for limit parameter"""
    
    def test_limit_parameter_works(self):
        """Limit parameter restricts results"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5, f"Expected max 5, got {len(data)}"
        print(f"✓ Limit=5 returns {len(data)} listings")
    
    def test_different_limit_values(self):
        """Different limit values work"""
        for limit in [1, 10, 50]:
            response = requests.get(f"{BASE_URL}/api/directory?limit={limit}")
            assert response.status_code == 200
            data = response.json()
            assert len(data) <= limit
            print(f"✓ Limit={limit} returns {len(data)} listings")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
