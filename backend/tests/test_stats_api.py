"""
GreenLine365 Stats API Tests
Tests for GET /api/directory/stats endpoint
"""

import pytest
import requests
import os

# Use the public URL for testing
BASE_URL = os.environ.get('BASE_URL', 'https://lead-pipeline-23.preview.emergentagent.com')

class TestStatsAPI:
    """Tests for /api/directory/stats endpoint"""

    def test_stats_endpoint_returns_200(self):
        """Verify stats endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        assert response.status_code == 200
        print(f"✅ Stats endpoint returned 200 OK")

    def test_stats_response_structure(self):
        """Verify response contains required fields"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        required_fields = ['totalBusinesses', 'totalDestinations', 'totalCategories']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
            print(f"✅ Field '{field}' present in response")

    def test_stats_total_businesses_non_zero(self):
        """Verify totalBusinesses is > 0 (live Supabase data)"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        assert data['totalBusinesses'] > 0, "Expected totalBusinesses > 0"
        print(f"✅ totalBusinesses = {data['totalBusinesses']} (non-zero)")

    def test_stats_total_destinations_non_zero(self):
        """Verify totalDestinations is > 0"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        assert data['totalDestinations'] > 0, "Expected totalDestinations > 0"
        print(f"✅ totalDestinations = {data['totalDestinations']} (non-zero)")

    def test_stats_total_categories_non_zero(self):
        """Verify totalCategories is > 0"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        assert data['totalCategories'] > 0, "Expected totalCategories > 0"
        print(f"✅ totalCategories = {data['totalCategories']} (non-zero)")

    def test_stats_data_types(self):
        """Verify all stat values are integers"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        assert isinstance(data['totalBusinesses'], int), "totalBusinesses should be int"
        assert isinstance(data['totalDestinations'], int), "totalDestinations should be int"
        assert isinstance(data['totalCategories'], int), "totalCategories should be int"
        print("✅ All stat values are integers")

    def test_stats_expected_ranges(self):
        """Verify stats are within expected ranges based on live data"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        data = response.json()
        
        # Based on user input: 450+ businesses, 8+ destinations, 13+ categories
        assert data['totalBusinesses'] >= 400, f"Expected ~450+ businesses, got {data['totalBusinesses']}"
        assert data['totalDestinations'] >= 6, f"Expected ~8+ destinations, got {data['totalDestinations']}"
        assert data['totalCategories'] >= 10, f"Expected ~13+ categories, got {data['totalCategories']}"
        print(f"✅ Stats within expected ranges: businesses={data['totalBusinesses']}, destinations={data['totalDestinations']}, categories={data['totalCategories']}")


class TestDirectoryListingsAPI:
    """Tests for /api/directory endpoint"""

    def test_directory_endpoint_returns_200(self):
        """Verify directory endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        assert response.status_code == 200
        print("✅ Directory endpoint returned 200 OK")

    def test_directory_returns_listings(self):
        """Verify directory returns array of listings"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        
        assert isinstance(data, list), "Expected list of listings"
        assert len(data) > 0, "Expected at least 1 listing"
        print(f"✅ Directory returned {len(data)} listings")

    def test_listing_has_required_fields(self):
        """Verify listing objects have required fields"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=1")
        data = response.json()
        
        if len(data) > 0:
            listing = data[0]
            required_fields = ['id', 'business_name', 'slug', 'industry']
            for field in required_fields:
                assert field in listing, f"Listing missing field: {field}"
            print(f"✅ Listing has all required fields")
        else:
            pytest.skip("No listings returned")

    def test_filter_by_industry(self):
        """Verify industry filter works"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=services&limit=5")
        assert response.status_code == 200
        data = response.json()
        
        if len(data) > 0:
            # Check all returned listings have services industry
            for listing in data:
                assert listing.get('industry') == 'services', f"Expected industry=services, got {listing.get('industry')}"
            print(f"✅ Industry filter working - returned {len(data)} services listings")


class TestDiscoverEndpoint:
    """Tests for /api/directory/discover endpoint"""

    def test_discover_returns_destinations(self):
        """Verify discover endpoint returns destinations"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        data = response.json()
        
        assert 'destinations' in data, "Expected 'destinations' in response"
        assert len(data['destinations']) >= 6, f"Expected at least 6 destinations, got {len(data['destinations'])}"
        print(f"✅ Discover returned {len(data['destinations'])} destinations")

    def test_discover_returns_categories(self):
        """Verify discover endpoint returns categories"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        data = response.json()
        
        assert 'categories' in data, "Expected 'categories' in response"
        assert len(data['categories']) >= 9, f"Expected at least 9 categories, got {len(data['categories'])}"
        print(f"✅ Discover returned {len(data['categories'])} categories")


class TestDestinationGuideEndpoint:
    """Tests for /api/directory/guide endpoint"""

    def test_guide_miami_returns_listings(self):
        """Verify Miami guide returns listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=miami")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('destination') == 'miami', f"Expected destination=miami"
        assert data.get('totalCount', 0) > 0, "Expected totalCount > 0 for Miami"
        print(f"✅ Miami guide returned {data.get('totalCount')} listings")

    def test_guide_st_pete_beach_returns_listings(self):
        """Verify St Pete Beach guide returns listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=st-pete-beach")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get('destination') == 'st-pete-beach'
        assert data.get('totalCount', 0) > 0, "Expected totalCount > 0 for St Pete Beach"
        print(f"✅ St Pete Beach guide returned {data.get('totalCount')} listings")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
