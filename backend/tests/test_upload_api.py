"""
Test suite for GL365 Image Upload API
Tests image optimization with sharp library - auto-compress to WebP format
"""
import pytest
import requests
import io
import os

# Use localhost:3000 as this is a Next.js app, not FastAPI
BASE_URL = "http://localhost:3000"

class TestGitignoreConfiguration:
    """Test 1-2: Verify .gitignore files properly exclude .env files"""
    
    def test_root_gitignore_excludes_env_files(self):
        """Root .gitignore should exclude .env, .env.*, .env.local files"""
        with open('/app/.gitignore', 'r') as f:
            content = f.read()
        
        assert '.env' in content, ".env should be in root .gitignore"
        assert '.env.*' in content, ".env.* should be in root .gitignore"
        assert '.env.local' in content, ".env.local should be in root .gitignore"
        assert '!.env.example' in content, ".env.example should be allowed"
        print("Root .gitignore correctly excludes .env files")
    
    def test_webapp_gitignore_excludes_env_files(self):
        """Webapp .gitignore should have .env* pattern"""
        with open('/app/webapp/.gitignore', 'r') as f:
            content = f.read()
        
        assert '.env*' in content, ".env* should be in webapp .gitignore"
        print("Webapp .gitignore correctly excludes .env files")


class TestUploadAPIBasics:
    """Test basic upload API functionality"""
    
    def test_upload_endpoint_requires_file(self):
        """POST /api/upload should return 400 if no file provided"""
        response = requests.post(
            f"{BASE_URL}/api/upload",
            data={},
            headers={'Content-Type': 'multipart/form-data'}
        )
        # Either 400 for no file or 500 for content-type issue
        assert response.status_code in [400, 500], f"Expected 400/500, got {response.status_code}"
        print(f"No file upload returns status {response.status_code}")
    
    def test_upload_rejects_non_image_files(self):
        """POST /api/upload should reject non-image file types"""
        # Create a fake text file
        text_content = b"This is a text file, not an image"
        files = {
            'file': ('test.txt', io.BytesIO(text_content), 'text/plain')
        }
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 400, f"Expected 400 for non-image, got {response.status_code}"
        data = response.json()
        assert 'error' in data, "Response should contain error field"
        assert 'Invalid file type' in data.get('error', ''), "Error should mention invalid file type"
        print(f"Non-image file rejected with: {data.get('error')}")
    
    def test_upload_rejects_large_files(self):
        """POST /api/upload should reject files over 10MB"""
        # Create a file larger than 10MB (using minimal valid PNG header + padding)
        png_header = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 image
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE,
        ])
        # Pad to 10.5MB
        large_content = png_header + (b'\x00' * (10 * 1024 * 1024 + 500000))
        
        files = {
            'file': ('large.png', io.BytesIO(large_content), 'image/png')
        }
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 400, f"Expected 400 for large file, got {response.status_code}"
        data = response.json()
        assert 'error' in data, "Response should contain error field"
        assert 'large' in data.get('error', '').lower() or '10MB' in data.get('error', ''), \
            f"Error should mention file size: {data.get('error')}"
        print(f"Large file rejected with: {data.get('error')}")


class TestUploadImageOptimization:
    """Test image optimization with sharp library"""
    
    @staticmethod
    def create_minimal_png(width=100, height=100, color=(255, 0, 0)):
        """Create a minimal valid PNG image using pure Python"""
        import zlib
        import struct
        
        def png_chunk(chunk_type, data):
            chunk_len = struct.pack('>I', len(data))
            chunk_crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
            return chunk_len + chunk_type + data + chunk_crc
        
        # PNG signature
        signature = b'\x89PNG\r\n\x1a\n'
        
        # IHDR chunk (image header)
        ihdr_data = struct.pack('>II', width, height) + b'\x08\x02\x00\x00\x00'  # 8-bit RGB
        ihdr = png_chunk(b'IHDR', ihdr_data)
        
        # IDAT chunk (image data)
        # Create raw RGB pixel data
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # Filter type: None
            for x in range(width):
                raw_data += bytes(color)
        
        compressed = zlib.compress(raw_data, 9)
        idat = png_chunk(b'IDAT', compressed)
        
        # IEND chunk
        iend = png_chunk(b'IEND', b'')
        
        return signature + ihdr + idat + iend
    
    @staticmethod
    def create_minimal_jpeg(width=100, height=100):
        """Create a minimal valid JPEG using PIL if available, else raw bytes"""
        try:
            from PIL import Image
            img = Image.new('RGB', (width, height), color=(0, 100, 200))
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)
            return buffer.read()
        except ImportError:
            # Fallback: minimal JPEG structure
            # This is a very minimal 1x1 JPEG
            return bytes([
                0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
                0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
                0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
                0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
                0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
                0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
                0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
                0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
                0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
                0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
                0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
                0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
                0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
                0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
                0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
                0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
                0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
                0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
                0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
                0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
                0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
                0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
                0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
                0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
                0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
                0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
                0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
                0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD5, 0xDB, 0x00, 0x31, 0xC4, 0x1F, 0xFF,
                0xD9
            ])
    
    def test_png_upload_converts_to_webp(self):
        """Test 3: POST /api/upload with PNG should auto-compress to WebP format"""
        png_data = self.create_minimal_png(200, 200, (255, 128, 64))
        original_size = len(png_data)
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        data = {'folder': 'test-uploads'}
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get('success') == True, f"Upload should succeed: {result}"
        assert 'url' in result, "Response should contain url"
        assert 'originalSize' in result, "Response should contain originalSize"
        assert 'compressedSize' in result, "Response should contain compressedSize"
        assert 'savingsPercent' in result, "Response should contain savingsPercent"
        assert 'format' in result, "Response should contain format"
        
        # Verify WebP conversion
        assert result['format'] == 'webp', f"Format should be webp, got {result['format']}"
        assert result['type'] == 'image/webp', f"Type should be image/webp, got {result['type']}"
        
        print(f"PNG upload success: {original_size}B -> {result['compressedSize']}B ({result['savingsPercent']}% savings)")
    
    def test_jpeg_upload_converts_to_webp(self):
        """Test 3: POST /api/upload with JPEG should auto-compress to WebP format"""
        jpeg_data = self.create_minimal_jpeg(200, 200)
        original_size = len(jpeg_data)
        
        files = {
            'file': ('test_image.jpg', io.BytesIO(jpeg_data), 'image/jpeg')
        }
        data = {'folder': 'test-uploads'}
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get('success') == True, f"Upload should succeed: {result}"
        assert result['format'] == 'webp', f"Format should be webp, got {result['format']}"
        
        print(f"JPEG upload success: {original_size}B -> {result['compressedSize']}B ({result['savingsPercent']}% savings)")
    
    def test_upload_response_fields(self):
        """Test 4: POST /api/upload should return originalSize, compressedSize, savingsPercent, format fields"""
        png_data = self.create_minimal_png(100, 100)
        
        files = {
            'file': ('fields_test.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        result = response.json()
        
        # Check all required fields
        required_fields = ['originalSize', 'compressedSize', 'savingsPercent', 'format']
        for field in required_fields:
            assert field in result, f"Missing required field: {field}"
        
        # Validate field types
        assert isinstance(result['originalSize'], int), "originalSize should be int"
        assert isinstance(result['compressedSize'], int), "compressedSize should be int"
        assert isinstance(result['savingsPercent'], (int, float)), "savingsPercent should be number"
        assert isinstance(result['format'], str), "format should be string"
        
        print(f"All required fields present: originalSize={result['originalSize']}, compressedSize={result['compressedSize']}, savingsPercent={result['savingsPercent']}, format={result['format']}")
    
    def test_skip_optimize_flag(self):
        """Test 5: POST /api/upload with skip_optimize=true should NOT compress the image"""
        png_data = self.create_minimal_png(150, 150)
        original_size = len(png_data)
        
        files = {
            'file': ('skip_test.png', io.BytesIO(png_data), 'image/png')
        }
        data = {'skip_optimize': 'true', 'folder': 'test-uploads'}
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        result = response.json()
        assert result.get('success') == True, f"Upload should succeed: {result}"
        
        # When skip_optimize=true, format should be original format, not webp
        assert result['format'] != 'webp', f"Format should NOT be webp when skip_optimize=true, got {result['format']}"
        # Original size should equal compressed size (no compression)
        assert result['originalSize'] == result['compressedSize'], \
            f"Sizes should match when skipping: original={result['originalSize']}, compressed={result['compressedSize']}"
        
        print(f"skip_optimize=true works: format={result['format']}, no size change")
    
    def test_gif_passthrough(self):
        """Test 6: POST /api/upload with GIF should NOT convert to WebP (passthrough)"""
        # Create a minimal valid GIF
        gif_data = bytes([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61,  # GIF89a
            0x01, 0x00, 0x01, 0x00,              # 1x1 image
            0x80, 0x00, 0x00,                    # Global color table flag
            0xFF, 0xFF, 0xFF,                    # White
            0x00, 0x00, 0x00,                    # Black
            0x21, 0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00,  # Graphics control
            0x2C, 0x00, 0x00, 0x00, 0x00,        # Image descriptor
            0x01, 0x00, 0x01, 0x00, 0x00,
            0x02, 0x02, 0x44, 0x01, 0x00,        # Image data
            0x3B                                 # Trailer
        ])
        
        files = {
            'file': ('test.gif', io.BytesIO(gif_data), 'image/gif')
        }
        data = {'folder': 'test-uploads'}
        
        response = requests.post(f"{BASE_URL}/api/upload", files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get('success') == True, f"Upload should succeed: {result}"
        
        # GIF should pass through without WebP conversion
        assert result['format'] == 'gif', f"GIF format should be preserved, got {result['format']}"
        assert result['type'] == 'image/gif', f"GIF MIME type should be preserved, got {result['type']}"
        
        print(f"GIF passthrough works: format={result['format']}, type={result['type']}")


class TestDirectoryAPI:
    """Test 9: Directory API and page"""
    
    def test_directory_api_returns_listings(self):
        """GET /api/directory should return listings"""
        response = requests.get(f"{BASE_URL}/api/directory?limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Directory API returned {len(data)} listings")
    
    def test_directory_api_search(self):
        """GET /api/directory?search=... should filter results"""
        response = requests.get(f"{BASE_URL}/api/directory?search=restaurant&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Directory search returned {len(data)} results for 'restaurant'")
    
    def test_directory_api_filter_by_industry(self):
        """GET /api/directory?industry=... should filter by industry"""
        response = requests.get(f"{BASE_URL}/api/directory?industry=restaurant&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Verify all returned listings are of the filtered industry
        for listing in data:
            assert listing.get('industry') == 'restaurant', f"All listings should be restaurants, got {listing.get('industry')}"
        
        print(f"Directory filter by industry returned {len(data)} restaurant listings")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
