"""
Blog Image Generation Service
Uses Nano Banana (Gemini) for AI image generation
"""

import asyncio
import os
import base64
import uuid
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/webapp/.env.local')

app = FastAPI(title="GreenLine365 Image Service")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://greenline365.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str
    count: int = 3
    style: str = "professional"

class GeneratedImage(BaseModel):
    id: str
    data: str  # base64 encoded
    mime_type: str
    prompt: str

class GenerateResponse(BaseModel):
    success: bool
    images: List[GeneratedImage]
    message: Optional[str] = None

async def generate_with_nano_banana(prompt: str) -> Optional[dict]:
    """Generate a single image using Nano Banana"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        api_key = os.getenv("EMERGENT_LLM_KEY")
        if not api_key:
            print("ERROR: EMERGENT_LLM_KEY not found")
            return None
        
        # Create new chat instance for each generation
        session_id = f"blog-img-{uuid.uuid4().hex[:8]}"
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="You are an expert image generator. Create high-quality, professional images for blog posts."
        )
        
        # Configure for Nano Banana
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        # Generate image
        msg = UserMessage(text=prompt)
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            img = images[0]
            return {
                "id": uuid.uuid4().hex,
                "data": img['data'][:50] + "..." if len(img['data']) > 50 else img['data'],  # Truncate for logging
                "full_data": img['data'],
                "mime_type": img.get('mime_type', 'image/png'),
                "text_response": text_response
            }
        
        return None
        
    except Exception as e:
        print(f"ERROR generating image: {str(e)}")
        return None

@app.post("/api/generate-image", response_model=GenerateResponse)
async def generate_images(request: GenerateRequest):
    """Generate multiple images from a prompt"""
    
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    count = min(max(request.count, 1), 5)  # Limit to 1-5 images
    
    # Generate images concurrently
    tasks = []
    for i in range(count):
        # Vary the prompt slightly for different results
        variations = [
            request.prompt,
            f"{request.prompt} Alternative composition.",
            f"{request.prompt} Different angle or perspective.",
            f"{request.prompt} More detailed version.",
            f"{request.prompt} Simplified, cleaner version.",
        ]
        prompt_variation = variations[i % len(variations)]
        tasks.append(generate_with_nano_banana(prompt_variation))
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    images = []
    for result in results:
        if isinstance(result, dict) and result.get('full_data'):
            images.append(GeneratedImage(
                id=result['id'],
                data=result['full_data'],
                mime_type=result['mime_type'],
                prompt=request.prompt
            ))
    
    if not images:
        return GenerateResponse(
            success=False,
            images=[],
            message="Failed to generate images. Please try again."
        )
    
    return GenerateResponse(
        success=True,
        images=images,
        message=f"Generated {len(images)} images successfully"
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "image-generation"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
