"""
GreenLine365 Directory Marketplace Add-ons API Tests
=====================================================
Tests for the 5 live marketplace add-ons:
- Coupon Engine ($19/mo)
- Custom Poll Template ($150 one-time)
- Featured Boost ($29/week)
- Additional Photos ($9/mo)
- Analytics Pro ($19/mo)

The 2 Coming Soon items (QR Feedback Kit, Review Response AI) are not tested here.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lead-pipeline-23.preview.emergentagent.com')
TEST_LISTING_ID = "a635441b-b03d-4886-b740-e62106a3c99d"  # Tampa General Hospital (unclaimed free listing)


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestAddonsCatalogAPI:
    """GET /api/directory/addons - Addon catalog endpoint tests"""

    def test_get_addons_catalog_returns_5_addon_types(self, api_client):
        """Verify catalog returns all 5 addon types"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "catalog" in data
        catalog = data["catalog"]
        
        # Verify all 5 addon types are present
        expected_addons = ["coupon_engine", "custom_poll", "featured_boost", "additional_photos", "analytics_pro"]
        for addon_key in expected_addons:
            assert addon_key in catalog, f"Missing addon: {addon_key}"
        
        # Verify there are exactly 5 addon types (no extras)
        assert len(catalog) == 5

    def test_get_addons_catalog_pricing(self, api_client):
        """Verify addon pricing matches requirements"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons?listing_id={TEST_LISTING_ID}")
        data = response.json()
        catalog = data["catalog"]
        
        # Coupon Engine: $19/mo
        assert catalog["coupon_engine"]["price"] == 19
        assert catalog["coupon_engine"]["mode"] == "subscription"
        assert catalog["coupon_engine"]["interval"] == "month"
        
        # Custom Poll Template: $150 one-time
        assert catalog["custom_poll"]["price"] == 150
        assert catalog["custom_poll"]["mode"] == "payment"
        
        # Featured Boost: $29/week (one-time payment for 1-week boost)
        assert catalog["featured_boost"]["price"] == 29
        assert catalog["featured_boost"]["mode"] == "payment"
        
        # Additional Photos: $9/mo
        assert catalog["additional_photos"]["price"] == 9
        assert catalog["additional_photos"]["mode"] == "subscription"
        assert catalog["additional_photos"]["interval"] == "month"
        
        # Analytics Pro: $19/mo
        assert catalog["analytics_pro"]["price"] == 19
        assert catalog["analytics_pro"]["mode"] == "subscription"
        assert catalog["analytics_pro"]["interval"] == "month"

    def test_get_addons_requires_listing_id(self, api_client):
        """Verify listing_id is required"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons")
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "listing_id" in data["error"].lower()

    def test_get_addons_returns_empty_addons_for_unclaimed(self, api_client):
        """Unclaimed listing should have empty addons object"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons?listing_id={TEST_LISTING_ID}")
        data = response.json()
        assert "addons" in data
        # Unclaimed listing should have no active addons
        assert data["addons"] == {} or len(data["addons"]) == 0


class TestAnalyticsTrackingAPI:
    """POST /api/directory/addons/analytics - Analytics event tracking tests"""

    def test_track_view_event_success(self, api_client):
        """Verify view event tracking returns tracked: true"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "view"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("tracked") == True

    def test_track_click_event_success(self, api_client):
        """Verify click event tracking"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "click"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True

    def test_track_call_event_success(self, api_client):
        """Verify call event tracking"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "call"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True

    def test_track_map_event_success(self, api_client):
        """Verify map click event tracking"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "map"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True

    def test_track_website_event_success(self, api_client):
        """Verify website click event tracking"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "website"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True

    def test_track_coupon_view_event_success(self, api_client):
        """Verify coupon_view event tracking"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "coupon_view"}
        )
        assert response.status_code == 200
        assert response.json().get("tracked") == True

    def test_reject_invalid_event_type(self, api_client):
        """Verify invalid event_type is rejected"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID, "event_type": "invalid_type"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
        assert "invalid" in data["error"].lower() or "event_type" in data["error"].lower()

    def test_reject_missing_listing_id(self, api_client):
        """Verify missing listing_id returns error"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"event_type": "view"}
        )
        assert response.status_code == 400
        assert "error" in response.json()

    def test_reject_missing_event_type(self, api_client):
        """Verify missing event_type returns error"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons/analytics",
            json={"listing_id": TEST_LISTING_ID}
        )
        assert response.status_code == 400
        assert "error" in response.json()


class TestCouponsAPI:
    """GET /api/directory/addons/coupons - Coupon Engine endpoint tests"""

    def test_get_coupons_returns_array(self, api_client):
        """Verify coupons endpoint returns coupons array"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/coupons?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "coupons" in data
        assert isinstance(data["coupons"], list)

    def test_get_coupons_empty_for_unclaimed_listing(self, api_client):
        """Unclaimed listing should have no coupons"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/coupons?listing_id={TEST_LISTING_ID}")
        data = response.json()
        assert data["coupons"] == []

    def test_get_coupons_requires_listing_id(self, api_client):
        """Verify listing_id is required"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/coupons")
        assert response.status_code == 400


class TestFeaturedAPI:
    """GET /api/directory/addons/featured - Featured Boost endpoint tests"""

    def test_get_featured_returns_array(self, api_client):
        """Verify featured endpoint returns featured array"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/featured")
        assert response.status_code == 200
        data = response.json()
        assert "featured" in data
        assert isinstance(data["featured"], list)


class TestPollsAPI:
    """GET /api/directory/addons/polls - Custom Poll Template endpoint tests"""

    def test_get_polls_returns_array(self, api_client):
        """Verify polls endpoint returns polls array"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/polls?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "polls" in data
        assert isinstance(data["polls"], list)

    def test_get_polls_empty_for_unclaimed_listing(self, api_client):
        """Unclaimed listing should have no polls"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/polls?listing_id={TEST_LISTING_ID}")
        data = response.json()
        assert data["polls"] == []

    def test_get_polls_requires_listing_id(self, api_client):
        """Verify listing_id is required"""
        response = api_client.get(f"{BASE_URL}/api/directory/addons/polls")
        assert response.status_code == 400


class TestAddonPurchaseAuth:
    """POST /api/directory/addons - Addon purchase authentication tests"""

    def test_purchase_addon_requires_auth(self, api_client):
        """Verify addon purchase returns 401 when unauthenticated"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons",
            json={
                "addon_type": "coupon_engine",
                "listing_id": TEST_LISTING_ID,
                "origin_url": "https://test.com"
            }
        )
        assert response.status_code == 401
        data = response.json()
        assert "error" in data
        assert "unauthorized" in data["error"].lower() or "unauth" in data["error"].lower()

    def test_purchase_invalid_addon_type(self, api_client):
        """Verify invalid addon_type is rejected (even without auth, for validation priority)"""
        response = api_client.post(
            f"{BASE_URL}/api/directory/addons",
            json={
                "addon_type": "invalid_addon",
                "listing_id": TEST_LISTING_ID,
                "origin_url": "https://test.com"
            }
        )
        # Should return 401 (auth checked first) or 400 (validation checked first)
        assert response.status_code in [400, 401]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
