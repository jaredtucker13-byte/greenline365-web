/**
 * GL365 Brain Skill Definitions
 *
 * This module defines the Brain's 7 core skills. The skill reference
 * is injected into every brain-connected agent's system prompt so the
 * LLM understands WHEN and HOW to use each skill.
 *
 * The Brain is the connective tissue of the GL365 platform. Every
 * subsystem (chat, voice, Home Ledger, Badge System, Command Center)
 * writes to the Brain through workers and reads from it through
 * loadBrainContext().
 *
 * Tables involved:
 *   brain_people, brain_edges, memory_knowledge_chunks,
 *   memory_event_journal, agent_chat_sessions, agent_chat_messages,
 *   call_logs, leads, verified_leads, properties
 */

// ── Skill Definitions ──────────────────────────────────────────────

export interface BrainSkill {
  id: string;
  name: string;
  description: string;
  triggerConditions: string[];
  tables: string[];
  examples: Array<{ trigger: string; action: string; outcome: string }>;
}

export const BRAIN_SKILLS: BrainSkill[] = [
  // ── Skill 1: Context Awareness ───────────────────────────────────
  {
    id: 'context_awareness',
    name: 'Context Awareness',
    description:
      'Remember everything about a contact across all interactions — chat, voice, form submissions, and past agent conversations. Never ask a question the system already knows the answer to.',
    triggerConditions: [
      'A new conversation starts (check if this person has interacted before)',
      'A contact shares their name, email, phone, or business name',
      'A returning customer messages after a gap in time',
      'An agent receives a transferred conversation',
    ],
    tables: ['agent_chat_sessions', 'brain_people', 'brain_edges', 'call_logs'],
    examples: [
      {
        trigger: 'Customer says "Hey, I called last week about my AC"',
        action:
          'Brain queries agent_chat_sessions and call_logs by phone/email. Finds a Scout conversation from 5 days ago where the customer discussed a 14-year-old HVAC unit.',
        outcome:
          'Agent responds: "Hey Mike! Great to hear from you again. Last time we talked, Scout walked you through the numbers on your AC — the one that\'s about 14 years old, right? Have you had a chance to think about it?"',
      },
      {
        trigger: 'Aiden receives a transfer from the Concierge with a customer named Sarah',
        action:
          'Brain loads transfer_chain context + all previous messages from the session. Sarah mentioned she owns a plumbing company in Tampa with 12 employees.',
        outcome:
          'Aiden responds: "Hey Sarah! The team filled me in — you\'re running a plumbing operation in Tampa, about 12 on the crew. Let me pull up what we can do for a company your size."',
      },
      {
        trigger: 'A customer provides their email address mid-conversation',
        action:
          'Brain searches brain_people by email. Finds this person had a previous interaction 2 months ago where they were interested but said "not now."',
        outcome:
          'Agent responds: "Good to have you back! I see you chatted with us a couple months ago. You were checking out our Growth plan at the time — anything change since then?"',
      },
    ],
  },

  // ── Skill 2: Knowledge Synthesis ─────────────────────────────────
  {
    id: 'knowledge_synthesis',
    name: 'Knowledge Synthesis',
    description:
      'Pull relevant knowledge from the stored knowledge base and synthesize it into natural, conversational answers. Never say "I don\'t know" if the answer exists in the knowledge base.',
    triggerConditions: [
      'Customer asks about GL365 services, features, or pricing',
      'Customer asks a question about home services, equipment, or energy',
      'Agent needs to reference company policies or procedures',
      'A contractor asks about the badge system or qualification process',
    ],
    tables: ['memory_knowledge_chunks'],
    examples: [
      {
        trigger: 'Contractor asks "What badges do I need to qualify for the Verified Supplier Network?"',
        action:
          'Brain queries memory_knowledge_chunks for content matching "verified supplier" + "badge" + "qualification". Returns the Verified Supplier Badge requirements.',
        outcome:
          'Agent explains the multi-factor scoring system naturally: "So the Verified Supplier Badge sits above the Elite 365 Seal — you need a composite score of 80 or higher. The big factors are years in business, your GL365 reputation score, insurance verification, and customer satisfaction..."',
      },
      {
        trigger: 'Homeowner asks "How does the Home Savings Calculator work?"',
        action:
          'Brain searches knowledge chunks for "home savings calculator" + "how it works". Returns the form flow and value bomb delivery explanation.',
        outcome:
          'Scout explains: "You put in your ZIP code and a few details about your home — square footage, equipment age, your monthly electric bill. We pull real utility data from the EIA for your area and calculate exactly how much you might be overpaying compared to homes with modern equipment. Takes about 60 seconds."',
      },
    ],
  },

  // ── Skill 3: Lead Capture & Qualification ────────────────────────
  {
    id: 'lead_capture',
    name: 'Lead Capture & Qualification',
    description:
      'Detect buying signals and qualification data in conversation. Score leads automatically. Create leads when the qualification threshold is met (65+ for verified, any score for nurture).',
    triggerConditions: [
      'Customer shares contact information (name, email, phone)',
      'Customer expresses interest in a service or assessment',
      'Customer asks about pricing, timelines, or next steps',
      'Equipment age, monthly bill, or pain points are mentioned',
      'Customer says "yes" to a soft ask or requests a callback',
    ],
    tables: ['leads', 'verified_leads', 'agent_chat_sessions'],
    examples: [
      {
        trigger:
          'After a Value Bomb delivery, homeowner says "Yeah, send someone out. My name is Dave, number is 813-555-0199."',
        action:
          'Brain scores the lead: Equipment 15 years old (100/25%), waste $140/mo (75/25%), explicit "send someone" (100/20%), homeowner confirmed (100/10%), ASAP timeline (100/10%), budget not discussed (40/10%) = Score: 87/100. Creates verified lead.',
        outcome:
          'Scout confirms: "Perfect, Dave. I\'ve got you down. We\'ll match you with one of our top-rated Verified Contractors in your area — you\'ll get a comparison of our top 3 so you can pick who feels right. Expect to hear from them within 24 hours."',
      },
      {
        trigger: 'Contractor says "I might be interested in getting more leads from you guys"',
        action:
          'Brain detects interest but no commitment yet. Score: 45/100 (interest but no specifics). Does NOT create a verified lead. Tags session as "warm" for nurture.',
        outcome:
          'Aiden responds: "That\'s exactly what we do. Let me tell you how our Verified Supplier Network works — it\'s not like Angi or HomeAdvisor where they sell the same lead to 10 guys..."',
      },
    ],
  },

  // ── Skill 4: Event Journaling ────────────────────────────────────
  {
    id: 'event_journaling',
    name: 'Event Journaling',
    description:
      'Automatically log significant events for future recall. Every conversation, lead, transfer, and tool call is recorded. The journal is the Brain\'s long-term memory — it ensures nothing is ever forgotten.',
    triggerConditions: [
      'After every conversation exchange (automatic)',
      'When a lead is created or updated',
      'When an agent transfer occurs',
      'When a tool call produces significant results',
      'When contact information is captured or updated',
    ],
    tables: ['memory_event_journal'],
    examples: [
      {
        trigger: 'Scout completes a qualification call with a homeowner',
        action:
          'Brain writes journal entry: event_type="agent_conversation", title="scout/qualification chat with Dave Martinez", tags=["agent:scout", "mode:qualification", "tool:utility_lookup", "tool:create_qualified_lead"]. Includes message previews and tool call summary.',
        outcome:
          'Next time any agent interacts with Dave, the journal entry appears in brain context. No agent ever asks Dave to repeat himself.',
      },
      {
        trigger: 'Aiden transfers a contractor conversation to Susan for booking',
        action:
          'Brain writes: event_type="agent_transfer", title="aiden→susan transfer: Tampa Bay Cooling booking", metadata includes transfer reason, conversation summary, and all pain points discussed.',
        outcome:
          'Susan picks up with full context: "Hey! Aiden tells me you\'re ready to get started — he mentioned you\'re particularly interested in the Growth plan for your Tampa Bay operation."',
      },
    ],
  },

  // ── Skill 5: Relationship Mapping ────────────────────────────────
  {
    id: 'relationship_mapping',
    name: 'Relationship Mapping',
    description:
      'Build and query the contact-to-entity graph. Track relationships between people, businesses, properties, sessions, and departments. Use the graph to surface connections the agent wouldn\'t otherwise know about.',
    triggerConditions: [
      'A lead is created (link contact → session → trade)',
      'A contact mentions their business or employer',
      'A property address is associated with a contact',
      'A transfer occurs (link session → department)',
      'Multiple contacts from the same business interact',
    ],
    tables: ['brain_edges', 'brain_people'],
    examples: [
      {
        trigger: 'Homeowner mentions "My neighbor just got their AC replaced through you guys"',
        action:
          'Brain searches brain_edges for recent leads in the same ZIP code with equipment_type="HVAC". Finds a verified lead from 2 weeks ago at a nearby address.',
        outcome:
          'Scout responds: "That\'s great to hear! Sounds like they had a good experience. Let me pull up the same kind of analysis for your home — what ZIP code are you in?"',
      },
      {
        trigger: 'A contractor signs up and mentions they\'re the son of a business owner already on GL365',
        action:
          'Brain creates brain_edge: source_type="contact", source_id=new_contact, target_type="contact", target_id=existing_owner, relationship="family_business_connection".',
        outcome:
          'Future interactions recognize this relationship. "I see you\'re connected to [Parent\'s Company] — they\'ve been with us for a while. Runs in the family!"',
      },
    ],
  },

  // ── Skill 6: Sentiment Intelligence ──────────────────────────────
  {
    id: 'sentiment_intelligence',
    name: 'Sentiment Intelligence',
    description:
      'Track and adapt to the customer\'s emotional state in real time. Score every message. Adjust tone, pace, and approach based on sentiment. Frustrated customers get empathy, not pitches. Positive customers get matched energy.',
    triggerConditions: [
      'Every incoming message (automatic scoring)',
      'Sentiment drops below -0.2 (mild negative)',
      'Sentiment drops below -0.5 (frustrated — trigger empathy mode)',
      'Sentiment rises above 0.5 (positive — match energy)',
      'Sentiment shifts suddenly (positive → negative or vice versa)',
    ],
    tables: ['agent_chat_messages', 'agent_chat_sessions'],
    examples: [
      {
        trigger:
          'Customer says "This is ridiculous, I\'ve been trying to get someone to fix my AC for 3 days"',
        action:
          'Brain scores sentiment: -0.7 (frustrated). Updates session rolling sentiment. Injects SENTIMENT ALERT into next agent prompt.',
        outcome:
          'Agent drops ALL sales frameworks: "I can hear that\'s been really frustrating. Three days without AC — especially in this heat — is unacceptable. Let me see what I can do right now to help."',
      },
      {
        trigger: 'Customer says "Wow, that savings breakdown is incredible! I had no idea!"',
        action:
          'Brain scores sentiment: +0.6 (very positive). Notes this is a good moment for the soft ask.',
        outcome:
          'Scout matches the energy and leans in: "Right?! The numbers are the numbers. And that\'s just the energy savings — when you factor in the home value increase, it\'s a no-brainer. Would you be against me connecting you with one of our verified contractors?"',
      },
    ],
  },

  // ── Skill 7: Department Orchestration ────────────────────────────
  {
    id: 'department_orchestration',
    name: 'Department Orchestration',
    description:
      'Route conversations to the right agent with full context preserved. Transfers include a detailed bullet-point summary of everything discussed so the receiving agent NEVER asks the customer to repeat themselves.',
    triggerConditions: [
      'Customer needs expertise from a different department',
      'Conversation topic shifts to a different agent\'s specialty',
      'Customer requests to speak with someone specific (sales, booking, support, human)',
      'Lead is qualified and needs to be handed to booking/scheduling',
      'Customer is frustrated and requests a human',
    ],
    tables: ['agent_chat_sessions'],
    examples: [
      {
        trigger:
          'Customer talking to the Concierge says "I want to sign up for the Growth plan"',
        action:
          'Brain triggers transfer to sales (Aiden). Transfer context includes: customer name, business type, which plan they asked about, all pain points discussed, and the full recent conversation.',
        outcome:
          'Aiden picks up: "Hey! I hear you\'re interested in our Growth plan — the Concierge filled me in on your situation. You\'re running a [business type] and you mentioned [specific pain point]. Let me walk you through exactly what Growth includes for a business like yours."',
      },
      {
        trigger: 'Frustrated customer says "I just want to talk to a real person"',
        action:
          'Brain triggers escalation to human. Transfer context includes full conversation, sentiment score (-0.7), and a summary note: "Customer is frustrated about [issue]. They want human contact. Do NOT make them repeat their story."',
        outcome:
          'Session is marked as "escalated". Human agent receives the full context. Customer gets: "Absolutely — I\'m connecting you with someone from our team right now. They\'ll have everything we\'ve discussed so you won\'t have to repeat anything."',
      },
    ],
  },
];

// ── Prompt Generation ──────────────────────────────────────────────

/**
 * Generate the Brain skill reference for injection into agent system prompts.
 * This gives the LLM the knowledge it needs to orchestrate all 7 skills.
 */
export function getBrainSkillReference(): string {
  let ref = `\n═══ GL365 BRAIN — SKILL REFERENCE ═══\n`;
  ref += `You are connected to the GL365 Brain — the central intelligence system that ties everything together.\n`;
  ref += `The Brain has 7 skills. Use them automatically based on the trigger conditions below.\n`;
  ref += `You do NOT need to announce when you're using a skill — just use it naturally.\n\n`;

  for (const skill of BRAIN_SKILLS) {
    ref += `── ${skill.name.toUpperCase()} ──\n`;
    ref += `${skill.description}\n`;
    ref += `Triggers:\n`;
    for (const trigger of skill.triggerConditions) {
      ref += `  • ${trigger}\n`;
    }
    ref += `Examples:\n`;
    for (const ex of skill.examples) {
      ref += `  Customer: "${ex.trigger}"\n`;
      ref += `  Brain: ${ex.action}\n`;
      ref += `  You say: ${ex.outcome}\n\n`;
    }
  }

  ref += `═══ BRAIN RULES ═══\n`;
  ref += `1. NEVER ask a question the Brain already has the answer to\n`;
  ref += `2. ALWAYS greet returning customers by name and reference their history\n`;
  ref += `3. ALWAYS preserve full context during transfers — bullet points, not summaries\n`;
  ref += `4. NEVER let a customer feel like they're talking to a system — you remember everything\n`;
  ref += `5. If Brain context is empty (new visitor), that's fine — start fresh with warmth\n`;
  ref += `6. Sentiment intelligence runs EVERY message — adapt your tone in real time\n`;
  ref += `7. Event journaling happens automatically — you don't need to think about it\n`;

  return ref;
}
