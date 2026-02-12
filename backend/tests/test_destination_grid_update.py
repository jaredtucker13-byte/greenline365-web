"""
Test Suite: GreenLine365 Destination Grid Update
Tests: 8-card grid layout, Miami/Jacksonville destinations, API endpoints

Run: pytest /app/backend/tests/test_destination_grid_update.py -v --tb=short --junitxml=/app/test_reports/pytest/destination_grid_results.xml
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://florida-tourism-crm.preview.emergentagent.com').rstrip('/')


class TestDiscoverEndpoint:
    """Tests for GET /api/directory/discover - destination listing"""
    
    def test_discover_returns_8_destinations(self):
        """Verify discover endpoint returns all 8 destinations"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        assert "destinations" in data
        assert len(data["destinations"]) == 8
        
    def test_discover_includes_miami(self):
        """Verify Miami is included in destinations"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        destinations = {d["id"]: d for d in data["destinations"]}
        
        assert "miami" in destinations
        assert destinations["miami"]["label"] == "Miami"
        assert destinations["miami"]["state"] == "FL"
        
    def test_discover_includes_jacksonville(self):
        """Verify Jacksonville is included in destinations"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        destinations = {d["id"]: d for d in data["destinations"]}
        
        assert "jacksonville" in destinations
        assert destinations["jacksonville"]["label"] == "Jacksonville"
        assert destinations["jacksonville"]["state"] == "FL"
        
    def test_discover_destination_order(self):
        """Verify all 8 destinations present with correct structure"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        destination_ids = [d["id"] for d in data["destinations"]]
        
        expected_destinations = [
            'st-pete-beach', 'key-west', 'sarasota', 'ybor-city',
            'daytona', 'orlando', 'miami', 'jacksonville'
        ]
        
        for dest in expected_destinations:
            assert dest in destination_ids, f"Missing destination: {dest}"
            
    def test_discover_returns_10_categories(self):
        """Verify 10 tourism categories are returned"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) == 10


class TestMiamiGuide:
    """Tests for GET /api/directory/guide?destination=miami"""
    
    def test_miami_guide_endpoint_success(self):
        """Verify Miami guide endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=miami")
        assert response.status_code == 200
        
    def test_miami_guide_has_listings(self):
        """Verify Miami guide has business listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=miami")
        assert response.status_code == 200
        
        data = response.json()
        assert data["destination"] == "miami"
        assert data["totalCount"] > 0, "Miami should have listings"
        
    def test_miami_guide_has_sections(self):
        """Verify Miami guide has section groupings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=miami")
        assert response.status_code == 200
        
        data = response.json()
        assert "sections" in data
        
        expected_sections = ['stay', 'eat-drink', 'things-to-do']
        for section in expected_sections:
            assert section in data["sections"], f"Missing section: {section}"
            
    def test_miami_listings_have_required_fields(self):
        """Verify Miami listings have required fields"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=miami")
        assert response.status_code == 200
        
        data = response.json()
        
        # Get first listing from any section
        listing = None
        for section_id, listings in data["sections"].items():
            if listings:
                listing = listings[0]
                break
                
        if listing:
            required_fields = ['id', 'business_name', 'slug', 'industry', 'tags']
            for field in required_fields:
                assert field in listing, f"Missing field: {field}"


class TestJacksonvilleGuide:
    """Tests for GET /api/directory/guide?destination=jacksonville"""
    
    def test_jacksonville_guide_endpoint_success(self):
        """Verify Jacksonville guide endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=jacksonville")
        assert response.status_code == 200
        
    def test_jacksonville_guide_has_listings(self):
        """Verify Jacksonville guide has business listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=jacksonville")
        assert response.status_code == 200
        
        data = response.json()
        assert data["destination"] == "jacksonville"
        assert data["totalCount"] > 0, "Jacksonville should have listings"
        
    def test_jacksonville_guide_has_sections(self):
        """Verify Jacksonville guide has section groupings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=jacksonville")
        assert response.status_code == 200
        
        data = response.json()
        assert "sections" in data
        
        expected_sections = ['stay', 'eat-drink', 'things-to-do']
        for section in expected_sections:
            assert section in data["sections"], f"Missing section: {section}"
            
    def test_jacksonville_listings_tagged_correctly(self):
        """Verify Jacksonville listings have proper destination tag"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=jacksonville")
        assert response.status_code == 200
        
        data = response.json()
        
        # Check listings in any section
        for section_id, listings in data["sections"].items():
            for listing in listings:
                assert 'destination:jacksonville' in listing.get('tags', []), \
                    f"Listing {listing.get('business_name')} missing destination tag"


class TestExistingDestinations:
    """Verify existing 6 destinations still work correctly"""
    
    @pytest.mark.parametrize("destination", [
        "st-pete-beach", "key-west", "sarasota", "ybor-city", "daytona", "orlando"
    ])
    def test_existing_destination_guide_works(self, destination):
        """Verify each existing destination guide endpoint works"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination={destination}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["destination"] == destination
        assert "sections" in data
        assert "totalCount" in data


class TestInvalidDestination:
    """Tests for error handling with invalid destinations"""
    
    def test_invalid_destination_returns_empty(self):
        """Verify invalid destination returns empty data (not error)"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=invalid-city")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("totalCount", 0) == 0
        
    def test_missing_destination_param_returns_error(self):
        """Verify missing destination parameter returns 400"""
        response = requests.get(f"{BASE_URL}/api/directory/guide")
        assert response.status_code == 400


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
