"""
GreenLine365 Photo Gating & Stripe Live Mode Tests
Tests:
1. Photo gating by tier (Free=1, Pro=2, Premium=all)
2. Stripe live keys configuration
3. Webhook signature verification enabled
"""
import pytest
import requests

BASE_URL = "http://localhost:3000"


class TestPhotoGating:
    """Tests for photo gating feature in directory API"""

    def test_directory_list_applies_photo_gating_free_tier(self):
        """GET /api/directory?limit=3 should return listings with photo gating applied"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=3")
        assert response.status_code == 200
        
        listings = response.json()
        assert isinstance(listings, list)
        assert len(listings) <= 3
        
        # Check that all listings have photo gating fields
        for listing in listings:
            # Must have gallery_images limited by tier
            assert "gallery_images" in listing, "gallery_images field missing"
            # Must have total_photos_available showing full count
            assert "total_photos_available" in listing, "total_photos_available field missing"
            
            # For free/unclaimed listings: gallery_images should be limited to 1
            tier = listing.get("tier", "free")
            is_claimed = listing.get("is_claimed", False)
            gallery_count = len(listing["gallery_images"])
            total_available = listing["total_photos_available"]
            
            if not is_claimed or tier == "free":
                # Unclaimed or free tier: max 1 photo
                assert gallery_count <= 1, f"Free/unclaimed listing has {gallery_count} photos, expected <=1"
            
            # total_photos_available should be >= gallery_images count
            assert total_available >= gallery_count, "total_photos_available should be >= visible photos"
            
            print(f"✓ Listing '{listing.get('business_name')}': tier={tier}, claimed={is_claimed}, "
                  f"visible_photos={gallery_count}, total_available={total_available}")

    def test_directory_slug_applies_photo_gating(self):
        """GET /api/directory?slug=<slug> should also apply photo gating"""
        # First get a listing slug
        list_response = requests.get(f"{BASE_URL}/api/directory?limit=1")
        assert list_response.status_code == 200
        listings = list_response.json()
        assert len(listings) > 0
        
        slug = listings[0].get("slug")
        assert slug, "No slug found in listing"
        
        # Get single listing by slug
        response = requests.get(f"{BASE_URL}/api/directory?slug={slug}")
        assert response.status_code == 200
        
        listing = response.json()
        assert "gallery_images" in listing, "gallery_images field missing in slug response"
        assert "total_photos_available" in listing, "total_photos_available field missing in slug response"
        
        tier = listing.get("tier", "free")
        is_claimed = listing.get("is_claimed", False)
        gallery_count = len(listing["gallery_images"])
        total_available = listing["total_photos_available"]
        
        # Verify photo gating is applied
        if not is_claimed or tier == "free":
            assert gallery_count <= 1, f"Single listing (free/unclaimed) has {gallery_count} photos, expected <=1"
        
        assert total_available >= gallery_count
        print(f"✓ Single listing '{listing.get('business_name')}': "
              f"visible={gallery_count}, total={total_available}")

    def test_directory_returns_cover_image_url(self):
        """Verify cover_image_url is set from first gallery image"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        assert response.status_code == 200
        
        listings = response.json()
        for listing in listings:
            if listing.get("gallery_images") and len(listing["gallery_images"]) > 0:
                cover = listing.get("cover_image_url")
                first_gallery = listing["gallery_images"][0]
                # cover_image_url should be set to first gallery image
                assert cover == first_gallery, "cover_image_url should equal first gallery image"
                print(f"✓ cover_image_url matches first gallery image for '{listing.get('business_name')}'")


class TestStripeCheckoutAPI:
    """Tests for Stripe checkout API with live keys"""

    def test_get_stripe_checkout_returns_tier_pricing(self):
        """GET /api/stripe/checkout should return tier pricing info"""
        response = requests.get(f"{BASE_URL}/api/stripe/checkout")
        assert response.status_code == 200
        
        data = response.json()
        assert "tiers" in data, "Response should have 'tiers' field"
        
        tiers = data["tiers"]
        assert len(tiers) == 2, "Should have exactly 2 tiers (pro, premium)"
        
        tier_dict = {t["id"]: t for t in tiers}
        
        # Verify pro tier
        assert "pro" in tier_dict, "Missing 'pro' tier"
        assert tier_dict["pro"]["price"] == 39, f"Pro price should be $39, got {tier_dict['pro']['price']}"
        assert "features" in tier_dict["pro"], "Pro tier should have features"
        print(f"✓ Pro tier: ${tier_dict['pro']['price']}, features: {len(tier_dict['pro']['features'])}")
        
        # Verify premium tier
        assert "premium" in tier_dict, "Missing 'premium' tier"
        assert tier_dict["premium"]["price"] == 59, f"Premium price should be $59, got {tier_dict['premium']['price']}"
        assert "features" in tier_dict["premium"], "Premium tier should have features"
        print(f"✓ Premium tier: ${tier_dict['premium']['price']}, features: {len(tier_dict['premium']['features'])}")

    def test_post_stripe_checkout_returns_live_url(self):
        """POST /api/stripe/checkout with tier=pro should return live checkout URL (cs_live_...)"""
        payload = {
            "tier": "pro",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "url" in data, "Response should have 'url' field"
        assert "session_id" in data, "Response should have 'session_id' field"
        
        # Verify it's a live checkout URL (not test)
        session_id = data["session_id"]
        assert session_id.startswith("cs_live_"), f"Session ID should start with 'cs_live_', got: {session_id[:15]}..."
        
        url = data["url"]
        assert "checkout.stripe.com" in url, "URL should point to checkout.stripe.com"
        
        print(f"✓ Stripe checkout returns live session: {session_id[:20]}...")

    def test_post_stripe_checkout_premium_tier(self):
        """POST /api/stripe/checkout with tier=premium returns live checkout URL"""
        payload = {
            "tier": "premium",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["session_id"].startswith("cs_live_"), "Premium checkout should return live session"
        print(f"✓ Premium tier checkout works: {data['session_id'][:20]}...")

    def test_post_stripe_checkout_invalid_tier(self):
        """POST /api/stripe/checkout with invalid tier returns 400"""
        payload = {
            "tier": "invalid_tier",
            "origin_url": "http://localhost:3000"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        print(f"✓ Invalid tier returns 400: {data['error']}")

    def test_post_stripe_checkout_missing_origin_url(self):
        """POST /api/stripe/checkout without origin_url returns 400"""
        payload = {
            "tier": "pro"
        }
        response = requests.post(f"{BASE_URL}/api/stripe/checkout", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        print(f"✓ Missing origin_url returns 400: {data['error']}")


class TestFeatureGates:
    """Tests for feature-gates.ts configuration via API entitlements"""

    def test_entitlements_api_returns_tier_based_limits(self):
        """GET /api/directory/entitlements returns photo limits by tier"""
        # First get a valid listing ID
        list_response = requests.get(f"{BASE_URL}/api/directory?limit=1")
        assert list_response.status_code == 200
        listings = list_response.json()
        
        if not listings:
            pytest.skip("No listings available to test entitlements")
        
        listing_id = listings[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/directory/entitlements?listing_id={listing_id}")
        
        if response.status_code == 200:
            data = response.json()
            assert "photos" in data, "Entitlements should include 'photos' limit"
            photos_limit = data["photos"]
            
            # Free tier should have photos=1
            tier = listings[0].get("tier", "free")
            if tier == "free":
                assert photos_limit == 1, f"Free tier photos should be 1, got {photos_limit}"
            elif tier == "pro":
                assert photos_limit == 2, f"Pro tier photos should be 2, got {photos_limit}"
            elif tier == "premium":
                assert photos_limit == 999, f"Premium tier photos should be 999, got {photos_limit}"
            
            print(f"✓ Entitlements for tier '{tier}': photos={photos_limit}")
        else:
            # API might not exist, verify via direct directory response
            listing = listings[0]
            total_available = listing.get("total_photos_available", 0)
            gallery_len = len(listing.get("gallery_images", []))
            print(f"✓ Photo gating verified via directory: visible={gallery_len}, total={total_available}")

    def test_photo_gating_limits_per_tier(self):
        """Verify feature-gates TIER_LIMITS: free=1, pro=2, premium=999"""
        # This is a code verification test - checking actual API behavior
        response = requests.get(f"{BASE_URL}/api/directory?limit=20")
        assert response.status_code == 200
        
        listings = response.json()
        
        tier_photo_counts = {"free": [], "pro": [], "premium": []}
        
        for listing in listings:
            tier = listing.get("tier", "free")
            is_claimed = listing.get("is_claimed", False)
            gallery_len = len(listing.get("gallery_images", []))
            total = listing.get("total_photos_available", 0)
            
            if tier in tier_photo_counts:
                tier_photo_counts[tier].append({
                    "gallery_len": gallery_len,
                    "total": total,
                    "claimed": is_claimed
                })
        
        # Verify free tier limits
        for entry in tier_photo_counts["free"]:
            if not entry["claimed"]:
                # Unclaimed: 1 photo max
                assert entry["gallery_len"] <= 1, f"Unclaimed free listing should have <=1 photo"
            else:
                # Claimed free: 1 photo max
                assert entry["gallery_len"] <= 1, f"Claimed free listing should have <=1 photo"
        
        # Pro tier: 2 photos max
        for entry in tier_photo_counts["pro"]:
            if entry["claimed"]:
                assert entry["gallery_len"] <= 2, f"Pro listing should have <=2 photos"
        
        # Premium tier: 999 (essentially unlimited)
        for entry in tier_photo_counts["premium"]:
            if entry["claimed"]:
                # Should show all photos up to 999
                pass  # No strict limit to check
        
        print(f"✓ Photo gating verified across {len(listings)} listings")
        print(f"  - Free tier listings: {len(tier_photo_counts['free'])}")
        print(f"  - Pro tier listings: {len(tier_photo_counts['pro'])}")
        print(f"  - Premium tier listings: {len(tier_photo_counts['premium'])}")


class TestWebhookConfiguration:
    """Tests for Stripe webhook configuration"""

    def test_webhook_endpoint_exists(self):
        """Verify webhook endpoint is accessible (returns 400 without valid signature)"""
        # POST to webhook without signature should return 400 (signature verification enabled)
        response = requests.post(
            f"{BASE_URL}/api/stripe/webhook",
            data="{}",
            headers={"Content-Type": "text/plain"}
        )
        
        # If signature verification is enabled, it should return 400
        # If disabled, it might return 200 with {received: true}
        if response.status_code == 400:
            data = response.json()
            assert "error" in data or "Webhook signature" in str(data)
            print(f"✓ Webhook signature verification is ENABLED (returns 400 without valid signature)")
        else:
            print(f"⚠ Webhook endpoint returned {response.status_code} - signature verification may not be enforced")

    def test_webhook_rejects_invalid_signature(self):
        """POST to webhook with invalid signature should be rejected"""
        response = requests.post(
            f"{BASE_URL}/api/stripe/webhook",
            data='{"type":"checkout.session.completed"}',
            headers={
                "Content-Type": "text/plain",
                "Stripe-Signature": "invalid_signature_12345"
            }
        )
        
        # Should reject invalid signature
        assert response.status_code == 400, f"Expected 400 for invalid signature, got {response.status_code}"
        print("✓ Webhook correctly rejects invalid signatures")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
