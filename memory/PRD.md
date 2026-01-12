# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a comprehensive marketing OS for local businesses called "GreenLine365".

## What's Been Implemented

### January 2026 - Session 7 (Auto-save & Cloud Storage)
- ✅ **Auto-save with localStorage**: Debounced (3s) auto-save to browser storage
- ✅ **Restore on page load**: Automatically restores unsaved drafts from last session
- ✅ **Unsaved changes warning**: Browser prompt before leaving with unsaved work
- ✅ **Visual indicators**: Shows "Saving...", "Unsaved", "Saved locally" status
- ✅ **Clear on save**: localStorage cleared after successful save to database
- ✅ **Cloud Image Upload**: Images uploaded to Supabase Storage
- ✅ **Upload Progress**: Visual progress bar during multi-image uploads
- ✅ **Cloud indicator**: Shows "Cloud" badge on uploaded images
- ✅ **Delete from cloud**: Removes images from storage when deleted from post
- ✅ API: `/api/upload` - POST (upload), DELETE (remove), GET (list)

### January 2026 - Session 6 (Security & Stress Testing Fixes)
- ✅ **CRITICAL: Double-Booking Prevention** - API now checks for existing bookings before inserting
- ✅ **CRITICAL: Race Condition Protection** - Returns 409 Conflict for duplicate slots
- ✅ **Input Validation** - Required fields (name, email), format validation, length limits
- ✅ **XSS Sanitization** - HTML entities escaped in all user inputs
- ✅ **Booked Slots API** - GET /api/bookings?slots=true returns unavailable times
- ✅ **Frontend Update** - BookingWidget now shows booked slots as unavailable
- ✅ Comprehensive stress testing with pytest (17 tests)

### January 2026 - Session 5 (Auto Image Generation Loop)
- ✅ **Auto Images Feature**: Single-click button to analyze blog and auto-generate ALL images
- ✅ **Image Analysis Loop**: AI analyzes blog content to identify image placement opportunities
- ✅ **Batch Image Generation**: Loops through each suggestion and generates images via Nano Banana
- ✅ **Progress Indicator**: Visual progress bar showing current/total images being generated
- ✅ **Status Messages**: Real-time feedback on which image is currently generating
- ✅ **Auto-Selection**: First generated image is auto-selected for each placement
- ✅ Uses `gemini-2.5-flash-image-preview` via emergentintegrations

### January 2026 - Session 4 (Drafts & Analytics)
- ✅ DraftsPanel overhaul with action menu (Edit, Publish, Delete, Duplicate)
- ✅ Draft click-to-edit functionality
- ✅ Status badges and timestamps
- ✅ Error handling with retry
- ✅ MiniAnalyticsWidget with metric toggle
- ✅ Full Analytics page with multi-metric dashboard
- ✅ Image performance analytics
- ✅ Trend sources breakdown
- ✅ Publish frequency chart
- ✅ Drafts-to-Publish pipeline
- ✅ Sidebar collapse button repositioned
- ✅ Nano Banana CTA for content without images

### January 2026 - Session 3 (UX Improvements)
- ✅ Fixed image generation model name
- ✅ Reorganized Blog Auto-Polish layout
- ✅ Added button click feedback
- ✅ Tags and Images moved to sidebar

### January 2026 - Session 2 (Copyright System)
- ✅ Copyright Tools component
- ✅ AI Content Disclaimer
- ✅ Copyright Guide page

### January 2026 - Session 1 (Auth & Fixes)
- ✅ Supabase SSR authentication
- ✅ Custom prompt input for AI suggestions

## Core Features

### Blog Auto-Polish
- Write/Preview modes
- AI Tools: Outline, Enhance, Headlines, Tags, Meta, Images, Style, Research, Copyright
- Right sidebar: SEO Score, Stats, Tags, Images, Tips, AI Disclaimer
- Style Library for saved themes

### Drafts Management (NEW)
- Click to edit
- Action menu: Edit, Publish, Delete, Duplicate
- Status badges (DRAFT/SCHEDULED/PUBLISHED)
- Last saved timestamps
- Error handling with retry
- Keyboard navigation (Enter to edit)
- Nano Banana image CTA

### Analytics Dashboard (NEW)
- Overview metrics: Impressions, Clicks, Engagement, Conversions
- Image Performance: CTR comparison, top colors, aesthetic score
- Trend Sources: Google Trends, Twitter, Reddit, Industry News
- Publish Frequency chart
- Drafts-to-Publish pipeline stats
- Date range and content type filters
- Export CSV/PDF

### Mini Analytics Widget (NEW)
- Compact metric display
- Toggle: Impressions → Clicks → Engagement → Top Posts
- Keyboard shortcuts: T (toggle), E (expand)
- Click to view full analytics

## API Endpoints

### Blog APIs
- `POST /api/blog/ai` - AI content generation
- `POST /api/blog/images` - Image generation (gemini-2.5-flash-image-preview)
- `POST /api/drafts` - CRUD for drafts

### Analytics APIs (Mock data currently)
- Future: Real analytics aggregation endpoints

## File Structure
```
/app/webapp/app/admin-v2/
├── analytics/page.tsx           # NEW: Full analytics dashboard
├── blog-polish/page.tsx         # Blog editor
├── components/
│   ├── DraftsPanel.tsx          # UPDATED: Action menu, click-to-edit
│   ├── MiniAnalyticsWidget.tsx  # NEW: Compact metric toggle
│   ├── CollapsibleSidebar.tsx   # UPDATED: Collapse button position
│   ├── CopyrightTools.tsx
│   └── AIContentDisclaimer.tsx
```

## Prioritized Backlog

### P0 (Critical)
- ⚠️ Database Migration Required: `012_design_proposals.sql` must be run in Supabase for AI Website Analyzer
- Test Auto Images feature end-to-end (requires login)

### P1 (High)
- Auto-save with localStorage backup
- "Unsaved changes" warning on navigate-away
- Real analytics data integration

### P2 (Medium)
- Image analytics depth (recognition tags, face detection)
- Keyboard shortcuts throughout app
- Schedule reports via email

### P3 (Future)
- Multi-author support
- Campaign tracking
- A/B testing for content
