/**
 * Unified Email Agentic Engine (UEAE) — Type Definitions
 */

// ============ PIPELINE TYPES ============

export type PipelineMode = 'manual' | 'auto';

export type PhaseStatus = 'idle' | 'loading' | 'complete' | 'error';

export interface PipelineState {
  mode: PipelineMode;
  activePhase: number;
  phases: PhaseState[];
}

export interface PhaseState {
  id: number;
  name: string;
  status: PhaseStatus;
  collapsed: boolean;
}

// ============ PHASE 1: CONTEXT ============

export interface TenantOption {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export interface ContextRequest {
  tenantId: string;
  description: string;
}

export interface ContextItem {
  id: string;
  label: string;
  value: string;
  editable: boolean;
  category: 'profile' | 'history' | 'ledger' | 'maintenance';
}

export interface TenantContext {
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  items: ContextItem[];
  rawProfile: Record<string, unknown>;
  conversationHistory: ConversationEntry[];
  ledgerData: LedgerEntry[];
  maintenanceHistory: MaintenanceEntry[];
}

export interface ConversationEntry {
  id: string;
  date: string;
  channel: string;
  summary: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'charge' | 'payment' | 'credit';
}

export interface MaintenanceEntry {
  id: string;
  date: string;
  description: string;
  status: string;
  priority?: string;
}

// ============ PHASE 2: INTELLIGENCE ============

export interface ResearchRequest {
  topic: string;
  tenantContext: TenantContext;
}

export interface ResearchFindings {
  summary: string;
  keyPoints: string[];
  sources: string[];
  rawResponse: string;
  model: string;
  wasFallback: boolean;
}

export interface VisionRequest {
  imageUrls: string[];
  context: string;
}

export interface VisionReport {
  analysis: string;
  findings: string[];
  recommendations: string[];
  model: string;
  wasFallback: boolean;
}

// ============ PHASE 3: WRITER'S ROOM ============

export interface GenerateRequest {
  context: TenantContext;
  research: ResearchFindings | null;
  visionReport: VisionReport | null;
  description: string;
  contentSnippets: ContentSnippet[];
  blogContent: BlogContent | null;
}

export interface GenerateResponse {
  originalDraft: string;
  enhancedDraft: string;
  subjectLine: string;
  model: string;
  wasFallback: boolean;
  reviewNotes: string[];
}

// ============ PHASE 4: VISUAL STUDIO ============

export interface ImageGenerationRequest {
  prompt: string;
  emailContext: string;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: string;
}

// ============ PHASE 5: PREVIEW & ASSEMBLE ============

export interface ContentBlockToggles {
  aiBody: boolean;
  visionAddendum: boolean;
  generatedImage: boolean;
  qrCode: boolean;
}

export interface AssembledEmail {
  to: string;
  subject: string;
  htmlBody: string;
  contentBlocks: ContentBlockToggles;
  images: GeneratedImage[];
  qrCodeUrl: string | null;
}

// ============ PHASE 6: SEND & TRACK ============

export interface SendRequest {
  to: string;
  subject: string;
  htmlBody: string;
  images: string[];
  qrCode: string | null;
  trackEngagement: boolean;
}

export interface SendResponse {
  success: boolean;
  emailId?: string;
  error?: string;
}

export interface FeedbackEntry {
  emailId: string;
  rating: 'up' | 'down';
  tenantId: string;
  createdAt: string;
}

// ============ CONTENT AGGREGATOR ============

export interface ContentSnippet {
  id: string;
  content: string;
  source: 'slack' | 'blog' | 'manual' | 'stash';
  createdAt: string;
}

export interface BlogContent {
  url: string;
  title?: string;
  summary?: string;
  qrCodeUrl?: string;
}

export interface StashItem {
  id: string;
  content: string;
  label: string;
  createdAt: string;
}

// ============ AUTO-SEND PIPELINE ============

export interface AutoRule {
  id: string;
  name: string;
  trigger: string;
  templateId: string;
  templateName?: string;
  schedule: string;
  status: 'active' | 'paused' | 'disabled';
  humanWaitGate: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecutedAt?: string;
  executionCount: number;
}

export interface AutoRuleCreateRequest {
  name: string;
  trigger: string;
  templateId: string;
  schedule: string;
  humanWaitGate: boolean;
}

export interface ExecutionLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'success' | 'failed' | 'pending_approval';
  recipient: string;
  executedAt: string;
  error?: string;
}

// ============ OPENROUTER CLIENT ============

export type ModelId =
  | 'perplexity/sonar-pro'
  | 'google/gemini-2.0-flash-001'
  | 'anthropic/claude-sonnet-4'
  | 'openai/gpt-4o';

export interface ModelRoutingEntry {
  primary: ModelId;
  fallback: ModelId;
  task: string;
}

export interface OpenRouterResponse {
  content: string;
  model: string;
  wasFallback: boolean;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
}

export interface CostEntry {
  model: string;
  task: string;
  tokens: number;
  estimatedCost: number;
  timestamp: string;
}

// ============ TOAST / UI ============

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
