"""
Test Listing Detail API - /api/directory/[slug]
Tests individual business listing detail pages API endpoints
"""
import pytest
import requests
import os

BASE_URL = "https://florida-tourism-crm.preview.emergentagent.com"


class TestListingDetailAPI:
    """Tests for the /api/directory/[slug] endpoint"""
    
    def test_get_listing_by_slug_success(self):
        """GET /api/directory/la-segunda-bakery returns listing data"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify essential fields exist
        assert "id" in data, "Response should have id"
        assert "business_name" in data, "Response should have business_name"
        assert "slug" in data, "Response should have slug"
        assert "city" in data, "Response should have city"
        assert "metadata" in data, "Response should have metadata"
        assert "gallery_images" in data, "Response should have gallery_images"
        assert "related" in data, "Response should have related businesses"
        
        # Verify specific values for la-segunda-bakery
        assert data["business_name"] == "La Segunda Bakery and Cafe", f"Expected 'La Segunda Bakery and Cafe', got {data['business_name']}"
        assert data["slug"] == "la-segunda-bakery", f"Expected 'la-segunda-bakery', got {data['slug']}"
        assert data["city"] == "Tampa", f"Expected 'Tampa', got {data['city']}"
        
    def test_listing_has_google_metadata(self):
        """Listing should have Google rating and review count in metadata"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200
        data = response.json()
        
        metadata = data.get("metadata", {})
        
        # Verify Google rating
        assert "google_rating" in metadata, "Metadata should have google_rating"
        assert metadata["google_rating"] == 4.5, f"Expected google_rating 4.5, got {metadata['google_rating']}"
        
        # Verify Google review count
        assert "google_review_count" in metadata, "Metadata should have google_review_count"
        assert metadata["google_review_count"] == 3826, f"Expected 3826 reviews, got {metadata['google_review_count']}"
        
        # Verify Google Maps URL
        assert "google_maps_url" in metadata, "Metadata should have google_maps_url"
        assert metadata["google_maps_url"].startswith("https://maps.google.com"), "google_maps_url should be a valid URL"
        
    def test_listing_has_contact_info(self):
        """Listing should have phone and website contact info"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify phone
        assert "phone" in data, "Response should have phone"
        assert data["phone"] == "(813) 248-1531", f"Expected phone '(813) 248-1531', got {data['phone']}"
        
        # Verify website
        assert "website" in data, "Response should have website"
        assert data["website"] == "https://www.lasegundabakery.com/", f"Expected website, got {data['website']}"
        
    def test_listing_has_gallery_images(self):
        """Listing should have gallery_images and total_photos_available"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify gallery_images is a list
        assert isinstance(data["gallery_images"], list), "gallery_images should be a list"
        
        # Verify total_photos_available
        assert "total_photos_available" in data, "Response should have total_photos_available"
        assert data["total_photos_available"] >= 1, "Should have at least 1 photo"
        
    def test_listing_has_related_businesses(self):
        """Listing should have related businesses from same city and industry"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify related is a list with data
        assert "related" in data, "Response should have related"
        assert isinstance(data["related"], list), "related should be a list"
        assert len(data["related"]) > 0, "Should have at least one related business"
        
        # Verify related businesses have required fields
        for related in data["related"]:
            assert "id" in related, "Related should have id"
            assert "business_name" in related, "Related should have business_name"
            assert "slug" in related, "Related should have slug"
            assert "city" in related, "Related should have city"
            
    def test_get_nonexistent_listing_returns_404(self):
        """GET /api/directory/nonexistent-slug returns 404"""
        response = requests.get(f"{BASE_URL}/api/directory/nonexistent-slug-test-123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        data = response.json()
        assert "error" in data, "Response should have error field"
        assert data["error"] == "Listing not found", f"Expected 'Listing not found', got {data['error']}"
        
    def test_listing_has_tier_and_claim_status(self):
        """Listing should have tier and is_claimed fields"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify tier field
        assert "tier" in data, "Response should have tier"
        assert data["tier"] in ["free", "pro", "premium"], f"tier should be valid, got {data['tier']}"
        
        # Verify is_claimed field
        assert "is_claimed" in data, "Response should have is_claimed"
        assert isinstance(data["is_claimed"], bool), "is_claimed should be boolean"


class TestDirectoryListingCards:
    """Tests to verify directory listing cards link correctly"""
    
    def test_directory_listings_have_slug(self):
        """Directory listings should have slug for linking to detail pages"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Should have at least one listing"
        
        # Verify all listings have slug
        for listing in data:
            assert "slug" in listing, f"Listing {listing.get('business_name')} should have slug"
            assert listing["slug"], f"slug should not be empty for {listing.get('business_name')}"


class TestRelatedListingsNavigation:
    """Tests for related businesses navigation"""
    
    def test_related_listings_are_navigable(self):
        """Related businesses from listing detail should be accessible via their slugs"""
        # Get la-segunda-bakery listing with related
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        assert response.status_code == 200
        data = response.json()
        
        related = data.get("related", [])
        assert len(related) > 0, "Should have related businesses"
        
        # Test that first related business is accessible
        first_related_slug = related[0]["slug"]
        related_response = requests.get(f"{BASE_URL}/api/directory/{first_related_slug}")
        
        assert related_response.status_code == 200, f"Related listing {first_related_slug} should be accessible"
        related_data = related_response.json()
        assert related_data["slug"] == first_related_slug, "Slug should match"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
