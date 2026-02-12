"""
GL365 Reviews API Tests
Tests the reviews CRUD operations and authentication requirements
"""
import pytest
import requests
import os
import random
import string

BASE_URL = "https://lead-pipeline-23.preview.emergentagent.com"
TEST_LISTING_ID = "5813b912-d37f-4c2c-b5d8-17964e5a728a"  # La Segunda Bakery


class TestReviewsPublicAPI:
    """Public reviews API tests - no auth required"""
    
    def test_get_reviews_for_listing(self):
        """GET /api/directory/reviews?listing_id=xxx returns reviews array with total and average_rating"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "reviews" in data
        assert "total" in data
        assert "average_rating" in data
        assert isinstance(data["reviews"], list)
        assert isinstance(data["total"], int)
        assert isinstance(data["average_rating"], (int, float))
        
        # Verify review structure if reviews exist
        if len(data["reviews"]) > 0:
            review = data["reviews"][0]
            assert "id" in review
            assert "reviewer_name" in review
            assert "rating" in review
            assert "text" in review
            assert "created_at" in review
    
    def test_get_reviews_missing_listing_id(self):
        """GET /api/directory/reviews without listing_id returns 400"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews")
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        assert "listing_id required" in data["error"]
    
    def test_get_reviews_invalid_listing(self):
        """GET /api/directory/reviews with invalid listing returns 404"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews?listing_id=invalid-listing-id-12345")
        assert response.status_code == 404
        
        data = response.json()
        assert "error" in data
    
    def test_post_review_success(self):
        """POST /api/directory/reviews creates a review successfully"""
        random_suffix = ''.join(random.choices(string.ascii_lowercase, k=6))
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": f"TEST_Reviewer_{random_suffix}",
            "rating": 4,
            "text": f"Test review from automated testing {random_suffix}"
        }
        
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "review_id" in data
        assert data["review_id"].startswith("rev_")
        
        # Verify review was created by fetching reviews
        get_response = requests.get(f"{BASE_URL}/api/directory/reviews?listing_id={TEST_LISTING_ID}")
        reviews_data = get_response.json()
        
        # Find our review
        found_review = None
        for review in reviews_data["reviews"]:
            if review["id"] == data["review_id"]:
                found_review = review
                break
        
        assert found_review is not None
        assert found_review["reviewer_name"] == payload["reviewer_name"]
        assert found_review["rating"] == payload["rating"]
        assert found_review["text"] == payload["text"]
    
    def test_post_review_missing_fields(self):
        """POST /api/directory/reviews rejects missing fields (returns 400)"""
        # Missing text field
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "Test User",
            "rating": 5
        }
        
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        assert "required" in data["error"].lower()
    
    def test_post_review_missing_rating(self):
        """POST /api/directory/reviews rejects missing rating"""
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "Test User",
            "text": "Missing rating test"
        }
        
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
    
    def test_post_review_invalid_rating_too_high(self):
        """POST /api/directory/reviews rejects invalid rating above 5"""
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "Test User",
            "rating": 6,
            "text": "Invalid rating test"
        }
        
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        assert "1-5" in data["error"]
    
    def test_post_review_invalid_rating_too_low(self):
        """POST /api/directory/reviews rejects invalid rating below 1 (tests with -1 since 0 is falsy)"""
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "Test User",
            "rating": -1,
            "text": "Invalid rating test"
        }
        
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 400
        
        data = response.json()
        assert "error" in data
        assert "1-5" in data["error"]
    
    def test_post_review_valid_boundary_ratings(self):
        """POST /api/directory/reviews accepts boundary ratings (1 and 5)"""
        # Test rating 1
        payload = {
            "listing_id": TEST_LISTING_ID,
            "reviewer_name": "TEST_Boundary_1",
            "rating": 1,
            "text": "Testing boundary rating 1"
        }
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 200
        
        # Test rating 5
        payload["reviewer_name"] = "TEST_Boundary_5"
        payload["rating"] = 5
        payload["text"] = "Testing boundary rating 5"
        response = requests.post(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 200


class TestReviewsAuthenticatedAPI:
    """Authenticated reviews API tests - require auth"""
    
    def test_manage_endpoint_requires_auth(self):
        """GET /api/directory/reviews/manage returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/directory/reviews/manage?listing_id={TEST_LISTING_ID}")
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "Unauthorized" in data["error"]
    
    def test_patch_review_requires_auth(self):
        """PATCH /api/directory/reviews returns 401 without auth"""
        payload = {
            "listing_id": TEST_LISTING_ID,
            "action": "approve_draft",
            "review_id": "rev_test"
        }
        
        response = requests.patch(f"{BASE_URL}/api/directory/reviews", json=payload)
        assert response.status_code == 401
        
        data = response.json()
        assert "error" in data
        assert "Unauthorized" in data["error"]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
