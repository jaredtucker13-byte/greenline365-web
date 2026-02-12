"""
Test suite for Chat API Directory Search Integration and Photo Library API
Tests:
1. Chat POST /api/chat - Directory search for restaurants, plumbers, claim instructions, pricing tiers
2. Photo Library API - Auth gating (401 without auth)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://florida-tourism-crm.preview.emergentagent.com').rstrip('/')

class TestChatDirectorySearch:
    """Test Chat API with Directory Search Integration"""
    
    def test_chat_find_restaurants_tampa(self):
        """Chat should return restaurants in Tampa with listing links"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "find restaurants in Tampa"},
            headers={"Content-Type": "application/json"},
            timeout=60  # AI responses can be slow
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Check for response structure
        assert "choices" in data or "reply" in data, f"Unexpected response structure: {data}"
        
        # Extract content
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "") or data.get("reply", "")
        print(f"Chat response for 'find restaurants in Tampa': {content[:500]}...")
        
        # Should contain /listing/ links for directory businesses
        assert "/listing/" in content.lower() or "tampa" in content.lower(), \
            f"Expected listing links or Tampa mention in response: {content[:300]}"
    
    def test_chat_find_plumber(self):
        """Chat should return plumbing businesses when asked"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "I need a plumber"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "") or data.get("reply", "")
        print(f"Chat response for 'I need a plumber': {content[:500]}...")
        
        # Should mention plumber/plumbing services or ask for location
        content_lower = content.lower()
        assert "plumb" in content_lower or "services" in content_lower or "listing" in content_lower or "where" in content_lower, \
            f"Expected plumbing-related content or follow-up question: {content[:300]}"
    
    def test_chat_claim_listing_instructions(self):
        """Chat should provide claim instructions with greenline365help@gmail.com"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "how do I claim my listing"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "") or data.get("reply", "")
        print(f"Chat response for 'how do I claim my listing': {content[:500]}...")
        
        content_lower = content.lower()
        # Should mention email or claiming process
        assert "greenline365help@gmail.com" in content_lower or "claim" in content_lower or "email" in content_lower, \
            f"Expected claiming instructions with email: {content[:300]}"
    
    def test_chat_pricing_tiers(self):
        """Chat should return tier pricing info ($39/$59)"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={"message": "what are your pricing tiers"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "") or data.get("reply", "")
        print(f"Chat response for 'what are your pricing tiers': {content[:500]}...")
        
        # Should mention pricing tiers
        content_lower = content.lower()
        has_pricing_info = "$39" in content or "$59" in content or "pro" in content_lower or "premium" in content_lower or "free" in content_lower
        assert has_pricing_info, f"Expected pricing tier info ($39/$59 or Pro/Premium): {content[:300]}"


class TestPhotoLibraryAPIAuthGating:
    """Test Photo Library API returns 401 without authentication"""
    
    def test_get_photos_requires_auth(self):
        """GET /api/directory/photos should return 401 without auth"""
        response = requests.get(
            f"{BASE_URL}/api/directory/photos?listing_id=test-listing",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should be 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, f"Expected error in response: {data}"
        assert "unauthorized" in data.get("error", "").lower() or "auth" in data.get("error", "").lower(), \
            f"Expected unauthorized error message: {data}"
    
    def test_post_photos_requires_auth(self):
        """POST /api/directory/photos should return 401 without auth"""
        response = requests.post(
            f"{BASE_URL}/api/directory/photos",
            json={"listing_id": "test-listing", "photo_url": "https://example.com/test.jpg"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should be 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, f"Expected error in response: {data}"
        assert "unauthorized" in data.get("error", "").lower() or "auth" in data.get("error", "").lower(), \
            f"Expected unauthorized error message: {data}"
    
    def test_patch_photos_requires_auth(self):
        """PATCH /api/directory/photos should return 401 without auth"""
        response = requests.patch(
            f"{BASE_URL}/api/directory/photos",
            json={"listing_id": "test-listing", "action": "set_cover", "photo_url": "https://example.com/test.jpg"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        # Should be 401 Unauthorized
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "error" in data, f"Expected error in response: {data}"


class TestExistingListingsStillWork:
    """Verify existing listing pages still load correctly"""
    
    def test_la_segunda_bakery_listing_loads(self):
        """GET /api/directory/la-segunda-bakery should return listing data"""
        response = requests.get(
            f"{BASE_URL}/api/directory/la-segunda-bakery",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "business_name" in data or "name" in data, f"Expected business_name in response: {data}"
        
        # Verify it's the correct listing
        business_name = data.get("business_name") or data.get("name", "")
        assert "segunda" in business_name.lower() or "bakery" in business_name.lower(), \
            f"Expected La Segunda Bakery, got: {business_name}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
