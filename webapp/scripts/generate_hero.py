import asyncio
import os
import base64
import sys

sys.path.insert(0, '/app/webapp')
os.environ['EMERGENT_LLM_KEY'] = 'sk-emergent-c87DeA8638fD64f7d3'

from emergentintegrations.llm.chat import LlmChat, UserMessage

OUTPUT_DIR = '/app/webapp/public/images'

PROMPTS = {
    'hero-directory': 'A stunning ultra-wide cinematic photorealistic aerial shot of a vibrant American city at golden hour. Clean modern downtown skyline with warm sunset light, busy streets with local businesses visible — a barbershop with a glowing sign, a restaurant patio with diners, a home services van parked outside a house. The scene shows a thriving local business ecosystem. Rich warm tones, dramatic lighting, professional commercial photography. Wide panoramic composition, shallow depth of field on the skyline. No text or watermarks.',
    'hero-directory-alt': 'A breathtaking photorealistic wide shot of a diverse, vibrant Main Street in a small American city at dusk. Warm string lights overhead, glowing storefronts — a cozy cafe, a modern barbershop, a fitness studio with large windows. People walking on sidewalks, a family entering a restaurant. The street leads to a dramatic sunset sky with orange and purple clouds. Cinematic commercial photography, ultra high quality, warm inviting atmosphere. No text or logos.',
}

async def generate_image(name, prompt):
    print(f'--- Generating: {name} ---')
    try:
        api_key = os.environ['EMERGENT_LLM_KEY']
        chat = LlmChat(api_key=api_key, session_id=f'hero-{name}', system_message='You are a world-class commercial photographer creating stunning cinematic images.')
        chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params(modalities=['image', 'text'])
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            image_bytes = base64.b64decode(images[0]['data'])
            filepath = os.path.join(OUTPUT_DIR, f'{name}.png')
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            print(f'OK: {name}.png ({len(image_bytes)} bytes)')
            return True
        print(f'WARN: No images for {name}')
        return False
    except Exception as e:
        print(f'ERROR: {name}: {e}')
        return False

async def main():
    for name, prompt in PROMPTS.items():
        ok = await generate_image(name, prompt)
        if ok:
            break  # Use the first successful one

asyncio.run(main())
