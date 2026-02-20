# Voice Agent Research & Optimization Roadmap

> **Goal:** Build a production-ready, SaaS-scalable AI voice agent product by researching the full stack (Retell AI + Cal.com + Twilio + Supabase), testing three agent architectures (A/B/C), and selecting the best performer for full deployment.
>
> ---
>
> ## Phase 1: Stack Research & Integration Guide
>
> ### 1.1 Retell AI - Voice Agent Platform
>
> **Source:** [docs.retellai.com](https://docs.retellai.com)
>
> #### Three Agent Types Available
>
> **Single Prompt Agent (Current - Agent A)**
> The current Grace agent uses this approach. One comprehensive prompt handles all behaviors. Retell docs recommend this for agents with fewer than 5 functions and prompts under 1000 words. Our current agent has 10 functions and a substantial prompt, meaning we are pushing the limits of this architecture. Key risk areas from the docs: behavioral drift in edge cases, unreliable function calling with many tools, and context confusion in long conversations.
>
> **Conversation Flow Agent (Planned - Agent B)**
> Uses a node-based visual editor with multiple node types: Conversation nodes (dialogue), Function nodes (API calls), Logic nodes (branching), and End nodes (call termination). Each node has its own focused instruction, and edges define transition conditions. Key advantages from the docs: predictable behavior since each node has a clear purpose, easier debugging since issues isolate to specific nodes, different LLM models per node (use cheaper models for simple routing, premium for complex interactions), and fine-tuning examples on individual nodes. This is the "multi-flow" or "conversational" agent type.
>
> **Multi-Prompt Agent (Alternative consideration)**
> Organizes conversations into a structured tree of states. Each state has a focused prompt, state-specific functions (only relevant tools available), transition logic, and context preservation between states. The Retell docs specifically call out a Lead Qualification example: State 1 gathers info (no booking functions), State 2 handles scheduling (booking functions enabled, context from State 1 available). This maps perfectly to our booking flow.
>
> #### Retell Speech & Performance Settings to Test
>
> Responsiveness (current: 1/fast) - Test 0.7-0.8 for more natural pacing. Too fast can feel robotic or cut off slower speakers.
>
> Interruption Sensitivity (current: 0.8) - Test lower values (0.5-0.6) to see if reducing interruptions improves call completion rates.
>
> Backchanneling (current: off) - Retell docs describe this as affirmations like "yeah" and "uh-huh." Test enabling this for warmer, more natural conversations.
>
> Background Sound (current: none) - Test "office" ambiance for professional feel. May increase trust with callers.
>
> Transcription Mode - Currently "Optimize for accuracy" which adds latency. Test "Optimize for speed" with boosted keywords specific to each client's industry.
>
> Boosted Keywords - Completely unused. For every client deployment, populate with: company name, staff names, service names, industry jargon, location names.
>
> #### Retell Function Optimization
>
> Current check_availability timeout is 60000ms (60s). Most API calls should complete in 2-5s. Consider reducing to 15000ms and implementing proper error handling in the "Speak During Execution" messages.
>
> The "Speak During Execution" messages are a critical UX pattern. Current messages are good but can be enhanced with variability (multiple options rotated) to feel less scripted.
>
> store_memory runs silently (Speak During/After both off) which is correct - background operations should not interrupt the conversation.
>
> #### Retell Differentiator Features to Leverage
>
> Simulation Testing - Retell offers automated testing with simulated conversations. Build a test suite of common scenarios for each client vertical.
>
> Post-Call Analysis - Expand beyond summary/success/sentiment. Add: lead_score, services_discussed, objections_raised, follow_up_needed, appointment_booked (boolean), caller_type (new/returning).
>
> Custom Telephony via Twilio - SIP trunking integration allows using Twilio numbers with Retell agents. This gives access to Twilio's ecosystem (SMS, number management, call recording, compliance tools).
>
> ---
>
> ### 1.2 Cal.com - Calendar & Booking Engine
>
> **Source:** [cal.com/docs](https://cal.com/docs)
>
> #### Why Cal.com Over Custom Booking
>
> Cal.com provides a production-grade scheduling API (v2) with OAuth authentication, team scheduling, round-robin assignment, and timezone handling built in. Rather than building custom availability logic, Cal.com handles the complexity of multi-calendar sync (Google Calendar, Outlook, Apple), buffer times, minimum notice periods, and working hours.
>
> #### Key API Endpoints for Voice Agent Integration
>
> **Slots/Availability** - `GET /v2/slots/available` returns available time slots for a given event type and date range. This replaces our custom check_availability function with a battle-tested scheduling engine.
>
> **Create Booking** - `POST /v2/bookings` creates a booking with attendee info, selected time, and metadata. Returns confirmation details including unique booking ID.
>
> **Get Bookings** - `GET /v2/bookings` retrieves bookings with filters. Replaces our custom lookup_booking function.
>
> **Reschedule/Cancel** - Built-in reschedule and cancellation flows with automated notifications.
>
> **Webhooks** - Cal.com fires webhooks on booking_created, booking_rescheduled, booking_cancelled, meeting_started, meeting_ended. These can trigger post-booking workflows.
>
> #### Cal.com Integration Architecture
>
> Voice Agent (Retell) -> Our API (Next.js/Supabase Edge Functions) -> Cal.com API v2
>
> The voice agent's check_availability function calls our API, which queries Cal.com's slots endpoint. The create_booking function passes through to Cal.com's booking creation. Cal.com handles calendar sync, conflict detection, timezone conversion, and sends confirmation emails automatically.
>
> #### Cal.com SaaS Multi-Tenancy
>
> For SaaS, each client gets their own Cal.com event type (or team). The API key scoping allows us to manage multiple clients' calendars from a single integration. Cal.com's "managed users" feature on their platform plan could allow fully white-labeled booking for each client.
>
> ---
>
> ### 1.3 Twilio - Telephony & Phone Numbers
>
> **Source:** [twilio.com/docs](https://www.twilio.com/docs) + [Retell Custom Telephony Docs](https://docs.retellai.com/deploy/custom-telephony)
>
> #### Integration Method
>
> Retell supports Twilio via Elastic SIP Trunking (recommended). Setup involves creating a SIP trunk in Twilio, configuring origination/termination URIs pointing to `sip:sip.retellai.com`, and importing the Twilio number into Retell.
>
> #### Why Twilio for Production
>
> Number provisioning at scale - API-driven phone number purchasing for new clients. Local numbers in any area code build trust.
>
> Compliance - A2P 10DLC registration for SMS, STIR/SHAKEN for call authentication, HIPAA-eligible for healthcare clients.
>
> SMS capability - Send booking confirmations, reminders, and follow-ups via SMS from the same number the AI calls from.
>
> Call recording - Twilio can record calls independently for quality assurance and compliance, complementing Retell's built-in recording.
>
> Number porting - Clients can port their existing business number to Twilio, maintaining caller recognition.
>
> #### Twilio + Retell SaaS Architecture
>
> Each client gets a dedicated Twilio phone number. The SIP trunk routes inbound calls to Retell, which selects the correct agent based on the phone number. Outbound calls go through Retell's API, which routes through Twilio's SIP trunk to reach the PSTN.
>
> ---
>
> ### 1.4 Supabase - Database, Auth & Edge Functions
>
> **Source:** [supabase.com/docs](https://supabase.com/docs)
>
> #### Current Usage
>
> The greenline365-web app already uses Supabase for database (PostgreSQL), authentication, and edge functions (schedule-blast, local-trends, lead-alerts).
>
> #### Agent C: Supabase-Powered Knowledge Agent
>
> The third test agent will use Supabase as its knowledge source. Instead of hardcoding business info in the prompt or relying solely on API functions, the agent queries Supabase in real-time for client configuration, services, pricing, FAQs, and conversation scripts.
>
> **Architecture:**
> - Supabase tables: `client_config`, `services`, `faqs`, `booking_rules`, `conversation_scripts`
> - - Supabase Edge Functions serve as the MCP endpoint for Retell
>   - - Edge functions query the database and return formatted responses
>     - - Changes to the database instantly update agent behavior without redeploying
>      
>       - **Why This Matters for SaaS:**
>       - - Client onboarding becomes a database insert, not an agent rebuild
>         - - Non-technical staff can update agent behavior through a dashboard
>           - - A/B testing different scripts/responses by toggling database flags
>             - - Per-client customization without per-client code
>              
>               - #### Supabase Edge Functions as MCP Handler
>              
>               - ```
>                 Retell Agent -> POST https://your-project.supabase.co/functions/v1/retell-mcp
>                   -> Edge Function reads function_name from request
>                   -> Routes to appropriate handler (check_availability, create_booking, etc.)
>                   -> Handler queries Supabase DB for client config + Cal.com API for availability
>                   -> Returns formatted response to Retell
>                 ```
>
> #### Supabase Real-Time for Live Dashboard
>
> Supabase Realtime can push live call events to a client dashboard, showing active calls, recent bookings, and agent performance metrics in real-time without polling.
>
> ---
>
> ## Phase 2: Three-Agent A/B/C Test Plan
>
> ### Agent A: Single-Prompt Agent (Current)
>
> The existing Grace agent with 10 functions and one comprehensive prompt. This is the baseline.
>
> **Test Focus:** Identify failure modes. Where does the single prompt break? Does it handle edge cases? How well does it maintain context in long calls?
>
> ### Agent B: Conversation Flow Agent (Node-Based)
>
> Build a new agent using Retell's Conversation Flow editor with nodes.
>
> **Proposed Node Structure:**
>
> ```
> [Start/Greeting] -> [Identify Intent]
>     |-> [Booking Flow]
>     |     |-> [Check Availability] -> [Collect Info] -> [Confirm Booking]
>     |-> [Inquiry Flow]
>     |     |-> [Services Info] -> [Business Hours] -> [Transfer or Book]
>     |-> [Existing Booking]
>     |     |-> [Lookup Booking] -> [Reschedule/Cancel/Confirm]
>     |-> [Transfer to Human]
>     |-> [End Call]
> ```
>
> **Key Advantages to Test:**
> - Each node uses only the functions it needs (reduces confusion)
> - - Different LLM models per node (cheaper model for greeting, premium for booking)
>   - - Fine-tuning examples on each node for better accuracy
>     - - Predictable transitions between conversation phases
>      
>       - ### Agent C: Supabase-Powered Knowledge Agent
>      
>       - Build a single-prompt agent that gets all its knowledge from Supabase queries.
>      
>       - **Architecture:**
> - Minimal system prompt (just personality and flow rules)
> - - All business data comes from Supabase queries at call start
>   - - get_client_config function loads everything at conversation start
>     - - Conversation scripts stored in database and injected dynamically
>      
>       - **Key Advantages to Test:**
>       - - Zero-code client onboarding (just update database rows)
>         - - Dashboard-editable agent behavior
>           - - Instant updates without republishing the agent
>             - - Centralized data source of truth
>              
>               - ### Testing Criteria
>              
>               - | Metric | How to Measure |
>               - |--------|---------------|
>               - | **Booking Completion Rate** | % of calls where caller successfully books |
> | **Call Duration** | Average time to complete a booking |
> | **Function Call Accuracy** | % of function calls made correctly (right function, right params) |
> | **Edge Case Handling** | Score 1-5 on handling: off-topic questions, angry callers, ambiguous requests |
> | **Latency / Responsiveness** | Average response time perceived by caller |
> | **Context Retention** | Does agent remember earlier info later in the call? |
> | **Natural Conversation Flow** | Score 1-5 on how human-like the conversation feels |
> | **Transfer Success** | % of transfer requests handled correctly |
> | **Error Recovery** | How gracefully does agent handle API failures? |
> | **Post-Call Data Quality** | Completeness and accuracy of extracted data |
>
> ### Test Protocol
>
> 1. Create 10 test scenarios covering: simple booking, complex booking (multiple services), returning customer, cancellation, rescheduling, service inquiry, after-hours call, angry caller, off-topic questions, edge cases.
> 2. 2. Run each scenario against all three agents using Retell's Simulation Testing.
>    3. 3. Score each agent on all metrics above.
>       4. 4. Record real test calls with team members role-playing as callers.
>          5. 5. Review post-call data extraction quality for each agent.
>             6. 6. Document findings with specific examples of where each agent excels or fails.
>               
>                7. ---
>               
>                8. ## Phase 3: Differentiators - Setting Our System Apart
>               
>                9. ### 3.1 Memory-Powered Personalization
>
> The get_memory/store_memory functions are already a differentiator. Enhance by storing richer data: caller preferences, past objections, preferred appointment times, service history, communication style notes. On repeat calls, the agent greets by name and references past interactions.
>
> ### 3.2 Intelligent Call Routing
>
> Use the transfer_to_human function with dynamic routing to route calls to the right department or person based on the caller's intent, not just a generic transfer. The transfer_number variable is already dynamic - populate it based on intent detected during the call.
>
> ### 3.3 Post-Call Automation Pipeline
>
> After every call, trigger a webhook that: sends booking confirmation via SMS (Twilio), creates/updates CRM record in Supabase, sends call summary to client via email or dashboard notification, triggers follow-up sequences for leads that did not book, updates caller memory for next interaction.
>
> ### 3.4 White-Label Client Dashboard
>
> Build a client-facing dashboard (leveraging the existing admin-v2 Tactical Command Center) that shows: live call activity, booking metrics, call recordings with transcripts, AI-generated call summaries, sentiment trends, agent performance scores.
>
> ### 3.5 Industry-Specific Agent Templates
>
> Using the GL365 Concierge Templates as a foundation, create pre-built agent configurations for specific verticals: restaurants/hospitality, home services (roofing, HVAC, plumbing), healthcare/dental, auto repair, legal/professional services, real estate. Each template includes industry-specific system prompt, relevant functions, appropriate boosted keywords, and tailored post-call extraction.
>
> ### 3.6 Self-Optimizing Agent
>
> Use post-call data to automatically identify low-performing conversation patterns. Feed successful call transcripts back as fine-tuning examples. Track which "Speak During Execution" messages get the best caller reactions. A/B test greeting variations and measure booking conversion rates.
>
> ### 3.7 Conversational SMS Follow-Up
>
> After a call ends without a booking, automatically send a personalized SMS: "Hi [name], thanks for calling [business]. Would you like me to send you a link to book online? Reply YES and I'll text it right over." This catches leads that were interested but not ready to commit on the phone.
>
> ---
>
> ## Phase 4: Full Production Deployment
>
> After selecting the winning agent from A/B/C testing:
>
> ### 4.1 Phone Number Setup
> - Purchase Twilio number for the client (local area code)
> - - Configure SIP trunk to Retell
>   - - Import number into Retell dashboard
>     - - Test inbound and outbound calls
>      
>       - ### 4.2 Calendar Integration
>       - - Set up Cal.com event type for the client
>         - - Configure working hours, buffer times, and minimum notice
>           - - Connect to client's Google Calendar or Outlook
>             - - Test full booking flow end-to-end
>              
>               - ### 4.3 Webhook & Automation Setup
>               - - Configure Retell webhook to fire on call_ended
>                 - - Build webhook handler that processes call data
>                   - - Set up SMS confirmation flow via Twilio
>                     - - Configure CRM/Supabase data pipeline
>                       - - Set up client notification system
>                        
>                         - ### 4.4 Client Onboarding
>                         - - Populate all dynamic variables for the client
>                           - - Update API endpoints to point to client's configuration
>                             - - Configure post-call extraction for client's needs
>                               - - Add client-specific boosted keywords
>                                 - - Run 5 test calls with client listening
>                                   - - Client signs off on agent behavior
>                                    
>                                     - ### 4.5 Monitoring & Optimization
- Set up call quality alerts (failed calls, low sentiment)
- - Weekly review of post-call data for improvement opportunities
  - - Monthly optimization pass on prompts and settings
    - - Quarterly A/B tests on agent improvements
     
      - ---

      ## Reference: Key Documentation Links

      | Resource | URL |
      |----------|-----|
      | Retell AI Docs | https://docs.retellai.com |
      | Retell Conversation Flow | https://docs.retellai.com/build/conversation-flow/overview |
      | Retell Single/Multi Prompt | https://docs.retellai.com/build/single-multi-prompt/prompt-overview |
      | Retell Custom Telephony | https://docs.retellai.com/deploy/custom-telephony |
      | Cal.com API v2 | https://cal.com/docs/api-reference/v2/introduction |
      | Twilio SIP Trunking | https://www.twilio.com/docs/sip-trunking |
      | Supabase Edge Functions | https://supabase.com/docs/guides/functions |
      | Supabase Realtime | https://supabase.com/docs/guides/realtime |
      | GL365 Concierge Templates | /memory/GL365_CONCIERGE_TEMPLATES.md |
      | GL365 PRD | /memory/PRD.md |
      | Agent Base Template | /docs/retell-ai-agent-base-template.md |

      ---

      *Created: 2025-02-19*
      *Status: Research & Planning Phase*
      *Next Action: Build Agent B (Conversation Flow) and Agent C (Supabase-Powered)*
