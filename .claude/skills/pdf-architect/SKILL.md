---
name: pdf-architect
description: "Generate Clean Bill of Health PDF reports with property timeline, evidence assets, and tamper-proof integrity hashing"
version: 1.0.0
triggers:
  - "generate a Clean Bill of Health"
  - "create a property PDF report"
  - "build an incident PDF"
  - "generate Property Passport document"
inputs:
  - report_type: string (incident-report | clean-bill-of-health | liability-transfer)
  - property_address: string (the physical address keyed to the Property Passport)
  - incident_ids: string[] (UUIDs of incidents to include)
outputs:
  - pdf_buffer: Buffer (generated PDF document)
  - document_hash: string (SHA-256 integrity hash)
  - audit_record: json (entry in signature_events table)
---

# PDF Architect — Clean Bill of Health and Property Passport Reports

## Purpose

The PDF Architect skill encodes the exact logic for generating Property Passport documents — particularly the **Clean Bill of Health** certificate. This is the crown jewel of the GreenLine365 platform: when ALL stains (incidents) on a property address are cleared by verified contractors, a printable PDF certificate is generated that preserves property value during home sales. Every PDF must include a timeline, evidence assets, tamper-proof SHA-256 hashing, and a complete audit chain.

## When to Use

- Generating a Clean Bill of Health certificate (all stains cleared)
- Creating an individual incident report PDF
- Producing a liability transfer document (The Shield)
- Building any Property Passport document

## Existing Infrastructure Reference

| File | Purpose |
|------|---------|
| `webapp/app/api/incidents/generate-pdf/route.ts` | PDF generation endpoint (POST + GET) |
| `webapp/lib/pdf/IncidentReportPDF.tsx` | React PDF component (14-page template) |
| `webapp/app/api/incidents/route.ts` | Incident CRUD |
| `webapp/app/api/incidents/upload/route.ts` | Evidence photo uploads |
| `webapp/app/api/incidents/analyze/route.ts` | AI analysis of incidents |
| `webapp/app/api/incidents/generate-report/route.ts` | Report generation |
| `webapp/app/api/incidents/send-for-signature/route.ts` | Signature request (The Shield) |
| `webapp/app/api/incidents/sign/route.ts` | Public signature/refusal page |

### Core Library

- **`@react-pdf/renderer` v4.3.2** — PDF generation from React components
- **`sharp` v0.34.5** — Image processing for evidence photos
- **Node.js `crypto`** — SHA-256 document integrity hashing

### Database Tables

| Table | Purpose |
|-------|---------|
| `incidents` | Core incident records with status, severity, evidence |
| `signature_events` | Audit trail for all document lifecycle events |
| `profiles` | Tenant info for report branding |

## The Property Passport Document Model

### Document Types

| Type | Trigger | Content | Recipients |
|------|---------|---------|------------|
| **Incident Report** | Contractor documents a stain | Single incident with evidence, AI analysis, findings | Homeowner, contractor |
| **Liability Transfer** | Homeowner receives and signs/refuses | Incident report + signature block + legal notice | Homeowner (legally binding) |
| **Clean Bill of Health** | All stains on address resolved | Full timeline of all incidents + resolutions + certificate | Homeowner, real estate agents, buyers |

### The Stain → Shield → Clear Lifecycle in PDF

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   THE STAIN     │     │   THE SHIELD    │     │   THE CLEAR     │
│                 │     │                 │     │                 │
│ Incident Report │────▶│ Liability Doc   │────▶│ Resolution Cert │
│ (contractor     │     │ (signature or   │     │ (verified       │
│  documents)     │     │  refusal)       │     │  remediation)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                              All stains cleared?
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  CLEAN BILL OF  │
                                              │     HEALTH      │
                                              │ (full timeline  │
                                              │  certificate)   │
                                              └─────────────────┘
```

## Procedure

### 1. Generating an Incident Report PDF

Follow the pattern in `webapp/app/api/incidents/generate-pdf/route.ts`:

#### Step 1: Fetch Incident Data

```typescript
const { data: incident } = await supabase
  .from('incidents')
  .select(`
    *,
    evidence:incident_evidence(*),
    signatures:signature_events(*)
  `)
  .eq('id', incidentId)
  .eq('business_id', businessId)  // CRITICAL: tenant-scoped
  .single();
```

#### Step 2: Fetch Tenant Profile for Branding

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('business_name, logo_url, phone, email')
  .eq('id', user.id)
  .single();
```

#### Step 3: Render PDF with @react-pdf/renderer

```typescript
import { renderToBuffer } from '@react-pdf/renderer';
import { IncidentReportPDF } from '@/lib/pdf/IncidentReportPDF';

const pdfBuffer = await renderToBuffer(
  <IncidentReportPDF
    incident={incident}
    profile={profile}
    evidence={incident.evidence}
    signatures={incident.signatures}
  />
);
```

#### Step 4: Generate SHA-256 Document Hash

```typescript
import crypto from 'crypto';

const documentHash = crypto
  .createHash('sha256')
  .update(pdfBuffer)
  .digest('hex');
```

#### Step 5: Record in Audit Trail

```typescript
await supabase.from('signature_events').insert({
  incident_id: incidentId,
  event_type: 'pdf_generated',
  actor_id: user.id,
  metadata: {
    document_hash: documentHash,
    page_count: pageCount,
    generated_at: new Date().toISOString(),
    file_size_bytes: pdfBuffer.length,
  },
});
```

### 2. Generating a Clean Bill of Health

This is the premium document — produced only when ALL incidents on an address are resolved.

#### Step 1: Verify All Stains Are Cleared

```typescript
// Fetch ALL incidents for this property address
const { data: incidents } = await supabase
  .from('incidents')
  .select('id, status, resolution_verified, created_at, resolved_at, severity, type')
  .eq('property_address', propertyAddress)
  .eq('business_id', businessId);

// Check every incident is resolved and verified
const allCleared = incidents.every(
  i => i.status === 'resolved' && i.resolution_verified === true
);

if (!allCleared) {
  return NextResponse.json({
    error: 'Cannot generate Clean Bill of Health — unresolved incidents remain',
    unresolved: incidents.filter(i => i.status !== 'resolved'),
  }, { status: 400 });
}
```

#### Step 2: Build the Timeline

The Clean Bill of Health includes a chronological timeline of every incident and its resolution:

```typescript
interface TimelineEntry {
  date: string;
  type: 'stain_created' | 'shield_sent' | 'shield_signed' | 'shield_refused' | 'clear_verified';
  incident_id: string;
  severity: string;
  description: string;
  actor: string;
  evidence_count: number;
}

function buildTimeline(incidents: Incident[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  for (const incident of incidents) {
    // The Stain: incident creation
    entries.push({
      date: incident.created_at,
      type: 'stain_created',
      incident_id: incident.id,
      severity: incident.severity,
      description: `${incident.type} documented at property`,
      actor: incident.created_by_name,
      evidence_count: incident.evidence?.length ?? 0,
    });

    // The Shield: signature events
    for (const sig of incident.signatures ?? []) {
      if (sig.event_type === 'signature_requested') {
        entries.push({
          date: sig.created_at,
          type: 'shield_sent',
          incident_id: incident.id,
          severity: incident.severity,
          description: 'Incident report sent to homeowner for signature',
          actor: sig.actor_name,
          evidence_count: 0,
        });
      }
      if (sig.event_type === 'signed' || sig.event_type === 'refused') {
        entries.push({
          date: sig.created_at,
          type: sig.event_type === 'signed' ? 'shield_signed' : 'shield_refused',
          incident_id: incident.id,
          severity: incident.severity,
          description: sig.event_type === 'signed'
            ? 'Homeowner acknowledged incident'
            : 'Homeowner refused to acknowledge — liability transferred',
          actor: 'Homeowner',
          evidence_count: 0,
        });
      }
    }

    // The Clear: resolution verified
    if (incident.resolved_at) {
      entries.push({
        date: incident.resolved_at,
        type: 'clear_verified',
        incident_id: incident.id,
        severity: incident.severity,
        description: `${incident.type} remediated and verified by contractor`,
        actor: incident.resolved_by_name,
        evidence_count: incident.resolution_evidence?.length ?? 0,
      });
    }
  }

  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
```

#### Step 3: Extract Evidence Assets

```typescript
interface EvidenceAsset {
  incident_id: string;
  type: 'before' | 'after' | 'during';
  url: string;
  caption: string;
  ai_analysis: string | null;
  gps_data: { lat: number; lng: number } | null;
  captured_at: string;
  sha256_hash: string;
}

async function extractEvidenceAssets(incidents: Incident[]): Promise<EvidenceAsset[]> {
  const assets: EvidenceAsset[] = [];

  for (const incident of incidents) {
    for (const evidence of incident.evidence ?? []) {
      assets.push({
        incident_id: incident.id,
        type: evidence.evidence_type,
        url: evidence.file_url,
        caption: evidence.caption,
        ai_analysis: evidence.ai_analysis,
        gps_data: evidence.gps_data,
        captured_at: evidence.captured_at,
        sha256_hash: evidence.file_hash,
      });
    }
  }

  return assets;
}
```

#### Step 4: Render the Clean Bill of Health PDF

The PDF should contain these sections:

1. **Certificate Cover Page**
   - "Clean Bill of Health" title
   - Property address (prominently displayed)
   - Date of certification
   - Unique certificate ID (UUID)
   - QR code linking to verification URL

2. **Property Summary**
   - Total incidents documented and resolved
   - Date range (first stain to last clear)
   - All contractor names involved

3. **Timeline Section**
   - Chronological timeline of all events
   - Color-coded by event type (stain=red, shield=yellow, clear=green)
   - Each entry includes date, actor, and description

4. **Evidence Gallery**
   - Before/After photo pairs per incident
   - AI analysis summaries
   - GPS verification data

5. **Audit & Integrity Section**
   - SHA-256 hash of the document
   - Chain of custody for all evidence
   - Digital signature verification status
   - List of all signature events with timestamps

6. **Legal Footer**
   - Certificate validity statement
   - Verification instructions
   - Data retention policy notice

#### Step 5: Hash and Store

```typescript
const pdfBuffer = await renderToBuffer(<CleanBillOfHealthPDF {...props} />);

const documentHash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

// Store in Supabase Storage
const { data: upload } = await supabase.storage
  .from('documents')
  .upload(
    `property-passports/${propertyAddress}/${certificateId}.pdf`,
    pdfBuffer,
    { contentType: 'application/pdf' }
  );

// Record in audit trail
await supabase.from('signature_events').insert({
  incident_id: null,  // Certificate covers all incidents
  event_type: 'clean_bill_of_health_generated',
  actor_id: user.id,
  metadata: {
    property_address: propertyAddress,
    certificate_id: certificateId,
    document_hash: documentHash,
    incident_count: incidents.length,
    timeline_entries: timeline.length,
    evidence_assets: assets.length,
    generated_at: new Date().toISOString(),
  },
});
```

## Existing PDF Component Structure

The `IncidentReportPDF.tsx` component already has these pages:

| Page | Content |
|------|---------|
| Cover | Title, report ID, property address, generation date |
| Main Report | Parties involved, incident summary, severity |
| Evidence | Images with captions, AI analysis, GPS data, file info |
| Findings | Timeline, findings with severity badges, risk assessment, recommendations |
| Liability | Legal notice, customer response section, signature blocks |
| Audit | Document integrity (SHA-256), event log, appendix, data retention |

Severity color coding: low=green, medium=orange, high=red, critical=purple.

## Immutability Rules (Address-Centric Security)

These rules are **non-negotiable** for all PDF operations:

1. **Liability transfers are immutable** — a signed or refused document cannot be modified
2. **Evidence hashes are permanent** — SHA-256 hashes are recorded at upload and verified at PDF generation
3. **Audit trail is append-only** — `signature_events` entries are never updated or deleted
4. **Certificate IDs are globally unique** — UUIDs prevent enumeration
5. **Only verified contractors can clear stains** — no self-service remediation
6. **Document hashes are recorded** — every generated PDF's SHA-256 hash is stored for later verification

## Validation

- [ ] Incident Report PDF includes all evidence and AI analysis
- [ ] Clean Bill of Health only generates when ALL stains are cleared
- [ ] Timeline is chronologically correct and includes all events
- [ ] Before/After evidence pairs are correctly associated
- [ ] SHA-256 hash matches document content
- [ ] Audit trail records generation with full metadata
- [ ] PDF is readable and professionally formatted
- [ ] Signature blocks show correct status (signed/refused/pending)
- [ ] Property address is the primary identifier on all documents
- [ ] RLS prevents cross-tenant PDF generation
