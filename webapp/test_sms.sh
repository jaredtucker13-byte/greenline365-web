#!/bin/bash
# Test SMS Sending Endpoint
# This will send a test SMS to verify everything works

# Get the backend URL from environment
BACKEND_URL=$(grep REACT_APP_BACKEND_URL /app/webapp/frontend/.env.local | cut -d '=' -f2)

echo "🔍 Testing SMS endpoint..."
echo "Backend URL: $BACKEND_URL"
echo ""

# Test SMS send
echo "📱 Sending test SMS..."
curl -X POST "$BACKEND_URL/api/twilio/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1YOUR_PHONE_NUMBER",
    "message": "🎉 GreenLine365 SMS Test - Your Real-Feel AI system is working! Reply YES to confirm receipt.",
    "type": "general"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Check your phone for the SMS!"
echo "📱 You should receive it from: (813) 540-9691"
