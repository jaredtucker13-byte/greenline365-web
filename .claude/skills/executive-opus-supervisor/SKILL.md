---
name: executive-opus-supervisor
description: "Route Property Passport reports through a tri-stage AI pipeline with Opus 4.6 as the final reasoning gate"
version: 1.0.0
triggers:
  - "generate an impact report"
  - "run the Opus audit on this report"
  - "process incident through the intelligence stack"
  - "final sign-off on report"
inputs:
  - incident_id: string (UUID of the incident to process)
  - property_address: string (the keyed address)
  - stage: string (scout | draft | audit | full-pipeline)
outputs:
  - reasoning_log: json (full decision trace from field entry to Opus sign-off)
  - impact_report: json (final homeowner-facing report with analogies)
  - metadata: json (includes SIGNED_OFF_BY_OPUS status)
---

# Executive Opus Supervisor — Tri-Stage Intelligence Pipeline

## Purpose

The Executive Opus Supervisor skill implements a three-stage AI processing pipeline that transforms raw field technician data into legally verified, homeowner-ready Impact Reports. The pipeline uses task-appropriate models for each stage, with Claude Opus 4.6 serving as the mandatory final reasoning gate. No report reaches a homeowner or contractor without passing through Opus sign-off.

This skill is built entirely on the existing GreenLine365 native stack: Next.js API routes, Supabase database webhooks, and OpenRouter/Vercel AI Gateway for model routing.

## When to Use

- Processing a new incident through the full intelligence pipeline
- Re-auditing an existing report after corrections
- Generating homeowner-facing Impact Reports with urgency-driving analogies
- Any time a Property Passport document needs final quality assurance

## Architecture: The Intelligence Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE WEBHOOK TRIGGER                   │
│          INSERT on incidents → fires pipeline webhook          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 1: SCOUT (Data Acquisition)                           │
│  Model: gpt-4o-mini or gemini-2.0-flash (fast, cheap)        │
│                                                               │
│  • Parse raw field data (photos, notes, measurements)         │
│  • Classify incident type and severity                        │
│  • Extract structured data from unstructured input            │
│  • Enrich with property history from incidents table          │
│  Output: StructuredIncidentData                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 2: DRAFT (Synthesis)                                   │
│  Model: gpt-4o or claude-sonnet-4.5 (balanced)                │
│                                                               │
│  • Generate narrative report from structured data             │
│  • Create homeowner-facing impact analogies                   │
│  • Calculate financial impact estimates                       │
│  • Draft recommended actions and timeline                     │
│  Output: DraftImpactReport                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  STAGE 3: OPUS AUDIT (Truth of Source)                        │
│  Model: anthropic/claude-opus-4.6 (MANDATORY, no fallback)    │
│                                                               │
│  • Verify factual accuracy against raw field data             │
│  • Audit analogies for scientific correctness                 │
│  • Score homeowner impact clarity (1-10 scale)                │
│  • Check for sensitive/private data exposure                  │
│  • If score < 8: REJECT with specific corrections             │
│  • If score >= 8: APPROVE with SIGNED_OFF_BY_OPUS tag         │
│  Output: AuditedImpactReport + ReasoningLog                   │
└─────────────────────────────────────────────────────────────┘
```

## Existing Infrastructure (What Already Exists)

This skill builds on top of established patterns — do NOT reinvent these:

| Component | File | What It Does |
|-----------|------|-------------|
| Model Selector | `webapp/lib/chat/model-selector.ts` | Routes to models via OpenRouter based on task type |
| Incident API | `webapp/app/api/incidents/route.ts` | CRUD for incidents |
| AI Analysis | `webapp/app/api/incidents/analyze/route.ts` | Existing incident analysis endpoint |
| Report Generation | `webapp/app/api/incidents/generate-report/route.ts` | Report generation |
| PDF Generation | `webapp/app/api/incidents/generate-pdf/route.ts` | PDF rendering with SHA-256 hashing |
| Audit Logger | `webapp/lib/audit-logger.ts` | SOC2-compliant event logging |
| Signature Events | `020_liability_documentation.sql` | Immutable audit trail |
| Audit Triggers | `018_audit_logging.sql` | Auto-logging on 7+ tables |
| OpenRouter Config | `OPENROUTER_API_KEY` env var | Already used by 25+ API routes |

### Model Routing Already In Place

The codebase already routes to `anthropic/claude-opus-4.6` via OpenRouter for:
- Image analysis
- Website analysis
- Brain capture classification
- Weekly recap generation

This skill extends that routing into a formalized three-stage pipeline.

## Procedure

### 1. Set Up the Pipeline API Route

Create `/api/incidents/intelligence-pipeline/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import crypto from 'crypto';

const PipelineRequestSchema = z.object({
  incident_id: z.string().uuid(),
  stage: z.enum(['scout', 'draft', 'audit', 'full-pipeline']).default('full-pipeline'),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { incident_id, stage } = PipelineRequestSchema.parse(body);

  // Fetch incident with evidence (tenant-scoped)
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user.id)
    .single();

  const { data: incident } = await supabase
    .from('incidents')
    .select('*, evidence:incident_evidence(*)')
    .eq('id', incident_id)
    .eq('business_id', profile.business_id)
    .single();

  if (!incident) {
    return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
  }

  // Initialize reasoning log
  const reasoningLog = {
    pipeline_id: crypto.randomUUID(),
    incident_id,
    started_at: new Date().toISOString(),
    stages: [] as StageResult[],
    final_status: 'in_progress' as string,
  };

  let result;

  if (stage === 'full-pipeline' || stage === 'scout') {
    result = await executeStage1Scout(incident, reasoningLog);
    if (stage === 'scout') return NextResponse.json(result);
  }

  if (stage === 'full-pipeline' || stage === 'draft') {
    result = await executeStage2Draft(result ?? incident, reasoningLog);
    if (stage === 'draft') return NextResponse.json(result);
  }

  if (stage === 'full-pipeline' || stage === 'audit') {
    result = await executeStage3OpusAudit(result ?? incident, incident, reasoningLog);
  }

  // Store reasoning log
  await supabase.from('audit_logs').insert({
    user_id: user.id,
    action: 'intelligence_pipeline_completed',
    resource_type: 'incident',
    resource_id: incident_id,
    metadata: reasoningLog,
  });

  return NextResponse.json({
    report: result,
    reasoning_log: reasoningLog,
    signed_off: reasoningLog.final_status === 'SIGNED_OFF_BY_OPUS',
  });
}
```

### 2. Stage 1: Scout (Data Acquisition)

Uses a fast, cheap model to parse and structure raw field data:

```typescript
async function executeStage1Scout(
  incident: Incident,
  log: ReasoningLog
): Promise<StructuredIncidentData> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',  // Fast + cheap for structured extraction
      messages: [{
        role: 'system',
        content: `You are a field data parser for a property safety platform.
Extract structured data from the technician's notes and evidence.
Return JSON with: incident_type, severity (1-10), affected_systems[],
measurements{}, health_risks[], property_impact, estimated_cost_range.`
      }, {
        role: 'user',
        content: `Parse this incident:\n${JSON.stringify({
          notes: incident.description,
          type: incident.type,
          evidence_count: incident.evidence?.length ?? 0,
          property_address: incident.property_address,
        })}`
      }],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const structured = JSON.parse(data.choices[0].message.content);

  log.stages.push({
    stage: 'scout',
    model: 'openai/gpt-4o-mini',
    duration_ms: Date.now() - startTime,
    input_tokens: data.usage?.prompt_tokens,
    output_tokens: data.usage?.completion_tokens,
    result: 'success',
    reasoning: 'Structured extraction from raw field data',
  });

  return structured;
}
```

### 3. Stage 2: Draft (Synthesis)

Uses a balanced model to create the homeowner-facing narrative:

```typescript
async function executeStage2Draft(
  structuredData: StructuredIncidentData,
  log: ReasoningLog
): Promise<DraftImpactReport> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4.5',  // Balanced for creative + technical
      messages: [{
        role: 'system',
        content: `You are a property safety report writer for GreenLine365.
Transform structured incident data into a homeowner-facing Impact Report.

REQUIREMENTS:
- Convert technical findings into simple, high-impact analogies
- Include health impact comparisons (e.g., "equivalent to living near a highway")
- Include financial impact estimates (e.g., "reduces property value by $X-$Y")
- Include urgency timeline (e.g., "if left untreated for 6 months...")
- Tone: professional concern, not fear-mongering
- Structure: Executive Summary → Findings → Health Impact → Financial Impact → Recommended Actions → Timeline`
      }, {
        role: 'user',
        content: JSON.stringify(structuredData),
      }],
    }),
  });

  const data = await response.json();
  const draft = data.choices[0].message.content;

  log.stages.push({
    stage: 'draft',
    model: 'anthropic/claude-sonnet-4.5',
    duration_ms: Date.now() - startTime,
    input_tokens: data.usage?.prompt_tokens,
    output_tokens: data.usage?.completion_tokens,
    result: 'success',
    reasoning: 'Narrative synthesis with homeowner-facing analogies',
  });

  return { content: draft, structured_data: structuredData };
}
```

### 4. Stage 3: Opus Audit (Truth of Source)

Opus 4.6 is the **mandatory final gate**. No fallback model is allowed.

```typescript
async function executeStage3OpusAudit(
  draft: DraftImpactReport,
  originalIncident: Incident,
  log: ReasoningLog
): Promise<AuditedImpactReport> {
  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-opus-4.6',  // MANDATORY — no fallback
      messages: [{
        role: 'system',
        content: `You are the Executive Supervisor for GreenLine365 Property Passport reports.
You are the FINAL GATE before any report reaches a homeowner or contractor.

YOUR AUDIT CHECKLIST:
1. FACTUAL ACCURACY: Do all claims trace back to the raw field data? (Score 1-10)
2. ANALOGY QUALITY: Are analogies scientifically correct and impactful? (Score 1-10)
3. SENSITIVITY CHECK: Does the report expose private data (SSN, exact income, medical)? (Pass/Fail)
4. LEGAL SAFETY: Could any claim expose GreenLine365 to liability? (Pass/Fail)
5. CLARITY SCORE: Would a non-technical homeowner understand this? (Score 1-10)
6. URGENCY CALIBRATION: Is urgency appropriate to severity — not fear-mongering? (Score 1-10)

SCORING:
- Average all numeric scores → overall_score
- If overall_score < 8.0 OR any Pass/Fail = Fail: REJECT with specific corrections
- If overall_score >= 8.0 AND all Pass/Fail = Pass: APPROVE

RESPONSE FORMAT (JSON):
{
  "verdict": "APPROVED" | "REJECTED",
  "overall_score": number,
  "scores": { "factual_accuracy": n, "analogy_quality": n, "clarity": n, "urgency_calibration": n },
  "checks": { "sensitivity": "pass"|"fail", "legal_safety": "pass"|"fail" },
  "corrections": ["specific correction 1", ...],  // empty if approved
  "reasoning": "explanation of verdict",
  "revised_report": "..."  // only if corrections were needed and applied
}`
      }, {
        role: 'user',
        content: JSON.stringify({
          draft_report: draft.content,
          raw_field_data: {
            description: originalIncident.description,
            type: originalIncident.type,
            severity: originalIncident.severity,
            evidence_count: originalIncident.evidence?.length ?? 0,
          },
          structured_extraction: draft.structured_data,
        }),
      }],
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  const audit = JSON.parse(data.choices[0].message.content);

  const approved = audit.verdict === 'APPROVED';

  log.stages.push({
    stage: 'opus_audit',
    model: 'anthropic/claude-opus-4.6',
    duration_ms: Date.now() - startTime,
    input_tokens: data.usage?.prompt_tokens,
    output_tokens: data.usage?.completion_tokens,
    result: approved ? 'approved' : 'rejected',
    reasoning: audit.reasoning,
    scores: audit.scores,
    checks: audit.checks,
  });

  log.final_status = approved ? 'SIGNED_OFF_BY_OPUS' : 'REJECTED_BY_OPUS';
  log.completed_at = new Date().toISOString();

  return {
    report: approved ? (audit.revised_report || draft.content) : null,
    audit_result: audit,
    metadata: {
      SIGNED_OFF_BY_OPUS: approved,
      pipeline_id: log.pipeline_id,
      opus_score: audit.overall_score,
      opus_model: 'anthropic/claude-opus-4.6',
      audited_at: new Date().toISOString(),
    },
  };
}
```

### 5. Wire Up Supabase Database Webhook

Create a webhook trigger so the pipeline fires automatically on new incidents:

**Option A: Supabase Dashboard**
- Table: `incidents`
- Events: INSERT
- URL: `https://{your-vercel-domain}/api/incidents/intelligence-pipeline`
- HTTP Method: POST
- Headers: `Authorization: Bearer {webhook-secret}`

**Option B: SQL Migration**

```sql
-- Enable pg_net extension (required for webhooks)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create webhook trigger function
CREATE OR REPLACE FUNCTION notify_intelligence_pipeline()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.settings.vercel_url') || '/api/incidents/intelligence-pipeline',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.webhook_secret')
    ),
    body := jsonb_build_object(
      'incident_id', NEW.id,
      'stage', 'full-pipeline'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fire pipeline on new incidents
CREATE TRIGGER intelligence_pipeline_trigger
  AFTER INSERT ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION notify_intelligence_pipeline();
```

### 6. Rejection and Retry Loop

If Opus rejects a report, the pipeline can retry with corrections:

```typescript
async function runPipelineWithRetry(
  incident: Incident,
  maxRetries: number = 2
): Promise<AuditedImpactReport> {
  let attempt = 0;
  let corrections: string[] = [];

  while (attempt <= maxRetries) {
    const log = createReasoningLog(incident.id);

    const structured = await executeStage1Scout(incident, log);
    const draft = await executeStage2Draft(
      { ...structured, previous_corrections: corrections },
      log
    );
    const result = await executeStage3OpusAudit(draft, incident, log);

    if (result.metadata.SIGNED_OFF_BY_OPUS) {
      return result;  // Approved — pipeline complete
    }

    // Opus rejected — collect corrections for next attempt
    corrections = result.audit_result.corrections;
    attempt++;

    log.stages.push({
      stage: 'retry',
      reasoning: `Attempt ${attempt}: Opus rejected with ${corrections.length} corrections`,
    });
  }

  // Max retries exceeded — flag for human review
  throw new Error(`Pipeline failed after ${maxRetries} retries. Escalating to human review.`);
}
```

## Reasoning Log Schema

Every pipeline execution produces a complete reasoning log:

```typescript
interface ReasoningLog {
  pipeline_id: string;           // UUID
  incident_id: string;           // UUID
  started_at: string;            // ISO timestamp
  completed_at: string;          // ISO timestamp
  stages: StageResult[];
  final_status: 'SIGNED_OFF_BY_OPUS' | 'REJECTED_BY_OPUS' | 'in_progress' | 'error';
}

interface StageResult {
  stage: 'scout' | 'draft' | 'opus_audit' | 'retry';
  model: string;                 // e.g., 'anthropic/claude-opus-4.6'
  duration_ms: number;
  input_tokens?: number;
  output_tokens?: number;
  result: 'success' | 'approved' | 'rejected' | 'error';
  reasoning: string;             // Human-readable explanation of this stage's decision
  scores?: Record<string, number>;
  checks?: Record<string, string>;
}
```

This log is stored in the existing `audit_logs` table with `action: 'intelligence_pipeline_completed'` and the full log in the `metadata` JSONB column.

## Security Guardrails

- [ ] Pipeline API route requires authentication (`getUser()`)
- [ ] Incident queries scoped by `business_id` (multi-tenant isolation)
- [ ] Opus sensitivity check blocks PII exposure in reports
- [ ] `OPENROUTER_API_KEY` used server-side only
- [ ] Webhook endpoint validates secret token
- [ ] Reasoning logs stored in append-only audit trail
- [ ] No report dispatched without `SIGNED_OFF_BY_OPUS: true` metadata
- [ ] Retry loop has max attempts to prevent infinite cost

## Integration with Existing Skills

| Skill | Integration Point |
|-------|-------------------|
| **PDF Architect** | After Opus approval, generates the PDF with the approved report content |
| **Security Auditor** | Audits the pipeline route for tenant leaks |
| **Test Engineer** | E2E tests for pipeline: submit incident → verify reasoning log → verify PDF |
| **SaaS Biller** | Credit metering — each pipeline run consumes a "Property Passport" credit |

## Validation

- [ ] Stage 1 (Scout) correctly parses raw field data into structured format
- [ ] Stage 2 (Draft) produces readable, analogy-rich report
- [ ] Stage 3 (Opus) rejects reports that score below threshold
- [ ] Stage 3 (Opus) approves reports that meet all criteria
- [ ] Reasoning log captures every stage with timing and token usage
- [ ] `SIGNED_OFF_BY_OPUS` metadata tag present on approved reports
- [ ] Rejected reports include specific, actionable corrections
- [ ] Retry loop re-drafts with corrections and re-submits to Opus
- [ ] Supabase webhook fires pipeline on new incident INSERT
- [ ] Audit trail is immutable and queryable
