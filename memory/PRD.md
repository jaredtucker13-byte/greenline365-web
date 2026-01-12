# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketing OS for local businesses called "GreenLine365". The immediate focus is on:
1. Building an "AI Website Analyzer" tool that can analyze existing websites or generate designs from scratch
2. Securing the admin dashboard behind Supabase authentication
3. Using the analyzer to redesign the GreenLine365 landing page

## Core Features

### AI Website Analyzer (Premium Feature)
- **Two Modes:**
  - Analyze Existing: Screenshot/URL → AI Analysis → Mockup → Code
  - Build From Scratch: Description → Design → Mockup → Code
- **AI Models Used:**
  - Vision Analysis: Gemini 3 Pro, Gemini 2.0 Pro, GPT-4o
  - Mockup Generation: Nano Banana Pro
  - Code Generation: Claude Opus 4.5
- **Human-in-the-Loop:** Users review and approve designs before code generation

### Authentication System
- Supabase-based authentication
- Protected routes for `/admin-v2/*` and `/admin/*`
- Email/password and Google OAuth sign-in

## Tech Stack
- **Frontend:** Next.js 16.0.10 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase SSR (`@supabase/ssr`)
- **AI Integrations:** OpenRouter, Emergent LLM Key
- **Screenshot:** Playwright (Node.js)

## What's Been Implemented

### December 2025
- ✅ AI Website Analyzer UI at `/admin-v2/website-analyzer`
- ✅ URL screenshot capture using Playwright
- ✅ Multi-model vision analysis API
- ✅ Mockup generation API (Nano Banana)
- ✅ Supabase SSR authentication with middleware
- ✅ Login page with email/password and Google OAuth
- ✅ Auth callback route for OAuth flow

### January 2026
- ✅ Fixed authentication middleware (was causing login loop)
- ✅ Fixed "spawn E2BIG" error in image analysis
- ✅ Fixed Playwright browser installation
- ✅ Build passes on Vercel

## Pending Database Migration
- `012_design_proposals.sql` - Table for storing design proposals

## API Endpoints
- `POST /api/capture-screenshot` - Capture website screenshot from URL
- `POST /api/design-workflow/analyze` - Analyze screenshot or generate design spec
- `POST /api/design-workflow/generate-mockup` - Generate visual mockup
- `POST /api/design-workflow/generate-code` - Generate React/Tailwind code

## Known Issues
- Twilio A2P 10DLC Brand Registration blocked (external issue)
- Booking widget input text invisible
- Retell AI agent "Aiden" paused due to hallucinations

## Prioritized Backlog

### P0 (Critical)
- Run database migration `012_design_proposals.sql`
- Test full login flow end-to-end
- Test AI Website Analyzer with real inputs

### P1 (High)
- Implement landing page redesign using analyzer
- Add role-based access control for premium features

### P2 (Medium)
- Refactor large components (`website-analyzer/page.tsx`)
- Blog analytics dashboard
- Social media auto-sharing

### P3 (Future)
- Resume Retell AI agent development
- "God Mode" CMS for site administration
