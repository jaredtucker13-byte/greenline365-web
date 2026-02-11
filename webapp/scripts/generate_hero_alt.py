import asyncio
import os
import base64
import sys

sys.path.insert(0, '/app/webapp')
os.environ['EMERGENT_LLM_KEY'] = 'sk-emergent-c87DeA8638fD64f7d3'

from emergentintegrations.llm.chat import LlmChat, UserMessage

async def main():
    prompt = 'A breathtaking photorealistic wide shot of a diverse, vibrant Main Street in a small American city at dusk. Warm string lights overhead, glowing storefronts — a cozy cafe, a modern barbershop, a fitness studio with large windows. People walking on sidewalks, a family entering a restaurant. The street leads to a dramatic sunset sky with orange and purple clouds. Cinematic commercial photography, ultra high quality, warm inviting atmosphere. No text or logos.'
    api_key = os.environ['EMERGENT_LLM_KEY']
    chat = LlmChat(api_key=api_key, session_id='hero-alt2', system_message='You are a world-class commercial photographer.')
    chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params(modalities=['image', 'text'])
    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)
    if images and len(images) > 0:
        image_bytes = base64.b64decode(images[0]['data'])
        with open('/app/webapp/public/images/hero-directory-alt.png', 'wb') as f:
            f.write(image_bytes)
        print(f'OK: hero-directory-alt.png ({len(image_bytes)} bytes)')
    else:
        print('No image returned')

asyncio.run(main())
