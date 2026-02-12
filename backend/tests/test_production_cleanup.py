"""
Test Production-Readiness Cleanup Features for GreenLine365
Tests for iteration 17: Removed false claims, fake testimonials, fake Schema.org ratings
"""
import pytest
import requests
import os

# Use the public URL from environment or test reports
BASE_URL = "https://lead-pipeline-23.preview.emergentagent.com"


class TestListingDetailAPI:
    """Tests for /api/directory/[slug] endpoint"""
    
    def test_la_segunda_bakery_listing_loads(self):
        """GET /api/directory/la-segunda-bakery returns valid listing data"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "business_name" in data
        assert data["business_name"] == "La Segunda Bakery and Cafe"
        assert data["slug"] == "la-segunda-bakery"
        assert data["city"] == "Tampa"
        assert data["state"] == "FL"
        print(f"✓ Listing loaded: {data['business_name']}")
    
    def test_listing_has_contact_info(self):
        """Listing should have phone and website"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        data = response.json()
        
        assert response.status_code == 200
        assert "phone" in data and data["phone"] is not None
        assert "website" in data and data["website"] is not None
        print(f"✓ Contact info: phone={data['phone']}, website={data['website']}")
    
    def test_listing_has_tier_and_claimed_fields(self):
        """Listing should have tier and is_claimed fields for badge/CTA logic"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        data = response.json()
        
        assert response.status_code == 200
        assert "tier" in data
        assert "is_claimed" in data
        print(f"✓ Tier: {data['tier']}, Is Claimed: {data['is_claimed']}")
    
    def test_nonexistent_listing_returns_404(self):
        """GET /api/directory/nonexistent-slug should return 404"""
        response = requests.get(f"{BASE_URL}/api/directory/nonexistent-slug-xyz123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent listing returns 404")


class TestHomepage:
    """Tests for homepage API calls"""
    
    def test_directory_stats_endpoint(self):
        """GET /api/directory/stats returns stats for trust counter"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have counts for businesses, destinations, categories
        assert "totalBusinesses" in data, f"Expected totalBusinesses in stats: {data}"
        assert "totalDestinations" in data, f"Expected totalDestinations in stats"
        assert "totalCategories" in data, f"Expected totalCategories in stats"
        assert data["totalBusinesses"] >= 400, "Expected 400+ businesses"
        print(f"✓ Stats endpoint returns data: {data}")
    
    def test_directory_listings_endpoint(self):
        """GET /api/directory returns list of businesses"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should return a list of listings
        if isinstance(data, list):
            assert len(data) > 0, "Expected at least one listing"
            assert "slug" in data[0], "Listings should have slug field"
        elif isinstance(data, dict) and "listings" in data:
            assert len(data["listings"]) > 0, "Expected at least one listing"
        print(f"✓ Directory endpoint returns listings")


class TestPricingPage:
    """Tests for pricing page content"""
    
    def test_pricing_page_loads(self):
        """Pricing page should load without errors"""
        response = requests.get(f"{BASE_URL}/pricing")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check page contains key pricing content
        content = response.text
        assert "Pricing" in content or "pricing" in content
        print("✓ Pricing page loads successfully")


class TestFooterCleanup:
    """Tests for footer cleanup - no social media links"""
    
    def test_homepage_no_twitter_link(self):
        """Homepage footer should not have Twitter link"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200
        
        content = response.text.lower()
        # Check that there's no twitter.com or x.com link in footer
        assert 'href="https://twitter.com' not in content, "Twitter link found in page"
        assert 'href="https://x.com' not in content, "X.com link found in page"
        print("✓ No Twitter/X link in homepage")
    
    def test_homepage_no_linkedin_link(self):
        """Homepage footer should not have LinkedIn link"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200
        
        content = response.text.lower()
        assert 'href="https://linkedin.com' not in content, "LinkedIn link found in page"
        assert 'href="https://www.linkedin.com' not in content, "LinkedIn link found in page"
        print("✓ No LinkedIn link in homepage")
    
    def test_homepage_has_contact_email(self):
        """Homepage footer should have Contact Us mailto link"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200
        
        content = response.text
        assert 'mailto:greenline365help@gmail.com' in content, "Contact email not found"
        print("✓ Contact email link found")


class TestSchemaOrgCleanup:
    """Tests for Schema.org structured data cleanup"""
    
    def test_no_aggregate_rating_in_schema(self):
        """Schema.org JSON-LD should not contain aggregateRating"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200
        
        content = response.text
        assert '"aggregateRating"' not in content, "aggregateRating found in Schema.org data"
        assert '"ratingValue"' not in content or '"AggregateRating"' not in content
        print("✓ No aggregateRating in Schema.org data")
    
    def test_no_sameas_social_links_in_schema(self):
        """Schema.org JSON-LD should not have sameAs social media links"""
        response = requests.get(f"{BASE_URL}/")
        
        assert response.status_code == 200
        
        content = response.text
        # Check no sameAs with Twitter/LinkedIn
        assert '"sameAs"' not in content or (
            'twitter.com' not in content and 
            'linkedin.com' not in content
        ), "Social media sameAs links found in Schema.org data"
        print("✓ No sameAs social links in Schema.org data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
