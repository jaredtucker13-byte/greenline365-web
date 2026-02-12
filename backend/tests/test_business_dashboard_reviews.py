"""
Test Suite for Business Owner Review Dashboard Panel
Testing: POST /api/directory/reviews text validation, auth-protected endpoints, listings
"""
import pytest
import requests
import os

# Use production URL from iteration reports
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://lead-pipeline-23.preview.emergentagent.com').rstrip('/')

# Test listing ID: La Segunda Bakery
TEST_LISTING_ID = "5813b912-d37f-4c2c-b5d8-17964e5a728a"


class TestReviewTextValidation:
    """Test POST /api/directory/reviews minimum text length validation (10 chars required)"""
    
    def test_rejects_short_review_text_empty(self):
        """Empty text should be rejected"""
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Short_Reviewer",
            "rating": 4,
            "text": ""
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data
    
    def test_rejects_short_review_text_under_10_chars(self):
        """Text under 10 characters should be rejected with descriptive error"""
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Short_Reviewer",
            "rating": 5,
            "text": "Good!"  # Only 5 chars
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data
        # Check for descriptive error message about minimum length
        assert "10" in data["error"] or "character" in data["error"].lower(), f"Expected descriptive error about 10 chars, got: {data['error']}"
    
    def test_rejects_whitespace_only_text(self):
        """Whitespace-only text should be rejected (trim check)"""
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Whitespace_Reviewer",
            "rating": 3,
            "text": "         "  # Only spaces
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
    
    def test_rejects_9_char_text(self):
        """Exactly 9 characters should be rejected"""
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_9Char_Reviewer",
            "rating": 4,
            "text": "123456789"  # Exactly 9 chars
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
    
    def test_accepts_exactly_10_char_text(self):
        """Exactly 10 characters should be accepted"""
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_10Char_Reviewer",
            "rating": 5,
            "text": "1234567890"  # Exactly 10 chars
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "review_id" in data
    
    def test_accepts_long_review_text(self):
        """Long review text should be accepted"""
        long_text = "This is an excellent bakery! The Cuban bread is fresh and delicious. Highly recommended for anyone visiting Tampa."
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Long_Reviewer",
            "rating": 5,
            "text": long_text
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True


class TestReviewManageEndpointAuth:
    """Test GET /api/directory/reviews/manage requires authentication"""
    
    def test_manage_returns_401_without_auth(self):
        """Manage endpoint should return 401 without authentication"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews/manage", params={
            "listing_id": TEST_LISTING_ID
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "message" in data


class TestReviewPatchAuth:
    """Test PATCH /api/directory/reviews requires authentication"""
    
    def test_patch_toggle_auto_returns_401_without_auth(self):
        """PATCH with action=toggle_auto should return 401 without authentication"""
        response = requests.patch(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "action": "toggle_auto"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert "error" in data or "Unauthorized" in str(data)
    
    def test_patch_approve_draft_returns_401_without_auth(self):
        """PATCH with action=approve_draft should return 401 without authentication"""
        response = requests.patch(f"{BASE_URL}/api/directory/reviews", json={
            "listing_id": TEST_LISTING_ID,
            "action": "approve_draft",
            "review_id": "test_review_123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"


class TestPublicReviewsGet:
    """Test GET /api/directory/reviews (public endpoint)"""
    
    def test_get_reviews_returns_list(self):
        """GET reviews should return list with stats"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews", params={
            "listing_id": TEST_LISTING_ID
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "average_rating" in data
        assert isinstance(data["reviews"], list)
    
    def test_get_reviews_requires_listing_id(self):
        """GET reviews without listing_id should return 400"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews")
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"


class TestListingPage:
    """Test listing API for La Segunda Bakery"""
    
    def test_la_segunda_bakery_exists(self):
        """La Segunda Bakery listing should exist and be accessible"""
        response = requests.get(f"{BASE_URL}/api/directory/la-segunda-bakery")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "business_name" in data
        assert "La Segunda" in data["business_name"]


# Run specific tests with pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
