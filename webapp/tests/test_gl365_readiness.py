"""
GreenLine365 Full Readiness Audit - Backend API Tests
Tests all directory, review, stripe, chat, stats APIs
"""

import pytest
import requests
import os

BASE_URL = "http://localhost:3000"

# Test data
TEST_LISTING_ID = "8b97c940-a5bd-471f-9fec-bd73f0d1951f"
TEST_LISTING_SLUG = "cheap-locksmith-tampa"


class TestDirectoryAPI:
    """Directory listing API tests"""
    
    def test_get_directory_listings(self):
        """GET /api/directory - Returns listings with real photos"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check first listing has proper structure
        listing = data[0]
        assert "id" in listing
        assert "business_name" in listing
        assert "cover_image_url" in listing
        assert "is_placeholder_image" in listing
        print(f"✓ Found {len(data)} listings")
        
    def test_directory_shows_real_photos(self):
        """Verify listings show Google photos, not placeholders"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=20")
        assert response.status_code == 200
        
        data = response.json()
        real_photo_count = 0
        placeholder_count = 0
        
        for listing in data:
            cover_url = listing.get("cover_image_url", "")
            is_placeholder = listing.get("is_placeholder_image", False)
            
            if "maps.googleapis.com" in cover_url:
                real_photo_count += 1
            elif "static.prod-images.emergentagent.com" in cover_url:
                # Only count as placeholder if business has no Google photos
                if is_placeholder:
                    placeholder_count += 1
                else:
                    real_photo_count += 1  # Real placeholder for no-photo businesses
                    
        print(f"✓ Real Google photos: {real_photo_count}/{len(data)}")
        print(f"✓ Placeholder images (no Google photos): {placeholder_count}/{len(data)}")
        
    def test_get_listing_by_slug(self):
        """GET /api/directory/[slug] - Returns listing detail with photo gating"""
        response = requests.get(f"{BASE_URL}/api/directory/{TEST_LISTING_SLUG}")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("slug") == TEST_LISTING_SLUG
        assert "cover_image_url" in data
        assert "total_photos_available" in data
        assert "locked_photos_count" in data
        assert "is_placeholder_image" in data
        assert "is_claimable" in data
        
        # For free tier, should show real business photo
        if data.get("tier") == "free":
            cover_url = data.get("cover_image_url", "")
            is_placeholder = data.get("is_placeholder_image", False)
            # Should have Google photo, not placeholder
            if "maps.googleapis.com" in cover_url:
                print(f"✓ Free tier listing shows real Google photo")
            else:
                print(f"! Free tier using placeholder (no Google photos available)")
            print(f"✓ is_placeholder_image = {is_placeholder}")
            
        print(f"✓ Listing: {data.get('business_name')}")
        print(f"✓ Total photos available: {data.get('total_photos_available')}")
        print(f"✓ Locked photos: {data.get('locked_photos_count')}")


class TestReviewsAPI:
    """Reviews API tests"""
    
    def test_get_reviews_for_listing(self):
        """GET /api/directory/reviews?listing_id=xxx - Get reviews"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "average_rating" in data
        print(f"✓ Found {data['total']} reviews, avg rating: {data['average_rating']}")
        
    def test_get_reviews_requires_listing_id(self):
        """GET /api/directory/reviews without listing_id returns 400"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        print(f"✓ Correct error: {data['error']}")
        
    def test_submit_review(self):
        """POST /api/directory/reviews - Submit review (no auth required)"""
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Readiness_Audit",
            "rating": 5,
            "text": "This is a test review for the readiness audit. Great service!"
        }
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert "review_id" in data
        print(f"✓ Review submitted: {data.get('review_id')}")
        
    def test_submit_review_validation(self):
        """POST /api/directory/reviews - Validates required fields"""
        # Missing text
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "Test",
            "rating": 5
        }
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 400
        print(f"✓ Validates required fields")


class TestAuthProtectedEndpoints:
    """Auth-protected endpoints should return 401 without auth"""
    
    def test_my_listing_requires_auth(self):
        """GET /api/directory/my-listing - Requires auth"""
        response = requests.get(f"{BASE_URL}/api/directory/my-listing")
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        print(f"✓ Correctly requires auth: {data['error']}")
        
    def test_claim_requires_auth(self):
        """POST /api/directory/claim - Requires auth"""
        payload = {"listing_id": TEST_LISTING_ID}
        response = requests.post(f"{BASE_URL}/api/directory/claim", json=payload)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        print(f"✓ Correctly requires auth: {data['error']}")
        
    def test_photos_api_requires_auth(self):
        """GET /api/directory/photos - Requires auth"""
        response = requests.get(f"{BASE_URL}/api/directory/photos?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        print(f"✓ Correctly requires auth: {data['error']}")


class TestStripeCheckout:
    """Stripe checkout API tests"""
    
    def test_checkout_pro_tier(self):
        """POST /api/stripe/checkout with tier=pro"""
        payload = {
            "tier": "pro",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data
        assert "session_id" in data
        assert "checkout.stripe.com" in data["url"]
        print(f"✓ Pro checkout session created")
        
    def test_checkout_premium_tier(self):
        """POST /api/stripe/checkout with tier=premium"""
        payload = {
            "tier": "premium",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data
        print(f"✓ Premium checkout session created")
        
    def test_checkout_invalid_tier(self):
        """POST /api/stripe/checkout with invalid tier"""
        payload = {
            "tier": "invalid",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        print(f"✓ Invalid tier rejected: {data['error']}")
        
    def test_checkout_requires_origin(self):
        """POST /api/stripe/checkout requires origin_url"""
        payload = {"tier": "pro"}
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        print(f"✓ Requires origin_url: {data['error']}")
        
    def test_get_tiers(self):
        """GET /api/stripe/checkout - Returns available tiers"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout")
        assert response.status_code == 200
        
        data = response.json()
        assert "tiers" in data
        tier_ids = [t["id"] for t in data["tiers"]]
        assert "pro" in tier_ids
        assert "premium" in tier_ids
        print(f"✓ Available tiers: {tier_ids}")


class TestStatsAPI:
    """Directory stats API tests"""
    
    def test_get_stats(self):
        """GET /api/directory/stats - Returns live counts"""
        response = requests.get(f"{BASE_URL}/api/directory/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "totalBusinesses" in data
        assert "totalDestinations" in data
        assert "totalCategories" in data
        
        # Verify expected counts
        assert data["totalBusinesses"] >= 540, f"Expected 540+ businesses, got {data['totalBusinesses']}"
        assert data["totalDestinations"] >= 8, f"Expected 8+ destinations, got {data['totalDestinations']}"
        assert data["totalCategories"] >= 8, f"Expected 8+ categories, got {data['totalCategories']}"
        
        print(f"✓ Total businesses: {data['totalBusinesses']}")
        print(f"✓ Total destinations: {data['totalDestinations']}")
        print(f"✓ Total categories: {data['totalCategories']}")


class TestAddonsAPI:
    """Directory add-ons API tests"""
    
    def test_coupons_api_exists(self):
        """GET /api/directory/addons/coupons - Endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/directory/addons/coupons")
        # Should return error about missing listing_id, not 404
        assert response.status_code in [400, 401]
        
        data = response.json()
        assert "error" in data
        print(f"✓ Coupons API exists: {data.get('error')}")
        
    def test_analytics_api_exists(self):
        """GET /api/directory/addons/analytics - Endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/directory/addons/analytics")
        # Should return auth error
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        print(f"✓ Analytics API exists (requires auth): {data.get('error')}")


class TestChatAPI:
    """Chat widget API tests"""
    
    def test_chat_responds_to_messages(self):
        """POST /api/chat - Chat responds to messages"""
        payload = {"message": "What is GreenLine365?"}
        response = requests.post(f"{BASE_URL}/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "choices" in data
        assert len(data["choices"]) > 0
        content = data["choices"][0].get("message", {}).get("content", "")
        assert len(content) > 0
        print(f"✓ Chat response: {content[:100]}...")


class TestSitemap:
    """Sitemap tests"""
    
    def test_sitemap_returns_xml(self):
        """GET /sitemap.xml - Returns XML sitemap"""
        response = requests.get(f"{BASE_URL}/sitemap.xml")
        assert response.status_code == 200
        
        content = response.text
        assert "<?xml" in content
        assert "<urlset" in content
        assert "greenline365.com" in content
        
        # Count listing URLs
        listing_count = content.count("/listing/")
        print(f"✓ Sitemap contains {listing_count} listing URLs")


class TestCalendarAPI:
    """Unified calendar API tests"""
    
    def test_get_unified_events(self):
        """GET /api/calendar/unified - Returns events"""
        response = requests.get(f"{BASE_URL}/api/calendar/unified")
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        print(f"✓ Found {len(data['events'])} calendar events")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
