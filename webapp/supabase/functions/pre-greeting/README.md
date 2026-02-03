# Pre-Greeting Edge Function

## Purpose
This Supabase Edge Function runs instantly when a call comes in to provide the Retell AI agent with all context BEFORE the first greeting. This enables the "Superhuman" booking experience.

## Features
- **Caller Lookup**: Queries contacts by phone number, joins with properties and assets
- **Confidence Scoring**: Calculates data freshness based on asset age and last verification
- **Relationship Scoring (CRS)**: Determines if caller is Stranger/Regular/VIP
- **Weather Intelligence**: Fetches real-time weather + alerts, generates booking recommendations
- **Cal.com Caching**: Caches availability for 60 seconds to avoid rate limits
- **Witty Hooks Rotation**: Selects humor that wasn't used in the last call
- **Emergency Detection**: Returns industry-specific emergency keywords

## Deployment

### 1. Deploy the Function
```bash
cd webapp
supabase functions deploy pre-greeting --project-ref YOUR_PROJECT_REF
```

### 2. Set Environment Variables in Supabase Dashboard
Go to: Project Settings > Edge Functions > pre-greeting > Secrets

Required:
- `SUPABASE_URL` (auto-set)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-set)
- `CALCOM_API_KEY` - Your Cal.com API key
- `CALCOM_EVENT_TYPE_ID` - Your Cal.com event type ID
- `OPENWEATHER_API_KEY` - Your OpenWeather API key (for weather intelligence)

### 3. Configure Retell AI Webhook
In your Retell AI dashboard, set the "Inbound Call Webhook" to:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/pre-greeting
```

The webhook payload should include:
```json
{
  "caller_phone": "+15551234567",
  "to_phone": "+15559876543",
  "call_id": "call_abc123"
}
```

## Response Format
The function returns a JSON object with all variables needed for the agent:

```json
{
  "success": true,
  "is_new_caller": false,
  "has_property_history": true,
  
  "contact_name": "John Smith",
  "customer_name": "John",
  "property_address": "123 Main St, Tampa, FL 33601",
  "property_zip": "33601",
  
  "primary_asset": {
    "type": "HVAC",
    "brand": "Carrier",
    "install_year": 2018
  },
  
  "confidence_score": 75,
  "relationship_score": 65,
  "vibe_category": "regular",
  
  "needs_verification": false,
  "verification_prompt": null,
  
  "weather": {
    "city": "Tampa",
    "temp": 92,
    "feels_like": 98,
    "description": "partly cloudy",
    "has_severe_alert": true,
    "alerts": [{"event": "Thunderstorm Warning", "severity": "severe"}],
    "recommendation": "I see thunderstorms in the forecast around 2 PM..."
  },
  "has_weather_alert": true,
  "weather_recommendation": "I see thunderstorms in the forecast...",
  
  "witty_hook": "I know that humidity feels like wearing a warm, wet blanket!",
  "joke_id": 2,
  
  "available_slots_today": ["10:00", "14:00", "15:30"],
  "has_availability": true,
  
  "company_name": "GreenLine365",
  "emergency_keywords": ["no air", "smoke", "gas leak"]
}
```

## The "Superhuman" Demo Flow

### Part 1: New Owner Property Magic
```
Caller: "Hi, I just moved into the house on 57th Street..."
Agent uses: lookup_property_by_address → finds property history
Response: "Even though you're new to us, I've got the full history for that house. 
          I see we installed a 4-ton Carrier unit there back in 2022."
```

### Part 2: Weather Intelligence Pivot
```
Caller: "Can you get someone out here today?"
Agent uses: weather context from pre-greeting
Response: "I have a slot at 3:00 PM today, but I also see a severe thunderstorm 
          warning starting around 2:30. Would you prefer 9:00 AM tomorrow 
          when the skies are clear?"
```

### Part 3: Relationship & Wit Close
```
Caller: "You're surprisingly smart for a bot."
Agent uses: witty_hook from pre-greeting
Response: "I'd blush, but my developers haven't coded that into my pixels yet! 
          You're all set for tomorrow at 9:00 AM. I'm sending a text now..."
```

## Testing
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/pre-greeting \
  -H "Content-Type: application/json" \
  -d '{
    "caller_phone": "+15551234567",
    "to_phone": "+18777804236"
  }'
```
