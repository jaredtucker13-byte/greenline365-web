# memory/ — Navigation Index
<!-- AGENT: This folder contains product specs and business logic. Read this INDEX first, then only open the specific file you need. Files marked SUPERSEDED should be ignored. -->

> **Last updated:** 2026-02-27

---

## Active Documents (Current)

| File | Summary | When to Read |
|------|---------|-------------|
| `OPERATIONAL_BIBLE_V2.md` | **Primary business rules.** Reputation system, badge mechanics, sales workflows, financial infrastructure. | When you need to understand HOW the product works as a business |
| `PRD.md` | Original product requirements. Completed phases (1, 2A-C), architecture, feature list. | When you need to understand WHAT was built and WHY |
| `PRICING_STACK.md` | Tier pricing logic: Free/$45/$89 for directory. $4.99/$9.99 consumer. $228/season leagues. Add-on marketplace. | When working on pricing, tiers, feature gates, or Stripe |
| `PROGRESS_REPORT.md` | January 2026 production readiness report. Scorecard format. | For historical reference — **superseded by `docs/reports/progress-report-2026-02-27.md`** |
| `SETUP_MILESTONE_AGREEMENT.md` | Milestone agreement between Jared and dev team. Deliverables and timelines. | When you need project management context |

## Spec Documents

| File | Summary | When to Read |
|------|---------|-------------|
| `AUDIT_SYSTEM_SPEC.md` | Audit log system spec: what events to track, schema, retention policy | When working on audit/logging features |
| `DYNAMIC_MEMORY_BUCKET_SYSTEM.md` | Second Brain memory bucket architecture: 4 bins, AI routing, status lifecycle | When working on the Brain/Second Brain feature |
| `GL365_CONCIERGE_TEMPLATES.md` | Chat concierge AI templates: personality, routing rules, escalation paths | When working on chat widget or AI concierge |
| `MARKETING_DASHBOARD_SPEC.md` | Marketing dashboard spec: KPIs, charts, data sources, refresh cycles | When working on analytics or marketing dashboards |
| `WEBSITE_AUDIT_REPORT.md` | Website audit findings: UX issues, performance, accessibility gaps | When doing UX or performance work |
| `THE_AI_GOLD_RUSH.md` | Strategic positioning doc: why AI-first local business tools win | Background reading — vision/strategy context |

## Superseded (Do Not Use)

| File | Superseded By | Notes |
|------|--------------|-------|
| `OPERATIONAL_BIBLE.md` | `OPERATIONAL_BIBLE_V2.md` | V1 is outdated. Always use V2. |
| `PROGRESS_REPORT.md` | `docs/reports/progress-report-2026-02-27.md` | Jan 2026 data — stale. Use latest report. |
