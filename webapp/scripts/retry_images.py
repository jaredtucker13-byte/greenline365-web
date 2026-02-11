import asyncio
import os
import base64
import sys

sys.path.insert(0, '/app/webapp')
os.environ['EMERGENT_LLM_KEY'] = 'sk-emergent-c87DeA8638fD64f7d3'

from emergentintegrations.llm.chat import LlmChat, UserMessage

OUTPUT_DIR = '/app/webapp/public/images/categories'

PROMPTS = {
    'dining': 'A vibrant photorealistic overhead shot of a beautifully plated fine dining meal on a dark marble table. Colorful fresh ingredients, elegant glassware, warm ambient candlelight, fresh herbs as garnish. Food photography, bright colors, appetizing presentation.',
    'nightlife': 'A vibrant photorealistic interior shot of an upscale cocktail bar at night. Warm ambient lighting, colorful craft cocktails on the bar, stylish modern decor, neon accent lighting. Energetic yet sophisticated atmosphere, nightlife photography.',
}

async def generate_image(category_id, prompt):
    print(f'--- Generating: {category_id} ---')
    try:
        api_key = os.environ['EMERGENT_LLM_KEY']
        chat = LlmChat(api_key=api_key, session_id=f'retry-{category_id}', system_message='You are a professional photography AI.')
        chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params(modalities=['image', 'text'])
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            image_bytes = base64.b64decode(images[0]['data'])
            with open(os.path.join(OUTPUT_DIR, f'{category_id}.png'), 'wb') as f:
                f.write(image_bytes)
            print(f'OK: {category_id}.png ({len(image_bytes)} bytes)')
            return True
        print(f'WARN: No images for {category_id}')
        return False
    except Exception as e:
        print(f'ERROR: {category_id}: {e}')
        return False

async def main():
    for cat_id, prompt in PROMPTS.items():
        await generate_image(cat_id, prompt)

asyncio.run(main())
