import asyncio
import os
import base64
import sys

sys.path.insert(0, '/app/webapp')
os.environ['EMERGENT_LLM_KEY'] = 'sk-emergent-c87DeA8638fD64f7d3'

from emergentintegrations.llm.chat import LlmChat, UserMessage

OUTPUT_DIR = '/app/webapp/public/images/categories'
os.makedirs(OUTPUT_DIR, exist_ok=True)

PROMPTS = {
    'family-entertainment': 'A vibrant, bright photorealistic wide-angle shot of a happy diverse family enjoying a colorful outdoor amusement park. Kids on bumper boats, parents laughing, cotton candy, neon lights reflecting on water. Golden hour lighting, lively atmosphere, lifestyle photography.',
    'destinations': 'A stunning photorealistic wide-angle shot of a luxury boutique hotel poolside at golden hour. Crystal clear turquoise pool, elegant lounge chairs with white towels, tropical palm trees, warm sunset sky. Vibrant, inviting, high-end travel photography.',
    'services': 'A bright photorealistic shot of a confident professional HVAC technician in a clean uniform, working on a modern residential air conditioning unit. Clean garage background, tool belt, safety glasses. Professional, trustworthy, vibrant natural lighting, lifestyle business photography.',
    'dining': 'A vibrant photorealistic overhead shot of a beautifully plated fine dining meal on a dark marble table. Colorful fresh ingredients, elegant glassware, warm ambient candlelight, fresh herbs as garnish. Food photography, bright colors, appetizing presentation.',
    'nightlife': 'A vibrant photorealistic interior shot of an upscale cocktail bar at night. Warm ambient lighting, colorful craft cocktails on the bar, stylish modern decor, neon accent lighting. Energetic yet sophisticated atmosphere, nightlife photography.',
    'style-shopping': 'A bright photorealistic shot of the interior of a modern luxury fashion boutique. Elegant clothing displays, warm lighting, mirrors, a stylish mannequin, curated accessories. Clean minimalist design with vibrant accent colors, retail photography.',
    'health-wellness': 'A bright photorealistic shot of a modern wellness spa interior. Warm wood elements, a serene pool or hot tub, green plants, soft ambient lighting, rolled white towels. Calm, inviting, health and wellness lifestyle photography.',
}

async def generate_image(category_id, prompt):
    print(f'\n--- Generating: {category_id} ---')
    try:
        api_key = os.environ['EMERGENT_LLM_KEY']
        chat = LlmChat(
            api_key=api_key,
            session_id=f'cat-img-{category_id}',
            system_message='You are a professional photography AI that creates stunning, photorealistic lifestyle images.'
        )
        chat.with_model('gemini', 'gemini-3-pro-image-preview').with_params(modalities=['image', 'text'])
        msg = UserMessage(text=prompt)
        text, images = await chat.send_message_multimodal_response(msg)
        if images and len(images) > 0:
            img = images[0]
            image_bytes = base64.b64decode(img['data'])
            filepath = os.path.join(OUTPUT_DIR, f'{category_id}.png')
            with open(filepath, 'wb') as f:
                f.write(image_bytes)
            print(f'OK: {category_id}.png ({len(image_bytes)} bytes)')
            return True
        else:
            print(f'WARN: No images returned for {category_id}. Text: {text[:100] if text else "None"}')
            return False
    except Exception as e:
        print(f'ERROR generating {category_id}: {e}')
        return False

async def main():
    results = {}
    for cat_id, prompt in PROMPTS.items():
        ok = await generate_image(cat_id, prompt)
        results[cat_id] = ok
    print('\n=== RESULTS ===')
    for k, v in results.items():
        print(f'  {k}: {"OK" if v else "FAILED"}')

asyncio.run(main())
