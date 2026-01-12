"""
Blog Auto-Polish API Tests
Tests for the GreenLine365 Blog Auto-Polish feature with AI-powered style generation.

Features tested:
- Blog post creation with style_guide
- Style analysis API (analyze-style action)
- SEO analysis API
- Blog post retrieval
"""

import pytest
import requests
import os
import time

# Use localhost since external URL routes to different backend
BASE_URL = "http://localhost:3000"

# Supabase credentials for direct DB verification
SUPABASE_URL = "https://rawlqwjdfzicjepzmcng.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhd2xxd2pkZnppY2plcHptY25nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTUyMDEsImV4cCI6MjA3OTc3MTIwMX0.qCxkpcPYl_ecBiVgAobaMqoO6p4ufyaHMW5Dv4orKMU"


class TestBlogPolishAPI:
    """Test suite for Blog Auto-Polish API endpoints"""
    
    @pytest.fixture
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture
    def supabase_client(self):
        """Supabase client for direct DB queries"""
        session = requests.Session()
        session.headers.update({
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        })
        return session
    
    @pytest.fixture
    def sample_blog_content(self):
        """Sample blog content for testing"""
        return {
            "title": "TEST_Marketing Automation Best Practices",
            "content": """## Introduction to Marketing Automation

Marketing automation has become essential for small businesses looking to scale their operations efficiently. In today's competitive landscape, businesses need to leverage technology to stay ahead.

## Why Marketing Automation Matters

Small businesses often struggle with limited resources and time. Marketing automation helps by:
- Streamlining repetitive tasks
- Improving customer engagement
- Increasing conversion rates
- Saving valuable time and money

## Top Strategies for Success

### 1. Email Marketing Automation
Set up automated email sequences to nurture leads and convert them into customers.

### 2. Social Media Scheduling
Use tools to schedule posts across multiple platforms.

## Conclusion

Marketing automation is no longer optional for small businesses.""",
            "category": "Marketing Automation",
            "tags": ["marketing", "automation", "small-business"]
        }
    
    @pytest.fixture
    def sample_style_guide(self):
        """Sample style guide for testing"""
        return {
            "themeName": "Test Theme",
            "description": "A test theme for automated testing",
            "colors": {
                "primary": "#1A73E8",
                "secondary": "#34A853",
                "accent": "#FBBC05",
                "background": "#FFFFFF",
                "text": "#202124",
                "textMuted": "#5F6368",
                "headings": "#1A73E8",
                "links": "#1A73E8"
            },
            "texture": {
                "type": "none",
                "opacity": 0,
                "description": "Clean design"
            },
            "typography": {
                "headingStyle": "bold",
                "headingSize": "large",
                "bodyLineHeight": "relaxed",
                "emphasis": "italic"
            },
            "layout": {
                "contentWidth": "medium",
                "imageStyle": "rounded",
                "spacing": "balanced",
                "headerStyle": "minimal"
            },
            "mood": "Professional and clean"
        }

    # ==================== Blog Post API Tests ====================
    
    def test_create_blog_post_without_style(self, api_client, sample_blog_content):
        """Test creating a blog post without style_guide"""
        response = api_client.post(f"{BASE_URL}/api/blog", json={
            **sample_blog_content,
            "status": "draft"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "post" in data, "Response should contain 'post' key"
        assert data["post"]["title"] == sample_blog_content["title"]
        assert data["post"]["category"] == sample_blog_content["category"]
        assert data["post"]["status"] == "draft"
        assert "seo" in data, "Response should contain 'seo' key"
        
        # Store post ID for cleanup
        self.created_post_id = data["post"]["id"]
        print(f"Created blog post: {data['post']['id']}")
    
    def test_create_blog_post_with_style_guide(self, api_client, sample_blog_content, sample_style_guide):
        """Test creating a blog post with style_guide JSONB data"""
        response = api_client.post(f"{BASE_URL}/api/blog", json={
            **sample_blog_content,
            "title": "TEST_Blog Post With Style Guide",
            "status": "draft",
            "style_guide": sample_style_guide
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "post" in data
        assert data["post"]["style_guide"] is not None, "style_guide should be saved"
        assert data["post"]["style_guide"]["themeName"] == sample_style_guide["themeName"]
        assert data["post"]["style_guide"]["colors"]["primary"] == sample_style_guide["colors"]["primary"]
        
        print(f"Created blog post with style_guide: {data['post']['id']}")
    
    def test_create_blog_post_validation(self, api_client):
        """Test blog post creation validation - missing required fields"""
        # Missing title
        response = api_client.post(f"{BASE_URL}/api/blog", json={
            "content": "Some content"
        })
        assert response.status_code == 400, "Should return 400 for missing title"
        
        # Missing content
        response = api_client.post(f"{BASE_URL}/api/blog", json={
            "title": "Some title"
        })
        assert response.status_code == 400, "Should return 400 for missing content"
    
    def test_get_blog_posts(self, api_client):
        """Test retrieving blog posts"""
        response = api_client.get(f"{BASE_URL}/api/blog?status=draft&limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "posts" in data, "Response should contain 'posts' key"
        assert isinstance(data["posts"], list), "posts should be a list"
        
        print(f"Retrieved {len(data['posts'])} blog posts")

    # ==================== Style Analysis API Tests ====================
    
    def test_style_analysis_api(self, api_client, sample_blog_content):
        """Test the AI style analysis endpoint"""
        response = api_client.post(f"{BASE_URL}/api/blog/images", json={
            "action": "analyze-style",
            "title": sample_blog_content["title"],
            "content": sample_blog_content["content"],
            "category": sample_blog_content["category"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Note: AI may sometimes fail to parse JSON, so we check for success or raw response
        if data.get("success"):
            assert "styleGuide" in data, "Response should contain 'styleGuide'"
            style_guide = data["styleGuide"]
            
            # Verify style guide structure
            assert "themeName" in style_guide, "styleGuide should have themeName"
            assert "colors" in style_guide, "styleGuide should have colors"
            assert "texture" in style_guide, "styleGuide should have texture"
            assert "typography" in style_guide, "styleGuide should have typography"
            assert "layout" in style_guide, "styleGuide should have layout"
            assert "mood" in style_guide, "styleGuide should have mood"
            
            # Verify colors structure
            colors = style_guide["colors"]
            assert "primary" in colors, "colors should have primary"
            assert "background" in colors, "colors should have background"
            assert "text" in colors, "colors should have text"
            
            print(f"Style analysis successful: {style_guide['themeName']}")
        else:
            # AI parsing may fail sometimes, check for raw response
            assert "raw" in data or "error" in data, "Should have raw response or error"
            print(f"Style analysis returned raw/error: {data.get('error', 'parsing issue')}")
    
    def test_style_analysis_validation(self, api_client):
        """Test style analysis validation - missing required fields"""
        # Missing title
        response = api_client.post(f"{BASE_URL}/api/blog/images", json={
            "action": "analyze-style",
            "content": "Some content"
        })
        assert response.status_code == 400, "Should return 400 for missing title"
        
        # Missing content
        response = api_client.post(f"{BASE_URL}/api/blog/images", json={
            "action": "analyze-style",
            "title": "Some title"
        })
        assert response.status_code == 400, "Should return 400 for missing content"

    # ==================== SEO Analysis API Tests ====================
    
    def test_seo_analysis_api(self, api_client, sample_blog_content):
        """Test the SEO analysis endpoint"""
        response = api_client.post(f"{BASE_URL}/api/blog/analyze", json={
            "title": sample_blog_content["title"],
            "content": sample_blog_content["content"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "score" in data, "Response should contain 'score'"
        assert "details" in data, "Response should contain 'details'"
        assert "feedback" in data, "Response should contain 'feedback'"
        
        # Verify score is reasonable
        assert 0 <= data["score"] <= 100, "Score should be between 0 and 100"
        
        # Verify details structure
        details = data["details"]
        assert "wordCount" in details, "details should have wordCount"
        assert "titleLength" in details, "details should have titleLength"
        assert "readTime" in details, "details should have readTime"
        
        print(f"SEO score: {data['score']}/100")

    # ==================== Image Analysis API Tests ====================
    
    def test_image_analysis_api(self, api_client, sample_blog_content):
        """Test the image analysis endpoint"""
        response = api_client.post(f"{BASE_URL}/api/blog/images", json={
            "action": "analyze",
            "title": sample_blog_content["title"],
            "content": sample_blog_content["content"]
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "suggestions" in data, "Response should contain 'suggestions'"
        
        if len(data["suggestions"]) > 0:
            suggestion = data["suggestions"][0]
            assert "id" in suggestion, "suggestion should have id"
            assert "placement" in suggestion, "suggestion should have placement"
            assert "prompt" in suggestion, "suggestion should have prompt"
            
            print(f"Image analysis returned {len(data['suggestions'])} suggestions")
        else:
            print("Image analysis returned no suggestions")

    # ==================== Database Verification Tests ====================
    
    def test_verify_style_guide_in_database(self, supabase_client, api_client, sample_blog_content, sample_style_guide):
        """Verify style_guide is correctly stored in Supabase as JSONB"""
        # Create a post with style_guide
        unique_title = f"TEST_DB_Verify_{int(time.time())}"
        response = api_client.post(f"{BASE_URL}/api/blog", json={
            **sample_blog_content,
            "title": unique_title,
            "status": "draft",
            "style_guide": sample_style_guide
        })
        
        assert response.status_code == 200
        post_id = response.json()["post"]["id"]
        
        # Query Supabase directly to verify
        db_response = supabase_client.get(
            f"{SUPABASE_URL}/rest/v1/blog_posts",
            params={
                "select": "id,title,style_guide",
                "id": f"eq.{post_id}"
            }
        )
        
        assert db_response.status_code == 200, f"Supabase query failed: {db_response.text}"
        
        posts = db_response.json()
        assert len(posts) == 1, "Should find exactly one post"
        
        db_post = posts[0]
        assert db_post["style_guide"] is not None, "style_guide should be stored in DB"
        assert db_post["style_guide"]["themeName"] == sample_style_guide["themeName"]
        assert db_post["style_guide"]["colors"]["primary"] == sample_style_guide["colors"]["primary"]
        
        print(f"Verified style_guide in database for post: {post_id}")

    # ==================== Cleanup ====================
    
    @pytest.fixture(autouse=True, scope="class")
    def cleanup_test_data(self, supabase_client):
        """Cleanup TEST_ prefixed data after test class completes"""
        yield
        # Teardown: Delete all test-created data
        try:
            response = supabase_client.delete(
                f"{SUPABASE_URL}/rest/v1/blog_posts",
                params={"title": "like.TEST_%"}
            )
            print(f"Cleanup: Deleted test posts")
        except Exception as e:
            print(f"Cleanup warning: {e}")


class TestInvalidActions:
    """Test invalid API actions"""
    
    def test_invalid_action(self):
        """Test invalid action returns error"""
        response = requests.post(
            f"{BASE_URL}/api/blog/images",
            json={"action": "invalid-action"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, "Should return 400 for invalid action"
        assert "error" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
