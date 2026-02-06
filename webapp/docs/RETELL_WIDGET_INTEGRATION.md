# Retell Website Widget Integration
## Embedding AI on Client Websites

---

## Overview

Greenline365 clients can embed widgets on their websites to capture leads and provide instant AI assistance. Two modes available:

| Mode | Icon | Action | Best For |
|------|------|--------|----------|
| **Callback** | 📞 Phone | Collects info → AI calls visitor | Urgent issues, complex inquiries |
| **Chat** | 🤖 Robot | Text-based conversation | Quick questions, browsing |

---

## Callback Widget Setup

### Basic Implementation

Add to client's website `<head>`:

```html
<script
  id="retell-widget"
  src="https://dashboard.retellai.com/retell-widget.js"
  type="module"
  data-public-key="YOUR_RETELL_PUBLIC_KEY"
  data-agent-id="YOUR_VOICE_AGENT_ID"
  data-widget="callback"
  data-phone-number="+1XXXXXXXXXX"
  data-title="Request a Callback"
  data-countries="US"
  data-tc="https://clientsite.com/terms"
  data-color="#00AA00"
></script>
```

### Required Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-public-key` | Retell public key | `key_abc123...` |
| `data-agent-id` | Voice agent ID | `agent_xyz789...` |
| `data-widget` | Must be "callback" | `callback` |
| `data-phone-number` | Retell phone number | `+18135551234` |

### Optional Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-title` | Widget title | `"Get a Free Quote"` |
| `data-color` | Brand color (hex) | `#FF5722` |
| `data-countries` | Allowed countries | `US,CA` |
| `data-tc` | Terms & conditions URL | `https://site.com/terms` |
| `data-recaptcha-key` | reCAPTCHA v3 key | `6Lc...` |

---

## Dynamic Variables (The Power Feature)

Pass context from the website to the AI:

```html
<script
  data-dynamic='{
    "source": "website",
    "page": "emergency-services",
    "property_address": "722 S 57th St",
    "service_interest": "panel-upgrade"
  }'
></script>
```

### How It Works

1. Visitor on "Emergency Services" page clicks callback widget
2. Dynamic vars passed to Retell
3. Pre-Greeting webhook receives these vars
4. AI opens with context-aware greeting:

> "Hi Sarah! I see you were looking at our emergency services. Are you dealing with an urgent electrical issue right now?"

### Recommended Dynamic Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `source` | Traffic source | `"website"`, `"google_ads"`, `"facebook"` |
| `page` | Current page | `"homepage"`, `"emergency"`, `"pricing"` |
| `utm_campaign` | Marketing campaign | `"storm-2026"`, `"spring-tuneup"` |
| `property_address` | Pre-filled address | `"722 S 57th St, Tampa"` |
| `service_interest` | What they're looking at | `"panel-upgrade"`, `"outlet-repair"` |

---

## Chat Widget Setup

For text-based conversations:

```html
<script
  id="retell-widget"
  src="https://dashboard.retellai.com/retell-widget.js"
  type="module"
  data-public-key="YOUR_RETELL_PUBLIC_KEY"
  data-agent-id="YOUR_CHAT_AGENT_ID"
  data-title="Chat with Tampa Electric"
  data-logo-url="https://tampaelectric.com/logo.png"
  data-color="#00AA00"
  data-bot-name="Sparky"
  data-popup-message="Need electrical help? I'm here 24/7!"
  data-show-ai-popup="true"
  data-show-ai-popup-time="5"
></script>
```

### Chat-Specific Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `data-agent-id` | **Chat** agent ID | `agent_chat_xyz...` |
| `data-logo-url` | Company logo | `https://site.com/logo.png` |
| `data-bot-name` | AI's display name | `"Sparky"` |
| `data-popup-message` | Proactive message | `"Need help?"` |
| `data-show-ai-popup` | Enable popup | `"true"` |
| `data-show-ai-popup-time` | Delay in seconds | `5` |
| `data-auto-open` | Auto-open chat | `"true"` |

---

## reCAPTCHA Protection

Prevent spam/bots:

1. Add reCAPTCHA v3 script:
```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

2. Add key to widget:
```html
<script
  data-recaptcha-key="YOUR_GOOGLE_RECAPTCHA_SITE_KEY"
></script>
```

3. Enable in Retell Public Keys settings

---

## Integration with Property Intelligence

### Flow: Website → Callback → Property Lookup

```
Visitor on website
    ↓
Clicks "Request Callback"
    ↓
Fills form (name, phone)
    ↓
Retell creates outbound call
    ↓
Pre-Greeting webhook fires
    ↓
Property Intelligence loads:
  - Phone lookup → Contact found?
  - If not, check dynamic vars for address
  - Load weather, CRS, assets
    ↓
AI calls with full context
```

### Passing Address from Website Forms

If visitor entered address on website before clicking callback:

```javascript
// Capture address from your form
const address = document.getElementById('address-field').value;

// Update widget dynamic vars
const widget = document.getElementById('retell-widget');
widget.setAttribute('data-dynamic', JSON.stringify({
  source: 'website',
  property_address: address
}));
```

Now when Pre-Greeting fires, it can:
1. Try phone lookup first
2. If no match, use `property_address` from dynamic vars
3. Look up property by address
4. AI has full context even for new callers

---

## Industry-Specific Implementations

### Electrical (Tampa Electric)

```html
<script
  data-title="Get Electrical Help Now"
  data-color="#FFD700"
  data-dynamic='{
    "industry": "electrical",
    "emergency_keywords": ["sparks", "no power", "burning smell"]
  }'
></script>
```

### HVAC

```html
<script
  data-title="AC Not Working? We Can Help!"
  data-color="#00BFFF"
  data-dynamic='{
    "industry": "hvac",
    "emergency_keywords": ["no air", "no heat", "gas smell"]
  }'
></script>
```

### Plumbing

```html
<script
  data-title="Plumbing Emergency? Call Now"
  data-color="#4169E1"
  data-dynamic='{
    "industry": "plumbing",
    "emergency_keywords": ["flooding", "burst pipe", "no water"]
  }'
></script>
```

---

## Deployment Checklist

### For Each Client:

- [ ] Get Retell public key
- [ ] Get voice agent ID (for callback) or chat agent ID
- [ ] Get Retell phone number
- [ ] Choose brand color (hex)
- [ ] Create terms & conditions page
- [ ] Set up reCAPTCHA (optional but recommended)
- [ ] Define dynamic variables for their site
- [ ] Test on staging before production

### Widget Code Generator (Future Feature)

The Commander Dashboard could include a "Widget Generator":
1. Client enters their branding
2. System generates copy-paste code
3. Client adds to their website
4. Done!

---

## Metrics to Track

| Metric | Description |
|--------|-------------|
| Widget Impressions | How many saw the widget |
| Widget Clicks | How many clicked it |
| Form Completions | How many submitted (callback) |
| Calls Connected | Successful outbound calls |
| Conversion Rate | Clicks → Bookings |
| Source Attribution | Which pages drive most leads |

---

## Example: Full Implementation

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tampa Electric - 24/7 Service</title>
  
  <!-- reCAPTCHA -->
  <script src="https://www.google.com/recaptcha/api.js?render=6Lc_your_key"></script>
  
  <!-- Retell Callback Widget -->
  <script
    id="retell-widget"
    src="https://dashboard.retellai.com/retell-widget.js"
    type="module"
    data-public-key="key_abc123"
    data-agent-id="agent_tampa_electric"
    data-widget="callback"
    data-phone-number="+18135551234"
    data-title="Get a Free Electrical Quote"
    data-countries="US"
    data-tc="https://tampaelectric.com/terms"
    data-color="#FFD700"
    data-recaptcha-key="6Lc_your_key"
    data-dynamic='{
      "source": "website",
      "industry": "electrical",
      "page": "homepage"
    }'
  ></script>
</head>
<body>
  <!-- Your website content -->
</body>
</html>
```

---

## Summary

The Retell widget is a **force multiplier** for Greenline365 clients:

1. **Capture website visitors** who might otherwise leave
2. **Instant engagement** - AI calls them in seconds
3. **Full Property Intelligence** - even web leads get the "Superhuman" experience
4. **Zero friction** - one script tag, done

This turns every client's website into a 24/7 lead capture machine that feeds directly into the Property Intelligence Engine.
