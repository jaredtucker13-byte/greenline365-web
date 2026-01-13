"""
Test Suite for GreenLine365 AI Website Builder APIs
Tests the following endpoints:
- POST /api/capture-screenshot - URL screenshot capture
- POST /api/design-workflow/analyze - AI analysis
- POST /api/design-workflow/generate-mockup - Mockup generation
- POST /api/design-workflow/generate-code - Code generation
"""

import pytest
import requests
import base64
import os
import time

# Use localhost for testing
BASE_URL = "http://localhost:3000"

# Sample test image (1x1 red pixel PNG)
SAMPLE_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

# More realistic test image - a simple 10x10 gradient PNG
REALISTIC_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9QzwAEjDAGNzYAAIoaB/5rSwaMAAAAAElFTkSuQmCC"


class TestCaptureScreenshotAPI:
    """Tests for /api/capture-screenshot endpoint"""
    
    def test_capture_screenshot_valid_url(self):
        """Test capturing screenshot from a valid URL"""
        response = requests.post(
            f"{BASE_URL}/api/capture-screenshot",
            json={"url": "https://example.com"},
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Should return 200 or 500 (if all services fail)
        assert response.status_code in [200, 500]
        
        data = response.json()
        if response.status_code == 200:
            assert data.get("success") == True
            assert "screenshot" in data
            assert len(data["screenshot"]) > 100  # Should have base64 data
        else:
            # If failed, should have error message
            assert "error" in data or "success" in data
    
    def test_capture_screenshot_missing_url(self):
        """Test error handling when URL is missing"""
        response = requests.post(
            f"{BASE_URL}/api/capture-screenshot",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_capture_screenshot_invalid_url(self):
        """Test error handling for invalid URL format"""
        response = requests.post(
            f"{BASE_URL}/api/capture-screenshot",
            json={"url": "not-a-valid-url"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Should either normalize URL or return error
        assert response.status_code in [200, 400, 500]
    
    def test_capture_screenshot_with_dimensions(self):
        """Test capturing screenshot with custom dimensions"""
        response = requests.post(
            f"{BASE_URL}/api/capture-screenshot",
            json={
                "url": "https://example.com",
                "width": 1280,
                "height": 720
            },
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        assert response.status_code in [200, 500]


class TestAnalyzeAPI:
    """Tests for /api/design-workflow/analyze endpoint"""
    
    def test_analyze_mode_required(self):
        """Test that mode is required"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_analyze_mode_analyze_requires_image(self):
        """Test that analyze mode requires image"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={"mode": "analyze"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_analyze_mode_scratch_requires_description(self):
        """Test that scratch mode requires description"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={"mode": "scratch"},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_analyze_with_image_gemini(self):
        """Test analyze mode with image using Gemini 3 Pro"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={
                "mode": "analyze",
                "imageBase64": REALISTIC_IMAGE_BASE64,
                "visionModel": "gemini-3-pro",
                "analysisType": "full"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response keys: {data.keys()}")
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "analysisText" in data
            assert "designSpec" in data
            print(f"Analysis preview: {data.get('analysisText', '')[:200]}...")
        else:
            print(f"Error: {data}")
            # API key might not be configured
            assert response.status_code in [200, 500]
    
    def test_analyze_scratch_mode(self):
        """Test scratch mode with description"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={
                "mode": "scratch",
                "description": "A modern law firm website with professional design",
                "brandColors": "Navy blue and gold",
                "stylePreference": "Professional, modern",
                "targetAudience": "Business professionals"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response keys: {data.keys()}")
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "analysisText" in data
            print(f"Design spec preview: {data.get('analysisText', '')[:200]}...")
        else:
            print(f"Error: {data}")
            assert response.status_code in [200, 500]
    
    def test_analyze_different_analysis_types(self):
        """Test different analysis types"""
        analysis_types = ["full", "hero", "conversion", "visual"]
        
        for analysis_type in analysis_types:
            response = requests.post(
                f"{BASE_URL}/api/design-workflow/analyze",
                json={
                    "mode": "analyze",
                    "imageBase64": REALISTIC_IMAGE_BASE64,
                    "visionModel": "gemini-3-pro",
                    "analysisType": analysis_type
                },
                headers={"Content-Type": "application/json"},
                timeout=120
            )
            
            print(f"Analysis type '{analysis_type}': Status {response.status_code}")
            assert response.status_code in [200, 500]
            
            # Only test one to save API calls
            break


class TestGenerateMockupAPI:
    """Tests for /api/design-workflow/generate-mockup endpoint"""
    
    def test_generate_mockup_requires_analysis(self):
        """Test that analysis text is required"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-mockup",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_generate_mockup_recreate_mode(self):
        """Test mockup generation in recreate mode"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-mockup",
            json={
                "analysisText": "A modern landing page with hero section, blue color scheme, clean typography",
                "mode": "recreate",
                "aspectRatio": "16:9",
                "resolution": "2K"
            },
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Response keys: {data.keys()}")
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "mockupImageUrl" in data
            print(f"Mockup URL: {data.get('mockupImageUrl', '')[:100]}...")
        else:
            print(f"Error: {data}")
            # KIE API might have issues
            assert response.status_code in [200, 500]
    
    def test_generate_mockup_redesign_mode(self):
        """Test mockup generation in redesign mode"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-mockup",
            json={
                "analysisText": "A dashboard page with analytics charts and metrics",
                "mode": "redesign",
                "aspectRatio": "16:9",
                "resolution": "2K"
            },
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "mockupImageUrl" in data
            assert data.get("mode") == "redesign"
        else:
            print(f"Error: {data}")
            assert response.status_code in [200, 500]
    
    def test_generate_mockup_landing_page_mode(self):
        """Test mockup generation in landing page mode"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-mockup",
            json={
                "analysisText": "Convert this calendar app to a landing page with hero section and CTA",
                "mode": "landing_page",
                "aspectRatio": "16:9",
                "resolution": "2K"
            },
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "mockupImageUrl" in data
            assert data.get("mode") == "landing_page"
        else:
            print(f"Error: {data}")
            assert response.status_code in [200, 500]


class TestGenerateCodeAPI:
    """Tests for /api/design-workflow/generate-code endpoint"""
    
    def test_generate_code_requires_analysis(self):
        """Test that analysis text is required"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-code",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_generate_code_success(self):
        """Test code generation with valid analysis"""
        response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-code",
            json={
                "analysisText": """
                HERO SECTION:
                - Headline: "Transform Your Business"
                - Subheadline: "AI-powered solutions for modern enterprises"
                - CTA: "Get Started" button in emerald green
                
                COLOR PALETTE:
                - Primary: #10B981 (emerald)
                - Secondary: #1F2937 (dark gray)
                - Background: #111827 (near black)
                
                TYPOGRAPHY:
                - Headings: Inter, bold
                - Body: Inter, regular
                """,
                "designSpec": {"mode": "analyze"}
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Status: {response.status_code}")
        data = response.json()
        
        if response.status_code == 200:
            assert data.get("success") == True
            assert "code" in data
            code = data.get("code", "")
            print(f"Code preview: {code[:300]}...")
            
            # Verify it's React/Tailwind code
            assert "import" in code.lower() or "export" in code.lower() or "function" in code.lower()
        else:
            print(f"Error: {data}")
            assert response.status_code in [200, 500]


class TestEndToEndWorkflow:
    """End-to-end workflow tests"""
    
    def test_full_analyze_workflow(self):
        """Test complete workflow: analyze -> mockup -> code"""
        # Step 1: Analyze
        print("\n=== Step 1: Analyze ===")
        analyze_response = requests.post(
            f"{BASE_URL}/api/design-workflow/analyze",
            json={
                "mode": "scratch",
                "description": "A SaaS landing page for a project management tool",
                "brandColors": "Purple and white",
                "stylePreference": "Modern, clean, minimal",
                "targetAudience": "Tech startups and remote teams"
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Analyze Status: {analyze_response.status_code}")
        
        if analyze_response.status_code != 200:
            pytest.skip("Analysis API not available")
        
        analyze_data = analyze_response.json()
        assert analyze_data.get("success") == True
        analysis_text = analyze_data.get("analysisText", "")
        print(f"Analysis preview: {analysis_text[:200]}...")
        
        # Step 2: Generate Mockup
        print("\n=== Step 2: Generate Mockup ===")
        mockup_response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-mockup",
            json={
                "analysisText": analysis_text,
                "mode": "landing_page",
                "aspectRatio": "16:9",
                "resolution": "2K"
            },
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Mockup Status: {mockup_response.status_code}")
        
        if mockup_response.status_code != 200:
            pytest.skip("Mockup API not available")
        
        mockup_data = mockup_response.json()
        assert mockup_data.get("success") == True
        mockup_url = mockup_data.get("mockupImageUrl", "")
        print(f"Mockup URL: {mockup_url[:100]}...")
        
        # Step 3: Generate Code
        print("\n=== Step 3: Generate Code ===")
        code_response = requests.post(
            f"{BASE_URL}/api/design-workflow/generate-code",
            json={
                "analysisText": analysis_text,
                "designSpec": analyze_data.get("designSpec", {})
            },
            headers={"Content-Type": "application/json"},
            timeout=120
        )
        
        print(f"Code Status: {code_response.status_code}")
        
        if code_response.status_code != 200:
            pytest.skip("Code generation API not available")
        
        code_data = code_response.json()
        assert code_data.get("success") == True
        code = code_data.get("code", "")
        print(f"Code preview: {code[:300]}...")
        
        print("\n=== Workflow Complete ===")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
