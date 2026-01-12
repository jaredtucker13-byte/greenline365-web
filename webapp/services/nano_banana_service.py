"""
Nano Banana Image Generation Service
Simple FastAPI service for generating images with Gemini
"""

import asyncio
import os
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Nano Banana Image Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    prompt: str
    api_key: Optional[str] = None

class GenerateResponse(BaseModel):
    success: bool
    image: Optional[str] = None
    mime_type: str = "image/png"
    error: Optional[str] = None

@app.post("/generate", response_model=GenerateResponse)
async def generate_image(request: GenerateRequest):
    """Generate an image using Nano Banana (Gemini)"""
    
    api_key = request.api_key or os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key not configured")
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        import uuid
        
        # Create chat instance
        session_id = f"nano-{uuid.uuid4().hex[:8]}"
        chat = LlmChat(
            api_key=api_key,
            session_id=session_id,
            system_message="Generate high-quality, professional images for blog posts and marketing materials."
        )
        
        # Configure for image generation
        chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
        
        # Generate
        msg = UserMessage(text=request.prompt)
        text_response, images = await chat.send_message_multimodal_response(msg)
        
        if images and len(images) > 0:
            return GenerateResponse(
                success=True,
                image=images[0]['data'],
                mime_type=images[0].get('mime_type', 'image/png')
            )
        
        return GenerateResponse(
            success=False,
            error="No image generated"
        )
        
    except ImportError as e:
        print(f"Import error: {e}")
        return GenerateResponse(
            success=False,
            error="emergentintegrations library not available"
        )
    except Exception as e:
        print(f"Generation error: {e}")
        return GenerateResponse(
            success=False,
            error=str(e)
        )

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
