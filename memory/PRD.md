# GreenLine365 Business Operating System - PRD

## Original Problem Statement
Build a Business Operating System with the current primary focus on an **AI Website Builder** and **AI Receptionist/Booking System**. Key features include URL reverse-engineering, context-aware redesign, multi-section workflow, live code sandbox, and a "Living Blog".

## User Personas
- **Business Owners**: Need 24/7 AI receptionist to handle calls and bookings
- **Multi-tenant Clients**: Various businesses using GreenLine365's AI services
- **Internal Team**: Managing leads, content, and platform operations

## Core Requirements

### 1. AI Receptionist (Retell Integration)
- 24/7 call handling and appointment booking
- Multi-tenant support with dynamic variables
- Memory system for returning customers
- Human transfer during business hours
- Sales transfer to Aiden (NEPQ agent)

### 2. Booking/Calendar System
- Flexible time slots per tenant
- Service-based durations (10min, 30min, etc.)
- Real-time availability checking
- Confirmation numbers and SMS notifications

### 3. Email Verification (Double Opt-In)
- Verification code sent via SendGrid
- Code entry UI on waitlist page
- Auto-sync verified leads to CRM

### 4. CRM Dashboard
- View and manage all leads
- Filter by status, source
- Resend verification emails
- Update lead status

### 5. AI Website Builder
- URL crawler for reverse-engineering
- Project management system
- Multi-section workflow
- Live code sandbox (future)

---

## What's Been Implemented

### January 14, 2025

**Email Verification Flow (FIXED)**
- Added missing columns to `waitlist_submissions` table
- Migration: `025_add_verification_columns.sql`
- Code-only email template (removed magic link)
- CRM auto-sync on verification

**Calendar/Booking System (NEW)**
- Full calendar page at `/admin-v2/calendar`
- Month/Week/Day views
- Booking management UI
- Migration: `026_flexible_booking_system.sql`
- APIs: `/api/bookings`, `/api/services`

**Retell AI Agent Setup (IN PROGRESS)**
- Guided through Single Prompt Agent creation
- 8 custom functions configured
- Transfer setup documented

### Previous Sessions
- Magic Link authentication (Supabase)
- 3-use limit for Trend Hunter demo
- Unsubscribe system for compliance
- Project management for Website Builder
- CRM database schema

---

## Prioritized Backlog

### P0 - Critical (Blocking)
- [x] Fix email verification flow
- [x] Fix CRM lead sync
- [ ] Run migration 026 (user action)
- [ ] Complete Retell agent setup
- [ ] Test booking flow end-to-end

### P1 - High Priority
- [ ] Build CRM Dashboard frontend UI
- [ ] Extend double opt-in to all forms
- [ ] Create Aiden (sales agent)
- [ ] Add calendar widget to Command Center

### P2 - Medium Priority
- [ ] Google Calendar integration
- [ ] Comprehensive Website Builder test
- [ ] Live Code Sandbox implementation
- [ ] User-configurable default landing page

### P3 - Low Priority / Future
- [ ] Living Blog enhancements
- [ ] Website template marketplace
- [ ] Interactive chatbot in builder
- [ ] Fix pre-commit hook

---

## Technical Architecture

```
/app/webapp/
├── app/
│   ├── admin-v2/
│   │   ├── calendar/page.tsx          # Full booking calendar
│   │   ├── crm-dashboard/page.tsx     # CRM (needs UI)
│   │   └── website-analyzer/page.tsx  # AI Website Builder
│   ├── api/
│   │   ├── bookings/route.ts          # Booking CRUD
│   │   ├── services/route.ts          # Tenant services
│   │   ├── mcp/route.ts               # Retell MCP endpoint
│   │   ├── verify-code/route.ts       # Email verification
│   │   └── crm/leads/route.ts         # CRM API
│   └── waitlist/page.tsx              # Double opt-in flow
├── lib/
│   └── email/sendgrid-sender.ts       # Email templates
└── supabase/migrations/
    ├── 025_add_verification_columns.sql
    └── 026_flexible_booking_system.sql
```

## Database Schema

### Key Tables
- `tenants` - Multi-tenant business configs
- `bookings` - Appointments
- `tenant_services` - Per-tenant services
- `tenant_availability` - Business hours
- `waitlist_submissions` - Leads with verification
- `crm_leads` - CRM lead management
- `agent_memory` - Customer history for AI

## 3rd Party Integrations
- **Supabase**: DB, Auth, Storage
- **Retell AI**: Voice agent, call handling
- **SendGrid**: Transactional emails
- **OpenRouter**: Vision/text models
- **KIE.ai**: Nano Banana image generation

## Credentials Required
- `SENDGRID_API_KEY` - Email sending
- `SENDGRID_FROM_EMAIL` - greenline365help@gmail.com
- `RETELL_API_KEY` - Voice agent
- Supabase keys (configured)
