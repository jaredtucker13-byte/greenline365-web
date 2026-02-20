/**
 * GL365 Agent Template Index
 *
 * Exports all three template configs for use in onboarding and deployment.
 * Template A: Solo Agent + Single Calendar ("The Answering Machine That Books")
 * Template B: Multi-Resource Agent + Multi-Calendar ("The Full Command Center")
 * Template C: Agent + External CRM Integration ("The Bridge Builder")
 */

export { generateTemplateAPrompt, TEMPLATE_A_FUNCTIONS, TEMPLATE_A_RETELL_CONFIG, TEMPLATE_A_BOOSTED_KEYWORDS } from './template-a-solo';
export type { TemplateAVariables } from './template-a-solo';

export { generateTemplateBPrompt, TEMPLATE_B_FUNCTIONS, TEMPLATE_B_EMERGENCY_KEYWORDS, TEMPLATE_B_ROUTING_EXAMPLES } from './template-b-multi-resource';
export type { TemplateBVariables, StaffMember } from './template-b-multi-resource';

export { generateTemplateCPrompt, TEMPLATE_C_FUNCTIONS, SUPPORTED_CRMS } from './template-c-bridge';
export type { TemplateCVariables, CRMIntegration } from './template-c-bridge';

/**
 * Config type to template mapping.
 * Used by the onboard-client endpoint to determine which template to clone.
 */
export const CONFIG_TEMPLATES = {
  A: {
    name: 'GL365-Template-A',
    label: 'The Answering Machine That Books',
    description: 'Solo agent + single calendar. Best for 1-2 person businesses.',
    setup_fee: 2500,
    monthly_fee: 1500,
    includes: [
      '1 Retell AI voice agent',
      '1 Cal.com calendar',
      'GL365 lite CRM',
      'SMS confirmations',
      'Call logs & analytics',
      'Customer memory (returning caller recognition)',
    ],
  },
  B: {
    name: 'GL365-Template-B',
    label: 'The Full Command Center',
    description: 'Multi-resource agent + multi-calendar + GL365 CRM. Best for multi-staff businesses.',
    setup_fee: 3500,
    monthly_fee: 2000,
    includes: [
      '1 Retell AI voice agent with staff routing',
      'Multi-resource Cal.com calendars',
      'GL365 full CRM with Property Intelligence',
      'Pre-Greeting Edge Function (customer recognition)',
      'Emergency alert system',
      'Outbound SMS reminders',
      'Client dashboard',
      'Customer Relationship Score (CRS)',
    ],
  },
  C: {
    name: 'GL365-Template-C',
    label: 'The Bridge Builder',
    description: 'Agent + external CRM integration. Best for businesses with existing CRM.',
    setup_fee: 5500,
    monthly_fee: 3500,
    includes: [
      '1 Retell AI voice agent',
      'Cal.com or existing booking system',
      'Webhook bridge to existing CRM',
      'Custom MCP function mapping',
      'Call logs in GL365 admin',
      'n8n CRM sync workflows',
      'Bidirectional data sync',
    ],
  },
} as const;

export type ConfigType = keyof typeof CONFIG_TEMPLATES;

/**
 * Intake Blueprint JSON structure.
 * This is what gets collected during sales discovery and stored in Supabase.
 */
export interface IntakeBlueprint {
  client: {
    business_name: string;
    owner_name: string;
    industry: string;
    location: string;
    phone: string;
    email: string;
    website?: string;
  };
  configuration: {
    type: ConfigType;
    crm_integration: 'none' | 'gl365' | 'external';
    external_crm_name?: string;
  };
  team: {
    total_staff_needing_calendar: number;
    staff: Array<{
      name: string;
      role: string;
      services: string[];
      hours?: string;
      phone_direct?: string;
    }>;
  };
  services: Array<{
    name: string;
    duration_minutes: number;
    price?: string;
    requires_estimate: boolean;
    is_emergency: boolean;
  }>;
  calendar: {
    platform: 'calcom' | 'existing';
    calendars_needed: number;
    buffer_time_minutes: number;
    advance_booking_days: number;
  };
  agent: {
    voice: string;
    persona_name: string;
    brand_voice: string;
    emergency_keywords: string[];
    transfer_number: string;
    business_hours: string;
    after_hours_behavior: 'take_message' | 'book_callback' | 'emergency_only';
  };
  sms: {
    enabled: boolean;
    reminder_hours_before: number;
  };
  payment: {
    setup_fee: number;
    monthly_fee: number;
    contract_signed: boolean;
    payment_method: 'stripe' | 'invoice' | 'other';
  };
  goals: {
    primary_pain: string;
    success_metric_90_days: string;
    go_live_target_date?: string;
  };
}
