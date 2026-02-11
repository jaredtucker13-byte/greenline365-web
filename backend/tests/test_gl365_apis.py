"""
GreenLine365 API Tests - Auth, Subscriptions, Feature Gating
Tests the P0 features: /api/stripe/checkout, /api/directory, /api/directory/entitlements
"""
import pytest
import requests
import os

# Use the frontend URL since this is a Next.js app with API routes
BASE_URL = "http://localhost:3000"

class TestStripeCheckoutAPI:
    """Tests for /api/stripe/checkout - Stripe checkout session management"""
    
    def test_get_checkout_returns_tiers(self):
        """GET /api/stripe/checkout should return available tiers"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout")
        assert response.status_code == 200
        
        data = response.json()
        assert "tiers" in data
        assert len(data["tiers"]) == 2  # pro and premium only
        
    def test_get_checkout_tiers_correct_pricing(self):
        """Verify Pro = $39, Premium = $59 (NOT old growth/authority/dominator pricing)"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout")
        data = response.json()
        
        tier_prices = {t["id"]: t["price"] for t in data["tiers"]}
        
        # Should have Pro at $39
        assert "pro" in tier_prices
        assert tier_prices["pro"] == 39
        
        # Should have Premium at $59
        assert "premium" in tier_prices  
        assert tier_prices["premium"] == 59
        
        # Should NOT have old tiers
        assert "growth" not in tier_prices
        assert "authority" not in tier_prices
        assert "dominator" not in tier_prices
        
    def test_get_checkout_tier_features(self):
        """Verify tier features are included"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout")
        data = response.json()
        
        for tier in data["tiers"]:
            assert "features" in tier
            assert isinstance(tier["features"], list)
            assert len(tier["features"]) > 0
            
    def test_post_checkout_invalid_tier(self):
        """POST /api/stripe/checkout with invalid tier should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            json={"tier": "invalid_tier", "origin_url": "http://localhost:3000"}
        )
        assert response.status_code == 400
        
    def test_post_checkout_missing_origin_url(self):
        """POST /api/stripe/checkout without origin_url should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            json={"tier": "pro"}
        )
        assert response.status_code == 400


class TestDirectoryAPI:
    """Tests for /api/directory - Directory listings CRUD"""
    
    def test_get_directory_returns_listings(self):
        """GET /api/directory should return array of listings"""
        response = requests.get(f"{BASE_URL}/api/directory")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_directory_listing_structure(self):
        """Verify listing structure has required fields"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        
        if len(data) > 0:
            listing = data[0]
            required_fields = ["id", "business_name", "industry", "tier"]
            for field in required_fields:
                assert field in listing, f"Missing field: {field}"
                
    def test_get_directory_with_limit(self):
        """GET /api/directory?limit=5 should respect limit"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        data = response.json()
        assert len(data) <= 5
        
    def test_get_directory_by_industry(self):
        """GET /api/directory?industry=plumbing should filter by industry"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=plumbing")
        data = response.json()
        
        for listing in data:
            assert listing["industry"] == "plumbing"
            
    def test_post_directory_missing_fields(self):
        """POST /api/directory without required fields should return 400"""
        response = requests.post(
            f"{BASE_URL}/api/directory",
            json={"business_name": "Test"}  # Missing industry
        )
        assert response.status_code == 400


class TestEntitlementsAPI:
    """Tests for /api/directory/entitlements - Feature gating"""
    
    def test_get_entitlements_missing_listing_id(self):
        """GET /api/directory/entitlements without listing_id should return 400"""
        response = requests.get(f"{BASE_URL}/api/directory/entitlements")
        assert response.status_code == 400
        
    def test_get_entitlements_invalid_listing_id(self):
        """GET /api/directory/entitlements with invalid listing_id should return 404"""
        response = requests.get(f"{BASE_URL}/api/directory/entitlements?listing_id=invalid-uuid")
        assert response.status_code == 404
        
    def test_get_entitlements_valid_listing(self):
        """GET /api/directory/entitlements with valid listing_id should return entitlements"""
        # First get a valid listing ID
        dir_response = requests.get(f"{BASE_URL}/api/directory?limit=1")
        listings = dir_response.json()
        
        if len(listings) > 0:
            listing_id = listings[0]["id"]
            response = requests.get(f"{BASE_URL}/api/directory/entitlements?listing_id={listing_id}")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "listing_id" in data
            assert "tier" in data
            assert "entitlements" in data
            
            # Verify entitlements structure
            entitlements = data["entitlements"]
            expected_keys = ["photos", "hasVerifiedBadge", "hasCtaButtons", "hasFeaturedPlacement"]
            for key in expected_keys:
                assert key in entitlements


class TestPricingTiersAPI:
    """Tests for /api/pricing-tiers - Database pricing tiers"""
    
    def test_get_pricing_tiers(self):
        """GET /api/pricing-tiers should return tiers from database"""
        response = requests.get(f"{BASE_URL}/api/pricing-tiers")
        assert response.status_code == 200
        
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "tiers" in data
        

class TestPageRendering:
    """Tests for page rendering - verifies pages return 200"""
    
    def test_homepage_renders(self):
        """Homepage should render successfully"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        
    def test_pricing_page_renders(self):
        """Pricing page should render successfully"""
        response = requests.get(f"{BASE_URL}/pricing")
        assert response.status_code == 200
        
    def test_login_page_renders(self):
        """Login page should render successfully"""
        response = requests.get(f"{BASE_URL}/login")
        assert response.status_code == 200
        
    def test_signup_page_renders(self):
        """Signup page should render successfully"""
        response = requests.get(f"{BASE_URL}/signup")
        assert response.status_code == 200
        
    def test_register_business_renders(self):
        """Register business page should render successfully"""
        response = requests.get(f"{BASE_URL}/register-business")
        assert response.status_code == 200
        
    def test_register_business_with_tier_param(self):
        """Register business page with tier param should render"""
        for tier in ["free", "pro", "premium"]:
            response = requests.get(f"{BASE_URL}/register-business?tier={tier}")
            assert response.status_code == 200
            
    def test_register_success_renders(self):
        """Register success page should render successfully"""
        response = requests.get(f"{BASE_URL}/register-business/success")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
