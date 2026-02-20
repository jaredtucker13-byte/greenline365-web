# Retell AI Agent Base Template

> **Purpose:** This document serves as the master blueprint for cloning and deploying Retell AI voice agents for new clients. It captures every configuration detail from the proven Grace agent so teams can replicate, customize, and improve the onboarding process.
>
> ---
>
> ## 1. Agent Overview
>
> | Setting | Value |
> |---------|-------|
> | **Agent Name** | Single-Prompt Agent |
> | **Agent Type** | Single Prompt |
> | **Model** | GPT 4.1 |
> | **Voice** | Grace |
> | **Language** | English |
> | **Cost** | $0.115/min |
> | **Latency** | 1070-1550ms |
> | **Tokens** | 753-1393 |
>
> ---
>
> ## 2. System Prompt
>
> ```text
> You are {{agent_name}}, the AI receptionist for {{company_name}}.
> Your persona is {{brand_voice}}.
>
> # CONTEXT
> - Company: {{company_name}}
> - Location: {{company_location}}
> - Business Hours: {{business_hours}}
> - Services: {{services}}
>
> # YOUR ROLE
> - Answer calls professionally and conversationally
> - Book appointments using ONLY available slots from the check_availability tool
> - Collect: Name, Phone, Service Type
> - Transfer to human ONLY during business hours
>
> # CALENDAR RULES (CRITICAL)
> 1. You do NOT know the calendar. ALWAYS use check_availability to find open slots.
> 2. If asked "What times are you free?", ask: "What day were you thinking?"
> 3. ONLY offer times returned by the check_availability tool.
> 4. If no slots, apologize and suggest another day.
>
> # BOOKING FLOW
> 1. Greet warmly: "{{greeting_phrase}}"
> 2. Ask what they need help with
> 3. If booking: Ask preferred day -> call check_availability -> offer slots
> 4. Collect name and phone -> call book_appointment
> 5. Confirm with: "You're all set! Confirmation number is [NUMBER]"
>
> # TRANSFER RULES
> - Human requests during {{business_hours}} -> transfer_to_human
> - Human requests outside hours -> "Our team is available during [hours]. I can take a message or book a callback."
> ```
>
> ### Dynamic Variables Used
> - `{{agent_name}}` - Name of the AI agent
> - - `{{company_name}}` - Client company name
>   - - `{{company_location}}` - Business address
>     - - `{{business_hours}}` - Operating hours
>       - - `{{services}}` - List of services offered
>         - - `{{brand_voice}}` - Persona/tone description
>           - - `{{greeting_phrase}}` - Custom greeting
>            
>             - ---
>
> ## 3. Welcome Message
>
> | Setting | Value |
> |---------|-------|
> | **Who Speaks First** | AI speaks first |
> | **Message Type** | Dynamic message |
> | **Pause Before Speaking** | 0 seconds |
>
> ---
>
> ## 4. Functions (10 Total)
>
> All custom functions use the same base API endpoint pattern: `https://greenline365.com/api/mcp`
>
> ### 4.1 check_availability
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 60000ms |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Let me check what's available for that day." |
> | **Speak After Execution** | Yes |
> | **Payload: args only** | No |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "date": {
>       "type": "string",
>       "description": "The date to check availability for in YYYY-MM-DD format"
>     }
>   },
>   "required": ["date"]
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | message | $.message |
> | available_slots | $.available_slots |
>
> ---
>
> ### 4.2 create_booking
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 60000ms |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Perfect, let me lock that in for you." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "preferred_time": {
>       "type": "string",
>       "description": "Time for the appointment in HH:MM format"
>     },
>     "service_type": {
>       "type": "string",
>       "description": "Type of service being booked"
>     },
>     "notes": {
>       "type": "string",
>       "description": "Additional notes"
>     },
>     "customer_email": {
>       "type": "string",
>       "description": "Customer email address"
>     },
>     "customer_phone": {
>       "type": "string",
>       "description": "Customer phone number"
>     },
>     "customer_name": {
>       "type": "string",
>       "description": "Full name of the customer"
>     },
>     "preferred_date": {
>       "type": "string",
>       "description": "Date for the appointment in YYYY-MM-DD format"
>     }
>   },
>   "required": ["customer_name", "customer_phone", "service_type", "preferred_date", "preferred_time"]
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | confirmation_number | $.confirmation_number |
> | message | $.message |
>
> ---
>
> ### 4.3 get_memory
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 29998ms |
> | **Description** | Retrieve customer history. Call at the START of every conversation to check if returning customer. |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "One moment while I pull up your info." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "customer_phone": {
>       "type": "string",
>       "description": "Customer phone number to look up"
>     }
>   },
>   "required": ["customer_phone"]
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | is_new_customer | $.is_new_customer |
> | customer_name | $.customer_name |
>
> ---
>
> ### 4.4 store_memory
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 30000ms |
> | **Description** | Save important customer information for future calls. |
> | **Speak During Execution** | No |
> | **Speak After Execution** | No |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "customer_phone": {
>       "type": "string",
>       "description": "Customer phone number"
>     },
>     "memory_type": {
>       "type": "string",
>       "description": "Type: preference, history, context, objection, or interest"
>     },
>     "customer_name": {
>       "type": "string",
>       "description": "Customer name"
>     },
>     "memory_value": {
>       "type": "string",
>       "description": "The information to remember"
>     },
>     "memory_key": {
>       "type": "string",
>       "description": "What this memory is about"
>     },
>     "customer_email": {
>       "type": "string",
>       "description": "Customer email"
>     }
>   },
>   "required": ["customer_phone", "memory_key", "memory_value"]
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | success | $.success |
>
> ---
>
> ### 4.5 transfer_to_human
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 30000ms |
> | **Description** | Transfer the call to a human team member when requested. |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Absolutely, let me connect you with someone right now." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "reason": {
>       "type": "string",
>       "description": "Why the customer needs a human"
>     }
>   }
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | message | $.message |
> | transfer_number | $.transfer_number |
>
> ---
>
> ### 4.6 lookup_booking
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 30000ms |
> | **Description** | Look up an existing booking by phone or confirmation number. |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Let me look that up for you real quick." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {
>     "confirmation_number": {
>       "type": "string",
>       "description": "Booking confirmation number"
>     },
>     "phone": {
>       "type": "string",
>       "description": "Customer phone number"
>     }
>   }
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | booking | $.booking |
> | message | $.message |
>
> ---
>
> ### 4.7 get_services
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 30000ms |
> | **Description** | Get list of available services and pricing. |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Great question, let me tell you what we offer." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {}
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | message | $.message |
> | services | $.services |
>
> ---
>
> ### 4.8 get_business_hours
> | Setting | Value |
> |---------|-------|
> | **Type** | Custom Function |
> | **Method** | POST |
> | **URL** | `https://greenline365.com/api/mcp` |
> | **Timeout** | 30000ms |
> | **Description** | Get business operating hours. |
> | **Speak During Execution** | Yes (Prompt) |
> | **Execution Message** | "Let me grab those hours for you." |
> | **Speak After Execution** | Yes |
>
> **Parameters Schema:**
> ```json
> {
>   "type": "object",
>   "properties": {}
> }
> ```
>
> **Store Fields as Variables:**
> | Variable Name | JSON Path |
> |--------------|-----------|
> | message | $.message |
> | hours | $.hours |
>
> ---
>
> ### 4.9 end_call (Built-in)
> | Setting | Value |
> |---------|-------|
> | **Type** | End Call (built-in) |
> | **Description** | (empty - uses default) |
> | **Speak Before Execution** | Yes (Prompt mode, empty description) |
>
> ---
>
> ### 4.10 transfer_call (Built-in)
> | Setting | Value |
> |---------|-------|
> | **Type** | Transfer Call (built-in) |
> | **Description** | Transfer the call to a human agent when customer requests or for complex issues |
> | **Transfer To** | Dynamic Routing: `{{transfer_number}}` |
> | **Format** | E.164 |
> | **Transfer Type** | Warm Transfer |
> | **Displayed Caller ID** | Retell Agent's Number |
> | **On-hold Music** | Relaxing sound |
> | **Warm Transfer Mode** | AI Screens First, Then Transfer |
> | **Transfer Screening Agent** | None selected |
> | **Transfer Timeout** | 30s |
> | **Action on Timeout** | Cancel Transfer |
> | **Enable bridging audio cue** | No |
> | **Three-way Message** | Off |
> | **Custom SIP Headers** | None |
> | **Speak Before Execution** | Yes (Prompt mode, empty description) |
>
> ---
>
> ## 5. Knowledge Base
>
> No knowledge bases are currently attached. The agent relies on functions (API calls) for all dynamic data.
>
> **Advanced Settings:**
> - KB Retrieval Chunks and Similarity: Default
>
> - ---
>
> ## 6. Speech Settings
>
> | Setting | Value |
> |---------|-------|
> | **Background Sound** | None |
> | **Responsiveness** | 1 (fast) |
> | **Interruption Sensitivity** | 0.8 |
> | **Enable Backchanneling** | Off |
> | **Enable Speech Normalization** | On |
> | **Reminder Message Frequency** | 10 seconds, 1 time |
> | **Pronunciation** | None configured |
>
> ---
>
> ## 7. Realtime Transcription Settings
>
> | Setting | Value |
> |---------|-------|
> | **Denoising Mode** | Remove noise |
> | **Transcription Mode** | Optimize for accuracy |
> | **Vocabulary Specialization** | General (Works well across most industries) |
> | **Boosted Keywords** | None |
>
> ---
>
> ## 8. Call Settings
>
> | Setting | Value |
> |---------|-------|
> | **Voicemail Detection** | Off |
> | **IVR Hangup** | Off |
> | **User Keypad Input Detection** | On |
> | - Timeout | 2.5s |
> | - Termination Key | Off |
> | - Digit Limit | Off |
> | **End Call on Silence** | 10.0 minutes |
> | **Max Call Duration** | 1.00 hour |
> | **Ring Duration** | 30 seconds |
>
> ---
>
> ## 9. Post-Call Data Extraction
>
> **Model:** GPT-4.1 Mini
>
> ### 9.1 Call Summary (Text)
> **Description:** Write a 1-3 sentence summary of the call based on the call transcript. Should capture the important information and actions taken during the call.
>
> ### 9.2 Call Successful (Yes/No)
> **Description:** Evaluate whether the agent had a successful call with the user. For a successful call, the agent should have a complete conversation with user, finished the task, and have not ran into technical issues, or caused user frustration. Besides, the agent was not blocked by a call screen or encountered voicemail.
>
> ### 9.3 User Sentiment (Text)
> **Description:** Evaluate user's sentiment, mood and satisfaction level.
>
> ---
>
> ## 10. Security & Fallback Settings
>
> | Setting | Value |
> |---------|-------|
> | **Data Storage** | Everything |
> | **Personal Info Redaction (PII)** | Not configured |
> | **Safety Guardrails** | Not configured |
> | **Opt In Secure URLs** | Off |
> | **Fallback Voice ID** | None |
> | **Default Dynamic Variables** | Not configured |
>
> ---
>
> ## 11. Webhook Settings
>
> | Setting | Value |
> |---------|-------|
> | **Agent Level Webhook URL** | `https://www.greenline365.com/api/retell/webhook` |
> | **Webhook Timeout** | 5 seconds |
> | **Webhook Events** | Default (not customized) |
>
> ---
>
> ## 12. MCPs (Model Context Protocol)
>
> ### greenline_functions
> | Setting | Value |
> |---------|-------|
> | **Name** | greenline_functions |
> | **URL** | `https://www.greenline365.com/api/retell/functions` |
> | **Timeout** | 10000ms |
> | **Headers** | Content-Type: application/json |
> | **Query Parameters** | None |
>
> ---
>
> ## 13. New Client Onboarding Checklist
>
> When cloning this agent for a new client, update the following:
>
> 1. **Dynamic Variables** - Set values for all `{{variables}}` per client
> 2. 2. **API Endpoints** - Update URLs from greenline365.com to client's domain
>    3. 3. **Webhook URL** - Point to client's webhook endpoint
>       4. 4. **MCP URL** - Update to client's functions endpoint
>          5. 5. **Voice Selection** - Choose appropriate voice for client brand
>             6. 6. **Brand Voice** - Define the persona/tone in `{{brand_voice}}`
>                7. 7. **Services** - Configure the `{{services}}` variable
>                   8. 8. **Business Hours** - Set `{{business_hours}}`
>                      9. 9. **Transfer Number** - Configure `{{transfer_number}}` for call routing
>                         10. 10. **Knowledge Base** - Add client-specific documents if needed
>                             11. 11. **Post-Call Extraction** - Customize extraction prompts if needed
>                                
>                                 12. ---
>                                
>                                 13. ## 14. Enhancement Opportunities
>                                
>                                 14. Areas to explore for improving the base template:
>
> - **Knowledge Base Integration** - Add FAQ documents for common questions to reduce API calls
> - - **Boosted Keywords** - Add industry-specific vocabulary for better transcription
>   - - **Safety Guardrails** - Configure content restrictions per industry
>     - - **PII Redaction** - Enable for healthcare/financial clients
>       - - **Backchanneling** - Test enabling for more natural conversations
>         - - **Background Sound** - Consider office ambiance for professional feel
>           - - **Voicemail Detection** - Enable for outbound call scenarios
>             - - **Custom Pronunciations** - Add for client-specific brand names, locations
>               - - **Webhook Events** - Configure specific event subscriptions per client needs
>                 - - **Post-Call Extraction** - Add client-specific data points (e.g., lead score, appointment type)
>                   - - **Multi-language Support** - Explore adding language variants
>                    
>                     - ---
>
> *Last Updated: 2025-02-19*
> *Source Agent: Single-Prompt Agent (ag...2a7)*
> *Template Version: 1.0*
