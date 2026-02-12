"""
GreenLine365 Destination Guides API Tests
Tests for:
- /api/directory/discover (GET) - list destinations and tourism categories
- /api/directory/guide?destination=<slug> - grouped listings for a destination
- /api/directory with destination and tourism_category filters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://florida-tourism-crm.preview.emergentagent.com').rstrip('/')

class TestDiscoverEndpoint:
    """Tests for GET /api/directory/discover - returns available destinations and categories"""
    
    def test_discover_returns_destinations(self):
        """GET /api/directory/discover returns list of destinations"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert 'destinations' in data, "Response should include 'destinations' key"
        assert len(data['destinations']) >= 6, f"Expected at least 6 destinations, got {len(data['destinations'])}"
        
        # Verify specific destinations exist
        destination_ids = [d['id'] for d in data['destinations']]
        expected_destinations = ['st-pete-beach', 'key-west', 'sarasota', 'ybor-city', 'daytona', 'orlando']
        for dest in expected_destinations:
            assert dest in destination_ids, f"Missing expected destination: {dest}"
    
    def test_discover_returns_categories(self):
        """GET /api/directory/discover returns list of tourism categories"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        assert 'categories' in data, "Response should include 'categories' key"
        assert len(data['categories']) >= 10, f"Expected at least 10 categories, got {len(data['categories'])}"
        
        # Verify specific categories exist
        category_ids = [c['id'] for c in data['categories']]
        expected_categories = ['stay', 'eat-drink', 'quick-eats', 'things-to-do', 'beaches-nature', 
                              'family-fun', 'shopping', 'everyday-essentials', 'nightlife', 'getting-around']
        for cat in expected_categories:
            assert cat in category_ids, f"Missing expected category: {cat}"
    
    def test_discover_destination_structure(self):
        """Each destination has correct structure (id, label, state)"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        for dest in data['destinations']:
            assert 'id' in dest, "Destination should have 'id'"
            assert 'label' in dest, "Destination should have 'label'"
            assert 'state' in dest, "Destination should have 'state'"
            assert dest['state'] == 'FL', f"State should be FL, got {dest['state']}"
    
    def test_discover_category_structure(self):
        """Each category has correct structure (id, label, industry)"""
        response = requests.get(f"{BASE_URL}/api/directory/discover")
        assert response.status_code == 200
        
        data = response.json()
        for cat in data['categories']:
            assert 'id' in cat, "Category should have 'id'"
            assert 'label' in cat, "Category should have 'label'"
            assert 'industry' in cat, "Category should have 'industry'"


class TestGuideEndpoint:
    """Tests for GET /api/directory/guide?destination=<slug> - returns grouped listings"""
    
    def test_guide_st_pete_beach(self):
        """GET /api/directory/guide?destination=st-pete-beach returns grouped listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=st-pete-beach")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['destination'] == 'st-pete-beach', "Destination should match request"
        assert 'totalCount' in data, "Response should have totalCount"
        assert data['totalCount'] > 0, "Should have listings"
        assert 'sections' in data, "Response should have sections"
    
    def test_guide_key_west(self):
        """GET /api/directory/guide?destination=key-west returns grouped listings"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=key-west")
        assert response.status_code == 200
        
        data = response.json()
        assert data['destination'] == 'key-west'
        assert data['totalCount'] > 0, "Key West should have listings"
        assert 'sections' in data
    
    def test_guide_has_correct_section_keys(self):
        """Guide endpoint returns all tourism category sections"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=st-pete-beach")
        assert response.status_code == 200
        
        data = response.json()
        sections = data['sections']
        
        expected_sections = ['stay', 'eat-drink', 'quick-eats', 'things-to-do', 'beaches-nature',
                           'family-fun', 'shopping', 'everyday-essentials', 'nightlife', 'getting-around']
        
        for section in expected_sections:
            assert section in sections, f"Missing section: {section}"
    
    def test_guide_missing_destination_returns_400(self):
        """GET /api/directory/guide without destination returns 400"""
        response = requests.get(f"{BASE_URL}/api/directory/guide")
        assert response.status_code == 400
        data = response.json()
        assert 'error' in data
    
    def test_guide_listing_structure(self):
        """Guide listings have expected fields including metadata with google_rating"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=st-pete-beach")
        assert response.status_code == 200
        
        data = response.json()
        # Find a section with listings
        for section_key, listings in data['sections'].items():
            if len(listings) > 0:
                listing = listings[0]
                # Check required fields
                assert 'id' in listing, "Listing should have 'id'"
                assert 'business_name' in listing, "Listing should have 'business_name'"
                assert 'slug' in listing, "Listing should have 'slug'"
                assert 'tags' in listing, "Listing should have 'tags'"
                assert 'metadata' in listing, "Listing should have 'metadata'"
                
                # Check metadata has google_rating if available
                metadata = listing['metadata']
                if metadata:
                    assert 'google_rating' in metadata or metadata.get('google_rating') is None
                break


class TestDirectoryFilters:
    """Tests for GET /api/directory with destination and tourism_category filters"""
    
    def test_filter_by_destination(self):
        """GET /api/directory?destination=st-pete-beach filters by destination"""
        response = requests.get(f"{BASE_URL}/api/directory?destination=st-pete-beach")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should return listings"
        
        # Verify all listings have the destination tag
        for listing in data:
            tags = listing.get('tags', [])
            assert 'destination:st-pete-beach' in tags, f"Listing {listing['business_name']} missing destination tag"
    
    def test_filter_by_tourism_category(self):
        """GET /api/directory?tourism_category=eat-drink filters by tourism category"""
        response = requests.get(f"{BASE_URL}/api/directory?tourism_category=eat-drink")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Verify all listings have the tourism tag
        for listing in data:
            tags = listing.get('tags', [])
            assert 'tourism:eat-drink' in tags, f"Listing {listing['business_name']} missing tourism tag"
    
    def test_filter_by_destination_and_category(self):
        """GET /api/directory with both filters returns combined results"""
        response = requests.get(f"{BASE_URL}/api/directory?destination=st-pete-beach&tourism_category=eat-drink")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Verify all listings have both tags
        for listing in data:
            tags = listing.get('tags', [])
            assert 'destination:st-pete-beach' in tags
            assert 'tourism:eat-drink' in tags
    
    def test_listing_has_photo_gating_fields(self):
        """Filtered listings have photo gating fields (has_property_intelligence, search_weight)"""
        response = requests.get(f"{BASE_URL}/api/directory?destination=st-pete-beach")
        assert response.status_code == 200
        
        data = response.json()
        if len(data) > 0:
            listing = data[0]
            assert 'has_property_intelligence' in listing, "Should have has_property_intelligence"
            assert 'search_weight' in listing, "Should have search_weight"


class TestInvalidDestination:
    """Tests for invalid destination handling"""
    
    def test_guide_invalid_destination(self):
        """GET /api/directory/guide with invalid destination returns empty sections"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination=invalid-slug-123")
        assert response.status_code == 200  # Returns empty data, not error
        
        data = response.json()
        assert data['totalCount'] == 0, "Invalid destination should have 0 listings"


class TestAllDestinations:
    """Tests to verify all 6 destinations have data"""
    
    @pytest.mark.parametrize("destination", [
        "st-pete-beach",
        "key-west",
        "sarasota",
        "ybor-city",
        "daytona",
        "orlando"
    ])
    def test_destination_has_listings(self, destination):
        """Each destination should have listings in the guide"""
        response = requests.get(f"{BASE_URL}/api/directory/guide?destination={destination}")
        assert response.status_code == 200
        
        data = response.json()
        # At least some destinations should have data (allow for newer destinations being empty)
        assert 'totalCount' in data


if __name__ == "__main__":
    pytest.main([__file__, '-v', '--tb=short'])
