# Greenline 365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive, multi-tenant SaaS platform called "Greenline 365" for the home services industry. The platform's core is a "Property Passport," an address-centric ledger ("Carfax for Homes") that tracks a property's service history, incidents, and enhancements across different service providers.

## Tech Stack
- **Frontend:** Next.js 16, React 19, Tailwind CSS, Framer Motion
- **Backend:** Next.js API Routes (port 3000)
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Integrations:** Stripe (Subscriptions), SendGrid (Email & Inbound Parse), Nodemailer (Gmail SMTP), OpenAI (AI data extraction), Cheerio (Web Scraping), Sharp (Image Optimization)

## Core Requirements
1. **RBAC**: Four levels (Owner, Manager, Tech, Guest) with Supabase RLS
2. **Property Passport**: Address-first ledger tracking service history
3. **Filing Cabinet**: Secure document vault for financial data
4. **Global Directory**: Public business directory with tiered subscriptions ($299-$899/mo)
5. **AI Web Scraper**: Auto-populate directory from business websites
6. **Earned Badges**: Trust badges earned through feedback and verified services
7. **Email Campaign Engine**: Gmail-first outreach with SendGrid follow-ups
8. **Stripe Integration**: Monthly subscriptions and future $0.60 platform fee
9. **Image Optimization**: Auto-compress uploaded images via Sharp/WebP

## What's Been Implemented
- [x] Core Platform Foundation (RBAC, Property Passport, Filing Cabinet) 
- [x] Global Directory at `/directory` with 200 businesses
- [x] AI Web Scraper (100% success rate on batch of 200)
- [x] Email Campaign Pipeline (Gmail SMTP + SendGrid Inbound Parse)
- [x] Stripe Subscription Integration (test mode)
- [x] Image Optimization via Sharp (auto WebP conversion, 70-80% savings) - Dec 2025
- [x] .gitignore security fix (prevent secret commits) - Dec 2025

## Pending User Verification
- Email reply pipeline end-to-end test
- Stripe subscription flow end-to-end test

## P0 - Next Up
- Campaign Dashboard UI (`/admin-v2/campaigns`) with stats and action buttons

## P1 - Upcoming
- "Claim Listing" and Onboarding Flow (frontend + backend + Stripe payment)
- Stripe Connect for $0.60 platform fee
- Individual Listing Detail Pages (`/directory/[business-slug]`)

## P2 - Future
- Frontend for AI Scraper submission
- Earned Badges System (auto-award based on QR feedback + verified services)
- Convert one-off scripts to admin dashboard features

## Key DB Tables
- `directory_listings`: Business directory entries
- `crm_leads`: Lead tracking for email campaigns
- `payment_transactions`: Stripe payment records
- `properties`: Property passport records

## Critical Notes
- DO NOT SEND CAMPAIGN EMAILS without user permission
- Stripe is in TEST MODE
- Initial outreach via Gmail (jared.tucker13@gmail.com), replies via SendGrid Inbound Parse
- Test email recipient: jared.tucker13@gmail.com
- Platform owner user_id: 677b536d-6521-4ac8-a0a5-98278b35f4cc
